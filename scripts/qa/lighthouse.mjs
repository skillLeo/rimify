// Lighthouse CI against the running production build, using Playwright's Chromium so the gate
// needs no separately installed browser. Usage: node scripts/qa/lighthouse.mjs [--url /felgen]
import { spawnSync } from 'node:child_process'
import { chromium } from '@playwright/test'
import { BASE, parseArgs } from './lib.mjs'

const args = parseArgs()
const url = BASE + (args.url ?? '/')

const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['lhci', 'autorun', `--collect.url=${url}`],
    {
        stdio: 'inherit',
        shell: process.platform === 'win32',
        env: { ...process.env, CHROME_PATH: chromium.executablePath(), QA_BASE_URL: BASE },
    },
)

process.exit(result.status ?? 1)
