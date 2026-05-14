# PROJECT_INDEX

**Personal Navigation Center** — 基于 Next.js 14 App Router 构建的个人书签管理 / 导航起始页 PWA。几乎全部逻辑运行在客户端，数据持久化在浏览器 localStorage，API 路由仅作为跨域代理和元数据抓取的轻量服务端。

---

## 1. 技术栈

### 核心框架
| 类别 | 选型 | 说明 |
|---|---|---|
| 框架 | **Next.js 14.2** (App Router) | 页面 + API Routes；所有 API 跑在 `edge` runtime |
| 运行时 | React 18 + TypeScript 5 | `"use client"` 组件为主 |
| 样式 | Tailwind CSS 3.4 + `tailwindcss-animate` | 通过 `lib/utils.ts` 的 `cn()` 合并类名 |
| UI 原子 | **Radix UI** 全家桶 + `lucide-react` 图标 | 封装在 `components/ui/` |
| 主题 | `next-themes` + 自定义 `theme-loader` | 支持深浅色 + 用户自定义 primary/radius |
| 字体 | `geist/font` (Sans + Mono) | 通过 `next/font` 本地化 |

### 状态与数据
| 类别 | 选型 | 说明 |
|---|---|---|
| 状态管理 | **Zustand** + `persist` 中间件 | 两个独立 store,分别持久化到 `bookmark-store`、`display-settings` |
| 不可变更新 | `immer`(已装,未普遍使用) | 当前 store 以展开运算符手动更新 |
| 表单 | `react-hook-form` + `@hookform/resolvers` + **Zod** | 新增/编辑对话框统一模式 |
| 提示 | `sonner` (顶部 toast) + Radix Toast | 两套并存 |
| 虚拟化 | `components/virtual-bookmark-grid.tsx` | 自实现,用于大列表 |

### 运维 / 观测
| 类别 | 选型 |
|---|---|
| Web Vitals | `web-vitals` → `POST /api/analytics/web-vitals` |
| PWA | `public/manifest.json` + `components/pwa-install.tsx` |
| SEO | 结构化数据 (`components/seo-structured-data.tsx`),`app/sitemap.ts`,`app/robots.ts` |
| 分析 | Google Analytics (`components/google-analytics.tsx`) |

### 工具链
- `eslint` + `eslint-config-next`
- `critters`(关键 CSS 内联)
- **无测试框架**,`npm run lint` 是唯一的质量门槛

### 命令
```bash
npm run dev      # 开发服务器
npm run build    # 生产构建
npm run start    # 启动生产服务
npm run lint     # ESLint
```

### 路径别名
`@/*` 指向仓库根目录(非 `src/`)。

---

## 2. 模块关系

### 顶层分层

```
┌─────────────────────────────────────────────────────────────────┐
│  app/                                                           │
│  ├─ page.tsx          着陆页 (营销,localStorage 判断老用户跳转)  │
│  ├─ dashboard/page.tsx  主应用壳 (Header + Sidebar + Content)   │
│  ├─ layout.tsx          RootLayout (主题注入、GA、ErrorBoundary) │
│  └─ api/*               Edge Runtime 代理 / 元数据接口           │
└─────────────────────────────────────────────────────────────────┘
             │ 组合
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  components/                                                    │
│  ├─ header.tsx, sidebar.tsx, enhanced-main-content.tsx          │
│  ├─ *-dialog.tsx        (添加/编辑/删除/导入/导出对话框)          │
│  ├─ bookmark-card, enhanced-bookmark-card, virtual-grid...      │
│  └─ ui/                 Radix 封装的原子组件                    │
└─────────────────────────────────────────────────────────────────┘
             │ 读写
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  hooks/                                                         │
│  ├─ use-bookmark-store.ts     (主数据 Zustand store,持久化)     │
│  ├─ use-display-settings.ts   (UI 偏好 Zustand store,持久化)    │
│  ├─ use-layout-mode.ts        (单例 MutationObserver,共享布局态)│
│  ├─ use-smart-recommendations.ts                                │
│  ├─ use-image-preloader.ts                                      │
│  ├─ use-mobile.tsx, use-toast.ts                                │
└─────────────────────────────────────────────────────────────────┘
             │ 依赖
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  lib/                                                           │
│  ├─ background-metadata-enhancer.ts  核心: 书签增强流水线       │
│  ├─ website-descriptions.ts          预置库 dynamic import + 缓存│
│  ├─ metadata-fetcher.ts              favicon(走代理) / 站点名   │
│  ├─ search-utils.ts                  搜索过滤/解析共享逻辑      │
│  ├─ letter-placeholder.ts            字母+纯色占位颜色/字母派生  │
│  ├─ request-deduplicator.ts          前端 fetch-meta 去重       │
│  ├─ confirm-action.tsx               命令式 AlertDialog(替代 confirm)│
│  ├─ image-cache.ts                   客户端图像缓存              │
│  ├─ theme-loader.ts, i18n.ts, logger.ts, utils.ts, url-utils.ts │
└─────────────────────────────────────────────────────────────────┘
             │ (可选) HTTP
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  app/api/*  (Edge)                                              │
│  └─ 抓取外部站点元数据 / 代理图片 / 生成截图占位图              │
└─────────────────────────────────────────────────────────────────┘
             │
             ▼
       data/website-descriptions-1000plus.json   (离线预置数据库)
```

### 关键依赖方向
- **组件 → hooks → lib**:单向依赖,`lib` 不感知 React。
- **Zustand store 是枢纽**:所有对话框、卡片、导入导出都直接从 `useBookmarkStore()` 读写,无 Context Provider。
- **增强服务 `backgroundEnhancer` 是单例**:`lib/background-metadata-enhancer.ts` 导出 `export const backgroundEnhancer = new BackgroundMetadataEnhancer()`,被 store 的 `startBackgroundEnhancement` / `refreshCoverImages` 调用。

---

## 3. 关键入口

### 路由入口

| 路径 | 文件 | 职责 |
|---|---|---|
| `/` | `app/page.tsx` | **着陆页**。检测 `localStorage.hasVisitedDashboard`,老用户显示"快速进入"按钮 |
| `/dashboard` | `app/dashboard/page.tsx` | **主应用**。装配 Header/Sidebar/EnhancedMainContent,管理 `selectedCategory`、`selectedSubCategory`、`searchQuery`、设置面板开关 |
| `/demo`, `/blog`, `/help`, `/privacy`, `/terms` | `app/*/page.tsx` | 静态内容页（`/help` 包含快捷键 / 核心功能说明 / 导入指南） |
| `/debug/cover-images`, `/test-api`, `/test-cover-images` | `app/*/page.tsx` | 调试页;`app/{test-api,test-cover-images,debug}/layout.tsx` 在生产环境调用 `notFound()` 直接 404,仅在 dev 环境可访问 |

### 应用壳装配(`app/dashboard/page.tsx`)
```
HomePage
├─ WebSiteStructuredData / StructuredData (SEO)
├─ Header              ← 搜索、logo、设置;一级 3 个按钮(添加/导入/设置) + ⋯ 更多
│   ├─ EnhancedSearch  ← 受控 filters、Ctrl+K / "/" 快捷键、键盘导航(↑/↓/Enter)
│   ├─ 增强进度指示器   ← enhancementProgress.status==='running' 时显示 Loader2+count, Popover 展开详情
│   ├─ "⋯ 更多" (DropdownMenu)
│   │   ├─ 显示 (Sub) → QuickDisplaySettingsContent
│   │   ├─ 导出 (Sub) → HTML / JSON / CSV / TXT
│   │   ├─ 产品首页 → 跳 / (营销页)
│   │   ├─ 帮助
│   │   └─ 关于
│   └─ Menu (汉堡按钮, 仅 mobile, prop onMobileMenuClick 存在时显示)
├─ 移动端: <Sheet side="left"> 包 Sidebar; 桌面端: 常驻 Sidebar
│   └─ Sidebar         ← 分类树、折叠控件;批量管理用 FolderCog 图标
│       └─ 折叠态: 每个分类首字符按钮(点击直达), 选中高亮
├─ EmptyState | EnhancedMainContent
│   ├─ SearchResults   ← 有搜索词时取代常规视图,filters/onCategorySelect 受控
│   ├─ 详情视图        ← 选中分类时;面包屑导航 + 子分类胶囊
│   └─ 首页视图        ← 未选中时;每个子分类一行书签(数量=clamp(4..6, gridColumns[bp]))
├─ OnboardingModal
├─ AddCategoryDialog / AddBookmarkWithCategoryDialog
├─ PWAInstall          ← dev 环境主动卸载旧 SW + 清 cache,生产才注册
└─ SettingsPanel       ← 复用 QuickDisplaySettingsContent + 独有的网格列数
```

### 导航状态 ↔ URL
`selectedCategory` / `selectedSubCategory` / `searchQuery` 与 URL `?category=&sub=&q=` **双向绑定**:
- 首次水合后从 `window.location.search` 回灌 state(`urlBootstrapped` ref 防回环)
- state 变化 → `window.history.replaceState`(不堆历史栈、不触发 Next 路由刷新)
- 浏览器前进/后退 → 监听 `popstate` 重灌 state
- **不使用 `useSearchParams` / `router.replace`**,避免 Suspense 边界要求与多余 RSC 刷新

### 数据入口(Store)
`hooks/use-bookmark-store.ts` 是**唯一的主数据源**。关键动作:
- `initializeStore()` — 检查 `localStorage['data-cleared']`,未清空且无数据时注入 `defaultCategories`/`defaultBookmarks`。
- `addBookmark / addCategory / addSubCategory` — 带 URL 归一化与子分类内去重。
- `importBookmarks(data, { enableBackgroundEnhancement })` — 分类/子分类按同名合并,书签按同 URL 去重;导入完成后异步触发增强。
- `startBackgroundEnhancement(ids?, { isImport? })` — 调用 `backgroundEnhancer.enhanceBookmarks()`,通过 `onUpdate` 回写。
- `refreshCoverImages(ids?)` — 仅刷新封面图(独立于完整增强)。
- `ensureUncategorizedExists()` — 懒创建系统分类 `system/uncategorized`,用于无归属的新书签。
- **删除支持撤销**:`deleteBookmark / deleteSubCategory / deleteCategory / deleteBookmarksBatch / deleteCategoriesBatch` 删除前捕获模块级快照,通过 sonner toast 暴露 5 秒"撤销"按钮。仅保留最近一次快照,新删除使旧 toast 失效。

### 增强流水线入口(`lib/background-metadata-enhancer.ts`)
`BackgroundMetadataEnhancer` 单例。外部只调:
- `enhanceBookmarks(bookmarks, { onProgress, onUpdate, preserveOriginal })` — 批量,内部拆分 preset / unknown 两阶段。**入口处会 `await loadWebsiteDescriptions()`**,确保后续 sync 查找命中缓存。
- `enhanceSingleBookmark(bookmark, { seed })` — 单条,可带前端已抓到的种子元数据。同样会先 await 加载预置库。
- `refreshBookmarkCoverImage(bookmark)` — 仅封面。
- `stop()` — 通过内部 `AbortController` 中止。
- `getPresetStats()` — 异步,返回预置库统计(已 Promise 化)。

### 预置库的 dynamic import(`lib/website-descriptions.ts`)
250KB 的 `data/website-descriptions-1000plus.json` **禁止静态 import**(会拖累首屏 bundle 与 dev HMR)。统一通过:
- `loadWebsiteDescriptions(): Promise<WebsitePresetMap>` — dynamic import,模块级缓存 + inflight 合并
- `lookupPresetSync(domain)` — 加载后的 O(1) 查找(未加载返 `undefined`,调用方须先 await)
- `getWebsitePresetsSync()` — 直接取整张表(用于统计场景),配合 fallback `?? await loadWebsiteDescriptions()`

---

## 4. 数据流

### 数据模型
```ts
Category {
  id, name,
  subCategories: SubCategory[]
}
SubCategory { id, name, parentId }
Bookmark {
  id, title, url, description?, favicon?, coverImage?, tags?,
  subCategoryId, createdAt
}
```

### 持久化
- **主数据**:Zustand `persist({ name: "bookmark-store", version: 2 })` → `localStorage`。
- **显示偏好**:独立 Zustand store → `localStorage["display-settings"]`。
- **标志位**(均在 `localStorage`):
  - `hasVisitedDashboard` — 老用户识别,用于着陆页跳转按钮。
  - `data-cleared` — 用户主动清空数据后,阻止 `initializeStore()` 重新注入演示数据。
  - `hasUserData` / `hideDemoNotice` — 用户已有真实数据,隐藏演示提示。
  - `showOnboarding` — 一次性 Onboarding 触发旗帜(清空数据后设置)。
  - `theme-config` — 主题 primary 颜色、圆角、字号等,`layout.tsx` 内联脚本在首屏前读取应用。

### 水合(hydration)策略
`app/dashboard/page.tsx:143` — `hasHydrated` 为 false 时仅渲染占位 div,避免 persist 未恢复就闪出空态。挂载后 `setTimeout(() => setHasHydrated(true), 0)` 放行。

### 书签生命周期
```
┌──────────────────┐
│ 1. 用户输入 URL  │
└──────────┬───────┘
           ▼
┌─────────────────────────────────────────────┐
│ 2. addBookmark / importBookmarks             │
│    - URL 归一化(去 hash/utm/gclid/末尾斜杠) │
│    - 同子分类内 URL 去重                     │
│    - 立即写入 store (id = bm_<ts>_<rand>)   │
│    - favicon = Google s2 favicon            │
│    - coverImage = /api/screenshot?url=...   │ ← SVG 占位
└────────────────────────┬────────────────────┘
                         │ 异步(setTimeout 100~500ms)
                         ▼
┌──────────────────────────────────────────────────────┐
│ 3. startBackgroundEnhancement                        │
│    ├─ categorizeBookmarks()                          │
│    │    ├─ preset (命中 website-descriptions-1000+)   │
│    │    └─ unknown                                    │
│    ├─ processFastBatch(preset, batch=40)             │
│    │    └─ 同步读取预置,经 onUpdate 回写              │
│    └─ processSlowBatch(unknown + presetMissingCover) │
│         ├─ request-deduplicator.fetchMetadataDeduped │
│         │    └─ GET /api/fetch-meta?url=...           │
│         ├─ 解析 og:image / twitter:image / icon      │
│         └─ 回落 /api/screenshot 占位                  │
└──────────────────────────┬───────────────────────────┘
                           │ onUpdate(id, metadata)
                           ▼
┌─────────────────────────────────────────────┐
│ 4. store.set() → 更新单条 bookmark 字段     │
│    (保留 isEnhancing 标志,避免触发同步)    │
└─────────────────────────────────────────────┘
```

### 导入流特殊点
- `importBookmarks` 先 **克隆** `categories` / `bookmarks`(`use-bookmark-store.ts:489`),避免原地 mutate 让订阅者拿到旧引用(已修过 bug)。
- 分类/子分类按**同名大小写无关**合并,维护 `categoryMapping` / `subCategoryMapping` 两张 `Map<旧ID, 新ID>`,书签据此重绑定 `subCategoryId`。
- 若 `options.isImport = true`,增强阶段 `preserveOriginal` 为真:**保留用户原始的 title / description**,增强仅补充 favicon / coverImage 等缺失字段。

### 封面图开关特殊副作用(`app/dashboard/page.tsx:44-83`)
`displaySettings.showCover` 从 false → true 时,延迟 300ms 触发 `refreshCoverImages()`,仅处理 `coverImage` 缺失或仍是 `/api/screenshot` 占位的书签。使用 `ref` 跟踪前值,避免依赖 bookmarks 造成循环。

### UI 读取路径
```
Component
  └─ useBookmarkStore(selector)          // 选择性订阅
  └─ useDisplaySettings(selector)        // 卡片布局 / 可见性
  └─ useResponsiveLayout()               // 基于 window 宽度推 breakpoint
         ↓
      EnhancedMainContent
         ├─ 搜索模式 → SearchResults
         ├─ 分类选择 → DynamicBookmarkGrid
         └─ 批量选择模式 → SelectableBookmarkCard + BatchSelectionToolbar
```

---

## 5. API 结构

所有路由位于 `app/api/`,**一律跑在 Edge Runtime**(`export const runtime = 'edge'`),首要作用是**规避 CORS** 并提供统一的元数据/图像代理。

| 路由 | 方法 | 入参 | 产出 | 说明 |
|---|---|---|---|---|
| `/api/fetch-meta` | GET | `?url=` | `{ title, description, coverImage, url }` | 抓取 HTML,解析 `<title>` / og:* / twitter:* / JSON-LD / 站点特定正文选择器(CSDN/掘金/知乎/Medium/HubSpot 等),并 HEAD 验证封面图可达性。内存短缓存 20s。内网/本地/HTTP 协议直接返回智能兜底。知乎专栏使用特殊 UA。 |
| `/api/fetch-title` | GET | `?url=` | `{ title }` | 仅标题,轻量版。 |
| `/api/proxy-image` | GET | `?url=` | 图片字节流 / 302 | 代理外链图片。6 级 fallback,全部失败时 **302 跳转到 `/api/screenshot`** 避免 broken image。stream 转发用 `pipeTo` + `AbortSignal.any` 保证客户端断流时快速中断上游,避免 `ERR_INVALID_STATE`。详见 架构文档 §6.4/§6.5。 |
| `/api/screenshot` | GET | `?url=` | 动态生成的 SVG 占位图 | 字母 + 纯色背景(域名 hash 派生)。颜色/字母派生逻辑来自 `lib/letter-placeholder.ts`,与客户端 placeholder 完全一致。不发起任何外部请求,`max-age=86400 immutable`。 |
| `/api/website-preview` | GET | `?url=` | 综合预览数据 | 组合 meta + 图像的一次性接口。 |
| `/api/analytics/web-vitals` | POST | `{ name, value, id, ... }` | `{ ok: true }` | 接收 `web-vitals` 库的 LCP/CLS/INP 等指标。 |

### 客户端请求层
`lib/request-deduplicator.ts` 暴露 `fetchMetadataDeduped(url)`:
- 同一 URL 并发请求**合并为单次**,挂起的 Promise 共享。
- 供 `backgroundEnhancer` 和若干对话框(如 AddBookmark)使用,避免批量增强时对 `/api/fetch-meta` 压力过大。

### 特殊路由文件
- `app/favicon.ico/route.ts`, `app/icon.tsx`, `app/apple-icon.tsx`, `app/opengraph-image.tsx`, `app/twitter-image.tsx` — Next.js 约定式资源生成。
- `app/sitemap.ts`, `app/robots.ts` — SEO 产物,构建时生成。

### 不使用外部 API 的原则
`lib/background-metadata-enhancer.ts` 里保留了 `fetchDetailedMetadata()`(调用 `api.microlink.io`)但**默认禁用**,所有抓取都走自家 `/api/fetch-meta`,避免外部限频(429)和隐私外泄。代码注释:
> 不再退回外部API,保持本地生成,避免 400/429 噪音与外部依赖

---

## 附:需要注意的约定

1. **所有数据都在客户端**:没有数据库、没有用户系统。清空浏览器 = 丢失数据(除非先 Export)。
2. **`"use client"` 是默认**:仅 `app/layout.tsx` 等极少数是 Server Component。
3. **Edge Runtime 限制**:API 路由不能用 Node 原生模块(fs/path/crypto 等需 polyfill),不能超过 size 限制。
4. **URL 归一化在入库前做**(`use-bookmark-store.ts:397-413`),所以 store 里的 `bookmark.url` 已经是规范化后的字符串。
5. **演示数据是"软"的**:用户第一次添加书签会清除 `data-cleared` 标志,导入/重置走独立路径。切勿在组件里直接读 `defaultBookmarks`。
6. **国内网络友好**:代码中禁止出现裸 `google.com/s2/favicons` / `icons.duckduckgo.com` 作为 `<img src>`。所有 favicon 必须走 `/api/proxy-image`(由它决定 fallback 顺序)或 `getFaviconUrl()`(已封装代理 URL)。
7. **字母占位单一数据源**:`lib/letter-placeholder.ts` 的调色板与 hash 函数必须和 `app/api/screenshot/route.ts` **字节级一致**,否则服务端 SVG 兜底和客户端 placeholder 颜色会不统一。
8. **SW 只在生产生效**:`components/pwa-install.tsx` 在 dev 环境主动 `unregister()` 所有 SW + `caches.delete()`,避免缓存旧 chunk 导致首次进入白屏/ChunkLoadError。
9. **Header 一级按钮 = 3 个**:添加书签 / 导入 / 设置;其余(显示、导出、产品首页、帮助、关于)走"⋯ 更多"溢出菜单。新增按钮前先把已有的下沉,别再往一级塞。
10. **导航状态 ↔ URL 走 `history.replaceState`**:不要换成 `useSearchParams` + `router.replace`;原因见 §3"导航状态 ↔ URL"。
11. **移动端 Sidebar 用 Sheet,不用 `w-64` 常驻块**:dashboard 按 `breakpoint === 'mobile'` 走两个分支;移动端选完分类要 `setMobileSidebarOpen(false)`。Header 的 `onMobileMenuClick` prop 只有有值才渲染汉堡按钮。
12. **`QuickDisplaySettingsContent` 是可复用的 panel body**;独立组件 `QuickDisplaySettings` 已不再使用,`components/display-settings-panel.tsx` 是另一份遗留 Sheet 组件(未引用),命名易混淆 —— 新接入显示设置入口时用 `QuickDisplaySettingsContent`。**设置面板也复用了它**,只有"网格列数"是设置面板独有。
13. **演示横幅依赖 `bookmarks` 重读 flag**:`enhanced-main-content.tsx` 的 `useEffect(..., [bookmarks])` 在每次书签变化时重读 `localStorage.hasUserData / hideDemoNotice`。如果新增了应隐藏横幅的动作,记得在 store action 里写这两个 flag,而不是组件里。
14. **删除全部可撤销**:`deleteBookmark / deleteSubCategory / deleteCategory` 及对应批量版本在删除前捕获快照,弹 sonner toast 提供 5 秒撤销按钮。新增删除路径必须走这些 store action,不要直接 `set({ bookmarks: ... })`。
15. **面包屑导航在详情视图顶部**:`EnhancedMainContent` 当 `selectedCategory` 非空时渲染面包屑(`首页 / 分类 / 子分类`),通过 `onCategorySelect(categoryId|null, subCategoryId?)` 回溯。
16. **Sidebar 折叠态保留分类导航**:`collapsed === true` 时,sidebar 渲染垂直条状按钮(每个分类首字符),点击直达。`system` 系统分类排除。
17. **全局快捷键在 `app/dashboard/page.tsx`**:`/` 聚焦搜索(查找 `input[data-search-input]`)、`N` 打开添加书签对话框。两者都跳过输入控件。选择模式下的 `Esc`/`Ctrl+A` 在 `EnhancedMainContent` 自管。
18. **增强进度指示器在 Header**:`enhancementProgress.status === 'running'` 时 Header 显示 Loader2+count,Popover 展开详情。旧的底部 `<EnhancementProgress />` 已不再渲染,组件文件保留但函数体始终返回 null。
19. **增强 `total` 是工作量,不是去重书签数**:`processSlowBatch` 会重处理"预置缺封面"那部分,所以 `total = presetBookmarks.length + slowList.length` > `bookmarks.length`。不要改回 `bookmarks.length` —— 否则 UI 会出 `completed > total` 溢出。UI 侧另用 `Math.min(completed, total)` 和 `overflow-hidden` 做兜底。
20. **书签预览功能已移除**:`BookmarkPreview` 组件、卡片的 `onPreview` prop、Shift+Click 快捷键全部删除。原因:iframe 成功率太低(大部分站点用 `X-Frame-Options` 阻止),封面图已经承担了"看一眼"的信息密度,功能 ROI 不足。若重新引入,需要新预览策略(真实截图服务或沙盒代理)而非 iframe。
21. **预置库走 dynamic import,见 §3 末尾**:严禁 `import websiteDescriptions from '@/data/...json'` 直接引入。两个 add-bookmark dialog 的 `getPresetData` 也是 async 的。
22. **布局模式共享一个 MutationObserver**:`hooks/use-layout-mode.ts` 暴露 `useLayoutMode()`,内部用 `useSyncExternalStore` + 模块级单例 observer 监听 `<html>` 的 class。**禁止**在卡片组件里各自挂 observer,否则 N 张卡片 = N 个 observer。
23. **禁用原生 `confirm()` / `alert()`**:统一用 `confirmAction({...})`(`lib/confirm-action.tsx`),返回 `Promise<boolean>`,样式跟随主题,iOS Safari 兼容。
24. **debug / test 路由生产环境 404**:`app/{test-api,test-cover-images,debug}/layout.tsx` 在 `process.env.NODE_ENV === "production"` 时调用 `notFound()`。新增调试页时,同目录加一份相同的 layout。
25. **三个僵尸组件已删除**:`enhancement-progress.tsx`(始终 return null)、`quick-display-settings.tsx`(Dropdown 包装,无引用)、`display-settings-panel.tsx`(legacy Sheet,无引用)。如需类似面板请用 `quick-display-settings-content.tsx`。
26. **侧边栏折叠态布局规格**:`w-14`(56px) 容器 + `w-10 h-10`(40px) 按钮,满足触控目标 ≥40px。`aria-current="page"` 标记当前激活分类。展开态子分类选中态为 `bg-accent` + 左侧 2px primary 色条,**不要**用 `bg-primary text-primary-foreground`(会和卡片按钮风格冲突)。
27. **面包屑溢出保护**:nav 容器 `min-w-0`,中间链接 `truncate max-w-[40%]`,叶子 `truncate min-w-0` + `title` tooltip。长名称不会撑宽容器或换行。
28. **帮助页结构**:`app/help/page.tsx` 顶部嵌入 `<FeatureGuide />`(快捷键 / 核心功能 / 数据与隐私),其后才是导入说明 `<ImportHelpTabs />`。`HelpTOC` 的目录已拆为三组(功能与技巧 / 导入说明 / 更多)。新增使用说明请扩 `components/help/feature-guide.tsx`,新增导入相关扩 `import-tabs.tsx`。

