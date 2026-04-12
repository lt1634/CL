import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type SessionMessage = {
  role: "user" | "assistant" | "system";
  text: string;
};

export type SessionVersion = {
  id: string;
  savedAt: string;
  messages: SessionMessage[];
  curatorText: string;
  currentCode: string;
  tasteProfile: unknown | null;
};

export type StoredSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  versions: SessionVersion[];
};

type SessionStoreData = {
  sessions: StoredSession[];
};

const dataDir = join(process.cwd(), "data");
const storeFile = join(dataDir, "sessions.json");

async function readStore(): Promise<SessionStoreData> {
  try {
    const raw = await readFile(storeFile, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { sessions: [] };
    const sessions = (parsed as SessionStoreData).sessions;
    return { sessions: Array.isArray(sessions) ? sessions : [] };
  } catch {
    return { sessions: [] };
  }
}

async function writeStore(data: SessionStoreData) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(storeFile, JSON.stringify(data, null, 2), "utf-8");
}

function makeTitle(messages: SessionMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user" && m.text.trim().length > 0);
  if (!firstUser) return "Untitled Session";
  const trimmed = firstUser.text.trim().replace(/\s+/g, " ");
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}...` : trimmed;
}

export async function listSessions() {
  const data = await readStore();
  return data.sessions
    .map((session) => ({
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      pinned: Boolean(session.pinned),
      versionCount: session.versions.length,
    }))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.updatedAt < b.updatedAt ? 1 : -1;
    });
}

export async function getSessionById(sessionId: string) {
  const data = await readStore();
  const session = data.sessions.find((s) => s.id === sessionId) ?? null;
  if (!session) return null;
  if (typeof session.pinned !== "boolean") {
    session.pinned = false;
    await writeStore(data);
  }
  return session;
}

export async function renameSession(sessionId: string, title: string) {
  const data = await readStore();
  const session = data.sessions.find((s) => s.id === sessionId);
  if (!session) return null;

  const nextTitle = title.trim().replace(/\s+/g, " ").slice(0, 120);
  if (!nextTitle) return null;

  session.title = nextTitle;
  session.updatedAt = new Date().toISOString();
  await writeStore(data);

  return {
    id: session.id,
    title: session.title,
    pinned: session.pinned,
    updatedAt: session.updatedAt,
  };
}

export async function setSessionPinned(sessionId: string, pinned: boolean) {
  const data = await readStore();
  const session = data.sessions.find((s) => s.id === sessionId);
  if (!session) return null;

  session.pinned = pinned;
  session.updatedAt = new Date().toISOString();
  await writeStore(data);

  return {
    id: session.id,
    pinned: session.pinned,
    updatedAt: session.updatedAt,
  };
}

export async function saveSessionVersion(input: {
  sessionId?: string;
  messages: SessionMessage[];
  curatorText: string;
  currentCode: string;
  tasteProfile: unknown | null;
}) {
  const data = await readStore();
  const now = new Date().toISOString();

  let session = input.sessionId
    ? data.sessions.find((s) => s.id === input.sessionId)
    : undefined;

  if (!session) {
    session = {
      id: randomUUID(),
      title: makeTitle(input.messages),
      createdAt: now,
      updatedAt: now,
      pinned: false,
      versions: [],
    };
    data.sessions.push(session);
  }

  const version: SessionVersion = {
    id: randomUUID(),
    savedAt: now,
    messages: input.messages,
    curatorText: input.curatorText,
    currentCode: input.currentCode,
    tasteProfile: input.tasteProfile,
  };

  session.versions.push(version);
  session.updatedAt = now;
  if (!session.title || session.title === "Untitled Session") {
    session.title = makeTitle(input.messages);
  }

  await writeStore(data);

  return {
    sessionId: session.id,
    versionId: version.id,
    savedAt: version.savedAt,
  };
}

function escapeMarkdown(text: string) {
  return text.replace(/`/g, "\\`");
}

export function serializeSessionToMarkdown(session: StoredSession) {
  const latest = session.versions[session.versions.length - 1];
  const curatorSummary =
    latest &&
    typeof latest.tasteProfile === "object" &&
    latest.tasteProfile &&
    "foundation_alignment" in latest.tasteProfile
      ? String((latest.tasteProfile as { foundation_alignment?: string }).foundation_alignment || "")
      : "";

  const sections: string[] = [];
  sections.push("# VA Bot's Home: Taste Profile & Foundation");
  sections.push(`**Session:** ${escapeMarkdown(session.title)}`);
  sections.push(`**Created:** ${new Date(session.createdAt).toLocaleString()}`);
  sections.push(`**Updated:** ${new Date(session.updatedAt).toLocaleString()}`);
  if (curatorSummary) {
    sections.push(`**Curator's Assessment:** ${escapeMarkdown(curatorSummary)}`);
  }
  sections.push("---");

  session.versions.forEach((version, index) => {
    sections.push(`## The Evolution (Iteration ${index + 1})`);
    sections.push(`**Saved At:** ${new Date(version.savedAt).toLocaleString()}`);

    const userLine = version.messages
      .filter((m) => m.role === "user")
      .at(-1)?.text;
    if (userLine) {
      sections.push(`**User Judgment:** "${escapeMarkdown(userLine)}"`);
    }

    if (version.curatorText) {
      sections.push(`**Curator's Voice:** "${escapeMarkdown(version.curatorText)}"`);
    }

    sections.push("**The Foundation (Code):**");
    sections.push("```jsx");
    sections.push(version.currentCode || "// (empty)");
    sections.push("```");
    sections.push("");
  });

  return sections.join("\n");
}

