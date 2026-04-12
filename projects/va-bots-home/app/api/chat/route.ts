import { streamText } from "ai";
import { getOpenClawModel } from "@/lib/llm";

const curatorPrompt = `
You are the "Curator", an AI artistic mentor at VA Bot's Home.
Guide users through "Taste-Driven Vibe Coding."
Never end with just "Done." Always ask one Socratic critique question.
Only use standard React, framer-motion, and lucide-react.
Do NOT import any other external libraries.
Do NOT use Three.js unless explicitly asked.
Always format your response exactly like this:
<curator_message>Your critique and question in HK Cantonese and English mix.</curator_message>
<react_code>The updated React code snippet.</react_code>
`;

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

function pruneMessages(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= 6) return messages;

  const firstUser = messages.find((m) => m.role === "user");
  const recent = messages.slice(-4);
  const pruned: ChatMessage[] = [];

  if (firstUser) pruned.push(firstUser);
  for (const message of recent) {
    if (pruned.includes(message)) continue;
    pruned.push(message);
  }

  return pruned;
}

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages?: ChatMessage[] };
    const safeMessages = pruneMessages(messages || []);

    const result = await streamText({
      model: getOpenClawModel(),
      system: curatorPrompt,
      messages: safeMessages,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Chat route failed", detail: message }, { status: 500 });
  }
}

