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
- **Header has 3 first-class buttons; the rest live in "⋯" overflow.** First-class: 添加书签 / 导入 / 设置. Overflow menu (`MoreHorizontal`): 显示 (sub) / 导出 (sub) / 产品首页 / 帮助 / 关于. Don't add new top-level buttons without moving existing ones into overflow first — the header is bandwidth-constrained on narrow screens.
- **Quick display settings is consumed in two places, but only `QuickDisplaySettingsContent` (the panel body) is reusable.** The standalone `QuickDisplaySettings` (Dropdown wrapper) is no longer used — it's kept only for backwards reference. New surfaces should embed `<QuickDisplaySettingsContent />` inside their own menu/sheet.
- **Demo banner auto-hide reads from `bookmarks` dependency.** `enhanced-main-content.tsx` re-checks `localStorage` flags (`hasUserData` / `hideDemoNotice`) whenever bookmarks change. The store writes both flags on first add/import; if you add another mutation that should hide the banner, write the flags from the store action, not from the component.
- **Mobile sidebar is a Sheet, not a `w-64` block.** Dashboard switches by `breakpoint === 'mobile'` from `useResponsiveLayout()` (640px). On mobile, the persistent sidebar is replaced by a `<Sheet side="left">` triggered by Header's hamburger button (`onMobileMenuClick` prop). Selecting a category auto-closes the sheet (call `setMobileSidebarOpen(false)` after `onCategorySelect`).
- **Dashboard navigation state is mirrored to URL via `history.replaceState`, not Next router.** `selectedCategory` / `selectedSubCategory` / `searchQuery` ↔ `?category=…&sub=…&q=…`. Direct `window.history.replaceState` (no `router.replace`) is intentional — avoids Suspense-boundary requirements and Next route refresh. `popstate` listener handles back/forward. If you add another state worth deep-linking, append it to the same effect; don't introduce `useSearchParams`.
- **Demo banner / settings-panel naming gotcha.** `components/display-settings-panel.tsx` exports a full Sheet (legacy, currently unreferenced). New display panels live in `components/quick-display-settings-content.tsx`. Don't import `DisplaySettingsPanel` expecting a dropdown body.
- **Delete operations support undo.** All delete actions (`deleteBookmark`, `deleteSubCategory`, `deleteCategory`, `deleteBookmarksBatch`, `deleteCategoriesBatch`) capture a pre-delete snapshot in a module-level variable (not persisted) and show a sonner toast with a 5-second "撤销" button. Only the most recent snapshot is kept; older toasts become no-ops. Don't add new delete paths without going through these store actions.
- **Breadcrumb navigation in detail view.** `EnhancedMainContent` renders a `<nav>` breadcrumb (`首页 / 分类 / 子分类`) above the category title when a category is selected. It uses the `onCategorySelect(categoryId | null, subCategoryId?)` prop to navigate back. Don't duplicate navigation logic outside this breadcrumb.
- **Sidebar collapsed state shows category initials.** When `collapsed === true`, the sidebar renders a vertical strip of circular buttons (one per category, showing the first character). Clicking selects the category without expanding. The "system" category is excluded.
- **Global keyboard shortcuts live in `app/dashboard/page.tsx`.** `/` focuses search, `N` opens add-bookmark dialog. Both skip when focus is in an input/textarea. Selection-mode shortcuts (`Esc` to exit, `Ctrl+A` to select all) live in `EnhancedMainContent`'s own useEffect.
- **Shift+Click on bookmark cards triggers preview.** All three card components (`enhanced-bookmark-card`, `bookmark-card`, `selectable-bookmark-card`) check `e.shiftKey` before opening the URL. If shift is held and `onPreview` is provided, preview fires instead.
- **Enhancement progress indicator lives in Header, not at page bottom.** When `enhancementProgress.status === 'running'`, Header shows a Loader2 spinner + count between the Settings button and the "⋯" menu. Clicking opens a Popover with progress bar and stop button. The old `<EnhancementProgress />` component is no longer rendered.
- **Enhancement `total` counts processing units, not unique bookmarks.** Preset bookmarks that are missing a usable cover get reprocessed in the slow batch to try og:image — so `total = presetBookmarks.length + slowList.length`, which is *larger* than `bookmarks.length`. Don't "fix" this by reverting to `bookmarks.length`; the UI must show real workload to avoid `completed > total` overflow. UI side also clamps with `Math.min(completed, total)` and adds `overflow-hidden` on the progress track as defense in depth.
- **Settings panel reuses `QuickDisplaySettingsContent` for display settings.** The "显示设置" section in `SettingsPanel` embeds `<QuickDisplaySettingsContent />` directly (single source of truth). Only "网格列数" remains as a separate Card unique to the settings panel.


