import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:8b";

const BAILIAN_API_KEY = process.env.BAILIAN_API_KEY;
const BAILIAN_BASE_URL = process.env.BAILIAN_BASE_URL;

export function createAiProvider() {
  if (BAILIAN_API_KEY && BAILIAN_BASE_URL) {
    return createOpenAICompatible({
      name: "bailian",
      baseURL: BAILIAN_BASE_URL,
      headers: {
        "Authorization": `Bearer ${BAILIAN_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
  }
  
  return createOpenAICompatible({
    name: "ollama",
    baseURL: `${OLLAMA_BASE_URL}/v1`,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function getDefaultModel() {
  if (BAILIAN_API_KEY && BAILIAN_BASE_URL) {
    return process.env.BAILIAN_MODEL || "qwen-plus";
  }
  return OLLAMA_MODEL;
}