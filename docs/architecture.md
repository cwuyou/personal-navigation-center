# 架构设计文档

> Personal Navigation Center — Next.js 14 App Router 书签管理 PWA
> 文档日期:2026-05-12

本文档聚焦**为什么这样设计**与**组件间协作的细节**。若需要快速查表(目录、路由清单、命令等),请看 [PROJECT_INDEX.md](../PROJECT_INDEX.md)。

---

## 目录

1. [架构总览](#1-架构总览)
2. [分层与职责边界](#2-分层与职责边界)
3. [状态管理:为什么是两个 Zustand Store](#3-状态管理为什么是两个-zustand-store)
4. [书签数据流(完整时序)](#4-书签数据流完整时序)
5. [元数据增强子系统](#5-元数据增强子系统)
6. [API 层设计](#6-api-层设计)
7. [持久化与水合](#7-持久化与水合)
8. [UI 渲染管线](#8-ui-渲染管线)
8A. [搜索子系统](#8a-搜索子系统)
9. [性能与安全策略](#9-性能与安全策略)
10. [已知权衡与技术债](#10-已知权衡与技术债)

---

## 1. 架构总览

本项目是一个**以客户端为中心**(client-centric)的 SPA。Next.js 在这里扮演两个角色:
- **静态托管**:产出高度 SEO 优化的 HTML 和营销页。
- **轻量 BFF**(Backend-for-Frontend):通过 Edge Runtime 提供跨域代理与 HTML 解析服务,不落任何持久化数据。

```
┌──────────────────────────────────────────────────────────────────┐
│                         浏览器 (客户端)                          │
│                                                                  │
│  ┌────────────────┐   ┌──────────────────┐   ┌────────────────┐ │
│  │ React 组件树    │←→│ Zustand Stores    │↔ │ localStorage   │ │
│  │ (UI + 交互)     │   │ (单一数据源)      │   │ (持久化)        │ │
│  └────────────────┘   └──────────────────┘   └────────────────┘ │
│         ↑                    ↑                                   │
│         │                    │                                   │
│         │                    ▼                                   │
│         │          ┌──────────────────────┐                      │
│         │          │ backgroundEnhancer    │                     │
│         │          │ (元数据增强单例)      │                     │
│         │          └──────────────────────┘                      │
│         │                    ↓                                   │
│         │         ┌─────────────────────────┐                    │
│         │         │ request-deduplicator    │                    │
│         │         └─────────────────────────┘                    │
│         │                    ↓ fetch                             │
└─────────┼────────────────────┼───────────────────────────────────┘
          │                    │
┌─────────┴────────────────────┼───────────────────────────────────┐
│                    Next.js Edge Runtime                          │
│                                                                  │
│  /api/fetch-meta   /api/fetch-title   /api/proxy-image           │
│  /api/screenshot   /api/website-preview                          │
│  /api/analytics/web-vitals                                       │
│                                                                  │
│                (无状态;仅作 CORS 旁路 + HTML 解析)               │
└──────────────────────────────┬───────────────────────────────────┘
                               │ fetch
                               ▼
                     任意外部网站 / 图像 CDN
```

**关键属性**
- **零后端状态**:没有数据库,没有用户账号,不需要登录。
- **离线优先**:预置 1000+ 站点的描述库(`data/website-descriptions-1000plus.json`),即使外网不通也能给出合理的增强结果。
- **Edge-first API**:全部 API 路由 `export const runtime = 'edge'`,依赖必须兼容 V8 Isolate(不能用 Node `fs`、`crypto` 等)。

---

## 2. 分层与职责边界

```
┌─────────────────────────────────────────────────────────────────┐
│  Presentation (app/ + components/)                              │
│  - 路由、页面壳、业务组件                                        │
│  - 只做编排;业务逻辑下沉                                         │
└──────────────┬──────────────────────────────────────────────────┘
               │ 依赖
┌──────────────▼──────────────────────────────────────────────────┐
│  State (hooks/use-*-store.ts, hooks/use-*.ts)                   │
│  - Zustand 两个独立 store:主数据、显示偏好                       │
│  - 自定义 hooks 封装派生状态(推荐、响应式断点、图片预加载)       │
└──────────────┬──────────────────────────────────────────────────┘
               │ 依赖
┌──────────────▼──────────────────────────────────────────────────┐
│  Domain / Services (lib/)                                       │
│  - background-metadata-enhancer:增强流水线,不感知 React        │
│  - metadata-fetcher:URL 解析、favicon 生成                     │
│  - request-deduplicator:并发合并                                │
│  - image-cache, theme-loader, logger, utils                     │
└──────────────┬──────────────────────────────────────────────────┘
               │ HTTP (可选)
┌──────────────▼──────────────────────────────────────────────────┐
│  BFF (app/api/*)                                                │
│  - 无状态 Edge Functions                                        │
│  - 统一缓存头、CORS 处理、超时控制                              │
└─────────────────────────────────────────────────────────────────┘
```

### 约束
- `lib/*` 不能 import 任何 React 或 Zustand —— 保证可测试、可在 Web Worker / Node 脚本中复用。
- `components/*` 不直接 `fetch`,所有请求走 `lib/request-deduplicator` 或 `store` action。
- `app/api/*` **不读写 Zustand**(Edge Runtime 里也没有)。

---

## 3. 状态管理:为什么是两个 Zustand Store

两个 store 的**边界**不是按功能划分,而是按**变更频率 + 一致性要求**:

| Store | 文件 | 持久化键 | 典型更新频率 | 一致性要求 |
|---|---|---|---|---|
| `useBookmarkStore` | `hooks/use-bookmark-store.ts` | `bookmark-store` | 低(用户手动操作) | 强:每次写入都要同步到 localStorage |
| `useDisplaySettings` | `hooks/use-display-settings.ts` | `display-settings` | 高(切换开关、拖动滑块) | 弱:UI 偏好可稍后保存 |

### 为什么不用单个 store?
- **订阅粒度**:书签变更不应触发显示偏好的订阅者重渲染,反之亦然。Zustand 虽然支持 selector,但拆开 store 是更清晰的切面。
- **持久化版本**:主数据 `version: 2`(历史上做过 schema 迁移);显示偏好频繁增删字段,不希望与主数据耦合 version。
- **灾难半径**:清空数据时,只动主 store,用户的主题、布局保留。

### 为什么不用 Context + useReducer?
- Zustand 的选择性订阅避免了 Context 常见的"一变全渲染"问题。
- 全局单例(`backgroundEnhancer` 等)可直接 `useBookmarkStore.getState()` 读写,无需 ref 传递。

### 单例 Service 注意事项
`lib/background-metadata-enhancer.ts:846` 导出的 `backgroundEnhancer` 是**进程级单例**。任何并发调用 `enhanceBookmarks()` 会被 `this.isRunning` 门闩拒绝(抛 `Enhancement already in progress`)。store 的 `startBackgroundEnhancement` 是此单例的唯一合法入口。

---

## 4. 书签数据流(完整时序)

### 4.1 单条添加(用户手动输入 URL)

```
用户                对话框组件              Store(action)           Enhancer            /api/fetch-meta
 │                    │                        │                       │                      │
 │ 1.填写URL + 提交    │                        │                       │                      │
 ├───────────────────▶│                        │                       │                      │
 │                    │ 2.addBookmark({...})    │                       │                      │
 │                    ├────────────────────────▶│                       │                      │
 │                    │                        │ 3.normalizeUrl         │                      │
 │                    │                        │   去重检查(同子分类内) │                      │
 │                    │                        │ 4.立即 set() 加入列表  │                      │
 │                    │                        │   coverImage = SVG占位  │                      │
 │                    │                        │   favicon = Google s2  │                      │
 │                    │◀───────────────────────┤ (UI 立刻显示)         │                      │
 │                    │                        │                       │                      │
 │                    │                        │ 5.setTimeout 100ms     │                      │
 │                    │                        ├──────────────────────▶│                      │
 │                    │                        │   startBackground-    │                      │
 │                    │                        │   Enhancement([id])   │                      │
 │                    │                        │                       │ 6.命中 preset?        │
 │                    │                        │                       ├─ 是 → 直接回写        │
 │                    │                        │                       │                      │
 │                    │                        │                       │ 7.未命中 → 走 slow    │
 │                    │                        │                       ├─────────────────────▶│
 │                    │                        │                       │   fetch-meta-deduped  │
 │                    │                        │                       │                      │ 8.抓 HTML
 │                    │                        │                       │                      │   解析 og/title
 │                    │                        │                       │                      │   HEAD 验证图片
 │                    │                        │                       │◀─────────────────────┤
 │                    │                        │                       │ 9.onUpdate(id, meta)  │
 │                    │                        │◀──────────────────────┤                      │
 │                    │                        │ 10.set() 合并字段      │                      │
 │                    │                        │   (title/description/  │                      │
 │                    │                        │    coverImage/favicon)│                      │
```

**关键点**
- **先落盘再增强**(步骤 4 先于 7):用户立即看到卡片,不需要等待网络。
- **URL 归一化发生在入库前**(`use-bookmark-store.ts:397-413`):去掉 hash、`utm_*`、`gclid` 等追踪参数,统一大小写/末尾斜杠。Store 里保存的永远是规范化后的 URL。
- **增强状态 `isEnhancing` 的作用**:防止与未来可能加入的云同步代码产生竞态。即便现在没有云同步,也保留了这个门闩。

### 4.2 批量导入

```
用户选择书签HTML → parse → 结构化数据 { categories, bookmarks }
                                  ↓
                          importBookmarks(data)
                                  ↓
     克隆 existingCategories / existingBookmarks(避免原地 mutate)
                                  ↓
     同名合并(大小写无关):categoryMapping + subCategoryMapping
                                  ↓
     书签按 subCategoryId 重绑定,同子分类下 URL 去重
                                  ↓
     set({ categories, bookmarks }) —— 一次性原子更新
                                  ↓
     setTimeout(500ms) → startBackgroundEnhancement(ids, { isImport: true })
                                  ↓
     enhanceBookmarks(..., { preserveOriginal: true })
                                  ↓
     preset 批次 + slow 批次并行;onUpdate 回写
                                  ↓
     仅补充缺失字段,不覆盖用户原始 title/description
```

**为什么克隆?**(`use-bookmark-store.ts:489`)
曾出现的 bug:导入期间如果对 `existingCategories` 原地 `push()`,订阅此 slice 的 `useMemo`(如"添加书签"对话框里的子分类列表)会拿到**老引用**,React 不重渲染。克隆一份保证引用新鲜。

**`preserveOriginal` 的语义**
- 导入的书签往往已有用户手写的 title/description,不应被远端 og:* 覆盖。
- 增强只负责**补洞**:缺 favicon 就补 favicon,缺封面就补封面。
- 此行为由 `enhanceBookmark()` 内部多处判断支撑(`lib/background-metadata-enhancer.ts:338-348, 371-388, 418-438`)。

### 4.3 手动刷新封面图

独立路径,不走完整增强:
```
用户(设置面板切换 showCover: false → true)
    ↓
dashboard/page.tsx useEffect 检测到 false→true 翻转
    ↓
setTimeout(300ms) → refreshCoverImages(bookmarksNeedingCovers)
    ↓
逐条调用 backgroundEnhancer.refreshBookmarkCoverImage(b)
    ↓
只更新 coverImage 字段,保留 title/description/favicon 不动
```

使用 `ref` 跟踪前值(`prevShowCover.current`)避免把 `showCover` 放进依赖数组造成无限循环(历史 bug,见 `docs/infinite-loop-*.md`)。

---

## 5. 元数据增强子系统

### 5.1 为什么分两批处理

```
传入书签列表
     ↓
categorizeBookmarks()
   ├─→ presetBookmarks:命中离线数据库,零网络开销
   └─→ unknownBookmarks:需要抓 HTML
```

- **preset 批**:`processFastBatch`,同步处理,`batchSize=40`,无延迟。
- **unknown 批** + **缺封面的 preset**:`processSlowBatch`,并发处理,`batchSize=8`,批次间 `delay=100ms`。

合并逻辑在 `lib/background-metadata-enhancer.ts:710-726`:
```ts
const slowList = [...unknownBookmarks, ...presetNeedingCover]
    .filter((b, idx, arr) => arr.findIndex(x => x.id === b.id) === idx)
```
去重后进入慢速管线。

### 5.2 封面图回退链

对于每个书签,`coverImage` 按优先级依次尝试:

```
1. 用户显式传入的 coverImage(导入时保留)
         ↓ 否则
2. 预置数据库中的 coverImage(排除明显 favicon:.ico / 含 favicon / apple-touch-icon / icon-NxN)
         ↓ 否则
3. 特定站点硬编码(YouTube 封面图、GitHub social card 等,见 coverImageStrategies)
         ↓ 否则
4. 从目标 HTML 解析 og:image / twitter:image / <link rel=icon>(最大尺寸)
         ↓ 经代理
5. /api/proxy-image 代理链(见 §6.4)
         ↓ 全部失败
6. /api/screenshot?url=... —— 字母 + 纯色 SVG 占位(不调外部服务,纯本地渲染)
```

### 5.3 图像占位系统(字母 + 纯色)

`/api/screenshot` 的兜底 SVG 与客户端 `<BookmarkFavicon>` / `<BookmarkCover>` 在图未加载时显示的 placeholder **完全一致**:

- **颜色/字母派生**来自 `lib/letter-placeholder.ts`(12 色 Material 调色板 + `(h*31+c)|0` hash)
- **服务端** `app/api/screenshot/route.ts` 和**客户端**两个 placeholder 组件都 `import { getLetterPlaceholder }` 使用同一函数
- 同一书签在任意状态(加载中 / 加载失败走 SVG / proxy-image 302 跳 SVG)下,显示的颜色和字母**字节级相同**,消除视觉 jank
- 字母白色 0.95 不透明度,220-260px 字号,系统字体栈(`-apple-system,Segoe UI,Roboto...`),跨平台一致
- **演示数据硬规则**:`defaultBookmarks` 不再写死 `coverImage`(之前硬编码了 `google.com/s2/...`,国内不可达),统一由 `initializeStore/resetStore` 调 `withFavicons()` 注入 favicon 后,剩余由 `backgroundEnhancer` 或回退链 6 兜底

### 5.4 外部 API 的弃用

代码里仍保留 `fetchDetailedMetadata()`(调用 `api.microlink.io`)但**默认禁用**。注释原文:
> 不再退回外部API,保持本地生成,避免 400/429 噪音与外部依赖

这是有意识的权衡:**本地抓取 + 本地占位 > 外部 SaaS 依赖**。代价是某些 SPA 站点(依赖 JS 渲染)无法提取到完整元数据,但对本项目的目标用户(保存 dev tools / docs 站点)影响可控。

### 5.5 中止机制

- `enhanceBookmarks()` 内创建 `AbortController`,存放到 `this.abortController`。
- 外部调用 `stop()` → `abort()` → 下一个批次循环检测 `signal.aborted` → break。
- `fetch-meta` 调用也传入该 signal,实现快速中断。

---

## 6. API 层设计

### 6.1 所有路由跑在 Edge Runtime

| 路由 | 方法 | 缓存 | 超时 | 特殊处理 |
|---|---|---|---|---|
| `/api/fetch-meta` | GET | 内存 20s | 7s | 内网/本地/HTTP 协议直接返回兜底;知乎专栏特殊 UA |
| `/api/fetch-title` | GET | 无 | 较短 | 轻量版 |
| `/api/proxy-image` | GET | `max-age=86400 immutable` | 见 §6.4 | 私网 IP 黑名单;聚合服务还原;stream 可中断;全失败 302 到 screenshot |
| `/api/screenshot` | GET | `max-age=86400 immutable` | — | 字母+纯色 SVG,颜色/字母由 `lib/letter-placeholder.ts` 派生,服务端客户端共用 |
| `/api/website-preview` | GET | — | — | meta + 图像合并端点 |
| `/api/analytics/web-vitals` | POST | — | — | 接收 LCP/CLS/INP 等 |

### 6.2 关键安全约束

**`proxy-image` 的私网黑名单**(`app/api/proxy-image/route.ts` `isPrivateHostname`):
- 禁止 `localhost` / `127.*` / `10.*` / `192.168.*` / `172.16-31.*` / `169.254.*`
- 防止攻击者用此接口探测内网

**`fetch-meta` 的智能降级**(`app/api/fetch-meta/route.ts`):
- 内网主机名 / 无点主机 / HTTP 协议 → 直接返回本地生成的兜底,不发真正请求
- 避免 Edge Runtime 对内网不可达时的 500 噪音

**CSP**(`next.config.mjs`):
- `img-src` 允许所有 HTTPS/HTTP 来源(书签图片需要)
- `connect-src` 白名单仅 GA + microlink(历史遗留,现未使用)
- `frame-src 'none'` 阻止点击劫持

### 6.3 为什么不用 Server Actions

Next.js 14 提供了 Server Actions,但本项目**全部用 API Routes**。理由:
- 数据在客户端 localStorage,没有服务端操作需要"写入"。
- Edge API + 前端 fetch 的模式更透明,便于缓存头控制。
- Server Actions 强耦合组件树,不利于 `lib/` 中的服务层复用。

### 6.4 proxy-image 的 fallback 链(国内网络优化)

设计原则:**最坏路径总时间可控,尽早命中本地可达资源**。从国内访问 Google/DuckDuckGo 聚合 favicon 服务常全链超时(实测 10s 无响应),因此 fallback 重排为:

```
0. 聚合服务还原(如果传入的 URL 就是 google s2/duckduckgo ip3,
   先从 query 还原真实站点 origin,优先取其 /favicon.ico)          ≤ 3.5s
1. 原始 URL + Referer override(主请求)                            ≤ 4s
2. 真实站点 /favicon.ico                                           ≤ 3.5s
3. 真实站点 /apple-touch-icon.png                                  ≤ 3.5s
4. 原始 URL 的多 UA 重试(3 个 UA 串行)                             ≤ 3s × 3
5. DuckDuckGo ip3                                                  ≤ 3s
6. Google S2 favicons                                              ≤ 3s
7. **302 跳转到 /api/screenshot**                                  瞬时
```

每级 fallback 开始前检查 `clientSignal.aborted`,客户端离开即短路返回 499。

**stream 转发安全**(`relayBody` + `mergeSignals`):
- 上游 `fetch` body 不再 `new NextResponse(resp.body, ...)` 直通,而是用 `TransformStream.pipeTo(writable, { signal })` + `.catch(() => {})`
- `signal` 为 `AbortSignal.any([clientSignal, AbortSignal.timeout(...)])`,客户端断开会级联 abort 上游,不浪费带宽
- 彻底消除 dev 环境下频繁出现的 `ERR_INVALID_STATE: Controller is already closed`(原因:客户端断开后下游 controller close,但 undici 仍在 enqueue 上游 chunk)

**禁止在客户端硬编码外部聚合 URL**:
- 所有 favicon 入口统一经 `/api/proxy-image`
- `lib/metadata-fetcher.ts` 的 `getFaviconUrl(url)` 返回 `/api/proxy-image?url=https://<host>/favicon.ico`,由服务端决定 fallback
- 卡片 `onError` 兜底也跳同源代理,不再裸写 `google.com/s2/...`

### 6.5 screenshot 不发外部请求

`/api/screenshot` 永远成功返回 SVG。作为 `proxy-image` 全失败的 302 目标,确保浏览器 `<img>` 永远不会 broken image。详见 §5.3。

---

## 7. 持久化与水合

### 7.1 持久化键总览

| 键名 | 写入方 | 用途 |
|---|---|---|
| `bookmark-store` | Zustand persist | 书签主数据(JSON) |
| `display-settings` | Zustand persist | 显示偏好 |
| `theme-config` | 主题组件 | primary 颜色、圆角、字号 —— 由 `layout.tsx` 内联脚本在首屏**阻塞式**读取 |
| `hasVisitedDashboard` | dashboard 页 | 着陆页"快速进入"按钮 |
| `data-cleared` | `clearAllData()` | 标记"用户主动清空",阻止 `initializeStore()` 再次注入演示数据 |
| `hasUserData` / `hideDemoNotice` | `addBookmark` / `importBookmarks` | 标记"已有真实数据",隐藏演示提示 |
| `showOnboarding` | `clearAllData()` | 下次进入时一次性触发 Onboarding |

### 7.2 水合策略

```
RootLayout (server)
   ↓ HTML 到达浏览器
<head> 内联脚本读取 theme-config → 立即设置 CSS 变量
   ↓
HomePage (client) 挂载
   ↓
initializeStore()
   ├─ 如果 data-cleared = true → 不做任何事
   ├─ 如果数据无效或为空 → 注入 defaultCategories / defaultBookmarks
   └─ 否则 → 使用 persist 恢复的数据
   ↓
setTimeout(0) → setHasHydrated(true)
   ↓
if (!hasHydrated) 返回占位 <div/>,避免空态闪烁
   ↓
渲染完整 UI
```

**避免空态闪烁的关键**:`hasHydrated` 之前只渲染 `min-h-screen bg-background` 的占位 div(`app/dashboard/page.tsx:143`)。否则 persist 恢复前用户会看到"无数据"空态,恢复后瞬间跳到"有数据"视图。

### 7.3 主题首屏内联脚本

`app/layout.tsx:130-161` 在 `<head>` 内联的脚本是**唯一允许在渲染前执行**的阻塞代码。它在 React 挂载前读取 `theme-config`,设置 CSS 变量,避免深色/浅色主题的 FOUC(Flash of Unstyled Content)。

---

## 8. UI 渲染管线

### 8.1 应用壳组合

```
<RootLayout>                     (server; 主题脚本、GA、ErrorBoundary)
  <HomePage>                     (client; dashboard/page.tsx)
    <Header>                     (搜索、导入、设置按钮)
    <Sidebar>                    (分类树)
    <EmptyState>                 (无数据时)
      OR
    <EnhancedMainContent>
      ├─ <SearchResults>         (如果 searchQuery 非空)
      ├─ <DynamicBookmarkGrid>   (按子分类分组渲染)
      │   └─ <BookmarkCard | EnhancedBookmarkCard | SelectableBookmarkCard>
      └─ <BatchSelectionToolbar> (选择模式下)
    <OnboardingModal>
    <AddCategoryDialog>
    <AddBookmarkWithCategoryDialog>
    <PWAInstall>
    <SettingsPanel>
    <EnhancementProgress>        (订阅 enhancementProgress state)
  </HomePage>
</RootLayout>
```

### 8.2 卡片组件的三态

同一张书签有三种渲染形态,由父组件决定用哪个:
- `BookmarkCard`:默认只读,最轻。
- `EnhancedBookmarkCard`:带 hover 预览、推荐评分。
- `SelectableBookmarkCard`:批量选择模式,带 checkbox。

### 8.3 响应式断点

`hooks/use-display-settings.ts` 定义了 `breakpoints = { mobile: 640, tablet: 1024, desktop: 1536 }`。`useResponsiveLayout()` 返回当前 `breakpoint`,卡片网格据此选用 `gridColumns.mobile|tablet|desktop|large`。

### 8.4 事件通信的"逃生口"

Header 组件监听 `window.addEventListener('open-import-dialog', ...)`,允许任何深层组件(如 EmptyState、OnboardingModal)通过 `window.dispatchEvent(new CustomEvent('open-import-dialog'))` 打开导入对话框,不需要 prop drilling。

这是**有意识的权衡**:仅用于少数跨层通信场景,不滥用。

---

## 8A. 搜索子系统

### 数据流

```
HomePage (dashboard)                            ┐
  ├─ searchQuery: string           (父 state)   │ 父级单一数据源
  └─ searchFilters: SearchFilters                │
          │                                      │
          ▼                                      │
  <Header>                                       │
    └─ <EnhancedSearch>                          │
         ├─ 本地 localQuery(150ms 防抖后同步回父)│
         ├─ 受控 filters props                   │
         └─ Ctrl/Cmd+K 全局快捷键聚焦           │
          │                                      │
          ▼                                      │
  <EnhancedMainContent>                          │
    └─ <SearchResults>                           │
         ├─ filterCategories() / filterBookmarks()  (来自 lib/search-utils.ts)
         ├─ <EnhancedBookmarkCard>              (点击打开,复用主视图卡片)
         └─ onCategorySelect → 回到常规视图
```

### 共享过滤逻辑

`lib/search-utils.ts` 导出单一事实源:
- `parseSearchQuery(raw)` — 识别 `tag:` / `#` 前缀,去前缀返回规范化 query + `tagOnly` 标志
- `filterBookmarks(list, categories, query, filters)` — 应用 query + filters(分类、hasDescription)
- `filterCategories(list, query)` — 分类名/子分类名匹配(tag 模式下返回空)

`EnhancedSearch` 和 `SearchResults` 必须使用此模块,**不得各自再写一遍**过滤逻辑 —— 否则"历史记录里显示的结果数"与"实际结果页结果数"会不一致(曾经的 bug)。

### 键盘与可访问性

- 全局 `Ctrl/Cmd+K` → 聚焦搜索框
- 下拉开启时 `↑/↓` 在建议+历史合并列表中移动 active item
- `Enter`:有 active 时选中该项,否则提交当前 query
- `Escape` 关闭下拉
- 容器 `role=combobox/listbox/option` + `aria-activedescendant` 满足屏幕阅读器

### 过滤器状态归属

`searchFilters` **在 dashboard 父级持有**,非 `EnhancedSearch` 内部 —— 因为:
1. `SearchResults` 需要读同一份 filters 做真实过滤
2. `EnhancedSearch` 顶部 Filter 按钮上的角标数字要基于同一份 filters 计算
3. 未来想把 filters 状态持久化也只需改 dashboard 一处

---

## 9. 性能与安全策略

### 9.1 性能
- **图片优化**:Next.js Image Optimizer + AVIF/WebP 首选(`next.config.mjs`),缓存 1 年。
- **请求去重**:`lib/request-deduplicator.ts` 合并 30s 内相同 URL 的并发请求。
- **批处理与延迟**:增强流水线按 8/40 两种批大小处理,批间延迟 100ms,避免打爆 `/api/fetch-meta`。
- **字体预加载由 `next/font` 自动注入**,不手写 `<link rel=preload>` —— 手写路径 hash 和实际产物对不上会 404。
- **代码拆分**:`optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']`。
- **stream 可中断**:`proxy-image` 用 `pipeTo(writable, { signal })` 转发上游 body,客户端离开即 abort 上游,节省带宽并消除 `ERR_INVALID_STATE`。
- **SW 仅生产注册**:`components/pwa-install.tsx` 在 dev 主动 `unregister()` + 清 cache,避免缓存旧 chunk 导致 `ChunkLoadError`。
- **Web Vitals**:`components/web-vitals-monitor.tsx` 采样上报到 `/api/analytics/web-vitals`。

### 9.2 安全
- **CSP**:严格限制脚本/连接来源(见 6.2)。
- **X-Frame-Options: DENY** + **X-Content-Type-Options: nosniff**。
- **Permissions-Policy**:禁用 camera/mic/geo。
- **Proxy 私网黑名单**:阻止 SSRF。
- **全局错误静默**:`app/layout.tsx:163-186` 拦截未捕获的 Promise rejection 与 error,避免用户看到原生错误 overlay(生产模式体验)。
- **数据不上传**:localStorage-only,不需要 HTTPS 之外的传输加密。

---

## 10. 已知权衡与技术债

### 10.1 有意的权衡
| 选择 | 放弃 | 原因 |
|---|---|---|
| 客户端 only + localStorage | 多端同步 | 零运维、零登录、隐私友好 |
| 本地兜底 + 关闭外部 API | 更丰富的元数据 | 稳定性 > 完整性 |
| Edge Runtime | 部分 Node 生态 | 冷启动快、全球部署 |
| 两个 Zustand Store | 单一全局 store 的便利 | 订阅粒度 + 灾难半径 |
| 两张渲染卡片组件(Card / Enhanced / Selectable) | DRY | 性能与选择模式逻辑清晰 |

### 10.2 技术债
- **`build.ignoreBuildErrors: true`**(`next.config.mjs`):TypeScript 错误不阻断构建。长期应收紧。
- **`eslint.ignoreDuringBuilds: true`**:同上。
- **`immer` 装了但几乎未用**:store 仍用展开运算符。可移除或全面切换。
- **`components/` 扁平结构**(50+ 文件同级):文件多时难检索,可按 `bookmark/` `category/` `dialog/` `settings/` 分组。
- **`app/test-api`、`app/debug/*`** 在生产构建中也会产出,应通过环境变量或路由组 `(debug)` 排除。
- **`data/website-descriptions-1000plus.json` (250KB) 被静态 import 三处**:`background-metadata-enhancer.ts` / `add-bookmark-dialog.tsx` / `add-bookmark-with-category-dialog.tsx`。改 dynamic import 能大幅减小 dev 增量编译时间和生产首屏 bundle。
- **无测试**:`package.json` 无测试命令;关键逻辑(URL 归一化、`lib/search-utils.ts` 过滤、增强回退链)值得单元测试覆盖。
- **历史 bug 文档散落在根 `docs/`**(`infinite-loop-*.md`、`cover-image-fix-summary.md` 等):建议合并或移入变更日志。

### 10.3 演进方向(若项目继续)
1. **可选云同步**:在保留本地优先的前提下,加一个可选的"上传到 Gist / WebDAV"能力。
2. **抽离 Worker**:把 `background-metadata-enhancer` 挪到 Web Worker,避免主线程卡顿。
3. **schema 迁移管道**:当前 `version: 2` 是硬切换,缺平滑迁移逻辑。
4. **插件化增强器**:允许用户注册自己的 preset 规则(例:公司内网站点库)。

---

## 附录:术语

- **preset**:命中 `data/website-descriptions-1000plus.json` 离线库的书签。
- **slow 批**:需要抓远端 HTML 的书签增强流程。
- **增强**(enhance):从 URL 出发,补全/更新书签的 title、description、favicon、coverImage 等元数据的过程。
- **isEnhancing / hasHydrated**:两个 store 级门闩,分别控制"增强期间"和"persist 恢复完成"。
