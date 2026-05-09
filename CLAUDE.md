# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test runner is configured.

## Architecture

**Personal Navigation Center** is a Next.js 14 App Router bookmark manager PWA. The app is almost entirely client-side rendered.

### Core Data Flow

State lives in a single Zustand store (`hooks/use-bookmark-store.ts`) persisted to localStorage. The data model is:

```
Category → SubCategory[] → Bookmark[]
```

Bookmarks hold metadata (favicon, coverImage, description) that is lazily fetched in the background via API routes and stored back into the Zustand store.

### Key Pages

- `app/page.tsx` — Marketing/landing page; redirects returning users (checks localStorage) to `/dashboard`
- `app/dashboard/page.tsx` — Main app shell; composes Header + Sidebar + `EnhancedMainContent`

### Component Patterns

- All interactive components use `"use client"`. Server components are only used for layouts and static pages.
- UI primitives live in `components/ui/` as thin wrappers around Radix UI.
- Forms use React Hook Form + Zod validation throughout.
- Dialogs for add/edit operations (bookmarks, categories) are self-contained components that read/write directly to the Zustand store.

### API Routes (`app/api/`)

Thin server-side proxies used to bypass CORS and fetch external data:

| Route | Purpose |
|---|---|
| `/api/fetch-meta` | Fetch favicon, title, description for a URL |
| `/api/fetch-title` | Fetch page title only |
| `/api/proxy-image` | Proxy external images |
| `/api/screenshot` | Generate website screenshot |
| `/api/website-preview` | Combined preview data |
| `/api/analytics/web-vitals` | Receive Web Vitals metrics |

### Styling

Tailwind CSS with `cn()` utility (`lib/utils.ts`) for conditional class merging. Theme switching via `next-themes`. Custom theme colors are stored in display settings (separate Zustand slice in `hooks/use-display-settings.ts`).

### Path Alias

`@/*` resolves to the repository root (not `src/`).
