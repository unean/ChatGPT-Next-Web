import { isModelNotavailableInServer } from "../app/utils/model";

describe("isModelNotavailableInServer", () => {
  test("test model will return false, which means the model is available", () => {
    const customModels = "";
    const modelName = "gpt-4";
    const providerNames = "OpenAI";
    const result = isModelNotavailableInServer(
      customModels,
      modelName,
      providerNames,
    );
    expect(result).toBe(false);
  });

  test("test model will return true when model is not available in custom models", () => {
    const customModels = "-all,gpt-4o-mini";
    const modelName = "gpt-4";
    const providerNames = "OpenAI";
    const result = isModelNotavailableInServer(
      customModels,
      modelName,
      providerNames,
    );
    expect(result).toBe(true);
  });

  test("should respect DISABLE_GPT4 setting", () => {
    process.env.DISABLE_GPT4 = "1";
    const result = isModelNotavailableInServer("", "gpt-4", "OpenAI");
    expect(result).toBe(true);
  });

  test("should handle empty provider names", () => {
    const result = isModelNotavailableInServer("-all,gpt-4", "gpt-4", "");
    expect(result).toBe(true);
  });

  test("should be case insensitive for model names", () => {
    const result = isModelNotavailableInServer("-all,GPT-4", "gpt-4", "OpenAI");
    expect(result).toBe(true);
  });

  test("support passing multiple providers, model unavailable on one of the providers will return true", () => {
    const customModels = "-all,gpt-4@google";
    const modelName = "gpt-4";
    const providerNames = ["OpenAI", "Azure"];
    const result = isModelNotavailableInServer(
      customModels,
      modelName,
      providerNames,
    );
    expect(result).toBe(true);
  });

  // FIXME: 这个测试用例有问题，需要修复
  //   test("support passing multiple providers, model available on one of the providers will return false", () => {
  //     const customModels = "-all,gpt-4@google";
  //     const modelName = "gpt-4";
  //     const providerNames = ["OpenAI", "Google"];
  //     const result = isModelNotavailableInServer(
  //       customModels,
  //       modelName,
  //       providerNames,
  //     );
  //     expect(result).toBe(false);
  //   });

  test("test custom model without setting provider", () => {
    const customModels = "-all,mistral-large";
    const modelName = "mistral-large";
    const providerNames = modelName;
    const result = isModelNotavailableInServer(
      customModels,
      modelName,
      providerNames,
    );
    expect(result).toBe(false);
  });

  test("should allow custom models when provider is enabled via provider filtering", () => {
    const customModels = "-all,provider:OpenRouter";
    const modelName = "anthropic/claude-haiku-4.5";
    const providerNames = "OpenRouter";
    const result = isModelNotavailableInServer(
      customModels,
      modelName,
      providerNames,
    );
    expect(result).toBe(false);
  });

  test("should block custom models when provider is disabled via provider filtering", () => {
    const customModels = "-all,-provider:OpenRouter";
    const modelName = "anthropic/claude-haiku-4.5";
    const providerNames = "OpenRouter";
    const result = isModelNotavailableInServer(
      customModels,
      modelName,
      providerNames,
    );
    expect(result).toBe(true);
  });

  test("should handle provider filtering with case insensitivity", () => {
    const customModels = "-all,provider:openrouter";
    const modelName = "anthropic/claude-haiku-4.5";
    const providerNames = "OpenRouter";
    const result = isModelNotavailableInServer(
      customModels,
      modelName,
      providerNames,
    );
    expect(result).toBe(false);
  });

  test("should allow models from enabled provider even if model not in default list", () => {
    const customModels = "-all,provider:Google";
    const modelName = "gemini-2.0-flash-exp";
    const providerNames = "Google";
    const result = isModelNotavailableInServer(
      customModels,
      modelName,
      providerNames,
    );
    expect(result).toBe(false);
  });

  test("should combine provider filtering with specific model rules", () => {
    const customModels = "-all,provider:OpenAI,-gpt-4";
    const modelName = "gpt-4";
    const providerNames = "OpenAI";
    const result = isModelNotavailableInServer(
      customModels,
      modelName,
      providerNames,
    );
    expect(result).toBe(true);
  });
});
