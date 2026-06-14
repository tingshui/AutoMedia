import { copyFileSync, createReadStream, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { basename, extname, join, normalize, resolve, sep } from "node:path";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { scanFirstJianyingDraft } from "./jianying-style.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = resolve(__dirname, "..");
const defaultDbPath = resolve(rootDir, "data", "automedia.sqlite3");
const libraryDir = resolve(rootDir, "data", "library");
const now = () => new Date().toISOString();
const editSteps = [
  ["arrange_timeline", 1],
  ["clean_speech", 2],
  ["subtitles_bilingual", 3],
  ["apply_style_profile", 4],
];
const tracks = [
  ["video", "Video"],
  ["audio", "Audio"],
  ["subtitles", "Subtitles"],
  ["effects", "Effects"],
];
const trackByItemType = {
  video: "video",
  audio: "audio",
  music: "audio",
  subtitle: "subtitles",
  effect: "effects",
  text: "effects",
  sticker: "effects",
  transition: "effects",
};
const catalogConfig = {
  effect: { table: "effect_presets", idColumn: "id", itemType: "effect" },
  audio: { table: "audio_presets", idColumn: "id", itemType: "audio" },
  music: { table: "music_assets", idColumn: "id", itemType: "music" },
  sticker: { table: "sticker_assets", idColumn: "id", itemType: "sticker" },
  transition: { table: "transition_presets", idColumn: "id", itemType: "transition" },
};
const placeholderMetadata = {
  fixture: true,
  m2_placeholder: true,
  codec: "placeholder",
  fps: 30,
  bitrate: 0,
};
const styleLearningV3 = {
  id: "style_jianying_3yue6_v3",
  name: "剪映导入-3月6日 v3",
  summary: "基于 3月6日 剪映参考视频校准到 v3 的口播轻综艺风格，当前状态为待审核。",
  styleDocPath: "data/style_calibration/generated/style_jianying_3yue6_v3.md",
  comparisonReportPath: "data/style_calibration/reports/style_learning_v1_comparison_matrix.md",
  comparisonScore: 99.07,
  docSha256: "8db3776ef38897bb11e37fd9848f86b9efaefb845a4dd52546d9875f576705e1",
  rules: [
    [
      "pacing",
      "按 A 视频语义区间生成剪辑点，保留口播为主；2.5-3 分钟视频目标为 8-12 个保留语音段、10-14 个视觉效果、13-17 个音效、4-6 个短覆盖物。",
      {
        review_status: "needs_review",
        source_round: 3,
        semantic_zones_required: true,
        retained_speech_segments: "8-12",
        visual_effects: "10-14",
        audio_effects: "13-17",
        overlays: "4-6",
      },
    ],
    [
      "effect",
      "开头冲突或不确定性使用视觉框选/聚焦；错误直觉用干扰或故障；例子段每 8-12 秒加入录像带/复古或聚焦；建议段使用聚光、紧迫或强调效果。",
      {
        review_status: "needs_review",
        source_round: 3,
        families: ["framing", "focus", "tape_retro", "glitch", "spotlight", "urgency"],
        spacing_seconds: "8-12 in dense explanation or example zones",
      },
    ],
    [
      "audio",
      "用音效标记内容功能：疑问对应 confusion，错误直觉对应 negative，正确重构对应 success，隐藏问题对应 tension/shock，孩子受伤对应 sad，结尾对应 idea/success/completion。",
      {
        review_status: "needs_review",
        source_round: 3,
        families: ["question", "error_negative", "correct_success", "shock", "tension", "sad_broken", "variety_beat", "idea_completion"],
        no_comedy_near_child_hurt: true,
      },
    ],
    [
      "subtitle",
      "全程使用连续句级中文字幕，按完整意思断句；除非平台风格另有要求，不使用逐字字幕。",
      {
        review_status: "needs_review",
        source_round: 3,
        caption_unit: "sentence",
        continuity: "speaking_section",
      },
    ],
    [
      "sticker",
      "覆盖物只放在 hook、强意识转折、操作指令和结尾 flourish 上，通常持续 1-4 秒，并且必须说明内容功能。",
      {
        review_status: "needs_review",
        source_round: 3,
        duration_seconds: "1-4",
        allowed_functions: ["hook", "realization", "instruction", "final_flourish"],
      },
    ],
    [
      "text",
      "每个新增 cue 都必须引用内容功能，避免只因为参考视频某个时间点有素材就照搬。",
      {
        review_status: "needs_review",
        source_round: 3,
        content_function_required: true,
      },
    ],
    [
      "pacing",
      "禁止复用 B 视频的非零精确时间戳；若候选时间碰巧接近参考边界，移动到 A 视频支持的最近语义边界并记录原因。",
      {
        review_status: "needs_review",
        source_round: 3,
        anti_leak_rule: true,
        exact_reference_timestamp_reuse: "forbidden",
      },
    ],
  ],
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function resolveRequestPath(root, requestUrl) {
  const url = new URL(requestUrl, "http://127.0.0.1");
  const decodedPath = decodeURIComponent(url.pathname);
  const safePath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  let filePath = resolve(join(root, safePath));

  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    return null;
  }

  try {
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      filePath = join(filePath, "index.html");
    }
  } catch {
    if (!extname(filePath)) {
      filePath = join(filePath, "index.html");
    }
  }

  return filePath;
}

function dbPath() {
  return resolve(process.env.AUTOMEDIA_DB_PATH || defaultDbPath);
}

function openDatabase() {
  const path = dbPath();
  if (!existsSync(path)) {
    throw new Error(`AutoMedia database not found at ${path}. Run npm run db:reset.`);
  }
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}

function jsonResponse(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function readRequestJson(request) {
  return new Promise((resolveJson, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolveJson(body ? JSON.parse(body) : {});
      } catch {
        reject(httpError(400, "Invalid JSON body"));
      }
    });
    request.on("error", reject);
  });
}

function normalizeRows(rows) {
  return rows.map((row) => ({ ...row }));
}

function stemFilename(filename) {
  return filename.replace(/\.[^/.]+$/, "").trim();
}

function slugPart(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 42);
}

function uniqueId(prefix, seed) {
  const suffix = slugPart(seed) || "untitled";
  return `${prefix}_${suffix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parseJson(value, fallback = {}) {
  if (value == null || value === "") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function encodeJson(value) {
  return JSON.stringify(value ?? {});
}

function one(db, sql, params = []) {
  const row = db.prepare(sql).get(...params);
  return row ? { ...row } : null;
}

function all(db, sql, params = []) {
  return normalizeRows(db.prepare(sql).all(...params));
}

function requireProject(db, projectId) {
  const project = one(
    db,
    "SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL AND status != 'archived'",
    [projectId],
  );
  if (!project) throw httpError(404, "Project not found");
  return project;
}

function getTrackId(db, projectId, itemType) {
  const trackType = trackByItemType[itemType];
  if (!trackType) throw httpError(400, "Unsupported timeline item type");
  const track = one(db, "SELECT id FROM timeline_tracks WHERE project_id = ? AND track_type = ?", [projectId, trackType]);
  if (!track) throw httpError(400, `Missing ${trackType} track`);
  return track.id;
}

function splitSentences(text) {
  const matches = String(text || "").match(/[^。！？.!?]+[。！？.!?]?/g) || [];
  return matches.map((sentence) => sentence.trim()).filter(Boolean);
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function assertAllowedImportPath(filePath) {
  const resolved = resolve(String(filePath || ""));
  if (!filePath || String(filePath).includes("..")) {
    throw httpError(400, "Import path traversal is not allowed");
  }
  if (!existsSync(resolved)) {
    throw httpError(404, "Import file not found");
  }
  const allowedRoots = [resolve(rootDir, "fixtures"), resolve(rootDir, "data"), resolve(process.env.HOME || "/", "Movies")];
  if (!allowedRoots.some((root) => resolved === root || resolved.startsWith(`${root}${sep}`))) {
    throw httpError(400, "Import path is outside allowed local roots");
  }
  return resolved;
}

function assertSupportedVideo(path) {
  const ext = extname(path).toLowerCase();
  if (![".mp4", ".mov", ".m4v", ".webm"].includes(ext)) {
    throw httpError(400, "Unsupported media type");
  }
}

function upsertStyleLearningV3(db, options = {}) {
  const timestamp = now();
  const existingStyle = one(db, "SELECT id, deleted_at AS deletedAt FROM style_profiles WHERE id = ?", [styleLearningV3.id]);
  if (existingStyle?.deletedAt && !options.forceRevive) {
    return { skipped: true, reason: "style_soft_deleted" };
  }
  const activeRuleCount = one(
    db,
    "SELECT COUNT(*) AS count FROM style_rules WHERE style_profile_id = ? AND deleted_at IS NULL",
    [styleLearningV3.id],
  )?.count;
  if (existingStyle && !existingStyle.deletedAt && activeRuleCount === styleLearningV3.rules.length) {
    return { skipped: true, reason: "style_already_current" };
  }

  db.exec("BEGIN");
  try {
    db.prepare(
      `
      INSERT INTO style_profiles(id, name, summary, created_at, updated_at, deleted_at)
      VALUES (?, ?, ?, ?, ?, NULL)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        summary=excluded.summary,
        updated_at=excluded.updated_at,
        deleted_at=NULL
      `,
    ).run(styleLearningV3.id, styleLearningV3.name, styleLearningV3.summary, timestamp, timestamp);

    for (const [index, [ruleType, ruleText, ruleJson]] of styleLearningV3.rules.entries()) {
      const ruleId = `rule_${styleLearningV3.id}_${String(index + 1).padStart(2, "0")}`;
      db.prepare(
        `
        INSERT INTO style_rules
          (id, style_profile_id, rule_type, rule_text, rule_json, enabled, confidence, source, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, 0, 0.82, 'performance_feedback', ?, ?, NULL)
        ON CONFLICT(id) DO UPDATE SET
          rule_type=excluded.rule_type,
          rule_text=excluded.rule_text,
          rule_json=excluded.rule_json,
          enabled=0,
          confidence=0.82,
          source='performance_feedback',
          updated_at=excluded.updated_at,
          deleted_at=NULL
        `,
      ).run(
        ruleId,
        styleLearningV3.id,
        ruleType,
        ruleText,
        encodeJson({
          ...ruleJson,
          source_artifact: styleLearningV3.styleDocPath,
          comparison_report: styleLearningV3.comparisonReportPath,
          comparison_score: styleLearningV3.comparisonScore,
          style_doc_sha256: styleLearningV3.docSha256,
          claim_layer: "plan_level_only_not_rendered_video",
        }),
        timestamp,
        timestamp,
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return { skipped: false };
}

function importStyleLearningV3(options = {}) {
  const db = openDatabase();
  try {
    const result = upsertStyleLearningV3(db, options);
    return { style: getStyle(styleLearningV3.id), ...result };
  } finally {
    db.close();
  }
}

function getBootstrap() {
  const db = openDatabase();
  try {
    upsertStyleLearningV3(db);
    const projects = normalizeRows(
      db.prepare(
        `
        SELECT id, title, status, thumbnail_asset_id AS thumbnailAssetId,
               last_playhead_ms AS lastPlayheadMs, duration_ms AS durationMs,
               created_at AS createdAt, updated_at AS updatedAt
        FROM projects
        WHERE deleted_at IS NULL AND status != 'archived'
        ORDER BY updated_at DESC, created_at DESC, id ASC
        LIMIT 12
        `,
      ).all(),
    );
    const styles = normalizeRows(
      db.prepare(
        `
        SELECT id, name, summary, created_at AS createdAt, updated_at AS updatedAt
        FROM style_profiles
        WHERE deleted_at IS NULL
        ORDER BY created_at ASC, id ASC
        `,
      ).all(),
    );
    return { projects, styles };
  } finally {
    db.close();
  }
}

function getProject(projectId) {
  const db = openDatabase();
  try {
    const project = one(
      db,
      `
      SELECT id, title, status, thumbnail_asset_id AS thumbnailAssetId,
             last_playhead_ms AS lastPlayheadMs, duration_ms AS durationMs,
             created_at AS createdAt, updated_at AS updatedAt
      FROM projects
      WHERE id = ? AND deleted_at IS NULL
      `,
      [projectId],
    );
    if (!project) return null;

    const layout = one(
      db,
      `
      SELECT project_id AS projectId, video_panel_height AS videoPanelHeight,
             timeline_panel_height AS timelinePanelHeight, sidebar_collapsed AS sidebarCollapsed,
             updated_at AS updatedAt
      FROM project_layout_preferences
      WHERE project_id = ?
      `,
      [projectId],
    );
    const tracks = all(
      db,
      `
      SELECT id, track_type AS trackType, name, sort_order AS sortOrder, is_visible AS isVisible,
             is_locked AS isLocked, created_at AS createdAt, updated_at AS updatedAt
      FROM timeline_tracks
      WHERE project_id = ?
      ORDER BY sort_order ASC
      `,
      [projectId],
    );
    const items = all(
      db,
      `
      SELECT id, project_id AS projectId, track_id AS trackId, item_type AS itemType,
             source_asset_id AS sourceAssetId, start_ms AS startMs, end_ms AS endMs,
             duration_ms AS durationMs, source_start_ms AS sourceStartMs, source_end_ms AS sourceEndMs,
             properties_json AS propertiesJson, generated_by_job_id AS generatedByJobId,
             manual_override AS manualOverride, is_muted AS isMuted, is_locked AS isLocked,
             created_at AS createdAt, updated_at AS updatedAt
      FROM timeline_items
      WHERE project_id = ? AND deleted_at IS NULL
      ORDER BY start_ms ASC, created_at ASC
      `,
      [projectId],
    ).map((item) => ({ ...item, properties: parseJson(item.propertiesJson), propertiesJson: undefined }));
    const assets = all(
      db,
      `
      SELECT source_assets.id, source_assets.asset_type AS assetType, source_assets.file_path AS filePath,
             source_assets.original_name AS originalName, source_assets.duration_ms AS durationMs,
             source_assets.width, source_assets.height, source_assets.checksum,
             source_assets.metadata_json AS metadataJson, project_assets.role, project_assets.sort_order AS sortOrder
      FROM source_assets
      JOIN project_assets ON project_assets.asset_id = source_assets.id
      WHERE project_assets.project_id = ?
      ORDER BY project_assets.sort_order ASC, source_assets.created_at ASC
      `,
      [projectId],
    ).map((asset) => ({ ...asset, metadata: parseJson(asset.metadataJson), metadataJson: undefined }));
    const steps = all(
      db,
      `
      SELECT id, step_key AS stepKey, enabled, sort_order AS sortOrder, updated_at AS updatedAt
      FROM edit_steps
      WHERE project_id = ?
      ORDER BY sort_order ASC
      `,
      [projectId],
    );
    const styles = all(
      db,
      `
      SELECT style_profiles.id, style_profiles.name, style_profiles.summary
      FROM project_style_profiles
      JOIN style_profiles ON style_profiles.id = project_style_profiles.style_profile_id
      WHERE project_style_profiles.project_id = ? AND style_profiles.deleted_at IS NULL
      ORDER BY project_style_profiles.created_at ASC
      `,
      [projectId],
    );
    return { project, layout, tracks, items, assets, steps, styles };
  } finally {
    db.close();
  }
}

function createProject(input) {
  const filename = String(input.filename || "").trim();
  const styleId = String(input.styleId || "").trim();
  if (!filename) {
    const error = new Error("请选择或输入素材文件名。");
    error.status = 400;
    throw error;
  }
  if (!styleId) {
    const error = new Error("请选择剪辑风格。");
    error.status = 400;
    throw error;
  }

  const db = openDatabase();
  try {
    const style = db.prepare("SELECT id FROM style_profiles WHERE id = ? AND deleted_at IS NULL").get(styleId);
    if (!style) {
      const error = new Error("选择的剪辑风格不可用。");
      error.status = 400;
      throw error;
    }

    const title = stemFilename(filename) || "untitled_video";
    const projectId = uniqueId("project_m2", title);
    const assetId = uniqueId("asset_m2", filename);
    const timestamp = now();
    const metadataJson = JSON.stringify(placeholderMetadata);

    db.exec("BEGIN");
    try {
      db.prepare(
        `
        INSERT INTO source_assets
          (id, asset_type, file_path, original_name, duration_ms, width, height, checksum, metadata_json, created_at)
        VALUES (?, 'video', ?, ?, 0, 1080, 1920, ?, ?, ?)
        `,
      ).run(assetId, `m2_uploads/${filename}`, filename, `m2-placeholder-${assetId}`, metadataJson, timestamp);
      db.prepare(
        `
        INSERT INTO projects
          (id, title, status, thumbnail_asset_id, last_playhead_ms, duration_ms, created_at, updated_at, deleted_at)
        VALUES (?, ?, 'draft', ?, 0, 0, ?, ?, NULL)
        `,
      ).run(projectId, title, assetId, timestamp, timestamp);
      db.prepare(
        "INSERT INTO project_assets(project_id, asset_id, role, sort_order, created_at) VALUES (?, ?, 'source', 1, ?)",
      ).run(projectId, assetId, timestamp);
      db.prepare(
        `
        INSERT INTO project_layout_preferences(project_id, video_panel_height, timeline_panel_height, sidebar_collapsed, updated_at)
        VALUES (?, 520, 260, 0, ?)
        `,
      ).run(projectId, timestamp);
      for (const [index, [trackType, name]] of tracks.entries()) {
        db.prepare(
          `
          INSERT INTO timeline_tracks
            (id, project_id, track_type, name, sort_order, is_visible, is_locked, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?)
          `,
        ).run(`track_${projectId}_${trackType}`, projectId, trackType, name, index + 1, timestamp, timestamp);
      }
      for (const [stepKey, sortOrder] of editSteps) {
        db.prepare(
          `
          INSERT INTO edit_steps(id, project_id, step_key, enabled, sort_order, updated_at)
          VALUES (?, ?, ?, 1, ?, ?)
          `,
        ).run(`step_${projectId}_${stepKey}`, projectId, stepKey, sortOrder, timestamp);
      }
      db.prepare(
        "INSERT INTO project_style_profiles(project_id, style_profile_id, applied_at, created_at) VALUES (?, ?, ?, ?)",
      ).run(projectId, styleId, timestamp, timestamp);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    return {
      project: {
        id: projectId,
        title,
        status: "draft",
        thumbnailAssetId: assetId,
        lastPlayheadMs: 0,
        durationMs: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      asset: {
        id: assetId,
        originalName: filename,
        metadata: placeholderMetadata,
      },
    };
  } finally {
    db.close();
  }
}

function listStyles() {
  const db = openDatabase();
  try {
    upsertStyleLearningV3(db);
    return all(
      db,
      `
      SELECT id, name, summary, created_at AS createdAt, updated_at AS updatedAt
      FROM style_profiles
      WHERE deleted_at IS NULL
      ORDER BY created_at ASC, id ASC
      `,
    );
  } finally {
    db.close();
  }
}

function getStyle(styleId) {
  const db = openDatabase();
  try {
    const style = one(
      db,
      `
      SELECT id, name, summary, created_at AS createdAt, updated_at AS updatedAt
      FROM style_profiles
      WHERE id = ? AND deleted_at IS NULL
      `,
      [styleId],
    );
    if (!style) return null;
    const rules = all(
      db,
      `
      SELECT id, style_profile_id AS styleProfileId, rule_type AS ruleType, rule_text AS ruleText,
             rule_json AS ruleJson, enabled, confidence, source, created_at AS createdAt, updated_at AS updatedAt
      FROM style_rules
      WHERE style_profile_id = ? AND deleted_at IS NULL
      ORDER BY created_at ASC, id ASC
      `,
      [styleId],
    ).map((rule) => ({ ...rule, rule: parseJson(rule.ruleJson), ruleJson: undefined }));
    return { style, rules };
  } finally {
    db.close();
  }
}

export function importJianyingStyle(options = {}) {
  const scan = scanFirstJianyingDraft();
  const db = openDatabase();
  const timestamp = now();
  try {
    const existingStyle = one(db, "SELECT id, deleted_at AS deletedAt FROM style_profiles WHERE id = 'style_jianying_3yue6'");
    if (existingStyle?.deletedAt && !options.forceRevive) {
      return { style: null, scan, skipped: true, reason: "style_soft_deleted" };
    }
    db.exec("BEGIN");
    try {
      db.prepare(
        `
        INSERT INTO source_assets
          (id, asset_type, file_path, original_name, duration_ms, width, height, checksum, metadata_json, created_at)
        VALUES ('asset_jianying_3yue6_cover', 'image', ?, 'draft_cover.jpg', ?, 1080, 1920, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          file_path=excluded.file_path,
          duration_ms=excluded.duration_ms,
          checksum=excluded.checksum,
          metadata_json=excluded.metadata_json
        `,
      ).run(
        scan.coverPath,
        scan.durationMs,
        `jianying-cover-${scan.draftId || "3yue6"}`,
        encodeJson({ source_app: "jianying", draft_name: scan.draftName, reference_only: true }),
        timestamp,
      );
      db.prepare(
        `
        INSERT INTO style_profiles(id, name, summary, created_at, updated_at, deleted_at)
        VALUES ('style_jianying_3yue6', '剪映导入-3月6日', '从剪映本地草稿 3月6日 导入的待审核风格规则。', ?, ?, NULL)
        ON CONFLICT(id) DO UPDATE SET
          name=COALESCE(style_profiles.name, excluded.name),
          summary=excluded.summary,
          updated_at=excluded.updated_at,
          deleted_at=NULL
        `,
      ).run(timestamp, timestamp);
      db.prepare(
        `
        INSERT INTO style_reference_videos(id, style_profile_id, asset_id, analysis_json, created_at)
        VALUES ('reference_jianying_3yue6', 'style_jianying_3yue6', 'asset_jianying_3yue6_cover', ?, ?)
        ON CONFLICT(id) DO UPDATE SET analysis_json=excluded.analysis_json
        `,
      ).run(encodeJson(scan.analysis), timestamp);

      for (const rule of scan.rules) {
        const ruleId = `rule_jianying_3yue6_${rule.category}`;
        db.prepare(
          `
          INSERT INTO style_rules
            (id, style_profile_id, rule_type, rule_text, rule_json, enabled, confidence, source, created_at, updated_at, deleted_at)
          VALUES (?, 'style_jianying_3yue6', ?, ?, ?, 0, 0.5, 'inferred', ?, ?, NULL)
          ON CONFLICT(id) DO UPDATE SET
            rule_type=excluded.rule_type,
            rule_text=excluded.rule_text,
            rule_json=excluded.rule_json,
            enabled=0,
            confidence=0.5,
            source='inferred',
            updated_at=excluded.updated_at,
            deleted_at=NULL
          `,
        ).run(ruleId, rule.ruleType, rule.ruleText, encodeJson(rule.ruleJson), timestamp, timestamp);
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return { style: getStyle("style_jianying_3yue6"), scan };
  } finally {
    db.close();
  }
}

function updateStyle(styleId, input) {
  const name = String(input.name || "").trim();
  if (!name) throw httpError(400, "Style name is required");
  const db = openDatabase();
  const timestamp = now();
  try {
    const before = one(db, "SELECT id FROM style_profiles WHERE id = ? AND deleted_at IS NULL", [styleId]);
    if (!before) throw httpError(404, "Style not found");
    db.prepare("UPDATE style_profiles SET name = ?, updated_at = ? WHERE id = ?").run(name, timestamp, styleId);
    return getStyle(styleId);
  } finally {
    db.close();
  }
}

function updateStyleRule(ruleId, input) {
  const db = openDatabase();
  const timestamp = now();
  try {
    const rule = one(db, "SELECT * FROM style_rules WHERE id = ? AND deleted_at IS NULL", [ruleId]);
    if (!rule) throw httpError(404, "Style rule not found");
    const enabled = input.enabled == null ? rule.enabled : input.enabled ? 1 : 0;
    db.prepare("UPDATE style_rules SET enabled = ?, updated_at = ? WHERE id = ?").run(enabled, timestamp, ruleId);
    return getStyle(rule.style_profile_id);
  } finally {
    db.close();
  }
}

function deleteStyleRule(ruleId, input) {
  const decision = input.decision === "cancelled" ? "cancelled" : "confirmed";
  const db = openDatabase();
  const timestamp = now();
  try {
    const rule = one(db, "SELECT * FROM style_rules WHERE id = ? AND deleted_at IS NULL", [ruleId]);
    if (!rule) throw httpError(404, "Style rule not found");
    db.exec("BEGIN");
    try {
      if (decision === "confirmed") {
        db.prepare("UPDATE style_rules SET deleted_at = ?, updated_at = ? WHERE id = ?").run(timestamp, timestamp, ruleId);
      }
      db.prepare(
        `
        INSERT OR IGNORE INTO confirmation_events(id, project_id, target_type, target_id, action, decision, created_at)
        VALUES (?, NULL, 'style_rule', ?, 'delete', ?, ?)
        `,
      ).run(`confirm_style_rule_${ruleId}_${decision}`, ruleId, decision, timestamp);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return { decision };
  } finally {
    db.close();
  }
}

function deleteStyle(styleId, input) {
  const decision = input.decision === "cancelled" ? "cancelled" : "confirmed";
  const db = openDatabase();
  const timestamp = now();
  try {
    const style = one(db, "SELECT * FROM style_profiles WHERE id = ? AND deleted_at IS NULL", [styleId]);
    if (!style) throw httpError(404, "Style not found");
    db.exec("BEGIN");
    try {
      if (decision === "confirmed") {
        db.prepare("UPDATE style_profiles SET deleted_at = ?, updated_at = ? WHERE id = ?").run(timestamp, timestamp, styleId);
      }
      db.prepare(
        `
        INSERT OR IGNORE INTO confirmation_events(id, project_id, target_type, target_id, action, decision, created_at)
        VALUES (?, NULL, 'style_profile', ?, 'delete', ?, ?)
        `,
      ).run(`confirm_style_profile_${styleId}_${decision}`, styleId, decision, timestamp);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return { decision };
  } finally {
    db.close();
  }
}

function saveProject(projectId, input) {
  const db = openDatabase();
  const timestamp = now();
  try {
    requireProject(db, projectId);
    const title = String(input.title || "").trim();
    if (!title) throw httpError(400, "Project title is required");
    const layout = input.layout || {};
    const videoHeight = Number(layout.videoPanelHeight);
    const timelineHeight = Number(layout.timelinePanelHeight);
    if (!Number.isFinite(videoHeight) || !Number.isFinite(timelineHeight) || videoHeight < 120 || timelineHeight < 120) {
      throw httpError(400, "Invalid layout heights");
    }
    const steps = Array.isArray(input.steps) ? input.steps : [];
    db.exec("BEGIN");
    try {
      db.prepare("UPDATE projects SET title = ?, updated_at = ? WHERE id = ?").run(title, timestamp, projectId);
      db.prepare(
        `
        UPDATE project_layout_preferences
        SET video_panel_height = ?, timeline_panel_height = ?, updated_at = ?
        WHERE project_id = ?
        `,
      ).run(Math.round(videoHeight), Math.round(timelineHeight), timestamp, projectId);
      for (const step of steps) {
        const stepKey = String(step.stepKey || "");
        if (!editSteps.some(([key]) => key === stepKey)) throw httpError(400, "Invalid edit step");
        db.prepare("UPDATE edit_steps SET enabled = ?, updated_at = ? WHERE project_id = ? AND step_key = ?").run(
          step.enabled ? 1 : 0,
          timestamp,
          projectId,
          stepKey,
        );
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return getProject(projectId);
  } finally {
    db.close();
  }
}

function importAsset(projectId, input) {
  const sourcePath = assertAllowedImportPath(input.filePath);
  assertSupportedVideo(sourcePath);
  const db = openDatabase();
  const timestamp = now();
  try {
    requireProject(db, projectId);
    const checksum = sha256File(sourcePath);
    const ext = extname(sourcePath).toLowerCase();
    const copiedRelativePath = `data/library/${checksum}${ext}`;
    const copiedAbsolutePath = resolve(rootDir, copiedRelativePath);
    mkdirSync(libraryDir, { recursive: true });
    if (!existsSync(copiedAbsolutePath)) {
      copyFileSync(sourcePath, copiedAbsolutePath);
    }

    let asset = one(db, "SELECT * FROM source_assets WHERE checksum = ?", [checksum]);
    db.exec("BEGIN");
    try {
      if (!asset) {
        const assetId = `asset_import_${checksum.slice(0, 16)}`;
        db.prepare(
          `
          INSERT INTO source_assets
            (id, asset_type, file_path, original_name, duration_ms, width, height, checksum, metadata_json, created_at)
          VALUES (?, 'video', ?, ?, 0, 1080, 1920, ?, ?, ?)
          `,
        ).run(
          assetId,
          copiedRelativePath,
          basename(sourcePath),
          checksum,
          encodeJson({ fixture: true, imported_by: "m5", codec: "fixture", fps: 30, copied: true }),
          timestamp,
        );
        asset = one(db, "SELECT * FROM source_assets WHERE id = ?", [assetId]);
      }
      const maxOrder = one(db, "SELECT COALESCE(MAX(sort_order), 0) AS value FROM project_assets WHERE project_id = ?", [projectId]).value;
      db.prepare(
        `
        INSERT OR IGNORE INTO project_assets(project_id, asset_id, role, sort_order, created_at)
        VALUES (?, ?, 'source', ?, ?)
        `,
      ).run(projectId, asset.id, Number(maxOrder) + 1, timestamp);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return { asset: { ...asset, metadata: parseJson(asset.metadata_json), metadata_json: undefined }, project: getProject(projectId) };
  } finally {
    db.close();
  }
}

function createTimelineItem(projectId, input) {
  const itemType = String(input.itemType || "");
  const db = openDatabase();
  const timestamp = now();
  try {
    requireProject(db, projectId);
    const trackId = getTrackId(db, projectId, itemType);
    const startMs = Number(input.startMs ?? 0);
    const endMs = Number(input.endMs ?? 3000);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs < 0 || endMs < startMs) {
      throw httpError(400, "Invalid time range");
    }
    const properties = input.properties && typeof input.properties === "object" ? input.properties : {};
    const itemId = uniqueId(`item_${itemType}`, projectId);
    let sourceAssetId = input.sourceAssetId ? String(input.sourceAssetId) : null;
    if (itemType === "video") {
      if (!sourceAssetId) throw httpError(400, "Video timeline item requires source asset");
      const asset = one(db, "SELECT id FROM source_assets WHERE id = ?", [sourceAssetId]);
      if (!asset) throw httpError(400, "Source asset not found");
    }
    if (itemType === "subtitle") {
      sourceAssetId = null;
    }

    db.exec("BEGIN");
    try {
      db.prepare(
        `
        INSERT INTO timeline_items
          (id, project_id, track_id, item_type, source_asset_id, start_ms, end_ms, duration_ms,
           source_start_ms, source_end_ms, properties_json, generated_by_job_id, manual_override,
           is_muted, is_locked, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, NULL, 1, 0, 0, ?, ?, NULL)
        `,
      ).run(itemId, projectId, trackId, itemType, sourceAssetId, startMs, endMs, endMs - startMs, encodeJson(properties), timestamp, timestamp);

      if (itemType === "subtitle") {
        const text = String(properties.text || "");
        const sentences = splitSentences(text);
        if (!sentences.length) throw httpError(400, "Subtitle text is required");
        const segmentIds = [];
        const segmentDuration = Math.max(1, Math.floor((endMs - startMs) / sentences.length));
        for (const [index, sentence] of sentences.entries()) {
          const segmentId = `${itemId}_subtitle_${index + 1}`;
          const segStart = startMs + index * segmentDuration;
          const segEnd = index === sentences.length - 1 ? endMs : segStart + segmentDuration;
          db.prepare(
            `
            INSERT INTO subtitle_segments
              (id, project_id, timeline_item_id, language, text, start_ms, end_ms, style_json, created_at, updated_at, deleted_at)
            VALUES (?, ?, ?, 'zh', ?, ?, ?, '{}', ?, ?, NULL)
            `,
          ).run(segmentId, projectId, itemId, sentence, segStart, segEnd, timestamp, timestamp);
          segmentIds.push(segmentId);
        }
        db.prepare("UPDATE timeline_items SET properties_json = ?, updated_at = ? WHERE id = ?").run(
          encodeJson({ ...properties, subtitle_segment_ids: segmentIds, granularity: "sentence" }),
          timestamp,
          itemId,
        );
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return { item: one(db, "SELECT * FROM timeline_items WHERE id = ?", [itemId]), project: getProject(projectId) };
  } finally {
    db.close();
  }
}

function createCatalogTimelineItem(projectId, input) {
  const catalogType = String(input.catalogType || "");
  const catalogId = String(input.catalogId || "");
  const config = catalogConfig[catalogType];
  if (!config || !catalogId) throw httpError(400, "Invalid catalog item");
  const db = openDatabase();
  try {
    const catalog = one(
      db,
      `SELECT id, display_name AS displayName FROM ${config.table} WHERE id = ? AND deleted_at IS NULL`,
      [catalogId],
    );
    if (!catalog) throw httpError(400, "Catalog item not found");
    return createTimelineItem(projectId, {
      itemType: config.itemType,
      startMs: input.startMs ?? 0,
      endMs: input.endMs ?? 2000,
      properties: {
        catalog_id: catalog.id,
        catalog_table: config.table,
        catalog_display_name: catalog.displayName,
      },
    });
  } finally {
    db.close();
  }
}

function updateTimelineItem(itemId, input) {
  const db = openDatabase();
  const timestamp = now();
  try {
    const item = one(db, "SELECT * FROM timeline_items WHERE id = ? AND deleted_at IS NULL", [itemId]);
    if (!item) throw httpError(404, "Timeline item not found");
    const properties = input.properties && typeof input.properties === "object" ? input.properties : parseJson(item.properties_json);
    db.prepare("UPDATE timeline_items SET properties_json = ?, manual_override = 1, updated_at = ? WHERE id = ?").run(
      encodeJson(properties),
      timestamp,
      itemId,
    );
    return getProject(item.project_id);
  } finally {
    db.close();
  }
}

function deleteTimelineItem(itemId) {
  const db = openDatabase();
  const timestamp = now();
  try {
    const item = one(db, "SELECT * FROM timeline_items WHERE id = ? AND deleted_at IS NULL", [itemId]);
    if (!item) throw httpError(404, "Timeline item not found");
    db.prepare("UPDATE timeline_items SET deleted_at = ?, updated_at = ? WHERE id = ?").run(timestamp, timestamp, itemId);
    return getProject(item.project_id);
  } finally {
    db.close();
  }
}

async function handleApi(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/bootstrap") {
      jsonResponse(response, 200, getBootstrap());
      return true;
    }

    if (request.method === "GET" && url.pathname === "/api/styles") {
      jsonResponse(response, 200, { styles: listStyles() });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/styles/import-jianying-first") {
      jsonResponse(response, 201, importJianyingStyle());
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/styles/import-jianying-v3") {
      jsonResponse(response, 201, importStyleLearningV3());
      return true;
    }

    const styleMatch = url.pathname.match(/^\/api\/styles\/([^/]+)$/);
    if (styleMatch) {
      const styleId = decodeURIComponent(styleMatch[1]);
      if (request.method === "GET") {
        const style = getStyle(styleId);
        if (!style) {
          jsonResponse(response, 404, { error: "Style not found" });
          return true;
        }
        jsonResponse(response, 200, style);
        return true;
      }
      if (request.method === "PATCH") {
        const input = await readRequestJson(request);
        jsonResponse(response, 200, updateStyle(styleId, input));
        return true;
      }
      if (request.method === "DELETE") {
        const input = await readRequestJson(request);
        jsonResponse(response, 200, deleteStyle(styleId, input));
        return true;
      }
    }

    const ruleMatch = url.pathname.match(/^\/api\/style-rules\/([^/]+)$/);
    if (ruleMatch) {
      const ruleId = decodeURIComponent(ruleMatch[1]);
      if (request.method === "PATCH") {
        const input = await readRequestJson(request);
        jsonResponse(response, 200, updateStyleRule(ruleId, input));
        return true;
      }
      if (request.method === "DELETE") {
        const input = await readRequestJson(request);
        jsonResponse(response, 200, deleteStyleRule(ruleId, input));
        return true;
      }
    }

    const projectMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (request.method === "GET" && projectMatch) {
      const project = getProject(decodeURIComponent(projectMatch[1]));
      if (!project) {
        jsonResponse(response, 404, { error: "Project not found" });
        return true;
      }
      jsonResponse(response, 200, project);
      return true;
    }

    const projectActionMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/([^/]+)$/);
    if (projectActionMatch) {
      const projectId = decodeURIComponent(projectActionMatch[1]);
      const action = projectActionMatch[2];
      if (request.method === "PATCH" && action === "save") {
        const input = await readRequestJson(request);
        jsonResponse(response, 200, saveProject(projectId, input));
        return true;
      }
      if (request.method === "POST" && action === "import-asset") {
        const input = await readRequestJson(request);
        jsonResponse(response, 201, importAsset(projectId, input));
        return true;
      }
      if (request.method === "POST" && action === "timeline-items") {
        const input = await readRequestJson(request);
        if (input.catalogType) {
          jsonResponse(response, 201, createCatalogTimelineItem(projectId, input));
        } else {
          jsonResponse(response, 201, createTimelineItem(projectId, input));
        }
        return true;
      }
    }

    const timelineItemMatch = url.pathname.match(/^\/api\/timeline-items\/([^/]+)$/);
    if (timelineItemMatch) {
      const itemId = decodeURIComponent(timelineItemMatch[1]);
      if (request.method === "PATCH") {
        const input = await readRequestJson(request);
        jsonResponse(response, 200, updateTimelineItem(itemId, input));
        return true;
      }
      if (request.method === "DELETE") {
        jsonResponse(response, 200, deleteTimelineItem(itemId));
        return true;
      }
    }

    if (request.method === "POST" && url.pathname === "/api/projects") {
      const input = await readRequestJson(request);
      jsonResponse(response, 201, createProject(input));
      return true;
    }

    if (url.pathname.startsWith("/api/")) {
      jsonResponse(response, 404, { error: "API route not found" });
      return true;
    }
  } catch (error) {
    jsonResponse(response, error.status || 500, { error: error.message || "Internal error" });
    return true;
  }

  return false;
}

export function createStaticServer(options = {}) {
  const root = options.root ? resolve(options.root) : rootDir;

  return createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    if (await handleApi(request, response, url)) {
      return;
    }

    const filePath = resolveRequestPath(root, request.url || "/");

    if (!filePath) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const stream = createReadStream(filePath);
    stream.on("open", () => {
      response.writeHead(200, {
        "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
    });
    stream.on("error", () => {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    });
    stream.pipe(response);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const host = process.env.AUTOMEDIA_HOST || "127.0.0.1";
  const port = Number(process.env.AUTOMEDIA_PORT || 4173);
  const server = createStaticServer();

  server.listen(port, host, () => {
    console.log(`AutoMedia demo running at http://${host}:${port}`);
  });
}
