import { listSessions, saveSessionVersion, type SessionMessage } from "@/lib/session-store";

export async function GET() {
  try {
    const sessions = await listSessions();
    return Response.json({ sessions }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Failed to list sessions", detail }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      sessionId?: string;
      messages?: SessionMessage[];
      curatorText?: string;
      currentCode?: string;
      tasteProfile?: unknown;
    };

    const result = await saveSessionVersion({
      sessionId: body.sessionId,
      messages: Array.isArray(body.messages) ? body.messages : [],
      curatorText: body.curatorText ?? "",
      currentCode: body.currentCode ?? "",
      tasteProfile: body.tasteProfile ?? null,
    });

    return Response.json(result, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Failed to save session", detail }, { status: 500 });
  }
}

