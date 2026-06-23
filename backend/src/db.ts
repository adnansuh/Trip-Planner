import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export let isMockDb = false;

const DB_FILE_PATH = path.join(__dirname, '../db.json');

// Initialize local JSON database if mock mode is active
const initLocalDb = () => {
  if (!fs.existsSync(DB_FILE_PATH)) {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify({ users: [], trips: [] }, null, 2));
  }
};

const readLocalDb = (): { users: any[]; trips: any[] } => {
  initLocalDb();
  try {
    const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return { users: [], trips: [] };
  }
};

const writeLocalDb = (data: { users: any[]; trips: any[] }) => {
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2));
};

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('⚠️  No MONGODB_URI found in environment variables. Falling back to persistent local JSON file DB.');
    isMockDb = true;
    initLocalDb();
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB via Mongoose.');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    console.log('⚠️  Connection failed. Falling back to persistent local JSON file DB.');
    isMockDb = true;
    initLocalDb();
  }
};

// Type Definitions for Models
export interface IUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface IActivity {
  id: string;
  time: string;
  title: string;
  description: string;
  cost: number;
}

export interface IDayItinerary {
  day: number;
  theme: string;
  activities: IActivity[];
}

export interface IHotel {
  name: string;
  tier: 'Budget Friendly' | 'Mid Range' | 'Luxury';
  priceRange: string;
  description: string;
}

export interface IBudgetBreakdown {
  flights: number;
  accommodation: number;
  food: number;
  activities: number;
  total: number;
}

export interface IExpense {
  id: string;
  category: 'Flights' | 'Accommodation' | 'Food' | 'Activities' | 'Miscellaneous';
  amount: number;
  date: string;
  description: string;
}

export interface IPackingItem {
  id: string;
  name: string;
  category: string;
  packed: boolean;
}

export interface ITrip {
  id: string;
  owner: string;
  destination: string;
  durationDays: number;
  budgetType: 'Low' | 'Medium' | 'High';
  interests: string[];
  itinerary: IDayItinerary[];
  estimatedBudget: IBudgetBreakdown;
  hotelSuggestions: IHotel[];
  expenses: IExpense[];
  packingList: IPackingItem[];
  createdAt: Date;
}

// ==========================================
// User Repository
// ==========================================
import { UserModel } from './models/User';
export const UserRepository = {
  async findByEmail(email: string): Promise<any> {
    if (isMockDb) {
      const db = readLocalDb();
      return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
    return UserModel.findOne({ email });
  },

  async findById(id: string): Promise<any> {
    if (isMockDb) {
      const db = readLocalDb();
      return db.users.find(u => u.id === id) || null;
    }
    return UserModel.findById(id);
  },

  async createUser(userData: { name: string; email: string; passwordHash: string }): Promise<any> {
    if (isMockDb) {
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
    const user = new UserModel(userData);
    return user.save();
  }
};

// ==========================================
// Trip Repository
// ==========================================
import { TripModel } from './models/Trip';
export const TripRepository = {
  async listTrips(ownerId: string): Promise<any[]> {
    if (isMockDb) {
      const db = readLocalDb();
      return db.trips.filter(t => t.owner === ownerId);
    }
    return TripModel.find({ owner: ownerId }).sort({ createdAt: -1 });
  },

  async getTrip(id: string, ownerId: string): Promise<any> {
    if (isMockDb) {
      const db = readLocalDb();
      const trip = db.trips.find(t => t.id === id && t.owner === ownerId);
      return trip || null;
    }
    return TripModel.findOne({ _id: id, owner: ownerId });
  },

  async createTrip(tripData: Partial<ITrip> & { owner: string }): Promise<any> {
    if (isMockDb) {
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
    const trip = new TripModel(tripData);
    return trip.save();
  },

  async updateTrip(id: string, ownerId: string, tripData: Partial<ITrip>): Promise<any> {
    if (isMockDb) {
      const db = readLocalDb();
      const index = db.trips.findIndex(t => t.id === id && t.owner === ownerId);
      if (index === -1) return null;
      db.trips[index] = { ...db.trips[index], ...tripData };
      writeLocalDb(db);
      return db.trips[index];
    }
    return TripModel.findOneAndUpdate({ _id: id, owner: ownerId }, { $set: tripData }, { new: true });
  },

  async deleteTrip(id: string, ownerId: string): Promise<boolean> {
    if (isMockDb) {
      const db = readLocalDb();
      const index = db.trips.findIndex(t => t.id === id && t.owner === ownerId);
      if (index === -1) return false;
      db.trips.splice(index, 1);
      writeLocalDb(db);
      return true;
    }
    const result = await TripModel.deleteOne({ _id: id, owner: ownerId });
    return result.deletedCount > 0;
  }
};
