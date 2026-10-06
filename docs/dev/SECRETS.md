# Secrets — keys, passwords and certificates

For everyone who works on RIMIFY. After a live payment key was pasted into a working session by
mistake (2026-09-28, rolled the same day), this is the rule and the machinery that holds it.

## The rule

> Never accept, store or use a live payment or cloud credential. A key whose prefix marks it as live
> (`sk_live_`, `rk_live_`, `AKIA…` for a production account) is refused, is not written to any file,
> and the operator is told to roll it. Live credentials are entered by a human in the admin panel on
> the production site and nowhere else. Build and test only against test credentials.

In practice:

| Credential | Where it lives | Never |
|---|---|---|
| Stripe **test** keys (`pk_test_`, `sk_test_`, `whsec_` from `stripe listen`) | your `.env` (git-ignored) | a commit, a log line, a chat message, a screenshot |
| Stripe **live** keys | Einstellungen › Zahlung on the production site, typed by a person | `.env` on any machine, a deploy script, a chat |
| S3 keys | Einstellungen › Medien und Speicher (production), `.env` for a test bucket | as above |
| Database password | `.env` on the server | `DB_URL` in a committed file |
| An admin account's password on any shared copy (the preview, the live shop) | the operator's `docs/review/ACCOUNTS.md`, which git ignores (D-141); set with `printf '%s\n' "$NEW" \| php artisan rimify:admin-passwort <email>` | a seeder, a test, a committed doc, a command-line argument |
| Development passwords (`rimify-dev-2026`, `rimify-review-2026`) | local and testing databases only — the seeders set them nowhere else | any shared copy: `rimify:preflight` names every account that still opens with one (NO-GO in production) |

A credential that has been in a file, a commit, a message or a screenshot counts as known: **roll it at
its provider** (Stripe: Developers › API keys › Roll key). Deleting the file does not make it secret again,
and a committed key stays in the history until the history is rewritten.

## The machinery

- **`php artisan secrets:scan`** — fails when a credential is found, with the file, the line and the
  credential masked to its last four characters (it never prints one). Shapes: `sk_live_`, `rk_live_`,
  `sk_test_`, `pk_live_`, `whsec_`, `AKIA…`/`ASIA…`, a 40-character AWS secret beside a name that says
  secret, AWS or S3, a PEM private key header, and a `DATABASE_URL`/`DB_URL` with a password
  (`app/Support/Security/SecretScanner.php`).
  - no option: the working tree (every tracked file and every new one git would take)
  - `--staged`: the lines the next commit adds
  - `--history`: every line ever added, in every commit of every branch
  - `path …`: the files or folders named
- **The pre-commit hook** (`.githooks/pre-commit`) runs `secrets:scan --staged` and refuses the commit on
  a finding. `composer install` points git at it (`git config core.hooksPath .githooks`); on a clone
  where that did not run, run it by hand once.
- **`composer verify`** runs `secrets:scan` over the working tree.
- **At runtime** (`app/Payments/StripeKeys.php`): the mode is explicit (`STRIPE_MODE=test|live`, later the
  Testmodus/Livemodus switch in Einstellungen › Zahlung). A live key outside production, a live key in
  Testmodus, a test key in Livemodus and a key in the wrong field are refused — by the settings screen
  when it saves, and at boot for `.env`, where a refused key is dropped, logged masked, and fails
  `rimify:preflight` until `.env` is corrected.

## Nothing printed into a tool's output (D-184)

On 06.10.2026 a PowerShell masking command printed the review accounts' passwords into a tool output; all ten were
rotated the same hour. Since then two scripts keep a credential out of every command's output on the machine:

- **`scripts/dev/redact.mjs`** — a filter: `<command> | node scripts/dev/redact.mjs`. It masks, as `[verborgen]`, the
  value of every secret-named key in `.env` and `.env.*` (not `.env.example`), every cell of a „Passwort“ column in
  `docs/review/ACCOUNTS.md`, every line of a local `.redact` file (further values, never committed), and anything
  shaped like a key (Stripe `sk_`/`rk_`/`pk_` live and test, `whsec_`, `AKIA…`, a private-key block, the value after
  `MYSQL_PWD=`, `password=`, `secret=`, `token=`).
- **`scripts/dev/guard-secrets.mjs`** — the machine's Claude Code `PreToolUse` hook (in `.claude/settings.json`, which
  stays out of the repository): a shell command that reads `ACCOUNTS.md`, a `.env`, the environment, the configuration
  (`tinker`, `config:show`), the deployment notes, or runs anything on the host (`ssh`, `plink`, `scp`) is refused
  unless its output goes through the filter — and the refusal says how to run it.

`tests/Feature/Platform/RedactionTest.php` proves both.

## Writing tests about keys

A test that needs a key-shaped string assembles it at run time — `'sk_'.'live_'.str_repeat('Ab3', 8)` — so
the file itself holds no shape for the scanner (or anyone's) to find. See `tests/Unit/Support/SecretScannerTest.php`.

## Last full history scan

2026-09-28: `php artisan secrets:scan --history` — no credential found (247 commits, 2 020 481 added lines).

2026-10-02, after the repository had been public since 23.09.2026 (D-141):

- `php artisan secrets:scan --history` — no credential found (475 commits, 2 629 205 added lines).
- A wider pass over the same history, the reflog and the 56 unreachable commits (10 870 804 and 8 498 921
  added lines, merge commits included): the host's SSH/hPanel password and its database password, searched
  for literally, appear nowhere; no `APP_KEY` value, no committed `.env`, no GitHub or Google token, no
  private key, no database dump, no PDF, no spreadsheet was ever added. The only credential-shaped lines are
  placeholders (`change_me`, `sk_test_…`) and test passwords; the Stripe fixtures are synthetic
  (`acct_1FakeRimify00`). Nothing that moves money or opens a client's account was ever in the repository.
- What was public and mattered: the preview's admin passwords — the three review accounts' and the seven
  development accounts' (two of them Super-Admin; the sign-in does not ask for a second factor). All ten
  were rotated on 02.10.2026 and every session of them ended; since then no account on the preview opens
  with a password that stood in the repository.
