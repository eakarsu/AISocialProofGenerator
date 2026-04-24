const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { buildQuery } = require('../utils/queryBuilder');
const { generateCsv } = require('../utils/exportCsv');
const { generatePdf } = require('../utils/exportPdf');

const queryConfig = {
  searchColumns: ['source', 'customer_name', 'original_review', 'ai_summary'],
  filterColumns: ['source', 'rating', 'sentiment'],
  sortableColumns: ['id', 'source', 'customer_name', 'rating', 'sentiment', 'created_at'],
  defaultSort: 'created_at',
  defaultOrder: 'DESC'
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { countQuery, countParams, dataQuery, dataParams, page, limit } = buildQuery('reviews', queryConfig, req.query);
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
    const result = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
    const csv = generateCsv(result.rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=reviews.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/export/pdf', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
    const pdf = await generatePdf(result.rows, 'Reviews Report', ['source', 'customer_name', 'original_review', 'rating', 'sentiment']);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reviews.pdf');
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
    const result = await pool.query(`DELETE FROM reviews WHERE id IN (${placeholders}) RETURNING id`, ids);
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
      await pool.query(`UPDATE reviews SET ${setClause} WHERE id = $${fields.length + 1}`, [...values, id]);
      updated++;
    }
    res.json({ message: `${updated} items updated`, updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reviews WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Review not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { source, customer_name, rating, original_review, ai_summary, sentiment } = req.body;
    if (!source || !original_review) return res.status(400).json({ error: 'Source and original review are required' });
    const result = await pool.query(
      `INSERT INTO reviews (source, customer_name, rating, original_review, ai_summary, sentiment)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [source, customer_name, rating, original_review, ai_summary, sentiment]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { source, customer_name, rating, original_review, ai_summary, sentiment } = req.body;
    const result = await pool.query(
      `UPDATE reviews SET source = COALESCE($1, source), customer_name = COALESCE($2, customer_name),
       rating = COALESCE($3, rating), original_review = COALESCE($4, original_review),
       ai_summary = COALESCE($5, ai_summary), sentiment = COALESCE($6, sentiment)
       WHERE id = $7 RETURNING *`,
      [source, customer_name, rating, original_review, ai_summary, sentiment, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Review not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
