const express = require('express');
const axios = require('axios');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const pool = require('../config/database');

// One-click marketplace publishing to Capterra, G2, ProductHunt
// POST /api/marketplace-publishing/format { testimonial, platforms:[...] }
// POST /api/marketplace-publishing/publish { content, platforms:[...] }

const PLATFORM_LIMITS = {
  capterra: { headlineMax: 80, reviewMax: 1500 },
  g2: { headlineMax: 100, reviewMax: 2000 },
  producthunt: { headlineMax: 60, reviewMax: 240 },
  trustpilot: { headlineMax: 70, reviewMax: 4000 },
};

async function callOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY missing. TODO: configure credentials');
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
  const resp = await axios.post(
    `${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: 'You format customer testimonials for review marketplaces. Respond JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.4,
    },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
  );
  let txt = resp.data.choices[0].message.content.trim();
  txt = txt.replace(/^```(?:json|JSON)?\s*\n?/, '').replace(/\n?\s*```\s*$/, '');
  try { return JSON.parse(txt); } catch { return { raw: txt }; }
}

router.post('/format', authMiddleware, aiRateLimiter, async (req, res) => {
  const { testimonial, platforms = ['capterra', 'g2', 'producthunt'] } = req.body || {};
  if (!testimonial) return res.status(400).json({ error: 'testimonial required' });
  try {
    const limits = platforms.reduce((acc, p) => { acc[p] = PLATFORM_LIMITS[p] || {}; return acc; }, {});
    const prompt = `Reformat this testimonial for each platform respecting character limits.\nTestimonial: "${testimonial}"\nLimits: ${JSON.stringify(limits)}\nReturn JSON: { formatted: { capterra:{headline,review,rating}, g2:{...}, ... } }`;
    const result = await callOpenRouter(prompt);
    res.json({ success: true, limits, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/publish', authMiddleware, async (req, res) => {
  const { content = {}, platforms = [] } = req.body || {};
  const results = [];
  for (const p of platforms) {
    const key = process.env[`${p.toUpperCase()}_API_KEY`];
    if (!key) {
      results.push({ platform: p, status: 'skipped', reason: `Missing ${p.toUpperCase()}_API_KEY. TODO: configure credentials` });
      continue;
    }
    // TODO: real platform-specific publish endpoint
    results.push({ platform: p, status: 'queued', payload_preview: content[p] || null });
  }
  try {
    await pool.query(
      `INSERT INTO ai_results (user_id, feature, input, output) VALUES ($1,$2,$3,$4)`,
      [req.user.id, 'marketplace_publish', JSON.stringify({ platforms }), JSON.stringify(results)]
    ).catch(() => {});
  } catch (_) {}
  res.json({ success: true, results });
});

router.get('/platforms', authMiddleware, (req, res) => {
  res.json({ supported: Object.keys(PLATFORM_LIMITS), limits: PLATFORM_LIMITS });
});

module.exports = router;
