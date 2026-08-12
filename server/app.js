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
