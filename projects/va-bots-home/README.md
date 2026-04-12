# VA Bot's Home Workspace MVP (OpenClaw Edition)

Taste-driven vibe coding sandbox with positive friction:

- Curator chat always asks critique questions
- Unlock export only after 3 user critiques
- On unlock, extract a persistent Taste Profile

## Stack

- Next.js (App Router)
- Vercel AI SDK (`ai`)
- OpenAI-compatible OpenClaw endpoint (`@ai-sdk/openai`)
- Sandpack renderer (`@codesandbox/sandpack-react`)

## Setup

1) Install dependencies

```bash
npm install
```

2) Create env file

```bash
cp .env.example .env.local
```

3) Fill `.env.local`

```bash
OPENCLAW_BASE_URL=http://127.0.0.1:8080/v1
OPENCLAW_API_KEY=dummy
OPENCLAW_MODEL=openclaw-curator
```

4) Start app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Endpoints

- `POST /api/chat`: Curator dialogue + React code output via XML tags
- `POST /api/extract-taste`: Extract user taste profile JSON
- `POST /api/quick-generate`: One-shot output (`reactCode + caption + tasteSummary`)

## Modes

- **Quick Mode**: one prompt, one click, instant result
  - Output: visual prototype, IG caption, taste summary
- **Pro Mode**: multi-round critique workflow
  - Output: iterative refinement, unlock flow, deeper curation

Quick Mode is designed for first-time users to see value immediately, while Pro Mode is for deliberate refinement.

## Local Taste Profile Persistence

- Successful `POST /api/extract-taste` calls are automatically persisted to:
  - `data/taste-profiles.json`
- API response now includes:
  - `profileId`
  - `savedAt`

## Session Persistence and Version Replay

- Session snapshots are persisted to:
  - `data/sessions.json`
- Frontend supports:
  - Manual session rename
  - Auto-save after assistant streaming completes
  - Save snapshot of current dialogue/canvas/profile
  - Reload a previous session
  - Replay a specific saved version
  - Export single session as JSON or Markdown

### Markdown Export Style

The Markdown export is formatted as a gallery-style archive:

- Session title and timestamps
- Curator assessment summary
- Per-iteration sections:
  - User judgment
  - Curator voice
  - Rendered foundation code block

## Defensive Guards Included

1. **Sandpack dependency whitelist**
   - Pre-injects `framer-motion` and `lucide-react` to reduce missing dependency crashes.
2. **Markdown fence cleanup**
   - `<react_code>` content is cleaned (` ```jsx ... ``` ` removed) before render.
3. **JSON mode first, fallback parse**
   - `extract-taste` uses JSON response format hint, then fallback cleaning + `JSON.parse`.
4. **Sliding context window**
   - Chat route prunes long history (keeps first vibe + latest context) for smaller local models.
5. **React Code Safety Guard (render-time validator)**
   - Blocks non-whitelisted imports (allow: `react`, `framer-motion`, `lucide-react`)
   - Blocks `require()` and dynamic `import()` for non-whitelisted packages
   - Blocks risky APIs (`eval`, `Function`, `document.cookie`, `localStorage`, `sessionStorage`, `fetch`, `document.querySelector`, `innerHTML`)
   - Requires `export default` and component output (`return` or `render`)
   - If blocked, previous valid code stays rendered and Curator-style alert is shown.

## Safety Guard Positioning

- This guard is primarily for **Sandpack crash prevention** and stable UX.
- It is **not** a full security boundary for your Next.js server runtime.
- Sandpack runs in a sandboxed iframe; this layer enforces product rules and output purity.

## Prompting Tips When Blocked

- Ask model to use only: `react`, `framer-motion`, `lucide-react`
- Ask model to avoid: `fetch`, storage APIs, direct DOM APIs
- Ask model to return a single React component with `export default`

## Notes for OpenClaw Compatibility

- Endpoint should support OpenAI-compatible chat format:
  - `POST /v1/chat/completions`
- If your bridge does not support JSON response format fully, fallback parser still handles fenced JSON.

## Production Safety

- Never hardcode API keys.
- Keep OpenClaw endpoint private (localhost / internal network).
- Add auth and rate limiting before internet exposure.
- Note: session storage currently uses local file system (`data/sessions.json`) for rapid MVP iteration. For production deployment on serverless platforms (e.g. Vercel), swap `lib/session-store.ts` to a database-backed implementation (Supabase / PostgreSQL).
