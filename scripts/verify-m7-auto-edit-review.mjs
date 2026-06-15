import { accessSync, constants, mkdtempSync, rmSync } from "node:fs";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { createStaticServer } from "./serve.mjs";

const host = "127.0.0.1";
const port = Number(process.env.AUTOMEDIA_PORT || 4173);
const chromePort = Number(process.env.AUTOMEDIA_CHROME_PORT || 9338);
const baseUrl = `http://${host}:${port}`;
const repoRoot = resolve(new URL("..", import.meta.url).pathname);
const dbPath = resolve(repoRoot, "data", "automedia.sqlite3");
const projectId = "project_adhd_vlog_01";
const otherProjectId = "project_ai_family_workflow";
const styleId = "style_jianying_3yue6_v3";
const ruleIds = ["rule_style_jianying_3yue6_v3_01", "rule_style_jianying_3yue6_v3_02", "rule_style_jianying_3yue6_v3_03"];
const labels = {
  accepted: "AutoEdit: 原视频顺序铺入 timeline",
  rejected: "AutoEdit: 清理气口/停顿 dry-run",
  needsChange: "AutoEdit: 句级字幕 dry-run",
};
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

function setupFixture() {
  withDb((db) => {
    const timestamp = new Date().toISOString();
    db.exec("BEGIN");
    try {
      db.prepare("DELETE FROM project_style_profiles WHERE project_id = ?").run(projectId);
      db.prepare("INSERT INTO project_style_profiles(project_id, style_profile_id, applied_at, created_at) VALUES (?, ?, ?, ?)").run(projectId, styleId, timestamp, timestamp);
      db.prepare("UPDATE style_rules SET enabled = 0, deleted_at = NULL WHERE style_profile_id = ?").run(styleId);
      for (const ruleId of ruleIds) db.prepare("UPDATE style_rules SET enabled = 1 WHERE id = ?").run(ruleId);
      db.prepare("UPDATE edit_steps SET enabled = 1 WHERE project_id = ?").run(projectId);
      const trackId = db.prepare("SELECT id FROM timeline_tracks WHERE project_id = ? AND track_type = 'effects'").get(projectId).id;
      db.prepare(
        `
        INSERT INTO timeline_items
          (id, project_id, track_id, item_type, source_asset_id, start_ms, end_ms, duration_ms,
           source_start_ms, source_end_ms, properties_json, generated_by_job_id, manual_override,
           is_muted, is_locked, created_at, updated_at, deleted_at)
        VALUES ('item_m7_review_manual', ?, ?, 'text', NULL, 1000, 2000, 1000, NULL, NULL, ?, NULL, 1, 0, 0, ?, ?, NULL)
        `,
      ).run(projectId, trackId, JSON.stringify({ text: "Manual review guard" }), timestamp, timestamp);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  });
}

function itemByLabel(label) {
  return itemByProjectLabel(projectId, label);
}

function itemByProjectLabel(targetProjectId, label) {
  return withDb((db) =>
    db
      .prepare(
        `
        SELECT * FROM timeline_items
        WHERE project_id = ? AND json_extract(properties_json, '$.text') = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 1
        `,
      )
      .get(targetProjectId, label),
  );
}

function props(row) {
  return JSON.parse(row.properties_json);
}

function assertMetadataPreserved(row) {
  const value = props(row);
  for (const key of ["label", "text", "action_kind", "reason", "claim_layer"]) {
    assert(value[key], `metadata ${key} should be preserved`);
  }
  assert(value.claim_layer === "plan_level_only", "claim layer should remain plan_level_only");
}

function assertReviewState(label, expected) {
  const row = itemByLabel(label);
  assert(row, `missing item for ${label}`);
  const value = props(row);
  assert(value.review_status === expected.reviewStatus, `${label} review_status expected ${expected.reviewStatus}, got ${value.review_status}`);
  assert(Boolean(row.deleted_at) === expected.deleted, `${label} deleted expected ${expected.deleted}`);
  assert(row.manual_override === expected.manualOverride, `${label} manual_override expected ${expected.manualOverride}`);
  assertMetadataPreserved(row);
  return row;
}

function latestJob() {
  return withDb((db) =>
    db
      .prepare("SELECT * FROM jobs WHERE project_id = ? AND job_type = 'auto_edit' ORDER BY created_at DESC, id DESC LIMIT 1")
      .get(projectId),
  );
}

function activeGeneratedCount() {
  return withDb((db) =>
    db
      .prepare("SELECT COUNT(*) AS count FROM timeline_items WHERE project_id = ? AND generated_by_job_id IS NOT NULL AND deleted_at IS NULL")
      .get(projectId).count,
  );
}

function rejectedCount() {
  return withDb((db) =>
    db
      .prepare(
        `
        SELECT COUNT(*) AS count
        FROM timeline_items
        WHERE project_id = ?
          AND generated_by_job_id IS NOT NULL
          AND deleted_at IS NOT NULL
          AND json_extract(properties_json, '$.review_status') = 'rejected'
        `,
      )
      .get(projectId).count,
  );
}

function generatedReviewCount() {
  return withDb((db) =>
    db
      .prepare(
        `
        SELECT COUNT(*) AS count
        FROM timeline_items
        WHERE project_id = ?
          AND generated_by_job_id IS NOT NULL
          AND json_extract(properties_json, '$.review_status') IS NOT NULL
        `,
      )
      .get(projectId).count,
  );
}

function buildPerformanceSnapshot(project) {
  const expectedStatuses = new Map([
    [labels.accepted, "accepted"],
    [labels.rejected, "rejected"],
    [labels.needsChange, "needs_change"],
    ["AutoEdit: pacing 01", "pending"],
    ["AutoEdit: effect 02", "pending"],
    ["AutoEdit: audio 03", "pending"],
  ]);
  const actionRows = project.autoEditReview.actions.map((action) => {
    const linkedItem = withDb((db) =>
      db
        .prepare("SELECT deleted_at AS deletedAt, manual_override AS manualOverride, properties_json AS propertiesJson FROM timeline_items WHERE id = ?")
        .get(action.timelineItemId),
    );
    const properties = linkedItem ? JSON.parse(linkedItem.propertiesJson) : {};
    const expectedStatus = expectedStatuses.get(action.label);
    const matches =
      Boolean(expectedStatus) &&
      action.reviewStatus === expectedStatus &&
      Boolean(action.reason) &&
      Boolean(action.timelineItemId) &&
      Boolean(action.actionKind) &&
      Boolean(action.claimLayer) &&
      (expectedStatus === "rejected" ? Boolean(linkedItem?.deletedAt) : !linkedItem?.deletedAt) &&
      (expectedStatus === "needs_change" ? linkedItem?.manualOverride === 1 : linkedItem?.manualOverride === 0) &&
      properties.text === action.label;
    return {
      label: action.label,
      expectedStatus,
      actualStatus: action.reviewStatus,
      timelineItemId: action.timelineItemId,
      actionKind: action.actionKind,
      styleRuleId: action.styleRuleId || null,
      reasonPresent: Boolean(action.reason),
      deleted: Boolean(linkedItem?.deletedAt),
      manualOverride: linkedItem?.manualOverride ?? null,
      matched: matches,
    };
  });
  const matchedCards = actionRows.filter((row) => row.matched).length;
  const reviewedRows = generatedReviewCount();
  const activeRows = activeGeneratedCount();
  const rejectedRows = rejectedCount();
  return {
    latestReviewActionCards: {
      expected: expectedStatuses.size,
      actual: actionRows.length,
      matched: matchedCards,
      failed: expectedStatuses.size - matchedCards + Math.max(0, actionRows.length - expectedStatuses.size),
      accuracy: `${((matchedCards / expectedStatuses.size) * 100).toFixed(2)}%`,
    },
    reviewedGeneratedTimelineItems: {
      expected: 3,
      actual: reviewedRows,
      matched: reviewedRows === 3 ? 3 : 0,
      failed: reviewedRows === 3 ? 0 : 3,
      accuracy: reviewedRows === 3 ? "100.00%" : "0.00%",
    },
    activeGeneratedTimelineItemsAfterReject: {
      expected: 5,
      actual: activeRows,
      matched: activeRows === 5 ? 5 : 0,
      failed: activeRows === 5 ? 0 : 5,
      accuracy: activeRows === 5 ? "100.00%" : "0.00%",
    },
    rejectedSoftDeletedGeneratedTimelineItems: {
      expected: 1,
      actual: rejectedRows,
      matched: rejectedRows === 1 ? 1 : 0,
      failed: rejectedRows === 1 ? 0 : 1,
      accuracy: rejectedRows === 1 ? "100.00%" : "0.00%",
    },
    rowLevelActionCards: actionRows,
  };
}

function assertForeignKeysAndJsonClean() {
  withDb((db) => {
    const fkRows = db.prepare("PRAGMA foreign_key_check").all();
    assert(fkRows.length === 0, `foreign_key_check should be clean, got ${JSON.stringify(fkRows)}`);
    for (const row of db.prepare("SELECT properties_json FROM timeline_items").all()) JSON.parse(row.properties_json);
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

async function fetchJson(url, timeoutMs = 15000) {
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
  await evaluate(cdp, `(() => { const el=document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('missing ${selector}'); el.click(); return true; })()`);
  await sleep(250);
}

async function clickReview(cdp, label, status) {
  await evaluate(
    cdp,
    `(() => {
      const cards = Array.from(document.querySelectorAll('[data-review-item-id]'));
      const card = cards.find((candidate) => candidate.innerText.includes(${JSON.stringify(label)}));
      if (!card) throw new Error('missing review card');
      const button = card.querySelector(${JSON.stringify(`[data-review-status="${status}"]`)});
      if (!button) throw new Error('missing review button');
      button.click();
      return true;
    })()`,
  );
  await sleep(350);
}

async function bodyText(cdp) {
  return evaluate(cdp, "document.body.innerText");
}

async function main() {
  resetDb();
  const server = createStaticServer();
  const userDataDir = mkdtempSync(join(tmpdir(), "automedia-m7-review-chrome-"));
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
    const targets = await fetchJson(`http://${host}:${chromePort}/json/list`);
    const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
    cdp = new CdpClient(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    await navigate(cdp, `#/editor/${projectId}`);
    await click(cdp, '[data-tab="autoReview"]');
    assert((await bodyText(cdp)).includes("还没有 auto-edit dry-run。"), "C0 empty review state should be visible");

    await click(cdp, "#runAutoEdit");
    await click(cdp, '[data-tab="autoReview"]');
    await waitForCondition(cdp, "document.querySelectorAll('[data-review-item-id]').length === 6", "six review cards");
    let text = await bodyText(cdp);
    for (const expected of [
      labels.accepted,
      labels.rejected,
      labels.needsChange,
      "AutoEdit: pacing 01",
      "AutoEdit: effect 02",
      "AutoEdit: audio 03",
      "enabled edit step arrange_timeline",
      "enabled edit step clean_speech",
      "enabled edit step subtitles_bilingual",
      "enabled style rule",
      "rule_style_jianying_3yue6_v3_01",
      "rule_style_jianying_3yue6_v3_02",
      "rule_style_jianying_3yue6_v3_03",
      "pending",
      "接受",
      "删除",
      "需修改",
    ]) {
      assert(text.includes(expected), `C1 visible review content missing ${expected}`);
    }
    assert(JSON.parse(latestJob().output_json).actions.length === 6, "C1 job should have six actions");

    await clickReview(cdp, labels.accepted, "accepted");
    assertReviewState(labels.accepted, { reviewStatus: "accepted", deleted: false, manualOverride: 0 });
    assert((await bodyText(cdp)).includes("accepted"), "C2 accepted status should be visible");

    await clickReview(cdp, labels.rejected, "rejected");
    const rejectedItemAfterClick = assertReviewState(labels.rejected, { reviewStatus: "rejected", deleted: true, manualOverride: 0 });
    text = await bodyText(cdp);
    assert(text.includes(labels.rejected) && text.includes("deleted"), "C3 rejected card should remain visible and deleted");
    const rejectedTimelineClipCount = await evaluate(
      cdp,
      `document.querySelectorAll(${JSON.stringify(`[data-item-id="${rejectedItemAfterClick.id}"]`)}).length`,
    );
    assert(rejectedTimelineClipCount === 0, "C3 rejected item should be absent from the active timeline DOM");
    assert(activeGeneratedCount() === 5, "C3 timeline should have five active generated items");

    await clickReview(cdp, labels.needsChange, "needs_change");
    assertReviewState(labels.needsChange, { reviewStatus: "needs_change", deleted: false, manualOverride: 1 });
    assert((await bodyText(cdp)).includes("needs_change"), "C4 needs_change status should be visible");

    await navigate(cdp, `#/editor/${projectId}`);
    await click(cdp, '[data-tab="autoReview"]');
    text = await bodyText(cdp);
    for (const expected of [labels.accepted, labels.rejected, labels.needsChange, "accepted", "rejected", "needs_change", "pending"]) {
      assert(text.includes(expected), `C5 reload missing ${expected}`);
    }
    assert(activeGeneratedCount() === 5, "C5 active generated count should remain five after reload");
    assert(rejectedCount() === 1, "C5 rejected count should be one");
    const c5Project = (await api(`/api/projects/${projectId}`)).data;
    const performance = buildPerformanceSnapshot(c5Project);
    assert(performance.latestReviewActionCards.failed === 0, "C5 performance action cards should match 100%");
    assert(performance.reviewedGeneratedTimelineItems.failed === 0, "C5 reviewed generated rows should match 100%");
    assert(performance.activeGeneratedTimelineItemsAfterReject.failed === 0, "C5 active generated rows should match 100%");
    assert(performance.rejectedSoftDeletedGeneratedTimelineItems.failed === 0, "C5 rejected generated rows should match 100%");

    const acceptedItem = itemByLabel(labels.accepted);
    const invalidStatus = await api(`/api/timeline-items/${acceptedItem.id}/review`, { method: "PATCH", body: JSON.stringify({ reviewStatus: "done" }) });
    assert(invalidStatus.status === 400 && invalidStatus.data.error === "Invalid review status", "C6 invalid status contract");
    const missingStatus = await api(`/api/timeline-items/${acceptedItem.id}/review`, { method: "PATCH", body: JSON.stringify({}) });
    assert(missingStatus.status === 400 && missingStatus.data.error === "Review status is required.", "C7 missing status contract");
    const missingItem = await api("/api/timeline-items/missing_item/review", { method: "PATCH", body: JSON.stringify({ reviewStatus: "accepted" }) });
    assert(missingItem.status === 404 && missingItem.data.error === "Timeline item not found", "C8 missing item contract");
    const manual = await api("/api/timeline-items/item_m7_review_manual/review", { method: "PATCH", body: JSON.stringify({ reviewStatus: "accepted" }) });
    assert(manual.status === 400 && manual.data.error === "Only generated auto-edit items can be reviewed.", "C9 manual item contract");
    const rejectedItem = itemByLabel(labels.rejected);
    const rejectedTransition = await api(`/api/timeline-items/${rejectedItem.id}/review`, { method: "PATCH", body: JSON.stringify({ reviewStatus: "accepted" }) });
    assert(rejectedTransition.status === 409 && rejectedTransition.data.error === "Rejected review items cannot be changed in this version.", "C10 rejected terminal contract");

    await api(`/api/projects/${projectId}/auto-edit-dry-run`, { method: "POST", body: JSON.stringify({}) });
    const superseded = await api(`/api/timeline-items/${acceptedItem.id}/review`, { method: "PATCH", body: JSON.stringify({ reviewStatus: "accepted" }) });
    assert(superseded.status === 400 && superseded.data.error === "Only latest auto-edit items can be reviewed.", "C11 superseded item contract");
    const latestActive = itemByLabel(labels.accepted);
    withDb((db) => db.prepare("UPDATE timeline_items SET properties_json = ? WHERE id = ?").run(JSON.stringify({ text: labels.accepted }), latestActive.id));
    const missingProvenance = await api(`/api/timeline-items/${latestActive.id}/review`, { method: "PATCH", body: JSON.stringify({ reviewStatus: "accepted" }) });
    assert(missingProvenance.status === 400 && missingProvenance.data.error === "Only latest auto-edit items can be reviewed.", "C12 missing provenance contract");

    withDb((db) => {
      const timestamp = new Date().toISOString();
      db.prepare("DELETE FROM project_style_profiles WHERE project_id = ?").run(otherProjectId);
      db.prepare("INSERT INTO project_style_profiles(project_id, style_profile_id, applied_at, created_at) VALUES (?, ?, ?, ?)").run(otherProjectId, styleId, timestamp, timestamp);
    });
    const otherRun = await api(`/api/projects/${otherProjectId}/auto-edit-dry-run`, { method: "POST", body: JSON.stringify({}) });
    assert(otherRun.status === 201, "C13 other project dry-run should succeed");
    const otherItem = itemByProjectLabel(otherProjectId, labels.accepted);
    const beforeMainReview = withDb((db) =>
      db
        .prepare("SELECT COUNT(*) AS count FROM timeline_items WHERE project_id = ? AND json_extract(properties_json, '$.review_status') IS NOT NULL")
        .get(projectId).count,
    );
    const otherReview = await api(`/api/timeline-items/${otherItem.id}/review`, { method: "PATCH", body: JSON.stringify({ reviewStatus: "accepted" }) });
    assert(otherReview.status === 200 && otherReview.data.project.id === otherProjectId, "C13 review should return the other project only");
    const afterMainReview = withDb((db) =>
      db
        .prepare("SELECT COUNT(*) AS count FROM timeline_items WHERE project_id = ? AND json_extract(properties_json, '$.review_status') IS NOT NULL")
        .get(projectId).count,
    );
    assert(beforeMainReview === afterMainReview, "C13 cross-project review should not mutate main project review rows");

    assertForeignKeysAndJsonClean();
    console.log(
      JSON.stringify(
        {
          performance: { c5Snapshot: performance },
        },
        null,
        2,
      ),
    );
    console.log("AutoMedia M7 auto-edit review verification passed.");
  } finally {
    cdp?.close();
    if (chrome && !chrome.killed) chrome.kill();
    await new Promise((resolveClose) => server.close(resolveClose));
    try {
      rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch {
      // Chrome may release profile files after process shutdown.
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
