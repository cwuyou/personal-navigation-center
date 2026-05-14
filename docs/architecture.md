# 架构设计文档

> Personal Navigation Center — Next.js 14 App Router 书签管理 PWA
> 文档日期:2026-05-15

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
   - 8.5 移动端 Sidebar 抽屉
   - 8.6 Header 按钮折叠
   - 8.7 导航状态 ↔ URL 同步
   - 8.8 Sidebar 折叠态分类导航
   - 8.9 面包屑导航
   - 8.10 Header 增强进度指示器
8A. [搜索子系统](#8a-搜索子系统)
8B. [键盘快捷键](#8b-键盘快捷键)
8C. [删除撤销机制](#8c-删除撤销机制)
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

合并逻辑:
```ts
const slowList = [...unknownBookmarks, ...presetNeedingCover]
    .filter((b, idx, arr) => arr.findIndex(x => x.id === b.id) === idx)
```
去重后进入慢速管线。

**进度 `total` 的语义**:**工作量,不是去重书签数**。预置缺封面的书签会在 preset 批和 slow 批被各处理一次,因此:

```
total = presetBookmarks.length + slowList.length    // 真实工作量
≠ bookmarks.length                                   // 输入数
```

例:输入 173 个书签,38 个预置缺封面 → `total = 173 + 38 = 211`,与 `completed` 严格匹配。如果回到 `bookmarks.length`,UI 会出现 `211/173` 溢出。`slowList` 计算被提前到工作流头部以构造 `total`,这是 enhancer 与 UI 的契约,**不要改回 `bookmarks.length`**。UI 端(`components/header.tsx`)另外用 `Math.min(completed, total)` 和进度条容器 `overflow-hidden` 做兜底防御。

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
<RootLayout>                          (server; 主题脚本、GA、ErrorBoundary)
  <HomePage>                          (client; dashboard/page.tsx)
    <Header>                          (搜索、3 个一级按钮 + ⋯ 更多)
      ├─ <Menu> 汉堡按钮              (仅 mobile, prop onMobileMenuClick 存在时)
      ├─ <EnhancedSearch>
      ├─ 增强进度指示器                (enhancementProgress.status==='running' 时显示)
      └─ "⋯ 更多" 菜单
          ├─ 显示 → <QuickDisplaySettingsContent>
          ├─ 导出 → HTML / JSON / CSV / TXT
          ├─ 产品首页 (跳 /)
          ├─ 帮助
          └─ 关于
    {breakpoint === 'mobile'
      ? <Sheet side="left"><Sidebar/></Sheet>     (移动端抽屉)
      : <Sidebar/>}                                (桌面端常驻; 折叠态显示分类首字符)
    <EmptyState>                      (无数据时)
      OR
    <EnhancedMainContent>
      ├─ <SearchResults>              (如果 searchQuery 非空)
      ├─ 详情视图                      (selectedCategory 非空)
      │   ├─ 面包屑导航 (首页 / 分类 / 子分类)
      │   ├─ 子分类胶囊导航
      │   └─ <DynamicBookmarkGrid> + <EnhancedBookmarkCard|SelectableBookmarkCard>
      ├─ 首页视图                      (未选中分类)
      │   └─ 每分类标题 + 每子分类一行 (4..6 张, 由 clamp(4, min(6, gridCols[bp])))
      └─ <BatchSelectionToolbar>      (选择模式下)
    <OnboardingModal>
    <AddCategoryDialog>
    <AddBookmarkWithCategoryDialog>
    <PWAInstall>
    <SettingsPanel>                   (复用 QuickDisplaySettingsContent + 网格列数)
  </HomePage>
</RootLayout>
```

### 8.2 卡片组件的三态

同一张书签有三种渲染形态,由父组件决定用哪个:
- `BookmarkCard`:默认只读,最轻。
- `EnhancedBookmarkCard`:带 hover 预览、推荐评分。
- `SelectableBookmarkCard`:批量选择模式,带 checkbox。

**Shift+Click 直接预览**:三个组件的 `handleClick` 都先检查 `e.shiftKey`,持 shift 时调 `onPreview(bookmark)` 而不是 `window.open`。这降低了预览功能的发现成本——以前必须 hover 卡片 → 三点菜单 → 点预览,现在按住 shift 点卡片即可。三点菜单里的"预览"按钮保留作为备选入口。

### 8.3 响应式断点

`hooks/use-display-settings.ts` 定义了 `breakpoints = { mobile: 640, tablet: 1024, desktop: 1536 }`。`useResponsiveLayout()` 返回当前 `breakpoint`,卡片网格据此选用 `gridColumns.mobile|tablet|desktop|large`。

**Dashboard 在两个地方依赖此 breakpoint**:
1. **移动端 Sidebar 改抽屉**(`breakpoint === 'mobile'`):见 §8.5。
2. **首页每子分类一行的数量**:`enhanced-main-content.tsx` 用 `clamp(4, min(6, gridColumns[breakpoint]))` —— 最少 4 张、最多 6 张,跟随用户网格列数设置但带上下界。

### 8.4 事件通信的"逃生口"

Header 组件监听 `window.addEventListener('open-import-dialog', ...)`,允许任何深层组件(如 EmptyState、OnboardingModal)通过 `window.dispatchEvent(new CustomEvent('open-import-dialog'))` 打开导入对话框,不需要 prop drilling。

这是**有意识的权衡**:仅用于少数跨层通信场景,不滥用。

### 8.5 移动端 Sidebar 抽屉

桌面端 Sidebar 是常驻 `w-64` 块;移动端(< 640px)用 `<Sheet side="left">` 包同一个 Sidebar 组件,通过 Header 上的汉堡按钮触发。

```
breakpoint === 'mobile'
   ↓ 是
Header.onMobileMenuClick → setMobileSidebarOpen(true)
   ↓
<Sheet open={mobileSidebarOpen}>
  <SheetContent side="left" className="p-0 w-64 max-w-[85vw]">
    <Sidebar … onCategorySelect={(...) => {
       setSelectedCategory/Sub(...)
       setMobileSidebarOpen(false)   ← 关键:选完自动关
    }}/>
  </SheetContent>
</Sheet>
```

**几个有意识的取舍**:
- Sidebar 组件内部 `w-64 border-r` 在 Sheet 里仍然有效;SheetContent 外层加 `p-0 w-64 max-w-[85vw]`,跟内部宽度对齐,避免抽屉太宽。
- Header 的汉堡按钮通过 `onMobileMenuClick` prop 控制:dashboard 仅在 mobile 时传值,Header 内部用 `sm:hidden` 双重保险;桌面端汉堡按钮根本不渲染。
- `mobileSidebarOpen` 在窗口宽度跨越 640px 时不需要清理(常驻分支不读该 state),抽屉切回常驻自然消失。

### 8.6 Header 按钮折叠

Header 一级位置只放 3 个高频按钮:添加书签 / 导入 / 设置。低频项收纳到 `<MoreHorizontal />` 弹出菜单:

```
⋯ 更多
├─ 显示  (Sub) → <QuickDisplaySettingsContent>   (开关、密度、圆角)
├─ 导出  (Sub) → HTML / JSON / CSV / TXT
├─ ─────────────────────────
├─ 产品首页 → /                                   (营销页, 低频访问)
├─ 帮助    → /help
└─ 关于    → AboutDialog
```

**为什么不放在一级?**
- 14" 屏幕能放下 4-5 个按钮就到极限,留出搜索框宽度比按钮数量更重要。
- `产品首页` 跳的是营销页 `/`,**老用户会被它重定向回 `/dashboard`**,所以这是"分享给他人"或"看介绍"的低频入口,不该占一级位置。
- "显示"和"设置"职责重叠(都能改卡片显示) —— 暂时保留两者,但快速密度调整放"⋯ 显示",完整设置面板放 Settings 一级按钮。这是已知技术债(见 §10.2)。

`QuickDisplaySettingsContent` 是从老 `QuickDisplaySettings` 组件抽出的纯 Card body —— 可以嵌进任意菜单/Sheet。老的 `QuickDisplaySettings`(自带 Dropdown 包装)已不再使用,保留只为兼容引用。

### 8.7 导航状态 ↔ URL 同步

Dashboard 把 3 个导航 state 双向绑定到 URL:

| state | URL 参数 |
|---|---|
| `selectedCategory` | `?category=` |
| `selectedSubCategory` | `?sub=` |
| `searchQuery` | `?q=` |

**实现**(`app/dashboard/page.tsx`):

```
首次水合 → urlBootstrapped ref = false
   ↓
useEffect([hasHydrated]) 触发一次
   ├─ window.location.search → 解析 3 个参数
   ├─ setSelectedCategory / setSelectedSubCategory / setSearchQuery
   └─ urlBootstrapped.current = true (后续 state→URL 才生效)
   ↓
state 变化 → useEffect 把 3 个 state 拼成 query string
   ↓ 与 window.location.search 比对,有差异才写
window.history.replaceState(...)   ← 不堆历史栈
   ↓
浏览器前进/后退 → popstate 监听 → 回灌 state
```

**为什么用 `history.replaceState` 而不是 `router.replace`?**
- Next.js 14 的 `useSearchParams` 在客户端组件里需要 Suspense 边界,会触发 build warning。
- `router.replace` 会推/replace 路由帧(虽然不导航),仍可能引起 RSC 重新请求(尽管 dashboard 没有 RSC 内容)。
- `window.history.replaceState` 是纯浏览器 API,绕开 Next 路由器,行为最可控。
- 代价:`router.refresh()` / `usePathname` 之类感知不到这个变化 —— dashboard 里没用这些 API,可控。

**为什么是 `replaceState` 而非 `pushState`?**
- 每次切分类都堆历史栈会让用户"返回"按钮卡在 dashboard 内部,而不是回到来源页。
- 切换分类是"过滤"语义,不是"导航到新页面",`replace` 更符合直觉。

### 8.8 Sidebar 折叠态分类导航

折叠态原本只剩一个"展开"按钮,毫无导航价值。现在改为类似 VS Code Activity Bar 的图标条:

```
collapsed === true
   ↓
<div className="w-12 ...">
  <Button onClick={onToggleCollapse}><PanelLeft/></Button>   ← 展开
  <ScrollArea>
    {collapsibleCategories.map(cat => (
      <button
        onClick={() => onCategorySelect(cat.id)}
        className={isActive ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"}
      >
        {cat.name.charAt(0)}                               ← 首字符
      </button>
    ))}
  </ScrollArea>
</div>
```

**几个有意识的取舍**:
- **不自动展开**:点击直接切换 `selectedCategory`,sidebar 保持折叠。用户想看子分类才手动展开。理由:Activity Bar 模式更紧凑,避免"点错一次就触发整个 UI 重排"。
- **`system` 分类排除**:系统分类(`uncategorized`)是隐藏实现细节,不应出现在快捷导航条。
- **选中态高亮**:`selectedCategory === cat.id` 时用 `bg-primary`,与展开态高亮风格保持一致。

### 8.9 面包屑导航

详情视图(`selectedCategory !== null`)顶部渲染面包屑,提供"当前位置"指示和回溯入口:

```
首页  ›  开发工具  ›  代码编辑器
 ↑       ↑           ↑
 │       │           └─ 当前位置, 不可点击
 │       └─ 点击: setSelectedSubCategory(null), 回到分类层
 └─ 点击: setSelectedCategory(null), 回到首页
```

**设计要点**:
- 通过新 prop `onCategorySelect(categoryId | null, subCategoryId?)` 暴露给 dashboard,后者 setter 三件套
- 与导航状态 ↔ URL 同步(§8.7)自动联动,面包屑点击后 URL 也更新
- 当前层级文字加粗(`font-medium`),前面祖先用 muted 颜色 + hover primary
- 不在搜索结果或首页视图渲染——这两个视图没有"路径"概念

### 8.10 Header 增强进度指示器

后台元数据增强(§5)运行时,Header 在"设置"按钮和"⋯ 更多"之间显示一个 Loader2 旋转图标 + `已完成/总数` 计数,点击展开 Popover 显示进度条、当前 URL、停止按钮。

```
enhancementProgress.status
   ├─ 'running' → 显示指示器 + Popover
   ├─ 'completed' → 隐藏(由 store 在 setTimeout 2s 后清空 enhancementProgress)
   └─ 'error' → 隐藏
```

**为什么放 Header 而不是底部**:
- 旧设计是右下角悬浮 Card,但 dashboard 底部已经有 `<BatchSelectionToolbar>` 抢占位置,且离用户视线焦点远
- 增强是"后台操作"的语义,放 Header 与其他全局状态(搜索、设置)在一起更直观
- Popover 默认隐藏详情,只在用户主动展开时才占用屏幕,不打扰阅读

**渲染端的防御性 clamp**:`total` 来自 enhancer,语义见 §5.1(工作量,可能大于输入书签数)。即便如此,UI 侧不直接信任 `enhancementProgress` 的原始值,做两层防御:

```tsx
const completed = Math.min(enhancementProgress.completed, total)
const percent   = total > 0 ? Math.min(100, Math.round(completed / total * 100)) : 0
```

外加进度条容器 `overflow-hidden`,保证即使未来 enhancer 计数失准,UI 也不会出现 `211/173` 或进度条溢出 Popover 边界这类视觉异常。这两层是**纯防御**,正常情况下不应触发——若触发,说明 enhancer 的 total 计算出 bug,应回到 §5.1 修。

**`components/enhancement-progress.tsx` 的现状**:
- 函数体始终 `return null`(线上完全静默),保留是历史遗留
- 新的 Header 实现完全内联在 `header.tsx` 中,不复用 `EnhancementProgress`(那个版本是悬浮 Card,与 Header 内嵌按钮形态不兼容)
- 可清理:dashboard 已移除 `<EnhancementProgress />` 和对应 import

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

## 8B. 键盘快捷键

快捷键按"作用域"拆成两组,各自管自己的状态边界:

| 快捷键 | 作用 | 注册位置 | 触发条件 |
|---|---|---|---|
| `Ctrl/Cmd+K` | 聚焦搜索 | `EnhancedSearch` 内部 useEffect | 全局,但可在输入框中触发(覆盖默认行为) |
| `/` | 聚焦搜索 | `app/dashboard/page.tsx` | 不在输入控件内 |
| `N` | 打开添加书签对话框 | `app/dashboard/page.tsx` | 不在输入控件内,无修饰键 |
| `Esc` | 退出选择模式 | `EnhancedMainContent` | `isSelectionMode === true` |
| `Ctrl/Cmd+A` | 全选当前视图 | `EnhancedMainContent` | `isSelectionMode === true` 且不在输入控件 |
| `↑/↓/Enter` | 搜索建议导航 | `EnhancedSearch` | 下拉打开时 |

**输入控件保护**:dashboard 全局快捷键(`/`、`N`)会检查 `e.target` 的 tag(`INPUT/TEXTAREA/SELECT`)和 `isContentEditable`,在输入控件内不触发,以免影响打字。

**搜索框查找方式**:`/` 快捷键通过 `document.querySelector('input[data-search-input]')` 找到搜索框聚焦,而不是通过组件 ref。原因:dashboard 不持有 `EnhancedSearch` 的 ref,而 `data-*` 属性提供了无侵入的跨组件查找能力。

**Esc 与对话框**:Radix Dialog/Sheet 自带 `Esc` 关闭,本节的 `Esc` 仅作用于"选择模式"(非对话框、非搜索下拉)。如果对话框打开,Radix 会先消费 `Esc`,选择模式不会受影响。

---

## 8C. 删除撤销机制

所有删除操作支持 5 秒内撤销,实现集中在 `hooks/use-bookmark-store.ts`,**调用方零改动**:

```
用户点击删除
   ↓
deleteBookmark(id) / deleteSubCategory(id) / deleteCategory(id)
deleteBookmarksBatch(ids) / deleteCategoriesBatch(ids)
   ↓
captureSnapshot({ categories, bookmarks })   ← 模块级变量, 不进 persist
   ├─ token = ++deleteTokenSeq               ← 新 token 让旧快照失效
   └─ 深拷贝 categories + bookmarks
   ↓
set({ categories, bookmarks })  ← 应用删除
   ↓
showUndoToast("已删除 XXX", token)
   ↓ sonner toast (5s)
   ├─ 用户点击"撤销"
   │     ├─ token 仍匹配 → setState 恢复, lastDeleteSnapshot=null
   │     └─ token 不匹配(被新删除覆盖) → toast.error("撤销已过期")
   └─ 5s 超时 → toast 消失, 快照仍在内存但无 UI 入口
```

**设计要点**:
- **模块级 `let lastDeleteSnapshot`**:不进 Zustand store(避免污染持久化),也不放 `useRef`(撤销按钮在 toast 里,与 React 树脱钩)
- **token 单调递增**:同时只允许一个有效快照,新删除会让旧 toast 上的撤销按钮变 no-op,简单且符合用户心理预期(只能撤销最近一次)
- **Batch action 不是循环 single**:批量删除单独提供 `deleteBookmarksBatch / deleteCategoriesBatch`,只产生一条 toast 和一个快照,避免 5 个删除产生 5 条 toast
- **不持久化**:刷新页面快照丢失。这是有意识的取舍——撤销是"瞬时反悔"语义,跨刷新的恢复属于"垃圾桶"特性,不在本机制范围

**调用方迁移规则**:
- 单删:无需改动,直接调 `deleteXxx(id)` 即可
- 批量删:**禁止** `ids.forEach(id => deleteXxx(id))`,改用 `deleteXxxBatch(ids)`
- 删除前的确认对话框文案中不要再写"无法撤销",已统一改为"删除后可在短时间内撤销"

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
- **无测试**:`package.json` 无测试命令;关键逻辑(URL 归一化、`lib/search-utils.ts` 过滤、增强回退链、删除撤销快照机制)值得单元测试覆盖。
- **历史 bug 文档散落在根 `docs/`**(`infinite-loop-*.md`、`cover-image-fix-summary.md` 等):建议合并或移入变更日志。
- **显示设置去重已落地但仍有两个入口**:`⋯ 更多 → 显示` 和 Settings 都用同一份 `QuickDisplaySettingsContent`(代码层不再重复),但 UI 层仍有两个发现入口。是否进一步收敛(只留一个入口)是产品决策,未定。
- **`components/display-settings-panel.tsx` 孤儿组件**:未被引用,与新的 `quick-display-settings-content.tsx` 命名相近,易误引。应删除或合并。
- **`components/quick-display-settings.tsx` 已不再使用**:内容被抽到 `quick-display-settings-content.tsx`,自带 Dropdown 包装的版本目前没有调用方,可清理。
- **`components/enhancement-progress.tsx` 是僵尸组件**:函数体始终 `return null`,不再被 dashboard 引用。Header 内的新版进度指示器是内联实现,该文件可删除。
- **删除快照仅内存**:刷新页面后失去撤销能力。如要做"垃圾桶"持久化恢复,需要新设计(可能进 IndexedDB,不污染 Zustand persist)。

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
