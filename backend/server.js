require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security middleware
app.use(helmet());

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Rate limiting
app.use('/api/', generalLimiter);

// Routes
const authRoutes = require('./routes/auth');
const testimonialsRoutes = require('./routes/testimonials');
const caseStudiesRoutes = require('./routes/caseStudies');
const reviewsRoutes = require('./routes/reviews');
const socialWidgetsRoutes = require('./routes/socialWidgets');
const successMetricsRoutes = require('./routes/successMetrics');
const customerQuotesRoutes = require('./routes/customerQuotes');
const videoTestimonialsRoutes = require('./routes/videoTestimonials');
const aiRoutes = require('./routes/ai');
const widgetRoutes = require('./routes/widget');
const videoUploadRoutes = require('./routes/videoUpload');
const customerImportRoutes = require('./routes/customerImport');

// Serve uploads statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/case-studies', caseStudiesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/social-widgets', socialWidgetsRoutes);
app.use('/api/success-metrics', successMetricsRoutes);
app.use('/api/customer-quotes', customerQuotesRoutes);
app.use('/api/video-testimonials', videoTestimonialsRoutes);
app.use('/api/video-testimonials', videoUploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/customers', customerImportRoutes);
// Widget embed endpoint - no auth
app.use('/widget', widgetRoutes);
app.use('/api/persona-variants', require('./routes/personaVariants')); app.use('/api/multi-modal-widgets', require('./routes/multiModalWidgets')); app.use('/api/competitive-testimonials', require('./routes/competitiveTestimonialRag')); app.use('/api/authenticity-scorer', require('./routes/authenticityScorer')); app.use('/api/marketplace-publishing', require('./routes/marketplacePublishing')); app.use('/api/review-crawler', require('./routes/reviewCrawler'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Social Proof Generator API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5001;


// === Batch 08 Gaps & Frontend Mounts ===
app.use('/api/gap-no-ai-driven-customer-segmentation-for-targeted-testimonial-selection', require('./routes/gapNoAiDrivenCustomerSegmentationForTargetedTestimonialSelection'));
app.use('/api/gap-no-predictive-scoring-for-which-customers-are-most', require('./routes/gapNoPredictiveScoringForWhichCustomersAreMost'));
app.use('/api/gap-no-automated-visual-asset-poster-social-card-generation', require('./routes/gapNoAutomatedVisualAssetPosterSocialCardGeneration'));
app.use('/api/gap-no-integrations-with-trustpilot-g2-capterra-review-platforms', require('./routes/gapNoIntegrationsWithTrustpilotG2CapterraReviewPlatforms'));
app.use('/api/gap-no-a-b-testing-framework-for-widget-placement', require('./routes/gapNoABTestingFrameworkForWidgetPlacement'));
app.use('/api/gap-no-scheduled-batch-review-crawling-from-external-sources', require('./routes/gapNoScheduledBatchReviewCrawlingFromExternalSources'));
app.use('/api/gap-no-webhooks-notifications-system-for-new-review-or', require('./routes/gapNoWebhooksNotificationsSystemForNewReviewOr'));
app.use('/api/gap-limited-audit-logging-single-reference-not-a-dedicated', require('./routes/gapLimitedAuditLoggingSingleReferenceNotADedicated'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`OpenRouter API Key configured: ${process.env.OPENROUTER_API_KEY ? 'Yes' : 'No'}`);
  console.log(`OpenRouter Model: ${process.env.OPENROUTER_MODEL || 'Not set'}`);
});

module.exports = app;
