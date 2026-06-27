// 阿里云百炼 (Bailian / DashScope) OpenAI 兼容网关。
// 在 Vercel / 本地环境变量中配置:
//   BAILIAN_BASE_URL  兼容模式入口(默认 https://dashscope.aliyuncs.com/compatible-mode/v1)
//   BAILIAN_API_KEY   阿里云百炼 API Key
// 用法:createBailianProvider(key)("qwen-plus") 即可拿到 model 给 streamText / generateText。
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const BAILIAN_DEFAULT_MODEL = "qwen-plus";
export const BAILIAN_DEFAULT_BASE_URL =
  "https://dashscope.aliyuncs.com/compatible-mode/v1";

export function createBailianProvider(apiKey: string, baseURL?: string) {
  return createOpenAICompatible({
    name: "bailian",
    baseURL: baseURL || process.env.BAILIAN_BASE_URL || BAILIAN_DEFAULT_BASE_URL,
    apiKey,
  });
}
