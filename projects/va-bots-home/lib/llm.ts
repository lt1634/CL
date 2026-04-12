import { createOpenAI } from "@ai-sdk/openai";

const baseUrl = process.env.OPENCLAW_BASE_URL || "http://127.0.0.1:8080/v1";
const apiKey = process.env.OPENCLAW_API_KEY || "dummy";
const model = process.env.OPENCLAW_MODEL || "openclaw-curator";

const openclaw = createOpenAI({
  apiKey,
  baseURL: baseUrl,
});

export function getOpenClawModel() {
  return openclaw(model);
}

export function getOpenClawConfig() {
  return {
    baseUrl,
    model,
    hasApiKey: Boolean(process.env.OPENCLAW_API_KEY),
  };
}

