function SkeletonTable({ rows = 5, columns = 5 }) {
  return (
    <div className="card !p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {[...Array(columns)].map((_, i) => (
                <th key={i} className="px-6 py-3.5 bg-slate-50/80">
                  <div className="h-3 bg-slate-200 rounded-full w-20 animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[...Array(rows)].map((_, rowIdx) => (
              <tr key={rowIdx}>
                {[...Array(columns)].map((_, colIdx) => (
                  <td key={colIdx} className="px-6 py-4">
                    <div className={`h-4 bg-slate-100 rounded-full animate-pulse ${colIdx === 0 ? 'w-32' : 'w-24'}`}
                      style={{ animationDelay: `${(rowIdx * columns + colIdx) * 50}ms` }}
                    ></div>
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

export default SkeletonTable
