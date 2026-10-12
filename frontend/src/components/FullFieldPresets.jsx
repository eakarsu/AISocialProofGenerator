import React from 'react';

export function fillEveryField(values, variant = 0, choices = {}) {
  const names = ['Customer testimonial', 'Product review', 'Case study'];
  return Object.fromEntries(Object.entries(values).map(([key, value]) => {
    if (['id', 'created_at', 'updated_at', 'user_id', 'selectedId', 'customerIdsText'].includes(key) || /(?:^|_)(?:id|file|upload)$/.test(key)) return [key, value];
    if (key === 'ai_suggestions') return [key, {}];
    if (choices[key]) return [key, choices[key][variant % choices[key].length]];
    if (Array.isArray(value)) return [key, [`${names[variant]} example`, 'Verify customer consent and supporting evidence']];
    if (value && typeof value === 'object') return [key, { source: 'Customer supplied feedback', consent_verified: false }];
    if (typeof value === 'boolean') return [key, true];
    if (/date|deadline|valid_until/.test(key)) return [key, new Date(Date.now() + (variant + 7) * 86400000).toISOString().slice(0, key === 'scheduled_date' ? 16 : 10)];
    if (/email/.test(key)) return [key, `client${variant + 1}@example.com`];
    if (/photo_name|filename|image|avatar|video|url/.test(key)) return [key, value];
    if (/budget|price|cost|amount/.test(key)) return [key, [2400, 650, 4200][variant]];
    if (/duration/.test(key)) return [key, [6, 2, 8][variant]];
    if (/crew|party_size/.test(key)) return [key, [3, 2, 5][variant]];
    if (/travel/.test(key)) return [key, [25, 8, 40][variant]];
    if (/deliverables/.test(key)) return [key, [250, 35, 80][variant]];
    if (/experience/.test(key)) return [key, [6, 4, 8][variant]];
    if (typeof value === 'number') return [key, [3, 2, 5][variant]];
    if (/location|address|market/.test(key)) return [key, ['North America SaaS market', 'Online retail market', 'Healthcare services market'][variant]];
    if (/status/.test(key)) return [key, 'Pending'];
    if (/tone/.test(key)) return [key, ['Warm and polished', 'Friendly and concise', 'Confident and professional'][variant]];
    if (/type/.test(key)) return [key, ['Testimonial', 'Review', 'Case study'][variant]];
    if (/title|name/.test(key)) return [key, names[variant]];
    return [key, `${names[variant]} example: summarize the customer's stated outcome, distinguish measured results from estimates, verify consent and source evidence, and flag unconfirmed claims before publication.`];
  }));
}

export function mergePresetValues(current, sample) {
  const next = { ...current, ...sample };
  for (const [key, value] of Object.entries(current)) {
    if (/^(?:id|.*_id|.*Id|selectedId|customerIdsText|.*_file|file|upload)$/.test(key) && value !== '' && value !== null && value !== undefined) next[key] = value;
  }
  return next;
}

export default function FullFieldPresets({ value, onChange, choices = {}, presets, disabled = false }) {
  const labels = presets ? presets.map((preset) => preset.label) : ['Testimonial example', 'Review example', 'Case study example'];
  return <div className="ai-preset-bar"><div><strong>Fill every field</strong><p>Each example fills required and optional fields. Review and edit before generating.</p></div><div className="ai-actions">{labels.map((label, index) => <button type="button" className="btn btn-secondary" key={label} disabled={disabled} onClick={() => onChange(presets ? mergePresetValues(value, presets[index].values) : fillEveryField(value, index, choices))}>{label}</button>)}</div></div>;
}
