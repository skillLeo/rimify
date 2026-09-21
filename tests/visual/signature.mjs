/**
 * DOM signature — Gate B of §6.
 *
 * Gate A compares pixels, which catches everything that looks wrong and nothing that merely IS
 * wrong. Two pages can be pixel-identical while one uses a `<div>` where the other uses a
 * `<button>`, renders a heading as the wrong level, or drops an `aria-label`. The signature is
 * the structural half of the contract: same elements, same classes, same text, same order.
 *
 * ── What is compared, and why ────────────────────────────────────────────────────────────────
 *
 * Included: tag name, the full class list, normalised visible text, and the attributes in
 * `STRUCTURAL_ATTRS` below. `src` is included deliberately — the prototype's product cards pull
 * from `PHOTO.wheels` in `shared/art.js`, and "right layout, wrong photograph in the slot" is a
 * defect Gate A cannot see when two photographs happen to share a palette.
 *
 * Excluded: `href`, and only `href`. The prototype is a static file tree and links to
 * `produkt.html`; the application links to `/felgen/{model}`. Those must differ, so comparing
 * them literally would fail every case forever and invite loosening the gate — which §8
 * forbids for good reason. They are not dropped, though: `linkMap()` records them separately and
 * `compare()` reports link-count and link-order changes, so a missing or reordered link is still
 * caught. This exemption is part of the signature's definition, not an allowlist entry, and it
 * does not count against the five of §9.
 *
 * Class ORDER is preserved rather than sorted. `class="btn btn--primary"` and
 * `class="btn--primary btn"` are equivalent to CSS but not to a human reading a diff, and §5
 * asks for markup element-for-element.
 */

import { PHOTO_FILES } from './photo-cache.mjs'

/** Attributes that change what an element IS, rather than where it points. */
export const STRUCTURAL_ATTRS = [
    'type',
    'role',
    'alt',
    'src',
    'srcset',
    'name',
    'value',
    'placeholder',
    'disabled',
    'checked',
    'selected',
    'required',
    'readonly',
    'colspan',
    'rowspan',
    'scope',
    'lang',
    'dir',
    'width',
    'height',
    'viewBox',
    'd',
    'fill',
    'stroke',
    'stroke-width',
    'points',
    'cx',
    'cy',
    'r',
    'x',
    'y',
    'x1',
    'y1',
    'x2',
    'y2',
    'transform',
]

/**
 * Elements whose subtree is structural noise. `<style>` and `<script>` contents are not markup,
 * and Inertia's page-data script would otherwise put the whole serialised prop payload into the
 * signature.
 */
const OPAQUE = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'])

/**
 * The function that runs inside the page. Written as a string source so the identical text is
 * evaluated on both sides — importing it on one side and inlining it on the other is how the
 * two halves of a comparison quietly drift apart.
 */
export const SIGNATURE_FN = `(structuralAttrs, opaqueTags, photoMap) => {
    const OPAQUE = new Set(opaqueTags);
    const out = [];
    const links = [];

    const normText = (s) => s.replace(/\\s+/g, ' ').trim();

    /* Reduce a photo URL to the file it resolves to, so the design's Unsplash URL and our local
       copy of that same file compare equal, while a different photograph still does not. */
    const photoKey = (v) => {
        if (photoMap[v]) return 'photo:' + photoMap[v];
        const local = /\\/prototype\\/images\\/([^?#]+)/.exec(v);
        return local ? 'photo:' + local[1] : v;
    };

    const walk = (el, depth) => {
        if (OPAQUE.has(el.tagName)) return;

        // Elements the page has hidden are not part of what a person sees or a screen reader
        // reads. The prototype's photo-over-SVG pattern keeps a hidden fallback in the DOM at
        // all times, so including hidden nodes would demand we reproduce a fallback that never
        // showed in either capture.
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return;

        // \`display: contents\` generates no box at all: the element's children are laid out as
        // though they were children of its parent. So it is recorded as nothing, and its children
        // are walked at the CURRENT depth rather than one deeper — which is what a browser
        // actually does, and what makes a framework's mount wrapper genuinely invisible here
        // instead of merely tolerated.
        if (style.display === 'contents') {
            for (const child of el.children) walk(child, depth);
            return;
        }

        const classes = el.getAttribute('class');
        const attrs = [];
        for (const name of structuralAttrs) {
            if (!el.hasAttribute(name)) continue;
            let v = el.getAttribute(name);
            // Absolute URLs differ only by origin between :5500 and :8000; compare the part
            // that carries meaning. External URLs (the Unsplash photographs) are left whole,
            // which is the point of including src at all.
            if ((name === 'src' || name === 'srcset') && v) {
                v = v.replace(/^https?:\\/\\/(127\\.0\\.0\\.1|localhost)(:\\d+)?/, '');
                // The design fetches its photographs from Unsplash's download endpoint; we serve
                // the very same files from our own origin (public/prototype/images) to avoid a
                // 302 and two cross-origin round trips each. Same bytes, same pixels, different
                // host — so both forms are reduced to the file they resolve to, and a genuinely
                // WRONG photograph in a slot still fails, which is the point of comparing src.
                v = photoKey(v);
            }
            attrs.push(name + '=' + v);
        }

        // aria-* carries meaning and is not enumerable in a fixed list.
        for (const a of el.attributes) {
            if (a.name.startsWith('aria-')) attrs.push(a.name + '=' + a.value);
        }
        attrs.sort();

        // Only text owned directly by this element, so a parent does not repeat every
        // descendant's words and turn one real difference into fifty reported ones.
        let own = '';
        for (const node of el.childNodes) {
            if (node.nodeType === 3) own += node.nodeValue;
        }
        own = normText(own);

        out.push(
            depth + '|' + el.tagName.toLowerCase() +
            '|' + (classes ?? '') +
            '|' + attrs.join(',') +
            '|' + own
        );

        if (el.tagName === 'A' || el.tagName === 'AREA') {
            links.push({
                depth: depth,
                text: normText(el.textContent ?? ''),
                href: el.getAttribute('href') ?? '',
            });
        }

        for (const child of el.children) walk(child, depth + 1);
    };

    walk(document.body, 0);

    return {
        nodes: out,
        links: links,
        // Height is the cheap sanity check §6 asks for alongside the pixel gate: a page that
        // differs in total height cannot be within 0.5% no matter what the diff says, and the
        // height number names the problem far faster than a diff image does.
        //
        // Note the floor: scrollHeight never reports less than the viewport height, so on a page
        // shorter than the viewport this number agrees while the content differs. That is not a
        // gap — Gate A's pixel comparison and Gate B's node list both still see it — but it does
        // mean "heights match" is not on its own evidence of anything on a short page.
        height: Math.round(document.documentElement.scrollHeight),
        width: Math.round(document.documentElement.scrollWidth),
    };
}`

/** Collect the signature from a live Playwright page. */
export async function signatureOf(page) {
    return page.evaluate(
        ({ fn, attrs, opaque, photos }) => eval(`(${fn})`)(attrs, opaque, photos),
        { fn: SIGNATURE_FN, attrs: STRUCTURAL_ATTRS, opaque: [...OPAQUE], photos: PHOTO_FILES }
    )
}

/**
 * Compare two signatures and describe every difference in the terms a person fixing it needs:
 * which node, what the prototype has, what we have.
 */
export function compare(expected, actual) {
    const diffs = []

    if (expected.height !== actual.height) {
        diffs.push({
            kind: 'height',
            detail: `Prototype is ${expected.height}px tall, ours is ${actual.height}px ` +
                `(${actual.height > expected.height ? '+' : ''}${actual.height - expected.height}px).`,
        })
    }

    const a = expected.nodes
    const b = actual.nodes
    const max = Math.max(a.length, b.length)

    // Report the first divergence in full and then count the rest. A structural difference high
    // in the tree shifts every subsequent line, so listing all of them describes one mistake
    // several hundred times.
    let firstDivergence = -1
    for (let i = 0; i < max; i++) {
        if (a[i] !== b[i]) {
            firstDivergence = i
            break
        }
    }

    if (firstDivergence !== -1) {
        const context = []
        for (let i = Math.max(0, firstDivergence - 3); i < firstDivergence; i++) {
            context.push(`    ${String(i).padStart(4)}  = ${a[i]}`)
        }

        diffs.push({
            kind: 'node',
            index: firstDivergence,
            expected: a[firstDivergence] ?? '(nothing — prototype ends here)',
            actual: b[firstDivergence] ?? '(nothing — our page ends here)',
            detail:
                `First structural difference at node ${firstDivergence} of ` +
                `${a.length} (ours has ${b.length}).\n` +
                (context.length ? `  Matching context:\n${context.join('\n')}\n` : '') +
                `  Prototype: ${a[firstDivergence] ?? '(end)'}\n` +
                `  Ours:      ${b[firstDivergence] ?? '(end)'}`,
        })

        let remaining = 0
        for (let i = firstDivergence + 1; i < max; i++) if (a[i] !== b[i]) remaining++
        if (remaining) {
            diffs.push({
                kind: 'node-rest',
                detail:
                    `${remaining} further node differences follow. These usually all stem from ` +
                    `the one above — fix it first and re-run before reading them.`,
            })
        }
    }

    if (expected.links.length !== actual.links.length) {
        diffs.push({
            kind: 'links',
            detail:
                `Prototype has ${expected.links.length} links, ours has ${actual.links.length}. ` +
                `(href values themselves are exempt — see the note at the top of signature.mjs.)`,
        })
    } else {
        const reordered = expected.links.findIndex((l, i) => l.text !== actual.links[i].text)
        if (reordered !== -1) {
            diffs.push({
                kind: 'link-order',
                detail:
                    `Link ${reordered} reads "${actual.links[reordered].text}" but the ` +
                    `prototype's reads "${expected.links[reordered].text}".`,
            })
        }
    }

    return diffs
}
