"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripRepository = exports.UserRepository = exports.connectDB = exports.isMockDb = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.isMockDb = false;
const DB_FILE_PATH = path_1.default.join(__dirname, '../db.json');
// Initialize local JSON database if mock mode is active
const initLocalDb = () => {
    if (!fs_1.default.existsSync(DB_FILE_PATH)) {
        fs_1.default.writeFileSync(DB_FILE_PATH, JSON.stringify({ users: [], trips: [] }, null, 2));
    }
};
const readLocalDb = () => {
    initLocalDb();
    try {
        const data = fs_1.default.readFileSync(DB_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    }
    catch (err) {
        return { users: [], trips: [] };
    }
};
const writeLocalDb = (data) => {
    fs_1.default.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2));
};
const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.log('⚠️  No MONGODB_URI found in environment variables. Falling back to persistent local JSON file DB.');
        exports.isMockDb = true;
        initLocalDb();
        return;
    }
    try {
        await mongoose_1.default.connect(uri);
        console.log('✅ Connected to MongoDB via Mongoose.');
    }
    catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        console.log('⚠️  Connection failed. Falling back to persistent local JSON file DB.');
        exports.isMockDb = true;
        initLocalDb();
    }
};
exports.connectDB = connectDB;
// ==========================================
// User Repository
// ==========================================
const User_1 = require("./models/User");
exports.UserRepository = {
    async findByEmail(email) {
        if (exports.isMockDb) {
            const db = readLocalDb();
            return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
        }
        return User_1.UserModel.findOne({ email });
    },
    async findById(id) {
        if (exports.isMockDb) {
            const db = readLocalDb();
            return db.users.find(u => u.id === id) || null;
        }
        return User_1.UserModel.findById(id);
    },
    async createUser(userData) {
        if (exports.isMockDb) {
            const db = readLocalDb();
            const newUser = {
                id: Math.random().toString(36).substr(2, 9),
                ...userData,
                createdAt: new Date()
            };
            db.users.push(newUser);
            writeLocalDb(db);
            return newUser;
        }
        const user = new User_1.UserModel(userData);
        return user.save();
    }
};
// ==========================================
// Trip Repository
// ==========================================
const Trip_1 = require("./models/Trip");
exports.TripRepository = {
    async listTrips(ownerId) {
        if (exports.isMockDb) {
            const db = readLocalDb();
            return db.trips.filter(t => t.owner === ownerId);
        }
        return Trip_1.TripModel.find({ owner: ownerId }).sort({ createdAt: -1 });
    },
    async getTrip(id, ownerId) {
        if (exports.isMockDb) {
            const db = readLocalDb();
            const trip = db.trips.find(t => t.id === id && t.owner === ownerId);
            return trip || null;
        }
        return Trip_1.TripModel.findOne({ _id: id, owner: ownerId });
    },
    async createTrip(tripData) {
        if (exports.isMockDb) {
            const db = readLocalDb();
            const newTrip = {
                id: Math.random().toString(36).substr(2, 9),
                ...tripData,
                expenses: [],
                packingList: tripData.packingList || [],
                createdAt: new Date()
            };
            db.trips.push(newTrip);
            writeLocalDb(db);
            return newTrip;
        }
        const trip = new Trip_1.TripModel(tripData);
        return trip.save();
    },
    async updateTrip(id, ownerId, tripData) {
        if (exports.isMockDb) {
            const db = readLocalDb();
            const index = db.trips.findIndex(t => t.id === id && t.owner === ownerId);
            if (index === -1)
                return null;
            db.trips[index] = { ...db.trips[index], ...tripData };
            writeLocalDb(db);
            return db.trips[index];
        }
        return Trip_1.TripModel.findOneAndUpdate({ _id: id, owner: ownerId }, { $set: tripData }, { new: true });
    },
    async deleteTrip(id, ownerId) {
        if (exports.isMockDb) {
            const db = readLocalDb();
            const index = db.trips.findIndex(t => t.id === id && t.owner === ownerId);
            if (index === -1)
                return false;
            db.trips.splice(index, 1);
            writeLocalDb(db);
            return true;
        }
        const result = await Trip_1.TripModel.deleteOne({ _id: id, owner: ownerId });
        return result.deletedCount > 0;
    }
};
