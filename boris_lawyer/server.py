#!/usr/bin/env python3
"""Сервер сайта «Лучше звоните Борису».

Только стандартная библиотека Python 3.8+. Отдаёт статический сайт из ./static,
принимает заявки с сайта и сохраняет их в SQLite-базу ./data/requests.db
на этом компьютере. Панель администратора: /admin.

Запуск:  python3 server.py [--host 0.0.0.0] [--port 8080]
Пароль администратора берётся из переменной BORIS_ADMIN_PASSWORD, иначе
генерируется при первом запуске и сохраняется в ./data/admin_password.txt.
"""

import argparse
import csv
import hashlib
import hmac
import io
import json
import mimetypes
import os
import re
import secrets
import sqlite3
import sys
import threading
import time
from datetime import datetime
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "requests.db"
PASSWORD_FILE = DATA_DIR / "admin_password.txt"

MAX_BODY = 16 * 1024
SESSION_TTL = 12 * 3600
RATE_LIMIT = 8          # заявок
RATE_WINDOW = 600       # за 10 минут с одного IP

REQUEST_TYPES = {
    "consultation": "Запись на консультацию",
    "callback": "Обратный звонок",
    "question": "Вопрос юристу",
    "service": "Заказ услуги",
}
STATUSES = ("new", "in_progress", "done", "rejected")

FIELD_LIMITS = {
    "name": 120,
    "phone": 40,
    "email": 120,
    "service": 160,
    "date": 20,
    "time": 10,
    "format": 40,
    "message": 4000,
    "contact_method": 40,
}

db_lock = threading.Lock()
sessions = {}           # token -> expiry
rate_hits = {}          # ip -> [timestamps]


# ---------------------------------------------------------------- storage

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    DATA_DIR.mkdir(exist_ok=True)
    with db_lock, db() as conn:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                type TEXT NOT NULL,
                name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                contact_method TEXT,
                service TEXT,
                date TEXT,
                time TEXT,
                format TEXT,
                message TEXT,
                ip TEXT,
                user_agent TEXT,
                status TEXT NOT NULL DEFAULT 'new',
                note TEXT
            )"""
        )


def load_admin_password():
    env = os.environ.get("BORIS_ADMIN_PASSWORD")
    if env:
        return env, False
    if PASSWORD_FILE.exists():
        return PASSWORD_FILE.read_text(encoding="utf-8").strip(), False
    pwd = secrets.token_urlsafe(12)
    PASSWORD_FILE.write_text(pwd + "\n", encoding="utf-8")
    try:
        os.chmod(PASSWORD_FILE, 0o600)
    except OSError:
        pass
    return pwd, True


# ---------------------------------------------------------------- validation

PHONE_RE = re.compile(r"^[0-9+()\-\s]{6,40}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TIME_RE = re.compile(r"^\d{2}:\d{2}$")


def clean(payload):
    """Возвращает (данные, ошибки)."""
    errors = {}
    data = {}
    rtype = str(payload.get("type", "")).strip()
    if rtype not in REQUEST_TYPES:
        errors["type"] = "Неизвестный тип заявки"
    data["type"] = rtype

    for field, limit in FIELD_LIMITS.items():
        value = payload.get(field, "")
        value = "" if value is None else str(value).strip()
        if len(value) > limit:
            errors[field] = "Слишком длинное значение"
        data[field] = value[:limit]

    if len(data["name"]) < 2:
        errors["name"] = "Укажите имя"
    if not data["phone"] and not data["email"]:
        errors["phone"] = "Укажите телефон или e-mail для связи"
    if data["phone"] and not PHONE_RE.match(data["phone"]):
        errors["phone"] = "Проверьте номер телефона"
    if data["email"] and not EMAIL_RE.match(data["email"]):
        errors["email"] = "Проверьте адрес e-mail"
    if rtype == "callback" and not data["phone"]:
        errors["phone"] = "Для обратного звонка нужен телефон"
    if rtype == "question" and len(data["message"]) < 10:
        errors["message"] = "Опишите вопрос подробнее (от 10 символов)"
    if rtype == "consultation":
        if not DATE_RE.match(data["date"]):
            errors["date"] = "Выберите дату"
        else:
            try:
                d = datetime.strptime(data["date"], "%Y-%m-%d").date()
                if d < datetime.now().date():
                    errors["date"] = "Дата уже прошла"
                elif d.weekday() == 6:
                    errors["date"] = "В воскресенье приёма нет"
            except ValueError:
                errors["date"] = "Некорректная дата"
        if not TIME_RE.match(data["time"]):
            errors["time"] = "Выберите время"
    if not payload.get("consent"):
        errors["consent"] = "Нужно согласие на обработку данных"
    return data, errors


def rate_limited(ip):
    now = time.time()
    hits = [t for t in rate_hits.get(ip, []) if now - t < RATE_WINDOW]
    limited = len(hits) >= RATE_LIMIT
    if not limited:
        hits.append(now)
    rate_hits[ip] = hits
    return limited


# ---------------------------------------------------------------- HTTP

class Handler(BaseHTTPRequestHandler):
    server_version = "BorisLawyer/1.0"
    admin_password = ""

    # --- helpers
    def client_ip(self):
        return self.client_address[0]

    def send_json(self, obj, status=200, extra_headers=None):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (extra_headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def security_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; img-src 'self' data:; style-src 'self' "
            "https://fonts.googleapis.com; font-src https://fonts.gstatic.com; "
            "script-src 'self'; connect-src 'self'; frame-ancestors 'none'",
        )

    def end_headers(self):
        self.security_headers()
        super().end_headers()

    def read_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY:
            return None
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return None

    def session_token(self):
        cookie = SimpleCookie(self.headers.get("Cookie", ""))
        morsel = cookie.get("boris_admin")
        return morsel.value if morsel else None

    def is_admin(self):
        token = self.session_token()
        exp = sessions.get(token) if token else None
        if exp and exp > time.time():
            return True
        if token:
            sessions.pop(token, None)
        return False

    def same_origin(self):
        """Защита от CSRF для изменяющих запросов панели."""
        origin = self.headers.get("Origin")
        if not origin:
            return True
        return urlparse(origin).netloc == self.headers.get("Host")

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s %s\n" % (
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"), self.client_ip(), fmt % args))

    # --- routing
    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/health":
            return self.send_json({"ok": True})
        if path == "/api/admin/requests":
            return self.admin_list()
        if path == "/api/admin/export.csv":
            return self.admin_export()
        if path == "/api/admin/me":
            return self.send_json({"admin": self.is_admin()})
        if path in ("/admin", "/admin/"):
            path = "/admin.html"
        if path == "/":
            path = "/index.html"
        return self.serve_static(path)

    def do_HEAD(self):
        self.do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/requests":
            return self.create_request()
        if path == "/api/admin/login":
            return self.admin_login()
        if path == "/api/admin/logout":
            return self.admin_logout()
        m = re.fullmatch(r"/api/admin/requests/(\d+)", path)
        if m:
            return self.admin_update(int(m.group(1)))
        m = re.fullmatch(r"/api/admin/requests/(\d+)/delete", path)
        if m:
            return self.admin_delete(int(m.group(1)))
        self.send_json({"error": "Не найдено"}, 404)

    # --- static
    def serve_static(self, path):
        target = (STATIC_DIR / path.lstrip("/")).resolve()
        if STATIC_DIR not in target.parents or not target.is_file():
            target = STATIC_DIR / "404.html"
            status = 404
        else:
            status = 200
        data = target.read_bytes()
        ctype = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/javascript", "image/svg+xml"):
            ctype += "; charset=utf-8"
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)

    # --- public API
    def create_request(self):
        payload = self.read_json()
        if not isinstance(payload, dict):
            return self.send_json({"error": "Некорректный запрос"}, 400)
        if payload.get("website"):          # honeypot — поле заполняют только боты
            return self.send_json({"ok": True, "id": 0})
        if rate_limited(self.client_ip()):
            return self.send_json(
                {"error": "Слишком много заявок. Попробуйте позже."}, 429)
        data, errors = clean(payload)
        if errors:
            return self.send_json({"error": "Проверьте поля формы", "fields": errors}, 422)
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with db_lock, db() as conn:
            cur = conn.execute(
                """INSERT INTO requests (created_at, type, name, phone, email,
                   contact_method, service, date, time, format, message, ip, user_agent)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (now, data["type"], data["name"], data["phone"], data["email"],
                 data["contact_method"], data["service"], data["date"], data["time"],
                 data["format"], data["message"], self.client_ip(),
                 (self.headers.get("User-Agent") or "")[:300]),
            )
            rid = cur.lastrowid
        print("\a\n=== НОВАЯ ЗАЯВКА #%d: %s — %s, %s %s ===\n" % (
            rid, REQUEST_TYPES[data["type"]], data["name"], data["phone"], data["email"]),
            flush=True)
        self.send_json({"ok": True, "id": rid}, 201)

    # --- admin API
    def admin_login(self):
        payload = self.read_json() or {}
        if rate_limited("login:" + self.client_ip()):
            return self.send_json({"error": "Слишком много попыток"}, 429)
        given = str(payload.get("password", "")).encode("utf-8")
        if not hmac.compare_digest(
                hashlib.sha256(given).digest(),
                hashlib.sha256(self.admin_password.encode("utf-8")).digest()):
            return self.send_json({"error": "Неверный пароль"}, 401)
        token = secrets.token_urlsafe(32)
        sessions[token] = time.time() + SESSION_TTL
        cookie = "boris_admin=%s; Path=/; HttpOnly; SameSite=Strict; Max-Age=%d" % (
            token, SESSION_TTL)
        self.send_json({"ok": True}, extra_headers={"Set-Cookie": cookie})

    def admin_logout(self):
        token = self.session_token()
        sessions.pop(token, None)
        self.send_json({"ok": True}, extra_headers={
            "Set-Cookie": "boris_admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"})

    def admin_list(self):
        if not self.is_admin():
            return self.send_json({"error": "Требуется вход"}, 401)
        with db_lock, db() as conn:
            rows = [dict(r) for r in conn.execute(
                "SELECT * FROM requests ORDER BY id DESC LIMIT 1000")]
        counts = {s: 0 for s in STATUSES}
        for r in rows:
            counts[r["status"]] = counts.get(r["status"], 0) + 1
        self.send_json({"requests": rows, "counts": counts, "types": REQUEST_TYPES})

    def admin_update(self, rid):
        if not self.is_admin() or not self.same_origin():
            return self.send_json({"error": "Требуется вход"}, 401)
        payload = self.read_json() or {}
        status = payload.get("status")
        note = payload.get("note")
        if status is not None and status not in STATUSES:
            return self.send_json({"error": "Неизвестный статус"}, 400)
        with db_lock, db() as conn:
            if status is not None:
                conn.execute("UPDATE requests SET status=? WHERE id=?", (status, rid))
            if note is not None:
                conn.execute("UPDATE requests SET note=? WHERE id=?",
                             (str(note)[:2000], rid))
        self.send_json({"ok": True})

    def admin_delete(self, rid):
        if not self.is_admin() or not self.same_origin():
            return self.send_json({"error": "Требуется вход"}, 401)
        with db_lock, db() as conn:
            conn.execute("DELETE FROM requests WHERE id=?", (rid,))
        self.send_json({"ok": True})

    def admin_export(self):
        if not self.is_admin():
            return self.send_json({"error": "Требуется вход"}, 401)
        with db_lock, db() as conn:
            rows = conn.execute("SELECT * FROM requests ORDER BY id").fetchall()
            cols = [d[0] for d in conn.execute("SELECT * FROM requests LIMIT 0").description]
        buf = io.StringIO()
        writer = csv.writer(buf, delimiter=";")
        writer.writerow(cols)
        for r in rows:
            # защита от формул при открытии в Excel
            writer.writerow([("'" + str(v)) if isinstance(v, str) and v and v[0] in "=+-@"
                             else v for v in r])
        body = ("﻿" + buf.getvalue()).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header("Content-Disposition", 'attachment; filename="zayavki.csv"')
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    parser = argparse.ArgumentParser(description="Сайт «Лучше звоните Борису»")
    parser.add_argument("--host", default=os.environ.get("BORIS_HOST", "0.0.0.0"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("BORIS_PORT", 8080)))
    args = parser.parse_args()

    init_db()
    password, generated = load_admin_password()
    Handler.admin_password = password

    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    port_part = "" if args.port == 80 else ":%d" % args.port
    print("=" * 60)
    print(" «Лучше звоните Борису» — сайт запущен")
    print("   http://localhost%s" % port_part)
    print("   http://boris_lawyer%s       (после setup_domain)" % port_part)
    print("   http://boris-lawyer.local%s (после setup_domain)" % port_part)
    print("   Панель заявок: /admin")
    if generated:
        print("   Пароль администратора (создан сейчас): %s" % password)
    else:
        print("   Пароль администратора: см. %s или BORIS_ADMIN_PASSWORD" % PASSWORD_FILE.name)
    print("   Заявки сохраняются в: %s" % DB_PATH)
    print("=" * 60, flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nОстановлено.")


if __name__ == "__main__":
    main()
