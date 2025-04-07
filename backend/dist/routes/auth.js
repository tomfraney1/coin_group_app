"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = express_1.default.Router();
// Development token check
const isDevelopmentToken = (token) => token === 'development-token';
// Register new user
router.post('/register', (async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        // Check if user already exists
        const existingUser = await User_1.User.findByEmail(email);
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        // Create new user
        const user = await User_1.User.create({
            username,
            email,
            password,
            role: role || 'user',
            isActive: true,
            lastLogin: new Date()
        });
        // Generate JWT token
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET environment variable is not set');
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Error creating user', error });
    }
}));
// Login user
router.post('/login', (async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);
        // Find user
        const user = await User_1.User.findByEmail(email);
        if (!user) {
            console.log('User not found:', email);
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        console.log('User found, comparing passwords');
        // Check password
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        console.log('Password comparison result:', isMatch);
        console.log('Stored hash:', user.password);
        console.log('Provided password:', password);
        if (!isMatch) {
            console.log('Password mismatch');
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        // Update last login
        if (user.id) {
            await User_1.User.update(user.id, { lastLogin: new Date() });
        }
        // Generate JWT token
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET environment variable is not set');
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in', error });
    }
}));
// Get current user
router.get('/me', (async (req, res) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }
        // Handle development token
        if (isDevelopmentToken(token)) {
            res.json({
                id: 'dev-user-id',
                username: 'Development Admin',
                email: 'dev@localhost',
                role: 'admin',
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User_1.User.findById(decoded.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    }
    catch (error) {
        console.error('Error in /me route:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
}));
exports.default = router;
