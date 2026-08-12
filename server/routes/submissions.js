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
