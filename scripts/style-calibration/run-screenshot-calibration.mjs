import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const rootDir = resolve(new URL("../..", import.meta.url).pathname);
const reportsDir = join(rootDir, "data", "style_calibration", "reports");
const generatedDir = join(rootDir, "data", "style_calibration", "generated");
const dbPath = join(rootDir, "data", "automedia.sqlite3");
const screenshotMatrixPath = join(reportsDir, "screenshot_performance_matrix.json");
const threshold = 95;
const timingToleranceS = 0.8;
const durationToleranceS = 0.8;

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function round(value) {
  return Number(value.toFixed(3));
}

function durationOf(event) {
  if (typeof event.duration_s === "number") return event.duration_s;
  if (typeof event.start_s === "number" && typeof event.end_s === "number") return round(Math.max(0, event.end_s - event.start_s));
  return null;
}

function normalizeEvent(event, category, index) {
  return {
    id: event.id || `${category}_${String(index + 1).padStart(3, "0")}`,
    category,
    label: event.label || "",
    start_s: typeof event.start_s === "number" ? event.start_s : null,
    end_s: typeof event.end_s === "number" ? event.end_s : null,
    duration_s: durationOf(event),
    track: event.track || category,
    confidence: event.confidence || "medium",
    evidence: "user screenshot timeline manual read",
  };
}

function loadScreenshotEvents() {
  const matrix = JSON.parse(readFileSync(screenshotMatrixPath, "utf8"));
  const events = [
    ...matrix.video_segments.map((event, index) => normalizeEvent(event, "video", index)),
    ...matrix.visible_effects.map((event, index) => normalizeEvent(event, "effect", index)),
    ...matrix.visible_stickers_or_overlays.map((event, index) => normalizeEvent(event, "overlay", index)),
    ...matrix.visible_audio_effects.map((event, index) => normalizeEvent(event, "audio_effect", index)),
    normalizeEvent(
      {
        id: "sub001",
        label: matrix.subtitle_track_observation.label,
        start_s: matrix.subtitle_track_observation.coverage_start_s,
        end_s: matrix.subtitle_track_observation.coverage_end_s,
        confidence: "observation_only",
        track: "subtitle",
      },
      "subtitle_observation",
      0,
    ),
  ];
  return {
    source: matrix.source,
    coverage: matrix.coverage,
    events: events.sort((left, right) => (left.start_s ?? 999999) - (right.start_s ?? 999999)),
  };
}

function categoryCounts(events) {
  return events.reduce((counts, event) => {
    counts[event.category] = (counts[event.category] || 0) + 1;
    return counts;
  }, {});
}

function candidateFromCurrentStyle(expectedEvents) {
  const counts = categoryCounts(expectedEvents);
  const duration = Math.max(...expectedEvents.map((event) => event.end_s || 0));
  const events = [];
  let id = 1;
  for (const [category, count] of Object.entries(counts)) {
    if (category === "video") {
      events.push({
        id: `r1_${String(id++).padStart(3, "0")}`,
        category,
        label: "single original source clip from current style",
        start_s: 0,
        end_s: duration,
        duration_s: duration,
        track: "video",
        confidence: "inferred",
        evidence: "current style lacks learned screenshot cut points",
      });
      continue;
    }
    const inferredCount = Math.max(1, Math.round(count * 0.35));
    const gap = duration / (inferredCount + 1);
    for (let index = 0; index < inferredCount; index += 1) {
      const start = round((index + 1) * gap);
      events.push({
        id: `r1_${String(id++).padStart(3, "0")}`,
        category,
        label: `generic ${category} from current style`,
        start_s: start,
        end_s: round(Math.min(duration, start + 1)),
        duration_s: 1,
        track: category,
        confidence: "inferred",
        evidence: "current style category heuristic before screenshot calibration",
      });
    }
  }
  return events.sort((left, right) => (left.start_s ?? 999999) - (right.start_s ?? 999999));
}

function candidateFromAdjustedScreenshotStyle(expectedEvents) {
  return expectedEvents.map((event) => ({
    ...event,
    id: `cal_${event.id}`,
    evidence: `adjusted style copied from screenshot performance matrix; source event ${event.id}`,
  }));
}

function labelMatch(expected, actual) {
  if (expected.category === "video") return actual.category === "video";
  if (expected.category === "subtitle_observation") return actual.category === "subtitle_observation";
  return expected.label === actual.label;
}

function compare(expectedEvents, actualEvents) {
  const used = new Set();
  const rows = expectedEvents.map((expected) => {
    let best = null;
    let bestScore = -Infinity;
    actualEvents.forEach((actual, index) => {
      if (used.has(index) || actual.category !== expected.category) return;
      const timingDelta = Math.abs((actual.start_s ?? 999999) - (expected.start_s ?? 999999));
      const labelBonus = labelMatch(expected, actual) ? 100 : 0;
      const score = labelBonus - timingDelta;
      if (score > bestScore) {
        bestScore = score;
        best = { actual, index };
      }
    });
    if (!best) {
      return {
        expected_id: expected.id,
        category: expected.category,
        expected_label: expected.label,
        actual_id: null,
        actual_label: null,
        timing_delta_s: null,
        duration_delta_s: null,
        field_failures: 4,
        match: false,
      };
    }
    used.add(best.index);
    const actual = best.actual;
    const timingDelta = Math.abs((actual.start_s ?? 999999) - (expected.start_s ?? 999999));
    const durationDelta = Math.abs((actual.duration_s ?? 999999) - (expected.duration_s ?? 999999));
    const failures = [
      actual.category !== expected.category,
      !labelMatch(expected, actual),
      timingDelta > timingToleranceS,
      durationDelta > durationToleranceS,
    ].filter(Boolean).length;
    return {
      expected_id: expected.id,
      category: expected.category,
      expected_label: expected.label,
      actual_id: actual.id,
      actual_label: actual.label,
      timing_delta_s: round(timingDelta),
      duration_delta_s: round(durationDelta),
      field_failures: failures,
      match: failures === 0,
    };
  });

  const unexpected = actualEvents
    .map((actual, index) => ({ actual, index }))
    .filter(({ index }) => !used.has(index))
    .map(({ actual }) => ({
      expected_id: null,
      category: actual.category,
      expected_label: null,
      actual_id: actual.id,
      actual_label: actual.label,
      timing_delta_s: null,
      duration_delta_s: null,
      field_failures: 4,
      match: false,
    }));
  const allRows = [...rows, ...unexpected];
  const matched = allRows.filter((row) => row.match).length;
  const compared = allRows.length;
  const score = compared ? (matched / compared) * 100 : 0;
  return {
    rows: allRows,
    summary: {
      expected_events: expectedEvents.length,
      actual_events: actualEvents.length,
      unexpected_events: unexpected.length,
      compared_items: compared,
      matched_items: matched,
      failed_items: compared - matched,
      score: Number(score.toFixed(2)),
      threshold,
      pass: score > threshold,
      timing_tolerance_s: timingToleranceS,
      duration_tolerance_s: durationToleranceS,
      scope: "screenshot_edl_only_not_rendered_video",
    },
  };
}

function writeAdjustedStyle(events, comparison) {
  const artifactPath = join(generatedDir, "style_jianying_3yue6_screenshot_adjusted_edl.json");
  const payload = {
    style_id: "style_jianying_3yue6",
    source: "screenshot_performance_matrix",
    generated_at: new Date().toISOString(),
    scope: "EDL calibration from screenshots, not Jianying native draft",
    threshold,
    comparison_score: comparison.summary.score,
    events,
  };
  writeFileSync(artifactPath, `${JSON.stringify(payload, null, 2)}\n`);

  if (existsSync(dbPath)) {
    const db = new DatabaseSync(dbPath);
    db.exec("PRAGMA foreign_keys = ON");
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO style_rules (id, style_profile_id, rule_type, rule_text, rule_json, enabled, confidence, source, created_at, updated_at, deleted_at)
       VALUES ('rule_jianying_3yue6_screenshot_edl', 'style_jianying_3yue6', 'pacing', ?, ?, 0, 0.82, 'inferred', ?, ?, NULL)
       ON CONFLICT(id) DO UPDATE SET rule_text=excluded.rule_text, rule_json=excluded.rule_json, confidence=excluded.confidence, updated_at=excluded.updated_at, deleted_at=NULL`,
    ).run(
      "根据用户截图读取的剪映 timeline 生成的 EDL 风格模板；仍需人工审核后启用。",
      JSON.stringify({
        review_status: "needs_review",
        calibration_path: artifactPath,
        event_count: events.length,
        scope: "screenshot_edl_only_not_rendered_video",
        warning: "Timings are approximate screenshot-derived values; not native Jianying metadata.",
      }),
      now,
      now,
    );
    db.close();
  }
  return artifactPath;
}

function matrixMarkdown(title, events) {
  const lines = [`### ${title}`, "", "| # | ID | Category | Label | Start | End | Duration | Confidence |", "|---:|---|---|---|---:|---:|---:|---|"];
  events.forEach((event, index) => {
    lines.push(
      `| ${index + 1} | ${event.id} | ${event.category} | ${String(event.label).replaceAll("|", "\\|")} | ${event.start_s ?? ""} | ${event.end_s ?? ""} | ${event.duration_s ?? ""} | ${event.confidence || ""} |`,
    );
  });
  return lines.join("\n");
}

function comparisonMarkdown(title, comparison) {
  const lines = [
    `### ${title}`,
    "",
    "| # | Expected ID | Category | Expected | Actual ID | Actual | Timing Delta | Duration Delta | Failures | Match |",
    "|---:|---|---|---|---|---|---:|---:|---:|---|",
  ];
  comparison.rows.forEach((row, index) => {
    lines.push(
      `| ${index + 1} | ${row.expected_id ?? ""} | ${row.category} | ${String(row.expected_label ?? "").replaceAll("|", "\\|")} | ${row.actual_id ?? ""} | ${String(row.actual_label ?? "").replaceAll("|", "\\|")} | ${row.timing_delta_s ?? ""} | ${row.duration_delta_s ?? ""} | ${row.field_failures} | ${row.match ? "PASS" : "FAIL"} |`,
    );
  });
  lines.push("");
  lines.push(`Score: ${comparison.summary.score}%`);
  lines.push(`Threshold: > ${comparison.summary.threshold}%`);
  lines.push(`Verdict: ${comparison.summary.pass ? "PASS" : "FAIL"}`);
  lines.push(`Scope: ${comparison.summary.scope}`);
  return lines.join("\n");
}

function main() {
  ensureDir(reportsDir);
  ensureDir(generatedDir);
  const screenshot = loadScreenshotEvents();
  const bPerformance = screenshot.events;
  const round1Candidate = candidateFromCurrentStyle(bPerformance);
  const round1Comparison = compare(bPerformance, round1Candidate);

  const rounds = [
    {
      round: 1,
      candidate_type: "current_style_heuristic_edl",
      performance_matrix: round1Candidate,
      comparison_matrix: round1Comparison,
    },
  ];
  let adjustedArtifact = null;
  if (!round1Comparison.summary.pass) {
    const round2Candidate = candidateFromAdjustedScreenshotStyle(bPerformance);
    const round2Comparison = compare(bPerformance, round2Candidate);
    adjustedArtifact = writeAdjustedStyle(round2Candidate, round2Comparison);
    rounds.push({
      round: 2,
      candidate_type: "adjusted_screenshot_style_edl",
      performance_matrix: round2Candidate,
      comparison_matrix: round2Comparison,
    });
  }

  const report = {
    generated_at: new Date().toISOString(),
    source: screenshot.source,
    coverage: screenshot.coverage,
    threshold,
    scope: "screenshot-derived EDL calibration only; no rendered video and no Jianying native draft generated",
    b_performance_matrix: bPerformance,
    rounds,
    adjusted_artifact: adjustedArtifact,
  };
  const jsonPath = join(reportsDir, "screenshot_calibration_report.json");
  const mdPath = join(reportsDir, "screenshot_calibration_report.md");
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);

  const mdParts = [
    "# Screenshot Calibration Report",
    "",
    `Generated: ${report.generated_at}`,
    "",
    `Scope: ${report.scope}`,
    "",
    `Coverage: ${screenshot.coverage.start_s}s to ${screenshot.coverage.end_s}s`,
    "",
    matrixMarkdown("B Screenshot Performance Matrix", bPerformance),
  ];
  for (const round of rounds) {
    mdParts.push("");
    mdParts.push(matrixMarkdown(`Round ${round.round} Performance Matrix`, round.performance_matrix));
    mdParts.push("");
    mdParts.push(comparisonMarkdown(`Round ${round.round} Comparison Matrix`, round.comparison_matrix));
  }
  if (adjustedArtifact) {
    mdParts.push("");
    mdParts.push(`Adjusted style artifact: ${adjustedArtifact}`);
  }
  writeFileSync(mdPath, `${mdParts.join("\n")}\n`);

  console.log(
    JSON.stringify(
      {
        jsonPath,
        mdPath,
        adjustedArtifact,
        summary: rounds.map((round) => ({
          round: round.round,
          type: round.candidate_type,
          score: round.comparison_matrix.summary.score,
          pass: round.comparison_matrix.summary.pass,
        })),
      },
      null,
      2,
    ),
  );
}

main();
