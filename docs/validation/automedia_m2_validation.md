# AutoMedia M2 Validation

## User Request

Continue AutoMedia implementation according to `workflow_independent_validation_agent.md` and complete M2 with an independent validator.

## Milestone

M2: Home Project Workflow.

Goal: Home reads and writes real project data from the local SQLite database instead of hard-coded demo cards. New Video creates a durable draft project and opens the editor for that exact project.

## Scope

- Home recent video cards read active `projects` rows from `data/automedia.sqlite3`.
- New Video modal style options read active `style_profiles`.
- New Video confirm creates rows in:
  - `source_assets`
  - `projects`
  - `project_assets`
  - `project_layout_preferences`
  - `timeline_tracks`
  - `edit_steps`
  - `project_style_profiles`
- New Video cancel closes the modal and creates no database rows.
- Clicking a recent card opens editor for that exact `project_id`.
- Editor topbar title reflects the selected project title.
- Editor route contract is `#/editor/<project_id>`. Reloading that URL must restore the same project from DB.
- M0 routes and M1 database validation remain passing.

## Non-Goals

- Real file probing and metadata extraction. M2 may create fixture-style asset metadata for the selected filename.
- Style manager editing. Style Manager can remain static until M3.
- Editor timeline persistence, title save, divider persistence, undo/redo. These are M4.
- Real auto-edit job creation. This is M7.
- Publishing persistence. This is M10.
- External platform publish.

## Risks

- UI appears correct while still reading hard-coded cards.
- Confirm New Video writes only `projects` and misses child rows needed by later milestones.
- Cancel path accidentally writes a partial project.
- Editor opens by route but loses the selected project id.
- Reset/verifier scripts and app server disagree on database path.
- Browser validation checks visible strings only and misses DB side effects.

## Assumptions

- M2 uses the local deterministic SQLite DB at `data/automedia.sqlite3`.
- If the DB is missing, local development will run `npm run db:reset`.
- New Video file selection can be represented by a text filename until M5; missing filename is rejected and creates no rows.
- New project title can be derived from filename for M2.
- Active rows are rows with `deleted_at IS NULL` where that column exists.
- Home recent cards exclude `deleted_at IS NOT NULL` and `status='archived'`.
- M2 placeholder asset metadata is exactly `{"fixture":true,"m2_placeholder":true,"codec":"placeholder","fps":30,"bitrate":0}`.
- M2 default layout is exactly `video_panel_height=520`, `timeline_panel_height=260`, `sidebar_collapsed=0`.
- New Video create is transactional: validation or write failure must rollback all M2 tables.

## Main-Agent Plan

1. Add JSON API routes to the local app server using Node `node:sqlite`.
2. Add read endpoints for home bootstrap data:
   - recent projects
   - active style profiles
3. Add create-project endpoint for New Video confirm.
4. Update `src/app.js` so Home renders projects/styles from API and passes `project_id` into Editor through `#/editor/<project_id>`.
5. Update New Video modal wiring so Cancel has no DB side effect and Confirm writes all required M2 rows.
6. Add `npm run verify:m2` with a real-browser workflow plus direct DB assertions.
7. Run `verify:m0`, `verify:m1`, and `verify:m2`.
8. Ask validator for final independent validation and repair any issues.

## Evidence Standard

M2 can be called complete only if:

- A browser workflow observes Home rendering DB project titles, not static titles.
- A direct DB mutation to a seed project title appears on Home after reload.
- New Video cancel leaves the relevant row counts unchanged.
- New Video confirm increments the expected row counts and creates linked rows for the new project.
- Clicking the newly created project opens Editor with that project id and title.
- `verify:m0`, `verify:m1`, and `verify:m2` pass.
- Validator writes final verdict into this file.

## Proposed Validation Cases

| Case | User Path / Command | Layer |
|---|---|---|
| C1 | Rename seed project in DB, reload Home | DB -> UI |
| C2 | Insert a draft project directly through DB/API, reload Home | DB -> UI |
| C3 | Open New Video modal then cancel | UI -> DB no-op |
| C4 | Open New Video modal, choose filename/style, confirm | UI -> DB write |
| C5 | Click created recent card | UI route/project state |
| C6 | Run legacy M0 route checks | Regression |
| C7 | Run M1 DB verifier | Regression |
| C8 | Rename/soft-delete styles and open New Video modal | DB -> UI |
| C9 | Deleted/archived projects are filtered from Home | DB -> UI negative |
| C10 | Reload editor project URL | Route persistence |
| C11 | Invalid or double create attempts | Atomicity/idempotency |
| C12 | Empty/failing bootstrap does not render hard-coded fallback cards | Negative UI |

## Expected Outcome Matrix

| Case | Input / Action | Field Or Surface | Expected Before Test | Actual Observed | Verdict |
|---|---|---|---|---|---|
| C1 | Update `projects.title` for `project_adhd_vlog_01` to `M2 DB Renamed Project` and reload Home | Recent card title | Home shows `M2 DB Renamed Project` | Headless Chrome observed `M2 DB Renamed Project` in Home recent titles. | PASS |
| C1 | Same | Negative check | Home no longer shows `ADHD 教育实验 vlog 01` for that card | Headless Chrome observed stale title absent from recent cards. | PASS |
| C1 | Same | DB side effect | Only the targeted project's title changes | Direct SQLite check found exactly one project row with `M2 DB Renamed Project`. | PASS |
| C2 | Insert active draft `project_m2_direct_insert` with recent `updated_at` | Recent project list | Home includes `M2 Direct Insert Draft` | Headless Chrome observed `M2 Direct Insert Draft` on Home. | PASS |
| C2 | Same | Ordering | Direct insert appears before older seed projects when `updated_at` is newest | Headless Chrome observed direct insert as first recent title. | PASS |
| C3 | Click `制作新视频`, then cancel/close modal | Modal state | Modal closes | Browser verifier observed modal closed after cancel. | PASS |
| C3 | Same | `projects` count | Count unchanged | SQLite count snapshot unchanged after cancel. | PASS |
| C3 | Same | Child table counts | `source_assets`, `project_assets`, `project_style_profiles`, `edit_steps`, `timeline_tracks`, `project_layout_preferences` counts unchanged | SQLite count snapshot unchanged for all listed child tables. | PASS |
| C4 | Confirm New Video with filename `family_test_clip.mp4` and style `style_daily` | `projects` | Count +1; new project title is `family_test_clip`; status is `draft` | Browser verifier observed +1 project with title `family_test_clip` and status `draft`; independent API spot check observed equivalent `validator_clip` project. | PASS |
| C4 | Same | `source_assets` | Count +1; new row has `asset_type='video'`, original name `family_test_clip.mp4`, metadata JSON exactly `{"fixture":true,"m2_placeholder":true,"codec":"placeholder","fps":30,"bitrate":0}` | Browser verifier asserted exact metadata for `family_test_clip.mp4`; independent SQLite spot check observed exact metadata for `validator_clip.mp4`. | PASS |
| C4 | Same | `project_assets` | One source link exists for new project and new asset | SQLite observed exactly one `role='source'` link for created project. | PASS |
| C4 | Same | `project_style_profiles` | New project is linked to `style_daily` | SQLite observed created project linked to `style_daily`. | PASS |
| C4 | Same | `edit_steps` | Exactly 4 enabled default steps exist for new project with keys `arrange_timeline`, `clean_speech`, `subtitles_bilingual`, `apply_style_profile` | SQLite observed exactly four enabled steps in expected order. | PASS |
| C4 | Same | `timeline_tracks` | Exactly 4 tracks exist for new project: `video`, `audio`, `subtitles`, `effects` | SQLite observed exactly four tracks in expected order with visible=1 and locked=0. | PASS |
| C4 | Same | `project_layout_preferences` | One row exists with `video_panel_height=520`, `timeline_panel_height=260`, `sidebar_collapsed=0` | SQLite observed exact layout defaults `520/260/0`. | PASS |
| C4 | Same | UI transition | Editor view opens after confirm | Browser verifier observed editor active after confirm. | PASS |
| C4 | Same | Route | URL is `#/editor/<new_project_id>` | Browser verifier observed hash starting `#/editor/` with created project id. | PASS |
| C5 | Click new project card on Home | Editor title | Topbar title is `family_test_clip` | Browser verifier observed topbar title `family_test_clip`. | PASS |
| C5 | Same | Project state | `window.__automediaState.currentProjectId` equals the created project id | Browser verifier observed `currentProjectId` equal created id. | PASS |
| C5 | Reload editor URL | Project state after reload | Same `currentProjectId` survives reload from `#/editor/<new_project_id>` | Browser verifier reloaded editor URL and observed same `currentProjectId`. | PASS |
| C5 | Same | Editor title after reload | Topbar title remains `family_test_clip`, loaded from DB | Browser verifier observed title remained `family_test_clip` after reload. | PASS |
| C6 | Run `npm run verify:m0` | Regression | Existing M0 user paths still pass | Validator reran sequentially: `AutoMedia M0 browser verification passed.` | PASS |
| C7 | Run `npm run verify:m1` | Regression | Existing M1 schema/seed verifier still passes | Validator reran sequentially: `AutoMedia M1 verification passed.` | PASS |
| C8 | Update `style_profiles.name` for `style_daily` to `M2 Daily Renamed`, open New Video modal | Style picker option | Modal shows `M2 Daily Renamed` as the selectable style label for `style_daily` | Browser verifier observed renamed style in modal option. | PASS |
| C8 | Same | Negative check | Modal does not show stale label `日常` for `style_daily` | Browser verifier observed stale `日常` label absent for `style_daily`. | PASS |
| C8 | Set `style_profiles.deleted_at` for `style_funny`, open New Video modal | Style picker option | `幽默` / `style_funny` is absent from modal options | Browser verifier observed `style_funny` absent; independent `/api/bootstrap` check also excluded it. | PASS |
| C8 | Try create with soft-deleted `style_funny` through API | DB write | Request fails; relevant table counts unchanged | API returned style unavailable error; SQLite counts unchanged and FK check clean. | PASS |
| C9 | Set `projects.deleted_at` for `project_adhd_vlog_01` and make it newest, reload Home | Recent cards | `ADHD 教育实验 vlog 01` is absent even though newest | Browser verifier observed soft-deleted project absent; independent `/api/bootstrap` check also excluded it. | PASS |
| C9 | Insert `project_m2_archived` with `status='archived'`, newest `updated_at`, reload Home | Recent cards | `project_m2_archived` / archived title is absent from recent active cards | Browser verifier observed archived project absent; independent `/api/bootstrap` check excluded archived seed mutation. | PASS |
| C10 | Open `#/editor/project_ai_family_workflow` directly | Editor title | Topbar title is `AI 家庭 workflow 复盘` | Browser verifier observed exact topbar title. | PASS |
| C10 | Same | Project state | `currentProjectId` is `project_ai_family_workflow` | Browser verifier observed exact current project id. | PASS |
| C10 | Reload `#/editor/project_ai_family_workflow` | Reload persistence | Same project id and title remain after reload | Browser verifier observed same id and title after reload. | PASS |
| C11 | Double-click Confirm in New Video modal with `family_test_clip.mp4` and `style_daily` | `projects` and child rows | Exactly one new project is created; every required child table has rows for that one project only | Browser verifier used isolated `double_click_clip.mp4`; SQLite observed exactly one created project and valid bundle. | PASS |
| C11 | Confirm New Video with no filename | UI and DB | Visible validation error; `projects`, `source_assets`, `project_assets`, `project_style_profiles`, `edit_steps`, `timeline_tracks`, `project_layout_preferences` counts unchanged | Browser verifier observed filename validation error; SQLite counts unchanged. Independent API returned HTTP 400 for blank filename. | PASS |
| C11 | API create with missing/invalid/soft-deleted style id | API and DB | HTTP 400-style JSON error; all relevant row counts unchanged; `PRAGMA foreign_key_check` returns zero rows | API returned 400-style JSON errors for invalid/soft-deleted style; SQLite counts unchanged and `PRAGMA foreign_key_check` returned zero rows. | PASS |
| C12 | Use a reset DB then soft-delete/archive all projects, reload Home | Recent cards | Home shows an empty state and zero `.recent-card` project cards | Browser verifier observed zero `.recent-card` project cards and empty state. | PASS |
| C12 | Same | Negative fallback check | Home must not render old hard-coded demo titles `ADHD 教育实验 vlog 01`, `AI 家庭 workflow 复盘`, or `读书笔记短视频` as fallback cards | Browser verifier observed old hard-coded titles absent when no active projects exist. | PASS |

## Validator Plan Review

Initial verdict: needs plan changes before implementation starts.

Re-review verdict after main-agent revision: pass_plan.

The revised plan adopts the first validator option: M2 includes DB-backed New Video style options, and the expected matrix now covers style rename/soft-delete, active project filtering, archived project exclusion, editor route/reload persistence, exact M2 placeholder metadata, exact layout defaults, invalid create rollback, double-submit protection, and no hard-coded fallback cards.

The plan is now concrete enough for Phase 2 implementation to start, with one execution note for the eventual M2 verifier: C4 and C11 both use `family_test_clip.mp4`, so final validation must either reset the DB between cases or use unique filenames/project ids per case. Otherwise case interaction could produce a false duplicate-project failure.

No remaining Phase 1 plan blockers.

## Validator Additional Cases

The initial validator cases were adopted into the final matrix and validated there:

| Initial Case | Adopted As | Final Verdict |
|---|---|---|
| V1 style rename | C8 style picker rename rows | PASS |
| V2 style soft-delete and rejected create | C8 soft-delete and API rollback rows | PASS |
| V3 project soft-delete filter | C9 soft-deleted project row | PASS |
| V4 archived project filter | C9 archived project row | PASS |
| V5 route/reload persistence | C5 and C10 route/reload rows | PASS |
| V6 double-click confirm | C11 double-click row | PASS |
| V7 missing filename | C11 missing filename row | PASS |
| V8 missing/invalid/soft-deleted style id | C8/C11 API rollback rows | PASS |
| V9 empty or failing bootstrap fallback | C12 empty-state and no-fallback rows | PASS |
| V10 atomicity/FK clean | C8/C11 rollback rows and independent FK audit | PASS |

## Main-Agent Revision After Validator Review

The main agent accepts the validator's first option: M2 includes DB-backed New Video style options because M2 project creation must bind a selected style. The plan now explicitly adopts the validator's style read, active project filtering, route/reload, atomicity, idempotency, and no-hardcoded-fallback cases.

Decisions recorded before implementation:

- Recent Home projects are `deleted_at IS NULL AND status != 'archived'`, ordered by `updated_at DESC`.
- New Video style picker reads `style_profiles` where `deleted_at IS NULL`.
- Editor route is `#/editor/<project_id>`.
- Missing filename is a validation error and writes no rows.
- Missing, invalid, or soft-deleted style id is rejected and writes no rows.
- Create project runs in one DB transaction.
- Double-click confirm is guarded by UI pending state and/or endpoint idempotency for the active modal submission.
- The app must render DB empty/error states and must not silently fall back to hard-coded recent project cards.

## Agreed Plan

Validator approved for implementation.

Agreed Phase 1 contract:

- M2 includes DB-backed New Video style options.
- Home recent cards read only `projects.deleted_at IS NULL AND status != 'archived'`, ordered by `updated_at DESC`.
- New Video style picker reads only `style_profiles.deleted_at IS NULL`.
- Editor project route is `#/editor/<project_id>` and must restore the same project after reload.
- New Video creation writes all required M2 rows in one transaction.
- Missing filename, invalid style id, missing style id, or soft-deleted style id writes no rows and leaves `PRAGMA foreign_key_check` clean.
- Double-click confirm must not create duplicate projects or duplicate child rows.
- Empty or failing bootstrap must render a visible empty/error state, not hard-coded recent cards.
- Final M2 validation must run browser-visible UI checks plus direct DB assertions, and must isolate mutating cases by DB reset or unique test ids.

Implementation may start under this plan. Final completion still requires filling `Actual Observed` and `Verdict` field-by-field after implementation.

## Implementation Summary

- Added DB-backed JSON API routes in `scripts/serve.mjs`:
  - `GET /api/bootstrap`
  - `GET /api/projects/:id`
  - `POST /api/projects`
- `POST /api/projects` writes `source_assets`, `projects`, `project_assets`, `project_layout_preferences`, `timeline_tracks`, `edit_steps`, and `project_style_profiles` in one SQLite transaction.
- Updated `src/app.js` from static-only UI state to DB-backed bootstrap state:
  - Home recent cards render from `projects`.
  - Home style chips and New Video style picker render from `style_profiles`.
  - New Video confirm writes the DB bundle and routes to `#/editor/<project_id>`.
  - New Video cancel closes the modal without API calls.
  - Editor title and `window.__automediaState.currentProjectId` follow the selected project.
  - Empty/error Home states render instead of hard-coded fallback cards.
- Updated `index.html` with stable containers and a filename input for the New Video modal.
- Updated `src/styles.css` with empty/error/form field states.
- Updated M0 verifier to accept the M2 editor route contract.
- Added `scripts/verify-m2.mjs` and `npm run verify:m2`.

## Final Validation Transcript

Independent validator evidence:

| Command | Observed Result |
|---|---|
| `npm run verify:m0` | PASS. Output: `> automedia@0.1.0 verify:m0` / `> node scripts/verify-m0.mjs` / `AutoMedia M0 browser verification passed.` |
| `npm run verify:m1` | PASS. Output: `> automedia@0.1.0 verify:m1` / `> python3 scripts/verify-m1.py` / `AutoMedia M1 verification passed.` |
| `npm run verify:m2` | PASS on sequential rerun. Output: `> automedia@0.1.0 verify:m2` / `> node scripts/verify-m2.mjs` / `AutoMedia M2 browser and database verification passed.` |
| `npm run db:reset` after independent spot checks | PASS. Output: `> automedia@0.1.0 db:reset` / `> python3 scripts/reset-db.py` / `AutoMedia DB reset complete: /Users/qianying/Documents/AI_Workspace/AutoMedia/data/automedia.sqlite3` |

Initial validator command issue:

| Command | Observed Result |
|---|---|
| `npm run verify:m2` run concurrently with `npm run verify:m1` | Validator-induced reset race, not counted as implementation failure. Output: `DB reset failed: ... sqlite3.OperationalError: table schema_migrations already exists`. Sequential rerun passed. |

`verify:m2` covers C1-C12 with real headless Chrome plus direct SQLite assertions. Mutating cases are isolated by DB reset or unique filenames/project ids.

Independent API and DB spot audit, separate from `verify:m2`:

| Exact Command | Observed Output | Verdict |
|---|---|---|
| `npm run db:reset` | `AutoMedia DB reset complete: /Users/qianying/Documents/AI_Workspace/AutoMedia/data/automedia.sqlite3` | PASS |
| `sqlite3 data/automedia.sqlite3 "select 'projects', count(*) from projects union all select 'source_assets', count(*) from source_assets union all select 'project_assets', count(*) from project_assets union all select 'project_style_profiles', count(*) from project_style_profiles union all select 'edit_steps', count(*) from edit_steps union all select 'timeline_tracks', count(*) from timeline_tracks union all select 'project_layout_preferences', count(*) from project_layout_preferences;"` | `projects|3`; `source_assets|3`; `project_assets|3`; `project_style_profiles|3`; `edit_steps|12`; `timeline_tracks|12`; `project_layout_preferences|3` | PASS |
| `npm run serve` | `AutoMedia demo running at http://127.0.0.1:4173` | PASS |
| `curl -s http://127.0.0.1:4173/api/bootstrap` | Returned JSON with 3 seed projects (`project_adhd_vlog_01`, `project_ai_family_workflow`, `project_reading_notes`) and 3 active styles (`style_daily`, `style_funny`, `style_serious`). | PASS |
| `node -e "const r=await fetch('http://127.0.0.1:4173/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:'validator_clip.mp4',styleId:'style_daily'})}); const j=await r.json(); console.log(r.status); console.log(JSON.stringify(j));"` | BLOCKED by local sandbox networking: `TypeError: fetch failed`, cause `connect EPERM 127.0.0.1:4173`. Fallback used `curl` for the same HTTP check. | blocked |
| `curl -s -X POST http://127.0.0.1:4173/api/projects -H 'Content-Type: application/json' -d '{"filename":"validator_clip.mp4","styleId":"style_daily"}'` | `{"project":{"id":"project_m2_validator_clip_mqcikv2w_ogsyk2","title":"validator_clip","status":"draft","thumbnailAssetId":"asset_m2_validator_clip_mp4_mqcikv2w_iaxyi6","lastPlayheadMs":0,"durationMs":0,"createdAt":"2026-06-13T15:32:31.448Z","updatedAt":"2026-06-13T15:32:31.448Z"},"asset":{"id":"asset_m2_validator_clip_mp4_mqcikv2w_iaxyi6","originalName":"validator_clip.mp4","metadata":{"fixture":true,"m2_placeholder":true,"codec":"placeholder","fps":30,"bitrate":0}}}` | PASS |
| `sqlite3 data/automedia.sqlite3 "select 'projects', count(*) from projects union all select 'source_assets', count(*) from source_assets union all select 'project_assets', count(*) from project_assets union all select 'project_style_profiles', count(*) from project_style_profiles union all select 'edit_steps', count(*) from edit_steps union all select 'timeline_tracks', count(*) from timeline_tracks union all select 'project_layout_preferences', count(*) from project_layout_preferences;"` after independent create | `projects|4`; `source_assets|4`; `project_assets|4`; `project_style_profiles|4`; `edit_steps|16`; `timeline_tracks|16`; `project_layout_preferences|4` | PASS |
| SQLite row audit for created `validator_clip` bundle | Observed: `validator_clip|draft`; source asset `video|validator_clip.mp4|{"fixture":true,"m2_placeholder":true,"codec":"placeholder","fps":30,"bitrate":0}`; one `source` project asset; style `style_daily`; steps `arrange_timeline`, `clean_speech`, `subtitles_bilingual`, `apply_style_profile`; tracks `video`, `audio`, `subtitles`, `effects`; layout `520|260|0`. | PASS |
| Direct DB filter mutation: `update projects set deleted_at='2026-06-13T16:00:00Z'...`; `update projects set status='archived'...`; `update style_profiles set deleted_at='2026-06-13T16:00:00Z'...` then `curl -s http://127.0.0.1:4173/api/bootstrap` | Bootstrap returned only active projects `project_m2_validator_clip_mqcikv2w_ogsyk2` and `project_reading_notes`, and only active styles `style_daily` and `style_serious`. Soft-deleted project, archived project, and soft-deleted style were excluded. | PASS |
| `curl -s -X POST http://127.0.0.1:4173/api/projects -H 'Content-Type: application/json' -d '{"filename":"should_not_write.mp4","styleId":"style_funny"}'` | `{"error":"选择的剪辑风格不可用。"}`; subsequent SQLite counts stayed `projects|4`, `source_assets|4`, `project_assets|4`, `project_style_profiles|4`, `edit_steps|16`, `timeline_tracks|16`, `project_layout_preferences|4`. | PASS |
| `curl -s -i -X POST http://127.0.0.1:4173/api/projects -H 'Content-Type: application/json' -d '{"filename":"","styleId":"style_daily"}'` | `HTTP/1.1 400 Bad Request` with body `{"error":"请选择或输入素材文件名。"}`; relevant table counts stayed unchanged. | PASS |
| `sqlite3 data/automedia.sqlite3 "...; pragma foreign_key_check;"` after invalid create attempts | No `PRAGMA foreign_key_check` rows were printed. | PASS |
| Cleanup: `npm run db:reset`; `kill 35948 35977`; `curl -s --max-time 2 http://127.0.0.1:4173/api/bootstrap` | DB reset restored seed counts `projects|3`, `source_assets|3`, `project_assets|3`, `project_style_profiles|3`, `edit_steps|12`, `timeline_tracks|12`, `project_layout_preferences|3`; final curl exited with code 7 and no body, confirming validation server was stopped. | PASS |

## Issues And Repairs

- No open M2 acceptance issues found by the independent validator.
- Development-reported repairs were rechecked indirectly by passing `verify:m0` and `verify:m2`.
- Validator-induced reset race from parallel command execution is not an implementation issue; final validation reran reset-based commands sequentially.
- Main-agent post-validation hygiene check found the validator's cleanup note had not fully held in the live desktop environment: port 4173 still had a node listener and DB counts still reflected the validator spot-audit create. Repair: main agent killed the 4173 listener, reran `npm run db:reset`, confirmed no 4173 listener remained, and confirmed seed counts returned to `projects=3`, `source_assets=3`, `project_assets=3`, `project_style_profiles=3`, `edit_steps=12`, `timeline_tracks=12`, `project_layout_preferences=3`. This was environment cleanup only; it did not change the M2 acceptance verdict.

## Final Verdict

pass_final
