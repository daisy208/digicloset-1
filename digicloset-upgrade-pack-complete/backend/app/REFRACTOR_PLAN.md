# Refactor Plan: B2C to B2B (Shopify-first SaaS)

## 1. Domain Model Refactor
- [ ] Rename `User` to `Merchant` (or add new model)
- [ ] Rename `Upload` to `Product` (or add new model for Shopify products)
- [ ] Add `Outfit` model: bundle of SKUs, compatibility score, merchant_id
- [ ] Add `SKU` model: represents a product variant
- [ ] Add `Catalog` abstraction: group of products per merchant
- [ ] Add mapping for Shopify product/variant IDs

## 2. Deprioritize B2C Flows
- [ ] Mark user/upload endpoints as deprecated (do not delete)
- [ ] Add comments to clarify B2C vs B2B

## 3. Shopify Integration Layer
- [ ] Add endpoints/models for product, variant, tag, image ingestion
- [ ] Store merchant ID and catalog mapping

## 4. Storefront Widget Preparation
- [ ] Scaffold endpoint for “Complete the Look” recommendations
- [ ] Prepare minimal widget interface (API only)

## 5. Naming and Comments
- [ ] Update variable/model names and comments to reflect merchant/store context
- [ ] Leave TODOs where assumptions are unclear

## 6. AI/Recommendation Logic
- [ ] Preserve all existing logic for outfit generation and recommendations

---

This plan will be executed incrementally, with inline explanations for each significant refactor decision.
