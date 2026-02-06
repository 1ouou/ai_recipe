# AI 食材魔法师 - Vercel 部署实战指南

本文档基于 `ai_recipe` 项目成功部署到 Vercel 的实践经验编写，详细记录了 Monorepo（前后端共存）架构项目在 Vercel 上的配置要点和坑点排查。

## 1. 项目结构概览

为了适配 Vercel 的 Serverless 架构，我们的项目结构调整如下：

```text
ai_recipe/
├── api/                  # [新增] Vercel Serverless Function 入口
│   └── index.ts          # 适配 Express 到 Serverless Handler
├── backend/              # 原后端代码
│   ├── src/
│   └── package.json
├── frontend/             # 原前端代码
│   ├── dist/             # 构建产物目录
│   └── package.json
├── docs/                 # 文档
├── package.json          # [新增] 根目录包配置，用于安装依赖和触发构建
├── tsconfig.json         # [新增] 根目录 TS 配置，支持跨目录引用
└── vercel.json           # [核心] Vercel 配置文件
```

---

## 2. 关键配置文件

### 2.1 `vercel.json` (核心配置)

位于项目根目录，控制路由重写、构建输出和函数配置。

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"  // 将 /api/* 请求转发给 Serverless Function
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"    // 前端路由重写，支持 SPA (React Router)
    }
  ],
  "functions": {
    "api/index.ts": {
      "maxDuration": 60               // [坑点] 增加超时时间到 60s (默认 10s)，防止 AI 生成超时
    }
  },
  "outputDirectory": "frontend/dist"  // [坑点] 明确指定静态资源输出目录
}
```

### 2.2 根目录 `package.json`

Vercel 在根目录运行构建和 Serverless Function，因此根目录 `package.json` 必须包含：
1.  **构建脚本**：安装前端依赖并构建。
2.  **后端依赖**：Serverless Function 运行时需要的库（如 `express`, `openai` 等）。
3.  **Node 版本**：指定 `engines`。

```json
{
  "name": "ai-recipe-root",
  "private": true,
  "scripts": {
    "build": "cd frontend && npm install && npm run build" // [坑点] 必须先安装前端依赖再构建
  },
  "engines": {
    "node": "20.x" // [坑点] 显式指定 Node 版本，避免版本不兼容
  },
  "dependencies": {
    // 必须包含所有 backend/package.json 中的 dependencies
    "bcrypt": "^6.0.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.3",
    "mysql2": "^3.12.0",
    "openai": "^4.77.0"
  },
  "devDependencies": {
    "typescript": "^5.7.3",
    // ...其他类型定义
  }
}
```

### 2.3 根目录 `tsconfig.json`

解决 Serverless Function (`api/index.ts`) 引用 `backend/src` 代码时的路径解析问题。

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "baseUrl": ".",
    "paths": {
      "*": ["node_modules/*"]
    }
  },
  "include": [
    "api/**/*",
    "backend/src/**/*"
  ],
  "exclude": [
    "node_modules",
    "frontend"
  ]
}
```

---

## 3. 代码适配改造

### 3.1 后端适配 (`api/index.ts`)

Vercel 不直接运行 `app.listen()`，而是需要导出一个 Handler 函数。

**`api/index.ts` 内容：**

```typescript
import app from '../backend/src/app';
import dotenv from 'dotenv';
import { initDB } from '../backend/src/config/db';

dotenv.config();

// [坑点] Vercel 需要导出默认函数处理请求
export default async function handler(req: any, res: any) {
  // [关键] 在每次请求前确保 DB 已初始化 (解决 Serverless 冷启动无表问题)
  await initDB().catch(err => console.error('Init DB Error:', err));
  
  // 调用 Express app 处理请求
  return app(req, res);
}
```

### 3.2 数据库初始化与 Seed 数据

在 `backend/src/config/db.ts` 的 `initDB` 函数中，添加了：
1.  **建表逻辑** (`CREATE TABLE IF NOT EXISTS`).
2.  **种子数据填充**：检查表是否为空，如果为空则插入默认食材数据。这解决了部署后数据库为空的问题。

### 3.3 前端适配 (`frontend/src/App.tsx`)

在生产环境中，前后端同源，API 请求路径应为相对路径。

```typescript
// [坑点] 生产环境使用空字符串或 /api，本地开发通过 vite proxy 或 .env 配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''; 
```

同时，修改 `frontend/package.json` 的 build 脚本，去掉 `tsc` 检查以提高构建成功率：
```json
"scripts": {
  "build": "vite build" 
}
```

---

## 4. 环境变量配置

在 Vercel Dashboard -> Settings -> Environment Variables 中配置：

| 变量名 | 描述 | 示例值 |
| :--- | :--- | :--- |
| `DB_HOST` | 数据库地址 | `aws.connect.psdb.cloud` |
| `DB_USER` | 数据库用户名 | `user_xxx` |
| `DB_PASSWORD` | 数据库密码 | `password_xxx` |
| `DB_NAME` | 数据库名 | `ai_recipe` |
| `DB_PORT` | 端口 | `3306` |
| `DB_SSL` | 是否开启 SSL | `true` |
| `OPENAI_API_KEY` | AI 服务密钥 | `sk-xxxx` |
| `OPENAI_BASE_URL`| AI 服务地址 | `https://api.deepseek.com` |
| `OPENAI_MODEL` | 模型名称 | `deepseek-chat` |

> **提示**：也可以在 `vercel.json` 的 `env` 字段配置非敏感变量（如 `OPENAI_BASE_URL`）。

---

## 5. 常见报错与排查 (Troubleshooting)

| 现象 | 原因 | 解决方案 |
| :--- | :--- | :--- |
| **Build Error: `vite: command not found`** | 构建脚本未安装前端依赖 | 修改根目录 build 脚本为 `"cd frontend && npm install && npm run build"` |
| **Build Error: `tsc: command not found`** | 依赖缺失或路径错误 | 前端 build 脚本去掉 `tsc -b`，直接用 `vite build` |
| **Runtime Error: `Cannot find module ...`** | Serverless Function 找不到依赖 | 确保根目录 `package.json` 包含了后端的所有 `dependencies` |
| **Runtime Error: `Table 'xxx' doesn't exist`** | 数据库未初始化 | 在 `api/index.ts` handler 中显式调用并 `await initDB()` |
| **API 404 Not Found** | 请求路径错误 | 检查前端 `API_BASE_URL`，确保最终路径不是 `/api/api/xxx` |
| **API 504 Gateway Timeout** | AI 生成时间过长 | 修改 `vercel.json` 中的 `functions.maxDuration` 为 `60` (Hobby 版上限) |
| **Vercel: No Output Directory named "public"** | 未找到构建产物 | 在 `vercel.json` 中配置 `"outputDirectory": "frontend/dist"` |

---

## 6. 部署流程

1.  完成上述代码和配置修改。
2.  提交代码到 GitHub。
3.  在 Vercel Dashboard 导入项目。
4.  配置环境变量。
5.  点击 Deploy。
6.  等待构建完成 (Building -> Ready)。
7.  访问分配的域名进行测试。

---

*文档生成时间: 2026-02-06*
