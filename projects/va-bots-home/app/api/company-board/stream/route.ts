import { boardFilesMtime, loadBoardEvents, tailEvents } from "@/lib/company-board";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  const limit = 120;
  let lastMtime = 0;
  let cachedTail: Record<string, unknown>[] = [];

  const { searchParams } = new URL(req.url);
  const fTaskId = searchParams.get("task_id");
  const fType = searchParams.get("type");
  const fActor = searchParams.get("actor");
  const fFrom = searchParams.get("from");
  const fTo = searchParams.get("to");

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(obj)}\n\n`),
        );
      };

      const tick = async () => {
        try {
          const mt = await boardFilesMtime();
          if (mt !== lastMtime) {
            lastMtime = mt;
            let events = await loadBoardEvents();

            if (fTaskId) {
              events = events.filter((e) => e.task_id === fTaskId);
            }
            if (fType) {
              events = events.filter((e) => e.type === fType);
            }
            if (fActor) {
              events = events.filter((e) => e.actor === fActor);
            }
            if (fFrom) {
              const fromMs = new Date(fFrom).getTime();
              if (!isNaN(fromMs)) {
                events = events.filter(
                  (e) => new Date(e.ts as string).getTime() >= fromMs,
                );
              }
            }
            if (fTo) {
              const toMs = new Date(fTo).getTime();
              if (!isNaN(toMs)) {
                events = events.filter(
                  (e) => new Date(e.ts as string).getTime() <= toMs,
                );
              }
            }

            cachedTail = tailEvents(events, limit);
            send({ type: "board", mtime: mt, lines: cachedTail });
          }
        } catch (e) {
          send({ type: "error", message: String(e) });
        }
      };

      await tick();
      send({ type: "hello", message: "company-board SSE" });

      const iv = setInterval(tick, 2000);

      req.signal.addEventListener("abort", () => {
        clearInterval(iv);
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
