import { useState, useEffect } from 'react'
import { Code, Eye, Copy, CheckCircle, ExternalLink } from 'lucide-react'

const API_BASE = 'http://localhost:5001'

function getHeaders() {
  const token = localStorage.getItem('token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

export default function WidgetBuilder() {
  const [widgets, setWidgets] = useState([])
  const [selectedWidget, setSelectedWidget] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/social-widgets?limit=50`, { headers: getHeaders() })
      .then(r => r.json())
      .then(data => setWidgets(data.data || []))
      .catch(console.error)
  }, [])

  const handleSelectWidget = async (widget) => {
    setSelectedWidget(widget)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/widget/${widget.id}/preview`, { headers: getHeaders() })
      const data = await res.json()
      setPreview(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (preview?.script_tag) {
      navigator.clipboard.writeText(preview.script_tag)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Code className="w-6 h-6 text-indigo-600" /> Widget Builder
        </h1>
        <p className="text-slate-500 mt-1">Generate embeddable JavaScript widgets for your testimonials. Drop the script tag into any website.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Your Widgets</h2>
          <div className="space-y-2">
            {widgets.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No widgets found. Create one in Social Widgets.</p>
            )}
            {widgets.map(w => (
              <button
                key={w.id}
                onClick={() => handleSelectWidget(w)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  selectedWidget?.id === w.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                <p className="font-medium text-slate-800 text-sm">{w.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{w.widget_type}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          {!selectedWidget && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Code className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400">Select a widget to generate the embed code</p>
            </div>
          )}

          {selectedWidget && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-500" /> Embed Code
                  </h3>
                  <button
                    onClick={handleCopy}
                    disabled={!preview}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:opacity-50 font-medium"
                  >
                    {copied ? <><CheckCircle className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Code</>}
                  </button>
                </div>
                {preview?.script_tag ? (
                  <pre className="bg-slate-900 text-green-400 text-xs p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {preview.script_tag}
                  </pre>
                ) : loading ? (
                  <div className="bg-slate-100 rounded-lg p-4 text-center">
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : null}
              </div>

              {preview?.testimonials?.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-500" /> Preview
                  </h3>
                  <div className="space-y-3">
                    {preview.testimonials.map((t, i) => (
                      <div key={i} className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(t.rating || 5)].map((_, j) => (
                            <span key={j} className="text-amber-400 text-sm">★</span>
                          ))}
                        </div>
                        <p className="text-sm text-slate-700 italic mb-2">
                          "{(t.ai_enhanced_text || t.original_text || '').substring(0, 150)}..."
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          {t.customer_name}{t.role ? `, ${t.role}` : ''}{t.company ? ` at ${t.company}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-700">
                <p className="font-medium mb-1">How to embed:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Copy the embed code above</li>
                  <li>Paste it into your website HTML where you want the widget to appear</li>
                  <li>The widget loads automatically and displays live testimonials</li>
                </ol>
                <p className="mt-2 flex items-center gap-1.5 text-xs">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Widget URL: <span className="font-mono">{API_BASE}/widget/{selectedWidget.id}.js</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
