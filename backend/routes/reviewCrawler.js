const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const pool = require('../config/database');

// Review crawler service with scheduled polling of external platforms
// POST /api/review-crawler/schedule { platform, query, intervalMinutes }
// GET  /api/review-crawler/jobs
// POST /api/review-crawler/run-now { jobId }

async function ensureTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS review_crawler_jobs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        platform VARCHAR(64) NOT NULL,
        query TEXT NOT NULL,
        interval_minutes INTEGER NOT NULL DEFAULT 60,
        active BOOLEAN DEFAULT TRUE,
        last_run TIMESTAMP,
        last_result JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (e) { /* table may be unsupported in some envs */ }
}
ensureTable().catch(() => {});

async function fetchFromPlatform(platform, query) {
  const keyMap = {
    trustpilot: 'TRUSTPILOT_API_KEY',
    g2: 'G2_API_KEY',
    capterra: 'CAPTERRA_API_KEY',
    google: 'GOOGLE_PLACES_API_KEY',
  };
  const envKey = keyMap[platform];
  if (!envKey || !process.env[envKey]) {
    return { fetched: 0, note: `Missing ${envKey || 'API key'} for ${platform}. TODO: configure credentials` };
  }
  // Stub: real impl would hit platform API
  return { fetched: 0, note: 'Stub crawler; integration not implemented' };
}

router.post('/schedule', authMiddleware, async (req, res) => {
  const { platform, query, intervalMinutes = 60 } = req.body || {};
  if (!platform || !query) return res.status(400).json({ error: 'platform and query required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO review_crawler_jobs (user_id, platform, query, interval_minutes) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, platform, query, intervalMinutes]
    );
    res.json({ job: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/jobs', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM review_crawler_jobs WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ jobs: rows });
  } catch (err) {
    res.json({ jobs: [] });
  }
});

router.post('/run-now', authMiddleware, async (req, res) => {
  const { jobId } = req.body || {};
  if (!jobId) return res.status(400).json({ error: 'jobId required' });
  try {
    const { rows } = await pool.query(`SELECT * FROM review_crawler_jobs WHERE id=$1 AND user_id=$2`, [jobId, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'job not found' });
    const job = rows[0];
    const result = await fetchFromPlatform(job.platform, job.query);
    await pool.query(`UPDATE review_crawler_jobs SET last_run=NOW(), last_result=$1 WHERE id=$2`, [JSON.stringify(result), jobId]);
    res.json({ jobId, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/jobs/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query(`DELETE FROM review_crawler_jobs WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
