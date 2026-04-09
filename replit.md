# Memory Hub — replit.md

## Overview

Memory Hub is an intelligent personal memory management web app — a graduation project. It lets users capture personal information (text notes, links, file uploads), automatically enriches each entry with real TF-IDF keyword extraction, entity detection, topic classification, and semantic search. The UI is fully in Russian. The app is demo/graduation-defense ready.

**Core user flow:**
1. Register / Login (localStorage-based fake auth, or demo mode)
2. Capture a memory (text, link — auto-fetches page metadata, or file — auto-extracts text)
3. Server enriches it with real NLP (tags via TF-IDF, entities via regex heuristics, summary, semantic signature)
4. Search by meaning (TF-IDF cosine similarity + synonyms) or exact keyword
5. Browse Library, Timeline, Connections, and Tags pages
6. Chat with AI assistant (RAG: retrieves relevant memories + cites sources; GPT-4o-mini if OPENAI_API_KEY set)
7. View/edit/delete memory details (rich tabs: Content, AI Summary, Entities, Related)

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend (React + Vite + TypeScript)

- **Framework:** React 18 with Vite, **not Next.js**
- **Routing:** `wouter` (lightweight client-side routing)
- **UI library:** shadcn/ui (Radix UI primitives + Tailwind CSS), "new-york" style variant
- **Styling:** Tailwind CSS with custom CSS variables for theming; light/dark mode via `.dark` class toggled by `ThemeProvider`
- **Animation:** `framer-motion`
- **State/data:** TanStack Query v5 for server state caching
- **Forms:** React Hook Form + `@hookform/resolvers` + Zod
- **Icons:** `lucide-react`
- **Date formatting:** `date-fns` with Russian locale
- **Language:** All UI copy is in Russian

**Key client directories:**
```
client/
  src/
    pages/         # Route-level page components
    components/    # Shared UI (layout, memory-card, command-menu)
    components/ui/ # shadcn/ui primitives
    contexts/      # AuthContext (localStorage auth), ThemeContext (light/dark)
    hooks/         # use-auth, use-memories, use-toast, use-mobile
    lib/           # queryClient, utils
```

**Pages/routes:**
- `/` — Landing/home page (public)
- `/login` — Login (public, localStorage auth + demo mode)
- `/register` — Register (public, localStorage auth)
- `/dashboard` — Default page after login; KPI cards, recent memories, quick capture
- `/library` — Grid/list view, type filters
- `/timeline` — Memories grouped by date
- `/search` — Semantic + keyword search with split preview layout
- `/memory/:id` — Memory detail, edit, delete, related memories (tabs: Content/AI Summary/Entities/Related)
- `/connections` — Topics, people, tags aggregation view
- `/chat` — AI chat citing stored memories (RAG)
- `/tags` — Tag browser
- `/settings` — Export/import, theme toggle, search mode preference

**AuthGuard:** Wraps all routes; redirects unauthenticated users to `/login`. Public paths: `/`, `/login`, `/register`.

### Backend (Express + TypeScript)

- **Framework:** Express 5 (single process, serves API + static frontend)
- **Entry:** `server/index.ts` → `registerRoutes()` + `serveStatic()` (production) or `setupVite()` (development)
- **Storage:** In-memory (`MemStorage` class using a `Map<number, Memory>`) — **not persisted between restarts**. PostgreSQL/Drizzle is configured but active storage is in-memory.
- **NLP enrichment:** `server/enrichment.ts` — real TF-IDF keyword extraction, entity detection (people/dates/URLs/emails/hashtags), topic classification
- **Search engine:** `server/search-engine.ts` — TF-IDF + cosine similarity + synonym expansion + tag/entity score boosting
- **Chat engine:** `server/chat-engine.ts` — intent detection (stats/list/search/help), RAG with memory retrieval, OpenAI GPT-4o-mini fallback if `OPENAI_API_KEY` is set
- **File processor:** `server/file-processor.ts` — extracts text from .txt/.md (direct), .pdf (pdf-parse), .docx (mammoth)
- **Link processor:** `server/link-processor.ts` — fetches URLs, extracts title/description/domain/bodyText via HTML parsing
- **Routes defined in:** `server/routes.ts`

**API endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/memories` | List all memories |
| GET | `/api/memories/:id` | Get one memory |
| POST | `/api/memories` | Create memory (real NLP enrichment) |
| PUT | `/api/memories/:id` | Update memory |
| DELETE | `/api/memories/:id` | Delete memory |
| POST | `/api/search` | Semantic/keyword search with scores |
| POST | `/api/chat` | AI chat with RAG (intent detection + memory retrieval) |
| POST | `/api/upload` | File upload + text extraction (multer, pdf-parse, mammoth) |
| POST | `/api/fetch-link` | Fetch URL metadata (title, description, domain) |

### Shared Layer (`shared/`)

- `shared/schema.ts` — Drizzle ORM schema + Zod schemas + TypeScript types shared between client and server
- `shared/routes.ts` — API route contracts with `buildUrl()` helper

**Memory data shape (extended):**
```ts
{
  id, title, content, type,           // core
  createdAt,                           // timestamp
  tags,                                // string[] — extracted via TF-IDF
  entities: { people, dates, topics }, // extracted via regex heuristics
  summary, semanticSignature,          // NLP-generated
  relatedIds,                          // integer[] of related IDs
  extractedContent,                    // text from uploaded files or fetched pages
  filePath, fileMimeType, fileSize,    // file attachment metadata
  linkUrl, linkTitle, linkDomain, linkDescription, // link metadata
  processingStatus                     // "done" | "processing" | "error"
}
```

### Authentication

- **Fake/demo auth** via localStorage only — no backend session, no JWT
- `AuthContext` stores users array in `memory_hub_users` key and current session in `memory_hub_session`
- Supports register, login (username or email + password), demo login, and logout
- Error messages in Russian

### Intelligence Layer (Real Implementations)

1. **TF-IDF enrichment** (`server/enrichment.ts`): Extracts keywords, builds semantic signature, classifies topics (Frontend/Backend/ML etc.), detects entities
2. **Search engine** (`server/search-engine.ts`): TF-IDF cosine similarity, synonym expansion (Russian↔English), tag/entity score boosting, returns relevance score + match reason
3. **Chat engine** (`server/chat-engine.ts`): Intent detection (stats/list/find/help/greeting), RAG with top-N memory retrieval, template-based responses with source citations, optional GPT-4o-mini via `OPENAI_API_KEY`
4. **File processor** (`server/file-processor.ts`): .txt/.md (fs.readFile), .pdf (pdf-parse), .docx (mammoth), others flagged as unsupported
5. **Link processor** (`server/link-processor.ts`): 8s timeout fetch, cheerio HTML parsing for title/description/domain/body text

### Design System & Visual Identity

- **Color palette:** Primary purple `252 80% 55%` (light) / `252 80% 67%` (dark)
- **Background:** Light `220 22% 95.5%`, Dark `230 22% 6.5%`
- **Border:** Light `220 14% 88%`, Dark `230 13% 20%`
- **Type-colored icons:** Blue (text/заметка), Emerald (link/ссылка), Amber (file/файл)
- **CSS utilities:** `.card-base`, `.section-label`, `.meta-text`, `.card-hover`
- **Typography:** Onest font (300–800 weights), JetBrains Mono for mono text
- **Cards:** `rounded-2xl`, `border-border/30`, hover lift with `shadow-primary/5`

### Theme System

- `ThemeProvider` reads/writes `memory_hub_theme` in localStorage
- Toggles `dark` class on `document.documentElement`

### Build System

- **Dev:** `tsx server/index.ts` — Express + Vite dev server
- **Production build:** `script/build.ts` — `vite build` (client → `dist/public/`) + `esbuild` (server → `dist/index.cjs`)

---

## External Dependencies

### Runtime dependencies (key ones)

| Package | Purpose |
|---------|---------|
| `express` v5 | HTTP server / API |
| `drizzle-orm` + `drizzle-zod` | ORM + schema validation |
| `pg` | PostgreSQL client |
| `zod` | Runtime schema validation |
| `multer` | File upload handling |
| `pdf-parse` | PDF text extraction |
| `mammoth` | DOCX text extraction |
| `cheerio` | HTML parsing for link metadata |
| `@tanstack/react-query` v5 | Client-side data caching |
| `wouter` | Lightweight React router |
| `framer-motion` | Animations |
| `date-fns` | Date formatting (Russian locale) |
| `lucide-react` | Icons |
| `tailwindcss` | Utility-first CSS |

### Infrastructure / Environment

| Dependency | Notes |
|-----------|-------|
| PostgreSQL | Via `DATABASE_URL` for Drizzle; **not used at runtime** (in-memory storage active) |
| `OPENAI_API_KEY` | Optional: enables GPT-4o-mini in chat engine; falls back to template responses if unset |
| `SESSION_SECRET` | Required env var (set) |
| File uploads | Stored in `uploads/` directory (auto-created on server start) |

### No required paid external services

AI features work without any API keys using local TF-IDF heuristics. Optional OpenAI integration enhances chat responses when `OPENAI_API_KEY` is set.
