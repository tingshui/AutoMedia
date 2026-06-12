# AutoMedia PRD Update Validation

## 1. User Request And Scope

User asked to rewrite the PRD based on the latest page changes, adding/removing every function and documenting backing database details. User also explicitly requested using the independent validation agent workflow.

Scope:

- Update AutoMedia PRD to match current demo and intended IA.
- Cover home page, video editing page, video publishing page, style management, platform analytics summary, and comment reply summary.
- Document functions, state transitions, required confirmations, and backing database/schema design.
- Include MVP vs later implementation boundaries.
- Validate against current demo files:
  - `AutoMedia/index.html`
  - `AutoMedia/src/styles.css`
  - `AutoMedia/src/app.js`

Non-goals:

- Do not implement backend code.
- Do not implement real media processing.
- Do not change the UI demo unless the PRD update reveals a direct mismatch that must be documented as an open issue.
- Do not touch `projects/ai-assistant`.

## 2. Main-Agent Plan

1. Read current AutoMedia demo and existing `AutoMedia/docs/initial_plan.md`.
2. Replace or substantially rewrite `AutoMedia/docs/initial_plan.md` as the current PRD.
3. Add sections for:
   - Product overview.
   - Current IA and navigation.
   - Detailed page-level requirements.
   - Function inventory.
   - Data model and database tables.
   - Workflow/state transitions.
   - AI/media pipeline requirements.
   - Platform publishing requirements.
   - Analytics and comment reply future modules.
   - Permissions and user confirmation requirements.
   - MVP milestones and open questions.
4. Update README if needed to identify the PRD.
5. Run static checks against PRD content.
6. Ask validator agent to review final PRD against the demo and this validation matrix.

## 3. Expected Outcome Matrix

This initial matrix was superseded after validator Phase 1 review because it was too coarse. The operative matrix is section 5.1.

## 4. Validator Instructions

Validator should independently inspect current demo files and PRD after main-agent update. It should challenge missing functions, mismatched IA, absent database tables, and claims that exceed current MVP.

Browser-level validation is optional for this document task. Static artifact review is acceptable if browser tooling is unavailable, but validator should still compare visible HTML structure against PRD claims.

## 5. Plan Review

Validator Phase 1 review completed.

Key critiques:

- The original matrix was too coarse and could pass by keyword presence.
- PRD must explicitly delete, downgrade, or move old-PRD functions that are not represented in the latest demo.
- PRD must separate current demo, MVP implementation target, and future modules.
- Database requirements need field-level tables, relationships, status enums, and UI-to-table ownership.
- Style management has a mismatch risk: user requested style deletion, but the current demo only exposes rule deletion. PRD must mark style deletion as required product behavior, while noting demo coverage gap.
- Publish confirmation has a mismatch risk: demo has scheduling confirmation, but no final external publish confirmation. PRD must define external publishing as future/confirmation-gated.

## 5.1 Revised Expected Outcome Matrix

| Case | Artifact / Surface | Expected Before Test | Actual Observed | Verdict |
|---|---|---|---|---|
| C1 | Current Demo Inventory | PRD has a section that inventories Home, Editor, Publishing, Style Manager, and Modals based on current `index.html` | pending | pending |
| C2 | IA state contract | PRD states Home opens without sidebar; clicking recent/new video enters Editor with sidebar; clicking Home exits editing and returns to sidebar-less Home | pending | pending |
| C3 | Style manager IA | PRD states Style Manager is entered from Home, and its sidebar state only exposes Home, hiding Editor/Publishing/style memory in current demo | pending | pending |
| C4 | Home recent videos | PRD documents recent video cards with thumbnail, title, draft/status metadata, and click-to-resume behavior | pending | pending |
| C5 | Home create new video modal | PRD documents drag/drop video import, pull-down/library import, style selection, cancel, confirm, and transition to Editor | pending | pending |
| C6 | Home style management entry | PRD documents visible style chips and entry to Style Manager from Home | pending | pending |
| C7 | Home analytics/comment summaries | PRD states Platform Analytics and Comment Reply are current Home summary cards only; full pages and real ingestion/reply are future | pending | pending |
| C8 | Editor topbar | PRD documents editable video title, undo, redo, run auto-edit, export, and save as Editor-only actions | pending | pending |
| C9 | Editor step dropdown | PRD documents left sidebar Video Editing dropdown with four default-checked steps and recut confirmation when a step is unchecked | pending | pending |
| C10 | Editor canvas/timeline | PRD documents video canvas, transport controls, resizable divider, horizontally scrollable timeline, and Video/Audio/Subtitles/Effects tracks | pending | pending |
| C11 | Timeline objects | PRD documents clip/timeline objects with ids, track type, source asset, start/end, duration, editable generated state, and deletion/modification behavior | pending | pending |
| C12 | Editor right tabs | PRD documents all 8 tabs exactly: Add Video, Effects, Audio Effects, Subtitles, Background Music, Text, Stickers, Transitions | pending | pending |
| C13 | Publishing tabs | PRD documents all 4 Publishing tabs exactly: Title Recommendations, Cover Design, Platform Selection, Scheduled Publishing | pending | pending |
| C14 | Cover design fields | PRD documents master cover, per-platform ratios, crop/scale/x/y/text-size controls, and generated platform cover assets | pending | pending |
| C15 | Platform selection fields | PRD documents Xiaohongshu, Bilibili, YouTube, Douyin platform rows with platform-specific requirements | pending | pending |
| C16 | Scheduled publishing fields | PRD documents selected platform list, per-platform scheduled_at, status, and schedule confirmation; external publish requires later confirmation | pending | pending |
| C17 | Style manager functions | PRD documents style list, style name editing, created_at, rule list, rule checkbox enable/disable, rule delete confirmation, add-new-style from multiple reference videos | pending | pending |
| C18 | Style deletion mismatch | PRD explicitly includes style deletion as required product behavior but marks current demo as missing style-level delete control | pending | pending |
| C19 | Modal contract | PRD documents newVideoModal, styleDetailModal, newStyleModal, deleteConfirmModal, recutConfirmModal, memoryModal triggers, confirms, cancels, and side effects | pending | pending |
| C20 | Removed/deferred old PRD features | PRD has a section moving voice control, real platform publish, real analytics ingestion, real comment posting, old editor publish tab, and file-only memory storage into future/deferred or revised architecture | pending | pending |
| C21 | Database table coverage | PRD includes concrete tables for projects, assets, timeline_tracks, timeline_items, edit_steps, style_profiles, style_rules, style_reference_videos, jobs, publish_assets, platform_accounts, platform_posts, analytics_metrics, comments, reply_drafts | pending | pending |
| C22 | Database field coverage | Each table includes primary key, critical foreign keys, status fields/enums, timestamps, and which UI/function writes or reads it | pending | pending |
| C23 | Data relationship coverage | PRD explains project → assets → timeline → publish assets; style profile → rules/reference videos; platform post → analytics/comments/replies | pending | pending |
| C24 | Demo/MVP/Future boundary | PRD includes a matrix separating current static demo, MVP implementation target, and future modules | pending | pending |
| C25 | README naming | README points to the updated PRD/product requirements document, not only “initial plan” | pending | pending |
| C26 | Negative claims | PRD does not claim real platform publishing, real analytics ingestion, real comment posting, or persistent backend database already exist in current demo | pending | pending |

## 6. Implementation Summary

Main-agent implementation completed:

- Added current PRD at `AutoMedia/docs/prd.md`.
- Replaced stale `AutoMedia/docs/initial_plan.md` with a short pointer to the current PRD.
- Updated `AutoMedia/README.md` to link to the PRD.
- PRD now documents:
  - Current demo inventory and view state contract.
  - Home, Editor, Publishing, and Style Manager functions.
  - All modals and confirmation behavior.
  - Editor right-side 8 tab requirements.
  - Publishing 4 tab requirements.
  - Style management requirements including current demo gap for style-level delete.
  - Database tables, key fields, relationships, and UI ownership.
  - Demo vs MVP vs Future boundaries.
  - Old PRD feature deletion/deferment.

## 7. Final Validation

Validator final review completed.

Final validator verdict:

| Area | Verdict | Notes |
|---|---|---|
| C11 Timeline objects | PASS | `duration_ms` is documented in functional requirements and database schema. |
| C22 Database field coverage | PASS | Missing `project_layout_preferences`, `exports`, `confirmation_events`, composite keys, timestamps, and table ownership matrix were added. |
| Overall PRD | PASS | Validator found no remaining regressions in reviewed PRD sections. |

Residual known demo gap:

- Style profile deletion is required by PRD but not yet represented in the current static demo UI. PRD marks this as a demo gap and product requirement.
