'use strict';

const axios = require('axios');
const express = require('express');
const pool = require('../config/database');

module.exports = function governedGeneration(authenticate) {
  const router = express.Router();
  router.use(authenticate);

  router.post('/testimonial-draft', async (req, res) => {
    try {
      if (!['creator', 'editor', 'reviewer', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient social-proof role' });
      }
      const sourceText = String(req.body?.sourceText || '').trim();
      if (!sourceText) return res.status(422).json({ error: 'sourceText is required' });

      const response = await axios.post(
        `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
        {
          model: process.env.OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: 'Draft a concise, factual customer testimonial. Do not invent metrics. Return plain text.' },
            { role: 'user', content: sourceText },
          ],
          max_tokens: 500,
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.CLIENT_URL,
            'X-Title': 'Governed Social Proof Generator',
          },
          timeout: 30000,
        }
      );
      const result = String(response.data?.choices?.[0]?.message?.content || '').trim();
      if (!result) throw new Error('OpenRouter returned no testimonial content');
      await pool.query(
        'INSERT INTO proof_events(tenant_id,actor_id,event_type,payload) VALUES($1,$2,$3,$4)',
        [req.user.tenantId, req.user.id, 'governed_generation_completed', { sourceText, result }]
      );
      res.json({ result, model: response.data.model, usage: response.data.usage });
    } catch (error) {
      console.error('Governed generation failed:', error.message);
      res.status(502).json({ error: 'Governed generation failed' });
    }
  });

  return router;
};
