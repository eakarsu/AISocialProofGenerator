import SkeletonTable from './SkeletonTable'

function DataTable({ columns, data, onRowClick, loading, selectable, selectedIds = [], onToggleSelect, onToggleSelectAll, sortBy, sortOrder, onSort }) {
  if (loading) {
    return <SkeletonTable rows={5} columns={columns.length || 5} />
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No items yet</h3>
          <p className="text-sm text-slate-400 mt-1">Get started by creating a new item.</p>
        </div>
      </div>
    )
  }

  const allSelected = selectedIds.length === data.length && data.length > 0

  return (
    <div className="card !p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {selectable && (
                <th className="px-4 py-3.5 bg-slate-50/80 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 ${onSort && column.sortable !== false ? 'cursor-pointer hover:text-indigo-600 select-none' : ''}`}
                  onClick={() => onSort && column.sortable !== false && onSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {onSort && column.sortable !== false && sortBy === column.key && (
                      <svg className={`w-3 h-3 ${sortOrder === 'ASC' ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className={`${onRowClick ? 'cursor-pointer hover:bg-indigo-50/50' : ''} transition-colors duration-150 ${selectedIds.includes(row.id) ? 'bg-indigo-50/30' : ''}`}
              >
                {selectable && (
                  <td className="px-4 py-4 w-10" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => onToggleSelect(row.id)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {column.render ? (
                      column.render(row[column.key], row)
                    ) : (
                      <span className="text-sm text-slate-700">
                        {row[column.key]?.toString()?.substring(0, 50) || '-'}
                        {row[column.key]?.toString()?.length > 50 ? '...' : ''}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable
