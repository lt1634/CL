import { generateText } from "ai";
import { getOpenClawModel } from "@/lib/llm";

const quickPrompt = `
You are the Quick Curator for VA Bot's Home.
Given one short user prompt, generate:
1) a React visual prototype code snippet
2) a short IG caption
3) a compact taste summary object

Rules for reactCode:
- Only use standard React, framer-motion, and lucide-react
- Do not import any other libraries
- Must include export default
- Must render a visible UI

Return ONLY valid JSON with this exact shape:
{
  "reactCode": "string",
  "caption": "string",
  "tasteSummary": {
    "core_vibe": "string",
    "visual_preferences": ["string"],
    "interaction_feel": "string",
    "foundation_alignment": "string"
  }
}
No markdown fences.
`;

function cleanJsonText(raw: string): string {
  return raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
}

export async function POST(req: Request) {
  try {
    const { prompt } = (await req.json()) as { prompt?: string };
    const safePrompt = (prompt || "").trim();
    if (!safePrompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const result = await generateText({
      model: getOpenClawModel(),
      system: quickPrompt,
      prompt: safePrompt,
      temperature: 0.35,
      providerOptions: {
        openai: {
          response_format: { type: "json_object" },
        },
      },
    });

    const parsed = JSON.parse(cleanJsonText(result.text)) as {
      reactCode: string;
      caption: string;
      tasteSummary: {
        core_vibe: string;
        visual_preferences: string[];
        interaction_feel: string;
        foundation_alignment: string;
      };
    };

    return Response.json(parsed, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Quick generate failed", detail }, { status: 500 });
  }
}

