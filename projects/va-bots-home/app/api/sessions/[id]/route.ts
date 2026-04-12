import {
  getSessionById,
  renameSession,
  serializeSessionToMarkdown,
  setSessionPinned,
} from "@/lib/session-store";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getSessionById(id);
    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }
    const url = new URL(req.url);
    const format = url.searchParams.get("format");

    if (format === "md") {
      const markdown = serializeSessionToMarkdown(session);
      return new Response(markdown, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="session-${id}.md"`,
        },
      });
    }

    if (format === "json") {
      return new Response(JSON.stringify(session, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="session-${id}.json"`,
        },
      });
    }

    return Response.json({ session }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Failed to load session", detail }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await req.json()) as { title?: string; pinned?: boolean };

    if (typeof body.pinned === "boolean") {
      const pinnedResult = await setSessionPinned(id, body.pinned);
      if (!pinnedResult) {
        return Response.json({ error: "Session not found" }, { status: 404 });
      }
      return Response.json({ session: pinnedResult }, { status: 200 });
    }

    const title = (body.title || "").trim();
    if (!title) {
      return Response.json({ error: "Title or pinned is required" }, { status: 400 });
    }

    const updated = await renameSession(id, title);
    if (!updated) {
      return Response.json({ error: "Session not found or invalid title" }, { status: 404 });
    }

    return Response.json({ session: updated }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Failed to rename session", detail }, { status: 500 });
  }
}

