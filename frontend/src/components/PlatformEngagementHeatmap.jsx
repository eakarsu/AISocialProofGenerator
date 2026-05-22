import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:5001/api/custom-views'

function PlatformEngagementHeatmap() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancel = false
    axios.get(`${API_URL}/platform-engagement-heatmap`)
      .then((r) => { if (!cancel) setData(r.data) })
      .catch((e) => { if (!cancel) setError(e.message || 'Failed to load heatmap.') })
    return () => { cancel = true }
  }, [])

  if (error) return <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl">{error}</div>
  if (!data) return <div className="p-4 text-sm text-slate-500">Loading engagement heatmap…</div>

  const color = (v) => {
    if (v >= 80) return '#4f46e5'
    if (v >= 60) return '#6366f1'
    if (v >= 40) return '#a5b4fc'
    if (v >= 20) return '#c7d2fe'
    return '#eef2ff'
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">Platform Engagement Heatmap</h3>
        <p className="text-xs text-slate-500">Widget impressions index by day-of-week × hour</p>
      </div>
      <div className="overflow-x-auto">
        <table className="text-[10px] border-separate border-spacing-[2px]">
          <thead>
            <tr>
              <th className="w-8"></th>
              {data.hours.map((h) => (
                <th key={h} className="w-5 text-slate-400 font-medium text-center">{h % 3 === 0 ? h : ''}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.days_of_week.map((day, di) => (
              <tr key={day}>
                <td className="text-slate-500 pr-2 font-medium">{day}</td>
                {data.matrix[di].map((v, hi) => (
                  <td key={hi}>
                    <div
                      role="gridcell"
                      title={`${day} ${hi}:00 — ${v}`}
                      className="w-5 h-5 rounded-sm"
                      style={{ backgroundColor: color(v) }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-500">
        <span>Low</span>
        {[10, 30, 50, 70, 90].map((v) => (
          <span key={v} className="w-5 h-3 rounded-sm" style={{ backgroundColor: color(v) }} />
        ))}
        <span>High</span>
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Peak windows</p>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {data.peak_cells.map((p, i) => (
            <li key={i} className="px-2 py-1.5 bg-indigo-50 rounded-lg text-indigo-700">
              {p.day} {p.hour}:00 · {p.value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default PlatformEngagementHeatmap
