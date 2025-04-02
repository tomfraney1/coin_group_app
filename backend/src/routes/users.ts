import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

const router = express.Router();

// Development token check
const isDevelopmentToken = (token: string) => token === 'development-token';

// Middleware to check if user is admin
const isAdmin = (async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    if (decoded.role !== 'admin') {
      res.status(403).json({ message: 'Access denied. Admin only.' });
      return;
    }

    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}) as RequestHandler;

// Get all users (admin only)
router.get('/', isAdmin, (async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
}) as RequestHandler);

// Toggle user active status (admin only)
router.patch('/:userId/toggle-active', isAdmin, (async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ message: 'User status updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user status', error });
  }
}) as RequestHandler);

// Update user role (admin only)
router.patch('/:userId/role', isAdmin, (async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!['admin', 'user', 'manager'].includes(role)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.role = role;
    await user.save();

    res.json({ message: 'User role updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role', error });
  }
}) as RequestHandler);

// Delete user (admin only)
router.delete('/:userId', isAdmin, (async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
}) as RequestHandler);

export default router; 