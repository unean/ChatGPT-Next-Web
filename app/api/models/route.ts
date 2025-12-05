import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "../../config/server";
import { ServiceProvider } from "../../constant";

// 提供商配置信息
interface ProviderConfig {
  id: string;
  name: ServiceProvider;
  apiKeyField: string;
  listModelPath?: string;
  baseUrl?: string;
}

// 检测提供商是否被 customModels 配置禁用
function isProviderDisabled(
  customModels: string,
  providerId: string,
  providerName: string,
): boolean {
  if (!customModels) return false;

  const configs = customModels.split(",").filter((v) => v && v.length > 0);

  for (const config of configs) {
    const isDisable = config.startsWith("-");
    const name = isDisable ? config.slice(1) : config;

    // 检测 -all 禁用所有
    if (name === "all" && isDisable) {
      // 检查是否有后续的 +provider:xxx 来重新启用
      const reEnabled = configs.some((c) => {
        if (c.startsWith("+")) {
          const enableName = c.slice(1);
          if (enableName.startsWith("provider:")) {
            const targetProvider = enableName.slice(9).toLowerCase();
            return (
              targetProvider === providerId ||
              targetProvider === providerName.toLowerCase()
            );
          }
        }
        return false;
      });
      if (!reEnabled) return true;
    }

    // 检测 -provider:xxx 禁用特定提供商
    if (name.startsWith("provider:") && isDisable) {
      const targetProvider = name.slice(9).toLowerCase();
      if (
        targetProvider === providerId ||
        targetProvider === providerName.toLowerCase()
      ) {
        return true;
      }
    }
  }

  return false;
}

// 获取可用的提供商列表
function getAvailableProviders(
  serverConfig: ReturnType<typeof getServerSideConfig>,
) {
  const providers: {
    id: string;
    name: string;
    providerType: string;
  }[] = [];

  const customModels = serverConfig.customModels;

  // OpenAI (通过 apiKey 判断)
  if (serverConfig.apiKey) {
    if (!isProviderDisabled(customModels, "openai", ServiceProvider.OpenAI)) {
      providers.push({
        id: "openai",
        name: ServiceProvider.OpenAI,
        providerType: "openai",
      });
    }
  }

  // Azure
  if (serverConfig.isAzure) {
    if (!isProviderDisabled(customModels, "azure", ServiceProvider.Azure)) {
      providers.push({
        id: "azure",
        name: ServiceProvider.Azure,
        providerType: "azure",
      });
    }
  }

  // Google
  if (serverConfig.isGoogle) {
    if (!isProviderDisabled(customModels, "google", ServiceProvider.Google)) {
      providers.push({
        id: "google",
        name: ServiceProvider.Google,
        providerType: "google",
      });
    }
  }

  // Anthropic
  if (serverConfig.isAnthropic) {
    if (
      !isProviderDisabled(customModels, "anthropic", ServiceProvider.Anthropic)
    ) {
      providers.push({
        id: "anthropic",
        name: ServiceProvider.Anthropic,
        providerType: "anthropic",
      });
    }
  }

  // Baidu
  if (serverConfig.isBaidu) {
    if (!isProviderDisabled(customModels, "baidu", ServiceProvider.Baidu)) {
      providers.push({
        id: "baidu",
        name: ServiceProvider.Baidu,
        providerType: "baidu",
      });
    }
  }

  // ByteDance
  if (serverConfig.isBytedance) {
    if (
      !isProviderDisabled(customModels, "bytedance", ServiceProvider.ByteDance)
    ) {
      providers.push({
        id: "bytedance",
        name: ServiceProvider.ByteDance,
        providerType: "bytedance",
      });
    }
  }

  // Alibaba
  if (serverConfig.isAlibaba) {
    if (!isProviderDisabled(customModels, "alibaba", ServiceProvider.Alibaba)) {
      providers.push({
        id: "alibaba",
        name: ServiceProvider.Alibaba,
        providerType: "alibaba",
      });
    }
  }

  // Tencent
  if (serverConfig.isTencent) {
    if (!isProviderDisabled(customModels, "tencent", ServiceProvider.Tencent)) {
      providers.push({
        id: "tencent",
        name: ServiceProvider.Tencent,
        providerType: "tencent",
      });
    }
  }

  // Moonshot
  if (serverConfig.isMoonshot) {
    if (
      !isProviderDisabled(customModels, "moonshot", ServiceProvider.Moonshot)
    ) {
      providers.push({
        id: "moonshot",
        name: ServiceProvider.Moonshot,
        providerType: "moonshot",
      });
    }
  }

  // Iflytek
  if (serverConfig.isIflytek) {
    if (!isProviderDisabled(customModels, "iflytek", ServiceProvider.Iflytek)) {
      providers.push({
        id: "iflytek",
        name: ServiceProvider.Iflytek,
        providerType: "iflytek",
      });
    }
  }

  // DeepSeek
  if (serverConfig.isDeepSeek) {
    if (
      !isProviderDisabled(customModels, "deepseek", ServiceProvider.DeepSeek)
    ) {
      providers.push({
        id: "deepseek",
        name: ServiceProvider.DeepSeek,
        providerType: "deepseek",
      });
    }
  }

  // XAI
  if (serverConfig.isXAI) {
    if (!isProviderDisabled(customModels, "xai", ServiceProvider.XAI)) {
      providers.push({
        id: "xai",
        name: ServiceProvider.XAI,
        providerType: "xai",
      });
    }
  }

  // ChatGLM
  if (serverConfig.isChatGLM) {
    if (!isProviderDisabled(customModels, "chatglm", ServiceProvider.ChatGLM)) {
      providers.push({
        id: "chatglm",
        name: ServiceProvider.ChatGLM,
        providerType: "chatglm",
      });
    }
  }

  // SiliconFlow
  if (serverConfig.isSiliconFlow) {
    if (
      !isProviderDisabled(
        customModels,
        "siliconflow",
        ServiceProvider.SiliconFlow,
      )
    ) {
      providers.push({
        id: "siliconflow",
        name: ServiceProvider.SiliconFlow,
        providerType: "siliconflow",
      });
    }
  }

  // 302.AI
  if (serverConfig.isAI302) {
    if (!isProviderDisabled(customModels, "ai302", ServiceProvider["302.AI"])) {
      providers.push({
        id: "ai302",
        name: ServiceProvider["302.AI"],
        providerType: "ai302",
      });
    }
  }

  // OpenRouter
  if (serverConfig.isOpenRouter) {
    if (
      !isProviderDisabled(
        customModels,
        "openrouter",
        ServiceProvider.OpenRouter,
      )
    ) {
      providers.push({
        id: "openrouter",
        name: ServiceProvider.OpenRouter,
        providerType: "openrouter",
      });
    }
  }

  return providers;
}

async function handle(req: NextRequest) {
  const serverConfig = getServerSideConfig();
  const availableProviders = getAvailableProviders(serverConfig);

  return NextResponse.json({
    providers: availableProviders,
  });
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
