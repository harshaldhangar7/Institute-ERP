import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, JwtPayload } from '../types';

const prisma = new PrismaClient();

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'test') {
      return 'test-secret-key';
    }
    console.error('FATAL: JWT_SECRET environment variable is not set.');
    process.exit(1);
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Check if user is still active in the database
    prisma.user.findUnique({ where: { id: decoded.userId }, select: { isActive: true } })
      .then((user) => {
        if (!user || !user.isActive) {
          res.status(401).json({ success: false, error: 'Account is deactivated.' });
          return;
        }
        req.user = decoded;
        next();
      })
      .catch(() => {
        res.status(401).json({ success: false, error: 'Invalid or expired token.' });
      });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
}

export function roleGuard(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Access denied. Not authenticated.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Access denied. Insufficient permissions.' });
      return;
    }

    next();
  };
}
