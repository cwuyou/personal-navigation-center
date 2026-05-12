# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For deeper context see:
- `PROJECT_INDEX.md` — fast lookup: directory layout, route list, API table
- `docs/architecture.md` — design rationale, data flows, subsystem details

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

State lives in **two Zustand stores** persisted to localStorage:
- `hooks/use-bookmark-store.ts` → key `bookmark-store` — the main data (categories, bookmarks)
- `hooks/use-display-settings.ts` → key `display-settings` — UI preferences (theme color, card layout, visibility toggles)

The bookmark data model is:

```
Category → SubCategory[] → Bookmark[]
```

Bookmarks hold metadata (favicon, coverImage, description) that is lazily fetched in the background via API routes and stored back into the Zustand store by `lib/background-metadata-enhancer.ts` (singleton).

### Key Pages

- `app/page.tsx` — Marketing/landing page; redirects returning users (checks localStorage) to `/dashboard`
- `app/dashboard/page.tsx` — Main app shell; composes Header + Sidebar + `EnhancedMainContent`

### Component Patterns

- All interactive components use `"use client"`. Server components are only used for layouts and static pages.
- UI primitives live in `components/ui/` as thin wrappers around Radix UI.
- Forms use React Hook Form + Zod validation throughout.
- Dialogs for add/edit operations (bookmarks, categories) are self-contained components that read/write directly to the Zustand store.

### API Routes (`app/api/`)

Thin server-side proxies (all Edge Runtime) used to bypass CORS and fetch external data:

| Route | Purpose |
|---|---|
| `/api/fetch-meta` | Fetch favicon, title, description for a URL |
| `/api/fetch-title` | Fetch page title only |
| `/api/proxy-image` | Proxy external images. 6-level fallback chain; all failures redirect (302) to `/api/screenshot`. See `docs/architecture.md` §6.4. |
| `/api/screenshot` | Generate letter-on-color SVG placeholder (no external request). Color and letter derived from `lib/letter-placeholder.ts`. |
| `/api/website-preview` | Combined preview data |
| `/api/analytics/web-vitals` | Receive Web Vitals metrics |

### Styling

Tailwind CSS with `cn()` utility (`lib/utils.ts`) for conditional class merging. Theme switching via `next-themes`. Custom theme colors are stored in the display-settings store.

### Path Alias

`@/*` resolves to the repository root (not `src/`).

## Conventions (important when editing)

- **No bare external favicon URLs in client code.** `google.com/s2/favicons` and `icons.duckduckgo.com` are blocked in mainland China — always route through `/api/proxy-image` or `getFaviconUrl()` (which already wraps the proxy).
- **Single source of truth for the letter placeholder.** The palette and hash in `lib/letter-placeholder.ts` must stay byte-identical with the server SVG in `app/api/screenshot/route.ts`; they're both imported from the same module. Changing one without the other breaks visual consistency.
- **Single source of truth for search filtering.** `lib/search-utils.ts` exports `filterBookmarks` / `filterCategories` / `parseSearchQuery`. Both `EnhancedSearch` (for the history count) and `SearchResults` (for the real display) must use it — do not inline another filter pass.
- **Service Worker only in production.** `components/pwa-install.tsx` unregisters SWs and clears caches under `NODE_ENV !== 'production'` to avoid dev-mode chunk cache corruption. Keep that guard if you touch the file.
- **URL normalization happens at store boundary**, not in components. `use-bookmark-store.ts` strips tracking params, trailing slashes, hashes before storing. Never re-normalize downstream.
- **Default demo bookmarks** in `defaultBookmarks` must not hardcode `coverImage` or `favicon` pointing to unreachable services. Use `withFavicons()` helper at injection time.

