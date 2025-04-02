"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        console.error('No token provided in request');
        res.status(401).json({ message: 'Authentication token required' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('Decoded token:', { userId: decoded.userId, role: decoded.role });
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        console.error('Token verification failed:', error);
        res.status(403).json({ message: 'Invalid token' });
    }
};
exports.authenticateToken = authenticateToken;
