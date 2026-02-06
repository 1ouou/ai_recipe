# 🚀 项目部署指南

本指南将帮助你将 AI 全栈项目（前后端分离）部署到线上环境。我们将使用 **Render** 部署后端和数据库，使用 **Vercel** 部署前端。

---

## 📦 1. 准备工作

确保你已经完成了以下步骤：
1. 代码已经提交到 GitHub 仓库（建议将 frontend 和 backend 放在同一个仓库的根目录下，或者分别作为两个仓库）。
2. 拥有 [Render](https://render.com/) 和 [Vercel](https://vercel.com/) 的账号（可以直接用 GitHub 登录）。

---

## 🛠️ 2. 部署后端 (Render)

Render 是一个非常方便的一站式云服务平台，支持 Node.js 服务和 MySQL 数据库。

### 2.1 创建 MySQL 数据库
1. 登录 Render Dashboard。
2. 点击 **"New +"** -> **"PostgreSQL"** (Render 的 MySQL 目前是 Beta 版，或者我们可以使用 **Railway** 或 **PlanetScale** 提供的免费 MySQL。**注意：** 如果 Render 没有免费 MySQL，推荐使用 **Railway** 或 **Aiven** 的免费 MySQL 服务)。
   - *推荐方案*：在 [Aiven](https://aiven.io/) 注册一个免费账号，创建一个 MySQL 数据库，获取连接信息（Host, Port, User, Password, Database Name）。

### 2.2 部署 Node.js 后端服务
1. 在 Render Dashboard 点击 **"New +"** -> **"Web Service"**。
2. 连接你的 GitHub 仓库。
3. **设置配置信息**：
   - **Name**: `ai-recipe-backend` (或你喜欢的名字)
   - **Region**: 选择离你最近的（如 Singapore）
   - **Branch**: `main`
   - **Root Directory**: `backend` (非常重要！因为我们的后端代码在 backend 目录下)
   - **Runtime**: `Docker` (我们已经准备好了 Dockerfile，Render 会自动识别)
   - **Instance Type**: Free

4. **设置环境变量 (Environment Variables)**：
   点击 "Advanced" -> "Environment Variables"，添加以下变量：
   - `DB_HOST`: 你的数据库主机地址
   - `DB_USER`: 数据库用户名
   - `DB_PASSWORD`: 数据库密码
   - `DB_NAME`: 数据库名称
   - `DB_PORT`: 数据库端口 (通常是 3306)
   - `OPENAI_API_KEY`: 你的 OpenAI API Key
   - `JWT_SECRET`: 设置一个复杂的字符串用于加密 Token

5. 点击 **"Create Web Service"**。
6. 等待部署完成。部署成功后，你会获得一个后端 URL，例如 `https://ai-recipe-backend.onrender.com`。**记下这个 URL**。

---

## 🌐 3. 部署前端 (Vercel)

Vercel 是部署 React/Vite 应用的最佳选择。

1. 登录 Vercel Dashboard。
2. 点击 **"Add New..."** -> **"Project"**。
3. 导入你的 GitHub 仓库。
4. **配置项目**：
   - **Framework Preset**: Vite (Vercel 通常会自动识别)
   - **Root Directory**: 点击 Edit，选择 `frontend` 目录。
5. **设置环境变量**：
   - 展开 **"Environment Variables"**。
   - 添加 Key: `VITE_API_BASE_URL`
   - 添加 Value: 你的后端 URL (步骤 2.2 中获取的 URL，不要带最后的斜杠，例如 `https://ai-recipe-backend.onrender.com`)
6. 点击 **"Deploy"**。

---

## ✅ 4. 验证与测试

1. 访问 Vercel 生成的前端域名（例如 `https://ai-recipe-frontend.vercel.app`）。
2. 打开浏览器的开发者工具 (F12) -> Network 面板。
3. 尝试登录或生成食谱。
4. 观察请求是否成功发送到了你的后端地址。

### 常见问题
- **跨域问题 (CORS)**: 后端代码中已经配置了 `app.use(cors())`，通常可以直接工作。如果遇到问题，可能需要将 `cors()` 配置为允许特定的前端域名。
- **数据库连接失败**: 检查 Render/Aiven 的数据库是否允许公网访问，以及环境变量是否填写正确。
- **构建失败**: 检查 Vercel/Render 的日志，通常是因为路径配置错误或依赖安装失败。

祝你部署顺利！🚀
