# Memory Hub — replit.md

## Overview

Memory Hub is an "Intelligent Personal Memory" web app — a SaaS-style graduation project. It lets users capture personal information (text notes, links, file metadata), automatically enriches each entry with tags, entity extraction, and a summary (all mocked server-side), and supports both semantic and keyword search. The UI is in Russian. The app is demo/graduation-defense ready.

**Core user flow:**
1. Register / Login (localStorage-based fake auth)
2. Capture a memory (text, link, or file)
3. Server enriches it with mock AI (tags, entities, summary, semantic signature)
4. Search by meaning (semantic) or exact keyword
5. Browse Library, Timeline, Connections, and Tags pages
6. Chat with a mock AI that searches stored memories and cites sources
7. View/edit/delete memory details

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend (React + Vite + TypeScript)

- **Framework:** React 18 with Vite as the bundler, not Next.js (despite early design docs referencing Next.js — the actual implementation is React + Vite + Wouter for routing)
- **Routing:** `wouter` (lightweight client-side routing, not React Router or Next.js App Router)
- **UI library:** shadcn/ui (Radix UI primitives + Tailwind CSS), "new-york" style variant
- **Styling:** Tailwind CSS with custom CSS variables for theming; both light and dark mode supported via `.dark` class on `<html>`, toggled by `ThemeProvider` and saved to localStorage
- **Animation:** `framer-motion` for page/list transitions and micro-interactions
- **State/data fetching:** TanStack Query (React Query v5) for server state caching; no Redux or Zustand
- **Forms:** React Hook Form + `@hookform/resolvers` + Zod validation
- **Icons:** `lucide-react`
- **Date formatting:** `date-fns` with Russian locale
- **Language:** UI copy is in Russian

**Key client directories:**
```
client/
  src/
    pages/         # Route-level page components
    components/    # Shared UI components (layout, memory-card, command-menu)
    components/ui/ # shadcn/ui primitives
    contexts/      # AuthContext (localStorage auth), ThemeContext (light/dark)
    hooks/         # use-auth, use-memories, use-toast, use-mobile
    lib/           # queryClient, utils, search (semantic scoring)
```

**Pages/routes:**
- `/` — Landing/home page (public)
- `/login` — Login (public, localStorage auth)
- `/register` — Register (public, localStorage auth)
- `/dashboard` — Default page after login; KPI cards, recent memories, quick capture
- `/library` — Grid/list view, type filters
- `/timeline` — Memories grouped by date
- `/search` — Semantic + keyword search with split preview layout
- `/memory/:id` — Memory detail, edit, delete, related memories (tabs)
- `/connections` — Topics, people, tags aggregation view
- `/chat` — Mock AI chat citing stored memories
- `/tags` — Tag browser
- `/settings` — Export/import, theme toggle, search mode preference

**AuthGuard:** Wraps all routes; redirects unauthenticated users to `/login`. Public paths are `/`, `/login`, `/register`.

### Backend (Express + TypeScript)

- **Framework:** Express 5 (single process, serves both API and static frontend)
- **Entry:** `server/index.ts` → `registerRoutes()` + `serveStatic()` (production) or `setupVite()` (development)
- **Storage:** In-memory (`MemStorage` class using a `Map<number, Memory>`) — **not persisted to disk between restarts**. PostgreSQL is configured via Drizzle but the active storage layer is in-memory.
- **Mock AI:** `server/mock-ai.ts` — `generateMockEnrichment()` assigns tags/entities/summary from keyword heuristics; `searchMemories()` does cosine-like scoring
- **Routes defined in:** `server/routes.ts`, path contracts declared in `shared/routes.ts`

**API endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/memories` | List all memories |
| GET | `/api/memories/:id` | Get one memory |
| POST | `/api/memories` | Create memory (1.5s mock AI delay) |
| PUT | `/api/memories/:id` | Update memory |
| DELETE | `/api/memories/:id` | Delete memory |
| GET | `/api/search?q=&mode=` | Search memories |
| POST | `/api/chat` | Mock AI chat answer |

### Shared Layer (`shared/`)

- `shared/schema.ts` — Drizzle ORM schema for PostgreSQL (`memories` table) + Zod insert/update schemas + TypeScript types shared between client and server
- `shared/routes.ts` — API route contracts (method, path, input schema, response schema) used by both client hooks and server route registration; includes a `buildUrl()` helper

**Memory data shape:**
```ts
{
  id, title, content, type,   // core
  createdAt,                  // timestamp
  tags,                       // string[]
  entities: { people, dates, topics },  // jsonb
  summary, semanticSignature, // AI-generated strings
  relatedIds                  // integer[] of related memory IDs
}
```

### Authentication

- **Fake/demo auth** via localStorage only — no backend session, no JWT, no real OAuth
- `AuthContext` stores users array in `memory_hub_users` key and current session in `memory_hub_session`
- Supports register, login (by username or email + password), demo login, and logout
- Error messages are in Russian

### Semantic Search

Two implementations exist in parallel:
1. **Server-side** (`server/mock-ai.ts`): keyword + synonym heuristics scoring, used by `/api/search`
2. **Client-side** (`client/src/lib/search.ts`): richer tokenization, Russian/English synonym map, stem overlap, recency boost — used directly in the Chat page

The client-side `semanticSearch()` function is designed so the scoring algorithm can be swapped for real embeddings later without changing the API surface.

### Design System & Visual Identity

- **Color palette:** Primary purple `252 80% 55%` (light) / `252 80% 67%` (dark), with gradient combinations extending to purple-600
- **CSS utilities:** `gradient-text`, `gradient-border`, `card-hover`, `stat-card`, `glass`, `glass-card`, `animate-float`, `animate-pulse-slow`, `shimmer`, `animate-gradient`
- **CSS variables:** `--gradient-primary`, `--gradient-accent`, `--gradient-hero` for reusable gradients
- **Typography:** Onest font (300–800 weights), JetBrains Mono for code/mono
- **Type-colored icons:** Blue (text/заметка), Emerald (link/ссылка), Amber (file/файл) — consistent across all views
- **Background:** Light `220 20% 97%`, Dark `230 20% 7%` with ambient glow blobs on hero/login pages
- **Card treatment:** `rounded-2xl`, `border-border/30`, hover lift with `shadow-primary/5`, gradient glow on hover
- **Spacing:** Consistent use of `p-5 md:p-10` page padding, `gap-4` card grids, `gap-2` tag groups
- **Accessibility:** All icon-only buttons have `aria-label`, file dropzone is keyboard-operable with `role="button"`, `tabIndex`, Enter/Space handlers

### Theme System

- `ThemeProvider` wraps the app and reads/writes `memory_hub_theme` in localStorage
- Toggles `dark` class on `document.documentElement`
- CSS variables in `client/src/index.css` define both `:root` (light) and `.dark` token sets

### Build System

- **Dev:** `tsx server/index.ts` — runs Express which proxies to Vite dev server
- **Production build:** `script/build.ts` — runs `vite build` (client to `dist/public/`) then `esbuild` (server to `dist/index.cjs`)
- **DB migrations:** `drizzle-kit push` (targets PostgreSQL via `DATABASE_URL`)

---

## External Dependencies

### Runtime dependencies (key ones)

| Package | Purpose |
|---------|---------|
| `express` v5 | HTTP server / API |
| `drizzle-orm` + `drizzle-zod` | ORM + schema validation bridge |
| `pg` | PostgreSQL client (Drizzle dialect) |
| `zod` | Runtime schema validation (shared between client + server) |
| `@tanstack/react-query` v5 | Client-side data fetching and caching |
| `wouter` | Lightweight React router |
| `framer-motion` | Animation library |
| `date-fns` | Date formatting (Russian locale used) |
| `lucide-react` | Icon library |
| `tailwindcss` | Utility-first CSS |
| All `@radix-ui/react-*` | Accessible UI primitives (via shadcn/ui) |
| `class-variance-authority` + `clsx` + `tailwind-merge` | Conditional class utilities |

### Infrastructure / Environment

| Dependency | Notes |
|-----------|-------|
| PostgreSQL | Required via `DATABASE_URL` env var for Drizzle migrations; **NOT used at runtime currently** (in-memory storage is active) |
| `connect-pg-simple` | Listed as dependency (for pg-backed sessions) but not currently wired up |
| Replit plugins | `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner` (dev-only) |
| Google Fonts | Loaded in `client/index.html` — Onest + JetBrains Mono |

### No paid external services

The project explicitly avoids all paid APIs. AI features (entity extraction, summarization, semantic search, chat) are all implemented as deterministic mocks using heuristics and synonym maps.