import { c as vue_exports, n as head_default, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { r as useShared } from "./useShared-CY71KcPZ.js";
import { t as Icon_default } from "./Icon-Cd7fU8zT.js";
import { t as AppLayout_default } from "./AppLayout-CIg_X6Ij.js";
import { t as ProductPhoto_default } from "./ProductPhoto-DdGgOQm-.js";
//#endregion
//#region resources/js/Pages/Warenkorb/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		lines: {},
		totals: {}
	},
	setup(__props) {
		/**
		* The basket.
		*
		* Every line is re-priced and re-verified on the server at every render. A line that has stopped
		* being available or permitted is MARKED, never dropped, and a line with Auflagen carries them as
		* full sentences here — this is the last place to read them before money changes hands (R-15).
		*
		* One line layout for every width: from 900px the quantity and the price move into columns beside
		* the article; below that they sit on a row under it. The summary follows the lines on a phone and
		* sits beside them from 1200px — it never floats over the page.
		*
		* The quantity stepper floors at 1. Taking a line out is its own, labelled action, so a tap on
		* "−" can never make a line disappear.
		*
		* Every line is a wheel (D6). A Komplettrad is a wheel line that carries its tyre
		* (docs/specs/komplettrad.md §4.11): it prints the rim, then its components — Felge, Reifen,
		* Montage und Auswuchten, Wuchtgewichte — each with `Anzahl × Einzelpreis`, and beneath them the
		* Wuchtgewichte tiles, one whole-tile radio per colour. A component with no price yet reads
		* `wird noch festgelegt` and is left out of every figure. `Reifen entfernen` turns the line into
		* Felgen only. Everything the server refused about the line (`blockReasons`) is printed in full,
		* with `Entfernen` and `Anderes Fahrzeug wählen` as the ways out.
		*
		* A line from the demo range says so and stays in the basket, and the way to the Kasse stays open
		* so the flow can be reviewed: the server refuses the order there (ACCURACY.md D4). While no
		* shipping price is configured, shipping is named, not priced, and it is not in the total.
		*/
		const props = __props;
		const shared = useShared();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		/** The server's validation answers, shared by Inertia; `{}` in fixtures that carry none. */
		const errors = (0, vue_exports.computed)(() => {
			const raw = shared.value.errors;
			return raw !== null && typeof raw === "object" ? raw : {};
		});
		/** The checkout sent the customer back here with a sentence (a sensor price moved, §5.3). */
		const orderError = (0, vue_exports.computed)(() => typeof errors.value.order === "string" ? errors.value.order : null);
		/** The line whose Wuchtgewichte tiles were last touched: a refusal is shown there, not on every set. */
		const touched = (0, vue_exports.ref)(null);
		/** The server's reasons why this line cannot be ordered as it stands — full sentences, empty when none. */
		function reasonsOf(line) {
			return line.blockReasons ?? [];
		}
		/** A line that is sold out, no longer sellable for the chosen car, or marked by the server blocks the way to the Kasse. */
		const blocked = (0, vue_exports.computed)(() => props.lines.some((line) => !line.inStock || line.verdict !== null && line.verdict !== void 0 && !line.verdict.sellable || reasonsOf(line).length > 0));
		/** Any line from the demo range: the summary says the order cannot be placed yet. */
		const hasDemo = (0, vue_exports.computed)(() => props.lines.some((line) => line.demo !== false));
		/** No shipping price has been given yet: fails closed, the figure is left out rather than guessed. */
		const shippingOpen = (0, vue_exports.computed)(() => props.totals.shippingConfigured !== true);
		/** The sensors, once answered with `ja` at the checkout: in the subtotal, so they are named beside it. */
		const tpmsRow = (0, vue_exports.computed)(() => props.totals.tpms?.choice === "ja" ? props.totals.tpms : null);
		/** The admin's swatch, or the neutral chip where none is set — never a wrong colour. */
		function swatchStyle(hex) {
			return { background: hex ?? "var(--band)" };
		}
		const VERDICT_TONE = {
			PERMITTED: "tag--ok",
			CONDITIONAL: "tag--warn",
			NOT_PERMITTED: "tag--danger",
			UNKNOWN: "tag--unknown"
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Warenkorb" }, null, _parent));
			_push(`<section class="section-dense" data-v-8e2fc2ed><div class="wrap" data-v-8e2fc2ed><div class="cart__head" data-v-8e2fc2ed><h1 class="t-h1" data-v-8e2fc2ed>Warenkorb</h1>`);
			if (__props.lines.length > 0) {
				_push(`<p class="cart__count" data-v-8e2fc2ed><span class="tabular" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.count)}</span> Artikel `);
				if (vehicle.value) _push(`<!--[--> für ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)} <span class="data" data-v-8e2fc2ed>(${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.keyNumbers)})</span><!--]-->`);
				else _push(`<!---->`);
				_push(`</p>`);
			} else _push(`<!---->`);
			_push(`</div>`);
			if (orderError.value) _push(`<p class="cart__alert" role="alert" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(orderError.value)}</p>`);
			else _push(`<!---->`);
			if (__props.lines.length > 0) {
				_push(`<div class="cart" data-v-8e2fc2ed><div class="cart__lines" data-v-8e2fc2ed><ul class="bl" aria-label="Artikel im Warenkorb" data-v-8e2fc2ed><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.lines, (line) => {
					_push(`<li class="bl__line" data-v-8e2fc2ed><div class="bl__thumb" data-v-8e2fc2ed>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(ProductPhoto_default, {
						spokes: line.art.spokes ?? 5,
						finish: line.art.finish ?? "graphite",
						size: 96,
						note: false
					}, null, _parent));
					_push(`</div><div class="bl__main" data-v-8e2fc2ed><p class="bl__brand" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(line.brandName)} `);
					if (line.isSet) _push(`<span class="tag tag--ok bl__set-tag" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(line.setLabel)}</span>`);
					else _push(`<!---->`);
					_push(`</p><p class="bl__title" data-v-8e2fc2ed>`);
					if (line.slug) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: `/felgen/${line.slug}`,
						class: "bl__link"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(line.title)}`);
							else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(line.title), 1)];
						}),
						_: 2
					}, _parent));
					else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(line.title)}<!--]-->`);
					_push(`</p><p class="bl__sub" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(line.subtitle)}</p>`);
					if (line.sizeLabel) _push(`<p class="data bl__size" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(line.sizeLabel)}</p>`);
					else _push(`<!---->`);
					if (line.tyre) _push(`<p class="bl__tyre" data-v-8e2fc2ed><span class="bl__tyre-name" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(line.tyre.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(line.tyre.name)}</span><span class="bl__tyre-meta" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(line.tyre.seasonLabel)} · <span class="data" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(line.tyre.sizeLabel)}</span></span></p>`);
					else _push(`<!---->`);
					if (!line.inStock || line.verdict || line.demo !== false) {
						_push(`<p class="bl__flags" data-v-8e2fc2ed>`);
						if (line.demo !== false) _push(`<span class="tag tag--unknown" data-v-8e2fc2ed>Beispielsortiment</span>`);
						else _push(`<!---->`);
						if (!line.inStock) _push(`<span class="tag tag--danger" data-v-8e2fc2ed>Nicht mehr verfügbar</span>`);
						else _push(`<!---->`);
						if (line.verdict) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([VERDICT_TONE[line.verdict.status] ?? "tag--unknown", "tag"])}" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(line.verdict.label)}</span>`);
						else _push(`<!---->`);
						_push(`</p>`);
					} else _push(`<!---->`);
					if (line.verdict && line.verdict.conditions.length) {
						_push(`<ul class="bl__conditions" data-v-8e2fc2ed><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(line.verdict.conditions, (condition) => {
							_push(`<li data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
						});
						_push(`<!--]--></ul>`);
					} else _push(`<!---->`);
					if (line.verdict && !line.verdict.sellable && reasonsOf(line).length === 0) {
						_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([{ "bl__blocked--unknown": line.verdict.status !== "NOT_PERMITTED" }, "bl__blocked"])}" data-v-8e2fc2ed>`);
						if (line.verdict.status === "NOT_PERMITTED") _push(`<p data-v-8e2fc2ed> Diese Felge ist für dein aktuelles Fahrzeug nicht mehr freigegeben. </p>`);
						else _push(`<p data-v-8e2fc2ed>Für diese Kombination liegt uns kein Gutachten vor.</p>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: "/felgen-suchen",
							class: "bl__blocked-link"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Anderes Fahrzeug wählen`);
								else return [(0, vue_exports.createTextVNode)("Anderes Fahrzeug wählen")];
							}),
							_: 2
						}, _parent));
						_push(`</div>`);
					} else _push(`<!---->`);
					if (reasonsOf(line).length > 0) {
						_push(`<div class="bl__reasons" role="status" data-v-8e2fc2ed><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(reasonsOf(line), (reason) => {
							_push(`<p class="bl__reason" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(reason)}</p>`);
						});
						_push(`<!--]--><div class="bl__reasons-actions" data-v-8e2fc2ed><button class="bl__blocked-link bl__reasons-remove" type="button" data-v-8e2fc2ed> Entfernen </button>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: "/felgen-suchen",
							class: "bl__blocked-link"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Anderes Fahrzeug wählen`);
								else return [(0, vue_exports.createTextVNode)("Anderes Fahrzeug wählen")];
							}),
							_: 2
						}, _parent));
						_push(`</div></div>`);
					} else _push(`<!---->`);
					if (line.isSet && line.components && line.components.length > 1) {
						_push(`<!--[--><dl class="bl__parts" aria-label="Bestandteile des Komplettrads" data-v-8e2fc2ed><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(line.components, (part) => {
							_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([{ "bl__part--open": part.open }, "bl__part"])}" data-v-8e2fc2ed><dt class="bl__part-label" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(part.label)}</dt><dd class="bl__part-unit" data-v-8e2fc2ed><span class="tabular" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(part.quantity)} × ${(0, server_renderer_exports.ssrInterpolate)(part.unitPrice)}</span></dd><dd class="bl__part-total" data-v-8e2fc2ed>`);
							if (part.lineTotal !== null) _push(`<span class="tabular" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(part.lineTotal)}</span>`);
							else _push(`<span class="bl__part-open" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(part.unitPrice)}</span>`);
							_push(`</dd></div>`);
						});
						_push(`<!--]--></dl>`);
						if (line.weightOptions && line.weightOptions.length > 0) {
							_push(`<fieldset class="bl__weights" data-v-8e2fc2ed><legend class="bl__weights-title" data-v-8e2fc2ed>Wuchtgewichte</legend><p class="bl__weights-hint" data-v-8e2fc2ed> Die Gewichte sitzen innen an der Felge. Such dir die Farbe aus, die dir besser gefällt. </p><div class="opt" data-v-8e2fc2ed><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(line.weightOptions, (option) => {
								_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "opt__tile--on": line.weights?.colourId === option.id }, "opt__tile"])}" data-v-8e2fc2ed><input class="visually-hidden opt__input" type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", `weights-${line.key}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", option.id)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(line.weights?.colourId === option.id) ? " checked" : ""} data-v-8e2fc2ed><span class="opt__swatch" style="${(0, server_renderer_exports.ssrRenderStyle)(swatchStyle(option.swatchHex))}" aria-hidden="true" data-v-8e2fc2ed></span><span class="opt__name" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(option.name)}</span><span class="opt__price tabular" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(option.surcharge)}`);
								if (option.surchargeCents === 0) _push(`<span class="visually-hidden" data-v-8e2fc2ed> ohne Aufpreis</span>`);
								else _push(`<!---->`);
								_push(`</span><span class="opt__check" aria-hidden="true" data-v-8e2fc2ed>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
									name: "check",
									size: 20
								}, null, _parent));
								_push(`</span></label>`);
							});
							_push(`<!--]--></div>`);
							if (touched.value === line.key && errors.value.colourId) _push(`<p class="field-error bl__weights-error" role="alert" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(errors.value.colourId)}</p>`);
							else _push(`<!---->`);
							_push(`</fieldset>`);
						} else _push(`<!---->`);
						_push(`<!--]-->`);
					} else _push(`<!---->`);
					_push(`</div><div class="bl__qty" data-v-8e2fc2ed><span class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("id", `qty-${line.key}`)} data-v-8e2fc2ed>Menge</span><div class="bl__stepper" role="group"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `qty-${line.key}`)} data-v-8e2fc2ed><button class="bl__step" type="button" aria-label="Menge verringern"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(line.quantity <= 1) ? " disabled" : ""} data-v-8e2fc2ed>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "minus",
						size: 20
					}, null, _parent));
					_push(`</button><span class="bl__n tabular" aria-live="polite" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)}</span><button class="bl__step" type="button" aria-label="Menge erhöhen"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(line.quantity >= 99) ? " disabled" : ""} data-v-8e2fc2ed>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "plus",
						size: 20
					}, null, _parent));
					_push(`</button></div><div class="bl__actions" data-v-8e2fc2ed><button class="btn btn--quiet bl__remove" type="button" data-v-8e2fc2ed>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "trash",
						size: 20
					}, null, _parent));
					_push(` Entfernen </button>`);
					if (line.isSet) _push(`<button class="btn btn--quiet bl__remove-tyre" type="button" data-v-8e2fc2ed> Reifen entfernen </button>`);
					else _push(`<!---->`);
					_push(`</div></div><div class="bl__price" data-v-8e2fc2ed><p class="bl__total tabular" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(line.lineTotal)}</p><p class="bl__unit" data-v-8e2fc2ed><span class="tabular" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)} × ${(0, server_renderer_exports.ssrInterpolate)(line.unitPrice)}</span></p>`);
					if (line.priceOpen) _push(`<p class="bl__open" data-v-8e2fc2ed>ohne Montage und Auswuchten – wird noch festgelegt</p>`);
					else _push(`<!---->`);
					_push(`</div></li>`);
				});
				_push(`<!--]--></ul><p class="price-legal cart__legal" data-v-8e2fc2ed>Alle Preise inkl. MwSt., zzgl. Versand.</p></div><aside class="card cart__summary" aria-labelledby="cart-sum" data-v-8e2fc2ed><h2 id="cart-sum" class="t-h3" data-v-8e2fc2ed>Deine Bestellung</h2><dl class="sum" data-v-8e2fc2ed>`);
				if (tpmsRow.value) _push(`<div class="sum__row sum__row--item" data-v-8e2fc2ed><dt data-v-8e2fc2ed>RDKS-Sensoren (${(0, server_renderer_exports.ssrInterpolate)(tpmsRow.value.line)})</dt><dd class="tabular" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(tpmsRow.value.total)}</dd></div>`);
				else _push(`<!---->`);
				_push(`<div class="sum__row" data-v-8e2fc2ed><dt data-v-8e2fc2ed>Zwischensumme</dt><dd class="tabular" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.subtotal)}</dd></div><div class="sum__row" data-v-8e2fc2ed><dt data-v-8e2fc2ed>Versand</dt>`);
				if (shippingOpen.value) _push(`<dd class="sum__word sum__open" data-v-8e2fc2ed>wird noch festgelegt</dd>`);
				else if (__props.totals.freeShipping) _push(`<dd class="sum__word" data-v-8e2fc2ed>Kostenlos</dd>`);
				else _push(`<dd class="tabular" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.shipping)}</dd>`);
				_push(`</div><div class="sum__row sum__row--total" data-v-8e2fc2ed><dt data-v-8e2fc2ed>Gesamt</dt><dd class="tabular" data-v-8e2fc2ed>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.total)}</dd></div></dl>`);
				if (shippingOpen.value) _push(`<p class="price-legal" data-v-8e2fc2ed> inkl. ${(0, server_renderer_exports.ssrInterpolate)(__props.totals.tax)} MwSt. · Versandkosten werden noch festgelegt </p>`);
				else _push(`<p class="price-legal" data-v-8e2fc2ed>inkl. ${(0, server_renderer_exports.ssrInterpolate)(__props.totals.tax)} MwSt. und Versand</p>`);
				if (hasDemo.value) _push(`<p class="cart__demo" data-v-8e2fc2ed> Dein Warenkorb enthält Felgen aus unserem Beispielsortiment. Du kannst dir die Kasse ansehen, bestellen kannst du sie noch nicht. </p>`);
				else _push(`<!---->`);
				if (blocked.value) _push(`<!--[--><p class="cart__stop" data-v-8e2fc2ed> Entferne zuerst die markierte Position – sie ist nicht lieferbar oder für dein Fahrzeug nicht freigegeben. </p><button class="btn btn--primary btn--block btn--lg cart__go" type="button" disabled data-v-8e2fc2ed> Zur Kasse </button><!--]-->`);
				else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/kasse",
					class: "btn btn--primary btn--block btn--lg cart__go"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Zur Kasse`);
						else return [(0, vue_exports.createTextVNode)("Zur Kasse")];
					}),
					_: 1
				}, _parent));
				_push(`</aside></div>`);
			} else {
				_push(`<div class="state" data-v-8e2fc2ed>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "cart",
					size: 24
				}, null, _parent));
				_push(`<p class="state__title" data-v-8e2fc2ed>Dein Warenkorb ist noch leer.</p><p class="t-body" data-v-8e2fc2ed> Wähle dein Fahrzeug – wir zeigen dir anschließend nur Felgen, die dafür freigegeben sind. </p>`);
				if (vehicle.value) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen",
					class: "btn btn--primary"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(` Felgen für ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.short)} ansehen `);
						else return [(0, vue_exports.createTextVNode)(" Felgen für " + (0, vue_exports.toDisplayString)(vehicle.value.short) + " ansehen ", 1)];
					}),
					_: 1
				}, _parent));
				else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen-suchen",
					class: "btn btn--primary"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Fahrzeug wählen`);
						else return [(0, vue_exports.createTextVNode)("Fahrzeug wählen")];
					}),
					_: 1
				}, _parent));
				_push(`</div>`);
			}
			_push(`</div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Warenkorb/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Warenkorb/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-8e2fc2ed"]]);
//#endregion
export { Index_default as default };
