import AIReport from '../components/AIReport'
import FullFieldPresets from '../components/FullFieldPresets'
import { useState } from 'react'
import { Sparkles, Star } from 'lucide-react'

const API_BASE = ''

function getHeaders() {
  const token = localStorage.getItem('token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

export default function TestimonialLikelihood() {
  const [customerIdsText, setCustomerIdsText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const ids = customerIdsText
        .split(/[\s,]+/)
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n))
      const body = ids.length ? { customerIds: ids } : {}
      const res = await fetch(`${API_BASE}/api/ai/score-testimonial-likelihood`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Scoring failed')
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
          <Star className="w-6 h-6 text-indigo-600" /> Testimonial Likelihood
        </h1>
        <p className="text-slate-500 mt-1">Predict which customers will provide strong testimonials.</p>
      </div>

      <form onSubmit={handleGenerate} className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <FullFieldPresets value={{ customerIdsText }} presets={[
          { label: 'Recent customers', values: { customerIdsText: '' } },
          { label: 'Current selection', values: { customerIdsText } },
          { label: 'All recent', values: { customerIdsText: '' } },
        ]} disabled={loading} onChange={(next) => setCustomerIdsText(next.customerIdsText)} />
        <p className="text-xs text-slate-500 mb-3">Customer IDs must come from real records. These examples use the recent-customer mode or preserve your current selection.</p>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Customer IDs (comma or space separated; leave blank for recent customers)
        </label>
        <input
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g. 12, 34, 56"
          value={customerIdsText}
          onChange={(e) => setCustomerIdsText(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" /> {loading ? 'Scoring...' : 'Score Likelihood'}
        </button>
      </form>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

      <AIReport response={result} title="Testimonial likelihood" />
    </div>
  )
}
