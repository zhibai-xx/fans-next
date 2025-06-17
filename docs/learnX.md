## Next

### 动态路由

video文件夹 -> [id]文件夹 -> page.tsx ->

/video/123 -> 通过params获取id

### 页面跳转

```js
<Link href={`/videos/${video.id}`} className={`group ${className}`}>
</Link>
```

### layout 布局

layout.tsx 内部的{ children } 会自动渲染同级的page.tsx

### 服务器组件、客户端组件

默认都是服务器组件，即在服务器请求接口不会发布js，所以速度极快。

在头部添加 `"use client"`即可变成客户端组件，就能使用 useState、effect这些了，但同时也**无法**请求服务器数据。

### 元数据

metadata：seo优化，添加title、description、openGraph等内容。

### 缓存

静态渲染、动态渲染 页面
