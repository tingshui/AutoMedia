import { accessSync, constants, existsSync, mkdtempSync, rmSync } from "node:fs";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { createStaticServer } from "./serve.mjs";
import { scanFirstJianyingDraft } from "./jianying-style.mjs";

const host = "127.0.0.1";
const port = Number(process.env.AUTOMEDIA_PORT || 4173);
const chromePort = Number(process.env.AUTOMEDIA_CHROME_PORT || 9336);
const baseUrl = `http://${host}:${port}`;
const repoRoot = resolve(new URL("..", import.meta.url).pathname);
const dbPath = resolve(repoRoot, "data", "automedia.sqlite3");
const libraryDir = resolve(repoRoot, "data", "library");
const fixturePath = resolve(repoRoot, "fixtures/media/m3m6_fixture_video.mp4");
const rawForbidden = [
  "06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4",
  "砰，拳击声",
  "录像带 III",
  "综艺字-扎心了红色",
  "震惊",
  "扎心",
  "渐变背景",
];
const chromeCandidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
].filter(Boolean);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function resetDb() {
  const result = spawnSync("python3", ["scripts/reset-db.py"], { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
}

function withDb(callback) {
  const db = new DatabaseSync(dbPath);
  try {
    db.exec("PRAGMA foreign_keys = ON");
    return callback(db);
  } finally {
    db.close();
  }
}

function count(table) {
  return withDb((db) => db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count);
}

function cleanForeignKeys() {
  return withDb((db) => db.prepare("PRAGMA foreign_key_check").all());
}

function findChrome() {
  for (const candidate of chromeCandidates) {
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // continue
    }
  }
  throw new Error("Chrome not found. Set CHROME_PATH.");
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function waitForServer(url, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolveWait, reject) => {
    function tryRequest() {
      const req = request(url, (response) => {
        response.resume();
        resolveWait();
      });
      req.on("error", () => {
        if (Date.now() > deadline) reject(new Error(`Server did not start at ${url}`));
        else setTimeout(tryRequest, 100);
      });
      req.end();
    }
    tryRequest();
  });
}

async function fetchJson(url) {
  const deadline = Date.now() + 5000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
      lastError = new Error(`Fetch failed ${url}: ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw lastError || new Error(`Fetch failed ${url}`);
}

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.nextId = 1;
    this.pending = new Map();
  }
  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolveOpen, reject) => {
      this.ws.addEventListener("open", resolveOpen, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data.toString());
      if (!message.id || !this.pending.has(message.id)) return;
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result || {});
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  close() {
    this.ws?.close();
  }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  }
  return result.result?.value;
}

async function waitForCondition(cdp, expression, label, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(cdp, expression)) return;
    await sleep(75);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function click(cdp, selector) {
  await evaluate(cdp, `document.querySelector(${JSON.stringify(selector)}).click(); true`);
  await sleep(120);
}

async function setValue(cdp, selector, value) {
  await evaluate(
    cdp,
    `(() => { const el=document.querySelector(${JSON.stringify(selector)}); el.value=${JSON.stringify(value)}; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`,
  );
}

async function navigate(cdp, hash = "#/home") {
  await cdp.send("Page.navigate", { url: `${baseUrl}/?v=${Date.now()}${hash}` });
  await waitForCondition(cdp, "document.readyState === 'complete' && Boolean(window.__automediaReady)", "app ready");
}

function dbStyleFacts() {
  return withDb((db) => ({
    style: db.prepare("SELECT * FROM style_profiles WHERE id = 'style_jianying_3yue6'").get(),
    rules: db.prepare("SELECT * FROM style_rules WHERE style_profile_id = 'style_jianying_3yue6' ORDER BY id").all(),
    reference: db.prepare("SELECT * FROM style_reference_videos WHERE id = 'reference_jianying_3yue6'").get(),
  }));
}

function assertNoForbiddenRawStrings(label) {
  const surfaces = withDb((db) => {
    const tables = [
      ["style_rules", "rule_text || ' ' || rule_json"],
      ["style_reference_videos", "analysis_json"],
      ["effect_presets", "display_name || ' ' || properties_json"],
      ["audio_presets", "display_name || ' ' || properties_json"],
      ["music_assets", "display_name || ' ' || properties_json"],
      ["sticker_assets", "display_name || ' ' || properties_json"],
      ["transition_presets", "display_name || ' ' || properties_json"],
      ["timeline_items", "properties_json"],
    ];
    return tables.flatMap(([table, expr]) => db.prepare(`SELECT '${table}' AS table_name, ${expr} AS value FROM ${table}`).all());
  });
  for (const forbidden of rawForbidden) {
    assert(!surfaces.some((row) => String(row.value || "").includes(forbidden)), `${label}: raw Jianying string leaked: ${forbidden}`);
  }
}

async function main() {
  resetDb();
  const scan = scanFirstJianyingDraft();
  assert(scan.draftName === "3月6日", "C1 first draft should be 3月6日");
  assert(scan.durationMicroseconds === 147233333, "C1 duration microseconds should match root meta");
  assert(scan.opaqueFiles.includes("draft_info.json"), "C1 opaque files should include draft_info.json");

  const server = createStaticServer();
  const userDataDir = mkdtempSync(join(tmpdir(), "automedia-m3m6-chrome-"));
  let chrome;
  let cdp;
  try {
    await new Promise((resolveListen, reject) => {
      server.once("error", reject);
      server.listen(port, host, resolveListen);
    });
    await waitForServer(`${baseUrl}/`);

    chrome = spawn(findChrome(), [
      "--headless=new",
      `--remote-debugging-port=${chromePort}`,
      `--user-data-dir=${userDataDir}`,
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ], { stdio: "ignore" });
    const targets = await fetchJson(`http://${host}:${chromePort}/json/list`);
    const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
    cdp = new CdpClient(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    await navigate(cdp, "#/home");
    await waitForCondition(cdp, "window.__automediaState.styles.some(s => s.id === 'style_jianying_3yue6')", "jianying style imported");
    let facts = dbStyleFacts();
    assert(facts.style.name === "剪映导入-3月6日", "C2 style name should match");
    assert(facts.rules.length === 7, "C2 should import exactly seven rules");
    assert(facts.rules.every((rule) => rule.enabled === 0 && rule.source === "inferred" && rule.confidence === 0.5), "C2 rules should be disabled inferred needs-review candidates");
    assert(facts.rules.every((rule) => JSON.parse(rule.rule_json).review_status === "needs_review"), "C2 review status should be needs_review");
    assert(JSON.parse(facts.reference.analysis_json).category_counts.audio === 33, "C2 analysis should contain category counts");
    assertNoForbiddenRawStrings("C2");

    await click(cdp, "#openStyleManager");
    let visible = await evaluate(cdp, `document.body.innerText`);
    assert(visible.includes("剪映导入-3月6日"), "C3 Style Manager should show imported style");
    assert(!visible.includes("视频剪辑") && !visible.includes("视频发布"), "C3 style manager sidebar should not show editor nav");
    await click(cdp, '[data-style-id="style_jianying_3yue6"]');
    visible = await evaluate(cdp, `document.querySelector('#styleDetailModal').innerText`);
    for (const forbidden of rawForbidden) assert(!visible.includes(forbidden), `C2 UI leaked raw string ${forbidden}`);
    await setValue(cdp, "#styleNameInput", "剪映导入-3月6日 Renamed");
    await click(cdp, "#saveStyleButton");
    assert(withDb((db) => db.prepare("SELECT name FROM style_profiles WHERE id='style_jianying_3yue6'").get().name) === "剪映导入-3月6日 Renamed", "C4 rename persists");

    const firstRule = facts.rules[0].id;
    const beforeEnabled = withDb((db) => db.prepare("SELECT enabled FROM style_rules WHERE id=?").get(firstRule).enabled);
    await click(cdp, `[data-rule-id="${firstRule}"] input`);
    const afterEnabled = withDb((db) => db.prepare("SELECT enabled FROM style_rules WHERE id=?").get(firstRule).enabled);
    assert(beforeEnabled !== afterEnabled, "C5 toggle should persist");
    await click(cdp, `[data-delete-rule="${firstRule}"]`);
    await click(cdp, "#cancelDeleteConfirm");
    assert(withDb((db) => db.prepare("SELECT deleted_at FROM style_rules WHERE id=?").get(firstRule).deleted_at) === null, "C6 cancel delete should keep rule");
    await click(cdp, `[data-delete-rule="${firstRule}"]`);
    await click(cdp, "#confirmDelete");
    assert(withDb((db) => db.prepare("SELECT deleted_at FROM style_rules WHERE id=?").get(firstRule).deleted_at) !== null, "C6 confirmed delete should soft delete rule");
    assert(withDb((db) => db.prepare("SELECT COUNT(*) AS count FROM confirmation_events WHERE target_id=? AND decision='confirmed'").get(firstRule).count) === 1, "C6 confirmed event should exist once");

    const invalidStyleCount = count("confirmation_events");
    assert((await api("/api/styles/missing", { method: "PATCH", body: JSON.stringify({ name: "bad" }) })).status === 404, "C7 invalid style PATCH should 404");
    assert(count("confirmation_events") === invalidStyleCount, "C7 invalid style should not write event");

    // C7: confirming deletion of the imported Jianying style must survive reload/startup.
    await click(cdp, '[data-style-id="style_jianying_3yue6"]');
    await click(cdp, "#deleteStyleButton");
    await click(cdp, "#confirmDelete");
    assert(withDb((db) => db.prepare("SELECT deleted_at FROM style_profiles WHERE id='style_jianying_3yue6'").get().deleted_at) !== null, "C7 style delete should set deleted_at");
    await navigate(cdp, "#/home");
    const afterDeleteBootstrap = await api("/api/bootstrap");
    assert(!afterDeleteBootstrap.data.styles.some((style) => style.id === "style_jianying_3yue6"), "C7 deleted style should be absent from bootstrap");
    assert(!(await evaluate(cdp, `window.__automediaState.styles.some((style) => style.id === 'style_jianying_3yue6')`)), "C7 deleted style should not reappear in Home after startup");
    const importAfterDelete = await api("/api/styles/import-jianying-first", { method: "POST", body: JSON.stringify({}) });
    assert(importAfterDelete.data.skipped === true && importAfterDelete.data.reason === "style_soft_deleted", "C7 automatic import should skip soft-deleted style");
    assert(withDb((db) => db.prepare("SELECT deleted_at FROM style_profiles WHERE id='style_jianying_3yue6'").get().deleted_at) !== null, "C7 skipped import should not revive style");

    await navigate(cdp, "#/editor/project_adhd_vlog_01");
    await waitForCondition(cdp, "window.__automediaState.currentProject?.project?.id === 'project_adhd_vlog_01'", "editor project loaded");
    await setValue(cdp, "#pageTitleInput", "Unsaved M4 Title");
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(cdp, "document.readyState === 'complete' && Boolean(window.__automediaReady)", "reload after unsaved title");
    assert(withDb((db) => db.prepare("SELECT title FROM projects WHERE id='project_adhd_vlog_01'").get().title) !== "Unsaved M4 Title", "C9 autosave negative");
    await setValue(cdp, "#pageTitleInput", "Saved M4 Title");
    await click(cdp, "#saveProject");
    assert(withDb((db) => db.prepare("SELECT title FROM projects WHERE id='project_adhd_vlog_01'").get().title) === "Saved M4 Title", "C9 save should persist title");

    await click(cdp, "#editorNav");
    await click(cdp, ".edit-step-check");
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(cdp, "document.readyState === 'complete' && Boolean(window.__automediaReady)", "reload after unsaved step");
    assert(withDb((db) => db.prepare("SELECT enabled FROM edit_steps WHERE project_id='project_adhd_vlog_01' AND step_key='arrange_timeline'").get().enabled) === 1, "C11 unsaved step should revert");
    await click(cdp, ".edit-step-check");
    await click(cdp, "#saveProject");
    assert(withDb((db) => db.prepare("SELECT enabled FROM edit_steps WHERE project_id='project_adhd_vlog_01' AND step_key='arrange_timeline'").get().enabled) === 0, "C11 saved step should persist");

    const beforeAssets = count("source_assets");
    await click(cdp, "[data-import-fixture]");
    await waitForCondition(cdp, "window.__automediaState.currentProject.assets.some(a => a.originalName === 'm3m6_fixture_video.mp4')", "fixture imported");
    assert(count("source_assets") === beforeAssets + 1, "C12 first import creates source asset");
    assert(existsSync(resolve(repoRoot, withDb((db) => db.prepare("SELECT file_path FROM source_assets WHERE original_name='m3m6_fixture_video.mp4'").get().file_path))), "C12 copied file exists");
    await click(cdp, "[data-import-fixture]");
    assert(count("source_assets") === beforeAssets + 1, "C12 duplicate same project reuses source asset");
    assert((await api("/api/projects/project_adhd_vlog_01/import-asset", { method: "POST", body: JSON.stringify({ filePath: "../bad.mp4" }) })).status === 400, "C13 path traversal rejected");
    assert((await api("/api/projects/project_adhd_vlog_01/import-asset", { method: "POST", body: JSON.stringify({ filePath: "fixtures/media/missing.mp4" }) })).status === 404, "C13 missing rejected");

    const assetId = withDb((db) => db.prepare("SELECT id FROM source_assets WHERE original_name='m3m6_fixture_video.mp4'").get().id);
    await click(cdp, `[data-add-video-asset="${assetId}"]`);
    assert(withDb((db) => db.prepare("SELECT COUNT(*) AS count FROM timeline_items WHERE item_type='video' AND source_asset_id=? AND deleted_at IS NULL").get(assetId).count) === 1, "C14 video item created");
    await click(cdp, "[data-add-text]");
    assert(withDb((db) => db.prepare("SELECT properties_json FROM timeline_items WHERE item_type='text' AND deleted_at IS NULL ORDER BY created_at DESC").get().properties_json).includes("新的文本片段"), "C15 text item created");
    await click(cdp, "[data-add-subtitle]");
    const subtitleRows = withDb((db) => db.prepare("SELECT text FROM subtitle_segments WHERE project_id='project_adhd_vlog_01' AND deleted_at IS NULL ORDER BY start_ms").all());
    assert(subtitleRows.length === 2 && subtitleRows[0].text === "第一句来了。" && subtitleRows[1].text === "第二句继续。", "C16 sentence subtitles created");
    assert(!subtitleRows.some((row) => row.text === "第" || row.text === "一"), "C16 no word-level subtitle rows");

    for (const [selector, type, catalogId] of [
      ['[data-catalog-id="effect_presets_keyword_pop"]', "effect", "effect_presets_keyword_pop"],
      ['[data-catalog-id="audio_presets_pop"]', "audio", "audio_presets_pop"],
      ['[data-catalog-id="music_assets_calm_loop"]', "music", "music_assets_calm_loop"],
      ['[data-catalog-id="sticker_assets_spark"]', "sticker", "sticker_assets_spark"],
      ['[data-catalog-id="transition_presets_flash_white"]', "transition", "transition_presets_flash_white"],
    ]) {
      await click(cdp, selector);
      assert(withDb((db) => db.prepare("SELECT COUNT(*) AS count FROM timeline_items WHERE item_type=? AND properties_json LIKE ? AND deleted_at IS NULL").get(type, `%${catalogId}%`).count) === 1, `C17 ${type} catalog item created`);
    }
    assert((await api("/api/projects/project_adhd_vlog_01/timeline-items", { method: "POST", body: JSON.stringify({ catalogType: "effect", catalogId: "missing" }) })).status === 400, "C17 invalid catalog rejected");

    const deleteCandidate = withDb((db) => db.prepare("SELECT id FROM timeline_items WHERE item_type='text' AND deleted_at IS NULL LIMIT 1").get().id);
    await click(cdp, `[data-item-id="${deleteCandidate}"]`);
    assert(withDb((db) => db.prepare("SELECT deleted_at FROM timeline_items WHERE id=?").get(deleteCandidate).deleted_at) !== null, "C18 timeline item soft deleted");
    assert(cleanForeignKeys().length === 0, "foreign keys should be clean");
    assertNoForbiddenRawStrings("final");
    console.log("AutoMedia M3-M6 browser, API, file, and database verification passed.");
  } finally {
    cdp?.close();
    if (chrome && !chrome.killed) {
      chrome.kill();
      await new Promise((resolveExit) => {
        chrome.once("exit", resolveExit);
        setTimeout(resolveExit, 1000);
      });
    }
    await new Promise((resolveClose) => server.close(resolveClose));
    rmSync(userDataDir, { recursive: true, force: true });
    rmSync(libraryDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
