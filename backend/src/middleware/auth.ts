import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';

// Extender el tipo Request de Express para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('🔐 Auth middleware - Token:', token ? 'Present' : 'Missing');

  if (!token) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Access token required'
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    console.log('✅ Token valid for user:', decoded.email);
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    return res.status(403).json({
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired token'
    });
  }
};