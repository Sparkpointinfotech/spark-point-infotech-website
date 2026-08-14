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
    const rawResumeUrl = String(body.resume_url || '').trim();
    const resume_url = /^https?:\/\//i.test(rawResumeUrl) ? rawResumeUrl : '';

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
