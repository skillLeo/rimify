import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { D as cellDone, O as cellSummary, T as widthText, _ as WHEELS, o as useSketch, w as sizeName } from "./gutachtenStore-DERNJqCs.js";
import { t as CellEditor_default } from "./CellEditor-DniQeUd0.js";
import { t as CodesPanel_default } from "./CodesPanel-BgijEqRY.js";
import { t as PdfPanel_default } from "./PdfPanel-NDmlC1mg.js";
//#region resources/js/Pages/Admin/Skizze/parts/StepTyres.vue?vue&type=script&setup=true&lang.ts
var StepTyres_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "StepTyres",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* Step 4, Reifen — the main screen (the brief §7): the paper on the left, what is still open in the middle, the tyres of
		* one car group on the right. The middle column is also where the paper's codes live („Auflagen dieses Gutachtens"),
		* one tab away from the to-do list.
		*/
		const store = useSketch();
		const { state } = store;
		const tab = (0, vue_exports.ref)("todo");
		const wheel = (0, vue_exports.computed)(() => WHEELS.find((w) => w.id === state.wheelId));
		const size = (0, vue_exports.computed)(() => wheel.value?.sizes.find((s) => s.id === state.sizeId) ?? wheel.value?.sizes[0]);
		const groups = (0, vue_exports.computed)(() => store.chosenGroups());
		const done = (0, vue_exports.computed)(() => groups.value.filter((group) => cellDone(store.cellOf(group.id))).length);
		const current = (0, vue_exports.computed)(() => groups.value.find((group) => group.id === state.cell) ?? groups.value[0]);
		const shortSize = (0, vue_exports.computed)(() => size.value ? `${widthText(size.value.width)} × ${size.value.diameter}` : "");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "sk-step",
				"aria-labelledby": "sk-tyres-h"
			}, _attrs))} data-v-4b4966cd><h2 id="sk-tyres-h" class="visually-hidden" tabindex="-1" data-v-4b4966cd>Reifen</h2>`);
			if (groups.value.length === 0) _push(`<div class="sk-none" data-v-4b4966cd><p class="adm-note" data-v-4b4966cd>Noch keine Fahrzeuggruppe. Übernimm in Schritt 3 mindestens eine Zeile des Gutachtens, dann trägst du hier ihre Reifen ein.</p><button class="btn btn--primary" type="button" data-v-4b4966cd>Zu Schritt 3: Fahrzeuge</button></div>`);
			else {
				_push(`<div class="sk-tyres" data-v-4b4966cd>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(PdfPanel_default, { class: "sk-tyres__pdf" }, null, _parent));
				_push(`<aside class="sk-side" aria-label="Zu erledigen und Auflagen" data-v-4b4966cd><div class="sk-side__tabs" role="tablist" aria-label="Ansicht" data-v-4b4966cd><button id="sk-tab-todo" class="sk-side__tab" role="tab" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-selected", tab.value === "todo")} aria-controls="sk-panel-todo" data-v-4b4966cd>Zu erledigen</button><button id="sk-tab-codes" class="sk-side__tab" role="tab" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-selected", tab.value === "codes")} aria-controls="sk-panel-codes" data-v-4b4966cd>Auflagen</button></div>`);
				if (tab.value === "todo") {
					_push(`<div id="sk-panel-todo" role="tabpanel" aria-labelledby="sk-tab-todo" class="sk-todo" data-v-4b4966cd><p class="sk-side__title" data-v-4b4966cd>${(0, server_renderer_exports.ssrInterpolate)(done.value)} von ${(0, server_renderer_exports.ssrInterpolate)(groups.value.length)} erledigt</p><ul class="sk-todo__list" data-v-4b4966cd><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(groups.value, (group) => {
						_push(`<li data-v-4b4966cd><button class="sk-todo__item" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-current", (0, vue_exports.unref)(state).cell === group.id ? "true" : void 0)} data-v-4b4966cd><span class="sk-todo__name" data-v-4b4966cd>${(0, server_renderer_exports.ssrInterpolate)(group.sales)} (${(0, server_renderer_exports.ssrInterpolate)(group.type)})</span><span class="sk-todo__size" data-v-4b4966cd>${(0, server_renderer_exports.ssrInterpolate)(shortSize.value)} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(cellSummary)((0, vue_exports.unref)(store).cellOf(group.id)))}</span>`);
						if ((0, vue_exports.unref)(cellDone)((0, vue_exports.unref)(store).cellOf(group.id))) {
							_push(`<span class="sk-todo__state sk-todo__state--done" data-v-4b4966cd>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "check",
								size: 20
							}, null, _parent));
							_push(`<span class="visually-hidden" data-v-4b4966cd>erledigt</span></span>`);
						} else _push(`<span class="adm-tag adm-tag--warn sk-todo__state" data-v-4b4966cd>offen</span>`);
						_push(`</button></li>`);
					});
					_push(`<!--]--></ul></div>`);
				} else _push((0, server_renderer_exports.ssrRenderComponent)(CodesPanel_default, {
					id: "sk-panel-codes",
					role: "tabpanel",
					"aria-labelledby": "sk-tab-codes"
				}, null, _parent));
				_push(`</aside>`);
				if (current.value && size.value && wheel.value) _push((0, server_renderer_exports.ssrRenderComponent)(CellEditor_default, {
					key: current.value.id,
					class: "sk-tyres__editor",
					group: current.value,
					"wheel-name": `${wheel.value.brand} ${wheel.value.model}`,
					"size-name": (0, vue_exports.unref)(sizeName)(size.value)
				}, null, _parent));
				else _push(`<!---->`);
				_push(`</div>`);
			}
			_push(`</section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Skizze/parts/StepTyres.vue
var StepTyres_exports = /* @__PURE__ */ __exportAll({ default: () => StepTyres_default });
var _sfc_setup = StepTyres_vue_vue_type_script_setup_true_lang_default.setup;
StepTyres_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Skizze/parts/StepTyres.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var StepTyres_default = /*#__PURE__*/ _plugin_vue_export_helper_default(StepTyres_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-4b4966cd"]]);
//#endregion
export { StepTyres_exports as n, StepTyres_default as t };
