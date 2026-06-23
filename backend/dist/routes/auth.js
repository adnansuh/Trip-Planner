"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-travel-key-123';
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ error: 'Please enter all fields (name, email, password).' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters long.' });
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await db_1.UserRepository.findByEmail(normalizedEmail);
        if (existingUser) {
            res.status(400).json({ error: 'An account with this email already exists.' });
            return;
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        // Create user
        const newUser = await db_1.UserRepository.createUser({
            name,
            email: normalizedEmail,
            passwordHash
        });
        // Create JWT
        const token = jsonwebtoken_1.default.sign({ id: newUser.id || newUser._id.toString(), email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: {
                id: newUser.id || newUser._id.toString(),
                name: newUser.name,
                email: newUser.email
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error. Failed to register user.' });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Please enter all fields (email, password).' });
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        const user = await db_1.UserRepository.findByEmail(normalizedEmail);
        if (!user) {
            res.status(400).json({ error: 'Invalid email or password.' });
            return;
        }
        // Validate password
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(400).json({ error: 'Invalid email or password.' });
            return;
        }
        // Create JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id || user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            token,
            user: {
                id: user.id || user._id.toString(),
                name: user.name,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error. Failed to log in.' });
    }
});
exports.default = router;
