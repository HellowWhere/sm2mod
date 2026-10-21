#!/usr/bin/env bash
# Привязывает локальные домены boris_lawyer и boris-lawyer.local к этому компьютеру.
# Запуск: sudo ./setup_domain.sh        (удалить: sudo ./setup_domain.sh --remove)
set -euo pipefail
HOSTS=/etc/hosts
MARK="# boris_lawyer site"
LINE="127.0.0.1 boris_lawyer boris-lawyer.local www.boris-lawyer.local $MARK"

if [[ $EUID -ne 0 ]]; then
  echo "Нужны права администратора: sudo $0 $*"; exit 1
fi

if [[ "${1:-}" == "--remove" ]]; then
  sed -i.bak "/$MARK/d" "$HOSTS"
  echo "Домены удалены из $HOSTS"; exit 0
fi

if grep -q "$MARK" "$HOSTS"; then
  echo "Домены уже настроены."
else
  cp "$HOSTS" "$HOSTS.bak"
  echo "$LINE" >> "$HOSTS"
  echo "Добавлено в $HOSTS: $LINE"
fi
echo "Откройте: http://boris_lawyer:8080  или  http://boris-lawyer.local:8080"
echo "(без :8080 — если сервер запущен на порту 80: sudo python3 server.py --port 80)"
