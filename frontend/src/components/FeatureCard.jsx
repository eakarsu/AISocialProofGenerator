import { Link } from 'react-router-dom'

const colorMap = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'from-indigo-500 to-indigo-600' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'from-violet-500 to-violet-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'from-amber-500 to-amber-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'from-emerald-500 to-emerald-600' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', icon: 'from-sky-500 to-sky-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', icon: 'from-rose-500 to-rose-600' },
  fuchsia: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', icon: 'from-fuchsia-500 to-fuchsia-600' },
}

function FeatureCard({ title, description, count, path, icon, color = 'indigo' }) {
  const c = colorMap[color] || colorMap.indigo

  return (
    <Link to={path} className="block group">
      <div className="card h-full hover:shadow-soft transition-all duration-200 hover:-translate-y-0.5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 bg-gradient-to-br ${c.icon} rounded-xl flex items-center justify-center text-white shadow-sm`}>
            {icon}
          </div>
          <div className={`${c.bg} ${c.text} px-2.5 py-1 rounded-lg text-lg font-bold`}>
            {count}
          </div>
        </div>
        <h3 className="text-[15px] font-semibold text-slate-800 mb-1">{title}</h3>
        <p className="text-[13px] text-slate-500 leading-relaxed">{description}</p>
        <div className={`mt-4 flex items-center ${c.text} text-[13px] font-medium group-hover:translate-x-1 transition-transform duration-200`}>
          View all
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

export default FeatureCard
