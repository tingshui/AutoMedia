#!/usr/bin/env python3
import json
import sqlite3
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
DB_PATH = REPO_ROOT / "data" / "automedia.sqlite3"
RESET_SCRIPT = REPO_ROOT / "scripts" / "reset-db.py"
REPORT_PATH = REPO_ROOT / "docs" / "validation" / "automedia_m1_performance_report.md"
NOW = "2026-06-13T00:00:00Z"


def dumps(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


def project_rows():
    projects = [
        ("project_adhd_vlog_01", "ADHD 教育实验 vlog 01", "asset_adhd_vlog_source", 18000, 72000),
        ("project_ai_family_workflow", "AI 家庭 workflow 复盘", "asset_ai_family_workflow_source", 0, 64000),
        ("project_reading_notes", "读书笔记短视频", "asset_reading_notes_source", 0, 58000),
    ]
    return [
        {
            "id": project_id,
            "title": title,
            "status": "draft",
            "thumbnail_asset_id": thumbnail_asset_id,
            "last_playhead_ms": playhead,
            "duration_ms": duration,
            "created_at": NOW,
            "updated_at": NOW,
            "deleted_at": None,
        }
        for project_id, title, thumbnail_asset_id, playhead, duration in projects
    ]


def source_asset_rows():
    assets = [
        ("asset_adhd_vlog_source", "adhd_vlog_source.txt", 72000, "fixture-checksum-adhd-vlog"),
        ("asset_ai_family_workflow_source", "ai_family_workflow_source.txt", 64000, "fixture-checksum-ai-family"),
        ("asset_reading_notes_source", "reading_notes_source.txt", 58000, "fixture-checksum-reading-notes"),
    ]
    return [
        {
            "id": asset_id,
            "asset_type": "video",
            "file_path": f"fixtures/media/{filename}",
            "original_name": filename,
            "duration_ms": duration,
            "width": 1080,
            "height": 1920,
            "checksum": checksum,
            "metadata_json": dumps({"bitrate": 0, "codec": "fixture", "fixture": True, "fps": 30}),
            "created_at": NOW,
        }
        for asset_id, filename, duration, checksum in assets
    ]


def project_asset_rows():
    return [
        {"project_id": "project_adhd_vlog_01", "asset_id": "asset_adhd_vlog_source", "role": "source", "sort_order": 1, "created_at": NOW},
        {"project_id": "project_ai_family_workflow", "asset_id": "asset_ai_family_workflow_source", "role": "source", "sort_order": 1, "created_at": NOW},
        {"project_id": "project_reading_notes", "asset_id": "asset_reading_notes_source", "role": "source", "sort_order": 1, "created_at": NOW},
    ]


def project_layout_rows():
    return [
        {"project_id": row["id"], "video_panel_height": 520, "timeline_panel_height": 260, "sidebar_collapsed": 0, "updated_at": NOW}
        for row in project_rows()
    ]


def timeline_track_rows():
    tracks = [("video", "Video"), ("audio", "Audio"), ("subtitles", "Subtitles"), ("effects", "Effects")]
    rows = []
    for project in project_rows():
        for sort_order, (track_type, name) in enumerate(tracks, start=1):
            rows.append(
                {
                    "id": f"track_{project['id']}_{track_type}",
                    "project_id": project["id"],
                    "track_type": track_type,
                    "name": name,
                    "sort_order": sort_order,
                    "is_visible": 1,
                    "is_locked": 0,
                    "created_at": NOW,
                    "updated_at": NOW,
                }
            )
    return rows


def edit_step_rows():
    steps = ["arrange_timeline", "clean_speech", "subtitles_bilingual", "apply_style_profile"]
    rows = []
    for project in project_rows():
        for sort_order, step_key in enumerate(steps, start=1):
            rows.append(
                {
                    "id": f"step_{project['id']}_{step_key}",
                    "project_id": project["id"],
                    "step_key": step_key,
                    "enabled": 1,
                    "sort_order": sort_order,
                    "updated_at": NOW,
                }
            )
    return rows


def style_profile_rows():
    return [
        {"id": "style_serious", "name": "严肃", "summary": "观点型内容、低频特效、字幕清晰。", "created_at": NOW, "updated_at": NOW, "deleted_at": None},
        {"id": "style_daily", "name": "日常", "summary": "生活片段、轻背景乐、柔和转场。", "created_at": NOW, "updated_at": NOW, "deleted_at": None},
        {"id": "style_funny", "name": "幽默", "summary": "综艺标签、强调音效、快节奏切点。", "created_at": NOW, "updated_at": NOW, "deleted_at": None},
    ]


def style_rule_rows():
    rules = {
        "style_serious": [
            ("pacing", "保持中等语速，避免过度 jump cut", {"average_cut_seconds": 4.5}),
            ("subtitle", "中文主字幕居中偏下，关键词青绿色高亮", {"highlight": "teal", "primary": "zh"}),
            ("effect", "只在观点转折处使用轻量强调", {"intensity": "low"}),
        ],
        "style_daily": [
            ("pacing", "保留自然停顿，剪掉明显口误", {"average_cut_seconds": 5.2}),
            ("audio", "使用轻背景乐，音量低于人声", {"music_gain_db": -18}),
            ("transition", "使用柔和转场，不打断叙事", {"transition": "soft"}),
        ],
        "style_funny": [
            ("pacing", "快节奏切点，缩短空白停顿", {"average_cut_seconds": 2.8}),
            ("effect", "关键词处添加综艺标签", {"label_style": "variety"}),
            ("audio", "强调点使用短促音效", {"sound_effect": "pop"}),
        ],
    }
    rows = []
    for style_id, items in rules.items():
        for index, (rule_type, rule_text, rule_json) in enumerate(items, start=1):
            rows.append(
                {
                    "id": f"rule_{style_id}_{index}",
                    "style_profile_id": style_id,
                    "rule_type": rule_type,
                    "rule_text": rule_text,
                    "rule_json": dumps(rule_json),
                    "enabled": 1,
                    "confidence": 0.86,
                    "source": "inferred",
                    "created_at": NOW,
                    "updated_at": NOW,
                    "deleted_at": None,
                }
            )
    return rows


def catalog_rows(table, key_column, rows):
    return [
        {
            "id": f"{table}_{key}",
            key_column: key,
            "display_name": label,
            "category": category,
            "properties_json": dumps(properties),
            "sort_order": index,
            "created_at": NOW,
            "updated_at": NOW,
            "deleted_at": None,
        }
        for index, (key, label, category, properties) in enumerate(rows, start=1)
    ]


def expected_rows():
    empty = []
    expected = {
        "schema_migrations": [{"version": "001_initial_schema", "applied_at": NOW}],
        "projects": project_rows(),
        "source_assets": source_asset_rows(),
        "project_assets": project_asset_rows(),
        "project_layout_preferences": project_layout_rows(),
        "timeline_tracks": timeline_track_rows(),
        "timeline_items": empty,
        "edit_history": empty,
        "edit_steps": edit_step_rows(),
        "jobs": empty,
        "style_profiles": style_profile_rows(),
        "style_rules": style_rule_rows(),
        "style_reference_videos": [
            {
                "id": "reference_style_daily_1",
                "style_profile_id": "style_daily",
                "asset_id": "asset_ai_family_workflow_source",
                "analysis_json": dumps({"fixture": True, "notes": "daily style reference"}),
                "created_at": NOW,
            }
        ],
        "project_style_profiles": [
            {"project_id": "project_adhd_vlog_01", "style_profile_id": "style_funny", "applied_at": NOW, "created_at": NOW},
            {"project_id": "project_ai_family_workflow", "style_profile_id": "style_daily", "applied_at": NOW, "created_at": NOW},
            {"project_id": "project_reading_notes", "style_profile_id": "style_serious", "applied_at": NOW, "created_at": NOW},
        ],
        "effect_presets": catalog_rows(
            "effect_presets",
            "preset_key",
            [
                ("keyword_pop", "关键词弹出", "emphasis", {"duration_ms": 500}),
                ("soft_glow", "柔光强调", "emphasis", {"intensity": "low"}),
                ("frame_zoom", "画面轻推近", "motion", {"scale": 1.08}),
                ("variety_label", "综艺标签", "variety", {"style": "label"}),
            ],
        ),
        "audio_presets": catalog_rows(
            "audio_presets",
            "preset_key",
            [
                ("pop", "Pop 音效", "emphasis", {"gain_db": -8}),
                ("whoosh", "转场 Whoosh", "transition", {"gain_db": -10}),
                ("ding", "提示 Ding", "emphasis", {"gain_db": -12}),
            ],
        ),
        "subtitle_segments": empty,
        "music_assets": [
            {
                "id": f"music_assets_{key}",
                "music_key": key,
                "display_name": label,
                "category": category,
                "file_path": None,
                "duration_ms": 30000,
                "properties_json": dumps(properties),
                "sort_order": index,
                "created_at": NOW,
                "updated_at": NOW,
                "deleted_at": None,
            }
            for index, (key, label, category, properties) in enumerate(
                [
                    ("calm_loop", "轻柔日常背景", "daily", {"gain_db": -20}),
                    ("focus_pulse", "观点强调节奏", "serious", {"gain_db": -22}),
                    ("fun_bounce", "轻快综艺底乐", "funny", {"gain_db": -18}),
                ],
                start=1,
            )
        ],
        "text_templates": catalog_rows(
            "text_templates",
            "template_key",
            [
                ("hook_title", "开头 Hook 标题", "title", {"font_size": 42}),
                ("keyword_badge", "关键词角标", "badge", {"font_size": 28}),
                ("summary_card", "结尾总结卡", "summary", {"font_size": 32}),
            ],
        ),
        "sticker_assets": [
            {
                "id": f"sticker_assets_{key}",
                "sticker_key": key,
                "display_name": label,
                "category": category,
                "file_path": None,
                "properties_json": dumps(properties),
                "sort_order": index,
                "created_at": NOW,
                "updated_at": NOW,
                "deleted_at": None,
            }
            for index, (key, label, category, properties) in enumerate(
                [
                    ("spark", "灵感火花", "emphasis", {"color": "yellow"}),
                    ("question", "问题气泡", "reaction", {"color": "cyan"}),
                    ("check", "确认勾选", "marker", {"color": "green"}),
                ],
                start=1,
            )
        ],
        "transition_presets": catalog_rows(
            "transition_presets",
            "transition_key",
            [
                ("flash_white", "闪白转场", "flash", {"duration_ms": 180}),
                ("soft_crossfade", "柔和叠化", "fade", {"duration_ms": 300}),
                ("quick_push", "快速推入", "motion", {"duration_ms": 220}),
            ],
        ),
        "title_candidates": empty,
        "publish_assets": empty,
        "platform_accounts": [
            {"id": "account_xiaohongshu_default", "platform_key": "xiaohongshu", "display_name": "小红书账号", "auth_status": "disconnected", "metadata_json": dumps({"cover_ratio": "3:4"})},
            {"id": "account_bilibili_default", "platform_key": "bilibili", "display_name": "Bilibili账号", "auth_status": "disconnected", "metadata_json": dumps({"cover_ratio": "16:10"})},
            {"id": "account_youtube_default", "platform_key": "youtube", "display_name": "YouTube账号", "auth_status": "disconnected", "metadata_json": dumps({"cover_ratio": "16:9"})},
            {"id": "account_douyin_default", "platform_key": "douyin", "display_name": "抖音账号", "auth_status": "disconnected", "metadata_json": dumps({"cover_ratio": "9:16"})},
        ],
        "platform_posts": empty,
        "exports": empty,
        "confirmation_events": empty,
    }
    return expected


def sort_key(row):
    return json.dumps(row, ensure_ascii=False, sort_keys=True)


def actual_rows(conn, table, columns):
    rows = conn.execute(f"SELECT {', '.join(columns)} FROM {table}").fetchall()
    return [{column: row[column] for column in columns} for row in rows]


def compare_table(table, expected, actual):
    expected_sorted = sorted(expected, key=sort_key)
    actual_sorted = sorted(actual, key=sort_key)
    max_len = max(len(expected_sorted), len(actual_sorted))
    rows = []
    matches = 0
    for index in range(max_len):
        expected_row = expected_sorted[index] if index < len(expected_sorted) else None
        actual_row = actual_sorted[index] if index < len(actual_sorted) else None
        match = expected_row == actual_row
        if match:
            matches += 1
        rows.append((index + 1, expected_row, actual_row, match))
    return matches, max_len, rows


def main():
    subprocess.run([sys.executable, str(RESET_SCRIPT)], cwd=REPO_ROOT, check=True, capture_output=True, text=True)

    expected = expected_rows()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    lines = [
        "# AutoMedia M1 Database Performance Report",
        "",
        "Metric definition: one seeded row comparison is correct only when the expected row equals the actual SQLite row exactly after deterministic reset.",
        "",
    ]
    total_matches = 0
    total_rows = 0
    failures = []

    for table, expected_table_rows in expected.items():
        columns = list(expected_table_rows[0].keys()) if expected_table_rows else table_columns(conn, table)
        actual_table_rows = actual_rows(conn, table, columns)
        matches, row_count, comparisons = compare_table(table, expected_table_rows, actual_table_rows)
        total_matches += matches
        total_rows += row_count
        table_rate = 100.0 if row_count == 0 else matches / row_count * 100
        lines.extend(
            [
                f"## {table}",
                "",
                f"- expected_rows: {len(expected_table_rows)}",
                f"- actual_rows: {len(actual_table_rows)}",
                f"- matched_rows: {matches}",
                f"- accuracy: {table_rate:.2f}%",
                "",
                "| # | Expected | Actual | Match |",
                "|---:|---|---|---|",
            ]
        )
        if not comparisons:
            lines.append("| 0 | [] | [] | PASS |")
        for index, expected_row, actual_row, match in comparisons:
            if not match:
                failures.append((table, index, expected_row, actual_row))
            lines.append(
                f"| {index} | `{json.dumps(expected_row, ensure_ascii=False, sort_keys=True)}` | `{json.dumps(actual_row, ensure_ascii=False, sort_keys=True)}` | {'PASS' if match else 'FAIL'} |"
            )
        lines.append("")

    overall_rate = 100.0 if total_rows == 0 else total_matches / total_rows * 100
    summary = [
        "# AutoMedia M1 Database Performance Report",
        "",
        f"- total_compared_rows: {total_rows}",
        f"- matched_rows: {total_matches}",
        f"- failed_rows: {len(failures)}",
        f"- performance_rate: {overall_rate:.2f}%",
        f"- verdict: {'PASS' if overall_rate == 100.0 else 'FAIL'}",
        "",
    ]
    REPORT_PATH.write_text("\n".join(summary + lines[4:]), encoding="utf-8")
    print(f"AutoMedia M1 database performance rate: {overall_rate:.2f}%")
    print(f"Compared rows: {total_matches}/{total_rows}")
    print(f"Report: {REPORT_PATH}")
    if failures:
        for table, index, expected_row, actual_row in failures:
            print(f"FAIL {table} row {index}: expected={expected_row!r} actual={actual_row!r}", file=sys.stderr)
        raise SystemExit(1)


def table_columns(conn, table):
    return [row["name"] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()]


if __name__ == "__main__":
    main()
