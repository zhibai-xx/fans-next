# Fans Community Frontend

一个基于 Next.js 的粉丝社区前端应用，支持图片和视频分享功能。

## 🚀 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI组件**: Shadcn/ui
- **状态管理**: React Hooks
- **认证**: NextAuth.js
- **HTTP客户端**: 自定义API客户端

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── api/               # API 路由
│   ├── images/            # 图片相关页面
│   ├── videos/            # 视频相关页面
│   ├── profile/           # 用户资料页面
│   └── ...
├── components/            # 可复用组件
│   ├── ui/               # UI基础组件
│   ├── upload/           # 上传相关组件
│   └── ...
├── hooks/                # 自定义Hooks
├── lib/                  # 工具库
├── services/             # API服务
├── types/                # TypeScript类型定义
└── styles/               # 样式文件
```

## 🛠️ 开发环境设置

### 1. 安装依赖
```bash
npm install
```

### 2. 环境变量配置
复制 `env.example` 为 `.env.local` 并填入正确的配置：
```bash
cp env.example .env.local
```

### 3. 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3001](http://localhost:3001) 查看应用。

## 🔧 主要功能

- ✅ 用户认证（注册/登录）
- ✅ 图片上传和展示
- ✅ 视频上传和播放
- ✅ 标签管理
- ✅ 分类管理
- ✅ 用户资料管理
- ✅ 收藏功能
- ✅ 响应式设计

## 🌐 API集成

前端通过自定义的API客户端与后端通信，支持：
- 自动token刷新
- 错误处理
- 请求拦截
- 响应格式化

## 📱 响应式设计

项目采用移动优先的响应式设计，支持：
- 手机端 (320px+)
- 平板端 (768px+)
- 桌面端 (1024px+)

## 🔒 安全特性

- JWT token自动管理
- 路由保护
- XSS防护
- CSRF保护

## 📦 构建和部署

### 构建生产版本
```bash
npm run build
```

### 启动生产服务器
```bash
npm start
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。
