import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-D0z-a8p_.js";
import { t as AdminConfirm_default } from "./AdminConfirm-sC9Lzvnq.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { a as carLine, c as distinctCars, f as send, h as useGutachtenPage, m as useEntry, n as Refused } from "./entryStore-XWwzBuxT.js";
import { t as VehicleFromDocument_default } from "./VehicleFromDocument-DTCGGUYA.js";
//#region resources/js/Pages/Admin/Gutachten/Erfassung/StepCars.vue?vue&type=script&setup=true&lang.ts
var StepCars_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "StepCars",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* Step 3, Fahrzeuge (the client's change of 05.11.2026: „search for vehicles using their details, such as HSN/TSN, model,
		* approval number … All groupings should be removed“): one search field, single cars with HSN/TSN, kW and field K, ticked one
		* by one. „Alle Treffer auswählen“ ticks every result of the search as it stands — a shortcut: nothing is stored as a group,
		* and nothing joins by itself later. The selection beside it lists cars.
		*/
		const store = useEntry();
		const { state, go } = store;
		const page = useGutachtenPage();
		const query = (0, vue_exports.ref)("");
		const hits = (0, vue_exports.ref)([]);
		const total = (0, vue_exports.ref)(0);
		const searching = (0, vue_exports.ref)(false);
		const searched = (0, vue_exports.ref)(false);
		const answered = (0, vue_exports.ref)("");
		const failure = (0, vue_exports.ref)("");
		const busy = (0, vue_exports.ref)(false);
		const removing = (0, vue_exports.ref)(null);
		const removeOpen = (0, vue_exports.computed)({
			get: () => removing.value !== null,
			set: (open) => {
				if (!open) removing.value = null;
			}
		});
		const chosen = (0, vue_exports.computed)(() => distinctCars(state.entry.cars));
		const selected = (0, vue_exports.computed)(() => new Map(chosen.value.map((car) => [car.vehicleId, car])));
		const unticked = (0, vue_exports.computed)(() => hits.value.filter((hit) => !selected.value.has(hit.id)).length);
		const pageCount = (0, vue_exports.computed)(() => page.props.document.pageCount);
		let timer;
		let asked = 0;
		async function search() {
			const term = query.value.trim();
			const mine = ++asked;
			if (term.length < 2) {
				hits.value = [];
				total.value = 0;
				answered.value = "";
				searched.value = false;
				searching.value = false;
				return;
			}
			searching.value = true;
			try {
				const answer = await send("GET", `/admin/gutachten/suche/fahrzeuge?q=${encodeURIComponent(term)}`);
				if (mine === asked) {
					hits.value = answer.items;
					total.value = answer.total;
					answered.value = term;
					searched.value = true;
				}
			} catch {
				if (mine === asked) {
					hits.value = [];
					total.value = 0;
					answered.value = "";
					failure.value = "Die Suche hat nicht geantwortet. Versuch es noch einmal.";
				}
			} finally {
				if (mine === asked) searching.value = false;
			}
		}
		(0, vue_exports.watch)(query, () => {
			clearTimeout(timer);
			failure.value = "";
			timer = setTimeout(() => void search(), 250);
		});
		(0, vue_exports.onMounted)(() => document.getElementById("ef-cars-q")?.focus({ preventScroll: true }));
		async function add(body) {
			failure.value = "";
			try {
				await store.save("POST", "/fahrzeuge", body);
			} catch (error) {
				failure.value = error instanceof Refused ? error.message : "Das hat nicht geklappt. Versuch es noch einmal.";
			}
		}
		const leaving = /* @__PURE__ */ new Set();
		async function remove(car) {
			removing.value = null;
			if (leaving.has(car.id)) return;
			leaving.add(car.id);
			failure.value = "";
			try {
				await store.save("DELETE", `/fahrzeuge/${car.id}`);
			} catch (error) {
				failure.value = error instanceof Refused ? error.message : "Das hat nicht geklappt. Versuch es noch einmal.";
			} finally {
				leaving.delete(car.id);
			}
		}
		function created(vehicle) {
			add({ vehicle_ids: [vehicle.id] });
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "ef-step",
				"aria-labelledby": "ef-cars-h"
			}, _attrs))} data-v-addd0aeb><h2 id="ef-cars-h" class="adm-section__title" tabindex="-1" data-v-addd0aeb>Für welche Fahrzeuge gilt das Gutachten?</h2><p class="adm-note" data-v-addd0aeb>Such nach HSN/TSN, Marke und Modell, Fahrzeugtyp, Betriebserlaubnis (Feld K) oder kW und hak die Fahrzeuge an, die im Gutachten stehen.</p><div class="ef-cars" data-v-addd0aeb><div class="ef-cars__main" data-v-addd0aeb><div class="form-field" data-v-addd0aeb><label class="form-field__label" for="ef-cars-q" data-v-addd0aeb>Fahrzeug suchen</label><input id="ef-cars-q"${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="input" type="search" placeholder="z. B. 0005 BGU, BMW X3, X83, e1*2001/116*0249 oder 150 kW" autocomplete="off" spellcheck="false" data-v-addd0aeb></div>`);
			if (failure.value) _push(`<p class="adm-alert" role="alert" data-v-addd0aeb>${(0, server_renderer_exports.ssrInterpolate)(failure.value)}</p>`);
			else _push(`<!---->`);
			if (hits.value.length) {
				_push(`<div class="ef-cars__head" data-v-addd0aeb><span class="ef-count" role="status" data-v-addd0aeb>${(0, server_renderer_exports.ssrInterpolate)(total.value === 1 ? "1 Treffer" : `${(0, vue_exports.unref)(decimal)(total.value, 0)} Treffer`)}`);
				if (total.value > hits.value.length) _push(`<!--[-->, die ersten ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(hits.value.length, 0))} stehen hier<!--]-->`);
				else _push(`<!---->`);
				_push(`</span>`);
				if ((0, vue_exports.unref)(state).editable) _push(`<button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value || searching.value || query.value.trim() !== answered.value || unticked.value === 0 && total.value === hits.value.length) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-addd0aeb>Alle Treffer auswählen</button>`);
				else _push(`<!---->`);
				_push(`</div>`);
			} else _push(`<!---->`);
			if (hits.value.length) {
				_push(`<ul class="ef-hits" data-v-addd0aeb><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(hits.value, (hit) => {
					_push(`<li class="ef-hit" data-v-addd0aeb><label class="ef-hit__label" data-v-addd0aeb><input type="checkbox"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(selected.value.has(hit.id)) ? " checked" : ""}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).editable) ? " disabled" : ""} data-v-addd0aeb><span class="ef-hit__text" data-v-addd0aeb><span class="ef-hit__name" data-v-addd0aeb>${(0, server_renderer_exports.ssrInterpolate)(hit.label)}</span><span class="ef-hit__facts" data-v-addd0aeb><span data-v-addd0aeb>${(0, server_renderer_exports.ssrInterpolate)(hit.hsnTsn ?? "HSN/TSN noch nicht hinterlegt")}</span><span data-v-addd0aeb>${(0, server_renderer_exports.ssrInterpolate)(hit.kw === null ? "kW nicht hinterlegt" : `${(0, vue_exports.unref)(decimal)(hit.kw, 0)} kW`)}</span><span data-v-addd0aeb>Feld K ${(0, server_renderer_exports.ssrInterpolate)(hit.k ?? "nicht hinterlegt")}</span>`);
					if (hit.window) _push(`<span data-v-addd0aeb>${(0, server_renderer_exports.ssrInterpolate)(hit.window)}</span>`);
					else _push(`<!---->`);
					if (hit.needsReview) _push(`<span class="adm-tag adm-tag--neutral" data-v-addd0aeb>Angaben für die Prüfung fehlen</span>`);
					else _push(`<!---->`);
					_push(`</span></span></label></li>`);
				});
				_push(`<!--]--></ul>`);
			} else if (searched.value && !searching.value) _push(`<p class="adm-note" data-v-addd0aeb>Kein Fahrzeug gefunden. Steht es so im Gutachten, leg es unten an.</p>`);
			else _push(`<!---->`);
			if ((0, vue_exports.unref)(state).editable) _push((0, server_renderer_exports.ssrRenderComponent)(VehicleFromDocument_default, {
				"document-id": (0, vue_exports.unref)(state).documentId,
				"page-count": pageCount.value,
				"body-forms": (0, vue_exports.unref)(page).props.choices.bodyForms,
				drives: (0, vue_exports.unref)(page).props.choices.drives,
				onCreated: created
			}, null, _parent));
			else _push(`<!---->`);
			_push(`</div><aside class="ef-cars__side" aria-labelledby="ef-chosen-h" data-v-addd0aeb><h3 id="ef-chosen-h" class="ef-side__title" data-v-addd0aeb>${(0, server_renderer_exports.ssrInterpolate)(chosen.value.length === 1 ? "1 Fahrzeug gewählt" : `${(0, vue_exports.unref)(decimal)(chosen.value.length, 0)} Fahrzeuge gewählt`)}</h3>`);
			if (chosen.value.length) {
				_push(`<ul class="ef-chosen" data-v-addd0aeb><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(chosen.value, (car) => {
					_push(`<li class="ef-chosen__car" data-v-addd0aeb><span class="ef-chosen__text" data-v-addd0aeb>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(carLine)(car.label))} `);
					if (car.finish || car.axle !== "ALL") _push(`<span class="ef-chosen__scope" data-v-addd0aeb>${(0, server_renderer_exports.ssrInterpolate)([car.finish ? `nur ${car.finish}` : "", car.axle === "FRONT" ? "nur Vorderachse" : car.axle === "REAR" ? "nur Hinterachse" : ""].filter(Boolean).join(" · "))}</span>`);
					else _push(`<!---->`);
					_push(`</span>`);
					if ((0, vue_exports.unref)(state).editable) {
						_push(`<button class="ef-iconbtn" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${car.label} entfernen`)} data-v-addd0aeb>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: "close",
							size: 16
						}, null, _parent));
						_push(`</button>`);
					} else _push(`<!---->`);
					_push(`</li>`);
				});
				_push(`<!--]--></ul>`);
			} else _push(`<p class="adm-note" data-v-addd0aeb>Noch keines. Hak die Fahrzeuge an, die im Gutachten stehen.</p>`);
			_push(`</aside></div><div class="ef-actions" data-v-addd0aeb><button class="btn btn--secondary ef-actions__left" type="button" data-v-addd0aeb>Zurück</button><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(chosen.value.length === 0) ? " disabled" : ""} data-v-addd0aeb> Weiter: Reifen `);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "arrow-right",
				size: 20
			}, null, _parent));
			_push(`</button></div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
				open: removeOpen.value,
				"onUpdate:open": ($event) => removeOpen.value = $event,
				title: "Fahrzeug entfernen?",
				body: removing.value ? `${removing.value.label} wird aus dieser Erfassung entfernt, mit seinen eingetragenen Reifen.` : "",
				"confirm-label": "Entfernen",
				onConfirm: ($event) => removing.value && remove(removing.value)
			}, null, _parent));
			_push(`</section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Erfassung/StepCars.vue
var StepCars_exports = /* @__PURE__ */ __exportAll({ default: () => StepCars_default });
var _sfc_setup = StepCars_vue_vue_type_script_setup_true_lang_default.setup;
StepCars_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Erfassung/StepCars.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var StepCars_default = /*#__PURE__*/ _plugin_vue_export_helper_default(StepCars_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-addd0aeb"]]);
//#endregion
export { StepCars_exports as n, StepCars_default as t };
