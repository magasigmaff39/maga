// Bearer-token authentication. `optionalAuth` populates req.user when a valid token is present,
// `requireAuth` rejects the request otherwise. Tokens travel only in the Authorization header.
import { resolveSession, toPublicUser } from '../services/auth.service.js';
import { unauthorized } from '../utils/errors.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    const user = token ? await resolveSession(token) : null;
    req.sessionToken = user ? token : null;
    req.user = user ? toPublicUser(user) : null;
    // Anonymous visitors may still use the chat: the frontend sends a stable guest id.
    const guest = req.headers['x-guest-id'];
    req.guestId = typeof guest === 'string' && /^[a-zA-Z0-9_-]{6,64}$/.test(guest) ? guest : null;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(unauthorized('Войдите в аккаунт, чтобы продолжить'));
  next();
}
