import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';

/*
 * The sweep's shared pieces: where its evidence goes, how a finding is written down, how a car is chosen, and the
 * probe every page passes through (console, failed requests, horizontal scroll, words and numbers a customer must
 * never see, raw codes, empty boxes, broken images, tap targets and input sizes on the phone, the links to check).
 */

export const OUT = resolve('docs/reviews/sweep-storefront');
export const SHOTS = resolve('docs/qa/shots/sweep-storefront/live');
export const STATE = resolve('test-results/sweep-storefront-state');
export const SHOTS_REL = 'docs/qa/shots/sweep-storefront/live';

export const SLUG = 'borbet-db8gt2';
export const SIZES_19 = ['235/45 R19', '245/40 R19', '255/40 R19'] as const;
export const FINE_LINK_CHAINS = 'feingliedrige';
export const NO_CHAINS = 'Die Verwendung von Schneeketten ist nicht zulässig';
export const ENTRY_BY_SIZE =
    'Eintragung in die Fahrzeugpapiere erforderlich mit 255/40 R19, nicht mit 235/45 R19 und 245/40 R19.';

export type Severity = 'S1' | 'S2' | 'S3' | 'S4';

export interface Finding {
    severity: Severity;
    page: string;
    width: string;
    what: string;
    expected: string;
    shot?: string;
}

const NO_BREAK = new RegExp(`[${String.fromCharCode(0xa0, 0x202f)}]`, 'g');

export const norm = (text: string): string => text.replace(NO_BREAK, ' ').replace(/\s+/g, ' ').trim();

export const times = (haystack: string, needle: string): number => haystack.split(needle).length - 1;

/** Words, numbers and codes a customer must never read (the brief's page criteria). */
const TEXT_RULES: { re: RegExp; severity: Severity; what: string; expected: string }[] = [
    {
        re: /\b(?:PERMITTED|CONDITIONAL|NOT_PERMITTED|UNKNOWN|NO_ENTRY_REQUIRED|ENTRY_REQUIRED|ANNEX_MISSING|BODY_OR_DRIVE_[A-Z]+|WHEEL_LOAD_EXCEEDED)\b/g,
        severity: 'S2',
        what: 'raw enum visible',
        expected: 'German words, never a code (R-15)',
    },
    { re: /\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b/g, severity: 'S2', what: 'machine value visible', expected: 'a sentence or nothing' },
    { re: /\b(?:TODO|FIXME|XXX|Lorem ipsum)\b/gi, severity: 'S2', what: 'developer placeholder visible', expected: 'real copy' },
    {
        // „Details“ is German too („Details ansehen“), so it is not on the list.
        re: /\b(?:Loading|Submit|Search|Cancel|Close|Next|Previous|Add to cart|Checkout|Sign in|Log in|Login|Password|Settings|Error|Back to|Sold out|In stock)\b/g,
        severity: 'S3',
        what: 'English word visible',
        expected: 'German, du-form',
    },
    { re: /—/g, severity: 'S4', what: 'em dash in visible text', expected: 'en dash with spaces (house style)' },
    {
        re: /(?:^|[\s(])0\s(?:Felgen?|Gutachten|Fahrzeugvarianten?|Modelle?|Varianten?|Ergebnisse?|Treffer|Bewertungen)\b/g,
        severity: 'S2',
        what: 'zero shown where a number belongs',
        expected: 'no count line, or a sentence with an action',
    },
    { re: /(?:^|\s)0,00\s?€/g, severity: 'S2', what: '0,00 € shown', expected: 'a price, or „wird noch festgelegt“' },
    {
        // A euro sign before a figure — but not „229,00 €“ followed by the next line's „4 Felgen“.
        re: /(?<![\d,][\s  ]?)€[   ]?\d|\b\d+\.\d{2}[   ]?€|\b\d{1,3}(?:,\d{3})+(?:\.\d{2})?[   ]?€/g,
        severity: 'S2',
        what: 'money not in German format',
        expected: '1.234,50 €',
    },
    // One digit after the point: „66.6 mm“ is wrong, „2.810 mm“ is a German thousands point.
    { re: /\b\d+\.\dJ\b|\b\d+\.\d[   ]?mm\b/g, severity: 'S2', what: 'decimal point instead of comma', expected: '8,5J · 66,6 mm' },
];

/** The facts the probe reads in the page, in one round trip. */
interface PageFacts {
    path: string;
    overflow: number;
    wide: string[];
    text: string;
    codes: string[];
    empty: string[];
    brokenImages: string[];
    smallTargets: string[];
    smallInputs: string[];
    links: string[];
    h1: string[];
}

export class Sweep {
    private messages: string[] = [];

    constructor(
        public readonly page: Page,
        public readonly info: TestInfo,
    ) {
        page.on('console', (m) => {
            if (m.type() === 'error' || m.type() === 'warning') {
                this.messages.push(`console ${m.type()}: ${m.text().slice(0, 220)}`);
            }
        });
        page.on('pageerror', (e) => this.messages.push(`pageerror: ${e.message.slice(0, 220)}`));
        page.on('requestfailed', (r) => {
            const why = r.failure()?.errorText ?? '';

            // A prefetch or a navigation that replaces a request aborts it: that is the browser, not the shop.
            if (!/ERR_ABORTED|NS_BINDING_ABORTED|cancelled/i.test(why)) {
                this.messages.push(`request failed: ${r.url()} (${why})`);
            }
        });
        page.on('response', (r) => {
            if (r.status() >= 400) {
                this.messages.push(`http ${r.status()}: ${r.url()}`);
            }
        });
    }

    get project(): string {
        return this.info.project.name;
    }

    get width(): string {
        return String(this.page.viewportSize()?.width ?? '');
    }

    get phone(): boolean {
        return this.project.includes('390');
    }

    /** Writes a finding at once: a test that fails later keeps what it found before. */
    note(finding: Omit<Finding, 'width'>): void {
        mkdirSync(OUT, { recursive: true });
        appendFileSync(resolve(OUT, `findings-${this.project}.jsonl`), `${JSON.stringify({ ...finding, width: this.width })}\n`);
    }

    /** An observation that is not a defect, kept beside the findings for the report. */
    observe(page: string, text: string): void {
        mkdirSync(OUT, { recursive: true });
        appendFileSync(resolve(OUT, `observations-${this.project}.txt`), `${this.width} · ${page} · ${text}\n`);
    }

    /** A screenshot under docs/qa/shots/sweep-storefront/live; returns its path relative to the project. */
    async shot(name: string, target?: Locator, full = true): Promise<string> {
        mkdirSync(SHOTS, { recursive: true });
        const file = `${name}-${this.project}.png`;

        if (target) {
            await target.screenshot({ path: resolve(SHOTS, file) }).catch(() => undefined);
        } else {
            await this.page.screenshot({ path: resolve(SHOTS, file), fullPage: full }).catch(() => undefined);
        }

        return `${SHOTS_REL}/${file}`;
    }

    /** Console messages and failed requests since the last call; `allow` names what this page is meant to answer. */
    drain(page: string, allow: RegExp | null = null): void {
        const messages = this.messages.filter((m) => allow === null || !allow.test(m));

        this.messages = [];

        for (const message of [...new Set(messages)]) {
            const hydration = /hydration/i.test(message);

            this.note({
                severity: hydration || /pageerror|http 5\d\d/.test(message) ? 'S2' : 'S3',
                page,
                what: `${hydration ? 'hydration mismatch: ' : ''}${message}`,
                expected: 'a clean console and no failed request',
            });
        }
    }

    /** Opens a route and waits until the client has taken over the server-rendered page. */
    async open(path: string): Promise<number> {
        const response = await this.page.goto(path, { waitUntil: 'domcontentloaded' });

        await this.hydrated();

        return response?.status() ?? 0;
    }

    async hydrated(): Promise<void> {
        await this.page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
        await this.page
            .waitForFunction(() => (document.querySelector('#app') as (Element & { __vue_app__?: unknown }) | null)?.__vue_app__ !== undefined, null, {
                timeout: 20_000,
            })
            .catch(() => undefined);
        await this.page.evaluate(() => document.fonts.ready).catch(() => undefined);
    }

    /** Scrolls the page end to end once, a screen at a time, so lazy sections are laid out before anything is read. */
    async render(): Promise<void> {
        await this.page.evaluate(async () => {
            const step = window.innerHeight;
            const end = document.documentElement.scrollHeight;
            const settle = (): Promise<void> => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())));

            for (let y = 0; y < end + step; y += step) {
                window.scrollTo(0, y);
                await settle();
            }

            window.scrollTo(0, 0);
            await settle();
        });
    }

    /**
     * The probe every page passes through. `label` names the page in the findings (a route, or a route and a state).
     * `allow` names console lines this page is meant to produce (the 404's own status line).
     */
    async probe(label: string, options: { allow?: RegExp | null; shot?: boolean } = {}): Promise<PageFacts> {
        await this.render();

        const facts = await this.page.evaluate((phone: boolean): PageFacts => {
            const describe = (el: Element): string => {
                const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
                const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);

                return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls ? `.${cls}` : ''}${text ? ` „${text}“` : ''}`;
            };
            const visible = (el: Element): boolean => {
                const r = el.getBoundingClientRect();
                const s = getComputedStyle(el);

                return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
            };
            const vw = document.documentElement.clientWidth;
            const overflow = document.documentElement.scrollWidth - vw;
            const wide: string[] = [];

            if (overflow > 0) {
                for (const el of Array.from(document.body.querySelectorAll('*'))) {
                    const r = el.getBoundingClientRect();

                    if (r.width === 0 || r.right <= vw + 1) {
                        continue;
                    }

                    let clipped = false;

                    for (let p = el.parentElement; p !== null && p !== document.body; p = p.parentElement) {
                        const ox = getComputedStyle(p).overflowX;

                        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') {
                            clipped = true;
                            break;
                        }
                    }

                    if (!clipped) {
                        wide.push(`${describe(el)} right=${Math.round(r.right)}`);
                    }

                    if (wide.length >= 5) {
                        break;
                    }
                }
            }

            const codes: string[] = [];
            const empty: string[] = [];

            for (const el of Array.from(document.body.querySelectorAll('*'))) {
                if (!visible(el) || el.closest('.doc, script, style, svg, [aria-hidden="true"]')) {
                    continue;
                }

                const own = (el.textContent ?? '').trim();

                // A bare Auflage code standing alone in an element (R-15); the story's facsimile (.doc) is exempt.
                if (el.children.length === 0 && /^[AKSTVGLY]\d{1,2}[a-z]?$/.test(own)) {
                    codes.push(describe(el));
                }

                // A box that should hold something and holds nothing. A live region waits empty for what it will
                // announce (the vehicle count before a car is chosen): screen readers only hear one that already exists.
                if (
                    el.matches('.tile, .card, .notice, .state, dd, li, td, .tag, .price, [class*="__count"], [class*="__facts"]') &&
                    !el.matches('[aria-live]') &&
                    own === '' &&
                    el.querySelector('img, svg, canvas, picture, input, select, button, a') === null
                ) {
                    empty.push(describe(el));
                }
            }

            const brokenImages = Array.from(document.images)
                .filter((img) => visible(img) && img.complete && img.naturalWidth === 0 && (img.currentSrc || img.src))
                .map((img) => img.currentSrc || img.src)
                .slice(0, 5);

            const smallTargets: string[] = [];
            const smallInputs: string[] = [];

            // The shop sizes its controls for a thumb under (pointer: coarse), as a phone reports it. Measured with a fine
            // pointer, every one of them reads short: the run of 01.10.2026 met that on some pages of the phone project
            // (footer links 32 px where a phone shows 44). Then nothing is measured, and the page says why.
            const coarse = matchMedia('(pointer: coarse)').matches;

            if (phone && !coarse) {
                smallTargets.push('(not measured: the browser reported a fine pointer)');
            }

            if (phone && coarse) {
                for (const el of Array.from(
                    document.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="tab"]'),
                )) {
                    if (!visible(el) || el.closest('[aria-hidden="true"]')) {
                        continue;
                    }

                    const r = el.getBoundingClientRect();
                    const s = getComputedStyle(el);

                    // A link inside a sentence is exempt (WCAG 2.5.8, inline).
                    const inline = el.tagName === 'A' && s.display === 'inline' && (el.parentElement?.textContent ?? '').trim() !== (el.textContent ?? '').trim();

                    if (!inline && (r.height < 44 || r.width < 44) && !(el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio'))) {
                        smallTargets.push(`${describe(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
                    }

                    // iOS zooms into a field you type into, never into a checkbox or a radio.
                    if (el.matches('input:not([type="checkbox"]):not([type="radio"]), select, textarea') && parseFloat(s.fontSize) < 16) {
                        smallInputs.push(`${describe(el)} ${s.fontSize}`);
                    }
                }
            }

            // An in-page anchor (the skip link „#inhalt“) is not a page to check: on a 404 it would read as the 404 itself.
            const links = Array.from(document.querySelectorAll('a[href]'))
                .filter((a) => !(a.getAttribute('href') ?? '').startsWith('#'))
                .map((a) => (a as HTMLAnchorElement).href)
                .filter((href) => href.startsWith(location.origin))
                .map((href) => href.split('#')[0] ?? href);

            return {
                path: location.pathname + location.search,
                overflow,
                wide,
                text: document.body.innerText,
                codes: [...new Set(codes)].slice(0, 8),
                empty: [...new Set(empty)].slice(0, 8),
                brokenImages,
                smallTargets: [...new Set(smallTargets)].slice(0, 10),
                smallInputs: [...new Set(smallInputs)].slice(0, 6),
                links: [...new Set(links)],
                h1: Array.from(document.querySelectorAll('h1')).map((h) => (h.textContent ?? '').replace(/\s+/g, ' ').trim()),
            };
        }, this.phone);

        const shot = options.shot === false ? undefined : await this.shot(`page-${slug(label)}`);

        if (facts.overflow > 0) {
            this.note({
                severity: this.phone ? 'S2' : 'S3',
                page: label,
                what: `horizontal scroll by ${facts.overflow}px — ${facts.wide.join('; ') || 'no single element found'}`,
                expected: 'no horizontal scroll',
                shot,
            });
        }

        if (facts.h1.length !== 1) {
            this.note({ severity: 'S3', page: label, what: `${facts.h1.length} h1 on the page (${facts.h1.join(' | ')})`, expected: 'one h1', shot });
        }

        for (const rule of TEXT_RULES) {
            const seen = new Set<string>();

            for (const match of facts.text.matchAll(rule.re)) {
                const at = match.index ?? 0;
                const context = norm(facts.text.slice(Math.max(0, at - 50), at + match[0].length + 50));

                if (!seen.has(context)) {
                    seen.add(context);
                    this.note({ severity: rule.severity, page: label, what: `${rule.what}: „…${context}…“`, expected: rule.expected, shot });
                }

                if (seen.size >= 4) {
                    break;
                }
            }
        }

        if (facts.codes.length) {
            this.note({ severity: 'S2', page: label, what: `bare code(s): ${facts.codes.join('; ')}`, expected: 'the Auflage as a sentence (R-15)', shot });
        }

        if (facts.empty.length) {
            this.note({ severity: 'S3', page: label, what: `empty box(es): ${facts.empty.join('; ')}`, expected: 'content, a sentence, or no box', shot });
        }

        if (facts.brokenImages.length) {
            this.note({ severity: 'S2', page: label, what: `broken image(s): ${facts.brokenImages.join('; ')}`, expected: 'the photo or the drawn fallback', shot });
        }

        if (facts.smallTargets[0]?.startsWith('(not measured')) {
            this.observe(label, `tap targets ${facts.smallTargets[0]}`);
        } else if (facts.smallTargets.length) {
            this.note({ severity: 'S3', page: label, what: `tap targets under 44 px: ${facts.smallTargets.join('; ')}`, expected: '≥ 44 × 44 px (DIRECTION §6)', shot });
        }

        if (facts.smallInputs.length) {
            this.note({ severity: 'S3', page: label, what: `input font under 16 px (iOS zooms): ${facts.smallInputs.join('; ')}`, expected: '≥ 16 px', shot });
        }

        mkdirSync(STATE, { recursive: true });
        appendFileSync(resolve(STATE, `links-${this.project}.txt`), facts.links.map((l) => `${label}\t${l}`).join('\n') + '\n');

        this.drain(label, options.allow ?? null);

        return facts;
    }

    /**
     * The groups the brief asks for, as D-093 and D-097 settled them: no list holding both snow-chain sentences, each
     * chain sentence with its own sizes. `groups` (ConditionGroups — basket, Kasse, order, check): „Für jede zulässige
     * Reifengröße“ once and „Nur bei <size>“ once each. `wording` (the product page's „alle Auflagen im Wortlaut“,
     * ordered by what there is to do): within each section a size-bound sentence stands in its own list under the
     * „Nur bei …“ line naming its sizes. `surface` names the place.
     */
    async checkGroups(scope: Locator, surface: string, shot: string, layout: 'groups' | 'wording' = 'groups'): Promise<void> {
        const text = norm(await scope.innerText());
        // A list's own items only: an order's lines are one list that holds each line's lists, which are kept apart.
        const lists = (
            await scope.locator('ul').evaluateAll((uls) =>
                uls.map((ul) => {
                    const own = ul.cloneNode(true) as HTMLElement;

                    own.querySelectorAll('ul').forEach((nested) => nested.remove());

                    const before = ul.previousElementSibling;

                    return { text: own.textContent ?? '', head: before?.classList.contains('fdt__for') ? (before.textContent ?? '') : null };
                }),
            )
        ).map((list) => ({ text: norm(list.text), head: list.head === null ? null : norm(list.head) }));
        const mixed = lists.filter((l) => l.text.includes(FINE_LINK_CHAINS) && l.text.includes(NO_CHAINS));

        if (mixed.length) {
            this.note({
                severity: 'S2',
                page: surface,
                what: `both snow-chain sentences in one list: „${mixed[0]?.text.slice(0, 160)}…“`,
                expected: 'A10 with 235/45 R19 and 245/40 R19, A12 with 255/40 R19, never one list',
                shot,
            });
        }

        if (layout === 'wording') {
            const heads: [string, string][] = [
                [FINE_LINK_CHAINS, `Nur bei ${SIZES_19[0]} und ${SIZES_19[1]}`],
                [NO_CHAINS, `Nur bei ${SIZES_19[2]}`],
            ];

            for (const [sentence, head] of heads) {
                for (const list of lists.filter((l) => l.text.includes(sentence))) {
                    if (list.head !== head) {
                        this.note({ severity: 'S2', page: surface, what: `„${sentence}…“ stands under „${list.head ?? 'no heading'}“`, expected: `under „${head}“`, shot });
                    }
                }
            }

            return;
        }

        const forEvery = times(text, 'Für jede zulässige Reifengröße');

        if (forEvery !== 1) {
            this.note({
                severity: 'S2',
                page: surface,
                what: `„Für jede zulässige Reifengröße“ stands ${forEvery}×`,
                expected: 'once, above the combination’s Auflagen',
                shot,
            });
        }

        for (const size of SIZES_19) {
            const n = times(text, `Nur bei ${size}`);

            if (n !== 1) {
                this.note({
                    severity: 'S2',
                    page: surface,
                    what: `„Nur bei ${size}“ stands ${n}× (the size is named ${times(text, size)}× in all)`,
                    expected: `one block „Nur bei ${size}“ with that size’s own Auflagen`,
                    shot,
                });
            }
        }

        // Each ConditionGroups size block (where the surface renders them) keeps its own chain sentence.
        const blocks = await scope.locator('section.cgroups__size').evaluateAll((sections) =>
            sections.map((s) => ({ head: s.querySelector('.cgroups__head')?.textContent ?? '', body: s.textContent ?? '' })),
        );

        for (const block of blocks) {
            const head = norm(block.head);
            const body = norm(block.body);
            const wide = head.includes('255/40 R19');

            if (wide && (!body.includes(NO_CHAINS) || body.includes(FINE_LINK_CHAINS))) {
                this.note({ severity: 'S1', page: surface, what: `„${head}“ does not say „${NO_CHAINS}“ alone`, expected: 'A12 with 255/40 R19, never A10', shot });
            }

            if (!wide && (head.includes('235/45') || head.includes('245/40')) && (!body.includes(FINE_LINK_CHAINS) || body.includes(NO_CHAINS))) {
                this.note({ severity: 'S1', page: surface, what: `„${head}“ does not say the fine-link chains alone`, expected: 'A10 with 235/45 and 245/40 R19, never A12', shot });
            }
        }
    }

    /** The papers line, per size. */
    async checkPapersLine(scope: Locator, surface: string, shot: string): Promise<void> {
        const text = norm(await scope.innerText());

        if (!text.includes(ENTRY_BY_SIZE)) {
            const said = text.match(/(Eintragung|Abnahme)[^.]{0,140}\./)?.[0] ?? 'no line about the Eintragung or Abnahme';

            this.note({ severity: 'S2', page: surface, what: `papers line: „${said}“`, expected: `„${ENTRY_BY_SIZE}“`, shot });
        }
    }
}

export function slug(label: string): string {
    return label.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'start';
}

/** The visitor's cookie choice already made, so the sheet does not sit over what is measured. */
export async function consent(page: Page, baseURL: string): Promise<void> {
    await page.context().addCookies([
        {
            name: 'rmf_consent',
            value: encodeURIComponent(JSON.stringify({ necessary: true, statistics: false, decidedAt: '2026-01-01T00:00:00.000Z' })),
            url: baseURL,
        },
    ]);
}

export interface VariantRow {
    id: number;
    variant: string;
    typeDesignation: string | null;
    needsReview: boolean;
    approval?: string | null;
}

export async function variantsOf(page: Page, make: string, model: string): Promise<VariantRow[]> {
    const response = await page.request.get(`/api/v1/vehicles/variants?marke=${encodeURIComponent(make)}&modell=${encodeURIComponent(model)}`, {
        headers: { Accept: 'application/json' },
    });

    if (response.status() !== 200) {
        return [];
    }

    return ((await response.json()) as { variants: VariantRow[] }).variants;
}

export async function modelsOf(page: Page, make: string): Promise<{ model: string; variants: number }[]> {
    const response = await page.request.get(`/api/v1/vehicles/models?marke=${encodeURIComponent(make)}`, { headers: { Accept: 'application/json' } });

    if (response.status() !== 200) {
        return [];
    }

    const body = (await response.json()) as { models?: { model: string; variants: number }[] } | { model: string; variants: number }[];

    return Array.isArray(body) ? body : (body.models ?? []);
}

/** Chooses a car by its id as the guided route does (POST /fahrzeug): cookies only. */
export async function chooseById(page: Page, id: number): Promise<boolean> {
    const xsrf = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN');

    if (xsrf === undefined) {
        return false;
    }

    const response = await page.request.post('/fahrzeug', {
        headers: { Accept: 'text/html', 'X-XSRF-TOKEN': decodeURIComponent(xsrf.value) },
        form: { fahrzeug: String(id) },
        maxRedirects: 0,
    });

    return response.status() === 302;
}

/** Make › model › type, one half preferred where a document splits the car (Feld K). Null when the shop lacks it. */
export async function chooseCar(
    sweep: Sweep,
    make: string,
    model: string,
    type: string,
    prefer: (row: VariantRow) => boolean = () => true,
): Promise<VariantRow | null> {
    if (!(await sweep.page.context().cookies()).some((c) => c.name === 'XSRF-TOKEN')) {
        await sweep.open('/');
    }

    const rows = (await variantsOf(sweep.page, make, model)).filter((row) => norm(row.typeDesignation ?? row.variant) === type);
    const row = rows.find(prefer) ?? rows[0] ?? null;

    if (row === null || !(await chooseById(sweep.page, row.id))) {
        return null;
    }

    return row;
}

/** The size chip of a diameter on the product page. */
export function sizeChip(page: Page, diameter: string): Locator {
    return page.locator('#groessen').getByRole('button', { name: diameter, exact: true });
}

/** Asserts softly and records the outcome as a finding when it fails. */
export function check(sweep: Sweep, ok: boolean, finding: Omit<Finding, 'width'>): boolean {
    if (!ok) {
        sweep.note(finding);
    }

    expect.soft(ok, `${finding.severity} · ${finding.page} · ${finding.what}`).toBe(true);

    return ok;
}
