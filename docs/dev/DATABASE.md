# The database engines

The shop leans on its database for guarantees the PHP cannot give alone: CHECK constraints keep an inverted
permitted range or a zero axle load out of the fitment tables, `SIGNAL` triggers make the order snapshots and
the audit log append-only (R-12), strict mode refuses an unparseable number instead of storing 0 (R-03),
FULLTEXT serves the search, one collation matches `aas` against `AAS` for the TSN lookup.

Two engines can parse the same schema and enforce it differently. On 2026-09-29 the preview host turned out to
run **MariaDB 11.8.9** while the suite had only ever run on **MySQL 8.4.9** (D-052). Since then:

| Where | Engine | Port | How it is started |
|---|---|---|---|
| Hostinger (preview, and production on the same plan) | MariaDB 11.8 | — | the host's |
| Pest, by default (`phpunit.xml`), and the e2e shop (`composer e2e:shop`) | MariaDB 11.8.9 | 3308 | below |
| `composer test:mysql`, and the development shop's `.env` | MySQL 8.4.9 | 3307 | below |
| CI (`.github/workflows/tests.yml`) | both, one leg each | — | Docker, with the host's server settings for MariaDB |

The app refuses any engine the suite has not run against, at the first connection, naming both
(`App\Support\DatabaseEngine`, list in `config/rimify.php` › `database.engines`). A test keeps that list and the
CI matrix equal, so a new engine is added in one change: the CI leg, the list, a green run.

## Running them locally (Windows, no service)

MariaDB 11.8.9, the portable zip from archive.mariadb.org (SHA-256 checked against the published
`sha256sums.txt`), unpacked to `C:\tools\mariadb-11.8.9-winx64`, data in `C:\tools\mariadb-11.8.9-data`. Its
`my.ini` mirrors the host as read there: a lax global `sql_mode` (`NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION`,
the app sets its own per session), `utf8mb4` with `utf8mb4_unicode_ci` as the server's collation,
`innodb_strict_mode=OFF`, UTC. Only `lower_case_table_names` cannot match on Windows (it must be 1 there, 0 on
the host); every table name is lower case.

```powershell
Start-Process -WindowStyle Hidden 'C:\tools\mariadb-11.8.9-winx64\bin\mariadbd.exe' -ArgumentList '--defaults-file=C:\tools\mariadb-11.8.9-data\my.ini'
Start-Process -WindowStyle Hidden 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe' -ArgumentList '--defaults-file="C:\ProgramData\MySQL\MySQL Server 8.4\my.ini"'
```

The test account on both: `rimify` / `rimify` with all privileges (`rimify_test` is created by the suite's
first migration). Run the heavy gates one after another: MySQL 8.4 stopped once, silently, under Pest with
coverage, Playwright and the qa scripts at the same time.

## What differed, measured

Read on the host and locally with the same probe (the app's own connection; every write rolled back):

| | MySQL 8.4.9 | MariaDB 11.8.9 |
|---|---|---|
| Global `sql_mode` | strict | lax — the app's session sets all six flags; a connection without them is refused at boot |
| CHECK constraints | 98, enforced (`HY000/3819`) | the same 98 plus 31 `json_valid` checks MariaDB adds to JSON columns, enforced (`23000/4025`) |
| `SIGNAL` triggers | 14, fire (`45000`) | the same 14, fire (`45000`) |
| Strict-mode refusal | `HY000/1366` | `22007/1366` |
| FULLTEXT | the same two indexes, the same hits | |
| Collation `utf8mb4_0900_ai_ci` | native | accepted as an alias; `aas`=`AAS`, `Ä`=`A`, NO PAD — the same answers |
| `SHOW CREATE TABLE` of a RESTRICT key | prints `ON DELETE RESTRICT` | prints nothing (RESTRICT is the default); `information_schema` says RESTRICT, and a delete is refused (1451) |
| `information_schema` column defaults and integer types | `NULL`, `bigint unsigned` | `'NULL'` as text, `bigint(20) unsigned` — the one test that read them is engine-neutral now |

The full Pest suite on MariaDB 11.8.9: 1.992 of 1.993 passed at the first run; the one failure was that
`information_schema` reading, not the shop. No code in `app/` compares error codes or error texts of either
engine.
