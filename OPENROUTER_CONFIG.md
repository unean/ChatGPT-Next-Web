# OpenRouter 配置指南

## 简介

本项目已添加对 OpenRouter 的支持。OpenRouter 是一个统一的 API 网关，让你可以通过单一接口访问多个 AI 模型提供商。

## 配置方法

### 1. 环境变量配置

在你的 `.env.local` 文件中添加以下配置：

```bash
# OpenRouter API 配置
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_URL=https://openrouter.ai/api  # 可选，默认使用此 URL
```

### 2. 获取 API Key

1. 访问 [OpenRouter 官网](https://openrouter.ai/)
2. 注册账号并登录
3. 在设置页面生成 API Key
4. 将 API Key 添加到环境变量中

### 3. 客户端配置

如果你想在客户端使用自定义配置：

1. 打开设置页面
2. 找到 OpenRouter 配置区域
3. 输入你的 API Key 和自定义 URL（可选）
4. 保存配置

## 支持的模型

OpenRouter 支持多个模型提供商的模型，包括但不限于：

- OpenAI (gpt-4o, gpt-4o-mini, gpt-3.5-turbo)
- Anthropic (claude-3.5-sonnet, claude-3-opus)
- Google (gemini-pro-1.5, gemini-flash-1.5)
- Meta (llama-3.1-70b-instruct, llama-3.1-405b-instruct)
- DeepSeek (deepseek-chat, deepseek-coder)
- Mistral AI (mistral-large, mistral-medium)
- Qwen (qwen-2.5-72b-instruct)
- xAI (grok-2)

## 使用方法

1. 配置好 API Key 后，在模型选择器中选择 OpenRouter 提供商
2. 选择你想使用的模型
3. 开始对话

## 注意事项

- OpenRouter 需要有效的 API Key 才能使用
- 不同模型的定价可能不同，请查看 OpenRouter 官网了解详情
- 确保你的账户有足够的余额

## 故障排除

### 无法连接到 OpenRouter

1. 检查 API Key 是否正确
2. 确认网络连接正常
3. 检查 OpenRouter 服务状态

### 模型列表为空

1. 确保 API Key 有效
2. 检查浏览器控制台是否有错误信息
3. 尝试刷新页面

## 更多信息

- [OpenRouter 官方文档](https://openrouter.ai/docs)
- [OpenRouter API 参考](https://openrouter.ai/docs/api-reference)

