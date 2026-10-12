import AIReport from './AIReport'

function AIResultDisplay({ result, onApply, onClose }) {
  if (!result) return null
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-5 max-h-[50vh] overflow-y-auto modal-scrollbar">
        <AIReport response={result} title="Generated content" />
      </div>
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end space-x-3">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="button" onClick={() => onApply(result)} className="btn-primary">Apply to Form</button>
      </div>
    </div>
  )
}

export default AIResultDisplay
