import { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload;
    }
  }
}

export type RouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void; 