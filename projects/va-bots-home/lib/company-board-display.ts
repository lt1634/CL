/** 將 company-board 單行事件轉成易讀條列（支援 schema `type` 與 Albert `kind` 混合格式） */

function s(x: unknown): string {
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (typeof x === "number" || typeof x === "boolean") return String(x);
  return "";
}

function summarizeState(state: unknown): string {
  if (typeof state === "string") return state;
  if (state && typeof state === "object") {
    const o = state as Record<string, unknown>;
    const parts: string[] = [];
    if (o.status != null) parts.push(`status=${s(o.status)}`);
    if (o.summary != null) parts.push(s(o.summary));
    if (o.sources_collected != null) parts.push(`sources=${s(o.sources_collected)}`);
    if (o.verdict != null) parts.push(`verdict=${s(o.verdict)}`);
    if (parts.length) return parts.join(" · ");
    const raw = JSON.stringify(state);
    return raw.length > 220 ? `${raw.slice(0, 220)}…` : raw;
  }
  return "";
}

export function boardEventToPoints(row: Record<string, unknown>): string[] {
  const points: string[] = [];
  const typ = s(row.type) || s(row.kind) || "event";
  const tid = s(row.task_id) || "—";
  const ts = s(row.ts) || "";
  const actor = s(row.actor) || s(row.src) || "—";

  const writer = s(row.writer);
  points.push(
    writer
      ? `任務 ${tid} · ${typ} · ${actor} · writer=${writer}`
      : `任務 ${tid} · ${typ} · ${actor}`,
  );
  if (ts) points.push(`時間 ${ts}`);

  switch (typ) {
    case "state_set": {
      const summary = s(row.summary);
      if (summary) points.push(`摘要：${summary}`);
      else if (row.state !== undefined) points.push(`狀態：${summarizeState(row.state)}`);
      if (row.owner) points.push(`Owner：${s(row.owner)}`);
      break;
    }
    case "evidence": {
      const summary = s(row.summary);
      if (summary) points.push(`證據：${summary}`);
      const refs = row.refs;
      if (Array.isArray(refs) && refs.length) {
        points.push(`refs：${refs.length} 條`);
        const maxShow = 4;
        for (let i = 0; i < Math.min(refs.length, maxShow); i++) {
          const r = refs[i];
          const line =
            typeof r === "string"
              ? r.length > 120
                ? `${r.slice(0, 120)}…`
                : r
              : JSON.stringify(r).slice(0, 120);
          points.push(`  · ${line}`);
        }
        if (refs.length > maxShow)
          points.push(`  · …共 ${refs.length} 條`);
      }
      const data = row.data as Record<string, unknown> | undefined;
      if (data?.sources && Array.isArray(data.sources)) {
        points.push(`來源數：${data.sources.length}`);
        const first = data.sources[0] as Record<string, unknown> | undefined;
        if (first?.title) points.push(`首條標題：${s(first.title)}`);
      }
      break;
    }
    case "task_init": {
      if (row.title) points.push(`標題：${s(row.title)}`);
      if (row.assign) points.push(`指派：${s(row.assign)}`);
      if (row.next) points.push(`下一步：${s(row.next)}`);
      if (row.status) points.push(`狀態：${s(row.status)}`);
      break;
    }
    case "challenge":
    case "critique": {
      const data = row.data as Record<string, unknown> | undefined;
      const five = data?.five_counterarguments;
      if (Array.isArray(five)) points.push(`反駁條數：${five.length}`);
      if (s(row.summary)) points.push(`摘要：${s(row.summary)}`);
      break;
    }
    case "hermes_dispatch":
    case "hermes_async_dispatch": {
      const hp = s(row.hermes_prompt);
      if (hp)
        points.push(
          `Hermes 指令：${hp.length > 240 ? `${hp.slice(0, 240)}…` : hp}`,
        );
      if (row.idempotency_key) points.push(`idempotency：${s(row.idempotency_key)}`);
      if (row.timeout_minutes != null)
        points.push(`timeout：${s(row.timeout_minutes)} min`);
      if (typ === "hermes_async_dispatch")
        points.push(`派工：Hermes 自主 async（非 Albert hermes_dispatch）`);
      break;
    }
    case "timeout_warning": {
      if (row.due_ts) points.push(`截止：${s(row.due_ts)}`);
      if (row.minutes_until_due != null)
        points.push(`尚餘約：${s(row.minutes_until_due)} 分鐘`);
      if (s(row.summary)) points.push(`摘要：${s(row.summary)}`);
      break;
    }
    case "hermes_result": {
      const text = s(row.summary) || s(row.result);
      if (text)
        points.push(
          `Hermes 結果：${text.length > 420 ? `${text.slice(0, 420)}…` : text}`,
        );
      if (row.idempotency_key) points.push(`idempotency：${s(row.idempotency_key)}`);
      if (row.error) points.push(`錯誤：${s(row.error)}`);
      break;
    }
    case "error": {
      if (row.message) points.push(`錯誤：${s(row.message)}`);
      break;
    }
    case "retry": {
      if (row.detail) points.push(`重試：${s(row.detail)}`);
      if (row.attempt != null) points.push(`次數：${s(row.attempt)}`);
      break;
    }
    case "boss_reply": {
      if (row.action) points.push(`動作：${s(row.action)}`);
      if (row.reason) points.push(`原因：${s(row.reason)}`);
      break;
    }
    default: {
      if (row.summary) points.push(`摘要：${s(row.summary)}`);
      if (row.message) points.push(`訊息：${s(row.message)}`);
      if (row.result && typ !== "hermes_result")
        points.push(`結果：${s(row.result).slice(0, 300)}${s(row.result).length > 300 ? "…" : ""}`);
    }
  }

  return points;
}
