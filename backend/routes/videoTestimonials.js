const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { buildQuery } = require('../utils/queryBuilder');
const { generateCsv } = require('../utils/exportCsv');
const { generatePdf } = require('../utils/exportPdf');

const queryConfig = {
  searchColumns: ['customer_name', 'company', 'role', 'ai_summary', 'tags', 'original_transcript'],
  filterColumns: ['status', 'rating', 'company'],
  sortableColumns: ['id', 'customer_name', 'company', 'role', 'duration', 'rating', 'status', 'created_at'],
  defaultSort: 'created_at',
  defaultOrder: 'DESC'
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { countQuery, countParams, dataQuery, dataParams, page, limit } = buildQuery('video_testimonials', queryConfig, req.query);
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, countParams),
      pool.query(dataQuery, dataParams)
    ]);
    const total = parseInt(countResult.rows[0].total);
    res.json({ data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/export/csv', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM video_testimonials ORDER BY created_at DESC');
    const csv = generateCsv(result.rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=video-testimonials.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/export/pdf', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM video_testimonials ORDER BY created_at DESC');
    const pdf = await generatePdf(result.rows, 'Video Testimonials Report', ['customer_name', 'company', 'role', 'duration', 'ai_summary', 'status']);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=video-testimonials.pdf');
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/bulk', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'IDs array is required' });
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const result = await pool.query(`DELETE FROM video_testimonials WHERE id IN (${placeholders}) RETURNING id`, ids);
    res.json({ message: `${result.rowCount} items deleted`, deleted: result.rowCount });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/bulk', authMiddleware, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !updates) return res.status(400).json({ error: 'IDs array and updates required' });
    let updated = 0;
    for (const id of ids) {
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      await pool.query(`UPDATE video_testimonials SET ${setClause} WHERE id = $${fields.length + 1}`, [...values, id]);
      updated++;
    }
    res.json({ message: `${updated} items updated`, updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM video_testimonials WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Video testimonial not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { customer_name, company, role, video_url, thumbnail_url, duration, original_transcript, ai_edited_transcript, ai_highlights, ai_summary, tags, rating, status } = req.body;
    const result = await pool.query(
      `INSERT INTO video_testimonials (customer_name, company, role, video_url, thumbnail_url, duration, original_transcript, ai_edited_transcript, ai_highlights, ai_summary, tags, rating, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [customer_name, company, role, video_url, thumbnail_url, duration, original_transcript, ai_edited_transcript, ai_highlights, ai_summary, tags, rating || 5, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { customer_name, company, role, video_url, thumbnail_url, duration, original_transcript, ai_edited_transcript, ai_highlights, ai_summary, tags, rating, status } = req.body;
    const result = await pool.query(
      `UPDATE video_testimonials SET customer_name = $1, company = $2, role = $3, video_url = $4, thumbnail_url = $5,
       duration = $6, original_transcript = $7, ai_edited_transcript = $8, ai_highlights = $9,
       ai_summary = $10, tags = $11, rating = $12, status = $13 WHERE id = $14 RETURNING *`,
      [customer_name, company, role, video_url, thumbnail_url, duration, original_transcript, ai_edited_transcript, ai_highlights, ai_summary, tags, rating, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Video testimonial not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM video_testimonials WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Video testimonial not found' });
    res.json({ message: 'Video testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
