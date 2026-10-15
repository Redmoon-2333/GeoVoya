import json
import sqlite3
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4


def timestamp() -> str:
    return datetime.now(UTC).isoformat()


class Store:
    """A small local store; records always require an owner."""

    def __init__(self, database: Path):
        self.database = database
        database.parent.mkdir(parents=True, exist_ok=True)
        with self.connection() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.executescript("""
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS records (
                    owner TEXT NOT NULL REFERENCES sessions(token),
                    kind TEXT NOT NULL,
                    id TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    PRIMARY KEY (owner, kind, id)
                );
                CREATE INDEX IF NOT EXISTS owner_kind ON records(owner, kind);
            """)

    @contextmanager
    def connection(self):
        db = sqlite3.connect(self.database, timeout=10)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys=ON")
        try:
            with db:
                yield db
        finally:
            db.close()

    def has_session(self, token: str) -> bool:
        with self.connection() as db:
            return (
                db.execute("SELECT 1 FROM sessions WHERE token = ?", (token,)).fetchone()
                is not None
            )

    def create_session(self, token: str) -> None:
        with self.connection() as db:
            db.execute("INSERT INTO sessions VALUES (?, ?)", (token, timestamp()))

    def list(self, owner: str, kind: str) -> list[dict]:
        with self.connection() as db:
            rows = db.execute(
                "SELECT payload FROM records WHERE owner = ? AND kind = ? ORDER BY rowid DESC",
                (owner, kind),
            ).fetchall()
        return [json.loads(row["payload"]) for row in rows]

    def get(self, owner: str, kind: str, record_id: str) -> dict | None:
        with self.connection() as db:
            row = db.execute(
                "SELECT payload FROM records WHERE owner = ? AND kind = ? AND id = ?",
                (owner, kind, record_id),
            ).fetchone()
        return json.loads(row["payload"]) if row else None

    def save(self, owner: str, kind: str, values: dict, record_id: str | None = None) -> dict:
        record_id = record_id or str(uuid4())
        with self.connection() as db:
            existing_row = db.execute(
                "SELECT payload FROM records WHERE owner = ? AND kind = ? AND id = ?",
                (owner, kind, record_id),
            ).fetchone()
            existing = json.loads(existing_row["payload"]) if existing_row else {}
            result = {
                **values,
                "id": record_id,
                "created_at": existing.get("created_at", timestamp()),
                "updated_at": timestamp(),
            }
            db.execute(
                """INSERT INTO records VALUES (?, ?, ?, ?)
                   ON CONFLICT(owner, kind, id) DO UPDATE SET payload = excluded.payload""",
                (owner, kind, record_id, json.dumps(result, ensure_ascii=False)),
            )
        return result

    def save_artifact(self, owner: str, record_id: str | None, values: dict) -> dict:
        """Commit the current artifact and its revision in the same transaction."""
        record_id = record_id or str(uuid4())
        with self.connection() as db:
            existing_row = db.execute(
                "SELECT payload FROM records WHERE owner = ? AND kind = 'artifact' AND id = ?",
                (owner, record_id),
            ).fetchone()
            existing = json.loads(existing_row["payload"]) if existing_row else {}
            result = {
                **values,
                "id": record_id,
                "version": existing.get("version", 0) + 1,
                "created_at": existing.get("created_at", timestamp()),
                "updated_at": timestamp(),
            }
            db.execute(
                """INSERT INTO records VALUES (?, 'artifact', ?, ?)
                   ON CONFLICT(owner, kind, id) DO UPDATE SET payload = excluded.payload""",
                (owner, record_id, json.dumps(result, ensure_ascii=False)),
            )
            db.execute(
                "INSERT INTO records VALUES (?, 'revision', ?, ?)",
                (
                    owner,
                    str(uuid4()),
                    json.dumps({**result, "artifact_id": record_id}, ensure_ascii=False),
                ),
            )
        return result
