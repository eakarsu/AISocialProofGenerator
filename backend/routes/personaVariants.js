const express = require('express');
const axios = require('axios');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const pool = require('../config/database');

// Sentiment-driven variant generation tuned to buyer personas
// POST /api/persona-variants/generate { testimonial, personas: [...] }
async function callOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY missing. TODO: configure credentials');
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
  const resp = await axios.post(
    `${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: 'You generate testimonial variants tuned to specific buyer personas. Return strict JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
  );
  let txt = resp.data.choices[0].message.content.trim();
  txt = txt.replace(/^```(?:json|JSON)?\s*\n?/, '').replace(/\n?\s*```\s*$/, '');
  try { return JSON.parse(txt); } catch { return { raw: txt }; }
}

router.post('/generate', authMiddleware, aiRateLimiter, async (req, res) => {
  const { testimonial, personas = ['price-conscious', 'feature-seeker', 'enterprise'] } = req.body || {};
  if (!testimonial) return res.status(400).json({ error: 'testimonial is required' });
  try {
    const prompt = `Original testimonial:\n"""${testimonial}"""\n\nGenerate one variant per persona: ${personas.join(', ')}.\nFor each variant, include: persona, headline, body, predicted_sentiment (positive/neutral/negative), score (0-1).\nReturn JSON: { variants: [...] }`;
    const result = await callOpenRouter(prompt);
    try {
      await pool.query(
        `INSERT INTO ai_results (user_id, feature, input, output) VALUES ($1,$2,$3,$4)`,
        [req.user.id, 'persona_variants', JSON.stringify({ testimonial, personas }), JSON.stringify(result)]
      ).catch(() => {});
    } catch (_) {}
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('persona-variants error:', err.message);
    res.status(500).json({ error: err.message || 'AI generation failed' });
  }
});

// GET /api/persona-variants/history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, input, output, created_at FROM ai_results
       WHERE user_id = $1 AND feature = 'persona_variants'
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ history: rows });
  } catch (err) {
    res.json({ history: [] });
  }
});

module.exports = router;
