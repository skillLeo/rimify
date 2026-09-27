#!/usr/bin/env bash
# Keeps the SSR renderer running on the shared host.
#
# The host may stop long-lived processes at any time. While the renderer is gone, pages are drawn by
# the browser instead (BoundedSsrGateway falls back at once) — correct, but a slower first paint. Cron
# runs this every minute (remote.sh installs it); while the renderer answers, it does nothing.
set -u

APP="$(cd "$(dirname "$0")/.." && pwd)"
NODE="${NODE_BIN:-/opt/alt/alt-nodejs22/root/usr/bin/node}"
SSR_PORT="${SSR_PORT:-13714}"

if curl -s -m 2 -o /dev/null "http://127.0.0.1:$SSR_PORT/health"; then
    exit 0
fi

# Not answering: stop a stuck renderer of this app (only this app's), then start a fresh one.
for pid in $(pgrep -u "$(id -u)" -x node || true); do
    if tr '\0' ' ' < "/proc/$pid/cmdline" | grep -q "$APP/bootstrap/ssr/ssr.js"; then
        kill "$pid" 2> /dev/null || true
    fi
done

sleep 1
cd "$APP" || exit 1
INERTIA_SSR_PORT="$SSR_PORT" nohup setsid "$NODE" "$APP/bootstrap/ssr/ssr.js" >> storage/logs/ssr.log 2>&1 < /dev/null &
echo "$(date -u +%FT%TZ) renderer restarted by ssr-watch" >> storage/logs/ssr.log
