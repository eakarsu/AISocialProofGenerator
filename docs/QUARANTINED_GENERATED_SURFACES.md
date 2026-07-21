# Quarantined Generated Surfaces

The original backend exposes numerous generated routes, mock/sample behavior, direct chat completions, request-time DDL, silent database failures, and gap modules. The frontend still contains prototype pages for some of them. They are not supported product behavior.

The former `gapNoAiDrivenCustomerSegmentationForTargetedTestimonialSelection.js` surface is superseded by `/api/governed-proof/segmentation-runs` and its evidence-bound selection workflow. `backend/server.js` mounts only health, tenant authentication, and the governed API. Reintroducing a quarantined route requires authoritative typed inputs, durable tenant state, consent/rights controls, explicit failure semantics, and acceptance tests equivalent to the supported workflow.
