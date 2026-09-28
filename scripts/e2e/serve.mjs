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
 *   DB_DATABASE=rimify_wf_e2e node scripts/e2e/serve.mjs --port 8010 --workers 4
 *
 * The backends listen on port + 100 + i (8100… for 8000, 8110… for 8010). The environment passes through,
 * so a suite's own database reaches every backend. Stopping this process stops them.
 */

import { spawn } from 'node:child_process'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const option = (name, fallback) => {
    const index = process.argv.indexOf(`--${name}`)

    return index > -1 && process.argv[index + 1] !== undefined ? process.argv[index + 1] : fallback
}

const port = Number(option('port', '8000'))
const count = Math.max(1, Number(option('workers', '4')))
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const router = path.join(root, 'vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php')
const php = process.env.PHP_BINARY ?? 'php'

const backends = Array.from({ length: count }, (_, i) => {
    const backendPort = port + 100 + i
    const child = spawn(php, ['-S', `127.0.0.1:${backendPort}`, router], { cwd: path.join(root, 'public'), env: process.env, stdio: 'ignore', windowsHide: true })

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

http.createServer((request, response) => {
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
