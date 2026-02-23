import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabase.js';

/** Extends Express Request with optional authenticated user. */
export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Optional auth — extracts user from JWT if present, passes through if not.
 * When Supabase is not configured, always passes through (guest mode).
 */
export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!supabase) return next();

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  const token = header.slice(7);
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      req.userId = data.user.id;
      req.userEmail = data.user.email;
    }
  } catch {
    // Invalid token — continue as guest
  }
  next();
}

/**
 * Required auth — rejects 401 if not authenticated.
 * Must be placed after optionalAuth in the middleware chain.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}
