import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { User, IUser } from '../models/User';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';

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
      (req as Express.Request).user = { userId: 'development-user', role: 'admin' };
      next();
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    if (decoded.role !== 'admin') {
      res.status(403).json({ message: 'Access denied. Admin only.' });
      return;
    }

    (req as Express.Request).user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}) as RequestHandler;

// Get current user
router.get('/me', authenticateToken, (async (req: Request, res: Response) => {
  console.log('GET /me route hit');
  console.log('User from request:', req.user);
  
  try {
    if (!req.user?.userId) {
      console.log('No user ID found in request');
      res.status(401).json({ message: 'User ID not found in request' });
      return;
    }

    console.log('Looking up user with ID:', req.user.userId);
    const user = await User.findById(parseInt(req.user.userId));
    
    if (!user) {
      console.log('User not found in database');
      res.status(404).json({ message: 'User not found' });
      return;
    }

    console.log('User found:', user);
    const { password: _, ...userWithoutPassword } = user as IUser;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error in /me route:', error);
    res.status(500).json({ message: 'Error fetching user', error });
  }
}) as RequestHandler);

// Get all users (admin only)
router.get('/', isAdmin, (async (req: Request, res: Response) => {
  try {
    const users = await User.getAll();
    const usersWithoutPasswords = users.map((user: IUser) => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json(usersWithoutPasswords);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
}) as RequestHandler);

// Toggle user active status (admin only)
router.patch('/:userId/toggle-active', isAdmin, (async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const updatedUser = await User.update(userId, { isActive: !user.isActive });
    const { password: _, ...userWithoutPassword } = updatedUser as IUser;
    res.json({ message: 'User status updated', user: userWithoutPassword });
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

    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const updatedUser = await User.update(userId, { role });
    const { password: _, ...userWithoutPassword } = updatedUser as IUser;
    res.json({ message: 'User role updated', user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role', error });
  }
}) as RequestHandler);

// Delete user (admin only)
router.delete('/:userId', isAdmin, (async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    await User.remove(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
}) as RequestHandler);

export default router; 