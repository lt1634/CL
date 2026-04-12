"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import { DefaultChatTransport } from "ai";
import { Loader2, Lock, Unlock } from "lucide-react";

type TasteProfile = {
  core_vibe: string;
  visual_preferences: string[];
  interaction_feel: string;
  foundation_alignment: string;
  profileId?: string;
  savedAt?: string;
};
type SessionMessage = {
  role: "user" | "assistant" | "system";
  text: string;
};
type SessionMeta = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  versionCount: number;
};
type SessionVersion = {
  id: string;
  savedAt: string;
  messages: SessionMessage[];
  curatorText: string;
  currentCode: string;
  tasteProfile: TasteProfile | null;
};
type FullSession = {
  id: string;
  title: string;
  pinned?: boolean;
  versions: SessionVersion[];
};
type SafetyCheckResult = {
  ok: boolean;
  reasons: string[];
};
type StatusTone = "neutral" | "success" | "error" | "info";
type LocaleKey = "en" | "zh-HK";
type AppMode = "quick" | "pro";

const I18N: Record<
  LocaleKey,
  {
    sessionHistory: string;
    saveSnapshot: string;
    refresh: string;
    sessionTitlePlaceholder: string;
    rename: string;
    pin: string;
    unpin: string;
    selectSession: string;
    selectVersion: string;
    pinnedLabel: string;
    othersLabel: string;
    noPinnedSessions: string;
    noOtherSessions: string;
    exportJson: string;
    exportMarkdown: string;
    showRecentOnly: string;
    showAllWithCount: (count: number) => string;
    statusFailedLoadSessions: string;
    statusFailedLoadSelectedSession: string;
    statusLoadedWithVersions: (title: string, count: number) => string;
    statusLoadedNoVersions: (title: string) => string;
    statusAutoSaving: string;
    statusAutoSaveFailed: string;
    statusSaveSnapshotFailed: string;
    statusAutoSaved: string;
    statusSnapshotSaved: string;
    statusRenameFailed: string;
    statusSessionRenamed: string;
    statusPinUpdateFailed: string;
    statusSessionPinned: string;
    statusSessionUnpinned: string;
    statusExportFailed: (format: string) => string;
    statusExported: (format: string, filename: string) => string;
    modeQuick: string;
    modePro: string;
    modeHint: string;
    quickPromptPlaceholder: string;
    quickGenerateNow: string;
    quickGenerating: string;
    quickCaptionTitle: string;
    quickTasteTitle: string;
    quickNoResultYet: string;
    quickGenerateFailed: string;
    quickBlocked: string;
  }
> = {
  en: {
    sessionHistory: "Session History",
    saveSnapshot: "Save Snapshot",
    refresh: "Refresh",
    sessionTitlePlaceholder: "Session title",
    rename: "Rename",
    pin: "Pin",
    unpin: "Unpin",
    selectSession: "Select session...",
    selectVersion: "Select version...",
    pinnedLabel: "Pinned",
    othersLabel: "Others",
    noPinnedSessions: "No pinned sessions",
    noOtherSessions: "No other sessions",
    exportJson: "Export JSON",
    exportMarkdown: "Export Markdown",
    showRecentOnly: "Show Recent Only",
    showAllWithCount: (count) => `Show All (${count})`,
    statusFailedLoadSessions: "Failed to load sessions list.",
    statusFailedLoadSelectedSession: "Failed to load selected session.",
    statusLoadedWithVersions: (title, count) => `Loaded session "${title}" (${count} versions).`,
    statusLoadedNoVersions: (title) => `Loaded session "${title}" (no versions).`,
    statusAutoSaving: "Auto-saving...",
    statusAutoSaveFailed: "Auto-save failed.",
    statusSaveSnapshotFailed: "Failed to save snapshot.",
    statusAutoSaved: "Auto-saved.",
    statusSnapshotSaved: "Snapshot saved.",
    statusRenameFailed: "Rename failed.",
    statusSessionRenamed: "Session renamed.",
    statusPinUpdateFailed: "Pin update failed.",
    statusSessionPinned: "Session pinned.",
    statusSessionUnpinned: "Session unpinned.",
    statusExportFailed: (format) => `Export ${format} failed.`,
    statusExported: (format, filename) => `Exported ${format}: ${filename}`,
    modeQuick: "Quick Mode",
    modePro: "Pro Mode",
    modeHint: "Quick = one-click output, Pro = multi-round refinement",
    quickPromptPlaceholder: "Describe the vibe in one sentence...",
    quickGenerateNow: "Generate Now",
    quickGenerating: "Generating...",
    quickCaptionTitle: "IG Caption",
    quickTasteTitle: "Taste Summary",
    quickNoResultYet: "No result yet. Enter one prompt and click Generate.",
    quickGenerateFailed: "Quick generate failed.",
    quickBlocked: "Quick result blocked by safety guard. Try a simpler visual prompt.",
  },
  "zh-HK": {
    sessionHistory: "對話紀錄",
    saveSnapshot: "儲存快照",
    refresh: "重新整理",
    sessionTitlePlaceholder: "對話名稱",
    rename: "改名",
    pin: "置頂",
    unpin: "取消置頂",
    selectSession: "選擇對話...",
    selectVersion: "選擇版本...",
    pinnedLabel: "置頂",
    othersLabel: "其他",
    noPinnedSessions: "未有置頂項目",
    noOtherSessions: "未有其他項目",
    exportJson: "匯出 JSON",
    exportMarkdown: "匯出 Markdown",
    showRecentOnly: "只顯示最近項目",
    showAllWithCount: (count) => `顯示全部（${count}）`,
    statusFailedLoadSessions: "讀取對話清單失敗。",
    statusFailedLoadSelectedSession: "讀取所選對話失敗。",
    statusLoadedWithVersions: (title, count) => `已載入對話「${title}」（${count} 個版本）。`,
    statusLoadedNoVersions: (title) => `已載入對話「${title}」（未有版本）。`,
    statusAutoSaving: "自動儲存中...",
    statusAutoSaveFailed: "自動儲存失敗。",
    statusSaveSnapshotFailed: "儲存快照失敗。",
    statusAutoSaved: "已自動儲存。",
    statusSnapshotSaved: "已儲存快照。",
    statusRenameFailed: "改名失敗。",
    statusSessionRenamed: "已改名。",
    statusPinUpdateFailed: "置頂更新失敗。",
    statusSessionPinned: "已置頂對話。",
    statusSessionUnpinned: "已取消置頂。",
    statusExportFailed: (format) => `匯出 ${format} 失敗。`,
    statusExported: (format, filename) => `已匯出 ${format}：${filename}`,
    modeQuick: "快速模式",
    modePro: "進階模式",
    modeHint: "快速模式 = 一鍵出稿；進階模式 = 多輪打磨",
    quickPromptPlaceholder: "用一句話描述你想要的感覺...",
    quickGenerateNow: "一鍵生成",
    quickGenerating: "生成中...",
    quickCaptionTitle: "IG 文案",
    quickTasteTitle: "風格摘要",
    quickNoResultYet: "尚未生成。輸入一句 prompt 後按「一鍵生成」。",
    quickGenerateFailed: "快速生成失敗。",
    quickBlocked: "快速結果被安全規則擋下，請改用更純粹的視覺描述。",
  },
};

const REQUIRED_ITERATIONS = 3;
const RECENT_SESSION_LIMIT = 8;
const CODE_TAG_PATTERN = /<react_code>([\s\S]*?)<\/react_code>/i;
const MESSAGE_TAG_PATTERN = /<curator_message>([\s\S]*?)<\/curator_message>/i;
const ALLOWED_IMPORTS = new Set(["react", "framer-motion", "lucide-react"]);

function stripCodeFence(content: string) {
  let code = content.trim();
  code = code.replace(/^```[a-zA-Z]*\n?/i, "");
  code = code.replace(/\n?```$/i, "");
  return code.trim();
}

function extractText(raw: string, pattern: RegExp) {
  const match = raw.match(pattern);
  return match?.[1]?.trim() || "";
}

function validateReactCode(code: string): SafetyCheckResult {
  const reasons: string[] = [];

  const importFromRegex = /import[\s\S]*?from\s*["']([^"']+)["']/g;
  const dynamicImportRegex = /import\s*\(\s*["']([^"']+)["']\s*\)/g;
  const requireRegex = /require\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const match of code.matchAll(importFromRegex)) {
    const pkg = match[1];
    if (!ALLOWED_IMPORTS.has(pkg)) {
      reasons.push(`Non-whitelisted import: ${pkg}`);
    }
  }

  for (const match of code.matchAll(dynamicImportRegex)) {
    const pkg = match[1];
    if (!ALLOWED_IMPORTS.has(pkg)) {
      reasons.push(`Dynamic import blocked: ${pkg}`);
    }
  }

  for (const match of code.matchAll(requireRegex)) {
    const pkg = match[1];
    if (!ALLOWED_IMPORTS.has(pkg)) {
      reasons.push(`require() blocked: ${pkg}`);
    }
  }

  const blockedPatterns: Array<{ label: string; regex: RegExp }> = [
    { label: "eval()", regex: /\beval\s*\(/ },
    { label: "Function constructor", regex: /\bnew\s+Function\s*\(|\bFunction\s*\(/ },
    { label: "document.cookie", regex: /\bdocument\.cookie\b/ },
    { label: "localStorage", regex: /\blocalStorage\b/ },
    { label: "sessionStorage", regex: /\bsessionStorage\b/ },
    { label: "fetch()", regex: /\bfetch\s*\(/ },
    { label: "document.querySelector()", regex: /\bdocument\.querySelector\b/ },
    { label: "innerHTML", regex: /\binnerHTML\b/ },
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.regex.test(code)) {
      reasons.push(`Blocked API detected: ${pattern.label}`);
    }
  }

  if (!/\bexport\s+default\b/.test(code)) {
    reasons.push("Missing export default");
  }

  if (!/\breturn\b|\brender\b/.test(code)) {
    reasons.push("Missing return/render for component output");
  }

  return {
    ok: reasons.length === 0,
    reasons: reasons.slice(0, 3),
  };
}

function getMessageText(message: unknown): string {
  if (!message || typeof message !== "object") return "";
  const msg = message as {
    content?: unknown;
    parts?: Array<{ type?: string; text?: string }>;
  };

  if (typeof msg.content === "string") return msg.content;
  if (!Array.isArray(msg.parts)) return "";

  return msg.parts
    .filter((part) => part?.type === "text" && typeof part.text === "string")
    .map((part) => part.text as string)
    .join("");
}

export default function GallerySpace() {
  const [locale, setLocale] = useState<LocaleKey>("en");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang");
    if (lang === "zh-HK" || lang === "en") {
      setLocale(lang);
    } else {
      setLocale("en");
      const url = new URL(window.location.href);
      url.searchParams.set("lang", "en");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const t = I18N[locale];
  const switchLocale = (nextLocale: LocaleKey) => {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLocale);
    window.history.replaceState({}, "", url.toString());
    setLocale(nextLocale);
  };

  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [mode, setMode] = useState<AppMode>("quick");
  const [input, setInput] = useState("");
  const [quickPrompt, setQuickPrompt] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickCaption, setQuickCaption] = useState("");
  const [quickTasteSummary, setQuickTasteSummary] = useState<TasteProfile | null>(null);

  const [currentCode, setCurrentCode] = useState("");
  const [curatorText, setCuratorText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [tasteProfile, setTasteProfile] = useState<TasteProfile | null>(null);
  const [safetyResult, setSafetyResult] = useState<SafetyCheckResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [loadedSession, setLoadedSession] = useState<FullSession | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [sessionStatus, setSessionStatus] = useState<string>("");
  const [sessionTitleInput, setSessionTitleInput] = useState("");
  const [showAllSessions, setShowAllSessions] = useState(false);
  const prevIsLoadingRef = useRef(false);
  const lastAutoSavedFingerprintRef = useRef("");

  const userMessageCount = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages]
  );
  const isUnlocked = userMessageCount >= REQUIRED_ITERATIONS;
  const displayedSessions = useMemo(() => {
    if (showAllSessions) return sessions;
    return sessions.slice(0, RECENT_SESSION_LIMIT);
  }, [sessions, showAllSessions]);
  const groupedDisplayedSessions = useMemo(() => {
    const pinned = displayedSessions.filter((s) => s.pinned);
    const unpinned = displayedSessions.filter((s) => !s.pinned);
    return { pinned, unpinned };
  }, [displayedSessions]);
  const sessionStatusTone: StatusTone = useMemo(() => {
    const text = sessionStatus.toLowerCase();
    if (!text) return "neutral";
    if (text.includes("failed")) return "error";
    if (text.includes("saving")) return "info";
    if (
      text.includes("saved") ||
      text.includes("renamed") ||
      text.includes("exported") ||
      text.includes("loaded")
    ) {
      return "success";
    }
    return "neutral";
  }, [sessionStatus]);

  const refreshSessions = useCallback(async () => {
    try {
      const response = await fetch("/api/sessions");
      const payload = (await response.json()) as { sessions?: SessionMeta[] };
      setSessions(Array.isArray(payload.sessions) ? payload.sessions : []);
    } catch {
      setSessionStatus(t.statusFailedLoadSessions);
    }
  }, [t.statusFailedLoadSessions]);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  useEffect(() => {
    if (!sessionStatus) return;
    const timeout = setTimeout(() => {
      setSessionStatus("");
    }, 2500);
    return () => clearTimeout(timeout);
  }, [sessionStatus]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    const content = getMessageText(last);

    const codeText = extractText(content, CODE_TAG_PATTERN);
    if (codeText) {
      const cleanedCode = stripCodeFence(codeText);
      const validation = validateReactCode(cleanedCode);
      setSafetyResult(validation);
      if (validation.ok) {
        setCurrentCode(cleanedCode);
      }
    }

    const msgText = extractText(content, MESSAGE_TAG_PATTERN);
    if (msgText) {
      setCuratorText(msgText);
    }
  }, [messages]);

  const toSessionMessages = useCallback((): SessionMessage[] => {
    if (mode === "quick" && messages.length === 0 && quickPrompt.trim()) {
      return [
        { role: "user", text: quickPrompt.trim() },
        { role: "assistant", text: quickCaption || curatorText || "(quick result)" },
      ];
    }
    return messages.map((message) => ({
      role: message.role as "user" | "assistant" | "system",
      text: getMessageText(message),
    }));
  }, [mode, messages, quickPrompt, quickCaption, curatorText]);

  const makeSnapshotFingerprint = useCallback(() => {
    const messageDigest = toSessionMessages()
      .map((m) => `${m.role}:${m.text}`)
      .join("|");
    return `${sessionId ?? "new"}::${messageDigest.length}::${curatorText.length}::${currentCode.length}`;
  }, [toSessionMessages, sessionId, curatorText, currentCode]);

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const applyVersion = useCallback((version: SessionVersion) => {
    setSelectedVersionId(version.id);
    setCuratorText(version.curatorText || "");
    setCurrentCode(version.currentCode || "");
    setTasteProfile(version.tasteProfile || null);
    setSafetyResult(
      version.currentCode
        ? {
            ok: true,
            reasons: [],
          }
        : null
    );
  }, []);

  const loadSession = useCallback(async (targetSessionId: string) => {
    if (!targetSessionId) return;
    try {
      const response = await fetch(`/api/sessions/${targetSessionId}`);
      if (!response.ok) {
        setSessionStatus(t.statusFailedLoadSelectedSession);
        return;
      }
      const payload = (await response.json()) as { session?: FullSession };
      const session = payload.session;
      if (!session) return;
      setLoadedSession(session);
      setSessionId(session.id);
      setSessionTitleInput(session.title);

      const latest = session.versions[session.versions.length - 1];
      if (latest) {
        applyVersion(latest);
        setSessionStatus(t.statusLoadedWithVersions(session.title, session.versions.length));
      } else {
        setSessionStatus(t.statusLoadedNoVersions(session.title));
      }
    } catch {
      setSessionStatus(t.statusFailedLoadSelectedSession);
    }
  }, [applyVersion, t]);

  const saveSnapshot = useCallback(async (mode: "manual" | "auto" = "manual") => {
    try {
      if (mode === "auto") {
        setSessionStatus(t.statusAutoSaving);
      }
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          messages: toSessionMessages(),
          curatorText,
          currentCode,
          tasteProfile,
        }),
      });
      if (!response.ok) {
        setSessionStatus(mode === "auto" ? t.statusAutoSaveFailed : t.statusSaveSnapshotFailed);
        return;
      }
      const payload = (await response.json()) as {
        sessionId: string;
        versionId: string;
      };
      setSessionId(payload.sessionId);
      setSelectedVersionId(payload.versionId);
      setSessionStatus(mode === "auto" ? t.statusAutoSaved : t.statusSnapshotSaved);
      lastAutoSavedFingerprintRef.current = makeSnapshotFingerprint();
      await refreshSessions();
      await loadSession(payload.sessionId);
    } catch {
      setSessionStatus(mode === "auto" ? t.statusAutoSaveFailed : t.statusSaveSnapshotFailed);
    }
  }, [
    sessionId,
    toSessionMessages,
    curatorText,
    currentCode,
    tasteProfile,
    makeSnapshotFingerprint,
    refreshSessions,
    loadSession,
    t.statusAutoSaveFailed,
    t.statusAutoSaved,
    t.statusAutoSaving,
    t.statusSaveSnapshotFailed,
    t.statusSnapshotSaved,
  ]);

  const renameCurrentSession = async () => {
    if (!sessionId || !sessionTitleInput.trim()) return;
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sessionTitleInput.trim() }),
      });
      if (!response.ok) {
        setSessionStatus(t.statusRenameFailed);
        return;
      }
      setSessionStatus(t.statusSessionRenamed);
      await refreshSessions();
      await loadSession(sessionId);
    } catch {
      setSessionStatus(t.statusRenameFailed);
    }
  };

  const togglePinCurrentSession = async () => {
    if (!sessionId) return;
    const current = sessions.find((s) => s.id === sessionId);
    if (!current) return;
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !current.pinned }),
      });
      if (!response.ok) {
        setSessionStatus(t.statusPinUpdateFailed);
        return;
      }
      setSessionStatus(current.pinned ? t.statusSessionUnpinned : t.statusSessionPinned);
      await refreshSessions();
      await loadSession(sessionId);
    } catch {
      setSessionStatus(t.statusPinUpdateFailed);
    }
  };

  const exportSession = async (format: "json" | "md") => {
    if (!sessionId) return;
    try {
      const response = await fetch(`/api/sessions/${sessionId}?format=${format}`);
      if (!response.ok) {
        setSessionStatus(t.statusExportFailed(format.toUpperCase()));
        return;
      }
      const content = await response.text();
      const filename = `session-${sessionId}.${format}`;
      downloadTextFile(
        content,
        filename,
        format === "md" ? "text/markdown;charset=utf-8" : "application/json;charset=utf-8"
      );
      setSessionStatus(t.statusExported(format.toUpperCase(), filename));
    } catch {
      setSessionStatus(t.statusExportFailed(format.toUpperCase()));
    }
  };

  const handleQuickGenerate = async () => {
    const prompt = quickPrompt.trim();
    if (!prompt || quickLoading) return;
    setQuickLoading(true);
    try {
      const response = await fetch("/api/quick-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) {
        setSessionStatus(t.quickGenerateFailed);
        return;
      }
      const payload = (await response.json()) as {
        reactCode: string;
        caption: string;
        tasteSummary: TasteProfile;
      };

      const cleanedCode = stripCodeFence(payload.reactCode || "");
      const validation = validateReactCode(cleanedCode);
      setSafetyResult(validation);
      if (!validation.ok) {
        setSessionStatus(t.quickBlocked);
      } else {
        setCurrentCode(cleanedCode);
      }

      setQuickCaption(payload.caption || "");
      setQuickTasteSummary(payload.tasteSummary || null);
      setCuratorText(payload.caption || "");
      setTasteProfile(payload.tasteSummary || null);
      setMessages([]);
      setSessionStatus(t.statusSnapshotSaved);
    } catch {
      setSessionStatus(t.quickGenerateFailed);
    } finally {
      setQuickLoading(false);
    }
  };

  const handleExport = async () => {
    if (!isUnlocked || isExtracting || tasteProfile) return;
    setIsExtracting(true);
    try {
      const response = await fetch("/api/extract-taste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const payload = (await response.json()) as TasteProfile;
      setTasteProfile(payload);
    } catch (error) {
      console.error("Taste extraction failed", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    const wasLoading = prevIsLoadingRef.current;
    const justFinished = wasLoading && !isLoading;
    prevIsLoadingRef.current = isLoading;

    if (!justFinished) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    if (!curatorText && !currentCode) return;

    const fingerprint = makeSnapshotFingerprint();
    if (fingerprint === lastAutoSavedFingerprintRef.current) return;

    void saveSnapshot("auto");
  }, [isLoading, messages, curatorText, currentCode, makeSnapshotFingerprint, saveSnapshot]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isLoading || isUnlocked) return;
    const text = input.trim();
    setInput("");
    await sendMessage({ text });
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-gray-300">
      <div className="relative h-full w-[70%] border-r border-gray-800">
        {!currentCode ? (
          <div className="flex h-full items-center justify-center px-10 text-center text-gray-600 italic">
            Describe the vibe, but more importantly, the feeling.
          </div>
        ) : (
          <SandpackProvider
            template="react"
            files={{ "/App.js": currentCode }}
            theme="dark"
            customSetup={{
              dependencies: {
                "framer-motion": "latest",
                "lucide-react": "latest",
              },
            }}
          >
            <SandpackLayout style={{ height: "100vh", border: "none", borderRadius: 0 }}>
              <SandpackPreview className="h-full w-full" showOpenInCodeSandbox={false} />
            </SandpackLayout>
          </SandpackProvider>
        )}
      </div>

      <div className="flex h-full w-[30%] flex-col bg-[#111] p-6">
        <div className="mb-4 flex items-center justify-end gap-2">
          <button
            onClick={() => switchLocale("en")}
            className={`rounded border px-2 py-1 text-[11px] ${
              locale === "en"
                ? "border-white bg-white text-black"
                : "border-gray-700 bg-black text-gray-300 hover:bg-gray-800"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => switchLocale("zh-HK")}
            className={`rounded border px-2 py-1 text-[11px] ${
              locale === "zh-HK"
                ? "border-white bg-white text-black"
                : "border-gray-700 bg-black text-gray-300 hover:bg-gray-800"
            }`}
          >
            繁中
          </button>
        </div>
        <div className="mb-4 rounded-lg border border-gray-800 bg-[#0f0f0f] p-2">
          <div className="mb-1 text-[11px] text-gray-500">{t.modeHint}</div>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("quick")}
              className={`rounded border px-2 py-1 text-xs ${
                mode === "quick"
                  ? "border-white bg-white text-black"
                  : "border-gray-700 bg-black text-gray-300 hover:bg-gray-800"
              }`}
            >
              {t.modeQuick}
            </button>
            <button
              onClick={() => setMode("pro")}
              className={`rounded border px-2 py-1 text-xs ${
                mode === "pro"
                  ? "border-white bg-white text-black"
                  : "border-gray-700 bg-black text-gray-300 hover:bg-gray-800"
              }`}
            >
              {t.modePro}
            </button>
          </div>
        </div>
        {mode === "pro" && (
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-xs uppercase tracking-widest text-gray-500">
            <span>Taste Evolution</span>
            <span>
              {Math.min(userMessageCount, REQUIRED_ITERATIONS)} / {REQUIRED_ITERATIONS}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{
                width: `${Math.min((userMessageCount / REQUIRED_ITERATIONS) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
        )}
        {mode === "quick" && (
          <div className="mb-4 rounded-lg border border-gray-800 bg-[#0f0f0f] p-3 text-sm">
            <textarea
              value={quickPrompt}
              onChange={(event) => setQuickPrompt(event.target.value)}
              placeholder={t.quickPromptPlaceholder}
              className="mb-2 h-24 w-full resize-none rounded border border-gray-700 bg-black p-2 text-sm text-gray-100"
            />
            <button
              onClick={handleQuickGenerate}
              disabled={quickLoading || !quickPrompt.trim()}
              className="w-full rounded border border-gray-700 bg-white py-2 text-xs font-medium text-black disabled:opacity-50"
            >
              {quickLoading ? t.quickGenerating : t.quickGenerateNow}
            </button>
            {(quickCaption || quickTasteSummary) && (
              <button
                onClick={() => void saveSnapshot("manual")}
                className="mt-2 w-full rounded border border-gray-700 bg-black py-2 text-xs text-gray-200 hover:bg-gray-800"
              >
                {t.saveSnapshot}
              </button>
            )}
            {!quickCaption && !quickTasteSummary && (
              <div className="mt-2 text-xs text-gray-500">{t.quickNoResultYet}</div>
            )}
          </div>
        )}
        {mode === "pro" && (
        <div className="mb-4 rounded-lg border border-gray-800 bg-[#0f0f0f] p-3 text-xs text-gray-300">
          <div className="mb-2 flex items-center justify-between uppercase tracking-widest text-gray-500">
            <span>{t.sessionHistory}</span>
          </div>
          <div className="mb-2 flex gap-2">
            <button
              onClick={() => void saveSnapshot("manual")}
              className="rounded border border-gray-700 px-2 py-1 text-gray-200 hover:bg-gray-800"
            >
              {t.saveSnapshot}
            </button>
            <button
              onClick={refreshSessions}
              className="rounded border border-gray-700 px-2 py-1 text-gray-200 hover:bg-gray-800"
            >
              {t.refresh}
            </button>
          </div>
          <div className="mb-2 flex gap-2">
            <input
              value={sessionTitleInput}
              onChange={(event) => setSessionTitleInput(event.target.value)}
              placeholder={t.sessionTitlePlaceholder}
              className="w-full rounded border border-gray-700 bg-black px-2 py-1 text-xs"
            />
            <button
              onClick={renameCurrentSession}
              disabled={!sessionId || !sessionTitleInput.trim()}
              className="rounded border border-gray-700 px-2 py-1 text-gray-200 hover:bg-gray-800 disabled:opacity-50"
            >
              {t.rename}
            </button>
            <button
              onClick={togglePinCurrentSession}
              disabled={!sessionId}
              className="rounded border border-gray-700 px-2 py-1 text-gray-200 hover:bg-gray-800 disabled:opacity-50"
            >
              {sessions.find((s) => s.id === sessionId)?.pinned ? t.unpin : t.pin}
            </button>
          </div>
          <select
            value={sessionId ?? ""}
            onChange={(event) => loadSession(event.target.value)}
            className="mb-2 w-full rounded border border-gray-700 bg-black px-2 py-1 text-xs"
          >
            <option value="">{t.selectSession}</option>
            {groupedDisplayedSessions.pinned.length > 0 && (
              <optgroup label={t.pinnedLabel}>
                {groupedDisplayedSessions.pinned.map((session) => (
                  <option key={session.id} value={session.id}>
                    📌 {session.title} ({session.versionCount})
                  </option>
                ))}
              </optgroup>
            )}
            {groupedDisplayedSessions.pinned.length === 0 && (
              <optgroup label={t.pinnedLabel}>
                <option value="" disabled>
                  {t.noPinnedSessions}
                </option>
              </optgroup>
            )}
            {groupedDisplayedSessions.unpinned.length > 0 && (
              <optgroup label={t.othersLabel}>
                {groupedDisplayedSessions.unpinned.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title} ({session.versionCount})
                  </option>
                ))}
              </optgroup>
            )}
            {groupedDisplayedSessions.unpinned.length === 0 && (
              <optgroup label={t.othersLabel}>
                <option value="" disabled>
                  {t.noOtherSessions}
                </option>
              </optgroup>
            )}
          </select>
          {sessions.length > RECENT_SESSION_LIMIT && (
            <button
              onClick={() => setShowAllSessions((v) => !v)}
              className="mb-2 rounded border border-gray-700 px-2 py-1 text-[11px] text-gray-300 hover:bg-gray-800"
            >
              {showAllSessions ? t.showRecentOnly : t.showAllWithCount(sessions.length)}
            </button>
          )}
          <select
            value={selectedVersionId}
            onChange={(event) => {
              const version = loadedSession?.versions.find((v) => v.id === event.target.value);
              if (version) applyVersion(version);
            }}
            className="w-full rounded border border-gray-700 bg-black px-2 py-1 text-xs"
            disabled={!loadedSession || loadedSession.versions.length === 0}
          >
            <option value="">{t.selectVersion}</option>
            {(loadedSession?.versions ?? []).map((version) => (
              <option key={version.id} value={version.id}>
                {new Date(version.savedAt).toLocaleString()}
              </option>
            ))}
          </select>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => exportSession("json")}
              disabled={!sessionId}
              className="rounded border border-gray-700 px-2 py-1 text-gray-200 hover:bg-gray-800 disabled:opacity-50"
            >
              {t.exportJson}
            </button>
            <button
              onClick={() => exportSession("md")}
              disabled={!sessionId}
              className="rounded border border-gray-700 px-2 py-1 text-gray-200 hover:bg-gray-800 disabled:opacity-50"
            >
              {t.exportMarkdown}
            </button>
          </div>
          {sessionStatus && (
            <div
              className={`mt-2 flex items-center gap-2 rounded border px-2 py-1 text-[11px] ${
                sessionStatusTone === "success"
                  ? "border-green-900 bg-[#0f1712] text-green-300"
                  : sessionStatusTone === "error"
                    ? "border-red-900 bg-[#1a1010] text-red-300"
                    : sessionStatusTone === "info"
                      ? "border-blue-900 bg-[#0f1420] text-blue-300"
                      : "border-gray-800 bg-black text-gray-500"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  sessionStatusTone === "success"
                    ? "bg-green-400"
                    : sessionStatusTone === "error"
                      ? "bg-red-400"
                      : sessionStatusTone === "info"
                        ? "bg-blue-400"
                        : "bg-gray-500"
                }`}
              />
              <span className="break-all">{sessionStatus}</span>
            </div>
          )}
        </div>
        )}
        {safetyResult && (
          <div
            className={`mb-4 rounded-lg border p-3 text-sm ${
              safetyResult.ok
                ? "border-green-900 bg-[#0f1712] text-green-300"
                : "border-amber-900 bg-[#1a1308] text-amber-200"
            }`}
          >
            <div className="mb-1 text-xs uppercase tracking-widest">
              Safety Guard: {safetyResult.ok ? "PASS" : "BLOCKED"}
            </div>
            {!safetyResult.ok && (
              <>
                <div className="mb-2 leading-relaxed text-amber-100">
                  Curator&apos;s Alert: 你的作品包含危險或不純粹的構造。在 VA Bot&apos;s Home，我們只接受純粹 React 藝術。請要求 AI 移除非法依賴或危險 API。
                </div>
                <ul className="list-disc space-y-1 pl-5 text-xs text-amber-200">
                  {safetyResult.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto text-lg leading-relaxed text-gray-200">
          {mode === "pro"
            ? isLoading && !curatorText
              ? "Curator is observing your intent..."
              : curatorText
            : null}
          {mode === "quick" && quickCaption && (
            <div className="mb-4 rounded-lg border border-gray-800 bg-black p-3 text-sm">
              <div className="mb-1 text-xs uppercase tracking-widest text-gray-500">
                {t.quickCaptionTitle}
              </div>
              <div className="text-gray-200">{quickCaption}</div>
            </div>
          )}
          {mode === "quick" && quickTasteSummary && (
            <div className="mb-4 rounded-lg border border-gray-800 bg-black p-3 text-sm">
              <div className="mb-1 text-xs uppercase tracking-widest text-gray-500">
                {t.quickTasteTitle}
              </div>
              <div className="text-gray-400">
                Core: <span className="text-gray-200">{quickTasteSummary.core_vibe}</span>
              </div>
              <div className="text-gray-400">
                Visuals:{" "}
                <span className="text-gray-200">
                  {quickTasteSummary.visual_preferences?.join(", ")}
                </span>
              </div>
              <div className="mt-1 italic text-gray-300">
                &quot;{quickTasteSummary.foundation_alignment}&quot;
              </div>
            </div>
          )}
          {mode === "pro" && tasteProfile && (
            <div className="mt-8 rounded-lg border border-gray-700 bg-black p-4 text-sm">
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-white">
                OpenClaw Taste Profile Saved
              </div>
              <div className="mb-1 text-gray-400">
                Core: <span className="text-gray-200">{tasteProfile.core_vibe}</span>
              </div>
              <div className="mb-1 text-gray-400">
                Visuals:{" "}
                <span className="text-gray-200">
                  {tasteProfile.visual_preferences?.join(", ")}
                </span>
              </div>
              <div className="mt-2 italic text-gray-300">
                &quot;{tasteProfile.foundation_alignment}&quot;
              </div>
              {tasteProfile.profileId && (
                <div className="mt-3 border-t border-gray-800 pt-2 text-xs text-gray-500">
                  Saved as profile <span className="text-gray-300">{tasteProfile.profileId}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {mode === "pro" && (
        <div className="mt-4 flex flex-col gap-4 border-t border-gray-800 pt-4">
          <form onSubmit={onSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                isUnlocked ? "You have found your foundation." : "Critique this piece..."
              }
              disabled={isLoading || isUnlocked}
              className="h-24 w-full resize-none rounded-md border border-gray-800 bg-transparent p-3 text-white outline-none transition focus:border-gray-500 disabled:opacity-50"
            />
            {!isUnlocked && (
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="mt-2 text-sm uppercase tracking-wider text-gray-400 transition hover:text-white disabled:opacity-50"
              >
                [ Submit Judgment ]
              </button>
            )}
          </form>

          <button
            disabled={!isUnlocked || isExtracting || Boolean(tasteProfile)}
            onClick={handleExport}
            className={`flex w-full items-center justify-center gap-2 rounded-md border py-3 px-4 text-sm font-medium transition-all duration-300 ${
              isUnlocked
                ? tasteProfile
                  ? "cursor-default border-green-900 bg-gray-800 text-green-400"
                  : "cursor-pointer border-transparent bg-white text-black hover:bg-gray-200"
                : "cursor-not-allowed border-gray-800 bg-gray-900 text-gray-600"
            }`}
          >
            {tasteProfile ? (
              <span>Foundation Exported and Profile Saved.</span>
            ) : isExtracting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Extracting Taste Profile...</span>
              </>
            ) : isUnlocked ? (
              <>
                <Unlock size={16} />
                <span>Align Foundation and Export Project</span>
              </>
            ) : (
              <>
                <Lock size={16} />
                <span>
                  Refine {Math.max(REQUIRED_ITERATIONS - userMessageCount, 0)} more times to unlock
                </span>
              </>
            )}
          </button>
        </div>
        )}
      </div>
    </div>
  );
}
