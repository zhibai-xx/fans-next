# 2026-03-31
- 清理前端生产调试噪声：移除 `media/review/system-ingest/auth` 链路中的高频 `console.log` 调试输出，降低上线后的浏览器控制台噪音
- 备案通过前补齐站点 SEO 基础设施：新增统一站点配置 `src/lib/seo/site.ts`，集中管理站点名称、描述、关键词与公开路由
- 根布局 metadata 更新为当前图片站口径，移除旧的“视频/社区”描述，统一 Open Graph / Twitter 基础信息
- 新增 `src/app/robots.ts` 与 `src/app/sitemap.ts`，备案通过后可直接向搜索引擎提交站点地图
- 图片页新增独立 metadata：`src/app/images/layout.tsx`，为图片主入口提供更明确的标题、描述与 canonical
- 接口契约变更：否

# 2026-03-17
- 上线前部署收口：`next.config.ts` 的后端代理目标改为 `BACKEND_INTERNAL_ORIGIN` 环境变量，不再写死 `localhost:3000`，便于云上反向代理或容器内网部署
- 新增前端容器化文件：`Dockerfile` 与 `.dockerignore`，可直接构建生产镜像并以 `3001` 端口启动
- 新增前端环境变量模板项 `NEXT_PUBLIC_ENABLE_VIDEO_FEATURE`，与本轮视频首发关闭策略保持一致
- 首发阶段新增前端视频功能开关 `NEXT_PUBLIC_ENABLE_VIDEO_FEATURE=false`，默认隐藏侧栏/首页中的视频入口，并由 `proxy.ts` 将 `/videos*` 统一重定向到 `/images`
- 上传与导入入口同步收紧：视频上传按钮隐藏，上传器会拒绝视频文件；`system-ingest` 页面与个人中心导入页默认只展示图片/GIF 文件与筛选项
- 用户侧残留入口收口：下载记录与收藏列表在视频关闭时不再暴露视频项或视频筛选，避免旧数据继续把用户带入已关闭模块
- 主要改动文件：`next.config.ts`、`Dockerfile`、`.dockerignore`、`src/lib/features.ts`、`src/proxy.ts`、`src/app/components/RootLayoutClient.tsx`、`src/app/page.tsx`、`src/components/upload/AdvancedUploadModal.tsx`、`src/components/VideoUploadButton.tsx`、`src/app/system-ingest/page.tsx`、`src/app/profile/system-ingest-tab.tsx`、`src/app/profile/downloads-list.tsx`、`src/components/interaction/MyFavorites.tsx`
- 接口契约变更：否

# 2026-02-12
- 认证过期联动修复：`ApiClient` 统一识别 401/`jwt expired`，自动清理 Zustand 登录态并触发 NextAuth `signOut`，前端收到事件后跳转 `/login?reason=session-expired`，避免侧栏继续显示过期用户信息
- API 基础地址改为同源 `/api`，避免直连 `http://localhost:3000` 导致的跨域与会话一致性问题，统一走 Next.js 代理
- 互动服务鉴权守卫：未登录时不再请求批量点赞/收藏状态接口，返回安全默认值；点赞/收藏写操作在未登录时直接提示，减少无效请求与控制台噪音
- NextAuth 会话增强：接入 `refresh_token`，JWT 回调在 access token 临近过期时自动调用 `/api/users/refresh-token` 续期，续期失败时自动触发会话失效流程
- 登出流程增强：前端登出前先调用 `/api/users/logout`，配合后端 `session_version` 机制即时失效旧 token，避免多端残留会话
- 新增“上线最小交付清单（前端）”决策，明确本地达标、上云参数、部署验证与回滚步骤
- 涉及文件：`src/lib/api-client.ts`、`src/hooks/useAuthSync.ts`、`src/components/providers/auth-provider.tsx`、`src/services/interaction.service.ts`、`src/services/video.service.ts`、`src/services/auth.service.ts`、`src/app/api/auth/[...nextauth]/route.ts`
- 接口契约变更：是（依赖后端登录响应新增 `refresh_token` 与刷新接口）

# 2026-03-16
- `system-ingest` 页面新增自定义扫描路径输入，扫描 Query Key 绑定路径值，切换真实采集目录时不再复用旧缓存
- 新增前端 E2E 冒烟脚本 `tests/e2e/auth-system-ingest.smoke.mjs`，覆盖游客访问、管理员登录、后台访问与系统导入扫描主链路
- 前端质量校验保持通过：`npm run lint`、`npm run typecheck`、`npm run build`、`npm run test:e2e:smoke`

# 2025-11-13
- 统一 API Client/服务返回类型：新增全局 ApiResponse/Pagination 类型，修复 admin-media/tags 服务与 TanStack Query hooks 里的 `any`，确保响应携带 success/data/pagination
- 前端重点组件补齐类型：ImageGrid/LazyImageCard 加显式 props 与 `displayName`，RobustVideoPlayer 的 window/videojs/错误回调去除 `any`，useAuthSync 映射 NextAuth session 到 Zustand

# 2025-11-12
- 左侧导航栏移除“动态 / 社区”入口，主页同步去除相关卡片，改由品牌入口返回首页并突出图片、视频与支持页面
- “支持我们 / 联系我们”页改为双列布局：左列聚焦邮箱/微信与可承接合作（网站、AI、技术顾问），右列保留精简自愿捐赠提示并内置支付宝/微信二维码占位图，方便替换为真实截图

﻿# 2025-11-11
- 图片页新增“官方精选 / 社区投稿”双分组入口，默认展示官方渠道，切换后沿用原有分类/标签筛选并通过 `sourceGroup` 参数命中后端接口
- 左侧导航栏继续收敛为纯链接布局：移除顶部头像卡片，仅保留品牌标识（更新为 JOY 粉丝社区）与极简导航组，细边框+轻阴影统一区分层次
- 个人中心“媒体管理”页完善：待审核稿件仅支持编辑/撤回（撤回将直接移除记录），被拒稿件可重新提交，已发布稿件支持软删并在“已删除”分类集中管理，所有文案同步媒体化

# 2025-11-10
- 站内“微博导入”入口全面改名为“系统导入”，路由改为 `/system-ingest` 并对应个人中心 Tab/权限项
- 前端服务与 hooks 迁移至 `system-ingest.service.ts`，所有 UI/枚举/徽章使用 SYSTEM_INGEST 语义并清理旧字段

# 2025-11-09
- 新增 `UserAvatar` 组件（浅色渐变+昵称首字母），统一替换导航、资料页、视频/图片列表与评论中所有头像展示
- 上线头像占位逻辑：移除 default-avatar 静态图，缺省头像一律回退到文字头像并兼容本地预览/相对路径
- NextAuth JWT/Session 现保存 avatar_url，并在更新会话时写回，保证侧栏/导航等依赖全局用户信息的头像能与个人中心保持一致
- 头像上传流程集成 react-easy-crop，本地裁剪生效后再上传后端，降低服务器负载并提升用户交互体验
- 更新 `resolveMediaVideoUrl` 映射，兼容 `uploads/processed/*`，后台内容管理页视频播放与封面恢复正常

# 2025-11-08
- 个人中心头像改造：新增 shadcn Avatar 上传区（大小/格式校验、预览、会话同步）并移除手动 URL 输入
- userService / TanStack Query 对接 `POST /users/profile/avatar`，统一使用 UserResponseDto 数据结构更新 Zustand/NextAuth

# 2025-11-07
- 修复点赞或收藏触发的播放器黑屏，避免重复重建 video.js 实例
- 视频详情留言区接入后端评论 API，支持热门/最新排序与登录发布

# 2025-10-31
- 对接视频互动 API，统一点赞与收藏状态并修正请求路径
- 视频详情页改为左右双栏布局：左侧播放器与信息，右侧 Telegram 风格留言面板
- 移除相关推荐模块，评论区改为单层留言卡片
- 修复媒体详情缺失多清晰度问题：后端 `findOne` 补齐 video_qualities，前端统一复用了 buildVideoSources
- 搜索页接入后端数据并更新卡片交互与封面体验
- 修复互动高亮丢失、搜索清空无法回退及卡片跳转只见骨架的问题
