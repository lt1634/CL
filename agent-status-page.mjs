#!/usr/bin/env node
/**
 * Agent / Cron 狀態頁 — 讀 jobs.json 生成 HTML，瀏覽器打開即睇
 * 用法: node agent-status-page.mjs
 *       或 CRON_FILE=/path/to/jobs.json node agent-status-page.mjs
 * 輸出: docs/agent-status.html（或 OUT=path node ...）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CRON_FILE = process.env.CRON_FILE || `${process.env.HOME}/.openclaw/cron/jobs.json`;
const OUT = process.env.OUT || path.join(__dirname, 'docs', 'agent-status.html');

function formatWhen(schedule) {
  if (!schedule) return '—';
  if (schedule.kind === 'cron') return `${schedule.expr || ''} (${schedule.tz || 'local'})`;
  if (schedule.kind === 'every') return `every ${Math.floor((schedule.everyMs || 0) / 60000)}m`;
  if (schedule.kind === 'at') return schedule.at || '—';
  return '—';
}

function formatNextRun(nextRunAtMs) {
  if (!nextRunAtMs) return '—';
  try {
    const d = new Date(nextRunAtMs);
    const now = Date.now();
    const diff = nextRunAtMs - now;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    let rel = '';
    if (diff < 0) rel = 'overdue';
    else if (days > 0) rel = `${days}d ${hours % 24}h`;
    else if (hours > 0) rel = `${hours}h ${mins % 60}m`;
    else if (mins > 0) rel = `${mins}m`;
    else rel = 'now';
    const abs = d.toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `${abs} (${rel})`;
  } catch {
    return new Date(nextRunAtMs).toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' });
  }
}

function kindBadge(kind) {
  if (kind === 'agentTurn') return '<span class="badge agent">agent</span>';
  if (kind === 'systemEvent') return '<span class="badge event">event</span>';
  return '';
}

function formatTime(ms) {
  if (!ms) return '—';
  try {
    const d = new Date(ms);
    return d.toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong', dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return String(ms);
  }
}

function formatDuration(ms) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function escape(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let data;
try {
  data = JSON.parse(fs.readFileSync(CRON_FILE, 'utf8'));
} catch (e) {
  console.error('Read jobs.json failed:', e.message);
  process.exit(1);
}

const jobs = data.jobs || [];
const updated = new Date().toISOString();

// 有錯誤或需注意嘅 job（error / skipped 但有 lastError）
const errorJobs = jobs.filter((job) => {
  const s = job.state || {};
  const status = s.lastRunStatus || s.lastStatus;
  const hasError = !!s.lastError;
  return status === 'error' || (hasError && (status === 'skipped' || status !== 'ok'));
});

const errorRows = errorJobs.length === 0
  ? '<tr><td colspan="3" class="ok">無錯誤</td></tr>'
  : errorJobs.map((job) => {
      const s = job.state || {};
      const status = s.lastRunStatus || s.lastStatus || '—';
      return `<tr>
    <td><span class="name">${escape(job.name)}</span></td>
    <td><span class="${status === 'error' ? 'err' : 'warn'}">${escape(status)}</span></td>
    <td class="err-msg">${escape(s.lastError || '')}</td>
  </tr>`;
    }).join('');

const rows = jobs.map((job) => {
  const s = job.state || {};
  const status = s.lastRunStatus || s.lastStatus || '—';
  const statusClass = status === 'ok' ? 'ok' : status === 'error' ? 'err' : 'warn';
  const nextRunClass = (s.nextRunAtMs && s.nextRunAtMs < Date.now()) ? 'overdue' : '';
  return `
  <tr>
    <td><span class="name">${escape(job.name)}</span> ${kindBadge(job.payload?.kind)}<br><span class="id">${escape(job.id)}</span></td>
    <td>${escape(formatWhen(job.schedule))}</td>
    <td>${job.enabled ? '<span class="ok">✓</span>' : '<span class="muted">—</span>'}</td>
    <td>${escape(formatTime(s.lastRunAtMs))}</td>
    <td><span class="${statusClass}">${escape(status)}</span></td>
    <td>${escape(formatDuration(s.lastDurationMs))}</td>
    <td class="${nextRunClass}">${formatNextRun(s.nextRunAtMs)}</td>
    <td class="err-msg">${escape(s.lastError || '')}</td>
  </tr>`;
}).join('');

const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Agent / Cron 狀態</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 1rem; background: #1a1a1a; color: #e0e0e0; }
    h1 { font-size: 1.25rem; margin-bottom: 0.25rem; }
    .meta { font-size: 0.85rem; color: #888; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #333; }
    th { color: #aaa; font-weight: 600; }
    .name { font-weight: 500; }
    .id { font-size: 0.75rem; color: #666; }
    .ok { color: #6bcf7b; }
    .err { color: #e07070; }
    .warn { color: #d4a84b; }
    .err-msg { font-size: 0.8rem; color: #a66; max-width: 20rem; overflow: hidden; text-overflow: ellipsis; }
    tr:hover { background: #252525; }
    .errors-section { margin-bottom: 1.5rem; padding: 1rem; background: #252525; border-radius: 8px; border-left: 4px solid #e07070; }
    .errors-section h2 { font-size: 1rem; margin: 0 0 0.5rem 0; color: #e07070; }
    .errors-section table { margin: 0; }
    .badge { font-size: 0.65rem; padding: 1px 5px; border-radius: 4px; font-weight: 600; margin-left: 4px; vertical-align: middle; }
    .badge.agent { background: #2a4f7c; color: #7ab3ef; }
    .badge.event { background: #3d5a3d; color: #8fcf8f; }
    .overdue { color: #e07070; font-weight: 500; }
    .muted { color: #555; }
    tr.overdue-row { background: #2a1a1a; }
  </style>
</head>
<body>
  <h1>Agent / Cron 狀態</h1>
  <p class="meta">更新時間: ${escape(updated)} · 共 ${jobs.length} 個 job · 來源: ${escape(CRON_FILE)}</p>
  <section class="errors-section">
    <h2>⚠️ 錯誤 / 需注意 (${errorJobs.length})</h2>
    <table>
      <thead><tr><th>Job</th><th>狀態</th><th>錯誤訊息</th></tr></thead>
      <tbody>${errorRows}
      </tbody>
    </table>
  </section>
  <h2>全部 Job</h2>
  <table>
    <thead>
      <tr>
        <th>Job</th>
        <th>排程</th>
        <th>啟用</th>
        <th>上次跑</th>
        <th>狀態</th>
        <th>耗時</th>
        <th>下次跑</th>
        <th>錯誤</th>
      </tr>
    </thead>
    <tbody>${rows}
    </tbody>
  </table>
</body>
</html>
`;

const outDir = path.dirname(OUT);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(OUT, html, 'utf8');
console.log('Written:', OUT);
