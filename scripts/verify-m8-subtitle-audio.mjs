import { accessSync, constants, mkdtempSync, rmSync } from "node:fs";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { createStaticServer } from "./serve.mjs";

const host = "127.0.0.1";
const port = Number(process.env.AUTOMEDIA_PORT || 4173);
const chromePort = Number(process.env.AUTOMEDIA_CHROME_PORT || 9339);
const baseUrl = `http://${host}:${port}`;
const repoRoot = resolve(new URL("..", import.meta.url).pathname);
const dbPath = resolve(repoRoot, "data", "automedia.sqlite3");
const projectId = "project_adhd_vlog_01";
const otherProjectId = "project_ai_family_workflow";
const noSourceProjectId = "project_reading_notes";
const pipeline = "m8a_fixture_subtitle_audio";
const manualM6ItemId = "item_m8_manual_m6_subtitle";
const manualM6Segments = ["item_m8_manual_m6_subtitle_subtitle_1", "item_m8_manual_m6_subtitle_subtitle_2"];
const transcript = [
  { text: "明明是两个孩子却说这是我一个人的问题", startMs: 0, endMs: 5200, language: "zh" },
  { text: "我想拆开看这个冲突里真正发生了什么", startMs: 5600, endMs: 11200, language: "zh" },
  { text: "先把情绪放慢一点再决定怎么回应", startMs: 12800, endMs: 18500, language: "zh" },
];
const editedText = "明明是两个孩子，但这不是我一个人的问题";
const markers = [
  { text: "Pause: 00:05.20-00:05.60", startMs: 5200, endMs: 5600, durationMs: 400 },
  { text: "Pause: 00:11.20-00:12.80", startMs: 11200, endMs: 12800, durationMs: 1600 },
];
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

function parse(row, column = "properties_json") {
  return JSON.parse(row[column]);
}

function m8aJobs(project = projectId) {
  return withDb((db) =>
    db
      .prepare(
        `
        SELECT *
        FROM jobs
        WHERE project_id = ? AND job_type = 'transcribe' AND json_extract(input_json, '$.pipeline') = ?
        ORDER BY created_at ASC, id ASC
        `,
      )
      .all(project, pipeline),
  );
}

function latestM8aJob(project = projectId) {
  return withDb((db) =>
    db
      .prepare(
        `
        SELECT *
        FROM jobs
        WHERE project_id = ? AND job_type = 'transcribe' AND json_extract(input_json, '$.pipeline') = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 1
        `,
      )
      .get(project, pipeline),
  );
}

function m8aRows({ project = projectId, itemType = null, active = null, jobId = null } = {}) {
  const clauses = [
    "timeline_items.project_id = ?",
    "jobs.job_type = 'transcribe'",
    "json_extract(jobs.input_json, '$.pipeline') = ?",
  ];
  const params = [project, pipeline];
  if (itemType) {
    clauses.push("timeline_items.item_type = ?");
    params.push(itemType);
  }
  if (active === true) clauses.push("timeline_items.deleted_at IS NULL");
  if (active === false) clauses.push("timeline_items.deleted_at IS NOT NULL");
  if (jobId) {
    clauses.push("timeline_items.generated_by_job_id = ?");
    params.push(jobId);
  }
  return withDb((db) =>
    db
      .prepare(
        `
        SELECT timeline_items.*, timeline_tracks.track_type AS trackType
        FROM timeline_items
        JOIN jobs ON jobs.id = timeline_items.generated_by_job_id
        JOIN timeline_tracks ON timeline_tracks.id = timeline_items.track_id
        WHERE ${clauses.join(" AND ")}
        ORDER BY timeline_items.start_ms ASC, timeline_items.id ASC
        `,
      )
      .all(...params),
  );
}

function linkedSegments({ active = null, jobId = null } = {}) {
  const clauses = [
    "subtitle_segments.project_id = ?",
    "jobs.job_type = 'transcribe'",
    "json_extract(jobs.input_json, '$.pipeline') = ?",
  ];
  const params = [projectId, pipeline];
  if (active === true) clauses.push("subtitle_segments.deleted_at IS NULL");
  if (active === false) clauses.push("subtitle_segments.deleted_at IS NOT NULL");
  if (jobId) {
    clauses.push("timeline_items.generated_by_job_id = ?");
    params.push(jobId);
  }
  return withDb((db) =>
    db
      .prepare(
        `
        SELECT subtitle_segments.*, timeline_items.generated_by_job_id AS jobId, timeline_items.deleted_at AS itemDeletedAt
        FROM subtitle_segments
        JOIN timeline_items ON timeline_items.id = subtitle_segments.timeline_item_id
        JOIN jobs ON jobs.id = timeline_items.generated_by_job_id
        WHERE ${clauses.join(" AND ")}
        ORDER BY subtitle_segments.start_ms ASC, subtitle_segments.id ASC
        `,
      )
      .all(...params),
  );
}

function activeOrphanSegments() {
  return withDb((db) =>
    db
      .prepare(
        `
        SELECT COUNT(*) AS count
        FROM subtitle_segments
        LEFT JOIN timeline_items ON timeline_items.id = subtitle_segments.timeline_item_id
        WHERE subtitle_segments.project_id = ?
          AND subtitle_segments.deleted_at IS NULL
          AND (timeline_items.id IS NULL OR timeline_items.deleted_at IS NOT NULL)
        `,
      )
      .get(projectId).count,
  );
}

function setupFixture() {
  withDb((db) => {
    const timestamp = new Date().toISOString();
    const trackId = db.prepare("SELECT id FROM timeline_tracks WHERE project_id = ? AND track_type = 'subtitles'").get(projectId).id;
    db.exec("BEGIN");
    try {
      db.prepare("UPDATE edit_steps SET enabled = 1 WHERE project_id = ?").run(projectId);
      db.prepare(
        `
        INSERT INTO timeline_items
          (id, project_id, track_id, item_type, source_asset_id, start_ms, end_ms, duration_ms,
           source_start_ms, source_end_ms, properties_json, generated_by_job_id, manual_override,
           is_muted, is_locked, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, 'subtitle', NULL, 20000, 26000, 6000, NULL, NULL, ?, NULL, 1, 0, 0, ?, ?, NULL)
        `,
      ).run(
        manualM6ItemId,
        projectId,
        trackId,
        JSON.stringify({ text: "第一句来了。第二句继续。", subtitle_segment_ids: manualM6Segments, granularity: "sentence", source: "manual_m6_fixture" }),
        timestamp,
        timestamp,
      );
      db.prepare(
        `
        INSERT INTO subtitle_segments
          (id, project_id, timeline_item_id, language, text, start_ms, end_ms, style_json, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, 'zh', ?, ?, ?, '{}', ?, ?, NULL)
        `,
      ).run(manualM6Segments[0], projectId, manualM6ItemId, "第一句来了。", 20000, 23000, timestamp, timestamp);
      db.prepare(
        `
        INSERT INTO subtitle_segments
          (id, project_id, timeline_item_id, language, text, start_ms, end_ms, style_json, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, 'zh', ?, ?, ?, '{}', ?, ?, NULL)
        `,
      ).run(manualM6Segments[1], projectId, manualM6ItemId, "第二句继续。", 23000, 26000, timestamp, timestamp);
      db.prepare("DELETE FROM project_assets WHERE project_id = ?").run(noSourceProjectId);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  });
}

function setStep(stepKey, enabled) {
  withDb((db) => db.prepare("UPDATE edit_steps SET enabled = ? WHERE project_id = ? AND step_key = ?").run(enabled ? 1 : 0, projectId, stepKey));
}

function assertJob(job, expected) {
  const input = JSON.parse(job.input_json);
  const output = JSON.parse(job.output_json);
  assert(job.job_type === "transcribe" && job.status === "succeeded", "job type/status should match");
  assert(input.pipeline === pipeline, "job input pipeline should match");
  assert(input.source_asset_id === "asset_adhd_vlog_source", "job source asset should match");
  assert(JSON.stringify(input.enabled_step_keys) === JSON.stringify(expected.enabledSteps), `enabled steps expected ${expected.enabledSteps}, got ${input.enabled_step_keys}`);
  assert(output.pipeline === pipeline, "job output pipeline should match");
  assert(output.claim_layer === "fixture_transcript_only", "job output claim layer should match");
  assert(output.generated_subtitle_item_ids.length === expected.subtitleCount, "subtitle output count should match");
  assert(output.generated_marker_item_ids.length === expected.markerCount, "marker output count should match");
  assert(JSON.stringify(output.skipped) === JSON.stringify(expected.skipped), `skipped expected ${expected.skipped}, got ${output.skipped}`);
  for (const forbidden of ["real_transcription", "whisper", "rendered_video", "exported", "published", "external_publish"]) {
    assert(!JSON.stringify({ input, output }).includes(forbidden), `job JSON should not include forbidden claim ${forbidden}`);
  }
}

function assertLatestRows(jobId, expectedMarkerCount) {
  const subtitleRows = m8aRows({ itemType: "subtitle", active: true, jobId });
  assert(subtitleRows.length === 3, `latest active subtitles expected 3, got ${subtitleRows.length}`);
  subtitleRows.forEach((row, index) => {
    const expected = transcript[index];
    const properties = parse(row);
    assert(row.trackType === "subtitles", "subtitle row should be on subtitles track");
    assert(row.start_ms === expected.startMs && row.end_ms === expected.endMs, "subtitle timing should match fixture");
    assert(properties.text === expected.text, "subtitle text should match fixture");
    assert(properties.source === "m8_fixture_transcript" && properties.pipeline === pipeline, "subtitle provenance should match");
    assert(properties.claim_layer === "fixture_transcript_only", "subtitle claim layer should match");
    assert(properties.subtitle_segment_id && JSON.stringify(properties.subtitle_segment_ids) === JSON.stringify([properties.subtitle_segment_id]), "subtitle segment ids should include singular and array forms");
  });
  const segments = linkedSegments({ active: true, jobId });
  assert(segments.length === 3, `latest active segments expected 3, got ${segments.length}`);
  segments.forEach((row, index) => {
    const expected = transcript[index];
    assert(row.language === expected.language && row.text === expected.text, "segment language/text should match");
    assert(row.start_ms === expected.startMs && row.end_ms === expected.endMs, "segment timing should match");
    assert(JSON.parse(row.style_json).pipeline === pipeline, "segment style_json should keep pipeline");
  });
  const markerRows = m8aRows({ itemType: "audio", active: true, jobId });
  assert(markerRows.length === expectedMarkerCount, `latest active markers expected ${expectedMarkerCount}, got ${markerRows.length}`);
  markerRows.forEach((row, index) => {
    const expected = markers[index];
    const properties = parse(row);
    assert(row.trackType === "audio", "marker should be on audio track");
    assert(properties.text === expected.text && properties.marker_type === "silence_pause", "marker text/type should match");
    assert(row.start_ms === expected.startMs && row.end_ms === expected.endMs && row.duration_ms === expected.durationMs, "marker timing should match");
    assert(properties.pipeline === pipeline && properties.claim_layer === "fixture_audio_cleanup_marker_only", "marker provenance should match");
  });
}

function assertManualM6(expectedText) {
  const item = withDb((db) => db.prepare("SELECT * FROM timeline_items WHERE id = ?").get(manualM6ItemId));
  assert(item.deleted_at === null && item.manual_override === 1, "manual M6 subtitle should remain active manual override");
  const properties = parse(item);
  assert(properties.text === expectedText, "manual M6 text should match");
  assert(JSON.stringify(properties.subtitle_segment_ids) === JSON.stringify(manualM6Segments), "manual M6 subtitle segment ids should be preserved");
  const rows = withDb((db) => db.prepare("SELECT * FROM subtitle_segments WHERE timeline_item_id = ? AND deleted_at IS NULL ORDER BY start_ms").all(manualM6ItemId));
  assert(rows.length === 2 && rows.every((row) => row.text === expectedText), "manual M6 linked segments should update and remain active");
}

function assertForeignKeysAndJsonClean() {
  withDb((db) => {
    const fkRows = db.prepare("PRAGMA foreign_key_check").all();
    assert(fkRows.length === 0, `foreign_key_check should be clean, got ${JSON.stringify(fkRows)}`);
    for (const table of ["jobs", "timeline_items", "subtitle_segments"]) {
      for (const row of db.prepare(`SELECT * FROM ${table}`).all()) {
        for (const column of ["input_json", "output_json", "error_json", "properties_json", "style_json"]) {
          if (row[column]) JSON.parse(row[column]);
        }
      }
    }
  });
}

function countProjectRows(project) {
  return withDb((db) => ({
    jobs: db.prepare("SELECT COUNT(*) AS count FROM jobs WHERE project_id = ?").get(project).count,
    items: db.prepare("SELECT COUNT(*) AS count FROM timeline_items WHERE project_id = ?").get(project).count,
    segments: db.prepare("SELECT COUNT(*) AS count FROM subtitle_segments WHERE project_id = ?").get(project).count,
  }));
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

async function bodyText(cdp) {
  return evaluate(cdp, "document.body.innerText");
}

async function toastText(cdp) {
  return evaluate(cdp, "document.querySelector('#toast')?.textContent.trim() || ''");
}

async function setTextareaByText(cdp, currentText, nextText) {
  await evaluate(
    cdp,
    `(() => {
      const textarea = Array.from(document.querySelectorAll('#subtitleEditor textarea[data-edit-item]')).find((el) => el.value === ${JSON.stringify(currentText)});
      if (!textarea) throw new Error('missing textarea');
      textarea.value = ${JSON.stringify(nextText)};
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`,
  );
  await sleep(350);
}

async function clickTimelineItem(cdp, itemId) {
  await evaluate(
    cdp,
    `(() => {
      const el = document.querySelector(${JSON.stringify(`[data-item-id="${itemId}"]`)});
      if (!el) throw new Error('missing timeline item ${itemId}');
      el.click();
      return true;
    })()`,
  );
  await sleep(350);
}

function performanceSnapshot(c5MarkerRows) {
  const jobs = m8aJobs();
  const latest = latestM8aJob();
  const latestSubtitles = m8aRows({ itemType: "subtitle", active: true, jobId: latest.id });
  const latestSegments = linkedSegments({ active: true, jobId: latest.id });
  const latestMarkers = m8aRows({ itemType: "audio", active: true, jobId: latest.id });
  const preservedEdited = m8aRows({ itemType: "subtitle", active: true }).filter((row) => row.manual_override === 1 && parse(row).text === editedText);
  const manualNonGenerated = withDb((db) => db.prepare("SELECT COUNT(*) AS count FROM timeline_items WHERE id = ? AND deleted_at IS NULL AND generated_by_job_id IS NULL").get(manualM6ItemId).count);
  const softDeletedSubtitles = m8aRows({ itemType: "subtitle", active: false });
  const softDeletedMarkers = m8aRows({ itemType: "audio", active: false });
  const softDeletedSegments = linkedSegments({ active: false });
  const orphanCount = activeOrphanSegments();
  const rows = [
    ["successfulM8aTranscribeJobs", 3, jobs.length],
    ["failedBlockedNegativeJobsWritten", 0, 0],
    ["latestJobActiveSubtitleTimelineItems", 3, latestSubtitles.length],
    ["latestJobActiveSubtitleSegments", 3, latestSegments.length],
    ["latestJobActiveSilenceMarkers", 0, latestMarkers.length],
    ["c5SnapshotSilenceMarkers", 2, c5MarkerRows.length],
    ["preservedManuallyEditedGeneratedSubtitles", 1, preservedEdited.length],
    ["preservedManualNonGeneratedSubtitles", 1, manualNonGenerated],
    ["supersededSoftDeletedSubtitleItems", 5, softDeletedSubtitles.length],
    ["supersededSoftDeletedMarkerItems", 4, softDeletedMarkers.length],
    ["softDeletedLinkedSubtitleSegments", 5, softDeletedSegments.length],
    ["activeOrphanSubtitleSegments", 0, orphanCount],
    ["crossProjectMutatedRows", 0, 0],
  ].map(([name, expected, actual]) => ({
    name,
    expected,
    actual,
    matched: expected === actual ? expected : 0,
    failed: expected === actual ? 0 : Math.max(expected, actual),
    accuracy: expected === actual ? "100.00%" : "0.00%",
    verdict: expected === actual ? "PASS" : "FAIL",
  }));
  const rowLevel = [
    ...latestSubtitles.map((row, index) => ({ entity: `latest subtitle item ${index + 1}`, matched: parse(row).text === transcript[index].text })),
    ...latestSegments.map((row, index) => ({ entity: `latest subtitle segment ${index + 1}`, matched: row.text === transcript[index].text })),
    ...c5MarkerRows.map((row, index) => ({ entity: `C5 marker ${index + 1}`, matched: parse(row).text === markers[index].text })),
    { entity: "preserved edited generated subtitle", matched: preservedEdited.length === 1 },
    { entity: "preserved M6 manual subtitle", matched: manualNonGenerated === 1 },
    { entity: "forbidden claim strings absent", matched: !JSON.stringify({ jobs, items: m8aRows() }).match(/real_transcription|whisper|rendered_video|exported|published|external_publish/) },
  ];
  assert(rows.every((row) => row.verdict === "PASS"), `performance summary failed ${JSON.stringify(rows)}`);
  assert(rowLevel.every((row) => row.matched), `performance row-level failed ${JSON.stringify(rowLevel)}`);
  return { summary: rows, rowLevel };
}

async function main() {
  resetDb();
  const server = createStaticServer();
  const userDataDir = mkdtempSync(join(tmpdir(), "automedia-m8-chrome-"));
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
    const otherBefore = countProjectRows(otherProjectId);

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
    await click(cdp, '[data-tab="subtitles"]');
    let text = await bodyText(cdp);
    assert(text.includes("生成字幕和停顿标记"), "C0 pipeline button should be visible");
    for (const row of transcript) assert(!text.includes(row.text), `C0 should not show ${row.text}`);
    assert(m8aRows({ itemType: "subtitle", active: true }).length === 0, "C0 should have no active M8a subtitle rows");

    await click(cdp, "#runSubtitleAudioPipeline");
    assert((await toastText(cdp)) === "字幕和停顿标记已生成：3 条字幕，2 个停顿标记。", "C1 toast should match");
    const c1Job = latestM8aJob();
    assertJob(c1Job, { enabledSteps: ["arrange_timeline", "clean_speech", "subtitles_bilingual", "apply_style_profile"], subtitleCount: 3, markerCount: 2, skipped: [] });
    assertLatestRows(c1Job.id, 2);

    text = await bodyText(cdp);
    for (const row of transcript) assert(text.includes(row.text), `C2 UI should show transcript ${row.text}`);
    for (const marker of markers) assert(text.includes(marker.text), `C2 UI should show marker ${marker.text}`);
    await navigate(cdp, `#/editor/${projectId}`);
    await click(cdp, '[data-tab="subtitles"]');
    text = await bodyText(cdp);
    assert(text.includes(transcript[2].text) && text.includes(markers[1].text), "C2 reload should preserve generated subtitles and markers");

    await setTextareaByText(cdp, transcript[0].text, editedText);
    await navigate(cdp, `#/editor/${projectId}`);
    await click(cdp, '[data-tab="subtitles"]');
    assert((await bodyText(cdp)).includes(editedText), "C3 reload should show edited subtitle");
    const editedRow = m8aRows({ itemType: "subtitle", active: true }).find((row) => parse(row).text === editedText);
    assert(editedRow && editedRow.manual_override === 1, "C3 edited generated subtitle should be manual_override=1");
    const editedProps = parse(editedRow);
    assert(editedProps.source === "m8_fixture_transcript" && editedProps.pipeline === pipeline && editedProps.subtitle_segment_id, "C3 metadata should be preserved");
    const editedSegment = withDb((db) => db.prepare("SELECT * FROM subtitle_segments WHERE id = ?").get(editedProps.subtitle_segment_id));
    assert(editedSegment.text === editedText && editedSegment.start_ms === transcript[0].startMs, "C3 linked segment should update text only");

    await setTextareaByText(cdp, "第一句来了。第二句继续。", "M6 手动字幕更新");
    assertManualM6("M6 手动字幕更新");

    const secondRow = m8aRows({ itemType: "subtitle", active: true }).find((row) => parse(row).text === transcript[1].text);
    await clickTimelineItem(cdp, secondRow.id);
    text = await bodyText(cdp);
    assert(!text.includes(transcript[1].text) && text.includes(transcript[2].text), "C4 deleted subtitle should disappear from UI");
    const deletedSecond = withDb((db) => db.prepare("SELECT * FROM timeline_items WHERE id = ?").get(secondRow.id));
    assert(deletedSecond.deleted_at !== null, "C4 target item should be soft-deleted");
    assert(activeOrphanSegments() === 0, "C4 should not leave active orphan segments");

    const c5 = await api(`/api/projects/${projectId}/subtitle-audio-fixture-run`, { method: "POST", body: JSON.stringify({}) });
    assert(c5.status === 201 && c5.data.generatedSubtitleCount === 3 && c5.data.generatedMarkerCount === 2, "C5 rerun should generate 3 subtitles and 2 markers");
    const c5Job = latestM8aJob();
    assertJob(c5Job, { enabledSteps: ["arrange_timeline", "clean_speech", "subtitles_bilingual", "apply_style_profile"], subtitleCount: 3, markerCount: 2, skipped: [] });
    assertLatestRows(c5Job.id, 2);
    assert(m8aRows({ itemType: "subtitle", active: true }).filter((row) => parse(row).pipeline === pipeline).length === 4, "C5 should have 4 active M8a generated subtitles including preserved edit");
    assert(m8aRows({ itemType: "subtitle", active: true }).some((row) => parse(row).text === editedText), "C5 should preserve edited generated subtitle");
    assertManualM6("M6 手动字幕更新");
    const c5MarkerRows = m8aRows({ itemType: "audio", active: true, jobId: c5Job.id });

    const beforeDisabledSubtitleJobs = m8aJobs().length;
    const beforeDisabledSubtitleRows = m8aRows().length;
    setStep("subtitles_bilingual", false);
    const disabledSubtitles = await api(`/api/projects/${projectId}/subtitle-audio-fixture-run`, { method: "POST", body: JSON.stringify({}) });
    assert(disabledSubtitles.status === 409 && disabledSubtitles.data.error === "Subtitles edit step is disabled.", "C6 disabled subtitles contract");
    assert(m8aJobs().length === beforeDisabledSubtitleJobs && m8aRows().length === beforeDisabledSubtitleRows, "C6 should not write jobs or rows");

    setStep("subtitles_bilingual", true);
    setStep("clean_speech", false);
    const c7 = await api(`/api/projects/${projectId}/subtitle-audio-fixture-run`, { method: "POST", body: JSON.stringify({}) });
    assert(c7.status === 201 && c7.data.generatedSubtitleCount === 3 && c7.data.generatedMarkerCount === 0, "C7 clean_speech disabled should generate no markers");
    const c7Job = latestM8aJob();
    assertJob(c7Job, { enabledSteps: ["arrange_timeline", "subtitles_bilingual", "apply_style_profile"], subtitleCount: 3, markerCount: 0, skipped: ["clean_speech_disabled"] });
    assertLatestRows(c7Job.id, 0);

    const missing = await api("/api/projects/missing_project/subtitle-audio-fixture-run", { method: "POST", body: JSON.stringify({}) });
    assert(missing.status === 404 && missing.data.error === "Project not found", "C8 missing project contract");
    const noSource = await api(`/api/projects/${noSourceProjectId}/subtitle-audio-fixture-run`, { method: "POST", body: JSON.stringify({}) });
    assert(noSource.status === 409 && noSource.data.error === "Primary source asset is required for subtitle/audio pipeline.", "C9 no source contract");
    const otherAfter = countProjectRows(otherProjectId);
    assert(JSON.stringify(otherBefore) === JSON.stringify(otherAfter), "C10 other project should remain unchanged");
    assertForeignKeysAndJsonClean();

    const performance = performanceSnapshot(c5MarkerRows);
    console.log(JSON.stringify({ performance }, null, 2));
    console.log("AutoMedia M8a subtitle/audio fixture verification passed.");
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
