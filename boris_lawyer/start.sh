#!/usr/bin/env bash
# Запуск сайта. Порт можно передать аргументом: ./start.sh 80
cd "$(dirname "$0")"
exec python3 server.py --port "${1:-8080}"
