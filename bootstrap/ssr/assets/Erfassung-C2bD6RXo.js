import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BA7BbMo6.js";
import { d as vue_exports, l as router, s as usePage } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { r as claimPopstateGuard } from "./useDirtyForm-CUSvyfaU.js";
import { t as StepBar_default } from "./StepBar-sa7xSQ0s.js";
import { r as STEPS, s as createEntryStore, t as ENTRY } from "./entryStore-DmyNlH0L.js";
import { t as StepCars_default } from "./StepCars-WPOxxB0a.js";
import { t as StepPaper_default } from "./StepPaper-38lc18GD.js";
import { t as StepRelease_default } from "./StepRelease-DkQSj3XB.js";
import { t as StepTyres_default } from "./StepTyres-B8qTXuhu.js";
import { t as StepWheel_default } from "./StepWheel-BmDEmQFf.js";
//#region resources/js/Pages/Admin/Gutachten/Erfassung.vue?vue&type=script&setup=true&lang.ts
var Erfassung_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Erfassung",
	__ssrInlineRender: true,
	props: {
		stamps: {},
		document: {},
		rowsTotal: {},
		vehicles: {},
		blockers: {},
		preview: {},
		previewVehicle: {},
		conditions: {},
		choices: {},
		unresolved: {},
		kinds: {},
		replaceable: {},
		supplementable: {},
		fasteners: {},
		notices: {},
		reworks: {},
		derating: {},
		openConflicts: {},
		can: {},
		revisionDraft: {},
		levels: {},
		levelFloorSentence: {},
		entry: {},
		schritt: {},
		zeile: {},
		weiter: {}
	},
	setup(__props) {
		/**
		* Gutachten › one draft: the five steps (the Gutachten rework, Phase 2) — Gutachten, Felge, Fahrzeuge, Reifen, Freigeben — in one
		* order that never changes, every change saved as it happens. The address carries the step and the car, so a step can be sent as a
		* link; coming back without one resumes where this browser left off, else at the first thing still open. Leaving while something
		* typed is on its way waits for it, and a link or Back only goes on once the server holds it; a reload asks first.
		*/
		const props = __props;
		const page = usePage();
		const STORE_KEY = `rimify-erfassung-${props.document.id}`;
		const store = createEntryStore({
			documentId: props.document.id,
			entry: props.entry,
			step: (props.schritt ?? props.weiter) - 1,
			car: props.zeile ?? props.entry.cars.find((car) => !car.done)?.id ?? props.entry.cars[0]?.id ?? null,
			editable: props.can.edit,
			remember: (entry) => router.replaceProp("entry", entry)
		});
		const { state } = store;
		(0, vue_exports.provide)(ENTRY, store);
		(0, vue_exports.watch)(() => props.entry, (entry) => {
			state.entry = entry;
		});
		const saving = (0, vue_exports.computed)(() => {
			switch (state.save) {
				case "saving": return "wird gespeichert …";
				case "failed": return "nicht gespeichert";
				default: return "wird beim Tippen gespeichert";
			}
		});
		const context = (0, vue_exports.computed)(() => `${props.document.statusLabel} · Schritt ${state.step + 1} von ${STEPS.length} · ${saving.value}`);
		const more = (0, vue_exports.computed)(() => props.document.pdfUrl ? [{
			label: "PDF öffnen",
			href: props.document.pdfUrl,
			external: true,
			icon: "documents"
		}] : []);
		let ownState = null;
		let ownUrl = "";
		let letThrough = false;
		function rememberOwn() {
			ownState = window.history.state;
			ownUrl = window.location.href;
		}
		function holdBack(event) {
			if (letThrough) {
				letThrough = false;
				return false;
			}
			if (!store.unsaved() || event.state === null || ownState === null) return false;
			window.history.pushState(ownState, "", ownUrl);
			store.settled().then((ok) => {
				if (ok) {
					letThrough = true;
					window.history.back();
				}
			});
			return true;
		}
		function askBeforeReload(event) {
			if (store.unsaved()) {
				event.preventDefault();
				event.returnValue = "";
			}
		}
		function tryAgain() {
			store.settled();
		}
		const unbind = [];
		(0, vue_exports.onMounted)(() => {
			rememberOwn();
			window.addEventListener("beforeunload", askBeforeReload);
			window.addEventListener("online", tryAgain);
			unbind.push(claimPopstateGuard(holdBack), router.on("navigate", rememberOwn), router.on("success", rememberOwn), router.on("before", (event) => {
				const visit = event.detail.visit;
				if (visit.method !== "get" || visit.async || visit.prefetch || visit.url.pathname === window.location.pathname || !store.unsaved()) return;
				event.preventDefault();
				store.settled().then((ok) => {
					if (ok) router.visit(visit.url.href);
				});
			}));
			if (props.schritt === null) try {
				const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null");
				if (saved !== null && typeof saved.step === "number" && saved.step <= store.furthest()) state.step = saved.step;
				if (saved !== null && typeof saved.car === "number" && store.car(saved.car) !== void 0) state.carId = saved.car;
			} catch {}
			(0, vue_exports.watch)(() => [state.step, state.carId], ([step, car]) => {
				const url = new URL(window.location.href);
				url.searchParams.set("schritt", String(step + 1));
				if (step === 3 && car !== null) url.searchParams.set("zeile", String(car));
				else url.searchParams.delete("zeile");
				router.replace({
					url: url.pathname + url.search + url.hash,
					preserveScroll: true,
					preserveState: true,
					props: (current) => ({
						...current,
						schritt: step + 1,
						zeile: step === 3 ? car : null
					})
				});
				try {
					localStorage.setItem(STORE_KEY, JSON.stringify({
						step,
						car
					}));
				} catch {}
			}, { immediate: true });
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			window.removeEventListener("beforeunload", askBeforeReload);
			window.removeEventListener("online", tryAgain);
			unbind.forEach((off) => off());
		});
		const releaseError = (0, vue_exports.computed)(() => (page.props.errors ?? {}).release ?? "");
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: __props.document.label,
				context: context.value,
				more: more.value,
				"read-only": !__props.can.edit
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)(StepBar_default, {
							class: "ef-page__steps",
							steps: (0, vue_exports.unref)(STEPS),
							current: (0, vue_exports.unref)(state).step,
							reached: (0, vue_exports.unref)(store).furthest(),
							label: "Schritte zum Gutachten",
							onGo: (0, vue_exports.unref)(store).go
						}, null, _parent, _scopeId));
						_push(`<p class="visually-hidden" aria-live="polite" data-v-b5960825${_scopeId}>Schritt ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(state).step + 1)} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(STEPS).length)}: ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(STEPS)[(0, vue_exports.unref)(state).step])}</p>`);
						if (releaseError.value && (0, vue_exports.unref)(state).step !== 4) _push(`<p class="adm-alert" role="alert" data-v-b5960825${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(releaseError.value)}</p>`);
						else _push(`<!---->`);
						if ((0, vue_exports.unref)(state).step === 0) _push((0, server_renderer_exports.ssrRenderComponent)(StepPaper_default, null, null, _parent, _scopeId));
						else if ((0, vue_exports.unref)(state).step === 1) _push((0, server_renderer_exports.ssrRenderComponent)(StepWheel_default, null, null, _parent, _scopeId));
						else if ((0, vue_exports.unref)(state).step === 2) _push((0, server_renderer_exports.ssrRenderComponent)(StepCars_default, null, null, _parent, _scopeId));
						else if ((0, vue_exports.unref)(state).step === 3) _push((0, server_renderer_exports.ssrRenderComponent)(StepTyres_default, null, null, _parent, _scopeId));
						else _push((0, server_renderer_exports.ssrRenderComponent)(StepRelease_default, null, null, _parent, _scopeId));
					} else return [
						(0, vue_exports.createVNode)(StepBar_default, {
							class: "ef-page__steps",
							steps: (0, vue_exports.unref)(STEPS),
							current: (0, vue_exports.unref)(state).step,
							reached: (0, vue_exports.unref)(store).furthest(),
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
						releaseError.value && (0, vue_exports.unref)(state).step !== 4 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-alert",
							role: "alert"
						}, (0, vue_exports.toDisplayString)(releaseError.value), 1)) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.unref)(state).step === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(StepPaper_default, { key: 1 })) : (0, vue_exports.unref)(state).step === 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(StepWheel_default, { key: 2 })) : (0, vue_exports.unref)(state).step === 2 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(StepCars_default, { key: 3 })) : (0, vue_exports.unref)(state).step === 3 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(StepTyres_default, { key: 4 })) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(StepRelease_default, { key: 5 }))
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Erfassung.vue
var _sfc_setup = Erfassung_vue_vue_type_script_setup_true_lang_default.setup;
Erfassung_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Erfassung.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Erfassung_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Erfassung_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-b5960825"]]);
//#endregion
export { Erfassung_default as default };
