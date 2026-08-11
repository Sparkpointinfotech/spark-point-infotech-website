# Backend Restructure & Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `server/app.js` (502 lines, ~25 routes inline with app setup) into a thin composition root plus focused `middleware/` and `routes/` modules, and apply the three hardening fixes from the design spec: a required (not hardcoded-fallback) JWT secret, a visible warning when Vercel's non-durable fallback storage is active, and rate limiting on the three public-facing POST endpoints.

**Architecture:** `server/app.js` keeps only Express app setup (CORS, body parsing, static file serving, the admin-page redirect, the legacy-URL-prefix normalizer) and mounts one router per concern. `server/db.js` is untouched except for one new startup warning. `server/index.js` and `api/index.js` need zero changes — both just import `app.js`'s default export.

**Tech Stack:** Express 5, `jsonwebtoken`, `express-rate-limit` (new dependency — small, widely used, ~2M weekly downloads, actively maintained).

**Reference doc:** `docs/superpowers/specs/2026-08-11-codebase-restructure-design.md` (§4.4, §6a)

**Run this independently of the frontend restructure plan** — they touch entirely disjoint files (`server/`, `api/`, `.env.example`, `package.json` here vs. `index.html`/`admin.html`/`src/` there) and neither depends on the other having run first.

---

## Before you start

Like the frontend plan, this is mostly a pure move of existing route handlers into new files — verified via `curl` against the running server rather than a build diff, since there's no build step for the backend. The 3 hardening fixes are new logic, called out explicitly.

You'll need `npm run server` (or `npm run dev`, which runs both server and Vite) running in a separate terminal for the `curl` verification steps. Local dev without `DATABASE_URL` set uses SQLite (or the JSON fallback store, depending on your local setup) — either is fine for verification purposes, since the fixes here don't depend on which DB mode is active.

---

### Task 0: Baseline smoke test

**Files:** none (verification only)

- [ ] **Step 1: Start the server and record baseline responses**

```bash
npm run server
```

In another terminal:

```bash
curl -s http://localhost:5000/api/health | tee /tmp/spi-baseline-health.json
curl -s http://localhost:5000/api | tee /tmp/spi-baseline-root.json
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"wrong"}' | tee /tmp/spi-baseline-login-fail.json
```

Expected: `/api/health` returns `{"status":"ok",...}`, `/api` returns `{"status":"ok","service":"Spark Point Infotech API"}`, the bad login returns `{"success":false,"error":"Invalid admin username or password."}`. Keep these three files — later tasks re-run the same three commands and diff against them.

---

### Task 1: Extract the auth middleware, with the JWT secret fix (§6a fix #1)

**Files:**
- Create: `server/middleware/auth.js`

Today, [server/app.js:16](server/app.js#L16) does `const JWT_SECRET = process.env.JWT_SECRET || 'spark-point-infotech-admin-secret-2026';` — if `JWT_SECRET` is ever unset in production, every admin token is signed with a literal string visible in source control, meaning anyone could forge a valid admin session. The fix: require it from the environment; fail fast at startup in production if it's missing; in local dev, generate a random per-process secret so `npm run dev` still works without any setup, with a warning so it's not mistaken for a stable value.

- [ ] **Step 1: Create the folder**

```bash
mkdir -p server/middleware
```

- [ ] **Step 2: Write `server/middleware/auth.js`**

```js
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
```

(`authMiddleware`'s body is verbatim from today's `server/app.js:64-92`; `JWT_SECRET` is exported since `routes/auth.js`, Task 3, needs it to sign new tokens.)

- [ ] **Step 3: Commit**

```bash
git add server/middleware/auth.js
git commit -m "refactor: extract auth middleware, require JWT_SECRET instead of a hardcoded fallback"
```

(This file isn't imported by anything yet — `server/app.js` still has its own copy. Task 4 removes the duplicate and wires this one in, so the app stays runnable at every commit.)

---

### Task 2: Add rate limiting (§6a fix #3)

**Files:**
- Create: `server/middleware/rate-limit.js`
- Modify: `package.json`

Two new limiters: one for the public form-submission endpoints (contact/talent — no existing protection at all), one for login (added *alongside* the existing 5-failed-attempts-per-IP lockout already in the login route, not replacing it — that lockout only counts failed passwords; this limiter caps total request volume regardless of outcome, which the lockout alone doesn't do).

- [ ] **Step 1: Install the dependency**

```bash
npm install express-rate-limit
```

Expected: `package.json`'s `dependencies` gains an `express-rate-limit` entry; `package-lock.json` updates.

- [ ] **Step 2: Write `server/middleware/rate-limit.js`**

```js
import rateLimit from 'express-rate-limit';

export const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' }
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts from this network. Please try again later.' }
});
```

20 requests per 15 minutes per IP is generous for a real visitor submitting a form (even retrying a few times) while blocking scripted spam. 30/15min for login sits above the existing 5-failed-attempt lockout threshold so it acts as a backstop against high request *volume*, not as the primary brute-force defense — that's still the existing `loginAttempts` Map logic, untouched.

- [ ] **Step 3: Commit**

```bash
git add server/middleware/rate-limit.js package.json package-lock.json
git commit -m "feat: add rate limiting for contact, talent, and login endpoints"
```

---

### Task 3: Extract routes into `server/routes/`

**Files:**
- Create: `server/routes/health.js`, `server/routes/contact.js`, `server/routes/talent.js`, `server/routes/auth.js`, `server/routes/submissions.js`, `server/routes/export.js`

Each file below is a verbatim copy of the corresponding route handler(s) from today's `server/app.js`, wrapped in an Express `Router` instead of the app instance directly, with the two new fixes applied where relevant (rate limiters on contact/talent/login; the middleware import path for `authMiddleware`/`JWT_SECRET` now points at `../middleware/auth.js`).

- [ ] **Step 1: Create the folder**

```bash
mkdir -p server/routes
```

- [ ] **Step 2: Write `server/routes/health.js`**

(Verbatim from `server/app.js:99-120`.)

```js
import { Router } from 'express';
import { dbAll } from '../db.js';

const router = Router();

router.get(['/api', '/api/'], (req, res) => {
  res.json({ status: 'ok', service: 'Spark Point Infotech API' });
});

router.get(['/api/health', '/health'], async (req, res) => {
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

export default router;
```

- [ ] **Step 3: Write `server/routes/contact.js`**

(Verbatim body from `server/app.js:123-170`, with `publicFormLimiter` added to the route.)

```js
import { Router } from 'express';
import { dbRun } from '../db.js';
import { publicFormLimiter } from '../middleware/rate-limit.js';

const router = Router();

router.post(['/api/contact', '/contact'], publicFormLimiter, async (req, res) => {
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

export default router;
```

- [ ] **Step 4: Write `server/routes/talent.js`**

(Verbatim body from `server/app.js:173-222`, with `publicFormLimiter` added.)

```js
import { Router } from 'express';
import { dbRun } from '../db.js';
import { publicFormLimiter } from '../middleware/rate-limit.js';

const router = Router();

router.post(['/api/talent', '/talent'], publicFormLimiter, async (req, res) => {
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

export default router;
```

- [ ] **Step 5: Write `server/routes/auth.js`**

(Verbatim body from `server/app.js:229-310`, plus the module-level `adminUsername`/`loginAttempts` state from lines 17/20, with `loginLimiter` added to the login route and imports pointed at the new `middleware/auth.js`.)

```js
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
```

- [ ] **Step 6: Write `server/routes/submissions.js`**

(Verbatim from `server/app.js:317-430`.)

```js
import { Router } from 'express';
import { dbAll, dbRun } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/api/submissions/contact', authMiddleware, async (req, res) => {
  try {
    const submissions = await dbAll('SELECT * FROM contact_submissions ORDER BY created_at DESC');
    res.json({ success: true, count: submissions.length, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/api/submissions/talent', authMiddleware, async (req, res) => {
  try {
    const submissions = await dbAll('SELECT * FROM talent_submissions ORDER BY created_at DESC');
    res.json({ success: true, count: submissions.length, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/api/submissions/contact/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await dbAll('SELECT * FROM contact_submissions WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Submission not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/api/submissions/talent/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await dbAll('SELECT * FROM talent_submissions WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Submission not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/submissions/contact/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM contact_submissions WHERE id = ?', [id]);
    res.json({ success: true, message: `Contact submission #${id} deleted successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/submissions/talent/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM talent_submissions WHERE id = ?', [id]);
    res.json({ success: true, message: `Talent submission #${id} deleted successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/submissions/contact/batch-delete', authMiddleware, async (req, res) => {
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

router.post('/api/submissions/talent/batch-delete', authMiddleware, async (req, res) => {
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

router.post('/api/submissions/clear', authMiddleware, async (req, res) => {
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

export default router;
```

- [ ] **Step 7: Write `server/routes/export.js`**

(Verbatim from `server/app.js:433-495`.)

```js
import { Router } from 'express';
import { dbAll } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const toCSVRow = (arr) => arr.map(val => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}).join(',');

router.get('/api/export/contact/csv', authMiddleware, async (req, res) => {
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

router.get('/api/export/talent/csv', authMiddleware, async (req, res) => {
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

router.get('/api/export/contact/json', authMiddleware, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM contact_submissions ORDER BY created_at DESC');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="contact_submissions_${Date.now()}.json"`);
    res.json(rows);
  } catch (err) {
    res.status(500).send('Error exporting contact JSON: ' + err.message);
  }
});

router.get('/api/export/talent/json', authMiddleware, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM talent_submissions ORDER BY created_at DESC');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="talent_submissions_${Date.now()}.json"`);
    res.json(rows);
  } catch (err) {
    res.status(500).send('Error exporting talent JSON: ' + err.message);
  }
});

export default router;
```

- [ ] **Step 8: Commit (routes exist but aren't wired in yet — app.js still uses its own copies)**

```bash
git add server/routes
git commit -m "refactor: extract route handlers into server/routes/ (not yet wired into app.js)"
```

---

### Task 4: Rewrite `server/app.js` as a thin composition root

**Files:**
- Modify: `server/app.js`

- [ ] **Step 1: Replace the entire file**

```js
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import healthRoutes from './routes/health.js';
import contactRoutes from './routes/contact.js';
import talentRoutes from './routes/talent.js';
import authRoutes from './routes/auth.js';
import submissionsRoutes from './routes/submissions.js';
import exportRoutes from './routes/export.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();

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

// Serve static files from project root & dist folder if present
if (fs.existsSync(path.join(rootDir, 'dist'))) {
  app.use(express.static(path.join(rootDir, 'dist')));
}
app.use(express.static(rootDir));

// Serve Admin Panel directly on /admin or /admin.html
app.get(['/admin', '/admin.html'], (req, res) => {
  const adminPath = fs.existsSync(path.join(rootDir, 'dist', 'admin.html'))
    ? path.join(rootDir, 'dist', 'admin.html')
    : path.join(rootDir, 'admin.html');
  res.sendFile(adminPath);
});

// Normalize Vercel Serverless Function API paths (e.g., /auth/login -> /api/auth/login)
const apiPrefixes = ['/health', '/contact', '/talent', '/auth', '/submissions', '/export'];
app.use((req, res, next) => {
  if (req.url && !req.url.startsWith('/api')) {
    const isApiMatch = apiPrefixes.some(prefix => req.url.startsWith(prefix));
    if (isApiMatch) {
      req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
    }
  }
  next();
});

app.use(healthRoutes);
app.use(contactRoutes);
app.use(talentRoutes);
app.use(authRoutes);
app.use(submissionsRoutes);
app.use(exportRoutes);

// Catch-all 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: `API route ${req.url} not found` });
});

export default app;
```

`server/index.js` and `api/index.js` need no changes — verify:

```bash
cat server/index.js api/index.js
```

Expected: both still just `import app from './app.js'` (or `'../server/app.js'`) and re-export/listen on it — matches what's already there.

- [ ] **Step 2: Restart the server and re-run the baseline smoke test**

```bash
npm run server
```

In another terminal:

```bash
curl -s http://localhost:5000/api/health
curl -s http://localhost:5000/api
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"wrong"}'
```

Expected: identical JSON shapes to Task 0's baseline files (`diff <(curl -s http://localhost:5000/api/health) /tmp/spi-baseline-health.json` etc. — the `stats` numbers may differ if you submitted test data in between, that's fine, just confirm the *shape* matches).

- [ ] **Step 3: Exercise every route once**

```bash
# Public routes
curl -s -X POST http://localhost:5000/api/contact -H "Content-Type: application/json" -d '{"name":"Test User","email":"test@example.com","phone":"1234567890","message":"Testing the restructure"}'
curl -s -X POST http://localhost:5000/api/talent -H "Content-Type: application/json" -d '{"name":"Test Candidate","email":"candidate@example.com","phone":"1234567890","role":"Backend Engineer"}'

# Admin login (use your real ADMIN_PASSWORD or the default 'SparkPoint2026!Admin' if unset locally)
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"SparkPoint2026!Admin"}' | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).token))")

# Protected routes
curl -s http://localhost:5000/api/auth/verify -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:5000/api/submissions/contact -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:5000/api/submissions/talent -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:5000/api/export/contact/csv -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:5000/api/export/talent/json -H "Authorization: Bearer $TOKEN"

# Unauthenticated request to a protected route should fail
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5000/api/submissions/contact
```

Expected: contact/talent POSTs return `{"success":true,...}` with an `id`; login returns a token; `/auth/verify` returns `{"success":true,"valid":true,...}`; both submissions endpoints return arrays including the just-created test rows; CSV/JSON exports return file content; the unauthenticated request returns `401`.

- [ ] **Step 4: Commit**

```bash
git add server/app.js
git commit -m "refactor: reduce server/app.js to app setup + route mounting"
```

---

### Task 5: Add the fallback-storage warning (§6a fix #2)

**Files:**
- Modify: `server/db.js`

Today's `server/db.js:29-30` determines `dbMode` synchronously at module load: `pg` if `DATABASE_URL`/`POSTGRES_URL` is set, otherwise `fallback` on Vercel (writes to `/tmp`, not guaranteed to persist between invocations) or `sqlite` locally. This adds a startup warning for the risky case — no behavior change for the (intended, documented-in-`.env.example`) case where `DATABASE_URL` is set.

- [ ] **Step 1: Add the warning right after `dbMode` is determined**

In `server/db.js`, immediately after this existing line (today at line 30):

```js
let dbMode = dbUrl ? 'pg' : (process.env.VERCEL ? 'fallback' : 'sqlite');
```

add:

```js

if (dbMode === 'fallback') {
  console.warn(
    '[Database] WARNING: Running on Vercel with no DATABASE_URL/POSTGRES_URL configured. ' +
    'Submissions will be written to /tmp, which Vercel does not guarantee persists between ' +
    'invocations — data can be silently lost. Set DATABASE_URL in your Vercel project environment ' +
    'variables (see .env.example) to use persistent Postgres storage.'
  );
}
```

- [ ] **Step 2: Verify the warning fires in the risky case, and stays silent otherwise**

```bash
# Simulate "on Vercel with no DB configured" — should print the warning
VERCEL=1 node -e "import('./server/db.js')"

# Simulate normal local dev — should NOT print the warning
node -e "import('./server/db.js')"
```

Expected: the first command prints the `[Database] WARNING...` line; the second does not.

- [ ] **Step 3: Commit**

```bash
git add server/db.js
git commit -m "fix: warn loudly when Vercel fallback storage is active with no database configured"
```

---

### Task 6: Document `JWT_SECRET` in `.env.example`

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add the missing variable**

Add this block to `.env.example` (after the existing `ADMIN_PASSWORD` entry):

```
# JWT Signing Secret (REQUIRED in production — see server/middleware/auth.js)
# Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET="replace-with-a-random-64-character-hex-string"
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: document required JWT_SECRET in .env.example"
```

---

### Task 7: Append the backend section to `ARCHITECTURE.md`

**Files:**
- Modify (or create, if this plan runs before the frontend plan): `ARCHITECTURE.md`

- [ ] **Step 1: Check whether the file already exists**

```bash
test -f ARCHITECTURE.md && echo "exists — append" || echo "missing — create with just this section"
```

- [ ] **Step 2: Add the Backend section**

If the file exists (frontend plan already ran), append this section to the end. If it doesn't exist yet, create it starting with a `# Architecture` heading followed by this section.

```markdown
## Backend

`server/app.js` only does Express app setup — CORS, body parsing, static file serving, the `/admin` redirect, and the legacy-URL-prefix normalizer (so `/contact` and `/api/contact` both work, which Vercel's routing relies on) — then mounts one router per concern from `server/routes/`:

- `health.js` — API root + health check
- `contact.js` / `talent.js` — the two public form-submission endpoints
- `auth.js` — login, token verification, password change
- `submissions.js` — admin CRUD over stored submissions
- `export.js` — CSV/JSON export endpoints

`server/middleware/auth.js` holds the JWT verification middleware and the JWT secret resolution (required in production, auto-generated with a warning in local dev — never a hardcoded fallback). `server/middleware/rate-limit.js` holds the two `express-rate-limit` instances applied to the contact, talent, and login routes.

`server/db.js` is deliberately left as one file — it's already a single-responsibility data-access layer (`dbRun`, `dbAll`, `getAdminPassword`, `setAdminPassword`, `initDb`) used identically by every route, with three internal modes (Postgres, SQLite, and a JSON-file fallback for Vercel-without-a-database) that would be riskier to split than to leave alone.

To add a new API endpoint: create (or add to) a file in `server/routes/`, export an Express `Router`, mount it in `server/app.js`. If it needs to be admin-only, add `authMiddleware` from `server/middleware/auth.js` to the route. If it's a public endpoint that accepts user input, consider `publicFormLimiter` from `server/middleware/rate-limit.js`.

`server/index.js` (local dev) and `api/index.js` (Vercel serverless) both just import `server/app.js`'s default export — neither needs to change when routes are added or moved.
```

- [ ] **Step 3: Commit**

```bash
git add ARCHITECTURE.md
git commit -m "docs: add backend section to ARCHITECTURE.md"
```

---

### Task 8: Final verification and cleanup

**Files:** none (verification only)

- [ ] **Step 1: Full route walkthrough one more time, from a clean server restart**

```bash
npm run server
```

Repeat Task 4 Step 3's full `curl` walkthrough (public routes, login, protected routes, unauthenticated-request-gets-401).

- [ ] **Step 2: Verify the rate limiter actually engages**

```bash
for i in $(seq 1 25); do curl -s -o /dev/null -w "%{http_code} " http://localhost:5000/api/contact -X POST -H "Content-Type: application/json" -d '{"name":"a","email":"a@a.com","phone":"1","message":"a"}'; done; echo
```

Expected: the first ~20 requests return `201`, the rest return `429`.

- [ ] **Step 3: Verify a missing JWT_SECRET fails fast in production mode**

```bash
NODE_ENV=production node -e "import('./server/app.js')" 2>&1 | tail -5
```

Expected (if `JWT_SECRET` is not set in your shell environment): the process throws with the `JWT_SECRET environment variable is required in production` error. If you do have `JWT_SECRET` exported in your shell already, temporarily unset it for this one check: `env -u JWT_SECRET NODE_ENV=production node -e "import('./server/app.js')" 2>&1 | tail -5`.

- [ ] **Step 4: Clean up baseline files**

```bash
rm -f /tmp/spi-baseline-health.json /tmp/spi-baseline-root.json /tmp/spi-baseline-login-fail.json
```

- [ ] **Step 5: Confirm clean working tree**

```bash
git status
```

Expected: clean (everything committed task-by-task already).
