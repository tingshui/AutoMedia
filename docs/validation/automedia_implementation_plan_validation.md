# AutoMedia Implementation Plan Validation

## 1. User Request

User asked to use the independent validation workflow and validator agent to break the validated PRD into a step-by-step implementation plan and report back.

## 2. Scope

This task creates and validates the implementation plan only. It does not implement product code.

Artifacts:

- `AutoMedia/docs/prd.md`
- `AutoMedia/docs/implementation/mvp_plan.md`
- current demo files

## 3. Non-Goals

- No backend implementation.
- No UI demo changes.
- No commit or push.
- No changes under `projects/ai-assistant`.

## 4. Initial Validator Review

Validator verdict on first draft: `needs_plan_changes`.

Required changes received:

- Replace coarse checklist with field-level expected outcome matrix.
- Add PRD table coverage matrix.
- Close schema gap for right-side editor tab support tables.
- Make M2 validation prove UI reads DB, not hardcoded DOM.
- Clarify why style work comes before auto-edit.
- Split M6 into smaller tab groups.
- Split M10 into title, cover, and platform/schedule stages.
- Move confirmation events into the milestones where destructive/recut behavior appears.
- Decide subtitle source of truth.
- Move analytics/comment tables to future or clearly mark them.
- Clarify export as real FFmpeg or mock-only.
- Add AI/media eval split guidance.
- Add fixture/reset/DB diff policy.

## 5. Revised Plan Changes

Main agent revised `mvp_plan.md`:

- Added Product Boundary table.
- Added PRD Table Coverage Matrix.
- Added catalog support tables: `effect_presets`, `audio_presets`, `subtitle_segments`, `music_assets`, `text_templates`, `sticker_assets`, `transition_presets`.
- Split M3 into M3a style read model and M3b Style Manager.
- Split M6 into M6a basic timeline items and M6b catalog timeline items.
- Split M10 into M10a title, M10b cover, M10c platform drafts/scheduling.
- Moved confirmation event validation into M3/M7/M10 and kept M11 as audit hardening.
- Fixed subtitle source of truth: `subtitle_segments` plus linked `timeline_items`.
- Future tables `analytics_metrics`, `comments`, `reply_drafts` are M12, not MVP blockers.
- Export v1 defaults to real FFmpeg; mock export must use `mock_rendered`, not `ready`.
- Added global fixture/reset policy.

## 6. Revised Expected Outcome Matrix

| Milestone | Surface | Expected Before Implementation |
|---|---|---|
| M0 | Home view | Opens without sidebar; editor-only buttons absent |
| M0 | Editor navigation | Recent card enters Editor; Home exits to sidebar-free Home |
| M1 | Schema | Every MVP table in PRD Table Coverage Matrix has migration |
| M1 | Seeds | Reset produces exactly 3 projects and 3 style profiles |
| M1 | Catalogs | Preset/catalog tables exist for 8 editor tabs |
| M2 | Home recent projects | DB rename of seed project changes UI after reload |
| M2 | New video cancel | No rows added to `projects` or related tables |
| M2 | New video confirm | One project plus default edit steps and style relation created |
| M3a | Style read model | DB style rename/deletion reflected in Home and modal |
| M3b | Rule delete | `style_rules.deleted_at` set and `confirmation_events` row created |
| M3b | Style delete | `style_profiles.deleted_at` set and `confirmation_events` row created |
| M4 | Editor save | Title/layout/timeline persist after reload |
| M4 | Undo/redo | `edit_history` restores previous item state |
| M5 | Media import | Fixture file creates `source_assets` metadata row |
| M5 | Unsupported file | Visible error and no asset row |
| M6a | Basic items | Video/text/subtitle create correct DB rows and reload |
| M6a | Subtitles | `subtitle_segments` is source of truth and linked to timeline item |
| M6b | Catalog items | Effects/audio/music/sticker/transition create correct item_type and properties |
| M7 | Auto-edit | Disabled steps produce no corresponding generated items |
| M7 | Recut | Confirm creates `confirmation_events` and job; cancel creates no job |
| M8 | Subtitle pipeline | Fixture transcript produces expected segments within tolerance |
| M8 | Cleanup | Silence marker visible and reversible |
| M9 | Export | Real FFmpeg export creates ready file; mock cannot be marked ready |
| M10a | Titles | Candidates persist; selected title reloads |
| M10b | Covers | Per-platform ratios and crop controls persist |
| M10c | Scheduling | Selected platforms create platform_posts; no external API call |
| M11 | Audit | Confirmation events are queryable and required for protected actions |
| M12 | Future | Analytics/comment work does not block MVP |

## 7. Final Validator Review

Final validator verdict: `PASS, with one execution gate`.

The revised implementation plan resolves the previous P0/P1 planning gaps and can be used as the MVP roadmap.

Validator notes:

- PRD table coverage is now explicit, including MVP catalog/support tables and future-only analytics/comment tables.
- M2 validation now proves Home reads from DB by requiring DB rename/insert checks after reload.
- M6 and M10 are split into smaller, independently verifiable milestones.
- Confirmation events are required at the first milestone that introduces destructive, recut, or protected publish-boundary behavior.
- `subtitle_segments` is the subtitle source of truth; timeline subtitle items link to it.
- Export defaults to real FFmpeg. Mock export may exist only as a development gate and must not be marked `ready`.
- Fixture/reset policy and DB diff expectations are now part of the plan.

Execution gate:

- Before any milestone starts, write a milestone-specific field-level matrix covering browser actions, exact DB rows/fields, reload behavior, and negative checks.
- The matrix in this validation file is roadmap-level only. It must not be used as the final acceptance matrix for milestone completion.

Remaining blockers: none at the planning level.
