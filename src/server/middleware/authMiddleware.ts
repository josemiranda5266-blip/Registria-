import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database.js';
import { User, UserRole } from '../../types.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  userRole?: UserRole;
  token?: string;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token = req.cookies?.registria_session;

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (token) {
    try {
      const sessionData = await db.getSessionByToken(token);
      if (sessionData) {
        req.user = sessionData.user;
        req.userRole = sessionData.user.role;
        req.token = token;
      }
    } catch {
      // ignore invalid token errors
    }
  }

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Acceso no autorizado. Debe iniciar sesión.',
      },
    });
  }
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Debe iniciar sesión para realizar esta operación.',
        },
      });
    }

    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Permisos insuficientes. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}.`,
        },
      });
    }

    next();
  };
}
