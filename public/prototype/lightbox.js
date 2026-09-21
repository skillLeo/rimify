/*
 * RIMIFY — image lightbox.
 *
 * THIS FILE IS OURS. It is not part of the design, which has no zoom. It is kept outside
 * ./shared/ so that copy stays byte-identical, and it is written so the fidelity gate cannot
 * notice it: NO markup is added to any page at rest. The overlay is built on first open and the
 * only permanent change is a `cursor` on the zoomable wells, which is never painted into a
 * screenshot.
 *
 * Behaviour
 * ─────────
 * Click a product-card image or the product-page gallery → the photograph opens full size.
 *
 * On a card, the image zooms rather than following the card's link, because the card already
 * offers two unambiguous routes to the product — the model name and the "Kompatibilität prüfen"
 * button. Taking all three for navigation would leave no way to look closely at the wheel, which
 * on a site that sells wheels is the thing people most want to do.
 *
 * - opens from the thumbnail's own position and size, rather than fading in over it
 * - ← / → or the on-screen arrows move through every photograph on the page
 * - click the image to magnify 2×, then move the pointer to pan; click again to fit
 * - Esc, the ×, or a click on the backdrop closes it
 * - focus is trapped while open and returned to the thumbnail on close
 * - the page behind cannot scroll, and its scroll position is not lost
 * - honours prefers-reduced-motion: the movement is dropped, the function is not
 */
(function (w, d) {
    'use strict';

    /* Every image that should open. `.well` is the design's square photo frame — it holds the
       product-card photograph and the product page's main gallery image. */
    var SELECTOR = '.pcard .well, [data-mount="pdp-gallery"] .well';

    var MARGIN = 48; // breathing room between the photograph and the viewport edge
    var MAGNIFY = 2;

    var overlay = null;
    var els = {};
    var items = [];
    var index = 0;
    var origin = null; // the thumbnail we opened from, to return focus and to animate back to
    var magnified = false;
    var scrollY = 0;

    function reduceMotion() {
        return w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /* ── building the overlay, once ───────────────────────────────────────────────────────── */

    function build() {
        if (overlay) return;

        overlay = d.createElement('div');
        overlay.className = 'rmf-lb';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Bildansicht');
        overlay.hidden = true;

        overlay.innerHTML =
            '<div class="rmf-lb__scrim" data-close></div>' +
            '<figure class="rmf-lb__figure">' +
            '<img class="rmf-lb__img" alt="">' +
            '<figcaption class="rmf-lb__cap"><span class="rmf-lb__count"></span><span class="rmf-lb__alt"></span></figcaption>' +
            '</figure>' +
            '<button class="rmf-lb__btn rmf-lb__close" type="button" aria-label="Schließen">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
            '</button>' +
            '<button class="rmf-lb__btn rmf-lb__prev" type="button" aria-label="Vorheriges Bild">' +
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6l-6 6 6 6"/></svg>' +
            '</button>' +
            '<button class="rmf-lb__btn rmf-lb__next" type="button" aria-label="Nächstes Bild">' +
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 6l6 6-6 6"/></svg>' +
            '</button>';

        d.body.appendChild(overlay);

        els = {
            scrim: overlay.querySelector('.rmf-lb__scrim'),
            figure: overlay.querySelector('.rmf-lb__figure'),
            img: overlay.querySelector('.rmf-lb__img'),
            count: overlay.querySelector('.rmf-lb__count'),
            alt: overlay.querySelector('.rmf-lb__alt'),
            close: overlay.querySelector('.rmf-lb__close'),
            prev: overlay.querySelector('.rmf-lb__prev'),
            next: overlay.querySelector('.rmf-lb__next')
        };

        els.scrim.addEventListener('click', close);
        els.close.addEventListener('click', close);
        els.prev.addEventListener('click', function () { step(-1); });
        els.next.addEventListener('click', function () { step(1); });
        els.img.addEventListener('click', toggleMagnify);
        els.img.addEventListener('mousemove', pan);
    }

    /* ── opening ──────────────────────────────────────────────────────────────────────────── */

    function collect() {
        var wells = Array.prototype.slice.call(d.querySelectorAll(SELECTOR));
        items = [];
        wells.forEach(function (well) {
            var img = well.querySelector('img');
            if (img && img.currentSrc !== '' ) items.push({ well: well, img: img });
        });
    }

    function open(well) {
        build();
        collect();

        index = items.findIndex(function (it) { return it.well === well; });
        if (index < 0) return;

        origin = well;
        scrollY = w.scrollY;

        // Lock the page without losing where it was. `position:fixed` on body would jump to the
        // top; holding the offset keeps the view exactly where the visitor left it.
        d.body.style.top = -scrollY + 'px';
        d.body.classList.add('rmf-lb-open');

        overlay.hidden = false;
        show(true);

        els.close.focus({ preventScroll: true });
        d.addEventListener('keydown', onKey, true);
    }

    function show(animateFromThumb) {
        var item = items[index];
        var single = items.length < 2;

        els.img.src = item.img.currentSrc || item.img.src;
        els.img.alt = item.img.alt || '';
        els.alt.textContent = item.img.alt || '';
        els.count.textContent = single ? '' : index + 1 + ' / ' + items.length;
        els.prev.hidden = single;
        els.next.hidden = single;

        setMagnified(false);

        if (!animateFromThumb || reduceMotion()) {
            overlay.classList.add('is-open');
            return;
        }

        /* Open from the thumbnail: place the figure where it will end up, then transform it back
           onto the thumbnail and release. Animating a transform rather than width/height keeps it
           on the compositor, so it stays smooth even with a large photograph decoding. */
        overlay.classList.add('is-open');

        var from = item.well.getBoundingClientRect();
        var to = els.figure.getBoundingClientRect();
        if (!to.width || !to.height) return;

        var sx = from.width / to.width;
        var sy = from.height / to.height;
        var dx = from.left + from.width / 2 - (to.left + to.width / 2);
        var dy = from.top + from.height / 2 - (to.top + to.height / 2);

        els.figure.style.transition = 'none';
        els.figure.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')';
        els.figure.style.opacity = '0.4';

        // Force the browser to accept that position before transitioning away from it.
        void els.figure.offsetWidth;

        els.figure.style.transition = '';
        els.figure.style.transform = '';
        els.figure.style.opacity = '';
    }

    function step(delta) {
        if (items.length < 2) return;
        index = (index + delta + items.length) % items.length;
        origin = items[index].well;
        show(false);
    }

    /* ── magnify and pan ──────────────────────────────────────────────────────────────────── */

    function setMagnified(on) {
        magnified = on;
        els.img.classList.toggle('is-magnified', on);
        if (!on) els.img.style.transform = '';
    }

    function toggleMagnify(event) {
        setMagnified(!magnified);
        if (magnified) pan(event);
    }

    function pan(event) {
        if (!magnified) return;
        var r = els.img.getBoundingClientRect();
        // How far through the image the pointer is, mapped to the overflow the magnification
        // creates, so the point under the cursor stays under the cursor.
        var px = (event.clientX - r.left) / r.width - 0.5;
        var py = (event.clientY - r.top) / r.height - 0.5;
        var ox = -px * r.width * (MAGNIFY - 1);
        var oy = -py * r.height * (MAGNIFY - 1);
        els.img.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(' + MAGNIFY + ')';
    }

    /* ── closing ──────────────────────────────────────────────────────────────────────────── */

    function close() {
        if (!overlay || overlay.hidden) return;

        d.removeEventListener('keydown', onKey, true);
        setMagnified(false);

        var finish = function () {
            overlay.hidden = true;
            overlay.classList.remove('is-open', 'is-closing');
            els.figure.style.transform = '';
            els.figure.style.opacity = '';
            els.figure.style.transition = '';

            d.body.classList.remove('rmf-lb-open');
            d.body.style.top = '';
            w.scrollTo(0, scrollY);

            if (origin && origin.focus) origin.focus({ preventScroll: true });
            origin = null;
        };

        if (reduceMotion() || !origin) { finish(); return; }

        // Back to wherever the current image sits on the page, which may not be where we came
        // from if the arrows were used.
        var from = origin.getBoundingClientRect();
        var to = els.figure.getBoundingClientRect();
        var sx = from.width / to.width;
        var sy = from.height / to.height;
        var dx = from.left + from.width / 2 - (to.left + to.width / 2);
        var dy = from.top + from.height / 2 - (to.top + to.height / 2);

        overlay.classList.add('is-closing');
        els.figure.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')';
        els.figure.style.opacity = '0';

        var done = false;
        var once = function () { if (!done) { done = true; finish(); } };
        els.figure.addEventListener('transitionend', once, { once: true });
        setTimeout(once, 400); // a transition that never fires must not leave the page locked
    }

    function onKey(event) {
        if (!overlay || overlay.hidden) return;

        if (event.key === 'Escape') { event.preventDefault(); close(); return; }
        if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); return; }
        if (event.key === 'ArrowRight') { event.preventDefault(); step(1); return; }

        // Keep focus inside the dialog.
        if (event.key === 'Tab') {
            var focusable = [els.close, els.prev, els.next].filter(function (el) { return !el.hidden; });
            var first = focusable[0];
            var last = focusable[focusable.length - 1];
            if (event.shiftKey && d.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && d.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    }

    /* ── wiring ───────────────────────────────────────────────────────────────────────────── */

    // Delegated, so it covers cards the design's runtime draws later and survives every Inertia
    // navigation without being re-attached.
    d.addEventListener(
        'click',
        function (event) {
            var well = event.target.closest && event.target.closest(SELECTOR);
            if (!well || !well.querySelector('img')) return;

            // The card wraps its photograph in a link to the product. Zoom instead — the model
            // name and the primary button both still go there.
            event.preventDefault();
            event.stopPropagation();
            open(well);
        },
        true
    );

    w.addEventListener('resize', function () {
        if (overlay && !overlay.hidden) setMagnified(false);
    });
})(window, document);
