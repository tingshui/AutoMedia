# AutoMedia M1 Validation

## 1. User Request And Workflow Constraint

User request: complete M1 with the validator agent after reading `workflow_independent_validation_agent.md` word by word.

Workflow constraint from the user: the validation agent must check every time whether the work follows `workflow_independent_validation_agent.md`.

M1 scope from `docs/implementation/mvp_plan.md`: schema, seeds, fixtures. Create database migrations, seed data, reset script, fixture media, and a database verifier that checks tables, primary keys, foreign keys, seed counts, and no PRD MVP table is missing.

## 2. Scope

Included:

- SQLite local data layer for AutoMedia M1.
- Migration files for every MVP table in the PRD table coverage matrix.
- Seed script for deterministic demo data.
- Reset script for test/dev DB.
- Fixture media directory with small sample files.
- DB verifier that checks schema, PKs, FKs, seed data, catalog counts, fixture paths, and reset idempotence.
- npm script wrappers for reset and verify.
- Shared validation evidence following `workflow_independent_validation_agent.md`.

## 3. Non-Goals

- No Home UI reads from DB. That starts in M2.
- No media probing or real video metadata extraction. That starts in M5.
- No AI, transcription, export, platform API, analytics ingestion, or comment ingestion.
- No future-only tables unless explicitly marked `future_no_ui`. M1 default is to leave future-only tables absent.
- No schema for `analytics_metrics`, `comments`, or `reply_drafts` in M1.
- No legacy file-store source of truth under `memory/` or `projects/`.

## 4. Risks

- Schema-only verification can pass while required columns, PKs, or FK edges are missing.
- Seed count checks can pass with weak rows that later UI cannot use.
- `PRAGMA foreign_key_check` can pass even when required FK constraints were never declared.
- Reset can appear successful while stale rows or old files remain.
- Fixture paths can point outside the repo or into legacy project storage.
- JSON columns can contain invalid strings that later readers cannot parse.
- Future-only tables can accidentally enter M1 and blur the MVP boundary.
- Verifier output can become an oracle. Validator must inspect the SQLite DB independently.
- Workflow compliance can drift if expected outcomes are changed after implementation without validator approval.

## 5. Evidence Standard

M1 can pass only when all of these are true:

- The shared file contains a pre-implementation expected matrix with expected values filled before code changes.
- Validator explicitly checks compliance with `workflow_independent_validation_agent.md` on every pass.
- Validation directly inspects SQLite, not only terminal success.
- Validation enumerates `sqlite_master` for tables, views, indexes, and triggers.
- Validation checks exact table names, column names, primary keys, declared foreign-key edges, and `PRAGMA foreign_key_check`.
- Validation checks all seed counts and key seeded field values.
- Validation parses every non-null seeded JSON column.
- Validation runs reset twice and compares a full table-count and seed-id snapshot.
- Validation confirms future-only tables are absent.
- Validation records actual observed values against this matrix field by field.
- `npm run verify:m1` is supporting evidence. It is not the sole oracle.

## 6. Command And Environment Contract

| Command | Runtime | Expected Behavior |
|---|---|---|
| `npm run db:reset` | Node invokes `python3 scripts/reset-db.py` | Recreates the SQLite DB from migrations and seeds deterministic data |
| `npm run verify:m1` | Node invokes `python3 scripts/verify-m1.py` | Runs reset twice, then performs schema, FK, seed, JSON, fixture, reset, and boundary checks |

Environment:

- Default DB path is `data/automedia.sqlite3`.
- `AUTOMEDIA_DB_PATH` may override the DB path for tests.
- Scripts resolve paths from the AutoMedia repo root, not from the caller's current working directory.
- Success signal for reset: stdout contains `AutoMedia DB reset complete`.
- Success signal for verifier: stdout contains `AutoMedia M1 verification passed`.
- `data/` may contain only `automedia.sqlite3` and SQLite sidecar files for that DB name.

## 7. Phase 4 Evaluation Split

N/A for M1. This milestone creates deterministic schema, seed data, fixtures, and verifiers. It does not choose prompts, models, thresholds, classifiers, ranking strategies, or AI configurations.

## 8. Assumptions

- M1 uses SQLite via Python standard library, not a Node dependency.
- Default DB path: `AutoMedia/data/automedia.sqlite3`.
- Migration source path: `AutoMedia/db/migrations/001_initial_schema.sql`.
- Scripts are idempotent and can be rerun.
- Fixture files are intentionally tiny placeholder files. They prove local path and seed plumbing only; they are not valid media streams.
- M1 creates all MVP tables from `docs/implementation/mvp_plan.md` rows M1/MVP and MVP catalog rows.
- M1 does not create future tables: `analytics_metrics`, `comments`, `reply_drafts`.
- SQLite `CHECK` constraints are used for bounded enum-like fields where M1 has a clear allowed set.
- JSON columns are stored as text with `json_valid(...)` checks where non-null JSON is required.

## 9. M1 Schema Contract Before Implementation

### 9.1 Expected Tables And Columns

| Table | Expected Columns |
|---|---|
| `schema_migrations` | `version`, `applied_at` |
| `projects` | `id`, `title`, `status`, `thumbnail_asset_id`, `last_playhead_ms`, `duration_ms`, `created_at`, `updated_at`, `deleted_at` |
| `source_assets` | `id`, `asset_type`, `file_path`, `original_name`, `duration_ms`, `width`, `height`, `checksum`, `metadata_json`, `created_at` |
| `project_assets` | `project_id`, `asset_id`, `role`, `sort_order`, `created_at` |
| `project_layout_preferences` | `project_id`, `video_panel_height`, `timeline_panel_height`, `sidebar_collapsed`, `updated_at` |
| `timeline_tracks` | `id`, `project_id`, `track_type`, `name`, `sort_order`, `is_visible`, `is_locked`, `created_at`, `updated_at` |
| `timeline_items` | `id`, `project_id`, `track_id`, `item_type`, `source_asset_id`, `start_ms`, `end_ms`, `duration_ms`, `source_start_ms`, `source_end_ms`, `properties_json`, `generated_by_job_id`, `manual_override`, `is_muted`, `is_locked`, `created_at`, `updated_at`, `deleted_at` |
| `edit_history` | `id`, `project_id`, `operation_type`, `before_json`, `after_json`, `created_at` |
| `edit_steps` | `id`, `project_id`, `step_key`, `enabled`, `sort_order`, `updated_at` |
| `jobs` | `id`, `project_id`, `job_type`, `status`, `input_json`, `output_json`, `error_json`, `created_at`, `updated_at` |
| `style_profiles` | `id`, `name`, `summary`, `created_at`, `updated_at`, `deleted_at` |
| `style_rules` | `id`, `style_profile_id`, `rule_type`, `rule_text`, `rule_json`, `enabled`, `confidence`, `source`, `created_at`, `updated_at`, `deleted_at` |
| `style_reference_videos` | `id`, `style_profile_id`, `asset_id`, `analysis_json`, `created_at` |
| `project_style_profiles` | `project_id`, `style_profile_id`, `applied_at`, `created_at` |
| `effect_presets` | `id`, `preset_key`, `display_name`, `category`, `properties_json`, `sort_order`, `created_at`, `updated_at`, `deleted_at` |
| `audio_presets` | `id`, `preset_key`, `display_name`, `category`, `properties_json`, `sort_order`, `created_at`, `updated_at`, `deleted_at` |
| `subtitle_segments` | `id`, `project_id`, `timeline_item_id`, `language`, `text`, `start_ms`, `end_ms`, `style_json`, `created_at`, `updated_at`, `deleted_at` |
| `music_assets` | `id`, `music_key`, `display_name`, `category`, `file_path`, `duration_ms`, `properties_json`, `sort_order`, `created_at`, `updated_at`, `deleted_at` |
| `text_templates` | `id`, `template_key`, `display_name`, `category`, `properties_json`, `sort_order`, `created_at`, `updated_at`, `deleted_at` |
| `sticker_assets` | `id`, `sticker_key`, `display_name`, `category`, `file_path`, `properties_json`, `sort_order`, `created_at`, `updated_at`, `deleted_at` |
| `transition_presets` | `id`, `transition_key`, `display_name`, `category`, `properties_json`, `sort_order`, `created_at`, `updated_at`, `deleted_at` |
| `title_candidates` | `id`, `project_id`, `platform_key`, `title`, `rationale`, `is_selected` |
| `publish_assets` | `id`, `project_id`, `asset_type`, `platform_key`, `file_path`, `aspect_ratio`, `crop_json`, `cover_text_json`, `created_at` |
| `platform_accounts` | `id`, `platform_key`, `display_name`, `auth_status`, `metadata_json` |
| `platform_posts` | `id`, `project_id`, `platform_key`, `account_id`, `title_candidate_id`, `publish_asset_id`, `description`, `tags_json`, `scheduled_at`, `status`, `external_post_id`, `created_at`, `updated_at` |
| `exports` | `id`, `project_id`, `job_id`, `file_path`, `format`, `resolution`, `status`, `created_at`, `updated_at` |
| `confirmation_events` | `id`, `project_id`, `target_type`, `target_id`, `action`, `decision`, `created_at` |

### 9.2 Expected Foreign-Key Edges

| Table Column | Expected Target |
|---|---|
| `projects.thumbnail_asset_id` | `source_assets.id` |
| `project_assets.project_id` | `projects.id` |
| `project_assets.asset_id` | `source_assets.id` |
| `project_layout_preferences.project_id` | `projects.id` |
| `timeline_tracks.project_id` | `projects.id` |
| `timeline_items.project_id` | `projects.id` |
| `timeline_items.track_id` | `timeline_tracks.id` |
| `timeline_items.source_asset_id` | `source_assets.id` |
| `timeline_items.generated_by_job_id` | `jobs.id` |
| `edit_history.project_id` | `projects.id` |
| `edit_steps.project_id` | `projects.id` |
| `jobs.project_id` | `projects.id` |
| `style_rules.style_profile_id` | `style_profiles.id` |
| `style_reference_videos.style_profile_id` | `style_profiles.id` |
| `style_reference_videos.asset_id` | `source_assets.id` |
| `project_style_profiles.project_id` | `projects.id` |
| `project_style_profiles.style_profile_id` | `style_profiles.id` |
| `subtitle_segments.project_id` | `projects.id` |
| `subtitle_segments.timeline_item_id` | `timeline_items.id` |
| `title_candidates.project_id` | `projects.id` |
| `publish_assets.project_id` | `projects.id` |
| `platform_posts.project_id` | `projects.id` |
| `platform_posts.account_id` | `platform_accounts.id` |
| `platform_posts.title_candidate_id` | `title_candidates.id` |
| `platform_posts.publish_asset_id` | `publish_assets.id` |
| `exports.project_id` | `projects.id` |
| `exports.job_id` | `jobs.id` |
| `confirmation_events.project_id` | `projects.id` |

### 9.3 Catalog Table Ownership

| Table | Future Reader | M1 Seed Minimum |
|---|---|---:|
| `effect_presets` | Editor Effects tab | 4 |
| `audio_presets` | Editor Audio Effects tab | 3 |
| `music_assets` | Editor Background Music tab | 3 |
| `text_templates` | Editor Text tab | 3 |
| `sticker_assets` | Editor Stickers tab | 3 |
| `transition_presets` | Editor Transitions tab | 3 |

## 10. Main-Agent Plan Before Implementation

1. Add `db/migrations/001_initial_schema.sql` with every MVP table and catalog/support table.
2. Add Python DB scripts:
   - `scripts/reset-db.py`: remove/recreate the SQLite DB, apply migrations, seed deterministic demo data.
   - `scripts/verify-m1.py`: reset twice, check schema, foreign keys, primary keys, counts, fixture paths, and future-table absence.
3. Add fixture media placeholders under `fixtures/media/`.
4. Add npm wrappers:
   - `npm run db:reset`
   - `npm run verify:m1`
5. Document the M1 DB commands and path in `README.md`.
6. Update this shared validation file with plan review, implementation evidence, and final expected vs actual results.

## 11. Proposed Validation Cases

- Schema coverage: enumerate all tables in SQLite and compare to expected M1 MVP table set.
- Future boundary: assert `analytics_metrics`, `comments`, and `reply_drafts` are absent.
- Primary key coverage: every expected table has the expected primary key columns.
- Foreign key coverage: `PRAGMA foreign_key_check` returns zero rows after seed.
- Seed project rows: exactly three projects matching Home demo titles.
- Seed style rows: exactly three active style profiles named `严肃`, `日常`, `幽默`.
- Seed catalog rows: every catalog table has enough rows for the M0 editor/publishing tabs.
- Timeline base rows: every project has four default timeline tracks and four default edit steps.
- Fixture rows: fixture `source_assets.file_path` values point to files that exist under `fixtures/media/`.
- Reset idempotence: running reset twice yields the same table counts and seed identifiers.
- Negative side effects: reset must not write outside `data/automedia.sqlite3`, `fixtures/media/`, or expected DB sidecar files.
- Workflow compliance: validator checks that this file contains the required workflow sections before implementation and final verdict.
- SQLite object enumeration: enumerate tables, views, indexes, and triggers through `sqlite_master`.
- FK declaration enumeration: compare `PRAGMA foreign_key_list` output to the edge matrix above.
- JSON validity: parse every non-null seed value from JSON columns.
- Negative DB checks: orphan FK insert, duplicate composite PK insert, invalid enum insert, stale reset cleanup.

## 12. Expected Outcome Matrix Before Implementation

| Case | Input / Action | Field Or Surface | Expected Before Test | Actual Observed | Verdict |
|---|---|---|---|---|---|
| C1 | Inspect shared file before implementation | Workflow compliance | File contains user request, scope, explicit non-goals, risks, evidence standard, command contract, Phase 4 N/A note, assumptions, schema contract, FK matrix, main plan, validation cases, expected matrix, and pending validator critique | Validator returned `pass_plan` after re-review; file contained required Phase 1/1.5 sections before implementation | PASS |
| C2 | Run `npm run db:reset` | DB path | Creates `data/automedia.sqlite3` | Command exited 0 and printed `AutoMedia DB reset complete`; DB exists at default path | PASS |
| C2 | same | Migration record | `schema_migrations` contains version `001_initial_schema` exactly once | `npm run verify:m1` checked exactly one migration record | PASS |
| C2 | same | Future tables | `analytics_metrics`, `comments`, `reply_drafts` are absent | Direct SQL table enumeration did not include future tables | PASS |
| C3 | Inspect SQLite schema | MVP table set | Exactly all M1 MVP tables exist: `schema_migrations`, `projects`, `source_assets`, `project_assets`, `project_layout_preferences`, `timeline_tracks`, `timeline_items`, `edit_history`, `edit_steps`, `jobs`, `style_profiles`, `style_rules`, `style_reference_videos`, `project_style_profiles`, `effect_presets`, `audio_presets`, `subtitle_segments`, `music_assets`, `text_templates`, `sticker_assets`, `transition_presets`, `title_candidates`, `publish_assets`, `platform_accounts`, `platform_posts`, `exports`, `confirmation_events` | Direct SQL and verifier observed exactly these 27 tables | PASS |
| C3 | same | Column set | Every table has exactly the columns listed in Section 9.1 | `verify-m1.py` compared `PRAGMA table_info` for every table to Section 9.1 contract | PASS |
| C4 | Inspect primary keys | Composite PKs | `project_assets` PK is `(project_id, asset_id, role)` and `project_style_profiles` PK is `(project_id, style_profile_id)` | `verify-m1.py` verified both composite PKs | PASS |
| C4 | same | Single-column PKs | Every other expected data table has `id` as primary key, except `project_layout_preferences` uses `project_id` and `schema_migrations` uses `version` | `verify-m1.py` verified all PK definitions | PASS |
| C5 | Inspect FK declarations | FK edge set | `PRAGMA foreign_key_list` across all tables contains every edge listed in Section 9.2 | `verify-m1.py` compared declared FK set to Section 9.2 and found no missing edges | PASS |
| C5 | Run FK checks | Referential integrity | `PRAGMA foreign_key_check` returns zero rows | Direct SQL and verifier observed zero FK check rows | PASS |
| C6 | Inspect seed projects | Count | `projects` has exactly 3 non-deleted rows | Direct SQL observed `projects 3` | PASS |
| C6 | same | Titles | Project titles are exactly `ADHD 教育实验 vlog 01`, `AI 家庭 workflow 复盘`, `读书笔记短视频` | Direct SQL observed exactly these titles | PASS |
| C6 | same | Status/playhead | All three projects have status `draft`; first project has `last_playhead_ms = 18000` | `verify-m1.py` verified statuses and first playhead | PASS |
| C6 | same | Layout preferences | Each project has one `project_layout_preferences` row with positive panel heights and `sidebar_collapsed = 0` | `verify-m1.py` verified 3 layout rows and field values | PASS |
| C7 | Inspect seed style profiles | Count and names | Exactly 3 non-deleted styles named `严肃`, `日常`, `幽默` | Direct SQL observed 3 styles with these names | PASS |
| C7 | same | Rules | Each seeded style has at least 3 enabled `style_rules` | Direct SQL observed `style_rules 9`; verifier checked at least 3 per style | PASS |
| C7 | same | Rule JSON | Every seeded `style_rules.rule_json` is valid JSON object | `verify-m1.py` parsed all seeded rule JSON | PASS |
| C8 | Inspect source assets and fixtures | Asset count | At least 3 `source_assets` rows exist | Direct SQL observed `source_assets 3` | PASS |
| C8 | same | File paths | Every seeded `source_assets.file_path` exists under `fixtures/media/` | `verify-m1.py` resolved every fixture path under `fixtures/media/` and checked file existence | PASS |
| C8 | same | Metadata JSON | Every seeded `source_assets.metadata_json` is valid JSON object | `verify-m1.py` parsed every metadata JSON object | PASS |
| C8 | same | Project attachment | Every seeded project has at least one `project_assets` row with role `source` | Direct SQL observed `project_assets 3`; verifier checked each project | PASS |
| C8 | same | Attachment order | `project_assets.sort_order` starts at 1 per project and is positive | `verify-m1.py` checked positive sort orders | PASS |
| C9 | Inspect timeline foundation | Tracks | Each project has exactly 4 tracks: video, audio, subtitles, effects | Direct SQL observed `timeline_tracks 12`; verifier checked 4 per project | PASS |
| C9 | same | Track fields | Track names are non-empty; `sort_order` is 1-4; `is_visible = 1`; `is_locked = 0` | `verify-m1.py` checked track names, order, and flags | PASS |
| C9 | same | Edit steps | Each project has exactly 4 edit steps: `arrange_timeline`, `clean_speech`, `subtitles_bilingual`, `apply_style_profile`, all enabled | Direct SQL observed `edit_steps 12`; verifier checked step keys and enabled values | PASS |
| C9 | same | Edit step order | Edit step sort order is 1-4 per project | `verify-m1.py` checked step order per project | PASS |
| C10 | Inspect catalog tables | Effects | `effect_presets` has at least 4 rows | Direct SQL observed `effect_presets 4` | PASS |
| C10 | same | Audio | `audio_presets` has at least 3 rows | Direct SQL observed `audio_presets 3` | PASS |
| C10 | same | Background music | `music_assets` has at least 3 rows | Direct SQL observed `music_assets 3` | PASS |
| C10 | same | Text templates | `text_templates` has at least 3 rows | Direct SQL observed `text_templates 3` | PASS |
| C10 | same | Stickers | `sticker_assets` has at least 3 rows | Direct SQL observed `sticker_assets 3` | PASS |
| C10 | same | Transitions | `transition_presets` has at least 3 rows | Direct SQL observed `transition_presets 3` | PASS |
| C10 | same | Catalog usability fields | Every catalog row has stable key, non-empty display label, category, positive `sort_order`, and valid JSON properties | `verify-m1.py` checked usability fields and JSON properties for all catalog rows | PASS |
| C11 | Inspect publishing seed support | Platform accounts | `platform_accounts` has exactly 4 rows for `xiaohongshu`, `bilibili`, `youtube`, `douyin`, all `disconnected` | Direct SQL observed all four platform keys with `disconnected` | PASS |
| C11 | same | Platform metadata | Every `platform_accounts.metadata_json` is valid JSON object with platform display config | `verify-m1.py` parsed all platform metadata JSON | PASS |
| C12 | Run reset twice | Idempotence | First and second reset produce identical table-count snapshot and stable seed ids | `verify-m1.py` compared count and seed-id snapshots across two resets | PASS |
| C12 | same | Stale cleanup | A stale row inserted before reset is removed by the next reset | `verify-m1.py` inserted `stale_style`, reran reset, and confirmed count 0 | PASS |
| C13 | Run `npm run verify:m1` | Verifier | Exits 0 only after running reset twice, checking schema/PK/FK/counts/fixtures/future-boundary | Command exited 0 with `AutoMedia M1 verification passed.` | PASS |
| C14 | Validator final review | Workflow compliance | Validator records whether all required workflow sections and field-level actuals are present before final PASS | Final validator re-read `workflow_independent_validation_agent.md`, inspected changed artifacts, ran verifier plus direct SQLite checks, and recorded findings in Sections 16-18 | PASS |
| C15 | Enumerate `sqlite_master` | Views/triggers/indexes | Views and triggers are absent; indexes are SQLite autoindexes plus documented custom indexes only | Direct SQL observed `views []`, `triggers []`; verifier found no custom indexes | PASS |
| C16 | Attempt orphan insert into `project_assets` | FK enforcement | Insert with missing `project_id` or missing `asset_id` fails while foreign keys are enabled | `verify-m1.py` confirmed both orphan inserts fail | PASS |
| C17 | Attempt duplicate `project_assets(project_id, asset_id, role)` | Composite uniqueness | Duplicate insert fails with uniqueness constraint | `verify-m1.py` confirmed duplicate insert fails | PASS |
| C18 | Attempt invalid enum/check insert | Bounded fields | Invalid project status, platform key, track type, item type, job status, confirmation decision, or export status is rejected | `verify-m1.py` confirmed all listed invalid inserts fail | PASS |
| C19 | Inspect all JSON columns in seed rows | JSON validity | Every non-null seeded JSON field parses as a JSON object or array according to the schema contract | `verify-m1.py` parsed every non-null seeded JSON value in configured JSON columns | PASS |
| C20 | Inspect fixture paths | Path boundary | Fixture paths resolve under `fixtures/media/`, exist, and contain no `..` traversal | `verify-m1.py` checked all fixture path boundaries | PASS |
| C21 | Inspect future boundary and legacy stores | Boundary | Future tables are absent; reset does not create source-of-truth DB files under `memory/` or `projects/` | Future tables absent; reset only created `data/automedia.sqlite3`; no new files under `memory/` or `projects/` | PASS |
| C22 | Run `npm run db:reset` with `AUTOMEDIA_DB_PATH` override | DB path override | Creates the DB at the override path and does not touch default `data/automedia.sqlite3` during that run | Direct override command created `/private/tmp/automedia_m1_override.sqlite3`; verifier also checks override without touching default DB | PASS |
| C23 | Validator independent DB inspection | Workflow compliance | Validator runs or audits direct SQLite checks independently from main-agent summary and records command evidence | Final validator independently ran direct SQLite table/column/FK/count/JSON/fixture/negative/override/stale-reset checks; results matched expected matrix | PASS |

## 13. Validation-Agent Critique Of Plan And Expected Outcomes

Verdict: `needs_plan_changes`.

Workflow compliance check against `context-infra/rules/skills/workflow_independent_validation_agent.md`: this file is a good starting artifact, but it does not yet satisfy Phase 1 and Phase 1.5 strongly enough to let implementation begin. I independently inspected the repo, this shared validation file, `docs/prd.md`, `docs/implementation/mvp_plan.md`, and the prior implementation-plan validation artifact. I did not inspect any implementation because M1 implementation has not started in the repo; there are no `db/`, `data/`, `fixtures/`, or M1 scripts yet.

Required plan changes before implementation:

1. Add an explicit `Risks` section and an explicit `Evidence Standard` section. The current `Scope` and `Assumptions` sections imply some risks, but the workflow requires risks and evidence standard to be written before implementation. The evidence standard should state that M1 can pass only with direct SQLite inspection, full schema/table enumeration, `PRAGMA foreign_key_check`, reset-twice idempotence evidence, and field-level expected-vs-actual rows in this file. `npm run verify:m1` can support the verdict, but the validator must independently inspect the DB rather than treating the verifier as the oracle.
2. Separate `Non-Goals` from `Scope`. The current `Excluded` list is usable, but the workflow asks for non-goals as a first-class section. This matters because future tables and UI behavior are the main M1 boundary risk.
3. Expand C3 from table-name coverage to table-and-column coverage. The current matrix confirms the expected table names, but Phase 1.5 requires one row per field or persisted column that matters. For M1, that means every PRD field in sections 10.1 through 10.6.1 must have expected presence, nullability/default/check behavior where relevant, and foreign-key target where relevant. At minimum, the matrix must cover all columns for: `projects`, `source_assets`, `project_assets`, `project_layout_preferences`, `timeline_tracks`, `timeline_items`, `edit_history`, `edit_steps`, `jobs`, `style_profiles`, `style_rules`, `style_reference_videos`, `project_style_profiles`, `title_candidates`, `publish_assets`, `platform_accounts`, `platform_posts`, `exports`, and `confirmation_events`, plus catalog tables introduced by the implementation plan.
4. Add field-level FK coverage. `PRAGMA foreign_key_check` returning zero rows proves seeded data is internally consistent, but it does not prove all required FK constraints exist. The expected matrix should enumerate required FK edges, including `projects.thumbnail_asset_id -> source_assets.id`, `project_assets.project_id -> projects.id`, `project_assets.asset_id -> source_assets.id`, `project_layout_preferences.project_id -> projects.id`, `timeline_tracks.project_id -> projects.id`, `timeline_items.project_id -> projects.id`, `timeline_items.track_id -> timeline_tracks.id`, `timeline_items.source_asset_id -> source_assets.id`, `timeline_items.generated_by_job_id -> jobs.id`, `edit_history.project_id -> projects.id`, `edit_steps.project_id -> projects.id`, `jobs.project_id -> projects.id`, `style_rules.style_profile_id -> style_profiles.id`, `style_reference_videos.style_profile_id -> style_profiles.id`, `style_reference_videos.asset_id -> source_assets.id`, `project_style_profiles.project_id -> projects.id`, `project_style_profiles.style_profile_id -> style_profiles.id`, `title_candidates.project_id -> projects.id`, `publish_assets.project_id -> projects.id`, `platform_posts.project_id -> projects.id`, `platform_posts.account_id -> platform_accounts.id`, `platform_posts.title_candidate_id -> title_candidates.id`, `platform_posts.publish_asset_id -> publish_assets.id`, `exports.project_id -> projects.id`, `exports.job_id -> jobs.id`, and `confirmation_events.project_id -> projects.id`.
5. Add field-level seed expectations, not only counts. Current seed cases cover project titles, status, playhead, style names, and some catalog counts. They do not specify required seed values for layout preferences, source asset metadata fields, `project_assets.sort_order`, `edit_steps.sort_order/enabled`, `timeline_tracks.name/sort_order/is_visible/is_locked`, JSON validity for `metadata_json`, `properties_json`, `rule_json`, and platform account display names/auth metadata. Without these, a verifier can pass with structurally weak or user-hostile demo rows.
6. Add catalog table schema expectations. The MVP plan adds `effect_presets`, `audio_presets`, `subtitle_segments`, `music_assets`, `text_templates`, `sticker_assets`, and `transition_presets`, but the PRD does not define all their fields in section 10. The main agent must define the M1 schema contract for these tables before implementation, including `id`, display name/key fields, type/category fields, `properties_json` or equivalent configuration fields, timestamps, soft-delete behavior if any, and which later UI tab reads them.
7. Add negative cases that exercise boundaries and failure modes. Current negative coverage is mostly future-table absence and broad side effects. Add cases for orphan insertion rejection, duplicate migration version rejection or idempotent no-op, invalid enum/check behavior where the schema claims bounded values, fixture path escaping outside `fixtures/media/`, invalid JSON rejection or explicit acceptance policy, reset not leaving stale user-created rows, and no accidental creation of legacy `memory/` or `projects/` storage as DB source of truth.
8. Add database table coverage for views/indexes/triggers, even if the expected answer is none. The workflow asks the validator to account for tables, views, derived stores, caches, and indexes. The plan must require the validator to enumerate `sqlite_master` for tables, views, indexes, and triggers. If M1 intentionally has no views/triggers and only auto indexes plus declared custom indexes, that should be explicit before implementation.
9. Tighten reset side-effect expectations. C12 says stable counts and seed ids; it should also require that reset removes stale rows from all M1 tables, recreates the schema from migrations only, enables `PRAGMA foreign_keys`, and leaves only expected SQLite sidecar files under `data/` if WAL/journal mode creates them.
10. Define command and environment expectations exactly. C2/C13 name `npm run db:reset` and `npm run verify:m1`, but the artifact should specify whether they use `python3` or workspace `venv311`, whether they accept `AUTOMEDIA_DB_PATH`, and what stdout/stderr success signal is expected. This prevents a pass based on an undocumented local path.
11. Add an explicit train/validation/test note. M1 does not choose prompts, models, thresholds, or classifiers, so a full split is not applicable. The shared file should state that Phase 4 is N/A for M1 and why.
12. Add a validator-run checklist before final validation. The validator should commit to independent commands such as `sqlite3 data/automedia.sqlite3 ".tables"`, schema introspection via `PRAGMA table_info`, `PRAGMA foreign_key_list`, `PRAGMA index_list`, `PRAGMA foreign_key_check`, full row counts for every table, and row-level inspection for seeded rows because M1 data should be small.

Additional adversarial/user-natural validation cases to add before implementation:

| Proposed Case | Input / Action | Field Or Surface | Expected Before Test |
|---|---|---|---|
| C15 | After reset, enumerate `sqlite_master` | Views/triggers/indexes | Views and triggers are either absent or explicitly named; custom indexes are documented; no hidden legacy stores are used as source of truth |
| C16 | Attempt insert into `project_assets` with missing `project_id` or `asset_id` | FK enforcement | Insert fails with FK constraint while `PRAGMA foreign_keys` is enabled |
| C17 | Attempt insert duplicate `project_assets(project_id, asset_id, role)` | Composite uniqueness | Insert fails or is explicitly handled as an idempotent no-op by the script |
| C18 | Create a stale row, run reset again | Reset cleanup | Stale row is gone; all expected seed ids/counts return to baseline |
| C19 | Inspect all JSON columns in seed rows | JSON validity | Every non-null JSON field parses as JSON object/array according to its schema contract |
| C20 | Inspect fixture paths | Path boundary | Fixture paths are relative or repo-contained, resolve under `fixtures/media/`, exist, and do not contain `..` path traversal |
| C21 | Check PRD future tables and old storage | Boundary | `analytics_metrics`, `comments`, `reply_drafts` absent; no new DB source-of-truth files appear under legacy `memory/` or `projects/` directories |
| C22 | Inspect enum/check fields | Status/type values | Seed values for status/type/action/decision/platform/track/item fields are in the documented allowed sets; invalid values are rejected if checks are declared, otherwise the missing DB-level check is recorded as a risk |
| C23 | Inspect catalog row usability | Later UI readiness | Each catalog row has a stable key/id, display label, tab/category mapping, and JSON/properties needed by the future tab reader |

Plan can move to `pass_plan` only after the shared file records these revisions in Sections 3 through 6 and replaces Section 8 with an agreed plan. Implementation should not start until this file contains the revised expected matrix with `Expected Before Test` filled for the added field-level schema, FK, seed, reset, negative, and evidence-standard cases.

## 14. Agreed Plan After Revisions

Pending validator re-review.

Main-agent revision after first validator critique:

- Added explicit Non-Goals section.
- Added explicit Risks section.
- Added Evidence Standard section requiring direct SQLite inspection and warning that verifier output is not the sole oracle.
- Added Command And Environment Contract for `npm run db:reset`, `npm run verify:m1`, `python3`, `AUTOMEDIA_DB_PATH`, DB path, and success signals.
- Added Phase 4 N/A note.
- Added M1 Schema Contract with exact table/column expectations.
- Added M1 FK edge matrix.
- Added catalog table schema and ownership expectations.
- Expanded expected matrix with column coverage, FK declaration coverage, layout seed fields, JSON validity, fixture path boundaries, reset stale cleanup, views/indexes/triggers enumeration, orphan/duplicate/invalid-enum negative cases, and validator independent DB inspection.

Validator re-review verdict: `pass_plan`.

Workflow compliance check against `context-infra/rules/skills/workflow_independent_validation_agent.md`: revised file now satisfies Phase 1 and Phase 1.5 strongly enough to start M1 implementation. The artifact contains the original request/scope, explicit non-goals, risks, assumptions, command/environment contract, evidence standard, Phase 4 N/A note, schema contract, FK edge matrix, validation cases, and pre-implementation expected outcomes with `Actual Observed` and `Verdict` still pending. It also records that `npm run verify:m1` is supporting evidence, not the sole oracle, and requires direct SQLite inspection by the validator.

Phase 1 review result:

- Scope and non-goals are explicit enough for M1. UI DB reads, real media probing, AI, export, platform APIs, analytics/comment ingestion, future tables, and legacy file-store source-of-truth behavior are out of scope.
- Risks and evidence standard are now written before implementation.
- Database tables, views, indexes, triggers, future boundaries, legacy stores, reset side effects, JSON validity, FK declarations, FK runtime checks, seed rows, and catalog seed readiness are accounted for.
- Negative cases are included: orphan FK insert, duplicate composite PK, invalid enum/check insert, stale reset cleanup, fixture path traversal, DB path override, and verifier-not-oracle checks.
- Phase 4 train/validation/test discipline is explicitly marked N/A for M1 because this milestone has no prompt/model/threshold/config selection.

Phase 1.5 review result:

- The expected matrix now has concrete expected values for the validator to compare against after implementation.
- Field-level schema coverage is handled through Section 9.1 plus C3 column-set validation.
- Field-level FK coverage is handled through Section 9.2 plus C5 FK declaration validation.
- Seed behavior is no longer count-only; it includes key project/style fields, layout preferences, timeline tracks, edit steps, fixture paths, sort orders, JSON validity, catalog usability fields, platform metadata, and reset idempotence.
- The matrix avoids substring-only or command-success-only acceptance. The verifier command remains one row, but direct DB inspection rows are the actual acceptance contract.

Non-blocking suggestions for the implementation agent:

- If the migration introduces custom indexes, write their exact names and columns into this file before final validation. C15 currently allows documented custom indexes, so documentation must be added before claiming pass.
- Keep SQLite types and nullability aligned with the PRD even though the pre-implementation contract focuses mainly on column presence, PKs, FKs, checks, and seeded behavior.
- If any expected behavior changes during implementation, record the reason here and request validator approval before using the revised expectation.

Implementation may start under this plan. Final completion still requires the implementation summary, exact validation transcript, field-level actuals, open-issue disposition, final verdicts from both agents, and the main-agent `LESSONS.md` section 1 self-check.

## 15. Implementation Summary And Changed Artifacts

Changed artifacts:

- `.gitignore`: ignores generated SQLite files and Python cache files.
- `README.md`: documents M1 local DB commands and verification.
- `package.json`: adds `db:reset` and `verify:m1`.
- `db/migrations/001_initial_schema.sql`: creates the M1 SQLite schema.
- `scripts/reset-db.py`: recreates the DB from migration and deterministic seed data.
- `scripts/verify-m1.py`: runs reset twice and validates schema, PKs, FKs, seed rows, fixture paths, JSON validity, negative constraint cases, reset idempotence, DB path override, and future-table boundary.
- `fixtures/media/*.txt`: three tiny fixture placeholders used by seeded source assets.
- `data/.gitkeep`: keeps the data directory in git while generated DB files remain ignored.

No Home UI DB read, media probing, AI pipeline, export, platform API, analytics ingestion, or comment ingestion was implemented.

## 16. Final Validation Transcript

Main-thread commands:

```bash
python3 -m py_compile scripts/reset-db.py scripts/verify-m1.py
npm run db:reset
npm run verify:m1
AUTOMEDIA_DB_PATH=/tmp/automedia_m1_override.sqlite3 npm run db:reset
```

Observed:

```text
AutoMedia DB reset complete: /Users/qianying/Documents/AI_Workspace/AutoMedia/data/automedia.sqlite3
AutoMedia M1 verification passed.
AutoMedia DB reset complete: /private/tmp/automedia_m1_override.sqlite3
```

Independent SQL cross-check run by the main agent:

```text
db_exists True size 278528
views []
triggers []
fk_check []
projects 3
source_assets 3
project_assets 3
timeline_tracks 12
edit_steps 12
style_profiles 3
style_rules 9
effect_presets 4
audio_presets 3
music_assets 3
text_templates 3
sticker_assets 3
transition_presets 3
platform_accounts 4
project_titles ['ADHD 教育实验 vlog 01', 'AI 家庭 workflow 复盘', '读书笔记短视频']
style_names ['日常', '幽默', '严肃']
platforms [('bilibili', 'disconnected'), ('douyin', 'disconnected'), ('xiaohongshu', 'disconnected'), ('youtube', 'disconnected')]
```

SQLite table enumeration observed exactly the M1 table set from C3 and no future tables.

Final validator workflow compliance check:

- Re-read `context-infra/rules/skills/workflow_independent_validation_agent.md` before verdict.
- Treated `npm run verify:m1` as supporting evidence only, not as the sole oracle.
- Independently inspected changed artifacts: `.gitignore`, `README.md`, `package.json`, `db/migrations/001_initial_schema.sql`, `scripts/reset-db.py`, `scripts/verify-m1.py`, fixture files, and generated SQLite DB state.
- Directly inspected SQLite tables, `sqlite_master` objects, `PRAGMA table_info`, `PRAGMA foreign_key_list`, `PRAGMA foreign_key_check`, seed counts, key seed values, JSON columns, fixture path boundaries, negative constraints, DB path override, and reset stale cleanup.
- Confirmed M1 has no browser/UI DB-read requirement because Home DB integration is explicitly M2.

Final validator commands:

```bash
python3 -m py_compile scripts/reset-db.py scripts/verify-m1.py
npm run db:reset
npm run verify:m1
sqlite3 data/automedia.sqlite3 ".tables"
sqlite3 data/automedia.sqlite3 "SELECT type,name,tbl_name FROM sqlite_master ORDER BY type,name;"
sqlite3 data/automedia.sqlite3 "PRAGMA foreign_key_check;"
```

Additional direct SQLite/Python audit results:

```text
tables_match True, 27 tables
column_mismatches []
future_present []
fk_check_rows []
views []
triggers []
custom_indexes []
counts:
  projects 3
  source_assets 3
  project_assets 3
  project_layout_preferences 3
  timeline_tracks 12
  edit_steps 12
  style_profiles 3
  style_rules 9
  effect_presets 4
  audio_presets 3
  music_assets 3
  text_templates 3
  sticker_assets 3
  transition_presets 3
  platform_accounts 4
json_bad []
fixture_bad []
fk_missing []
fk_extra []
negative_checks all True:
  orphan_project, orphan_asset, duplicate project_assets composite PK,
  bad project status, bad platform key, bad track type, bad item type,
  bad job status, bad confirmation decision, bad export status
override_returncode 0
override_exists True
default_untouched True
validator_stale cleanup: inserted count 1 before reset, count 0 after reset
```

Observed seed values:

```text
projects:
  project_adhd_vlog_01 | ADHD 教育实验 vlog 01 | draft | 18000
  project_ai_family_workflow | AI 家庭 workflow 复盘 | draft | 0
  project_reading_notes | 读书笔记短视频 | draft | 0
styles:
  style_daily | 日常
  style_funny | 幽默
  style_serious | 严肃
platforms:
  bilibili | disconnected
  douyin | disconnected
  xiaohongshu | disconnected
  youtube | disconnected
```

## 17. Open Issues

Final validator issues:

- None blocking.
- No P0/P1/P2 issues found in M1 final validation.

Residual notes:

- There are no custom indexes beyond SQLite autoindexes. This matches C15, so no extra index documentation is required.
- Generated DB files are present locally under `data/` as expected and ignored by `.gitignore`.

## 18. Final Verdict

Main agent preliminary verdict: PASS, pending final validator review and workflow compliance check.

Final validator verdict: PASS.

M1 satisfies the agreed plan and expected matrix. Final validation included workflow compliance review, artifact inspection, direct SQLite checks independent from the verifier, negative constraint checks, reset idempotence/stale cleanup, DB path override, and boundary checks for future tables and legacy stores.
