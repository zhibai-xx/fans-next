# 代码审查检查清单

## 🔍 状态管理迁移后的常见错误检查

### 📋 引用错误检查清单

在修改任何页面或组件后，请按照此清单进行检查：

#### 1. **导入语句检查** ✅
- [ ] 所有使用的服务类都已正确导入
- [ ] 所有使用的组件都已正确导入  
- [ ] 所有使用的 hooks 都已正确导入
- [ ] 所有使用的类型定义都已正确导入

#### 2. **TanStack Query 迁移检查** ✅
- [ ] `hasMore` → `hasNextPage`
- [ ] `loadMore()` → `fetchNextPage()`
- [ ] `isLoading` → `isLoading` (来自 useQuery)
- [ ] `isFetching` → `isFetchingNextPage` (对于无限查询)
- [ ] `loadRecords()` → `refetch()` 或 `handleRefresh()`

#### 3. **Mutation 状态检查** ✅
- [ ] `isDeleting` → `deleteMutation.isPending`
- [ ] `isUpdating` → `updateMutation.isPending`
- [ ] `isCreating` → `createMutation.isPending`
- [ ] 所有 mutation 状态都使用 `.isPending`, `.isError`, `.isSuccess`

#### 4. **服务类方法检查** ✅
- [ ] `UploadRecordService` 已导入
- [ ] `MediaService` 已导入
- [ ] `UserService` 已导入
- [ ] 所有使用的静态方法都存在于对应的服务类中

#### 5. **事件处理函数检查** ✅
- [ ] 所有 `onClick` 处理函数都已定义
- [ ] 所有 `onChange` 处理函数都已定义
- [ ] 所有 `onSubmit` 处理函数都已定义
- [ ] 使用 `useCallback` 优化的函数依赖项正确

### 🛠️ 修复模式参考

#### 常见错误修复模式：

```typescript
// ❌ 错误：未导入服务
<Badge className={UploadRecordService.getStatusColor(status)}>

// ✅ 正确：导入服务
import { UploadRecordService } from '@/services/upload-record.service';
<Badge className={UploadRecordService.getStatusColor(status)}>
```

```typescript
// ❌ 错误：使用旧的状态变量
{hasMore && <Button onClick={loadMore}>加载更多</Button>}

// ✅ 正确：使用 TanStack Query 状态
{hasNextPage && <Button onClick={() => fetchNextPage()}>加载更多</Button>}
```

```typescript
// ❌ 错误：使用未定义的状态
<Button disabled={isDeleting}>删除</Button>

// ✅ 正确：使用 mutation 状态
<Button disabled={deleteMutation.isPending}>删除</Button>
```

### 🧪 测试验证步骤

#### 每次修改后必须执行：

1. **Linter 检查**
   ```bash
   # 检查特定文件的 linter 错误
   npm run lint src/path/to/modified-file.tsx
   ```

2. **TypeScript 编译检查**
   ```bash
   # 检查 TypeScript 编译错误
   npm run type-check
   ```

3. **运行时错误检查**
   ```bash
   # 运行对应的测试脚本
   node tests/test-[page-name]-fix.js
   ```

4. **浏览器控制台检查**
   - 打开开发者工具
   - 查看 Console 面板是否有红色错误
   - 特别关注 `ReferenceError` 和 `is not defined` 错误

### 📝 修改流程

#### 推荐的修改流程：

1. **修改前**
   - [ ] 理解当前代码结构
   - [ ] 识别需要修改的部分
   - [ ] 检查相关的依赖和导入

2. **修改中**
   - [ ] 按照状态管理最佳实践修改
   - [ ] 确保所有引用都有对应的导入
   - [ ] 使用正确的 TanStack Query 和 Zustand API

3. **修改后**
   - [ ] 运行 linter 检查
   - [ ] 运行 TypeScript 检查
   - [ ] 运行测试脚本验证
   - [ ] 在浏览器中手动测试

### 🚨 高风险操作

#### 以下操作容易引起引用错误，需要特别注意：

1. **删除或重命名变量**
   - 确保所有使用该变量的地方都已更新

2. **修改导入路径**
   - 确保新路径正确且文件存在

3. **重构函数名**
   - 使用 IDE 的重命名功能，或手动检查所有引用

4. **修改组件 props**
   - 确保父组件传递正确的 props

5. **状态管理迁移**
   - 按照迁移清单逐一检查
   - 不要遗漏任何状态变量或方法

### 📚 参考资源

- [TanStack Query 文档](https://tanstack.com/query/latest)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)
- [项目状态管理规范](/.cursorrules)

---

**记住：预防胜于治疗。花时间仔细检查比事后修复错误更高效！** 🎯