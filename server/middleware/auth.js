import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function resolveJwtSecret() {
  const configured = process.env.JWT_SECRET;
  if (configured) return configured;

  const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  if (isProduction) {
    throw new Error(
      'JWT_SECRET environment variable is required in production. ' +
      'Set it in your Vercel project environment variables (see .env.example).'
    );
  }

  console.warn(
    '[Auth] WARNING: JWT_SECRET is not set. Using a random secret generated for this process only ' +
    '— existing admin sessions will not survive a server restart, and this warning will repeat every ' +
    'time you start the server. Set JWT_SECRET in your local .env for a stable value (see .env.example).'
  );
  return crypto.randomBytes(32).toString('hex');
}

export const JWT_SECRET = resolveJwtSecret();

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access Denied: Authentication token required.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session token. Please log in again.'
    });
  }
};
