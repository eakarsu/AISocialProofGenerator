const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { buildQuery } = require('../utils/queryBuilder');
const { generateCsv } = require('../utils/exportCsv');
const { generatePdf } = require('../utils/exportPdf');

const queryConfig = {
  searchColumns: ['customer_name', 'company', 'role', 'original_text', 'ai_enhanced_text'],
  filterColumns: ['rating', 'company'],
  sortableColumns: ['id', 'customer_name', 'company', 'role', 'rating', 'created_at'],
  defaultSort: 'created_at',
  defaultOrder: 'DESC'
};

// Get all testimonials (paginated)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { countQuery, countParams, dataQuery, dataParams, page, limit } = buildQuery('testimonials', queryConfig, req.query);
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, countParams),
      pool.query(dataQuery, dataParams)
    ]);
    const total = parseInt(countResult.rows[0].total);
    res.json({ data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export CSV
router.get('/export/csv', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM testimonials ORDER BY created_at DESC');
    const csv = generateCsv(result.rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=testimonials.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export PDF
router.get('/export/pdf', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM testimonials ORDER BY created_at DESC');
    const pdf = await generatePdf(result.rows, 'Testimonials Report', ['customer_name', 'company', 'role', 'original_text', 'rating']);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=testimonials.pdf');
    res.send(pdf);
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Bulk delete
router.delete('/bulk', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const result = await pool.query(`DELETE FROM testimonials WHERE id IN (${placeholders}) RETURNING id`, ids);
    res.json({ message: `${result.rowCount} items deleted`, deleted: result.rowCount });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Bulk update
router.put('/bulk', authMiddleware, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !updates) {
      return res.status(400).json({ error: 'IDs array and updates object are required' });
    }
    let updated = 0;
    for (const id of ids) {
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      await pool.query(`UPDATE testimonials SET ${setClause} WHERE id = $${fields.length + 1}`, [...values, id]);
      updated++;
    }
    res.json({ message: `${updated} items updated`, updated });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single testimonial
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM testimonials WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get testimonial error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create testimonial
router.post('/', authMiddleware, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { customer_name, company, role, original_text, ai_enhanced_text, rating, avatar_url } = req.body;
    if (!customer_name || !original_text) {
      return res.status(400).json({ error: 'Customer name and original text are required' });
    }
    const result = await pool.query(
      `INSERT INTO testimonials (customer_name, company, role, original_text, ai_enhanced_text, rating, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [customer_name, company, role, original_text, ai_enhanced_text, rating, avatar_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update testimonial
router.put('/:id', authMiddleware, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, company, role, original_text, ai_enhanced_text, rating, avatar_url } = req.body;
    const result = await pool.query(
      `UPDATE testimonials
       SET customer_name = COALESCE($1, customer_name), company = COALESCE($2, company),
           role = COALESCE($3, role), original_text = COALESCE($4, original_text),
           ai_enhanced_text = COALESCE($5, ai_enhanced_text), rating = COALESCE($6, rating),
           avatar_url = COALESCE($7, avatar_url)
       WHERE id = $8 RETURNING *`,
      [customer_name, company, role, original_text, ai_enhanced_text, rating, avatar_url, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete testimonial
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM testimonials WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    res.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
