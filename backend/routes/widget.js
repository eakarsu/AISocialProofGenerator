const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /widget/:id.js - serve embeddable widget JavaScript (no auth required)
router.get('/:id.js', async (req, res) => {
  try {
    const widgetResult = await pool.query('SELECT * FROM social_widgets WHERE id = $1', [req.params.id]);
    if (widgetResult.rows.length === 0) {
      res.setHeader('Content-Type', 'application/javascript');
      res.status(404).send(`/* Widget ${req.params.id} not found */`);
      return;
    }

    const widget = widgetResult.rows[0];

    // Fetch related testimonials if the widget has a tag or type
    let testimonials = [];
    try {
      const testimonialsResult = await pool.query(
        "SELECT customer_name, company, role, ai_enhanced_text, original_text, rating FROM testimonials WHERE status = 'approved' ORDER BY RANDOM() LIMIT 3"
      );
      testimonials = testimonialsResult.rows;
    } catch {}

    const widgetData = {
      id: widget.id,
      title: widget.title,
      type: widget.widget_type,
      content: widget.content,
      stats: widget.stats_json,
      testimonials
    };

    const script = `
(function() {
  var __widgetData = ${JSON.stringify(widgetData)};
  var __config = window.SocialProofWidget && window.SocialProofWidget.config ? window.SocialProofWidget.config : {};

  function createWidget() {
    var container = document.getElementById('social-proof-widget-${widget.id}') || document.querySelector('[data-widget-id="${widget.id}"]');
    if (!container) {
      console.warn('[SocialProofWidget] No container found. Add <div id="social-proof-widget-${widget.id}"></div> to your page.');
      return;
    }

    var styles = \`
      .spw-container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .spw-title { font-size: 1.25rem; font-weight: 700; color: #1a1a2e; margin-bottom: 1rem; }
      .spw-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
      .spw-stars { color: #fbbf24; font-size: 1rem; margin-bottom: 0.5rem; }
      .spw-text { color: #374151; font-size: 0.95rem; line-height: 1.6; margin-bottom: 0.75rem; font-style: italic; }
      .spw-author { font-size: 0.8rem; font-weight: 600; color: #6b7280; }
      .spw-badge { display: inline-block; background: #eef2ff; color: #6366f1; font-size: 0.7rem; padding: 2px 8px; border-radius: 9999px; margin-top: 0.5rem; }
    \`;

    var styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    var stars = function(n) { return Array(Math.min(5, Math.max(0, parseInt(n) || 5))).fill('\\u2605').join(''); };

    var html = '<div class="spw-container">';
    if (__widgetData.title) {
      html += '<div class="spw-title">' + __widgetData.title + '</div>';
    }

    if (__widgetData.testimonials && __widgetData.testimonials.length > 0) {
      __widgetData.testimonials.forEach(function(t) {
        var text = t.ai_enhanced_text || t.original_text || '';
        if (text.length > 250) text = text.substring(0, 250) + '...';
        html += '<div class="spw-card">';
        html += '<div class="spw-stars">' + stars(t.rating) + '</div>';
        html += '<div class="spw-text">&ldquo;' + text + '&rdquo;</div>';
        html += '<div class="spw-author">' + (t.customer_name || 'Anonymous') + (t.role ? ', ' + t.role : '') + (t.company ? ' at ' + t.company : '') + '</div>';
        html += '</div>';
      });
    } else if (__widgetData.content) {
      html += '<div class="spw-card"><div class="spw-text">' + __widgetData.content + '</div></div>';
    }
    html += '<div class="spw-badge">Powered by AI Social Proof</div>';
    html += '</div>';

    container.innerHTML = html;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
`;

    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 min cache
    res.send(script);
  } catch (err) {
    res.setHeader('Content-Type', 'application/javascript');
    res.status(500).send(`/* Widget error: ${err.message} */`);
  }
});

// GET /widget/:id/preview - returns widget config as JSON for builder preview
router.get('/:id/preview', async (req, res) => {
  try {
    const widgetResult = await pool.query('SELECT * FROM social_widgets WHERE id = $1', [req.params.id]);
    if (widgetResult.rows.length === 0) return res.status(404).json({ error: 'Widget not found' });
    const widget = widgetResult.rows[0];

    let testimonials = [];
    try {
      const r = await pool.query("SELECT customer_name, company, role, ai_enhanced_text, original_text, rating FROM testimonials WHERE status = 'approved' ORDER BY RANDOM() LIMIT 3");
      testimonials = r.rows;
    } catch {}

    const scriptTag = `<div id="social-proof-widget-${widget.id}"></div>\n<script src="${process.env.API_URL || 'http://localhost:5001'}/widget/${widget.id}.js"></script>`;

    res.json({ widget, testimonials, script_tag: scriptTag });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
