import AIReport from '../components/AIReport'
import FullFieldPresets from '../components/FullFieldPresets'
import { useState } from 'react'
import { Sparkles, Users } from 'lucide-react'

const API_BASE = ''

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
        <FullFieldPresets value={{ testimonialId, originalText, personasText, targetSentiment }} presets={[
          { label: 'Enterprise buyer', values: { originalText: 'Our deployment process is more consistent, and the team can now review the same dashboard each morning. We are still measuring the longer-term savings.', personasText: 'enterprise_buyer, technical_evaluator', targetSentiment: 'measured_confidence' } },
          { label: 'Small business', values: { originalText: 'We had limited time for setup, but the core workflow was running in a week. The support team answered our questions quickly.', personasText: 'small_business_owner, price_conscious', targetSentiment: 'reflective' } },
          { label: 'Technical review', values: { originalText: 'The API integration took two days of engineering work. Documentation was clear, and our error rate declined after launch.', personasText: 'technical_evaluator, enterprise_buyer', targetSentiment: 'cautious_optimism' } },
        ]} disabled={loading} onChange={(next) => { setOriginalText(next.originalText); setPersonasText(next.personasText); setTargetSentiment(next.targetSentiment) }} />
        <p className="text-xs text-slate-500">Any testimonial ID already entered is preserved and must refer to a real record.</p>
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

      <AIReport response={result} title="Persona variants" />
    </div>
  )
}
