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

## Writing tests about keys

A test that needs a key-shaped string assembles it at run time — `'sk_'.'live_'.str_repeat('Ab3', 8)` — so
the file itself holds no shape for the scanner (or anyone's) to find. See `tests/Unit/Support/SecretScannerTest.php`.

## Last full history scan

2026-09-28: `php artisan secrets:scan --history` — no credential found (247 commits, 2 020 481 added lines).
