/*
 * RIMIFY — corrections to the design, applied on top of it.
 *
 * THIS FILE IS OURS. Everything in ./shared/ is a verbatim copy of the design and is never edited.
 * Where a defect has to be corrected rather than reproduced, the correction goes here, as a wrapper
 * around the design's own function, so that:
 *
 *   - the copy in ./shared/ stays provably identical to the design, and
 *   - every divergence from the design is in one file, listed, and reviewable.
 *
 * Each entry says what was wrong, what it now does, and who asked for it. Nothing is changed here
 * because it merely looks odd — the default remains to reproduce the design exactly.
 */
(function (w) {
    'use strict';

    var ART = w.ART;
    if (!ART) return;

    /* ── docSVG('alt'): the caption overlapped row 4 ──────────────────────────────────────────
     *
     * In the old-Fahrzeugschein variant, art.js places the caption
     * "HSN und TSN stehen hier gemeinsam in Feld 3." at `yT + 62`, where `yT` for that variant is
     * 86 + 2*46 = 178 — so y = 240.
     *
     * The six rows sit at y = 86 + i*46 and are 38px tall, so row 4 ("Handelsbezeichnung", i = 3)
     * spans 224 to 262 with its own text on the baseline at 248. The caption at 240 lands inside
     * that box and the two lines print over each other.
     *
     * There is no gap to move it into — the rows are 46px apart with 38px boxes, leaving 8px —
     * so it moves below the last row instead: row 6 ends at 354 and the card at 380, and a 12px
     * caption on the baseline at 370 sits clear of both.
     *
     * Reported in review, 2026-09-21, with a screenshot of the two lines overlapping.
     *
     * Only the 'alt' variant is affected. 'neu' places a TSN pill at that position instead and has
     * no caption, which is why the sheet looks right until the old-Fahrzeugschein tab is chosen.
     */
    var docSVG = ART.docSVG;
    if (typeof docSVG === 'function') {
        ART.docSVG = function (variant) {
            var svg = docSVG(variant);

            return svg.replace(
                /(<text x="52" y=")\d+("[^>]*>HSN und TSN stehen hier gemeinsam in Feld 3\.<\/text>)/,
                '$1370$2'
            );
        };
    }
})(window);
