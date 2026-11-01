import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { c as EMPTY_ROW, o as useSketch, x as kwRange, y as documented } from "./gutachtenStore-DERNJqCs.js";
//#region resources/js/Pages/Admin/Skizze/parts/StepCars.vue?vue&type=script&setup=true&lang.ts
var StepCars_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "StepCars",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* Step 3, Fahrzeuge (the brief §7): staff search the way the paper is written — approval number, type, model or HSN/TSN —
		* and take over a row of the paper as one group: its approval number and kW range link every matching car. A group opens
		* to untick a car; a car whose field K matches but which has no kW is offered to add by hand; a row with no car in the
		* database creates one here, its provenance „aus diesem Gutachten" set by itself.
		*/
		const store = useSketch();
		const { state, go } = store;
		const query = (0, vue_exports.ref)("");
		const open = (0, vue_exports.ref)(null);
		const creating = (0, vue_exports.ref)(false);
		const draft = (0, vue_exports.reactive)({
			name: "BMW 3er (E46) 318i Limousine",
			hsn: "0005",
			tsn: "",
			kw: "87"
		});
		const groups = (0, vue_exports.computed)(() => {
			const q = query.value.trim().toLowerCase();
			return store.allGroups().filter((group) => {
				if (q === "") return true;
				return [
					group.sales,
					group.type,
					...group.approvals,
					...group.cars.map((car) => `${car.name} ${car.hsn} ${car.tsn} ${car.hsn}/${car.tsn}`)
				].join(" ").toLowerCase().includes(q);
			});
		});
		const emptyShown = (0, vue_exports.computed)(() => {
			const q = query.value.trim().toLowerCase();
			return !state.created.some((group) => group.id === EMPTY_ROW.id) && (q === "" || `${EMPTY_ROW.sales} ${EMPTY_ROW.type} ${EMPTY_ROW.approvals.join(" ")}`.toLowerCase().includes(q));
		});
		const carCount = (0, vue_exports.computed)(() => store.chosenGroups().reduce((sum, group) => sum + store.carsOf(group).length, 0));
		function label(group) {
			return `${group.sales} · Typ ${group.type} · ${group.approvals.join(", ")} · ${kwRange(group.kwMin, group.kwMax)}`;
		}
		function cars(n) {
			return n === 1 ? "1 Fahrzeug" : `${n} Fahrzeuge`;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "sk-step",
				"aria-labelledby": "sk-cars-h"
			}, _attrs))} data-v-7ca852ce><h2 id="sk-cars-h" class="adm-section__title" tabindex="-1" data-v-7ca852ce>Für welche Fahrzeuge?</h2><p class="adm-note" data-v-7ca852ce>Eine Gruppe ist eine Zeile des Gutachtens: Genehmigungsnummer und kW-Bereich wie gedruckt. Sie verknüpft jedes passende Fahrzeug der Datenbank.</p><div class="sk-cars" data-v-7ca852ce><div class="sk-cars__main" data-v-7ca852ce><div class="form-field" data-v-7ca852ce><label class="form-field__label" for="sk-cars-q" data-v-7ca852ce>Fahrzeuge suchen</label><input id="sk-cars-q"${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="input" type="search" placeholder="Genehmigungsnummer, Typ, Modell oder HSN/TSN" autocomplete="off" data-v-7ca852ce></div><ul class="sk-results" aria-label="Treffer" data-v-7ca852ce><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(groups.value, (group) => {
				_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{ "sk-result--on": (0, vue_exports.unref)(state).groups.includes(group.id) }, "sk-result"])}" data-v-7ca852ce><div class="sk-result__head" data-v-7ca852ce><div class="sk-result__titles" data-v-7ca852ce><p class="sk-result__title" data-v-7ca852ce>${(0, server_renderer_exports.ssrInterpolate)(label(group))}</p><p class="sk-result__sub" data-v-7ca852ce>${(0, server_renderer_exports.ssrInterpolate)(cars(group.cars.length))} in der Datenbank`);
				if (group.withoutKw.length) _push(`<!--[--> · dazu ${(0, server_renderer_exports.ssrInterpolate)(group.withoutKw.length)} ohne kW-Angabe<!--]-->`);
				else _push(`<!---->`);
				if (group.notes) _push(`<!--[--> · im Gutachten: „${(0, server_renderer_exports.ssrInterpolate)(group.notes)}“<!--]-->`);
				else _push(`<!---->`);
				_push(`</p></div><button class="${(0, server_renderer_exports.ssrRenderClass)([(0, vue_exports.unref)(state).groups.includes(group.id) ? "btn--secondary" : "btn--primary", "btn"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", (0, vue_exports.unref)(state).groups.includes(group.id))} data-v-7ca852ce>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: (0, vue_exports.unref)(state).groups.includes(group.id) ? "check" : "plus",
					size: 20
				}, null, _parent));
				_push(` ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(state).groups.includes(group.id) ? "Übernommen" : "Gruppe übernehmen")}</button></div><button class="sk-result__toggle" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", open.value === group.id)} data-v-7ca852ce>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: open.value === group.id ? "chevron-up" : "chevron-down",
					size: 16
				}, null, _parent));
				_push(` Einzelne Fahrzeuge ansehen </button>`);
				if (open.value === group.id) {
					_push(`<div class="sk-result__cars" data-v-7ca852ce><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(group.cars, (car) => {
						_push(`<label class="check sk-car" data-v-7ca852ce><input type="checkbox"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).excluded.includes(car.id)) ? " checked" : ""}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).groups.includes(group.id)) ? " disabled" : ""} data-v-7ca852ce><span class="sk-car__name" data-v-7ca852ce>${(0, server_renderer_exports.ssrInterpolate)(car.name)}</span><span class="sk-car__meta" data-v-7ca852ce>HSN/TSN ${(0, server_renderer_exports.ssrInterpolate)(car.hsn)}/${(0, server_renderer_exports.ssrInterpolate)(car.tsn)} · ${(0, server_renderer_exports.ssrInterpolate)(car.kw === null ? "keine kW-Angabe" : (0, vue_exports.unref)(kwRange)(car.kw))} · Feld K ${(0, server_renderer_exports.ssrInterpolate)(car.k)}</span>`);
						if (!(0, vue_exports.unref)(documented)(car.provenance)) _push(`<span class="adm-tag adm-tag--neutral" data-v-7ca852ce>Herkunft nicht belegt</span>`);
						else _push(`<!---->`);
						_push(`</label>`);
					});
					_push(`<!--]--><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(group.withoutKw, (car) => {
						_push(`<div class="sk-car sk-car--nokw" data-v-7ca852ce><span class="sk-car__name" data-v-7ca852ce>${(0, server_renderer_exports.ssrInterpolate)(car.name)}</span><span class="sk-car__meta" data-v-7ca852ce>HSN/TSN ${(0, server_renderer_exports.ssrInterpolate)(car.hsn)}/${(0, server_renderer_exports.ssrInterpolate)(car.tsn)} · Feld K ${(0, server_renderer_exports.ssrInterpolate)(car.k)} · keine kW-Angabe, deshalb nicht automatisch verknüpft</span>`);
						if (!(0, vue_exports.unref)(state).added.includes(car.id)) _push(`<button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(state).groups.includes(group.id)) ? " disabled" : ""} data-v-7ca852ce>Von Hand hinzufügen</button>`);
						else _push(`<span class="sk-count" data-v-7ca852ce>hinzugefügt</span>`);
						_push(`</div>`);
					});
					_push(`<!--]--></div>`);
				} else _push(`<!---->`);
				_push(`</li>`);
			});
			_push(`<!--]-->`);
			if (emptyShown.value) {
				_push(`<li class="sk-result sk-result--empty" data-v-7ca852ce><div class="sk-result__head" data-v-7ca852ce><div class="sk-result__titles" data-v-7ca852ce><p class="sk-result__title" data-v-7ca852ce>${(0, server_renderer_exports.ssrInterpolate)(label((0, vue_exports.unref)(EMPTY_ROW)))}</p><p class="sk-result__sub" data-v-7ca852ce>Noch kein Fahrzeug erfasst · im Gutachten: „${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(EMPTY_ROW).notes)}“</p></div>`);
				if (!creating.value) {
					_push(`<button class="btn btn--secondary" type="button" data-v-7ca852ce>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "plus",
						size: 20
					}, null, _parent));
					_push(` Fahrzeug anlegen </button>`);
				} else _push(`<!---->`);
				_push(`</div>`);
				if (creating.value) _push(`<form class="sk-create" data-v-7ca852ce><p class="adm-note" data-v-7ca852ce>Herkunft: aus diesem Gutachten. Feld K und kW-Bereich kommen aus der Zeile.</p><div class="sk-create__grid" data-v-7ca852ce><div class="form-field" data-v-7ca852ce><label class="form-field__label" for="sk-new-name" data-v-7ca852ce>Bezeichnung</label><input id="sk-new-name"${(0, server_renderer_exports.ssrRenderAttr)("value", draft.name)} class="input" type="text" data-v-7ca852ce></div><div class="form-field" data-v-7ca852ce><label class="form-field__label" for="sk-new-hsn" data-v-7ca852ce>HSN</label><input id="sk-new-hsn"${(0, server_renderer_exports.ssrRenderAttr)("value", draft.hsn)} class="input" type="text" inputmode="numeric" maxlength="4" data-v-7ca852ce></div><div class="form-field" data-v-7ca852ce><label class="form-field__label" for="sk-new-tsn" data-v-7ca852ce>TSN</label><input id="sk-new-tsn"${(0, server_renderer_exports.ssrRenderAttr)("value", draft.tsn)} class="input" type="text" maxlength="8" placeholder="z. B. 589" data-v-7ca852ce></div><div class="form-field" data-v-7ca852ce><label class="form-field__label" for="sk-new-kw" data-v-7ca852ce>kW</label><input id="sk-new-kw"${(0, server_renderer_exports.ssrRenderAttr)("value", draft.kw)} class="input" type="text" inputmode="numeric" data-v-7ca852ce></div></div><div class="sk-create__actions" data-v-7ca852ce><button class="btn btn--ghost" type="button" data-v-7ca852ce>Abbrechen</button><button class="btn btn--primary" type="submit" data-v-7ca852ce>Anlegen und übernehmen</button></div></form>`);
				else _push(`<!---->`);
				_push(`</li>`);
			} else _push(`<!---->`);
			_push(`</ul>`);
			if (groups.value.length === 0 && !emptyShown.value) _push(`<p class="adm-note" data-v-7ca852ce>Nichts gefunden. Versuch es mit „X83“, „G191“ oder „0005“.</p>`);
			else _push(`<!---->`);
			_push(`</div><aside class="sk-chosen" aria-labelledby="sk-chosen-h" data-v-7ca852ce><h3 id="sk-chosen-h" class="sk-chosen__title" data-v-7ca852ce>Ausgewählt</h3><p class="sk-count" data-v-7ca852ce>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(state).groups.length)} ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(state).groups.length === 1 ? "Gruppe" : "Gruppen")} · ${(0, server_renderer_exports.ssrInterpolate)(cars(carCount.value))}</p><ul class="sk-chosen__list" data-v-7ca852ce><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(store).chosenGroups(), (group) => {
				_push(`<li class="sk-chosen__item" data-v-7ca852ce><span data-v-7ca852ce><span class="sk-chosen__name" data-v-7ca852ce>${(0, server_renderer_exports.ssrInterpolate)(group.sales)} (${(0, server_renderer_exports.ssrInterpolate)(group.type)})</span><span class="sk-chosen__sub" data-v-7ca852ce>${(0, server_renderer_exports.ssrInterpolate)(group.approvals.join(", "))} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(kwRange)(group.kwMin, group.kwMax))} · ${(0, server_renderer_exports.ssrInterpolate)(cars((0, vue_exports.unref)(store).carsOf(group).length))}</span></span><button class="sk-chosen__remove" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${group.sales} entfernen`)} data-v-7ca852ce>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "close",
					size: 16
				}, null, _parent));
				_push(`</button></li>`);
			});
			_push(`<!--]--></ul>`);
			if ((0, vue_exports.unref)(state).groups.length === 0) _push(`<p class="adm-note" data-v-7ca852ce>Noch keine Gruppe. Übernimm die Zeilen des Gutachtens mit „Gruppe übernehmen“.</p>`);
			else _push(`<!---->`);
			_push(`</aside></div><div class="sk-actions" data-v-7ca852ce><button class="btn btn--secondary sk-actions__left" type="button" data-v-7ca852ce>Zurück</button><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(state).groups.length === 0) ? " disabled" : ""} data-v-7ca852ce> Weiter: Reifen `);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "arrow-right",
				size: 20
			}, null, _parent));
			_push(`</button></div></section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Skizze/parts/StepCars.vue
var StepCars_exports = /* @__PURE__ */ __exportAll({ default: () => StepCars_default });
var _sfc_setup = StepCars_vue_vue_type_script_setup_true_lang_default.setup;
StepCars_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Skizze/parts/StepCars.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var StepCars_default = /*#__PURE__*/ _plugin_vue_export_helper_default(StepCars_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-7ca852ce"]]);
//#endregion
export { StepCars_exports as n, StepCars_default as t };
