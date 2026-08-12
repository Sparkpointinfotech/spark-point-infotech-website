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
