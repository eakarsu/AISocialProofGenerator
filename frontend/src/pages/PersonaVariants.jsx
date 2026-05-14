import { useState } from 'react'
import { Sparkles, Users } from 'lucide-react'

const API_BASE = 'http://localhost:5001'

function getHeaders() {
  const token = localStorage.getItem('token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

const SENTIMENT_OPTIONS = [
  'high_enthusiasm',
  'measured_confidence',
  'reflective',
  'cautious_optimism',
  'urgent_recommendation',
]

export default function PersonaVariants() {
  const [originalText, setOriginalText] = useState('')
  const [testimonialId, setTestimonialId] = useState('')
  const [personasText, setPersonasText] = useState('enterprise_buyer, small_business_owner, technical_evaluator, price_conscious')
  const [targetSentiment, setTargetSentiment] = useState('high_enthusiasm')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const personas = personasText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const body = {
        target_sentiment: targetSentiment,
        personas,
      }
      if (testimonialId) body.testimonial_id = parseInt(testimonialId, 10)
      if (originalText) body.original_text = originalText
      const res = await fetch(`${API_BASE}/api/ai/generate-variants-by-persona`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Variant generation failed')
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-600" /> Persona Variants
        </h1>
        <p className="text-slate-500 mt-1">Sentiment-calibrated testimonial variants for specific buyer personas.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Testimonial ID (optional)</label>
          <input
            type="number"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            value={testimonialId}
            onChange={(e) => setTestimonialId(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Or paste original text</label>
          <textarea
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            rows={4}
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Personas (comma-separated)</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              value={personasText}
              onChange={(e) => setPersonasText(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Sentiment</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              value={targetSentiment}
              onChange={(e) => setTargetSentiment(e.target.value)}
            >
              {SENTIMENT_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || (!testimonialId && !originalText.trim())}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" /> {loading ? 'Generating...' : 'Generate Persona Variants'}
        </button>
      </form>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

      {result && Array.isArray(result.variants) && (
        <div className="space-y-3">
          {result.variants.map((v, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-slate-800">{v.persona}</div>
                <div className="text-xs text-slate-500">{v.tone} · sentiment {typeof v.sentiment_score === 'number' ? v.sentiment_score.toFixed(2) : '-'}</div>
              </div>
              <p className="text-sm text-slate-700 mb-2 whitespace-pre-wrap">{v.text}</p>
              {v.use_case && <div className="text-xs text-slate-500">Use case: {v.use_case}</div>}
              {Array.isArray(v.key_emphasis) && v.key_emphasis.length > 0 && (
                <div className="text-xs text-slate-500 mt-1">Emphasis: {v.key_emphasis.join(', ')}</div>
              )}
            </div>
          ))}
          {result.recommendation && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-800">
              <span className="font-semibold">Recommendation:</span> {result.recommendation}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
