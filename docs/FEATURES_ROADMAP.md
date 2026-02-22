# Features Roadmap (Requested 30+ items)

This document lists the requested features and their short implementation notes and status.

Status: planned — scaffolding added in repo under `app/optimizations` and `config/feature_flags.json`.

1. Verified revenue attribution per product — tie orders to product optimizations, include attribution engine.
2. Before/after conversion tracking — store baseline and post-optimization conversion metrics.
3. AI impact tagging on optimized products — label products modified by AI with confidence and impact score.
4. Continuous background re-optimization — periodic re-run engine, queue-driven.
5. Underperforming product auto-detection — anomaly detection on product metrics.
6. Seasonal keyword auto-updates — scheduled keyword refresh from trend sources.
7. Persistent store intelligence memory — long-term store embeddings and vector store.
8. Brand tone learning system — learn brand voice from product descriptions & store content.
9. Product performance pattern memory — store and reuse temporal performance patterns.
10. Store Growth Score (single composite metric) — composite KPI combining traffic, conversions, revenue.
11. SEO health scoring — per-product and store-level SEO health checks and score.
12. Conversion strength scoring — prediction-based score for conversion potential.
13. Smart performance alerts (traffic drop, ranking loss) — configurable alerts & thresholds.
14. Re-optimization reminders — scheduled reminders for manual review.
15. Cross-store anonymized benchmarking — aggregate anonymized metrics for benchmarking.
16. Industry performance comparison insights — map store metrics vs industry cohorts.
17. Monthly automated growth report (auto-email) — scheduled reporting + email delivery.
18. Optimization history timeline — timeline of all optimizations with diffs and metadata.
19. AI output feedback learning loop — capture user feedback to retrain scoring models.
20. Shopify Flow integration — actions/triggers to connect to Shopify Flow.
21. Klaviyo integration — sync lists/events for email experiments and measuring lift.
22. Google Shopping feed optimization — feed improvements and attribute mapping.
23. Meta Ads creative optimization support — prepare creatives and recommend copy/variants.
24. Agency / multi-store dashboard mode — multi-tenant views and aggregate metrics.
25. Role-based access controls — RBAC for team roles and permissions.
26. AI credit usage transparency dashboard — track tokens/credits per action and store.
27. One-click full catalog optimization — bulk optimization job with dry-run and preview.
28. Undo / restore optimization changes — store snapshots and simple rollback API.
29. Product optimization opportunity ranking — opportunity score + sorting for action items.
30. A/B description and title testing engine — experiment management, winners promotion.

Next steps: implement individual modules listed in the roadmap. See `app/optimizations` for skeletons.
