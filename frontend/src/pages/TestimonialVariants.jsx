import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw, Copy, CheckCircle } from 'lucide-react'

const API_BASE = 'http://localhost:5001'

function getHeaders() {
  const token = localStorage.getItem('token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

const TONE_COLORS = {
  formal: 'border-blue-200 bg-blue-50',
  casual: 'border-green-200 bg-green-50',
  enthusiastic: 'border-orange-200 bg-orange-50',
}

const TONE_BADGE = {
  formal: 'bg-blue-100 text-blue-700',
  casual: 'bg-green-100 text-green-700',
  enthusiastic: 'bg-orange-100 text-orange-700',
}

export default function TestimonialVariants() {
  const [testimonials, setTestimonials] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [customText, setCustomText] = useState('')
  const [loading, setLoading] = useState(false)
  const [variants, setVariants] = useState(null)
  const [error, setError] = useState(null)
  const [copiedIdx, setCopiedIdx] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/testimonials?limit=50`, { headers: getHeaders() })
      .then(r => r.json())
      .then(data => setTestimonials(data.data || []))
      .catch(console.error)
  }, [])

  const handleGenerate = async () => {
    setLoading(true); setError(null); setVariants(null)
    try {
      const body = selectedId ? { testimonial_id: parseInt(selectedId) } : { original_text: customText }
      const res = await fetch(`${API_BASE}/api/ai/generate-variants`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setVariants(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" /> Testimonial A/B Variants
        </h1>
        <p className="text-slate-500 mt-1">AI generates 3 tone variants (formal, casual, enthusiastic) for A/B testing your testimonials.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Existing Testimonial</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              value={selectedId}
              onChange={e => { setSelectedId(e.target.value); setCustomText('') }}
            >
              <option value="">-- Or enter custom text below --</option>
              {testimonials.map(t => (
                <option key={t.id} value={t.id}>{t.customer_name || 'Unknown'} - {(t.original_text || '').substring(0, 60)}...</option>
              ))}
            </select>
          </div>

          {!selectedId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Or Enter Custom Text</label>
              <textarea
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Paste testimonial text here..."
                value={customText}
                onChange={e => setCustomText(e.target.value)}
              />
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || (!selectedId && !customText)}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Variants...</> : <><Sparkles className="w-4 h-4" /> Generate 3 Variants</>}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4">{error}</div>}

      {variants?.variants && (
        <div className="space-y-4">
          {variants.variants.map((v, i) => (
            <div key={i} className={`rounded-xl border p-5 ${TONE_COLORS[v.tone] || 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide ${TONE_BADGE[v.tone] || 'bg-gray-100 text-gray-700'}`}>
                  {v.tone}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{v.use_case}</span>
                  <button
                    onClick={() => handleCopy(v.text, i)}
                    className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 hover:border-slate-300 text-slate-600"
                  >
                    {copiedIdx === i ? <><CheckCircle className="w-3 h-3 text-green-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed italic">"{v.text}"</p>
            </div>
          ))}

          {variants.recommendation && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-sm font-medium text-indigo-700 mb-1">AI Recommendation</p>
              <p className="text-sm text-indigo-600">{variants.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
