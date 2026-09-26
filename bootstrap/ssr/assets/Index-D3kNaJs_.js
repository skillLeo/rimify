import { a as usePage, c as vue_exports, n as head_default, o as router } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-1H3Q1ksK.js";
import { t as Icon_default } from "./Icon-Cd7fU8zT.js";
import { t as AdminLayout_default } from "./AdminLayout-BXe7zDOy.js";
import { t as Dialog_default } from "./Dialog-D0E0ckTw.js";
//#region resources/js/Pages/Admin/Wuchtgewichte/Index.vue?vue&type=script&setup=true&lang.ts
var BASE = "/admin/wuchtgewichte";
var EMPTY_TEXT = "Noch keine Farbe angelegt. Solange können Kundinnen und Kunden kein Komplettrad bestellen.";
var CONFIRM_TEXT = "Farbe wirklich löschen? Bestellungen behalten die Farbe, die sie hatten.";
var MONEY_HINT = "Preis in Euro, deutsch geschrieben – zum Beispiel 49,00.";
var MOUNTING_HINT = "Preis je Rad, deutsch geschrieben – zum Beispiel 19,90. Leer lassen heißt: noch nicht festgelegt.";
var MOUNTING_OPEN = "Solange hier nichts steht, können Kundinnen und Kunden keine Kompletträder bestellen. Felgen allein sind davon nicht betroffen.";
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		colours: {},
		mounting: {},
		can: {}
	},
	setup(__props) {
		/**
		* Wuchtgewichte-Farben.
		*
		* The colours a customer can pick for the balance weights of a Komplettrad, and what each costs per
		* wheel. One form serves a new colour and an existing one: `Bearbeiten` loads the row into it and
		* marks the row, `Abbrechen` empties it again. The money field edits the German string the server
		* sent and posts it back as typed — the server parses it (Money::fromGerman) and refuses anything
		* ambiguous; nothing on this page multiplies cents.
		*
		* Every write is authorised on the server (R-11). `can` only decides what is drawn: a role that may
		* not write sees the list and nothing else. Deleting asks first, because orders keep the colour they
		* were sold with and the storefront refuses Kompletträder once no active colour is left.
		*/
		const props = __props;
		function blank() {
			return {
				nameDe: "",
				swatchHex: "",
				surcharge: "0,00",
				isDefault: false,
				active: true,
				sortOrder: 0
			};
		}
		const page = usePage();
		const form = (0, vue_exports.reactive)(blank());
		(0, vue_exports.ref)(null);
		/** The id being edited, or null while the form makes a new colour. */
		const editing = (0, vue_exports.ref)(null);
		/** True once a request went out from this form: only then do the server's messages belong to it. */
		const sent = (0, vue_exports.ref)(false);
		const busy = (0, vue_exports.ref)(false);
		const confirming = (0, vue_exports.ref)(null);
		/** Everything the server said about the last request, whichever form sent it. */
		const bag = (0, vue_exports.computed)(() => {
			const raw = page.props.errors;
			return raw !== null && typeof raw === "object" ? raw : {};
		});
		/** The server's validation messages, keyed by field. */
		const errors = (0, vue_exports.computed)(() => sent.value ? bag.value : {});
		const mounting = (0, vue_exports.reactive)({ typed: props.mounting.typed });
		const mountingSent = (0, vue_exports.ref)(false);
		const mountingBusy = (0, vue_exports.ref)(false);
		/** Two forms share one error bag, so each only shows messages for a request it sent itself. */
		const mountingError = (0, vue_exports.computed)(() => mountingSent.value ? bag.value.mountingCents ?? bag.value.mounting ?? "" : "");
		const editingColour = (0, vue_exports.computed)(() => props.colours.find((c) => c.id === editing.value) ?? null);
		const canWrite = (0, vue_exports.computed)(() => props.can.create || props.can.update);
		const canAct = (0, vue_exports.computed)(() => props.can.update || props.can.delete);
		const formTitle = (0, vue_exports.computed)(() => editingColour.value === null ? "Neue Farbe" : `Farbe bearbeiten: ${editingColour.value.nameDe}`);
		const confirmOpen = (0, vue_exports.computed)({
			get: () => confirming.value !== null,
			set: (open) => {
				if (!open) confirming.value = null;
			}
		});
		/** The admin's own hex, or the neutral chip from the class when there is none. */
		function swatchStyle(hex) {
			return /^#[0-9A-Fa-f]{6}$/.test(hex ?? "") ? { backgroundColor: hex } : void 0;
		}
		function reset() {
			Object.assign(form, blank());
			editing.value = null;
			sent.value = false;
		}
		function remove() {
			const colour = confirming.value;
			if (colour === null) return;
			busy.value = true;
			router.delete(`${BASE}/${colour.id}`, {
				preserveScroll: true,
				onSuccess: () => {
					confirming.value = null;
					if (editing.value === colour.id) reset();
				},
				onFinish: () => {
					busy.value = false;
				}
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Wuchtgewichte-Farben" }, null, _parent));
			_push(`<div class="wg__head" data-v-be4c3cfe><h1 class="t-h1" data-v-be4c3cfe>Wuchtgewichte-Farben</h1><p class="wg__lead" data-v-be4c3cfe> Die Farbe wählen Kundinnen und Kunden im Warenkorb, je Komplettrad. Der Aufpreis gilt je Rad; die Standardfarbe bekommt jedes Komplettrad, solange nichts anderes gewählt ist. </p></div>`);
			if (__props.can.update) {
				_push(`<form class="wg__form wg__form--fee"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", mountingBusy.value ? "true" : void 0)} data-v-be4c3cfe><h2 class="t-h3 wg__form-title" data-v-be4c3cfe>Montage und Auswuchten</h2><div class="wg__fee" data-v-be4c3cfe><div class="wg__field wg__field--narrow" data-v-be4c3cfe><label class="field-label" for="wg-mounting" data-v-be4c3cfe>Preis je Rad</label><input id="wg-mounting"${(0, server_renderer_exports.ssrRenderAttr)("value", mounting.typed)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": mountingError.value }, "field tabular"])}" type="text" inputmode="decimal" autocomplete="off" maxlength="32" aria-describedby="wg-mounting-help wg-mounting-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", mountingError.value ? "true" : void 0)} data-v-be4c3cfe><p id="wg-mounting-help" class="field-help" data-v-be4c3cfe>${(0, server_renderer_exports.ssrInterpolate)(MOUNTING_HINT)}</p><span id="wg-mounting-err" class="field-error" data-v-be4c3cfe>${(0, server_renderer_exports.ssrInterpolate)(mountingError.value)}</span></div><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(mountingBusy.value) ? " disabled" : ""} data-v-be4c3cfe>Speichern</button></div>`);
				if (props.mounting.cents === null) _push(`<p class="wg__fee-open small" data-v-be4c3cfe>${(0, server_renderer_exports.ssrInterpolate)(MOUNTING_OPEN)}</p>`);
				else _push(`<!---->`);
				_push(`</form>`);
			} else _push(`<!---->`);
			if (canWrite.value) {
				_push(`<form class="wg__form"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-be4c3cfe><h2 class="t-h3 wg__form-title" data-v-be4c3cfe>${(0, server_renderer_exports.ssrInterpolate)(formTitle.value)}</h2><div class="wg__fields" data-v-be4c3cfe><div class="wg__field" data-v-be4c3cfe><label class="field-label" for="wg-name" data-v-be4c3cfe>Bezeichnung <span class="field-label__req" data-v-be4c3cfe>*</span></label><input id="wg-name"${(0, server_renderer_exports.ssrRenderAttr)("value", form.nameDe)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.value.nameDe || errors.value.slug }, "field"])}" type="text" maxlength="64" autocomplete="off" aria-describedby="wg-name-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.nameDe || errors.value.slug ? "true" : void 0)} data-v-be4c3cfe><span id="wg-name-err" class="field-error" data-v-be4c3cfe>${(0, server_renderer_exports.ssrInterpolate)(errors.value.nameDe ?? errors.value.slug ?? "")}</span></div><div class="wg__field" data-v-be4c3cfe><label class="field-label" for="wg-hex" data-v-be4c3cfe>Farbwert (Hex)</label><div class="wg__hex" data-v-be4c3cfe><span class="wg__swatch" style="${(0, server_renderer_exports.ssrRenderStyle)(swatchStyle(form.swatchHex))}" aria-hidden="true" data-v-be4c3cfe></span><input id="wg-hex"${(0, server_renderer_exports.ssrRenderAttr)("value", form.swatchHex)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.value.swatchHex }, "field"])}" type="text" placeholder="#C8CCD2" maxlength="7" autocomplete="off" spellcheck="false" aria-describedby="wg-hex-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.swatchHex ? "true" : void 0)} data-v-be4c3cfe></div><span id="wg-hex-err" class="field-error" data-v-be4c3cfe>${(0, server_renderer_exports.ssrInterpolate)(errors.value.swatchHex ?? "")}</span></div><div class="wg__field" data-v-be4c3cfe><label class="field-label" for="wg-surcharge" data-v-be4c3cfe>Aufpreis je Rad</label><input id="wg-surcharge"${(0, server_renderer_exports.ssrRenderAttr)("value", form.surcharge)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.value.surchargeCents }, "field tabular"])}" type="text" inputmode="decimal" autocomplete="off" aria-describedby="wg-surcharge-help wg-surcharge-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.surchargeCents ? "true" : void 0)} data-v-be4c3cfe><p id="wg-surcharge-help" class="field-help" data-v-be4c3cfe>${(0, server_renderer_exports.ssrInterpolate)(MONEY_HINT)}</p><span id="wg-surcharge-err" class="field-error" data-v-be4c3cfe>${(0, server_renderer_exports.ssrInterpolate)(errors.value.surchargeCents ?? "")}</span></div><div class="wg__field wg__field--narrow" data-v-be4c3cfe><label class="field-label" for="wg-sort" data-v-be4c3cfe>Reihenfolge</label><input id="wg-sort"${(0, server_renderer_exports.ssrRenderAttr)("value", form.sortOrder)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "field--error": errors.value.sortOrder }, "field tabular"])}" type="number" min="0" max="9999" step="1" aria-describedby="wg-sort-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.sortOrder ? "true" : void 0)} data-v-be4c3cfe><span id="wg-sort-err" class="field-error" data-v-be4c3cfe>${(0, server_renderer_exports.ssrInterpolate)(errors.value.sortOrder ?? "")}</span></div><div class="wg__checks" data-v-be4c3cfe><label class="check" data-v-be4c3cfe><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.isDefault) ? (0, server_renderer_exports.ssrLooseContain)(form.isDefault, null) : form.isDefault) ? " checked" : ""} type="checkbox" data-v-be4c3cfe> Standardfarbe </label><label class="check" data-v-be4c3cfe><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.active) ? (0, server_renderer_exports.ssrLooseContain)(form.active, null) : form.active) ? " checked" : ""} type="checkbox" data-v-be4c3cfe> Aktiv </label><span class="field-error" data-v-be4c3cfe>${(0, server_renderer_exports.ssrInterpolate)(errors.value.isDefault ?? errors.value.active ?? "")}</span></div></div><div class="wg__actions" data-v-be4c3cfe><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-be4c3cfe>Speichern</button>`);
				if (editing.value !== null) _push(`<button class="btn btn--secondary" type="button" data-v-be4c3cfe>Abbrechen</button>`);
				else _push(`<!---->`);
				_push(`</div></form>`);
			} else _push(`<!---->`);
			_push(`<div class="wg__box" data-v-be4c3cfe>`);
			if (__props.colours.length > 0) {
				_push(`<table class="table table--rows wg__table" data-v-be4c3cfe><thead data-v-be4c3cfe><tr data-v-be4c3cfe><th scope="col" data-v-be4c3cfe>Bezeichnung</th><th scope="col" data-v-be4c3cfe>Farbwert (Hex)</th><th scope="col" class="num" data-v-be4c3cfe>Aufpreis je Rad</th><th scope="col" data-v-be4c3cfe>Standardfarbe</th><th scope="col" data-v-be4c3cfe>Aktiv</th><th scope="col" class="num" data-v-be4c3cfe>Reihenfolge</th>`);
				if (canAct.value) _push(`<th scope="col" data-v-be4c3cfe><span class="visually-hidden" data-v-be4c3cfe>Aktionen</span></th>`);
				else _push(`<!---->`);
				_push(`</tr></thead><tbody data-v-be4c3cfe><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.colours, (colour) => {
					_push(`<tr${(0, server_renderer_exports.ssrRenderAttr)("aria-current", editing.value === colour.id ? "true" : void 0)} data-v-be4c3cfe><td data-label="Bezeichnung" data-v-be4c3cfe><div class="wg__name" data-v-be4c3cfe><span class="wg__swatch" style="${(0, server_renderer_exports.ssrRenderStyle)(swatchStyle(colour.swatchHex))}" aria-hidden="true" data-v-be4c3cfe></span><span data-v-be4c3cfe><span class="wg__name-text" data-v-be4c3cfe>${(0, server_renderer_exports.ssrInterpolate)(colour.nameDe)}</span><span class="micro quiet wg__slug" data-v-be4c3cfe>${(0, server_renderer_exports.ssrInterpolate)(colour.slug)}</span></span></div></td><td data-label="Farbwert (Hex)" class="data" data-v-be4c3cfe>${(0, server_renderer_exports.ssrInterpolate)(colour.swatchHex ?? "–")}</td><td data-label="Aufpreis je Rad" class="num tabular" data-v-be4c3cfe>${(0, server_renderer_exports.ssrInterpolate)(colour.surcharge)}</td><td data-label="Standardfarbe" data-v-be4c3cfe>`);
					if (colour.isDefault) {
						_push(`<span class="wg__yes" data-v-be4c3cfe>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "check",
							size: 20
						}, null, _parent));
						_push(`<span class="visually-hidden" data-v-be4c3cfe>Standardfarbe</span></span>`);
					} else _push(`<span class="quiet" data-v-be4c3cfe><span aria-hidden="true" data-v-be4c3cfe>–</span><span class="visually-hidden" data-v-be4c3cfe>keine Standardfarbe</span></span>`);
					_push(`</td><td data-label="Aktiv" data-v-be4c3cfe><span class="${(0, server_renderer_exports.ssrRenderClass)([colour.active ? "tag--ok" : "tag--unknown", "tag"])}" data-v-be4c3cfe>${(0, server_renderer_exports.ssrInterpolate)(colour.active ? "Aktiv" : "Inaktiv")}</span></td><td data-label="Reihenfolge" class="num tabular" data-v-be4c3cfe>${(0, server_renderer_exports.ssrInterpolate)(colour.sortOrder)}</td>`);
					if (canAct.value) {
						_push(`<td data-label="Aktionen" data-v-be4c3cfe><div class="wg__row-actions" data-v-be4c3cfe>`);
						if (__props.can.update) _push(`<button class="btn btn--secondary btn--sm" type="button" data-v-be4c3cfe> Bearbeiten<span class="visually-hidden" data-v-be4c3cfe>: ${(0, server_renderer_exports.ssrInterpolate)(colour.nameDe)}</span></button>`);
						else _push(`<!---->`);
						if (__props.can.delete) _push(`<button class="btn btn--ghost btn--sm" type="button" data-v-be4c3cfe> Löschen<span class="visually-hidden" data-v-be4c3cfe>: ${(0, server_renderer_exports.ssrInterpolate)(colour.nameDe)}</span></button>`);
						else _push(`<!---->`);
						_push(`</div></td>`);
					} else _push(`<!---->`);
					_push(`</tr>`);
				});
				_push(`<!--]--></tbody></table>`);
			} else _push(`<div class="state wg__empty" data-v-be4c3cfe><p class="state__title" data-v-be4c3cfe>${(0, server_renderer_exports.ssrInterpolate)(EMPTY_TEXT)}</p></div>`);
			_push(`</div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
				open: confirmOpen.value,
				"onUpdate:open": ($event) => confirmOpen.value = $event,
				title: "Farbe löschen",
				description: CONFIRM_TEXT
			}, {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-be4c3cfe${_scopeId}>Abbrechen</button><button class="btn btn--primary wg__confirm" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-be4c3cfe${_scopeId}> Löschen </button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: ($event) => confirming.value = null
					}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
						class: "btn btn--primary wg__confirm",
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
//#region resources/js/Pages/Admin/Wuchtgewichte/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Wuchtgewichte/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-be4c3cfe"]]);
//#endregion
export { Index_default as default };
