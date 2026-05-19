const express = require('express');
const axios = require('axios');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const pool = require('../config/database');

// Authenticity scoring: detect AI-generated vs real testimonials
// POST /api/authenticity-scorer/score { text }
async function callOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY missing. TODO: configure credentials');
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
  const resp = await axios.post(
    `${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: 'You assess whether a customer testimonial is AI-generated or authentic. Respond JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.2,
    },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
  );
  let txt = resp.data.choices[0].message.content.trim();
  txt = txt.replace(/^```(?:json|JSON)?\s*\n?/, '').replace(/\n?\s*```\s*$/, '');
  try { return JSON.parse(txt); } catch { return { raw: txt }; }
}

function heuristicSignals(text) {
  const t = String(text || '');
  const wordCount = t.split(/\s+/).filter(Boolean).length;
  const avgSentenceLen = wordCount / Math.max(1, (t.match(/[.!?]+/g) || []).length);
  const uniformity = /amazing|incredible|game.?changer|highly recommend/gi.test(t) ? 1 : 0;
  const hasSpecifics = /\d+%|\$\d+|in (\d+) (days|weeks|months)|our team of \d+/i.test(t) ? 1 : 0;
  return { wordCount, avgSentenceLen: Math.round(avgSentenceLen * 10) / 10, uniformBuzzwords: uniformity, hasSpecifics };
}

router.post('/score', authMiddleware, aiRateLimiter, async (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text is required' });
  try {
    const signals = heuristicSignals(text);
    const prompt = `Assess authenticity of this customer testimonial:\n"${text}"\n\nHeuristic signals: ${JSON.stringify(signals)}.\nReturn JSON: { authenticity_score: 0-1, ai_likelihood: 0-1, red_flags:[], strengths:[], verdict: "authentic"|"suspicious"|"likely_ai", liability_risk: "low"|"medium"|"high" }`;
    const result = await callOpenRouter(prompt);
    try {
      await pool.query(
        `INSERT INTO ai_results (user_id, feature, input, output) VALUES ($1,$2,$3,$4)`,
        [req.user.id, 'authenticity_score', JSON.stringify({ text: text.slice(0, 200), signals }), JSON.stringify(result)]
      ).catch(() => {});
    } catch (_) {}
    res.json({ success: true, signals, ...result });
  } catch (err) {
    console.error('authenticity-scorer error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
