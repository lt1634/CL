import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export type StoredTasteProfile = {
  id: string;
  savedAt: string;
  profile: {
    core_vibe: string;
    visual_preferences: string[];
    interaction_feel: string;
    foundation_alignment: string;
  };
  meta: {
    messageCount: number;
  };
};

const dataDir = join(process.cwd(), "data");
const storeFile = join(dataDir, "taste-profiles.json");

async function readStore(): Promise<StoredTasteProfile[]> {
  try {
    const raw = await readFile(storeFile, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredTasteProfile[]) : [];
  } catch {
    return [];
  }
}

async function writeStore(records: StoredTasteProfile[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(storeFile, JSON.stringify(records, null, 2), "utf-8");
}

export async function appendTasteProfile(input: {
  profile: StoredTasteProfile["profile"];
  messageCount: number;
}) {
  const records = await readStore();
  const record: StoredTasteProfile = {
    id: randomUUID(),
    savedAt: new Date().toISOString(),
    profile: input.profile,
    meta: {
      messageCount: input.messageCount,
    },
  };
  records.push(record);
  await writeStore(records);
  return record;
}

