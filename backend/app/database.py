import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parents[1] / "securetunnel.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS packet_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                packet_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                status TEXT NOT NULL,
                sequence_number INTEGER,
                packet_size INTEGER,
                sender TEXT,
                receiver TEXT,
                created_at TEXT NOT NULL
            )
            """
        )


def log_event(event_type, status, packet_id=None, sequence_number=None,
              packet_size=None, sender=None, receiver=None):
    import datetime

    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO packet_events
            (packet_id, event_type, status, sequence_number, packet_size,
             sender, receiver, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                packet_id or "N/A",
                event_type,
                status,
                sequence_number,
                packet_size,
                sender,
                receiver,
                datetime.datetime.now(datetime.timezone.utc).isoformat(),
            ),
        )


def fetch_events(limit=20):
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM packet_events ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [dict(row) for row in rows]


def fetch_stats():
    with get_connection() as connection:
        total = connection.execute(
            "SELECT COUNT(*) FROM packet_events"
        ).fetchone()[0]
        protected = connection.execute(
            "SELECT COUNT(*) FROM packet_events WHERE status = 'protected'"
        ).fetchone()[0]
        rejected = connection.execute(
            "SELECT COUNT(*) FROM packet_events WHERE status = 'rejected'"
        ).fetchone()[0]
    return {
        "totalPackets": total,
        "protectedPackets": protected,
        "rejectedPackets": rejected,
        "activeAssociations": 1,
    }


def reset_events():
    with get_connection() as connection:
        connection.execute("DELETE FROM packet_events")
        connection.execute(
            "DELETE FROM sqlite_sequence WHERE name = 'packet_events'"
        )
