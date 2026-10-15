# STAND 14.10.2026 — where everything is, for a cold start

For: the operator and tomorrow's session. Written at the stop, 14.10.2026 late evening (Karachi).

## 1 · Commits

| Where | Commit | State |
|---|---|---|
| **Preview** (rimify.skillleo.com) | `731a9fc4` (= main `9964382e`) | Unchanged today. Smoke red on CORS and on the checkout row. |
| **origin/main** | `36248e6e` | — |
| **main, local** (`C:\xampp\htdocs\rimify`, branch `release` → origin/main) | `d46677c7`, with this file committed on top | **3 code commits ahead, not pushed**: `3602584e` CORS asked as a browser asks (D-226) · `de4f2b54` `rimify:gutachten-zuruecknehmen` (D-225) · `d46677c7` its Protokoll test. Clean, apart from the untracked `docs/qa/` (548 MB, never committed). |
| **Dev worktree** (`C:\rimify\wt-dev`, branch `public-round`, from `de4f2b54`, not pushed) | `fca1004b` | Clean. `7e17c76b` 119 inverted, release counts found-against-entered, PDF found where it is (D-227–229) · `c6ae0bfe` the blog (D-230) · `fca1004b`, tonight's save: one public word, the 20 copy points, 116, look-back fixes, 7 admin sentences + second R-17 pattern, promise titles down (D-231–236). It lacks main's `d46677c7`. |

## 2 · Mid-flight, now stopped

- **Release-1 gates** (for `d46677c7`): Vitest green (1,548 tests, on `de4f2b54`; `d46677c7` only adds a PHP test). **The PHP gate stopped at file 76 of 224, Playwright at 113 of 498**, no failures so far in either. The full PHP run before had one failure (ProtokollTest), which `d46677c7` fixes. **Release 1 is not gated yet.**
- **Look-back, `CACHE_STORE=database`**: the single-process hunt stopped at about 1,500 tests, with no hang found so far (last test started: `ReleaseSeedTest`, „never seeds orders“). `wt-flip/tests/env.php` is restored; `phpunit.flip.xml` there is the look-back's own tool file. Everything else in LOOK-BACK.md is done.
- **The dev commit `fca1004b` has not been through the gates.** Not yet run: Borbet and Navigation after their fixes, ProtokollTest, ReleaseOnInstructionTest, GoLiveChecksTest, Vitest after the last edits, Playwright, Pint, Larastan, and the baseline rebuild (the seed's copy changed).
- **Processes**: none of ours is running (servers on :8014/:8040, SSR, every suite). Checked at the stop. `C:\rimify\wt-urteil` is clean and can go. The side test databases `rimify_test_b` and `rimify_test_c` on :3308 are scratch.

## 3 · First moves tomorrow, in order

1. **Release 1 = `d46677c7`**: PHP gate and Playwright with nothing else running → push main → `release-ohne-ci.ps1 -Commit d46677c7 -Push` → deploy → smoke (CORS should pass; checkout row per D-224) → check the protected elements on the live page.
2. **On the preview, straight after**: take back the client's two released entries (Teilegutachten 1810080716, the Nachtrag to ABE 53841) with `rimify:gutachten-zuruecknehmen` (brief G §4) → regenerate `KUNDENLISTE.md` and its CSV against the preview → the one line to you.
3. **Release 2**: merge main into `public-round`, run what is listed as not run above, rebuild the baseline, run the full gates, deploy. It carries #10 (blog), 119, 105's cause, 116, 122, 128, 129.
4. **The §2 sweep on the preview** (axe, the 500 page, the Fahrzeugschein photo, the PDF at its page), then batches B–E.

## 4 · What I had not told you yet

- **Item 18 is not a hole**: `/bestellung/RMF-…` answers a stranger with the same 404 as a number that does not exist, and has done so since 27.09 (`c56f71dc`). Checked live today, including a forged signature. The hosting account keeps no access log, so a walk of the numbers cannot be ruled out from logs, but every answer to one was that 404. **No Article 33 question.** Every other guessable address is in `wt-dev/docs/review/GUESSABLE-URLS.md`.
- **D-228 says both client entries „were taken back“.** That becomes true only with step 2 above. It must be true before release 2 ships that text.
- **The promise titles (D-235) leave the preview only if he has not taken over the homepage in the admin.** The seed leaves a team-owned homepage alone. To check after release 2; if he has, I ask you before touching his content.
- **Both gates take about 3 hours under load** (the PHP gate's full run took 185 minutes). Run them alone.
- `fca1004b` is one large commit because tonight it had to be saved. I can split it before the merge if you want it by finding.
- The #33 pictures in `URTEIL/` show his old promise titles, because they were taken before D-235.
- **Not started from brief G:** §3 (load index from the papers, the two-field entry, provenance on the order line), §7 (the cookie table), `rimify:truth` / Brief C §5, and the MySQL 8.4 leg (billing).
