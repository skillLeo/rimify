import { c as vue_exports, n as head_default, o as router, r as link_default } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { r as useShared } from "./useShared-CY71KcPZ.js";
import { t as Icon_default } from "./Icon-Cd7fU8zT.js";
import { t as AppLayout_default } from "./AppLayout-CIg_X6Ij.js";
import { t as ProductTile_default } from "./ProductTile-CM5ArmPB.js";
//#region resources/js/Components/Listing/FilterBar.vue?vue&type=script&setup=true&lang.ts
var FilterBar_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "FilterBar",
	__ssrInlineRender: true,
	props: {
		facets: {},
		filters: {},
		total: {}
	},
	emits: [
		"toggle",
		"toggle-entry",
		"reset"
	],
	setup(__props, { emit: __emit }) {
		/**
		* The filter panel: one vertical list of facets, used as the desktop sidebar and, unchanged,
		* inside the phone's filter sheet — one component, so the two can never offer different filters.
		*
		* `Ohne Eintragung` comes first and stands on its own: for many German buyers whether the wheel
		* needs an entry in the vehicle papers is the deciding attribute of the purchase.
		*
		* An option that would return nothing is DISABLED, never hidden. Disabling teaches the shape of
		* the catalogue; hiding makes the panel change length every time it is opened.
		*
		* Counts carry the other filters but not the facet's own, so "18 Zoll (12)" means "12 results if
		* you add this", which is the number a customer is actually deciding on.
		*/
		const props = __props;
		const FACETS = [
			{
				key: "marke",
				label: "Marke"
			},
			{
				key: "zoll",
				label: "Durchmesser (Zoll)"
			},
			{
				key: "breite",
				label: "Breite (Zoll)"
			},
			{
				key: "et",
				label: "Einpresstiefe (ET)"
			},
			{
				key: "farbe",
				label: "Farbe"
			}
		];
		const entryOn = (0, vue_exports.computed)(() => props.filters.ohne_eintragung === true);
		const entryCount = (0, vue_exports.computed)(() => props.facets.ohne_eintragung?.[0]?.count ?? null);
		const anyApplied = (0, vue_exports.computed)(() => Object.keys(props.filters).filter((key) => key !== "seite").length > 0);
		function selected(facet) {
			const value = props.filters[facet];
			return Array.isArray(value) ? value.map(String) : [];
		}
		function optionsFor(facet) {
			return props.facets[facet] ?? [];
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "fpanel" }, _attrs))} data-v-aad6110b><div class="between fpanel__head" data-v-aad6110b><h2 class="t-h3" data-v-aad6110b>Filter</h2>`);
			if (anyApplied.value) _push(`<button class="btn btn--quiet btn--sm" type="button" data-v-aad6110b> Zurücksetzen </button>`);
			else _push(`<!---->`);
			_push(`</div><label class="fpanel__opt fpanel__opt--entry" data-v-aad6110b><input type="checkbox"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(entryOn.value) ? " checked" : ""} data-v-aad6110b><span class="fpanel__label" data-v-aad6110b>Ohne Eintragung</span>`);
			if (entryCount.value !== null) _push(`<span class="data fpanel__count" data-v-aad6110b>${(0, server_renderer_exports.ssrInterpolate)(entryCount.value)}</span>`);
			else _push(`<!---->`);
			_push(`</label><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(FACETS, (facet) => {
				_push(`<fieldset class="fpanel__group" data-v-aad6110b><legend class="micro fpanel__legend" data-v-aad6110b>${(0, server_renderer_exports.ssrInterpolate)(facet.label)}</legend><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(optionsFor(facet.key), (option) => {
					_push(`<label class="${(0, server_renderer_exports.ssrRenderClass)([{ "fpanel__opt--off": option.count === 0 && !selected(facet.key).includes(option.value) }, "fpanel__opt"])}" data-v-aad6110b><input type="checkbox"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(selected(facet.key).includes(option.value)) ? " checked" : ""}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(option.count === 0 && !selected(facet.key).includes(option.value)) ? " disabled" : ""} data-v-aad6110b><span class="fpanel__label" data-v-aad6110b>${(0, server_renderer_exports.ssrInterpolate)(option.value)}</span><span class="data fpanel__count" data-v-aad6110b>${(0, server_renderer_exports.ssrInterpolate)(option.count)}</span></label>`);
				});
				_push(`<!--]-->`);
				if (optionsFor(facet.key).length === 0) _push(`<p class="quiet t-small" data-v-aad6110b>Keine Auswahl verfügbar.</p>`);
				else _push(`<!---->`);
				_push(`</fieldset>`);
			});
			_push(`<!--]--></div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Listing/FilterBar.vue
var _sfc_setup$2 = FilterBar_vue_vue_type_script_setup_true_lang_default.setup;
FilterBar_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Listing/FilterBar.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var FilterBar_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FilterBar_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-aad6110b"]]);
//#endregion
//#region resources/js/Components/Vehicle/VehicleNotify.vue?vue&type=script&setup=true&lang.ts
var VehicleNotify_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "VehicleNotify",
	__ssrInlineRender: true,
	props: {
		vehicleId: {},
		vehicleLabel: {}
	},
	setup(__props) {
		const shared = useShared();
		const contact = (0, vue_exports.computed)(() => shared.value.contact);
		const byMail = (0, vue_exports.computed)(() => shared.value.notifyByMail === true);
		const id = (0, vue_exports.useId)();
		const email = (0, vue_exports.ref)("");
		const state = (0, vue_exports.ref)("idle");
		const error = (0, vue_exports.ref)("");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "vnotify" }, _attrs))} data-v-7f442645>`);
			if (!byMail.value) _push(`<p class="t-body" data-v-7f442645> Du suchst eine Felge für deinen ${(0, server_renderer_exports.ssrInterpolate)(__props.vehicleLabel)}? Schreib uns eine E-Mail an <a class="link"${(0, server_renderer_exports.ssrRenderAttr)("href", `mailto:${contact.value.email}`)} data-v-7f442645>${(0, server_renderer_exports.ssrInterpolate)(contact.value.email)}</a>. </p>`);
			else if (state.value === "sent") _push(`<p class="t-body vnotify__done" role="status" data-v-7f442645> Danke. Bestätige bitte den Link in unserer E-Mail – erst dann melden wir uns. </p>`);
			else _push(`<form class="vnotify__form" data-v-7f442645><p class="t-body" data-v-7f442645> Sag uns deine E-Mail-Adresse – wir melden uns, sobald ein Gutachten deinen ${(0, server_renderer_exports.ssrInterpolate)(__props.vehicleLabel)} nennt. </p><label class="field-label vnotify__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${(0, vue_exports.unref)(id)}-mail`)} data-v-7f442645>E-Mail-Adresse</label><div class="vnotify__row" data-v-7f442645><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(id)}-mail`)}${(0, server_renderer_exports.ssrRenderAttr)("value", email.value)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": state.value === "error" }, "field vnotify__input"])}" type="email" inputmode="email" autocomplete="email" enterkeyhint="send" required${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", state.value === "error" ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${(0, vue_exports.unref)(id)}-error`)} data-v-7f442645><button class="btn btn--primary vnotify__send" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(state.value === "sending") ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", state.value === "sending" ? "true" : void 0)} data-v-7f442645> Benachrichtigen, sobald verfügbar </button></div><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${(0, vue_exports.unref)(id)}-error`)} class="field-error" aria-live="polite" data-v-7f442645>${(0, server_renderer_exports.ssrInterpolate)(error.value)}</p><p class="t-small quiet" data-v-7f442645>Du bekommst zuerst eine Bestätigungsmail. Abmelden geht jederzeit mit einem Klick.</p></form>`);
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Vehicle/VehicleNotify.vue
var _sfc_setup$1 = VehicleNotify_vue_vue_type_script_setup_true_lang_default.setup;
VehicleNotify_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Vehicle/VehicleNotify.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var VehicleNotify_default = /*#__PURE__*/ _plugin_vue_export_helper_default(VehicleNotify_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-7f442645"]]);
//#endregion
//#region resources/js/composables/useListingFilters.ts
/**
* Filter state lives in the query string, never in a store.
*
* 726 results behind client-side state is unindexable, unshareable and impossible to get back to.
* Writing every change to the URL means the back button works, a filtered listing can be sent to a
* friend, and the server renders exactly what the link describes.
*/
function useListingFilters(filters, path = "/felgen") {
	const current = (0, vue_exports.computed)(() => filters());
	function visit(next) {
		router.get(path, next, {
			preserveScroll: true,
			preserveState: true,
			replace: true
		});
	}
	function toggle(facet, value) {
		const next = { ...current.value };
		const raw = next[facet];
		const values = Array.isArray(raw) ? raw.map(String) : [];
		const updated = values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
		if (updated.length === 0) delete next[facet];
		else next[facet] = updated;
		delete next.seite;
		visit(next);
	}
	function toggleEntry() {
		const next = { ...current.value };
		if (next.ohne_eintragung === true) delete next.ohne_eintragung;
		else next.ohne_eintragung = 1;
		delete next.seite;
		visit(next);
	}
	function reset() {
		visit({});
	}
	function goToPage(page) {
		const next = { ...current.value };
		if (page <= 1) delete next.seite;
		else next.seite = page;
		router.get(path, next, { preserveState: true });
	}
	return {
		current,
		toggle,
		toggleEntry,
		reset,
		goToPage
	};
}
//#endregion
//#region resources/js/Pages/Felgen/Index.vue?vue&type=script&setup=true&lang.ts
var PAGE_SIZE = 24;
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		hasVehicle: { type: Boolean },
		cards: {},
		total: {},
		facets: {},
		filters: {},
		page: {},
		demo: { type: Boolean }
	},
	setup(__props) {
		/**
		* The listing.
		*
		* With a vehicle it is a compliance answer — only wheels with a valid Gutachten for that car, and
		* the count says so. Without one it is the open catalogue, and a notice above the grid says so
		* rather than quietly implying everything fits.
		*
		* One page for every width. The filters are a sticky sidebar from 1200px; below that they open in
		* a sheet from a sticky bar, with the live result count on the button that closes it.
		*
		* The page count is derived from the result count. It is never a literal.
		*/
		const props = __props;
		const shared = useShared();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const filters = useListingFilters(() => props.filters);
		const sheetOpen = (0, vue_exports.ref)(false);
		const heading = (0, vue_exports.computed)(() => vehicle.value === null ? "Alle Felgen" : `Felgen für deinen ${vehicle.value.short}`);
		const appliedCount = (0, vue_exports.computed)(() => Object.entries(props.filters).filter(([key, value]) => key !== "seite" && (Array.isArray(value) ? value.length > 0 : value)).length);
		const currentPage = (0, vue_exports.computed)(() => props.page ?? 1);
		const lastPage = (0, vue_exports.computed)(() => props.total === null ? 1 : Math.max(1, Math.ceil(props.total / PAGE_SIZE)));
		/** A window of page numbers around the current one, never a hard-coded run. */
		const pages = (0, vue_exports.computed)(() => {
			const last = lastPage.value;
			const from = Math.max(1, Math.min(currentPage.value - 2, last - 4));
			const to = Math.min(last, from + 4);
			return Array.from({ length: to - from + 1 }, (_, i) => from + i);
		});
		(0, vue_exports.watch)(sheetOpen, (open) => {
			if (typeof document !== "undefined") document.body.style.overflow = open ? "hidden" : "";
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			if (typeof document !== "undefined") document.body.style.removeProperty("overflow");
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Felgen" }, null, _parent));
			_push(`<section class="section-dense" data-v-d3194ddb><div class="wrap" data-v-d3194ddb><nav class="plp__crumbs t-small" aria-label="Brotkrumen" data-v-d3194ddb>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/" }, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`Startseite`);
					else return [(0, vue_exports.createTextVNode)("Startseite")];
				}),
				_: 1
			}, _parent));
			_push(`<span aria-hidden="true" data-v-d3194ddb>/</span><span aria-current="page" data-v-d3194ddb>Felgen</span></nav><div class="plp__head" data-v-d3194ddb><h1 class="t-h1" data-v-d3194ddb>${(0, server_renderer_exports.ssrInterpolate)(heading.value)} `);
			if (__props.demo) _push(`<span class="badge demo-note plp__demo" data-v-d3194ddb>Demodaten</span>`);
			else _push(`<!---->`);
			_push(`</h1><p class="plp__count" data-v-d3194ddb>`);
			if (__props.total !== null) _push(`<!--[--><strong class="tabular" data-v-d3194ddb>${(0, server_renderer_exports.ssrInterpolate)(__props.total)}</strong> ${(0, server_renderer_exports.ssrInterpolate)(__props.total === 1 ? "Felge" : "Felgen")} mit gültigem Gutachten für dieses Fahrzeug <!--]-->`);
			else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(__props.cards.length)} Felgen im Sortiment<!--]-->`);
			_push(`</p>`);
			if (__props.demo) _push(`<p class="micro quiet" data-v-d3194ddb>Beispielsortiment – Preise und Bestände sind Beispielwerte, bestellen kannst du noch nicht.</p>`);
			else _push(`<!---->`);
			_push(`</div>`);
			if (!__props.hasVehicle) {
				_push(`<div class="plp__notice" data-v-d3194ddb>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "info",
					size: 20
				}, null, _parent));
				_push(`<p class="plp__notice-text" data-v-d3194ddb> Wähle dein Fahrzeug, um nur Felgen zu sehen, die dafür freigegeben sind. </p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
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
			} else _push(`<!---->`);
			if (__props.hasVehicle) {
				_push(`<div class="plp__bar" data-v-d3194ddb><button class="btn btn--secondary plp__bar-btn" type="button" data-v-d3194ddb>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "filter",
					size: 20
				}, null, _parent));
				_push(` Filter `);
				if (appliedCount.value > 0) _push(`<span class="plp__bar-n tabular" data-v-d3194ddb>${(0, server_renderer_exports.ssrInterpolate)(appliedCount.value)}</span>`);
				else _push(`<!---->`);
				_push(`</button></div>`);
			} else _push(`<!---->`);
			_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([{ "plp__layout--filters": __props.hasVehicle }, "plp__layout"])}" data-v-d3194ddb>`);
			if (__props.hasVehicle) {
				_push(`<aside class="plp__side" aria-label="Filter" data-v-d3194ddb>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(FilterBar_default, {
					facets: __props.facets,
					filters: (0, vue_exports.unref)(filters).current.value,
					total: __props.total,
					onToggle: (0, vue_exports.unref)(filters).toggle,
					onToggleEntry: (0, vue_exports.unref)(filters).toggleEntry,
					onReset: (0, vue_exports.unref)(filters).reset
				}, null, _parent));
				_push(`</aside>`);
			} else _push(`<!---->`);
			_push(`<div class="plp__results" data-v-d3194ddb>`);
			if (__props.cards.length > 0) {
				_push(`<div class="tile-grid plp__grid" data-v-d3194ddb><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.cards, (card, i) => {
					_push((0, server_renderer_exports.ssrRenderComponent)(ProductTile_default, {
						key: `${card.modelId}-${card.finishId}`,
						card,
						vehicle: vehicle.value,
						eager: i < 4,
						sizes: "(min-width: 1280px) 240px, (min-width: 1024px) 22vw, (min-width: 768px) 30vw, 45vw",
						compare: ""
					}, null, _parent));
				});
				_push(`<!--]--></div>`);
			} else {
				_push(`<div class="state" data-v-d3194ddb>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "info",
					size: 24
				}, null, _parent));
				_push(`<p class="state__title" data-v-d3194ddb>${(0, server_renderer_exports.ssrInterpolate)(appliedCount.value > 0 ? "Keine Felgen für diese Filter." : "Für dieses Fahrzeug haben wir noch keine freigegebenen Felgen.")}</p><p class="t-body" data-v-d3194ddb> RIMIFY zeigt ausschließlich Felgen, für die ein gültiges Gutachten vorliegt. </p>`);
				if (appliedCount.value === 0 && vehicle.value) _push((0, server_renderer_exports.ssrRenderComponent)(VehicleNotify_default, {
					"vehicle-id": vehicle.value.id,
					"vehicle-label": vehicle.value.short
				}, null, _parent));
				else _push(`<!---->`);
				_push(`<div class="cluster" data-v-d3194ddb>`);
				if (appliedCount.value > 0) _push(`<button class="btn btn--primary" type="button" data-v-d3194ddb> Filter zurücksetzen </button>`);
				else _push(`<!---->`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen-suchen",
					class: "btn btn--secondary"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Anderes Fahrzeug wählen`);
						else return [(0, vue_exports.createTextVNode)("Anderes Fahrzeug wählen")];
					}),
					_: 1
				}, _parent));
				_push(`</div></div>`);
			}
			if (lastPage.value > 1) {
				_push(`<nav class="pager plp__pager" aria-label="Seiten" data-v-d3194ddb><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(pages.value, (n) => {
					_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{ "pager__page--on": currentPage.value === n }, "pager__page"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-current", currentPage.value === n ? "page" : void 0)} data-v-d3194ddb>${(0, server_renderer_exports.ssrInterpolate)(n)}</button>`);
				});
				_push(`<!--]--></nav>`);
			} else _push(`<!---->`);
			_push(`</div></div></div></section>`);
			if (sheetOpen.value) {
				_push(`<!--[--><div class="scrim" data-v-d3194ddb></div><div class="sheet plp__sheet" role="dialog" aria-modal="true" aria-label="Filter" data-v-d3194ddb><div class="sheet__grab" data-v-d3194ddb></div>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(FilterBar_default, {
					facets: __props.facets,
					filters: (0, vue_exports.unref)(filters).current.value,
					total: __props.total,
					onToggle: (0, vue_exports.unref)(filters).toggle,
					onToggleEntry: (0, vue_exports.unref)(filters).toggleEntry,
					onReset: (0, vue_exports.unref)(filters).reset
				}, null, _parent));
				_push(`<div class="plp__apply" data-v-d3194ddb><button class="btn btn--primary btn--block" type="button" data-v-d3194ddb>${(0, server_renderer_exports.ssrInterpolate)(__props.total ?? 0)} ${(0, server_renderer_exports.ssrInterpolate)(__props.total === 1 ? "Felge" : "Felgen")} anzeigen </button></div></div><!--]-->`);
			} else _push(`<!---->`);
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Felgen/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Felgen/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-d3194ddb"]]);
//#endregion
export { Index_default as default };
