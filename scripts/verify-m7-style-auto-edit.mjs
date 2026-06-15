import { accessSync, constants, mkdtempSync, rmSync } from "node:fs";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { createStaticServer } from "./serve.mjs";

const host = "127.0.0.1";
const port = Number(process.env.AUTOMEDIA_PORT || 4173);
const chromePort = Number(process.env.AUTOMEDIA_CHROME_PORT || 9337);
const baseUrl = `http://${host}:${port}`;
const repoRoot = resolve(new URL("..", import.meta.url).pathname);
const dbPath = resolve(repoRoot, "data", "automedia.sqlite3");
const projectId = "project_adhd_vlog_01";
const noStyleProjectId = "project_reading_notes";
const styleId = "style_jianying_3yue6_v3";
const rule01 = "rule_style_jianying_3yue6_v3_01";
const rule02 = "rule_style_jianying_3yue6_v3_02";
const rule03 = "rule_style_jianying_3yue6_v3_03";
const manualItemId = "item_m7_manual_note";
const chromeCandidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
].filter(Boolean);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function resetDb() {
  const result = spawnSync("python3", ["scripts/reset-db.py"], { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`DB reset failed: ${result.stderr || result.stdout}`);
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

function countAutoEditJobs(targetProjectId = projectId) {
  return withDb((db) => db.prepare("SELECT COUNT(*) AS count FROM jobs WHERE project_id = ? AND job_type = 'auto_edit'").get(targetProjectId).count);
}

function activeGeneratedRows() {
  return withDb((db) =>
    db
      .prepare(
        `
        SELECT timeline_items.*, timeline_tracks.track_type AS track_type
        FROM timeline_items
        JOIN timeline_tracks ON timeline_tracks.id = timeline_items.track_id
        WHERE timeline_items.project_id = ?
          AND timeline_items.generated_by_job_id IS NOT NULL
          AND timeline_items.deleted_at IS NULL
        ORDER BY timeline_items.start_ms, timeline_items.id
        `,
      )
      .all(projectId),
  );
}

function allGeneratedRows() {
  return withDb((db) =>
    db
      .prepare(
        `
        SELECT timeline_items.*, timeline_tracks.track_type AS track_type
        FROM timeline_items
        JOIN timeline_tracks ON timeline_tracks.id = timeline_items.track_id
        WHERE timeline_items.project_id = ? AND timeline_items.generated_by_job_id IS NOT NULL
        ORDER BY timeline_items.created_at, timeline_items.id
        `,
      )
      .all(projectId),
  );
}

function latestAutoEditJob() {
  return withDb((db) =>
    db
      .prepare("SELECT * FROM jobs WHERE project_id = ? AND job_type = 'auto_edit' ORDER BY created_at DESC, id DESC LIMIT 1")
      .get(projectId),
  );
}

function setupFixture() {
  withDb((db) => {
    const timestamp = new Date().toISOString();
    db.exec("BEGIN");
    try {
      db.prepare("DELETE FROM project_style_profiles WHERE project_id = ?").run(projectId);
      db.prepare("INSERT INTO project_style_profiles(project_id, style_profile_id, applied_at, created_at) VALUES (?, ?, ?, ?)").run(
        projectId,
        styleId,
        timestamp,
        timestamp,
      );
      db.prepare("UPDATE style_rules SET enabled = 0, deleted_at = NULL WHERE style_profile_id = ?").run(styleId);
      db.prepare("UPDATE edit_steps SET enabled = 1 WHERE project_id = ?").run(projectId);
      const trackId = db.prepare("SELECT id FROM timeline_tracks WHERE project_id = ? AND track_type = 'effects'").get(projectId).id;
      db.prepare(
        `
        INSERT INTO timeline_items
          (id, project_id, track_id, item_type, source_asset_id, start_ms, end_ms, duration_ms,
           source_start_ms, source_end_ms, properties_json, generated_by_job_id, manual_override,
           is_muted, is_locked, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, 'text', NULL, 1000, 4000, 3000, NULL, NULL, ?, NULL, 1, 0, 0, ?, ?, NULL)
        `,
      ).run(manualItemId, projectId, trackId, JSON.stringify({ text: "Manual note before auto edit" }), timestamp, timestamp);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  });
}

function enableRules(ruleIds) {
  withDb((db) => {
    db.prepare("UPDATE style_rules SET enabled = 0 WHERE style_profile_id = ?").run(styleId);
    for (const ruleId of ruleIds) db.prepare("UPDATE style_rules SET enabled = 1, deleted_at = NULL WHERE id = ?").run(ruleId);
  });
}

function setStep(stepKey, enabled) {
  withDb((db) => db.prepare("UPDATE edit_steps SET enabled = ? WHERE project_id = ? AND step_key = ?").run(enabled ? 1 : 0, projectId, stepKey));
}

function softDeleteRule(ruleId) {
  withDb((db) => db.prepare("UPDATE style_rules SET deleted_at = ?, enabled = 1 WHERE id = ?").run(new Date().toISOString(), ruleId));
}

function assertManualPreserved() {
  const row = withDb((db) => db.prepare("SELECT * FROM timeline_items WHERE id = ?").get(manualItemId));
  assert(row.deleted_at === null, "manual item should remain active");
  assert(row.manual_override === 1, "manual item should keep manual_override=1");
  assert(row.generated_by_job_id === null, "manual item should not get generated_by_job_id");
}

function assertJobInput(job, expectedRules, expectedSteps) {
  const input = JSON.parse(job.input_json);
  assert(input.project_id === projectId, "job input project_id should match");
  assert(input.style_id === styleId, "job input style_id should be v3");
  assert(input.style_name === "剪映导入-3月6日 v3", "job input style_name should match");
  assert(JSON.stringify(input.enabled_rule_ids) === JSON.stringify(expectedRules), `enabled_rule_ids expected ${expectedRules}, got ${input.enabled_rule_ids}`);
  assert(JSON.stringify(input.enabled_step_keys) === JSON.stringify(expectedSteps), `enabled_step_keys expected ${expectedSteps}, got ${input.enabled_step_keys}`);
  assert(input.source_duration_ms === 72000, "source duration should be 72000ms");
}

function assertJobOutput(job, expectedActionCount) {
  const output = JSON.parse(job.output_json);
  assert(output.claim_layer === "plan_level_only", "claim layer should be plan level only");
  assert(output.actions.length === expectedActionCount, "actions length should match");
  assert(output.timeline_item_ids.length === expectedActionCount, "timeline item ids length should match");
  const serialized = JSON.stringify(output);
  for (const forbidden of ["rendered_video", "exported", "published"]) {
    assert(!serialized.includes(forbidden), `output should not include forbidden claim ${forbidden}`);
  }
  return output;
}

function assertLabels(rows, expectedLabels) {
  const labels = rows.map((row) => JSON.parse(row.properties_json).text).sort();
  assert(JSON.stringify(labels) === JSON.stringify([...expectedLabels].sort()), `labels expected ${expectedLabels}, got ${labels}`);
}

function assertRowsValid(rows, jobId) {
  for (const row of rows) {
    const properties = JSON.parse(row.properties_json);
    assert(row.generated_by_job_id === jobId, "generated row should cite current job");
    assert(row.manual_override === 0, "generated row should not be manual override");
    assert(row.deleted_at === null, "generated row should be active");
    assert(row.start_ms >= 0 && row.end_ms >= row.start_ms && row.end_ms <= 72000, "generated row range should be valid");
    assert(properties.claim_layer === "plan_level_only", "item claim layer should be plan-only");
  }
}

function assertForeignKeysAndJsonClean() {
  withDb((db) => {
    const fkRows = db.prepare("PRAGMA foreign_key_check").all();
    assert(fkRows.length === 0, `foreign_key_check should be clean, got ${JSON.stringify(fkRows)}`);
    for (const table of ["jobs", "timeline_items"]) {
      const jsonRows = db.prepare(`SELECT * FROM ${table}`).all();
      for (const row of jsonRows) {
        for (const column of ["input_json", "output_json", "error_json", "properties_json"]) {
          if (row[column]) JSON.parse(row[column]);
        }
      }
    }
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

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json" },
    body: options.body,
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

async function fetchJson(url, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
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
      if (!message.id || !this.pending.has(message.id)) return;
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result || {});
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolveSend, reject) => this.pending.set(id, { resolve: resolveSend, reject }));
  }
  close() {
    this.ws?.close();
  }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
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

async function navigate(cdp, hash = "#/home") {
  await cdp.send("Page.navigate", { url: `${baseUrl}/?v=${Date.now()}${hash}` });
  await waitForCondition(cdp, "document.readyState === 'complete' && Boolean(window.__automediaReady)", "app ready");
}

async function click(cdp, selector) {
  await evaluate(
    cdp,
    `(() => { const el=document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('missing ${selector}'); el.click(); return true; })()`,
  );
  await sleep(200);
}

async function bodyText(cdp) {
  return evaluate(cdp, "document.body.innerText");
}

async function toastText(cdp) {
  return evaluate(cdp, "document.querySelector('#toast')?.textContent.trim() || ''");
}

async function clickRunAutoEdit(cdp) {
  await click(cdp, "#runAutoEdit");
  await sleep(400);
}

async function main() {
  resetDb();
  const server = createStaticServer();
  const userDataDir = mkdtempSync(join(tmpdir(), "automedia-m7-style-chrome-"));
  let chrome;
  let cdp;
  try {
    await new Promise((resolveListen, reject) => {
      server.once("error", reject);
      server.listen(port, host, resolveListen);
    });
    await waitForServer(`${baseUrl}/`);
    await api("/api/bootstrap");
    setupFixture();

    chrome = spawn(findChrome(), [
      "--headless=new",
      `--remote-debugging-port=${chromePort}`,
      `--user-data-dir=${userDataDir}`,
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ], { stdio: "ignore" });
    const targets = await fetchJson(`http://${host}:${chromePort}/json/list`, 15000);
    const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
    cdp = new CdpClient(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    assert(withDb((db) => db.prepare("SELECT COUNT(*) AS count FROM style_profiles WHERE id=? AND deleted_at IS NULL").get(styleId).count) === 1, "C0 v3 style should exist");
    assert(withDb((db) => db.prepare("SELECT COUNT(*) AS count FROM style_rules WHERE style_profile_id=? AND deleted_at IS NULL").get(styleId).count) === 7, "C0 v3 should have seven active rules");
    assert(countAutoEditJobs() === 0, "C0 should start with zero auto-edit jobs");
    assertManualPreserved();

    await navigate(cdp, `#/editor/${projectId}`);
    await clickRunAutoEdit(cdp);
    assert((await toastText(cdp)) === "当前风格没有已启用的规则，请先在风格管理里勾选规则。", "C1 toast should explain no enabled rules");
    assert(countAutoEditJobs() === 0, "C1 should write no job");
    assert(activeGeneratedRows().length === 0, "C1 should write no generated items");
    const missingRules = await api(`/api/projects/${projectId}/auto-edit-dry-run`, { method: "POST", body: JSON.stringify({}) });
    assert(missingRules.status === 409 && missingRules.data.error === "当前风格没有已启用的规则，请先在风格管理里勾选规则。", "C1 API should return 409 contract");

    enableRules([rule01, rule02, rule03]);
    await navigate(cdp, `#/editor/${projectId}`);
    await clickRunAutoEdit(cdp);
    assert((await toastText(cdp)) === "自动剪辑 dry-run 完成：生成 6 个 timeline 预览项。", "C2 toast should report six items");
    let c2Job = latestAutoEditJob();
    assertJobInput(c2Job, [rule01, rule02, rule03], ["arrange_timeline", "clean_speech", "subtitles_bilingual", "apply_style_profile"]);
    assertJobOutput(c2Job, 6);
    let rows = activeGeneratedRows();
    assert(rows.length === 6, "C2 should have six active generated rows");
    assertRowsValid(rows, c2Job.id);
    assertLabels(rows, [
      "AutoEdit: 原视频顺序铺入 timeline",
      "AutoEdit: 清理气口/停顿 dry-run",
      "AutoEdit: 句级字幕 dry-run",
      "AutoEdit: pacing 01",
      "AutoEdit: effect 02",
      "AutoEdit: audio 03",
    ]);
    let text = await bodyText(cdp);
    for (const label of ["AutoEdit: 原视频顺序铺入 timeline", "AutoEdit: 清理气口/停顿 dry-run", "AutoEdit: 句级字幕 dry-run", "AutoEdit: pacing 01", "AutoEdit: effect 02", "AutoEdit: audio 03", "Manual note before auto edit"]) {
      assert(text.includes(label), `C2 UI should include ${label}`);
    }
    await navigate(cdp, `#/editor/${projectId}`);
    text = await bodyText(cdp);
    assert(text.includes("AutoEdit: audio 03") && text.includes("Manual note before auto edit"), "C2 reload should keep generated and manual labels visible");

    enableRules([rule01, rule02]);
    setStep("clean_speech", false);
    await clickRunAutoEdit(cdp);
    assert((await toastText(cdp)) === "自动剪辑 dry-run 完成：生成 4 个 timeline 预览项。", "C3 toast should report four items");
    const c3Job = latestAutoEditJob();
    assert(c3Job.id !== c2Job.id, "C3 should create a new job");
    assertJobInput(c3Job, [rule01, rule02], ["arrange_timeline", "subtitles_bilingual", "apply_style_profile"]);
    assertJobOutput(c3Job, 4);
    rows = activeGeneratedRows();
    assert(rows.length === 4, "C3 should have four active generated rows");
    assertRowsValid(rows, c3Job.id);
    assertLabels(rows, ["AutoEdit: 原视频顺序铺入 timeline", "AutoEdit: 句级字幕 dry-run", "AutoEdit: pacing 01", "AutoEdit: effect 02"]);
    assert(!JSON.stringify(rows).includes(rule03), "C3 rows should not cite disabled rule03");
    assert(allGeneratedRows().filter((row) => row.generated_by_job_id === c2Job.id && row.deleted_at !== null).length === 6, "C3 should soft-delete C2 generated rows");
    assertManualPreserved();
    await navigate(cdp, `#/editor/${projectId}`);
    text = await bodyText(cdp);
    assert(text.includes("AutoEdit: effect 02") && !text.includes("AutoEdit: audio 03") && !text.includes("AutoEdit: 清理气口/停顿 dry-run"), "C3 reload should show only current generated labels");

    withDb((db) => db.prepare("DELETE FROM project_style_profiles WHERE project_id = ?").run(noStyleProjectId));
    const noStyle = await api(`/api/projects/${noStyleProjectId}/auto-edit-dry-run`, { method: "POST", body: JSON.stringify({}) });
    assert(noStyle.status === 400 && noStyle.data.error === "当前项目没有选择可用风格。", "C4 no-style API should return 400 contract");
    assert(countAutoEditJobs(noStyleProjectId) === 0, "C4 no-style should not write jobs");

    enableRules([rule01, rule02]);
    softDeleteRule(rule02);
    const c5 = await api(`/api/projects/${projectId}/auto-edit-dry-run`, { method: "POST", body: JSON.stringify({}) });
    assert(c5.status === 201 && c5.data.generatedCount === 3, "C5 should generate three items");
    const c5Job = latestAutoEditJob();
    assertJobInput(c5Job, [rule01], ["arrange_timeline", "subtitles_bilingual", "apply_style_profile"]);
    assertJobOutput(c5Job, 3);
    rows = activeGeneratedRows();
    assert(rows.length === 3, "C5 should have three active generated rows");
    assertRowsValid(rows, c5Job.id);
    assertLabels(rows, ["AutoEdit: 原视频顺序铺入 timeline", "AutoEdit: 句级字幕 dry-run", "AutoEdit: pacing 01"]);
    const finalSerialized = JSON.stringify({ rows, job: c5Job });
    assert(!finalSerialized.includes(rule02) && !finalSerialized.includes(rule03), "C5 final state should exclude rule02 and rule03");

    const missingProject = await api("/api/projects/missing_project/auto-edit-dry-run", { method: "POST", body: JSON.stringify({}) });
    assert(missingProject.status === 404 && missingProject.data.error === "Project not found", "C6 missing project should return 404");

    const generated = allGeneratedRows();
    assert(generated.filter((row) => row.deleted_at === null).length === 3, "C7 final active generated count should be three");
    assert(generated.filter((row) => row.deleted_at !== null).length === 10, "C7 superseded generated count should be ten");
    assert(countAutoEditJobs() === 3, "C7 should have exactly three positive auto-edit jobs");
    assertManualPreserved();
    assertForeignKeysAndJsonClean();

    console.log(
      JSON.stringify(
        {
          jobIds: { c2: c2Job.id, c3: c3Job.id, c5: c5Job.id },
          performance: {
            autoEditJobs: { expected: 3, actual: countAutoEditJobs(), matched: 3, failed: 0, accuracy: "100.00%" },
            activeGeneratedTimelineItems: { expected: 3, actual: generated.filter((row) => row.deleted_at === null).length, matched: 3, failed: 0, accuracy: "100.00%" },
            softDeletedGeneratedTimelineItems: { expected: 10, actual: generated.filter((row) => row.deleted_at !== null).length, matched: 10, failed: 0, accuracy: "100.00%" },
            preservedManualTimelineItems: { expected: 1, actual: 1, matched: 1, failed: 0, accuracy: "100.00%" },
          },
        },
        null,
        2,
      ),
    );
    console.log("AutoMedia M7 style auto-edit planner verification passed.");
  } finally {
    cdp?.close();
    if (chrome && !chrome.killed) chrome.kill();
    await new Promise((resolveClose) => server.close(resolveClose));
    try {
      rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch {
      // Chrome can release profile files slightly after process shutdown; this is not part of product validation.
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
