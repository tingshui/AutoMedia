PRAGMA foreign_keys = ON;

CREATE TABLE schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE source_assets (
  id TEXT PRIMARY KEY,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('video', 'audio', 'image', 'music', 'sticker')),
  file_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  duration_ms INTEGER,
  width INTEGER,
  height INTEGER,
  checksum TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
  created_at TEXT NOT NULL
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'editing', 'ready_to_publish', 'archived')),
  thumbnail_asset_id TEXT,
  last_playhead_ms INTEGER NOT NULL DEFAULT 0 CHECK (last_playhead_ms >= 0),
  duration_ms INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (thumbnail_asset_id) REFERENCES source_assets(id)
);

CREATE TABLE project_assets (
  project_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('source', 'background_music', 'cover_source', 'reference')),
  sort_order INTEGER NOT NULL CHECK (sort_order > 0),
  created_at TEXT NOT NULL,
  PRIMARY KEY (project_id, asset_id, role),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES source_assets(id)
);

CREATE TABLE project_layout_preferences (
  project_id TEXT PRIMARY KEY,
  video_panel_height INTEGER,
  timeline_panel_height INTEGER,
  sidebar_collapsed INTEGER NOT NULL DEFAULT 0 CHECK (sidebar_collapsed IN (0, 1)),
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE timeline_tracks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  track_type TEXT NOT NULL CHECK (track_type IN ('video', 'audio', 'subtitles', 'effects')),
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order > 0),
  is_visible INTEGER NOT NULL DEFAULT 1 CHECK (is_visible IN (0, 1)),
  is_locked INTEGER NOT NULL DEFAULT 0 CHECK (is_locked IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  job_type TEXT NOT NULL CHECK (job_type IN ('auto_edit', 'transcribe', 'render', 'export', 'style_analysis')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  input_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(input_json)),
  output_json TEXT CHECK (output_json IS NULL OR json_valid(output_json)),
  error_json TEXT CHECK (error_json IS NULL OR json_valid(error_json)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE timeline_items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('video', 'audio', 'subtitle', 'effect', 'music', 'text', 'sticker', 'transition')),
  source_asset_id TEXT,
  start_ms INTEGER NOT NULL CHECK (start_ms >= 0),
  end_ms INTEGER NOT NULL CHECK (end_ms >= start_ms),
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  source_start_ms INTEGER,
  source_end_ms INTEGER,
  properties_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(properties_json)),
  generated_by_job_id TEXT,
  manual_override INTEGER NOT NULL DEFAULT 0 CHECK (manual_override IN (0, 1)),
  is_muted INTEGER NOT NULL DEFAULT 0 CHECK (is_muted IN (0, 1)),
  is_locked INTEGER NOT NULL DEFAULT 0 CHECK (is_locked IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES timeline_tracks(id) ON DELETE CASCADE,
  FOREIGN KEY (source_asset_id) REFERENCES source_assets(id),
  FOREIGN KEY (generated_by_job_id) REFERENCES jobs(id)
);

CREATE TABLE edit_history (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('add', 'update', 'delete', 'move', 'split', 'auto_generate')),
  before_json TEXT CHECK (before_json IS NULL OR json_valid(before_json)),
  after_json TEXT CHECK (after_json IS NULL OR json_valid(after_json)),
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE edit_steps (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  step_key TEXT NOT NULL CHECK (step_key IN ('arrange_timeline', 'clean_speech', 'subtitles_bilingual', 'apply_style_profile')),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  sort_order INTEGER NOT NULL CHECK (sort_order > 0),
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE (project_id, step_key)
);

CREATE TABLE style_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE style_rules (
  id TEXT PRIMARY KEY,
  style_profile_id TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('pacing', 'subtitle', 'effect', 'audio', 'transition', 'text', 'sticker')),
  rule_text TEXT NOT NULL,
  rule_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(rule_json)),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  confidence REAL,
  source TEXT NOT NULL CHECK (source IN ('inferred', 'manual', 'performance_feedback')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (style_profile_id) REFERENCES style_profiles(id) ON DELETE CASCADE
);

CREATE TABLE style_reference_videos (
  id TEXT PRIMARY KEY,
  style_profile_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  analysis_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(analysis_json)),
  created_at TEXT NOT NULL,
  FOREIGN KEY (style_profile_id) REFERENCES style_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES source_assets(id)
);

CREATE TABLE project_style_profiles (
  project_id TEXT NOT NULL,
  style_profile_id TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (project_id, style_profile_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (style_profile_id) REFERENCES style_profiles(id)
);

CREATE TABLE effect_presets (
  id TEXT PRIMARY KEY,
  preset_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  properties_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(properties_json)),
  sort_order INTEGER NOT NULL CHECK (sort_order > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE audio_presets (
  id TEXT PRIMARY KEY,
  preset_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  properties_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(properties_json)),
  sort_order INTEGER NOT NULL CHECK (sort_order > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE subtitle_segments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  timeline_item_id TEXT,
  language TEXT NOT NULL CHECK (language IN ('zh', 'en')),
  text TEXT NOT NULL,
  start_ms INTEGER NOT NULL CHECK (start_ms >= 0),
  end_ms INTEGER NOT NULL CHECK (end_ms >= start_ms),
  style_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(style_json)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (timeline_item_id) REFERENCES timeline_items(id) ON DELETE SET NULL
);

CREATE TABLE music_assets (
  id TEXT PRIMARY KEY,
  music_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  file_path TEXT,
  duration_ms INTEGER,
  properties_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(properties_json)),
  sort_order INTEGER NOT NULL CHECK (sort_order > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE text_templates (
  id TEXT PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  properties_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(properties_json)),
  sort_order INTEGER NOT NULL CHECK (sort_order > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE sticker_assets (
  id TEXT PRIMARY KEY,
  sticker_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  file_path TEXT,
  properties_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(properties_json)),
  sort_order INTEGER NOT NULL CHECK (sort_order > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE transition_presets (
  id TEXT PRIMARY KEY,
  transition_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  properties_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(properties_json)),
  sort_order INTEGER NOT NULL CHECK (sort_order > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE title_candidates (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  platform_key TEXT CHECK (platform_key IS NULL OR platform_key IN ('xiaohongshu', 'bilibili', 'youtube', 'douyin')),
  title TEXT NOT NULL,
  rationale TEXT,
  is_selected INTEGER NOT NULL DEFAULT 0 CHECK (is_selected IN (0, 1)),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE publish_assets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('cover', 'rendered_video', 'thumbnail')),
  platform_key TEXT CHECK (platform_key IS NULL OR platform_key IN ('xiaohongshu', 'bilibili', 'youtube', 'douyin')),
  file_path TEXT,
  aspect_ratio TEXT NOT NULL CHECK (aspect_ratio IN ('3:4', '16:10', '16:9', '9:16')),
  crop_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(crop_json)),
  cover_text_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(cover_text_json)),
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE platform_accounts (
  id TEXT PRIMARY KEY,
  platform_key TEXT NOT NULL UNIQUE CHECK (platform_key IN ('xiaohongshu', 'bilibili', 'youtube', 'douyin')),
  display_name TEXT NOT NULL,
  auth_status TEXT NOT NULL CHECK (auth_status IN ('disconnected', 'connected', 'expired')),
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json))
);

CREATE TABLE platform_posts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  platform_key TEXT NOT NULL CHECK (platform_key IN ('xiaohongshu', 'bilibili', 'youtube', 'douyin')),
  account_id TEXT,
  title_candidate_id TEXT,
  publish_asset_id TEXT,
  description TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags_json)),
  scheduled_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'needs_confirmation', 'published', 'failed')),
  external_post_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES platform_accounts(id),
  FOREIGN KEY (title_candidate_id) REFERENCES title_candidates(id),
  FOREIGN KEY (publish_asset_id) REFERENCES publish_assets(id)
);

CREATE TABLE exports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  job_id TEXT,
  file_path TEXT,
  format TEXT NOT NULL CHECK (format IN ('mp4', 'mov', 'webm')),
  resolution TEXT,
  status TEXT NOT NULL CHECK (status IN ('queued', 'rendering', 'ready', 'failed', 'mock_rendered')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE TABLE confirmation_events (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('style_rule', 'style_profile', 'auto_edit_steps', 'platform_post', 'reply_draft')),
  target_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('delete', 'recut', 'publish', 'reply')),
  decision TEXT NOT NULL CHECK (decision IN ('confirmed', 'cancelled')),
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
