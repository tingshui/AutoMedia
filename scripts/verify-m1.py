#!/usr/bin/env python3
import json
import os
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
DB_PATH = REPO_ROOT / "data" / "automedia.sqlite3"
RESET_SCRIPT = REPO_ROOT / "scripts" / "reset-db.py"
FIXTURE_DIR = REPO_ROOT / "fixtures" / "media"

EXPECTED_COLUMNS = {
    "schema_migrations": ["version", "applied_at"],
    "projects": ["id", "title", "status", "thumbnail_asset_id", "last_playhead_ms", "duration_ms", "created_at", "updated_at", "deleted_at"],
    "source_assets": ["id", "asset_type", "file_path", "original_name", "duration_ms", "width", "height", "checksum", "metadata_json", "created_at"],
    "project_assets": ["project_id", "asset_id", "role", "sort_order", "created_at"],
    "project_layout_preferences": ["project_id", "video_panel_height", "timeline_panel_height", "sidebar_collapsed", "updated_at"],
    "timeline_tracks": ["id", "project_id", "track_type", "name", "sort_order", "is_visible", "is_locked", "created_at", "updated_at"],
    "timeline_items": ["id", "project_id", "track_id", "item_type", "source_asset_id", "start_ms", "end_ms", "duration_ms", "source_start_ms", "source_end_ms", "properties_json", "generated_by_job_id", "manual_override", "is_muted", "is_locked", "created_at", "updated_at", "deleted_at"],
    "edit_history": ["id", "project_id", "operation_type", "before_json", "after_json", "created_at"],
    "edit_steps": ["id", "project_id", "step_key", "enabled", "sort_order", "updated_at"],
    "jobs": ["id", "project_id", "job_type", "status", "input_json", "output_json", "error_json", "created_at", "updated_at"],
    "style_profiles": ["id", "name", "summary", "created_at", "updated_at", "deleted_at"],
    "style_rules": ["id", "style_profile_id", "rule_type", "rule_text", "rule_json", "enabled", "confidence", "source", "created_at", "updated_at", "deleted_at"],
    "style_reference_videos": ["id", "style_profile_id", "asset_id", "analysis_json", "created_at"],
    "project_style_profiles": ["project_id", "style_profile_id", "applied_at", "created_at"],
    "effect_presets": ["id", "preset_key", "display_name", "category", "properties_json", "sort_order", "created_at", "updated_at", "deleted_at"],
    "audio_presets": ["id", "preset_key", "display_name", "category", "properties_json", "sort_order", "created_at", "updated_at", "deleted_at"],
    "subtitle_segments": ["id", "project_id", "timeline_item_id", "language", "text", "start_ms", "end_ms", "style_json", "created_at", "updated_at", "deleted_at"],
    "music_assets": ["id", "music_key", "display_name", "category", "file_path", "duration_ms", "properties_json", "sort_order", "created_at", "updated_at", "deleted_at"],
    "text_templates": ["id", "template_key", "display_name", "category", "properties_json", "sort_order", "created_at", "updated_at", "deleted_at"],
    "sticker_assets": ["id", "sticker_key", "display_name", "category", "file_path", "properties_json", "sort_order", "created_at", "updated_at", "deleted_at"],
    "transition_presets": ["id", "transition_key", "display_name", "category", "properties_json", "sort_order", "created_at", "updated_at", "deleted_at"],
    "title_candidates": ["id", "project_id", "platform_key", "title", "rationale", "is_selected"],
    "publish_assets": ["id", "project_id", "asset_type", "platform_key", "file_path", "aspect_ratio", "crop_json", "cover_text_json", "created_at"],
    "platform_accounts": ["id", "platform_key", "display_name", "auth_status", "metadata_json"],
    "platform_posts": ["id", "project_id", "platform_key", "account_id", "title_candidate_id", "publish_asset_id", "description", "tags_json", "scheduled_at", "status", "external_post_id", "created_at", "updated_at"],
    "exports": ["id", "project_id", "job_id", "file_path", "format", "resolution", "status", "created_at", "updated_at"],
    "confirmation_events": ["id", "project_id", "target_type", "target_id", "action", "decision", "created_at"],
}

EXPECTED_TABLES = set(EXPECTED_COLUMNS)
FUTURE_TABLES = {"analytics_metrics", "comments", "reply_drafts"}
EXPECTED_PROJECT_TITLES = ["ADHD 教育实验 vlog 01", "AI 家庭 workflow 复盘", "读书笔记短视频"]
EXPECTED_STYLE_NAMES = ["严肃", "日常", "幽默"]
EXPECTED_PLATFORM_KEYS = ["bilibili", "douyin", "xiaohongshu", "youtube"]
JSON_COLUMNS = {
    "source_assets": ["metadata_json"],
    "timeline_items": ["properties_json"],
    "edit_history": ["before_json", "after_json"],
    "jobs": ["input_json", "output_json", "error_json"],
    "style_rules": ["rule_json"],
    "style_reference_videos": ["analysis_json"],
    "effect_presets": ["properties_json"],
    "audio_presets": ["properties_json"],
    "subtitle_segments": ["style_json"],
    "music_assets": ["properties_json"],
    "text_templates": ["properties_json"],
    "sticker_assets": ["properties_json"],
    "transition_presets": ["properties_json"],
    "publish_assets": ["crop_json", "cover_text_json"],
    "platform_accounts": ["metadata_json"],
    "platform_posts": ["tags_json"],
}
EXPECTED_FKS = {
    ("projects", "thumbnail_asset_id", "source_assets", "id"),
    ("project_assets", "project_id", "projects", "id"),
    ("project_assets", "asset_id", "source_assets", "id"),
    ("project_layout_preferences", "project_id", "projects", "id"),
    ("timeline_tracks", "project_id", "projects", "id"),
    ("timeline_items", "project_id", "projects", "id"),
    ("timeline_items", "track_id", "timeline_tracks", "id"),
    ("timeline_items", "source_asset_id", "source_assets", "id"),
    ("timeline_items", "generated_by_job_id", "jobs", "id"),
    ("edit_history", "project_id", "projects", "id"),
    ("edit_steps", "project_id", "projects", "id"),
    ("jobs", "project_id", "projects", "id"),
    ("style_rules", "style_profile_id", "style_profiles", "id"),
    ("style_reference_videos", "style_profile_id", "style_profiles", "id"),
    ("style_reference_videos", "asset_id", "source_assets", "id"),
    ("project_style_profiles", "project_id", "projects", "id"),
    ("project_style_profiles", "style_profile_id", "style_profiles", "id"),
    ("subtitle_segments", "project_id", "projects", "id"),
    ("subtitle_segments", "timeline_item_id", "timeline_items", "id"),
    ("title_candidates", "project_id", "projects", "id"),
    ("publish_assets", "project_id", "projects", "id"),
    ("platform_posts", "project_id", "projects", "id"),
    ("platform_posts", "account_id", "platform_accounts", "id"),
    ("platform_posts", "title_candidate_id", "title_candidates", "id"),
    ("platform_posts", "publish_asset_id", "publish_assets", "id"),
    ("exports", "project_id", "projects", "id"),
    ("exports", "job_id", "jobs", "id"),
    ("confirmation_events", "project_id", "projects", "id"),
}


def assert_equal(actual, expected, message):
    if actual != expected:
        raise AssertionError(f"{message}: expected {expected!r}, got {actual!r}")


def assert_true(condition, message):
    if not condition:
        raise AssertionError(message)


def run_reset(extra_env=None):
    env = os.environ.copy()
    if extra_env:
        env.update(extra_env)
    subprocess.run([sys.executable, str(RESET_SCRIPT)], cwd=REPO_ROOT, env=env, check=True, text=True, capture_output=True)


def connect(path=DB_PATH):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def table_names(conn):
    rows = conn.execute("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").fetchall()
    return {row["name"] for row in rows}


def object_names(conn, object_type):
    rows = conn.execute("SELECT name FROM sqlite_master WHERE type = ? ORDER BY name", (object_type,)).fetchall()
    return [row["name"] for row in rows]


def count_snapshot(conn):
    return {
        table: conn.execute(f"SELECT COUNT(*) AS count FROM {table}").fetchone()["count"]
        for table in sorted(EXPECTED_TABLES)
    }


def seed_id_snapshot(conn):
    snapshot = {}
    for table in sorted(EXPECTED_TABLES - {"schema_migrations", "project_assets", "project_style_profiles"}):
        if "id" in EXPECTED_COLUMNS[table]:
            rows = conn.execute(f"SELECT id FROM {table} ORDER BY id").fetchall()
            snapshot[table] = [row["id"] for row in rows]
    snapshot["project_assets"] = [
        tuple(row)
        for row in conn.execute("SELECT project_id, asset_id, role FROM project_assets ORDER BY project_id, asset_id, role").fetchall()
    ]
    snapshot["project_style_profiles"] = [
        tuple(row)
        for row in conn.execute("SELECT project_id, style_profile_id FROM project_style_profiles ORDER BY project_id, style_profile_id").fetchall()
    ]
    return snapshot


def assert_schema(conn):
    tables = table_names(conn)
    assert_equal(tables, EXPECTED_TABLES, "M1 table set")
    assert_true(FUTURE_TABLES.isdisjoint(tables), "Future tables must be absent")

    for table, expected_columns in EXPECTED_COLUMNS.items():
        rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
        actual_columns = [row["name"] for row in rows]
        assert_equal(actual_columns, expected_columns, f"{table} columns")

    pk_expectations = {
        "project_assets": ["project_id", "asset_id", "role"],
        "project_style_profiles": ["project_id", "style_profile_id"],
        "project_layout_preferences": ["project_id"],
        "schema_migrations": ["version"],
    }
    for table in EXPECTED_TABLES:
        rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
        pk_columns = [row["name"] for row in sorted([row for row in rows if row["pk"]], key=lambda row: row["pk"])]
        expected_pk = pk_expectations.get(table, ["id"])
        assert_equal(pk_columns, expected_pk, f"{table} primary key")

    actual_fks = set()
    for table in EXPECTED_TABLES:
        for row in conn.execute(f"PRAGMA foreign_key_list({table})").fetchall():
            actual_fks.add((table, row["from"], row["table"], row["to"]))
    missing = EXPECTED_FKS - actual_fks
    assert_equal(missing, set(), "Missing FK edges")
    assert_equal([tuple(row) for row in conn.execute("PRAGMA foreign_key_check").fetchall()], [], "Foreign key check")

    assert_equal(object_names(conn, "view"), [], "SQLite views")
    assert_equal(object_names(conn, "trigger"), [], "SQLite triggers")
    custom_indexes = [name for name in object_names(conn, "index") if not name.startswith("sqlite_autoindex_")]
    assert_equal(custom_indexes, [], "Custom indexes")


def assert_seed_data(conn):
    titles = [row["title"] for row in conn.execute("SELECT title FROM projects WHERE deleted_at IS NULL ORDER BY id").fetchall()]
    assert_equal(len(titles), 3, "Seed project count")
    assert_equal(sorted(titles), sorted(EXPECTED_PROJECT_TITLES), "Seed project titles")
    statuses = {row["status"] for row in conn.execute("SELECT status FROM projects").fetchall()}
    assert_equal(statuses, {"draft"}, "Seed project statuses")
    playhead = conn.execute("SELECT last_playhead_ms FROM projects WHERE id = 'project_adhd_vlog_01'").fetchone()["last_playhead_ms"]
    assert_equal(playhead, 18000, "First project playhead")

    layout_rows = conn.execute("SELECT project_id, video_panel_height, timeline_panel_height, sidebar_collapsed FROM project_layout_preferences").fetchall()
    assert_equal(len(layout_rows), 3, "Layout preference count")
    for row in layout_rows:
        assert_true(row["video_panel_height"] > 0 and row["timeline_panel_height"] > 0, "Layout heights must be positive")
        assert_equal(row["sidebar_collapsed"], 0, "Sidebar collapsed seed")

    styles = [row["name"] for row in conn.execute("SELECT name FROM style_profiles WHERE deleted_at IS NULL ORDER BY name").fetchall()]
    assert_equal(sorted(styles), sorted(EXPECTED_STYLE_NAMES), "Seed style names")
    for style_id in [row["id"] for row in conn.execute("SELECT id FROM style_profiles").fetchall()]:
        enabled = conn.execute("SELECT COUNT(*) AS count FROM style_rules WHERE style_profile_id = ? AND enabled = 1", (style_id,)).fetchone()["count"]
        assert_true(enabled >= 3, f"{style_id} must have at least 3 enabled rules")

    assets = conn.execute("SELECT id, file_path, metadata_json FROM source_assets").fetchall()
    assert_true(len(assets) >= 3, "At least three source assets")
    for row in assets:
        path = (REPO_ROOT / row["file_path"]).resolve()
        assert_true(str(path).startswith(str(FIXTURE_DIR.resolve())), f"Fixture path escapes fixture dir: {row['file_path']}")
        assert_true(".." not in Path(row["file_path"]).parts, f"Fixture path contains traversal: {row['file_path']}")
        assert_true(path.is_file(), f"Missing fixture file: {row['file_path']}")
        assert_true(isinstance(json.loads(row["metadata_json"]), dict), "metadata_json must parse as object")

    for project_id in [row["id"] for row in conn.execute("SELECT id FROM projects").fetchall()]:
        attached = conn.execute(
            "SELECT COUNT(*) AS count FROM project_assets WHERE project_id = ? AND role = 'source'",
            (project_id,),
        ).fetchone()["count"]
        assert_true(attached >= 1, f"{project_id} source attachment")
        sort_orders = [row["sort_order"] for row in conn.execute("SELECT sort_order FROM project_assets WHERE project_id = ?", (project_id,)).fetchall()]
        assert_true(all(order > 0 for order in sort_orders), f"{project_id} positive asset sort orders")

        tracks = conn.execute(
            "SELECT track_type, name, sort_order, is_visible, is_locked FROM timeline_tracks WHERE project_id = ? ORDER BY sort_order",
            (project_id,),
        ).fetchall()
        assert_equal([row["track_type"] for row in tracks], ["video", "audio", "subtitles", "effects"], f"{project_id} track types")
        assert_true(all(row["name"] for row in tracks), f"{project_id} track names")
        assert_equal([row["sort_order"] for row in tracks], [1, 2, 3, 4], f"{project_id} track order")
        assert_true(all(row["is_visible"] == 1 and row["is_locked"] == 0 for row in tracks), f"{project_id} track flags")

        steps = conn.execute(
            "SELECT step_key, enabled, sort_order FROM edit_steps WHERE project_id = ? ORDER BY sort_order",
            (project_id,),
        ).fetchall()
        assert_equal([row["step_key"] for row in steps], ["arrange_timeline", "clean_speech", "subtitles_bilingual", "apply_style_profile"], f"{project_id} edit steps")
        assert_true(all(row["enabled"] == 1 for row in steps), f"{project_id} edit steps enabled")
        assert_equal([row["sort_order"] for row in steps], [1, 2, 3, 4], f"{project_id} edit step order")

    catalog_requirements = {
        "effect_presets": 4,
        "audio_presets": 3,
        "music_assets": 3,
        "text_templates": 3,
        "sticker_assets": 3,
        "transition_presets": 3,
    }
    for table, minimum in catalog_requirements.items():
        count = conn.execute(f"SELECT COUNT(*) AS count FROM {table} WHERE deleted_at IS NULL").fetchone()["count"]
        assert_true(count >= minimum, f"{table} minimum rows")

    for table, key_column in [
        ("effect_presets", "preset_key"),
        ("audio_presets", "preset_key"),
        ("music_assets", "music_key"),
        ("text_templates", "template_key"),
        ("sticker_assets", "sticker_key"),
        ("transition_presets", "transition_key"),
    ]:
        rows = conn.execute(f"SELECT {key_column} AS stable_key, display_name, category, sort_order FROM {table}").fetchall()
        for row in rows:
            assert_true(row["stable_key"] and row["display_name"] and row["category"], f"{table} usability fields")
            assert_true(row["sort_order"] > 0, f"{table} positive sort_order")

    platforms = conn.execute("SELECT platform_key, auth_status, metadata_json FROM platform_accounts ORDER BY platform_key").fetchall()
    assert_equal([row["platform_key"] for row in platforms], EXPECTED_PLATFORM_KEYS, "Platform keys")
    assert_true(all(row["auth_status"] == "disconnected" for row in platforms), "Platform auth status")
    assert_true(all(isinstance(json.loads(row["metadata_json"]), dict) for row in platforms), "Platform metadata JSON")


def assert_json_columns(conn):
    for table, columns in JSON_COLUMNS.items():
        for column in columns:
            rows = conn.execute(f"SELECT {column} AS value FROM {table} WHERE {column} IS NOT NULL").fetchall()
            for row in rows:
                value = json.loads(row["value"])
                assert_true(isinstance(value, (dict, list)), f"{table}.{column} must parse as object or array")


def assert_negative_cases(conn):
    def must_fail(sql, params, label):
        try:
            conn.execute(sql, params)
            conn.rollback()
        except sqlite3.IntegrityError:
            conn.rollback()
            return
        raise AssertionError(f"Expected constraint failure: {label}")

    must_fail(
        "INSERT INTO project_assets(project_id, asset_id, role, sort_order, created_at) VALUES (?, ?, 'source', 1, 'x')",
        ("missing_project", "asset_adhd_vlog_source"),
        "orphan project_assets.project_id",
    )
    must_fail(
        "INSERT INTO project_assets(project_id, asset_id, role, sort_order, created_at) VALUES (?, ?, 'source', 1, 'x')",
        ("project_adhd_vlog_01", "missing_asset"),
        "orphan project_assets.asset_id",
    )
    must_fail(
        "INSERT INTO project_assets(project_id, asset_id, role, sort_order, created_at) VALUES (?, ?, 'source', 2, 'x')",
        ("project_adhd_vlog_01", "asset_adhd_vlog_source"),
        "duplicate project_assets composite PK",
    )
    must_fail(
        "INSERT INTO projects(id, title, status, last_playhead_ms, created_at, updated_at) VALUES ('bad_project', 'Bad', 'bad_status', 0, 'x', 'x')",
        (),
        "invalid project status",
    )
    must_fail(
        "INSERT INTO platform_accounts(id, platform_key, display_name, auth_status, metadata_json) VALUES ('bad_account', 'bad_platform', 'Bad', 'disconnected', '{}')",
        (),
        "invalid platform key",
    )
    must_fail(
        "INSERT INTO confirmation_events(id, target_type, target_id, action, decision, created_at) VALUES ('bad_confirm', 'style_rule', 'x', 'delete', 'maybe', 'x')",
        (),
        "invalid confirmation decision",
    )
    must_fail(
        "INSERT INTO timeline_tracks(id, project_id, track_type, name, sort_order, created_at, updated_at) VALUES ('bad_track', 'project_adhd_vlog_01', 'bad_track_type', 'Bad', 99, 'x', 'x')",
        (),
        "invalid track type",
    )
    must_fail(
        """
        INSERT INTO timeline_items
          (id, project_id, track_id, item_type, start_ms, end_ms, duration_ms, properties_json, created_at, updated_at)
        VALUES ('bad_item', 'project_adhd_vlog_01', 'track_project_adhd_vlog_01_video', 'bad_item_type', 0, 1, 1, '{}', 'x', 'x')
        """,
        (),
        "invalid item type",
    )
    must_fail(
        "INSERT INTO jobs(id, project_id, job_type, status, input_json, created_at, updated_at) VALUES ('bad_job', 'project_adhd_vlog_01', 'auto_edit', 'bad_status', '{}', 'x', 'x')",
        (),
        "invalid job status",
    )
    must_fail(
        "INSERT INTO exports(id, project_id, format, status, created_at, updated_at) VALUES ('bad_export', 'project_adhd_vlog_01', 'mp4', 'bad_status', 'x', 'x')",
        (),
        "invalid export status",
    )


def assert_override_path():
    before_exists = DB_PATH.exists()
    before_stat = DB_PATH.stat().st_mtime_ns if before_exists else None
    with tempfile.TemporaryDirectory() as tmp:
        override = Path(tmp) / "override.sqlite3"
        run_reset({"AUTOMEDIA_DB_PATH": str(override)})
        assert_true(override.is_file(), "Override DB path should be created")
        if before_exists:
            assert_equal(DB_PATH.stat().st_mtime_ns, before_stat, "Default DB should not be touched by override reset")
        else:
            assert_true(not DB_PATH.exists(), "Default DB should remain absent during override reset")


def assert_data_sidecars():
    allowed_prefixes = {"automedia.sqlite3", "automedia.sqlite3-wal", "automedia.sqlite3-shm", "automedia.sqlite3-journal"}
    data_dir = REPO_ROOT / "data"
    if data_dir.exists():
        extras = [path.name for path in data_dir.iterdir() if path.name not in allowed_prefixes and path.name != ".gitkeep"]
        assert_equal(extras, [], "Unexpected data sidecar files")


def main():
    run_reset()
    with connect() as conn:
        snapshot_one = (count_snapshot(conn), seed_id_snapshot(conn))
        conn.execute(
            "INSERT INTO style_profiles(id, name, summary, created_at, updated_at) VALUES ('stale_style', 'Stale', 'Should be removed', 'x', 'x')"
        )
        conn.commit()
    run_reset()
    with connect() as conn:
        snapshot_two = (count_snapshot(conn), seed_id_snapshot(conn))
        assert_equal(snapshot_two, snapshot_one, "Reset idempotence snapshot")
        assert_equal(
            conn.execute("SELECT COUNT(*) AS count FROM style_profiles WHERE id = 'stale_style'").fetchone()["count"],
            0,
            "Stale reset cleanup",
        )
        assert_schema(conn)
        assert_seed_data(conn)
        assert_json_columns(conn)
        assert_negative_cases(conn)
    assert_override_path()
    assert_data_sidecars()
    print("AutoMedia M1 verification passed.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"AutoMedia M1 verification failed: {exc}", file=sys.stderr)
        raise
