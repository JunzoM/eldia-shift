#!/usr/bin/env python3
"""ELDIA local server (Windows PC only).

- Serves the shift app (index.html) at http://127.0.0.1:8765/
- Stores data in SQLite (data/eldia.db) via a tiny key-value API
- Makes a daily backup into data/backups/ (keeps the newest 60)

Python standard library only. No pip install needed.
"""
import json
import os
import shutil
import sqlite3
import sys
import threading
import time
from datetime import datetime
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, unquote

HOST = "127.0.0.1"
PORT = int(os.environ.get("ELDIA_PORT", "8765"))
BASE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE, "data")
DB_PATH = os.path.join(DATA_DIR, "eldia.db")
BACKUP_DIR = os.path.join(DATA_DIR, "backups")
LOG_PATH = os.path.join(DATA_DIR, "server.log")
KEEP_BACKUPS = 60
MAX_BODY = 20 * 1024 * 1024  # 20MB

ALLOWED_APPS = {"shift"}           # 予約印刷を載せるときは "print" を追加
ALLOWED_HOSTS = {f"127.0.0.1:{PORT}", f"localhost:{PORT}"}

STATIC = {
    "/": "index.html",
    "/index.html": "index.html",
    "/import": "import.html",
    "/import.html": "import.html",
    "/export.html": "export.html",
    "/vendor/react.production.min.js": "vendor/react.production.min.js",
    "/vendor/react-dom.production.min.js": "vendor/react-dom.production.min.js",
    "/vendor/babel.min.js": "vendor/babel.min.js",
}

db_lock = threading.Lock()


def log(msg):
    line = f"{datetime.now():%Y-%m-%d %H:%M:%S} {msg}"
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except OSError:
        pass
    if sys.stdout:
        try:
            print(line, flush=True)
        except Exception:
            pass


def connect():
    con = sqlite3.connect(DB_PATH, timeout=10)
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA synchronous=FULL")
    return con


def init_db():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    with connect() as con:
        con.execute(
            """CREATE TABLE IF NOT EXISTS kv_store (
                 app TEXT NOT NULL,
                 key TEXT NOT NULL,
                 value TEXT NOT NULL,
                 updated_at TEXT NOT NULL,
                 PRIMARY KEY (app, key))"""
        )


def backup_now():
    """Copy the DB with SQLite's online backup API (safe while running)."""
    name = f"eldia-{datetime.now():%Y%m%d-%H%M%S}.db"
    dest = os.path.join(BACKUP_DIR, name)
    with db_lock:
        src = connect()
        dst = sqlite3.connect(dest)
        try:
            src.backup(dst)
        finally:
            dst.close()
            src.close()
    files = sorted(f for f in os.listdir(BACKUP_DIR) if f.startswith("eldia-") and f.endswith(".db"))
    for old in files[:-KEEP_BACKUPS]:
        try:
            os.remove(os.path.join(BACKUP_DIR, old))
        except OSError:
            pass
    log(f"backup: {name}")


def backup_loop():
    last_day = None
    while True:
        today = datetime.now().date()
        if today != last_day:
            try:
                backup_now()
                last_day = today
            except Exception as e:  # keep running even if a backup fails
                log(f"backup failed: {e}")
        time.sleep(600)


class Handler(SimpleHTTPRequestHandler):
    server_version = "EldiaLocal/1.0"

    def log_message(self, fmt, *args):
        pass  # keep the log quiet; errors are logged explicitly

    # --- helpers -----------------------------------------------------------
    def _host_ok(self):
        return self.headers.get("Host", "") in ALLOWED_HOSTS

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _parse_store_path(self, path):
        # /api/store/<app>/<key>
        parts = [unquote(p) for p in path.split("/") if p]
        if len(parts) == 4 and parts[0] == "api" and parts[1] == "store":
            app, key = parts[2], parts[3]
            if app in ALLOWED_APPS and 0 < len(key) <= 100:
                return app, key
        return None

    # --- GET ---------------------------------------------------------------
    def do_GET(self):
        if not self._host_ok():
            return self._json(403, {"error": "forbidden host"})
        path = urlparse(self.path).path

        if path == "/api/health":
            return self._json(200, {"ok": True, "db": DB_PATH})

        if path.startswith("/api/export/"):
            app = unquote(path[len("/api/export/"):])
            if app not in ALLOWED_APPS:
                return self._json(404, {"error": "unknown app"})
            with db_lock, connect() as con:
                rows = con.execute(
                    "SELECT key, value, updated_at FROM kv_store WHERE app=?", (app,)
                ).fetchall()
            data = {k: json.loads(v) for k, v, _ in rows}
            body = json.dumps(data, ensure_ascii=False, indent=1).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header(
                "Content-Disposition",
                f'attachment; filename="{app}-{datetime.now():%Y%m%d-%H%M}.json"',
            )
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        parsed = self._parse_store_path(path)
        if parsed:
            app, key = parsed
            with db_lock, connect() as con:
                row = con.execute(
                    "SELECT value, updated_at FROM kv_store WHERE app=? AND key=?", (app, key)
                ).fetchone()
            if row is None:
                return self._json(200, {"value": None})
            return self._json(200, {"value": json.loads(row[0]), "updated_at": row[1]})

        rel = STATIC.get(path)
        if rel is None:
            return self._json(404, {"error": "not found"})
        full = os.path.join(BASE, rel)
        try:
            with open(full, "rb") as f:
                body = f.read()
        except OSError:
            return self._json(404, {"error": "not found"})
        ctype = "text/html; charset=utf-8" if rel.endswith(".html") else "text/javascript; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)

    # --- POST ------------------------------------------------------------
    def do_POST(self):
        if not self._host_ok():
            return self._json(403, {"error": "forbidden host"})
        # 他サイトから勝手に呼ばれないよう、独自ヘッダー必須（付けるとブラウザが事前確認を行い、他サイトからは通らない）
        if self.headers.get("X-Eldia") != "1":
            return self._json(403, {"error": "forbidden"})
        if urlparse(self.path).path == "/api/backup":
            try:
                backup_now()
            except Exception as e:
                log(f"manual backup failed: {e}")
                return self._json(500, {"error": "backup failed"})
            return self._json(200, {"ok": True})
        return self._json(404, {"error": "not found"})

    # --- PUT ---------------------------------------------------------------
    def do_PUT(self):
        if not self._host_ok():
            return self._json(403, {"error": "forbidden host"})
        parsed = self._parse_store_path(urlparse(self.path).path)
        if not parsed:
            return self._json(404, {"error": "not found"})
        if "application/json" not in self.headers.get("Content-Type", ""):
            return self._json(415, {"error": "json only"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY:
            return self._json(413, {"error": "bad size"})
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            value = payload["value"]
        except Exception:
            return self._json(400, {"error": "bad json"})
        app, key = parsed
        now = datetime.now().isoformat(timespec="seconds")
        try:
            with db_lock, connect() as con:
                con.execute(
                    """INSERT INTO kv_store(app, key, value, updated_at) VALUES (?,?,?,?)
                       ON CONFLICT(app, key) DO UPDATE SET value=excluded.value,
                                                         updated_at=excluded.updated_at""",
                    (app, key, json.dumps(value, ensure_ascii=False), now),
                )
        except Exception as e:
            log(f"save failed {app}/{key}: {e}")
            return self._json(500, {"error": "save failed"})
        return self._json(200, {"ok": True, "updated_at": now})


def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    init_db()
    try:
        httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    except OSError:
        log(f"port {PORT} is already in use (server already running?)")
        return
    threading.Thread(target=backup_loop, daemon=True).start()
    log(f"started: http://{HOST}:{PORT}/  db={DB_PATH}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
