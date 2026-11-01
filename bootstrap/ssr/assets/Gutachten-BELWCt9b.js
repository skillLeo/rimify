import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BPlu6HXH.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as SketchBanner_default } from "./SketchBanner-xSNbXZv7.js";
import { t as SketchSteps_default } from "./SketchSteps-DKZS-g9q.js";
import { N as reserveLineIds, a as initialState, i as createStore, n as STEPS, r as STORAGE_KEY, t as SKETCH } from "./gutachtenStore-DERNJqCs.js";
import { t as StepCars_default } from "./StepCars-B3ihsfHL.js";
import { t as StepPaper_default } from "./StepPaper-BU2YgHTp.js";
import { t as StepRelease_default } from "./StepRelease-BQkYxJfY.js";
import { t as StepTyres_default } from "./StepTyres-NGuYq2eh.js";
import { t as StepWheel_default } from "./StepWheel-BWHorDsk.js";
//#region resources/js/Pages/Admin/Skizze/Gutachten.vue?vue&type=script&setup=true&lang.ts
var Gutachten_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Gutachten",
	__ssrInlineRender: true,
	props: {
		schritt: {},
		zeile: {}
	},
	setup(__props) {
		/**
		* Gutachten › Neues Gutachten, as a sketch (the Gutachten rework brief §7, §11 Phase 1): the five steps — Gutachten, Felge,
		* Fahrzeuge, Reifen, Freigeben — in the admin's own look, filled with the proposal's example and clickable from end to
		* end. Nothing reaches the server: the state lives in this page and in the browser's session, so a reload resumes at the
		* same step and the same cell, as the real draft will. The address carries the step and the cell, so a click path can
		* be sent as a link.
		*/
		const props = __props;
		const store = createStore((props.schritt ?? 1) - 1, props.zeile ?? "m3");
		const { state } = store;
		(0, vue_exports.provide)(SKETCH, store);
		const title = (0, vue_exports.computed)(() => state.step === 0 ? "Neues Gutachten" : `${state.art} ${state.number}${state.supplement ? ` · ${state.supplement}` : ""}`);
		const context = (0, vue_exports.computed)(() => state.released ? "Freigegeben · in der Skizze" : `Entwurf · Schritt ${state.step + 1} von ${STEPS.length} · wird beim Tippen gespeichert`);
		const more = [{
			label: "Skizze zurücksetzen",
			run: () => reset()
		}];
		(0, vue_exports.onMounted)(() => {
			try {
				const saved = sessionStorage.getItem(STORAGE_KEY);
				if (saved !== null) {
					const restored = {
						...initialState(),
						...JSON.parse(saved)
					};
					Object.assign(state, restored, {
						step: props.schritt === null ? restored.step : props.schritt - 1,
						cell: props.zeile ?? restored.cell,
						reached: Math.max(restored.reached, props.schritt === null ? restored.step : props.schritt - 1)
					});
				}
			} catch {}
			reserveLineIds(state.cells);
			if (!state.groups.includes(state.cell)) state.cell = state.groups[0] ?? "m3";
			if (state.released) state.step = STEPS.length - 1;
			(0, vue_exports.watch)(state, () => {
				try {
					sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
				} catch {}
			}, {
				deep: true,
				immediate: true
			});
			(0, vue_exports.watch)(() => [state.step, state.cell], ([step, cell]) => {
				const url = new URL(window.location.href);
				url.searchParams.set("schritt", String(step + 1));
				if (step === 3) url.searchParams.set("zeile", cell);
				else url.searchParams.delete("zeile");
				window.history.replaceState(window.history.state, "", url);
			}, { immediate: true });
		});
		function reset() {
			store.reset();
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "sk-page" }, _attrs))} data-v-ff5a262d>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(SketchBanner_default, { note: "So soll das Eintragen eines Gutachtens künftig aussehen. Die Werte stammen aus dem Beispiel des Vorschlags; hier wird nichts gespeichert und nichts freigegeben." }, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, {
				title: title.value,
				context: context.value,
				more
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)(SketchSteps_default, {
							class: "sk-page__steps",
							steps: (0, vue_exports.unref)(STEPS),
							current: (0, vue_exports.unref)(state).step,
							reached: (0, vue_exports.unref)(state).released ? -1 : Math.min((0, vue_exports.unref)(STEPS).length - 1, (0, vue_exports.unref)(state).reached + 1),
							label: "Schritte zum Gutachten",
							onGo: (0, vue_exports.unref)(store).go
						}, null, _parent, _scopeId));
						_push(`<p class="visually-hidden" aria-live="polite" data-v-ff5a262d${_scopeId}>Schritt ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(state).step + 1)} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(STEPS).length)}: ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(STEPS)[(0, vue_exports.unref)(state).step])}</p>`);
						if ((0, vue_exports.unref)(state).step === 0) _push((0, server_renderer_exports.ssrRenderComponent)(StepPaper_default, null, null, _parent, _scopeId));
						else if ((0, vue_exports.unref)(state).step === 1) _push((0, server_renderer_exports.ssrRenderComponent)(StepWheel_default, null, null, _parent, _scopeId));
						else if ((0, vue_exports.unref)(state).step === 2) _push((0, server_renderer_exports.ssrRenderComponent)(StepCars_default, null, null, _parent, _scopeId));
						else if ((0, vue_exports.unref)(state).step === 3) _push((0, server_renderer_exports.ssrRenderComponent)(StepTyres_default, null, null, _parent, _scopeId));
						else _push((0, server_renderer_exports.ssrRenderComponent)(StepRelease_default, null, null, _parent, _scopeId));
					} else return [
						(0, vue_exports.createVNode)(SketchSteps_default, {
							class: "sk-page__steps",
							steps: (0, vue_exports.unref)(STEPS),
							current: (0, vue_exports.unref)(state).step,
							reached: (0, vue_exports.unref)(state).released ? -1 : Math.min((0, vue_exports.unref)(STEPS).length - 1, (0, vue_exports.unref)(state).reached + 1),
							label: "Schritte zum Gutachten",
							onGo: (0, vue_exports.unref)(store).go
						}, null, 8, [
							"steps",
							"current",
							"reached",
							"onGo"
						]),
						(0, vue_exports.createVNode)("p", {
							class: "visually-hidden",
							"aria-live": "polite"
						}, "Schritt " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(state).step + 1) + " von " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(STEPS).length) + ": " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(STEPS)[(0, vue_exports.unref)(state).step]), 1),
						(0, vue_exports.unref)(state).step === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(StepPaper_default, { key: 0 })) : (0, vue_exports.unref)(state).step === 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(StepWheel_default, { key: 1 })) : (0, vue_exports.unref)(state).step === 2 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(StepCars_default, { key: 2 })) : (0, vue_exports.unref)(state).step === 3 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(StepTyres_default, { key: 3 })) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(StepRelease_default, { key: 4 }))
					];
				}),
				_: 1
			}, _parent));
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Skizze/Gutachten.vue
var _sfc_setup = Gutachten_vue_vue_type_script_setup_true_lang_default.setup;
Gutachten_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Skizze/Gutachten.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Gutachten_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Gutachten_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-ff5a262d"]]);
//#endregion
export { Gutachten_default as default };
