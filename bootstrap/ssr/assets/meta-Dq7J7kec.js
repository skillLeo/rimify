import { a as link_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as Icon_default } from "./Icon-DUS6sqAV.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { O as useShared } from "./useShortcuts-CxTH5cOJ.js";
import { i as modelle, r as felgen } from "./format-6R0uUMt3.js";
import { t as Picture_default } from "./Picture-Fl6hr1l0.js";
import { t as ValueText_default } from "./ValueText-DsF8Caj6.js";
//#region resources/js/lib/fahrzeugschein.ts
/** What stands between or inside key numbers as people write and copy them: spaces, „/“, „-“, „–“, „.“, „,“. */
var SEPARATORS = /[\s/\-–.,]+/g;
/** What is typed or pasted into the HSN field: separators gone, upper case, four characters at most. */
function cleanHsn(raw) {
	return raw.replace(SEPARATORS, "").toUpperCase().slice(0, 4);
}
/** What is typed or pasted into the TSN field: separators gone, upper case, three characters at most. */
function cleanTsn(raw) {
	return raw.replace(SEPARATORS, "").toUpperCase().slice(0, 3);
}
/**
* What landed in the HSN field, as the two key numbers. A pair copied from a list or a message — „0005/582“,
* „0005 582“, „0005-582“, „0005582“ — fills both fields, and a fifth character typed on carries on into the TSN.
* `tsn` is null when nothing went past the HSN. Every HSN field takes its input through here: a field that clips at
* four characters drops the TSN of a pair a phone's keyboard inserts.
*/
function splitKeys(raw) {
	const all = raw.replace(SEPARATORS, "").toUpperCase();
	return {
		hsn: all.slice(0, 4),
		tsn: all.length > 4 ? all.slice(4, 7) : null
	};
}
/** An HSN has four digits; leading zeros count (R-10). */
function isHsn(value) {
	return /^\d{4}$/.test(value);
}
/** A TSN has three characters, letters or digits. */
function isTsn(value) {
	return /^[A-Z0-9]{3}$/.test(value);
}
//#endregion
//#region resources/js/Components/Home/brandWall.ts
/** Most columns per tier: S < 768 · M 768–1023 · L 1024–1279 · XL ≥ 1280 (§2.2). */
var WALL_MAX_COLUMNS = {
	s: 2,
	m: 4,
	l: 5,
	xl: 6
};
/** Up to this many brands share one row, with the closing link as a footer strip under them (§2.2). */
var FOOTER_MAX_BRANDS = 3;
/**
* Fewest rows first, then the most even rows (§2.2). `cells` counts the closing cell. With one to
* three brands the closing link is never a peer cell as wide and tall as a brand: the brands share
* one row at every tier and the link is a full-width footer strip under them.
*/
function wallLayout(cells, maxColumns) {
	const brands = Math.max(1, cells - 1);
	if (brands <= FOOTER_MAX_BRANDS) return {
		rows: 2,
		columns: brands,
		closingSpan: brands
	};
	const rows = Math.ceil(cells / maxColumns);
	const columns = Math.ceil(cells / rows);
	return {
		rows,
		columns,
		closingSpan: columns * rows - cells + 1
	};
}
/** Inline custom properties for the `<ul>`: every tier's columns and closing span; brandCount ≥ 1. */
function wallStyle(brandCount) {
	const style = {};
	for (const [tier, max] of Object.entries(WALL_MAX_COLUMNS)) {
		const { columns, closingSpan } = wallLayout(brandCount + 1, max);
		style[`--wall-cols-${tier}`] = String(columns);
		style[`--wall-span-${tier}`] = String(closingSpan);
	}
	return style;
}
/**
* An absolute path on this origin to an SVG, PNG or WebP — nothing that could break out of
* `url("…")`, and never a protocol-relative `//host/…` (the same pattern as BrandLogos::URL_PATTERN).
*/
var LOGO_PATH = /^\/(?!\/)[A-Za-z0-9/_.-]+\.(svg|png|webp)(\?v=[A-Za-z0-9]+)?$/;
/** The narrowest and the widest logo the wall accepts (width / height). */
var ASPECT_MIN = .2;
var ASPECT_MAX = 20;
/** The seeded sample range: labelled as what it is, never dressed up as a manufacturer. */
var isSampleRange = (brand) => brand.slug === "demo";
/** True only when every check passes (§4.2); otherwise the cell shows the wordmark. */
function hasMark(brand) {
	const aspect = brand.logoAspect;
	return !isSampleRange(brand) && typeof brand.logo === "string" && LOGO_PATH.test(brand.logo) && typeof aspect === "number" && Number.isFinite(aspect) && aspect >= ASPECT_MIN && aspect <= ASPECT_MAX;
}
/**
* The mark's inline custom properties: its aspect and the aspect's square root (3 decimals), and
* the mask image. CSS then does `min(k·√a, Wmax, Hmax·a, 100%)` with the tier's tokens.
*
* The image travels as a custom property rather than as `maskImage` / `WebkitMaskImage`: Vue's
* server renderer writes `WebkitMaskImage` as `webkit-mask-image` (no leading dash), which no
* browser reads. A custom property is written verbatim on both sides. Call only when hasMark().
*/
function markStyle(brand) {
	const aspect = brand.logoAspect ?? 1;
	return {
		"--logo-aspect": aspect.toFixed(3),
		"--logo-sqrt": Math.sqrt(aspect).toFixed(3),
		"--logo-url": `url("${brand.logo ?? ""}")`
	};
}
/** The wordmark's step from the name's longest word: ≤ 5 characters `s`, 6–8 `m`, ≥ 9 `l` (§3.3). */
function wordmarkSize(name) {
	const longest = Math.max(0, ...name.trim().split(/\s+/).map((word) => Array.from(word).length));
	return longest <= 5 ? "s" : longest <= 8 ? "m" : "l";
}
/** Prop order, with the sample range moved to the end of the brands. Presentation only. */
var orderedBrands = (list) => [...list.filter((brand) => !isSampleRange(brand)), ...list.filter(isSampleRange)];
/**
* A cell is a link only when there is something to list: a count above zero AND the server's link
* to it. Either missing, the cell is greyed and goes nowhere — fail closed, never a tile into an
* empty listing (CLAUDE.md §2).
*/
function isLinked(brand) {
	return typeof brand.count === "number" && brand.count > 0 && typeof brand.href === "string" && brand.href !== "";
}
/** What a greyed cell says where its count would be. */
var NO_STOCK_LINE = "Zurzeit keine Felgen lieferbar";
/** The closing cell's link text (§4.1). */
function closingLabel(vehicle) {
	return vehicle ? "Passende Felgen anzeigen" : "Alle Felgen ansehen";
}
var RULE = "Nur Marken, von denen gerade Felgen lieferbar sind.";
/** The rule once the wall holds a greyed brand: the old sentence would no longer be true. */
var RULE_WITH_GREYED = "Ausgegraute Marken haben gerade keine lieferbaren Felgen.";
/**
* The note under the wall (§4.1). It states the wall's own rule — which sentence depends on
* whether a greyed brand is on the wall (`someWithoutStock`), so the note is always true. With a
* vehicle it adds that the counts are the brand's catalogue counts, because the size tiles right
* above count only what fits — RIMIFY may not let a bare `18 Modelle` read as "18 fit my car"
* (CLAUDE.md §2).
*/
function noteText(vehicle, someWithoutStock = false) {
	const rule = someWithoutStock ? RULE_WITH_GREYED : RULE;
	return vehicle ? `${rule} Die Zahl zählt alle lieferbaren Modelle der Marke; welche davon für ${vehicle.short} freigegeben sind, zeigt dir die Liste.` : rule;
}
//#endregion
//#region resources/js/Components/Home/BrandWall.vue?vue&type=script&setup=true&lang.ts
var BrandWall_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "BrandWall",
	__ssrInlineRender: true,
	props: {
		brands: {},
		vehicle: {},
		flush: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* H6 row two — *Nach Marke*, the brand wall (docs/design/sections/home-brands.md), shared by the
		* desktop document (FindFast) and the phone document (Startseite/Mobile), so they cannot drift.
		*
		* A set of hairlines, not boxes: the cells are the band's own colour, the brands in prop order with
		* the sample range last, then one closing link. The column count per tier is computed from the
		* number of cells so the closing cell always completes the last row — there is never an empty
		* cell. Logos are one-colour masks filled with the ink token, sized by constant area; a brand
		* without a usable logo is set as its name.
		*
		* Every wheel brand is on the wall, stock or not. A brand with nothing on stock is greyed — its
		* mark or name in the tertiary ink, the sentence *Zurzeit keine Felgen lieferbar* where its count
		* would be — and is not a link, the way the size tiles above grey a size nothing fits: shown,
		* never hidden, never struck, never a tile into an empty listing (CLAUDE.md §2). The note under
		* the wall states the wall's own rule — which sentence depends on whether a greyed brand is on it —
		* and, with a vehicle, that the counts are the brand's whole stock rather than what fits the car.
		*/
		const props = __props;
		const failed = (0, vue_exports.shallowRef)(/* @__PURE__ */ new Set());
		const probed = /* @__PURE__ */ new Set();
		let mounted = false;
		function kindOf(brand) {
			if (isSampleRange(brand)) return "sample";
			return hasMark(brand) && brand.logo !== null && !failed.value.has(brand.logo) ? "mark" : "name";
		}
		const cells = (0, vue_exports.computed)(() => orderedBrands(props.brands).map((brand) => ({
			brand,
			kind: kindOf(brand),
			href: isLinked(brand) ? brand.href : null
		})));
		const layout = (0, vue_exports.computed)(() => wallStyle(cells.value.length));
		const someWithoutStock = (0, vue_exports.computed)(() => cells.value.some((cell) => cell.href === null));
		function probe(list) {
			for (const brand of list) {
				const url = brand.logo;
				if (url === null || !hasMark(brand) || probed.has(url)) continue;
				probed.add(url);
				const image = new Image();
				image.onerror = () => {
					failed.value = /* @__PURE__ */ new Set([...failed.value, url]);
				};
				image.src = url;
			}
		}
		(0, vue_exports.watch)(() => props.brands, (list) => {
			if (mounted) probe(list);
		});
		(0, vue_exports.onMounted)(() => {
			mounted = true;
			probe(props.brands);
		});
		return (_ctx, _push, _parent, _attrs) => {
			if (cells.value.length > 0) {
				_push(`<!--[--><ul class="${(0, server_renderer_exports.ssrRenderClass)([{ "brand-wall--flush": __props.flush }, "brand-wall"])}" style="${(0, server_renderer_exports.ssrRenderStyle)(layout.value)}" aria-label="Felgen nach Marke"${(0, server_renderer_exports.ssrRenderAttr)("data-brands", cells.value.length)} data-v-e68f7058><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(cells.value, ({ brand, kind, href }) => {
					_push(`<li class="brand-wall__item" data-v-e68f7058>`);
					(0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)(href === null ? "span" : (0, vue_exports.unref)(link_default)), (0, vue_exports.mergeProps)({
						class: ["brand-cell", { "brand-cell--none": href === null }],
						"data-kind": kind
					}, { ref_for: true }, href === null ? { "aria-disabled": "true" } : {
						href,
						prefetch: true
					}), {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push(`<span class="brand-cell__stage" data-v-e68f7058${_scopeId}>`);
								if (kind === "mark") _push(`<!--[--><span class="brand-cell__mark" aria-hidden="true" style="${(0, server_renderer_exports.ssrRenderStyle)((0, vue_exports.unref)(markStyle)(brand))}" data-v-e68f7058${_scopeId}></span><span class="visually-hidden" translate="no" data-v-e68f7058${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(`${brand.name} `)}</span><!--]-->`);
								else if (kind === "sample") _push(`<!--[--><span class="brand-cell__sample" data-v-e68f7058${_scopeId}>Beispiel­sortiment</span><span class="visually-hidden" translate="no" data-v-e68f7058${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(` (${brand.name}) `)}</span><!--]-->`);
								else _push(`<span class="brand-cell__name"${(0, server_renderer_exports.ssrRenderAttr)("data-len", (0, vue_exports.unref)(wordmarkSize)(brand.name))} translate="no" data-v-e68f7058${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(brand.name)}</span>`);
								_push(`</span>`);
								if (href !== null) _push(`<span class="brand-cell__foot brand-cell__count small num" translate="no" data-v-e68f7058${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(modelle)(brand.count))}</span>`);
								else _push(`<span class="brand-cell__foot brand-cell__none small" data-v-e68f7058${_scopeId}><span class="visually-hidden" data-v-e68f7058${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(NO_STOCK_LINE))}</span></span>`);
							} else return [(0, vue_exports.createVNode)("span", { class: "brand-cell__stage" }, [kind === "mark" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)("span", {
								class: "brand-cell__mark",
								"aria-hidden": "true",
								style: (0, vue_exports.unref)(markStyle)(brand)
							}, null, 4), (0, vue_exports.createVNode)("span", {
								class: "visually-hidden",
								translate: "no"
							}, (0, vue_exports.toDisplayString)(`${brand.name} `), 1)], 64)) : kind === "sample" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createVNode)("span", { class: "brand-cell__sample" }, "Beispiel­sortiment"), (0, vue_exports.createVNode)("span", {
								class: "visually-hidden",
								translate: "no"
							}, (0, vue_exports.toDisplayString)(` (${brand.name}) `), 1)], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 2,
								class: "brand-cell__name",
								"data-len": (0, vue_exports.unref)(wordmarkSize)(brand.name),
								translate: "no"
							}, (0, vue_exports.toDisplayString)(brand.name), 9, ["data-len"]))]), href !== null ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 0,
								class: "brand-cell__foot brand-cell__count small num",
								translate: "no"
							}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(modelle)(brand.count)), 1)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 1,
								class: "brand-cell__foot brand-cell__none small"
							}, [(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(NO_STOCK_LINE)), 1)]))];
						}),
						_: 2
					}), _parent);
					_push(`</li>`);
				});
				_push(`<!--]--><li class="brand-wall__item brand-wall__item--all" data-v-e68f7058>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen",
					class: "brand-cell brand-cell--all",
					"data-kind": "all",
					prefetch: ""
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push(`<span class="brand-cell__foot brand-cell__all" data-v-e68f7058${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(closingLabel)(__props.vehicle))}`);
							_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
								name: "arrow-right",
								size: 16
							}, null, _parent, _scopeId));
							_push(`</span>`);
						} else return [(0, vue_exports.createVNode)("span", { class: "brand-cell__foot brand-cell__all" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)((0, vue_exports.unref)(closingLabel)(__props.vehicle)), 1), (0, vue_exports.createVNode)(Icon_default, {
							name: "arrow-right",
							size: 16
						})])];
					}),
					_: 1
				}, _parent));
				_push(`</li></ul><p class="small brand-wall__note" data-v-e68f7058>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(noteText)(__props.vehicle, someWithoutStock.value))}</p><!--]-->`);
			} else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/BrandWall.vue
var _sfc_setup$5 = BrandWall_vue_vue_type_script_setup_true_lang_default.setup;
BrandWall_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/BrandWall.vue");
	return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
var BrandWall_default = /*#__PURE__*/ _plugin_vue_export_helper_default(BrandWall_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-e68f7058"]]);
//#endregion
//#region resources/js/composables/useRowMarker.ts
/**
* Where a row sits inside its positioned container — its top and its height — as the two CSS variables a highlighter
* laid over it reads (`--mark-top`, `--mark-h`; the client's #6, D-111).
*
* The designed values render first, so the server's page and the first paint already show the marker on its row.
* Once mounted the row itself is measured, and measured again whenever the row or its table changes size, so the
* marker never drifts off its row: not at another width, not under browser zoom, not where a phone enlarges type.
* A row's `offsetTop` counts from its offset parent — the positioned container the marker is drawn in, or the
* table, which starts at that container's top.
*/
function useRowMarker(row, designed) {
	const style = (0, vue_exports.ref)({
		"--mark-top": `${designed.top}px`,
		"--mark-h": `${designed.height}px`
	});
	let observer;
	function measure() {
		const el = row.value;
		if (el === null || el.offsetHeight === 0) return;
		style.value = {
			"--mark-top": `${el.offsetTop}px`,
			"--mark-h": `${el.offsetHeight}px`
		};
	}
	(0, vue_exports.onMounted)(() => {
		measure();
		if (typeof ResizeObserver === "undefined" || row.value === null) return;
		observer = new ResizeObserver(measure);
		for (const el of /* @__PURE__ */ new Set([
			row.value,
			row.value.parentElement,
			row.value.offsetParent
		])) if (el instanceof Element) observer.observe(el);
	});
	(0, vue_exports.onBeforeUnmount)(() => observer?.disconnect());
	return style;
}
//#endregion
//#region resources/js/lib/zeroState.ts
/**
* The vehicle selector's zero (F2; the operator's brief of 05.10.2026, §2): a car with no wheel to show is a deliberate
* state, said the same on the desktop and the phone — the count reads 0 rather than vanishing, and one sentence says
* why: the shop is still empty, or no document names this car yet.
*/
/** `0 Felgen für dieses Fahrzeug` — the count where it would stand, never left out. */
var ZERO_LABEL = `${felgen(0)} für dieses Fahrzeug`;
function zeroSentence(shopEmpty) {
	return shopEmpty ? "Noch ist keine Felge im Sortiment. Sobald die ersten mit Gutachten freigegeben sind, siehst du hier, welche an dein Auto dürfen." : "Für dieses Fahrzeug haben wir noch keine Felge mit Gutachten.";
}
//#endregion
//#region resources/js/Components/Home/HeroHelp.vue?vue&type=script&setup=true&lang.ts
var HeroHelp_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "HeroHelp",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The help line under the hero's selector (the client's #3, D-107): the one thing the utility strip above the
		* header said that nothing else on the page said — where to ask, and when someone reads it. The strip's two
		* promises, shipping from Germany and a Gutachten with every Felge, stand in the promise row right under the hero in
		* the client's own words, so they are not said twice.
		*
		* Help goes to the contact form, never to a mail program (the client's #26); a phone number stands only where the
		* client has given one. No reply time is promised (ServiceStatus).
		*/
		const shared = useShared();
		const contact = (0, vue_exports.computed)(() => shared.value.contact);
		const telHref = (0, vue_exports.computed)(() => `tel:${(contact.value.phoneIntl ?? contact.value.phone ?? "").replace(/\s/g, "")}`);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<p${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "hero-help" }, _attrs))} data-v-8c3f250d>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "mail",
				size: 20,
				class: "hero-help__icon"
			}, null, _parent));
			_push(`<span data-v-8c3f250d> Fragen zu deinem Fahrzeug? `);
			if (contact.value.phone) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", telHref.value)} class="hero-help__link num" data-v-8c3f250d>${(0, server_renderer_exports.ssrInterpolate)(contact.value.phone)}</a>`);
			else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/kontakt",
				class: "hero-help__link"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Schreib uns`);
					else return [(0, vue_exports.createTextVNode)("Schreib uns")];
				}),
				_: 1
			}, _parent));
			_push(` ${(0, server_renderer_exports.ssrInterpolate)(" ")}<span class="hero-help__sep" aria-hidden="true" data-v-8c3f250d>· </span><span class="hero-help__hours" data-v-8c3f250d>${(0, server_renderer_exports.ssrInterpolate)(contact.value.hours)}</span></span></p>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/HeroHelp.vue
var _sfc_setup$4 = HeroHelp_vue_vue_type_script_setup_true_lang_default.setup;
HeroHelp_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/HeroHelp.vue");
	return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
var HeroHelp_default = /*#__PURE__*/ _plugin_vue_export_helper_default(HeroHelp_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-8c3f250d"]]);
/**
* The desktop stage, 3 : 2, the picture its full height and centred. The Lochkreis top right, the
* cap and the stamp from below, where the wheel curves away and a box never covers the rim.
*/
var DESKTOP_LAYOUT = {
	ratio: 3 / 2,
	picture: {
		size: 1,
		left: 1 / 6,
		top: 0
	},
	inset: 2,
	insetLeft: 0,
	weight: .3,
	callouts: [
		{
			key: "boltCircle",
			side: "right",
			y: 12,
			elbow: 78,
			angle: -87
		},
		{
			key: "centreBore",
			side: "left",
			y: 87,
			elbow: 32,
			angle: 165
		},
		{
			key: "kba",
			side: "right",
			y: 87,
			elbow: 70
		}
	]
};
/**
* The phone frame, 7 : 6, the picture 90 % of its height: two callouts, both on the right. The frame
* clips, so the wheel rolls in from just past its right edge: 1,15 picture widths.
*/
var PHONE_LAYOUT = {
	ratio: 7 / 6,
	picture: {
		size: .9,
		left: (1 - 5.4 / 7) / 2,
		top: .02
	},
	inset: 2,
	weight: .45,
	rollDistance: 1.15,
	callouts: [{
		key: "boltCircle",
		side: "right",
		y: 12,
		elbow: 72,
		angle: -87
	}, {
		key: "kba",
		side: "right",
		y: 89
	}]
};
/**
* The desktop stage with the second wheel: the pair centred in the frame — the leading wheel moved left, the second
* behind it to the right with its cap, bolt circle and print clear of the leading rim (about two thirds of it shown).
* The callouts stay on the leading wheel only (the operator: doubling them is noise), placed so they never form a
* column of cards: the Lochkreis on the content edge at the top right, clear of the second wheel; the cap at the top
* left, its one straight leg through the gap between the spokes at ten o'clock; the stamp below, its leg vertical.
*/
var DESKTOP_PAIR_LAYOUT = {
	...DESKTOP_LAYOUT,
	picture: {
		size: 1,
		left: .07,
		top: 0
	},
	inset: 6,
	fixedSides: true,
	callouts: [
		{
			key: "boltCircle",
			side: "right",
			y: 9,
			elbow: 66,
			angle: -87
		},
		{
			key: "centreBore",
			side: "left",
			y: 12,
			angle: 212
		},
		{
			key: "kba",
			side: "left",
			y: 87,
			elbow: "target"
		}
	]
};
var DESKTOP_COMPANION = {
	scale: .8,
	offset: .61
};
/**
* The phone frame with the second wheel: the leading wheel a little smaller and right of centre, the second's cap and
* bolt circle behind it, its print cut by the leading rim; both boxes on the left, clear of the rim.
*/
var PHONE_PAIR_LAYOUT = {
	...PHONE_LAYOUT,
	picture: {
		size: .84,
		left: .14,
		top: .03
	},
	fixedSides: true,
	callouts: [{
		key: "boltCircle",
		side: "left",
		y: 12,
		elbow: 28,
		angle: -93
	}, {
		key: "kba",
		side: "left",
		y: 89
	}]
};
var PHONE_COMPANION = {
	scale: .78,
	offset: .36
};
var HERO_SIZES_DESKTOP = "(min-width: 1280px) 500px, (min-width: 1024px) 33vw, (min-width: 768px) 373px, calc(67vw - 27px)";
var HERO_SIZES_PHONE = "(min-width: 768px) calc(77vw - 49px), calc(77vw - 31px)";
/** `53810 (ABE)`: a five-digit KBA number is the mark of an ABE (KBA, PM 18/2025); any other stays a bare number. */
function kbaValue(kba) {
	return /^\d{5}$/.test(kba) ? `${kba} (ABE)` : kba;
}
var round = (n) => Math.round(n * 100) / 100;
/** A point of the picture (fractions of its side) in percent of the frame. */
function toFrame(layout, point) {
	const { size, left, top } = layout.picture;
	return {
		x: round((left + point.x * size / layout.ratio) * 100),
		y: round((top + point.y * size) * 100)
	};
}
/** A point on a circle of the picture, at `angle` degrees clockwise from three o'clock. */
function onCircle(circle, angle) {
	const rad = angle * Math.PI / 180;
	return {
		x: circle.x + circle.r * Math.cos(rad),
		y: circle.y + circle.r * Math.sin(rad)
	};
}
/**
* Everything the hero draws, in one layout: the photograph from `picture`, the leaders from `facts` — the values of the
* wheel in it, given as the third argument (they win over any the picture carries). Without values the photograph
* stands alone (the operator's brief of 05.10.2026, §2). Fails closed: no manifest, no picture; no anchor or no value,
* no callout; a KBA number only where the photograph's own stamp is that number.
*/
function heroScene(picture, layout, facts) {
	const values = facts === void 0 ? picture?.facts ?? null : facts;
	const manifest = picture?.imageManifest ?? null;
	const bare = manifest?.bare ?? null;
	const frame = bare ?? manifest;
	const anchors = frame === null ? null : frame.anchors ?? manifest?.anchors ?? null;
	const wheel = anchors?.wheel ?? null;
	const shadow = bare !== null && wheel !== null ? {
		x: round(wheel.x * 100),
		y: round((wheel.y + wheel.r) * 100),
		w: round(wheel.r * 2 * 78)
	} : null;
	const rollDistance = layout.rollDistance ?? 1.6;
	const roll = bare !== null && wheel !== null && anchors !== null ? {
		distance: round(rollDistance * 100),
		angle: round(rollDistance / wheel.r * 180 / Math.PI),
		originX: round(anchors.centre.x * 100),
		originY: round(anchors.centre.y * 100)
	} : null;
	const callouts = [];
	const stampLeft = anchors?.kba !== void 0 && anchors.kba.x < anchors.centre.x - .1;
	const placed = (place) => stampLeft && layout.fixedSides !== true && (place.key === "kba" || place.key === "centreBore") ? {
		...place,
		side: place.side === "left" ? "right" : "left",
		elbow: place.elbow === void 0 || place.elbow === "target" ? place.elbow : 100 - place.elbow,
		angle: place.angle === void 0 ? void 0 : 180 - place.angle
	} : place;
	if (values !== null && anchors !== null) {
		const facts = values;
		for (const place of layout.callouts.map(placed)) {
			const inset = place.side === "left" ? layout.insetLeft ?? layout.inset : layout.inset;
			const base = {
				key: place.key,
				side: place.side,
				x: inset,
				y: place.y,
				elbow: typeof place.elbow === "number" ? place.elbow : void 0
			};
			const bend = (tx) => place.elbow === "target" ? { elbow: tx } : {};
			if (place.key === "boltCircle" && anchors.pcd !== void 0) {
				const end = toFrame(layout, onCircle(anchors.pcd, place.angle ?? 0));
				const centre = toFrame(layout, anchors.pcd);
				const ring = {
					cx: centre.x,
					cy: centre.y,
					r: round(anchors.pcd.r * layout.picture.size * 100)
				};
				callouts.push({
					...base,
					...bend(end.x),
					label: "Lochkreis",
					value: facts.boltPattern,
					tx: end.x,
					ty: end.y,
					ring
				});
			}
			if (place.key === "centreBore" && anchors.bore !== void 0) {
				const end = toFrame(layout, onCircle(anchors.bore, place.angle ?? 0));
				callouts.push({
					...base,
					...bend(end.x),
					label: "Mittenlochbohrung",
					value: facts.centreBore,
					note: "hinter der Nabenkappe",
					tx: end.x,
					ty: end.y
				});
			}
			if (place.key === "kba" && anchors.kba !== void 0 && facts.kba !== null && manifest?.stamp === facts.kba) {
				const end = toFrame(layout, {
					x: place.side === "right" ? anchors.kba.x + anchors.kba.w / 2 : anchors.kba.x - anchors.kba.w / 2,
					y: anchors.kba.y
				});
				callouts.push({
					...base,
					...bend(end.x),
					label: "KBA-Nummer",
					value: kbaValue(facts.kba),
					tx: end.x,
					ty: end.y
				});
			}
		}
	}
	return {
		picture: frame,
		anchors,
		shadow,
		roll,
		callouts
	};
}
/**
* Where the second wheel stands and how it rolls in. Both axles (the `centre` anchors) on one line, so the smaller wheel
* reads as further back; each stands on its own contact shadow. Fails closed — no leading roll, no companion picture or
* no wheel anchor on either: no second wheel.
*/
function companionScene(picture, lead, layout, placement) {
	const manifest = picture?.companion?.imageManifest ?? null;
	const bare = manifest?.bare ?? null;
	const anchors = bare === null ? null : bare.anchors ?? manifest?.anchors ?? null;
	const wheel = anchors?.wheel ?? null;
	const leadCentre = lead.anchors?.centre ?? null;
	if (bare === null || anchors === null || wheel === null || leadCentre === null || lead.roll === null) return null;
	const { size, left, top } = layout.picture;
	const axle = top + leadCentre.y * size;
	const side = size * placement.scale;
	const boxTop = axle - anchors.centre.y * side;
	const boxLeft = left + placement.offset * size / layout.ratio;
	const rollDistance = layout.rollDistance ?? 1.6;
	return {
		picture: bare,
		box: {
			left: round(boxLeft * 100),
			top: round(boxTop * 100),
			size: round(side / layout.ratio * 100)
		},
		shadow: {
			x: round(wheel.x * 100),
			y: round((wheel.y + wheel.r) * 100),
			w: round(wheel.r * 2 * 78)
		},
		roll: {
			distance: round(rollDistance * 100),
			angle: round(rollDistance / wheel.r * 180 / Math.PI),
			originX: round(anchors.centre.x * 100),
			originY: round(anchors.centre.y * 100)
		}
	};
}
/** The second wheel's box, roll and shadow as custom properties, read by the same rules as the leading wheel's. */
function companionStyle(scene) {
	return {
		"--pair-left": `${scene.box.left}%`,
		"--pair-top": `${scene.box.top}%`,
		"--pair-size": `${scene.box.size}%`,
		"--pair-delay": `160ms`,
		...rollStyle({
			picture: scene.picture,
			anchors: null,
			shadow: scene.shadow,
			roll: scene.roll,
			callouts: []
		})
	};
}
/**
* The frame's own inline style: its ratio and where the picture sits, as the custom properties the
* two components' stylesheets read. One source for the drawing and the layout.
*/
function frameStyle(layout) {
	return {
		"--frame-ratio": String(round(layout.ratio * 1e4) / 1e4),
		"--pic-left": `${round(layout.picture.left * 100)}%`,
		"--pic-top": `${round(layout.picture.top * 100)}%`,
		"--pic-size": `${round(layout.picture.size / layout.ratio * 100)}%`
	};
}
/** The roll-in and the contact shadow as custom properties on the picture's box; none without a roll. */
function rollStyle(scene) {
	const out = {};
	if (scene.roll !== null) {
		out["--roll-distance"] = `${scene.roll.distance}%`;
		out["--roll-angle"] = `${scene.roll.angle}deg`;
		out["--roll-origin"] = `${scene.roll.originX}% ${scene.roll.originY}%`;
	}
	if (scene.shadow !== null) {
		out["--contact-x"] = `${scene.shadow.x}%`;
		out["--contact-y"] = `${scene.shadow.y}%`;
		out["--contact-w"] = `${scene.shadow.w}%`;
	}
	return out;
}
var komplettrad_illustration_default = {
	name: "komplettrad-illustration",
	base: "/images/komplettrad-illustration/komplettrad-illustration",
	width: 768,
	height: 768,
	widths: [480, 768],
	fallback: "png",
	placeholder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsSAAALEgHS3X78AAAHBklEQVRIiY1We0xU2Rmfav8w3SwaYN73NTN3HsAi3R0YB0Ep2JllFYpisKuilG7WVqhP1hcPtSwoguPWhQExZEV0UEFGRhBBFgzCMO+XKd3FlKRZU3dT/1BM6q5zZ+7XnClQjG2zJznJufc73+/L9/wdDufN9RMOh7N0/kOpVL5NkmQmgRGlBEEcn9ulJEn+AskW6S2d0/2/awGcoiglLsaNOIY/wXEccAxnMTEGYjGGzkDgBBAE8XeSJJsoSqn8MUaWIGFGRsZPMZGokiCIlwRBAI/HY/l8PpAkychp+Sualr8iCILh8/ksks0ZeklRVCXSnTPwhpHIDz6f/xYuFpspkgKBQBDGcZzJzv6AOXTocMjYfAGuXbsR2UZjCxzYfzCs1+kZHMMYAV8QpigKKEpiVqvVP1uM+Z9DAWcpjmE9CJzP4wW1Wm24vt4Q6r1lYfv778LnnzcFK8orn5eXVz7/0/lGZmBgiO0xW9ja2lMhjUYT5vF4QQklAZlMdhMAlizGjsScwLBKBM7j8oI6nZ7t6LjKdt3ogt/t2jV98WJbwGhsqUZOon3+s/PV7e2XHxYVFU9f7jDBxdY2NisrC4UzKJVKQalUVi7KCYeD43gCgRMv+Dw+pKevZdvbr4Q/PXkStm3dauZwOMuGhr7MdTo93fMuO53ubrffn4NkG/M2mo8erYRmY3M4NVXLCgQC5MVscnLyOwsJIEm8EVWKVCpljh49Fr7c3gHd3eaZY8dquUh+7tw5od3hdDudTryrq13sdLrcvb29IiQrKyvjdZquzVzuuAqHDx1BuWBQPhISEpoi4EkkuYIkyW+4sbGweXNBqKioGNasXj3t8wUMbrfPGQj8RYvujY6OmR88sO0dHh7ZMzFhRZ5xAu6A1ulwO0ZG7hsKdxQ9OnPGABvWbwihSKhUcY/z8vJWcGQyWSYqR5FIBPv2HWDS0tLhwy0f1iCArutdxVar7anL4z84Pj7Z7XB6njucrtlxq/2mx+U5MD4+8Q+T6Xoxultc/FFt9aenoazsE0YoFIJcroA1a9ZkcWipdDeGYRAfH8+UlO6BOKWK3f+H/Wnz4WtoaJC4XJ7HX339CGwO16zD6Z5FZ4fT/RjJ5u/l5+en7dl7kK1vMIBMJmVoWg4pKat2IwNVyEBSUlKwtvY0VFRUfe/1//nM1NR0eSAwdcrrCxjsdtf05KT9qc/3EDweH6Cz3e7+2uv1GTwe36mpqa/KJyYm6traLv3Q3n4FVCpVkKZpZKAqYgC1fmLiymBzUzOUHyv/vvd2/9m7Q8NVd+4M1lss/QaHw/md1+sH66SDsdkcjNcXALvd9Z3FYjH09fXVDw0NVZlMpobmltYfunvMqEyDtFwBGq32OEdB07tRDmhazhibjLB1yxY2XZu+ECKbzUZ5vP5vvf6Hz+x21zMUIn/g4TOP1/9kbGxsIURSqSKt4Vwj29NzCwiCZFSqOMjIyNjNSUhQZqIOjI2Nhfr6s0znlQ7IzMyMJNnm9BSPjj542tl5vWzswcQNl9sbdrm9IavVfsNkunZwZGT0qdVqiyQ551f5tU53AM6eNTAIKyHhHcjN3ZTF+aVavZyWSr7hcrmwYUNuKODzQ8WRI9NfjowZ7o3cdzQ1Na1CAJbbd8xDQ6Olt/v7S+4Nj0TKtLWpddXw8IhjcGDQUFNb/+ivM3+D9evXhwQCIajVyY/r6uqWR9xT0HQjSZIgEomZpkZjeNJqg7q6+pmCgoJIo9XU1AgH7t5z3xocxA0Gg/je8Ki7c67RNm3axGtoMMxYJx3Q0nIhLBKJGKVSBWvXZvy70SLNlhSXIKGoF3y+AN5Tp7Cmq53hX2/Oh2S12lxUVLTMZLqea7b035y/39c3cHN4+H5OBpmxLHOd3vz7kn1gvmUJq9VqViQSQ9LP350tLPztwqiIDCSlXF5JkSTExsQG9br32dqa2rBWowFeTMyj06fPBFovflGt0+l42dnZ3La2turm5gsBmUwxvXXbTrh0qYPV698HLpcbjIuPh8xM3WvDLjJSAU4skUmoHjSToqOjg6mpq8N79+4LZ2d/wJZ9cjhSxpgYe0EQ5Iv33lUzJ09Wszt2/oY9ceKPodTU1HBMTExQrlCAVpu2eFy/Tjg63cq3JARhRtQYHR0dQsyVk5Mb+vjjXaHCHTth27ZCKCzcCcXFH0FJSWkoL28jg2EYqpowLZeDOkXT09ra+gbhvEaZXV1dSymCqBQJhS95PB5ERUWxqMJommZWrkx6hTZN00Eul8uuWL6CRRxN0/J/pqSsqgCAeU7+n7y8QPoKhUKFYVizUCj8FhlCtR0dHQ0xMTGIWCLDkZJInsTHxzfr9XrVopj/+JcFWhqNJkqhkK5DTxX0ZKEo6rhMJitNTExct3379qhFev8V/F/ZaU04H1E7vgAAAABJRU5ErkJggg==",
	licence: "CC0 1.0 - rendered by scripts/3d/render-komplettrad.mjs from the parametric wheel and tyre, no third-party design"
};
//#endregion
//#region resources/js/lib/bandWheel.ts
/** How much of the square the wheel's diameter takes. */
var BAND_WHEEL_FILL = .92;
/** The picture's box inside the square, in percent: scaled so the wheel fills it, moved so the wheel's centre is its centre. */
function bandWheelStyle(wheel, fill = BAND_WHEEL_FILL) {
	const width = fill / (2 * wheel.anchor.r);
	const height = width * wheel.image.height / wheel.image.width;
	const pct = (value) => `${Math.round(value * 1e4) / 100}%`;
	return {
		width: pct(width),
		left: pct(.5 - wheel.anchor.x * width),
		top: pct(.5 - wheel.anchor.y * height)
	};
}
/** `BORBET DB8GT2 in Bronze matt, Ansicht von vorn` */
function bandWheelAlt(wheel) {
	return `${wheel.brand} ${wheel.name} in ${wheel.finish}, Ansicht von vorn`;
}
/** `Felge im Bild: BORBET DB8GT2, Bronze matt` — the band is about Kompletträder; the photograph shows the rim. */
function bandWheelCaption(wheel) {
	return `Felge im Bild: ${wheel.brand} ${wheel.name}, ${wheel.finish}`;
}
//#endregion
//#region resources/js/Components/Home/rimCode.ts
/** Joins a prefix and its value so the pair never breaks across a line. */
var NBSP = "\xA0";
var clean = (value) => {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed === "" ? null : trimmed;
};
/**
* The approval mark, digits only. Five digits are an ABE, six a Teiletypgenehmigung (KBA PM
* 18/2025); anything else is not a KBA number we can explain, and the token stays away.
*/
function kbaNumber(value) {
	const digits = clean(value);
	return digits !== null && /^\d{5,6}$/.test(digits) ? digits : null;
}
/** The facts, or null when there are none worth a section: no facts, no explainer (§4). */
function rimFactsOf(product) {
	const facts = product?.facts ?? null;
	if (facts === null || typeof facts !== "object") return null;
	return rimTokens(facts).length > 0 ? facts : null;
}
/** The word order of `hier …` in the diameter sentence: `19 Zoll`, never `19 Zoll Zoll`. */
function inches(diameter) {
	return /zoll/i.test(diameter) ? diameter : `${diameter}${NBSP}Zoll`;
}
/**
* The sentence for the approval mark. It says what the number identifies and that the car must
* be named in the approval, with its Auflagen — never whether the wheel may go on this car.
*/
function kbaSentence(kba) {
	return `Die KBA-Nummer ${kba} auf dem Rad ist das Genehmigungszeichen der ${kba.length === 5 ? "Allgemeinen Betriebserlaubnis (ABE)" : "Teiletypgenehmigung (TTG)"}, die das Kraftfahrt-Bundesamt für genau diesen Radtyp erteilt hat; ob du das Rad an deinem Auto fahren darfst, hängt davon ab, ob die ${kba.length === 5 ? "ABE" : "TTG"} dein Fahrzeug nennt – mit den Auflagen, die sie dafür stellt.`;
}
/**
* The token row, in the order the values are read off a wheel: `8,5J` · `19` · `ET 45` ·
* `LK 5 × 112` · `MLB 66,6 mm` · `KBA 53810`. A fact the server did not send drops its token.
*/
function rimTokens(facts) {
	const out = [];
	const width = clean(facts.width);
	const diameter = clean(facts.diameter);
	const et = clean(facts.et);
	const bolt = clean(facts.boltPattern);
	const bore = clean(facts.centreBore);
	const kba = kbaNumber(facts.kba);
	if (width !== null) out.push({
		key: "width",
		text: width,
		term: "Felgenbreite",
		sentence: `Die Felgenbreite ist der Abstand zwischen den Innenseiten der beiden Felgenhörner in Zoll – hier ${width}; das „J“ bezeichnet die Form des Felgenhorns, nicht die Breite.`
	});
	if (diameter !== null) out.push({
		key: "diameter",
		text: diameter,
		term: "Felgendurchmesser",
		sentence: `Der Felgendurchmesser – hier ${inches(diameter)} – wird am Wulstsitz gemessen, dort, wo der Reifen aufliegt, nicht am Felgenhorn.`
	});
	if (et !== null) out.push({
		key: "et",
		text: et,
		term: "Einpresstiefe (ET)",
		sentence: `Die Einpresstiefe ist der Abstand in Millimetern von der Felgenmitte bis zur Anlagefläche des Rades an der Nabe – hier ${et}; je kleiner die ET, desto weiter steht das Rad nach außen.`
	});
	if (bolt !== null) out.push({
		key: "lk",
		text: `LK${NBSP}${bolt}`,
		term: "Lochkreis",
		sentence: `Der Lochkreis ist der Durchmesser des Kreises durch die Mitten der Schraubenlöcher und wird mit der Lochzahl angegeben – hier ${bolt}.`
	});
	if (bore !== null) out.push({
		key: "mlb",
		text: `MLB${NBSP}${bore}`,
		term: "Mittenlochbohrung",
		sentence: `Die Mittenlochbohrung – hier ${bore} – ist die Öffnung in der Radmitte, mit der das Rad auf der Nabe zentriert wird; ist sie größer als die Nabe, gleicht ein Zentrierring das aus.`
	});
	if (kba !== null) out.push({
		key: "kba",
		text: `KBA${NBSP}${kba}`,
		term: "KBA-Nummer",
		sentence: kbaSentence(kba)
	});
	return out;
}
function etSide(et) {
	const match = /([−–-])?\s*(\d+(?:[.,]\d+)?)/.exec(et ?? "");
	if (match === null || match[2] === void 0) return null;
	const magnitude = Number(match[2].replace(",", "."));
	if (!Number.isFinite(magnitude)) return null;
	if (magnitude === 0) return "plane";
	return match[1] === void 0 ? "outboard" : "inboard";
}
/**
* The shadow-free `bare` frame when the pipeline wrote one (it shares the square frame's geometry,
* so the square frame's anchors apply to it), else the square frame itself. Without measured
* anchors there is nothing to point at, and the explainer shows the cross-section only (§4).
*/
function photoFrame(manifest) {
	if (manifest === null || manifest === void 0) return null;
	const image = manifest.bare ?? manifest;
	const anchors = manifest.bare?.anchors ?? manifest.anchors;
	if (anchors === void 0 || !finitePoint(anchors.centre)) return null;
	return {
		image,
		anchors,
		stamp: kbaNumber(manifest.stamp)
	};
}
function finitePoint(p) {
	return p !== void 0 && Number.isFinite(p.x) && Number.isFinite(p.y);
}
/**
* The shape that marks a feature on the photograph, in the frame's own pixels (the overlay's
* viewBox is the frame's width × height, so a shape lands where the anchor was measured):
*
* - Lochkreis: a dashed circle through the bolt-hole centres (`pcd`);
* - Mittenlochbohrung: the cap that covers it (`bore`) — the bore itself is behind the cap;
* - KBA: a box around the stamp (`kba`), a little larger than the stamp so it frames it, and only
*   when the stamp on the photograph is the number the token explains;
* - Felgendurchmesser: a vertical dimension line at the bead seat (`bead`);
* - Felgenbreite: a dimension across the barrel between the Felgenhörner, where the photograph shows it
*   (`flanges`).
*
* The ET has no feature a front view shows: null — the cross-section explains it. So does any value
* whose anchor was not measured.
*/
function photoShape(key, frame, kba = null) {
	if (frame === null) return null;
	const { width: w, height: h } = frame.image;
	const a = frame.anchors;
	if (key === "lk" && a.pcd !== void 0 && circleOk(a.pcd)) return {
		key,
		kind: "circle",
		dashed: true,
		cx: a.pcd.x * w,
		cy: a.pcd.y * h,
		r: a.pcd.r * w,
		label: "Lochkreis"
	};
	if (key === "mlb" && a.bore !== void 0 && circleOk(a.bore)) return {
		key,
		kind: "circle",
		dashed: false,
		cx: a.bore.x * w,
		cy: a.bore.y * h,
		r: a.bore.r * w,
		label: "hinter der Nabenkappe"
	};
	if (key === "diameter" && a.bead !== void 0 && finitePoint(a.bead) && Number.isFinite(a.bead.h) && a.bead.h > 0) {
		const half = a.bead.h * h / 2;
		return {
			key,
			kind: "line",
			x1: a.bead.x * w,
			y1: a.bead.y * h - half,
			x2: a.bead.x * w,
			y2: a.bead.y * h + half,
			label: "am Wulstsitz"
		};
	}
	if (key === "width" && a.flanges !== void 0 && finitePoint(a.flanges) && Number.isFinite(a.flanges.w) && a.flanges.w > 0) {
		const half = a.flanges.w * w / 2;
		return {
			key,
			kind: "line",
			x1: a.flanges.x * w - half,
			y1: a.flanges.y * h,
			x2: a.flanges.x * w + half,
			y2: a.flanges.y * h,
			label: "Felgenbreite"
		};
	}
	if (key === "kba" && a.kba !== void 0 && kba !== null && frame.stamp === kba && boxOk(a.kba)) {
		const pad = a.kba.h * h / 2;
		const width = a.kba.w * w + 2 * pad;
		const height = a.kba.h * h + 2 * pad;
		return {
			key,
			kind: "rect",
			x: a.kba.x * w - width / 2,
			y: a.kba.y * h - height / 2,
			width,
			height,
			label: `KBA${NBSP}${kba}`
		};
	}
	return null;
}
function circleOk(c) {
	return finitePoint(c) && Number.isFinite(c.r) && c.r > 0;
}
function boxOk(b) {
	return finitePoint(b) && Number.isFinite(b.w) && Number.isFinite(b.h) && b.w > 0 && b.h > 0;
}
/**
* Half the length of a dimension line's end ticks, in the frame's pixels: 2 % of the frame at most and
* never more than 30 % of the line, so a short span reads as a dimension rather than as a letter.
*/
function dimensionTick(shape, frameWidth) {
	const length = Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1);
	return Math.min(frameWidth * .02, length * .3);
}
/** Where the shape's label sits: centred under the shape, as fractions of the frame. */
function photoLabel(shape, frame) {
	const { width: w, height: h } = frame.image;
	if (shape.kind === "circle") return {
		text: shape.label,
		x: shape.cx / w,
		y: (shape.cy + shape.r) / h
	};
	if (shape.kind === "line") return shape.x1 === shape.x2 ? {
		text: shape.label,
		x: shape.x1 / w,
		y: (shape.y1 + .72 * (shape.y2 - shape.y1)) / h
	} : {
		text: shape.label,
		x: Math.min((shape.x1 + shape.x2) / 2 / w, .86),
		y: (shape.y1 + dimensionTick(shape, w)) / h
	};
	return {
		text: shape.label,
		x: (shape.x + shape.width / 2) / w,
		y: (shape.y + shape.height) / h
	};
}
/**
* The line under the photograph: what is marked, or where to look instead.
*
* `etDrawn` is the cross-section's own answer (`RimCode`'s `showEt`): it draws the ET dimension for
* a positive ET only. For any other ET the line may not send the reader to a dimension that is not
* there, so it says only that the photograph does not show it (CLAUDE.md §2 — silent, never
* confidently wrong). The Felgenbreite, the Felgendurchmesser, the Lochkreis and the
* Mittenlochbohrung are always drawn, so their lines point at the drawing unconditionally.
*/
function photoHint(key, marked, etDrawn = true) {
	switch (key) {
		case "width": return marked ? "Markiert: das Felgenbett zwischen den beiden Felgenhörnern – rechts, wo das Rad schräg steht." : "Auf dem Foto nicht zu sehen – die Schnittzeichnung zeigt die Felgenbreite.";
		case "diameter": return marked ? "Markiert: der Durchmesser am Wulstsitz, knapp innerhalb des Felgenhorns." : "Auf dem Foto nicht zu sehen – die Schnittzeichnung zeigt den Felgendurchmesser.";
		case "et": return etDrawn ? "Auf dem Foto nicht zu sehen – die Schnittzeichnung zeigt die Einpresstiefe." : "Auf dem Foto nicht zu sehen.";
		case "lk": return marked ? "Gestrichelt: der Kreis durch die Mitten der Schraubenlöcher." : "Auf dem Foto nicht markiert – die Schnittzeichnung zeigt den Lochkreis.";
		case "mlb": return marked ? "Markiert: die Nabenkappe – die Mittenlochbohrung liegt dahinter." : "Auf dem Foto nicht markiert – die Schnittzeichnung zeigt die Mittenlochbohrung.";
		case "kba": return marked ? "Markiert: die KBA-Nummer auf dem Rad." : "Auf dem Foto nicht markiert – die KBA-Nummer steht auf dem Rad selbst.";
	}
}
/** The cross-section's feature for a token; the KBA number has none. */
function schematicKey(key) {
	return key === "kba" ? null : key;
}
//#endregion
//#region resources/js/Components/Home/RimCodePhoto.vue?vue&type=script&setup=true&lang.ts
var RimCodePhoto_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "RimCodePhoto",
	__ssrInlineRender: true,
	props: {
		frame: {},
		active: {},
		kba: { default: null },
		showEt: {
			type: Boolean,
			default: true
		},
		alt: {},
		credit: { default: null },
		sizes: { default: "100vw" }
	},
	setup(__props) {
		/**
		* The photograph of the explainer (ACCURACY.md §5): the hero wheel's shadow-free front view, and
		* over it an SVG in the picture's own coordinate box (its viewBox is the frame's pixel size), so a
		* shape drawn from a measured anchor lands exactly where the anchor was measured, at any width.
		*
		* Only what the photograph shows is marked: the Felgendurchmesser at the bead seat and the Maulweite
		* across the barrel, as dimension lines; the Lochkreis as a dashed circle through the bolt-hole
		* centres; the cap that covers the Mittenlochbohrung (labelled *hinter der Nabenkappe*); and the KBA
		* stamp in a box. For the ET the line under the photograph says that the cross-section shows it.
		* Nothing is marked without a measured anchor.
		*/
		const props = __props;
		const shape = (0, vue_exports.computed)(() => photoShape(props.active, props.frame, props.kba));
		const label = (0, vue_exports.computed)(() => shape.value === null ? null : photoLabel(shape.value, props.frame));
		const hint = (0, vue_exports.computed)(() => photoHint(props.active, shape.value !== null, props.showEt));
		const dimension = (0, vue_exports.computed)(() => {
			const s = shape.value;
			if (s === null || s.kind !== "line") return "";
			const t = dimensionTick(s, props.frame.image.width);
			const vertical = s.x1 === s.x2;
			const tick = (x, y) => vertical ? `M${x - t} ${y}H${x + t}` : `M${x} ${y - t}V${y + t}`;
			return `M${s.x1} ${s.y1}L${s.x2} ${s.y2}${tick(s.x1, s.y1)}${tick(s.x2, s.y2)}`;
		});
		const box = (0, vue_exports.computed)(() => `0 0 ${props.frame.image.width} ${props.frame.image.height}`);
		const ratio = (0, vue_exports.computed)(() => `${props.frame.image.width} / ${props.frame.image.height}`);
		const labelStyle = (0, vue_exports.computed)(() => label.value === null ? void 0 : {
			left: `${(label.value.x * 100).toFixed(2)}%`,
			top: `${(label.value.y * 100).toFixed(2)}%`
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<figure${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "rc-photo" }, _attrs))} data-v-943745c3><div class="rc-photo__frame" style="${(0, server_renderer_exports.ssrRenderStyle)({ aspectRatio: ratio.value })}" data-v-943745c3>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
				class: "rc-photo__picture",
				image: __props.frame.image,
				alt: __props.alt,
				sizes: __props.sizes
			}, null, _parent));
			_push(`<svg class="rc-photo__overlay"${(0, server_renderer_exports.ssrRenderAttr)("viewBox", box.value)} preserveAspectRatio="none" aria-hidden="true" focusable="false" data-v-943745c3>`);
			if (shape.value) {
				_push(`<g class="${(0, server_renderer_exports.ssrRenderClass)([{ "rc-photo__shape--dashed": shape.value.kind === "circle" && shape.value.dashed }, "rc-photo__casing"])}" data-v-943745c3>`);
				if (shape.value.kind === "circle") _push(`<circle${(0, server_renderer_exports.ssrRenderAttr)("cx", shape.value.cx)}${(0, server_renderer_exports.ssrRenderAttr)("cy", shape.value.cy)}${(0, server_renderer_exports.ssrRenderAttr)("r", shape.value.r)} data-v-943745c3></circle>`);
				else if (shape.value.kind === "rect") _push(`<rect${(0, server_renderer_exports.ssrRenderAttr)("x", shape.value.x)}${(0, server_renderer_exports.ssrRenderAttr)("y", shape.value.y)}${(0, server_renderer_exports.ssrRenderAttr)("width", shape.value.width)}${(0, server_renderer_exports.ssrRenderAttr)("height", shape.value.height)} data-v-943745c3></rect>`);
				else _push(`<path${(0, server_renderer_exports.ssrRenderAttr)("d", dimension.value)} data-v-943745c3></path>`);
				_push(`</g>`);
			} else _push(`<!---->`);
			if (shape.value?.kind === "circle") _push(`<circle class="${(0, server_renderer_exports.ssrRenderClass)([{ "rc-photo__shape--dashed": shape.value.dashed }, "rc-photo__shape"])}"${(0, server_renderer_exports.ssrRenderAttr)("data-shape", shape.value.key)}${(0, server_renderer_exports.ssrRenderAttr)("cx", shape.value.cx)}${(0, server_renderer_exports.ssrRenderAttr)("cy", shape.value.cy)}${(0, server_renderer_exports.ssrRenderAttr)("r", shape.value.r)} data-v-943745c3></circle>`);
			else if (shape.value?.kind === "rect") _push(`<rect class="rc-photo__shape"${(0, server_renderer_exports.ssrRenderAttr)("data-shape", shape.value.key)}${(0, server_renderer_exports.ssrRenderAttr)("x", shape.value.x)}${(0, server_renderer_exports.ssrRenderAttr)("y", shape.value.y)}${(0, server_renderer_exports.ssrRenderAttr)("width", shape.value.width)}${(0, server_renderer_exports.ssrRenderAttr)("height", shape.value.height)} data-v-943745c3></rect>`);
			else if (shape.value?.kind === "line") _push(`<path class="rc-photo__shape"${(0, server_renderer_exports.ssrRenderAttr)("data-shape", shape.value.key)}${(0, server_renderer_exports.ssrRenderAttr)("d", dimension.value)} data-v-943745c3></path>`);
			else _push(`<!---->`);
			_push(`</svg>`);
			if (label.value) {
				_push(`<span class="rc-photo__label small num" style="${(0, server_renderer_exports.ssrRenderStyle)(labelStyle.value)}" aria-hidden="true" data-v-943745c3>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: label.value.text }, null, _parent));
				_push(`</span>`);
			} else _push(`<!---->`);
			_push(`</div><figcaption class="rc-photo__caption" data-v-943745c3><span class="small muted rc-photo__hint" data-v-943745c3>${(0, server_renderer_exports.ssrInterpolate)(hint.value)}</span>`);
			if (__props.credit) _push(`<span class="micro quiet" data-v-943745c3>${(0, server_renderer_exports.ssrInterpolate)(__props.credit)}</span>`);
			else _push(`<!---->`);
			_push(`</figcaption></figure>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/RimCodePhoto.vue
var _sfc_setup$3 = RimCodePhoto_vue_vue_type_script_setup_true_lang_default.setup;
RimCodePhoto_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/RimCodePhoto.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var RimCodePhoto_default = /*#__PURE__*/ _plugin_vue_export_helper_default(RimCodePhoto_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-943745c3"]]);
//#endregion
//#region resources/js/Components/Home/rimCodeSchematic.ts
/** Every coordinate the drawing uses; the component and the tests read the same numbers. */
var SCHEMATIC = {
	width: 360,
	height: 294,
	/** The inner face of the flange on the vehicle side. */
	xFlangeIn: 98,
	/** The inner face of the flange on the outside. */
	xFlangeOut: 258,
	/** The rim centre plane: exactly halfway between the two inner faces. */
	xCentre: 178,
	/** The Anlagefläche, drawn for a positive ET: outboard of the centre plane. */
	xAnlage: 212,
	/** The hub pad's outboard face. */
	xPadOut: 226,
	yLip: 46,
	yBeadSeat: 74,
	/** Each hump — the ridge at the well side of a bead seat: its centre and half its width. */
	xHumpIn: 131,
	xHumpOut: 225,
	humpHalf: 3,
	/** The control point of the hump's curve; a quadratic reaches half as far, so the ridge peaks at 70. */
	yHumpControl: 66,
	yHumpPeak: 70,
	yUnderside: 80,
	yWell: 106,
	yPadTop: 174,
	/** The bolt hole: its centre on the Lochkreis radius, and its two walls. */
	yBolt: 230,
	yBoltTop: 224,
	yBoltBottom: 236,
	/** The edge of the Mittenlochbohrung. */
	yBore: 260,
	/** The wheel axis (Radachse). */
	yAxis: 286
};
var S = SCHEMATIC;
/**
* The section's outline, one closed path: the flange on the vehicle side, its bead seat with the
* hump, the barrel, the well (Tiefbett), the outer bead seat and flange; underneath, the barrel's
* inside, the disc (Radschüssel) down to the hub pad whose inboard face is the Anlagefläche, cut
* through the bolt hole.
*
* Both humps are drawn and both are labelled *Hump*. The drawing names the feature, never a rim's
* hump designation: which designation a wheel carries is the Gutachten's statement about that wheel,
* and `wheel_configs.hump` holds the same constant for every demo row, so no such designation may be
* read off this drawing (CLAUDE.md §2).
*/
var PROFILE = [
	`M ${S.xFlangeIn} ${S.yBeadSeat}`,
	`L ${S.xFlangeIn} 54 Q ${S.xFlangeIn} ${S.yLip} 90 ${S.yLip} L 84 ${S.yLip} L 84 52 Q 92 52 92 60 L 92 ${S.yUnderside}`,
	`L 157.6 ${S.yUnderside} L 167.6 112 L 208.4 112 L 218.4 ${S.yUnderside} L 244 ${S.yUnderside}`,
	`L ${S.xAnlage} ${S.yPadTop} L ${S.xAnlage} ${S.yBoltTop} L ${S.xPadOut} ${S.yBoltTop} L ${S.xPadOut} 188`,
	`L 264 90 L 264 60 Q 264 52 272 52 L 272 ${S.yLip} L 266 ${S.yLip} Q ${S.xFlangeOut} ${S.yLip} ${S.xFlangeOut} 54 L ${S.xFlangeOut} ${S.yBeadSeat}`,
	`L ${S.xHumpOut + S.humpHalf} ${S.yBeadSeat} Q ${S.xHumpOut} ${S.yHumpControl} ${S.xHumpOut - S.humpHalf} ${S.yBeadSeat}`,
	`L 214 ${S.yBeadSeat} L 204 ${S.yWell} L 172 ${S.yWell} L 162 ${S.yBeadSeat}`,
	`L ${S.xHumpIn + S.humpHalf} ${S.yBeadSeat} Q ${S.xHumpIn} ${S.yHumpControl} ${S.xHumpIn - S.humpHalf} ${S.yBeadSeat} Z`
].join(" ");
/** The hub pad below the bolt hole, down to the edge of the Mittenlochbohrung (a separate island in the cut). */
var PAD_BELOW = `M ${S.xAnlage} ${S.yBoltBottom} L ${S.xPadOut} ${S.yBoltBottom} L ${S.xPadOut} ${S.yBore} L ${S.xAnlage} ${S.yBore} Z`;
/** How far short of the feature a leader stops, so the line points at it without touching it. */
var LEAD_GAP = 3;
/** Oblique tick marks (Schrägstriche) at both ends of a dimension line, no arrowheads. */
function ticks(x1, y1, x2, y2) {
	const t = 4;
	return `M ${x1 - t} ${y1 + t} L ${x1 + t} ${y1 - t} M ${x2 - t} ${y2 + t} L ${x2 + t} ${y2 - t}`;
}
var DIMENSIONS = {
	width: {
		key: "width",
		ext: `M ${S.xFlangeIn} 50 L ${S.xFlangeIn} 28 M ${S.xFlangeOut} 50 L ${S.xFlangeOut} 28`,
		line: `M ${S.xFlangeIn} 32 L ${S.xFlangeOut} 32`,
		ticks: ticks(S.xFlangeIn, 32, S.xFlangeOut, 32),
		label: {
			text: "Felgenbreite",
			x: S.xCentre,
			y: 24,
			anchor: "middle"
		},
		faces: `M ${S.xFlangeIn} 54 L ${S.xFlangeIn} ${S.yBeadSeat} M ${S.xFlangeOut} 54 L ${S.xFlangeOut} ${S.yBeadSeat}`
	},
	diameter: {
		key: "diameter",
		ext: `M 88 ${S.yBeadSeat} L 26 ${S.yBeadSeat}`,
		line: `M 30 ${S.yBeadSeat} L 30 ${S.yAxis}`,
		ticks: ticks(30, S.yBeadSeat, 30, S.yAxis),
		label: {
			text: "½ Felgendurchmesser",
			x: 22,
			y: (S.yBeadSeat + S.yAxis) / 2,
			anchor: "middle",
			rotate: -90
		},
		faces: `M ${S.xFlangeIn} ${S.yBeadSeat} L 128 ${S.yBeadSeat} M 228 ${S.yBeadSeat} L ${S.xFlangeOut} ${S.yBeadSeat}`
	},
	et: {
		key: "et",
		ext: `M ${S.xAnlage} ${S.yPadTop - 4} L ${S.xAnlage} 152`,
		line: `M ${S.xCentre} 158 L ${S.xAnlage} 158`,
		ticks: ticks(S.xCentre, 158, S.xAnlage, 158),
		label: {
			text: "Einpresstiefe (ET)",
			x: S.xCentre - 6,
			y: 162,
			anchor: "end"
		},
		faces: `M ${S.xAnlage} ${S.yPadTop} L ${S.xAnlage} ${S.yBoltTop} M ${S.xAnlage} ${S.yBoltBottom} L ${S.xAnlage} ${S.yBore}`
	},
	lk: {
		key: "lk",
		ext: `M 234 ${S.yBolt} L 250 ${S.yBolt}`,
		line: `M 246 ${S.yBolt} L 246 ${S.yAxis}`,
		ticks: ticks(246, S.yBolt, 246, S.yAxis),
		label: {
			text: "½ Lochkreis",
			x: 252,
			y: 250,
			anchor: "start"
		},
		faces: `M ${S.xAnlage} ${S.yBoltTop} L ${S.xPadOut} ${S.yBoltTop} M ${S.xAnlage} ${S.yBoltBottom} L ${S.xPadOut} ${S.yBoltBottom}`
	},
	mlb: {
		key: "mlb",
		ext: `M ${S.xAnlage - 2} ${S.yBore} L 198 ${S.yBore}`,
		line: `M 202 ${S.yBore} L 202 ${S.yAxis}`,
		ticks: ticks(202, S.yBore, 202, S.yAxis),
		label: {
			text: "½ Mittenlochbohrung",
			x: 196,
			y: 278,
			anchor: "end"
		},
		faces: `M ${S.xAnlage} ${S.yBore} L ${S.xPadOut} ${S.yBore}`
	}
};
/** The order the dimensions are drawn in (and read by assistive technology in the description). */
var DIMENSION_ORDER = [
	"width",
	"diameter",
	"et",
	"lk",
	"mlb"
];
var PARTS = [
	{
		id: "flange-in",
		label: {
			text: "Felgenhorn",
			x: 82,
			y: 40,
			anchor: "end"
		},
		for: ["width"]
	},
	{
		id: "flange-out",
		label: {
			text: "Felgenhorn",
			x: 274,
			y: 40,
			anchor: "start"
		},
		for: ["width"]
	},
	{
		id: "bead-seat",
		label: {
			text: "Wulstsitz",
			x: 102,
			y: 48,
			anchor: "start"
		},
		leader: `M 106 52 L 106 ${S.yBeadSeat - LEAD_GAP}`,
		for: ["diameter"]
	},
	{
		id: "well",
		label: {
			text: "Tiefbett",
			x: 186,
			y: 48,
			anchor: "start"
		},
		leader: `M 190 52 L 190 ${S.yWell - LEAD_GAP}`,
		for: []
	},
	{
		id: "hump-in",
		label: {
			text: "Hump",
			x: S.xHumpIn,
			y: 64,
			anchor: "middle"
		},
		for: []
	},
	{
		id: "hump-out",
		label: {
			text: "Hump",
			x: S.xHumpOut,
			y: 64,
			anchor: "middle"
		},
		for: []
	},
	{
		id: "centre-plane",
		label: {
			text: "Felgenmitte",
			x: 148,
			y: 182,
			anchor: "end"
		},
		leader: `M 152 178 L ${S.xCentre - LEAD_GAP} 178`,
		for: ["et"]
	},
	{
		id: "anlage",
		label: {
			text: "Anlagefläche",
			x: 180,
			y: 212,
			anchor: "end"
		},
		leader: `M 184 208 L ${S.xAnlage - LEAD_GAP} 208`,
		for: ["et"]
	},
	{
		id: "disc",
		label: {
			text: "Radschüssel",
			x: 272,
			y: 144,
			anchor: "start"
		},
		leader: "M 268 140 L 248 140",
		for: []
	},
	{
		id: "axis",
		label: {
			text: "Radachse",
			x: 276,
			y: 278,
			anchor: "start"
		},
		for: []
	}
];
/**
* The rim centre plane: a dashed line through the whole section, past the ET dimension and far enough
* below it for the *Felgenmitte* leader to end on the line rather than on its tip.
*/
var CENTRE_PLANE = {
	x: S.xCentre,
	y1: 38,
	y2: 186
};
/** The bolt hole's own centre line, and the wheel axis — both dash-dot, as a drawing office draws an axis. */
var BOLT_AXIS = `M 204 ${S.yBolt} L 234 ${S.yBolt}`;
var WHEEL_AXIS = `M 8 ${S.yAxis} L 352 ${S.yAxis}`;
/** `transform` for a rotated label. */
function labelTransform(label) {
	return label.rotate === void 0 ? void 0 : `rotate(${label.rotate} ${label.x} ${label.y})`;
}
//#endregion
//#region resources/js/Components/Home/RimCodeSchematic.vue?vue&type=script&setup=true&lang.ts
var RimCodeSchematic_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "RimCodeSchematic",
	__ssrInlineRender: true,
	props: {
		active: { default: null },
		showEt: {
			type: Boolean,
			default: true
		}
	},
	setup(__props) {
		/**
		* The cross-section of a rim, schematic and not to scale (ACCURACY.md §5): both flanges, the bead
		* seats with their humps, the well, the disc, the hub pad and its Anlagefläche, the rim centre plane
		* as a dashed line exactly halfway between the flange inner faces, and the wheel axis. Five
		* dimensions sit on it — Felgenbreite, ½ Felgendurchmesser, Einpresstiefe (ET), ½ Lochkreis and
		* ½ Mittenlochbohrung — in the tertiary ink; the one the visitor chose is traced in the selection
		* colour, with the faces it is taken from, and its label and reference parts in the full ink.
		*
		* The geometry lives in `rimCodeSchematic.ts` and is fixed: the drawing explains the terms, it does
		* not measure this wheel. The ET dimension is drawn for a positive ET only (the Anlagefläche
		* outboard of the centre plane); for any other value the drawing shows no ET at all rather than a
		* direction it cannot vouch for (CLAUDE.md §2).
		*
		* The labels are SVG text in `--fs-small`: set at its own width of 360 px the drawing prints them at
		* 14 px, and because they scale with the lines, no label can ever run into another one.
		*
		* Every named part either sits on its feature (the flanges, the two humps) or carries one thin
		* leader to it, all of them in the same line — `rc-sch__leader`, the tertiary ink at 1 px.
		*/
		const props = __props;
		const hatch = `rc-hatch-${(0, vue_exports.useId)()}`;
		const dimensions = (0, vue_exports.computed)(() => DIMENSION_ORDER.filter((key) => key !== "et" || props.showEt).map((key) => DIMENSIONS[key]));
		const traced = (0, vue_exports.computed)(() => props.active !== null && dimensions.value.some((d) => d.key === props.active) ? props.active : null);
		const TERMS = {
			width: "die Felgenbreite",
			diameter: "der Felgendurchmesser",
			et: "die Einpresstiefe",
			lk: "der Lochkreis",
			mlb: "die Mittenlochbohrung"
		};
		const description = (0, vue_exports.computed)(() => {
			return `Schnittzeichnung einer Felge, schematisch und nicht maßstäblich; links liegt die Fahrzeugmitte, rechts die Außenseite. Die Felgenbreite reicht von Innenseite zu Innenseite der Felgenhörner, der Felgendurchmesser wird am Wulstsitz gemessen${props.showEt ? ", die Einpresstiefe reicht von der Felgenmitte nach außen bis zur Anlagefläche an der Nabe" : ""}.${traced.value === null ? "" : ` Markiert: ${TERMS[traced.value]}.`}`;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<figure${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "rc-sch" }, _attrs))} data-v-d7b84e81><div class="rc-sch__sides micro muted" data-v-d7b84e81><span data-side="inside" data-v-d7b84e81>← zur Fahrzeugmitte</span><span data-side="outside" data-v-d7b84e81>nach außen (Kotflügel) →</span></div><svg class="rc-sch__svg"${(0, server_renderer_exports.ssrRenderAttr)("viewBox", `0 0 ${(0, vue_exports.unref)(SCHEMATIC).width} ${(0, vue_exports.unref)(SCHEMATIC).height}`)}${(0, server_renderer_exports.ssrRenderAttr)("width", (0, vue_exports.unref)(SCHEMATIC).width)}${(0, server_renderer_exports.ssrRenderAttr)("height", (0, vue_exports.unref)(SCHEMATIC).height)} role="img"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", description.value)} focusable="false" data-v-d7b84e81><defs data-v-d7b84e81><pattern${(0, server_renderer_exports.ssrRenderAttr)("id", hatch)} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)" data-v-d7b84e81><path class="rc-sch__hatch" d="M 0 0 L 0 6" data-v-d7b84e81></path></pattern></defs><path class="rc-sch__axis" data-part="axis"${(0, server_renderer_exports.ssrRenderAttr)("d", (0, vue_exports.unref)(WHEEL_AXIS))} data-v-d7b84e81></path><path class="${(0, server_renderer_exports.ssrRenderClass)([{ "is-active": traced.value === "lk" }, "rc-sch__axis"])}" data-part="bolt-axis"${(0, server_renderer_exports.ssrRenderAttr)("d", (0, vue_exports.unref)(BOLT_AXIS))} data-v-d7b84e81></path><path class="rc-sch__cut" data-part="profile"${(0, server_renderer_exports.ssrRenderAttr)("d", (0, vue_exports.unref)(PROFILE))}${(0, server_renderer_exports.ssrRenderAttr)("fill", `url(#${hatch})`)} data-v-d7b84e81></path><path class="rc-sch__cut" data-part="pad-below"${(0, server_renderer_exports.ssrRenderAttr)("d", (0, vue_exports.unref)(PAD_BELOW))}${(0, server_renderer_exports.ssrRenderAttr)("fill", `url(#${hatch})`)} data-v-d7b84e81></path><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)([(0, vue_exports.unref)(SCHEMATIC).xFlangeIn, (0, vue_exports.unref)(SCHEMATIC).xFlangeOut], (x) => {
				_push(`<line class="rc-sch__ref" data-part="flange-face"${(0, server_renderer_exports.ssrRenderAttr)("x1", x)}${(0, server_renderer_exports.ssrRenderAttr)("y1", 54)}${(0, server_renderer_exports.ssrRenderAttr)("x2", x)}${(0, server_renderer_exports.ssrRenderAttr)("y2", (0, vue_exports.unref)(SCHEMATIC).yBeadSeat)} data-v-d7b84e81></line>`);
			});
			_push(`<!--]--><line class="rc-sch__ref" data-part="anlage"${(0, server_renderer_exports.ssrRenderAttr)("x1", (0, vue_exports.unref)(SCHEMATIC).xAnlage)}${(0, server_renderer_exports.ssrRenderAttr)("y1", (0, vue_exports.unref)(SCHEMATIC).yPadTop)}${(0, server_renderer_exports.ssrRenderAttr)("x2", (0, vue_exports.unref)(SCHEMATIC).xAnlage)}${(0, server_renderer_exports.ssrRenderAttr)("y2", (0, vue_exports.unref)(SCHEMATIC).yBore)} data-v-d7b84e81></line><line class="${(0, server_renderer_exports.ssrRenderClass)([{ "is-active": traced.value === "et" }, "rc-sch__centre"])}" data-part="centre-plane"${(0, server_renderer_exports.ssrRenderAttr)("x1", (0, vue_exports.unref)(CENTRE_PLANE).x)}${(0, server_renderer_exports.ssrRenderAttr)("y1", (0, vue_exports.unref)(CENTRE_PLANE).y1)}${(0, server_renderer_exports.ssrRenderAttr)("x2", (0, vue_exports.unref)(CENTRE_PLANE).x)}${(0, server_renderer_exports.ssrRenderAttr)("y2", (0, vue_exports.unref)(CENTRE_PLANE).y2)} data-v-d7b84e81></line><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(dimensions.value, (dim) => {
				_push(`<g class="${(0, server_renderer_exports.ssrRenderClass)([{ "is-active": traced.value === dim.key }, "rc-sch__dim"])}"${(0, server_renderer_exports.ssrRenderAttr)("data-dim", dim.key)} data-v-d7b84e81><path class="rc-sch__ext"${(0, server_renderer_exports.ssrRenderAttr)("d", dim.ext)} data-v-d7b84e81></path><path class="rc-sch__line" data-role="line"${(0, server_renderer_exports.ssrRenderAttr)("d", dim.line)} data-v-d7b84e81></path><path class="rc-sch__line"${(0, server_renderer_exports.ssrRenderAttr)("d", dim.ticks)} data-v-d7b84e81></path>`);
				if (traced.value === dim.key) _push(`<path class="rc-sch__face" data-role="faces"${(0, server_renderer_exports.ssrRenderAttr)("d", dim.faces)} data-v-d7b84e81></path>`);
				else _push(`<!---->`);
				_push(`<text class="rc-sch__label num"${(0, server_renderer_exports.ssrRenderAttr)("x", dim.label.x)}${(0, server_renderer_exports.ssrRenderAttr)("y", dim.label.y)}${(0, server_renderer_exports.ssrRenderAttr)("text-anchor", dim.label.anchor)}${(0, server_renderer_exports.ssrRenderAttr)("transform", (0, vue_exports.unref)(labelTransform)(dim.label))} data-v-d7b84e81>${(0, server_renderer_exports.ssrInterpolate)(dim.label.text)}</text></g>`);
			});
			_push(`<!--]--><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(PARTS), (part) => {
				_push(`<g class="${(0, server_renderer_exports.ssrRenderClass)([{ "is-active": traced.value !== null && part.for.includes(traced.value) }, "rc-sch__part"])}"${(0, server_renderer_exports.ssrRenderAttr)("data-part-label", part.id)} data-v-d7b84e81>`);
				if (part.leader) _push(`<path class="rc-sch__leader"${(0, server_renderer_exports.ssrRenderAttr)("d", part.leader)} data-v-d7b84e81></path>`);
				else _push(`<!---->`);
				_push(`<text class="rc-sch__label"${(0, server_renderer_exports.ssrRenderAttr)("x", part.label.x)}${(0, server_renderer_exports.ssrRenderAttr)("y", part.label.y)}${(0, server_renderer_exports.ssrRenderAttr)("text-anchor", part.label.anchor)} data-v-d7b84e81>${(0, server_renderer_exports.ssrInterpolate)(part.label.text)}</text></g>`);
			});
			_push(`<!--]--></svg><figcaption class="micro quiet rc-sch__caption" data-v-d7b84e81>Schnittzeichnung, schematisch, nicht maßstäblich.</figcaption></figure>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/RimCodeSchematic.vue
var _sfc_setup$2 = RimCodeSchematic_vue_vue_type_script_setup_true_lang_default.setup;
RimCodeSchematic_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/RimCodeSchematic.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var RimCodeSchematic_default = /*#__PURE__*/ _plugin_vue_export_helper_default(RimCodeSchematic_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-d7b84e81"]]);
//#endregion
//#region resources/js/Components/Home/RimCodeTeaser.vue?vue&type=script&setup=true&lang.ts
var RimCodeTeaser_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "RimCodeTeaser",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The way from the explainer to the calculator (ACCURACY.md D9): one card, one link. The whole
		* card is the target; the title is the link's name. It sits on the opposite tone of its section —
		* a band on the surface, the surface on a band — never with a border or a shadow.
		*/
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "rc-teaser" }, _attrs))} data-v-81a11568><div class="rc-teaser__body" data-v-81a11568><h3 class="h4 rc-teaser__title" data-v-81a11568>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/felgenrechner",
				class: "rc-teaser__link",
				prefetch: ""
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Größe vergleichen`);
					else return [(0, vue_exports.createTextVNode)("Größe vergleichen")];
				}),
				_: 1
			}, _parent));
			_push(`</h3><p class="body muted rc-teaser__text" data-v-81a11568>Abrollumfang und Tacho – für deine aktuelle und eine neue Größe gerechnet.</p></div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				class: "rc-teaser__icon",
				name: "arrow-right",
				size: 24
			}, null, _parent));
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/RimCodeTeaser.vue
var _sfc_setup$1 = RimCodeTeaser_vue_vue_type_script_setup_true_lang_default.setup;
RimCodeTeaser_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/RimCodeTeaser.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var RimCodeTeaser_default = /*#__PURE__*/ _plugin_vue_export_helper_default(RimCodeTeaser_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-81a11568"]]);
//#endregion
//#region resources/js/Components/Home/RimCode.vue?vue&type=script&setup=true&lang.ts
var RimCode_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "RimCode",
	__ssrInlineRender: true,
	props: {
		product: {},
		layout: { default: "desktop" }
	},
	setup(__props) {
		/**
		* *Was die Zahlen auf einer Felge bedeuten* — the body of H8 (ACCURACY.md §5, D9).
		*
		* The values of the hero wheel as they are written on a wheel — `8,5J` · `19` · `ET 45` ·
		* `LK 5 × 112` · `MLB 66,6 mm` · `KBA 53810` — each a toggle button. One is chosen at a time, the
		* first from the first paint (so the server's frame is the final one and nothing waits for
		* JavaScript). Choosing a value marks it on the photograph where a front view shows it, and on the
		* cross-section where a section shows it; one sentence says what it is. With a fine pointer,
		* hovering previews a value and leaving the row returns to the chosen one; a click chooses. The
		* arrow keys move between the values; Enter and Space choose, as on any button.
		*
		* The values are the server's (`hero.product.facts`, GermanFormat); nothing here formats a number.
		* Without measured anchors there is no photograph, only the cross-section (fail closed, §4).
		*
		* Layout by `layout`: `phone` keeps one column — the values as a row that scrolls sideways inside
		* the page margins, then the photograph, the sentence, the cross-section and the teaser; `desktop`
		* puts, from 1024, the values across the top, the sentence and the teaser on the left and the
		* photograph and the cross-section beside them.
		*/
		const props = __props;
		const facts = (0, vue_exports.computed)(() => rimFactsOf(props.product));
		const tokens = (0, vue_exports.computed)(() => facts.value === null ? [] : rimTokens(facts.value));
		const frame = (0, vue_exports.computed)(() => photoFrame(props.product?.imageManifest));
		const kba = (0, vue_exports.computed)(() => kbaNumber(facts.value?.kba));
		const showEt = (0, vue_exports.computed)(() => etSide(facts.value?.et) === "outboard");
		const chosen = (0, vue_exports.ref)(null);
		const previewed = (0, vue_exports.ref)(null);
		const has = (key) => key !== null && tokens.value.some((t) => t.key === key);
		/** The chosen value; the first until the visitor chooses (and again if the chosen one disappears). */
		const committed = (0, vue_exports.computed)(() => has(chosen.value) ? chosen.value : tokens.value[0]?.key ?? null);
		const shown = (0, vue_exports.computed)(() => has(previewed.value) ? previewed.value : committed.value);
		const shownToken = (0, vue_exports.computed)(() => tokens.value.find((t) => t.key === shown.value) ?? null);
		const onPhoto = (0, vue_exports.computed)(() => shown.value !== null && photoShape(shown.value, frame.value, kba.value) !== null);
		const traced = (0, vue_exports.computed)(() => {
			const key = shown.value === null || onPhoto.value ? null : schematicKey(shown.value);
			return key === "et" && !showEt.value ? null : key;
		});
		const finePointer = (0, vue_exports.ref)(false);
		(0, vue_exports.onMounted)(() => {
			finePointer.value = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;
		});
		(0, vue_exports.ref)(null);
		const alt = (0, vue_exports.computed)(() => {
			const name = [props.product?.brand, props.product?.name].filter(Boolean).join(" ");
			const finish = props.product?.finish ? ` in ${props.product.finish}` : "";
			return name === "" ? "Felge, Ansicht von vorn" : `${name}${finish}, Ansicht von vorn`;
		});
		const credit = (0, vue_exports.computed)(() => {
			const name = [props.product?.brand, props.product?.name].filter(Boolean).join(" ");
			const finish = props.product?.finish ? ` in ${props.product.finish}` : "";
			return `${name === "" ? "Das Foto" : `Foto: ${name}${finish}. Es`} zeigt das Design; die Werte gehören zu einer Ausführung davon.`;
		});
		const sizes = (0, vue_exports.computed)(() => props.layout === "phone" ? "calc(100vw - 40px)" : "(min-width: 1280px) 440px, (min-width: 1024px) 28vw, (min-width: 768px) 40vw, 100vw");
		return (_ctx, _push, _parent, _attrs) => {
			if (tokens.value.length && shownToken.value) {
				_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["rc", [`rc--${__props.layout}`, { "rc--no-photo": !frame.value }]] }, _attrs))} data-v-6ba9539c><div class="rc__tokens" role="group" aria-label="Werte der Felge" data-v-6ba9539c><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(tokens.value, (token, i) => {
					_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{ "is-shown": token.key === shown.value }, "chip rc-token"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", token.key === committed.value ? "true" : "false")}${(0, server_renderer_exports.ssrRenderAttr)("data-token", token.key)} data-v-6ba9539c><span class="visually-hidden" data-v-6ba9539c>${(0, server_renderer_exports.ssrInterpolate)(token.term)}: </span><span class="rc-token__value num" translate="no" data-v-6ba9539c>${(0, server_renderer_exports.ssrInterpolate)(token.text)}</span></button>`);
				});
				_push(`<!--]--></div>`);
				if (frame.value) _push((0, server_renderer_exports.ssrRenderComponent)(RimCodePhoto_default, {
					class: "rc__photo",
					frame: frame.value,
					active: shownToken.value.key,
					kba: kba.value,
					"show-et": showEt.value,
					alt: alt.value,
					credit: credit.value,
					sizes: sizes.value
				}, null, _parent));
				else _push(`<!---->`);
				_push(`<div class="rc__def" aria-live="polite" data-v-6ba9539c><p class="label rc__term" data-v-6ba9539c>${(0, server_renderer_exports.ssrInterpolate)(shownToken.value.term)}</p><p class="body-l rc__sentence" data-role="definition" data-v-6ba9539c>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: shownToken.value.sentence }, null, _parent));
				_push(`</p></div>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(RimCodeSchematic_default, {
					class: "rc__schematic",
					active: traced.value,
					"show-et": showEt.value
				}, null, _parent));
				_push((0, server_renderer_exports.ssrRenderComponent)(RimCodeTeaser_default, { class: "rc__teaser" }, null, _parent));
				_push(`</div>`);
			} else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Home/RimCode.vue
var _sfc_setup = RimCode_vue_vue_type_script_setup_true_lang_default.setup;
RimCode_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Home/RimCode.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var RimCode_default = /*#__PURE__*/ _plugin_vue_export_helper_default(RimCode_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-6ba9539c"]]);
//#endregion
//#region resources/js/Pages/Startseite/meta.ts
/**
* The homepage's title and description, shared by both documents: the phone document is what the
* search engines index (mobile-first), so it must say the same as the desktop one.
*/
var TITLE = "Felgen mit Gutachten für dein Auto";
var DESCRIPTION = "RIMIFY zeigt dir nur Felgen, deren Gutachten dein Fahrzeug ausdrücklich nennt – mit den zulässigen Reifengrößen und allen Auflagen.";
//#endregion
export { isTsn as A, ZERO_LABEL as C, cleanHsn as D, BrandWall_default as E, cleanTsn as O, HeroHelp_default as S, useRowMarker as T, companionScene as _, bandWheelAlt as a, heroScene as b, komplettrad_illustration_default as c, DESKTOP_PAIR_LAYOUT as d, HERO_SIZES_DESKTOP as f, PHONE_PAIR_LAYOUT as g, PHONE_LAYOUT as h, rimFactsOf as i, splitKeys as j, isHsn as k, DESKTOP_COMPANION as l, PHONE_COMPANION as m, TITLE as n, bandWheelCaption as o, HERO_SIZES_PHONE as p, RimCode_default as r, bandWheelStyle as s, DESCRIPTION as t, DESKTOP_LAYOUT as u, companionStyle as v, zeroSentence as w, rollStyle as x, frameStyle as y };
