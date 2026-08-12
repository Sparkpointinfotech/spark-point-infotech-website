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
