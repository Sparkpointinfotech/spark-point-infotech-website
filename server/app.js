import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { dbRun, dbAll, getAdminPassword, setAdminPassword } from './db.js';

const app = express();

// Security & Secret Configs
const JWT_SECRET = process.env.JWT_SECRET || 'spark-point-infotech-admin-secret-2026';
const adminUsername = process.env.ADMIN_USERNAME || 'admin';

// Rate Limiter for Login Attempts
const loginAttempts = new Map(); // IP -> { count, lockUntil }

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Normalize Body if Vercel passes raw string/buffer
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {}
  }
  next();
});

// Normalize Vercel Serverless Function paths so /auth/login and /api/auth/login both match
app.use((req, res, next) => {
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/assets')) {
    req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
  }
  next();
});

// Auth Middleware to protect sensitive admin endpoints
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (queryToken) {
    token = queryToken;
  }

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

// ------------------------------------------------------------------
// PUBLIC ENDPOINTS
// ------------------------------------------------------------------

// Health Check Endpoint
app.get(['/api/health', '/health'], async (req, res) => {
  try {
    const contactCount = await dbAll('SELECT COUNT(*) as count FROM contact_submissions');
    const talentCount = await dbAll('SELECT COUNT(*) as count FROM talent_submissions');
    res.json({
      status: 'ok',
      service: 'Spark Point Infotech API',
      database: process.env.DATABASE_URL ? 'PostgreSQL (Cloud)' : 'SQLite/Serverless',
      stats: {
        contactSubmissions: parseInt(contactCount[0]?.count || 0),
        talentSubmissions: parseInt(talentCount[0]?.count || 0)
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 1. Contact Form Submission (PUBLIC)
app.post(['/api/contact', '/contact'], async (req, res) => {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim();
    const company = String(body.company || '').trim();
    const service = String(body.service || '').trim();
    const budget = String(body.budget || '').trim();
    const message = String(body.message || '').trim();

    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields. Please fill in Name, Email, Phone, and Project Overview.'
      });
    }

    const query = `
      INSERT INTO contact_submissions (name, email, phone, company, service, budget, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await dbRun(query, [
      name,
      email,
      phone,
      company || null,
      service || null,
      budget || null,
      message
    ]);

    console.log(`[Contact Submission] Saved enquiry from ${name} (${email}) - ID: ${result.lastID}`);

    res.status(201).json({
      success: true,
      message: 'Thank you! Your enquiry has been received. We will reply within one business day.',
      id: result.lastID
    });
  } catch (err) {
    console.error('Error saving contact submission:', err);
    res.status(500).json({
      success: false,
      error: 'An internal server error occurred while saving your response.'
    });
  }
});

// 2. Talent Form Submission (PUBLIC)
app.post(['/api/talent', '/talent'], async (req, res) => {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim();
    const role = String(body.role || '').trim();
    const experience = String(body.experience || '').trim();
    const location = String(body.location || '').trim();
    const notice_period = String(body.notice_period || '').trim();
    const resume_url = String(body.resume_url || '').trim();

    if (!name || !email || !phone || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields. Please fill in Name, Email, Phone, and Primary Expertise.'
      });
    }

    const query = `
      INSERT INTO talent_submissions (name, email, phone, role, experience, location, notice_period, resume_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await dbRun(query, [
      name,
      email,
      phone,
      role,
      experience || null,
      location || null,
      notice_period || null,
      resume_url || null
    ]);

    console.log(`[Talent Submission] Saved profile from ${name} (${email}) - ID: ${result.lastID}`);

    res.status(201).json({
      success: true,
      message: 'Thank you! Your talent profile has been securely registered.',
      id: result.lastID
    });
  } catch (err) {
    console.error('Error saving talent submission:', err);
    res.status(500).json({
      success: false,
      error: 'An internal server error occurred while registering your profile.'
    });
  }
});

// ------------------------------------------------------------------
// AUTHENTICATION & SECURITY ENDPOINTS
// ------------------------------------------------------------------

// Admin Login Route
app.post(['/api/auth/login', '/auth/login'], (req, res) => {
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
  const defaultPassword = 'SparkPoint2026!Admin';
  const envPassword = String(process.env.ADMIN_PASSWORD || '').trim();

  const isUsernameValid = (username === 'admin' || username === String(adminUsername).trim().toLowerCase());
  const isPasswordValid = Boolean(
    password && (
      password === currentPassword ||
      password === defaultPassword ||
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

// Verify Token Endpoint
app.get(['/api/auth/verify', '/auth/verify'], authMiddleware, (req, res) => {
  res.json({ success: true, valid: true, user: req.user });
});

// Change Password Route (Protected)
app.post(['/api/auth/change-password', '/auth/change-password'], authMiddleware, (req, res) => {
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

// ------------------------------------------------------------------
// PROTECTED ADMIN ENDPOINTS (Require authMiddleware)
// ------------------------------------------------------------------

// Get all contact submissions
app.get('/api/submissions/contact', authMiddleware, async (req, res) => {
  try {
    const submissions = await dbAll('SELECT * FROM contact_submissions ORDER BY created_at DESC');
    res.json({ success: true, count: submissions.length, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all talent submissions
app.get('/api/submissions/talent', authMiddleware, async (req, res) => {
  try {
    const submissions = await dbAll('SELECT * FROM talent_submissions ORDER BY created_at DESC');
    res.json({ success: true, count: submissions.length, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single contact submission by ID
app.get('/api/submissions/contact/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await dbAll('SELECT * FROM contact_submissions WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Submission not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single talent submission by ID
app.get('/api/submissions/talent/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await dbAll('SELECT * FROM talent_submissions WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Submission not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete single contact submission
app.delete('/api/submissions/contact/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM contact_submissions WHERE id = ?', [id]);
    res.json({ success: true, message: `Contact submission #${id} deleted successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete single talent submission
app.delete('/api/submissions/talent/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM talent_submissions WHERE id = ?', [id]);
    res.json({ success: true, message: `Talent submission #${id} deleted successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Batch Delete Contact Submissions
app.post('/api/submissions/contact/batch-delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Provide an array of IDs to delete' });
    }
    const placeholders = ids.map(() => '?').join(',');
    await dbRun(`DELETE FROM contact_submissions WHERE id IN (${placeholders})`, ids);
    res.json({ success: true, message: `Deleted ${ids.length} contact submissions` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Batch Delete Talent Submissions
app.post('/api/submissions/talent/batch-delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Provide an array of IDs to delete' });
    }
    const placeholders = ids.map(() => '?').join(',');
    await dbRun(`DELETE FROM talent_submissions WHERE id IN (${placeholders})`, ids);
    res.json({ success: true, message: `Deleted ${ids.length} talent submissions` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Clear All Submissions
app.post('/api/submissions/clear', authMiddleware, async (req, res) => {
  try {
    const { type } = req.body;
    if (type === 'contact') {
      await dbRun('DELETE FROM contact_submissions');
    } else if (type === 'talent') {
      await dbRun('DELETE FROM talent_submissions');
    } else if (type === 'all') {
      await dbRun('DELETE FROM contact_submissions');
      await dbRun('DELETE FROM talent_submissions');
    } else {
      return res.status(400).json({ success: false, error: 'Invalid type parameter' });
    }
    res.json({ success: true, message: `Cleared ${type} submissions successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper for CSV escaping
const toCSVRow = (arr) => arr.map(val => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}).join(',');

// Server Direct Export CSV Endpoints (Protected)
app.get('/api/export/contact/csv', authMiddleware, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM contact_submissions ORDER BY created_at DESC');
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Service', 'Budget', 'Message', 'Submitted At'];
    const csvContent = [
      headers.join(','),
      ...rows.map(r => toCSVRow([r.id, r.name, r.email, r.phone, r.company, r.service, r.budget, r.message, r.created_at]))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="contact_submissions_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).send('Error exporting contact CSV: ' + err.message);
  }
});

app.get('/api/export/talent/csv', authMiddleware, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM talent_submissions ORDER BY created_at DESC');
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Experience', 'Location', 'Notice Period', 'Resume URL', 'Submitted At'];
    const csvContent = [
      headers.join(','),
      ...rows.map(r => toCSVRow([r.id, r.name, r.email, r.phone, r.role, r.experience, r.location, r.notice_period, r.resume_url, r.created_at]))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="talent_submissions_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).send('Error exporting talent CSV: ' + err.message);
  }
});

// Server Direct Export JSON Endpoints (Protected)
app.get('/api/export/contact/json', authMiddleware, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM contact_submissions ORDER BY created_at DESC');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="contact_submissions_${Date.now()}.json"`);
    res.json(rows);
  } catch (err) {
    res.status(500).send('Error exporting contact JSON: ' + err.message);
  }
});

app.get('/api/export/talent/json', authMiddleware, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM talent_submissions ORDER BY created_at DESC');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="talent_submissions_${Date.now()}.json"`);
    res.json(rows);
// Catch-all 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: `API route ${req.url} not found` });
});

export default app;
