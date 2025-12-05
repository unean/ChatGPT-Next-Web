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

OpenRouter 支持**自动获取模型列表**功能！系统会通过 [OpenRouter Models API](https://openrouter.ai/docs/api/api-reference/models/get-models) 动态获取所有可用的模型。

### 内置的默认模型

如果无法获取模型列表，系统会使用以下内置模型：

- OpenAI (openai/gpt-4o, openai/gpt-4o-mini, openai/gpt-3.5-turbo)
- Anthropic (anthropic/claude-3.5-sonnet, anthropic/claude-3-opus)
- Google (google/gemini-pro-1.5, google/gemini-flash-1.5)
- Meta (meta-llama/llama-3.1-70b-instruct, meta-llama/llama-3.1-405b-instruct)
- DeepSeek (deepseek/deepseek-chat, deepseek/deepseek-coder)
- Mistral AI (mistralai/mistral-large, mistralai/mistral-medium)
- Qwen (qwen/qwen-2.5-72b-instruct)
- xAI (x-ai/grok-2)

### 自动获取的模型

配置好 API Key 后，系统会自动从 OpenRouter 获取所有可用的模型列表，包括：
- 最新发布的模型
- 各个提供商的所有可用模型
- 每个模型的详细信息（context length、pricing 等）

注意：系统会自动过滤出支持文本聊天功能的模型

## 使用方法

1. 配置好 API Key 后，OpenRouter 的模型会**自动显示在模型列表的最顶部**
2. 在模型选择器中可以看到所有 OpenRouter 提供的模型
3. 选择你想使用的模型（格式为 `provider/model-name`）
4. 开始对话

> 💡 **提示**：OpenRouter 提供商的排序优先级为 0，会优先显示在所有其他提供商之前。

### 正确的模型选择示例

在模型选择器中，OpenRouter 的模型应该显示为：

```
📋 OpenRouter
  ├─ openai/gpt-4o
  ├─ openai/gpt-4o-mini
  ├─ anthropic/claude-3.5-sonnet
  ├─ google/gemini-pro-1.5
  └─ ...更多模型
```

**重要**：模型名称必须包含斜杠 `/`，这是 OpenRouter 的标准格式。

## 注意事项

- OpenRouter 需要有效的 API Key 才能使用
- 不同模型的定价可能不同，请查看 OpenRouter 官网了解详情
- 确保你的账户有足够的余额

## 故障排除

### ❌ 错误："invalid model ID"

这个错误表示模型 ID 格式不正确。OpenRouter 要求模型 ID 必须使用 `provider/model-name` 格式。

**解决方法：**

1. **检查模型格式**：确保选择的模型 ID 包含斜杠 `/`
   - ✅ 正确：`openai/gpt-4o`
   - ✅ 正确：`anthropic/claude-3.5-sonnet`
   - ❌ 错误：`gpt-4o`（缺少提供商前缀）
   - ❌ 错误：`claude-3.5-sonnet`（缺少提供商前缀）

2. **使用自动获取的模型列表**：系统会自动从 OpenRouter 获取正确格式的模型列表，建议直接从列表中选择

3. **检查浏览器控制台**：打开开发者工具，查看详细的错误日志：
   ```
   [OpenRouter] Original model ID: xxx
   ```

4. **重新加载模型列表**：刷新页面，让系统重新获取最新的模型列表

### 无法连接到 OpenRouter

1. 检查 API Key 是否正确
2. 确认网络连接正常
3. 检查 OpenRouter 服务状态

### 模型列表为空

1. 确保 API Key 有效
2. 检查浏览器控制台是否有错误信息
3. 尝试刷新页面
4. 检查是否能访问 `https://openrouter.ai/api/v1/models`

## 技术细节

### 模型列表 API

本项目使用 OpenRouter 的 Models API 自动获取模型列表：

```
GET https://openrouter.ai/api/v1/models
Authorization: Bearer YOUR_API_KEY
```

API 返回的每个模型包含以下信息：
- 模型 ID 和名称
- 上下文长度
- 支持的参数
- 定价信息
- 输入/输出模态（text、image、audio 等）

参考文档：[OpenRouter Models API](https://openrouter.ai/docs/api/api-reference/models/get-models)

## 更多信息

- [OpenRouter 官方文档](https://openrouter.ai/docs)
- [OpenRouter API 参考](https://openrouter.ai/docs/api-reference)
- [OpenRouter Models API](https://openrouter.ai/docs/api/api-reference/models/get-models)

