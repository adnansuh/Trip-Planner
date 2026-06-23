"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const auth_1 = __importDefault(require("./routes/auth"));
const trips_1 = __importDefault(require("./routes/trips"));
const expenses_1 = __importDefault(require("./routes/expenses"));
const auth_2 = require("./middleware/auth");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Enable CORS
app.use((0, cors_1.default)({
    origin: '*', // For development, allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Body parser middleware
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/trips', auth_2.authenticateToken, trips_1.default);
app.use('/api/trips', auth_2.authenticateToken, expenses_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});
// Start Server
const startServer = async () => {
    await (0, db_1.connectDB)();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
};
startServer();
