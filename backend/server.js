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
  origin: 'http://localhost:3000',
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

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/case-studies', caseStudiesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/social-widgets', socialWidgetsRoutes);
app.use('/api/success-metrics', successMetricsRoutes);
app.use('/api/customer-quotes', customerQuotesRoutes);
app.use('/api/video-testimonials', videoTestimonialsRoutes);
app.use('/api/ai', aiRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`OpenRouter API Key configured: ${process.env.OPENROUTER_API_KEY ? 'Yes' : 'No'}`);
  console.log(`OpenRouter Model: ${process.env.OPENROUTER_MODEL || 'Not set'}`);
});

module.exports = app;
