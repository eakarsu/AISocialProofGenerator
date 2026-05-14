const express = require('express');
const axios = require('axios');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const pool = require('../config/database');

// Competitive testimonial analysis via RAG over competitor reviews
// POST /api/competitive-testimonials/analyze { ownReview, competitorReviews:[...], competitorName }
async function callOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY missing. TODO: configure credentials');
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
  const resp = await axios.post(
    `${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: 'You are a competitive intelligence analyst. Respond JSON only.' },
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

router.post('/analyze', authMiddleware, aiRateLimiter, async (req, res) => {
  const { ownReview, competitorReviews = [], competitorName = 'Competitor' } = req.body || {};
  if (!ownReview || !competitorReviews.length) {
    return res.status(400).json({ error: 'ownReview and competitorReviews are required' });
  }
  try {
    const prompt = `Compare own customer review vs competitor (${competitorName}) reviews. Identify differentiation, common gripes, opportunities.\n\nOwn:\n"${ownReview}"\n\nCompetitor:\n${competitorReviews.slice(0, 20).map((r, i) => `${i + 1}. "${String(r).slice(0, 400)}"`).join('\n')}\n\nReturn JSON: { differentiators:[], competitor_weaknesses:[], shared_strengths:[], recommended_messaging:[], confidence: 0-1 }`;
    const result = await callOpenRouter(prompt);
    try {
      await pool.query(
        `INSERT INTO ai_results (user_id, feature, input, output) VALUES ($1,$2,$3,$4)`,
        [req.user.id, 'competitive_rag', JSON.stringify({ ownReview, competitorName, n: competitorReviews.length }), JSON.stringify(result)]
      ).catch(() => {});
    } catch (_) {}
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('competitive-testimonials error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
