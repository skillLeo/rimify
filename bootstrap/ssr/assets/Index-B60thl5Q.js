import { a as usePage, c as vue_exports, n as head_default, o as router } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { t as AdminLayout_default } from "./AdminLayout-2mZo5V0P.js";
import { t as Dialog_default } from "./Dialog-DGnwH3Iu.js";
//#region resources/js/Pages/Admin/Rdks/Index.vue?vue&type=script&setup=true&lang.ts
var BASE = "/admin/rdks-preise";
var EMPTY_TEXT = "Noch kein Preis hinterlegt. Wir fragen RDKS-Sensoren an der Kasse zwar ab, können sie aber für keine Marke berechnen.";
var CONFIRM_TEXT = "Preis wirklich löschen? An der Kasse können wir für diese Marke dann keine Sensoren mehr berechnen.";
var MONEY_HINT = "Preis in Euro, deutsch geschrieben – zum Beispiel 49,00.";
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		prices: {},
		makes: {},
		can: {}
	},
	setup(__props) {
		/**
		* RDKS-Sensorpreise je Marke.
		*
		* What one tyre-pressure sensor costs for one car make — per sensor, never per set: the checkout
		* multiplies by the number of Komplettrad wheels and shows `4 × 49,00 €`. A make without a row is a
		* make whose price nobody has confirmed, and the checkout says so rather than charging a number;
		* the empty state names that consequence.
		*
		* The make is free text with a datalist of the makes the vehicle table holds. The server keys it
		* (MakeName::key) so `VW`, `vw` and `Volkswagen` are one make, and the table shows that key beside
		* the label. The money field edits the German string the server sent and posts it back as typed;
		* the server parses it and refuses anything ambiguous. Every write is authorised on the server
		* (R-11); `can` only decides what is drawn.
		*/
		const props = __props;
		function blank() {
			return {
				make: "",
				price: "",
				active: true
			};
		}
		function keyNote(makeKey) {
			return `Wir merken uns die Marke als ${makeKey} – so finden wir sie auch bei anderer Schreibweise wieder.`;
		}
		const page = usePage();
		const form = (0, vue_exports.reactive)(blank());
		(0, vue_exports.ref)(null);
		/** The id being edited, or null while the form makes a new price. */
		const editing = (0, vue_exports.ref)(null);
		/** True once a request went out from this form: only then do the server's messages belong to it. */
		const sent = (0, vue_exports.ref)(false);
		const busy = (0, vue_exports.ref)(false);
		const confirming = (0, vue_exports.ref)(null);
		/** The server's validation messages, keyed by field. */
		const errors = (0, vue_exports.computed)(() => {
			const bag = page.props.errors;
			return sent.value && bag !== null && typeof bag === "object" ? bag : {};
		});
		const editingPrice = (0, vue_exports.computed)(() => props.prices.find((p) => p.id === editing.value) ?? null);
		const canWrite = (0, vue_exports.computed)(() => props.can.create || props.can.update);
		const canAct = (0, vue_exports.computed)(() => props.can.update || props.can.delete);
		const formTitle = (0, vue_exports.computed)(() => editingPrice.value === null ? "Neuer Preis" : `Preis bearbeiten: ${editingPrice.value.makeLabelDe}`);
		const makeError = (0, vue_exports.computed)(() => errors.value.makeKey ?? errors.value.makeLabelDe ?? "");
		const confirmOpen = (0, vue_exports.computed)({
			get: () => confirming.value !== null,
			set: (open) => {
				if (!open) confirming.value = null;
			}
		});
		function reset() {
			Object.assign(form, blank());
			editing.value = null;
			sent.value = false;
		}
		function remove() {
			const price = confirming.value;
			if (price === null) return;
			busy.value = true;
			router.delete(`${BASE}/${price.id}`, {
				preserveScroll: true,
				onSuccess: () => {
					confirming.value = null;
					if (editing.value === price.id) reset();
				},
				onFinish: () => {
					busy.value = false;
				}
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "RDKS-Sensorpreise je Marke" }, null, _parent));
			_push(`<div class="rd__head" data-v-24ef7cd4><h1 class="t-h1" data-v-24ef7cd4>RDKS-Sensorpreise je Marke</h1><p class="rd__lead" data-v-24ef7cd4> Der Preis gilt je Sensor; an der Kasse rechnen wir ihn mit der Zahl der Kompletträder hoch. Für eine Marke ohne Preis bieten wir keine Sensoren an. </p></div>`);
			if (canWrite.value) {
				_push(`<form class="rd__form"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-24ef7cd4><h2 class="t-h3 rd__form-title" data-v-24ef7cd4>${(0, server_renderer_exports.ssrInterpolate)(formTitle.value)}</h2><div class="rd__fields" data-v-24ef7cd4><div class="rd__field" data-v-24ef7cd4><label class="field-label" for="rd-make" data-v-24ef7cd4>Automarke <span class="field-label__req" data-v-24ef7cd4>*</span></label><input id="rd-make"${(0, server_renderer_exports.ssrRenderAttr)("value", form.make)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": makeError.value }, "field"])}" type="text" maxlength="64" autocomplete="off" list="rd-makes" aria-describedby="rd-make-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", makeError.value ? "true" : void 0)} data-v-24ef7cd4><datalist id="rd-makes" data-v-24ef7cd4><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.makes, (make) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", make)} data-v-24ef7cd4></option>`);
				});
				_push(`<!--]--></datalist><span id="rd-make-err" class="field-error" data-v-24ef7cd4>${(0, server_renderer_exports.ssrInterpolate)(makeError.value)}</span></div><div class="rd__field" data-v-24ef7cd4><label class="field-label" for="rd-price" data-v-24ef7cd4>Preis je Sensor <span class="field-label__req" data-v-24ef7cd4>*</span></label><input id="rd-price"${(0, server_renderer_exports.ssrRenderAttr)("value", form.price)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.value.priceCents }, "field tabular"])}" type="text" inputmode="decimal" autocomplete="off" aria-describedby="rd-price-help rd-price-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.priceCents ? "true" : void 0)} data-v-24ef7cd4><p id="rd-price-help" class="field-help" data-v-24ef7cd4>${(0, server_renderer_exports.ssrInterpolate)(MONEY_HINT)}</p><span id="rd-price-err" class="field-error" data-v-24ef7cd4>${(0, server_renderer_exports.ssrInterpolate)(errors.value.priceCents ?? "")}</span></div><div class="rd__checks" data-v-24ef7cd4><label class="check" data-v-24ef7cd4><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.active) ? (0, server_renderer_exports.ssrLooseContain)(form.active, null) : form.active) ? " checked" : ""} type="checkbox" data-v-24ef7cd4> Aktiv </label><span class="field-error" data-v-24ef7cd4>${(0, server_renderer_exports.ssrInterpolate)(errors.value.active ?? "")}</span></div></div><div class="rd__actions" data-v-24ef7cd4><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-24ef7cd4>Speichern</button>`);
				if (editing.value !== null) _push(`<button class="btn btn--secondary" type="button" data-v-24ef7cd4>Abbrechen</button>`);
				else _push(`<!---->`);
				_push(`</div></form>`);
			} else _push(`<!---->`);
			_push(`<div class="rd__box" data-v-24ef7cd4>`);
			if (__props.prices.length > 0) {
				_push(`<table class="table table--rows rd__table" data-v-24ef7cd4><thead data-v-24ef7cd4><tr data-v-24ef7cd4><th scope="col" data-v-24ef7cd4>Automarke</th><th scope="col" class="num" data-v-24ef7cd4>Preis je Sensor</th><th scope="col" data-v-24ef7cd4>Aktiv</th>`);
				if (canAct.value) _push(`<th scope="col" data-v-24ef7cd4><span class="visually-hidden" data-v-24ef7cd4>Aktionen</span></th>`);
				else _push(`<!---->`);
				_push(`</tr></thead><tbody data-v-24ef7cd4><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.prices, (price) => {
					_push(`<tr${(0, server_renderer_exports.ssrRenderAttr)("aria-current", editing.value === price.id ? "true" : void 0)} data-v-24ef7cd4><td data-label="Automarke" data-v-24ef7cd4><span class="rd__make" data-v-24ef7cd4>${(0, server_renderer_exports.ssrInterpolate)(price.makeLabelDe)}</span><span class="micro quiet rd__key" data-v-24ef7cd4>${(0, server_renderer_exports.ssrInterpolate)(keyNote(price.makeKey))}</span></td><td data-label="Preis je Sensor" class="num tabular" data-v-24ef7cd4>${(0, server_renderer_exports.ssrInterpolate)(price.price)}</td><td data-label="Aktiv" data-v-24ef7cd4><span class="${(0, server_renderer_exports.ssrRenderClass)([price.active ? "tag--ok" : "tag--unknown", "tag"])}" data-v-24ef7cd4>${(0, server_renderer_exports.ssrInterpolate)(price.active ? "Aktiv" : "Inaktiv")}</span></td>`);
					if (canAct.value) {
						_push(`<td data-label="Aktionen" data-v-24ef7cd4><div class="rd__row-actions" data-v-24ef7cd4>`);
						if (__props.can.update) _push(`<button class="btn btn--secondary btn--sm" type="button" data-v-24ef7cd4> Bearbeiten<span class="visually-hidden" data-v-24ef7cd4>: ${(0, server_renderer_exports.ssrInterpolate)(price.makeLabelDe)}</span></button>`);
						else _push(`<!---->`);
						if (__props.can.delete) _push(`<button class="btn btn--ghost btn--sm" type="button" data-v-24ef7cd4> Löschen<span class="visually-hidden" data-v-24ef7cd4>: ${(0, server_renderer_exports.ssrInterpolate)(price.makeLabelDe)}</span></button>`);
						else _push(`<!---->`);
						_push(`</div></td>`);
					} else _push(`<!---->`);
					_push(`</tr>`);
				});
				_push(`<!--]--></tbody></table>`);
			} else _push(`<div class="state rd__empty" data-v-24ef7cd4><p class="state__title" data-v-24ef7cd4>${(0, server_renderer_exports.ssrInterpolate)(EMPTY_TEXT)}</p></div>`);
			_push(`</div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
				open: confirmOpen.value,
				"onUpdate:open": ($event) => confirmOpen.value = $event,
				title: "Preis löschen",
				description: CONFIRM_TEXT
			}, {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-24ef7cd4${_scopeId}>Abbrechen</button><button class="btn btn--primary rd__confirm" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-24ef7cd4${_scopeId}> Löschen </button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: ($event) => confirming.value = null
					}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
						class: "btn btn--primary rd__confirm",
						type: "button",
						disabled: busy.value,
						onClick: remove
					}, " Löschen ", 8, ["disabled"])];
				}),
				_: 1
			}, _parent));
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Rdks/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Rdks/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-24ef7cd4"]]);
//#endregion
export { Index_default as default };
