# Governed Social Proof Operations

The supported backend is `/api/governed-proof`. Original generated, direct-AI, widget, crawler, and `gap*` routes remain as reference material but are not mounted by `backend/server.js`.

## Controlled setup

1. Copy `.env.example` into a secret-managed environment and replace placeholders.
2. Run `./scripts/bootstrap.sh` explicitly to install lockfile-pinned dependencies.
3. Apply `./scripts/migrate.sh apply-governed-proof-001` through normal database change approval.
4. Provision users, tenants, and memberships through an administrator-controlled channel. Public and demo registration/login are disabled.
5. Enable a provider only after its HTTPS endpoint and runtime credential exist. Readiness fails closed.
6. Run `./start.sh`. It refuses missing dependencies and occupied ports and does not install, seed, migrate, create databases, or kill processes it did not start.

## Evidence, targeting, and publication

Testimonials, verified reviews, case studies, and customer records require authoritative references, digests, active consent, and current publication rights. Sensitive attributes are rejected. Versioned, allow-listed segment rules operate only on consented CRM fields; inputs are represented in durable state by provenance digests. Testimonial selection uses explicit relevance, recency, verified-outcome, and quality weights and retains its reasons and evidence digests.

Editors build accessible, immutable content versions with editable timelines. Render jobs use deterministic export specifications and bounded retry/dead-letter handling. Successful artifacts must pass source fidelity, timing, layout, accessibility, brand, multilingual, and export compatibility. Moderation, live rights/consent, AI disclosure/watermark policy, and an approver independent of the creator gate the idempotent publication outbox. Provider failures and usage/cost are durable evidence.

## External validation still required

Local tests cover deterministic policy, targeting exclusions, authorization, failure handling, migrations, API contracts, and launcher safety without external services. Production release still needs real CRM/review/media/channel contract tests, legal consent and licensing review, bias/fairness analysis of segment definitions, render and accessibility fixtures, moderation owner sign-off, migration/restore rehearsal, security review, and controlled end-to-end publication.
