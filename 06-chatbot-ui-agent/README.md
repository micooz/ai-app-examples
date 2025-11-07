# 06-chatbot-ui-agent

带联网搜索功能的 Web UI 聊天机器人（Agent）

# 功能特性

- 使用免费 Bing 搜索接口
- 基础的 Agentic 范式实现
- 基础的上下文管理
- 前端 Markdown 渲染、自定义消息渲染

# 配置 API Key

此项目使用通义千问模型服务接口，请先阅读 [README.md](../README.md#模型服务和-api-key-说明) 获取 API Key。

然后，在此目录下创建 `.env` 文件，并添加你的 API Key：

```bash
API_KEY=sk-xxx
```

# 运行项目

在此目录下，执行以下命令：

```bash
npm install

# 同时启动前后端
npm run dev

# 或是分别启动前后端
npm run dev:ui
npm run dev:server
```

# 调试说明

访问下面的接口查看当前上下文：

http://localhost:5173/api/context

# 视频讲解

https://www.bilibili.com/video/BV18G2TBHENq/
