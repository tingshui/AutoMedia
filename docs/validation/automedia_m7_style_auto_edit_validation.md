# AutoMedia M7 Style Auto-Edit Planner Validation

## User Request

Build the next step after `剪映导入-3月6日 v3` appears in Style Manager: connect `style_rules` to an auto-edit dry-run planner so selected styles can produce an inspectable edit plan C from the current project.

Use `context-infra/rules/skills/workflow_independent_validation_agent.md`.

## Scope

- Add an Auto Edit dry-run endpoint for a project.
- Read the project's selected `style_profiles` and active `style_rules`.
- Generate deterministic candidate edit actions from project media duration, enabled edit steps, and enabled style rules.
- Persist the run in `jobs` with `job_type='auto_edit'`, `status='succeeded'`, `input_json`, and `output_json`.
- Insert visible generated `timeline_items` with `generated_by_job_id` for preview-level actions.
- Show a user-visible completion/blocked message when clicking `开始自动剪辑`.
- Add a verifier that exercises the user path and directly audits DB rows.

## Non-Goals

- No rendered video output.
- No FFmpeg export.
- No speech transcription or true silence removal.
- No platform publishing.
- No automatic enabling of `needs_review` v3 rules. The user must review/enable rules before the planner uses them.
- No claim that generated C visually matches B as rendered video. This is plan-level only.

## Risks

- Silent wrong-layer pass: API job exists but UI timeline does not show generated items.
- Style leakage: disabled or deleted rules accidentally drive the plan.
- Overclaiming: deterministic dry-run is mistaken for real AI video editing.
- Existing verification scripts reset the shared demo DB, so final demo state must be rechecked after validation.

## Main-Agent Plan

1. Add `runAutoEditDryRun(projectId)` to `scripts/serve.mjs`.
2. Add `POST /api/projects/:projectId/auto-edit-dry-run`.
3. Planner inputs:
   - active project
   - enabled `edit_steps`
   - active project style
   - enabled, non-deleted `style_rules`
   - project source assets and duration fallback
4. Planner behavior:
   - if no project style: return 400 without DB writes
   - if no enabled style rules: return 409 without DB writes, message asks user to review/enable style rules
   - if valid: create one `jobs` row, soft-delete older non-manual generated items from previous auto-edit jobs for the same project, insert deterministic preview timeline items
5. Frontend `开始自动剪辑` calls the endpoint, reloads current project, and shows a toast with generated action count.
6. Add `scripts/verify-m7-style-auto-edit.mjs` and `npm run verify:m7-style`.

## Assumptions

- M7 v1 is a deterministic local planner, not an LLM planner.
- `style_rules.enabled=1` means the user approved use of that rule.
- `style_rules.enabled=0` and `deleted_at IS NOT NULL` must not be used.
- Generated timeline items use `manual_override=0`, `generated_by_job_id=<job id>`, and properties that cite the source `style_rule_id`.
- Existing manual timeline items must not be deleted.
- Planner style selection is deterministic: use the latest non-deleted `project_style_profiles.created_at` row whose `style_profiles.deleted_at IS NULL`. The verifier will remove stale style links for `project_adhd_vlog_01` and insert only `style_jianying_3yue6_v3` before positive cases.
- Fixed validation project: `project_adhd_vlog_01`, source asset `asset_adhd_vlog_source`, duration `72000ms`.
- Fixed validation style: `style_jianying_3yue6_v3`.
- Fixed validation rules:
  - `rule_style_jianying_3yue6_v3_01` = pacing
  - `rule_style_jianying_3yue6_v3_02` = effect
  - `rule_style_jianying_3yue6_v3_03` = audio
- Fixed C2 enabled steps: `arrange_timeline`, `clean_speech`, `subtitles_bilingual`, `apply_style_profile`.
- Fixed C3 enabled steps after mutation: `arrange_timeline`, `subtitles_bilingual`, `apply_style_profile`. `clean_speech` is disabled.
- Deterministic item formula:
  - `arrange_timeline` creates one video item labelled `AutoEdit: 原视频顺序铺入 timeline`.
  - `clean_speech` creates one text/effects-track marker labelled `AutoEdit: 清理气口/停顿 dry-run`.
  - `subtitles_bilingual` creates one subtitle item labelled `AutoEdit: 句级字幕 dry-run`.
  - each enabled style rule creates one style preview item labelled `AutoEdit: <rule_type> <rule_id_suffix>`.
  - C2 expected active generated count: `6` = 3 step items + 3 rule items.
  - C3 expected active generated count: `4` = 2 step items + 2 rule items.

## Expected Outcome Matrix

| Case | Input / Action | Field Or Surface | Expected Before Test | Actual Observed | Verdict |
|---|---|---|---|---|---|
| C0 | Reset DB, call `/api/bootstrap`, prepare v3 style rows | `style_profiles` | `style_jianying_3yue6_v3` exists and is active | pending | pending |
| C0 | same | `style_rules` | exactly 7 active v3 rules exist, all disabled before the test setup mutation | pending | pending |
| C0 | same | `project_style_profiles` | verifier deletes stale `project_adhd_vlog_01` style links and inserts only `style_jianying_3yue6_v3` | pending | pending |
| C0 | same | manual item setup | verifier creates one manual text timeline item with `manual_override=1`, `generated_by_job_id IS NULL`, label `Manual note before auto edit` | pending | pending |
| C1 | Open editor for `project_adhd_vlog_01` and click `开始自动剪辑` with all v3 rules disabled | API status/payload | endpoint returns HTTP `409` with `{error:"当前风格没有已启用的规则，请先在风格管理里勾选规则。"}` | pending | pending |
| C1 | same | UI toast | toast text is `当前风格没有已启用的规则，请先在风格管理里勾选规则。` | pending | pending |
| C1 | same | `jobs` | no new `auto_edit` job row is written for `project_adhd_vlog_01` | pending | pending |
| C1 | same | `timeline_items` | no new row with `generated_by_job_id IS NOT NULL` is written | pending | pending |
| C2 | Enable exactly rules `_01`, `_02`, `_03`, keep all 4 edit steps enabled, click `开始自动剪辑` | UI toast | toast text is `自动剪辑 dry-run 完成：生成 6 个 timeline 预览项。` | pending | pending |
| C2 | same | API status/payload | endpoint returns HTTP `201`; payload has `job.id`, `generatedCount=6`, `project.items` containing 6 active generated rows plus the manual row | pending | pending |
| C2 | same | `jobs` | exactly one new C2 row for `project_adhd_vlog_01` with `job_type='auto_edit'`, `status='succeeded'` | pending | pending |
| C2 | same | `jobs.input_json` | exact keys include `project_id`, `style_id`, `style_name`, `enabled_step_keys`, `enabled_rule_ids`, `source_duration_ms`; `style_id='style_jianying_3yue6_v3'`; `enabled_rule_ids` exactly [`rule_style_jianying_3yue6_v3_01`,`rule_style_jianying_3yue6_v3_02`,`rule_style_jianying_3yue6_v3_03`] | pending | pending |
| C2 | same | `jobs.output_json` | exact keys include `claim_layer`, `actions`, `timeline_item_ids`, `warnings`; `claim_layer='plan_level_only'`; `actions.length=6`; `timeline_item_ids.length=6`; no key/value claims rendered video output | pending | pending |
| C2 | same | `timeline_items` count | exactly 6 active generated rows with `generated_by_job_id=<C2 job id>` and `manual_override=0` | pending | pending |
| C2 | same | `timeline_items` stable fields | expected labels: `AutoEdit: 原视频顺序铺入 timeline`, `AutoEdit: 清理气口/停顿 dry-run`, `AutoEdit: 句级字幕 dry-run`, `AutoEdit: pacing 01`, `AutoEdit: effect 02`, `AutoEdit: audio 03`; ranges are valid within `0..72000`; rule-generated rows cite only `_01`, `_02`, `_03` | pending | pending |
| C2 | same | UI timeline | visible timeline contains all six expected labels and one manual label after click | pending | pending |
| C2 | reload same editor route | stale-state behavior | all six generated labels and the manual label remain visible after reload/re-entry | pending | pending |
| C3 | Disable rule `_03`, disable `clean_speech`, rerun click | UI toast | toast text is `自动剪辑 dry-run 完成：生成 4 个 timeline 预览项。` | pending | pending |
| C3 | same | `jobs.input_json` | newest job references enabled rules exactly [`rule_style_jianying_3yue6_v3_01`,`rule_style_jianying_3yue6_v3_02`] and enabled steps exactly [`arrange_timeline`,`subtitles_bilingual`,`apply_style_profile`] | pending | pending |
| C3 | same | active generated rows | exactly 4 active generated rows all cite the C3 job id; none cites disabled rule `_03`; none has label `AutoEdit: 清理气口/停顿 dry-run` | pending | pending |
| C3 | same | replacement behavior | all 6 C2 generated rows have `deleted_at IS NOT NULL`; the manual item remains active with `manual_override=1` and `generated_by_job_id IS NULL` | pending | pending |
| C3 | reload same editor route | stale-state behavior | only the 4 C3 generated labels plus the manual label are visible; C2-only labels are absent | pending | pending |
| C4 | Delete project style link for `project_reading_notes`, call its API endpoint | API status/payload | returns HTTP `400` with `{error:"当前项目没有选择可用风格。"}` | pending | pending |
| C4 | same | DB writes | no new `auto_edit` job or generated timeline item is written for `project_reading_notes` | pending | pending |
| C5 | Soft-delete enabled rule `_02`, keep `_01` enabled, run API | rule filtering | new job uses only `_01`; `_02` is absent from `input_json`, `output_json`, timeline properties, and visible labels | pending | pending |
| C6 | Try API with missing project id `missing_project` | API and DB | returns HTTP `404` with `{error:"Project not found"}`; no job/timeline row is written | pending | pending |
| C7 | Rerun verifier from reset state through C5 | idempotency | final active generated count is 3 after C5, superseded generated count is 10, and no duplicate active generated rows from earlier verifier runs remain | pending | pending |
| C8 | Foreign key and JSON audit after all cases | SQLite | `PRAGMA foreign_key_check` has zero rows; every generated `properties_json`, `input_json`, and `output_json` is valid JSON | pending | pending |

## Performance Report Matrix Contract

This M7 validation has a deterministic fixture population. The final report must include item-by-item comparison for:

| Entity / Table | Expected Count | Actual Count | Matched Items | Failed Items | Accuracy | Verdict |
|---|---:|---:|---:|---:|---:|---|
| `jobs` auto-edit rows for positive cases C2/C3/C5 | 3 | pending | pending | pending | pending | pending |
| active generated `timeline_items` after final run C5 | 3 | pending | pending | pending | pending | pending |
| soft-deleted generated `timeline_items` from superseded C2/C3 jobs | 10 | pending | pending | pending | pending | pending |
| preserved manual `timeline_items` | 1 | pending | pending | pending | pending | pending |

Expected final active generated rows after C5:

| # | Stable Expected Row Contract | Actual | Match |
|---:|---|---|---|
| 1 | `item_type='video'`, track `video`, label `AutoEdit: 原视频顺序铺入 timeline`, `generated_by_job_id=<C5 job id>`, `manual_override=0`, `deleted_at IS NULL`, `start_ms=0`, `end_ms=72000` | pending | pending |
| 2 | `item_type='subtitle'`, track `subtitles`, label `AutoEdit: 句级字幕 dry-run`, `generated_by_job_id=<C5 job id>`, `manual_override=0`, `deleted_at IS NULL`, `start_ms=0`, `end_ms=72000` | pending | pending |
| 3 | `item_type='effect'`, track `effects`, label `AutoEdit: pacing 01`, `properties_json.style_rule_id='rule_style_jianying_3yue6_v3_01'`, `generated_by_job_id=<C5 job id>`, `manual_override=0`, `deleted_at IS NULL` | pending | pending |

Forbidden values in final generated rows and job JSON:

- `rule_style_jianying_3yue6_v3_02` after C5 soft delete.
- `rule_style_jianying_3yue6_v3_03` after C3/C5 disable.
- raw B event ids or exact reference-answer timestamp provenance.
- `rendered_video`, `exported`, `published`, or any claim beyond `plan_level_only`.

Row-level comparison must include every expected job and generated timeline item. Required pass threshold is `100.00%`.

## Validator Plan Review

Review timestamp: 2026-06-15. Phase 1 verdict: revision required before implementation. The plan is directionally correct, but the current expected outcome matrix is too loose to prevent a wrong-layer pass. Implementation should not begin until the main agent rewrites the matrix and records an agreed plan below.

### Blocking Gaps

1. The matrix does not pin the exact fixture state. It says "seed project" and "exactly 3 v3 rules" without naming the project id, selected style assignment path, or rule ids. The implementation and validator need a deterministic contract, for example `project_adhd_vlog_01`, style `style_jianying_3yue6_v3`, and explicit enabled ids such as `rule_style_jianying_3yue6_v3_01`, `_02`, `_03`. If different rules are chosen, list the exact ids before implementation.

2. The plan says "assign v3 to seed project" but does not define how that assignment is created or verified. Existing schema uses `project_style_profiles` with a many-to-many relationship and no active-style flag. The main agent must specify whether the planner uses the most recent style, all project styles, or a specific selected style. Validation must check that stale existing fixture styles, such as `style_funny`, cannot accidentally drive C2/C3.

3. UI validation is underspecified. `UI timeline contains generated style-rule based preview items` is a weak substring check. The matrix must require field-level visible checks after clicking `开始自动剪辑`: button route, toast text, action count, timeline clip labels, generated clip count, track placement, and stale-state behavior after reload or route re-entry. If generated items are only visible through labels from `properties.text`, `catalog_display_name`, or `catalog_id`, the expected labels must be listed exactly.

4. API response contract is missing. The matrix should specify status codes and response JSON for every branch: success, no style, no enabled rules, missing project, and deleted/disabled style rules. C1 currently checks only toast and DB absence; it must also assert HTTP `409` payload shape and user-facing message. C4 must assert `404` payload shape, not only "returns 404".

5. DB persistence expectations are incomplete. For `jobs.input_json`, `jobs.output_json`, and `timeline_items.properties_json`, the expected keys and forbidden keys must be listed. Required fields should include project id, style id, style name or version marker, enabled step keys, used rule ids, source duration, claim layer, actions, generated timeline ids, warnings, and per-action provenance. Forbidden fields should include disabled rule ids, deleted rule ids, raw reference-video exact timestamps, and any claim of rendered video output.

6. Replacement behavior needs row-level criteria. "Old generated items soft-deleted; manual items remain active" must define setup and expected counts. The verifier should create or identify at least one manual timeline item before C2/C3, record its id, then prove it remains `deleted_at IS NULL`, `manual_override=1`, and `generated_by_job_id IS NULL` after reruns. Old auto-generated rows from C2 should be asserted `deleted_at IS NOT NULL`; active generated rows after C3 should all cite the C3 job id.

7. Negative cases are not enough. Add at least these cases before implementation:
   - project with no selected style returns `400` and writes no job/timeline rows;
   - style exists but all v3 rules disabled returns `409` and writes no job/timeline rows;
   - one enabled rule is soft-deleted before run and is excluded;
   - disabled `edit_steps` are excluded from `jobs.input_json` and do not generate related actions;
   - non-existent project route and API route produce no writes;
   - running the verifier twice from reset state produces deterministic counts and no duplicate active generated rows.

8. The performance report contract has pending counts, so it is not yet a contract. The main agent must fill expected counts before implementation. If the action count is derived from enabled rule count, define the formula. If the exact generated timeline ids are intentionally dynamic, the row-level comparison must compare stable fields: item type, track type, start/end/duration, style_rule_id, action type, generated_by_job_id relation, manual_override, deleted_at state, and visible label.

9. The verifier standard should include real browser workflow plus independent DB audit. Existing verify scripts use headless Chrome/CDP and direct SQLite checks, which is acceptable here. The new verifier must not pass on API calls alone. It should reset DB, start the real local server, navigate through Home/Editor/Style Manager as needed, click the actual UI controls, and then audit SQLite directly.

10. The plan does not say how final demo state is preserved after reset-based verification. Because the verifier is expected to reset the shared demo DB, the main agent must either explicitly state that the final demo DB is reset-only evidence, or rerun a non-reset setup after verification and record final state. The validation file already names this risk but the expected matrix does not test it.

### Required Revisions Before Implementation

- Rewrite `Expected Outcome Matrix` with exact project id, style id, selected rule ids, enabled edit steps, expected status codes, expected UI labels, expected JSON keys, expected generated item count, and forbidden values.
- Add no-style, disabled/deleted-rule, disabled-edit-step, rerun/idempotency, and manual-item preservation cases.
- Fill `Performance Report Matrix Contract` expected counts and define row-level comparison fields before any code is written.
- Add an explicit `Agreed Plan After Review` section saying whether the validator's blocking gaps were addressed. Until then, this validator does not approve implementation.

### Second Plan Review

Review timestamp: 2026-06-15. Phase 1 second-review verdict: approved for implementation.

The revised plan addresses the prior blocking gaps sufficiently:

- Fixture state is deterministic: project, source asset, style id, rule ids, C2/C3 enabled steps, and expected generated counts are pinned before implementation.
- Style selection ambiguity is resolved by defining latest active `project_style_profiles.created_at`, with the verifier forcing the positive fixture to only `style_jianying_3yue6_v3` to catch stale-style contamination.
- UI validation is now concrete enough to prevent substring-only smoke passes: exact toast strings, exact timeline labels, generated counts, manual label preservation, reload/re-entry visibility, and absence of superseded labels are all specified.
- API and DB contracts now include exact status codes, payload error strings, required JSON keys, rule filtering, forbidden values, generated row counts, and foreign-key/JSON audits.
- Negative and persistence cases now cover no style, no enabled rules, soft-deleted rules, disabled edit steps, missing project, idempotency, replacement behavior, and manual item preservation.
- The performance report matrix now has expected counts and final row-level contracts for jobs, active generated rows, superseded generated rows, and preserved manual rows.

Non-blocking implementation notes for the main agent:

- The verifier should record the C2, C3, and C5 job ids explicitly in the final transcript so `<C2 job id>`, `<C3 job id>`, and `<C5 job id>` placeholders can be audited field by field.
- C5 is API-level in the matrix; C2/C3 still need the real browser click path through `开始自动剪辑` so the user-facing path remains covered.
- If implementation changes the deterministic item formula, expected counts and row contracts must be revised here and re-approved before using the changed expectations.

## Agreed Plan After Review

Main-agent revisions after validator review:

- Exact fixture state is now pinned to `project_adhd_vlog_01`, `asset_adhd_vlog_source`, `style_jianying_3yue6_v3`, and rule ids `_01`, `_02`, `_03`.
- Planner style selection is defined as latest active project style by `project_style_profiles.created_at`; the verifier will force the positive fixture to only v3 to prevent stale `style_funny` contamination.
- UI validation now requires exact toast strings, exact timeline labels, route reload/re-entry visibility, and absence of superseded labels.
- API and DB validation now requires exact status codes, payload errors, JSON keys, rule id filtering, generated item counts, and forbidden values.
- Negative cases now include no selected style, no enabled style rules, soft-deleted enabled rule filtering, disabled edit step filtering, missing project, idempotency, and manual item preservation.
- Performance report expected counts and final row-level contracts are fixed before implementation.

Pending validator approval of this revised plan.

Implementation-phase correction: first validation run found the original expected `claim_layer='plan_level_only_not_rendered_video'` contradicted the forbidden value `rendered_video`. The contract is revised to `claim_layer='plan_level_only'` so the field stays precise without containing a forbidden rendered-video claim.

Validator contract-correction review: approved on 2026-06-15. This is a valid contract correction, not a scope change. `claim_layer='plan_level_only'` preserves the plan-level-only assertion while allowing the forbidden-values check to continue rejecting `rendered_video`, `exported`, `published`, and any stronger output claim in job/item JSON.

Validator second-review approval: approved for implementation on 2026-06-15, subject to the matrix above remaining unchanged or being re-reviewed before implementation continues.

## Implementation Summary

- `scripts/serve.mjs`
  - Added `POST /api/projects/:projectId/auto-edit-dry-run`.
  - Added deterministic style-rule planner that reads latest active project style, enabled edit steps, enabled active style rules, source asset duration, and writes `jobs` plus generated timeline preview items.
  - Generated items set `manual_override=0`, `generated_by_job_id=<job id>`, `properties_json.text/label`, `style_rule_id`, `action_kind`, and `claim_layer='plan_level_only'`.
  - Older non-manual generated items from prior `auto_edit` jobs are soft-deleted before each new dry-run.
- `src/app.js`
  - `开始自动剪辑` now calls the dry-run API, reloads the project state, re-renders the timeline, and shows exact success/error toast text.
- `scripts/verify-m7-style-auto-edit.mjs`
  - Added real browser/CDP plus SQLite verifier for the matrix above.
  - Verifier prints C2/C3/C5 job ids and performance counts.
- `package.json`
  - Added `npm run verify:m7-style`.

## Final Validation Transcript

Main-agent validation commands:

| Command | Result |
|---|---|
| `node --check scripts/serve.mjs` | PASS |
| `node --check src/app.js` | PASS |
| `node --check scripts/verify-m7-style-auto-edit.mjs` | PASS |
| `npm run verify:m7-style` | PASS |
| `npm run verify:m0` | PASS |
| `npm run verify:m2` | PASS |
| `npm run verify:m3m6` | PASS |

M7 verifier job ids:

| Case | Job ID |
|---|---|
| C2 | `job_auto_edit_project_adhd_vlog_01_mqeo7met_cagpd0` |
| C3 | `job_auto_edit_project_adhd_vlog_01_mqeo7mzb_vm22wq` |
| C5 | `job_auto_edit_project_adhd_vlog_01_mqeo7nl3_55t447` |

Observed outcome matrix summary:

| Case | Observed |
|---|---|
| C0 | Reset DB plus `/api/bootstrap` created active `style_jianying_3yue6_v3`; 7 active v3 rules existed; verifier forced `project_adhd_vlog_01` to only v3 and inserted manual item `item_m7_manual_note`. |
| C1 | Browser clicked `#runAutoEdit`; UI toast was `当前风格没有已启用的规则，请先在风格管理里勾选规则。`; direct API returned HTTP `409` with same error; no auto-edit job or generated item was written. |
| C2 | Browser clicked `#runAutoEdit`; UI toast was `自动剪辑 dry-run 完成：生成 6 个 timeline 预览项。`; C2 job succeeded with rules `_01/_02/_03`; 6 active generated items plus manual item were visible before and after editor reload. |
| C3 | Browser clicked `#runAutoEdit` after disabling rule `_03` and step `clean_speech`; UI toast was `自动剪辑 dry-run 完成：生成 4 个 timeline 预览项。`; C3 job used rules `_01/_02`; C2 generated rows were soft-deleted; manual item remained active. |
| C4 | API call for project with no style returned HTTP `400` and wrote no job/generated item. |
| C5 | API call after soft-deleting rule `_02` generated 3 active items; final job used only rule `_01`; rule `_02` and `_03` were absent from final generated state. |
| C6 | API call for `missing_project` returned HTTP `404` with `{error:"Project not found"}` and wrote no rows. |
| C7 | Final active generated count was 3; superseded generated rows count was 10; positive auto-edit jobs count was 3; manual item remained active. |
| C8 | `PRAGMA foreign_key_check` returned zero rows; generated/job JSON parsed successfully. |

Performance report:

| Entity / Table | Expected Count | Actual Count | Matched Items | Failed Items | Accuracy | Verdict |
|---|---:|---:|---:|---:|---:|---|
| `jobs` auto-edit rows for positive cases C2/C3/C5 | 3 | 3 | 3 | 0 | 100.00% | PASS |
| active generated `timeline_items` after final run C5 | 3 | 3 | 3 | 0 | 100.00% | PASS |
| soft-deleted generated `timeline_items` from superseded C2/C3 jobs | 10 | 10 | 10 | 0 | 100.00% | PASS |
| preserved manual `timeline_items` | 1 | 1 | 1 | 0 | 100.00% | PASS |

Final active generated row-level comparison after C5:

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `item_type='video'`, track `video`, label `AutoEdit: 原视频顺序铺入 timeline`, `generated_by_job_id=<C5 job id>`, `manual_override=0`, `deleted_at IS NULL`, `start_ms=0`, `end_ms=72000` | matched by verifier under C5 job `job_auto_edit_project_adhd_vlog_01_mqeo7nl3_55t447` | PASS |
| 2 | `item_type='subtitle'`, track `subtitles`, label `AutoEdit: 句级字幕 dry-run`, `generated_by_job_id=<C5 job id>`, `manual_override=0`, `deleted_at IS NULL`, `start_ms=0`, `end_ms=72000` | matched by verifier under C5 job `job_auto_edit_project_adhd_vlog_01_mqeo7nl3_55t447` | PASS |
| 3 | `item_type='effect'`, track `effects`, label `AutoEdit: pacing 01`, `properties_json.style_rule_id='rule_style_jianying_3yue6_v3_01'`, `generated_by_job_id=<C5 job id>`, `manual_override=0`, `deleted_at IS NULL` | matched by verifier under C5 job `job_auto_edit_project_adhd_vlog_01_mqeo7nl3_55t447` | PASS |

## Final Verdict

Main-agent verdict: PASS at the declared `plan_level_only` layer. Pending final validator review.

### Validator Final Review

Review timestamp: 2026-06-15. Final validator verdict: PASS at the declared `plan_level_only` layer, with one non-blocking documentation caveat below.

Independent evidence checked:

- Reviewed implementation changes in `scripts/serve.mjs`, `src/app.js`, `package.json`, and `scripts/verify-m7-style-auto-edit.mjs`.
- Ran syntax checks:
  - `node --check scripts/serve.mjs` PASS
  - `node --check src/app.js` PASS
  - `node --check scripts/verify-m7-style-auto-edit.mjs` PASS
- Ran browser/CDP validation:
  - `npm run verify:m7-style` PASS
  - reran `npm run verify:m7-style` after reset to cover repeatability/idempotency intent: PASS
- Ran regression checks:
  - `npm run verify:m0` PASS
  - `npm run verify:m2` PASS after rerun. First attempt failed only because I ran it in parallel with m0 and both tried to bind `127.0.0.1:4173`.
  - `npm run verify:m3m6` PASS
  - reran `npm run verify:m7-style` after m3m6 because m3m6 resets the demo DB: PASS
- Performed independent SQLite cross-check after M7:
  - `jobs` auto-edit rows for `project_adhd_vlog_01`: 3
  - final active generated rows: 3
  - superseded soft-deleted generated rows: 10
  - manual item `item_m7_manual_note`: active, `manual_override=1`, `generated_by_job_id IS NULL`
  - final C5 job `claim_layer='plan_level_only'`
  - final C5 job/items had no forbidden hits for `rendered_video`, `exported`, `published`, `_02`, or `_03`
  - `PRAGMA foreign_key_check`: 0 rows

Code/artifact assessment:

- The endpoint uses the latest active project style, filters enabled and non-deleted style rules, reads enabled edit steps, and writes `jobs` plus generated `timeline_items` with `manual_override=0` and `generated_by_job_id`.
- The UI button now exercises the real user path by calling `/api/projects/:projectId/auto-edit-dry-run`, re-rendering project state, and displaying the required toast.
- Replacement behavior is implemented by soft-deleting active non-manual items generated by prior `auto_edit` jobs for the same project. Manual timeline items are preserved.
- The verifier exercises C1/C2/C3 through headless Chrome/CDP UI clicks and covers C4/C5/C6 through API plus direct DB audit. This satisfies the agreed browser/API/DB validation split.

Documentation caveat resolution:

- Main agent updated the C7 expected matrix row after final validator review to match the approved C5 final-state contract: final active generated count `3`, superseded generated count `10`.

Final validator conclusion: evidence supports the implementation claims for M7 dry-run planning at the plan-only layer. No code fixes requested.
