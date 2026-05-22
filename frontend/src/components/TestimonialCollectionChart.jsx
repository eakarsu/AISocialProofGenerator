import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:5001/api/custom-views'

function TestimonialCollectionChart() {
  const [data, setData] = useState(null)
  const [days, setDays] = useState(14)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancel = false
    axios.get(`${API_URL}/testimonial-collection-chart?days=${days}`)
      .then((r) => { if (!cancel) setData(r.data) })
      .catch((e) => { if (!cancel) setError(e.message || 'Failed to load chart.') })
    return () => { cancel = true }
  }, [days])

  if (error) return <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl">{error}</div>
  if (!data) return <div className="p-4 text-sm text-slate-500">Loading testimonial collection data…</div>

  const max = Math.max(1, ...data.series.collected)
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Testimonial Collection</h3>
          <p className="text-xs text-slate-500">Collected vs approved over the last {days} days</p>
        </div>
        <select
          aria-label="range"
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1"
        >
          <option value={7}>7d</option>
          <option value={14}>14d</option>
          <option value={30}>30d</option>
        </select>
      </div>
      <svg viewBox="0 0 600 180" className="w-full h-44">
        {data.series.labels.map((lab, i) => {
          const w = 600 / data.series.labels.length
          const x = i * w
          const hC = (data.series.collected[i] / max) * 140
          const hA = (data.series.approved[i] / max) * 140
          return (
            <g key={lab}>
              <rect x={x + 4} y={160 - hC} width={(w - 12) / 2} height={hC} fill="#6366f1" rx="3" />
              <rect x={x + 4 + (w - 12) / 2 + 2} y={160 - hA} width={(w - 12) / 2} height={hA} fill="#10b981" rx="3" />
              <text x={x + w / 2} y={175} fontSize="9" textAnchor="middle" fill="#64748b">{lab}</text>
            </g>
          )
        })}
      </svg>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-indigo-50">
          <p className="text-slate-500">Collected</p>
          <p className="text-xl font-semibold text-indigo-700">{data.totals.collected}</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50">
          <p className="text-slate-500">Approved</p>
          <p className="text-xl font-semibold text-emerald-700">{data.totals.approved}</p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">By source</p>
        <ul className="space-y-1.5">
          {data.sources.map((s) => (
            <li key={s.source} className="flex items-center gap-2 text-xs text-slate-700">
              <span className="w-32 truncate">{s.source}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${Math.min(100, s.count * 2)}%` }} />
              </div>
              <span className="w-8 text-right tabular-nums">{s.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default TestimonialCollectionChart
