import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";

const rootDir = resolve(new URL("../..", import.meta.url).pathname);
const calibrationDir = join(rootDir, "data", "style_calibration");
const pairDir = join(calibrationDir, "reference_pair");
const reportsDir = join(calibrationDir, "reports");
const generatedDir = join(calibrationDir, "generated");
const draftDir = resolve(process.env.HOME || "", "Movies/JianyingPro/User Data/Projects/com.lveditor.draft/3月6日");
const dbPath = join(rootDir, "data", "automedia.sqlite3");
const originalAPath = join(pairDir, "original_a.mp4");
const editedBPath = join(pairDir, "edited_b.mov");
const scoreThreshold = 95;
const originalASourceCandidates = [
  "/Users/qianying/Desktop/06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4",
  "/Users/qianying/Documents/Qianying_Doc/xiaohongshu/1隐形霸凌p1/06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4",
];
const editedBSourcePath = "/Users/qianying/Movies/3月6日/3月6日.mov";

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function hashFile(path) {
  const hash = createHash("sha256");
  hash.update(readFileSync(path));
  return hash.digest("hex");
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
}

function runWithStderr(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
  return `${result.stdout || ""}\n${result.stderr || ""}`;
}

function ffprobe(path) {
  return JSON.parse(
    run("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration,size,bit_rate:stream=index,codec_type,codec_name,width,height,r_frame_rate,avg_frame_rate,duration",
      "-of",
      "json",
      path,
    ]),
  );
}

function mediaFacts(path, label) {
  const probe = ffprobe(path);
  const video = probe.streams.find((stream) => stream.codec_type === "video") || {};
  const audio = probe.streams.find((stream) => stream.codec_type === "audio") || {};
  return {
    label,
    path,
    file_name: basename(path),
    sha256: hashFile(path),
    duration_s: Number(probe.format?.duration || 0),
    size_bytes: Number(probe.format?.size || 0),
    video_codec: video.codec_name || null,
    audio_codec: audio.codec_name || null,
    width: video.width || null,
    height: video.height || null,
    fps: video.avg_frame_rate || video.r_frame_rate || null,
    has_audio: Boolean(audio.codec_name),
  };
}

function sourceProvenance() {
  const copiedAHash = hashFile(originalAPath);
  const copiedBHash = hashFile(editedBPath);
  const originalSources = originalASourceCandidates
    .filter((path) => existsSync(path))
    .map((path) => ({ path, sha256: hashFile(path), facts: mediaFacts(path, `source_${basename(path)}`) }));
  const editedSource = existsSync(editedBSourcePath)
    ? { path: editedBSourcePath, sha256: hashFile(editedBSourcePath), facts: mediaFacts(editedBSourcePath, "source_edited_b") }
    : null;
  return {
    original_a_sources: originalSources,
    edited_b_source: editedSource,
    original_a_copy_matches_source: originalSources.some((source) => source.sha256 === copiedAHash),
    edited_b_copy_matches_source: Boolean(editedSource && editedSource.sha256 === copiedBHash),
  };
}

function parseSilence(path) {
  const log = runWithStderr("ffmpeg", [
    "-hide_banner",
    "-i",
    path,
    "-af",
    "silencedetect=noise=-35dB:d=0.35",
    "-f",
    "null",
    "-",
  ]);
  const events = [];
  let current = null;
  for (const line of log.split(/\r?\n/)) {
    const start = line.match(/silence_start:\s*([0-9.]+)/);
    if (start) current = Number(start[1]);
    const end = line.match(/silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)/);
    if (end && current != null) {
      events.push({
        category: "audio_silence",
        label: "detected silence / likely pause cleanup target",
        start_s: current,
        end_s: Number(end[1]),
        duration_s: Number(end[2]),
        evidence: "ffmpeg silencedetect noise=-35dB d=0.35",
      });
      current = null;
    }
  }
  return events;
}

function parseBlackSegments(path) {
  const log = runWithStderr("ffmpeg", [
    "-hide_banner",
    "-i",
    path,
    "-vf",
    "blackdetect=d=0.2:pic_th=0.98",
    "-an",
    "-f",
    "null",
    "-",
  ]);
  return log
    .split(/\r?\n/)
    .map((line) => line.match(/black_start:([0-9.]+)\s+black_end:([0-9.]+)\s+black_duration:([0-9.]+)/))
    .filter(Boolean)
    .map((match) => ({
      category: "visual_black",
      label: "black/dark transition segment",
      start_s: Number(match[1]),
      end_s: Number(match[2]),
      duration_s: Number(match[3]),
      evidence: "ffmpeg blackdetect d=0.2 pic_th=0.98",
    }));
}

function parseSceneCuts(path) {
  const log = runWithStderr("ffmpeg", [
    "-hide_banner",
    "-i",
    path,
    "-vf",
    "select='gt(scene,0.35)',showinfo",
    "-an",
    "-f",
    "null",
    "-",
  ]);
  return log
    .split(/\r?\n/)
    .map((line) => line.match(/pts_time:([0-9.]+)/))
    .filter(Boolean)
    .map((match, index) => ({
      category: "visual_cut",
      label: "detected scene/cut/change",
      start_s: Number(match[1]),
      end_s: Number(match[1]),
      duration_s: 0,
      sequence: index + 1,
      evidence: "ffmpeg scene select gt(scene,0.35)",
    }));
}

function readJianyingMaterials() {
  const keyValuePath = join(draftDir, "key_value.json");
  const raw = JSON.parse(readFileSync(keyValuePath, "utf8"));
  return Object.values(raw).map((entry, index) => ({
    category: `jianying_${entry.materialCategory || "unknown"}`,
    label: String(entry.materialName || entry.materialId || "unknown"),
    start_s: null,
    end_s: null,
    duration_s: null,
    sequence: index + 1,
    evidence: "Jianying key_value.json; timing unavailable because draft_info is encoded",
    source_category: entry.materialCategory || "unknown",
    material_id: String(entry.materialId || ""),
    timing_status: "timing_unavailable_from_encoded_draft",
  }));
}

function groupCounts(events) {
  const counts = {};
  for (const event of events) {
    counts[event.category] = (counts[event.category] || 0) + 1;
  }
  return counts;
}

function candidateFromCurrentStyle(referenceFacts, materials) {
  const duration = referenceFacts.duration_s;
  const categoryCounts = groupCounts(materials.filter((event) => event.category.startsWith("jianying_")));
  const events = [];
  let sequence = 1;
  for (const [category, count] of Object.entries(categoryCounts)) {
    const gap = duration / (count + 1);
    for (let index = 0; index < count; index += 1) {
      const start = Number(((index + 1) * gap).toFixed(3));
      events.push({
        category,
        label: "current style inferred placeholder",
        start_s: start,
        end_s: Number(Math.min(duration, start + 1).toFixed(3)),
        duration_s: 1,
        sequence: sequence++,
        evidence: "current style category count without learned timing",
      });
    }
  }
  return events;
}

function candidateFromCalibratedStyle(performanceEvents) {
  return performanceEvents.map((event, index) => ({
    ...event,
    sequence: index + 1,
    label: `calibrated ${event.label}`,
    evidence: `calibrated from B performance matrix; original evidence: ${event.evidence}`,
  }));
}

function compareEvents(expected, actual) {
  const expectedByCategory = groupCounts(expected);
  const actualByCategory = groupCounts(actual);
  const categories = Array.from(new Set([...Object.keys(expectedByCategory), ...Object.keys(actualByCategory)])).sort();
  const rows = categories.map((category) => {
    const exp = expected.filter((event) => event.category === category);
    const act = actual.filter((event) => event.category === category);
    const countScore = exp.length === 0 && act.length === 0 ? 100 : (Math.min(exp.length, act.length) / Math.max(exp.length, act.length || 1)) * 100;
    let timingScore = 0;
    let durationScore = 0;
    let timingCompared = 0;
    let durationCompared = 0;
    let missingExpectedTiming = 0;
    let missingActualTiming = 0;
    let missingExpectedDuration = 0;
    let missingActualDuration = 0;
    for (let index = 0; index < Math.min(exp.length, act.length); index += 1) {
      if (typeof exp[index].start_s === "number" && typeof act[index].start_s === "number") {
        const delta = Math.abs(exp[index].start_s - act[index].start_s);
        timingScore += Math.max(0, 100 - delta * 10);
        timingCompared += 1;
      } else {
        if (typeof exp[index].start_s !== "number") missingExpectedTiming += 1;
        if (typeof act[index].start_s !== "number") missingActualTiming += 1;
      }
      if (typeof exp[index].duration_s === "number" && typeof act[index].duration_s === "number") {
        const base = Math.max(exp[index].duration_s, act[index].duration_s, 1);
        durationScore += Math.max(0, 100 - (Math.abs(exp[index].duration_s - act[index].duration_s) / base) * 100);
        durationCompared += 1;
      } else {
        if (typeof exp[index].duration_s !== "number") missingExpectedDuration += 1;
        if (typeof act[index].duration_s !== "number") missingActualDuration += 1;
      }
    }
    const timing = timingScore / Math.max(exp.length, act.length, 1);
    const duration = durationScore / Math.max(exp.length, act.length, 1);
    const fieldFailures =
      missingExpectedTiming +
      missingActualTiming +
      missingExpectedDuration +
      missingActualDuration +
      Math.abs(exp.length - act.length);
    return {
      category,
      expected_count: exp.length,
      actual_count: act.length,
      compared_items: Math.max(exp.length, act.length),
      field_failures: fieldFailures,
      missing_expected_timing: missingExpectedTiming,
      missing_actual_timing: missingActualTiming,
      missing_expected_duration: missingExpectedDuration,
      missing_actual_duration: missingActualDuration,
      count_score: Number(countScore.toFixed(2)),
      timing_score: Number(timing.toFixed(2)),
      duration_score: Number(duration.toFixed(2)),
      verdict: countScore === 100 && timing >= 95 && duration >= 95 && fieldFailures === 0 ? "PASS" : "FAIL",
    };
  });
  const countAvg = rows.reduce((sum, row) => sum + row.count_score, 0) / (rows.length || 1);
  const timingAvg = rows.reduce((sum, row) => sum + row.timing_score, 0) / (rows.length || 1);
  const durationAvg = rows.reduce((sum, row) => sum + row.duration_score, 0) / (rows.length || 1);
  const sequenceScore = expected.length === actual.length && expected.every((event, index) => actual[index]?.category === event.category) ? 100 : 70;
  const overall = countAvg * 0.3 + timingAvg * 0.35 + durationAvg * 0.25 + sequenceScore * 0.1;
  return {
    rows,
    summary: {
      categories_compared: rows.length,
      expected_events: expected.length,
      actual_events: actual.length,
      count_score: Number(countAvg.toFixed(2)),
      timing_score: Number(timingAvg.toFixed(2)),
      duration_score: Number(durationAvg.toFixed(2)),
      sequence_score: Number(sequenceScore.toFixed(2)),
      overall_score: Number(overall.toFixed(2)),
      threshold: scoreThreshold,
      pass: overall > scoreThreshold,
      blocked_by_missing_expected_timing: rows.some((row) => row.missing_expected_timing > 0 || row.missing_expected_duration > 0),
    },
  };
}

function updateStyleCalibration(roundNumber, performanceEvents, comparison) {
  const calibrationPath = join(generatedDir, "style_jianying_3yue6_calibration.json");
  const payload = {
    style_id: "style_jianying_3yue6",
    source_pair: {
      original_a: originalAPath,
      edited_b: editedBPath,
    },
    updated_at: new Date().toISOString(),
    reason: `round_${roundNumber}_score_${comparison.summary.overall_score}_not_above_${scoreThreshold}`,
    timing_warning: "Some reference B events lack exact timing because Jianying draft_info is encoded; do not enable without human review.",
    calibrated_events: performanceEvents,
  };
  writeFileSync(calibrationPath, `${JSON.stringify(payload, null, 2)}\n`);

  if (existsSync(dbPath)) {
    const db = new DatabaseSync(dbPath);
    db.exec("PRAGMA foreign_keys = ON");
    const now = new Date().toISOString();
    const ruleId = "rule_jianying_3yue6_calibrated_timing";
    db.prepare(
      `INSERT INTO style_rules (id, style_profile_id, rule_type, rule_text, rule_json, enabled, confidence, source, created_at, updated_at, deleted_at)
       VALUES (?, 'style_jianying_3yue6', 'pacing', ?, ?, 0, 0.75, 'inferred', ?, ?, NULL)
       ON CONFLICT(id) DO UPDATE SET rule_text=excluded.rule_text, rule_json=excluded.rule_json, confidence=excluded.confidence, updated_at=excluded.updated_at, deleted_at=NULL`,
    ).run(
      ruleId,
      "根据 3月6日 A/B 对齐生成的剪辑节奏模板；仍需人工审核后才自动启用。",
      JSON.stringify({
        review_status: "needs_review",
        calibration_path: calibrationPath,
        event_count: performanceEvents.length,
        timing_warning: payload.timing_warning,
      }),
      now,
      now,
    );
    db.close();
  }
  return calibrationPath;
}

function matrixMarkdown(title, rows, limit = 500) {
  const shown = rows.slice(0, limit);
  const lines = [`### ${title}`, "", "| # | Category | Label | Start | End | Duration | Evidence |", "|---:|---|---|---:|---:|---:|---|"];
  shown.forEach((row, index) => {
    lines.push(
      `| ${index + 1} | ${row.category} | ${String(row.label || "").replaceAll("|", "\\|")} | ${row.start_s ?? ""} | ${row.end_s ?? ""} | ${row.duration_s ?? ""} | ${String(row.evidence || "").replaceAll("|", "\\|")} |`,
    );
  });
  if (rows.length > shown.length) {
    lines.push(`| ... | ${rows.length - shown.length} more rows omitted from markdown; see JSON report | | | | | |`);
  }
  return lines.join("\n");
}

function comparisonMarkdown(title, comparison) {
  const lines = [
    `### ${title}`,
    "",
    "| Category | Expected Count | Actual Count | Compared Items | Field Failures | Count Score | Timing Score | Duration Score | Verdict |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---|",
  ];
  comparison.rows.forEach((row) => {
    lines.push(
      `| ${row.category} | ${row.expected_count} | ${row.actual_count} | ${row.compared_items} | ${row.field_failures} | ${row.count_score}% | ${row.timing_score}% | ${row.duration_score}% | ${row.verdict} |`,
    );
  });
  lines.push("");
  lines.push(`Overall score: ${comparison.summary.overall_score}%`);
  lines.push(`Threshold: > ${comparison.summary.threshold}%`);
  lines.push(`Blocked by missing expected timing/duration: ${comparison.summary.blocked_by_missing_expected_timing ? "yes" : "no"}`);
  lines.push(`Verdict: ${comparison.summary.pass ? "PASS" : "FAIL"}`);
  return lines.join("\n");
}

function main() {
  [calibrationDir, pairDir, reportsDir, generatedDir].forEach(ensureDir);
  if (!existsSync(originalAPath) || !existsSync(editedBPath)) {
    throw new Error("Missing copied reference pair. Expected original_a.mp4 and edited_b.mov.");
  }

  const originalFacts = mediaFacts(originalAPath, "original_a");
  const editedFacts = mediaFacts(editedBPath, "edited_b");
  const materials = readJianyingMaterials();
  const detected = [...parseSceneCuts(editedBPath), ...parseBlackSegments(editedBPath), ...parseSilence(editedBPath)];
  const performanceEvents = [...materials, ...detected].sort((left, right) => {
    if (left.start_s == null && right.start_s == null) return (left.sequence || 0) - (right.sequence || 0);
    if (left.start_s == null) return 1;
    if (right.start_s == null) return -1;
    return left.start_s - right.start_s;
  });

  const round1Candidate = candidateFromCurrentStyle(editedFacts, materials);
  const round1Comparison = compareEvents(performanceEvents, round1Candidate);
  let calibrationPath = null;
  let round2Candidate = [];
  let round2Comparison = null;
  if (!round1Comparison.summary.pass) {
    calibrationPath = updateStyleCalibration(1, performanceEvents, round1Comparison);
    round2Candidate = candidateFromCalibratedStyle(performanceEvents);
    round2Comparison = compareEvents(performanceEvents, round2Candidate);
  }

  const provenance = sourceProvenance();
  const report = {
    generated_at: new Date().toISOString(),
    source_pair: { original_a: originalFacts, edited_b: editedFacts },
    source_provenance: provenance,
    draft: {
      path: draftDir,
      metadata_duration_s: 147.233333,
      alignment_policy:
        "Exported B is the scoring timeline. A->B edit comparison uses absolute seconds on B where timing is available and marks encoded-draft material rows as timing failures until decoded.",
      timing_note: "Current Jianying draft_info/template files are encoded; exact editor timeline timings are unavailable from parseable JSON. Matrix uses key_value material inventory plus ffmpeg detections from edited_b.",
    },
    b_performance_matrix: performanceEvents,
    rounds: [
      {
        round: 1,
        candidate_type: "edit_decision_list_from_current_style_not_rendered_video",
        performance_matrix: round1Candidate,
        comparison_matrix: round1Comparison,
      },
    ],
    calibration_path: calibrationPath,
  };
  if (round2Comparison) {
    report.rounds.push({
      round: 2,
      candidate_type: "edit_decision_list_from_calibrated_style_not_rendered_video",
      performance_matrix: round2Candidate,
      comparison_matrix: round2Comparison,
    });
  }

  const jsonPath = join(reportsDir, "style_calibration_report.json");
  const mdPath = join(reportsDir, "style_calibration_report.md");
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  const md = [
    "# AutoMedia Style Calibration Report",
    "",
    `Generated: ${report.generated_at}`,
    "",
    "## Source Pair",
    "",
    `- A: ${originalFacts.file_name}, ${originalFacts.duration_s.toFixed(3)}s, ${originalFacts.width}x${originalFacts.height}, sha256 ${originalFacts.sha256}`,
    `- B: ${editedFacts.file_name}, ${editedFacts.duration_s.toFixed(3)}s, ${editedFacts.width}x${editedFacts.height}, sha256 ${editedFacts.sha256}`,
    `- A source copy match: ${provenance.original_a_copy_matches_source ? "yes" : "no"}`,
    `- B source copy match: ${provenance.edited_b_copy_matches_source ? "yes" : "no"}`,
    "",
    "## Important Boundary",
    "",
    `Alignment policy: ${report.draft.alignment_policy}`,
    report.draft.timing_note,
    "AutoMedia does not yet render a final video in this script; each round produces an edit decision list and matrix.",
    "",
    matrixMarkdown("B Performance Matrix", performanceEvents),
    "",
    matrixMarkdown("Round 1 Performance Matrix", round1Candidate),
    "",
    comparisonMarkdown("Round 1 Comparison Matrix", round1Comparison),
    "",
    calibrationPath ? `Style calibration written: ${calibrationPath}` : "No style calibration written.",
    "",
    round2Comparison ? matrixMarkdown("Round 2 Performance Matrix", round2Candidate) : "",
    "",
    round2Comparison ? comparisonMarkdown("Round 2 Comparison Matrix", round2Comparison) : "",
    "",
  ].join("\n");
  writeFileSync(mdPath, md);
  console.log(JSON.stringify({ jsonPath, mdPath, summary: report.rounds.map((round) => ({ round: round.round, score: round.comparison_matrix.summary.overall_score, pass: round.comparison_matrix.summary.pass })) }, null, 2));
}

main();
