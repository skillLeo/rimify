#!/usr/bin/env bash
# Keeps the SSR renderer running on the shared host.
#
# The host may stop long-lived processes at any time. While the renderer is gone, pages are drawn by
# the browser instead (BoundedSsrGateway falls back at once) — correct, but a slower first paint. Cron
# runs this every minute (remote.sh installs it); while the renderer answers, it does nothing.
#
# It listens on a socket file (D-047): the shared host reaches no port a customer's process opens.
# SSR_SOCKET= (empty) keeps the TCP port.
set -u

APP="$(cd "$(dirname "$0")/.." && pwd)"
NODE="${NODE_BIN:-/opt/alt/alt-nodejs22/root/usr/bin/node}"
SSR_PORT="${SSR_PORT:-13714}"
SSR_SOCKET="${SSR_SOCKET-$APP/storage/framework/ssr.sock}"

if [ -n "$SSR_SOCKET" ]; then
    curl -s -m 2 -o /dev/null -f --unix-socket "$SSR_SOCKET" http://localhost/health && exit 0
else
    curl -s -m 2 -o /dev/null -f "http://127.0.0.1:$SSR_PORT/health" && exit 0
fi

# Not answering: stop a stuck renderer of this app (only this app's), then start a fresh one.
for pid in $(pgrep -u "$(id -u)" -x node || true); do
    if tr '\0' ' ' < "/proc/$pid/cmdline" | grep -q "$APP/bootstrap/ssr/ssr.js"; then
        kill "$pid" 2> /dev/null || true
    fi
done

sleep 1
cd "$APP" || exit 1
INERTIA_SSR_PORT="$SSR_PORT" INERTIA_SSR_SOCKET="$SSR_SOCKET" nohup setsid "$NODE" "$APP/bootstrap/ssr/ssr.js" >> storage/logs/ssr.log 2>&1 < /dev/null &
echo "$(date -u +%FT%TZ) renderer restarted by ssr-watch" >> storage/logs/ssr.log
