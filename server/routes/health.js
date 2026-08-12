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
