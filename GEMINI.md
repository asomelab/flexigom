# GEMINI.md

This file provides guidance to Gemini (Antigravity) when working with code in this repository. 
It serves as a bridge to the established guidelines in `CLAUDE.md`.

## Primary Instruction

**You must prioritize and follow all instructions, patterns, and guidelines defined in [CLAUDE.md](file:///c:/Desarrollo/flexigom/CLAUDE.md).**

## Project Overview

**Flexigom** is an MVP for a bed, mattress, and pillow shop with a Strapi CMS backend and React frontend. 

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS 4 + shadcn/ui
- **Backend**: Strapi 5.23.1 + PostgreSQL + REST API + MercadoPago
- **Package Manager**: pnpm (always use pnpm for commands)

## Active Tasks (fix/meta-pixel-roas)

- [ ] Disable automatic event click tracking in Meta Events Manager settings (Assigned to Marketing)
- [x] Implement secure purchase tracking resolution (Option B: backend tracking endpoint)
- [x] Integrate backend Meta Conversions API (CAPI) Purchase event dispatching
- [ ] Verify event validation with Meta's Test Events panel (Assigned to Marketing)

## Completed/Paused Tasks

### fix/meta-pixel-roas (Active)
- [x] Analyze codebase tracking implementations (`meta-pixel.ts`, `cart-store.ts`, `payment-success-page.tsx`)
- [x] Create fix branch `fix/meta-pixel-roas` off `dev`
- [x] Write comprehensive, detailed two-option implementation plan `implementation_plan_roas.md`
- [x] Implement Option B backend tracking endpoint `/api/orders/tracking/:externalReference`
- [x] Implement server-side Meta Conversions API (CAPI) Purchase event trigger in MercadoPago Webhook
- [x] Update frontend success page to fetch secure verified order totals and trigger client-side Pixel

### feat/promotion-banner (Completed)
- [x] Integrate desktop & mobile responsive promotion banners in the Hero section
- [x] Refactor and style the scrolling marquee promotional banner with custom animation speed and gap settings

### feat/coupun-function (Completed)
- [x] Create `Promotion` or `Coupon` content type in Strapi
- [x] Implement coupon validation logic in the backend
- [x] Add coupon application UI in the frontend checkout
- [x] Integrate coupon discounts into order calculation and MercadoPago preference

### feat/strapi-plugin-backup (Paused)
- [ ] Research and implement a backup solution for Strapi (database + uploads)
- [ ] Configure automatic backup schedules
- [ ] Implement manual backup trigger via admin panel or API

### feat/meta-pixel-tag (Completed)
- [x] Optimize Meta Pixel implementation for SPA (route changes)
- [x] Implement e-commerce events (`AddToCart`, `ViewContent`, `Purchase`)
- [x] Move noscript tag to body in `index.html`

### feat/improve-filtering-products (Paused)
- [x] Audit current filtering implementation
- [x] Enhance UX for multi-select filters
- [ ] Improve URL parameter handling (Paused)
- [ ] Optimize filter performance (Paused)

## Session Log (2026-05-18)

- **11:37 AM**: Initialized project memory via `/init`. Branch is `feat/promotion-banner`. Audited project and verified that coupon-function is fully completed and merged. Updated memory in `GEMINI.md`.

## Session Log (2026-05-19)

- **11:50 AM**: Refactored the responsive `hero-section.tsx` right column to use `<picture>` element. Embedded high-performance conditional source targeting mobile viewports via `promotion-banner-mobile.webp` and desktop viewports via `promotion-banner.webp`.
- **12:02 PM**: Tuned scrolling marquee animation in `index.css` by reducing speed to `40s` linear loop, and widened item separation to `gap-2 px-20` in `promotion-banner.tsx` for optimal readability and spacing. Tested compilation and formatting using `pnpm tsc` and `pnpm format`.

## Session Log (2026-05-20)

- **02:37 PM**: Switched context to tracking optimization. Analyzed Meta Pixel ROAS issues regarding missing `value` and `currency` fields on `AddToCart` and `Purchase`. Switched branch to `fix/meta-pixel-roas` off the updated `dev` branch. Created detailed two-option implementation plan `implementation_plan_roas.md` in the brain artifacts directory. Updated memory in `GEMINI.md`.
- **04:15 PM**: Implemented Option B for frontend/backend tracking. Created standard Strapi core files for the `order` API (router, service, and custom controllers) to fix the production bug where `order` didn't show up in Roles & Permissions. Built a lightweight, server-side Meta Conversions API (CAPI) `Purchase` event dispatcher inside the MercadoPago webhook to solve CAPI tracking issues securely and permanently.

## Key Guidelines from CLAUDE.md

- **Tech Stack**: React Router 7 (lazy loading, loaders), TanStack Query (server state), Zustand (client state/cart).
- **Styling**: TailwindCSS 4 + shadcn/ui.
- **Workflow**: Always run `pnpm pre-commit` in `frontend/` before suggesting or finalizing commits.
- **Null Handling**: Sections should return `null` when data is empty.
- **Language**: Core logic and responses should be in English (unless UI copy is requested in Spanish).

For detailed command references, project structure, and integration logic, refer directly to [CLAUDE.md](file:///c:/Desarrollo/flexigom/CLAUDE.md).


