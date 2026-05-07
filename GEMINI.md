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

## Active Tasks (feat/meta-pixel-tag)

- [ ] Optimize Meta Pixel implementation for SPA (route changes)
- [ ] Implement e-commerce events (`AddToCart`, `ViewContent`, `Purchase`)
- [ ] Move noscript tag to body in `index.html`

## Completed/Paused Tasks (feat/improve-filtering-products)

- [x] Audit current filtering implementation
- [x] Enhance UX for multi-select filters
- [ ] Improve URL parameter handling (Paused)
- [ ] Optimize filter performance (Paused)

## Session Log (2026-04-16)

- **12:07 PM**: Initialized project memory via `/init`. Focus set to `feat/improve-filtering-products`.
- **12:28 PM**: Committed decoupling of measurement labels from backend values. Added `M_` prefix handling for pillow sizes to match Strapi constraints without affecting UI aesthetics.

## Key Guidelines from CLAUDE.md

- **Tech Stack**: React Router 7 (lazy loading, loaders), TanStack Query (server state), Zustand (client state/cart).
- **Styling**: TailwindCSS 4 + shadcn/ui.
- **Workflow**: Always run `pnpm pre-commit` in `frontend/` before suggesting or finalizing commits.
- **Null Handling**: Sections should return `null` when data is empty.
- **Language**: Core logic and responses should be in English (unless UI copy is requested in Spanish).

For detailed command references, project structure, and integration logic, refer directly to [CLAUDE.md](file:///c:/Desarrollo/flexigom/CLAUDE.md).
