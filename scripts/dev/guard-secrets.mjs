#!/usr/bin/env node
// PreToolUse guard (D-184): a shell command that can print a credential runs only through scripts/dev/redact.mjs.
// After a masking regex of ours printed the review accounts' passwords into a tool output (06.10.2026, all ten rotated
// the same hour), reading a credential source unredacted is refused before it runs, with the way to run it instead.
//
// Wired as a Claude Code hook in the machine's own .claude/settings.json (outside the repository):
//   "PreToolUse": [{ "matcher": "Bash|PowerShell", "hooks": [{ "type": "command", "command": "node scripts/dev/guard-secrets.mjs" }] }]
// It reads the hook's JSON on stdin and answers with a deny, or nothing (allow). docs/dev/SECRETS.md says more.
const chunks = []
process.stdin.on('data', (c) => chunks.push(c))
process.stdin.on('end', () => {
    let data
    try {
        data = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch {
        process.exit(0)
    }

    const command = String(data?.tool_input?.command ?? '')

    // Already through the redaction step: nothing to guard.
    if (/scripts[\\/]dev[\\/]redact\.mjs/.test(command)) {
        process.exit(0)
    }

    const sources = [
        [/ACCOUNTS\.md/i, 'docs/review/ACCOUNTS.md holds the review accounts\' passwords'],
        [/rimify-deployment\.md/i, 'the deployment notes hold the host\'s access'],
        [/\b(Get-Content|gc|cat|type|Select-String|sls|grep|findstr|more|less|head|tail|sed|awk)\b[^|;\n]*\.env(?!\.example)\b/i, 'a .env file holds keys and passwords'],
        [/\b(ssh|plink|scp|pscp)(\.exe)?\b/i, 'a command on the host can print its .env or a password'],
        [/\bMYSQL_PWD\b|\bprintenv\b|\b(Get-ChildItem|gci|dir|ls)\s+env:/i, 'the environment holds passwords'],
        [/artisan\s+(tinker|config:show)\b/i, 'the configuration holds the keys it was given'],
    ]

    const hit = sources.find(([pattern]) => pattern.test(command))

    if (!hit) {
        process.exit(0)
    }

    process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: `Refused unredacted: ${hit[1]}. Run the same command with its output piped through the redaction step: <command> | node scripts/dev/redact.mjs (D-184).`,
        },
    }))
    process.exit(0)
})
