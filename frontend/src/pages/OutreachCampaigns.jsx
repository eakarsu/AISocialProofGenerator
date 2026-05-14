import { useState, useEffect, useRef } from 'react'
import { Mail, Upload, Send, RefreshCw, CheckCircle, Clock, Loader } from 'lucide-react'

const API_BASE = 'http://localhost:5001'

function getHeaders() {
  const token = localStorage.getItem('token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

export default function OutreachCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/customers/campaigns?limit=50`, { headers: getHeaders() })
      const data = await res.json()
      setCampaigns(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCampaigns() }, [])

  const handleImport = async (e) => {
    e.preventDefault()
    const file = fileRef.current?.files[0]
    if (!file) { setError('Please select a CSV file'); return }
    setImporting(true); setError(null); setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/customers/import`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImportResult(data)
      fetchCampaigns()
    } catch (err) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  const handleMarkSent = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/customers/campaigns/${id}/send`, {
        method: 'PUT',
        headers: getHeaders()
      })
      if (res.ok) fetchCampaigns()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Mail className="w-6 h-6 text-indigo-600" /> Outreach Campaigns
        </h1>
        <p className="text-slate-500 mt-1">Import customers via CSV and AI drafts personalized testimonial request emails for each.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-indigo-500" /> Import Customers (CSV)
        </h2>
        <p className="text-sm text-slate-500 mb-3">CSV must have columns: <span className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">name, email, company</span></p>
        <form onSubmit={handleImport} className="flex gap-3 items-center">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="flex-1 border border-dashed border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-600"
          />
          <button
            type="submit"
            disabled={importing}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
          >
            {importing ? <><Loader className="w-4 h-4 animate-spin" /> Importing...</> : <><Upload className="w-4 h-4" /> Import & Draft</>}
          </button>
        </form>

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

        {importResult && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <CheckCircle className="w-4 h-4 inline mr-1.5" />
            {importResult.message}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Campaign Drafts ({campaigns.length})</h2>
          <button onClick={fetchCampaigns} className="text-slate-400 hover:text-slate-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center"><Loader className="w-6 h-6 animate-spin text-indigo-400 mx-auto" /></div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No campaigns yet. Import customers to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {campaigns.map((c) => (
              <div key={c.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-medium text-slate-800 text-sm">{c.customer_name}</p>
                      {c.customer_email && <span className="text-xs text-slate-400">{c.customer_email}</span>}
                      {c.company && <span className="text-xs text-slate-400">@ {c.company}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                    </div>
                    {c.email_subject && (
                      <p className="text-sm text-slate-600 font-medium">Subject: {c.email_subject}</p>
                    )}
                    {c.sent_at && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> Sent {new Date(c.sent_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
                    >
                      {expanded === c.id ? 'Hide' : 'Preview'}
                    </button>
                    {c.status === 'draft' && (
                      <button
                        onClick={() => handleMarkSent(c.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Mark Sent
                      </button>
                    )}
                  </div>
                </div>

                {expanded === c.id && c.email_body && (
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Email Body</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.email_body}</p>
                    {c.follow_up_body && (
                      <>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-4 mb-2">Follow-up (7 days)</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.follow_up_body}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
