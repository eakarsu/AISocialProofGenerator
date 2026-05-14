import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useSidebar } from './context/SidebarContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Testimonials from './pages/Testimonials'
import CaseStudies from './pages/CaseStudies'
import Reviews from './pages/Reviews'
import SocialWidgets from './pages/SocialWidgets'
import SuccessMetrics from './pages/SuccessMetrics'
import CustomerQuotes from './pages/CustomerQuotes'
import VideoTestimonials from './pages/VideoTestimonials'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import WidgetBuilder from './pages/WidgetBuilder'
import TestimonialVariants from './pages/TestimonialVariants'
import OutreachCampaigns from './pages/OutreachCampaigns'
import CustomerSegmentation from './pages/CustomerSegmentation'
import TestimonialLikelihood from './pages/TestimonialLikelihood'
import AuthenticityScorer from './pages/AuthenticityScorer'
import PersonaVariants from './pages/PersonaVariants'
// === Batch 08 Gaps & Frontend Mounts ===
import CfSentimentDrivenVariantGenerationTunedToBuyer from './pages/CfSentimentDrivenVariantGenerationTunedToBuyer'
import CfMultiModalProofWidgetsCombiningVideoAudio from './pages/CfMultiModalProofWidgetsCombiningVideoAudio'
import CfCompetitiveTestimonialAnalysisViaRagOverCompetitor from './pages/CfCompetitiveTestimonialAnalysisViaRagOverCompetitor'
import CfAuthenticityScoringToDetectAiGeneratedVs from './pages/CfAuthenticityScoringToDetectAiGeneratedVs'
import CfOneClickMarketplacePublishingToCapterraG2 from './pages/CfOneClickMarketplacePublishingToCapterraG2'
import CfReviewCrawlerServiceWithScheduledPollingOf from './pages/CfReviewCrawlerServiceWithScheduledPollingOf'
import GapNoAiDrivenCustomerSegmentationForTargeted from './pages/GapNoAiDrivenCustomerSegmentationForTargeted'
import GapNoPredictiveScoringForWhichCustomersAre from './pages/GapNoPredictiveScoringForWhichCustomersAre'
import GapNoAutomatedVisualAssetPosterSocialCard from './pages/GapNoAutomatedVisualAssetPosterSocialCard'
import GapNoIntegrationsWithTrustpilotG2CapterraReview from './pages/GapNoIntegrationsWithTrustpilotG2CapterraReview'
import GapNoABTestingFrameworkForWidget from './pages/GapNoABTestingFrameworkForWidget'
import GapNoScheduledBatchReviewCrawlingFromExternal from './pages/GapNoScheduledBatchReviewCrawlingFromExternal'
import GapNoWebhooksNotificationsSystemForNewReview from './pages/GapNoWebhooksNotificationsSystemForNewReview'
import GapLimitedAuditLoggingSingleReferenceNotA from './pages/GapLimitedAuditLoggingSingleReferenceNotA'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const { collapsed } = useSidebar()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className={`pt-14 lg:pt-0 min-h-screen transition-all duration-300 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-60'}`}>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/testimonials"
        element={
          <ProtectedRoute>
            <Testimonials />
          </ProtectedRoute>
        }
      />
      <Route
        path="/case-studies"
        element={
          <ProtectedRoute>
            <CaseStudies />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviews"
        element={
          <ProtectedRoute>
            <Reviews />
          </ProtectedRoute>
        }
      />
      <Route
        path="/social-widgets"
        element={
          <ProtectedRoute>
            <SocialWidgets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/success-metrics"
        element={
          <ProtectedRoute>
            <SuccessMetrics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer-quotes"
        element={
          <ProtectedRoute>
            <CustomerQuotes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/video-testimonials"
        element={
          <ProtectedRoute>
            <VideoTestimonials />
          </ProtectedRoute>
        }
      />
      <Route
        path="/widget-builder"
        element={
          <ProtectedRoute>
            <WidgetBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/testimonial-variants"
        element={
          <ProtectedRoute>
            <TestimonialVariants />
          </ProtectedRoute>
        }
      />
      <Route
        path="/outreach-campaigns"
        element={
          <ProtectedRoute>
            <OutreachCampaigns />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer-segmentation"
        element={
          <ProtectedRoute>
            <CustomerSegmentation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/testimonial-likelihood"
        element={
          <ProtectedRoute>
            <TestimonialLikelihood />
          </ProtectedRoute>
        }
      />
      <Route
        path="/authenticity-scorer"
        element={
          <ProtectedRoute>
            <AuthenticityScorer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/persona-variants"
        element={
          <ProtectedRoute>
            <PersonaVariants />
          </ProtectedRoute>
        }
      />
      {/* // === Batch 08 Gaps & Frontend Mounts === */}
      <Route path="/cf-sentiment-driven-variant-generation-tuned-to-buyer-personas-price-conscious" element={<ProtectedRoute><CfSentimentDrivenVariantGenerationTunedToBuyer /></ProtectedRoute>} />
      <Route path="/cf-multi-modal-proof-widgets-combining-video-audio-text-with" element={<ProtectedRoute><CfMultiModalProofWidgetsCombiningVideoAudio /></ProtectedRoute>} />
      <Route path="/cf-competitive-testimonial-analysis-via-rag-over-competitor-reviews" element={<ProtectedRoute><CfCompetitiveTestimonialAnalysisViaRagOverCompetitor /></ProtectedRoute>} />
      <Route path="/cf-authenticity-scoring-to-detect-ai-generated-vs-real-testimonials" element={<ProtectedRoute><CfAuthenticityScoringToDetectAiGeneratedVs /></ProtectedRoute>} />
      <Route path="/cf-one-click-marketplace-publishing-to-capterra-g2-producthunt-with" element={<ProtectedRoute><CfOneClickMarketplacePublishingToCapterraG2 /></ProtectedRoute>} />
      <Route path="/cf-review-crawler-service-with-scheduled-polling-of-external" element={<ProtectedRoute><CfReviewCrawlerServiceWithScheduledPollingOf /></ProtectedRoute>} />
      <Route path="/gap-no-ai-driven-customer-segmentation-for-targeted-testimonial-selection" element={<ProtectedRoute><GapNoAiDrivenCustomerSegmentationForTargeted /></ProtectedRoute>} />
      <Route path="/gap-no-predictive-scoring-for-which-customers-are-most" element={<ProtectedRoute><GapNoPredictiveScoringForWhichCustomersAre /></ProtectedRoute>} />
      <Route path="/gap-no-automated-visual-asset-poster-social-card-generation" element={<ProtectedRoute><GapNoAutomatedVisualAssetPosterSocialCard /></ProtectedRoute>} />
      <Route path="/gap-no-integrations-with-trustpilot-g2-capterra-review-platforms" element={<ProtectedRoute><GapNoIntegrationsWithTrustpilotG2CapterraReview /></ProtectedRoute>} />
      <Route path="/gap-no-a-b-testing-framework-for-widget-placement" element={<ProtectedRoute><GapNoABTestingFrameworkForWidget /></ProtectedRoute>} />
      <Route path="/gap-no-scheduled-batch-review-crawling-from-external-sources" element={<ProtectedRoute><GapNoScheduledBatchReviewCrawlingFromExternal /></ProtectedRoute>} />
      <Route path="/gap-no-webhooks-notifications-system-for-new-review-or" element={<ProtectedRoute><GapNoWebhooksNotificationsSystemForNewReview /></ProtectedRoute>} />
      <Route path="/gap-limited-audit-logging-single-reference-not-a-dedicated" element={<ProtectedRoute><GapLimitedAuditLoggingSingleReferenceNotA /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
