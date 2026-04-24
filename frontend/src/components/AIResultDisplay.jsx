import { useState } from 'react'

function AIResultDisplay({ result, onApply, onClose }) {
  const [expanded, setExpanded] = useState({})

  if (!result) return null

  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const renderValue = (key, value) => {
    if (value === null || value === undefined) return null

    if (Array.isArray(value)) {
      return (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div key={index} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              {typeof item === 'object' ? (
                <div className="space-y-1">
                  {Object.entries(item).map(([k, v]) => (
                    <div key={k} className="text-sm">
                      <span className="font-medium text-slate-500 capitalize">{k.replace(/_/g, ' ')}:</span>
                      <span className="ml-2 text-slate-800">{String(v)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-slate-800">{String(item)}</span>
              )}
            </div>
          ))}
        </div>
      )
    }

    if (typeof value === 'object') {
      return (
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <pre className="text-sm text-slate-700 whitespace-pre-wrap overflow-x-auto font-mono">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      )
    }

    const stringValue = String(value)
    if (stringValue.length > 150) {
      const isExpanded = expanded[key]
      return (
        <div>
          <p className="text-slate-800 whitespace-pre-wrap text-sm leading-relaxed">
            {isExpanded ? stringValue : `${stringValue.substring(0, 150)}...`}
          </p>
          <button
            onClick={() => toggleExpand(key)}
            className="text-indigo-600 hover:text-indigo-700 text-xs font-medium mt-1"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        </div>
      )
    }

    return <span className="text-slate-800 text-sm">{stringValue}</span>
  }

  const getFieldIcon = (key) => {
    const icons = {
      customer_name: '👤',
      company: '🏢',
      role: '💼',
      rating: '⭐',
      sentiment: '😊',
      ai_enhanced_text: '✨',
      ai_edited_transcript: '✨',
      ai_summary: '📝',
      ai_description: '📝',
      polished_quote: '💎',
      original_text: '📄',
      original_transcript: '📄',
      original_quote: '📄',
      original_review: '📄',
      title: '📌',
      challenge: '🎯',
      solution: '💡',
      results: '📊',
      tags: '🏷️',
      highlights: '⭐',
      ai_highlights: '⭐',
      video_url: '🎬',
      thumbnail_url: '🖼️',
      duration: '⏱️',
      status: '📋',
      trend: '📈',
      icon: '🎨',
      source: '📰',
      use_case: '🎯',
      industry: '🏭',
      widget_type: '🧩',
      content: '📝',
      context: '📖',
      value: '💰',
      metric_name: '📊',
      chart_type: '📈',
      chart_data: '📊',
      quotes: '💬',
      overall_sentiment: '😊',
      source_name: '📰',
      source_type: '📁'
    }
    return icons[key] || '📋'
  }

  const formatKey = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace('Ai ', 'AI ')
      .replace('Url', 'URL')
  }

  const displayFields = Object.entries(result).filter(([key]) =>
    !['id', 'created_at', 'updated_at', 'user_id'].includes(key)
  )

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center mr-3 backdrop-blur-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">AI Generated Content</h3>
              <p className="text-indigo-200 text-xs">Review the results below</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-400/20 text-emerald-100 border border-emerald-400/30">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span>
            Success
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3 max-h-[50vh] overflow-y-auto modal-scrollbar">
        {displayFields.map(([key, value]) => (
          <div key={key} className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-slate-200 transition-colors">
            <div className="flex items-start">
              <span className="text-lg mr-3 mt-0.5">{getFieldIcon(key)}</span>
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-semibold text-indigo-600 mb-1.5 uppercase tracking-wide">
                  {formatKey(key)}
                </label>
                <div>{renderValue(key, value)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={() => onApply(result)}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Apply to Form
        </button>
      </div>
    </div>
  )
}

export default AIResultDisplay
