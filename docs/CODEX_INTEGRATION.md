# Codex Integration Notes (fans-next)

> 本文档用于指导 Codex 与 fans-next 项目（前端）集成。
> 项目的主要开发规范、风格与约束均定义于根目录的 `.cursorrules` 文件中。
> Codex 必须严格遵守 `.cursorrules` 作为最高优先级。

---

## 🧭 项目核心信息

- **框架**：Next.js 15 + React 19 + TypeScript
- **样式系统**：Tailwind CSS + PostCSS
- **UI组件库**：shadcn/ui（主要） + Headless UI（复杂交互）
- **状态管理**：Zustand + TanStack Query + Context API
- **认证机制**：NextAuth.js
- **API 服务层**：fetch 封装 + 完整响应对象（`success/data/pagination`）
- **设计风格**：极简、留白、light shadow、轻动画
- **后端关联项目**：fans-backend (NestJS + Prisma + PostgreSQL)

---

## ⚙️ Codex 工作边界

1. **项目作用域**

   - Codex 仅可在 `fans-next/` 下运行与写入。
   - **禁止访问或修改** `fans-backend/`、仓库上层目录或其他项目。
   - 所有生成的文档、测试文件必须放在规定目录下：
     ```
     docs/    # 文档文件
     tests/   # 测试文件
     ```

     根目录仅允许 `README.md` 存在。
2. **输出语言与命名规则**

   - 代码、变量、函数名：使用英文。
   - 注释、文档、解释说明：使用中文。
   - 提交信息、日志说明：中文（简洁明了）。
3. **写入规范**

   - 任何写入前必须先输出 `diff`。
   - diff 总行数 ≤ 200 行 / 每批次。
   - 未经确认不得写入文件。
   - 不允许自动生成 `.md` 文件到根目录或非 `docs/` 目录。

---

## 🧩 核心规则与约束

### API 调用规则

- 所有请求使用 **相对路径 `/api/*`**。
- 服务层 `BASE_URL` **不以 `/api` 开头**，避免出现 `/api/api/...`。
- FormData 上传时 **不要手动设置 `Content-Type`**（浏览器会自动处理）。

### 数据与响应规则

- 后端返回结构：
  ```ts
  {
    success: boolean;
    data?: any;
    pagination?: { page: number; limit: number; total: number; totalPages: number };
    message?: string;
  }
  ```


* **服务层函数必须返回 ** **完整响应对象** **（含 **success** 字段），** **不可只返回 response.data** **。**
* **媒体标签字段使用 **media.media_tags** 提取，不使用 **media.tags**。**

### **组件与 UI 规范**

* **UI 优先级**：shadcn/ui > Headless UI > 原生 HTML。
* 组件风格：极简 + 留白 + 轻阴影。
* Tailwind 类名需简洁清晰，不得重复堆叠。
* 动画轻量，建议用 CSS transition / Framer Motion。

### **状态管理**

* **Zustand**：全局 UI、主题、用户偏好等状态。
* **TanStack Query**：服务端数据（自动缓存与刷新）。
* **Context API**：仅用于不频繁变化的状态（主题/语言）。

## **🧠 Codex 应遵循的开发流程**

1. **理解需求**
   * 根据任务描述与 **.cursorrules** 判断模块归属（页面 / 组件 / hook / service）。
2. **生成前**
   * 输出变更计划与受影响文件列表。
   * 先给出 diff（≤200 行），再写入。
3. **代码要求**
   * 每个功能均包含完整的导入语句、类型定义、中文注释与错误处理。
   * 确保交互体验友好，错误信息清晰。
4. **测试**
   * 若修改关键逻辑（路径拼接、响应格式、媒体映射），需在 **tests/** 添加最小用例。

---

## **🚫 禁止行为**

* **不得修改 **.cursorrules**。**
* 不得修改根目录以外项目文件。
* 不得新建 **.md** 文件到项目根目录（除 README.md）。
* **不得写入 **node_modules/**, **.next/**, **dist/**, **coverage/**, **public/generated/**。**
* 不得生成超过 500 行的 patch（需拆分批次）。

## **🔗 fans-backend 协作注意事项**

* **登录接口路径：**/api/users/login
* 所有媒体、上传、认证模块均通过 fans-backend 提供的 API。
* 如需前后端联动，请：
  1. 在 fans-next 先实现前端逻辑；
  2. 再在 fans-backend 单独请求协同更改；
  3. 保持路径 **/api/*** 一致。
