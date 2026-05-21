#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const briefPath = resolve(process.argv[2] || join(ROOT, "examples", "brief.example.json"));
const brief = JSON.parse(readFileSync(briefPath, "utf8"));
const id = brief.id || "untitled-run";
const outDir = join(ROOT, "output", "runs", id);
mkdirSync(outDir, { recursive: true });

let lyrics = "";
const lf = brief.lyrics_file;
if (lf) {
  const lp = lf.startsWith("/") ? lf : join(ROOT, lf);
  try {
    lyrics = readFileSync(lp, "utf8");
  } catch {
    lyrics = "(lyrics file not found)\n";
  }
}

const emotion = Array.isArray(brief.emotion_tags) ? brief.emotion_tags.join(", ") : "";
const slang = Array.isArray(brief.meme_cluster) ? brief.meme_cluster.join(", ") : "";
const oneLineStyle = [
  `Brainrot Gen Alpha party banger, ${brief.genre_mood || "hyperpop + heavy bass"}`,
  emotion,
  brief.instruments_vocals || "hype vocals, meme ad-libs",
  `slang vibe (not impersonation): ${slang}`,
  `~${brief.bpm || 140} BPM`,
].join(". ");

const gmivBlock = `## GMIV

| G | ${brief.genre_mood || ""} |
| M | ${emotion} |
| I | ${brief.instruments_vocals || ""} |
| V | Hype, clear; **no named-artist clone** |
| BPM | ${brief.bpm || 140} |

### One-line style (Suno → Style)
\`\`\`
${oneLineStyle}
\`\`\`
`;

const ytBlock = `## YouTube draft

**Title:** ${slang} Brainrot Anthem 2026 | Gen Alpha ${brief.meme_cluster?.[0] || "Meme"} Song

**Description:** ${brief.one_line_for_elders || ""} — CTA: comment / explain to parents. Disclosure: lyrics [you]; music Suno (paid plan); edit [you]. Sources: ${brief.sources_note || ""}

**Tags:** GenAlpha, Brainrot, SunoAI, MemeMusic, ${slang}

**Pre-publish:** Shazam check • unique thumbnail • cap daily uploads • ToS
`;

const pack = `# Suno pack: ${id}\n\n**Theme:** ${brief.theme_pitch || ""}\n\n${gmivBlock}\n## Lyrics\n\n\`\`\`\n${lyrics.trim()}\n\`\`\`\n\n${ytBlock}\n`;
writeFileSync(join(outDir, "PACK.md"), pack, "utf8");
writeFileSync(join(outDir, "lyrics.txt"), lyrics.trim() || "(paste lyrics)", "utf8");
console.log("Wrote:", join(outDir, "PACK.md"));
console.log("Wrote:", join(outDir, "lyrics.txt"));
