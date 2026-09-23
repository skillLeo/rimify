import { c as vue_exports, n as head_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { t as Icon_default } from "./Icon-Cd7fU8zT.js";
import { t as AppLayout_default } from "./AppLayout-CIg_X6Ij.js";
//#region resources/js/Pages/Bestellung/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		order: {},
		lines: {},
		contact: {},
		demo: { type: Boolean }
	},
	setup(__props) {
		/**
		* The order confirmation.
		*
		* The verdict shown per line is the FROZEN one from `order_line_fitments`, not a fresh
		* computation. Eleven months from now a customer whose workshop refused the wheels will open this
		* page, and it has to say what they were told on the day — the state, every Auflage in full, the
		* Gutachten number and the revision of the document the answer came from.
		*
		* The order number on the page is the one in the URL: both come from the same row.
		*
		* One page for every width: the positions and the totals stack on a phone and sit side by side
		* from 1200px.
		*
		* A seeded order (`demo`) says so at the top: nobody placed it, and its frozen verdicts are seed
		* data, not a statement about the car it names (ACCURACY.md §3.1 F3). The snapshots themselves
		* are never rewritten (R-12). No carrier is named and no confirmation mail is promised (D7).
		*/
		const props = __props;
		const VERDICT_LABEL = {
			PERMITTED: "Freigegeben",
			CONDITIONAL: "Freigegeben mit Auflagen",
			NOT_PERMITTED: "Nicht freigegeben",
			UNKNOWN: "Keine Freigabe hinterlegt"
		};
		const VERDICT_CLASS = {
			PERMITTED: "tag--ok",
			CONDITIONAL: "tag--warn",
			NOT_PERMITTED: "tag--danger",
			UNKNOWN: "tag--unknown"
		};
		function conditionsOf(detail) {
			const raw = detail.conditions;
			if (!Array.isArray(raw)) return [];
			return raw.map((c) => c !== null && typeof c === "object" ? c.textDe : null).filter((text) => typeof text === "string" && text.trim() !== "");
		}
		function documentOf(detail) {
			const doc = detail.document;
			if (doc === null || typeof doc !== "object") return null;
			const number = doc.number;
			return typeof number === "string" && number !== "" ? number : null;
		}
		const lines = (0, vue_exports.computed)(() => props.lines.map((line) => ({
			...line,
			conditions: line.verdict ? conditionsOf(line.verdict.detail) : [],
			documentNumber: line.verdict ? documentOf(line.verdict.detail) : null
		})));
		const questionHref = (0, vue_exports.computed)(() => props.contact.phone ? `tel:${(props.contact.phoneIntl ?? props.contact.phone).replace(/\s/g, "")}` : `mailto:${props.contact.email}?subject=${encodeURIComponent(`Bestellung ${props.order.number}`)}`);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: `Bestellung ${__props.order.number}` }, null, _parent));
			_push(`<section class="section-dense" data-v-ed8bf855><div class="wrap" data-v-ed8bf855>`);
			if (__props.demo) {
				_push(`<header class="ord__head" data-v-ed8bf855><span class="ord__tick ord__tick--demo" data-v-ed8bf855>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "info",
					size: 24
				}, null, _parent));
				_push(`</span><div data-v-ed8bf855><h1 class="t-h1" data-v-ed8bf855>Beispielbestellung</h1><p class="t-lead ord__lead" data-v-ed8bf855><span class="tag tag--unknown ord__demo-tag" data-v-ed8bf855>Demodaten</span> Diese Bestellung stammt aus unseren Beispieldaten – niemand hat sie aufgegeben. Auch die Freigaben unten sind Beispieldaten: Sie sagen nichts darüber aus, ob eine Felge an das genannte Fahrzeug darf. </p></div></header>`);
			} else {
				_push(`<header class="ord__head" data-v-ed8bf855><span class="ord__tick" data-v-ed8bf855>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "check-circle",
					size: 24
				}, null, _parent));
				_push(`</span><div data-v-ed8bf855><h1 class="t-h1" data-v-ed8bf855>Vielen Dank für deine Bestellung.</h1><p class="t-lead ord__lead" data-v-ed8bf855>Heb dir die Bestellnummer auf – mit ihr beantworten wir deine Fragen.</p></div></header>`);
			}
			_push(`<dl class="ord__facts" data-v-ed8bf855><div data-v-ed8bf855><dt class="micro" data-v-ed8bf855>Bestellnummer</dt><dd class="ord__number" data-v-ed8bf855>${(0, server_renderer_exports.ssrInterpolate)(__props.order.number)}</dd></div>`);
			if (__props.order.placedAt) _push(`<div data-v-ed8bf855><dt class="micro" data-v-ed8bf855>Bestellt am</dt><dd class="data" data-v-ed8bf855>${(0, server_renderer_exports.ssrInterpolate)(__props.order.placedAt)}</dd></div>`);
			else _push(`<!---->`);
			_push(`<div data-v-ed8bf855><dt class="micro" data-v-ed8bf855>Status</dt><dd data-v-ed8bf855>${(0, server_renderer_exports.ssrInterpolate)(__props.order.statusLabel)}</dd></div>`);
			if (__props.order.vehicleLabel) {
				_push(`<div data-v-ed8bf855><dt class="micro" data-v-ed8bf855>Fahrzeug</dt><dd data-v-ed8bf855>${(0, server_renderer_exports.ssrInterpolate)(__props.order.vehicleLabel)} `);
				if (__props.order.keyNumbers) _push(`<span class="data" data-v-ed8bf855>(${(0, server_renderer_exports.ssrInterpolate)(__props.order.keyNumbers)})</span>`);
				else _push(`<!---->`);
				_push(`</dd></div>`);
			} else _push(`<!---->`);
			_push(`</dl><div class="ord" data-v-ed8bf855><section class="ord__lines" aria-labelledby="ord-lines" data-v-ed8bf855><h2 id="ord-lines" class="t-h2" data-v-ed8bf855>Positionen und Freigaben</h2><p class="t-small quiet ord__frozen" data-v-ed8bf855> Die Freigabe jeder Position ist mit dem Stand vom Bestelltag gespeichert. </p><ul class="ord__list" data-v-ed8bf855><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(lines.value, (line) => {
				_push(`<li class="ord__line" data-v-ed8bf855><div class="ord__line-top" data-v-ed8bf855><div class="ord__line-name" data-v-ed8bf855><p class="ord__kind" data-v-ed8bf855>${(0, server_renderer_exports.ssrInterpolate)(line.kindLabel)}</p><p class="ord__label" data-v-ed8bf855>${(0, server_renderer_exports.ssrInterpolate)(line.label)}</p></div><div class="ord__line-price" data-v-ed8bf855><p class="ord__total tabular" data-v-ed8bf855>${(0, server_renderer_exports.ssrInterpolate)(line.lineTotal)}</p><p class="ord__unit tabular" data-v-ed8bf855>${(0, server_renderer_exports.ssrInterpolate)(line.quantity)} × ${(0, server_renderer_exports.ssrInterpolate)(line.unitPrice)}</p></div></div>`);
				if (line.verdict) {
					_push(`<div class="ord__verdict" data-v-ed8bf855><p class="ord__verdict-row" data-v-ed8bf855><span class="${(0, server_renderer_exports.ssrRenderClass)([VERDICT_CLASS[line.verdict.status] ?? "tag--unknown", "tag"])}" data-v-ed8bf855>${(0, server_renderer_exports.ssrInterpolate)(VERDICT_LABEL[line.verdict.status] ?? "Keine Freigabe hinterlegt")}</span><span class="data" data-v-ed8bf855>`);
					if (line.documentNumber) _push(`<!--[-->Gutachten ${(0, server_renderer_exports.ssrInterpolate)(line.documentNumber)} · <!--]-->`);
					else _push(`<!---->`);
					_push(`Fassung ${(0, server_renderer_exports.ssrInterpolate)(line.verdict.documentRevision)}</span></p>`);
					if (line.verdict.requiresEntry && !line.conditions.some((c) => c.includes("Eintragung"))) _push(`<p class="ord__entry" data-v-ed8bf855> Eintragung in die Fahrzeugpapiere erforderlich. </p>`);
					else _push(`<!---->`);
					if (line.conditions.length) {
						_push(`<ul class="ord__conditions" data-v-ed8bf855><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(line.conditions, (condition) => {
							_push(`<li data-v-ed8bf855>${(0, server_renderer_exports.ssrInterpolate)(condition)}</li>`);
						});
						_push(`<!--]--></ul>`);
					} else _push(`<!---->`);
					_push(`</div>`);
				} else _push(`<!---->`);
				_push(`</li>`);
			});
			_push(`<!--]--></ul></section><aside class="ord__side" data-v-ed8bf855><div class="card" data-v-ed8bf855><h2 class="t-h3" data-v-ed8bf855>Summe</h2><dl class="sum" data-v-ed8bf855><div class="sum__row" data-v-ed8bf855><dt data-v-ed8bf855>Zwischensumme</dt><dd class="tabular" data-v-ed8bf855>${(0, server_renderer_exports.ssrInterpolate)(__props.order.subtotal)}</dd></div><div class="sum__row" data-v-ed8bf855><dt data-v-ed8bf855>Versand</dt><dd class="tabular" data-v-ed8bf855>${(0, server_renderer_exports.ssrInterpolate)(__props.order.shipping)}</dd></div><div class="sum__row sum__row--total" data-v-ed8bf855><dt data-v-ed8bf855>Gesamt</dt><dd class="tabular" data-v-ed8bf855>${(0, server_renderer_exports.ssrInterpolate)(__props.order.total)}</dd></div></dl><p class="price-legal" data-v-ed8bf855>inkl. ${(0, server_renderer_exports.ssrInterpolate)(__props.order.tax)} MwSt. und Versand</p></div><ul class="ord__next" data-v-ed8bf855><li class="ord__next-row" data-v-ed8bf855>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "truck",
				size: 20
			}, null, _parent));
			_push(`<div data-v-ed8bf855><p class="ord__next-title" data-v-ed8bf855>Bestellung verfolgen</p>`);
			if (__props.order.trackingCode) _push(`<p class="ord__next-text" data-v-ed8bf855> Sendungsnummer <span class="data" data-v-ed8bf855>${(0, server_renderer_exports.ssrInterpolate)(__props.order.trackingCode)}</span></p>`);
			else _push(`<p class="ord__next-text" data-v-ed8bf855> Die Sendungsnummer steht hier, sobald dein Paket unterwegs ist. </p>`);
			_push(`</div></li><li data-v-ed8bf855><a class="ord__next-row ord__next-link"${(0, server_renderer_exports.ssrRenderAttr)("href", questionHref.value)} data-v-ed8bf855>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: __props.contact.phone ? "phone" : "mail",
				size: 20
			}, null, _parent));
			_push(`<div data-v-ed8bf855><p class="ord__next-title" data-v-ed8bf855>Fragen zur Bestellung</p><p class="ord__next-text" data-v-ed8bf855>`);
			if (__props.contact.phone) _push(`<span class="tabular" data-v-ed8bf855>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.phone)}</span>`);
			else _push(`<span data-v-ed8bf855>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.email)}</span>`);
			_push(` · ${(0, server_renderer_exports.ssrInterpolate)(__props.contact.hours)}</p></div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "chevron-right",
				size: 20
			}, null, _parent));
			_push(`</a></li></ul></aside></div></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Bestellung/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Bestellung/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-ed8bf855"]]);
//#endregion
export { Index_default as default };
