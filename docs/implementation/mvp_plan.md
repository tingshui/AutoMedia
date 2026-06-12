# AutoMedia MVP Implementation Plan

## 1. Planning Verdict

This plan is the implementation sequence for the validated AutoMedia PRD.

Core principle: build vertical, user-visible slices. Each milestone must leave the product in a runnable state, with browser-visible behavior and database state that can be verified independently.

Implementation starts only after M0 and M1 acceptance matrices are written into the milestone work plan. No milestone may be marked complete using keyword checks alone.

## 2. Product Boundary

| Layer | Included In MVP | Deferred |
|---|---:|---:|
| Local project database | Yes | No |
| Home project workflow | Yes | No |
| Style management | Yes | No |
| Real timeline persistence | Yes | No |
| Manual timeline item creation | Yes | No |
| Basic media import/probe | Yes | No |
| Auto-edit job v1 | Yes | No |
| Subtitle source of truth | Yes, `subtitle_segments` plus linked timeline items | No |
| Local export | Yes, real FFmpeg export target | Mock export only allowed in a temporary dev-only gate |
| Publishing preparation | Yes | No real platform post |
| Confirmation events | Yes, from first destructive/recut flow | No |
| Analytics ingestion | No | Future |
| Comment ingestion/reply | No | Future |
| Voice control | No | Future |

## 3. PRD Table Coverage Matrix

| Table | Milestone | MVP/Future | Primary writer | Primary reader |
|---|---|---|---|---|
| `projects` | M1/M2 | MVP | Home create flow, Editor save | Home, Editor, Publishing |
| `source_assets` | M1/M2/M5 | MVP | New video modal, media import | Home, Editor, jobs |
| `project_assets` | M1/M2/M5 | MVP | New video modal, Add Video tab | Editor, auto-edit |
| `project_layout_preferences` | M1/M4 | MVP | Editor divider/sidebar layout | Editor restore |
| `timeline_tracks` | M1/M4 | MVP | Project init, timeline editor | Editor timeline |
| `timeline_items` | M1/M4/M6/M7/M8 | MVP | Editor tabs, auto-edit, subtitle pipeline | Editor preview, timeline, export |
| `edit_history` | M1/M4/M6 | MVP | Timeline mutations | Undo/redo |
| `edit_steps` | M1/M2/M7 | MVP | New project defaults, sidebar checks | Auto-edit |
| `jobs` | M1/M7/M8/M9 | MVP | Auto-edit, subtitle, export | UI job status |
| `style_profiles` | M1/M2/M3 | MVP | Seed, Style Manager | Home, New Video modal, auto-edit |
| `style_rules` | M1/M3/M7 | MVP | Style Manager, style analysis | Auto-edit |
| `style_reference_videos` | M1/M3 | MVP | New Style modal | Style Manager |
| `project_style_profiles` | M1/M2 | MVP | New Video modal | Auto-edit |
| `effect_presets` | M1/M6b | MVP catalog | Seed/catalog migration | Effects tab |
| `audio_presets` | M1/M6b | MVP catalog | Seed/catalog migration | Audio Effects tab |
| `subtitle_segments` | M1/M6a/M8 | MVP | Subtitle tab, transcription job | Subtitle editor, preview, export |
| `music_assets` | M1/M6b | MVP catalog | Seed/catalog/import | Background Music tab |
| `text_templates` | M1/M6a | MVP catalog | Seed/catalog migration | Text tab |
| `sticker_assets` | M1/M6b | MVP catalog | Seed/catalog migration | Stickers tab |
| `transition_presets` | M1/M6b | MVP catalog | Seed/catalog migration | Transitions tab |
| `title_candidates` | M1/M10a | MVP | Title generation | Publishing title tab |
| `publish_assets` | M1/M10b | MVP | Cover design/export jobs | Publishing preview/posts |
| `platform_accounts` | M1/M10c | MVP stub | Seed/manual config | Platform selection |
| `platform_posts` | M1/M10c | MVP draft/schedule | Publishing tabs | Publishing summary |
| `exports` | M1/M9 | MVP | Export job | Publishing video source |
| `confirmation_events` | M1/M3/M7/M10 | MVP | Confirmation modals | Audit/safety checks |
| `analytics_metrics` | M12 | Future | Platform ingestion | Future analytics |
| `comments` | M12 | Future | Comment ingestion | Future comments |
| `reply_drafts` | M12 | Future | Reply drafting | Future comments |

M1 must create MVP tables and catalog tables. Future tables are not required for MVP migrations unless there is a deliberate placeholder migration marked `future_no_ui`.

## 4. Milestone Plan

| Milestone | Name | Deliverable |
|---|---|---|
| M0 | App shell and test harness | Runnable local app preserving current demo routes/states |
| M1 | Schema, seeds, fixtures | Database migrations, seed data, reset script, PRD table coverage verifier |
| M2 | Home project workflow | Recent projects and new video flow read/write DB |
| M3a | Style read model | Home style chips and new-video style list read DB |
| M3b | Style Manager | Rename, rule enable/disable, rule delete, style delete, add style draft |
| M4 | Editor project and layout persistence | Title, sidebar state, divider, tracks, timeline load/save |
| M5 | Media import and probing | Import files, metadata, thumbnails, project asset attachment |
| M6a | Basic timeline item creation | Add Video, Text, Subtitles create/edit/delete/reload items |
| M6b | Catalog timeline item creation | Effects, Audio Effects, Background Music, Stickers, Transitions create/edit/delete/reload items |
| M7 | Auto-edit job v1 | Enabled steps generate visible timeline items with confirmation on recut |
| M8 | Subtitle and audio cleanup pipeline | `subtitle_segments` generated/edited; cleanup markers visible |
| M9 | Export v1 | Real FFmpeg local export creates `exports` row and file |
| M10a | Publishing title candidates | Generate/select persistent title candidates |
| M10b | Publishing cover assets | Master cover and per-platform crops persist |
| M10c | Platform drafts and scheduling | Platform posts and scheduled_at persist without external publish |
| M11 | Safety audit hardening | Confirmation event audit/debug view and policy checks |
| M12 | Future analytics/comments | Later module plan only |

## 5. Milestone Details

### M0: App Shell And Test Harness

Goal: make the static demo runnable through the chosen local app framework without changing UX.

Expected user paths:

- Open app → Home appears without sidebar.
- Click recent video → Editor appears with sidebar.
- Click Home in sidebar → returns to Home and sidebar disappears.
- Click Publishing in sidebar → Publishing view appears.

Validation:

| Field | Expected |
|---|---|
| Home sidebar | absent |
| Editor sidebar | present |
| Editor-only buttons on Home | absent |
| Editor-only buttons on Editor | present |
| Browser reload | returns to defined default route or preserved route, documented explicitly |

Non-goals: database, media, AI.

### M1: Schema, Seeds, Fixtures

Goal: create durable data foundation and test reset strategy.

Deliverables:

- Migration files for all MVP tables in the PRD table coverage matrix.
- Seed script for demo data.
- Reset script for test DB.
- Fixture media directory with small sample files.
- DB verifier that checks tables, primary keys, foreign keys, seed counts, and no PRD MVP table is missing.

Validation:

| Field | Expected |
|---|---|
| DB path | documented test DB path |
| Seed projects | exactly 3 recent projects matching Home seed |
| Seed styles | exactly 3 style profiles: 严肃、日常、幽默 |
| Catalog tables | effect/audio/music/text/sticker/transition catalogs exist |
| Future tables | either absent or marked `future_no_ui`, never required by MVP gates |
| Reset | running reset twice produces same counts |

Non-goals: UI reading DB.

### M2: Home Project Workflow

Goal: Home reads and writes real project data.

Deliverables:

- Recent video cards query `projects`.
- New Video modal creates `projects`, `project_assets`, `project_style_profiles`, `edit_steps`.
- Cancel creates no DB rows.

Validation:

| Case | Expected |
|---|---|
| Rename seed project in DB | Home card reflects renamed title after reload |
| Insert a new draft project | Home shows new recent card |
| Cancel new video modal | project count unchanged |
| Confirm new video | project count +1, default edit steps created |
| Resume project | Editor loads same project id |

Non-goals: real file probing may still use fixture metadata if M5 has not landed.

### M3a: Style Read Model

Goal: style data becomes real before full style editing.

Deliverables:

- Home style chips read `style_profiles`.
- New Video modal style picker reads enabled styles.

Validation:

| Case | Expected |
|---|---|
| Rename seeded style in DB | Home chip and modal option update |
| Soft delete a style in DB | It disappears from Home and modal |

Non-goals: style editing UI.

### M3b: Style Manager

Goal: full style management with confirmation logging.

Deliverables:

- Style list from DB.
- Style detail modal.
- Rename style.
- Enable/disable rules.
- Delete rule with `confirmation_events`.
- Add style from reference videos.
- Add missing style-level delete UI from PRD gap.

Validation:

| Case | Expected |
|---|---|
| Rename style | `style_profiles.name` changes and persists after reload |
| Disable rule | `style_rules.enabled = false` |
| Delete rule confirm | `style_rules.deleted_at` set and `confirmation_events` row created |
| Delete style confirm | `style_profiles.deleted_at` set and confirmation row created |
| Cancel delete | no deleted_at and no confirmed delete event |

Non-goals: real style ML analysis. New style can generate deterministic draft rules.

### M4: Editor Project And Layout Persistence

Goal: editor state becomes real.

Deliverables:

- Editable title updates `projects.title`.
- Divider writes `project_layout_preferences`.
- Tracks/items load from DB.
- Save persists.
- Undo/redo use `edit_history`.

Validation:

| Case | Expected |
|---|---|
| Edit title and save | title persists after reload |
| Move divider | layout heights persist after reload |
| Timeline seed | Video/Audio/Subtitles/Effects tracks render from DB |
| Update item | `timeline_items.updated_at` changes |
| Undo | previous item state restored |

Non-goals: media rendering.

### M5: Media Import And Probing

Goal: local video files become source assets.

Deliverables:

- File picker/drag import.
- Metadata probe: duration, width, height, codec/fps if available.
- Checksum dedupe.
- Thumbnail or frame preview.

Validation:

| Case | Expected |
|---|---|
| Import fixture video | one `source_assets` row with metadata |
| Import same file twice | no duplicate checksum row, or explicit duplicate policy row |
| Unsupported file | visible error and no source asset |
| Attach to project | `project_assets` row created |

Non-goals: timeline editing beyond attach.

### M6a: Basic Timeline Item Creation

Goal: first manual timeline operations.

Tabs:

- Add Video
- Text
- Subtitles

Subtitle source of truth:

- `subtitle_segments` stores subtitle text/time/language.
- `timeline_items` stores a linked subtitle item with `properties_json.subtitle_segment_ids` or equivalent reference.

Validation:

| Item type | Expected DB row | Track | Reload |
|---|---|---|---|
| video | `timeline_items.item_type = video` | Video | persists |
| text | `timeline_items.item_type = text` | Effects or Text logical lane | persists |
| subtitle | `subtitle_segments` + linked `timeline_items` | Subtitles | persists |

Every item must support edit, delete, and reload.

### M6b: Catalog Timeline Item Creation

Goal: remaining tabs create real timeline items from catalogs.

Tabs:

- Effects
- Audio Effects
- Background Music
- Stickers
- Transitions

Validation:

| Item type | Expected catalog | Expected timeline row |
|---|---|---|
| effect | `effect_presets` | `timeline_items.item_type = effect` |
| audio effect | `audio_presets` | `timeline_items.item_type = audio` |
| music | `music_assets` | `timeline_items.item_type = music` |
| sticker | `sticker_assets` | `timeline_items.item_type = sticker` |
| transition | `transition_presets` | `timeline_items.item_type = transition` |

Each item must include meaningful `properties_json`, edit/delete/reload validation, and correct track placement.

### M7: Auto-Edit Job V1

Goal: automatic editing creates inspectable generated timeline items.

Deliverables:

- Start auto-edit creates `jobs`.
- Enabled `edit_steps` control generated outputs.
- Recut confirmation writes `confirmation_events`.
- Generated items have `generated_by_job_id`.

Validation:

| Case | Expected |
|---|---|
| Disable subtitles step | no subtitle job output |
| Disable style step | no generated effect/sticker/text items |
| Confirm recut | confirmation row and new job |
| Cancel recut | no new job |
| Edit generated item | `manual_override = true` |

Eval requirement:

- For rule-based v1, use deterministic fixtures.
- For any LLM title/style/edit plan generation, define train/validation/test or leave-one-out before tuning.

### M8: Subtitle And Audio Cleanup Pipeline

Goal: first media intelligence pipeline.

Deliverables:

- Extract audio.
- Transcribe fixture media.
- Write `subtitle_segments`.
- Link subtitles to timeline items.
- Detect silence/long pause markers.

Validation:

| Case | Expected |
|---|---|
| Transcribe fixture | subtitle segment count matches expected fixture contract |
| Edit subtitle text | `subtitle_segments.text` persists |
| Delete subtitle item | link removed or item deleted without orphan policy violation |
| Silence marker | visible generated item/marker with time range |

Eval requirement:

- Define fixed fixture videos.
- Define expected transcript snippets and timing tolerance.
- Do not tune on held-out fixture.

### M9: Export V1

Goal: real local export.

Default target: real FFmpeg render.

If FFmpeg is unavailable, a temporary dev-only mock is allowed only with `exports.status = mock_rendered` and UI label `mock export`, never `ready`.

Validation:

| Case | Expected |
|---|---|
| Export real fixture timeline | `exports.status = ready` and file exists |
| Export failed | `exports.status = failed` and error visible |
| Timeline changed then export | output job reads latest timeline version |

Non-goals: upload to platform.

### M10a: Publishing Title Candidates

Goal: title tab becomes persistent.

Deliverables:

- Generate title candidates.
- Select title.
- Store rationale/platform target.

Validation:

| Case | Expected |
|---|---|
| Generate | multiple `title_candidates` rows |
| Select one | exactly one selected row per platform/project policy |
| Reload | selected title remains selected |

Eval requirement:

- Title generation needs a small fixed validation set before prompt tuning.

### M10b: Publishing Cover Assets

Goal: cover tab persists master cover and platform crops.

Deliverables:

- Master cover record.
- Per-platform `publish_assets`.
- Crop scale/x/y/text-size controls persist.

Validation:

| Platform | Expected ratio |
|---|---|
| Xiaohongshu | 3:4 |
| Bilibili | 16:10 |
| YouTube | 16:9 |
| Douyin | 9:16 |

Reload must preserve crop controls.

### M10c: Platform Drafts And Scheduling

Goal: platform selection and scheduling become real draft records.

Deliverables:

- Select platforms.
- Create `platform_posts`.
- Set `scheduled_at`.
- No external API call.

Validation:

| Case | Expected |
|---|---|
| Select Xiaohongshu + Bilibili | exactly two platform_posts |
| Unselect platform | draft removed or marked inactive by defined policy |
| Schedule time | `scheduled_at` persists |
| Attempt external publish | blocked unless future confirmation flow exists |

### M11: Safety Audit Hardening

Goal: make confirmation policy inspectable.

Deliverables:

- Debug/audit view or CLI for `confirmation_events`.
- Policy tests proving delete/recut/future publish/future reply cannot bypass confirmation.

Validation:

| Action | Expected confirmation |
|---|---|
| delete rule | required |
| delete style | required |
| recut | required |
| external publish | required |
| external reply | required |

### M12: Future Modules

Goal: plan only.

Analytics and comments start after publishing drafts are stable.

Future tables:

- `analytics_metrics`
- `comments`
- `reply_drafts`

Validation before future work starts:

- Platform posts exist.
- Platform account model exists.
- Confirmation policy exists.

## 6. Global Fixture And Reset Policy

Every implementation milestone must define:

| Item | Requirement |
|---|---|
| Test DB | Separate from user/dev DB |
| Reset | Deterministic reset command |
| Fixture media | Small local videos/audio committed or generated |
| Before/after DB diff | Required for write-path validation |
| Browser path | Required for user-facing UI |
| Negative case | Required for cancel/delete/unsupported flows |

No milestone may write validation rows into a user-visible production/dev database without a cleanup plan.

## 7. Recommended Build Order

| Order | Milestones |
|---|---|
| 1 | M0, M1 |
| 2 | M2, M3a |
| 3 | M3b, M4 |
| 4 | M5, M6a, M6b |
| 5 | M7, M8 |
| 6 | M9 |
| 7 | M10a, M10b, M10c |
| 8 | M11 |
| 9 | M12 future planning |

## 8. Start Gate

Before coding each milestone:

1. Write a milestone-specific expected outcome matrix.
2. Include browser actions, database expected rows/fields, reload checks, and negative checks.
3. Have the validator review the matrix.
4. Implement.
5. Validate through browser and DB.
6. Fix any failed field before marking complete.
