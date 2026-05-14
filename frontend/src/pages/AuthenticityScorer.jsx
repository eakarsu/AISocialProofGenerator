import { useState } from 'react'
import { Sparkles, ShieldCheck } from 'lucide-react'

const API_BASE = 'http://localhost:5001'

function getHeaders() {
  const token = localStorage.getItem('token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

export default function AuthenticityScorer() {
  const [text, setText] = useState('')
  const [source, setSource] = useState('')
  const [authorContext, setAuthorContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${API_BASE}/api/ai/score-authenticity`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text, source: source || undefined, author_context: authorContext || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Authenticity scoring failed')
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
          <ShieldCheck className="w-6 h-6 text-indigo-600" /> Authenticity Scorer
        </h1>
        <p className="text-slate-500 mt-1">Detect AI-generated, scripted, or fabricated social proof.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Content (testimonial / review / quote)</label>
          <textarea
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Source (optional)</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. G2, Trustpilot, email, LinkedIn"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Author Context (optional)</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. verified buyer, CTO of mid-size SaaS"
              value={authorContext}
              onChange={(e) => setAuthorContext(e.target.value)}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" /> {loading ? 'Scoring...' : 'Score Authenticity'}
        </button>
      </form>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

      {result && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-indigo-600">{result.authenticity_score ?? '-'}</div>
            <div>
              <div className="text-sm text-slate-500">Verdict</div>
              <div className="font-semibold text-slate-800">{result.verdict || 'unknown'}</div>
            </div>
            {typeof result.ai_generated_probability === 'number' && (
              <div>
                <div className="text-sm text-slate-500">AI-Generated Probability</div>
                <div className="font-semibold text-slate-800">{Math.round(result.ai_generated_probability * 100)}%</div>
              </div>
            )}
          </div>
          {result.summary && <p className="text-sm text-slate-600">{result.summary}</p>}
          {result.signals && (
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {Object.entries(result.signals).map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-lg p-3">
                  <div className="font-semibold text-slate-700 capitalize">{k.replace('_', ' ')}</div>
                  <ul className="list-disc list-inside text-slate-600">
                    {Array.isArray(v) ? v.map((item, i) => <li key={i}>{item}</li>) : <li>{String(v)}</li>}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {result.recommendation && (
            <div className="text-sm">
              <span className="font-semibold text-slate-700">Recommendation:</span>{' '}
              <span className="text-slate-600">{result.recommendation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
