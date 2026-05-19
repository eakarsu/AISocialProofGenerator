# Audit Note — AISocialProofGenerator

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_08.md` (section 1).

## Original Recommendations

### Missing AI Counterparts
- AI-driven customer segmentation for targeted testimonial selection
- Predictive scoring for which customers will provide strong testimonials

### Missing Non-AI Features
- Trustpilot, G2, Capterra integrations
- A/B testing framework
- Scheduled review crawling

### Custom Feature Suggestions
- Sentiment-driven variant generation per persona
- Multi-modal proof widgets
- Competitive testimonial analysis (RAG)
- Authenticity scoring (AI vs real)
- One-click marketplace publishing

## Implemented (this round)
1. `POST /api/ai/segment-customers` — clusters customers for testimonial-angle targeting.
2. `POST /api/ai/score-testimonial-likelihood` — predicts likelihood per customer.

Both follow existing `callOpenRouter` + `safeParseJSON` + `persistAIResult` pattern. Syntax-checked.

## Backlog (prioritized)
1. **MECHANICAL** Authenticity scoring endpoint (LLM-only).
2. **MECHANICAL** Sentiment-driven variant generation extension to existing `/generate-variants`.
3. **NEEDS-CREDS** Trustpilot/G2/Capterra API integrations.
4. **NEEDS-PRODUCT-DECISION** A/B testing framework, scheduled crawler scheduling/queueing.

## Apply pass 3 (frontend)

**Action**: LEFT-AS-IS. Frontend already wired for all AI endpoints.

- 17 frontend pages including dedicated pages for the two pass-2 endpoints: `CustomerSegmentation.jsx` -> `POST /api/ai/segment-customers`, `TestimonialLikelihood.jsx` -> `POST /api/ai/score-testimonial-likelihood`. Both routes registered in `App.jsx`.
- All AI fetches use a `getHeaders()` helper that pulls JWT from `localStorage.token` and sets `Authorization: Bearer ...`.
- 503 (no `OPENROUTER_API_KEY`) flows through `data.error` into a red error banner.
- Backend `routes/ai.js` mounted at `/api/ai` in `server.js`.

No FE files modified. See `_AUDIT/apply3_logs/ab3_88.md`.

## Apply pass 4 (mechanical backlog)

**Action**: LEFT-AS-IS (already done in earlier passes).

Both mechanical backlog items are already implemented end-to-end:

1. `POST /api/ai/score-authenticity` (Authenticity scoring) —
   `backend/routes/ai.js:1369` with 503 guard at line 1371; FE wired at
   `frontend/src/pages/AuthenticityScorer.jsx` (route `/authenticity-scorer` in
   `frontend/src/App.jsx:175`).
2. `POST /api/ai/generate-variants-by-persona` (Sentiment-driven variant
   generation extension) — `backend/routes/ai.js:1422` with 503 guard at
   line 1424; FE wired at `frontend/src/pages/PersonaVariants.jsx`.

Remaining backlog stays deferred: Trustpilot/G2/Capterra (NEEDS-CREDS), A/B
testing framework + scheduled crawler (NEEDS-PRODUCT-DECISION).

No code changed in this pass. See `_AUDIT/apply4_logs/ab3_88.md`.
