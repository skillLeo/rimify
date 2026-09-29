# Data credits

Third-party data the shop ships with, where it came from, and under which licence. Images are in
`image-credits.md`.

## Postleitzahlen → Orte (`resources/data/plz-de.json`)

| What | Source | Licence | Taken |
|---|---|---|---|
| German postal codes and their place names | GeoNames, `DE.zip` from https://download.geonames.org/export/zip/ | Creative Commons Attribution 4.0 (CC BY 4.0), https://creativecommons.org/licenses/by/4.0/ | 2026-09-29 |

Used for one thing: the checkout suggests the Ort for a PLZ (`App\Services\Storefront\PostalCodes`,
`/api/v1/plz/{plz}`). It fills the field only when exactly one place answers and the field is empty,
offers several to choose from, and never changes what the customer typed. Wherever a suggestion is shown,
the page names the source and the licence beside it.

Changed from the source: only five-digit codes are kept; entries that name an addressee rather than a
place — companies, banks, insurers, ministries, courts, broadcasters, the Post's own mail centres
(Großkunden-PLZ) — are left out by name pattern; each PLZ keeps its distinct place names, sorted.
9,209 codes, 365 KB. The build script is not part of the shop; rebuild by filtering `DE.txt` the same way.
