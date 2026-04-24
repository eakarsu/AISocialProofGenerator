const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { buildQuery } = require('../utils/queryBuilder');
const { generateCsv } = require('../utils/exportCsv');
const { generatePdf } = require('../utils/exportPdf');

const queryConfig = {
  searchColumns: ['title', 'company', 'industry', 'challenge', 'solution', 'results'],
  filterColumns: ['industry'],
  sortableColumns: ['id', 'title', 'company', 'industry', 'created_at'],
  defaultSort: 'created_at',
  defaultOrder: 'DESC'
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { countQuery, countParams, dataQuery, dataParams, page, limit } = buildQuery('case_studies', queryConfig, req.query);
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, countParams),
      pool.query(dataQuery, dataParams)
    ]);
    const total = parseInt(countResult.rows[0].total);
    res.json({ data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get case studies error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/export/csv', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM case_studies ORDER BY created_at DESC');
    const csv = generateCsv(result.rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=case-studies.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/export/pdf', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM case_studies ORDER BY created_at DESC');
    const pdf = await generatePdf(result.rows, 'Case Studies Report', ['title', 'company', 'industry', 'challenge', 'results']);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=case-studies.pdf');
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
    const result = await pool.query(`DELETE FROM case_studies WHERE id IN (${placeholders}) RETURNING id`, ids);
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
      await pool.query(`UPDATE case_studies SET ${setClause} WHERE id = $${fields.length + 1}`, [...values, id]);
      updated++;
    }
    res.json({ message: `${updated} items updated`, updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM case_studies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Case study not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { title, company, industry, challenge, solution, results, metrics_json } = req.body;
    if (!title || !company || !challenge || !solution || !results) {
      return res.status(400).json({ error: 'Title, company, challenge, solution, and results are required' });
    }
    const result = await pool.query(
      `INSERT INTO case_studies (title, company, industry, challenge, solution, results, metrics_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, company, industry, challenge, solution, results, JSON.stringify(metrics_json)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { title, company, industry, challenge, solution, results, metrics_json } = req.body;
    const result = await pool.query(
      `UPDATE case_studies SET title = COALESCE($1, title), company = COALESCE($2, company),
       industry = COALESCE($3, industry), challenge = COALESCE($4, challenge),
       solution = COALESCE($5, solution), results = COALESCE($6, results),
       metrics_json = COALESCE($7, metrics_json) WHERE id = $8 RETURNING *`,
      [title, company, industry, challenge, solution, results, metrics_json ? JSON.stringify(metrics_json) : null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Case study not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM case_studies WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Case study not found' });
    res.json({ message: 'Case study deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
