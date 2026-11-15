# 60% Steak and Produced Weight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add «استیک ۶۰ درصد» to the catalog and let the 60% manager enter delivered and produced meat weights during bulk production registration.

**Architecture:** Keep the existing `ProductionRecord.delivered_meat_kg` and `amount_kg` fields. For the 60% bulk flow, store both aggregate weights only on the first row, while each product row keeps its calculated package weight; this preserves existing dashboard/report totals. Add the catalog item through an idempotent seed update plus a data migration, and mirror the new field in the React form payload.

**Tech Stack:** Django 5.2/DRF, PostgreSQL migrations, React/Vite.

**Spec:** User-approved behavior in the conversation: one aggregate produced-weight field beside delivered weight; «استیک ۶۰ درصد» available for the 60% manager.

## Global Constraints

- Do not change the meaning of existing `amount_kg` totals.
- Aggregate delivered and produced weights are stored only on the first bulk row to avoid double counting.
- The new product must be active and idempotently created.
- 90% and materials-manager flows must retain their current behavior.

## Review Focus

- A 60% bulk request with both aggregate weights stores each exactly once; covered by the bulk API test.
- A later 60% product row does not duplicate either aggregate weight; covered by the same test.
- The 90% flow remains delivered-weight zero and unchanged; covered by existing tests.
- The new steak is returned by the active catalog and selected by the 60% UI; covered by migration/seed and frontend build checks.

### Task 1: Backend catalog and bulk contract

**Files:**
- Modify: `backend/production/management/commands/seed_catalog.py`
- Create: `backend/production/migrations/0008_add_sixty_percent_steak.py`
- Modify: `backend/production/views.py`
- Modify: `backend/production/serializers.py`
- Test: `backend/production/tests.py`

**Interfaces:**
- Consumes the existing `/api/records/bulk/` payload.
- Produces a 60% bulk response where row 1 contains `delivered_meat_kg` and `amount_kg` from aggregate inputs, while subsequent rows keep both aggregate fields zero and retain calculated product amounts.

- [ ] Add a failing API test for a 60% bulk request containing `delivered_meat_kg=1500` and `produced_meat_kg=1200`, asserting row 1 stores both values and row 2 stores neither aggregate value.
- [ ] Run the focused Django test and confirm it fails because `produced_meat_kg` is ignored or rejected and the steak catalog item is absent.
- [ ] Add the idempotent steak product to `seed_catalog.py` and create a data migration that inserts the active product if missing.
- [ ] Update the bulk view/serializer contract so `produced_meat_kg` is validated as positive and is passed as `amount_kg` only for the first 60% row; preserve per-product calculated amounts for rows.
- [ ] Run the focused backend tests and confirm they pass.

### Task 2: Frontend 60% registration form

**Files:**
- Modify: `frontend/src/pages/Production.jsx`
- Modify: `frontend/src/api/errors.js` if field error labels need the new key.

**Interfaces:**
- Sends `produced_meat_kg` alongside existing `delivered_meat_kg` in `/api/records/bulk/` for the 60% mode.

- [ ] Add the produced-weight field beside delivered weight for `formMode === 'sixty'` and validate it as a positive number.
- [ ] Include the value in the bulk request and clear it after a successful submission.
- [ ] Verify the 60% product pool already includes every active product containing `۶۰ درصد`, including the new steak.
- [ ] Run `npm run build` and confirm the production bundle succeeds.

### Task 3: Full verification and handoff

- [ ] Run `git diff --check`, Python compilation, focused/full backend tests where dependencies are available, and frontend build.
- [ ] Review the migration, API payload, and UI diff for 90% regression risk.
- [ ] Commit and push the completed change to `main` only after fresh verification.
