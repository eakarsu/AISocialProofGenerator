function FilterControls({ filters, values, onChange }) {
  if (!filters || filters.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map(filter => (
        <select
          key={filter.key}
          value={values[filter.key] || ''}
          onChange={e => onChange(filter.key, e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
        >
          <option value="">{filter.label}</option>
          {filter.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
      {Object.values(values).some(v => v) && (
        <button
          onClick={() => {
            const cleared = {}
            filters.forEach(f => { cleared[f.key] = '' })
            Object.keys(cleared).forEach(k => onChange(k, ''))
          }}
          className="text-xs font-medium text-slate-500 hover:text-indigo-600 px-2 py-1 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

export default FilterControls
