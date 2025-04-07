"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = require("../models/User");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Development token check
const isDevelopmentToken = (token) => token === 'development-token';
// Middleware to check if user is admin
const isAdmin = (async (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }
        // Handle development token
        if (isDevelopmentToken(token)) {
            req.user = { userId: 'development-user', role: 'admin' };
            next();
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        if (decoded.role !== 'admin') {
            res.status(403).json({ message: 'Access denied. Admin only.' });
            return;
        }
        req.user = { userId: decoded.userId, role: decoded.role };
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});
// Get current user
router.get('/me', auth_1.authenticateToken, (async (req, res) => {
    var _a;
    console.log('GET /me route hit');
    console.log('User from request:', req.user);
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            console.log('No user ID found in request');
            res.status(401).json({ message: 'User ID not found in request' });
            return;
        }
        console.log('Looking up user with ID:', req.user.userId);
        const user = await User_1.User.findById(parseInt(req.user.userId));
        if (!user) {
            console.log('User not found in database');
            res.status(404).json({ message: 'User not found' });
            return;
        }
        console.log('User found:', user);
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
    }
    catch (error) {
        console.error('Error in /me route:', error);
        res.status(500).json({ message: 'Error fetching user', error });
    }
}));
// Get all users (admin only)
router.get('/', isAdmin, (async (req, res) => {
    try {
        const users = await User_1.User.getAll();
        const usersWithoutPasswords = users.map((user) => {
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        res.json(usersWithoutPasswords);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
}));
// Toggle user active status (admin only)
router.patch('/:userId/toggle-active', isAdmin, (async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            res.status(400).json({ message: 'Invalid user ID' });
            return;
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const updatedUser = await User_1.User.update(userId, { isActive: !user.isActive });
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json({ message: 'User status updated', user: userWithoutPassword });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating user status', error });
    }
}));
// Update user role (admin only)
router.patch('/:userId/role', isAdmin, (async (req, res) => {
    try {
        const { role } = req.body;
        if (!['admin', 'user', 'manager'].includes(role)) {
            res.status(400).json({ message: 'Invalid role' });
            return;
        }
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            res.status(400).json({ message: 'Invalid user ID' });
            return;
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const updatedUser = await User_1.User.update(userId, { role });
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json({ message: 'User role updated', user: userWithoutPassword });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating user role', error });
    }
}));
// Delete user (admin only)
router.delete('/:userId', isAdmin, (async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            res.status(400).json({ message: 'Invalid user ID' });
            return;
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        await User_1.User.remove(userId);
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
}));
exports.default = router;
