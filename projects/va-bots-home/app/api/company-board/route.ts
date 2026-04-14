import { NextResponse } from "next/server";
import {
  blockedTasks,
  loadBoardEvents,
  tailEvents,
} from "@/lib/company-board";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    500,
    Math.max(1, Number(searchParams.get("limit") || 200)),
  );
  const inboxOnly = searchParams.get("inbox") === "1";

  // 篩選參數
  const fTaskId = searchParams.get("task_id");
  const fType = searchParams.get("type");
  const fActor = searchParams.get("actor");
  const fFrom = searchParams.get("from");
  const fTo = searchParams.get("to");

  const allEvents = await loadBoardEvents();
  const totalLoaded = allEvents.length;
  let events = allEvents;

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
      events = events.filter((e) => new Date(e.ts as string).getTime() >= fromMs);
    }
  }
  if (fTo) {
    const toMs = new Date(fTo).getTime();
    if (!isNaN(toMs)) {
      events = events.filter((e) => new Date(e.ts as string).getTime() <= toMs);
    }
  }

  if (inboxOnly) {
    const blocked = blockedTasks(events);
    return NextResponse.json({ blocked, count: blocked.length });
  }
  const matched = events.length;
  const tail = tailEvents(events, limit);
  // totalParsed 與 matched 相同，保留舊客戶端相容
  return NextResponse.json({
    lines: tail,
    totalLoaded,
    matched,
    totalParsed: matched,
    returned: tail.length,
  });
}
