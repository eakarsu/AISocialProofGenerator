import { useState, useEffect } from 'react'
import AIResultDisplay from './AIResultDisplay'
import { validateForm } from '../utils/validation'

function NewItemModal({ isOpen, onClose, title, fields, onSubmit, onAiGenerate, generating, editData, exampleData, validationRules }) {
  const [formData, setFormData] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [localGenerating, setLocalGenerating] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [showAiResult, setShowAiResult] = useState(false)

  const isEditMode = !!editData

  useEffect(() => {
    if (editData) {
      setFormData(editData)
    } else {
      setFormData({})
    }
    setFieldErrors({})
  }, [editData, isOpen])

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    if (fieldErrors[key]) {
      setFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    if (validationRules) {
      const { isValid, errors } = validateForm(formData, validationRules)
      if (!isValid) {
        setFieldErrors(errors)
        return
      }
    }

    setSubmitting(true)
    try {
      await onSubmit(formData, isEditMode)
      setFormData({})
      onClose()
    } catch (err) {
      console.error('Submit error:', err)
      setError(err.response?.data?.error || 'Failed to save. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAiGenerate = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    setLocalGenerating(true)
    setAiResult(null)
    try {
      const result = await onAiGenerate(formData)
      if (result) {
        setAiResult(result)
        setShowAiResult(true)
      } else {
        setError('AI generation returned no results. Please try again.')
      }
    } catch (err) {
      console.error('AI generate error:', err)
      setError(err.response?.data?.error || err.message || 'AI generation failed. Please check your API key.')
    } finally {
      setLocalGenerating(false)
    }
  }

  const handleApplyAiResult = (result) => {
    setFormData(prev => ({ ...prev, ...result }))
    setShowAiResult(false)
    setAiResult(null)
  }

  const handleCloseAiResult = () => {
    setShowAiResult(false)
  }

  const handleClose = () => {
    setFormData({})
    setError('')
    setFieldErrors({})
    setAiResult(null)
    setShowAiResult(false)
    onClose()
  }

  if (!isOpen) return null

  const isGenerating = generating || localGenerating

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEditMode ? `Edit ${title.replace('Create New ', '')}` : title}
          </h3>
          <button type="button" onClick={handleClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto modal-scrollbar">
          {error && (
            <div className="mb-5 flex items-center gap-3 p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {showAiResult && aiResult && (
            <div className="mb-6">
              <AIResultDisplay result={aiResult} onApply={handleApplyAiResult} onClose={handleCloseAiResult} />
            </div>
          )}

          {exampleData && exampleData.length > 0 && !isEditMode && !showAiResult && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2.5">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Load Example Data</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {exampleData.map((example, index) => (
                  <button key={index} type="button" onClick={() => setFormData(example.data)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all duration-150">
                    <span>{example.icon || ''}</span>
                    {example.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {onAiGenerate && !showAiResult && (
            <div className="mb-6">
              <button type="button" onClick={handleAiGenerate} disabled={isGenerating}
                className="w-full flex items-center justify-center px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-violet-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-indigo-500/25 active:scale-[0.98]">
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2.5"></div>
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {isEditMode ? 'Regenerate with AI' : 'Generate with AI'}
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                {isEditMode ? 'AI will regenerate content based on current data' : 'Let AI generate content for all fields'}
              </p>
            </div>
          )}

          {!showAiResult && (
          <form id="newItemForm" onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => {
              const fieldValue = formData[field.key] || ''
              const fieldError = fieldErrors[field.key]
              return (
              <div key={field.key}>
                <label className="label">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={fieldValue}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={4}
                    className={`input-field resize-none ${fieldError ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : ''}`}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={fieldValue}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    required={field.required}
                    className={`input-field ${fieldError ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : ''}`}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : field.type === 'number' ? (
                  <input
                    type="number"
                    value={fieldValue}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    min={field.min}
                    max={field.max}
                    className={`input-field ${fieldError ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : ''}`}
                  />
                ) : (
                  <input
                    type="text"
                    value={fieldValue}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    className={`input-field ${fieldError ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : ''}`}
                  />
                )}
                {fieldError && (
                  <p className="text-xs text-red-500 mt-1">{fieldError}</p>
                )}
                {field.hint && !fieldError && (
                  <p className="text-[11px] text-slate-400 mt-1">{field.hint}</p>
                )}
              </div>
            )})}
          </form>
          )}
        </div>

        {!showAiResult && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end space-x-3">
          <button type="button" onClick={handleClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="newItemForm" disabled={submitting} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Saving...' : (isEditMode ? 'Update' : 'Save')}
          </button>
        </div>
        )}
      </div>
    </div>
  )
}

export default NewItemModal
