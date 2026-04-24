const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/auth');

// ─── Centralized OpenRouter caller with robust JSON extraction ───────────────

const callOpenRouter = async (prompt, systemPrompt = '') => {
  const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const OPENROUTER_API_URL = `${OPENROUTER_BASE_URL}/chat/completions`;
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in .env file.');
  }

  console.log('Calling OpenRouter API with model:', OPENROUTER_MODEL);

  const randomSeed = Math.random().toString(36).substring(7);
  const enhancedPrompt = `${prompt}\n\n[Generate unique, creative content. Variation seed: ${randomSeed}]`;

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful assistant that generates professional marketing content. You MUST respond with raw JSON only — no markdown, no code fences, no explanation.' },
          { role: 'user', content: enhancedPrompt }
        ],
        max_tokens: 4096,
        temperature: 0.85
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': 'AI Social Proof Generator'
        }
      }
    );

    // Check for truncation
    const choice = response.data.choices[0];
    if (choice.finish_reason === 'length') {
      console.warn('WARNING: Response was truncated (finish_reason: length). Consider increasing max_tokens.');
    }

    let content = choice.message.content;

    // ── Strip markdown code fences (```json ... ```, ``` ... ```, etc.) ──
    content = content.trim();
    // Remove opening fence: ```json or ```JSON or ``` with optional language tag
    content = content.replace(/^```(?:json|JSON)?\s*\n?/, '');
    // Remove closing fence
    content = content.replace(/\n?\s*```\s*$/, '');
    content = content.trim();

    // ── If there's still non-JSON text before the { or [, strip it ──
    const firstBrace = content.indexOf('{');
    const firstBracket = content.indexOf('[');
    let jsonStart = -1;
    if (firstBrace >= 0 && firstBracket >= 0) {
      jsonStart = Math.min(firstBrace, firstBracket);
    } else if (firstBrace >= 0) {
      jsonStart = firstBrace;
    } else if (firstBracket >= 0) {
      jsonStart = firstBracket;
    }

    if (jsonStart > 0) {
      content = content.substring(jsonStart);
    }

    // ── Strip trailing text after the last } or ] ──
    const lastBrace = content.lastIndexOf('}');
    const lastBracket = content.lastIndexOf(']');
    const jsonEnd = Math.max(lastBrace, lastBracket);
    if (jsonEnd >= 0 && jsonEnd < content.length - 1) {
      content = content.substring(0, jsonEnd + 1);
    }

    console.log('OpenRouter response cleaned successfully');
    return content;
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.response?.data?.error || error.message;
    console.error('OpenRouter API error:', errorMessage);
    throw new Error(errorMessage || 'AI service error');
  }
};

// Helper: safely parse JSON from AI response
const safeParseJSON = (text, fallbackFields = {}) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('JSON parse failed. Raw text:', text.substring(0, 300));
    return fallbackFields;
  }
};

// ─── Generate enhanced testimonial ───────────────────────────────────────────

router.post('/generate-testimonial', authMiddleware, async (req, res) => {
  try {
    const { original_text, customer_name, company, role } = req.body;

    const systemPrompt = `You are an elite marketing copywriter with 15+ years of experience crafting customer testimonials for high-growth B2B SaaS companies like HubSpot, Salesforce, Slack, and Notion. You have deep expertise in persuasion psychology and conversion copywriting.

YOUR CORE PRINCIPLES:
- The "Before/After/Bridge" framework: Paint the pain BEFORE the product, show the transformation AFTER, and bridge with specific metrics
- Specificity is credibility: "Saved 12.5 hours/week" beats "saved time." "Grew revenue 340% in Q3" beats "grew revenue"
- Authentic voice > corporate polish: Great testimonials sound like a real person talking at a conference, not a press release
- The "Dinner Party Test": Would someone actually say this at a dinner party when asked about a tool they love?
- Emotional hook + rational proof: Start with how it FELT, end with what it ACHIEVED
- Power of three: Use three specific details/metrics for maximum impact

WRITING TECHNIQUES TO APPLY:
- Open with a surprising or bold claim that hooks the reader
- Include at least one specific number (revenue, time saved, percentage improvement, team size, timeframe)
- Name a concrete feature or capability (not just "the platform")
- End with a forward-looking statement or recommendation
- Use active voice and strong verbs (transformed, eliminated, accelerated, unlocked)
- Avoid: buzzwords (synergy, leverage, optimize), passive voice, vague claims, excessive superlatives

CRITICAL: You MUST respond with raw JSON only. No markdown fences, no explanation, no commentary — just a single JSON object.`;

    const prompt = original_text
      ? `Transform this raw customer feedback into a polished, high-converting testimonial that could be featured on a homepage hero section or in a sales deck.

INPUT DATA:
- Raw feedback: "${original_text}"
- Customer name: ${customer_name || '[generate a realistic full name — use diverse names representing different ethnicities and backgrounds]'}
- Company: ${company || '[generate a realistic B2B company name — something like "Meridian Analytics", "Stackpath Solutions", or "Brightwave Labs" — NOT a real famous company]'}
- Job title: ${role || '[generate a senior-level title: VP of Operations, Head of Growth, Director of Engineering, Chief Product Officer, etc.]'}

YOUR TASK:
1. PRESERVE the core message, sentiment, and personality of the original — this is their voice, not yours
2. ENHANCE with specificity — if they said "saved us time," make it "cut our weekly reporting from 6 hours to 45 minutes." If they said "great product," make it about a SPECIFIC capability
3. ADD plausible metrics that align with their industry (e.g., SaaS: churn reduction, MRR growth, time-to-value; E-commerce: conversion rate, AOV, cart abandonment; Agency: client retention, project turnaround, billable hours)
4. STRUCTURE as: emotional hook → specific transformation → measurable result → recommendation or forward-looking statement
5. Keep it 2-4 sentences — punchy enough for a homepage card, detailed enough for a case study pull quote
6. RATE based on sentiment: enthusiastic praise = 5, strong positive = 4, mixed = 3

GOOD EXAMPLE: "We were drowning in manual reporting — our analytics team spent 30+ hours every week just pulling data from five different tools. Within two weeks of implementing [product], we automated 90% of those workflows. Last quarter, that freed up enough bandwidth for our team to build three new predictive models that directly drove $2.1M in pipeline."

BAD EXAMPLE: "Great product that helped us optimize our workflows and drive synergies across the organization. Highly recommended for anyone looking to leverage technology."

Return this exact JSON structure:
{
  "customer_name": "Full Name",
  "company": "Company Name",
  "role": "Job Title",
  "original_text": "the original feedback EXACTLY as provided — do not modify",
  "ai_enhanced_text": "the polished testimonial: emotional hook + specific transformation + measurable result (2-4 sentences)",
  "rating": 5
}`
      : `Generate a complete, realistic customer testimonial for a B2B SaaS product. Choose ONE specific product category:
- Project management / collaboration (like Asana, Monday.com)
- Data analytics / BI (like Tableau, Looker)
- Marketing automation (like HubSpot, Marketo)
- Developer tools / DevOps (like GitHub, Datadog)
- Customer success / CRM (like Gainsight, Salesforce)
- HR / People ops (like Lattice, Rippling)

The testimonial must feel genuinely human. Imagine you're interviewing a real customer at a SaaS conference and they're genuinely excited about a product. They would:
- Mention a SPECIFIC pain point they had before (not just "things were hard")
- Name a SPECIFIC feature or capability that made the difference
- Share a CONCRETE result with a real number
- Express genuine emotion (relief, excitement, pride in their team's achievement)

Return this exact JSON structure:
{
  "customer_name": "a realistic, diverse full name",
  "company": "a fictional but realistic company name (e.g., 'Vantage Point Analytics', 'Cloudbridge Systems')",
  "role": "a specific senior title (VP of Revenue Operations, Head of Product Engineering, Director of Customer Success, etc.)",
  "original_text": "a casual, unpolished version — like what they'd type in Slack: informal, maybe a run-on sentence, genuine excitement or relief (1-2 sentences)",
  "ai_enhanced_text": "the polished website version: opens with a bold statement, includes a specific before/after transformation, cites a concrete metric, ends with a recommendation (2-4 sentences)",
  "rating": 5
}`;

    const generated = await callOpenRouter(prompt, systemPrompt);
    const parsed = safeParseJSON(generated, { ai_enhanced_text: generated });
    res.json(parsed);
  } catch (error) {
    console.error('Generate testimonial error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate testimonial' });
  }
});

// ─── Generate case study ─────────────────────────────────────────────────────

router.post('/generate-case-study', authMiddleware, async (req, res) => {
  try {
    const { company, industry, challenge, solution, results } = req.body;
    const hasData = company || challenge || solution;

    const systemPrompt = `You are a senior content strategist who has written case studies for McKinsey, Bain, HubSpot, and Salesforce. Your case studies have directly influenced 7- and 8-figure enterprise deals. You are a master of the "Challenge → Solution → Results" narrative framework.

YOUR STORYTELLING PRINCIPLES:
- The "Hollywood Structure": Every great case study has a hero (the customer), a villain (the problem), a guide (the product), and a climax (the results)
- Paint the pain VIVIDLY: Don't just say "they had a problem." Quantify the cost of inaction — lost revenue per month, wasted hours per week, employee turnover caused by frustration
- The implementation story matters: Readers want to know HOW — was it a 2-week sprint or a 6-month migration? Who was involved? What was the "aha moment"?
- Results must be MULTI-DIMENSIONAL: Include at least one metric from each category: (a) financial impact (revenue, cost savings, ROI), (b) operational efficiency (time saved, errors reduced, throughput increased), (c) human impact (team morale, customer satisfaction, employee retention)
- Use the "So What?" test: For every claim, ask "why should the reader care?" and answer that question
- Timeframes add credibility: "in 90 days" or "within the first quarter" or "by month 3" — always anchor results to time

INDUSTRY KNOWLEDGE TO DRAW FROM:
- SaaS metrics: ARR, MRR, CAC, LTV, churn rate, NPS, time-to-value, activation rate
- E-commerce: conversion rate, AOV, cart abandonment, ROAS, customer acquisition cost
- FinTech: transaction volume, processing time, compliance rate, fraud detection rate
- Healthcare: patient outcomes, readmission rates, provider efficiency, compliance adherence
- Manufacturing: defect rate, throughput, downtime reduction, inventory optimization

WRITING STYLE:
- Professional but not stiff — write like a top-tier business journalist
- Use concrete details: team sizes, tool names, specific workflows
- Include direct quotes or paraphrased insights from stakeholders
- Use transition phrases that build momentum: "But the real breakthrough came when...", "What surprised the team most was...", "The numbers told the story..."

CRITICAL: You MUST respond with raw JSON only. No markdown fences, no explanation, no commentary — just a single JSON object.`;

    const prompt = hasData
      ? `Create a compelling, publication-ready B2B case study from the following raw information. Your goal is to make the reader think: "I want those results for MY company."

INPUT DATA:
- Company: ${company || '[generate a fictional but realistic company name like "Horizon Dynamics" or "Clearpath Logistics"]'}
- Industry: ${industry || '[determine the most fitting industry based on the challenge/solution context]'}
- Challenge: ${challenge || '[generate a vivid, specific business challenge with quantified pain]'}
- Solution: ${solution || '[generate a detailed implementation story]'}
- Results: ${results || '[generate 4-5 impressive but believable metrics with timeframes]'}

YOUR TASK:
1. TITLE: Results-driven and specific. Format: "How [Company] [Achieved Specific Result] in [Timeframe]"
   GOOD: "How Meridian Health Reduced Patient Wait Times by 67% and Saved $1.2M in 6 Months"
   BAD: "How a Company Improved Their Operations"

2. CHALLENGE (4-6 sentences): Paint the "before" picture vividly:
   - What was the specific business problem? (Name the workflows, tools, or processes that were broken)
   - What was the COST of this problem? ($$, hours wasted, deals lost, employee frustration)
   - What had they tried before that failed? (Shows they're sophisticated buyers, not desperate)
   - What was the tipping point that made them seek a new solution?

3. SOLUTION (4-6 sentences): Tell the implementation story:
   - How did they discover/evaluate the product? (Demo, referral, competitive bake-off?)
   - What was the implementation timeline and process? (Phased rollout, pilot team, full deployment?)
   - Which specific features or capabilities were most impactful?
   - Who championed the project internally? (CTO, VP of Ops, individual contributor who became an advocate?)
   - What was the "aha moment" when the team realized this was working?

4. RESULTS (4-6 sentences): Lead with the headline metric, then support with 3-4 more:
   - Financial: revenue increase, cost reduction, ROI percentage, payback period
   - Operational: time saved per week/month, error reduction, throughput increase, cycle time reduction
   - Strategic: new capabilities unlocked, competitive advantages gained, market expansion enabled
   - Human: team satisfaction, adoption rate, employee retention improvement
   - Include timeframes: "Within 90 days...", "By Q2...", "After 6 months..."

Return this exact JSON structure:
{
  "title": "How [Company] [Achieved Specific Measurable Result] in [Timeframe]",
  "company": "Company Name",
  "industry": "Specific Industry",
  "challenge": "4-6 sentences: vivid problem description with quantified pain, failed alternatives, and tipping point",
  "solution": "4-6 sentences: implementation story with timeline, key features, champion, and aha moment",
  "results": "4-6 sentences: 4-5 specific metrics across financial, operational, and human dimensions with timeframes"
}`
      : `Generate a complete, publication-quality B2B case study that reads like it belongs on HubSpot's or Salesforce's website.

Choose ONE specific and interesting industry vertical:
- FinTech (payment processing, lending, compliance)
- Healthcare IT (telemedicine, EHR, patient engagement)
- E-commerce / DTC (personalization, fulfillment, retention)
- Manufacturing / Supply Chain (IoT, predictive maintenance, logistics)
- EdTech (LMS, student engagement, institutional analytics)
- Cybersecurity (threat detection, compliance, incident response)

The case study must tell a STORY — not just list facts. The reader should feel the pain of the "before," the excitement of the implementation, and the satisfaction of the results.

Return this exact JSON structure:
{
  "title": "How [Company] [Achieved Specific Result] in [Timeframe] — a compelling, specific headline",
  "company": "a fictional but realistic company name that fits the industry",
  "industry": "the specific industry vertical you chose",
  "challenge": "4-6 sentences: the vivid 'before' picture — specific broken workflows, quantified costs of the problem ($X/month, Y hours/week), what they'd tried before, and the tipping point",
  "solution": "4-6 sentences: the implementation journey — discovery, evaluation, rollout timeline, key features adopted, internal champion, the moment they knew it was working",
  "results": "4-6 sentences: 4-5 specific metrics with timeframes — start with the headline number, then financial impact, operational efficiency gains, and team/customer satisfaction improvements"
}`;

    const generated = await callOpenRouter(prompt, systemPrompt);
    const parsed = safeParseJSON(generated, { content: generated });
    res.json(parsed);
  } catch (error) {
    console.error('Generate case study error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate case study' });
  }
});

// ─── Summarize reviews / Generate review ─────────────────────────────────────

router.post('/summarize-reviews', authMiddleware, async (req, res) => {
  try {
    const { reviews, original_review, source, customer_name } = req.body;
    const hasReview = original_review || (reviews && reviews.length > 0);

    const systemPrompt = `You are a senior customer insights analyst at a leading SaaS company, with expertise in Voice of Customer (VoC) analysis, NPS interpretation, and review mining. You've analyzed over 50,000 product reviews across G2, Capterra, TrustRadius, TrustPilot, and Google Reviews.

YOUR ANALYTICAL FRAMEWORK:
- "Jobs to Be Done" lens: What job was the customer hiring this product to do? Did it succeed?
- Sentiment spectrum (not just positive/negative): Ecstatic → Enthusiastic → Satisfied → Content → Neutral → Disappointed → Frustrated → Angry
- Value proposition extraction: Identify WHICH specific value props the reviewer validates (ease of use, time savings, ROI, support quality, integration capabilities, reliability)
- Competitive intelligence: Note any comparisons to other products or "switching" context
- Feature-level sentiment: Which specific features get praised or criticized?

REVIEW AUTHENTICITY MARKERS (when generating):
- Real reviews mention specific feature names, not vague capabilities
- Real reviews include context about their company size and use case
- Real reviews almost always mention at least one drawback (learning curve, missing feature, price concern)
- Real reviews describe the evaluation/buying process: "We looked at X and Y before choosing..."
- Real reviews mention onboarding experience: "Setup took about 2 weeks...", "Their CS team walked us through..."
- Real reviews include specific timeframes: "After 3 months of use...", "We've been using this for a year..."

PLATFORM-SPECIFIC STYLES:
- G2: More structured, often mentions specific use cases, includes pros/cons format in their voice
- Capterra: Practical, often from SMB users, mentions value for money
- TrustPilot: More emotional, consumer-oriented, varies widely in detail
- TrustRadius: Very detailed, enterprise-focused, often includes implementation details

CRITICAL: You MUST respond with raw JSON only. No markdown fences, no explanation, no commentary — just a single JSON object.`;

    const prompt = hasReview
      ? `Perform a deep analysis of this customer review and extract maximum insight.

REVIEW DATA:
- Full review text: "${original_review || reviews[0]}"
- Platform: ${source || '[infer the most likely platform based on the review style and detail level]'}
- Reviewer: ${customer_name || '[generate a realistic reviewer name with diverse representation]'}

YOUR ANALYSIS TASK:
1. SENTIMENT: Classify on the full spectrum (ecstatic/enthusiastic/satisfied/content/neutral/disappointed/frustrated). Consider not just what they say but HOW they say it — exclamation points, superlatives, hedging language, and qualifiers
2. SUMMARY: Write a 2-3 sentence summary that answers: "What was the reviewer's core experience, what specific value did they get, and would they recommend it?"
   - Don't just restate the review — DISTILL the insight. What's the headline takeaway?
   - If they mention multiple points, lead with the most impactful one
3. RATING: Score 1-5 based on the actual sentiment expressed:
   - 5 = actively advocates, mentions exceeding expectations, strong emotional language
   - 4 = clearly positive, would recommend, but notes room for improvement
   - 3 = mixed experience, balances pros and cons roughly equally
   - 2 = disappointed, key expectations unmet, hedging language
   - 1 = regrets purchase, warns others away
4. KEY INSIGHTS: Identify the specific value propositions, features, or outcomes the reviewer validates or criticizes

Return this exact JSON structure:
{
  "source": "Platform name (G2, Capterra, TrustPilot, TrustRadius, Google Reviews)",
  "customer_name": "Reviewer name",
  "original_review": "the EXACT original review text — do not modify",
  "ai_summary": "A sharp 2-3 sentence analytical summary: the core experience, the key value delivered, and the bottom line (recommend or not?)",
  "rating": 5,
  "sentiment": "positive"
}`
      : `Generate a realistic product review that could actually appear on a real review platform. It should be indistinguishable from a genuine review.

THE REVIEW MUST INCLUDE these elements (as real reviews do):
1. CONTEXT: Reviewer's company size, role, and use case ("We're a 50-person marketing agency and I'm the ops lead...")
2. EVALUATION JOURNEY: How they found the product and what they compared it to ("We evaluated Competitor A and B before choosing...")
3. ONBOARDING: Their setup experience ("Implementation took about 3 weeks with their CS team...")
4. SPECIFIC FEATURES: Name 2-3 specific features and what they do (not just "great features")
5. RESULTS: At least one concrete metric or outcome ("Our team saves roughly 10 hours a week on reporting")
6. ONE HONEST DRAWBACK: Every real review has one — learning curve, missing integration, wish-list feature, pricing tier concern
7. BOTTOM LINE: Would they recommend it and to whom?

Choose a review platform and match its style:
- G2: Professional, structured, mid-market to enterprise user
- Capterra: Practical, SMB-focused, value-conscious
- TrustPilot: More casual, emotionally expressive

Return this exact JSON structure:
{
  "source": "the platform you chose",
  "customer_name": "a realistic, diverse name",
  "original_review": "a 4-6 sentence authentic review hitting ALL the elements above — context, evaluation, onboarding, features, results, one drawback, and recommendation",
  "ai_summary": "a sharp 2-sentence distillation: the key value delivered and the bottom line",
  "rating": 4 or 5,
  "sentiment": "positive"
}`;

    const generated = await callOpenRouter(prompt, systemPrompt);
    const parsed = safeParseJSON(generated, { ai_summary: generated, sentiment: 'positive' });
    res.json(parsed);
  } catch (error) {
    console.error('Summarize reviews error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to summarize reviews' });
  }
});

// ─── Generate social widget content ──────────────────────────────────────────

router.post('/generate-widget', authMiddleware, async (req, res) => {
  try {
    const { widget_type, title, content } = req.body;

    const systemPrompt = `You are a world-class conversion rate optimization (CRO) specialist with deep expertise in social proof psychology and high-converting website design. You've optimized landing pages for companies like Stripe, Notion, Linear, and Vercel. Your widgets have directly increased conversion rates by 15-40% across hundreds of A/B tests.

SOCIAL PROOF PSYCHOLOGY PRINCIPLES:
- Robert Cialdini's "Social Proof" principle: People follow the actions of others, especially similar others
- "Bandwagon Effect": Large numbers create momentum — "12,847 teams" is more powerful than "thousands of teams"
- "Authority Proof": Industry recognition, awards, certifications build trust before the prospect even evaluates
- "Recency Effect": Real-time activity ("47 teams signed up today") is more compelling than static claims
- "Specificity = Credibility": Precise numbers (12,847 not "12,000+") feel more authentic and trustworthy
- "FOMO (Fear of Missing Out)": Show what competitors/peers are doing to create urgency
- "Social Identity": People trust signals from their peer group — mention specific industries, company sizes, or roles

WIDGET COPY RULES:
- Headlines: Max 10-12 words. Must include a specific number or concrete claim. Use power words: "Trusted," "Join," "Rated," "Proven," "Powering"
- Body copy: 2-3 sentences max. Scannable. Each sentence adds a NEW proof point (don't repeat the headline)
- Numbers: Use exact figures (12,847 not ~12,000). Use commas. Include timeframes where relevant
- Social proof stacking: Combine multiple proof types — number of customers + industry names + growth rate
- Urgency cues: "this week," "today," "in the last hour," "and growing"

CRITICAL: You MUST respond with raw JSON only. No markdown fences, no explanation, no commentary — just a single JSON object.`;

    const prompt = `Generate high-converting social proof widget content that could appear on a top-tier SaaS landing page.

INPUT DATA:
- Widget type: ${widget_type || '[choose the most impactful type: customer_count, rating_badge, social_proof, recent_activity, testimonial_carousel, trust_badges, comparison, awards, live_stats]'}
- Current title: ${title || '[generate a conversion-optimized headline]'}
- Current content: ${content || '[generate compelling supporting copy]'}

WIDGET-SPECIFIC PLAYBOOKS:

customer_count:
  - Title formula: "[Action verb] [exact number] [descriptor] who [outcome]"
  - Example: "Join 14,283 Growth Teams Who Ship 3x Faster"
  - Content: Name 3-4 specific industries or segments. Mention geographic reach. Add growth rate.
  - Proof stack: customer count + industries + countries + growth rate

rating_badge:
  - Title formula: "Rated [#X / score] on [Platform] by [number] [reviewers]"
  - Example: "Rated 4.9/5 on G2 from 3,200+ Verified Reviews"
  - Content: Mention specific awards (Leader, High Performer), consecutive quarters, category ranking
  - Proof stack: rating + review count + consecutive periods + specific awards won

social_proof:
  - Title formula: "[Trend/momentum verb] — [impressive stat]"
  - Example: "The Fastest-Growing Platform in DevOps — 200% YoY Growth"
  - Content: Combine growth metrics with notable customer names or segments switching over
  - Proof stack: growth rate + competitive switching + market recognition

recent_activity:
  - Title formula: "[Real-time stat] in the last [timeframe]"
  - Example: "1,847 Reports Generated in the Last Hour"
  - Content: Stack 3-4 real-time metrics. Use present tense. Create FOMO
  - Proof stack: multiple real-time stats + "right now" language

trust_badges:
  - Title formula: "[Security/compliance credential] — [trust statement]"
  - Example: "SOC 2 Type II Certified — Trusted by 40+ Fortune 500 Companies"
  - Content: Stack certifications, compliance standards, notable logos, uptime guarantees
  - Proof stack: certifications + enterprise logos + SLA guarantees

comparison:
  - Title formula: "[X]% [better/faster/more] than [alternative/industry standard]"
  - Example: "47% Faster Time-to-Value Than the Industry Average"
  - Content: Cite specific benchmarks, head-to-head comparisons, analyst reports
  - Proof stack: benchmark data + analyst recognition + specific advantages

awards:
  - Title formula: "[Award name] — [year or consecutive wins]"
  - Example: "G2 Leader for 8 Consecutive Quarters — Best in Class 2024"
  - Content: List 3-4 specific awards with organizations. Mention selection criteria
  - Proof stack: multiple awards + organizations + categories

live_stats:
  - Title formula: "[Impressive aggregate stat] and counting"
  - Example: "2.4 Billion API Calls Processed — 99.99% Uptime"
  - Content: Stack 3-4 impressive aggregate metrics. Show scale and reliability
  - Proof stack: volume metrics + reliability stats + growth trajectory

GENERATE content following the playbook for the specified widget type. Make it specific, numbers-rich, and conversion-optimized.

Return this exact JSON structure:
{
  "widget_type": "the widget type",
  "title": "A punchy, specific headline following the widget playbook formula (max 12 words, must include a number)",
  "content": "2-3 sentences of supporting proof copy — each sentence adds a NEW proof point. Include specific numbers, industries, timeframes, and credibility markers."
}`;

    const generated = await callOpenRouter(prompt, systemPrompt);
    const parsed = safeParseJSON(generated, { title: generated, content: 'AI-generated content' });
    res.json(parsed);
  } catch (error) {
    console.error('Generate widget error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate widget' });
  }
});

// ─── Describe metric ─────────────────────────────────────────────────────────

router.post('/describe-metric', authMiddleware, async (req, res) => {
  try {
    const { metric_name, value, context } = req.body;
    const hasData = metric_name || value;

    const systemPrompt = `You are a data storytelling expert and former Head of Analytics at a Fortune 500 company. You've presented metrics to boards of directors, investors at Series A-D rounds, and audiences at conferences like SaaStr and Web Summit. You understand that a metric without context is just a number — your job is to transform it into a STORY that makes people act.

DATA STORYTELLING FRAMEWORK:
1. "The Anchor": Compare the metric to something the audience already understands — industry average, competitor benchmark, previous period, or a vivid analogy
2. "The Trajectory": Where was this metric 6/12/24 months ago? Where is it heading? Show momentum
3. "The Impact": Translate the number into BUSINESS IMPACT — what does this mean in dollars, hours, customers, or competitive advantage?
4. "The Credibility Marker": How was this measured? Sample size, methodology, timeframe — this makes the number trustworthy

INDUSTRY BENCHMARKS TO REFERENCE:
- SaaS: Net Revenue Retention >120% is elite, NPS >50 is excellent, <5% monthly churn is strong, LTV:CAC >3:1 is healthy
- Customer Success: CSAT >90% is top quartile, Time-to-Value <30 days is fast, Support response <4hrs is good
- Product: DAU/MAU >40% is strong engagement, Feature adoption >60% is excellent, Activation rate >70% is healthy
- Growth: YoY revenue growth >100% for startups, >40% for scale-ups, >20% for mature companies is strong
- Operations: 99.99% uptime = <52 min downtime/year, <2s page load is good, <100ms API response is excellent

DESCRIPTION WRITING RULES:
- Sentence 1: The headline insight — what this metric MEANS for the business (not what it is)
- Sentence 2: The comparison/context — how it stacks up against benchmarks, competitors, or previous performance
- Sentence 3: The forward-looking implication — what this enables, what it predicts, or what it means for growth
- Use power phrases: "outpacing the industry by 3x," "placing us in the top 1%," "translating to $X in annual value," "equivalent to Y hours saved per employee per month"
- Be SPECIFIC: "Our 97.3% retention rate means we retain $48 out of every $49 in revenue" beats "Our retention rate is high"

ICON SELECTION GUIDE:
- star: ratings, reviews, quality scores, NPS, satisfaction
- trending-up: growth rates, revenue increases, adoption curves, trajectory metrics
- clock: time-based metrics (response time, time-to-value, speed, SLA, processing time)
- users: customer counts, team metrics, user growth, adoption, MAU/DAU
- shield: security, compliance, uptime, reliability, data protection, trust
- dollar-sign: revenue, cost savings, ROI, LTV, ARR, financial metrics
- thumbs-up: satisfaction scores, approval rates, recommendation rates
- database: data volume, processing capacity, storage, API calls, throughput
- globe: geographic reach, international metrics, market expansion
- zap: speed, performance, real-time, instant, automation efficiency
- rocket: growth trajectory, launches, new features shipped, velocity
- check-circle: completion rates, success rates, accuracy, SLA achievement

CRITICAL: You MUST respond with raw JSON only. No markdown fences, no explanation, no commentary — just a single JSON object.`;

    const prompt = hasData
      ? `Create a boardroom-ready narrative for this business metric that would make a CEO proud to present it.

INPUT DATA:
- Metric name: ${metric_name || '[generate a specific, meaningful business metric name]'}
- Value: ${value || '[generate an impressive but credible value]'}
- Context: ${context || '[generate the measurement methodology and timeframe]'}

YOUR TASK:
1. ai_description (3 sentences):
   - Sentence 1: The headline insight — what this number MEANS for the business. Don't restate the number; interpret it. ("This means we retain $48 of every $49 in revenue" not "Our retention is 97.3%")
   - Sentence 2: The benchmark comparison — how does this compare to industry standards, competitors, or our own history? ("This places us in the top 5% of SaaS companies globally, outperforming the industry average of 85% by a significant margin")
   - Sentence 3: The forward-looking implication — what does this enable or predict? ("At this trajectory, we're on track to cross $10M ARR by Q3, a full quarter ahead of plan")
2. Choose the BEST icon that visually represents this metric's theme (see the icon guide in your training)
3. Ensure the description would work on an investor slide, a customer-facing page, OR an internal dashboard

Return this exact JSON structure:
{
  "metric_name": "Metric Name",
  "value": "The value",
  "context": "measurement context with methodology and timeframe",
  "ai_description": "3 powerful sentences: (1) what the number MEANS, (2) how it compares to benchmarks, (3) what it enables going forward",
  "icon": "the best matching icon from: star, trending-up, clock, users, shield, dollar-sign, thumbs-up, database, globe, zap, rocket, check-circle"
}`
      : `Generate a complete, impressive business metric that would make investors lean forward in their chairs.

Choose ONE compelling metric category:
- Growth engine: ARR growth, MRR expansion, net revenue retention, customer acquisition rate
- Customer love: NPS score, CSAT, customer retention rate, expansion revenue, logo retention
- Product velocity: feature adoption rate, time-to-value, activation rate, DAU/MAU ratio
- Operational excellence: uptime, API response time, deployment frequency, MTTR, error rate
- Market position: market share, competitive win rate, analyst ranking, category leadership
- Financial efficiency: LTV:CAC ratio, gross margin, payback period, Rule of 40 score

Generate a metric that is:
- SPECIFIC: Not "Revenue Growth" but "Net Revenue Retention Rate" or "Year-over-Year ARR Growth"
- IMPRESSIVE but CREDIBLE: Outstanding but within the realm of what top-performing companies actually achieve
- TIME-BOUND: Measured over a specific period with clear methodology

Return this exact JSON structure:
{
  "metric_name": "A specific metric name that signals sophistication (e.g., 'Net Revenue Retention Rate', 'Mean Time to First Value', '90-Day Logo Retention')",
  "value": "An impressive, specific value (e.g., '127%', '<47 seconds', '99.97%', '$4.2M', '3.8x')",
  "context": "One detailed sentence explaining HOW this is measured, the sample/cohort, and the timeframe",
  "ai_description": "3 sentences: (1) what this means in business terms, (2) industry benchmark comparison, (3) forward-looking implication",
  "icon": "the most relevant icon"
}`;

    const generated = await callOpenRouter(prompt, systemPrompt);
    const parsed = safeParseJSON(generated, { ai_description: generated });
    res.json(parsed);
  } catch (error) {
    console.error('Describe metric error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to describe metric' });
  }
});

// ─── Polish customer quote ───────────────────────────────────────────────────

router.post('/polish-quote', authMiddleware, async (req, res) => {
  try {
    const { original_quote, customer_name, company, use_case } = req.body;
    const hasData = original_quote || customer_name || company;

    const systemPrompt = `You are a world-class speechwriter and editor who has polished quotes for TED talks, keynote presentations, and the homepages of billion-dollar companies. You understand that a great quote is like a great movie tagline — it captures an entire story in one or two sentences. Your polished quotes have appeared on homepage hero sections, pitch decks, billboard ads, and conference keynotes.

THE ART OF THE SOUNDBITE — YOUR EDITING PRINCIPLES:

1. "The Bumper Sticker Test": Can you imagine this quote on a bumper sticker or billboard? If not, it needs to be tighter
2. "Show, Don't Tell": "We cut our deployment time from 2 weeks to 2 hours" beats "The product really improved our efficiency"
3. "The Rule of Specificity": Every vague word can be replaced with something specific:
   - "saves us time" → "saves our team 15 hours every sprint"
   - "great product" → "the only tool that handles both our CI/CD and monitoring in one place"
   - "improved our results" → "tripled our conversion rate in 60 days"
4. "Voice Preservation": The polished quote should still sound like THEM — keep their personality, enthusiasm level, and speaking style. A CTO sounds different from a Marketing VP
5. "The Power Position": Put the most impactful claim at the END of the quote — that's what people remember
6. "Contrast Creates Impact": Before/after statements are powerful — "We went from X to Y" or "What used to take X now takes Y"

EDITING CHECKLIST:
✓ Remove filler words: um, uh, like, you know, I mean, kind of, sort of, basically, actually, honestly, literally
✓ Remove hedging: I think, I feel like, I guess, maybe, probably, it seems like
✓ Remove redundancy: repeated ideas, circular phrasing
✓ Add specificity: replace vague claims with plausible concrete details
✓ Tighten structure: remove unnecessary clauses, combine related ideas
✓ Strengthen verbs: "helped us" → "transformed," "enabled," "unlocked," "eliminated"
✗ DON'T make it sound corporate: avoid buzzwords (leverage, synergize, optimize, streamline)
✗ DON'T add claims the original doesn't support: enhance, don't fabricate
✗ DON'T exceed 2 sentences: brevity is the soul of a great quote

CRITICAL: You MUST respond with raw JSON only. No markdown fences, no explanation, no commentary — just a single JSON object.`;

    const prompt = hasData
      ? `Transform this raw customer quote into a polished, quotable soundbite worthy of a homepage hero section or a sales deck pull-quote.

INPUT DATA:
- Raw quote: "${original_quote || '[generate a casual, unpolished customer quote]'}"
- Speaker: ${customer_name || '[generate a realistic, diverse name]'}
- Company: ${company || '[generate a realistic company name — not a real famous company]'}
- Use case: ${use_case || '[infer the most appropriate category from the quote content]'}

YOUR EDITING TASK:
1. READ the original carefully — what is the CORE message? What's the single most powerful claim?
2. PRESERVE their voice and personality — a casual speaker should still sound casual (but clearer), a technical speaker should still sound technical (but sharper)
3. ENHANCE with specificity:
   - If they mention time savings → add a plausible specific amount ("15 hours a week," "cut in half")
   - If they mention improvement → add a plausible metric ("3x faster," "47% reduction")
   - If they mention a feature → name it specifically
4. STRUCTURE for maximum impact:
   - Option A: "Before/After" → "We went from [painful state] to [impressive result]"
   - Option B: "Bold claim + proof" → "[Surprising statement]. [Specific evidence that backs it up]."
   - Option C: "Problem + transformation" → "[Problem we had]. [Product] [how it solved it]."
5. TRIM to 1-2 sentences maximum. Every word must earn its place

GOOD POLISHED QUOTES:
- "We went from spending three days on monthly reporting to getting real-time dashboards. It's like going from a bicycle to a jet."
- "In six months, our customer churn dropped from 8% to under 2%. That single metric paid for the platform ten times over."
- "Our engineering team ships features 3x faster now. What used to take a full sprint gets done in two days."

BAD POLISHED QUOTES:
- "This is a great product that has really helped optimize our organizational efficiency and drive meaningful business outcomes."
- "Highly recommend this platform to anyone looking to leverage technology for growth."

Return this exact JSON structure:
{
  "customer_name": "Speaker name",
  "company": "Company name",
  "use_case": "Category (Enterprise SaaS, Startup, Marketing, Analytics, DevOps, E-commerce, Customer Success, etc.)",
  "original_quote": "the EXACT original quote — do not modify",
  "polished_quote": "1-2 sentences: sharp, specific, quotable, human — passes the bumper sticker test"
}`
      : `Generate a complete customer quote pair: a raw version (how people actually talk) and a polished version (how it would appear on a homepage).

The contrast between raw and polished should be dramatic — showing the value of professional editing.

RAW QUOTE CHARACTERISTICS (how real people talk):
- Contains filler words (um, like, you know, basically, honestly)
- Has run-on sentences or incomplete thoughts
- Makes vague claims ("it really helped," "saved us a lot of time")
- Might repeat themselves or go on a tangent
- Natural enthusiasm with informal language

POLISHED QUOTE CHARACTERISTICS:
- 1-2 crisp sentences maximum
- Contains at least one specific metric or concrete detail
- Uses a powerful structure (before/after, bold claim + proof, or problem + transformation)
- Sounds like the same person, just... clearer and more impactful
- Would look great in 48px font on a website homepage

Return this exact JSON structure:
{
  "customer_name": "a realistic, diverse full name",
  "company": "a fictional but realistic company name",
  "use_case": "a specific category (not just 'Technology' — be specific like 'B2B Marketing Automation' or 'DevOps Pipeline')",
  "original_quote": "2-3 sentences of natural, unpolished speech with filler words, vague claims, and informal language",
  "polished_quote": "1-2 crisp sentences: specific, metric-driven, quotable, authentic — the kind of quote that closes deals"
}`;

    const generated = await callOpenRouter(prompt, systemPrompt);
    const parsed = safeParseJSON(generated, { polished_quote: generated });
    res.json(parsed);
  } catch (error) {
    console.error('Polish quote error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to polish quote' });
  }
});

// ─── Edit video testimonial ──────────────────────────────────────────────────

router.post('/edit-video-testimonial', authMiddleware, async (req, res) => {
  try {
    const { original_transcript, customer_name, company, role, video_url, duration } = req.body;
    const hasData = original_transcript || customer_name || company;

    const systemPrompt = `You are a senior video producer and editor who has produced customer testimonial videos for companies like Salesforce, HubSpot, Atlassian, and Shopify. Your testimonial videos have generated millions of views and directly attributed to enterprise deal closures. You specialize in transforming raw, rambling interview footage into tight, compelling narratives.

VIDEO TESTIMONIAL EDITING EXPERTISE:

TRANSCRIPT EDITING RULES:
- Remove ALL filler words: um, uh, like, you know, I mean, so, basically, actually, honestly, literally, right, kind of, sort of
- Remove false starts: "We were — well, actually, what happened was — we were trying to..."  → "We were trying to..."
- Remove verbal backtracking: "It took us, well not really took us, but the process was about three months" → "The process took about three months"
- Combine fragmented thoughts into complete, clear sentences
- Preserve the speaker's PERSONALITY: their enthusiasm level, vocabulary, humor, and speaking style
- Keep contractions (don't, can't, we're) — this is spoken word, not a whitepaper
- Maintain the narrative arc: Problem → Discovery → Implementation → Results → Recommendation
- The edited transcript should be approximately the same length as the original — edit for clarity, not brevity
- It should sound like someone SPEAKING, not someone writing — short sentences, active voice, direct language

HIGHLIGHT EXTRACTION — "THE MONEY QUOTES":
- These are the 2-3 sentences that would be used for:
  → Social media clips (LinkedIn, Twitter)
  → Video thumbnail overlays
  → Sales deck pull quotes
  → Email marketing subject lines
- Money quotes have these characteristics:
  → They contain a SPECIFIC result or metric ("reduced our costs by 40%")
  → They express genuine EMOTION ("I was honestly shocked by how fast...")
  → They make a BOLD claim ("This is the single best investment we made all year")
  → They provide CONTRAST ("We went from X to Y")
- Separate highlights with | characters

SUMMARY WRITING:
- The summary serves as the video DESCRIPTION — what you'd put under the video on YouTube or a landing page
- Structure: Who is speaking + what was their challenge + what results did they achieve
- Must make someone want to WATCH the video
- 2-3 sentences maximum

TAG GENERATION:
- Include: industry, company size (enterprise/mid-market/SMB), key topics (automation, analytics, AI, etc.), use case, persona
- 4-6 tags, comma-separated
- Use lowercase, descriptive tags that help with search and categorization

CRITICAL: You MUST respond with raw JSON only. No markdown fences, no explanation, no commentary — just a single JSON object.`;

    const prompt = hasData
      ? `Edit and enhance this video testimonial transcript into a production-ready asset.

INPUT DATA:
- Raw transcript: "${original_transcript || '[generate a realistic, natural-sounding interview transcript]'}"
- Speaker: ${customer_name || '[generate a realistic, diverse name]'}
- Company: ${company || '[generate a realistic company name]'}
- Title: ${role || '[generate a C-level or VP-level job title]'}
- Video URL: ${video_url || '[generate a realistic placeholder URL]'}
- Duration: ${duration || '[generate a realistic duration between 2:00-5:00]'}

YOUR EDITORIAL TASK:

1. ai_edited_transcript: Apply your full editing expertise:
   - Strip ALL filler words (um, uh, like, you know, basically, actually, so, right)
   - Fix false starts and verbal backtracking into smooth sentences
   - Combine fragmented thoughts into clear, complete statements
   - Preserve their personality, enthusiasm, and natural speaking patterns
   - Ensure the narrative flows: problem → discovery → implementation → results
   - Keep it conversational — contractions, short sentences, active voice
   - Same approximate length as original — you're editing for CLARITY, not brevity

2. ai_highlights: Extract exactly 2-3 "money quotes" separated by | characters:
   - Each must be a standalone sentence that works as a social media clip or pull quote
   - Priority order: (a) specific metrics/results, (b) emotional/surprising statements, (c) bold recommendations
   - Each highlight should be impactful enough to stop someone scrolling

3. ai_summary: Write a 2-3 sentence video description:
   - Sentence 1: Who is this person and what was their challenge?
   - Sentence 2: What transformation did they experience?
   - Sentence 3: The headline result that makes this video worth watching
   - This should make someone click "Play" — it's a hook, not a summary

4. tags: Generate 4-6 descriptive tags for categorization:
   - Include: industry, persona/role type, company size tier, key topics, use case
   - Example: "fintech, VP-level, enterprise, automation, cost-reduction, compliance"

Return this exact JSON structure:
{
  "customer_name": "Speaker name",
  "company": "Company name",
  "role": "Job title",
  "video_url": "video URL",
  "thumbnail_url": "a realistic placeholder thumbnail URL",
  "duration": "video duration",
  "original_transcript": "the EXACT original transcript — do not modify",
  "ai_edited_transcript": "the fully edited transcript: filler-free, clear, conversational, same length, narrative arc intact",
  "ai_highlights": "Money quote 1 | Money quote 2 | Money quote 3",
  "ai_summary": "2-3 sentence hook that makes people want to watch this video",
  "tags": "4-6 comma-separated descriptive tags",
  "rating": 5,
  "status": "ready"
}`
      : `Generate a complete, realistic video testimonial package for a B2B SaaS product. This should feel like a real interview that was professionally edited.

ORIGINAL TRANSCRIPT REQUIREMENTS (must sound like real spoken word):
- 6-10 sentences of natural conversational speech
- Include filler words organically: "um," "you know," "like," "basically," "I mean"
- Include at least one false start or self-correction: "We tried — well, first we actually looked at..."
- Follow the natural interview arc: Background → Problem → Discovery → Implementation → Results → Recommendation
- Express genuine emotion: surprise, relief, excitement, pride
- Mention specific details: team size, timeframe, feature names, metrics
- Sound like someone talking to a camera, not reading a script

EDITED TRANSCRIPT: Apply all your editing rules to clean it up professionally while keeping the person's voice

Choose ONE of these interview scenarios:
- A CTO describing how they modernized their tech stack
- A VP of Sales explaining how they shortened their sales cycle
- A Head of Marketing describing how they scaled content production
- A Director of Customer Success explaining how they reduced churn
- A COO describing how they streamlined operations across teams

Return this exact JSON structure:
{
  "customer_name": "a realistic, diverse full name",
  "company": "a fictional but realistic company name that fits the industry",
  "role": "a specific senior title",
  "video_url": "https://videos.example.com/testimonial-[realistic-slug].mp4",
  "thumbnail_url": "https://images.example.com/thumb-[realistic-slug].jpg",
  "duration": "a realistic duration between 2:30-4:30",
  "original_transcript": "6-10 sentences of natural speech WITH filler words, false starts, self-corrections, and genuine emotion",
  "ai_edited_transcript": "the same content, professionally edited: filler-free, clear, smooth, but still conversational",
  "ai_highlights": "3 money quotes separated by | — each must work standalone as a social media clip",
  "ai_summary": "2-3 sentence video description that hooks the viewer and makes them want to watch",
  "tags": "4-6 specific, descriptive tags",
  "rating": 5,
  "status": "ready"
}`;

    const generated = await callOpenRouter(prompt, systemPrompt);
    const parsed = safeParseJSON(generated, { ai_edited_transcript: generated, ai_summary: 'AI-generated content' });
    res.json(parsed);
  } catch (error) {
    console.error('Edit video testimonial error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to edit video testimonial' });
  }
});

// ─── Generate stats visualization ────────────────────────────────────────────

router.post('/generate-stats', authMiddleware, async (req, res) => {
  try {
    const { metric_name, value, context, chart_type } = req.body;
    const hasData = metric_name || value;

    const systemPrompt = `You are a senior data visualization consultant who has designed dashboards and data presentations for McKinsey, Google, Stripe, and Bloomberg. You combine expertise in data science, information design, and behavioral psychology to present metrics in the most compelling and truthful way possible.

DATA VISUALIZATION EXPERTISE:

CHART TYPE SELECTION GUIDE:
- bar: Best for COMPARISONS between categories or time periods. Use when showing "this vs. that" or rankings. Good for: revenue by product, performance by team, quarterly comparisons
- line: Best for TRENDS over time. Use when the x-axis is temporal and you want to show trajectory. Good for: growth curves, adoption over time, monthly metrics
- pie/donut: Best for COMPOSITION — showing parts of a whole. Use sparingly — only when there are 2-5 segments. Good for: market share breakdown, revenue distribution, customer segmentation
- gauge: Best for PROGRESS toward a goal or a single metric with a target. Good for: SLA achievement, quota attainment, capacity utilization
- number: Best for a single HERO metric that speaks for itself. Use when the number is impressive enough to stand alone. Good for: total customers, revenue, uptime percentage

COLOR PSYCHOLOGY:
- Indigo (#4f46e5) / Blue: Trust, reliability, professionalism — ideal for enterprise metrics
- Emerald (#059669) / Green: Growth, success, positive outcomes — ideal for revenue, profit, improvements
- Amber (#d97706) / Orange: Energy, urgency, attention — ideal for action-needed metrics or warnings
- Rose (#e11d48) / Red: Critical, declining, needs attention — use for negative trends or alerts
- Violet (#7c3aed) / Purple: Innovation, premium, creativity — ideal for product/feature metrics
- Sky (#0284c7) / Light Blue: Openness, clarity, accessibility — ideal for customer-facing metrics
- Always pair a PRIMARY (strong) color with a lighter SECONDARY (background) color

NARRATIVE WRITING:
- Sentence 1: The headline insight — what story does this data tell?
- Sentence 2: The comparison anchor — vs. previous period, industry benchmark, or competitor
- Sentence 3: The business implication — so what? What should leadership DO with this information?

TREND ANALYSIS:
- "up" trends: Use when there's clear positive momentum. Include the percentage change
- "down" trends: Can be positive (costs down, churn down) or negative — frame accordingly
- "stable": Use when consistency is the achievement (uptime, retention, satisfaction)

CRITICAL: You MUST respond with raw JSON only. No markdown fences, no explanation, no commentary — just a single JSON object.`;

    const prompt = hasData
      ? `Create a complete visualization package for this metric — data, design, and narrative.

INPUT DATA:
- Metric: ${metric_name || '[generate a meaningful, specific metric name]'}
- Value: ${value || '[generate an impressive but credible value]'}
- Context: ${context || '[generate the measurement methodology and timeframe]'}
- Chart preference: ${chart_type || '[recommend the optimal chart type based on the data characteristics]'}

YOUR TASK:
1. ai_description (3 sentences): Tell the story behind this number
   - Sentence 1: What does this metric MEAN for the business?
   - Sentence 2: How does it compare — previous period, benchmark, or competitor?
   - Sentence 3: What action or confidence should this inspire?

2. chart_type: Select the BEST visualization type based on the data:
   - Is it a comparison? → bar
   - Is it a trend? → line
   - Is it composition? → pie or donut
   - Is it progress toward a goal? → gauge
   - Is it a standalone impressive number? → number

3. chart_data: Design the visualization:
   - primary_color: Choose based on the metric's theme (growth=green, trust=indigo, speed=amber, etc.)
   - secondary_color: A lighter shade of the primary for backgrounds
   - labels: Meaningful axis labels (quarters, months, categories) — provide 4-6 labels
   - comparison: What's the benchmark? ("vs. industry avg of 72%", "vs. Q3: +18%", "2x competitor average")

4. trend + trend_percentage: Analyze direction and quantify the change

5. icon: Select the most semantically appropriate icon

Return this exact JSON structure:
{
  "metric_name": "Metric name",
  "value": "The value",
  "context": "Measurement methodology and timeframe",
  "ai_description": "3-sentence narrative: insight, comparison, implication",
  "chart_type": "bar, line, pie, donut, gauge, or number",
  "chart_data": {
    "primary_color": "#hex color chosen for semantic meaning",
    "secondary_color": "#lighter hex shade for backgrounds",
    "labels": ["Label 1", "Label 2", "Label 3", "Label 4"],
    "comparison": "a specific benchmark comparison string"
  },
  "trend": "up or down or stable",
  "trend_percentage": "+X% or -X%",
  "icon": "the most relevant icon from: star, trending-up, clock, users, shield, dollar-sign, thumbs-up, database, globe, zap, rocket, check-circle"
}`
      : `Generate a complete, impressive business metric with a full visualization package that would look great on an executive dashboard.

Choose ONE compelling metric from these categories:
- Revenue & Growth: ARR, MRR growth, net revenue retention, expansion revenue, pipeline velocity
- Customer Health: NPS, CSAT, retention rate, churn rate, time-to-value, health score distribution
- Product Engagement: DAU/MAU, feature adoption, activation rate, session duration, power user %
- Operational Efficiency: Uptime, API latency, deployment frequency, MTTR, error rate, throughput
- Team Performance: Revenue per employee, customer-to-CSM ratio, support resolution time, deal velocity

Create a metric that tells a STORY — not just a number, but a number with context, trend, and implication.

Return this exact JSON structure:
{
  "metric_name": "A specific, sophisticated metric name",
  "value": "An impressive, precise value",
  "context": "How it's measured, the cohort/sample, and the timeframe",
  "ai_description": "3 sentences: (1) what this means, (2) how it compares to benchmarks, (3) what it implies for the business",
  "chart_type": "the best chart type for this specific data",
  "chart_data": {
    "primary_color": "#hex color with semantic meaning",
    "secondary_color": "#lighter complement shade",
    "labels": ["4-6 meaningful labels for the visualization"],
    "comparison": "specific benchmark or comparison point"
  },
  "trend": "up, down, or stable",
  "trend_percentage": "the specific trend change",
  "icon": "the most relevant icon"
}`;

    const generated = await callOpenRouter(prompt, systemPrompt);
    const parsed = safeParseJSON(generated, { ai_description: generated });
    res.json(parsed);
  } catch (error) {
    console.error('Generate stats error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate stats' });
  }
});

// ─── Extract quotes from text ────────────────────────────────────────────────

router.post('/extract-quotes', authMiddleware, async (req, res) => {
  try {
    const { source_text, source_name, source_type } = req.body;
    const hasData = source_text;

    const systemPrompt = `You are an expert content curator and qualitative researcher who has mined thousands of customer interviews, reviews, and conversations for marketing gold. You've built quote libraries for companies like Intercom, Drift, Gong, and Notion. You have an uncanny ability to find the sentences that would make someone stop scrolling — the ones that capture a key insight, provoke an emotional response, or articulate a result with undeniable specificity.

QUOTE EXTRACTION METHODOLOGY:

WHAT MAKES A QUOTE "EXTRACTABLE" — THE 5 SIGNALS:
1. SPECIFICITY: Contains a concrete number, metric, or measurable outcome ("saved us 15 hours a week," "cut costs by 40%")
2. EMOTION: Expresses genuine feeling — surprise, relief, excitement, frustration, pride ("I was honestly blown away," "It was a game-changer for our team")
3. CONTRAST: Shows a before/after transformation ("We went from X to Y," "What used to take days now takes minutes")
4. AUTHORITY: Makes a definitive statement or recommendation ("This is the best investment we made all year," "I'd recommend this to any team above 50 people")
5. UNIVERSALITY: Articulates something that many customers would relate to ("Every team has this problem," "If you're scaling past 100 employees, you need this")

POLISHING GUIDELINES:
- Tighten, don't rewrite — the polished version should be recognizably the same thought, just cleaner
- Remove filler words and verbal padding
- If the original is vague, add ONE plausible specific detail (a number, a timeframe, a feature name)
- Keep the speaker's personality and energy level
- The polished version should work as a standalone pull quote — it must make sense without surrounding context

CATEGORY TAXONOMY:
- "results": Concrete outcomes, metrics, ROI, business impact
- "product": Feature-specific praise or criticism, capabilities, functionality
- "ease-of-use": Onboarding, learning curve, UX, intuitiveness, adoption speed
- "support": Customer service, responsiveness, helpfulness, proactive outreach
- "value": Pricing, ROI, cost-effectiveness, "worth every penny" type sentiments
- "integration": How it works with other tools, ecosystem, API, workflow fit
- "reliability": Uptime, consistency, trust, "it just works"
- "innovation": Cutting-edge features, AI capabilities, staying ahead of the curve
- "team-impact": How it affected team dynamics, collaboration, morale, productivity
- "recommendation": Would they recommend it? To whom? How strongly?

SENTIMENT NUANCE:
- "ecstatic": Over-the-moon enthusiasm, strong advocacy, superlatives
- "positive": Clear satisfaction, would recommend, sees clear value
- "mixed": Balanced pros and cons, satisfied but with reservations
- "neutral": Factual, neither positive nor negative
- "negative": Disappointed, expectations unmet, considering alternatives
- "frustrated": Angry, feeling let down, actively warning others

CRITICAL: You MUST respond with raw JSON only. No markdown fences, no explanation, no commentary — just a single JSON object.`;

    const prompt = hasData
      ? `Extract the most powerful, marketing-ready quotes from this text. Your goal is to build a quote library that the marketing team can immediately use across the website, sales decks, social media, and email campaigns.

SOURCE DATA:
- Text: "${source_text}"
- Source: ${source_name || '[infer or generate a realistic source name based on the content]'}
- Type: ${source_type || '[classify the text: customer interview, product review, case study, survey response, support ticket, social media post, etc.]'}

YOUR EXTRACTION TASK:

1. SCAN the text for the 5 signals: specificity, emotion, contrast, authority, and universality
2. EXTRACT 3-5 of the most powerful, quotable moments — prioritize quotes that:
   - Contain specific numbers or metrics (these are marketing GOLD)
   - Express genuine emotion that builds trust
   - Show a clear before/after transformation
   - Make bold, definitive statements
   - Would resonate with similar prospects
3. For each quote, CREATE a polished version:
   - Remove filler words and verbal padding
   - Add ONE plausible specific detail if the original is vague
   - Ensure it works as a standalone pull quote
   - Keep the speaker's voice and energy
4. CATEGORIZE each quote using the taxonomy (results, product, ease-of-use, support, value, integration, reliability, innovation, team-impact, recommendation)
5. ASSESS sentiment for each quote AND overall, using the full spectrum (ecstatic → positive → mixed → neutral → negative → frustrated)
6. SUMMARIZE the key themes: What are the 2-3 main messages across all extracted quotes? What story do they collectively tell?

Return this exact JSON structure:
{
  "source_name": "Source name",
  "source_type": "interview, review, case study, etc.",
  "quotes": [
    {
      "original": "the EXACT quote extracted from the text — do not modify",
      "polished": "a tightened, marketing-ready version that works as a standalone pull quote",
      "sentiment": "ecstatic, positive, mixed, neutral, negative, or frustrated",
      "category": "results, product, ease-of-use, support, value, integration, reliability, innovation, team-impact, or recommendation"
    }
  ],
  "overall_sentiment": "the dominant sentiment across all quotes",
  "summary": "2-3 sentences: What are the key themes? What story do these quotes collectively tell? What would a marketing team headline with?"
}`
      : `Generate a realistic quote extraction from a customer interview about a B2B SaaS product. The extraction should demonstrate the full power of professional quote mining.

CREATE a realistic interview that covers a COMPLETE customer journey:
- Their background and company context
- The problem they were facing (with specific pain points)
- How they discovered and evaluated the product
- Their onboarding and implementation experience
- Specific results and outcomes they've achieved
- Their overall assessment and recommendation

Then EXTRACT 4-5 quotes from your generated interview, covering different aspects:
- At least one "results" quote with a specific metric
- At least one "emotion" quote showing genuine feeling
- At least one "contrast" quote showing before/after
- At least one "recommendation" quote
- One additional quote from any category

Each polished version should be noticeably tighter and more impactful than the original — showing the value of professional curation.

Return this exact JSON structure:
{
  "source_name": "Realistic source: '[Name], [Title] at [Company] — Customer Interview, [Month Year]'",
  "source_type": "customer interview",
  "quotes": [
    {
      "original": "a natural, conversational quote with some roughness — as people actually speak",
      "polished": "a tight, marketing-ready version — specific, punchy, standalone",
      "sentiment": "use the full spectrum: ecstatic, positive, mixed, etc.",
      "category": "use specific categories: results, product, ease-of-use, support, value, integration, reliability, innovation, team-impact, recommendation"
    }
  ],
  "overall_sentiment": "the dominant sentiment",
  "summary": "2-3 sentences summarizing the key themes and the overall story these quotes tell"
}

Include 4-5 diverse quotes covering different aspects of the customer experience.`;

    const generated = await callOpenRouter(prompt, systemPrompt);
    const parsed = safeParseJSON(generated, { summary: generated });
    res.json(parsed);
  } catch (error) {
    console.error('Extract quotes error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to extract quotes' });
  }
});

module.exports = router;
