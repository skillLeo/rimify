import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import "./focusRefused-BCX3fX_F.js";
import { i as emptyRow, t as RowFields_default } from "./RowFields-oIGHC7_9.js";
import { t as VehicleFromDocument_default } from "./VehicleFromDocument-C3MxWdOJ.js";
//#region resources/js/Pages/Admin/Gutachten/RowComposer.vue?vue&type=script&setup=true&lang.ts
var RowComposer_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "RowComposer",
	__ssrInlineRender: true,
	props: {
		documentId: {},
		conditions: {},
		pageCount: {},
		bodyForms: {},
		drives: {}
	},
	emits: ["done"],
	setup(__props, { emit: __emit }) {
		const root = (0, vue_exports.ref)(null);
		(0, vue_exports.ref)(null);
		async function search(url) {
			try {
				const response = await fetch(url, {
					credentials: "same-origin",
					headers: {
						Accept: "application/json",
						"X-Requested-With": "XMLHttpRequest"
					}
				});
				return response.ok ? await response.json() : null;
			} catch {
				return null;
			}
		}
		const vehicleTerm = (0, vue_exports.ref)("");
		const vehicleHits = (0, vue_exports.ref)([]);
		const vehicleMore = (0, vue_exports.ref)(false);
		const vehicleFailed = (0, vue_exports.ref)(false);
		/** The term the list on screen answers, or null before the first answer. */
		const vehicleAnswered = (0, vue_exports.ref)(null);
		const chosenVehicles = (0, vue_exports.ref)([]);
		const wheelTerm = (0, vue_exports.ref)("");
		const wheelGroups = (0, vue_exports.ref)([]);
		const wheelMore = (0, vue_exports.ref)(false);
		const wheelFailed = (0, vue_exports.ref)(false);
		const wheelAnswered = (0, vue_exports.ref)(null);
		const chosenSizes = (0, vue_exports.ref)([]);
		let vehicleTimer;
		let wheelTimer;
		let vehicleAsked = 0;
		let wheelAsked = 0;
		async function findVehicles(term) {
			clearTimeout(vehicleTimer);
			const asked = ++vehicleAsked;
			const answer = await search(`/admin/gutachten/suche/fahrzeuge?q=${encodeURIComponent(term)}`);
			if (asked !== vehicleAsked) return;
			vehicleFailed.value = answer === null;
			vehicleHits.value = answer?.items ?? [];
			vehicleMore.value = answer?.more ?? false;
			vehicleAnswered.value = answer === null ? null : term;
		}
		async function findWheels(term) {
			clearTimeout(wheelTimer);
			const asked = ++wheelAsked;
			const answer = await search(`/admin/gutachten/suche/felgen?q=${encodeURIComponent(term)}`);
			if (asked !== wheelAsked) return;
			wheelFailed.value = answer === null;
			wheelGroups.value = answer?.groups ?? [];
			wheelMore.value = answer?.more ?? false;
			wheelAnswered.value = answer === null ? null : term;
		}
		(0, vue_exports.watch)(vehicleTerm, (term) => {
			clearTimeout(vehicleTimer);
			vehicleTimer = setTimeout(() => void findVehicles(term), 250);
		});
		(0, vue_exports.watch)(wheelTerm, (term) => {
			clearTimeout(wheelTimer);
			wheelTimer = setTimeout(() => void findWheels(term), 250);
		});
		(0, vue_exports.onMounted)(() => {
			findVehicles("");
			findWheels("");
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			clearTimeout(vehicleTimer);
			clearTimeout(wheelTimer);
		});
		function hasVehicle(id) {
			return chosenVehicles.value.some((v) => v.id === id);
		}
		function hasSize(id) {
			return chosenSizes.value.some((s) => s.id === id);
		}
		function wholeModel(group) {
			return group.sizes.every((s) => hasSize(s.id));
		}
		/** Some of a model's sizes, not all: the model's box shows it as mixed. */
		function partlyChosen(group) {
			return !wholeModel(group) && group.sizes.some((s) => hasSize(s.id));
		}
		function modelLabel(group) {
			const n = group.sizes.length;
			return group.partial ? `${group.model} – die ${n} gezeigten Größen` : `${group.model} – ${n === 1 ? "die eine Größe" : `alle ${n} Größen`}`;
		}
		const adoptedId = (0, vue_exports.ref)(null);
		const adopted = (0, vue_exports.computed)(() => {
			const vehicle = chosenVehicles.value.find((v) => v.id === adoptedId.value);
			return vehicle ? `${vehicle.label} ist angelegt und gewählt.` : "";
		});
		function adopt(vehicle) {
			clearTimeout(vehicleTimer);
			vehicleAsked++;
			vehicleHits.value = [vehicle, ...vehicleHits.value.filter((v) => v.id !== vehicle.id)];
			if (!hasVehicle(vehicle.id)) chosenVehicles.value = [...chosenVehicles.value, vehicle];
			adoptedId.value = vehicle.id;
		}
		/** What a vehicle still lacks for a verdict (R-03) — said once, not guessed per field. */
		function missing(hit) {
			return hit.needsReview ? " · Angaben für die Prüfung fehlen" : "";
		}
		const form = (0, vue_exports.ref)(emptyRow());
		const errors = (0, vue_exports.ref)({});
		const busy = (0, vue_exports.ref)(false);
		const count = (0, vue_exports.computed)(() => chosenVehicles.value.length * chosenSizes.value.length);
		/** Sentences about a chosen vehicle, size or Auflage that went away meanwhile: said at the button. */
		const choiceErrors = (0, vue_exports.computed)(() => Object.entries(errors.value).filter(([key, message]) => message && /^(vehicle_ids|config_ids|conditions)\.\d+/.test(key)).map(([, message]) => message).filter((message, index, all) => all.indexOf(message) === index));
		/** A size line removed or edited: its old sentence no longer belongs to the line now in its place. */
		function sizesChanged() {
			errors.value = Object.fromEntries(Object.entries(errors.value).filter(([key]) => !key.startsWith("tyre_sizes")));
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				ref_key: "root",
				ref: root,
				class: "rc"
			}, _attrs))} data-v-92e6afe5><div class="rc-pick" data-v-92e6afe5><section class="rc-col" aria-labelledby="rc-h-vehicles" data-v-92e6afe5><h3 id="rc-h-vehicles" class="rc-col__title" data-v-92e6afe5>Fahrzeuge</h3><label class="visually-hidden" for="rc-vehicle-q" data-v-92e6afe5>Fahrzeuge suchen</label><input id="rc-vehicle-q"${(0, server_renderer_exports.ssrRenderAttr)("value", vehicleTerm.value)} class="input" type="search" placeholder="Marke, Modell, Fahrzeugtyp, EG-Nummer oder HSN/TSN" autocomplete="off" data-v-92e6afe5>`);
			if (vehicleFailed.value) _push(`<div class="rc-failed" data-v-92e6afe5><p class="form-field__error" data-v-92e6afe5>Die Suche antwortet gerade nicht.</p><button class="btn btn--ghost" type="button" data-v-92e6afe5>Noch einmal suchen</button></div>`);
			else _push(`<!---->`);
			if (vehicleHits.value.length) {
				_push(`<ul class="rc-hits" data-v-92e6afe5><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(vehicleHits.value, (hit) => {
					_push(`<li data-v-92e6afe5><label class="rc-hit" data-v-92e6afe5><input type="checkbox"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(hasVehicle(hit.id)) ? " checked" : ""} data-v-92e6afe5><span data-v-92e6afe5><span class="rc-hit__label" data-v-92e6afe5>${(0, server_renderer_exports.ssrInterpolate)(hit.label)}</span><span class="rc-hit__sub" data-v-92e6afe5>${(0, server_renderer_exports.ssrInterpolate)(hit.window)}${(0, server_renderer_exports.ssrInterpolate)(missing(hit))}</span></span></label></li>`);
				});
				_push(`<!--]--></ul>`);
			} else if (vehicleAnswered.value !== null && !vehicleFailed.value) _push(`<p class="adm-note" role="status" data-v-92e6afe5>${(0, server_renderer_exports.ssrInterpolate)(vehicleAnswered.value === "" ? "Es gibt noch keine Fahrzeuge." : `Kein Fahrzeug passt zu „${vehicleAnswered.value}“.`)}</p>`);
			else _push(`<!---->`);
			if (vehicleMore.value) _push(`<p class="form-field__help" data-v-92e6afe5>Mehr Treffer, als hier Platz haben. Such genauer.</p>`);
			else _push(`<!---->`);
			if (chosenVehicles.value.length) {
				_push(`<ul class="rc-chips" aria-label="Gewählte Fahrzeuge" data-v-92e6afe5><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(chosenVehicles.value, (vehicle) => {
					_push(`<li class="rc-chip" data-v-92e6afe5><span data-v-92e6afe5>${(0, server_renderer_exports.ssrInterpolate)(vehicle.label)}</span><button class="adm-iconbtn rc-chip__x" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${vehicle.label} abwählen`)} data-v-92e6afe5>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "close",
						size: 16
					}, null, _parent));
					_push(`</button></li>`);
				});
				_push(`<!--]--></ul>`);
			} else _push(`<!---->`);
			if (errors.value.vehicle_ids) _push(`<p class="form-field__error" data-v-92e6afe5>${(0, server_renderer_exports.ssrInterpolate)(errors.value.vehicle_ids)}</p>`);
			else _push(`<!---->`);
			if (adopted.value) _push(`<p class="adm-note" role="status" data-v-92e6afe5>${(0, server_renderer_exports.ssrInterpolate)(adopted.value)}</p>`);
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(VehicleFromDocument_default, {
				"document-id": __props.documentId,
				"page-count": __props.pageCount,
				"body-forms": __props.bodyForms,
				drives: __props.drives,
				onCreated: adopt
			}, null, _parent));
			_push(`</section><section class="rc-col" aria-labelledby="rc-h-sizes" data-v-92e6afe5><h3 id="rc-h-sizes" class="rc-col__title" data-v-92e6afe5>Felgengrößen</h3><label class="visually-hidden" for="rc-wheel-q" data-v-92e6afe5>Felgengrößen suchen</label><input id="rc-wheel-q"${(0, server_renderer_exports.ssrRenderAttr)("value", wheelTerm.value)} class="input" type="search" placeholder="Marke, Modell oder SKU" autocomplete="off" data-v-92e6afe5>`);
			if (wheelFailed.value) _push(`<div class="rc-failed" data-v-92e6afe5><p class="form-field__error" data-v-92e6afe5>Die Suche antwortet gerade nicht.</p><button class="btn btn--ghost" type="button" data-v-92e6afe5>Noch einmal suchen</button></div>`);
			else _push(`<!---->`);
			if (wheelGroups.value.length) {
				_push(`<div class="rc-sizes" data-v-92e6afe5><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(wheelGroups.value, (group) => {
					_push(`<div class="rc-group" data-v-92e6afe5><label class="rc-hit rc-hit--model" data-v-92e6afe5><input type="checkbox"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(wholeModel(group)) ? " checked" : ""}${(0, server_renderer_exports.ssrRenderAttr)("indeterminate", partlyChosen(group))} data-v-92e6afe5><span class="rc-hit__label" data-v-92e6afe5>${(0, server_renderer_exports.ssrInterpolate)(modelLabel(group))}</span>`);
					if (group.demo) _push(`<span class="adm-tag adm-tag--neutral" data-v-92e6afe5>Demodaten</span>`);
					else _push(`<!---->`);
					_push(`</label><ul class="rc-hits rc-hits--sizes" data-v-92e6afe5><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(group.sizes, (size) => {
						_push(`<li data-v-92e6afe5><label class="rc-hit" data-v-92e6afe5><input type="checkbox"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(hasSize(size.id)) ? " checked" : ""} data-v-92e6afe5><span data-v-92e6afe5><span class="rc-hit__label" data-v-92e6afe5>${(0, server_renderer_exports.ssrInterpolate)(size.label)}</span><span class="rc-hit__sub" data-v-92e6afe5>${(0, server_renderer_exports.ssrInterpolate)(size.finish)} · ${(0, server_renderer_exports.ssrInterpolate)(size.sku)}</span></span></label></li>`);
					});
					_push(`<!--]--></ul></div>`);
				});
				_push(`<!--]--></div>`);
			} else if (wheelAnswered.value !== null && !wheelFailed.value) _push(`<p class="adm-note" role="status" data-v-92e6afe5>${(0, server_renderer_exports.ssrInterpolate)(wheelAnswered.value === "" ? "Im Katalog gibt es noch keine Felge." : `Keine Felge passt zu „${wheelAnswered.value}“.`)}</p>`);
			else _push(`<!---->`);
			if (wheelMore.value) _push(`<p class="form-field__help" data-v-92e6afe5>Mehr Größen, als hier Platz haben. Such genauer, zum Beispiel nach dem Modell.</p>`);
			else _push(`<!---->`);
			if (chosenSizes.value.length) _push(`<p class="rc-summary" data-v-92e6afe5>${(0, server_renderer_exports.ssrInterpolate)(chosenSizes.value.length === 1 ? "1 Größe gewählt" : `${chosenSizes.value.length} Größen gewählt`)}</p>`);
			else _push(`<!---->`);
			if (errors.value.config_ids) _push(`<p class="form-field__error" data-v-92e6afe5>${(0, server_renderer_exports.ssrInterpolate)(errors.value.config_ids)}</p>`);
			else _push(`<!---->`);
			_push(`</section></div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(RowFields_default, {
				form: form.value,
				"onUpdate:form": ($event) => form.value = $event,
				conditions: __props.conditions,
				errors: errors.value,
				"id-prefix": "rc",
				"page-count": __props.pageCount,
				onSizesChanged: sizesChanged
			}, null, _parent));
			_push(`<div class="rc-foot" data-v-92e6afe5><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(count.value === 0 || busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-92e6afe5>${(0, server_renderer_exports.ssrInterpolate)(count.value === 0 ? "Zeilen anlegen" : count.value === 1 ? "1 Zeile anlegen" : `${count.value} Zeilen anlegen`)}</button>`);
			if (count.value === 0) _push(`<p class="adm-note" data-v-92e6afe5>Wähl mindestens ein Fahrzeug und mindestens eine Felgengröße.</p>`);
			else _push(`<p class="adm-note" data-v-92e6afe5>${(0, server_renderer_exports.ssrInterpolate)(chosenVehicles.value.length)} ${(0, server_renderer_exports.ssrInterpolate)(chosenVehicles.value.length === 1 ? "Fahrzeug" : "Fahrzeuge")} × ${(0, server_renderer_exports.ssrInterpolate)(chosenSizes.value.length)} ${(0, server_renderer_exports.ssrInterpolate)(chosenSizes.value.length === 1 ? "Größe" : "Größen")}, alle mit diesen Angaben.</p>`);
			_push(`<!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(choiceErrors.value, (message) => {
				_push(`<p class="form-field__error rc-foot__error" data-v-92e6afe5>${(0, server_renderer_exports.ssrInterpolate)(message)}</p>`);
			});
			_push(`<!--]--></div></div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/RowComposer.vue
var RowComposer_exports = /* @__PURE__ */ __exportAll({ default: () => RowComposer_default });
var _sfc_setup = RowComposer_vue_vue_type_script_setup_true_lang_default.setup;
RowComposer_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/RowComposer.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var RowComposer_default = /*#__PURE__*/ _plugin_vue_export_helper_default(RowComposer_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-92e6afe5"]]);
//#endregion
export { RowComposer_exports as n, RowComposer_default as t };
