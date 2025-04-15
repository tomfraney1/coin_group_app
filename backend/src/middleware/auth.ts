import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Express Request type to include user
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

export const authenticateToken: RequestHandler = (req, res, next) => {
  console.log('Auth middleware - Request headers:', req.headers);
  
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader);
  
  // Handle both Bearer token and raw token
  const token = authHeader ? 
    (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader) : 
    null;
  console.log('Extracted token:', token ? 'Token present' : 'No token');

  if (!token) {
    console.error('No token provided in request');
    res.status(401).json({ message: 'Authentication token required' });
    return;
  }

  // Check for development token first
  if (token === 'development-token') {
    console.log('Development token detected, setting development user');
    req.user = {
      userId: 'development-user',
      role: 'admin'
    };
    next();
    return;
  }

  // Only attempt JWT verification if it's not a development token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    console.log('Decoded token:', { userId: decoded.userId, role: decoded.role });
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(403).json({ message: 'Invalid token' });
  }
}; 