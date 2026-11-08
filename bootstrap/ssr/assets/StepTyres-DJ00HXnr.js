import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-D0z-a8p_.js";
import { a as carLine, m as useEntry, o as carSummary } from "./entryStore-XWwzBuxT.js";
import { t as CodesPanel_default } from "./CodesPanel-DSPjQV2T.js";
import { t as LinesEditor_default } from "./LinesEditor-BffvrrbV.js";
import { t as PdfPanel_default } from "./PdfPanel-CLzNMpen.js";
//#region resources/js/Pages/Admin/Gutachten/Erfassung/StepTyres.vue?vue&type=script&setup=true&lang.ts
var StepTyres_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "StepTyres",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* Step 4, Reifen — the main screen (the Gutachten rework §7): the paper on the left, what is still open in the middle, one per car
		* and wheel combination (the client's changes of 05.11.2026 and 07.11.2026), the tyres of one of them on the right. The middle column is also where the paper's codes live
		* („Auflagen dieses Gutachtens“), one tab away from the to-do list.
		*/
		const store = useEntry();
		const { state } = store;
		const tab = (0, vue_exports.ref)("todo");
		const cars = (0, vue_exports.computed)(() => state.entry.cars);
		const done = (0, vue_exports.computed)(() => cars.value.filter((car) => car.done).length);
		const current = (0, vue_exports.computed)(() => store.car(state.carId) ?? cars.value[0]);
		const combination = (0, vue_exports.computed)(() => state.entry.combinations.find((c) => c.id === current.value?.combinationId));
		const wheelName = (0, vue_exports.computed)(() => state.entry.wheelSizes[0]?.wheel ?? "");
		const several = (0, vue_exports.computed)(() => state.entry.combinations.length > 1);
		const combinationLabel = (id) => state.entry.combinations.find((c) => c.id === id)?.label ?? "";
		const percent = (0, vue_exports.computed)(() => cars.value.length === 0 ? 0 : Math.round(done.value / cars.value.length * 100));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "ef-step",
				"aria-labelledby": "ef-tyres-h"
			}, _attrs))} data-v-cd18ca1d><h2 id="ef-tyres-h" class="visually-hidden" tabindex="-1" data-v-cd18ca1d>Reifen</h2>`);
			if (cars.value.length === 0) _push(`<div class="ef-none" data-v-cd18ca1d><p class="adm-note" data-v-cd18ca1d>Noch kein Fahrzeug. Hak in Schritt 3 die Fahrzeuge an, dann trägst du hier ihre Reifen ein.</p><button class="btn btn--primary" type="button" data-v-cd18ca1d>Zu Schritt 3: Fahrzeuge</button></div>`);
			else {
				_push(`<div class="ef-tyres" data-v-cd18ca1d>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(PdfPanel_default, { class: "ef-tyres__pdf" }, null, _parent));
				_push(`<aside class="ef-side" aria-label="Zu erledigen und Auflagen" data-v-cd18ca1d><div class="ef-side__tabs" role="tablist" aria-label="Ansicht" data-v-cd18ca1d><button id="ef-tab-todo" class="ef-side__tab" role="tab" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-selected", tab.value === "todo")} aria-controls="ef-panel-todo" data-v-cd18ca1d>Zu erledigen</button><button id="ef-tab-codes" class="ef-side__tab" role="tab" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-selected", tab.value === "codes")} aria-controls="ef-panel-codes" data-v-cd18ca1d>Auflagen</button></div><div id="ef-panel-todo" role="tabpanel" aria-labelledby="ef-tab-todo" class="ef-todo" style="${(0, server_renderer_exports.ssrRenderStyle)(tab.value === "todo" ? null : { display: "none" })}" data-v-cd18ca1d><p class="ef-side__title" data-v-cd18ca1d>${(0, server_renderer_exports.ssrInterpolate)(done.value)} von ${(0, server_renderer_exports.ssrInterpolate)(cars.value.length)} erledigt</p><div class="ef-progress" role="progressbar"${(0, server_renderer_exports.ssrRenderAttr)("aria-valuenow", done.value)}${(0, server_renderer_exports.ssrRenderAttr)("aria-valuemin", 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-valuemax", cars.value.length)} aria-label="Fahrzeuge mit Reifen" data-v-cd18ca1d><span class="ef-progress__bar" style="${(0, server_renderer_exports.ssrRenderStyle)({ width: `${percent.value}%` })}" data-v-cd18ca1d></span></div><ul class="ef-todo__list" data-v-cd18ca1d><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(cars.value, (car) => {
					_push(`<li data-v-cd18ca1d><button class="ef-todo__item" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-current", current.value?.id === car.id ? "true" : void 0)} data-v-cd18ca1d><span class="ef-todo__name" data-v-cd18ca1d>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(carLine)(car.label))}</span>`);
					if (several.value) _push(`<span class="ef-todo__size" data-combination data-v-cd18ca1d>${(0, server_renderer_exports.ssrInterpolate)(combinationLabel(car.combinationId))}</span>`);
					else _push(`<!---->`);
					_push(`<span class="ef-todo__size" data-v-cd18ca1d>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(carSummary)(car))}`);
					if (car.finish) _push(`<!--[--> · nur ${(0, server_renderer_exports.ssrInterpolate)(car.finish)}<!--]-->`);
					else _push(`<!---->`);
					if (car.axle !== "ALL") _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(car.axle === "FRONT" ? "nur vorne" : "nur hinten")}<!--]-->`);
					else _push(`<!---->`);
					_push(`</span>`);
					if (car.conflict) _push(`<span class="adm-tag adm-tag--warn ef-todo__state" data-v-cd18ca1d>Prüfen</span>`);
					else if (car.done) {
						_push(`<span class="ef-todo__state ef-todo__state--done" data-v-cd18ca1d>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: "check",
							size: 20
						}, null, _parent));
						_push(`<span class="visually-hidden" data-v-cd18ca1d>erledigt</span></span>`);
					} else _push(`<span class="adm-tag adm-tag--warn ef-todo__state" data-v-cd18ca1d>Offen</span>`);
					_push(`</button></li>`);
				});
				_push(`<!--]--></ul></div>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(CodesPanel_default, {
					style: tab.value === "codes" ? null : { display: "none" },
					id: "ef-panel-codes",
					role: "tabpanel",
					"aria-labelledby": "ef-tab-codes"
				}, null, _parent));
				_push(`</aside>`);
				if (current.value && combination.value) _push((0, server_renderer_exports.ssrRenderComponent)(LinesEditor_default, {
					key: current.value.id,
					class: "ef-tyres__editor",
					car: current.value,
					"wheel-name": wheelName.value,
					combination: combination.value
				}, null, _parent));
				else _push(`<!---->`);
				_push(`</div>`);
			}
			_push(`</section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Erfassung/StepTyres.vue
var StepTyres_exports = /* @__PURE__ */ __exportAll({ default: () => StepTyres_default });
var _sfc_setup = StepTyres_vue_vue_type_script_setup_true_lang_default.setup;
StepTyres_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Erfassung/StepTyres.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var StepTyres_default = /*#__PURE__*/ _plugin_vue_export_helper_default(StepTyres_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-cd18ca1d"]]);
//#endregion
export { StepTyres_exports as n, StepTyres_default as t };
