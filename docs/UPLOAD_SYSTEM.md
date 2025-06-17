# 粉丝社区上传系统

## 概述

本项目实现了一个完整的企业级文件上传系统，支持大文件切片上传、断点续传、批量上传等高级功能。

## 功能特性

### 🚀 核心功能
- **切片上传**: 大文件自动分片，默认5MB分片大小
- **断点续传**: 网络中断后可继续上传
- **并发控制**: 支持多分片并发上传，默认3个并发
- **秒传功能**: 通过MD5检查实现相同文件秒传
- **批量上传**: 支持同时上传多个文件
- **实时进度**: 精确的上传进度监控
- **错误重试**: 自动重试和手动重试机制

### 🎨 用户体验
- **拖拽上传**: 支持文件拖拽到上传区域
- **标签管理**: 创建和选择文件标签
- **分类选择**: 视频文件支持分类选择
- **响应式设计**: 适配不同设备屏幕
- **状态反馈**: 清晰的上传状态和错误提示

### 🔧 技术特点
- **TypeScript**: 完整的类型安全
- **模块化设计**: 清晰的代码结构
- **内存优化**: 高效的文件处理
- **网络异常处理**: 完善的错误处理机制

## 架构设计

### 前端架构

```
src/
├── components/
│   ├── upload/
│   │   ├── AdvancedUploadModal.tsx    # 高级上传模态框
│   │   └── UploadProgress.tsx         # 上传进度组件
│   ├── ImageUploadButton.tsx          # 图片上传按钮
│   ├── VideoUploadButton.tsx          # 视频上传按钮
│   └── UploadModal.tsx                # 兼容性包装器
├── lib/
│   ├── upload/
│   │   └── file-uploader.ts           # 核心上传器
│   └── utils/
│       └── format.ts                  # 格式化工具
├── services/
│   └── upload.service.ts              # 上传API服务
└── types/
    └── upload.ts                      # 类型定义
```

### 后端架构

```
src/upload/
├── controllers/
│   └── upload.controller.ts           # 上传控制器
├── services/
│   ├── upload.service.ts              # 上传服务
│   ├── local-storage.service.ts       # 本地存储服务
│   ├── oss-storage.service.ts         # OSS存储服务
│   └── storage-factory.service.ts     # 存储工厂
├── dto/                               # 数据传输对象
├── interfaces/                        # 接口定义
└── utils/                            # 工具函数
```

## 使用方法

### 基础使用

```tsx
import { AdvancedUploadModal } from '@/components/upload/AdvancedUploadModal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  const handleUploadComplete = (mediaIds: string[]) => {
    console.log('上传完成:', mediaIds);
    setShowModal(false);
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        上传文件
      </button>
      
      <AdvancedUploadModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type="both" // 'image' | 'video' | 'both'
        onUploadComplete={handleUploadComplete}
      />
    </>
  );
}
```

### 使用上传按钮组件

```tsx
import { ImageUploadButton, VideoUploadButton } from '@/components';

function MyComponent() {
  const handleUploadComplete = (mediaIds: string[]) => {
    console.log('上传完成:', mediaIds);
  };

  return (
    <div>
      <ImageUploadButton onUploadComplete={handleUploadComplete} />
      <VideoUploadButton onUploadComplete={handleUploadComplete} />
    </div>
  );
}
```

### 直接使用 FileUploader

```tsx
import { fileUploader } from '@/lib/upload/file-uploader';

async function uploadFile(file: File) {
  const taskId = await fileUploader.createUploadTask({
    file,
    title: '我的文件',
    description: '文件描述',
    tags: ['标签1', '标签2'],
    onProgress: (progress) => {
      console.log(`上传进度: ${progress}%`);
    },
    onComplete: (mediaId) => {
      console.log(`上传完成: ${mediaId}`);
    },
    onError: (error) => {
      console.error(`上传失败: ${error}`);
    },
  });

  return taskId;
}
```

## API 接口

### 初始化上传
```
POST /api/upload/init
```

### 批量初始化
```
POST /api/upload/batch-init
```

### 上传分片
```
POST /api/upload/chunk
```

### 合并分片
```
POST /api/upload/merge
```

### 获取进度
```
GET /api/upload/progress/:uploadId
```

### 取消上传
```
DELETE /api/upload/:uploadId
```

## 配置选项

### FileUploader 配置

```typescript
interface ExtendedUploadOptions extends UploadOptions {
  chunkSize?: number;      // 分片大小，默认5MB
  concurrency?: number;    // 并发数，默认3
}
```

### 环境变量

```env
# 后端配置
UPLOAD_CHUNK_SIZE=5242880          # 分片大小 (5MB)
UPLOAD_MAX_CONCURRENT=3            # 最大并发数
UPLOAD_TEMP_DIR=./uploads/temp     # 临时文件目录
UPLOAD_FINAL_DIR=./uploads/files   # 最终文件目录

# 存储配置
STORAGE_TYPE=local                 # 存储类型: local | oss
OSS_ACCESS_KEY_ID=your_key         # OSS访问密钥
OSS_ACCESS_KEY_SECRET=your_secret  # OSS密钥
OSS_BUCKET=your_bucket             # OSS存储桶
OSS_REGION=your_region             # OSS区域
```

## 数据库模型

```prisma
model Upload {
  id              String        @id @default(cuid())
  filename        String
  originalName    String
  fileSize        BigInt
  fileType        FileType
  fileMd5         String        @unique
  chunkSize       Int           @default(5242880)
  totalChunks     Int
  uploadedChunks  Int[]         @default([])
  status          UploadStatus  @default(PENDING)
  uploadPath      String?
  finalPath       String?
  userId          String
  mediaId         String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  expiresAt       DateTime?

  user            User          @relation(fields: [userId], references: [id])
  media           Media?        @relation(fields: [mediaId], references: [id])

  @@map("uploads")
}
```

## 性能优化

### 前端优化
- 使用 Web Workers 计算 MD5（可选）
- 分片并发上传控制
- 内存使用优化
- 组件懒加载

### 后端优化
- 分片文件流式处理
- 临时文件自动清理
- 数据库连接池
- 文件存储优化

## 错误处理

### 常见错误类型
- 网络连接错误
- 文件类型不支持
- 文件大小超限
- 存储空间不足
- 权限验证失败

### 错误恢复机制
- 自动重试机制
- 断点续传
- 用户手动重试
- 错误状态清理

## 测试

### 运行测试页面
```bash
# 访问测试页面
http://localhost:3000/upload-test
```

### 功能测试
- 单文件上传测试
- 批量文件上传测试
- 大文件上传测试
- 网络中断测试
- 错误恢复测试

## 部署注意事项

### 前端部署
- 确保 API 地址配置正确
- 检查文件大小限制
- 配置 CDN 加速

### 后端部署
- 配置文件上传目录权限
- 设置合适的临时文件清理策略
- 配置负载均衡
- 监控存储空间使用

## 扩展功能

### 计划中的功能
- [ ] 图片压缩和缩略图生成
- [ ] 视频转码和预览
- [ ] 上传队列管理
- [ ] 上传统计和分析
- [ ] 文件版本管理

### 自定义扩展
- 自定义存储后端
- 自定义文件处理器
- 自定义进度回调
- 自定义错误处理

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License 