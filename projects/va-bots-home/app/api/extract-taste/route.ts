import { generateText } from "ai";
import { getOpenClawModel } from "@/lib/llm";
import { appendTasteProfile } from "@/lib/taste-store";

const extractionPrompt = `
You are the OpenClaw Taste Profiler.
Read the conversation history between the User and the Curator.
Extract the User's aesthetic preferences, visual choices, and emotional tones based on their critiques.
Return ONLY a raw JSON object with this structure:
{
  "core_vibe": "Summary of their core aesthetic",
  "visual_preferences": ["item1", "item2"],
  "interaction_feel": "How they want things to move or feel",
  "foundation_alignment": "A short poetic summary of their unique taste"
}
Do not include markdown blocks like \`\`\`json, just pure JSON.
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
    const { messages } = (await req.json()) as { messages?: unknown };

    const result = await generateText({
      model: getOpenClawModel(),
      system: extractionPrompt,
      prompt: JSON.stringify(messages || []),
      temperature: 0.2,
      // If OpenClaw/OpenAI-compatible bridge supports JSON mode,
      // this nudges the model to return strict JSON.
      providerOptions: {
        openai: {
          response_format: { type: "json_object" },
        },
      },
    });

    const cleaned = cleanJsonText(result.text);
    const parsed = JSON.parse(cleaned) as {
      core_vibe: string;
      visual_preferences: string[];
      interaction_feel: string;
      foundation_alignment: string;
    };

    const messageCount = Array.isArray(messages) ? messages.length : 0;
    const savedRecord = await appendTasteProfile({
      profile: parsed,
      messageCount,
    });

    return Response.json(
      {
        ...parsed,
        profileId: savedRecord.id,
        savedAt: savedRecord.savedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Taste extraction failed", detail: message }, { status: 500 });
  }
}

