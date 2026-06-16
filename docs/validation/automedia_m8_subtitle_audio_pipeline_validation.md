# AutoMedia M8a Fixture Subtitle And Audio Marker Pipeline Validation

## User Request

Start the next milestone after M7 according to `context-infra/rules/skills/workflow_independent_validation_agent.md`.

M8 roadmap scope: first media intelligence pipeline for fixture media. This run is explicitly **M8a fixture-only**. It should generate deterministic subtitle segments, link them to timeline items, allow manual subtitle edits to persist, and create visible silence/long-pause cleanup markers.

## Workflow Source

- `/Users/qianying/Documents/AI_Workspace/context-infra/rules/skills/workflow_independent_validation_agent.md`

## Scope

M8a will add a deterministic fixture-only transcription and audio-marker pipeline:

1. Add a project-level action that runs a fixture subtitle/audio-marker job for a fixed fixture source asset.
2. Write one `jobs` row with `job_type='transcribe'`, `status='succeeded'`, deterministic `input_json`, and deterministic `output_json`.
3. Create generated subtitle timeline items on the `subtitles` track.
4. Write linked `subtitle_segments` rows for each generated subtitle item.
5. Create generated silence/long-pause markers on the `audio` track as timeline items.
6. Render generated subtitle text in the Subtitles tab and timeline.
7. Allow editing generated subtitle text from the Subtitles tab and persist the corresponding `timeline_items.properties_json.text` and linked `subtitle_segments.text`.
8. Allow deleting a generated subtitle timeline item and soft-delete linked `subtitle_segments` without leaving active orphan segments.

M8a claim boundary:

- Valid claim: fixture transcript rows and fixture pause markers are generated, persisted, visible, editable, and independently verified.
- Deferred to later M8b/M9+ work: real audio extraction, real transcription model integration, real silence detection from audio waveform, and rendered video output.

## Non-Goals

- No real Whisper, cloud transcription, or LLM transcription in M8a.
- No real audio extraction binary requirement in M8a. The extraction step is represented by deterministic fixture metadata in the transcribe job input/output.
- No rendered-video export.
- No platform publishing.
- No automatic cutting/removal of video based on silence markers. M8a shows markers only.
- No subtitle translation quality evaluation beyond deterministic fixture text.
- No prompt/model/threshold tuning. Phase 4 train/validation/test split is N/A for this deterministic fixture milestone.

## Assumptions To Validate

- Existing `subtitle_segments` schema is sufficient for M8a: `id`, `project_id`, `timeline_item_id`, `language`, `text`, `start_ms`, `end_ms`, `style_json`, timestamps, `deleted_at`.
- Existing `timeline_items.item_type='subtitle'` can represent generated subtitle timeline items.
- Existing `timeline_items.item_type='audio'` on the `audio` track can represent silence/long-pause cleanup markers with `properties_json.marker_type='silence_pause'`.
- Existing generic delete endpoint should soft-delete a subtitle item; M8a may need to extend it so linked active `subtitle_segments` are also soft-deleted.
- Existing generic update endpoint should update subtitle item text; M8a may need to extend it so linked active `subtitle_segments` text stays in sync.

## Data Contract

Fixed validation project:

- `project_adhd_vlog_01`
- primary source asset: `asset_adhd_vlog_source`

Fixture transcript expected for M8a:

| Segment | Language | Text | Start ms | End ms |
|---:|---|---|---:|---:|
| 1 | `zh` | `明明是两个孩子却说这是我一个人的问题` | `0` | `5200` |
| 2 | `zh` | `我想拆开看这个冲突里真正发生了什么` | `5600` | `11200` |
| 3 | `zh` | `先把情绪放慢一点再决定怎么回应` | `12800` | `18500` |

Fixture silence/long-pause markers expected for M8a:

| Marker | Type | Label | Start ms | End ms | Duration ms |
|---:|---|---|---:|---:|---:|
| 1 | `silence_pause` | `Pause: 00:05.20-00:05.60` | `5200` | `5600` | `400` |
| 2 | `silence_pause` | `Pause: 00:11.20-00:12.80` | `11200` | `12800` | `1600` |

Generated item contract:

- Subtitle items:
  - `item_type='subtitle'`
  - `track_type='subtitles'`
  - `generated_by_job_id` points to the M8a `transcribe` job.
  - `manual_override=0` until user edits text.
  - `properties_json.text` equals segment text.
  - `properties_json.source='m8_fixture_transcript'`.
  - `properties_json.subtitle_segment_id` points to the linked `subtitle_segments.id`.
  - `properties_json.subtitle_segment_ids` is also present as a single-item array for compatibility with existing M6 manual multi-segment subtitle behavior.
  - `properties_json.claim_layer='fixture_transcript_only'`.
  - `properties_json.pipeline='m8a_fixture_subtitle_audio'`.
- Subtitle segments:
  - `timeline_item_id` points to the subtitle item.
  - `deleted_at IS NULL` while the item is active.
  - `start_ms` and `end_ms` exactly match the linked item.
- Silence marker items:
  - `item_type='audio'`
  - `track_type='audio'`
  - `generated_by_job_id` points to the M8a `transcribe` job.
  - `properties_json.marker_type='silence_pause'`.
  - `properties_json.pipeline='m8a_fixture_subtitle_audio'`.
  - `properties_json.text` equals marker label.
  - `properties_json.claim_layer='fixture_audio_cleanup_marker_only'`.

Existing M6 compatibility contract:

- Existing manual subtitle items may store multiple linked segment ids in `properties_json.subtitle_segment_ids`.
- M8a generated subtitle items store both singular `subtitle_segment_id` and array `subtitle_segment_ids`.
- Subtitle edit logic must metadata-merge for both forms:
  - preserve `source`, `pipeline`, `claim_layer`, `subtitle_segment_id`, `subtitle_segment_ids`, timing fields, marker/provenance fields, and any unrelated existing properties.
  - update all active linked `subtitle_segments.text` rows for ids in `subtitle_segment_ids` or the singular `subtitle_segment_id`.
- Subtitle delete logic must soft-delete all active linked `subtitle_segments` for either singular or array linkage.

Job contract:

- Endpoint: `POST /api/projects/:projectId/subtitle-audio-fixture-run`.
- Success: HTTP `201`, returns `{ job, generatedSubtitleCount, generatedMarkerCount, project }`.
- Missing project: HTTP `404`, `{error:"Project not found"}`.
- If no primary source asset exists: HTTP `409`, `{error:"Primary source asset is required for subtitle/audio pipeline."}`.
- Success `job` fields:
  - `job_type='transcribe'`.
  - `status='succeeded'`.
  - `input_json.pipeline='m8a_fixture_subtitle_audio'`.
  - `input_json.source_asset_id='asset_adhd_vlog_source'`.
  - `input_json.enabled_step_keys` exactly records enabled edit steps at run time.
  - `output_json.pipeline='m8a_fixture_subtitle_audio'`.
  - `output_json.claim_layer='fixture_transcript_only'`.
  - `output_json.generated_subtitle_item_ids.length` equals generated subtitle count.
  - `output_json.generated_marker_item_ids.length` equals generated marker count.
  - `output_json.skipped` records disabled-step reasons, for example `["clean_speech_disabled"]`.
  - Serialized `input_json`, `output_json`, and generated item JSON must not contain `real_transcription`, `whisper`, `rendered_video`, `exported`, `published`, or `external_publish`.
- Replacement predicate:
  - Only rows from previous jobs where `jobs.job_type='transcribe'` and `json_extract(jobs.input_json,'$.pipeline')='m8a_fixture_subtitle_audio'` for the same project are eligible for replacement.
  - Replacement soft-deletes eligible generated rows with `manual_override=0`.
  - Replacement preserves eligible generated subtitle rows with `manual_override=1`.
  - Replacement soft-deletes linked active subtitle segments only for soft-deleted subtitle items.
  - Replacement must not affect manual non-generated rows, existing M6 manual subtitle rows, M7 auto-edit rows, or any other project.

UI contract:

- Add a visible control in the Subtitles tab named `生成字幕和停顿标记`, with stable selector `#runSubtitleAudioPipeline`.
- After success, show toast `字幕和停顿标记已生成：3 条字幕，2 个停顿标记。`
- Subtitles tab `#subtitleEditor` lists all generated active subtitles as editable textareas with `data-edit-item`.
- Timeline `#timeline` shows generated subtitle clips on the `Subtitles` track and generated marker clips on the `Audio` track.
- Deleting a subtitle clip by clicking its `[data-item-id]` timeline button removes it from active timeline, removes it from the Subtitles tab, and soft-deletes linked active subtitle segments.

Final demo-state policy:

- `npm run verify:m8` is allowed to reset the shared demo DB and leave it in the verifier's final canonical state.
- After verification, if the user asks for a visual demo URL, the main agent should rerun the M8a pipeline on the normal demo project before showing the URL.

## Main-Agent Plan

1. Add deterministic M8a fixture transcript and silence marker constants in `scripts/serve.mjs`.
2. Add `runSubtitleAudioFixture(projectId)` backend function.
3. Add `POST /api/projects/:projectId/subtitle-audio-fixture-run`.
4. Extend subtitle update path so editing a subtitle item updates linked active `subtitle_segments.text`, sets `manual_override=1`, and preserves segment timing.
5. Extend delete path so deleting a subtitle timeline item soft-deletes linked active `subtitle_segments`.
6. Add Subtitles tab button and client action.
7. Add `scripts/verify-m8-subtitle-audio.mjs` and `npm run verify:m8`.
8. Record final browser/API/DB/performance evidence in this file.

## Expected Outcome Matrix

| Case | Input / Action | Field Or Surface | Expected Before Test | Actual Observed | Verdict |
|---|---|---|---|---|---|
| C0 | Reset DB and open `#/editor/project_adhd_vlog_01`, click `[data-tab="subtitles"]` | Initial UI | `#runSubtitleAudioPipeline` is visible with text `生成字幕和停顿标记`; none of the three M8a fixture transcript texts is visible before running pipeline | pending | pending |
| C0 | same | DB baseline | Active M8a generated subtitle item count `0`; active M8a generated silence marker item count `0`; active M8a fixture subtitle segment count `0`; existing M6 manual subtitle behavior remains available | pending | pending |
| C1 | Click `#runSubtitleAudioPipeline` | Toast | Exact text `字幕和停顿标记已生成：3 条字幕，2 个停顿标记。` appears | pending | pending |
| C1 | same | API result | HTTP `201`; `generatedSubtitleCount=3`; `generatedMarkerCount=2`; response contains refreshed `project` | pending | pending |
| C1 | same | `jobs` | One latest `transcribe` job for project; `status='succeeded'`; `input_json.pipeline='m8a_fixture_subtitle_audio'`; `input_json.source_asset_id='asset_adhd_vlog_source'`; `input_json.enabled_step_keys` includes `subtitles_bilingual` and `clean_speech`; `output_json.pipeline='m8a_fixture_subtitle_audio'`; `output_json.claim_layer='fixture_transcript_only'`; output has 3 subtitle ids and 2 marker ids; forbidden claim strings absent | pending | pending |
| C2 | After C1 | Subtitles tab UI | `#subtitleEditor textarea[data-edit-item]` includes all three exact fixture transcript texts; generated textarea count is exactly 3 when no manual subtitle is inserted by fixture setup | pending | pending |
| C2 | After C1 | Timeline UI | `#timeline` has three subtitle clips and two audio marker clips visible with exact labels from data contract; clips are under the expected track rows by `data-track-type` | pending | pending |
| C2 | After C1 and route reload `#/editor/project_adhd_vlog_01` | Stale-state/reload UI | Subtitles tab and timeline still show all three subtitles and two markers after route re-entry | pending | pending |
| C2 | After C1 | `timeline_items` subtitle rows | Exactly 3 active generated M8a subtitle items on `subtitles` track; times/text/source/pipeline/claim layer/singular and array segment ids match fixture contract | pending | pending |
| C2 | After C1 | `subtitle_segments` rows | Exactly 3 active linked rows; each `timeline_item_id` exists and points to an active subtitle item; language/text/start/end match fixture contract | pending | pending |
| C2 | After C1 | `timeline_items` marker rows | Exactly 2 active generated M8a silence marker items on `audio` track; marker type/labels/times/duration/pipeline/claim layer match fixture contract | pending | pending |
| C3 | Edit first generated subtitle textarea to `明明是两个孩子，但这不是我一个人的问题` | UI reload | After route reload/re-entry, edited text remains visible | pending | pending |
| C3 | same | DB item | Linked subtitle `timeline_items.properties_json.text` equals edited text; `manual_override=1`; `deleted_at IS NULL`; original `source`, `pipeline`, `claim_layer`, `subtitle_segment_id`, `subtitle_segment_ids`, and timing metadata are preserved | pending | pending |
| C3 | same | DB segment | Linked `subtitle_segments.text` equals edited text; timing unchanged; `deleted_at IS NULL` | pending | pending |
| C3b | Create existing-style manual subtitle through `添加句级字幕`, then edit it | M6 compatibility | Manual subtitle item with multiple `subtitle_segment_ids` still updates all linked active `subtitle_segments.text` rows without losing `subtitle_segment_ids`; `manual_override=1` | pending | pending |
| C4 | Delete second generated subtitle item by selecting the active subtitle timeline clip whose properties text equals segment 2 | Timeline UI | Deleted subtitle text disappears from active timeline; remaining generated subtitle clips stay visible | pending | pending |
| C4 | same | Subtitles tab UI | Deleted subtitle textarea disappears from `#subtitleEditor`; remaining active subtitle textareas stay visible | pending | pending |
| C4 | same | DB item | Deleted subtitle item has `deleted_at IS NOT NULL`; other generated subtitle items remain active | pending | pending |
| C4 | same | DB segment | Linked second `subtitle_segments.deleted_at IS NOT NULL`; active orphan subtitle segment count is `0` | pending | pending |
| C5 | Run pipeline again after C3/C4 | DB replacement | Previous non-manual M8a generated rows and linked segments are soft-deleted; C3 edited generated subtitle with `manual_override=1` is preserved; latest job creates exactly 3 active subtitle items, 3 active segments, and 2 active silence marker items; total active M8a generated subtitle timeline items is `4` consisting of 3 latest-job subtitles plus 1 preserved edited generated subtitle | pending | pending |
| C5 | same | Preservation | Manual non-generated subtitle item, M6 manual multi-segment subtitle item, M7 auto-edit generated rows, and other projects remain unchanged | pending | pending |
| C6 | Disable `subtitles_bilingual` edit step and call endpoint | API/DB | HTTP `409`, `{error:"Subtitles edit step is disabled."}`; no new transcribe job; no generated subtitle or marker changes; before/after counts equal | pending | pending |
| C7 | Re-enable subtitles, disable `clean_speech`, and call endpoint | API/DB | HTTP `201`; `input_json.enabled_step_keys` excludes `clean_speech`; `output_json.skipped` includes `clean_speech_disabled`; 3 latest subtitles generated; 0 latest markers generated; previous non-manual active M8a markers are soft-deleted; no active M8a silence marker items from latest job | pending | pending |
| C8 | API call on missing project id | API/DB | HTTP `404`, `{error:"Project not found"}`; no jobs or timeline rows created | pending | pending |
| C9 | API call on a real project with no `project_assets.role='source'` | API/DB | HTTP `409`, `{error:"Primary source asset is required for subtitle/audio pipeline."}`; no transcribe job; no timeline rows; no subtitle segments | pending | pending |
| C10 | Cross-project isolation | DB | Running M8a on `project_adhd_vlog_01` does not mutate `project_ai_family_workflow` jobs, timeline items, or subtitle segments | pending | pending |
| C11 | Foreign key and JSON audit | SQLite | `PRAGMA foreign_key_check` returns zero rows; all `properties_json`, `input_json`, `output_json`, and `style_json` parse as JSON | pending | pending |
| C12 | Adjacent regression | Existing verifiers | `npm run verify:m3m6`, `npm run verify:m7-style`, and `npm run verify:m7-review` still pass | pending | pending |

## Performance Report Contract

The final M8a verifier must print a deterministic fixture performance report for the latest canonical state after C7. It must also record the C5 replacement/preservation state before C7 disables `clean_speech`.

Summary rows:

| Entity / Table | Expected Count | Actual Count | Matched Items | Failed Items | Accuracy | Verdict |
|---|---:|---:|---:|---:|---:|---|
| Successful M8a `transcribe` jobs | `3` | pending | pending | pending | pending | pending |
| Failed/blocked negative-case M8a `transcribe` jobs written | `0` | pending | pending | pending | pending | pending |
| Latest-job active M8a subtitle timeline items | `3` | pending | pending | pending | pending | pending |
| Latest-job active M8a subtitle segments | `3` | pending | pending | pending | pending | pending |
| Latest-job active M8a silence marker timeline items | `0` after C7, `2` in C5 snapshot | pending | pending | pending | pending | pending |
| Preserved manually edited generated subtitle items | `1` | pending | pending | pending | pending | pending |
| Preserved manual non-generated subtitle items | `1` | pending | pending | pending | pending | pending |
| Superseded soft-deleted M8a subtitle timeline items | `5` | pending | pending | pending | pending | pending |
| Superseded soft-deleted M8a marker timeline items | `4` | pending | pending | pending | pending | pending |
| Soft-deleted linked M8a subtitle segments | `5` | pending | pending | pending | pending | pending |
| Active orphan subtitle segments | `0` | pending | pending | pending | pending | pending |
| Cross-project mutated rows | `0` | pending | pending | pending | pending | pending |

Row-level comparisons:

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | Latest subtitle timeline item 1 exact text/time/track/source/pipeline/claim layer/segment ids | pending | pending |
| 2 | Latest subtitle timeline item 2 exact text/time/track/source/pipeline/claim layer/segment ids | pending | pending |
| 3 | Latest subtitle timeline item 3 exact text/time/track/source/pipeline/claim layer/segment ids | pending | pending |
| 4 | Latest subtitle segment 1 exact text/time/language/timeline link/style JSON | pending | pending |
| 5 | Latest subtitle segment 2 exact text/time/language/timeline link/style JSON | pending | pending |
| 6 | Latest subtitle segment 3 exact text/time/language/timeline link/style JSON | pending | pending |
| 7 | C5 silence marker 1 exact label/time/duration/type/pipeline/claim layer | pending | pending |
| 8 | C5 silence marker 2 exact label/time/duration/type/pipeline/claim layer | pending | pending |
| 9 | Preserved edited generated subtitle exact edited text/manual_override/link state | pending | pending |
| 10 | Preserved manual M6-style subtitle exact multi-segment linkage | pending | pending |
| 11 | Superseded rows soft-delete counts and linked segment soft-delete counts | pending | pending |
| 12 | Forbidden claim strings absent from job/item JSON | pending | pending |

Unexpected extra active M8a-generated rows count as failures. Missing expected rows count as failures. Final PASS requires `100.00%`.

## Final Evidence Checklist

Final validation must record all of the following before any PASS claim:

| Evidence Layer | Required Evidence |
|---|---|
| Reset/setup | Exact command for DB reset and fixture setup, including any inserted manual M6-style subtitle rows |
| Browser path | Real browser or headless Chrome/CDP route `#/editor/project_adhd_vlog_01`; click `[data-tab="subtitles"]`; click `#runSubtitleAudioPipeline`; inspect `#subtitleEditor`, `#timeline`, and `#toast` |
| API path | Direct calls for success, disabled subtitles, disabled clean speech, missing project, and no-primary-source cases with exact status/error JSON |
| DB path | SQL-backed assertions for `jobs`, `timeline_items`, `subtitle_segments`, `timeline_tracks`, `project_assets`, and FK/JSON audits |
| Stale-state | Route reload/re-entry after generation and after subtitle edit |
| Regression | `npm run verify:m3m6`, `npm run verify:m7-style`, and `npm run verify:m7-review` |
| Performance | Printed row-level report with expected/actual/match for all summary and row-level contracts above |
| Claim boundary | Final text must say M8a fixture-only and must not claim real transcription, real audio extraction, rendered export, or publishing |

## Validation-Agent Plan Review

Review timestamp: 2026-06-16. Phase 1/1.5 verdict: not approved for implementation yet.

The proposed M8 plan is directionally useful and has a stronger fixture contract than a smoke test: it names the project, source asset, expected transcript rows, expected silence markers, API status codes, browser-visible surfaces, SQLite checks, and a 100% fixture-performance requirement. However, it still has enough contract ambiguity that implementation could pass the current matrix while shipping a wrong-layer or regression-prone pipeline. Implementation should wait until the blockers below are revised and this section records a second validator approval.

### Blocking Gaps

1. Scope is currently a milestone downgrade without an explicit name or claim boundary. The roadmap M8 deliverables say "Extract audio", "Transcribe fixture media", and "Detect silence/long pause markers". This plan says no real audio extraction binary and represents extraction through deterministic metadata. That can be acceptable as an M8a fixture pipeline, but the artifact must say that explicitly in the scope and final claim. Otherwise the plan will allow a "M8 complete" claim for a metadata stub. Required fix: either add a real fixture audio extraction/probe step with evidence, or rename the scope in this file to M8a fixture subtitle/audio-marker pipeline and state that full audio extraction remains deferred.

2. The subtitle linkage contract conflicts with existing M6 behavior unless it is narrowed. M6 manual subtitles currently create one `timeline_items.item_type='subtitle'` row whose `properties_json.subtitle_segment_ids` can point to multiple rows. The M8 contract proposes one generated subtitle item per segment with singular `properties_json.subtitle_segment_id`. That is workable, but the plan must define both forms and require update/delete logic to handle them deliberately. Required fix: specify whether M8 generated items use singular `subtitle_segment_id`, array `subtitle_segment_ids`, or both, and add regression expectations for existing manual multi-segment subtitle items.

3. The generic subtitle edit path can erase metadata. Current frontend `updateTimelineItem(itemId, { text })` sends only a `text` property, and current server code replaces `properties_json` with exactly the submitted object. If M8 extends this path without a merge contract, editing a generated subtitle can delete `source`, `claim_layer`, `subtitle_segment_id`, labels, provenance, and other fields needed by the verifier. Required fix: the expected matrix must require metadata-preserving merge semantics for subtitle edits, including preserved `source`, `claim_layer`, `subtitle_segment_id` or `subtitle_segment_ids`, marker fields where relevant, and unchanged timing.

4. Rerun replacement policy contradicts manual override expectations from earlier milestones. C3 edits a generated subtitle and sets `manual_override=1`; C5 then expects all previous generated M8 rows and linked segments to be soft-deleted. In M7, edited generated rows with `manual_override=1` were treated as user-preserved. The M8 plan must explicitly decide whether rerunning the transcription pipeline supersedes even user-edited generated subtitle rows, or preserves edited generated rows as manual overrides. Required fix: define the policy in data-contract language and add a field-level case proving the chosen behavior.

5. The rerun selector is underspecified and can delete the wrong rows. "Previous generated M8 subtitle and marker timeline items" needs a stable predicate. A broad `generated_by_job_id IN (SELECT id FROM jobs WHERE job_type='transcribe')` may affect future transcribe jobs or non-M8 rows; a properties-only filter may miss rows after metadata edits. Required fix: define the exact replacement predicate, such as previous `jobs.job_type='transcribe'` plus M8-specific `input_json.pipeline='m8_fixture_subtitle_audio'`, and require row-level proof that manual non-generated rows, M6 manual subtitle rows, M7 auto-edit rows, and other projects remain unchanged.

6. Step gating needs a full contract. C6 and C7 introduce rules for `subtitles_bilingual` and `clean_speech`, but the data contract does not say how `edit_steps` are recorded in `jobs.input_json`, what `jobs.output_json` says when markers are skipped, or whether a disabled `clean_speech` rerun soft-deletes existing markers from earlier runs. Required fix: add exact `enabled_step_keys`, skip reasons, output counts, and before/after row counts for both disabled-step cases.

7. The "no primary source asset" API branch is specified but not validated. The Job contract includes HTTP `409` for missing primary source, but the Expected Outcome Matrix has no case that removes or uses a project without `project_assets.role='source'`. Required fix: add a negative case for no primary source asset with exact status, payload, job count unchanged, timeline count unchanged, and no segment writes.

8. API payload expectations are still too shallow for success. The success contract says `{ job, generatedSubtitleCount, generatedMarkerCount, project }`, but the matrix does not require exact `job_type`, `status`, M8 pipeline identifier, source asset id, source duration, transcript count, marker count, claim layers, warnings/non-goals, generated item ids, or absence of real-transcription/export/publish claims. Required fix: expand C1/C2 job input/output expected keys and forbidden values before implementation.

9. Browser coverage needs exact selectors and stale-state checks for the new control. C0 says open Subtitles tab, but the current UI has a tab button `data-tab="subtitles"` and `#subtitleEditor`. The plan must require the real click path through the editor, exact button text, exact generated textarea count, exact timeline clip count by track, reload or route re-entry after generation, and absence of pre-run M8 fixture text. Required fix: add selectors or stable UI surfaces for the verifier, not just prose names.

10. Delete behavior is underspecified at the user layer. Current timeline click deletes any clip immediately. C4 says delete the second generated subtitle item via timeline click, but it does not identify how the verifier selects the second generated subtitle deterministically, what happens in the Subtitles tab after delete, or whether deleting from the Subtitles tab is also required. Required fix: add an exact target selection rule, verify both timeline and Subtitles tab consumers refresh, and assert only the target item/segment is soft-deleted.

11. Regression coverage is too narrow for the files being touched. M8 will modify generic timeline item update/delete behavior and the Subtitles tab, which are M6 surfaces. It may also affect M7 because generated subtitle and audio items share timeline rendering and generated item semantics. C10 currently only requires `npm run verify:m7-style`. Required fix: add `npm run verify:m3m6` and `npm run verify:m7-review` as required adjacent regressions, or justify why a narrower subset is sufficient.

12. The performance report contract omits important denominators. It checks latest active rows after C5, but not total transcribe jobs, superseded soft-deleted subtitle items, superseded soft-deleted marker items, soft-deleted linked segments, preserved manual rows, cross-project unchanged rows, or unexpected extras. The row-level table also combines subtitle item and segment fields in a way that can hide a mismatch between `timeline_items` and `subtitle_segments`. Required fix: split row-level comparisons for subtitle timeline items, subtitle segments, marker timeline items, jobs, superseded rows, and orphan checks. Include expected `0` rows explicitly and count unexpected extras as failures.

13. The evidence standard should say which layer proves which claim. API evidence can prove the endpoint contract; DB evidence can prove persistence; browser evidence can prove user visibility and stale-state behavior. The current plan mixes those layers but does not require the final transcript to record exact commands, browser workflow, route, inputs, observed UI text, and SQL audits. Required fix: add a final evidence checklist to the plan before implementation, including reset command, server/browser command, API calls for negative cases, SQL queries or verifier sections, and the final performance report.

14. Final demo-state policy is missing. Existing verifiers reset the shared demo DB. The artifact should state whether the final state after validation is intentionally reset-only evidence or whether the main agent must reseed/rerun M8 for a visible demo state after verification. Required fix: define this before implementation so "ready to inspect" and "verified from reset" are not conflated.

### Required Revisions Before Implementation

- Clarify whether this is full M8 or M8a fixture-only. If fixture-only, revise scope, non-goals, job claim layers, and final verdict language accordingly.
- Define the subtitle source-of-truth contract for both M8 generated one-segment items and existing M6 manual multi-segment subtitles.
- Add metadata-preserving merge requirements for subtitle edits and segment synchronization.
- Decide and document rerun behavior for edited generated subtitles with `manual_override=1`.
- Define exact M8 replacement predicates and cross-project/non-M8 preservation checks.
- Add missing negative cases: no primary source, disabled steps with before/after counts, cross-project isolation, and malformed or invalid update where relevant.
- Expand API success and job JSON contracts with required keys, forbidden claims, and M8 pipeline identifiers.
- Strengthen browser validation to exact UI controls, exact visible counts/text, route reload/re-entry, and both timeline plus Subtitles tab consumers.
- Add `verify:m3m6` and `verify:m7-review` to adjacent regression coverage, alongside `verify:m7-style`.
- Expand the performance report denominator to include jobs, active rows, superseded rows, segments, markers, orphans, manual preservation, and unexpected extras.

Implementation may begin only after these revisions are written into this shared artifact and a second plan review records approval.

### Main-Agent Revision 1 After Validator Blockers

Revision timestamp: 2026-06-16.

Changes made before implementation:

- Renamed scope to `M8a Fixture Subtitle And Audio Marker Pipeline` and added explicit claim boundary. Full real audio extraction/transcription remains deferred.
- Defined generated subtitle source-of-truth for singular and array subtitle segment links, preserving M6 manual multi-segment subtitle compatibility.
- Added metadata-preserving merge semantics for subtitle edits.
- Chose rerun policy: preserve user-edited generated subtitle rows with `manual_override=1`; replace only eligible non-manual M8a generated rows.
- Defined exact replacement predicate using previous `jobs.job_type='transcribe'` plus `input_json.pipeline='m8a_fixture_subtitle_audio'`, same project, and `manual_override=0`.
- Expanded disabled-step contracts, including `enabled_step_keys`, `output_json.skipped`, and marker deletion behavior when `clean_speech` is disabled.
- Added missing no-primary-source negative case.
- Expanded API success payload requirements, forbidden claim strings, and job/item pipeline identifiers.
- Strengthened browser validation with stable selectors: `[data-tab="subtitles"]`, `#runSubtitleAudioPipeline`, `#subtitleEditor`, `#timeline`, and `#toast`.
- Added exact delete target selection rule and Subtitles-tab refresh validation.
- Added adjacent regression commands: `npm run verify:m3m6`, `npm run verify:m7-style`, `npm run verify:m7-review`.
- Expanded performance report denominators to jobs, latest rows, preserved rows, superseded rows, linked segments, orphan checks, cross-project unchanged rows, and forbidden claims.
- Added final evidence checklist and final demo-state policy.

Main-agent revision after second review:

- Pinned superseded soft-delete expected counts before implementation: subtitle timeline items `5`, marker timeline items `4`, linked subtitle segments `5`.
- Added explicit M8a transcribe job denominators: successful jobs `3`; failed/blocked negative-case jobs written `0`.
- Clarified C5 total active M8a generated subtitle timeline item count: `4`, split as 3 latest-job subtitles plus 1 preserved edited generated subtitle.

### Second Plan Review

Review timestamp: 2026-06-16. Phase 1/1.5 second-review verdict: not approved for implementation yet.

The revised plan addresses most of the first-review blockers. It now explicitly scopes the milestone as M8a fixture-only, separates the claim boundary from real audio/transcription/export claims, defines singular plus array subtitle segment linkage for M6 compatibility, requires metadata-preserving subtitle edits, chooses a rerun policy for `manual_override=1`, defines an M8a-specific replacement predicate, adds disabled-step and no-primary-source cases, pins real UI selectors, requires Subtitles-tab refresh after delete, adds M3M6/M7 regressions, and adds a final evidence checklist.

However, two Phase 1.5 blockers remain. They are small compared with the first review, but they matter because this workflow exists to prevent post-hoc success criteria.

Blocking gaps remaining:

1. The performance report still leaves expected counts unresolved. The summary rows for `Superseded soft-deleted M8a subtitle timeline items`, `Superseded soft-deleted M8a marker timeline items`, and `Soft-deleted linked M8a subtitle segments` say `exact expected count from verifier scenario`. That is not an expected outcome written before implementation. The file should pin the counts now, or explicitly write a deterministic formula with named scenario events and the resulting count. Based on the current scenario, the expected final soft-deleted counts appear to be: subtitle timeline items `5`, marker timeline items `4`, linked subtitle segments `5`, assuming replacement affects prior non-manual M8a rows and preserves the C3 edited `manual_override=1` subtitle. If the main agent intends different counts, it must state them before implementation.

2. The performance denominator says it was expanded to jobs, but the summary table does not include transcribe job counts. Add a row for M8a `transcribe` jobs for the canonical scenario. Based on the current matrix, expected successful M8a transcribe jobs appear to be `3`: C1, C5, and C7. Negative cases C6, C8, and C9 should be verified as writing `0` additional transcribe jobs. This job denominator should be in the performance matrix, not only implied by C1/C6/C8/C9.

Non-blocking clarifications recommended before coding:

- Clean up lingering wording that says `M8` where the claim is now `M8a`, especially in Non-Goals, Assumptions, and fixture headings. This is not blocking because the claim boundary is now explicit, but it will reduce final-report ambiguity.
- C5 should explicitly state total active M8a generated subtitle items after rerun: `4` total active M8a generated subtitle timeline items, consisting of `3` latest-job non-manual subtitles plus `1` preserved edited generated subtitle from C3. The current wording is understandable but easy to misread as total active count `3`.

Implementation may begin only after the remaining performance-count and job-denominator blockers are fixed in this shared artifact. Once those counts are pinned, this validator expects the plan to be ready for implementation without another broad rewrite.

### Third Plan Review

Review timestamp: 2026-06-16. Phase 1/1.5 third-review verdict: approved for implementation.

The two remaining second-review blockers are now fixed in the shared artifact:

- Superseded soft-delete counts are pinned before implementation: M8a subtitle timeline items `5`, M8a marker timeline items `4`, linked M8a subtitle segments `5`.
- M8a transcribe job denominators are explicit: successful M8a `transcribe` jobs `3`, failed/blocked negative-case M8a `transcribe` jobs written `0`.
- C5 now states total active M8a generated subtitle timeline items is `4`: 3 latest-job subtitles plus 1 preserved edited generated subtitle.

This plan now satisfies Phase 1/1.5 expectations for scope, data contract, expected outcomes, evidence standard, browser/API/DB coverage, negative cases, regression coverage, and performance-report denominator. Implementation may begin under this M8a fixture-only claim boundary.

## Agreed Plan After Revisions

Approved for implementation on 2026-06-16 after third validator review.

Implementation must stay inside the M8a fixture-only scope and preserve the expected outcome matrix above. If implementation changes replacement policy, expected counts, job ordering, UI selectors, or claim boundary, the shared artifact must be revised and re-reviewed before the changed expectation is used.

## Implementation Summary

Main-agent implementation completed on 2026-06-16 within the approved M8a fixture-only scope.

Changed artifacts:

- `/Users/qianying/Documents/AI_Workspace/AutoMedia/scripts/serve.mjs`
  - Added deterministic M8a fixture transcript and silence marker constants.
  - Added M8a helpers for subtitle-segment linkage, superseded-row replacement, generated subtitle insertion, generated marker insertion, and linked subtitle soft-delete.
  - Added `runSubtitleAudioFixture(projectId)`.
  - Added `POST /api/projects/:projectId/subtitle-audio-fixture-run`.
  - Updated generic subtitle edit path to preserve metadata and sync linked active `subtitle_segments.text`.
  - Updated generic subtitle delete path to soft-delete linked active `subtitle_segments`.
- `/Users/qianying/Documents/AI_Workspace/AutoMedia/index.html`
  - Added `#runSubtitleAudioPipeline` button to the Subtitles tab.
- `/Users/qianying/Documents/AI_Workspace/AutoMedia/src/app.js`
  - Wired `#runSubtitleAudioPipeline` to the new M8a endpoint and exact toast text.
- `/Users/qianying/Documents/AI_Workspace/AutoMedia/scripts/verify-m8-subtitle-audio.mjs`
  - Added real browser/CDP verifier plus direct SQLite row-level performance audit.
- `/Users/qianying/Documents/AI_Workspace/AutoMedia/package.json`
  - Added `npm run verify:m8`.

## Final Validation Transcript

Main-agent validation commands and results:

| Check | Result |
|---|---|
| `node --check scripts/serve.mjs` | PASS |
| `node --check src/app.js` | PASS |
| `node --check scripts/verify-m8-subtitle-audio.mjs` | PASS |
| `npm run verify:m8` | PASS |
| `npm run verify:m3m6` | PASS |
| `npm run verify:m7-style` | PASS |
| `npm run verify:m7-review` | PASS |

Browser path executed by main thread:

- Opened real local route `#/editor/project_adhd_vlog_01`.
- Clicked `[data-tab="subtitles"]`.
- Verified `#runSubtitleAudioPipeline` was visible and pre-run fixture transcript text absent.
- Clicked `#runSubtitleAudioPipeline`.
- Observed exact toast `字幕和停顿标记已生成：3 条字幕，2 个停顿标记。`
- Verified `#subtitleEditor` and `#timeline` showed 3 generated subtitles and 2 pause markers.
- Reloaded route and re-entered Subtitles tab to verify stale-state refresh behavior.
- Edited first generated subtitle to `明明是两个孩子，但这不是我一个人的问题` and confirmed persistence after reload.
- Edited an M6-style manual multi-segment subtitle and confirmed both linked manual segments updated without losing `subtitle_segment_ids`.
- Deleted the second generated subtitle by deterministic timeline item id and confirmed both timeline and Subtitles tab consumers refreshed.

API negatives exercised:

| Case | Result |
|---|---|
| Disabled `subtitles_bilingual` | HTTP `409`, `{error:"Subtitles edit step is disabled."}` |
| Disabled `clean_speech` | HTTP `201`; `generatedMarkerCount=0`; `output_json.skipped=["clean_speech_disabled"]` |
| Missing project | HTTP `404`, `{error:"Project not found"}` |
| No primary source asset | HTTP `409`, `{error:"Primary source asset is required for subtitle/audio pipeline."}` |

Direct DB validation observed:

- Latest successful M8a `transcribe` jobs count: `3`
- Negative-case additional M8a `transcribe` jobs written: `0`
- Latest-job active M8a subtitle timeline items: `3`
- Latest-job active M8a subtitle segments: `3`
- Latest-job active M8a silence markers after C7: `0`
- C5 snapshot active silence markers: `2`
- Preserved edited generated subtitle rows: `1`
- Preserved manual non-generated M6 subtitle rows: `1`
- Superseded soft-deleted M8a subtitle timeline items: `5`
- Superseded soft-deleted M8a marker timeline items: `4`
- Soft-deleted linked M8a subtitle segments: `5`
- Active orphan subtitle segments: `0`
- Cross-project mutated rows: `0`
- `PRAGMA foreign_key_check`: zero rows
- All checked JSON columns parsed cleanly

Performance report from `npm run verify:m8`:

```json
{
  "successfulM8aTranscribeJobs": { "expected": 3, "actual": 3, "accuracy": "100.00%" },
  "failedBlockedNegativeJobsWritten": { "expected": 0, "actual": 0, "accuracy": "100.00%" },
  "latestJobActiveSubtitleTimelineItems": { "expected": 3, "actual": 3, "accuracy": "100.00%" },
  "latestJobActiveSubtitleSegments": { "expected": 3, "actual": 3, "accuracy": "100.00%" },
  "latestJobActiveSilenceMarkers": { "expected": 0, "actual": 0, "accuracy": "100.00%" },
  "c5SnapshotSilenceMarkers": { "expected": 2, "actual": 2, "accuracy": "100.00%" },
  "preservedManuallyEditedGeneratedSubtitles": { "expected": 1, "actual": 1, "accuracy": "100.00%" },
  "preservedManualNonGeneratedSubtitles": { "expected": 1, "actual": 1, "accuracy": "100.00%" },
  "supersededSoftDeletedSubtitleItems": { "expected": 5, "actual": 5, "accuracy": "100.00%" },
  "supersededSoftDeletedMarkerItems": { "expected": 4, "actual": 4, "accuracy": "100.00%" },
  "softDeletedLinkedSubtitleSegments": { "expected": 5, "actual": 5, "accuracy": "100.00%" },
  "activeOrphanSubtitleSegments": { "expected": 0, "actual": 0, "accuracy": "100.00%" },
  "crossProjectMutatedRows": { "expected": 0, "actual": 0, "accuracy": "100.00%" }
}
```

## Final Verdict

Main-agent preliminary verdict: PASS at the declared M8a fixture-only claim boundary.

### Independent Validator Phase 3 Review

Review timestamp: 2026-06-16. Final validator verdict: PASS at the declared M8a fixture-only claim boundary.

What I independently inspected:

- Changed runtime artifacts: `scripts/serve.mjs`, `index.html`, `src/app.js`, `package.json`, and `scripts/verify-m8-subtitle-audio.mjs`.
- Shared validation artifact sections: implementation summary, final validation transcript, API negatives, DB observations, performance report, and claim boundary.
- Additional changed documentation artifacts: `docs/prd.md`, `CONTEXT.md`, and `docs/validation/automedia_tdd_validation_test_list.md`.

Independent command evidence:

| Check | Independent validator result |
|---|---|
| `node --check scripts/serve.mjs` | PASS |
| `node --check src/app.js` | PASS |
| `node --check scripts/verify-m8-subtitle-audio.mjs` | PASS |
| `npm run verify:m8` | PASS |
| Direct SQLite aggregate cross-check after `verify:m8` | PASS |
| `npm run verify:m3m6` | PASS |
| `npm run verify:m7-style` | PASS |
| `npm run verify:m7-review` | PASS |

Independent SQLite aggregate cross-check after `npm run verify:m8`:

```json
{
  "jobs": 3,
  "items": [
    { "item_type": "audio", "manual_override": 0, "active": 0, "count": 4 },
    { "item_type": "subtitle", "manual_override": 0, "active": 0, "count": 5 },
    { "item_type": "subtitle", "manual_override": 0, "active": 1, "count": 3 },
    { "item_type": "subtitle", "manual_override": 1, "active": 1, "count": 1 }
  ],
  "segments": [
    { "active": 0, "count": 5 },
    { "active": 1, "count": 4 }
  ],
  "orphan": 0,
  "foreignKeyRows": 0
}
```

Layered verdict:

| Layer | Verdict | Evidence |
|---|---|---|
| Scope/claim boundary | PASS | Implementation stays fixture-only and does not claim real transcription, real audio extraction, rendered export, or publishing. |
| Browser/user path | PASS | `npm run verify:m8` drives headless Chrome through the real editor route, Subtitles tab, pipeline button, toast, reload, edit, manual M6 subtitle edit, and timeline delete flow. |
| API negatives | PASS | Disabled subtitles, disabled clean speech, missing project, and no-primary-source branches are exercised with exact status/error contracts. |
| DB contract | PASS | Independent aggregate confirms job/item/segment counts, soft-delete counts, manual override preservation, no active orphans, and clean foreign keys. |
| M6/M7 regressions | PASS | `verify:m3m6`, `verify:m7-style`, and `verify:m7-review` pass sequentially after M8a verification. |
| Performance report | PASS | `npm run verify:m8` reports 100.00% across the predeclared denominator, and the independent aggregate matches the key population counts. |

Non-blocking note:

- The implementation summary lists runtime artifacts but does not list the additional doc changes `docs/prd.md`, `CONTEXT.md`, and `docs/validation/automedia_tdd_validation_test_list.md`. I inspected them at a high level and did not find an M8a runtime blocker. Before commit, the main agent should intentionally include or exclude these documentation changes so they are not accidentally bundled as unexplained scope.

Final decision: M8a is validated as complete for the approved fixture-only milestone. No blocking issues remain for the M8a runtime/API/UI/DB contract.
