/*
 * The end-to-end suites' web server: several PHP built-in servers behind one port.
 *
 * `php artisan serve` and `php -S` answer one request at a time on Windows (PHP_CLI_SERVER_WORKERS is
 * not supported there). A page's document, its scripts, a deferred prop and a server render then queue
 * behind one another, and a long run of tests — each waiting on a page that waits on the queue — times
 * out where the same test alone passes. Production answers with many PHP-FPM workers; this gives the
 * suites the same shape: N backends, every request to the least busy one.
 *
 *   node scripts/e2e/serve.mjs --port 8000 --workers 4
 *   node scripts/e2e/serve.mjs --port 8010 --workers 4
 *   node scripts/e2e/serve.mjs --port 8012 --workers 2
 *
 * The backends listen on ports the operating system hands out, never on a fixed scheme: the old one, port + 100 + i,
 * put the :8020 server's fourth worker on 8123, where another project on this machine serves — that worker never
 * started, and the proxy never answered (04.10.2026). The environment passes through, so a suite's own database
 * reaches every backend. Stopping this process stops them.
 *
 * The shop's port (8010) always serves the shop's database, `rimify_wf_e2e` on the MariaDB the suite reseeds
 * (e2e/shop.ts SHOP_DB, :3308), unless the environment names another. Started by hand with the database's name alone,
 * it once took the port from `.env` — the development MySQL, holding a stale copy of the shop — and every storefront
 * spec of a run read that copy (01.10.2026: PAY-01 failed on a column the stale copy lacked).
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const option = (name, fallback) => {
    const index = process.argv.indexOf(`--${name}`)

    return index > -1 && process.argv[index + 1] !== undefined ? process.argv[index + 1] : fallback
}

const port = Number(option('port', '8000'))
const count = Math.max(1, Number(option('workers', '4')))

/** The shop's database, as e2e/shop.ts names it: the e2e shop is never served from another. */
const SHOP_PORT = 8010
const env =
    port === SHOP_PORT
        ? { ...process.env, DB_DATABASE: process.env.DB_DATABASE ?? 'rimify_wf_e2e', DB_PORT: process.env.DB_PORT ?? process.env.E2E_SHOP_DB_PORT ?? '3308' }
        : process.env
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const router = path.join(root, 'vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php')
const php = process.env.PHP_BINARY ?? 'php'

/** `n` ports nothing listens on, from the operating system: all held at once, so no two are the same, then let go. */
async function freePorts(n) {
    const probes = await Promise.all(
        Array.from(
            { length: n },
            () =>
                new Promise((resolve, reject) => {
                    const probe = net.createServer()
                    probe.on('error', reject)
                    probe.listen(0, '127.0.0.1', () => resolve(probe))
                })
        )
    )
    const ports = probes.map((probe) => probe.address().port)
    await Promise.all(probes.map((probe) => new Promise((resolve) => probe.close(resolve))))

    return ports
}

const backends = (await freePorts(count)).map((backendPort) => {
    const child = spawn(php, ['-S', `127.0.0.1:${backendPort}`, router], { cwd: path.join(root, 'public'), env, stdio: 'ignore', windowsHide: true })

    return { port: backendPort, child, busy: 0 }
})

function stop() {
    for (const backend of backends) {
        backend.child.kill()
    }
}

process.on('exit', stop)
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(signal, () => process.exit(0))
}

/** Resolves once a backend answers `/up`, or rejects after the given milliseconds. */
function ready(backend, timeout) {
    const started = Date.now()

    return new Promise((resolve, reject) => {
        const probe = () => {
            const request = http.get({ host: '127.0.0.1', port: backend.port, path: '/up', timeout: 2000 }, (response) => {
                response.resume()
                response.statusCode === 200 ? resolve() : retry()
            })
            request.on('error', retry)
            request.on('timeout', () => request.destroy())
        }
        const retry = () => (Date.now() - started > timeout ? reject(new Error(`PHP on ${backend.port} did not answer`)) : setTimeout(probe, 250))

        probe()
    })
}

await Promise.all(backends.map((backend) => ready(backend, 60_000)))

/*
 * A file under public/ is served here, not by a PHP worker (D-267). PHP's built-in server serves a request for an
 * existing file itself, in the worker the request reached: an admin page's thirty scripts held all four workers, and
 * the page's own requests — a save, a sign-out — queued behind them; on a loaded machine past a test's wait. In
 * production LiteSpeed and the CDN serve these files; PHP never sees them. Same files as before (Laravel's server.php
 * hands over any existing file), except that a .php file or a dotfile still goes to PHP, as does every directory.
 */
const PUBLIC = path.join(root, 'public')
const TYPES = {
    '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.map': 'application/json',
    '.webmanifest': 'application/manifest+json', '.html': 'text/html', '.txt': 'text/plain', '.xml': 'text/xml', '.csv': 'text/csv',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
    '.avif': 'image/avif', '.ico': 'image/vnd.microsoft.icon', '.ktx2': 'image/ktx2', '.woff2': 'font/woff2', '.woff': 'font/woff',
    '.ttf': 'font/ttf', '.otf': 'font/otf', '.pdf': 'application/pdf', '.wasm': 'application/wasm', '.mp4': 'video/mp4',
    '.webm': 'video/webm', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.zip': 'application/zip',
}

/** The file under public/ a GET or HEAD names, as PHP's built-in server would hand it out itself — or null for the app. */
function publicFile(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return null
    }

    let pathname

    try {
        pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://127.0.0.1').pathname)
    } catch {
        return null
    }

    const file = path.join(PUBLIC, pathname)
    const name = path.basename(file)

    if (pathname === '/' || pathname.includes('\0') || !file.startsWith(PUBLIC + path.sep) || name.startsWith('.') || path.extname(name).toLowerCase() === '.php') {
        return null
    }

    try {
        const stat = fs.statSync(file)

        return stat.isFile() ? { file, size: stat.size, type: TYPES[path.extname(name).toLowerCase()] ?? 'application/octet-stream' } : null
    } catch {
        return null
    }
}

http.createServer((request, response) => {
    const asset = publicFile(request)

    if (asset !== null) {
        response.writeHead(200, { 'content-type': asset.type, 'content-length': asset.size })

        if (request.method === 'HEAD') {
            response.end()

            return
        }

        fs.createReadStream(asset.file).on('error', () => response.destroy()).pipe(response)

        return
    }

    const backend = backends.reduce((least, candidate) => (candidate.busy < least.busy ? candidate : least))
    let released = false
    const release = () => {
        if (!released) {
            released = true
            backend.busy--
        }
    }

    backend.busy++
    const upstream = http.request({ host: '127.0.0.1', port: backend.port, method: request.method, path: request.url, headers: request.headers }, (answer) => {
        response.writeHead(answer.statusCode ?? 502, answer.headers)
        answer.pipe(response)
        answer.on('end', release)
        answer.on('error', release)
    })

    upstream.on('error', (error) => {
        release()

        if (!response.headersSent) {
            response.writeHead(502, { 'content-type': 'text/plain' })
        }

        response.end(`e2e server: ${error.message}`)
    })
    response.on('close', release)
    request.pipe(upstream)
}).listen(port, '127.0.0.1', () => {
    console.log(`e2e server on http://127.0.0.1:${port}, ${count} PHP workers (${backends.map((b) => b.port).join(', ')})`)
})
