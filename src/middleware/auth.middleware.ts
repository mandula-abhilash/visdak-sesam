import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../utils/token';
import { createErrorResponse } from '../utils/response';

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

export const protect = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json(
        createErrorResponse(401, 'Authentication required')
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = TokenService.verifyToken(token, process.env.JWT_SECRET!);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json(
      createErrorResponse(401, 'Invalid or expired token')
    );
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json(
      createErrorResponse(403, 'Admin access required')
    );
  }
  next();
};