import { useState } from 'react'

function DetailModal({ isOpen, onClose, title, data, fields, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!isOpen) return null

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(data.id)
      onClose()
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto modal-scrollbar space-y-4">
          {data && fields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {field.label}
              </label>
              <div className="text-sm text-slate-800 bg-slate-50 rounded-xl p-3.5 whitespace-pre-wrap border border-slate-100">
                {field.render ? field.render(data[field.key], data) : (data[field.key] || '-')}
              </div>
            </div>
          ))}
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="px-6 py-4 bg-red-50 border-t border-red-100">
            <p className="text-sm text-red-700 mb-3">Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        {!showDeleteConfirm && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between">
            <div>
              {onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              {onEdit && (
                <button
                  onClick={() => onEdit(data)}
                  className="btn-primary"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              )}
              <button onClick={onClose} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DetailModal
