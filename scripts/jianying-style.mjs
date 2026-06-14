import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

export const defaultJianyingRoot = resolve(
  process.env.HOME || "",
  "Movies/JianyingPro/User Data/Projects/com.lveditor.draft",
);

const categoryToRule = [
  ["audio", "audio", "音频和音效使用频繁，自动剪辑时保持音效候选为待审核。"],
  ["effect", "effect", "画面特效使用频繁，自动剪辑时先生成低置信度特效候选。"],
  ["media", "pacing", "存在补充背景/素材使用，自动剪辑时允许插入节奏辅助素材候选。"],
  ["sticker", "sticker", "贴纸用于情绪强调，自动剪辑时贴纸候选必须人工审核。"],
  ["cover_text", "text", "封面文字样式有独立规律，自动剪辑时仅生成待审核文本风格建议。"],
  ["text", "text", "花字和文本效果用于重点表达，自动剪辑时文本效果保持待审核。"],
  ["trans", "transition", "存在转场使用，自动剪辑时转场候选保持轻量并需审核。"],
];

function readJsonIfPossible(path) {
  try {
    return { ok: true, value: JSON.parse(readFileSync(path, "utf8")) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function chooseFirstDraft(rootMeta) {
  const drafts = Array.isArray(rootMeta.all_draft_store) ? rootMeta.all_draft_store : [];
  return drafts
    .filter((draft) => draft && draft.draft_name && !draft.tm_draft_removed)
    .sort((left, right) => Number(left.tm_draft_create || 0) - Number(right.tm_draft_create || 0))[0];
}

function countBy(entries, field) {
  const counts = {};
  for (const entry of entries) {
    const key = String(entry?.[field] || "unknown").trim() || "unknown";
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function buildRules(categoryCounts) {
  return categoryToRule.map(([category, ruleType, ruleText]) => ({
    category,
    ruleType,
    ruleText,
    count: categoryCounts[category] || 0,
    ruleJson: {
      source_category: category,
      observed_count: categoryCounts[category] || 0,
      review_status: "needs_review",
      redaction_policy: "category_counts_only",
    },
  }));
}

export function scanFirstJianyingDraft(options = {}) {
  const root = resolve(options.root || defaultJianyingRoot);
  const rootMetaPath = join(root, "root_meta_info.json");
  if (!existsSync(rootMetaPath)) {
    const error = new Error(`Jianying root meta not found: ${rootMetaPath}`);
    error.status = 404;
    throw error;
  }

  const rootMetaResult = readJsonIfPossible(rootMetaPath);
  if (!rootMetaResult.ok) {
    const error = new Error(`Cannot parse Jianying root meta: ${rootMetaResult.error}`);
    error.status = 400;
    throw error;
  }

  const draft = chooseFirstDraft(rootMetaResult.value);
  if (!draft) {
    const error = new Error("No local Jianying draft found.");
    error.status = 404;
    throw error;
  }

  const draftPath = resolve(String(draft.draft_fold_path || join(root, draft.draft_name)));
  if (draftPath !== root && !draftPath.startsWith(`${root}/`)) {
    const error = new Error("Jianying draft path is outside the draft root.");
    error.status = 400;
    throw error;
  }

  const keyValuePath = join(draftPath, "key_value.json");
  const keyValueResult = readJsonIfPossible(keyValuePath);
  const keyValueEntries = keyValueResult.ok ? Object.values(keyValueResult.value) : [];
  const categoryCounts = countBy(keyValueEntries, "materialCategory");

  const parseableFiles = [];
  const opaqueFiles = [];
  for (const relativePath of [
    "root_meta_info.json",
    `${draft.draft_name}/key_value.json`,
    `${draft.draft_name}/Timelines/project.json`,
    `${draft.draft_name}/attachment_pc_common.json`,
    `${draft.draft_name}/attachment_editing.json`,
  ]) {
    const path = relativePath === "root_meta_info.json" ? rootMetaPath : join(root, relativePath);
    if (existsSync(path) && readJsonIfPossible(path).ok) {
      parseableFiles.push(basename(path));
    }
  }
  for (const relativePath of [
    "draft_info.json",
    "draft_info.json.bak",
    "draft_meta_info.json",
    "template-2.tmp",
  ]) {
    const path = join(draftPath, relativePath);
    if (existsSync(path) && !readJsonIfPossible(path).ok) {
      opaqueFiles.push(relativePath);
    }
  }

  const durationMs = Math.round(Number(draft.tm_duration || 0) / 1000);
  return {
    root,
    draftName: String(draft.draft_name),
    draftId: String(draft.draft_id || ""),
    draftPath,
    coverPath: String(draft.draft_cover || join(draftPath, "draft_cover.jpg")),
    durationMicroseconds: Number(draft.tm_duration || 0),
    durationMs,
    createdAtMicroseconds: Number(draft.tm_draft_create || 0),
    modifiedAtMicroseconds: Number(draft.tm_draft_modified || 0),
    categoryCounts,
    totalMaterialEntries: keyValueEntries.length,
    parseableFiles,
    opaqueFiles,
    rules: buildRules(categoryCounts),
    analysis: {
      source_app: "jianying",
      draft_name: String(draft.draft_name),
      draft_id: String(draft.draft_id || ""),
      duration_microseconds: Number(draft.tm_duration || 0),
      duration_ms: durationMs,
      category_counts: categoryCounts,
      total_material_entries: keyValueEntries.length,
      parseable_files: parseableFiles,
      opaque_files: opaqueFiles,
      redaction_policy: "category_counts_only_no_material_names_no_search_keywords_no_local_media_filenames",
    },
  };
}
