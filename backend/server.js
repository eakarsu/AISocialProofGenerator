'use strict';require('dotenv').config({path:require('path').resolve(__dirname,'../.env')});const express=require('express'),cors=require('cors'),helmet=require('helmet');const{generalLimiter}=require('./middleware/rateLimiter');const{authenticate,secret}=require('./middleware/auth');if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');secret();const origins=String(process.env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);if(!origins.length)throw new Error('ALLOWED_ORIGINS is required');const app=express();app.use(helmet());app.use(cors({credentials:true,origin:(origin,callback)=>(!origin||origins.includes(origin))?callback(null,true):callback(new Error('origin not allowed'))}));app.use(express.json({limit:'10mb'}));app.use('/api/',generalLimiter);app.get('/api/health',(_req,res)=>res.json({status:'ok',service:'governed-social-proof'}));app.use('/api/auth',require('./routes/auth'));app.use('/api/governed-generation',require('./routes/governedGeneration')(authenticate));app.use('/api/governed-proof',require('./routes/governedProof')(authenticate));
// Advisory AI reports only; native execution and approval routes stay unchanged.
const aiWorkspaceSupport = require("./aiWorkspaceAdapters.cjs");
const aiWorkspaceDatabase = require("./config/database.js");
app.use('/api/report-workspace', require("./aiWorkspace.cjs").createAIWorkspaceRouter({
  pool: aiWorkspaceDatabase, authenticateToken: require("./middleware/auth.js").authenticate,
  aiRateLimiter: aiWorkspaceSupport.createWorkspaceLimiter(), features: require("./aiWorkspaceFeatures.json"),
}));
// === Domain + AI feature routes (mounted BEFORE the 404 catch-all) ===
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/case-studies', require('./routes/caseStudies'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/social-widgets', require('./routes/socialWidgets'));
app.use('/api/success-metrics', require('./routes/successMetrics'));
app.use('/api/customer-quotes', require('./routes/customerQuotes'));
app.use('/api/video-testimonials', require('./routes/videoTestimonials'));
app.use('/api/video-testimonials', require('./routes/videoUpload'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/customers', require('./routes/customerImport'));
app.use('/api/persona-variants', require('./routes/personaVariants'));
app.use('/api/multi-modal-widgets', require('./routes/multiModalWidgets'));
app.use('/api/competitive-testimonials', require('./routes/competitiveTestimonialRag'));
app.use('/api/authenticity-scorer', require('./routes/authenticityScorer'));
app.use('/api/marketplace-publishing', require('./routes/marketplacePublishing'));
app.use('/api/review-crawler', require('./routes/reviewCrawler'));
app.use('/api/custom-views', require('./routes/customViews'));
app.use('/widget', require('./routes/widget'));
// === Batch 08 Gaps & Frontend Mounts ===
app.use('/api/gap-no-ai-driven-customer-segmentation-for-targeted-testimonial-selection', require('./routes/gapNoAiDrivenCustomerSegmentationForTargetedTestimonialSelection'));
app.use('/api/gap-no-predictive-scoring-for-which-customers-are-most', require('./routes/gapNoPredictiveScoringForWhichCustomersAreMost'));
app.use('/api/gap-no-automated-visual-asset-poster-social-card-generation', require('./routes/gapNoAutomatedVisualAssetPosterSocialCardGeneration'));
app.use('/api/gap-no-integrations-with-trustpilot-g2-capterra-review-platforms', require('./routes/gapNoIntegrationsWithTrustpilotG2CapterraReviewPlatforms'));
app.use('/api/gap-no-a-b-testing-framework-for-widget-placement', require('./routes/gapNoABTestingFrameworkForWidgetPlacement'));
app.use('/api/gap-no-scheduled-batch-review-crawling-from-external-sources', require('./routes/gapNoScheduledBatchReviewCrawlingFromExternalSources'));
app.use('/api/gap-no-webhooks-notifications-system-for-new-review-or', require('./routes/gapNoWebhooksNotificationsSystemForNewReviewOr'));
app.use('/api/gap-limited-audit-logging-single-reference-not-a-dedicated', require('./routes/gapLimitedAuditLoggingSingleReferenceNotADedicated'));
app.use('/api',(_req,res)=>res.status(404).json({error:'Not found'}));const port=Number(process.env.PORT||5001);app.listen(port,()=>console.log(`Governed social-proof API listening on ${port}`));module.exports=app;
