"use client";

import {
  ApiPath,
  OPENROUTER_BASE_URL,
  DEFAULT_MODELS,
  OpenRouter as OpenRouterConfig,
} from "@/app/constant";
import {
  useAccessStore,
  useAppConfig,
  useChatStore,
  ChatMessageTool,
  usePluginStore,
} from "@/app/store";
import { preProcessImageContent, streamWithThink } from "@/app/utils/chat";
import {
  ChatOptions,
  getHeaders,
  LLMApi,
  LLMModel,
  SpeechOptions,
} from "../api";
import { getClientConfig } from "@/app/config/client";
import {
  getMessageTextContent,
  getMessageTextContentWithoutThinking,
  isVisionModel,
  isOpenRouterVisionModel,
  getTimeoutMSByModel,
} from "@/app/utils";
import { RequestPayload } from "./openai";

import { fetch } from "@/app/utils/stream";

export interface OpenRouterModel {
  id: string;
  canonical_slug: string;
  name: string;
  description: string;
  created: number;
  context_length: number | null;
  pricing: {
    prompt: string | number;
    completion: string | number;
    request?: string | number;
    image?: string | number;
  };
  architecture: {
    tokenizer: string;
    instruct_type: string | null;
    modality: string | null;
    input_modalities: string[];
    output_modalities: string[];
  };
  top_provider: {
    context_length: number | null;
    max_completion_tokens: number | null;
    is_moderated: boolean;
  };
  supported_parameters: string[];
}

export interface OpenRouterListModelResponse {
  data: OpenRouterModel[];
}

export class OpenRouterApi implements LLMApi {
  private disableListModels = false;

  path(path: string): string {
    const accessStore = useAccessStore.getState();

    let baseUrl = "";

    if (accessStore.useCustomConfig) {
      baseUrl = accessStore.openRouterUrl;
    }

    if (baseUrl.length === 0) {
      const isApp = !!getClientConfig()?.isApp;
      const apiPath = ApiPath.OpenRouter;
      baseUrl = isApp ? OPENROUTER_BASE_URL : apiPath;
    }

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }
    if (
      !baseUrl.startsWith("http") &&
      !baseUrl.startsWith(ApiPath.OpenRouter)
    ) {
      baseUrl = "https://" + baseUrl;
    }

    console.log("[Proxy Endpoint] ", baseUrl, path);

    return [baseUrl, path].join("/");
  }

  extractMessage(res: any) {
    return res.choices?.at(0)?.message?.content ?? "";
  }

  speech(options: SpeechOptions): Promise<ArrayBuffer> {
    throw new Error("Method not implemented.");
  }

  async chat(options: ChatOptions) {
    // 对于 OpenRouter 模型，优先使用模型能力信息判断是否支持视觉
    // 如果没有能力信息，则回退到通用的正则表达式判断
    const isOpenRouterModel = options.config.model.includes("/");
    const visionModel = isOpenRouterModel
      ? isOpenRouterVisionModel(options.config.model) ||
        isVisionModel(options.config.model)
      : isVisionModel(options.config.model);

    console.log(
      "[OpenRouter] Model:",
      options.config.model,
      "Vision support:",
      visionModel,
    );

    const messages: ChatOptions["messages"] = [];
    for (const v of options.messages) {
      if (v.role === "assistant") {
        const content = getMessageTextContentWithoutThinking(v);
        messages.push({ role: v.role, content });
      } else {
        const content = visionModel
          ? await preProcessImageContent(v.content)
          : getMessageTextContent(v);
        messages.push({ role: v.role, content });
      }
    }

    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
      ...{
        model: options.config.model,
        providerName: options.config.providerName,
      },
    };

    // OpenRouter 要求模型 ID 格式为 provider/model-name
    // 确保模型名称包含 '/' 字符
    let modelId = modelConfig.model;
    console.log("[OpenRouter] Original model ID:", modelId);

    // 如果模型 ID 不包含 '/'，可能是格式错误
    if (!modelId.includes("/")) {
      console.error(
        "[OpenRouter] Invalid model ID format. Expected 'provider/model-name', got:",
        modelId,
      );
      throw new Error(
        `Invalid OpenRouter model ID: ${modelId}. Format should be 'provider/model-name' (e.g., 'openai/gpt-4o')`,
      );
    }

    const requestPayload: RequestPayload = {
      messages,
      stream: options.config.stream,
      model: modelId,
      temperature: modelConfig.temperature,
      presence_penalty: modelConfig.presence_penalty,
      frequency_penalty: modelConfig.frequency_penalty,
      top_p: modelConfig.top_p,
      // max_tokens: Math.max(modelConfig.max_tokens, 1024),
      // Please do not ask me why not send max_tokens, no reason, this param is just shit, I dont want to explain anymore.
    };

    console.log("[Request] openrouter payload: ", requestPayload);

    const shouldStream = !!options.config.stream;
    const controller = new AbortController();
    options.onController?.(controller);

    try {
      const chatPath = this.path(OpenRouterConfig.ChatPath);
      const chatPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: getHeaders(),
      };

      // console.log(chatPayload);

      // Use extended timeout for thinking models as they typically require more processing time
      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        getTimeoutMSByModel(options.config.model),
      );

      if (shouldStream) {
        const [tools, funcs] = usePluginStore
          .getState()
          .getAsTools(
            useChatStore.getState().currentSession().mask?.plugin || [],
          );
        return streamWithThink(
          chatPath,
          requestPayload,
          getHeaders(),
          tools as any,
          funcs,
          controller,
          // parseSSE
          (text: string, runTools: ChatMessageTool[]) => {
            // console.log("parseSSE", text, runTools);
            const json = JSON.parse(text);
            const choices = json.choices as Array<{
              delta: {
                content: string | null;
                tool_calls: ChatMessageTool[];
                reasoning_content: string | null;
              };
            }>;
            const tool_calls = choices[0]?.delta?.tool_calls;
            if (tool_calls?.length > 0) {
              const index = tool_calls[0]?.index;
              const id = tool_calls[0]?.id;
              const args = tool_calls[0]?.function?.arguments;
              if (id) {
                runTools.push({
                  id,
                  type: tool_calls[0]?.type,
                  function: {
                    name: tool_calls[0]?.function?.name as string,
                    arguments: args,
                  },
                });
              } else {
                // @ts-ignore
                runTools[index]["function"]["arguments"] += args;
              }
            }
            const reasoning = choices[0]?.delta?.reasoning_content;
            const content = choices[0]?.delta?.content;

            // Skip if both content and reasoning_content are empty or null
            if (
              (!reasoning || reasoning.length === 0) &&
              (!content || content.length === 0)
            ) {
              return {
                isThinking: false,
                content: "",
              };
            }

            if (reasoning && reasoning.length > 0) {
              return {
                isThinking: true,
                content: reasoning,
              };
            } else if (content && content.length > 0) {
              return {
                isThinking: false,
                content: content,
              };
            }

            return {
              isThinking: false,
              content: "",
            };
          },
          // processToolMessage, include tool_calls message and tool call results
          (
            requestPayload: RequestPayload,
            toolCallMessage: any,
            toolCallResult: any[],
          ) => {
            // @ts-ignore
            requestPayload?.messages?.splice(
              // @ts-ignore
              requestPayload?.messages?.length,
              0,
              toolCallMessage,
              ...toolCallResult,
            );
          },
          options,
        );
      } else {
        const res = await fetch(chatPath, chatPayload);
        clearTimeout(requestTimeoutId);

        const resJson = await res.json();
        const message = this.extractMessage(resJson);
        options.onFinish(message, res);
      }
    } catch (e) {
      console.log("[Request] failed to make a chat request", e);
      options.onError?.(e as Error);
    }
  }
  async usage() {
    return {
      used: 0,
      total: 0,
    };
  }

  async models(): Promise<LLMModel[]> {
    if (this.disableListModels) {
      return DEFAULT_MODELS.slice();
    }

    try {
      const res = await fetch(this.path(OpenRouterConfig.ListModelPath), {
        method: "GET",
        headers: {
          ...getHeaders(),
        },
      });

      if (!res.ok) {
        console.error("[OpenRouter] Failed to fetch models:", res.status);
        return DEFAULT_MODELS.filter(
          (m) => m.provider.providerType === "openrouter",
        );
      }

      const resJson = (await res.json()) as OpenRouterListModelResponse;
      const chatModels = resJson.data;
      console.log("[OpenRouter Models]", chatModels?.length, "models found");

      if (!chatModels || chatModels.length === 0) {
        return DEFAULT_MODELS.filter(
          (m) => m.provider.providerType === "openrouter",
        );
      }

      // 过滤出支持聊天的模型（text output modality）
      const textModels = chatModels.filter(
        (m) =>
          m.architecture?.output_modalities?.includes("text") ||
          m.architecture?.modality === "text->text",
      );

      let seq = 0; // OpenRouter 模型从 0 开始排序，显示在最前面
      return textModels.map((m) => {
        // 检查模型是否支持图片和视频输入
        const inputModalities = m.architecture?.input_modalities || [];
        const supportsImage = inputModalities.includes("image");
        const supportsVideo = inputModalities.includes("video");

        return {
          name: m.id,
          displayName: m.name,
          available: true,
          sorted: seq++,
          provider: {
            id: "openrouter",
            providerName: "OpenRouter",
            providerType: "openrouter",
            sorted: 0, // 排序值为 0，显示在最前面
          },
          capabilities: {
            vision: supportsImage,
            video: supportsVideo,
            inputModalities: inputModalities,
          },
        };
      });
    } catch (e) {
      console.error("[OpenRouter] Error fetching models:", e);
      return DEFAULT_MODELS.filter(
        (m) => m.provider.providerType === "openrouter",
      );
    }
  }
}
