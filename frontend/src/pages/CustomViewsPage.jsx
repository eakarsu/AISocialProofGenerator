import TestimonialCollectionChart from '../components/TestimonialCollectionChart'
import PlatformEngagementHeatmap from '../components/PlatformEngagementHeatmap'
import BrandAssetKit from '../components/BrandAssetKit'
import WidgetRulesEditor from '../components/WidgetRulesEditor'

function CustomViewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Proof Views</h1>
        <p className="text-sm text-slate-500 mt-1">Custom analytics, brand assets and placement rules for social proof widgets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TestimonialCollectionChart />
        <PlatformEngagementHeatmap />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BrandAssetKit />
        <WidgetRulesEditor />
      </div>
    </div>
  )
}

export default CustomViewsPage
