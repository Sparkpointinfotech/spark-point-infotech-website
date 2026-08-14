import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getAdminPassword, setAdminPassword } from '../db.js';
import { authMiddleware, JWT_SECRET } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rate-limit.js';

const router = Router();

const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const loginAttempts = new Map(); // IP -> { count, lockUntil }

router.post(['/api/auth/login', '/auth/login'], loginLimiter, (req, res) => {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'client';
  const now = Date.now();

  const attempt = loginAttempts.get(clientIp) || { count: 0, lockUntil: 0 };
  if (attempt.lockUntil > now) {
    const minutesLeft = Math.ceil((attempt.lockUntil - now) / 60000);
    return res.status(429).json({
      success: false,
      error: `Too many failed login attempts. Please try again in ${minutesLeft} minute(s).`
    });
  }

  const body = req.body || {};
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '').trim();

  const currentPassword = getAdminPassword();
  const envPassword = String(process.env.ADMIN_PASSWORD || '').trim();

  const isUsernameValid = (username === String(adminUsername).trim().toLowerCase());
  const isPasswordValid = Boolean(
    password && (
      password === currentPassword ||
      (envPassword.length > 0 && password === envPassword)
    )
  );

  if (isUsernameValid && isPasswordValid) {
    loginAttempts.delete(clientIp);

    const token = jwt.sign(
      { username: adminUsername, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      expiresIn: '24h',
      user: { username: adminUsername }
    });
  }

  attempt.count += 1;
  if (attempt.count >= 5) {
    attempt.lockUntil = now + 15 * 60 * 1000;
  }
  loginAttempts.set(clientIp, attempt);

  return res.status(401).json({
    success: false,
    error: `Invalid admin username or password.`
  });
});

router.get(['/api/auth/verify', '/auth/verify'], authMiddleware, (req, res) => {
  res.json({ success: true, valid: true, user: req.user });
});

router.post(['/api/auth/change-password', '/auth/change-password'], authMiddleware, (req, res) => {
  const body = req.body || {};
  const currentInput = String(body.currentPassword || '').trim();
  const newPassword = String(body.newPassword || '').trim();

  const activePassword = getAdminPassword();

  if (currentInput !== activePassword) {
    return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
  }

  setAdminPassword(newPassword);
  res.json({ success: true, message: 'Admin password updated successfully!' });
});

export default router;
