#!/usr/bin/env bash
# Keeps the SSR renderer running on the shared host.
#
# The host may stop long-lived processes at any time. While the renderer is gone, pages are drawn by
# the browser instead (BoundedSsrGateway falls back at once) — correct, but a slower first paint. Cron
# runs this every minute (remote.sh installs it); while the renderer answers, it does nothing.
#
# It looks twice a run — at once and half a minute later — so a stopped renderer is back within about
# 30 s, not up to a minute; the gateway asks a renderer started after its rest at once (its socket is
# new), so server-rendered pages return with it. Measured on the preview, 02.10.2026: one look a minute
# brought the renderer back 52 s after a kill and the first server-rendered page at 65 s.
#
# It listens on a socket file (D-047): the shared host reaches no port a customer's process opens.
# SSR_SOCKET= (empty) keeps the TCP port.
set -u

APP="$(cd "$(dirname "$0")/.." && pwd)"
NODE="${NODE_BIN:-/opt/alt/alt-nodejs22/root/usr/bin/node}"
SSR_PORT="${SSR_PORT:-13714}"
SSR_SOCKET="${SSR_SOCKET-$APP/storage/framework/ssr.sock}"
# Seconds between the two looks; 0 looks once.
SSR_WATCH_AGAIN="${SSR_WATCH_AGAIN:-30}"

answers() {
    if [ -n "$SSR_SOCKET" ]; then
        curl -s -m 2 -o /dev/null -f --unix-socket "$SSR_SOCKET" http://localhost/health
    else
        curl -s -m 2 -o /dev/null -f "http://127.0.0.1:$SSR_PORT/health"
    fi
}

# Not answering: stop a stuck renderer of this app (only this app's), then start a fresh one.
restart() {
    for pid in $(pgrep -u "$(id -u)" -x node || true); do
        if tr '\0' ' ' < "/proc/$pid/cmdline" | grep -q "$APP/bootstrap/ssr/ssr.js"; then
            kill "$pid" 2> /dev/null || true
        fi
    done

    sleep 1
    cd "$APP" || exit 1
    # The renderer gets none of this run's descriptors beyond its log. The host's cron runs this under `flock`, which
    # holds its lock on a descriptor every child inherits: a renderer started with it held the lock for as long as it
    # lived, every later run gave up after a second, and a renderer that hung would never have been replaced
    # (the preview, 03.10.2026: the watchdog only ran again once its renderer had died).
    (
        for fd in /proc/"$BASHPID"/fd/*; do
            fd="${fd##*/}"
            if [ "$fd" -gt 2 ] 2> /dev/null; then eval "exec $fd>&-" 2> /dev/null; fi
        done
        INERTIA_SSR_PORT="$SSR_PORT" INERTIA_SSR_SOCKET="$SSR_SOCKET" exec nohup setsid "$NODE" "$APP/bootstrap/ssr/ssr.js" >> storage/logs/ssr.log 2>&1 < /dev/null
    ) &
    echo "$(date -u +%FT%TZ) renderer restarted by ssr-watch" >> storage/logs/ssr.log
}

# A renderer started on the first look is left to start: the next run looks at it again.
if ! answers; then
    restart
    exit 0
fi

[ "$SSR_WATCH_AGAIN" -gt 0 ] 2> /dev/null || exit 0
sleep "$SSR_WATCH_AGAIN"
answers || restart
