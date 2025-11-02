# Link Saver - Cloudflare Worker & Browser Extension

![Project Banner](https://user-images.githubusercontent.com/1582299/148220021-096d4943-525b-4811-9a2c-29b35a399434.png)

这是一个功能强大且完全由您自己托管的书签/链接保存工具。它由一个部署在 Cloudflare 上的后端服务和一个轻量级的浏览器扩展组成，让您可以一键保存、标记和管理您在网络上发现的任何有趣内容。

---

## ✨ 功能特性

*   **🚀 一键保存**: 通过浏览器扩展，在任何网页上一键即可快速保存。
*   **✍️ 自动抓取元数据**: 自动获取并保存网站的标题、描述和图标 (favicon)。
*   **🏷️ 标签系统**: 为每个链接添加自定义标签（如 `work`, `tech`, `reading`），方便分类。
*   **🔍 全文搜索**: 在您的个人主页上，通过标题或描述快速搜索已保存的链接。
*   **🔒 安全可控**: 所有写入操作（添加、编辑、删除）均由您自己的密钥保护。
*   **🌐 公开可读 (可选)**: 采用“公开可读，私有可写”的安全模型，方便您将链接列表作为公开分享页面，同时保证管理操作的安全性。
*   **☁️ 无服务器 & 免费托管**: 完全基于 Cloudflare Workers 和 KV 存储，享受 Cloudflare 慷慨的免费套餐。
*   **🧩 易于部署**: 只需一个 Cloudflare 账户和几个简单的步骤即可拥有自己的服务。

---

## 🏗️ 项目架构

本项目由两个核心部分组成：

1.  **Cloudflare Worker (后端)**:
    *   使用 Cloudflare Workers 作为无服务器后端。
    *   提供了一系列 RESTful API 端点来处理数据（`GET`, `POST`, `PUT`, `DELETE`）。
    *   使用 Cloudflare KV 作为持久化数据库来存储链接数据。
    *   渲染一个动态的 HTML 页面，用于展示、搜索和管理所有已保存的链接。

2.  **浏览器扩展 (客户端)**:
    *   一个轻量级的浏览器扩展（兼容 Chrome 及其他 Chromium 内核浏览器）。
    *   获取当前页面的元数据。
    *   提供一个弹出窗口，让用户可以添加标签并发送数据到 Cloudflare Worker 后端。
    *   提供一个设置页面，用于配置 Worker URL 和安全密钥。

---

## 🔧 技术栈

*   **后端**: Cloudflare Workers, Cloudflare KV
*   **前端/扩展**: Vanilla JavaScript, HTML, CSS (WebExtensions API)

---

## 🚀 安装与部署指南

请按照以下步骤来部署您自己的 Link Saver 服务。

### **第一部分：设置 Cloudflare Worker (后端)**

1.  **创建 Worker**:
    *   登录您的 Cloudflare 仪表板。
    *   导航到 **Workers & Pages** -> **Create application** -> **Create Worker**。
    *   为您的 Worker 命名（例如 `my-link-saver`），然后点击 **Deploy**。

2.  **创建 KV 命名空间**:
    *   在 **Workers & Pages** 页面，选择 **KV** 选项卡。
    *   点击 **Create a namespace**，为它命名（例如 `LINKS_DB`）。

3.  **绑定 KV 到 Worker**:
    *   回到您的 Worker，点击 **Settings** -> **Variables**。
    *   在 **KV Namespace Bindings** 部分，点击 **Add binding**。
        *   **Variable name**: `LINKS_DB`
        *   **KV namespace**: 选择您刚刚创建的 `LINKS_DB`。
    *   点击 **Save and deploy**。

4.  **设置安全密钥**:
    *   在同一页的 **Environment Variables** 部分，点击 **Add variable**。
        *   **Variable name**: `AUTH_SECRET`
        *   **Value**: 输入一个您自己设定的、足够复杂的密码（例如 `my-super-secret-key-12345`）。**请务必记下这个值！**
    *   点击 **Save and deploy**。

5.  **部署代码**:
    *   回到您的 Worker，点击 **Edit code**。
    *   将本仓库中的 `worker.js` 文件里的所有代码复制并粘贴到编辑器中，完全覆盖原有代码。
    *   点击 **Save and deploy**。

> **✅ 后端部署完成！** 您现在可以访问您的 Worker URL (例如 `my-link-saver.your-name.workers.dev`)，虽然还没有数据，但页面应该可以正常加载。

### **第二部分：设置浏览器扩展 (客户端)**

1.  **获取代码**:
    *   将本仓库克隆或下载到您的本地电脑。

2.  **加载扩展**:
    *   打开 Chrome 浏览器，在地址栏输入 `chrome://extensions`。
    *   打开右上角的 **“开发者模式”** 开关。
    *   点击 **“加载已解压的扩展程序”**，然后选择您下载的仓库文件夹中的 `extension` 目录。

3.  **配置扩展**:
    *   在浏览器工具栏上，右键点击新出现的 Link Saver 图标，选择 **“选项”**。
    *   在打开的设置页面中：
        *   **Cloudflare Worker URL**: 填入您的 Worker 的完整 API 地址。**重要**: 必须以 `/api/links` 结尾，例如：`https://my-link-saver.your-name.workers.dev/api/links`
        *   **Secret Key**: 填入您在后端第 4 步中设置的 `AUTH_SECRET` 的值。
    *   点击 **Save**。

> **✅ 全部完成！** 您的 Link Saver 服务现在已经准备就绪。

---

## 💡 如何使用

1.  **保存链接**:
    *   浏览到任何您想保存的网站。
    *   点击浏览器工具栏上的 Link Saver 图标。
    *   在弹出的窗口中，您可以选择性地添加一些用逗号分隔的标签。
    *   点击 **Save Link**。

2.  **查看和管理**:
    *   直接访问您的 Worker URL (例如 `my-link-saver.your-name.workers.dev`)。
    *   您的所有链接都会以卡片形式展示出来。
    *   使用顶部的搜索框进行实时搜索。
    *   点击标签可以筛选链接。
    *   若要 **编辑** 或 **删除** 链接，点击卡片上的相应按钮，系统会弹窗要求您输入安全密钥以完成操作。

---

## 🤝 贡献

欢迎任何形式的贡献！如果您有好的想法或发现了 Bug，请随时提交 Pull Request 或创建 Issue。

## 📄 许可证

本项目采用 [MIT License](./LICENSE) 授权。
