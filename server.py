#!/usr/bin/env python3
"""ELDIA local server (Windows PC / Mac).

- Serves the shift app (index.html) at http://127.0.0.1:8765/
- Stores data in SQLite (data/eldia.db) via a tiny key-value API
- Makes a daily backup into data/backups/ (keeps the newest 60)
- Optional: iPad / other devices on the same (office) Wi-Fi can use it
  after entering a PIN. Off by default; turned on from the PC itself.

Python standard library only. No pip install needed.
"""
import hashlib
import hmac
import ipaddress
import json
import os
import secrets
import socket
import sqlite3
import sys
import threading
import time
from datetime import datetime
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, unquote, parse_qs

PORT = int(os.environ.get("ELDIA_PORT", "8765"))
# 0.0.0.0 で待ち受け、iPad等（LAN）からの接続は「LAN利用ON＋PIN」のときだけ通す
BIND = os.environ.get("ELDIA_BIND", "0.0.0.0")
BASE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE, "data")
DB_PATH = os.path.join(DATA_DIR, "eldia.db")
BACKUP_DIR = os.path.join(DATA_DIR, "backups")
LOG_PATH = os.path.join(DATA_DIR, "server.log")
SHARE_CONF = os.path.join(DATA_DIR, "share.json")
LAN_CONF = os.path.join(DATA_DIR, "lan.json")
SHARE_ENDPOINT = os.environ.get("ELDIA_SHARE_ENDPOINT", "https://mqapkwlxlunyvsuhiujb.supabase.co/functions/v1/shift-share")
KEEP_BACKUPS = 60
MAX_BODY = 20 * 1024 * 1024  # 20MB
SESSION_DAYS = 90
COOKIE = "eldia_session"

ALLOWED_APPS = {"shift"}           # 予約印刷を載せるときは "print" を追加

STATIC = {
    "/": "index.html",
    "/index.html": "index.html",
    "/import": "import.html",
    "/import.html": "import.html",
    "/export.html": "export.html",
    "/avatar": "avatar.html",
    "/avatar.html": "avatar.html",
    "/avatar3d.js": "avatar3d.js",
    "/vendor/react.production.min.js": "vendor/react.production.min.js",
    "/vendor/react-dom.production.min.js": "vendor/react-dom.production.min.js",
    "/vendor/babel.min.js": "vendor/babel.min.js",
    "/vendor/html2canvas.min.js": "vendor/html2canvas.min.js",
    "/vendor/jspdf.umd.min.js": "vendor/jspdf.umd.min.js",
    "/vendor/qrcode.js": "vendor/qrcode.js",
    "/vendor/three.min.js": "vendor/three.min.js",
}

db_lock = threading.Lock()
lan_lock = threading.Lock()
fail_log = {}  # ip -> [timestamps of failed PIN attempts]


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


# ─── DB ──────────────────────────────────────────────────────────────────────
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
        cols = [r[1] for r in con.execute("PRAGMA table_info(kv_store)")]
        if "rev" not in cols:  # 同時編集の検知用（保存のたびに+1）
            con.execute("ALTER TABLE kv_store ADD COLUMN rev INTEGER NOT NULL DEFAULT 1")


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


# ─── LAN（iPad等）設定 ─────────────────────────────────────────────────────────
def lan_load():
    try:
        with open(LAN_CONF, encoding="utf-8") as f:
            c = json.load(f)
    except (OSError, ValueError):
        c = {}
    c.setdefault("enabled", False)
    c.setdefault("pin_hash", "")
    c.setdefault("pin_salt", "")
    c.setdefault("sessions", {})  # token_hash -> expires (epoch)
    return c


def lan_save(c):
    tmp = LAN_CONF + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(c, f)
    os.replace(tmp, LAN_CONF)


def pin_hash(pin, salt):
    return hashlib.pbkdf2_hmac("sha256", pin.encode("utf-8"), bytes.fromhex(salt), 200_000).hex()


def tok_hash(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def lan_addresses():
    """このPCのLAN側IPv4アドレス（iPadから開くアドレスの候補）"""
    ips = set()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))  # 実際には送信しない
        ips.add(s.getsockname()[0])
        s.close()
    except OSError:
        pass
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ips.add(info[4][0])
    except OSError:
        pass
    return sorted(ip for ip in ips if ipaddress.ip_address(ip).is_private and not ip.startswith("127."))


LOGIN_HTML = """<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>シフト表 — ログイン</title>
<style>body{margin:0;font-family:-apple-system,"Hiragino Sans","Yu Gothic UI",sans-serif;background:#E1E6EC;color:#1B2631;display:flex;min-height:100vh;align-items:center;justify-content:center}
.c{background:#fff;border:1px solid #D3DAE2;border-radius:12px;padding:28px;width:min(360px,90vw)}h1{font-size:20px;margin:0 0 6px}p{font-size:14px;color:#667382;margin:0 0 18px;line-height:1.6}
input{width:100%;box-sizing:border-box;font-size:24px;letter-spacing:.3em;text-align:center;padding:12px;border:1px solid #D3DAE2;border-radius:10px}
button{margin-top:14px;width:100%;padding:14px;font-size:16px;font-weight:700;border:0;border-radius:10px;background:#1F5E8A;color:#fff}.e{color:#C23B2A;font-size:14px;margin-top:12px}</style></head>
<body><form class="c" method="post" action="/login"><h1>シフト表</h1><p>PCのシフト表の「設定 → 💾 データ管理 → iPadから使う」で決めたPINを入力してください。</p>
<input name="pin" type="password" inputmode="numeric" autocomplete="current-password" autofocus required minlength="4" maxlength="12">
<button type="submit">ひらく</button>__ERR__</form></body></html>"""


class Handler(SimpleHTTPRequestHandler):
    server_version = "EldiaLocal/1.1"

    def log_message(self, fmt, *args):
        pass  # keep the log quiet; errors are logged explicitly

    # --- helpers -----------------------------------------------------------
    def _client_ip(self):
        return self.client_address[0]

    def _is_local(self):
        try:
            return ipaddress.ip_address(self._client_ip()).is_loopback
        except ValueError:
            return False

    def _host_ok(self):
        """DNS rebinding 対策：Host は localhost か、IPアドレス直書き（LAN）のみ許可"""
        host = self.headers.get("Host", "")
        name, _, port = host.rpartition(":")
        if port != str(PORT):
            return False
        if name in ("127.0.0.1", "localhost"):
            return True
        try:
            return ipaddress.ip_address(name).is_private
        except ValueError:
            return False

    def _session_ok(self):
        raw = self.headers.get("Cookie", "")
        token = ""
        for part in raw.split(";"):
            k, _, v = part.strip().partition("=")
            if k == COOKIE:
                token = v
        if not token:
            return False
        with lan_lock:
            c = lan_load()
            exp = c["sessions"].get(tok_hash(token))
        return bool(exp and exp > time.time())

    def _authorized(self):
        """このPC自身からは常にOK。LANからは「LAN利用ON」かつログイン済みのときだけ"""
        if self._is_local():
            return True
        with lan_lock:
            enabled = lan_load()["enabled"]
        return enabled and self._session_ok()

    def _guard(self, path):
        """許可されていなければ応答を返して True"""
        if not self._host_ok():
            self._json(403, {"error": "forbidden host"})
            return True
        if path in ("/login",):
            return False
        if not self._authorized():
            if not self._is_local():
                with lan_lock:
                    enabled = lan_load()["enabled"]
                if not enabled:
                    self._json(403, {"error": "このPCのシフト表は、iPadからの利用がオフになっています"})
                    return True
            if path.startswith("/api/") or path.startswith("/vendor/"):
                self._json(401, {"error": "login required"})
            else:
                self.send_response(302)
                self.send_header("Location", "/login")
                self.end_headers()
            return True
        return False

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _html(self, code, html):
        body = html.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self, limit):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > limit:
            return None
        return self.rfile.read(length)

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
        path = urlparse(self.path).path
        if self._guard(path):
            return

        if path == "/login":
            if self._is_local() or self._session_ok():
                self.send_response(302)
                self.send_header("Location", "/")
                self.end_headers()
                return
            return self._html(200, LOGIN_HTML.replace("__ERR__", ""))

        if path == "/api/health":
            return self._json(200, {"ok": True, "db": DB_PATH})

        if path == "/api/lan-config":
            if not self._is_local():
                return self._json(403, {"error": "PC本体でのみ設定できます"})
            with lan_lock:
                c = lan_load()
            return self._json(200, {
                "enabled": c["enabled"], "pin_set": bool(c["pin_hash"]),
                "devices": sum(1 for v in c["sessions"].values() if v > time.time()),
                "addresses": [f"http://{ip}:{PORT}/" for ip in lan_addresses()],
                "bind": BIND,
            })

        if path == "/api/share-config":
            key = ""
            try:
                with open(SHARE_CONF, encoding="utf-8") as f:
                    key = json.load(f).get("key", "")
            except (OSError, ValueError):
                pass
            return self._json(200, {"endpoint": SHARE_ENDPOINT, "key": key})

        if path.startswith("/api/revs/"):
            app = unquote(path[len("/api/revs/"):])
            if app not in ALLOWED_APPS:
                return self._json(404, {"error": "unknown app"})
            with db_lock, connect() as con:
                rows = con.execute("SELECT key, rev FROM kv_store WHERE app=?", (app,)).fetchall()
            return self._json(200, {k: r for k, r in rows})

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
                    "SELECT value, updated_at, rev FROM kv_store WHERE app=? AND key=?", (app, key)
                ).fetchone()
            if row is None:
                return self._json(200, {"value": None, "rev": 0})
            return self._json(200, {"value": json.loads(row[0]), "updated_at": row[1], "rev": row[2]})

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
        path = urlparse(self.path).path
        if path == "/login":
            return self._login()
        if self._guard(path):
            return
        # 他サイトから勝手に呼ばれないよう、独自ヘッダー必須（付けるとブラウザが事前確認を行い、他サイトからは通らない）
        if self.headers.get("X-Eldia") != "1":
            return self._json(403, {"error": "forbidden"})
        if path == "/api/lan-config":
            return self._lan_config()
        if path == "/api/share-config":
            raw = self._read_body(4096)
            try:
                key = str(json.loads(raw.decode("utf-8")).get("key", "")).strip()
            except Exception:
                return self._json(400, {"error": "bad json"})
            if len(key) > 200:
                return self._json(400, {"error": "key too long"})
            with open(SHARE_CONF, "w", encoding="utf-8") as f:
                json.dump({"key": key}, f)
            return self._json(200, {"ok": True, "configured": bool(key)})
        if path == "/api/backup":
            try:
                backup_now()
            except Exception as e:
                log(f"manual backup failed: {e}")
                return self._json(500, {"error": "backup failed"})
            return self._json(200, {"ok": True})
        return self._json(404, {"error": "not found"})

    def _login(self):
        if not self._host_ok():
            return self._json(403, {"error": "forbidden host"})
        ip = self._client_ip()
        now = time.time()
        with lan_lock:
            recent = [t for t in fail_log.get(ip, []) if now - t < 600]
            fail_log[ip] = recent
            c = lan_load()
        if not c["enabled"]:
            return self._html(403, LOGIN_HTML.replace("__ERR__", '<div class="e">このPCでは、iPadからの利用がオフになっています。</div>'))
        if len(recent) >= 5:
            return self._html(429, LOGIN_HTML.replace("__ERR__", '<div class="e">続けて間違えたため、10分ほど待ってから入力してください。</div>'))
        raw = self._read_body(1024) or b""
        pin = (parse_qs(raw.decode("utf-8", "ignore")).get("pin") or [""])[0].strip()
        ok = bool(c["pin_hash"]) and hmac.compare_digest(pin_hash(pin, c["pin_salt"]), c["pin_hash"])
        if not ok:
            with lan_lock:
                fail_log.setdefault(ip, []).append(now)
            log(f"LAN login failed from {ip}")
            return self._html(401, LOGIN_HTML.replace("__ERR__", '<div class="e">PINが違います。</div>'))
        token = secrets.token_urlsafe(32)
        with lan_lock:
            c = lan_load()
            c["sessions"] = {k: v for k, v in c["sessions"].items() if v > now}
            c["sessions"][tok_hash(token)] = now + SESSION_DAYS * 86400
            lan_save(c)
            fail_log.pop(ip, None)
        log(f"LAN login ok from {ip}")
        self.send_response(302)
        self.send_header("Set-Cookie", f"{COOKIE}={token}; Max-Age={SESSION_DAYS*86400}; Path=/; HttpOnly; SameSite=Strict")
        self.send_header("Location", "/")
        self.end_headers()

    def _lan_config(self):
        if not self._is_local():
            return self._json(403, {"error": "PC本体でのみ設定できます"})
        raw = self._read_body(4096)
        try:
            req = json.loads(raw.decode("utf-8"))
        except Exception:
            return self._json(400, {"error": "bad json"})
        with lan_lock:
            c = lan_load()
            if "pin" in req:
                pin = str(req["pin"]).strip()
                if not (pin.isdigit() and 6 <= len(pin) <= 12):
                    return self._json(400, {"error": "PINは6〜12桁の数字にしてください"})
                c["pin_salt"] = secrets.token_hex(16)
                c["pin_hash"] = pin_hash(pin, c["pin_salt"])
                c["sessions"] = {}  # PINを変えたら、ログイン済みの端末も入り直し
            if "enabled" in req:
                if req["enabled"] and not c["pin_hash"]:
                    return self._json(400, {"error": "先にPINを決めてください"})
                c["enabled"] = bool(req["enabled"])
            if req.get("logout_all"):
                c["sessions"] = {}
            lan_save(c)
        log(f"LAN config updated: enabled={c['enabled']}")
        return self._json(200, {"ok": True, "enabled": c["enabled"], "pin_set": bool(c["pin_hash"])})

    # --- PUT ---------------------------------------------------------------
    def do_PUT(self):
        path = urlparse(self.path).path
        if self._guard(path):
            return
        parsed = self._parse_store_path(path)
        if not parsed:
            return self._json(404, {"error": "not found"})
        if "application/json" not in self.headers.get("Content-Type", ""):
            return self._json(415, {"error": "json only"})
        raw = self._read_body(MAX_BODY)
        if raw is None:
            return self._json(413, {"error": "bad size"})
        try:
            payload = json.loads(raw.decode("utf-8"))
            value = payload["value"]
            base = payload.get("base_rev")  # 読み込んだときの版。無ければ上書き（読み込み画面など）
        except Exception:
            return self._json(400, {"error": "bad json"})
        app, key = parsed
        now = datetime.now().isoformat(timespec="seconds")
        try:
            with db_lock, connect() as con:
                row = con.execute("SELECT rev FROM kv_store WHERE app=? AND key=?", (app, key)).fetchone()
                cur = row[0] if row else 0
                if base is not None and int(base) != cur:
                    # 別の端末が先に保存していた → 上書きしない
                    return self._json(409, {"error": "conflict", "rev": cur})
                con.execute(
                    """INSERT INTO kv_store(app, key, value, updated_at, rev) VALUES (?,?,?,?,1)
                       ON CONFLICT(app, key) DO UPDATE SET value=excluded.value,
                                                         updated_at=excluded.updated_at,
                                                         rev=kv_store.rev+1""",
                    (app, key, json.dumps(value, ensure_ascii=False), now),
                )
                new_rev = con.execute("SELECT rev FROM kv_store WHERE app=? AND key=?", (app, key)).fetchone()[0]
        except Exception as e:
            log(f"save failed {app}/{key}: {e}")
            return self._json(500, {"error": "save failed"})
        return self._json(200, {"ok": True, "updated_at": now, "rev": new_rev})


def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    init_db()
    try:
        httpd = ThreadingHTTPServer((BIND, PORT), Handler)
    except OSError:
        log(f"port {PORT} is already in use (server already running?)")
        return
    threading.Thread(target=backup_loop, daemon=True).start()
    log(f"started: http://127.0.0.1:{PORT}/  bind={BIND}  db={DB_PATH}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
