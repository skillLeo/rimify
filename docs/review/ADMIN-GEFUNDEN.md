# ADMIN-GEFUNDEN — what the public-page round noticed in the admin

Recorded, not fixed, not counted: the admin has its own round after the public pages are closed, and this is where that
round starts. One row per observation — where, what a person would see, how it was found. Numbered from 500 so no number
here can be confused with the client's list (1–34) or our own public findings (from 100, `EIGENE-FUNDE.md`).

The one exception is said in its row: something in the admin that made a release gate fail is fixed, because a red
gate is no release (CLAUDE.md §7).

| Nr | Where | What a person sees | Found by | State |
|---|---|---|---|---|
| 500 | Verkauf › Bestellungen, the bar of saved views | With many saved views, the open view's „Aktionen“ button (rename, delete) could end up about 12 px out of sight at the right edge of the bar when the page's font arrived after the bar was drawn. | The full Playwright run of 13.10.2026 (`SV-02a`, once in the suite; six times in a row alone it passed) | **fixed** — it made the release gate red. The bar brings the open view into sight again once the font is in (D-208); a component test fails on the old code. |
