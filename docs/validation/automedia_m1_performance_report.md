# AutoMedia M1 Database Performance Report

- total_compared_rows: 76
- matched_rows: 76
- failed_rows: 0
- performance_rate: 100.00%
- verdict: PASS

## schema_migrations

- expected_rows: 1
- actual_rows: 1
- matched_rows: 1
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"applied_at": "2026-06-13T00:00:00Z", "version": "001_initial_schema"}` | `{"applied_at": "2026-06-13T00:00:00Z", "version": "001_initial_schema"}` | PASS |

## projects

- expected_rows: 3
- actual_rows: 3
- matched_rows: 3
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "duration_ms": 58000, "id": "project_reading_notes", "last_playhead_ms": 0, "status": "draft", "thumbnail_asset_id": "asset_reading_notes_source", "title": "读书笔记短视频", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "duration_ms": 58000, "id": "project_reading_notes", "last_playhead_ms": 0, "status": "draft", "thumbnail_asset_id": "asset_reading_notes_source", "title": "读书笔记短视频", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 2 | `{"created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "duration_ms": 64000, "id": "project_ai_family_workflow", "last_playhead_ms": 0, "status": "draft", "thumbnail_asset_id": "asset_ai_family_workflow_source", "title": "AI 家庭 workflow 复盘", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "duration_ms": 64000, "id": "project_ai_family_workflow", "last_playhead_ms": 0, "status": "draft", "thumbnail_asset_id": "asset_ai_family_workflow_source", "title": "AI 家庭 workflow 复盘", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 3 | `{"created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "duration_ms": 72000, "id": "project_adhd_vlog_01", "last_playhead_ms": 18000, "status": "draft", "thumbnail_asset_id": "asset_adhd_vlog_source", "title": "ADHD 教育实验 vlog 01", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "duration_ms": 72000, "id": "project_adhd_vlog_01", "last_playhead_ms": 18000, "status": "draft", "thumbnail_asset_id": "asset_adhd_vlog_source", "title": "ADHD 教育实验 vlog 01", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |

## source_assets

- expected_rows: 3
- actual_rows: 3
- matched_rows: 3
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"asset_type": "video", "checksum": "fixture-checksum-adhd-vlog", "created_at": "2026-06-13T00:00:00Z", "duration_ms": 72000, "file_path": "fixtures/media/adhd_vlog_source.txt", "height": 1920, "id": "asset_adhd_vlog_source", "metadata_json": "{\"bitrate\": 0, \"codec\": \"fixture\", \"fixture\": true, \"fps\": 30}", "original_name": "adhd_vlog_source.txt", "width": 1080}` | `{"asset_type": "video", "checksum": "fixture-checksum-adhd-vlog", "created_at": "2026-06-13T00:00:00Z", "duration_ms": 72000, "file_path": "fixtures/media/adhd_vlog_source.txt", "height": 1920, "id": "asset_adhd_vlog_source", "metadata_json": "{\"bitrate\": 0, \"codec\": \"fixture\", \"fixture\": true, \"fps\": 30}", "original_name": "adhd_vlog_source.txt", "width": 1080}` | PASS |
| 2 | `{"asset_type": "video", "checksum": "fixture-checksum-ai-family", "created_at": "2026-06-13T00:00:00Z", "duration_ms": 64000, "file_path": "fixtures/media/ai_family_workflow_source.txt", "height": 1920, "id": "asset_ai_family_workflow_source", "metadata_json": "{\"bitrate\": 0, \"codec\": \"fixture\", \"fixture\": true, \"fps\": 30}", "original_name": "ai_family_workflow_source.txt", "width": 1080}` | `{"asset_type": "video", "checksum": "fixture-checksum-ai-family", "created_at": "2026-06-13T00:00:00Z", "duration_ms": 64000, "file_path": "fixtures/media/ai_family_workflow_source.txt", "height": 1920, "id": "asset_ai_family_workflow_source", "metadata_json": "{\"bitrate\": 0, \"codec\": \"fixture\", \"fixture\": true, \"fps\": 30}", "original_name": "ai_family_workflow_source.txt", "width": 1080}` | PASS |
| 3 | `{"asset_type": "video", "checksum": "fixture-checksum-reading-notes", "created_at": "2026-06-13T00:00:00Z", "duration_ms": 58000, "file_path": "fixtures/media/reading_notes_source.txt", "height": 1920, "id": "asset_reading_notes_source", "metadata_json": "{\"bitrate\": 0, \"codec\": \"fixture\", \"fixture\": true, \"fps\": 30}", "original_name": "reading_notes_source.txt", "width": 1080}` | `{"asset_type": "video", "checksum": "fixture-checksum-reading-notes", "created_at": "2026-06-13T00:00:00Z", "duration_ms": 58000, "file_path": "fixtures/media/reading_notes_source.txt", "height": 1920, "id": "asset_reading_notes_source", "metadata_json": "{\"bitrate\": 0, \"codec\": \"fixture\", \"fixture\": true, \"fps\": 30}", "original_name": "reading_notes_source.txt", "width": 1080}` | PASS |

## project_assets

- expected_rows: 3
- actual_rows: 3
- matched_rows: 3
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"asset_id": "asset_adhd_vlog_source", "created_at": "2026-06-13T00:00:00Z", "project_id": "project_adhd_vlog_01", "role": "source", "sort_order": 1}` | `{"asset_id": "asset_adhd_vlog_source", "created_at": "2026-06-13T00:00:00Z", "project_id": "project_adhd_vlog_01", "role": "source", "sort_order": 1}` | PASS |
| 2 | `{"asset_id": "asset_ai_family_workflow_source", "created_at": "2026-06-13T00:00:00Z", "project_id": "project_ai_family_workflow", "role": "source", "sort_order": 1}` | `{"asset_id": "asset_ai_family_workflow_source", "created_at": "2026-06-13T00:00:00Z", "project_id": "project_ai_family_workflow", "role": "source", "sort_order": 1}` | PASS |
| 3 | `{"asset_id": "asset_reading_notes_source", "created_at": "2026-06-13T00:00:00Z", "project_id": "project_reading_notes", "role": "source", "sort_order": 1}` | `{"asset_id": "asset_reading_notes_source", "created_at": "2026-06-13T00:00:00Z", "project_id": "project_reading_notes", "role": "source", "sort_order": 1}` | PASS |

## project_layout_preferences

- expected_rows: 3
- actual_rows: 3
- matched_rows: 3
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"project_id": "project_adhd_vlog_01", "sidebar_collapsed": 0, "timeline_panel_height": 260, "updated_at": "2026-06-13T00:00:00Z", "video_panel_height": 520}` | `{"project_id": "project_adhd_vlog_01", "sidebar_collapsed": 0, "timeline_panel_height": 260, "updated_at": "2026-06-13T00:00:00Z", "video_panel_height": 520}` | PASS |
| 2 | `{"project_id": "project_ai_family_workflow", "sidebar_collapsed": 0, "timeline_panel_height": 260, "updated_at": "2026-06-13T00:00:00Z", "video_panel_height": 520}` | `{"project_id": "project_ai_family_workflow", "sidebar_collapsed": 0, "timeline_panel_height": 260, "updated_at": "2026-06-13T00:00:00Z", "video_panel_height": 520}` | PASS |
| 3 | `{"project_id": "project_reading_notes", "sidebar_collapsed": 0, "timeline_panel_height": 260, "updated_at": "2026-06-13T00:00:00Z", "video_panel_height": 520}` | `{"project_id": "project_reading_notes", "sidebar_collapsed": 0, "timeline_panel_height": 260, "updated_at": "2026-06-13T00:00:00Z", "video_panel_height": 520}` | PASS |

## timeline_tracks

- expected_rows: 12
- actual_rows: 12
- matched_rows: 12
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_adhd_vlog_01_audio", "is_locked": 0, "is_visible": 1, "name": "Audio", "project_id": "project_adhd_vlog_01", "sort_order": 2, "track_type": "audio", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_adhd_vlog_01_audio", "is_locked": 0, "is_visible": 1, "name": "Audio", "project_id": "project_adhd_vlog_01", "sort_order": 2, "track_type": "audio", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 2 | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_adhd_vlog_01_effects", "is_locked": 0, "is_visible": 1, "name": "Effects", "project_id": "project_adhd_vlog_01", "sort_order": 4, "track_type": "effects", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_adhd_vlog_01_effects", "is_locked": 0, "is_visible": 1, "name": "Effects", "project_id": "project_adhd_vlog_01", "sort_order": 4, "track_type": "effects", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 3 | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_adhd_vlog_01_subtitles", "is_locked": 0, "is_visible": 1, "name": "Subtitles", "project_id": "project_adhd_vlog_01", "sort_order": 3, "track_type": "subtitles", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_adhd_vlog_01_subtitles", "is_locked": 0, "is_visible": 1, "name": "Subtitles", "project_id": "project_adhd_vlog_01", "sort_order": 3, "track_type": "subtitles", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 4 | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_adhd_vlog_01_video", "is_locked": 0, "is_visible": 1, "name": "Video", "project_id": "project_adhd_vlog_01", "sort_order": 1, "track_type": "video", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_adhd_vlog_01_video", "is_locked": 0, "is_visible": 1, "name": "Video", "project_id": "project_adhd_vlog_01", "sort_order": 1, "track_type": "video", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 5 | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_ai_family_workflow_audio", "is_locked": 0, "is_visible": 1, "name": "Audio", "project_id": "project_ai_family_workflow", "sort_order": 2, "track_type": "audio", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_ai_family_workflow_audio", "is_locked": 0, "is_visible": 1, "name": "Audio", "project_id": "project_ai_family_workflow", "sort_order": 2, "track_type": "audio", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 6 | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_ai_family_workflow_effects", "is_locked": 0, "is_visible": 1, "name": "Effects", "project_id": "project_ai_family_workflow", "sort_order": 4, "track_type": "effects", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_ai_family_workflow_effects", "is_locked": 0, "is_visible": 1, "name": "Effects", "project_id": "project_ai_family_workflow", "sort_order": 4, "track_type": "effects", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 7 | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_ai_family_workflow_subtitles", "is_locked": 0, "is_visible": 1, "name": "Subtitles", "project_id": "project_ai_family_workflow", "sort_order": 3, "track_type": "subtitles", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_ai_family_workflow_subtitles", "is_locked": 0, "is_visible": 1, "name": "Subtitles", "project_id": "project_ai_family_workflow", "sort_order": 3, "track_type": "subtitles", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 8 | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_ai_family_workflow_video", "is_locked": 0, "is_visible": 1, "name": "Video", "project_id": "project_ai_family_workflow", "sort_order": 1, "track_type": "video", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_ai_family_workflow_video", "is_locked": 0, "is_visible": 1, "name": "Video", "project_id": "project_ai_family_workflow", "sort_order": 1, "track_type": "video", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 9 | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_reading_notes_audio", "is_locked": 0, "is_visible": 1, "name": "Audio", "project_id": "project_reading_notes", "sort_order": 2, "track_type": "audio", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_reading_notes_audio", "is_locked": 0, "is_visible": 1, "name": "Audio", "project_id": "project_reading_notes", "sort_order": 2, "track_type": "audio", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 10 | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_reading_notes_effects", "is_locked": 0, "is_visible": 1, "name": "Effects", "project_id": "project_reading_notes", "sort_order": 4, "track_type": "effects", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_reading_notes_effects", "is_locked": 0, "is_visible": 1, "name": "Effects", "project_id": "project_reading_notes", "sort_order": 4, "track_type": "effects", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 11 | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_reading_notes_subtitles", "is_locked": 0, "is_visible": 1, "name": "Subtitles", "project_id": "project_reading_notes", "sort_order": 3, "track_type": "subtitles", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_reading_notes_subtitles", "is_locked": 0, "is_visible": 1, "name": "Subtitles", "project_id": "project_reading_notes", "sort_order": 3, "track_type": "subtitles", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 12 | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_reading_notes_video", "is_locked": 0, "is_visible": 1, "name": "Video", "project_id": "project_reading_notes", "sort_order": 1, "track_type": "video", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "id": "track_project_reading_notes_video", "is_locked": 0, "is_visible": 1, "name": "Video", "project_id": "project_reading_notes", "sort_order": 1, "track_type": "video", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |

## timeline_items

- expected_rows: 0
- actual_rows: 0
- matched_rows: 0
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 0 | [] | [] | PASS |

## edit_history

- expected_rows: 0
- actual_rows: 0
- matched_rows: 0
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 0 | [] | [] | PASS |

## edit_steps

- expected_rows: 12
- actual_rows: 12
- matched_rows: 12
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"enabled": 1, "id": "step_project_adhd_vlog_01_apply_style_profile", "project_id": "project_adhd_vlog_01", "sort_order": 4, "step_key": "apply_style_profile", "updated_at": "2026-06-13T00:00:00Z"}` | `{"enabled": 1, "id": "step_project_adhd_vlog_01_apply_style_profile", "project_id": "project_adhd_vlog_01", "sort_order": 4, "step_key": "apply_style_profile", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 2 | `{"enabled": 1, "id": "step_project_adhd_vlog_01_arrange_timeline", "project_id": "project_adhd_vlog_01", "sort_order": 1, "step_key": "arrange_timeline", "updated_at": "2026-06-13T00:00:00Z"}` | `{"enabled": 1, "id": "step_project_adhd_vlog_01_arrange_timeline", "project_id": "project_adhd_vlog_01", "sort_order": 1, "step_key": "arrange_timeline", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 3 | `{"enabled": 1, "id": "step_project_adhd_vlog_01_clean_speech", "project_id": "project_adhd_vlog_01", "sort_order": 2, "step_key": "clean_speech", "updated_at": "2026-06-13T00:00:00Z"}` | `{"enabled": 1, "id": "step_project_adhd_vlog_01_clean_speech", "project_id": "project_adhd_vlog_01", "sort_order": 2, "step_key": "clean_speech", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 4 | `{"enabled": 1, "id": "step_project_adhd_vlog_01_subtitles_bilingual", "project_id": "project_adhd_vlog_01", "sort_order": 3, "step_key": "subtitles_bilingual", "updated_at": "2026-06-13T00:00:00Z"}` | `{"enabled": 1, "id": "step_project_adhd_vlog_01_subtitles_bilingual", "project_id": "project_adhd_vlog_01", "sort_order": 3, "step_key": "subtitles_bilingual", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 5 | `{"enabled": 1, "id": "step_project_ai_family_workflow_apply_style_profile", "project_id": "project_ai_family_workflow", "sort_order": 4, "step_key": "apply_style_profile", "updated_at": "2026-06-13T00:00:00Z"}` | `{"enabled": 1, "id": "step_project_ai_family_workflow_apply_style_profile", "project_id": "project_ai_family_workflow", "sort_order": 4, "step_key": "apply_style_profile", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 6 | `{"enabled": 1, "id": "step_project_ai_family_workflow_arrange_timeline", "project_id": "project_ai_family_workflow", "sort_order": 1, "step_key": "arrange_timeline", "updated_at": "2026-06-13T00:00:00Z"}` | `{"enabled": 1, "id": "step_project_ai_family_workflow_arrange_timeline", "project_id": "project_ai_family_workflow", "sort_order": 1, "step_key": "arrange_timeline", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 7 | `{"enabled": 1, "id": "step_project_ai_family_workflow_clean_speech", "project_id": "project_ai_family_workflow", "sort_order": 2, "step_key": "clean_speech", "updated_at": "2026-06-13T00:00:00Z"}` | `{"enabled": 1, "id": "step_project_ai_family_workflow_clean_speech", "project_id": "project_ai_family_workflow", "sort_order": 2, "step_key": "clean_speech", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 8 | `{"enabled": 1, "id": "step_project_ai_family_workflow_subtitles_bilingual", "project_id": "project_ai_family_workflow", "sort_order": 3, "step_key": "subtitles_bilingual", "updated_at": "2026-06-13T00:00:00Z"}` | `{"enabled": 1, "id": "step_project_ai_family_workflow_subtitles_bilingual", "project_id": "project_ai_family_workflow", "sort_order": 3, "step_key": "subtitles_bilingual", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 9 | `{"enabled": 1, "id": "step_project_reading_notes_apply_style_profile", "project_id": "project_reading_notes", "sort_order": 4, "step_key": "apply_style_profile", "updated_at": "2026-06-13T00:00:00Z"}` | `{"enabled": 1, "id": "step_project_reading_notes_apply_style_profile", "project_id": "project_reading_notes", "sort_order": 4, "step_key": "apply_style_profile", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 10 | `{"enabled": 1, "id": "step_project_reading_notes_arrange_timeline", "project_id": "project_reading_notes", "sort_order": 1, "step_key": "arrange_timeline", "updated_at": "2026-06-13T00:00:00Z"}` | `{"enabled": 1, "id": "step_project_reading_notes_arrange_timeline", "project_id": "project_reading_notes", "sort_order": 1, "step_key": "arrange_timeline", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 11 | `{"enabled": 1, "id": "step_project_reading_notes_clean_speech", "project_id": "project_reading_notes", "sort_order": 2, "step_key": "clean_speech", "updated_at": "2026-06-13T00:00:00Z"}` | `{"enabled": 1, "id": "step_project_reading_notes_clean_speech", "project_id": "project_reading_notes", "sort_order": 2, "step_key": "clean_speech", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 12 | `{"enabled": 1, "id": "step_project_reading_notes_subtitles_bilingual", "project_id": "project_reading_notes", "sort_order": 3, "step_key": "subtitles_bilingual", "updated_at": "2026-06-13T00:00:00Z"}` | `{"enabled": 1, "id": "step_project_reading_notes_subtitles_bilingual", "project_id": "project_reading_notes", "sort_order": 3, "step_key": "subtitles_bilingual", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |

## jobs

- expected_rows: 0
- actual_rows: 0
- matched_rows: 0
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 0 | [] | [] | PASS |

## style_profiles

- expected_rows: 3
- actual_rows: 3
- matched_rows: 3
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "id": "style_daily", "name": "日常", "summary": "生活片段、轻背景乐、柔和转场。", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "id": "style_daily", "name": "日常", "summary": "生活片段、轻背景乐、柔和转场。", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 2 | `{"created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "id": "style_funny", "name": "幽默", "summary": "综艺标签、强调音效、快节奏切点。", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "id": "style_funny", "name": "幽默", "summary": "综艺标签、强调音效、快节奏切点。", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 3 | `{"created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "id": "style_serious", "name": "严肃", "summary": "观点型内容、低频特效、字幕清晰。", "updated_at": "2026-06-13T00:00:00Z"}` | `{"created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "id": "style_serious", "name": "严肃", "summary": "观点型内容、低频特效、字幕清晰。", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |

## style_rules

- expected_rows: 9
- actual_rows: 9
- matched_rows: 9
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_daily_1", "rule_json": "{\"average_cut_seconds\": 5.2}", "rule_text": "保留自然停顿，剪掉明显口误", "rule_type": "pacing", "source": "inferred", "style_profile_id": "style_daily", "updated_at": "2026-06-13T00:00:00Z"}` | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_daily_1", "rule_json": "{\"average_cut_seconds\": 5.2}", "rule_text": "保留自然停顿，剪掉明显口误", "rule_type": "pacing", "source": "inferred", "style_profile_id": "style_daily", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 2 | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_daily_2", "rule_json": "{\"music_gain_db\": -18}", "rule_text": "使用轻背景乐，音量低于人声", "rule_type": "audio", "source": "inferred", "style_profile_id": "style_daily", "updated_at": "2026-06-13T00:00:00Z"}` | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_daily_2", "rule_json": "{\"music_gain_db\": -18}", "rule_text": "使用轻背景乐，音量低于人声", "rule_type": "audio", "source": "inferred", "style_profile_id": "style_daily", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 3 | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_daily_3", "rule_json": "{\"transition\": \"soft\"}", "rule_text": "使用柔和转场，不打断叙事", "rule_type": "transition", "source": "inferred", "style_profile_id": "style_daily", "updated_at": "2026-06-13T00:00:00Z"}` | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_daily_3", "rule_json": "{\"transition\": \"soft\"}", "rule_text": "使用柔和转场，不打断叙事", "rule_type": "transition", "source": "inferred", "style_profile_id": "style_daily", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 4 | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_funny_1", "rule_json": "{\"average_cut_seconds\": 2.8}", "rule_text": "快节奏切点，缩短空白停顿", "rule_type": "pacing", "source": "inferred", "style_profile_id": "style_funny", "updated_at": "2026-06-13T00:00:00Z"}` | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_funny_1", "rule_json": "{\"average_cut_seconds\": 2.8}", "rule_text": "快节奏切点，缩短空白停顿", "rule_type": "pacing", "source": "inferred", "style_profile_id": "style_funny", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 5 | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_funny_2", "rule_json": "{\"label_style\": \"variety\"}", "rule_text": "关键词处添加综艺标签", "rule_type": "effect", "source": "inferred", "style_profile_id": "style_funny", "updated_at": "2026-06-13T00:00:00Z"}` | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_funny_2", "rule_json": "{\"label_style\": \"variety\"}", "rule_text": "关键词处添加综艺标签", "rule_type": "effect", "source": "inferred", "style_profile_id": "style_funny", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 6 | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_funny_3", "rule_json": "{\"sound_effect\": \"pop\"}", "rule_text": "强调点使用短促音效", "rule_type": "audio", "source": "inferred", "style_profile_id": "style_funny", "updated_at": "2026-06-13T00:00:00Z"}` | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_funny_3", "rule_json": "{\"sound_effect\": \"pop\"}", "rule_text": "强调点使用短促音效", "rule_type": "audio", "source": "inferred", "style_profile_id": "style_funny", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 7 | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_serious_1", "rule_json": "{\"average_cut_seconds\": 4.5}", "rule_text": "保持中等语速，避免过度 jump cut", "rule_type": "pacing", "source": "inferred", "style_profile_id": "style_serious", "updated_at": "2026-06-13T00:00:00Z"}` | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_serious_1", "rule_json": "{\"average_cut_seconds\": 4.5}", "rule_text": "保持中等语速，避免过度 jump cut", "rule_type": "pacing", "source": "inferred", "style_profile_id": "style_serious", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 8 | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_serious_2", "rule_json": "{\"highlight\": \"teal\", \"primary\": \"zh\"}", "rule_text": "中文主字幕居中偏下，关键词青绿色高亮", "rule_type": "subtitle", "source": "inferred", "style_profile_id": "style_serious", "updated_at": "2026-06-13T00:00:00Z"}` | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_serious_2", "rule_json": "{\"highlight\": \"teal\", \"primary\": \"zh\"}", "rule_text": "中文主字幕居中偏下，关键词青绿色高亮", "rule_type": "subtitle", "source": "inferred", "style_profile_id": "style_serious", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 9 | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_serious_3", "rule_json": "{\"intensity\": \"low\"}", "rule_text": "只在观点转折处使用轻量强调", "rule_type": "effect", "source": "inferred", "style_profile_id": "style_serious", "updated_at": "2026-06-13T00:00:00Z"}` | `{"confidence": 0.86, "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "enabled": 1, "id": "rule_style_serious_3", "rule_json": "{\"intensity\": \"low\"}", "rule_text": "只在观点转折处使用轻量强调", "rule_type": "effect", "source": "inferred", "style_profile_id": "style_serious", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |

## style_reference_videos

- expected_rows: 1
- actual_rows: 1
- matched_rows: 1
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"analysis_json": "{\"fixture\": true, \"notes\": \"daily style reference\"}", "asset_id": "asset_ai_family_workflow_source", "created_at": "2026-06-13T00:00:00Z", "id": "reference_style_daily_1", "style_profile_id": "style_daily"}` | `{"analysis_json": "{\"fixture\": true, \"notes\": \"daily style reference\"}", "asset_id": "asset_ai_family_workflow_source", "created_at": "2026-06-13T00:00:00Z", "id": "reference_style_daily_1", "style_profile_id": "style_daily"}` | PASS |

## project_style_profiles

- expected_rows: 3
- actual_rows: 3
- matched_rows: 3
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"applied_at": "2026-06-13T00:00:00Z", "created_at": "2026-06-13T00:00:00Z", "project_id": "project_adhd_vlog_01", "style_profile_id": "style_funny"}` | `{"applied_at": "2026-06-13T00:00:00Z", "created_at": "2026-06-13T00:00:00Z", "project_id": "project_adhd_vlog_01", "style_profile_id": "style_funny"}` | PASS |
| 2 | `{"applied_at": "2026-06-13T00:00:00Z", "created_at": "2026-06-13T00:00:00Z", "project_id": "project_ai_family_workflow", "style_profile_id": "style_daily"}` | `{"applied_at": "2026-06-13T00:00:00Z", "created_at": "2026-06-13T00:00:00Z", "project_id": "project_ai_family_workflow", "style_profile_id": "style_daily"}` | PASS |
| 3 | `{"applied_at": "2026-06-13T00:00:00Z", "created_at": "2026-06-13T00:00:00Z", "project_id": "project_reading_notes", "style_profile_id": "style_serious"}` | `{"applied_at": "2026-06-13T00:00:00Z", "created_at": "2026-06-13T00:00:00Z", "project_id": "project_reading_notes", "style_profile_id": "style_serious"}` | PASS |

## effect_presets

- expected_rows: 4
- actual_rows: 4
- matched_rows: 4
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"category": "emphasis", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "关键词弹出", "id": "effect_presets_keyword_pop", "preset_key": "keyword_pop", "properties_json": "{\"duration_ms\": 500}", "sort_order": 1, "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "emphasis", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "关键词弹出", "id": "effect_presets_keyword_pop", "preset_key": "keyword_pop", "properties_json": "{\"duration_ms\": 500}", "sort_order": 1, "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 2 | `{"category": "emphasis", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "柔光强调", "id": "effect_presets_soft_glow", "preset_key": "soft_glow", "properties_json": "{\"intensity\": \"low\"}", "sort_order": 2, "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "emphasis", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "柔光强调", "id": "effect_presets_soft_glow", "preset_key": "soft_glow", "properties_json": "{\"intensity\": \"low\"}", "sort_order": 2, "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 3 | `{"category": "motion", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "画面轻推近", "id": "effect_presets_frame_zoom", "preset_key": "frame_zoom", "properties_json": "{\"scale\": 1.08}", "sort_order": 3, "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "motion", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "画面轻推近", "id": "effect_presets_frame_zoom", "preset_key": "frame_zoom", "properties_json": "{\"scale\": 1.08}", "sort_order": 3, "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 4 | `{"category": "variety", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "综艺标签", "id": "effect_presets_variety_label", "preset_key": "variety_label", "properties_json": "{\"style\": \"label\"}", "sort_order": 4, "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "variety", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "综艺标签", "id": "effect_presets_variety_label", "preset_key": "variety_label", "properties_json": "{\"style\": \"label\"}", "sort_order": 4, "updated_at": "2026-06-13T00:00:00Z"}` | PASS |

## audio_presets

- expected_rows: 3
- actual_rows: 3
- matched_rows: 3
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"category": "emphasis", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "Pop 音效", "id": "audio_presets_pop", "preset_key": "pop", "properties_json": "{\"gain_db\": -8}", "sort_order": 1, "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "emphasis", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "Pop 音效", "id": "audio_presets_pop", "preset_key": "pop", "properties_json": "{\"gain_db\": -8}", "sort_order": 1, "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 2 | `{"category": "emphasis", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "提示 Ding", "id": "audio_presets_ding", "preset_key": "ding", "properties_json": "{\"gain_db\": -12}", "sort_order": 3, "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "emphasis", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "提示 Ding", "id": "audio_presets_ding", "preset_key": "ding", "properties_json": "{\"gain_db\": -12}", "sort_order": 3, "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 3 | `{"category": "transition", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "转场 Whoosh", "id": "audio_presets_whoosh", "preset_key": "whoosh", "properties_json": "{\"gain_db\": -10}", "sort_order": 2, "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "transition", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "转场 Whoosh", "id": "audio_presets_whoosh", "preset_key": "whoosh", "properties_json": "{\"gain_db\": -10}", "sort_order": 2, "updated_at": "2026-06-13T00:00:00Z"}` | PASS |

## subtitle_segments

- expected_rows: 0
- actual_rows: 0
- matched_rows: 0
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 0 | [] | [] | PASS |

## music_assets

- expected_rows: 3
- actual_rows: 3
- matched_rows: 3
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"category": "daily", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "轻柔日常背景", "duration_ms": 30000, "file_path": null, "id": "music_assets_calm_loop", "music_key": "calm_loop", "properties_json": "{\"gain_db\": -20}", "sort_order": 1, "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "daily", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "轻柔日常背景", "duration_ms": 30000, "file_path": null, "id": "music_assets_calm_loop", "music_key": "calm_loop", "properties_json": "{\"gain_db\": -20}", "sort_order": 1, "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 2 | `{"category": "funny", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "轻快综艺底乐", "duration_ms": 30000, "file_path": null, "id": "music_assets_fun_bounce", "music_key": "fun_bounce", "properties_json": "{\"gain_db\": -18}", "sort_order": 3, "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "funny", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "轻快综艺底乐", "duration_ms": 30000, "file_path": null, "id": "music_assets_fun_bounce", "music_key": "fun_bounce", "properties_json": "{\"gain_db\": -18}", "sort_order": 3, "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 3 | `{"category": "serious", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "观点强调节奏", "duration_ms": 30000, "file_path": null, "id": "music_assets_focus_pulse", "music_key": "focus_pulse", "properties_json": "{\"gain_db\": -22}", "sort_order": 2, "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "serious", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "观点强调节奏", "duration_ms": 30000, "file_path": null, "id": "music_assets_focus_pulse", "music_key": "focus_pulse", "properties_json": "{\"gain_db\": -22}", "sort_order": 2, "updated_at": "2026-06-13T00:00:00Z"}` | PASS |

## text_templates

- expected_rows: 3
- actual_rows: 3
- matched_rows: 3
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"category": "badge", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "关键词角标", "id": "text_templates_keyword_badge", "properties_json": "{\"font_size\": 28}", "sort_order": 2, "template_key": "keyword_badge", "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "badge", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "关键词角标", "id": "text_templates_keyword_badge", "properties_json": "{\"font_size\": 28}", "sort_order": 2, "template_key": "keyword_badge", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 2 | `{"category": "summary", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "结尾总结卡", "id": "text_templates_summary_card", "properties_json": "{\"font_size\": 32}", "sort_order": 3, "template_key": "summary_card", "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "summary", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "结尾总结卡", "id": "text_templates_summary_card", "properties_json": "{\"font_size\": 32}", "sort_order": 3, "template_key": "summary_card", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 3 | `{"category": "title", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "开头 Hook 标题", "id": "text_templates_hook_title", "properties_json": "{\"font_size\": 42}", "sort_order": 1, "template_key": "hook_title", "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "title", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "开头 Hook 标题", "id": "text_templates_hook_title", "properties_json": "{\"font_size\": 42}", "sort_order": 1, "template_key": "hook_title", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |

## sticker_assets

- expected_rows: 3
- actual_rows: 3
- matched_rows: 3
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"category": "emphasis", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "灵感火花", "file_path": null, "id": "sticker_assets_spark", "properties_json": "{\"color\": \"yellow\"}", "sort_order": 1, "sticker_key": "spark", "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "emphasis", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "灵感火花", "file_path": null, "id": "sticker_assets_spark", "properties_json": "{\"color\": \"yellow\"}", "sort_order": 1, "sticker_key": "spark", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 2 | `{"category": "marker", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "确认勾选", "file_path": null, "id": "sticker_assets_check", "properties_json": "{\"color\": \"green\"}", "sort_order": 3, "sticker_key": "check", "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "marker", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "确认勾选", "file_path": null, "id": "sticker_assets_check", "properties_json": "{\"color\": \"green\"}", "sort_order": 3, "sticker_key": "check", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 3 | `{"category": "reaction", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "问题气泡", "file_path": null, "id": "sticker_assets_question", "properties_json": "{\"color\": \"cyan\"}", "sort_order": 2, "sticker_key": "question", "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "reaction", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "问题气泡", "file_path": null, "id": "sticker_assets_question", "properties_json": "{\"color\": \"cyan\"}", "sort_order": 2, "sticker_key": "question", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |

## transition_presets

- expected_rows: 3
- actual_rows: 3
- matched_rows: 3
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"category": "fade", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "柔和叠化", "id": "transition_presets_soft_crossfade", "properties_json": "{\"duration_ms\": 300}", "sort_order": 2, "transition_key": "soft_crossfade", "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "fade", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "柔和叠化", "id": "transition_presets_soft_crossfade", "properties_json": "{\"duration_ms\": 300}", "sort_order": 2, "transition_key": "soft_crossfade", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 2 | `{"category": "flash", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "闪白转场", "id": "transition_presets_flash_white", "properties_json": "{\"duration_ms\": 180}", "sort_order": 1, "transition_key": "flash_white", "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "flash", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "闪白转场", "id": "transition_presets_flash_white", "properties_json": "{\"duration_ms\": 180}", "sort_order": 1, "transition_key": "flash_white", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |
| 3 | `{"category": "motion", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "快速推入", "id": "transition_presets_quick_push", "properties_json": "{\"duration_ms\": 220}", "sort_order": 3, "transition_key": "quick_push", "updated_at": "2026-06-13T00:00:00Z"}` | `{"category": "motion", "created_at": "2026-06-13T00:00:00Z", "deleted_at": null, "display_name": "快速推入", "id": "transition_presets_quick_push", "properties_json": "{\"duration_ms\": 220}", "sort_order": 3, "transition_key": "quick_push", "updated_at": "2026-06-13T00:00:00Z"}` | PASS |

## title_candidates

- expected_rows: 0
- actual_rows: 0
- matched_rows: 0
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 0 | [] | [] | PASS |

## publish_assets

- expected_rows: 0
- actual_rows: 0
- matched_rows: 0
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 0 | [] | [] | PASS |

## platform_accounts

- expected_rows: 4
- actual_rows: 4
- matched_rows: 4
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 1 | `{"auth_status": "disconnected", "display_name": "Bilibili账号", "id": "account_bilibili_default", "metadata_json": "{\"cover_ratio\": \"16:10\"}", "platform_key": "bilibili"}` | `{"auth_status": "disconnected", "display_name": "Bilibili账号", "id": "account_bilibili_default", "metadata_json": "{\"cover_ratio\": \"16:10\"}", "platform_key": "bilibili"}` | PASS |
| 2 | `{"auth_status": "disconnected", "display_name": "YouTube账号", "id": "account_youtube_default", "metadata_json": "{\"cover_ratio\": \"16:9\"}", "platform_key": "youtube"}` | `{"auth_status": "disconnected", "display_name": "YouTube账号", "id": "account_youtube_default", "metadata_json": "{\"cover_ratio\": \"16:9\"}", "platform_key": "youtube"}` | PASS |
| 3 | `{"auth_status": "disconnected", "display_name": "小红书账号", "id": "account_xiaohongshu_default", "metadata_json": "{\"cover_ratio\": \"3:4\"}", "platform_key": "xiaohongshu"}` | `{"auth_status": "disconnected", "display_name": "小红书账号", "id": "account_xiaohongshu_default", "metadata_json": "{\"cover_ratio\": \"3:4\"}", "platform_key": "xiaohongshu"}` | PASS |
| 4 | `{"auth_status": "disconnected", "display_name": "抖音账号", "id": "account_douyin_default", "metadata_json": "{\"cover_ratio\": \"9:16\"}", "platform_key": "douyin"}` | `{"auth_status": "disconnected", "display_name": "抖音账号", "id": "account_douyin_default", "metadata_json": "{\"cover_ratio\": \"9:16\"}", "platform_key": "douyin"}` | PASS |

## platform_posts

- expected_rows: 0
- actual_rows: 0
- matched_rows: 0
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 0 | [] | [] | PASS |

## exports

- expected_rows: 0
- actual_rows: 0
- matched_rows: 0
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 0 | [] | [] | PASS |

## confirmation_events

- expected_rows: 0
- actual_rows: 0
- matched_rows: 0
- accuracy: 100.00%

| # | Expected | Actual | Match |
|---:|---|---|---|
| 0 | [] | [] | PASS |
