import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ConditionGroups_default } from "./ConditionGroups-BO9ZVcYo.js";
import { h as useGutachtenPage } from "./entryStore-XWwzBuxT.js";
import { t as sizesByAxle } from "./axles-CuEsf00U.js";
//#region resources/js/Pages/Admin/Gutachten/Erfassung/PreviewSection.vue?vue&type=script&setup=true&lang.ts
var ENTRY_LINE = "Eintragung in die Fahrzeugpapiere erforderlich.";
var PreviewSection_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "PreviewSection",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* „Vorschau im Shop“: what the shop will answer for one of the paper's cars, computed by the same check every customer gets.
		* Lazy: computed when a car is chosen, and only for it. Used by step 5 and by the read view of a released paper.
		*/
		const page = useGutachtenPage();
		const props = (0, vue_exports.computed)(() => page.props);
		const draft = (0, vue_exports.computed)(() => props.value.document.status === "draft");
		const vehicle = (0, vue_exports.ref)(props.value.previewVehicle ?? props.value.vehicles[0]?.id ?? null);
		const busy = (0, vue_exports.ref)(false);
		(0, vue_exports.watch)(() => props.value.vehicles, (vehicles) => {
			if (vehicle.value === null || !vehicles.some((v) => v.id === vehicle.value)) vehicle.value = props.value.previewVehicle ?? vehicles[0]?.id ?? null;
		});
		/** The vehicle the verdicts on screen were computed for: named above them, so they are never read as another's. */
		const previewFor = (0, vue_exports.computed)(() => props.value.vehicles.find((v) => v.id === props.value.previewVehicle)?.label ?? null);
		/** The preview's entry line, as the shop's panel says it. */
		const TONE = {
			PERMITTED: null,
			CONDITIONAL: "adm-tag adm-tag--warn",
			NOT_PERMITTED: "adm-tag adm-tag--bad",
			UNKNOWN: "adm-tag adm-tag--neutral"
		};
		return (_ctx, _push, _parent, _attrs) => {
			if (props.value.vehicles.length) {
				_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
					class: "adm-section gs-preview",
					"aria-labelledby": "gs-preview-h"
				}, _attrs))} data-v-3ed6fc08><div class="adm-section__head" data-v-3ed6fc08><h2 id="gs-preview-h" class="adm-section__title" data-v-3ed6fc08>Vorschau im Shop</h2></div><p class="adm-note" data-v-3ed6fc08>So antwortet der Shop${(0, server_renderer_exports.ssrInterpolate)(draft.value ? " nach der Freigabe" : "")} für dieses Fahrzeug. Dahinter steht dieselbe Prüfung, die auch Kundinnen und Kunden bekommen.</p><form class="gs-preview-pick" data-v-3ed6fc08><label class="visually-hidden" for="gs-preview-vehicle" data-v-3ed6fc08>Fahrzeug für die Vorschau</label><select id="gs-preview-vehicle" class="input" data-v-3ed6fc08><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(props.value.vehicles, (car) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", car.id)} data-v-3ed6fc08${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(vehicle.value) ? (0, server_renderer_exports.ssrLooseContain)(vehicle.value, car.id) : (0, server_renderer_exports.ssrLooseEqual)(vehicle.value, car.id)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(car.label)}</option>`);
				});
				_push(`<!--]--></select><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-3ed6fc08>Vorschau zeigen</button></form>`);
				if (props.value.preview && previewFor.value) _push(`<p class="gs-preview-for" data-v-3ed6fc08>Vorschau für ${(0, server_renderer_exports.ssrInterpolate)(previewFor.value)}</p>`);
				else _push(`<!---->`);
				if (props.value.preview && props.value.preview.length) {
					_push(`<ul class="gs-verdicts" aria-live="polite" data-v-3ed6fc08><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(props.value.preview, (verdict) => {
						_push(`<li class="gs-verdict" data-v-3ed6fc08><div class="gs-verdict__head" data-v-3ed6fc08><span class="gs-verdict__wheel" data-v-3ed6fc08>${(0, server_renderer_exports.ssrInterpolate)(verdict.wheel)}</span>`);
						if (!verdict.notesOnly && TONE[verdict.status]) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)(TONE[verdict.status])}" data-v-3ed6fc08>${(0, server_renderer_exports.ssrInterpolate)(verdict.statusLabel)}</span>`);
						else _push(`<span class="gs-verdict__ok" data-v-3ed6fc08>${(0, server_renderer_exports.ssrInterpolate)(verdict.statusLabel)}</span>`);
						_push(`</div>`);
						if (verdict.reason) _push(`<p class="gs-verdict__line" data-v-3ed6fc08>${(0, server_renderer_exports.ssrInterpolate)(verdict.reason)}</p>`);
						else _push(`<!---->`);
						if (verdict.front.length) _push(`<p class="gs-verdict__line" data-v-3ed6fc08>Reifen: ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(sizesByAxle)(verdict.front, verdict.rear))}</p>`);
						else _push(`<!---->`);
						if (verdict.requiresEntry) {
							_push(`<p class="gs-verdict__line" data-v-3ed6fc08>${(0, server_renderer_exports.ssrInterpolate)(verdict.entryLine ?? ENTRY_LINE)}`);
							if (verdict.entryNote) _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(" " + verdict.entryNote)}<!--]-->`);
							else _push(`<!---->`);
							_push(`</p>`);
						} else _push(`<!---->`);
						if (verdict.papersLine) _push(`<p class="gs-verdict__line" data-v-3ed6fc08>${(0, server_renderer_exports.ssrInterpolate)(verdict.papersLine)}</p>`);
						else _push(`<!---->`);
						if (verdict.conditionGroups && verdict.conditions.length) _push((0, server_renderer_exports.ssrRenderComponent)(ConditionGroups_default, {
							class: "gs-verdict__groups",
							groups: verdict.conditionGroups,
							omit: verdict.requiresEntry ? [ENTRY_LINE] : []
						}, null, _parent));
						else {
							_push(`<!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(verdict.conditions.filter((s) => !(verdict.requiresEntry && s === ENTRY_LINE)), (sentence, i) => {
								_push(`<p class="gs-verdict__line" data-v-3ed6fc08>${(0, server_renderer_exports.ssrInterpolate)(sentence)}</p>`);
							});
							_push(`<!--]-->`);
						}
						_push(`</li>`);
					});
					_push(`<!--]--></ul>`);
				} else if (props.value.preview) _push(`<p class="adm-note" data-v-3ed6fc08>Für dieses Fahrzeug ist zu diesem Gutachten keine Zeile hinterlegt.</p>`);
				else _push(`<!---->`);
				_push(`</section>`);
			} else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Erfassung/PreviewSection.vue
var PreviewSection_exports = /* @__PURE__ */ __exportAll({ default: () => PreviewSection_default });
var _sfc_setup = PreviewSection_vue_vue_type_script_setup_true_lang_default.setup;
PreviewSection_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Erfassung/PreviewSection.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var PreviewSection_default = /*#__PURE__*/ _plugin_vue_export_helper_default(PreviewSection_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-3ed6fc08"]]);
//#endregion
export { PreviewSection_exports as n, PreviewSection_default as t };
