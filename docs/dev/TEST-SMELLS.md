# Test smells

Shapes of a test that goes green without proving what it claims. Read a new test against this list before trusting
its green; add a shape here the day one is found, with where it was found and how to catch it.

## 1. Actions that cancel out

A test whose actions undo each other ends where it started whether the code under test works or not. It is
indistinguishable from a passing test, and the suite cannot tell you.

- **Found:** D-311. The mouse-wheel test turned the wheel up and then down over a number field. Without the guard the
  field stepped 35 → 36 → 35, so the test passed with no guard at all.
- **Catch it:** make every action move the state the same way (two turns down: a missing guard shows as +2), and
  first prove the hazard on a bare control in the same browser, so the assertion can never pass for want of a browser
  that misbehaves (`e2e/number-wheel.spec.ts`, `e2e/number-wheel-admin.spec.ts`).

## 2. A check over zero cases

„All of them hold“ over an empty set is true. „14 of 14“ is evidence; „0 of 11“ is none.

- **Found:** D-310. The cross-check of the load index — every printed limit is twice its capacity — had no document
  printing T10 to T20, so it confirmed none of the eleven new values.
- **Catch it:** report the count beside the verdict, and read 0 checked as not measured, never as passed.

## 3. A missing precondition read as a result

A test whose precondition is absent reports a result about the precondition, not about the code: a skip read as a
pass, or missing data read as a defect.

- **Found:** D-314. #208 failed on his preview because the example Gutachten there predates the feature — no data
  entered, no defect.
- **Catch it:** check the precondition first; when it is absent, record „not measured“ with the reason. A skipped test
  is not a pass and not a fail (`scripts/kundenliste/abnahme-ergebnis.mjs`).
