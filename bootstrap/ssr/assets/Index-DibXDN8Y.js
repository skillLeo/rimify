import { i as ZUBEHOER_TABS, n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BSZH2tn1.js";
import { c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { t as AdminConfirm_default } from "./AdminConfirm-BcxlY_q2.js";
import { t as AdminState_default } from "./AdminState-QyYV7E7y.js";
import { t as AdminSectionTabs_default } from "./AdminSectionTabs-D_r2L-Uz.js";
//#region resources/js/Pages/Admin/Wuchtgewichte/Index.vue?vue&type=script&setup=true&lang.ts
var BASE = "/admin/zubehoerpreise/wuchtgewichte";
var EMPTY_TEXT = "Noch keine Farbe angelegt. Solange können Kundinnen und Kunden kein Komplettrad bestellen.";
var MONEY_HINT = "Preis in Euro, mit Komma – zum Beispiel 49,00.";
var MOUNTING_HINT = "Preis je Rad, mit Komma – zum Beispiel 19,90. Leer lassen heißt: noch nicht festgelegt.";
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
		* Einstellungen › Zubehörpreise › Wuchtgewichte-Farben.
		*
		* The colours a customer can pick for the balance weights of a Komplettrad, and what each costs per
		* wheel. One form serves a new colour and an existing one: `Bearbeiten` loads the row into it and
		* marks the row, `Abbrechen` empties it again. The money field edits the German string the server
		* sent and posts it back as typed — the server parses it (Money::fromGerman) and refuses anything
		* ambiguous; nothing on this page multiplies cents.
		*
		* Every write is authorised on the server (R-11). `can` only decides what is drawn: a role that may
		* not write sees the list, and the page says once that it is read-only. Deleting asks first, naming
		* the colour, because orders keep the colour they were sold with and the storefront refuses
		* Kompletträder once no active colour is left.
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
		const nameField = (0, vue_exports.ref)(null);
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
		function saveMounting() {
			mountingSent.value = true;
			mountingBusy.value = true;
			router.put(`${BASE}/montage`, { mounting: mounting.typed }, {
				preserveScroll: true,
				onFinish: () => {
					mountingBusy.value = false;
				}
			});
		}
		const editingColour = (0, vue_exports.computed)(() => props.colours.find((c) => c.id === editing.value) ?? null);
		const canWrite = (0, vue_exports.computed)(() => props.can.create || props.can.update);
		const canAct = (0, vue_exports.computed)(() => props.can.update || props.can.delete);
		const formTitle = (0, vue_exports.computed)(() => editingColour.value === null ? "Neue Farbe" : `Farbe bearbeiten: ${editingColour.value.nameDe}`);
		/** The page's one primary action says what it does: make a colour, or keep the edit. */
		const submitLabel = (0, vue_exports.computed)(() => editing.value === null ? "Farbe anlegen" : "Änderungen speichern");
		const context = (0, vue_exports.computed)(() => {
			const total = props.colours.length;
			const active = props.colours.filter((c) => c.active).length;
			const fee = props.mounting.cents === null ? "Montagepreis nicht festgelegt" : `Montage ${props.mounting.typed} je Rad`;
			return total === 0 ? `Noch keine Farbe · ${fee}` : `${total} ${total === 1 ? "Farbe" : "Farben"}, davon ${active} aktiv · ${fee}`;
		});
		const confirmOpen = (0, vue_exports.computed)({
			get: () => confirming.value !== null,
			set: (open) => {
				if (!open) confirming.value = null;
			}
		});
		/** What deleting this colour does, in the sentence the confirmation needs. */
		const confirmBody = (0, vue_exports.computed)(() => {
			const colour = confirming.value;
			const lastActive = colour !== null && colour.active && props.colours.filter((c) => c.active).length === 1;
			const kept = "Bestellungen behalten die Farbe, mit der sie verkauft wurden.";
			return lastActive ? `${kept} Danach ist keine aktive Farbe mehr übrig – Kompletträder lassen sich dann nicht bestellen.` : kept;
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
		function edit(colour) {
			form.nameDe = colour.nameDe;
			form.swatchHex = colour.swatchHex ?? "";
			form.surcharge = colour.surcharge;
			form.isDefault = colour.isDefault;
			form.active = colour.active;
			form.sortOrder = colour.sortOrder;
			editing.value = colour.id;
			sent.value = false;
			nameField.value?.focus();
		}
		function submit() {
			sent.value = true;
			busy.value = true;
			const options = {
				preserveScroll: true,
				onSuccess: reset,
				onFinish: () => {
					busy.value = false;
				}
			};
			if (editing.value === null) router.post(BASE, { ...form }, options);
			else router.patch(`${BASE}/${editing.value}`, { ...form }, options);
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
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Zubehörpreise",
				context: context.value,
				"read-only": !canWrite.value
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminSectionTabs_default, {
							label: "Zubehörpreise",
							items: (0, vue_exports.unref)(ZUBEHOER_TABS)
						}, null, _parent, _scopeId));
						_push(`<p class="adm-note wg__lead" data-v-13801a7f${_scopeId}> Die Farbe wählen Kundinnen und Kunden im Warenkorb, je Komplettrad. Der Aufpreis gilt je Rad; die Standardfarbe bekommt jedes Komplettrad, solange nichts anderes gewählt ist. </p>`);
						if (__props.can.update) {
							_push(`<section class="adm-section" aria-labelledby="wg-fee-title" data-v-13801a7f${_scopeId}><form class="wg__form wg__form--fee"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", mountingBusy.value ? "true" : void 0)} data-v-13801a7f${_scopeId}><h2 id="wg-fee-title" class="adm-section__title wg__form-title" data-v-13801a7f${_scopeId}>Montage und Auswuchten</h2><div class="form-field" data-v-13801a7f${_scopeId}><label class="form-field__label" for="wg-mounting" data-v-13801a7f${_scopeId}>Preis je Rad</label><div class="adm-inline" data-v-13801a7f${_scopeId}><input id="wg-mounting"${(0, server_renderer_exports.ssrRenderAttr)("value", mounting.typed)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": mountingError.value }, "input wg__num"])}" type="text" inputmode="decimal" autocomplete="off" maxlength="32" aria-describedby="wg-mounting-help wg-mounting-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", mountingError.value ? "true" : void 0)} data-v-13801a7f${_scopeId}><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(mountingBusy.value) ? " disabled" : ""} data-v-13801a7f${_scopeId}>Montagepreis speichern</button></div><p id="wg-mounting-help" class="form-field__help" data-v-13801a7f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(MOUNTING_HINT)}</p><p id="wg-mounting-err" class="form-field__error" data-v-13801a7f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(mountingError.value)}</p></div>`);
							if (props.mounting.cents === null) _push(`<p class="adm-note wg__fee-open" data-v-13801a7f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(MOUNTING_OPEN)}</p>`);
							else _push(`<!---->`);
							_push(`</form></section>`);
						} else _push(`<!---->`);
						if (canWrite.value) {
							_push(`<section class="adm-section" aria-labelledby="wg-form-title" data-v-13801a7f${_scopeId}><form class="wg__form"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-13801a7f${_scopeId}><h2 id="wg-form-title" class="adm-section__title wg__form-title" data-v-13801a7f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(formTitle.value)}</h2><div class="adm-fields wg__fields" data-v-13801a7f${_scopeId}><div class="form-field" data-v-13801a7f${_scopeId}><label class="form-field__label" for="wg-name" data-v-13801a7f${_scopeId}>Bezeichnung</label><input id="wg-name"${(0, server_renderer_exports.ssrRenderAttr)("value", form.nameDe)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": errors.value.nameDe || errors.value.slug }, "input"])}" type="text" maxlength="64" autocomplete="off" aria-required="true" aria-describedby="wg-name-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.nameDe || errors.value.slug ? "true" : void 0)} data-v-13801a7f${_scopeId}><p id="wg-name-err" class="form-field__error" data-v-13801a7f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.nameDe ?? errors.value.slug ?? "")}</p></div><div class="form-field" data-v-13801a7f${_scopeId}><label class="form-field__label" for="wg-hex" data-v-13801a7f${_scopeId}>Farbwert (Hex, optional)</label><div class="wg__hex" data-v-13801a7f${_scopeId}><span class="wg__swatch" style="${(0, server_renderer_exports.ssrRenderStyle)(swatchStyle(form.swatchHex))}" aria-hidden="true" data-v-13801a7f${_scopeId}></span><input id="wg-hex"${(0, server_renderer_exports.ssrRenderAttr)("value", form.swatchHex)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": errors.value.swatchHex }, "input"])}" type="text" placeholder="#C8CCD2" maxlength="7" autocomplete="off" spellcheck="false" aria-describedby="wg-hex-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.swatchHex ? "true" : void 0)} data-v-13801a7f${_scopeId}></div><p id="wg-hex-err" class="form-field__error" data-v-13801a7f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.swatchHex ?? "")}</p></div><div class="form-field" data-v-13801a7f${_scopeId}><label class="form-field__label" for="wg-surcharge" data-v-13801a7f${_scopeId}>Aufpreis je Rad</label><input id="wg-surcharge"${(0, server_renderer_exports.ssrRenderAttr)("value", form.surcharge)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": errors.value.surchargeCents }, "input wg__num wg__money"])}" type="text" inputmode="decimal" autocomplete="off" aria-describedby="wg-surcharge-help wg-surcharge-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.surchargeCents ? "true" : void 0)} data-v-13801a7f${_scopeId}><p id="wg-surcharge-help" class="form-field__help" data-v-13801a7f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(MONEY_HINT)}</p><p id="wg-surcharge-err" class="form-field__error" data-v-13801a7f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.surchargeCents ?? "")}</p></div><div class="form-field adm-fields__narrow" data-v-13801a7f${_scopeId}><label class="form-field__label" for="wg-sort" data-v-13801a7f${_scopeId}>Reihenfolge</label><input id="wg-sort"${(0, server_renderer_exports.ssrRenderAttr)("value", form.sortOrder)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": errors.value.sortOrder }, "input wg__num"])}" type="number" min="0" max="9999" step="1" aria-describedby="wg-sort-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.sortOrder ? "true" : void 0)} data-v-13801a7f${_scopeId}><p id="wg-sort-err" class="form-field__error" data-v-13801a7f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.sortOrder ?? "")}</p></div><div class="adm-fields__checks wg__checks" data-v-13801a7f${_scopeId}><label class="check" data-v-13801a7f${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.isDefault) ? (0, server_renderer_exports.ssrLooseContain)(form.isDefault, null) : form.isDefault) ? " checked" : ""} type="checkbox" data-v-13801a7f${_scopeId}> Standardfarbe </label><label class="check" data-v-13801a7f${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.active) ? (0, server_renderer_exports.ssrLooseContain)(form.active, null) : form.active) ? " checked" : ""} type="checkbox" data-v-13801a7f${_scopeId}> Aktiv </label><p class="form-field__error" data-v-13801a7f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.isDefault ?? errors.value.active ?? "")}</p></div></div><div class="adm-fields__actions" data-v-13801a7f${_scopeId}><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-13801a7f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(submitLabel.value)}</button>`);
							if (editing.value !== null) _push(`<button class="btn btn--secondary" type="button" data-v-13801a7f${_scopeId}>Abbrechen</button>`);
							else _push(`<!---->`);
							_push(`</div></form></section>`);
						} else _push(`<!---->`);
						_push(`<section class="adm-section" aria-labelledby="wg-list-title" data-v-13801a7f${_scopeId}><div class="adm-section__head" data-v-13801a7f${_scopeId}><h2 id="wg-list-title" class="adm-section__title" data-v-13801a7f${_scopeId}>Farben</h2></div>`);
						if (__props.colours.length > 0) {
							_push(`<div class="adm-panel" data-v-13801a7f${_scopeId}><table class="adm-table wg__table" data-v-13801a7f${_scopeId}><thead data-v-13801a7f${_scopeId}><tr data-v-13801a7f${_scopeId}><th scope="col" data-v-13801a7f${_scopeId}>Bezeichnung</th><th scope="col" data-v-13801a7f${_scopeId}>Farbwert (Hex)</th><th scope="col" class="num" data-v-13801a7f${_scopeId}>Aufpreis je Rad</th><th scope="col" data-v-13801a7f${_scopeId}>Standardfarbe</th><th scope="col" data-v-13801a7f${_scopeId}>Aktiv</th><th scope="col" class="num" data-v-13801a7f${_scopeId}>Reihenfolge</th>`);
							if (canAct.value) _push(`<th scope="col" data-v-13801a7f${_scopeId}><span class="visually-hidden" data-v-13801a7f${_scopeId}>Aktionen</span></th>`);
							else _push(`<!---->`);
							_push(`</tr></thead><tbody data-v-13801a7f${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.colours, (colour) => {
								_push(`<tr${(0, server_renderer_exports.ssrRenderAttr)("aria-current", editing.value === colour.id ? "true" : void 0)} data-v-13801a7f${_scopeId}><td data-label="Bezeichnung" data-v-13801a7f${_scopeId}><span class="wg__name" data-v-13801a7f${_scopeId}><span class="wg__swatch" style="${(0, server_renderer_exports.ssrRenderStyle)(swatchStyle(colour.swatchHex))}" aria-hidden="true" data-v-13801a7f${_scopeId}></span><span data-v-13801a7f${_scopeId}><span class="adm-table__key" data-v-13801a7f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(colour.nameDe)}</span>`);
								if (colour.demo) _push(`<span class="adm-tag adm-tag--neutral adm-demo" data-v-13801a7f${_scopeId}>Demodaten</span>`);
								else _push(`<!---->`);
								_push(`<span class="adm-table__sub" data-v-13801a7f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(colour.slug)}</span></span></span></td><td data-label="Farbwert (Hex)" class="wg__hexcell" data-phone="hide" data-v-13801a7f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(colour.swatchHex ?? "–")}</td><td data-label="Aufpreis je Rad" class="num" data-v-13801a7f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(colour.surcharge)}</td><td data-label="Standardfarbe" data-v-13801a7f${_scopeId}>`);
								if (colour.isDefault) {
									_push(`<span class="wg__yes" data-v-13801a7f${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "check",
										size: 20
									}, null, _parent, _scopeId));
									_push(`<span class="visually-hidden" data-v-13801a7f${_scopeId}>Standardfarbe</span></span>`);
								} else _push(`<span class="wg__no" data-v-13801a7f${_scopeId}><span aria-hidden="true" data-v-13801a7f${_scopeId}>–</span><span class="visually-hidden" data-v-13801a7f${_scopeId}>keine Standardfarbe</span></span>`);
								_push(`</td><td data-label="Aktiv" data-phone="status" data-v-13801a7f${_scopeId}>`);
								if (colour.active) _push(`<!--[-->Aktiv<!--]-->`);
								else _push(`<span class="adm-tag adm-tag--neutral" data-v-13801a7f${_scopeId}>Inaktiv</span>`);
								_push(`</td><td data-label="Reihenfolge" class="num" data-v-13801a7f${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(colour.sortOrder)}</td>`);
								if (canAct.value) {
									_push(`<td data-label="Aktionen" data-v-13801a7f${_scopeId}><div class="adm-table__actions" data-v-13801a7f${_scopeId}>`);
									if (__props.can.update) _push(`<button class="btn btn--secondary btn--sm" type="button" data-v-13801a7f${_scopeId}> Bearbeiten<span class="visually-hidden" data-v-13801a7f${_scopeId}>: ${(0, server_renderer_exports.ssrInterpolate)(colour.nameDe)}</span></button>`);
									else _push(`<!---->`);
									if (__props.can.delete) _push(`<button class="btn btn--secondary btn--sm adm-btn--danger" type="button" data-v-13801a7f${_scopeId}> Löschen<span class="visually-hidden" data-v-13801a7f${_scopeId}>: ${(0, server_renderer_exports.ssrInterpolate)(colour.nameDe)}</span></button>`);
									else _push(`<!---->`);
									_push(`</div></td>`);
								} else _push(`<!---->`);
								_push(`</tr>`);
							});
							_push(`<!--]--></tbody></table></div>`);
						} else _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: EMPTY_TEXT
						}, null, _parent, _scopeId));
						_push(`</section>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: confirmOpen.value,
							"onUpdate:open": ($event) => confirmOpen.value = $event,
							title: `Farbe „${confirming.value?.nameDe ?? ""}“ löschen?`,
							body: confirmBody.value,
							busy: busy.value,
							onConfirm: remove
						}, null, _parent, _scopeId));
					} else return [
						(0, vue_exports.createVNode)(AdminSectionTabs_default, {
							label: "Zubehörpreise",
							items: (0, vue_exports.unref)(ZUBEHOER_TABS)
						}, null, 8, ["items"]),
						(0, vue_exports.createVNode)("p", { class: "adm-note wg__lead" }, " Die Farbe wählen Kundinnen und Kunden im Warenkorb, je Komplettrad. Der Aufpreis gilt je Rad; die Standardfarbe bekommt jedes Komplettrad, solange nichts anderes gewählt ist. "),
						__props.can.update ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 0,
							class: "adm-section",
							"aria-labelledby": "wg-fee-title"
						}, [(0, vue_exports.createVNode)("form", {
							class: "wg__form wg__form--fee",
							"aria-busy": mountingBusy.value ? "true" : void 0,
							onSubmit: (0, vue_exports.withModifiers)(saveMounting, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "wg-fee-title",
								class: "adm-section__title wg__form-title"
							}, "Montage und Auswuchten"),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "wg-mounting"
								}, "Preis je Rad"),
								(0, vue_exports.createVNode)("div", { class: "adm-inline" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "wg-mounting",
									"onUpdate:modelValue": ($event) => mounting.typed = $event,
									class: ["input wg__num", { "input--error": mountingError.value }],
									type: "text",
									inputmode: "decimal",
									autocomplete: "off",
									maxlength: "32",
									"aria-describedby": "wg-mounting-help wg-mounting-err",
									"aria-invalid": mountingError.value ? "true" : void 0
								}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, mounting.typed]]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "submit",
									disabled: mountingBusy.value
								}, "Montagepreis speichern", 8, ["disabled"])]),
								(0, vue_exports.createVNode)("p", {
									id: "wg-mounting-help",
									class: "form-field__help"
								}, (0, vue_exports.toDisplayString)(MOUNTING_HINT)),
								(0, vue_exports.createVNode)("p", {
									id: "wg-mounting-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(mountingError.value), 1)
							]),
							props.mounting.cents === null ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-note wg__fee-open"
							}, (0, vue_exports.toDisplayString)(MOUNTING_OPEN))) : (0, vue_exports.createCommentVNode)("", true)
						], 40, ["aria-busy"])])) : (0, vue_exports.createCommentVNode)("", true),
						canWrite.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 1,
							class: "adm-section",
							"aria-labelledby": "wg-form-title"
						}, [(0, vue_exports.createVNode)("form", {
							class: "wg__form",
							"aria-busy": busy.value ? "true" : void 0,
							onSubmit: (0, vue_exports.withModifiers)(submit, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "wg-form-title",
								class: "adm-section__title wg__form-title"
							}, (0, vue_exports.toDisplayString)(formTitle.value), 1),
							(0, vue_exports.createVNode)("div", { class: "adm-fields wg__fields" }, [
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "wg-name"
									}, "Bezeichnung"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "wg-name",
										ref_key: "nameField",
										ref: nameField,
										"onUpdate:modelValue": ($event) => form.nameDe = $event,
										class: ["input", { "input--error": errors.value.nameDe || errors.value.slug }],
										type: "text",
										maxlength: "64",
										autocomplete: "off",
										"aria-required": "true",
										"aria-describedby": "wg-name-err",
										"aria-invalid": errors.value.nameDe || errors.value.slug ? "true" : void 0
									}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, form.nameDe]]),
									(0, vue_exports.createVNode)("p", {
										id: "wg-name-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(errors.value.nameDe ?? errors.value.slug ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "wg-hex"
									}, "Farbwert (Hex, optional)"),
									(0, vue_exports.createVNode)("div", { class: "wg__hex" }, [(0, vue_exports.createVNode)("span", {
										class: "wg__swatch",
										style: swatchStyle(form.swatchHex),
										"aria-hidden": "true"
									}, null, 4), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "wg-hex",
										"onUpdate:modelValue": ($event) => form.swatchHex = $event,
										class: ["input", { "input--error": errors.value.swatchHex }],
										type: "text",
										placeholder: "#C8CCD2",
										maxlength: "7",
										autocomplete: "off",
										spellcheck: "false",
										"aria-describedby": "wg-hex-err",
										"aria-invalid": errors.value.swatchHex ? "true" : void 0
									}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, form.swatchHex]])]),
									(0, vue_exports.createVNode)("p", {
										id: "wg-hex-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(errors.value.swatchHex ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "wg-surcharge"
									}, "Aufpreis je Rad"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "wg-surcharge",
										"onUpdate:modelValue": ($event) => form.surcharge = $event,
										class: ["input wg__num wg__money", { "input--error": errors.value.surchargeCents }],
										type: "text",
										inputmode: "decimal",
										autocomplete: "off",
										"aria-describedby": "wg-surcharge-help wg-surcharge-err",
										"aria-invalid": errors.value.surchargeCents ? "true" : void 0
									}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, form.surcharge]]),
									(0, vue_exports.createVNode)("p", {
										id: "wg-surcharge-help",
										class: "form-field__help"
									}, (0, vue_exports.toDisplayString)(MONEY_HINT)),
									(0, vue_exports.createVNode)("p", {
										id: "wg-surcharge-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(errors.value.surchargeCents ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field adm-fields__narrow" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "wg-sort"
									}, "Reihenfolge"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "wg-sort",
										"onUpdate:modelValue": ($event) => form.sortOrder = $event,
										class: ["input wg__num", { "input--error": errors.value.sortOrder }],
										type: "number",
										min: "0",
										max: "9999",
										step: "1",
										"aria-describedby": "wg-sort-err",
										"aria-invalid": errors.value.sortOrder ? "true" : void 0
									}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[
										vue_exports.vModelText,
										form.sortOrder,
										void 0,
										{ number: true }
									]]),
									(0, vue_exports.createVNode)("p", {
										id: "wg-sort-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(errors.value.sortOrder ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "adm-fields__checks wg__checks" }, [
									(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										"onUpdate:modelValue": ($event) => form.isDefault = $event,
										type: "checkbox"
									}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelCheckbox, form.isDefault]]), (0, vue_exports.createTextVNode)(" Standardfarbe ")]),
									(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										"onUpdate:modelValue": ($event) => form.active = $event,
										type: "checkbox"
									}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelCheckbox, form.active]]), (0, vue_exports.createTextVNode)(" Aktiv ")]),
									(0, vue_exports.createVNode)("p", { class: "form-field__error" }, (0, vue_exports.toDisplayString)(errors.value.isDefault ?? errors.value.active ?? ""), 1)
								])
							]),
							(0, vue_exports.createVNode)("div", { class: "adm-fields__actions" }, [(0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "submit",
								disabled: busy.value
							}, (0, vue_exports.toDisplayString)(submitLabel.value), 9, ["disabled"]), editing.value !== null ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
								key: 0,
								class: "btn btn--secondary",
								type: "button",
								onClick: reset
							}, "Abbrechen")) : (0, vue_exports.createCommentVNode)("", true)])
						], 40, ["aria-busy"])])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "wg-list-title"
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "wg-list-title",
							class: "adm-section__title"
						}, "Farben")]), __props.colours.length > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 0,
							class: "adm-panel"
						}, [(0, vue_exports.createVNode)("table", { class: "adm-table wg__table" }, [(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Bezeichnung"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Farbwert (Hex)"),
							(0, vue_exports.createVNode)("th", {
								scope: "col",
								class: "num"
							}, "Aufpreis je Rad"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Standardfarbe"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Aktiv"),
							(0, vue_exports.createVNode)("th", {
								scope: "col",
								class: "num"
							}, "Reihenfolge"),
							canAct.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("th", {
								key: 0,
								scope: "col"
							}, [(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, "Aktionen")])) : (0, vue_exports.createCommentVNode)("", true)
						])]), (0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.colours, (colour) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", {
								key: colour.id,
								"aria-current": editing.value === colour.id ? "true" : void 0
							}, [
								(0, vue_exports.createVNode)("td", { "data-label": "Bezeichnung" }, [(0, vue_exports.createVNode)("span", { class: "wg__name" }, [(0, vue_exports.createVNode)("span", {
									class: "wg__swatch",
									style: swatchStyle(colour.swatchHex),
									"aria-hidden": "true"
								}, null, 4), (0, vue_exports.createVNode)("span", null, [
									(0, vue_exports.createVNode)("span", { class: "adm-table__key" }, (0, vue_exports.toDisplayString)(colour.nameDe), 1),
									colour.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "adm-tag adm-tag--neutral adm-demo"
									}, "Demodaten")) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)("span", { class: "adm-table__sub" }, (0, vue_exports.toDisplayString)(colour.slug), 1)
								])])]),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Farbwert (Hex)",
									class: "wg__hexcell",
									"data-phone": "hide"
								}, (0, vue_exports.toDisplayString)(colour.swatchHex ?? "–"), 1),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Aufpreis je Rad",
									class: "num"
								}, (0, vue_exports.toDisplayString)(colour.surcharge), 1),
								(0, vue_exports.createVNode)("td", { "data-label": "Standardfarbe" }, [colour.isDefault ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: "wg__yes"
								}, [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "check",
									size: 20
								}), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, "Standardfarbe")])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 1,
									class: "wg__no"
								}, [(0, vue_exports.createVNode)("span", { "aria-hidden": "true" }, "–"), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, "keine Standardfarbe")]))]),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Aktiv",
									"data-phone": "status"
								}, [colour.active ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("Aktiv")], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 1,
									class: "adm-tag adm-tag--neutral"
								}, "Inaktiv"))]),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Reihenfolge",
									class: "num"
								}, (0, vue_exports.toDisplayString)(colour.sortOrder), 1),
								canAct.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
									key: 0,
									"data-label": "Aktionen"
								}, [(0, vue_exports.createVNode)("div", { class: "adm-table__actions" }, [__props.can.update ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 0,
									class: "btn btn--secondary btn--sm",
									type: "button",
									onClick: ($event) => edit(colour)
								}, [(0, vue_exports.createTextVNode)(" Bearbeiten"), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ": " + (0, vue_exports.toDisplayString)(colour.nameDe), 1)], 8, ["onClick"])) : (0, vue_exports.createCommentVNode)("", true), __props.can.delete ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 1,
									class: "btn btn--secondary btn--sm adm-btn--danger",
									type: "button",
									onClick: ($event) => confirming.value = colour
								}, [(0, vue_exports.createTextVNode)(" Löschen"), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ": " + (0, vue_exports.toDisplayString)(colour.nameDe), 1)], 8, ["onClick"])) : (0, vue_exports.createCommentVNode)("", true)])])) : (0, vue_exports.createCommentVNode)("", true)
							], 8, ["aria-current"]);
						}), 128))])])])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 1,
							kind: "empty",
							text: EMPTY_TEXT
						}))]),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: confirmOpen.value,
							"onUpdate:open": ($event) => confirmOpen.value = $event,
							title: `Farbe „${confirming.value?.nameDe ?? ""}“ löschen?`,
							body: confirmBody.value,
							busy: busy.value,
							onConfirm: remove
						}, null, 8, [
							"open",
							"onUpdate:open",
							"title",
							"body",
							"busy"
						])
					];
				}),
				_: 1
			}, _parent));
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
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-13801a7f"]]);
//#endregion
export { Index_default as default };
