import { chmodSync, existsSync, unlinkSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

/**
 * The renderer on a Unix socket instead of a TCP port (D-047).
 *
 * The shared host accepts no connection to a port a customer's process opens — not from SSH, not from the
 * web server's PHP: Inertia's renderer said „started“ and was never reached, so every page went out without
 * server rendering. A socket file is reachable, and only by this account (0600) — where a port on 127.0.0.1
 * would be open to every other site on the machine. The same three routes as Inertia's own server.
 */
export function listenOnSocket(render: (page: unknown) => Promise<unknown>, path: string): void {
    // A renderer that was killed leaves its socket file behind, and listen() refuses an existing path.
    if (existsSync(path)) {
        unlinkSync(path)
    }

    createServer((request: IncomingMessage, response: ServerResponse) => {
        void handle(render, request, response)
    }).listen(path, () => {
        chmodSync(path, 0o600)
        console.log(`Inertia SSR server started on ${path}.`)
    })
}

async function handle(render: (page: unknown) => Promise<unknown>, request: IncomingMessage, response: ServerResponse): Promise<void> {
    const send = (status: number, body: unknown): void => {
        response.writeHead(status, { 'Content-Type': 'application/json', Server: 'Inertia.js SSR' })
        response.end(JSON.stringify(body))
    }

    if (request.url === '/health') {
        send(200, { status: 'OK', timestamp: Date.now() })

        return
    }

    if (request.url !== '/render' || request.method !== 'POST') {
        send(404, { status: 'NOT_FOUND', timestamp: Date.now() })

        return
    }

    let body = ''

    for await (const chunk of request) {
        body += String(chunk)
    }

    try {
        send(200, await render(JSON.parse(body)))
    } catch (error) {
        console.error(error)
        send(500, { error: error instanceof Error ? error.message : String(error), type: 'render' })
    }
}
