import { a as link_default, i as head_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as Icon_default } from "./Icon-Bryl-es8.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as formatMoney } from "./num-Br8qlecZ.js";
import { c as zoll } from "./format-6R0uUMt3.js";
import { t as SketchBanner_default } from "./SketchBanner-vN_Jjq_z.js";
import { c as VERSIONS, d as boreText, m as versionShort, p as versionLine, t as CAR, u as WHEEL } from "./shopDemo-CkuVaHdt.js";
import { t as AppLayout_default } from "./AppLayout-DINvPib0.js";
import { n as ENTRY_REQUIRED, t as ABNAHME_REQUIRED } from "./papers-B4aUsj_q.js";
import { t as BuyModeChoice_default } from "./BuyModeChoice-Df7JBO2G.js";
import { t as VerdictBadge_default } from "./VerdictBadge-D63YxADb.js";
import { t as ProductPhoto_default } from "./ProductPhoto-DTdDKSKx.js";
//#region resources/js/Pages/Skizze/Felge.vue?vue&type=script&setup=true&lang.ts
var Felge_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Felge",
	__ssrInlineRender: true,
	props: {
		mitFahrzeug: { type: Boolean },
		ausfuehrung: {}
	},
	setup(__props) {
		/**
		* A product page whose every version can be chosen, as a sketch (the Gutachten rework brief §8, §11 Phase 1): Farbe, then
		* Durchmesser, then Ausführung — one chip per version the admin defines, naming width, ET and bolt pattern with its price,
		* never three selectors that could combine into a wheel that does not exist. Without a car every version shows; with one,
		* only those a released paper approves for it, and the rest counted in words that are true for each (R-17) — and
		* brought back on request, so nobody concludes the wheel is not made in that size.
		*/
		const props = __props;
		const withCar = (0, vue_exports.ref)(props.mitFahrzeug);
		const start = VERSIONS.find((v) => v.id === props.ausfuehrung) ?? VERSIONS[0];
		const finishId = (0, vue_exports.ref)(start?.finish ?? "blue");
		const diameter = (0, vue_exports.ref)(start?.diameter ?? 18);
		const versionId = (0, vue_exports.ref)(start?.id ?? "");
		const showOthers = (0, vue_exports.ref)(false);
		const added = (0, vue_exports.ref)(false);
		const mode = (0, vue_exports.ref)("felgen");
		const finish = (0, vue_exports.computed)(() => WHEEL.finishes.find((f) => f.id === finishId.value) ?? WHEEL.finishes[0]);
		const ofFinish = (0, vue_exports.computed)(() => VERSIONS.filter((v) => v.finish === finishId.value));
		const diameters = (0, vue_exports.computed)(() => [...new Set(ofFinish.value.map((v) => v.diameter))]);
		function diameterOpen(d) {
			return !withCar.value || ofFinish.value.some((v) => v.diameter === d && v.forCar === "conditional");
		}
		const inDiameter = (0, vue_exports.computed)(() => ofFinish.value.filter((v) => v.diameter === diameter.value));
		const approved = (0, vue_exports.computed)(() => withCar.value ? inDiameter.value.filter((v) => v.forCar === "conditional") : inDiameter.value);
		const others = (0, vue_exports.computed)(() => withCar.value ? inDiameter.value.filter((v) => v.forCar !== "conditional") : []);
		const version = (0, vue_exports.computed)(() => approved.value.find((v) => v.id === versionId.value) ?? approved.value[0]);
		const othersLine = (0, vue_exports.computed)(() => {
			const refused = others.value.filter((v) => v.forCar === "refused").length;
			const none = others.value.length - refused;
			const parts = [];
			if (refused) parts.push(`${refused === 1 ? "1 weitere Ausführung ist" : `${refused} weitere Ausführungen sind`} für deinen ${CAR.short} nicht freigegeben`);
			if (none) parts.push(`für ${none === 1 ? "1 weitere Ausführung" : `${none} weitere Ausführungen`} liegt uns für deinen ${CAR.short} keine Freigabe vor`);
			const line = parts.join("; ");
			return line.charAt(0).toUpperCase() + line.slice(1) + ".";
		});
		(0, vue_exports.watch)([
			finishId,
			diameter,
			withCar
		], () => {
			if (!approved.value.some((v) => v.id === versionId.value)) versionId.value = approved.value[0]?.id ?? inDiameter.value[0]?.id ?? "";
			showOthers.value = false;
		});
		function remember() {
			const url = new URL(window.location.href);
			url.searchParams.set("fahrzeug", withCar.value ? "1" : "0");
			url.searchParams.set("ausfuehrung", version.value?.id ?? "");
			window.history.replaceState(window.history.state, "", url);
		}
		(0, vue_exports.onMounted)(() => {
			if (!diameterOpen(diameter.value)) diameter.value = diameters.value.find(diameterOpen) ?? diameter.value;
			if (version.value !== void 0 && version.value.id !== versionId.value) versionId.value = version.value.id;
			remember();
			(0, vue_exports.watch)([
				withCar,
				versionId,
				version
			], remember);
		});
		const komplettradHref = (0, vue_exports.computed)(() => `/skizze/komplettraeder?ausfuehrung=${version.value?.id ?? ""}`);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Skizze: Ausführungen auf der Produktseite" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<meta head-key="robots" name="robots" content="noindex" data-v-911e81f5${_scopeId}>`);
					else return [(0, vue_exports.createVNode)("meta", {
						"head-key": "robots",
						name: "robots",
						content: "noindex"
					})];
				}),
				_: 1
			}, _parent));
			_push(`<section class="section-dense" data-v-911e81f5><div class="wrap sf" data-v-911e81f5>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(SketchBanner_default, { note: "So soll die Produktseite jede Ausführung einer Felge zeigen. Preise, Verfügbarkeit und Freigaben sind Beispiele; in den Warenkorb kommt nichts." }, null, _parent));
			_push(`<div class="sf-state" role="group" aria-label="Zustand der Skizze" data-v-911e81f5><span class="sf-state__label" data-v-911e81f5>Skizze zeigen</span><button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", !withCar.value)} data-v-911e81f5>Ohne Fahrzeug</button><button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", withCar.value)} data-v-911e81f5>Mit Fahrzeug: ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(CAR).name)}</button></div><nav class="sf-crumbs t-small" aria-label="Brotkrumen" data-v-911e81f5><span data-v-911e81f5>Startseite</span><span aria-hidden="true" data-v-911e81f5>/</span><span data-v-911e81f5>Felgen</span><span aria-hidden="true" data-v-911e81f5>/</span><span aria-current="page" translate="no" data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(WHEEL).brand)} ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(WHEEL).model)}</span></nav><div class="sf-grid" data-v-911e81f5><div class="sf-gallery" data-v-911e81f5><div class="well sf-well" data-v-911e81f5>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(ProductPhoto_default, {
				spokes: (0, vue_exports.unref)(WHEEL).spokes,
				finish: finish.value?.art ?? "graphite",
				size: 560
			}, null, _parent));
			_push(`</div></div><div class="sf-buy" data-v-911e81f5><h1 class="t-h1" translate="no" data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(WHEEL).brand)} ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(WHEEL).model)}</h1><div class="sf-block" data-v-911e81f5><span class="label" data-v-911e81f5>Farbe · <span translate="no" data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)(finish.value?.name)}</span></span><div class="sf-swatches" data-v-911e81f5><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(WHEEL).finishes, (item) => {
				_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{ "sf-swatch--on": item.id === finishId.value }, "sf-swatch"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", item.id === finishId.value)} data-v-911e81f5><span class="sf-dot" data-qa-ignore style="${(0, server_renderer_exports.ssrRenderStyle)({ "--swatch": item.hex })}" data-v-911e81f5></span><span translate="no" data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)(item.name)}</span></button>`);
			});
			_push(`<!--]--></div></div><div class="sf-block" data-v-911e81f5><span class="label" data-v-911e81f5>Durchmesser (<span translate="no" data-v-911e81f5>Zoll</span>)</span><div class="chip-row sf-chips" data-v-911e81f5><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(diameters.value, (d) => {
				_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{
					"chip--on": d === diameter.value,
					"chip--struck": !diameterOpen(d)
				}, "chip"])}" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!diameterOpen(d)) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", d === diameter.value)}${(0, server_renderer_exports.ssrRenderAttr)("title", diameterOpen(d) ? void 0 : `Für deinen ${(0, vue_exports.unref)(CAR).short} liegt uns in ${(0, vue_exports.unref)(zoll)(d)} keine Freigabe vor.`)} data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)(d)}</button>`);
			});
			_push(`<!--]--></div></div><div class="sf-block" data-v-911e81f5><span id="sf-versions-label" class="label" data-v-911e81f5>Ausführung</span><div class="sf-versions" role="group" aria-labelledby="sf-versions-label" data-v-911e81f5><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(approved.value, (item) => {
				_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{ "sf-version--on": item.id === version.value?.id }, "sf-version"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", item.id === version.value?.id)} data-v-911e81f5><span class="sf-version__spec" data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(versionLine)(item))}</span><span class="sf-version__price" data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(item.priceCents))}</span>`);
				if (!item.available) _push(`<span class="tag tag--unknown sf-version__ask" data-v-911e81f5>Auf Anfrage</span>`);
				else _push(`<!---->`);
				_push(`<span class="sf-version__check" aria-hidden="true" data-v-911e81f5>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "check",
					size: 20
				}, null, _parent));
				_push(`</span></button>`);
			});
			_push(`<!--]--></div>`);
			if (!withCar.value) {
				_push(`<p class="t-small sf-hint sf-hint--icon" data-v-911e81f5>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "car",
					size: 20
				}, null, _parent));
				_push(`<span data-v-911e81f5>Wähle dein Fahrzeug, dann zeigen wir nur die Ausführungen, die dafür freigegeben sind.</span></p>`);
			} else if (others.value.length) _push(`<p class="t-small sf-hint" data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)(othersLine.value)} <button class="sf-link" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", showOthers.value)} data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)(showOthers.value ? "Ausblenden" : "Anzeigen")}</button></p>`);
			else _push(`<!---->`);
			if (showOthers.value) {
				_push(`<div class="sf-versions sf-versions--others" data-v-911e81f5><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(others.value, (item) => {
					_push(`<span class="sf-version sf-version--struck" data-v-911e81f5><span class="sf-version__spec" data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(versionLine)(item))}</span><span class="sf-version__why" data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)(item.forCar === "refused" ? "nicht freigegeben" : "keine Freigabe vorliegend")}</span></span>`);
				});
				_push(`<!--]--></div>`);
			} else _push(`<!---->`);
			if (version.value) _push(`<p class="t-small quiet sf-chosen" data-v-911e81f5> Gewählt: ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(versionShort)(version.value))} · Mittenloch ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(boreText)(version.value))} · ${(0, server_renderer_exports.ssrInterpolate)(version.value.available ? "verfügbar" : "auf Anfrage")}</p>`);
			else _push(`<!---->`);
			_push(`</div><div class="${(0, server_renderer_exports.ssrRenderClass)([{ "sf-check--warn": withCar.value && version.value }, "sf-check"])}" data-v-911e81f5><p class="label sf-check__title" data-v-911e81f5>RIMIFY-Check</p>`);
			if (withCar.value && version.value) {
				_push(`<!--[--><h2 class="sf-check__verdict" tabindex="-1" data-v-911e81f5>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, {
					status: "CONDITIONAL",
					size: "lg"
				}, null, _parent));
				_push(`<span data-v-911e81f5>für deinen ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(CAR).name)}</span></h2><ul class="sf-check__papers" data-v-911e81f5><li data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(ABNAHME_REQUIRED))}</li><li data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(ENTRY_REQUIRED))}</li></ul><!--]-->`);
			} else {
				_push(`<!--[--><p class="sf-check__line" data-v-911e81f5>Noch kein Fahrzeug gewählt</p><button class="btn btn--secondary sf-check__cta" type="button" data-v-911e81f5>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "car",
					size: 20
				}, null, _parent));
				_push(` Fahrzeug wählen </button><!--]-->`);
			}
			_push(`</div><div class="sf-block" data-v-911e81f5>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(BuyModeChoice_default, {
				modelValue: mode.value,
				"onUpdate:modelValue": ($event) => mode.value = $event,
				name: "sf-mode",
				"rim-price": version.value ? (0, vue_exports.unref)(formatMoney)(version.value.priceCents) : null
			}, null, _parent));
			if (mode.value === "komplettrad") {
				_push(`<!--[-->`);
				if (withCar.value && version.value?.forCar === "conditional") _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					class: "btn btn--secondary sf-next",
					href: komplettradHref.value
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push(` Weiter zur Reifenwahl `);
							_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
								name: "arrow-right",
								size: 20
							}, null, _parent, _scopeId));
						} else return [(0, vue_exports.createTextVNode)(" Weiter zur Reifenwahl "), (0, vue_exports.createVNode)(Icon_default, {
							name: "arrow-right",
							size: 20
						})];
					}),
					_: 1
				}, _parent));
				else _push(`<p class="t-small sf-hint sf-next" data-v-911e81f5> Kompletträder stellen wir für ein Fahrzeug zusammen. <button class="sf-link" type="button" data-v-911e81f5>Fahrzeug wählen</button></p>`);
				_push(`<!--]-->`);
			} else _push(`<!---->`);
			_push(`</div>`);
			if (version.value && mode.value === "felgen") {
				_push(`<div class="sf-price" data-v-911e81f5><p class="price price--lg" data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(version.value.setCents))}</p><p class="price-note" data-v-911e81f5>4 × ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(version.value.priceCents))} · inkl. MwSt., zzgl. Versandkosten</p><button class="btn btn--primary btn--block btn--lg sf-add" type="button" data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)(version.value.available ? "In den Warenkorb" : "Anfrage senden")}</button>`);
				if (added.value) _push(`<p class="t-small sf-added" role="status" data-v-911e81f5>In der Skizze kommt nichts in den Warenkorb.</p>`);
				else _push(`<!---->`);
				_push(`</div>`);
			} else _push(`<!---->`);
			_push(`</div></div><aside class="sf-tile-note" aria-labelledby="sf-tile-h" data-v-911e81f5><h2 id="sf-tile-h" class="label" data-v-911e81f5>So sieht die Kachel in der Felgenliste aus</h2><div class="tile sf-tile" data-v-911e81f5><div class="well sf-tile__well" data-v-911e81f5>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(ProductPhoto_default, {
				spokes: (0, vue_exports.unref)(WHEEL).spokes,
				finish: finish.value?.art ?? "graphite",
				size: 200,
				note: false
			}, null, _parent));
			_push(`</div><p class="tile__brand" translate="no" data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(WHEEL).brand)}</p><p class="tile__name" translate="no" data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(WHEEL).model)}</p><p class="t-small quiet" data-v-911e81f5>${(0, server_renderer_exports.ssrInterpolate)(ofFinish.value.length)} Ausführungen · 18 und 19 Zoll</p>`);
			if (withCar.value) {
				_push(`<p data-v-911e81f5>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, { status: "CONDITIONAL" }, null, _parent));
				_push(`</p>`);
			} else _push(`<!---->`);
			_push(`<p class="sf-tile__price" data-v-911e81f5>ab ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(Math.min(...ofFinish.value.map((v) => v.priceCents))))} <span class="t-small quiet" data-v-911e81f5>pro Felge</span></p></div></aside></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Skizze/Felge.vue
var _sfc_setup = Felge_vue_vue_type_script_setup_true_lang_default.setup;
Felge_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Skizze/Felge.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Felge_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Felge_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-911e81f5"]]);
//#endregion
export { Felge_default as default };
