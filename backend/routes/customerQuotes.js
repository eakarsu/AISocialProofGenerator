const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { buildQuery } = require('../utils/queryBuilder');
const { generateCsv } = require('../utils/exportCsv');
const { generatePdf } = require('../utils/exportPdf');

const queryConfig = {
  searchColumns: ['customer_name', 'company', 'original_quote', 'polished_quote', 'use_case'],
  filterColumns: ['use_case', 'company'],
  sortableColumns: ['id', 'customer_name', 'company', 'use_case', 'created_at'],
  defaultSort: 'created_at',
  defaultOrder: 'DESC'
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { countQuery, countParams, dataQuery, dataParams, page, limit } = buildQuery('customer_quotes', queryConfig, req.query);
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
    const result = await pool.query('SELECT * FROM customer_quotes ORDER BY created_at DESC');
    const csv = generateCsv(result.rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customer-quotes.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/export/pdf', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customer_quotes ORDER BY created_at DESC');
    const pdf = await generatePdf(result.rows, 'Customer Quotes Report', ['customer_name', 'company', 'original_quote', 'polished_quote', 'use_case']);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=customer-quotes.pdf');
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
    const result = await pool.query(`DELETE FROM customer_quotes WHERE id IN (${placeholders}) RETURNING id`, ids);
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
      await pool.query(`UPDATE customer_quotes SET ${setClause} WHERE id = $${fields.length + 1}`, [...values, id]);
      updated++;
    }
    res.json({ message: `${updated} items updated`, updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customer_quotes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer quote not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { customer_name, company, original_quote, polished_quote, use_case } = req.body;
    if (!customer_name || !original_quote) return res.status(400).json({ error: 'Customer name and original quote are required' });
    const result = await pool.query(
      `INSERT INTO customer_quotes (customer_name, company, original_quote, polished_quote, use_case) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [customer_name, company, original_quote, polished_quote, use_case]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { customer_name, company, original_quote, polished_quote, use_case } = req.body;
    const result = await pool.query(
      `UPDATE customer_quotes SET customer_name = COALESCE($1, customer_name), company = COALESCE($2, company),
       original_quote = COALESCE($3, original_quote), polished_quote = COALESCE($4, polished_quote),
       use_case = COALESCE($5, use_case) WHERE id = $6 RETURNING *`,
      [customer_name, company, original_quote, polished_quote, use_case, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer quote not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM customer_quotes WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer quote not found' });
    res.json({ message: 'Customer quote deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
