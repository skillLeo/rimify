<?php

declare(strict_types=1);

use Symfony\Component\Process\Process;

/*
 * The redaction step (D-184): scripts/dev/redact.mjs masks every credential before it can reach a terminal or a tool's
 * output, and scripts/dev/guard-secrets.mjs — the machine's Claude Code hook — refuses a command that reads a credential
 * source without it. Written after a masking regex printed the review accounts' passwords (06.10.2026).
 */

function runNode(array $args, string $input = ''): Process
{
    $process = new Process(['node', ...$args], base_path());
    $process->setInput($input);
    $process->run();

    return $process;
}

it('masks key shapes, environment secrets and password columns, and leaves the rest of a line as it was', function (): void {
    // Key shapes are assembled at run time, so this file holds none for the scanner to find (docs/dev/SECRETS.md).
    $script = <<<'JS'
        import { fromEnv, fromAccounts, redactLine } from './scripts/dev/redact.mjs';
        const testKey = 'sk_' + 'test_' + 'abcdefgh';
        const liveKey = 'sk_' + 'live_' + 'abcdef123456';
        const awsId = 'AK' + 'IA' + 'ABCDEFGHIJKLMNOP';
        const env = fromEnv('APP_NAME=RIMIFY\nDB_PASSWORD=geheim-123\nSTRIPE_SECRET="' + testKey + '"\nAPP_KEY=base64:AbCdEf123456\nEMPTY_TOKEN=\n');
        const accounts = fromAccounts('| Rolle | E-Mail | Passwort |\n|---|---|---|\n| Admin | a@b.test | Sommer-2026-x |\n\nText');
        const secrets = [...env, ...accounts];
        console.log(JSON.stringify({ env: env.map((v) => v === testKey ? 'TESTKEY' : v), accounts, line: redactLine('DB geheim-123 · Konto Sommer-2026-x · ' + liveKey + ' · ' + awsId + ' · PASSWORD=x · RIMIFY', secrets) }));
        JS;

    $process = runNode(['--input-type=module', '-e', $script]);
    $out = json_decode(trim($process->getOutput()), true);

    expect($process->isSuccessful())->toBeTrue($process->getErrorOutput())
        ->and($out['env'])->toBe(['geheim-123', 'TESTKEY', 'base64:AbCdEf123456'])
        ->and($out['accounts'])->toBe(['Sommer-2026-x'])
        ->and($out['line'])->toBe('DB [verborgen] · Konto [verborgen] · sk_live_[verborgen] · [verborgen] · PASSWORD=[verborgen] · RIMIFY');
});

it('leaves a value alone that also stands openly under a name that does not say secret', function (): void {
    $root = sys_get_temp_dir().'/rimify-redact-'.bin2hex(random_bytes(4));
    mkdir($root);
    file_put_contents($root.'/.env.e2e', "DB_DATABASE=rimify\nDB_PASSWORD=rimify\nSTRIPE_SECRET=geheim-456\n");

    try {
        $script = 'import { knownSecrets } from "./scripts/dev/redact.mjs"; console.log(JSON.stringify(knownSecrets('.json_encode($root).')));';
        $process = runNode(['--input-type=module', '-e', $script]);

        expect($process->isSuccessful())->toBeTrue($process->getErrorOutput())
            ->and(json_decode(trim($process->getOutput()), true))->toBe(['geheim-456']);
    } finally {
        unlink($root.'/.env.e2e');
        rmdir($root);
    }
});

it('streams a piped output through, line by line', function (): void {
    $process = runNode(['scripts/dev/redact.mjs'], "erste Zeile\n".'whsec_'."abcdef123456\n");

    expect($process->isSuccessful())->toBeTrue()
        ->and($process->getOutput())->toBe("erste Zeile\nwhsec_[verborgen]\n");
});

it('refuses a command that reads a credential source unredacted, and lets the same command through the step', function (string $command, bool $refused): void {
    $process = runNode(['scripts/dev/guard-secrets.mjs'], (string) json_encode(['tool_name' => 'PowerShell', 'tool_input' => ['command' => $command]]));
    $answer = json_decode($process->getOutput(), true);

    expect($process->isSuccessful())->toBeTrue()
        ->and(($answer['hookSpecificOutput']['permissionDecision'] ?? 'allow') === 'deny')->toBe($refused);
})->with([
    'the accounts file' => ['Get-Content docs/review/ACCOUNTS.md', true],
    'the accounts file, redacted' => ['Get-Content docs/review/ACCOUNTS.md | node scripts/dev/redact.mjs', false],
    'a .env read' => ['Select-String -Path .env -Pattern DB_', true],
    'the example .env' => ['Get-Content .env.example', false],
    'a command on the host' => ['ssh -p 65002 u@h "grep DB_ .env"', true],
    'a command on the host, redacted' => ['ssh -p 65002 u@h cmd | node scripts/dev/redact.mjs', false],
    'the environment' => ['Get-ChildItem env:', true],
    'the configuration' => ["php artisan tinker --execute=\"echo config('app.key');\"", true],
    'a test run' => ['php vendor/bin/pest tests/Unit', false],
]);
