import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:5001/api/custom-views/widget-rules'

const PLACEMENTS = ['homepage_hero', 'checkout', 'pricing', 'blog_sidebar', 'product_detail', 'signup_page']
const WIDGET_TYPES = ['testimonial_card', 'trust_badge', 'quote_strip', 'review_carousel', 'video_embed', 'star_rating']

function WidgetRulesEditor() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState({ name: '', placement: 'homepage_hero', widget_type: 'testimonial_card', priority: 5, conditions: '', active: true })

  const load = async () => {
    setLoading(true)
    try {
      const r = await axios.get(API_URL)
      setRules(r.data.rules || [])
      setError('')
    } catch (e) {
      setError(e.message || 'Failed to load rules.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!draft.name.trim()) return
    try {
      await axios.post(API_URL, draft)
      setDraft({ name: '', placement: 'homepage_hero', widget_type: 'testimonial_card', priority: 5, conditions: '', active: true })
      await load()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  const toggleActive = async (rule) => {
    try {
      await axios.put(`${API_URL}/${rule.id}`, { active: !rule.active })
      await load()
    } catch (err) { setError(err.message) }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`)
      await load()
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">Display &amp; Placement Rules</h3>
        <p className="text-xs text-slate-500">Create, toggle and remove widget placement rules.</p>
      </div>

      {error && <div className="mb-3 p-2.5 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg">{error}</div>}

      <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-6 gap-2 mb-4">
        <input
          aria-label="rule-name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Rule name"
          className="sm:col-span-2 text-xs border border-slate-200 rounded-lg px-2 py-1.5"
        />
        <select
          value={draft.placement}
          onChange={(e) => setDraft({ ...draft, placement: e.target.value })}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5"
        >
          {PLACEMENTS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select
          value={draft.widget_type}
          onChange={(e) => setDraft({ ...draft, widget_type: e.target.value })}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5"
        >
          {WIDGET_TYPES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <input
          aria-label="priority"
          type="number"
          value={draft.priority}
          onChange={(e) => setDraft({ ...draft, priority: parseInt(e.target.value, 10) || 0 })}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5"
        />
        <button type="submit" className="text-xs bg-indigo-600 text-white rounded-lg px-3 py-1.5 hover:bg-indigo-700">Add Rule</button>
        <input
          aria-label="conditions"
          value={draft.conditions}
          onChange={(e) => setDraft({ ...draft, conditions: e.target.value })}
          placeholder="conditions (e.g. rating >= 4)"
          className="sm:col-span-6 text-xs border border-slate-200 rounded-lg px-2 py-1.5"
        />
      </form>

      {loading ? (
        <p className="text-xs text-slate-500">Loading rules…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-2 pr-2">Name</th>
                <th className="py-2 pr-2">Placement</th>
                <th className="py-2 pr-2">Type</th>
                <th className="py-2 pr-2">Pri</th>
                <th className="py-2 pr-2">Conditions</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2"></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="py-2 pr-2 font-medium text-slate-800">{r.name}</td>
                  <td className="py-2 pr-2 text-slate-600">{r.placement}</td>
                  <td className="py-2 pr-2 text-slate-600">{r.widget_type}</td>
                  <td className="py-2 pr-2 tabular-nums text-slate-600">{r.priority}</td>
                  <td className="py-2 pr-2 text-slate-500 truncate max-w-[180px]" title={r.conditions}>{r.conditions || '—'}</td>
                  <td className="py-2 pr-2">
                    <button
                      onClick={() => toggleActive(r)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {r.active ? 'Active' : 'Paused'}
                    </button>
                  </td>
                  <td className="py-2 pr-2">
                    <button onClick={() => handleDelete(r.id)} className="text-rose-600 hover:text-rose-700 text-[11px]">Delete</button>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr><td colSpan={7} className="py-4 text-center text-slate-400">No rules yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default WidgetRulesEditor
