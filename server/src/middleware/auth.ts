import jwt from 'jsonwebtoken';
import type {NextFunction, Request, Response} from 'express';
import {ApiError} from '../lib/errors';
import type {AuthUser} from '../types';

const SECRET: string = process.env.JWT_SECRET ?? 'souqna-dev-secret-change-me';
const EXPIRES_IN = '7d';

export function signToken(user: AuthUser): string {
  return jwt.sign({sub: String(user.id), role: user.role}, SECRET, {expiresIn: EXPIRES_IN});
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

/** Require a valid JWT; attaches req.user. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    next(new ApiError(401, 'AUTH_REQUIRED', 'Authentication required'));
    return;
  }
  try {
    const payload = jwt.verify(token, SECRET) as {sub: string; role: AuthUser['role']};
    req.user = {id: Number(payload.sub), role: payload.role};
    next();
  } catch {
    next(new ApiError(401, 'AUTH_INVALID', 'Invalid or expired token'));
  }
}

/** Require an authenticated admin. Must run after requireAuth. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    next(new ApiError(403, 'FORBIDDEN', 'Admin access required'));
    return;
  }
  next();
}
