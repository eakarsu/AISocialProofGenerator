import { useState } from 'react'

const API_URL = 'http://localhost:5001/api/custom-views'

function BrandAssetKit() {
  const [brand, setBrand] = useState('Social Proof Studio')
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const url = `${API_URL}/brand-asset-kit?brand=${encodeURIComponent(brand)}`
      window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setTimeout(() => setDownloading(false), 800)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">Brand Asset Kit (PDF)</h3>
        <p className="text-xs text-slate-500">Generate a one-page PDF with palette, typography, logo &amp; voice rules.</p>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Brand name</label>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="My Brand"
          />
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading || !brand.trim()}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium text-sm py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-60"
        >
          {downloading ? 'Preparing PDF…' : 'Download Brand Kit PDF'}
        </button>
        <div className="grid grid-cols-5 gap-2 pt-2">
          {['#4f46e5', '#7c3aed', '#0f172a', '#64748b', '#10b981'].map((c) => (
            <div key={c} className="aspect-square rounded-lg border border-slate-100" style={{ backgroundColor: c }} title={c} />
          ))}
        </div>
        <p className="text-[11px] text-slate-400">Includes color palette, typography, logo usage and voice/tone guidelines.</p>
      </div>
    </div>
  )
}

export default BrandAssetKit
