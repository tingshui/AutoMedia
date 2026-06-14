import { accessSync, constants, mkdtempSync, rmSync } from "node:fs";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { createStaticServer } from "./serve.mjs";

const host = "127.0.0.1";
const port = Number(process.env.AUTOMEDIA_PORT || 4173);
const chromePort = Number(process.env.AUTOMEDIA_CHROME_PORT || 9334);
const baseUrl = `http://${host}:${port}`;
const repoRoot = resolve(new URL("..", import.meta.url).pathname);
const dbPath = resolve(repoRoot, "data", "automedia.sqlite3");
let navigationCounter = 0;

const chromeCandidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

const m2Tables = [
  "projects",
  "source_assets",
  "project_assets",
  "project_style_profiles",
  "edit_steps",
  "timeline_tracks",
  "project_layout_preferences",
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function resetDb() {
  const result = spawnSync("python3", ["scripts/reset-db.py"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`DB reset failed: ${result.stderr || result.stdout}`);
  }
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

function tableCounts() {
  return withDb((db) => Object.fromEntries(m2Tables.map((table) => [table, db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count])));
}

function assertCountsEqual(actual, expected, label) {
  for (const table of m2Tables) {
    assert(actual[table] === expected[table], `${label}: ${table} expected ${expected[table]}, got ${actual[table]}`);
  }
}

function projectRows(projectId) {
  return withDb((db) => ({
    project: db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId),
    assets: db.prepare("SELECT * FROM project_assets WHERE project_id = ?").all(projectId),
    styles: db.prepare("SELECT * FROM project_style_profiles WHERE project_id = ?").all(projectId),
    steps: db.prepare("SELECT step_key, enabled, sort_order FROM edit_steps WHERE project_id = ? ORDER BY sort_order").all(projectId),
    tracks: db.prepare("SELECT track_type, name, sort_order FROM timeline_tracks WHERE project_id = ? ORDER BY sort_order").all(projectId),
    layout: db.prepare("SELECT * FROM project_layout_preferences WHERE project_id = ?").get(projectId),
    sourceAsset: db.prepare(
      `
      SELECT source_assets.*
      FROM source_assets
      JOIN project_assets ON project_assets.asset_id = source_assets.id
      WHERE project_assets.project_id = ? AND project_assets.role = 'source'
      `,
    ).get(projectId),
  }));
}

function assertProjectBundle(projectId, title, filename, styleId) {
  const rows = projectRows(projectId);
  assert(rows.project?.title === title, "C4 project title should match derived filename");
  assert(rows.project?.status === "draft", "C4 project status should be draft");
  assert(rows.sourceAsset?.asset_type === "video", "C4 source asset should be video");
  assert(rows.sourceAsset?.original_name === filename, "C4 source asset original filename should match");
  assert(
    rows.sourceAsset?.metadata_json === JSON.stringify({ fixture: true, m2_placeholder: true, codec: "placeholder", fps: 30, bitrate: 0 }),
    "C4 source metadata should match exact M2 placeholder contract",
  );
  assert(rows.assets.length === 1 && rows.assets[0].role === "source", "C4 should create one source project asset");
  assert(rows.styles.length === 1 && rows.styles[0].style_profile_id === styleId, "C4 should link selected style");
  assert(rows.steps.length === 4, "C4 should create four edit steps");
  assert(rows.steps.every((row) => row.enabled === 1), "C4 all edit steps should be enabled");
  assert(rows.steps.map((row) => row.step_key).join(",") === "arrange_timeline,clean_speech,subtitles_bilingual,apply_style_profile", "C4 edit step keys should match");
  assert(rows.tracks.length === 4, "C4 should create four tracks");
  assert(rows.tracks.map((row) => row.track_type).join(",") === "video,audio,subtitles,effects", "C4 track types should match");
  assert(rows.layout?.video_panel_height === 520, "C4 video panel height should be 520");
  assert(rows.layout?.timeline_panel_height === 260, "C4 timeline panel height should be 260");
  assert(rows.layout?.sidebar_collapsed === 0, "C4 sidebar collapsed should be 0");
}

function assertForeignKeysClean() {
  return withDb((db) => {
    const rows = db.prepare("PRAGMA foreign_key_check").all();
    assert(rows.length === 0, `foreign_key_check should be clean, got ${JSON.stringify(rows)}`);
  });
}

function findChrome() {
  for (const candidate of chromeCandidates) {
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }
  throw new Error("Chrome/Chromium not found. Set CHROME_PATH to a Chrome executable.");
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
        if (Date.now() > deadline) {
          reject(new Error(`Server did not start at ${url}`));
          return;
        }
        setTimeout(tryRequest, 100);
      });
      req.end();
    }
    tryRequest();
  });
}

async function fetchJson(url, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      await sleep(100);
    }
  }
  throw new Error(`Could not fetch ${url}`);
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
      if (!message.id || !this.pending.has(message.id)) {
        return;
      }
      const { resolve: resolvePending, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolvePending(message.result || {});
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolveSend, reject) => {
      this.pending.set(id, { resolve: resolveSend, reject });
    });
  }

  close() {
    this.ws?.close();
  }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    const description = result.exceptionDetails.exception?.description || result.exceptionDetails.text;
    throw new Error(description || "Runtime evaluation failed");
  }
  return result.result?.value;
}

async function waitForCondition(cdp, expression, label, timeoutMs = 4000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(cdp, expression)) {
      return;
    }
    await sleep(75);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function navigate(cdp, url) {
  const nextUrl = new URL(url);
  if (nextUrl.origin === baseUrl) {
    navigationCounter += 1;
    nextUrl.searchParams.set("__m2", String(navigationCounter));
  }
  await cdp.send("Page.navigate", { url: nextUrl.toString() });
  await waitForCondition(cdp, "document.readyState === 'complete'", `load ${nextUrl.toString()}`);
  await waitForCondition(cdp, "Boolean(window.__automediaReady)", "AutoMedia app ready");
}

async function click(cdp, selector) {
  const selectorLiteral = JSON.stringify(selector);
  await evaluate(
    cdp,
    `(() => {
      const element = document.querySelector(${selectorLiteral});
      if (!element) throw new Error('Missing selector: ' + ${selectorLiteral});
      element.click();
      return true;
    })()`,
  );
  await sleep(100);
}

async function setValue(cdp, selector, value) {
  const selectorLiteral = JSON.stringify(selector);
  const valueLiteral = JSON.stringify(value);
  await evaluate(
    cdp,
    `(() => {
      const element = document.querySelector(${selectorLiteral});
      if (!element) throw new Error('Missing selector: ' + ${selectorLiteral});
      element.value = ${valueLiteral};
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`,
  );
}

async function selectStyle(cdp, styleId) {
  const styleLiteral = JSON.stringify(styleId);
  await evaluate(
    cdp,
    `(() => {
      const element = document.querySelector('input[name="newVideoStyle"][value=' + CSS.escape(${styleLiteral}) + ']');
      if (!element) throw new Error('Missing style option: ' + ${styleLiteral});
      element.checked = true;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`,
  );
}

async function readState(cdp) {
  return evaluate(
    cdp,
    `(() => ({
      hash: window.location.hash,
      activeView: document.querySelector('.app-shell')?.dataset.activeView,
      titleValue: document.querySelector('#pageTitleInput')?.value,
      currentProjectId: window.__automediaState?.currentProjectId || null,
      recentTitles: Array.from(document.querySelectorAll('.recent-card strong')).map((element) => element.textContent.trim()),
      recentIds: Array.from(document.querySelectorAll('.recent-card')).map((element) => element.dataset.projectId || ''),
      recentCardCount: document.querySelectorAll('.recent-card').length,
      recentEmpty: document.querySelector('[data-testid="recent-empty"]')?.textContent.trim() || '',
      styleOptions: Array.from(document.querySelectorAll('input[name="newVideoStyle"]')).map((input) => ({
        id: input.value,
        label: input.parentElement.textContent.trim(),
      })),
      newVideoModalOpen: document.querySelector('#newVideoModal')?.classList.contains('active'),
      newVideoError: document.querySelector('#newVideoError')?.textContent.trim() || '',
    }))()`,
  );
}

async function postJson(path, payload) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

async function main() {
  resetDb();
  const server = createStaticServer();
  const userDataDir = mkdtempSync(join(tmpdir(), "automedia-m2-chrome-"));
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
    const pageTarget = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
    assert(pageTarget, "Could not find Chrome page target");
    cdp = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    // C1: DB rename appears in Home and stale title disappears.
    withDb((db) => {
      db.prepare("UPDATE projects SET title = 'M2 DB Renamed Project', updated_at = '2026-06-13T01:00:00Z' WHERE id = 'project_adhd_vlog_01'").run();
    });
    await navigate(cdp, `${baseUrl}/#/home`);
    let state = await readState(cdp);
    assert(state.recentTitles.includes("M2 DB Renamed Project"), "C1 Home should show renamed DB title");
    assert(!state.recentTitles.includes("ADHD 教育实验 vlog 01"), "C1 Home should not show stale hard-coded title");
    assert(withDb((db) => db.prepare("SELECT COUNT(*) AS count FROM projects WHERE title = 'M2 DB Renamed Project'").get().count) === 1, "C1 only one title should be changed");

    // C2: Direct DB insert appears first.
    withDb((db) => {
      db.prepare(
        `
        INSERT INTO source_assets
          (id, asset_type, file_path, original_name, duration_ms, width, height, checksum, metadata_json, created_at)
        VALUES ('asset_m2_direct_insert', 'video', 'fixtures/media/direct.txt', 'direct.txt', 1000, 1080, 1920, 'direct', '{}', '2026-06-13T02:00:00Z')
        `,
      ).run();
      db.prepare(
        `
        INSERT INTO projects
          (id, title, status, thumbnail_asset_id, last_playhead_ms, duration_ms, created_at, updated_at, deleted_at)
        VALUES ('project_m2_direct_insert', 'M2 Direct Insert Draft', 'draft', 'asset_m2_direct_insert', 0, 1000, '2026-06-13T02:00:00Z', '2026-06-13T02:00:00Z', NULL)
        `,
      ).run();
    });
    await navigate(cdp, `${baseUrl}/#/home`);
    state = await readState(cdp);
    assert(state.recentTitles[0] === "M2 Direct Insert Draft", "C2 newest direct insert should appear first");

    // C3: Cancel modal writes nothing.
    const beforeCancel = tableCounts();
    await click(cdp, "#openNewVideo");
    await click(cdp, '[data-close-modal="newVideoModal"]');
    state = await readState(cdp);
    assert(!state.newVideoModalOpen, "C3 modal should close");
    assertCountsEqual(tableCounts(), beforeCancel, "C3 cancel");

    // C4/C5: Confirm creates durable project and editor route reloads the same project.
    resetDb();
    await navigate(cdp, `${baseUrl}/#/home`);
    const beforeCreate = tableCounts();
    await click(cdp, "#openNewVideo");
    await setValue(cdp, "#newVideoFilename", "family_test_clip.mp4");
    await selectStyle(cdp, "style_daily");
    await click(cdp, "#confirmNewVideo");
    await waitForCondition(cdp, "window.location.hash.startsWith('#/editor/')", "C4 editor project route");
    state = await readState(cdp);
    const createdProjectId = state.currentProjectId;
    assert(createdProjectId, "C4 current project id should be set");
    assert(state.titleValue === "family_test_clip", "C4 editor title should be created project title");
    const afterCreate = tableCounts();
    for (const table of ["projects", "source_assets", "project_assets", "project_style_profiles", "project_layout_preferences"]) {
      assert(afterCreate[table] === beforeCreate[table] + 1, `C4 ${table} should increment by one`);
    }
    assert(afterCreate.edit_steps === beforeCreate.edit_steps + 4, "C4 edit_steps should increment by four");
    assert(afterCreate.timeline_tracks === beforeCreate.timeline_tracks + 4, "C4 timeline_tracks should increment by four");
    assertProjectBundle(createdProjectId, "family_test_clip", "family_test_clip.mp4", "style_daily");
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(cdp, "document.readyState === 'complete' && Boolean(window.__automediaReady)", "C5 reload editor");
    state = await readState(cdp);
    assert(state.currentProjectId === createdProjectId, "C5 current project id should survive reload");
    assert(state.titleValue === "family_test_clip", "C5 title should survive reload");

    // C8: Style picker reads DB rename and soft delete, and invalid style API is rejected atomically.
    resetDb();
    withDb((db) => {
      db.prepare("UPDATE style_profiles SET name = 'M2 Daily Renamed' WHERE id = 'style_daily'").run();
      db.prepare("UPDATE style_profiles SET deleted_at = '2026-06-13T03:00:00Z' WHERE id = 'style_funny'").run();
    });
    await navigate(cdp, `${baseUrl}/#/home`);
    await click(cdp, "#openNewVideo");
    state = await readState(cdp);
    assert(state.styleOptions.some((option) => option.id === "style_daily" && option.label.includes("M2 Daily Renamed")), "C8 renamed style should appear");
    assert(!state.styleOptions.some((option) => option.id === "style_daily" && option.label.includes("日常")), "C8 stale style label should be absent");
    assert(!state.styleOptions.some((option) => option.id === "style_funny"), "C8 soft-deleted style should be absent");
    const beforeInvalidStyle = tableCounts();
    const invalidStyleResponse = await postJson("/api/projects", { filename: "bad_style.mp4", styleId: "style_funny" });
    assert(invalidStyleResponse.status === 400, "C8 soft-deleted style API should return 400");
    assertCountsEqual(tableCounts(), beforeInvalidStyle, "C8 invalid style rollback");
    assertForeignKeysClean();

    // C9: deleted and archived projects are filtered.
    resetDb();
    withDb((db) => {
      db.prepare("UPDATE projects SET deleted_at = '2026-06-13T04:00:00Z', updated_at = '2026-06-13T04:00:00Z' WHERE id = 'project_adhd_vlog_01'").run();
      db.prepare(
        `
        INSERT INTO source_assets
          (id, asset_type, file_path, original_name, duration_ms, width, height, checksum, metadata_json, created_at)
        VALUES ('asset_m2_archived', 'video', 'fixtures/media/archived.txt', 'archived.txt', 1000, 1080, 1920, 'archived', '{}', '2026-06-13T05:00:00Z')
        `,
      ).run();
      db.prepare(
        `
        INSERT INTO projects
          (id, title, status, thumbnail_asset_id, last_playhead_ms, duration_ms, created_at, updated_at, deleted_at)
        VALUES ('project_m2_archived', 'M2 Archived Project', 'archived', 'asset_m2_archived', 0, 1000, '2026-06-13T05:00:00Z', '2026-06-13T05:00:00Z', NULL)
        `,
      ).run();
    });
    await navigate(cdp, `${baseUrl}/#/home`);
    state = await readState(cdp);
    assert(!state.recentTitles.includes("ADHD 教育实验 vlog 01"), "C9 soft-deleted project should be absent");
    assert(!state.recentTitles.includes("M2 Archived Project"), "C9 archived project should be absent");

    // C10: Direct editor route restores project.
    resetDb();
    await navigate(cdp, `${baseUrl}/#/editor/project_ai_family_workflow`);
    state = await readState(cdp);
    assert(state.currentProjectId === "project_ai_family_workflow", "C10 direct editor route should set project id");
    assert(state.titleValue === "AI 家庭 workflow 复盘", "C10 direct editor route should load DB title");
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitForCondition(cdp, "document.readyState === 'complete' && Boolean(window.__automediaReady)", "C10 reload");
    state = await readState(cdp);
    assert(state.currentProjectId === "project_ai_family_workflow", "C10 reload should keep project id");
    assert(state.titleValue === "AI 家庭 workflow 复盘", "C10 reload should keep DB title");

    // C11: Double-click guarded, missing filename and invalid API writes no rows.
    resetDb();
    await navigate(cdp, `${baseUrl}/#/home`);
    const beforeDouble = tableCounts();
    await click(cdp, "#openNewVideo");
    await setValue(cdp, "#newVideoFilename", "double_click_clip.mp4");
    await selectStyle(cdp, "style_daily");
    await evaluate(cdp, "document.querySelector('#confirmNewVideo').click(); document.querySelector('#confirmNewVideo').click(); true");
    await waitForCondition(cdp, "window.location.hash.startsWith('#/editor/')", "C11 double click editor route");
    state = await readState(cdp);
    const afterDouble = tableCounts();
    assert(afterDouble.projects === beforeDouble.projects + 1, "C11 double click should create one project");
    assertProjectBundle(state.currentProjectId, "double_click_clip", "double_click_clip.mp4", "style_daily");
    resetDb();
    await navigate(cdp, `${baseUrl}/#/home`);
    const beforeMissingFilename = tableCounts();
    await click(cdp, "#openNewVideo");
    await setValue(cdp, "#newVideoFilename", "");
    await click(cdp, "#confirmNewVideo");
    state = await readState(cdp);
    assert(state.newVideoError.includes("素材文件名"), "C11 missing filename should show visible error");
    assertCountsEqual(tableCounts(), beforeMissingFilename, "C11 missing filename");
    const beforeInvalidApi = tableCounts();
    const invalidResponse = await postJson("/api/projects", { filename: "invalid_style.mp4", styleId: "missing_style" });
    assert(invalidResponse.status === 400, "C11 invalid style API should return 400");
    assertCountsEqual(tableCounts(), beforeInvalidApi, "C11 invalid API rollback");
    assertForeignKeysClean();

    // C12: no hard-coded fallback cards when DB has zero active projects.
    resetDb();
    withDb((db) => {
      db.prepare("UPDATE projects SET deleted_at = '2026-06-13T06:00:00Z' WHERE id IN ('project_adhd_vlog_01', 'project_ai_family_workflow')").run();
      db.prepare("UPDATE projects SET status = 'archived' WHERE id = 'project_reading_notes'").run();
    });
    await navigate(cdp, `${baseUrl}/#/home`);
    state = await readState(cdp);
    assert(state.recentCardCount === 0, "C12 should render zero recent cards");
    assert(state.recentEmpty.includes("还没有可恢复的草稿项目"), "C12 should render empty state");
    assert(!state.recentTitles.some((title) => ["ADHD 教育实验 vlog 01", "AI 家庭 workflow 复盘", "读书笔记短视频"].includes(title)), "C12 must not render hard-coded fallback titles");

    console.log("AutoMedia M2 browser and database verification passed.");
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
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
