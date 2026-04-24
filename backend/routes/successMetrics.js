const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { buildQuery } = require('../utils/queryBuilder');
const { generateCsv } = require('../utils/exportCsv');
const { generatePdf } = require('../utils/exportPdf');

const queryConfig = {
  searchColumns: ['metric_name', 'value', 'context', 'ai_description'],
  filterColumns: ['icon'],
  sortableColumns: ['id', 'metric_name', 'value', 'icon', 'created_at'],
  defaultSort: 'created_at',
  defaultOrder: 'DESC'
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { countQuery, countParams, dataQuery, dataParams, page, limit } = buildQuery('success_metrics', queryConfig, req.query);
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
    const result = await pool.query('SELECT * FROM success_metrics ORDER BY created_at DESC');
    const csv = generateCsv(result.rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=success-metrics.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/export/pdf', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM success_metrics ORDER BY created_at DESC');
    const pdf = await generatePdf(result.rows, 'Success Metrics Report', ['metric_name', 'value', 'context', 'ai_description', 'icon']);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=success-metrics.pdf');
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
    const result = await pool.query(`DELETE FROM success_metrics WHERE id IN (${placeholders}) RETURNING id`, ids);
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
      await pool.query(`UPDATE success_metrics SET ${setClause} WHERE id = $${fields.length + 1}`, [...values, id]);
      updated++;
    }
    res.json({ message: `${updated} items updated`, updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM success_metrics WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Success metric not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { metric_name, value, context, ai_description, icon } = req.body;
    if (!metric_name || !value) return res.status(400).json({ error: 'Metric name and value are required' });
    const result = await pool.query(
      `INSERT INTO success_metrics (metric_name, value, context, ai_description, icon) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [metric_name, value, context, ai_description, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { metric_name, value, context, ai_description, icon } = req.body;
    const result = await pool.query(
      `UPDATE success_metrics SET metric_name = COALESCE($1, metric_name), value = COALESCE($2, value),
       context = COALESCE($3, context), ai_description = COALESCE($4, ai_description), icon = COALESCE($5, icon)
       WHERE id = $6 RETURNING *`,
      [metric_name, value, context, ai_description, icon, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Success metric not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM success_metrics WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Success metric not found' });
    res.json({ message: 'Success metric deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
