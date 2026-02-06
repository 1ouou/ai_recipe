import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    (req as AuthRequest).user = user;
    next();
  });
};

export const optionalAuthenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return next(); // No token, proceed as guest
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      // Token exists but invalid/expired. 
      // We can either return 403 (strict) or proceed as guest (lenient).
      // For better UX in this "optional" context, let's proceed as guest but maybe log it.
      // Or we can just ignore it.
      console.warn('Optional auth token invalid:', err.message);
      return next(); 
    }
    (req as AuthRequest).user = user;
    next();
  });
};
