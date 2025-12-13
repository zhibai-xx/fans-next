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
