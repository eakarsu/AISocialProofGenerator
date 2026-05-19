const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const axios = require('axios');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.csv') return cb(null, true);
    cb(new Error('Only CSV files allowed'));
  }
});

// Parse CSV buffer into array of objects
function parseCSV(buffer) {
  const text = buffer.toString('utf-8');
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
}

async function callOpenRouterForOutreach(prompt) {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: 'You are an expert at writing personalized outreach emails. Respond ONLY with JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000'
      }
    }
  );
  return response.data.choices[0].message.content;
}

// Initialize outreach_campaigns table
pool.query(`
  CREATE TABLE IF NOT EXISTS outreach_campaigns (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    company VARCHAR(255),
    email_subject TEXT,
    email_body TEXT,
    follow_up_body TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    sent_at TIMESTAMP,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(console.error);

// POST /api/customers/import - CSV import + AI outreach drafts
router.post('/import', authMiddleware, requireRole('admin', 'editor'), aiRateLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });

    const customers = parseCSV(req.file.buffer);
    if (customers.length === 0) return res.status(400).json({ error: 'CSV is empty or malformed' });

    const results = [];
    const errors = [];

    // Process up to 20 customers at once
    const batch = customers.slice(0, 20);

    for (const customer of batch) {
      try {
        const name = customer.name || customer.customer_name || customer.Name || '';
        const email = customer.email || customer.Email || '';
        const company = customer.company || customer.Company || '';
        const product = customer.product || req.body.product || 'our product';

        if (!name) { errors.push({ row: customer, error: 'Missing name' }); continue; }

        const prompt = `Draft a personalized testimonial request email. Return ONLY JSON:
Customer: ${name}${company ? ' at ' + company : ''}
Product Used: ${product}
Email: ${email}

Return:
{
  "subject": "...",
  "body": "...",
  "follow_up_body": "..."
}`;

        const aiText = await callOpenRouterForOutreach(prompt);
        let parsed = null;
        try { parsed = JSON.parse(aiText); } catch {
          const start = aiText.indexOf('{'); const end = aiText.lastIndexOf('}');
          if (start !== -1 && end !== -1) { try { parsed = JSON.parse(aiText.slice(start, end + 1)); } catch {} }
        }

        const insertResult = await pool.query(
          `INSERT INTO outreach_campaigns (customer_name, customer_email, company, email_subject, email_body, follow_up_body, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            name, email, company,
            parsed?.subject || `Your feedback on ${product}`,
            parsed?.body || '',
            parsed?.follow_up_body || '',
            req.user.id
          ]
        );
        results.push(insertResult.rows[0]);
      } catch (err) {
        errors.push({ row: customer, error: err.message });
      }
    }

    res.json({
      message: `Imported ${results.length} customers. ${errors.length} errors.`,
      imported: results.length,
      errors: errors.length,
      campaigns: results,
      error_details: errors
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/campaigns - list outreach campaigns
router.get('/campaigns', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const [countResult, dataResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM outreach_campaigns'),
      pool.query('SELECT * FROM outreach_campaigns ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset])
    ]);

    res.json({
      data: dataResult.rows,
      pagination: { page, limit, total: parseInt(countResult.rows[0].count), totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/customers/campaigns/:id/send - mark as sent
router.put('/campaigns/:id/send', authMiddleware, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE outreach_campaigns SET status = $1, sent_at = NOW() WHERE id = $2 RETURNING *',
      ['sent', req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
