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
- **Quick display settings has a single canonical body.** `QuickDisplaySettingsContent` (`components/quick-display-settings-content.tsx`) is the only reusable display-settings panel. The older `QuickDisplaySettings` Dropdown wrapper and `DisplaySettingsPanel` Sheet have been deleted — don't recreate them. Embed `<QuickDisplaySettingsContent />` directly inside your own menu/sheet/dialog.
- **Demo banner auto-hide reads from `bookmarks` dependency.** `enhanced-main-content.tsx` re-checks `localStorage` flags (`hasUserData` / `hideDemoNotice`) whenever bookmarks change. The store writes both flags on first add/import; if you add another mutation that should hide the banner, write the flags from the store action, not from the component.
- **Mobile sidebar is a Sheet, not a `w-64` block.** Dashboard switches by `breakpoint === 'mobile'` from `useResponsiveLayout()` (640px). On mobile, the persistent sidebar is replaced by a `<Sheet side="left">` triggered by Header's hamburger button (`onMobileMenuClick` prop). Selecting a category auto-closes the sheet (call `setMobileSidebarOpen(false)` after `onCategorySelect`).
- **Dashboard navigation state is mirrored to URL via `history.replaceState`, not Next router.** `selectedCategory` / `selectedSubCategory` / `searchQuery` ↔ `?category=…&sub=…&q=…`. Direct `window.history.replaceState` (no `router.replace`) is intentional — avoids Suspense-boundary requirements and Next route refresh. `popstate` listener handles back/forward. If you add another state worth deep-linking, append it to the same effect; don't introduce `useSearchParams`.
- **Delete operations support undo.** All delete actions (`deleteBookmark`, `deleteSubCategory`, `deleteCategory`, `deleteBookmarksBatch`, `deleteCategoriesBatch`) capture a pre-delete snapshot in a module-level variable (not persisted) and show a sonner toast with a 5-second "撤销" button. Only the most recent snapshot is kept; older toasts become no-ops. Don't add new delete paths without going through these store actions.
- **Breadcrumb navigation in detail view.** `EnhancedMainContent` renders a `<nav>` breadcrumb (`首页 / 分类 / 子分类`) above the category title when a category is selected. It uses the `onCategorySelect(categoryId | null, subCategoryId?)` prop to navigate back. The nav has `min-w-0`, the middle category button uses `truncate max-w-[40%]`, and the leaf node uses `truncate min-w-0` + `title` tooltip — long names collapse with ellipsis, never overflow. Don't duplicate navigation logic outside this breadcrumb.
- **Sidebar collapsed state shows category initials.** When `collapsed === true`, the sidebar is `w-14` (56px) and renders a vertical strip of `w-10 h-10` (40px) circular buttons (one per category, first character). Clicking selects the category without expanding. The "system" category is excluded. Active item carries `aria-current="page"`.
- **Global keyboard shortcuts live in `app/dashboard/page.tsx`.** `/` focuses search, `N` opens add-bookmark dialog. Both skip when focus is in an input/textarea. Selection-mode shortcuts (`Esc` to exit, `Ctrl+A` to select all) live in `EnhancedMainContent`'s own useEffect.
- **No bookmark preview feature.** The site-preview panel was removed because iframe success rate was too low (most sites block via `X-Frame-Options`) and the cover image on the card already conveys the same info. Don't reintroduce `BookmarkPreview` / `onPreview` props / Shift+Click preview unless there's a new strategy (real screenshot service or sandboxed proxy).
- **Enhancement progress indicator lives in Header, not at page bottom.** When `enhancementProgress.status === 'running'`, Header shows a Loader2 spinner + count between the Settings button and the "⋯" menu. Clicking opens a Popover with progress bar and stop button. The old `<EnhancementProgress />` component has been deleted; don't re-introduce a floating-card variant.
- **Enhancement `total` counts processing units, not unique bookmarks.** Preset bookmarks that are missing a usable cover get reprocessed in the slow batch to try og:image — so `total = presetBookmarks.length + slowList.length`, which is *larger* than `bookmarks.length`. Don't "fix" this by reverting to `bookmarks.length`; the UI must show real workload to avoid `completed > total` overflow. UI side also clamps with `Math.min(completed, total)` and adds `overflow-hidden` on the progress track as defense in depth.
- **Settings panel reuses `QuickDisplaySettingsContent` for display settings.** The "显示设置" section in `SettingsPanel` embeds `<QuickDisplaySettingsContent />` directly (single source of truth). Only "网格列数" remains as a separate Card unique to the settings panel.
- **Website descriptions DB is loaded via dynamic import.** Never `import websiteDescriptions from '@/data/website-descriptions-1000plus.json'` directly — that pulls 250KB into the bundle. Use `lib/website-descriptions.ts`: at async entry points call `await loadWebsiteDescriptions()`, then use `lookupPresetSync(domain)` for in-loop lookups. Module-level cache keeps subsequent calls instant. `enhanceBookmarks` / `enhanceSingleBookmark` / `getPresetStats` already do this; the two add-bookmark dialogs' `getPresetData` is `async`.
- **Layout mode (grid/list/masonry) uses one shared MutationObserver.** `hooks/use-layout-mode.ts` exports `useLayoutMode()` — a `useSyncExternalStore` hook backed by a single module-level observer on `<html>`. **Never** instantiate a per-component `MutationObserver` to read `documentElement.classList` — at N cards that produces N observers and a synchronous storm on theme/layout change.
- **No native `confirm()` / `alert()`.** Use `confirmAction({ title, description, confirmText, variant })` from `lib/confirm-action.tsx` — returns a Promise<boolean>, renders an AlertDialog into a detached portal, matches the app theme, and works on iOS Safari (where native `confirm` may be blocked).
- **debug / test routes are server-404'd in production.** `app/{test-api,test-cover-images,debug}/layout.tsx` each call `notFound()` when `process.env.NODE_ENV === "production"`. The pages still build but return 404 to users. Don't remove these layouts when refactoring; if you add a new debug route, add the same guard layout.
- **Bookmark cards expose 3 hover icon buttons, not a ⋯ dropdown.** `[★ favorite] [✎ edit] [⧉ copy]` (favorite is always visible when active, the other two are `opacity-0 group-hover:opacity-100 focus-within:opacity-100`). The full action set lives in a Radix `<ContextMenu>` wrapping the whole `<Card>` — right-click any card to get favorite / edit / copy / move / delete. **Don't re-add a `MoreHorizontal` dropdown on cards** — it duplicates the context menu. **Delete is intentionally not on L1** (right-click only) to avoid mis-clicks.
- **Selection checkbox is top-left, square, `rounded-md`.** `selectable-bookmark-card.tsx` puts the indicator at `top-3 left-3` to avoid colliding with the L1 button group at `top-2 right-2`. Don't move it back to right or change to `rounded-full` (that looks like a radio button).
- **Favorites is a virtual category with reserved id `__favorites__`.** Sidebar renders a fixed item above `categories.map`; clicking sets `selectedCategory = '__favorites__'`. `EnhancedMainContent` has a dedicated branch before the regular detail view that renders `bookmarks.filter(b => b.isFavorite)`. The string is **never** persisted as a real category id — don't add it to `defaultCategories` or write a `Category{id:'__favorites__'}` anywhere. URL deep-link works automatically (`?category=__favorites__`).
- **`Bookmark.isFavorite` is the only favorites flag; `version: 3` migration writes the default.** Don't add a separate "favorites array" — toggling is a single field flip via `toggleFavorite(id)` / `setFavorites(ids, isFavorite)`. The persist `migrate(state, version)` in `use-bookmark-store.ts` backfills `isFavorite=false` on existing data when version<3.
- **Batch toolbar order is fixed: open / favorite / add-tags / remove-tags / move / export / delete.** Order matters — non-destructive first, destructive last. Favorite button is **smart**: when **all** selected bookmarks are already favorited, it becomes "移出收藏"; otherwise "收藏". Don't split into two separate buttons. Add new batch actions before "delete", not after.
- **Batch open: never call `window.open(url, "_blank", "noopener,...")` in a loop.** When `noopener` is in the features string, the call returns `null` even on success (per spec) — you'll mis-detect every successful open as blocked. Use `lib/open-batch.ts` `openBookmarksBatch(items)` which does `window.open(url, "_blank")` then sets `w.opener = null` manually. It returns `{ openedIds, blockedIds }` for accurate counting. Toolbar opens directly; only when the browser blocks does the dialog open with a guidance hint (top-right popup-blocker icon → always allow).
- **Selection state resets on category/sub-category switch.** `EnhancedMainContent` has a `useEffect([selectedCategory, selectedSubCategory])` that clears `selectedBookmarkIds` and sets `isSelectionMode = false`. This prevents the "取消全选" button from being stuck after navigating away and prevents stale selection ids from polluting the new view's batch ops. Don't remove this effect or add manual cleanup in the navigation handlers.


