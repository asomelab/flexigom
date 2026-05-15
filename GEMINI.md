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

## Active Tasks (feat/coupun-function)

- [ ] Create `Promotion` or `Coupon` content type in Strapi
- [ ] Implement coupon validation logic in the backend
- [ ] Add coupon application UI in the frontend checkout
- [ ] Integrate coupon discounts into order calculation and MercadoPago preference

## Completed/Paused Tasks

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

## Session Log (2026-05-14)

- **11:46 AM**: Initialized project memory via `/init`. Branch switched to `feat/strapi-plugin-backup`. focus shifted to backend backup implementation.
- **12:28 PM (2026-04-16)**: Committed decoupling of measurement labels from backend values. Added `M_` prefix handling for pillow sizes.
- **06:42 PM**: Fixed database authentication error (`password authentication failed for user "postgres"`) by resolving port conflict and starting the project's Docker container. Switched to `feat/coupun-function` branch.

## Key Guidelines from CLAUDE.md

- **Tech Stack**: React Router 7 (lazy loading, loaders), TanStack Query (server state), Zustand (client state/cart).
- **Styling**: TailwindCSS 4 + shadcn/ui.
- **Workflow**: Always run `pnpm pre-commit` in `frontend/` before suggesting or finalizing commits.
- **Null Handling**: Sections should return `null` when data is empty.
- **Language**: Core logic and responses should be in English (unless UI copy is requested in Spanish).

For detailed command references, project structure, and integration logic, refer directly to [CLAUDE.md](file:///c:/Desarrollo/flexigom/CLAUDE.md).
