#!/usr/bin/env bash
# Глубинная дуэль — установка / обновление сервера на VPS (Ubuntu / Debian).
# Запуск от root:  curl -fsSL <адрес этого файла> | bash
# Повторный запуск обновляет сервер до последней сборки, данные игроков сохраняются.
set -euo pipefail

JAR_URL="${JAR_URL:-https://github.com/HellowWhere/sm2mod/releases/download/deepduel-latest/deepduel-server.jar}"
PORT="${PORT:-8765}"
APP_DIR=/opt/deepduel
DATA_DIR=/var/lib/deepduel

if [ "$(id -u)" -ne 0 ]; then echo "Запустите от root (или через sudo)"; exit 1; fi

echo "==> Java"
if ! command -v java >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y openjdk-21-jre-headless || apt-get install -y openjdk-17-jre-headless || apt-get install -y default-jre-headless
fi
java -version 2>&1 | head -1

echo "==> Пользователь и папки"
id deepduel >/dev/null 2>&1 || useradd --system --home "$DATA_DIR" --shell /usr/sbin/nologin deepduel
mkdir -p "$APP_DIR" "$DATA_DIR"
chown -R deepduel:deepduel "$DATA_DIR"

echo "==> Загрузка сервера"
curl -fL --retry 3 -o "$APP_DIR/deepduel-server.jar.new" "$JAR_URL"
mv "$APP_DIR/deepduel-server.jar.new" "$APP_DIR/deepduel-server.jar"

echo "==> Служба systemd (автозапуск и перезапуск при сбое)"
cat > /etc/systemd/system/deepduel.service <<UNIT
[Unit]
Description=Deep Duel game server
After=network-online.target
Wants=network-online.target

[Service]
User=deepduel
WorkingDirectory=$DATA_DIR
ExecStart=/usr/bin/env java -XX:MaxRAMPercentage=60 -XX:+UseSerialGC -jar $APP_DIR/deepduel-server.jar --port $PORT --data $DATA_DIR
Restart=always
RestartSec=3
LimitNOFILE=65535
TasksMax=infinity

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable deepduel >/dev/null
systemctl restart deepduel

echo "==> Брандмауэр"
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow "$PORT"/tcp
fi

echo "==> Проверка"
for i in $(seq 1 20); do
  if curl -fs -o /dev/null "http://127.0.0.1:$PORT/"; then break; fi
  sleep 1
done
if curl -fs -o /dev/null "http://127.0.0.1:$PORT/"; then
  IP=$(curl -fs https://api.ipify.org || hostname -I | awk '{print $1}')
  KEY=$(grep -o '"adminKey": *"[^"]*"' "$DATA_DIR/config.json" | sed 's/.*: *"\(.*\)"/\1/')
  echo
  echo "Готово! Сервер работает."
  echo "  Адрес для игры:      $IP:$PORT"
  echo "  В браузере:          http://$IP:$PORT/"
  echo "  Ключ администратора: $KEY"
  echo "  Логи:     journalctl -u deepduel -f"
  echo "  Обновить: запустите эту же команду ещё раз"
else
  echo "Сервер не ответил. Смотрите логи: journalctl -u deepduel -n 50"
  exit 1
fi
