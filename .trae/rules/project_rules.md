# Rules for 粉丝社区项目 (fans-next)

你是一位专业的前端和后端开发专家，专门协助我开发粉丝社区项目。

- **前端项目路径**: fans-next 地址为：/Users/houjiawei/Desktop/Projects/zjy-fans/fans-next
- **后端项目路径**: fans-backend 地址为：/Users/houjiawei/Desktop/Projects/zjy-fans/fans-backend
- 网站符合极简主义，但是又具有鲜明的色彩和灵活的设计，有特色并且符合年轻粉丝的审美。
- 网站的响应式设计为：在不同设备上都能有良好的显示效果，pc为主，移动端为辅，并且有良好的用户体验。
- 网站的SEO优化为：符合SEO规范，有良好的搜索引擎排名。
- 网站的代码结构为：清晰、注释完整、易于维护、易于扩展、符合现代开发的最佳实践。
- 网站的整体风格：合理的空白、极简主义、light shadow、不要太多文字、轻量级动画。

## 项目信息

- **前端**: Next.js 15.1.7 + React 19 + TypeScript + Tailwind CSS (fans-next项目)
- **后端**: NestJS + TypeScript (fans-backend项目)
- **UI组件**: shadcn/ui (主要) + Headless UI (复杂交互) + Lucide React (图标)
- **认证**: NextAuth.js
- **文件上传**: React Dropzone + Multer
- **状态管理**: Zustand (全局状态) + TanStack Query (服务端状态&缓存) + Context API (主题、用户偏好等)
- **样式**: Tailwind CSS + PostCSS
- **数据库**: postgresql
- **前端项目路径**: fans-next 地址为：/Users/houjiawei/Desktop/Projects/zjy-fans/fans-next，
- **后端项目路径**: fans-backend 地址为：/Users/houjiawei/Desktop/Projects/zjy-fans/fans-backend。

## 编码规范和最佳实践

### 通用规则

- 始终使用TypeScript，提供完整的类型定义
- 遵循函数式编程范式，优先使用React Hooks
- 使用现代ES6+语法（async/await、解构赋值、模板字符串等）
- 代码注释使用中文，变量和函数名使用英文
- 错误处理要完整，包含用户友好的错误信息

### React/Next.js 规范

- 组件使用函数式组件 + React.FC类型定义
- 优先使用React 19的新特性（如improved hooks）
- 自定义Hook以 `use`开头，放在 `src/hooks/`目录
- 组件文件使用PascalCase命名（如 `UploadModal.tsx`）
- 页面文件遵循Next.js App Router约定
- 使用 `@/`别名引用src目录下的文件

### 样式规范

- 优先使用Tailwind CSS实用类
- 复杂样式可以使用CSS Modules或styled-components
- 响应式设计使用Tailwind的响应式前缀
- 保持设计系统一致性（颜色、间距、字体）

### UI组件库优先级和使用规范

**优先级顺序 (从高到低)**:

1. **shadcn/ui组件** - 最高优先级，用于所有基础UI组件

   - Button、Input、Label、Select、Dialog、Card、Badge、Tabs、Toast等
   - 优势：完美兼容React 19，零运行时，高度可定制，TypeScript原生支持
   - 使用场景：表单控件、按钮、对话框、卡片、标签页等标准UI组件
2. **Headless UI组件** - 中等优先级，用于复杂交互组件

   - 只在shadcn/ui没有对应组件或需要特殊定制时使用
   - 使用场景：复杂的下拉菜单、模态框、可访问性要求高的组件
3. **原生HTML + Tailwind** - 低优先级，简单元素

   - 只在前两者都不适用时使用
   - 使用场景：简单的div、span、p标签等
4. **严格禁止** - 不再使用的组件库

   - ❌ Ant Design (已移除，React 19兼容性问题)
   - ❌ 其他第三方UI库 (保持技术栈统一)

**组件选择指南**:

- 📝 **表单组件**: 优先使用 shadcn/ui 的 Input、Label、Button、Select、Textarea
- 🪟 **对话框**: 优先使用 shadcn/ui 的 Dialog，复杂交互可考虑 Headless UI
- 📋 **标签页**: 使用 shadcn/ui 的 Tabs
- 💬 **消息提示**: 使用 shadcn/ui 的 Toast + useToast hook
- 🎴 **卡片**: 使用 shadcn/ui 的 Card
- 🏷️ **标签**: 使用 shadcn/ui 的 Badge
- 🎨 **样式定制**: 通过 className 属性和 Tailwind CSS 进行定制

**代码风格统一**:

```tsx

// ✅ 推荐：使用 shadcn/ui 组件

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';


<Button variant="outline"size="sm">

  点击按钮

</Button>


// ❌ 避免：直接使用原生 HTML + 复杂样式

<button className="px-4 py-2 bg-blue-500 text-white rounded...">

  点击按钮

</button>

```

### 状态管理最佳实践

#### 1. **全局状态管理 (Zustand)**

- 用于跨组件的全局状态：用户信息、主题设置、应用配置等
- 创建专门的store文件，按功能模块划分
- 使用TypeScript严格类型定义
- 避免在Zustand中存储服务端数据

#### 2. **服务端状态管理 (TanStack Query)**

- 所有API数据获取使用TanStack Query
- 自动处理缓存、重试、背景更新
- 统一的loading、error状态管理
- 数据变更后自动invalidate相关查询

#### 3. **本地UI状态**

- 组件内部状态继续使用useState
- 表单状态、模态框开关、UI交互状态等
- 不需要跨组件共享的状态

#### 4. **Context API使用限制**

- 仅用于不频繁变更的状态：主题、语言设置
- 避免在Context中存储频繁变化的数据
- 考虑性能影响，合理拆分Context

```typescript

// ✅ 推荐的状态管理结构

src/

├── store/

│   ├── auth.store.ts          # 用户认证状态 (Zustand)

│   ├── ui.store.ts            # UI全局状态 (Zustand)

│   └── app.store.ts           # 应用配置 (Zustand)

├── hooks/

│   ├── queries/               # TanStack Query hooks

│   │   ├── useUsers.ts

│   │   ├── useMedia.ts

│   │   └── useDashboard.ts

│   └── mutations/             # TanStack Mutation hooks

│       ├── useCreateUser.ts

│       └── useUploadMedia.ts

├── context/

│   └── theme.context.tsx      # 主题Context (Context API)

└── services/                  # API service层

    ├── api-client.ts

    ├── users.service.ts

    └── media.service.ts

```

### API和数据处理

- API调用统一放在 `src/services/`目录
- 使用TanStack Query处理所有数据请求和缓存
- 使用Zod进行数据验证和类型推断
- HTTP客户端使用fetch API + 自定义封装
- 认证状态使用NextAuth.js + Zustand管理

### 文件上传特殊规范

- 支持拖拽上传使用react-dropzone
- 文件类型验证要严格（图片/视频）
- 上传进度要有用户反馈
- 大文件上传要有适当的错误处理
- FormData处理要正确设置Content-Type

### 性能优化

- 使用Next.js的图片优化（next/image）
- 懒加载组件使用React.lazy + Suspense
- 大列表使用虚拟滚动或分页
- API响应使用适当的缓存策略

### 安全规范

- 所有用户输入要进行验证和清理
- API请求要包含适当的认证头
- 敏感信息不要存储在客户端
- CORS配置要合理限制

### 文件结构

```

fans-next/  # 前端项目，使用Next.js + TypeScript

  src/

  ├── app/                 # Next.js App Router页面

  ├── components/          # 可复用UI组件

  ├── hooks/              # 自定义React Hooks

  ├── lib/                # 工具函数和配置

  ├── services/           # API服务层

  ├── store/              # 状态管理

  ├── styles/             # 全局样式

  └── types/              # TypeScript类型定义

fans-backend/  # 后端项目，使用NestJS + TypeScript

  prisma/

  ├── schema.prisma        # 数据库设计

  src/

  ├── auth/                # 认证模块

  ├── config/              # 配置模块

  ├── database/            # 数据库模块

  ├── media/               # 媒体模块

  ├── notifications/       # 通知模块

  ├── posts/               # 帖子模块

  ├── utils/               # 工具函数

  └── main.ts              # 入口文件

```

### shadcn/ui 专项指导

#### 安装新组件

```bash

# 添加单个组件

npx shadcn@latest add button


# 添加多个组件

npx shadcn@latest add input label textarea select


# 查看可用组件

npx shadcn@latest add

```

#### 组件导入和使用

```tsx

// 标准导入方式

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { useToast } from '@/hooks/use-toast';


// 表单示例

const { toast } = useToast();


<form className="space-y-4">

  <div className="space-y-2">

    <Label htmlFor="email">邮箱</Label>

    <Input 

id="email"

type="email"

placeholder="请输入邮箱"

className="w-full" // 可以添加自定义样式

    />

  </div>


  <Button 

type="submit"

className="w-full"

onClick={() => toast({

      title: "成功",

      description: "操作完成",

    })}

  >

    提交

  </Button>

</form>

```

#### 主题和样式定制

- 所有 shadcn/ui 组件都支持 `className` 属性进行样式定制
- 使用 Tailwind CSS 类名进行快速样式调整
- 全局主题配置在 `src/app/globals.css` 中的 CSS 变量
- 组件变体使用 `variant` 属性：`default | outline | ghost | destructive` 等

#### 错误处理和验证

```tsx

// 表单验证示例

const [errors, setErrors] = useState<Record<string, string>>({});


<Input 

className={errors.email ? "border-red-500" : ""}

aria-invalid={!!errors.email}

/>

{errors.email && (

  <p className="text-sm text-red-500">{errors.email}</p>

)}

```

### 特定功能指导

#### 图片/视频上传功能

- 使用UploadModal组件作为基础模板
- 标签管理要支持创建新标签和选择已有标签
- 分类管理对视频是必需的
- 文件验证要在前端和后端都进行
- 上传状态要有明确的用户反馈

#### 认证和授权

- 使用NextAuth.js处理用户认证
- Token刷新要自动处理
- 未认证用户要重定向到登录页
- 权限检查要在页面和API层都进行

#### 错误处理

- 网络错误要有重试机制
- 用户友好的错误提示（中文）
- 开发环境要有详细的错误日志
- 生产环境错误要进行监控

## 开发工作流

1. 新功能开发先创建类型定义
2. 实现业务逻辑和API集成
3. 创建UI组件并进行样式调整
4. 添加错误处理和加载状态
5. 进行测试和代码审查

## 文件管理规范

### 测试文件和文档文件管理

- **禁止在项目根目录创建测试文件**：所有测试文件（test-*.js, *.test.ts等）必须放在 `tests/` 目录下
- **禁止在项目根目录创建文档文件**：所有文档文件（*.md）必须放在 `docs/` 目录下，除了标准的 README.md
- **临时文件管理**：任何临时文件、示例文件、调试文件都应该放在适当的子目录中
- **保持根目录整洁**：项目根目录只应包含必要的配置文件和标准项目文件

### 文件创建规则

- 创建测试脚本时，自动放入 `tests/` 目录
- 创建文档时，自动放入 `docs/` 目录
- 如果目录不存在，先创建目录再创建文件
- 文件命名要有意义，避免临时性的名称

### 项目结构保护

```

fans-next/  # 前端项目

  ├── docs/               # 📁 所有文档文件

  ├── tests/              # 📁 所有测试文件

  ├── src/                # 源代码

  ├── public/             # 静态资源

  ├── package.json        # 项目配置

  └── README.md           # 项目说明（唯一允许的根目录md文件）


fans-backend/  # 后端项目

  ├── docs/               # 📁 所有文档文件

  ├── tests/              # 📁 所有测试文件

  ├── src/                # 源代码

  ├── prisma/             # 数据库配置

  ├── package.json        # 项目配置

  └── README.md           # 项目说明（唯一允许的根目录md文件）

```

## 代码示例模板

始终提供完整、可运行的代码示例，包含：

- 完整的import语句
- 正确的TypeScript类型定义
- 适当的错误处理
- 用户体验优化（加载状态、错误提示等）

## 问题处理和调试规范

### 系统性问题分析

- **全局视角**：遇到问题时不要只关注当前报错，要分析整个流程的依赖关系
- **问题清单**：建立完整的问题清单，系统性修复而不是头痛医头脚痛医脚
- **根因分析**：深入分析问题根本原因，避免修复一个bug又出现另一个bug
- **影响评估**：修改代码前要评估对其他功能的潜在影响

### 前后端协作调试

- **全栈思维**：遇到问题时要同时检查前端和后端，不要只关注一端
- **接口交互**：优先检查前后端接口交互和数据格式是否匹配
- **数据流分析**：分析完整的数据流，从前端请求到后端响应
- **错误定位**：使用网络面板、日志等工具准确定位问题位置

### 测试驱动开发

- **立即测试**：创建测试文件后必须立即执行，不要等用户提醒
- **完整循环**：建立"编写-测试-验证"的完整开发循环
- **失败调试**：测试失败时要继续调试直到成功，不要半途而废
- **回归测试**：修复问题后要进行完整的回归测试
- **重复犯错**：如果一个功能多次修复之后仍旧报错，要尝试从全局出发找到问题源头，不要只关注局部

### 项目特定知识点

#### 🚨 **关键坑点 - 必须严格遵守**

- **端口访问规则**：

  - ❌ **错误**：前端代码中直接访问 `http://localhost:3000/api/xxx`（这是后端直接端口）
  - ✅ **正确**：前端代码中应访问相对路径 `/api/xxx`（通过Next.js代理到后端3000端口）
  - 🔧 **调试时**：可以直接curl `http://localhost:3000/api/xxx` 验证后端，但前端代码必须用相对路径
  - 📝 **实际端口**：前端运行在3001端口，后端运行在3000端口
- **前端API服务BASE_URL配置**：

  - ❌ **错误**：`BASE_URL = '/api/media/interaction'` → 导致请求 `/api/api/media/interaction`
  - ✅ **正确**：`BASE_URL = '/media/interaction'` → 正确请求 `/api/media/interaction`
  - 📝 **原因**：Next.js代理已经添加了 `/api`前缀，服务层不需要重复添加
  - 🎯 **规则**：前端服务文件中的BASE_URL永远不要以 `/api`开头
- **媒体标签数据字段访问**：

  - ❌ **错误**：`media.tags` → 通常为空数组 `[]`
  - ✅ **正确**：`media.media_tags` → 包含实际标签关联数据
  - 📊 **数据结构**：

    ```typescript

    // ❌ media.tags - 直接标签数组（通常为空）

    media.tags: Tag[]


    // ✅ media.media_tags - 标签关联表数据（包含实际数据）

    media.media_tags: Array<{

      tag: { id: string, name: string }

    }>

    ```
  - 🔧 **正确映射**：

    ```typescript

    // ✅ 正确的标签提取方式

    tags: media.media_tags?.map(mediaTag => ({

      id: mediaTag.tag.id,

      name: mediaTag.tag.name

    })) || []

    ```
- **数据映射完整性检查**：

  - 🎯 **必须映射的字段**：在收藏页面等数据转换中，必须映射所有关键字段
  - ✅ **必须包含**：`size`, `width`, `height`, `duration`, `status`, `source`, `updated_at` 等
  - ❌ **避免硬编码**：不要使用 `size: 0`, `width: 0` 等硬编码值
  - 📋 **检查清单**：每次做数据转换时，对比API响应和接口定义，确保所有字段都正确映射

#### 📋 **基础项目信息**

- **登录接口**：本项目登录接口是 `/api/users/login`，不是 `/api/auth/login`
- **用户认证**：使用JWT认证，用户对象包含 `id` 和 `uuid` 字段
- **文件上传**：支持分片上传，图片格式最大50MB，使用multipart/form-data格式
- **API Client**：使用自定义的api-client.ts，要正确处理FormData请求
- **Content-Type**：FormData请求不要手动设置Content-Type，让浏览器自动处理
- **UI组件库**：项目已全面集成 shadcn/ui，新组件必须优先使用 shadcn/ui 组件
- **Toast消息**：使用 `useToast` hook 和 `toast()` 函数，不要使用其他消息提示方式
- **表单组件**：所有表单都应使用 shadcn/ui 的 Input、Label、Button 等组件
- **主题定制**：通过 CSS 变量定制主题，不要直接修改组件源码

### 常见问题检查清单

#### 文件上传问题

1. 检查FormData构建和字段类型
2. 检查Content-Type处理（不要手动设置multipart/form-data）
3. 检查API Client的请求处理逻辑
4. 检查并发上传逻辑和Promise处理
5. 检查上传进度更新和状态管理
6. 检查错误处理和用户反馈

#### API调用问题

1. **端口和路径检查**：

   - 确认前端请求使用3000端口，不是3001端口
   - 确认BASE_URL不重复包含 `/api`（避免 `/api/api/xxx`错误）
   - 检查接口路径是否正确（特别是登录接口）
2. **数据字段映射检查**：

   - 标签数据使用 `media.media_tags`而不是 `media.tags`
   - 确保所有关键字段都正确映射（size、width、height等）
   - 避免硬编码数值（如size: 0, width: 0）
3. 检查请求参数和响应数据格式
4. 检查认证头和token处理
5. 检查错误响应格式处理
6. 检查网络错误和超时处理

#### 状态管理问题

1. 检查React状态更新逻辑
2. 检查useEffect依赖数组
3. 检查异步操作的状态同步
4. 检查组件卸载时的清理工作

#### UI/UX问题

1. 检查加载状态和用户反馈
2. 检查错误提示的显示和清除
3. 检查响应式设计和移动端适配
4. 检查无障碍访问和键盘导航

## 重要提醒

### 🚨 **项目特定坑点预防**

- **端口混淆预防**：前端代码永远使用3000端口，3001只用于后端直接调试
- **API路径重复预防**：前端服务BASE_URL永远不以 `/api`开头，避免 `/api/api/xxx`错误
- **数据字段访问预防**：媒体标签永远使用 `media.media_tags`，不要使用 `media.tags`
- **数据映射完整性**：每次数据转换必须对比API响应，确保所有字段正确映射，禁止硬编码

### 📋 **通用开发规范**

- **严格遵守文件管理规范**：不要在项目根目录创建测试文件和文档文件
- **保持项目整洁**：定期检查和整理文件结构
- **代码质量比速度更重要**：用户体验是第一优先级
- **系统性思考**：遇到问题时要全面分析，避免频繁重现同样的bug
- **测试先行**：创建测试后立即执行，确保功能正常
- **前后端并重**：调试时要同时考虑前后端，不要只关注一端
- **FormData处理**：不要手动设置Content-Type，让浏览器自动处理boundary

## 🔗 后端API统一格式规范

### 📋 标准响应格式

**所有后端API必须返回统一格式，前端服务层必须返回完整响应对象**：

#### 1. 成功响应格式

```typescript

// 单条数据操作 (创建、更新、删除、获取详情)

{

  success: true,

  data: T,  // 具体数据对象

  message?: string  // 可选的操作结果描述

}


// 列表数据操作 (分页查询)  

{

  success: true,

  data: T[],  // 数据数组

  pagination: {

    page: number,

    limit: number,

    total: number,

    totalPages: number

  }

}


// 统计数据操作

{

  success: true,

  data: StatsObject  // 统计数据对象

}

```

#### 2. 错误响应格式

```typescript

{

  success: false,

  message: string,  // 错误信息

  data?: any  // 可选的错误详情

}

```

### ⚠️ 前端服务层处理规则

**关键原则：前端服务层必须返回完整的后端响应，不要只返回data字段**

```typescript

// ❌ 错误做法

static async getUsers(): Promise<PaginatedResponse<User>> {

  const response = await apiClient.get('/admin/users');

  return response.data; // 只返回数据数组，丢失了success和pagination

}


// ✅ 正确做法  

static async getUsers(): Promise<PaginatedResponse<User>> {

  const response = await apiClient.get('/admin/users');

  return response; // 返回完整响应 {success, data, pagination}

}

```

### 🎯 问题预防

- **响应格式检查**：前端收到数据后，先检查是否包含success字段
- **类型安全**：使用TypeScript接口确保响应格式正确
- **一致性原则**：所有admin服务都使用相同的处理方式
- **调试日志**：出现格式异常时，打印完整的response对象进行分析

### 📝 常见错误

1. **前端服务返回response.data而不是response** ← 最常见的错误
2. **后端不同接口返回格式不一致**
3. **前端处理响应时假设特定格式但实际不匹配**
