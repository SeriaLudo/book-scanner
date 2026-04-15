import type {NextFunction, Request, Response} from 'express';
import {adminAuth} from '../firebaseAdmin.js';

function extractBearerToken(header?: string) {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({error: 'Missing or invalid Authorization header'});
  }

  try {
    const decoded = await adminAuth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed', error);
    return res.status(401).json({error: 'Invalid token'});
  }
}
