import { T as useShared, f as priceTerms, p as totalNote } from "./useShopFeedback-NPcaaVdy.js";
import { a as link_default, i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ConditionGroups_default } from "./ConditionGroups-D92g-UzQ.js";
import { t as AppLayout_default } from "./AppLayout-CxU6OGNy.js";
import { t as Icon_default } from "./Icon-BMMRRofH.js";
import { c as papersLines, n as ENTRY_REQUIRED, t as ABNAHME_REQUIRED } from "./papers-B4aUsj_q.js";
import { i as fitsWhole, n as LINE_ROOM, r as countedDe } from "./auflagen-GU7i_IxY.js";
import { t as ProductPhoto_default } from "./ProductPhoto-DTdDKSKx.js";
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
		const terms = (0, vue_exports.computed)(() => priceTerms(shared.value.smallBusiness === true));
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
		function saidAbove(line) {
			const papers = papersLines(line.verdict);
			return papers.length === 0 ? [] : [
				...papers,
				ENTRY_REQUIRED,
				ABNAHME_REQUIRED
			];
		}
		/** The Auflagen the line still has to say once the papers' line has spoken. */
		function auflagenOf(line) {
			const said = saidAbove(line);
			return (line.verdict?.conditions ?? []).filter((condition) => !said.includes(condition));
		}
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
			_push(`<section class="section-dense" data-v-32671884><div class="wrap" data-v-32671884><div class="cart__head" data-v-32671884><h1 class="t-h1" data-v-32671884>Warenkorb</h1>`);
			if (__props.lines.length > 0) {
				_push(`<p class="cart__count" data-v-32671884><span class="tabular" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.count)}</span> Artikel `);
				if (vehicle.value) _push(`<!--[--> für ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)} <span class="data" data-v-32671884>(${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.approval ?? vehicle.value.keyNumbers)})</span><!--]-->`);
				else _push(`<!---->`);
				_push(`</p>`);
			} else _push(`<!---->`);
			_push(`</div>`);
			if (orderError.value) _push(`<p class="cart__alert" role="alert" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(orderError.value)}</p>`);
			else _push(`<!---->`);
			if (__props.lines.length > 0) {
				_push(`<div class="cart" data-v-32671884><div class="cart__lines" data-v-32671884><ul class="bl" aria-label="Artikel im Warenkorb" data-v-32671884><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.lines, (line) => {
					_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{ "bl__line--set-rear": line.mixed?.axle === "REAR" }, "bl__line"])}" data-v-32671884><div class="bl__thumb" data-v-32671884>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(ProductPhoto_default, {
						spokes: line.art.spokes ?? 5,
						finish: line.art.finish ?? "graphite",
						size: 96,
						note: false
					}, null, _parent));
					_push(`</div><div class="bl__main" data-v-32671884><p class="bl__brand" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(line.brandName)} `);
					if (line.isSet) _push(`<span class="tag tag--ok bl__set-tag" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(line.setLabel)}</span>`);
					else _push(`<!---->`);
					_push(`</p><p class="bl__title" data-v-32671884>`);
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
					_push(`</p><p class="bl__sub" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(line.subtitle)}</p>`);
					if (line.sizeLabel) _push(`<p class="data bl__size" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(line.sizeLabel)}</p>`);
					else _push(`<!---->`);
					if (line.tyre) _push(`<p class="bl__tyre" data-v-32671884><span class="bl__tyre-name" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(line.tyre.brandName)} ${(0, server_renderer_exports.ssrInterpolate)(line.tyre.name)}</span><span class="bl__tyre-meta" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(line.tyre.seasonLabel)} · <span class="data" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(line.tyre.sizeLabel)}</span></span></p>`);
					else _push(`<!---->`);
					if (line.mixed) {
						_push(`<p class="bl__mixed" data-v-32671884>`);
						if (line.mixed.listed) _push(`<!--[-->Kombination Nr. ${(0, server_renderer_exports.ssrInterpolate)(line.mixed.pairing)} aus dem Gutachten<!--]-->`);
						else _push(`<!--[-->Mischbereifung<!--]-->`);
						_push(` – zusammen mit <span class="data" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(line.mixed.partnerSize)}</span> auf der ${(0, server_renderer_exports.ssrInterpolate)(line.mixed.axle === "FRONT" ? "Hinterachse" : "Vorderachse")}. `);
						if (line.mixed.axle === "REAR") _push(`<!--[--> Zwei Kompletträder je Achse, die Anzahl ist fest. Mit „Entfernen“ nimmst du alle vier Räder aus dem Warenkorb. <!--]-->`);
						else _push(`<!---->`);
						if (line.mixed.minLoadIndex !== null) _push(`<!--[--> Auf der ${(0, server_renderer_exports.ssrInterpolate)(line.mixed.axleLabel)} mindestens Tragfähigkeitsindex ${(0, server_renderer_exports.ssrInterpolate)(line.mixed.minLoadIndex)} und Geschwindigkeitsindex ${(0, server_renderer_exports.ssrInterpolate)(line.mixed.minSpeedSymbol)}. <!--]-->`);
						else _push(`<!---->`);
						_push(`</p>`);
					} else _push(`<!---->`);
					if (!line.inStock || line.verdict || line.demo !== false) {
						_push(`<p class="bl__flags" data-v-32671884>`);
						if (line.demo !== false) _push(`<span class="tag tag--unknown" data-v-32671884>Beispielsortiment</span>`);
						else _push(`<!---->`);
						if (!line.inStock) _push(`<span class="tag tag--danger" data-v-32671884>Nicht mehr verfügbar</span>`);
						else _push(`<!---->`);
						if (line.verdict) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([VERDICT_TONE[line.verdict.notesOnly ? "PERMITTED" : line.verdict.status] ?? "tag--unknown", "tag"])}" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(line.verdict.label)}</span>`);
						else _push(`<!---->`);
						_push(`</p>`);
					} else _push(`<!---->`);
					_push(`<!--[-->`);
					(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(papersLines)(line.verdict), (sentence) => {
						_push(`<p class="bl__entry" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(sentence)}</p>`);
					});
					_push(`<!--]-->`);
					if (line.verdict?.rimAloneNote) _push(`<p class="bl__entry bl__entry--note" data-rim-alone data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(line.verdict.rimAloneNote)}</p>`);
					else _push(`<!---->`);
					if (line.verdict && auflagenOf(line).length) (0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)((0, vue_exports.unref)(fitsWhole)(auflagenOf(line), (0, vue_exports.unref)(LINE_ROOM)) ? "div" : "details"), {
						class: "bl__auflagen",
						"data-auflagen": ""
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								if (!(0, vue_exports.unref)(fitsWhole)(auflagenOf(line), (0, vue_exports.unref)(LINE_ROOM))) _push(`<summary class="bl__auflagen-toggle" data-v-32671884${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(countedDe)(auflagenOf(line).length, line.verdict.notesOnly === true))} anzeigen </summary>`);
								else _push(`<!---->`);
								if (line.verdict.conditionGroups) _push((0, server_renderer_exports.ssrRenderComponent)(ConditionGroups_default, {
									class: "bl__groups",
									groups: line.verdict.conditionGroups,
									omit: saidAbove(line)
								}, null, _parent, _scopeId));
								else {
									_push(`<ul class="bl__conditions" data-v-32671884${_scopeId}><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(auflagenOf(line), (condition) => {
										_push(`<li data-v-32671884${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
									});
									_push(`<!--]--></ul>`);
								}
							} else return [!(0, vue_exports.unref)(fitsWhole)(auflagenOf(line), (0, vue_exports.unref)(LINE_ROOM)) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("summary", {
								key: 0,
								class: "bl__auflagen-toggle"
							}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(countedDe)(auflagenOf(line).length, line.verdict.notesOnly === true)) + " anzeigen ", 1)) : (0, vue_exports.createCommentVNode)("", true), line.verdict.conditionGroups ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ConditionGroups_default, {
								key: 1,
								class: "bl__groups",
								groups: line.verdict.conditionGroups,
								omit: saidAbove(line)
							}, null, 8, ["groups", "omit"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ul", {
								key: 2,
								class: "bl__conditions"
							}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(auflagenOf(line), (condition) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: condition }, (0, vue_exports.toDisplayString)(condition), 1);
							}), 128))]))];
						}),
						_: 2
					}), _parent);
					else _push(`<!---->`);
					if (line.verdict && !line.verdict.sellable && reasonsOf(line).length === 0) {
						_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([{ "bl__blocked--unknown": line.verdict.status !== "NOT_PERMITTED" }, "bl__blocked"])}" data-v-32671884>`);
						if (line.verdict.status === "NOT_PERMITTED") _push(`<p data-v-32671884> Diese Felge ist für dein aktuelles Fahrzeug nicht mehr freigegeben. </p>`);
						else _push(`<p data-v-32671884>Für diese Kombination liegt uns kein Gutachten vor.</p>`);
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
						_push(`<div class="bl__reasons" role="status" data-v-32671884><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(reasonsOf(line), (reason) => {
							_push(`<p class="bl__reason" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(reason)}</p>`);
						});
						_push(`<!--]--><div class="bl__reasons-actions" data-v-32671884><button class="bl__blocked-link bl__reasons-remove" type="button" data-v-32671884> Entfernen </button>`);
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
						_push(`<!--[--><dl class="bl__parts" aria-label="Bestandteile des Komplettrads" data-v-32671884><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(line.components, (part) => {
							_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([{ "bl__part--open": part.open }, "bl__part"])}" data-v-32671884><dt class="bl__part-label" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(part.label)}</dt><dd class="bl__part-unit" data-v-32671884><span class="tabular" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(part.quantity)} × ${(0, server_renderer_exports.ssrInterpolate)(part.unitPrice)}</span></dd><dd class="bl__part-total" data-v-32671884>`);
							if (part.lineTotal !== null) _push(`<span class="tabular" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(part.lineTotal)}</span>`);
							else _push(`<span class="bl__part-open" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(part.unitPrice)}</span>`);
							_push(`</dd></div>`);
						});
						_push(`<!--]--></dl>`);
						if (line.weightOptions && line.weightOptions.length > 0 && line.mixed?.axle !== "FRONT") {
							_push(`<fieldset class="bl__weights" data-v-32671884><legend class="bl__weights-title" data-v-32671884>Wuchtgewichte</legend><p class="bl__weights-hint" data-v-32671884> Die Gewichte sitzen innen an der Felge. Such dir die Farbe aus, die dir besser gefällt. </p><div class="opt" data-v-32671884><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(line.weightOptions, (option) => {
								_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "opt__tile--on": line.weights?.colourId === option.id }, "opt__tile"])}" data-v-32671884><input class="visually-hidden opt__input" type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", `weights-${line.key}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", option.id)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(line.weights?.colourId === option.id) ? " checked" : ""} data-v-32671884><span class="opt__swatch" style="${(0, server_renderer_exports.ssrRenderStyle)(swatchStyle(option.swatchHex))}" aria-hidden="true" data-v-32671884></span><span class="opt__name" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(option.name)}</span><span class="opt__price tabular" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(option.surcharge)}`);
								if (option.surchargeCents === 0) _push(`<span class="visually-hidden" data-v-32671884> ohne Aufpreis</span>`);
								else _push(`<!---->`);
								_push(`</span><span class="opt__check" aria-hidden="true" data-v-32671884>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
									name: "check",
									size: 20
								}, null, _parent));
								_push(`</span></label>`);
							});
							_push(`<!--]--></div>`);
							if (touched.value === line.key && errors.value.colourId) _push(`<p class="field-error bl__weights-error" role="alert" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(errors.value.colourId)}</p>`);
							else _push(`<!---->`);
							_push(`</fieldset>`);
						} else _push(`<!---->`);
						_push(`<!--]-->`);
					} else _push(`<!---->`);
					_push(`</div><div class="bl__qty" data-v-32671884><span class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("id", `qty-${line.key}`)} data-v-32671884>Anzahl</span>`);
					if (line.mixed?.fixed) _push(`<p class="bl__fixed"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `qty-${line.key}`)} data-fixed data-v-32671884><span class="bl__n tabular" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)}</span> <span class="bl__fixed-note" data-v-32671884>Stück</span></p>`);
					else {
						_push(`<div class="bl__stepper" role="group"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `qty-${line.key}`)} data-v-32671884><button class="bl__step" type="button" aria-label="Anzahl verringern"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(line.quantity <= 1) ? " disabled" : ""} data-v-32671884>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "minus",
							size: 20
						}, null, _parent));
						_push(`</button><span class="bl__n tabular" aria-live="polite" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)}</span><button class="bl__step" type="button" aria-label="Anzahl erhöhen"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(line.quantity >= 99) ? " disabled" : ""} data-v-32671884>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "plus",
							size: 20
						}, null, _parent));
						_push(`</button></div>`);
					}
					if (line.mixed?.axle !== "FRONT") {
						_push(`<div class="bl__actions" data-v-32671884><button class="btn btn--quiet bl__remove" type="button" data-v-32671884>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "trash",
							size: 20
						}, null, _parent));
						_push(` Entfernen </button>`);
						if (line.isSet) _push(`<button class="btn btn--quiet bl__remove-tyre" type="button" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(line.mixed ? "Reifen beider Achsen entfernen" : "Reifen entfernen")}</button>`);
						else _push(`<!---->`);
						_push(`</div>`);
					} else _push(`<!---->`);
					_push(`</div><div class="bl__price" data-v-32671884><p class="bl__total tabular" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(line.lineTotal)}</p><p class="bl__unit" data-v-32671884><span class="tabular" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)} × ${(0, server_renderer_exports.ssrInterpolate)(line.unitPrice)}</span></p>`);
					if (line.priceOpen) _push(`<p class="bl__open" data-v-32671884>ohne Montage und Auswuchten – wird noch festgelegt</p>`);
					else _push(`<!---->`);
					_push(`</div></li>`);
				});
				_push(`<!--]--></ul><p class="price-legal cart__legal" data-v-32671884>Alle Preise ${(0, server_renderer_exports.ssrInterpolate)(terms.value.note)}.</p></div><aside class="card cart__summary" aria-labelledby="cart-sum" data-v-32671884><h2 id="cart-sum" class="t-h3" data-v-32671884>Deine Bestellung</h2><dl class="sum" data-v-32671884>`);
				if (tpmsRow.value) _push(`<div class="sum__row sum__row--item" data-v-32671884><dt data-v-32671884>RDKS-Sensoren (${(0, server_renderer_exports.ssrInterpolate)(tpmsRow.value.line)})</dt><dd class="tabular" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(tpmsRow.value.total)}</dd></div>`);
				else _push(`<!---->`);
				_push(`<div class="sum__row" data-v-32671884><dt data-v-32671884>Zwischensumme</dt><dd class="tabular" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.subtotal)}</dd></div><div class="sum__row" data-v-32671884><dt data-v-32671884>Versand</dt>`);
				if (shippingOpen.value) _push(`<dd class="sum__word sum__open" data-v-32671884>wird noch festgelegt</dd>`);
				else if (__props.totals.freeShipping) _push(`<dd class="sum__word" data-v-32671884>Kostenlos</dd>`);
				else _push(`<dd class="tabular" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.shipping)}</dd>`);
				_push(`</div><div class="sum__row sum__row--total" data-v-32671884><dt data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(shippingOpen.value ? "Summe ohne Versand" : "Gesamt")}</dt><dd class="tabular" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)(__props.totals.total)}</dd></div></dl><p class="price-legal" data-v-32671884>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(totalNote)(terms.value.smallBusiness, __props.totals.tax, shippingOpen.value))}</p>`);
				if (hasDemo.value) _push(`<p class="cart__demo" data-v-32671884> Dein Warenkorb enthält Felgen aus unserem Beispielsortiment. Du kannst dir die Kasse ansehen, bestellen kannst du sie noch nicht. </p>`);
				else _push(`<!---->`);
				if (blocked.value) _push(`<!--[--><p class="cart__stop" data-v-32671884> Entferne zuerst die markierte Position. Warum sie so nicht bestellt werden kann, steht direkt bei ihr. </p><button class="btn btn--primary btn--block btn--lg cart__go" type="button" disabled data-v-32671884> Zur Kasse </button><!--]-->`);
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
				_push(`<div class="state" data-v-32671884>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "cart",
					size: 24
				}, null, _parent));
				_push(`<p class="state__title" data-v-32671884>Dein Warenkorb ist noch leer.</p><p class="t-body" data-v-32671884> Wähle dein Fahrzeug – wir zeigen dir anschließend nur Felgen, die dafür freigegeben sind. </p>`);
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
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-32671884"]]);
//#endregion
export { Index_default as default };
