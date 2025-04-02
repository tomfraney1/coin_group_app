"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = require("../models/User");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
// Development token check
const isDevelopmentToken = (token) => token === 'development-token';
// Middleware to check if user is admin
const isAdmin = ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
}));
// Get all users (admin only)
router.get('/', isAdmin, ((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield User_1.User.find().select('-password');
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
})));
// Toggle user active status (admin only)
router.patch('/:userId/toggle-active', isAdmin, ((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.User.findById(req.params.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        user.isActive = !user.isActive;
        yield user.save();
        res.json({ message: 'User status updated', user });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating user status', error });
    }
})));
// Update user role (admin only)
router.patch('/:userId/role', isAdmin, ((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { role } = req.body;
        if (!['admin', 'user', 'manager'].includes(role)) {
            res.status(400).json({ message: 'Invalid role' });
            return;
        }
        const user = yield User_1.User.findById(req.params.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        user.role = role;
        yield user.save();
        res.json({ message: 'User role updated', user });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating user role', error });
    }
})));
// Delete user (admin only)
router.delete('/:userId', isAdmin, ((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.User.findByIdAndDelete(req.params.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
})));
exports.default = router;
