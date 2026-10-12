import AIReport from '../components/AIReport'
import FullFieldPresets from '../components/FullFieldPresets'
import { useState } from 'react'
import { Sparkles, Users } from 'lucide-react'

const API_BASE = ''

function getHeaders() {
  const token = localStorage.getItem('token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

export default function CustomerSegmentation() {
  const [criteria, setCriteria] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${API_BASE}/api/ai/segment-customers`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ criteria }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Segmentation failed')
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
          <Users className="w-6 h-6 text-indigo-600" /> Customer Segmentation
        </h1>
        <p className="text-slate-500 mt-1">Cluster customers into testimonial-targeting segments.</p>
      </div>

      <form onSubmit={handleGenerate} className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <FullFieldPresets value={{ criteria }} presets={[
          { label: 'Lifecycle', values: { criteria: 'Group customers by onboarding stage, product adoption, renewal date, and consent to provide a testimonial.' } },
          { label: 'Advocacy', values: { criteria: 'Group customers by satisfaction feedback, support outcomes, public review history, and outreach readiness.' } },
          { label: 'Plan and use case', values: { criteria: 'Group customers by plan tier, primary use case, company size, and measured outcome. Flag missing data.' } },
        ]} disabled={loading} onChange={(next) => setCriteria(next.criteria)} />
        <label className="block text-sm font-medium text-slate-700 mb-1">Segmentation Criteria (optional)</label>
        <input
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g. behavior, lifecycle, plan tier, advocacy potential"
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" /> {loading ? 'Segmenting...' : 'Run Segmentation'}
        </button>
      </form>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

      <AIReport response={result} title="Customer segmentation" />
    </div>
  )
}
