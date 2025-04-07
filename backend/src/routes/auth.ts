import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Development token check
const isDevelopmentToken = (token: string) => token === 'development-token';

// Register new user
router.post('/register', (async (req: Request, res: Response) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Create new user
    const user = await User.create({
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

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error });
  }
}) as RequestHandler);

// Login user
router.post('/login', (async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('User not found:', email);
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    console.log('User found, comparing passwords');

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
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
      await User.update(user.id, { lastLogin: new Date() });
    }

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in', error });
  }
}) as RequestHandler);

// Get current user
router.get('/me', (async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error in /me route:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
}) as RequestHandler);

export default router; 