const express = require('express');
const axios = require('axios');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const pool = require('../config/database');

// Multi-modal proof widgets combining video + audio + text with auto-transcription
// POST /api/multi-modal-widgets/build { items: [{type:'video'|'audio'|'text', src, transcript?}] }
async function callOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY missing. TODO: configure credentials');
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
  const resp = await axios.post(
    `${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: 'You compose multi-modal social-proof widget configs. Respond JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.6,
    },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
  );
  let txt = resp.data.choices[0].message.content.trim();
  txt = txt.replace(/^```(?:json|JSON)?\s*\n?/, '').replace(/\n?\s*```\s*$/, '');
  try { return JSON.parse(txt); } catch { return { raw: txt }; }
}

// Stub for whisper/deepgram transcription
async function transcribe(src) {
  if (!process.env.TRANSCRIPTION_API_KEY) {
    // TODO: configure credentials (Whisper/Deepgram)
    return `[transcription unavailable for ${src}]`;
  }
  return `[transcribed: ${src}]`;
}

router.post('/build', authMiddleware, aiRateLimiter, async (req, res) => {
  const { items = [], theme = 'modern' } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required' });
  }
  try {
    const enriched = await Promise.all(
      items.map(async (it) => {
        if ((it.type === 'video' || it.type === 'audio') && !it.transcript) {
          it.transcript = await transcribe(it.src);
        }
        return it;
      })
    );
    const prompt = `Compose a multi-modal social proof widget for these items: ${JSON.stringify(enriched).slice(0, 4000)}. Theme: ${theme}.\nReturn JSON: { widget: { layout, order: [{type, src, caption}], embed_code, accessibility_notes } }`;
    const result = await callOpenRouter(prompt);
    res.json({ success: true, items: enriched, ...result });
  } catch (err) {
    console.error('multi-modal-widgets error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/themes', authMiddleware, (req, res) => {
  res.json({ themes: ['modern', 'minimal', 'bold', 'elegant', 'playful'] });
});

module.exports = router;
