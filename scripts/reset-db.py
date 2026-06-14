#!/usr/bin/env python3
import json
import os
import shutil
import sqlite3
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB_PATH = REPO_ROOT / "data" / "automedia.sqlite3"
MIGRATION_PATH = REPO_ROOT / "db" / "migrations" / "001_initial_schema.sql"
FIXTURE_DIR = REPO_ROOT / "fixtures" / "media"
LIBRARY_DIR = REPO_ROOT / "data" / "library"
NOW = "2026-06-13T00:00:00Z"


PROJECTS = [
    ("project_adhd_vlog_01", "ADHD 教育实验 vlog 01", 18000, 72000, "asset_adhd_vlog_source"),
    ("project_ai_family_workflow", "AI 家庭 workflow 复盘", 0, 64000, "asset_ai_family_workflow_source"),
    ("project_reading_notes", "读书笔记短视频", 0, 58000, "asset_reading_notes_source"),
]

ASSETS = [
    (
        "asset_adhd_vlog_source",
        "video",
        "fixtures/media/adhd_vlog_source.txt",
        "adhd_vlog_source.txt",
        72000,
        1080,
        1920,
        "fixture-checksum-adhd-vlog",
        {"codec": "fixture", "fps": 30, "bitrate": 0, "fixture": True},
    ),
    (
        "asset_ai_family_workflow_source",
        "video",
        "fixtures/media/ai_family_workflow_source.txt",
        "ai_family_workflow_source.txt",
        64000,
        1080,
        1920,
        "fixture-checksum-ai-family",
        {"codec": "fixture", "fps": 30, "bitrate": 0, "fixture": True},
    ),
    (
        "asset_reading_notes_source",
        "video",
        "fixtures/media/reading_notes_source.txt",
        "reading_notes_source.txt",
        58000,
        1080,
        1920,
        "fixture-checksum-reading-notes",
        {"codec": "fixture", "fps": 30, "bitrate": 0, "fixture": True},
    ),
]

STYLES = [
    ("style_serious", "严肃", "观点型内容、低频特效、字幕清晰。"),
    ("style_daily", "日常", "生活片段、轻背景乐、柔和转场。"),
    ("style_funny", "幽默", "综艺标签、强调音效、快节奏切点。"),
]

STYLE_RULES = {
    "style_serious": [
        ("pacing", "保持中等语速，避免过度 jump cut", {"average_cut_seconds": 4.5}),
        ("subtitle", "中文主字幕居中偏下，关键词青绿色高亮", {"primary": "zh", "highlight": "teal"}),
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

TRACKS = [
    ("video", "Video"),
    ("audio", "Audio"),
    ("subtitles", "Subtitles"),
    ("effects", "Effects"),
]

EDIT_STEPS = [
    ("arrange_timeline", 1),
    ("clean_speech", 2),
    ("subtitles_bilingual", 3),
    ("apply_style_profile", 4),
]

PLATFORMS = [
    ("account_xiaohongshu_default", "xiaohongshu", "小红书账号", {"cover_ratio": "3:4"}),
    ("account_bilibili_default", "bilibili", "Bilibili账号", {"cover_ratio": "16:10"}),
    ("account_youtube_default", "youtube", "YouTube账号", {"cover_ratio": "16:9"}),
    ("account_douyin_default", "douyin", "抖音账号", {"cover_ratio": "9:16"}),
]


def db_path() -> Path:
    override = os.environ.get("AUTOMEDIA_DB_PATH")
    return Path(override).expanduser().resolve() if override else DEFAULT_DB_PATH


def dumps(value) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


def apply_migration(conn: sqlite3.Connection) -> None:
    conn.executescript(MIGRATION_PATH.read_text(encoding="utf-8"))
    conn.execute(
        "INSERT INTO schema_migrations(version, applied_at) VALUES (?, ?)",
        ("001_initial_schema", NOW),
    )


def insert_catalog(conn: sqlite3.Connection, table: str, key_column: str, rows) -> None:
    for index, (key, label, category, properties) in enumerate(rows, start=1):
        conn.execute(
            f"""
            INSERT INTO {table}
              (id, {key_column}, display_name, category, properties_json, sort_order, created_at, updated_at, deleted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
            """,
            (f"{table}_{key}", key, label, category, dumps(properties), index, NOW, NOW),
        )


def seed(conn: sqlite3.Connection) -> None:
    for asset in ASSETS:
        conn.execute(
            """
            INSERT INTO source_assets
              (id, asset_type, file_path, original_name, duration_ms, width, height, checksum, metadata_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (*asset[:8], dumps(asset[8]), NOW),
        )

    for project_id, title, playhead, duration, thumbnail_asset_id in PROJECTS:
        conn.execute(
            """
            INSERT INTO projects
              (id, title, status, thumbnail_asset_id, last_playhead_ms, duration_ms, created_at, updated_at, deleted_at)
            VALUES (?, ?, 'draft', ?, ?, ?, ?, ?, NULL)
            """,
            (project_id, title, thumbnail_asset_id, playhead, duration, NOW, NOW),
        )
        conn.execute(
            """
            INSERT INTO project_assets(project_id, asset_id, role, sort_order, created_at)
            VALUES (?, ?, 'source', 1, ?)
            """,
            (project_id, thumbnail_asset_id, NOW),
        )
        conn.execute(
            """
            INSERT INTO project_layout_preferences
              (project_id, video_panel_height, timeline_panel_height, sidebar_collapsed, updated_at)
            VALUES (?, 520, 260, 0, ?)
            """,
            (project_id, NOW),
        )
        for order, (track_type, name) in enumerate(TRACKS, start=1):
            conn.execute(
                """
                INSERT INTO timeline_tracks
                  (id, project_id, track_type, name, sort_order, is_visible, is_locked, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?)
                """,
                (f"track_{project_id}_{track_type}", project_id, track_type, name, order, NOW, NOW),
            )
        for step_key, order in EDIT_STEPS:
            conn.execute(
                """
                INSERT INTO edit_steps(id, project_id, step_key, enabled, sort_order, updated_at)
                VALUES (?, ?, ?, 1, ?, ?)
                """,
                (f"step_{project_id}_{step_key}", project_id, step_key, order, NOW),
            )

    for style_id, name, summary in STYLES:
        conn.execute(
            """
            INSERT INTO style_profiles(id, name, summary, created_at, updated_at, deleted_at)
            VALUES (?, ?, ?, ?, ?, NULL)
            """,
            (style_id, name, summary, NOW, NOW),
        )
        for index, (rule_type, rule_text, rule_json) in enumerate(STYLE_RULES[style_id], start=1):
            conn.execute(
                """
                INSERT INTO style_rules
                  (id, style_profile_id, rule_type, rule_text, rule_json, enabled, confidence, source, created_at, updated_at, deleted_at)
                VALUES (?, ?, ?, ?, ?, 1, 0.86, 'inferred', ?, ?, NULL)
                """,
                (f"rule_{style_id}_{index}", style_id, rule_type, rule_text, dumps(rule_json), NOW, NOW),
            )

    conn.execute(
        """
        INSERT INTO style_reference_videos(id, style_profile_id, asset_id, analysis_json, created_at)
        VALUES ('reference_style_daily_1', 'style_daily', 'asset_ai_family_workflow_source', ?, ?)
        """,
        (dumps({"fixture": True, "notes": "daily style reference"}), NOW),
    )

    style_by_project = [
        ("project_adhd_vlog_01", "style_funny"),
        ("project_ai_family_workflow", "style_daily"),
        ("project_reading_notes", "style_serious"),
    ]
    for project_id, style_id in style_by_project:
        conn.execute(
            """
            INSERT INTO project_style_profiles(project_id, style_profile_id, applied_at, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (project_id, style_id, NOW, NOW),
        )

    insert_catalog(
        conn,
        "effect_presets",
        "preset_key",
        [
            ("keyword_pop", "关键词弹出", "emphasis", {"duration_ms": 500}),
            ("soft_glow", "柔光强调", "emphasis", {"intensity": "low"}),
            ("frame_zoom", "画面轻推近", "motion", {"scale": 1.08}),
            ("variety_label", "综艺标签", "variety", {"style": "label"}),
        ],
    )
    insert_catalog(
        conn,
        "audio_presets",
        "preset_key",
        [
            ("pop", "Pop 音效", "emphasis", {"gain_db": -8}),
            ("whoosh", "转场 Whoosh", "transition", {"gain_db": -10}),
            ("ding", "提示 Ding", "emphasis", {"gain_db": -12}),
        ],
    )
    insert_catalog(
        conn,
        "text_templates",
        "template_key",
        [
            ("hook_title", "开头 Hook 标题", "title", {"font_size": 42}),
            ("keyword_badge", "关键词角标", "badge", {"font_size": 28}),
            ("summary_card", "结尾总结卡", "summary", {"font_size": 32}),
        ],
    )
    insert_catalog(
        conn,
        "transition_presets",
        "transition_key",
        [
            ("flash_white", "闪白转场", "flash", {"duration_ms": 180}),
            ("soft_crossfade", "柔和叠化", "fade", {"duration_ms": 300}),
            ("quick_push", "快速推入", "motion", {"duration_ms": 220}),
        ],
    )

    for index, (key, label, category, properties) in enumerate(
        [
            ("calm_loop", "轻柔日常背景", "daily", {"gain_db": -20}),
            ("focus_pulse", "观点强调节奏", "serious", {"gain_db": -22}),
            ("fun_bounce", "轻快综艺底乐", "funny", {"gain_db": -18}),
        ],
        start=1,
    ):
        conn.execute(
            """
            INSERT INTO music_assets
              (id, music_key, display_name, category, file_path, duration_ms, properties_json, sort_order, created_at, updated_at, deleted_at)
            VALUES (?, ?, ?, ?, NULL, 30000, ?, ?, ?, ?, NULL)
            """,
            (f"music_assets_{key}", key, label, category, dumps(properties), index, NOW, NOW),
        )

    for index, (key, label, category, properties) in enumerate(
        [
            ("spark", "灵感火花", "emphasis", {"color": "yellow"}),
            ("question", "问题气泡", "reaction", {"color": "cyan"}),
            ("check", "确认勾选", "marker", {"color": "green"}),
        ],
        start=1,
    ):
        conn.execute(
            """
            INSERT INTO sticker_assets
              (id, sticker_key, display_name, category, file_path, properties_json, sort_order, created_at, updated_at, deleted_at)
            VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, NULL)
            """,
            (f"sticker_assets_{key}", key, label, category, dumps(properties), index, NOW, NOW),
        )

    for account_id, platform_key, display_name, metadata in PLATFORMS:
        conn.execute(
            """
            INSERT INTO platform_accounts(id, platform_key, display_name, auth_status, metadata_json)
            VALUES (?, ?, ?, 'disconnected', ?)
            """,
            (account_id, platform_key, display_name, dumps(metadata)),
        )


def reset_database(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    for candidate in (path, Path(f"{path}-wal"), Path(f"{path}-shm"), Path(f"{path}-journal")):
        if candidate.exists():
            candidate.unlink()

    conn = sqlite3.connect(path)
    try:
        conn.execute("PRAGMA foreign_keys = ON")
        apply_migration(conn)
        seed(conn)
        conn.commit()
    finally:
        conn.close()
    if LIBRARY_DIR.exists():
        shutil.rmtree(LIBRARY_DIR)


def main() -> None:
    for fixture in FIXTURE_DIR.glob("*.txt"):
        if not fixture.is_file():
            raise SystemExit(f"Missing fixture file: {fixture}")

    path = db_path()
    reset_database(path)
    print(f"AutoMedia DB reset complete: {path}")


if __name__ == "__main__":
    main()
