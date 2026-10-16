# LOOK-BACK — which tests lean on a pinned setting, and whether they should (D-180, D-232)

For: the operator, who asked for the triage before trusting the suite.

**Method.** D-180 moved the suite's settings from `phpunit.xml` into `tests/env.php`, pinned. The look-back flips one pinned
setting at a time to another real value and runs the whole suite (MySQL 8.4 copy, `--parallel`), then lists every test
that changes from pass to fail against the unflipped baseline (0 failures). Each change is **expected** — the test is
about that setting, or about what the setting switches on or off by design — or a **leak**: the test depends on the
pinned value by accident. Every leak is fixed (D-232); expected ones stay and are named here. 55 settings, 5 groups and
the last group (the five infrastructure pins) key by key, finished 14.10.2026 18:18 local.

**Result.** 26 settings change something (1 to 771 tests), 29 change nothing, and the suite finishes with every one —
`CACHE_STORE=database` too, which on 14.10. seemed to stop it (closed 16.10.2026, below). **14 tests leaned on a pinned
value by accident, from 9 causes — all fixed.** One more failed by chance under a flip, not because of it: the wheel-size
factory's random sizes (fixed, below).

## The changes, setting by setting

| Setting → flipped to | Tests that change | Verdict | Why, and what was done |
|---|---|---|---|
| `RIMIFY_ADMIN_ENABLED` → off | 771 (718 under `tests/Feature/Admin`, 53 elsewhere) | expected | The panel answers 404 when it is off (EnsureAdminPanelEnabled). Every one of the 771 opens an `/admin` route — the 53 outside `Admin/` too (invoices, refunds, the Abdeckung, uploads, review feedback, the reset screen). This is the 778 of the group run, decomposed: 771 to this key, 7 to others. |
| `QUEUE_CONNECTION` → database | 18 (payments, webhooks, a notification) | expected | They assert what a queued job did after a webhook; with a database queue nothing runs until a worker does. The shop runs `sync` (the preview's .env, read today). |
| `MAIL_MAILER` → log | 3 (mail settings, go-live mail checks) | expected | They are about the mail transport in force. The two go-live tests now state the transport they name. |
| `RIMIFY_FEATURE_KEY_NUMBERS` → off | 6 (HSN/TSN lookups, garage, Check) | expected | The flag switches the key-number lookup off; the tests drive it. |
| `RIMIFY_SPEED_SYMBOL_MARGIN_STEPS` → 1 | 7 | 2 expected, **5 leaks** | `EngineConfigTest`, `VehicleResolutionTest`: about the margin — expected. `CentreBorePerVehicleTest` ×3, `TyreSizeAxleTest`, `DemoDeratingTest`: about bores, axles and a demo table, yet only pass with a positive verdict at the legal minimum — **fixed**: each states margin 0 in its setup. |
| `RIMIFY_LOAD_INDEX_MARGIN_STEPS` → 1 | 2 | expected | The same two margin tests. |
| `RIMIFY_CONTACT_EMAIL`, `RIMIFY_CONTACT_PHONE` → set | 7, 6 | expected | `ContactDetailsTest` is about the shipped contact details; the processing record names the mailbox's provider by its domain. |
| `RIMIFY_SERVICE_FROM` → 08:00 | 5 | expected | `ServiceStatusTest`: the client's hours. |
| `RIMIFY_SELLER_SMALL_BUSINESS` → true | 2 | expected | § 19 UStG changes VAT on every price and a legal check. |
| `RIMIFY_REVIEW` → on | 2 (`AdminShellTest`, `BestellungenTest`) | **leak** | About the admin's tree and rail, which the review pages join when switched on — **fixed**: both state review off. |
| `RIMIFY_FEATURE_PARTNERS` → on | 1 (`StartseiteTest`) | **leak** | About the EU tyre label and the FAQ preview; the partner section joins the homepage when on — **fixed**: states partners off. |
| `RIMIFY_RESET_ERLAUBT` → true | 1 (`SeitenTest`) | **leak** | About the placeholder and lawyer marks of the Impressum; a reset-ready test environment puts its operator's block first — **fixed**: states reset off. |
| `APP_URL` → https://rimify.test | 2 | **2 leaks** | `SecurityHeadersTest` asked over „/“, which inherits APP_URL's scheme; `FehlerseitenTest` hard-coded `http://localhost` as the Referer. **Fixed**: an explicit `http://` address; the Referer from `url()`. |
| `MAIL_FROM_ADDRESS` → shop@beispiel.test | 1 | expected | The go-live check names the sender's domain records; the test now states the sender it names. |
| `LOG_DAILY_DAYS` → 30 | 1 | expected | The processing record names the log's retention, from this setting. |
| `STRIPE_SECRET` → a random test value | 1 (`SecretsScanTest`) | expected | The flip writes the value into `tests/env.php`, a file of the repository — and the scanner finds it, as it should. |
| `RIMIFY_IMPORT_DELETE_THRESHOLD` → 0.5 | 1 | expected | `EngineConfigTest` reads it. |
| `RIMIFY_SHIPPING_COST_CENTS`, `…FREE_FROM_CENTS` → set | 2 each | 1 expected, 1 leak (below) | `KasseOrderRefusalTest` is about the shipping defaults. |
| `RIMIFY_TPMS_DEFAULT_PRICE_CENTS` → 4900 | 3 | 2 expected, 1 leak (below) | `KomplettradZubehoerTest` is about the sensor price. |
| `RIMIFY_MOUNTING_PER_WHEEL_CENTS` → 2500 | 3 | 1 expected, **1 leak**, 1 leak (below) | `KomplettradPricerTest`: about the fee — expected. `KomplettradBasketTest` compares page and basket with amounts that assume no fee — **fixed**: states no fee. |
| `RIMIFY_SLOW_QUERY_MS` → 1 | 2 | **2 leaks** | `ThrottleKeysTest` spies on the log, and every statement wrote a slow-query warning into it — **fixed**: switches slow logging off for itself, which now works because the listener reads its threshold per statement instead of once at boot. `SlowQueriesTest`: next row. |
| `RIMIFY_DELIVERY_TIME`, `…SHIPPING_COST_CENTS`, `…FREE_FROM_CENTS`, `…TPMS…`, `…MOUNTING…`, `…REVIEWS_INVITE_AFTER_DAYS`, `…REVIEWS_LINK_DAYS` | `SlowQueriesTest` in each | **leak** (order and load) | Not about any of them: it failed with an empty log under seven unrelated flips and passes alone and in every gate. Under load a statement is slow while the app boots, the log channel is built with its default path before the test points it at its own folder, and the test reads an empty folder. **Fixed**: the test rebuilds the channel after configuring it. Not yet proven by three clean full flip runs — labelled until then. |

## The database cache — closed 16.10.2026

**What 14.10. saw.** With `CACHE_STORE=database` the parallel run was killed after 45 minutes with nothing reported, and
a run in one process stopped at test 1.583 (DemoDataTest, „changes nothing when run twice …“) and stood there for 36
minutes until it was stopped.

**What ran today.** Every test file, in one process, on the MySQL 8.4 copy with the database cache, in the suite's own
order — in three parts, because each part had a time limit (2.020 tests, then 540, then 85) — with MySQL watched every
15 seconds: the sessions, pending metadata locks, InnoDB lock waits, and the PHP process's CPU. **Nothing ever waited.**
The test of 14.10. took 93 s in the run and 41 s alone.

**In parallel it still does not finish** — and that is the test harness, not a test. Eight workers ran the 595 unit
tests in six minutes; then each worker's first `migrate:fresh` began again before it ended, over and over (watched
12:53–12:54: worker 3's database at 83 of 86 migrations, then gone, then at 3, 7; worker 6 the same). The same
`migrate:fresh`, eight at once on eight databases with the database cache but outside the test harness, completes in
4 min 17 s, every migration done. So it is Laravel's parallel test setup meeting a database cache, which no test asks
for; how exactly was not traced further. The tests' verdicts above come from the run in one process.

**Why it seemed to stop on 14.10.** That hunt ran at below-normal priority, beside a release gate's PHP stage that held
every core the whole hour (one stage ended 21:57, the next 22:29). Its tests ran 2–6 times slower than today's
(„the fence …“ 124 s against 59 s, „stamps each snapshot …“ 78 s against 13 s), and the heaviest — four demo sets written
and purged — barely moved. Starved, not stuck.

**What changed under the flip** — two tests, neither about the cache:

| Test | Verdict | Why, and what was done |
|---|---|---|
| `PinnedEnvironmentTest` („runs only on the committed list …“) | expected | It refuses a `tests/env.php` that differs from its fingerprint — the guard written after a machine went down mid-look-back. Any flip changes that file, so it fails under every flip; the run itself goes ahead with `TEST_LOOKBACK=1`, and says so. |
| `UebersichtVariantsTest` („`Katalog` → it counts stock …“) | **chance** — fixed | The unique key of a wheel size refused a second size of the same finish: the factory drew diameter, width and ET at random, so two sizes of one finish were the same size once in 420 pairs — in any test, on any store. **Fixed in the factory** (`4c3e284c`): the ET steps through 25–45 in turn. The other composite keys were checked: the Auflagen codes are unique by Faker, the tyre sizes fixed. |

**Not a risk to the shop either way**: the preview runs `CACHE_STORE=file` (read 14.10.2026); the live shop is set up the
same way (GO-LIVE §2).

Unchanged by their flip: `APP_DEBUG`, `APP_KEY`, `BCRYPT_ROUNDS`, `STRIPE_KEY`, `STRIPE_MODE`, `AWS_DEFAULT_REGION`,
`DEBUGBAR_ENABLED`, `TELESCOPE_ENABLED`, `INERTIA_SSR_ENABLED`, `RIMIFY_SSR_SOCKET`, `SESSION_SECURE_COOKIE`,
`SESSION_SAME_SITE`, `SESSION_ENCRYPT`, `SESSION_DRIVER`, `BROADCAST_CONNECTION`, `RIMIFY_FEATURE_NOTIFY_BY_MAIL`,
`RIMIFY_PAYMENTS`, `RIMIFY_PHOTOGRAPHY`, `RIMIFY_S3_PATH_STYLE`, `DEMO_DATA`, `RIMIFY_ENGINE_VERSION`, the six
address fields `RIMIFY_SELLER_*`, `RIMIFY_OPERATOR_NAME`, and `CACHE_STORE` (its two failures are not about it, above)
— 29.
