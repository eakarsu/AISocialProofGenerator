// === Custom Views: 4 features (2 VIZ + 2 NON-VIZ) ===
// VIZ: testimonial collection chart, platform engagement heatmap
// NON-VIZ: brand asset kit PDF, display/placement rules CRUD editor
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const PDFDocument = require('pdfkit');

let ipKeyGenerator = null;
try {
  ({ ipKeyGenerator } = require('express-rate-limit'));
} catch (_) {}

// Scoped limiter (uses ipKeyGenerator helper for IPv6 safety)
const customViewsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    return ipKeyGenerator ? ipKeyGenerator(ip) : ip.replace(/^::ffff:/, '');
  },
  message: { error: 'Too many requests on custom-views.' }
});
router.use(customViewsLimiter);

// In-memory store for display/placement widget rules
const widgetRules = [
  { id: 1, name: 'Homepage Hero Testimonial', placement: 'homepage_hero', widget_type: 'testimonial_card', priority: 10, active: true, conditions: 'rating >= 4', created_at: new Date().toISOString() },
  { id: 2, name: 'Checkout Trust Badges', placement: 'checkout', widget_type: 'trust_badge', priority: 9, active: true, conditions: 'cart_value > 50', created_at: new Date().toISOString() },
  { id: 3, name: 'Pricing Page Quotes', placement: 'pricing', widget_type: 'quote_strip', priority: 7, active: true, conditions: 'industry = saas', created_at: new Date().toISOString() },
  { id: 4, name: 'Blog Sidebar Reviews', placement: 'blog_sidebar', widget_type: 'review_carousel', priority: 5, active: false, conditions: 'source = G2', created_at: new Date().toISOString() }
];
let nextRuleId = 5;

// === VIZ 1: Testimonial collection chart (time-series + by-source breakdown) ===
router.get('/testimonial-collection-chart', (req, res) => {
  const days = Math.max(1, Math.min(60, parseInt(req.query.days, 10) || 14));
  const labels = [];
  const collected = [];
  const approved = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    labels.push(d.toISOString().slice(5, 10));
    const base = 4 + ((d.getDate() * 7 + d.getMonth() * 13) % 11);
    const apr = Math.max(1, Math.round(base * 0.7));
    collected.push(base);
    approved.push(apr);
  }
  const sources = [
    { source: 'G2', count: 38 },
    { source: 'Trustpilot', count: 27 },
    { source: 'Capterra', count: 22 },
    { source: 'Direct', count: 41 },
    { source: 'Email Outreach', count: 19 }
  ];
  res.json({
    success: true,
    feature: 'testimonial-collection-chart',
    kind: 'viz',
    range_days: days,
    series: { labels, collected, approved },
    totals: {
      collected: collected.reduce((a, b) => a + b, 0),
      approved: approved.reduce((a, b) => a + b, 0)
    },
    sources
  });
});

// === VIZ 2: Platform engagement heatmap (day-of-week x hour) ===
router.get('/platform-engagement-heatmap', (req, res) => {
  const dow = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const matrix = dow.map((_, dayIdx) =>
    hours.map((h) => {
      // synthetic engagement intensity 0-100
      const peakHour = (10 + (dayIdx % 3) * 2);
      const dist = Math.abs(h - peakHour);
      const weekend = dayIdx >= 5 ? 0.55 : 1;
      const base = Math.max(0, 95 - dist * 7) * weekend;
      const jitter = ((dayIdx * 17 + h * 11) % 13) - 6;
      return Math.max(0, Math.min(100, Math.round(base + jitter)));
    })
  );
  const peakCells = [];
  matrix.forEach((row, di) =>
    row.forEach((v, hi) => {
      if (v >= 75) peakCells.push({ day: dow[di], hour: hi, value: v });
    })
  );
  res.json({
    success: true,
    feature: 'platform-engagement-heatmap',
    kind: 'viz',
    days_of_week: dow,
    hours,
    matrix,
    peak_cells: peakCells.slice(0, 12),
    metric: 'widget_impressions_index'
  });
});

// === NON-VIZ 1: Brand asset kit PDF download ===
router.get('/brand-asset-kit', (req, res) => {
  try {
    const brand = (req.query.brand || 'Social Proof Studio').toString().slice(0, 80);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${brand.replace(/[^a-z0-9]+/gi, '_')}_brand_kit.pdf"`);
    doc.pipe(res);

    doc.fillColor('#1e1b4b').fontSize(28).text(`${brand}`, { align: 'left' });
    doc.moveDown(0.3);
    doc.fillColor('#6366f1').fontSize(14).text('Brand Asset Kit', { align: 'left' });
    doc.moveDown(1);
    doc.strokeColor('#c7d2fe').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    doc.fillColor('#0f172a').fontSize(16).text('Color Palette', { underline: false });
    doc.moveDown(0.5);
    const palette = [
      { name: 'Indigo Primary', hex: '#4f46e5' },
      { name: 'Violet Accent', hex: '#7c3aed' },
      { name: 'Slate 900', hex: '#0f172a' },
      { name: 'Slate 500', hex: '#64748b' },
      { name: 'Emerald Trust', hex: '#10b981' }
    ];
    palette.forEach((c) => {
      const y = doc.y;
      doc.rect(50, y, 40, 20).fillAndStroke(c.hex, '#1e293b');
      doc.fillColor('#0f172a').fontSize(11).text(`${c.name}  ${c.hex}`, 100, y + 5);
      doc.moveDown(1);
    });

    doc.moveDown(0.5);
    doc.fillColor('#0f172a').fontSize(16).text('Typography');
    doc.moveDown(0.3);
    doc.fillColor('#334155').fontSize(12).text('Primary: Inter (UI), Heading: Inter SemiBold, Body: Inter Regular.');
    doc.text('Fallback: -apple-system, system-ui, "Segoe UI", Roboto.');
    doc.moveDown(0.8);

    doc.fillColor('#0f172a').fontSize(16).text('Logo Usage');
    doc.moveDown(0.3);
    doc.fillColor('#334155').fontSize(11);
    doc.text('- Minimum padding: 12px on all sides.');
    doc.text('- Do not stretch, rotate, or recolor the wordmark.');
    doc.text('- On dark backgrounds, use the white/violet gradient variant.');
    doc.moveDown(0.8);

    doc.fillColor('#0f172a').fontSize(16).text('Voice & Tone');
    doc.moveDown(0.3);
    doc.fillColor('#334155').fontSize(11);
    doc.text('Confident, evidence-led, customer-quoted. Avoid hype words; favor metrics.');

    doc.moveDown(1);
    doc.fillColor('#94a3b8').fontSize(9).text(`Generated ${new Date().toISOString()} - AISocialProofGenerator`, { align: 'center' });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to generate brand kit PDF.' });
  }
});

// === NON-VIZ 2: Display/placement rules editor (CRUD) ===
router.get('/widget-rules', (req, res) => {
  res.json({ success: true, feature: 'widget-rules', kind: 'non_viz', total: widgetRules.length, rules: widgetRules });
});

router.post('/widget-rules', (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.placement) {
    return res.status(400).json({ error: 'name and placement are required.' });
  }
  const rule = {
    id: nextRuleId++,
    name: String(body.name).slice(0, 120),
    placement: String(body.placement).slice(0, 60),
    widget_type: String(body.widget_type || 'testimonial_card').slice(0, 60),
    priority: Number.isFinite(+body.priority) ? +body.priority : 5,
    active: body.active !== false,
    conditions: String(body.conditions || '').slice(0, 240),
    created_at: new Date().toISOString()
  };
  widgetRules.unshift(rule);
  res.status(201).json({ success: true, rule });
});

router.put('/widget-rules/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = widgetRules.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found.' });
  const body = req.body || {};
  widgetRules[idx] = {
    ...widgetRules[idx],
    ...(body.name !== undefined ? { name: String(body.name).slice(0, 120) } : {}),
    ...(body.placement !== undefined ? { placement: String(body.placement).slice(0, 60) } : {}),
    ...(body.widget_type !== undefined ? { widget_type: String(body.widget_type).slice(0, 60) } : {}),
    ...(body.priority !== undefined ? { priority: +body.priority } : {}),
    ...(body.active !== undefined ? { active: !!body.active } : {}),
    ...(body.conditions !== undefined ? { conditions: String(body.conditions).slice(0, 240) } : {})
  };
  res.json({ success: true, rule: widgetRules[idx] });
});

router.delete('/widget-rules/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = widgetRules.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found.' });
  const [removed] = widgetRules.splice(idx, 1);
  res.json({ success: true, removed });
});

module.exports = router;
