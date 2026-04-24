require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { createTables } = require('../models');

const seedData = async () => {
  try {
    console.log('Creating tables...');
    await createTables();

    console.log('Clearing existing data...');
    await pool.query('TRUNCATE video_testimonials, customer_quotes, success_metrics, social_widgets, reviews, case_studies, testimonials RESTART IDENTITY CASCADE');

    console.log('Seeding users with roles...');
    const salt = await bcrypt.genSalt(10);

    // Clear existing users and re-seed
    await pool.query('DELETE FROM users');

    const users = [
      { email: 'demo@example.com', password: 'demo123', name: 'Demo User', role: 'admin' },
      { email: 'admin@example.com', password: 'Admin123!', name: 'Admin User', role: 'admin' },
      { email: 'editor@example.com', password: 'Editor123!', name: 'Editor User', role: 'editor' },
      { email: 'viewer@example.com', password: 'Viewer123!', name: 'Viewer User', role: 'viewer' },
      { email: 'sarah.j@example.com', password: 'Sarah123!', name: 'Sarah Johnson', role: 'editor' },
      { email: 'michael.c@example.com', password: 'Michael123!', name: 'Michael Chen', role: 'editor' },
      { email: 'emily.r@example.com', password: 'Emily123!', name: 'Emily Rodriguez', role: 'viewer' },
      { email: 'david.k@example.com', password: 'David123!', name: 'David Kim', role: 'editor' },
      { email: 'lisa.t@example.com', password: 'Lisa123!', name: 'Lisa Thompson', role: 'viewer' },
      { email: 'james.w@example.com', password: 'James123!', name: 'James Wilson', role: 'editor' },
      { email: 'amanda.f@example.com', password: 'Amanda123!', name: 'Amanda Foster', role: 'editor' },
      { email: 'robert.m@example.com', password: 'Robert123!', name: 'Robert Martinez', role: 'viewer' },
      { email: 'jennifer.l@example.com', password: 'Jennifer123!', name: 'Jennifer Lee', role: 'editor' },
      { email: 'chris.b@example.com', password: 'Chris123!', name: 'Christopher Brown', role: 'viewer' },
      { email: 'nicole.w@example.com', password: 'Nicole123!', name: 'Nicole White', role: 'editor' }
    ];

    for (const u of users) {
      const hashedPassword = await bcrypt.hash(u.password, salt);
      await pool.query(
        'INSERT INTO users (email, password, name, role, email_verified) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET password = $2, name = $3, role = $4',
        [u.email, hashedPassword, u.name, u.role, true]
      );
    }

    console.log('Seeding testimonials...');
    const testimonials = [
      { customer_name: 'Sarah Johnson', company: 'TechCorp Inc', role: 'CTO', original_text: 'This product completely transformed how we handle customer data. Amazing!', ai_enhanced_text: 'This innovative solution has revolutionized our approach to customer data management, delivering unprecedented efficiency and insights that have transformed our business operations.', rating: 5, avatar_url: 'https://randomuser.me/api/portraits/women/1.jpg' },
      { customer_name: 'Michael Chen', company: 'StartupXYZ', role: 'Founder', original_text: 'Best investment we made this year. ROI was incredible.', ai_enhanced_text: 'Implementing this solution was hands-down the most impactful investment we made this year. The return on investment exceeded all our expectations, delivering measurable results within weeks.', rating: 5, avatar_url: 'https://randomuser.me/api/portraits/men/2.jpg' },
      { customer_name: 'Emily Rodriguez', company: 'Global Solutions', role: 'Marketing Director', original_text: 'Our conversion rates went up 40% after implementing this.', ai_enhanced_text: 'Since implementing this platform, we have witnessed a remarkable 40% increase in our conversion rates. It has become an indispensable tool in our marketing arsenal.', rating: 5, avatar_url: 'https://randomuser.me/api/portraits/women/3.jpg' },
      { customer_name: 'David Kim', company: 'InnovateTech', role: 'Product Manager', original_text: 'The AI features are game-changing for our workflow.', ai_enhanced_text: 'The AI-powered features have been absolutely game-changing for our team. They have streamlined our workflow and enabled us to accomplish more in less time than ever before.', rating: 5, avatar_url: 'https://randomuser.me/api/portraits/men/4.jpg' },
      { customer_name: 'Lisa Thompson', company: 'Enterprise Co', role: 'VP of Operations', original_text: 'Customer support is top-notch. Always responsive.', ai_enhanced_text: 'The customer support team has consistently exceeded our expectations with their responsiveness and expertise. They have been invaluable partners in our success.', rating: 5, avatar_url: 'https://randomuser.me/api/portraits/women/5.jpg' },
      { customer_name: 'James Wilson', company: 'DataDriven LLC', role: 'Data Scientist', original_text: 'The analytics capabilities are exactly what we needed.', ai_enhanced_text: 'The comprehensive analytics capabilities have provided exactly the insights we needed to make data-driven decisions. It has transformed how we approach business intelligence.', rating: 4, avatar_url: 'https://randomuser.me/api/portraits/men/6.jpg' },
      { customer_name: 'Amanda Foster', company: 'Creative Agency', role: 'Creative Director', original_text: 'Beautiful interface and super easy to use.', ai_enhanced_text: 'The beautifully designed interface combines aesthetic appeal with intuitive functionality. Our team adopted it immediately with virtually no learning curve.', rating: 5, avatar_url: 'https://randomuser.me/api/portraits/women/7.jpg' },
      { customer_name: 'Robert Martinez', company: 'FinanceHub', role: 'CFO', original_text: 'Saved us thousands in operational costs.', ai_enhanced_text: 'This solution has delivered significant cost savings for our organization, reducing operational expenses by thousands of dollars while improving overall efficiency.', rating: 5, avatar_url: 'https://randomuser.me/api/portraits/men/8.jpg' },
      { customer_name: 'Jennifer Lee', company: 'HealthTech Solutions', role: 'CEO', original_text: 'Perfect for our compliance requirements.', ai_enhanced_text: 'This platform perfectly addresses our stringent compliance requirements while maintaining the flexibility we need to innovate in the healthcare technology space.', rating: 5, avatar_url: 'https://randomuser.me/api/portraits/women/9.jpg' },
      { customer_name: 'Christopher Brown', company: 'RetailMax', role: 'Store Manager', original_text: 'Inventory management has never been easier.', ai_enhanced_text: 'Managing our inventory has never been more efficient. This solution has streamlined our processes and given us real-time visibility into our stock levels.', rating: 4, avatar_url: 'https://randomuser.me/api/portraits/men/10.jpg' },
      { customer_name: 'Michelle Davis', company: 'EduLearn', role: 'Academic Director', original_text: 'Students love the interactive features.', ai_enhanced_text: 'Our students have embraced the interactive features with enthusiasm. Engagement has soared, and we have seen measurable improvements in learning outcomes.', rating: 5, avatar_url: 'https://randomuser.me/api/portraits/women/11.jpg' },
      { customer_name: 'Daniel Taylor', company: 'Manufacturing Plus', role: 'Plant Manager', original_text: 'Production efficiency improved significantly.', ai_enhanced_text: 'Since implementation, our production efficiency has improved significantly. We have reduced downtime and optimized our manufacturing processes.', rating: 4, avatar_url: 'https://randomuser.me/api/portraits/men/12.jpg' },
      { customer_name: 'Rachel Green', company: 'Travel Experts', role: 'Operations Lead', original_text: 'Booking management is now seamless.', ai_enhanced_text: 'Our booking management process has become completely seamless. This solution has eliminated the friction that used to plague our operations.', rating: 5, avatar_url: 'https://randomuser.me/api/portraits/women/13.jpg' },
      { customer_name: 'Kevin Adams', company: 'LogiTrans', role: 'Logistics Director', original_text: 'Real-time tracking changed everything for us.', ai_enhanced_text: 'The real-time tracking capabilities have fundamentally transformed our logistics operations. We now have unprecedented visibility into our entire supply chain.', rating: 5, avatar_url: 'https://randomuser.me/api/portraits/men/14.jpg' },
      { customer_name: 'Nicole White', company: 'MediaPro', role: 'Content Manager', original_text: 'Content scheduling is now a breeze.', ai_enhanced_text: 'Managing and scheduling our content has become effortless. This platform has streamlined our editorial workflow and improved team collaboration.', rating: 5, avatar_url: 'https://randomuser.me/api/portraits/women/15.jpg' }
    ];

    for (const t of testimonials) {
      await pool.query(
        'INSERT INTO testimonials (customer_name, company, role, original_text, ai_enhanced_text, rating, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [t.customer_name, t.company, t.role, t.original_text, t.ai_enhanced_text, t.rating, t.avatar_url]
      );
    }

    console.log('Seeding case studies...');
    const caseStudies = [
      { title: 'How TechCorp Increased Revenue by 150%', company: 'TechCorp Inc', industry: 'Technology', challenge: 'Struggling with manual processes and data silos', solution: 'Implemented our integrated platform across all departments', results: '150% revenue increase, 60% reduction in manual tasks', metrics_json: { revenue_increase: '150%', time_saved: '60%', roi: '300%' } },
      { title: 'StartupXYZ: From 10 to 100 Employees', company: 'StartupXYZ', industry: 'SaaS', challenge: 'Rapid scaling causing operational chaos', solution: 'Deployed scalable infrastructure and automation tools', results: 'Successfully scaled 10x while maintaining quality', metrics_json: { employee_growth: '10x', efficiency: '200%', customer_satisfaction: '95%' } },
      { title: 'Global Solutions Marketing Transformation', company: 'Global Solutions', industry: 'Marketing', challenge: 'Low conversion rates and poor lead quality', solution: 'Implemented AI-driven marketing automation', results: '40% increase in conversions, 50% better lead quality', metrics_json: { conversion_rate: '+40%', lead_quality: '+50%', cost_per_lead: '-30%' } },
      { title: 'InnovateTech Product Development Revolution', company: 'InnovateTech', industry: 'Technology', challenge: 'Slow product development cycles', solution: 'Adopted agile methodology with our project tools', results: 'Reduced time-to-market by 50%', metrics_json: { time_to_market: '-50%', bug_rate: '-70%', team_velocity: '+80%' } },
      { title: 'Enterprise Co Operational Excellence', company: 'Enterprise Co', industry: 'Enterprise', challenge: 'Inefficient cross-department communication', solution: 'Unified communication and workflow platform', results: 'Improved collaboration, reduced meeting time by 40%', metrics_json: { meeting_time: '-40%', project_completion: '+35%', employee_satisfaction: '+25%' } },
      { title: 'DataDriven LLC Analytics Upgrade', company: 'DataDriven LLC', industry: 'Analytics', challenge: 'Fragmented data sources and slow insights', solution: 'Centralized data warehouse with real-time analytics', results: 'Real-time insights, 80% faster reporting', metrics_json: { reporting_speed: '+80%', data_accuracy: '+95%', decision_time: '-60%' } },
      { title: 'Creative Agency Workflow Optimization', company: 'Creative Agency', industry: 'Creative', challenge: 'Disorganized project management and asset storage', solution: 'Implemented creative workflow management system', results: 'Streamlined processes, 50% faster project delivery', metrics_json: { project_delivery: '+50%', client_revisions: '-40%', team_efficiency: '+60%' } },
      { title: 'FinanceHub Cost Reduction Initiative', company: 'FinanceHub', industry: 'Finance', challenge: 'High operational costs and manual processes', solution: 'Automated financial workflows and reporting', results: 'Reduced costs by 35%, eliminated manual errors', metrics_json: { cost_reduction: '35%', error_rate: '-99%', processing_time: '-70%' } },
      { title: 'HealthTech Solutions Compliance Success', company: 'HealthTech Solutions', industry: 'Healthcare', challenge: 'Complex regulatory compliance requirements', solution: 'Deployed compliance management platform', results: '100% compliance rate, reduced audit time by 60%', metrics_json: { compliance_rate: '100%', audit_time: '-60%', risk_reduction: '80%' } },
      { title: 'RetailMax Inventory Revolution', company: 'RetailMax', industry: 'Retail', challenge: 'Inventory inaccuracies and stockouts', solution: 'Real-time inventory management system', results: '99% inventory accuracy, 70% reduction in stockouts', metrics_json: { inventory_accuracy: '99%', stockout_reduction: '70%', carrying_cost: '-25%' } },
      { title: 'EduLearn Student Engagement Boost', company: 'EduLearn', industry: 'Education', challenge: 'Low student engagement and completion rates', solution: 'Interactive learning platform with gamification', results: '85% course completion rate, 90% satisfaction', metrics_json: { completion_rate: '85%', satisfaction: '90%', engagement: '+150%' } },
      { title: 'Manufacturing Plus Efficiency Gains', company: 'Manufacturing Plus', industry: 'Manufacturing', challenge: 'Production inefficiencies and downtime', solution: 'Predictive maintenance and IoT integration', results: '40% reduction in downtime, 25% efficiency increase', metrics_json: { downtime_reduction: '40%', efficiency_increase: '25%', maintenance_cost: '-30%' } },
      { title: 'Travel Experts Booking Transformation', company: 'Travel Experts', industry: 'Travel', challenge: 'Complex booking processes and errors', solution: 'Unified booking management platform', results: '95% booking accuracy, 60% faster processing', metrics_json: { booking_accuracy: '95%', processing_speed: '+60%', customer_complaints: '-80%' } },
      { title: 'LogiTrans Supply Chain Visibility', company: 'LogiTrans', industry: 'Logistics', challenge: 'Lack of real-time visibility in supply chain', solution: 'End-to-end tracking and analytics platform', results: 'Complete visibility, 30% reduction in delays', metrics_json: { visibility: '100%', delay_reduction: '30%', cost_savings: '20%' } },
      { title: 'MediaPro Content Strategy Success', company: 'MediaPro', industry: 'Media', challenge: 'Inconsistent content delivery and scheduling', solution: 'Content management and scheduling platform', results: '100% on-time delivery, 50% more content produced', metrics_json: { on_time_delivery: '100%', content_output: '+50%', engagement: '+75%' } }
    ];

    for (const cs of caseStudies) {
      await pool.query(
        'INSERT INTO case_studies (title, company, industry, challenge, solution, results, metrics_json) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [cs.title, cs.company, cs.industry, cs.challenge, cs.solution, cs.results, JSON.stringify(cs.metrics_json)]
      );
    }

    console.log('Seeding reviews...');
    const reviews = [
      { source: 'G2', customer_name: 'Tech Reviewer', rating: 5, original_review: 'Best software I have used in years. Highly recommend!', ai_summary: 'Exceptional software with strong recommendation from experienced user.', sentiment: 'positive' },
      { source: 'Capterra', customer_name: 'Business Owner', rating: 5, original_review: 'Transformed our business operations completely.', ai_summary: 'Complete business transformation achieved through the platform.', sentiment: 'positive' },
      { source: 'TrustPilot', customer_name: 'Marketing Manager', rating: 4, original_review: 'Great features but took some time to learn.', ai_summary: 'Powerful features with moderate learning curve.', sentiment: 'positive' },
      { source: 'G2', customer_name: 'IT Director', rating: 5, original_review: 'Security features are enterprise-grade. Very impressed.', ai_summary: 'Enterprise-level security that exceeds expectations.', sentiment: 'positive' },
      { source: 'Capterra', customer_name: 'Project Manager', rating: 5, original_review: 'Finally a tool that our whole team actually uses.', ai_summary: 'High team adoption and practical usability.', sentiment: 'positive' },
      { source: 'TrustPilot', customer_name: 'Startup Founder', rating: 5, original_review: 'Perfect for growing teams. Scales beautifully.', ai_summary: 'Excellent scalability for growing organizations.', sentiment: 'positive' },
      { source: 'G2', customer_name: 'Operations Lead', rating: 4, original_review: 'Solid platform with good integrations.', ai_summary: 'Reliable platform with strong integration capabilities.', sentiment: 'positive' },
      { source: 'Capterra', customer_name: 'Sales Director', rating: 5, original_review: 'Our sales cycle shortened by 30% after implementation.', ai_summary: 'Significant sales cycle reduction demonstrating clear ROI.', sentiment: 'positive' },
      { source: 'TrustPilot', customer_name: 'HR Manager', rating: 5, original_review: 'Onboarding new employees is now so much easier.', ai_summary: 'Streamlined employee onboarding process.', sentiment: 'positive' },
      { source: 'G2', customer_name: 'Finance Manager', rating: 4, original_review: 'Good reporting features. Would like more customization.', ai_summary: 'Strong reporting with room for more customization options.', sentiment: 'positive' },
      { source: 'Capterra', customer_name: 'Customer Success', rating: 5, original_review: 'Our customers love the portal we built with this.', ai_summary: 'Enables creation of customer-pleasing portals.', sentiment: 'positive' },
      { source: 'TrustPilot', customer_name: 'Agency Owner', rating: 5, original_review: 'Managing multiple clients has never been easier.', ai_summary: 'Excellent for multi-client management scenarios.', sentiment: 'positive' },
      { source: 'G2', customer_name: 'Developer', rating: 5, original_review: 'API is well documented and easy to integrate.', ai_summary: 'Developer-friendly with excellent API documentation.', sentiment: 'positive' },
      { source: 'Capterra', customer_name: 'Support Manager', rating: 5, original_review: 'Their support team is incredibly responsive.', ai_summary: 'Outstanding customer support responsiveness.', sentiment: 'positive' },
      { source: 'TrustPilot', customer_name: 'Product Owner', rating: 5, original_review: 'Regular updates with features we actually need.', ai_summary: 'Continuous improvement with user-focused feature updates.', sentiment: 'positive' }
    ];

    for (const r of reviews) {
      await pool.query(
        'INSERT INTO reviews (source, customer_name, rating, original_review, ai_summary, sentiment) VALUES ($1, $2, $3, $4, $5, $6)',
        [r.source, r.customer_name, r.rating, r.original_review, r.ai_summary, r.sentiment]
      );
    }

    console.log('Seeding social widgets...');
    const socialWidgets = [
      { widget_type: 'customer_count', title: 'Trusted by Thousands', content: 'Join over 10,000 satisfied customers worldwide', stats_json: { customer_count: 10000, countries: 50 } },
      { widget_type: 'rating_badge', title: 'Top Rated Solution', content: '4.9 out of 5 stars from verified users', stats_json: { rating: 4.9, review_count: 2500 } },
      { widget_type: 'social_proof', title: 'Industry Leaders Trust Us', content: 'Used by Fortune 500 companies', stats_json: { fortune_500_count: 50, enterprise_clients: 200 } },
      { widget_type: 'recent_activity', title: 'Real-Time Activity', content: 'See what customers are achieving right now', stats_json: { daily_actions: 50000, active_users: 5000 } },
      { widget_type: 'testimonial_carousel', title: 'What Customers Say', content: 'Hear from real users about their experience', stats_json: { testimonial_count: 500, video_testimonials: 50 } },
      { widget_type: 'trust_badges', title: 'Security & Compliance', content: 'Enterprise-grade security you can trust', stats_json: { certifications: ['SOC2', 'GDPR', 'HIPAA'] } },
      { widget_type: 'comparison', title: 'Why Choose Us', content: 'See how we compare to alternatives', stats_json: { features_vs_competitors: 25, price_advantage: '40%' } },
      { widget_type: 'awards', title: 'Award-Winning Platform', content: 'Recognized by industry experts', stats_json: { awards_count: 15, years_awarded: 5 } },
      { widget_type: 'case_study_preview', title: 'Success Stories', content: 'Read how companies achieved results', stats_json: { case_studies: 100, industries: 20 } },
      { widget_type: 'integration_showcase', title: 'Works With Your Tools', content: 'Seamlessly integrates with your stack', stats_json: { integrations: 200, categories: 15 } },
      { widget_type: 'team_showcase', title: 'Meet Our Team', content: 'Experts dedicated to your success', stats_json: { team_size: 150, support_response: '2 hours' } },
      { widget_type: 'milestone', title: 'Our Journey', content: 'Growing together with our customers', stats_json: { years_in_business: 10, milestones: 25 } },
      { widget_type: 'live_stats', title: 'Platform Statistics', content: 'Real-time platform performance', stats_json: { uptime: '99.99%', data_processed: '10PB' } },
      { widget_type: 'newsletter_social', title: 'Stay Updated', content: 'Join our growing community', stats_json: { subscribers: 50000, open_rate: '45%' } },
      { widget_type: 'pricing_social', title: 'Fair Pricing', content: 'Transparent pricing loved by customers', stats_json: { satisfaction_rate: '98%', price_lock_guarantee: true } }
    ];

    for (const sw of socialWidgets) {
      await pool.query(
        'INSERT INTO social_widgets (widget_type, title, content, stats_json) VALUES ($1, $2, $3, $4)',
        [sw.widget_type, sw.title, sw.content, JSON.stringify(sw.stats_json)]
      );
    }

    console.log('Seeding success metrics...');
    const successMetrics = [
      { metric_name: 'Customer Satisfaction', value: '98%', context: 'Based on post-interaction surveys', ai_description: 'An outstanding 98% of our customers report satisfaction, reflecting our commitment to exceptional service.', icon: 'star' },
      { metric_name: 'Revenue Growth', value: '150%', context: 'Year-over-year growth', ai_description: 'Our customers achieve an average of 150% revenue growth after implementing our solution.', icon: 'trending-up' },
      { metric_name: 'Time Saved', value: '20 hours/week', context: 'Per team member average', ai_description: 'Teams save an average of 20 hours per week, freeing up time for strategic initiatives.', icon: 'clock' },
      { metric_name: 'Active Users', value: '100,000+', context: 'Monthly active users', ai_description: 'Over 100,000 users actively rely on our platform every month to drive their success.', icon: 'users' },
      { metric_name: 'Uptime', value: '99.99%', context: 'Platform reliability', ai_description: 'Our 99.99% uptime ensures your business never misses a beat.', icon: 'shield' },
      { metric_name: 'Support Response', value: '<2 hours', context: 'Average first response time', ai_description: 'Our dedicated support team responds to queries in under 2 hours on average.', icon: 'message-circle' },
      { metric_name: 'ROI', value: '300%', context: 'Average return on investment', ai_description: 'Customers see an average 300% return on their investment within the first year.', icon: 'dollar-sign' },
      { metric_name: 'NPS Score', value: '72', context: 'Net Promoter Score', ai_description: 'Our NPS of 72 places us among the top-rated solutions in the industry.', icon: 'thumbs-up' },
      { metric_name: 'Data Processed', value: '10PB+', context: 'Monthly data processing', ai_description: 'We securely process over 10 petabytes of data monthly, powering insights at scale.', icon: 'database' },
      { metric_name: 'Integrations', value: '200+', context: 'Third-party integrations', ai_description: 'Connect with over 200 tools and services to create your perfect workflow.', icon: 'link' },
      { metric_name: 'Countries Served', value: '50+', context: 'Global presence', ai_description: 'Our platform serves customers in over 50 countries around the world.', icon: 'globe' },
      { metric_name: 'Team Productivity', value: '+45%', context: 'Average productivity increase', ai_description: 'Teams report an average 45% increase in productivity after adoption.', icon: 'zap' },
      { metric_name: 'Cost Reduction', value: '35%', context: 'Average operational savings', ai_description: 'Customers reduce operational costs by an average of 35% with our solution.', icon: 'percent' },
      { metric_name: 'Deployment Time', value: '< 1 week', context: 'Average time to go live', ai_description: 'Get up and running in less than a week with our streamlined onboarding process.', icon: 'rocket' },
      { metric_name: 'Feature Adoption', value: '85%', context: 'Average feature utilization', ai_description: 'Users actively engage with 85% of available features, maximizing their investment.', icon: 'check-circle' }
    ];

    for (const sm of successMetrics) {
      await pool.query(
        'INSERT INTO success_metrics (metric_name, value, context, ai_description, icon) VALUES ($1, $2, $3, $4, $5)',
        [sm.metric_name, sm.value, sm.context, sm.ai_description, sm.icon]
      );
    }

    console.log('Seeding customer quotes...');
    const customerQuotes = [
      { customer_name: 'Sarah Johnson', company: 'TechCorp Inc', original_quote: 'this thing is like really good and helped us a lot', polished_quote: 'This solution has been transformative for our organization, delivering significant value and helping us achieve our goals.', use_case: 'Enterprise' },
      { customer_name: 'Michael Chen', company: 'StartupXYZ', original_quote: 'we couldnt have scaled without it tbh', polished_quote: 'Honestly, we could not have achieved our growth trajectory without this platform. It has been instrumental to our scaling success.', use_case: 'Startup' },
      { customer_name: 'Emily Rodriguez', company: 'Global Solutions', original_quote: 'marketing results went thru the roof!!', polished_quote: 'Our marketing results have exceeded all expectations since implementing this solution. The impact has been remarkable.', use_case: 'Marketing' },
      { customer_name: 'David Kim', company: 'InnovateTech', original_quote: 'AI stuff is actually useful unlike other tools', polished_quote: 'The AI capabilities are genuinely useful and practical, setting this apart from other tools we have tried.', use_case: 'Technology' },
      { customer_name: 'Lisa Thompson', company: 'Enterprise Co', original_quote: 'support team always has our back', polished_quote: 'The support team has consistently been there for us, providing responsive and knowledgeable assistance whenever needed.', use_case: 'Enterprise' },
      { customer_name: 'James Wilson', company: 'DataDriven LLC', original_quote: 'finally analytics that make sense lol', polished_quote: 'Finally, we have analytics that are intuitive and actionable. It has transformed how we make data-driven decisions.', use_case: 'Analytics' },
      { customer_name: 'Amanda Foster', company: 'Creative Agency', original_quote: 'my team actually likes using this one', polished_quote: 'Our team has genuinely embraced this platform. It is rare to find a tool that achieves such strong adoption.', use_case: 'Creative' },
      { customer_name: 'Robert Martinez', company: 'FinanceHub', original_quote: 'saved so much money its crazy', polished_quote: 'The cost savings we have achieved have been substantial. This investment has paid for itself many times over.', use_case: 'Finance' },
      { customer_name: 'Jennifer Lee', company: 'HealthTech Solutions', original_quote: 'compliance stuff is handled finally', polished_quote: 'Our compliance requirements are finally being met efficiently. This solution has simplified a previously complex process.', use_case: 'Healthcare' },
      { customer_name: 'Christopher Brown', company: 'RetailMax', original_quote: 'inventory probs are basically gone now', polished_quote: 'Our inventory challenges have been virtually eliminated. We now have the visibility and control we always needed.', use_case: 'Retail' },
      { customer_name: 'Michelle Davis', company: 'EduLearn', original_quote: 'students are way more engaged now', polished_quote: 'Student engagement has increased dramatically. We are seeing better outcomes and higher satisfaction across the board.', use_case: 'Education' },
      { customer_name: 'Daniel Taylor', company: 'Manufacturing Plus', original_quote: 'production runs smooth as butter now', polished_quote: 'Our production processes now run seamlessly. Efficiency gains have exceeded our expectations.', use_case: 'Manufacturing' },
      { customer_name: 'Rachel Green', company: 'Travel Experts', original_quote: 'booking mistakes dropped to almost zero', polished_quote: 'Booking errors have been nearly eliminated, improving both operational efficiency and customer satisfaction.', use_case: 'Travel' },
      { customer_name: 'Kevin Adams', company: 'LogiTrans', original_quote: 'can see everything in the supply chain now', polished_quote: 'We now have complete visibility across our entire supply chain, enabling proactive management and optimization.', use_case: 'Logistics' },
      { customer_name: 'Nicole White', company: 'MediaPro', original_quote: 'content goes out on time every time now', polished_quote: 'Our content delivery is now consistently on schedule. This reliability has strengthened our client relationships.', use_case: 'Media' }
    ];

    for (const cq of customerQuotes) {
      await pool.query(
        'INSERT INTO customer_quotes (customer_name, company, original_quote, polished_quote, use_case) VALUES ($1, $2, $3, $4, $5)',
        [cq.customer_name, cq.company, cq.original_quote, cq.polished_quote, cq.use_case]
      );
    }

    console.log('Seeding video testimonials...');
    const videoTestimonials = [
      { customer_name: 'Sarah Johnson', company: 'TechCorp Inc', role: 'CTO', video_url: 'https://videos.example.com/testimonial-001.mp4', thumbnail_url: 'https://images.example.com/thumb-001.jpg', duration: '2:34', original_transcript: 'Um, so we started using this platform about six months ago and honestly, it was like, a game changer for us. Our team productivity went through the roof.', ai_edited_transcript: 'We started using this platform about six months ago, and it has been a game changer for us. Our team productivity has increased significantly.', ai_highlights: 'Game changer for our team, Productivity went through the roof, Started six months ago', ai_summary: 'CTO shares how the platform transformed their team productivity within six months of adoption.', tags: 'enterprise, productivity, technology', rating: 5, status: 'published' },
      { customer_name: 'Michael Chen', company: 'StartupXYZ', role: 'Founder & CEO', video_url: 'https://videos.example.com/testimonial-002.mp4', thumbnail_url: 'https://images.example.com/thumb-002.jpg', duration: '3:12', original_transcript: 'As a startup founder, every dollar counts, you know? This solution helped us scale from 10 to 100 employees without the growing pains we expected.', ai_edited_transcript: 'As a startup founder, every dollar counts. This solution helped us scale from 10 to 100 employees without the growing pains we expected.', ai_highlights: 'Scaled from 10 to 100 employees, Cost-effective solution, No growing pains', ai_summary: 'Startup founder explains how the platform enabled smooth 10x team scaling.', tags: 'startup, scaling, growth', rating: 5, status: 'published' },
      { customer_name: 'Emily Rodriguez', company: 'Global Solutions', role: 'Marketing Director', video_url: 'https://videos.example.com/testimonial-003.mp4', thumbnail_url: 'https://images.example.com/thumb-003.jpg', duration: '2:45', original_transcript: 'Our marketing campaigns are now like, so much more effective. We saw a 40% increase in conversions within the first quarter.', ai_edited_transcript: 'Our marketing campaigns are now significantly more effective. We saw a 40% increase in conversions within the first quarter.', ai_highlights: '40% increase in conversions, First quarter results, More effective campaigns', ai_summary: 'Marketing Director shares impressive 40% conversion rate improvement in just one quarter.', tags: 'marketing, conversions, ROI', rating: 5, status: 'published' },
      { customer_name: 'David Kim', company: 'InnovateTech', role: 'Product Manager', video_url: 'https://videos.example.com/testimonial-004.mp4', thumbnail_url: 'https://images.example.com/thumb-004.jpg', duration: '2:18', original_transcript: 'The AI features are unlike anything else on the market. They actually work and save us hours every single day.', ai_edited_transcript: 'The AI features are unlike anything else on the market. They actually work and save us hours every day.', ai_highlights: 'AI features that actually work, Hours saved daily, Market-leading technology', ai_summary: 'Product Manager highlights the practical AI features that save hours of work daily.', tags: 'AI, automation, time-saving', rating: 5, status: 'published' },
      { customer_name: 'Lisa Thompson', company: 'Enterprise Co', role: 'VP of Operations', video_url: 'https://videos.example.com/testimonial-005.mp4', thumbnail_url: 'https://images.example.com/thumb-005.jpg', duration: '3:45', original_transcript: 'Customer support has been phenomenal. Anytime we have an issue, they are right there to help us through it.', ai_edited_transcript: 'Customer support has been phenomenal. Whenever we have an issue, they are right there to help us through it.', ai_highlights: 'Phenomenal customer support, Always available help, Quick issue resolution', ai_summary: 'VP of Operations praises the exceptional customer support and responsiveness.', tags: 'support, enterprise, service', rating: 5, status: 'published' },
      { customer_name: 'James Wilson', company: 'DataDriven LLC', role: 'Data Scientist', video_url: 'https://videos.example.com/testimonial-006.mp4', thumbnail_url: 'https://images.example.com/thumb-006.jpg', duration: '2:56', original_transcript: 'The analytics dashboard is just beautiful. I can see all our KPIs at a glance and make data-driven decisions faster.', ai_edited_transcript: 'The analytics dashboard is beautifully designed. I can see all our KPIs at a glance and make data-driven decisions faster.', ai_highlights: 'Beautiful analytics dashboard, All KPIs at a glance, Faster decisions', ai_summary: 'Data Scientist appreciates the intuitive analytics dashboard for quick decision-making.', tags: 'analytics, data, visualization', rating: 4, status: 'published' },
      { customer_name: 'Amanda Foster', company: 'Creative Agency', role: 'Creative Director', video_url: 'https://videos.example.com/testimonial-007.mp4', thumbnail_url: 'https://images.example.com/thumb-007.jpg', duration: '2:22', original_transcript: 'My creative team actually enjoys using this tool. That never happens with enterprise software, trust me.', ai_edited_transcript: 'My creative team actually enjoys using this tool. That rarely happens with enterprise software.', ai_highlights: 'Team enjoys using it, Unlike typical enterprise software, High adoption rate', ai_summary: 'Creative Director notes the unusual high adoption and enjoyment among creative teams.', tags: 'creative, design, user experience', rating: 5, status: 'published' },
      { customer_name: 'Robert Martinez', company: 'FinanceHub', role: 'CFO', video_url: 'https://videos.example.com/testimonial-008.mp4', thumbnail_url: 'https://images.example.com/thumb-008.jpg', duration: '3:08', original_transcript: 'The ROI on this investment was clear within the first month. We have saved thousands in operational costs.', ai_edited_transcript: 'The ROI on this investment was clear within the first month. We have saved thousands in operational costs.', ai_highlights: 'Clear ROI in first month, Thousands in savings, Operational cost reduction', ai_summary: 'CFO confirms rapid ROI realization with significant operational cost savings.', tags: 'finance, ROI, cost savings', rating: 5, status: 'published' },
      { customer_name: 'Jennifer Lee', company: 'HealthTech Solutions', role: 'CEO', video_url: 'https://videos.example.com/testimonial-009.mp4', thumbnail_url: 'https://images.example.com/thumb-009.jpg', duration: '3:33', original_transcript: 'In healthcare, compliance is everything. This platform handles our HIPAA requirements seamlessly.', ai_edited_transcript: 'In healthcare, compliance is everything. This platform handles our HIPAA requirements seamlessly.', ai_highlights: 'Seamless HIPAA compliance, Healthcare-ready, Compliance handled', ai_summary: 'Healthcare CEO emphasizes seamless compliance handling for strict industry requirements.', tags: 'healthcare, compliance, HIPAA', rating: 5, status: 'published' },
      { customer_name: 'Christopher Brown', company: 'RetailMax', role: 'Store Manager', video_url: 'https://videos.example.com/testimonial-010.mp4', thumbnail_url: 'https://images.example.com/thumb-010.jpg', duration: '2:15', original_transcript: 'Inventory management used to be a nightmare. Now I can see everything in real-time and prevent stockouts.', ai_edited_transcript: 'Inventory management used to be a nightmare. Now I can see everything in real-time and prevent stockouts.', ai_highlights: 'Real-time inventory visibility, Stockout prevention, Nightmare solved', ai_summary: 'Store Manager describes transformation from inventory nightmares to real-time control.', tags: 'retail, inventory, real-time', rating: 4, status: 'published' },
      { customer_name: 'Michelle Davis', company: 'EduLearn', role: 'Academic Director', video_url: 'https://videos.example.com/testimonial-011.mp4', thumbnail_url: 'https://images.example.com/thumb-011.jpg', duration: '2:48', original_transcript: 'Student engagement has increased by 85% since we implemented this platform. The interactive features are amazing.', ai_edited_transcript: 'Student engagement has increased by 85% since we implemented this platform. The interactive features are amazing.', ai_highlights: '85% increase in engagement, Amazing interactive features, Student success', ai_summary: 'Academic Director reports 85% boost in student engagement through interactive features.', tags: 'education, engagement, interactive', rating: 5, status: 'published' },
      { customer_name: 'Daniel Taylor', company: 'Manufacturing Plus', role: 'Plant Manager', video_url: 'https://videos.example.com/testimonial-012.mp4', thumbnail_url: 'https://images.example.com/thumb-012.jpg', duration: '3:22', original_transcript: 'Production downtime has dropped by 40% since implementing the predictive maintenance features.', ai_edited_transcript: 'Production downtime has dropped by 40% since implementing the predictive maintenance features.', ai_highlights: '40% reduction in downtime, Predictive maintenance, Production efficiency', ai_summary: 'Plant Manager credits predictive maintenance for dramatic 40% downtime reduction.', tags: 'manufacturing, maintenance, IoT', rating: 5, status: 'published' },
      { customer_name: 'Rachel Green', company: 'Travel Experts', role: 'Operations Lead', video_url: 'https://videos.example.com/testimonial-013.mp4', thumbnail_url: 'https://images.example.com/thumb-013.jpg', duration: '2:38', original_transcript: 'Booking errors have dropped to nearly zero. Our customers are happier and our team is less stressed.', ai_edited_transcript: 'Booking errors have dropped to nearly zero. Our customers are happier and our team is less stressed.', ai_highlights: 'Near-zero booking errors, Happier customers, Less stressed team', ai_summary: 'Operations Lead celebrates elimination of booking errors and improved team morale.', tags: 'travel, bookings, customer satisfaction', rating: 5, status: 'published' },
      { customer_name: 'Kevin Adams', company: 'LogiTrans', role: 'Logistics Director', video_url: 'https://videos.example.com/testimonial-014.mp4', thumbnail_url: 'https://images.example.com/thumb-014.jpg', duration: '3:05', original_transcript: 'Real-time tracking across our entire supply chain. We can see shipments from origin to delivery.', ai_edited_transcript: 'Real-time tracking across our entire supply chain. We can monitor shipments from origin to delivery.', ai_highlights: 'End-to-end tracking, Real-time visibility, Complete supply chain view', ai_summary: 'Logistics Director highlights complete supply chain visibility with real-time tracking.', tags: 'logistics, tracking, supply chain', rating: 5, status: 'published' },
      { customer_name: 'Nicole White', company: 'MediaPro', role: 'Content Manager', video_url: 'https://videos.example.com/testimonial-015.mp4', thumbnail_url: 'https://images.example.com/thumb-015.jpg', duration: '2:28', original_transcript: 'We publish 50% more content now with the same team. The workflow automation is incredible.', ai_edited_transcript: 'We publish 50% more content now with the same team size. The workflow automation is incredible.', ai_highlights: '50% more content output, Same team size, Incredible automation', ai_summary: 'Content Manager achieved 50% productivity increase through workflow automation.', tags: 'media, content, automation', rating: 5, status: 'published' }
    ];

    for (const vt of videoTestimonials) {
      await pool.query(
        'INSERT INTO video_testimonials (customer_name, company, role, video_url, thumbnail_url, duration, original_transcript, ai_edited_transcript, ai_highlights, ai_summary, tags, rating, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
        [vt.customer_name, vt.company, vt.role, vt.video_url, vt.thumbnail_url, vt.duration, vt.original_transcript, vt.ai_edited_transcript, vt.ai_highlights, vt.ai_summary, vt.tags, vt.rating, vt.status]
      );
    }

    console.log('Seed completed successfully!');
    console.log('Test accounts:');
    console.log('  Admin: demo@example.com / demo123');
    console.log('  Editor: editor@example.com / Editor123!');
    console.log('  Viewer: viewer@example.com / Viewer123!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
