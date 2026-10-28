import { i as ZUBEHOER_TABS, n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-yqAbwMfa.js";
import { c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminConfirm_default } from "./AdminConfirm-CuIy_ILR.js";
import { t as AdminState_default } from "./AdminState-QyYV7E7y.js";
import { t as stampHeaders } from "./useDirtyForm-jjlNVm-n.js";
import { t as AdminSectionTabs_default } from "./AdminSectionTabs-D_r2L-Uz.js";
//#region resources/js/Pages/Admin/Rdks/Index.vue?vue&type=script&setup=true&lang.ts
var BASE = "/admin/zubehoerpreise/rdks";
var EMPTY_TEXT = "Noch kein Preis hinterlegt. Wir fragen RDKS-Sensoren an der Kasse zwar ab, können sie aber für keine Marke berechnen.";
var MONEY_HINT = "Preis in Euro, mit Komma – zum Beispiel 49,00.";
var DEFAULT_HINT = "Preis je Sensor, mit Komma – zum Beispiel 15,00. Leer lassen heißt: kein Standardpreis.";
var DEFAULT_OPEN = "Ohne Standardpreis bieten wir RDKS-Sensoren nur für die Marken unten an. Allen anderen sagen wir an der Kasse, dass wir den Preis noch nicht haben.";
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		prices: {},
		makes: {},
		default: {},
		can: {}
	},
	setup(__props) {
		/**
		* Einstellungen › Zubehörpreise › RDKS-Sensorpreise je Marke.
		*
		* What one tyre-pressure sensor costs for one car make — per sensor, never per set: the checkout
		* multiplies by the number of Komplettrad wheels and shows `4 × 49,00 €`. The default price is the
		* rule; the rows are its exceptions. A make with neither is a make whose price nobody has confirmed,
		* and the checkout says so rather than charging a number.
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
		const makeField = (0, vue_exports.ref)(null);
		/** The id being edited, or null while the form makes a new price. */
		const editing = (0, vue_exports.ref)(null);
		const editingStamp = (0, vue_exports.ref)(void 0);
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
		const fallback = (0, vue_exports.reactive)({ typed: props.default.typed });
		const defaultSent = (0, vue_exports.ref)(false);
		const defaultBusy = (0, vue_exports.ref)(false);
		/** Two forms share one error bag, so each only shows messages for a request it sent itself. */
		const defaultError = (0, vue_exports.computed)(() => defaultSent.value ? bag.value.priceCents ?? bag.value.price ?? "" : "");
		function saveDefault() {
			defaultSent.value = true;
			defaultBusy.value = true;
			router.put(`${BASE}/standard`, { price: fallback.typed }, {
				preserveScroll: true,
				onFinish: () => {
					defaultBusy.value = false;
				}
			});
		}
		const editingPrice = (0, vue_exports.computed)(() => props.prices.find((p) => p.id === editing.value) ?? null);
		const canWrite = (0, vue_exports.computed)(() => props.can.create || props.can.update);
		const canAct = (0, vue_exports.computed)(() => props.can.update || props.can.delete);
		const formTitle = (0, vue_exports.computed)(() => editingPrice.value === null ? "Neuer Preis" : `Preis bearbeiten: ${editingPrice.value.makeLabelDe}`);
		/** The page's one primary action says what it does: add a make's price, or keep the edit. */
		const submitLabel = (0, vue_exports.computed)(() => editing.value === null ? "Preis anlegen" : "Änderungen speichern");
		const makeError = (0, vue_exports.computed)(() => errors.value.makeKey ?? errors.value.makeLabelDe ?? "");
		const context = (0, vue_exports.computed)(() => {
			const total = props.prices.length;
			const rule = props.default.cents === null ? "kein Standardpreis" : `Standard ${props.default.typed} je Sensor`;
			return `${total === 0 ? "Noch keine Marke" : `${total} ${total === 1 ? "Marke" : "Marken"} mit eigenem Preis`} · ${rule}`;
		});
		const confirmOpen = (0, vue_exports.computed)({
			get: () => confirming.value !== null,
			set: (open) => {
				if (!open) confirming.value = null;
			}
		});
		/** What the checkout does for this make once its own price is gone. */
		const confirmBody = (0, vue_exports.computed)(() => props.default.cents === null ? "An der Kasse können wir für diese Marke dann keine Sensoren mehr berechnen." : `An der Kasse gilt für diese Marke dann der Standardpreis von ${props.default.typed} je Sensor.`);
		function reset() {
			Object.assign(form, blank());
			editing.value = null;
			editingStamp.value = void 0;
			sent.value = false;
		}
		function edit(price) {
			form.make = price.makeLabelDe;
			form.price = price.price;
			form.active = price.active;
			editing.value = price.id;
			editingStamp.value = price.stamp;
			sent.value = false;
			makeField.value?.focus();
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
			else router.patch(`${BASE}/${editing.value}`, { ...form }, {
				...options,
				headers: stampHeaders(editingStamp.value)
			});
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
						_push(`<p class="adm-note rd__lead" data-v-0c85a153${_scopeId}> Der Preis gilt je Sensor; an der Kasse rechnen wir ihn mit der Zahl der Kompletträder hoch. Für eine Marke ohne Preis bieten wir keine Sensoren an. </p>`);
						if (__props.can.update) {
							_push(`<section class="adm-section" aria-labelledby="rd-default-title" data-v-0c85a153${_scopeId}><form class="rd__form rd__form--default"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", defaultBusy.value ? "true" : void 0)} data-v-0c85a153${_scopeId}><h2 id="rd-default-title" class="adm-section__title rd__form-title" data-v-0c85a153${_scopeId}>Standardpreis je Sensor</h2><div class="form-field" data-v-0c85a153${_scopeId}><label class="form-field__label" for="rd-default" data-v-0c85a153${_scopeId}>Gilt für jede Marke ohne eigenen Preis</label><div class="adm-inline" data-v-0c85a153${_scopeId}><input id="rd-default"${(0, server_renderer_exports.ssrRenderAttr)("value", fallback.typed)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": defaultError.value }, "input rd__num"])}" type="text" inputmode="decimal" autocomplete="off" maxlength="32" aria-describedby="rd-default-help rd-default-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", defaultError.value ? "true" : void 0)} data-v-0c85a153${_scopeId}><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(defaultBusy.value) ? " disabled" : ""} data-v-0c85a153${_scopeId}>Standardpreis speichern</button></div><p id="rd-default-help" class="form-field__help" data-v-0c85a153${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(DEFAULT_HINT)}</p><p id="rd-default-err" class="form-field__error" data-v-0c85a153${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(defaultError.value)}</p></div>`);
							if (props.default.cents === null) _push(`<p class="adm-note rd__default-open" data-v-0c85a153${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(DEFAULT_OPEN)}</p>`);
							else _push(`<!---->`);
							_push(`</form></section>`);
						} else _push(`<!---->`);
						if (canWrite.value) {
							_push(`<section class="adm-section" aria-labelledby="rd-form-title" data-v-0c85a153${_scopeId}><form class="rd__form"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-0c85a153${_scopeId}><h2 id="rd-form-title" class="adm-section__title rd__form-title" data-v-0c85a153${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(formTitle.value)}</h2>`);
							if (errors.value._stamp) _push(`<p class="adm-alert" role="alert" data-v-0c85a153${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value._stamp)}</p>`);
							else _push(`<!---->`);
							_push(`<div class="adm-fields rd__fields" data-v-0c85a153${_scopeId}><div class="form-field" data-v-0c85a153${_scopeId}><label class="form-field__label" for="rd-make" data-v-0c85a153${_scopeId}>Automarke</label><input id="rd-make"${(0, server_renderer_exports.ssrRenderAttr)("value", form.make)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": makeError.value }, "input"])}" type="text" maxlength="64" autocomplete="off" list="rd-makes" aria-required="true" aria-describedby="rd-make-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", makeError.value ? "true" : void 0)} data-v-0c85a153${_scopeId}><datalist id="rd-makes" data-v-0c85a153${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.makes, (make) => {
								_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", make)} data-v-0c85a153${_scopeId}></option>`);
							});
							_push(`<!--]--></datalist><p id="rd-make-err" class="form-field__error" data-v-0c85a153${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(makeError.value)}</p></div><div class="form-field" data-v-0c85a153${_scopeId}><label class="form-field__label" for="rd-price" data-v-0c85a153${_scopeId}>Preis je Sensor</label><input id="rd-price"${(0, server_renderer_exports.ssrRenderAttr)("value", form.price)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": errors.value.priceCents }, "input rd__num rd__money"])}" type="text" inputmode="decimal" autocomplete="off" aria-required="true" aria-describedby="rd-price-help rd-price-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.priceCents ? "true" : void 0)} data-v-0c85a153${_scopeId}><p id="rd-price-help" class="form-field__help" data-v-0c85a153${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(MONEY_HINT)}</p><p id="rd-price-err" class="form-field__error" data-v-0c85a153${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.priceCents ?? "")}</p></div><div class="adm-fields__checks rd__checks" data-v-0c85a153${_scopeId}><label class="check" data-v-0c85a153${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.active) ? (0, server_renderer_exports.ssrLooseContain)(form.active, null) : form.active) ? " checked" : ""} type="checkbox" data-v-0c85a153${_scopeId}> Aktiv </label><p class="form-field__error" data-v-0c85a153${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.active ?? "")}</p></div></div><div class="adm-fields__actions" data-v-0c85a153${_scopeId}><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-0c85a153${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(submitLabel.value)}</button>`);
							if (editing.value !== null) _push(`<button class="btn btn--secondary" type="button" data-v-0c85a153${_scopeId}>Abbrechen</button>`);
							else _push(`<!---->`);
							_push(`</div></form></section>`);
						} else _push(`<!---->`);
						_push(`<section class="adm-section" aria-labelledby="rd-list-title" data-v-0c85a153${_scopeId}><div class="adm-section__head" data-v-0c85a153${_scopeId}><h2 id="rd-list-title" class="adm-section__title" data-v-0c85a153${_scopeId}>Preise je Marke</h2></div>`);
						if (__props.prices.length > 0) {
							_push(`<div class="adm-panel" data-v-0c85a153${_scopeId}><table class="adm-table" data-v-0c85a153${_scopeId}><thead data-v-0c85a153${_scopeId}><tr data-v-0c85a153${_scopeId}><th scope="col" data-v-0c85a153${_scopeId}>Automarke</th><th scope="col" class="num" data-v-0c85a153${_scopeId}>Preis je Sensor</th><th scope="col" data-v-0c85a153${_scopeId}>Aktiv</th>`);
							if (canAct.value) _push(`<th scope="col" data-v-0c85a153${_scopeId}><span class="visually-hidden" data-v-0c85a153${_scopeId}>Aktionen</span></th>`);
							else _push(`<!---->`);
							_push(`</tr></thead><tbody data-v-0c85a153${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.prices, (price) => {
								_push(`<tr${(0, server_renderer_exports.ssrRenderAttr)("aria-current", editing.value === price.id ? "true" : void 0)} data-v-0c85a153${_scopeId}><td data-label="Automarke" data-v-0c85a153${_scopeId}><span class="adm-table__key" data-v-0c85a153${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(price.makeLabelDe)}</span>`);
								if (price.demo) _push(`<span class="adm-tag adm-tag--neutral adm-demo" data-v-0c85a153${_scopeId}>Demodaten</span>`);
								else _push(`<!---->`);
								_push(`<span class="adm-table__sub rd__key" data-v-0c85a153${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(keyNote(price.makeKey))}</span></td><td data-label="Preis je Sensor" class="num" data-v-0c85a153${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(price.price)}</td><td data-label="Aktiv" data-phone="status" data-v-0c85a153${_scopeId}>`);
								if (price.active) _push(`<!--[-->Aktiv<!--]-->`);
								else _push(`<span class="adm-tag adm-tag--neutral" data-v-0c85a153${_scopeId}>Inaktiv</span>`);
								_push(`</td>`);
								if (canAct.value) {
									_push(`<td data-label="Aktionen" data-v-0c85a153${_scopeId}><div class="adm-table__actions" data-v-0c85a153${_scopeId}>`);
									if (__props.can.update) _push(`<button class="btn btn--secondary btn--sm" type="button" data-v-0c85a153${_scopeId}> Bearbeiten<span class="visually-hidden" data-v-0c85a153${_scopeId}>: ${(0, server_renderer_exports.ssrInterpolate)(price.makeLabelDe)}</span></button>`);
									else _push(`<!---->`);
									if (__props.can.delete) _push(`<button class="btn btn--secondary btn--sm adm-btn--danger" type="button" data-v-0c85a153${_scopeId}> Löschen<span class="visually-hidden" data-v-0c85a153${_scopeId}>: ${(0, server_renderer_exports.ssrInterpolate)(price.makeLabelDe)}</span></button>`);
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
							title: `Preis für ${confirming.value?.makeLabelDe ?? ""} löschen?`,
							body: confirmBody.value,
							busy: busy.value,
							onConfirm: remove
						}, null, _parent, _scopeId));
					} else return [
						(0, vue_exports.createVNode)(AdminSectionTabs_default, {
							label: "Zubehörpreise",
							items: (0, vue_exports.unref)(ZUBEHOER_TABS)
						}, null, 8, ["items"]),
						(0, vue_exports.createVNode)("p", { class: "adm-note rd__lead" }, " Der Preis gilt je Sensor; an der Kasse rechnen wir ihn mit der Zahl der Kompletträder hoch. Für eine Marke ohne Preis bieten wir keine Sensoren an. "),
						__props.can.update ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 0,
							class: "adm-section",
							"aria-labelledby": "rd-default-title"
						}, [(0, vue_exports.createVNode)("form", {
							class: "rd__form rd__form--default",
							"aria-busy": defaultBusy.value ? "true" : void 0,
							onSubmit: (0, vue_exports.withModifiers)(saveDefault, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "rd-default-title",
								class: "adm-section__title rd__form-title"
							}, "Standardpreis je Sensor"),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rd-default"
								}, "Gilt für jede Marke ohne eigenen Preis"),
								(0, vue_exports.createVNode)("div", { class: "adm-inline" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "rd-default",
									"onUpdate:modelValue": ($event) => fallback.typed = $event,
									class: ["input rd__num", { "input--error": defaultError.value }],
									type: "text",
									inputmode: "decimal",
									autocomplete: "off",
									maxlength: "32",
									"aria-describedby": "rd-default-help rd-default-err",
									"aria-invalid": defaultError.value ? "true" : void 0
								}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, fallback.typed]]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "submit",
									disabled: defaultBusy.value
								}, "Standardpreis speichern", 8, ["disabled"])]),
								(0, vue_exports.createVNode)("p", {
									id: "rd-default-help",
									class: "form-field__help"
								}, (0, vue_exports.toDisplayString)(DEFAULT_HINT)),
								(0, vue_exports.createVNode)("p", {
									id: "rd-default-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(defaultError.value), 1)
							]),
							props.default.cents === null ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-note rd__default-open"
							}, (0, vue_exports.toDisplayString)(DEFAULT_OPEN))) : (0, vue_exports.createCommentVNode)("", true)
						], 40, ["aria-busy"])])) : (0, vue_exports.createCommentVNode)("", true),
						canWrite.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 1,
							class: "adm-section",
							"aria-labelledby": "rd-form-title"
						}, [(0, vue_exports.createVNode)("form", {
							class: "rd__form",
							"aria-busy": busy.value ? "true" : void 0,
							onSubmit: (0, vue_exports.withModifiers)(submit, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "rd-form-title",
								class: "adm-section__title rd__form-title"
							}, (0, vue_exports.toDisplayString)(formTitle.value), 1),
							errors.value._stamp ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-alert",
								role: "alert"
							}, (0, vue_exports.toDisplayString)(errors.value._stamp), 1)) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("div", { class: "adm-fields rd__fields" }, [
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "rd-make"
									}, "Automarke"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "rd-make",
										ref_key: "makeField",
										ref: makeField,
										"onUpdate:modelValue": ($event) => form.make = $event,
										class: ["input", { "input--error": makeError.value }],
										type: "text",
										maxlength: "64",
										autocomplete: "off",
										list: "rd-makes",
										"aria-required": "true",
										"aria-describedby": "rd-make-err",
										"aria-invalid": makeError.value ? "true" : void 0
									}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, form.make]]),
									(0, vue_exports.createVNode)("datalist", { id: "rd-makes" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.makes, (make) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
											key: make,
											value: make
										}, null, 8, ["value"]);
									}), 128))]),
									(0, vue_exports.createVNode)("p", {
										id: "rd-make-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(makeError.value), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "rd-price"
									}, "Preis je Sensor"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "rd-price",
										"onUpdate:modelValue": ($event) => form.price = $event,
										class: ["input rd__num rd__money", { "input--error": errors.value.priceCents }],
										type: "text",
										inputmode: "decimal",
										autocomplete: "off",
										"aria-required": "true",
										"aria-describedby": "rd-price-help rd-price-err",
										"aria-invalid": errors.value.priceCents ? "true" : void 0
									}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, form.price]]),
									(0, vue_exports.createVNode)("p", {
										id: "rd-price-help",
										class: "form-field__help"
									}, (0, vue_exports.toDisplayString)(MONEY_HINT)),
									(0, vue_exports.createVNode)("p", {
										id: "rd-price-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(errors.value.priceCents ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "adm-fields__checks rd__checks" }, [(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									"onUpdate:modelValue": ($event) => form.active = $event,
									type: "checkbox"
								}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelCheckbox, form.active]]), (0, vue_exports.createTextVNode)(" Aktiv ")]), (0, vue_exports.createVNode)("p", { class: "form-field__error" }, (0, vue_exports.toDisplayString)(errors.value.active ?? ""), 1)])
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
							"aria-labelledby": "rd-list-title"
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "rd-list-title",
							class: "adm-section__title"
						}, "Preise je Marke")]), __props.prices.length > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 0,
							class: "adm-panel"
						}, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Automarke"),
							(0, vue_exports.createVNode)("th", {
								scope: "col",
								class: "num"
							}, "Preis je Sensor"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Aktiv"),
							canAct.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("th", {
								key: 0,
								scope: "col"
							}, [(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, "Aktionen")])) : (0, vue_exports.createCommentVNode)("", true)
						])]), (0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.prices, (price) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", {
								key: price.id,
								"aria-current": editing.value === price.id ? "true" : void 0
							}, [
								(0, vue_exports.createVNode)("td", { "data-label": "Automarke" }, [
									(0, vue_exports.createVNode)("span", { class: "adm-table__key" }, (0, vue_exports.toDisplayString)(price.makeLabelDe), 1),
									price.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "adm-tag adm-tag--neutral adm-demo"
									}, "Demodaten")) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)("span", { class: "adm-table__sub rd__key" }, (0, vue_exports.toDisplayString)(keyNote(price.makeKey)), 1)
								]),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Preis je Sensor",
									class: "num"
								}, (0, vue_exports.toDisplayString)(price.price), 1),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Aktiv",
									"data-phone": "status"
								}, [price.active ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("Aktiv")], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 1,
									class: "adm-tag adm-tag--neutral"
								}, "Inaktiv"))]),
								canAct.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
									key: 0,
									"data-label": "Aktionen"
								}, [(0, vue_exports.createVNode)("div", { class: "adm-table__actions" }, [__props.can.update ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 0,
									class: "btn btn--secondary btn--sm",
									type: "button",
									onClick: ($event) => edit(price)
								}, [(0, vue_exports.createTextVNode)(" Bearbeiten"), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ": " + (0, vue_exports.toDisplayString)(price.makeLabelDe), 1)], 8, ["onClick"])) : (0, vue_exports.createCommentVNode)("", true), __props.can.delete ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 1,
									class: "btn btn--secondary btn--sm adm-btn--danger",
									type: "button",
									onClick: ($event) => confirming.value = price
								}, [(0, vue_exports.createTextVNode)(" Löschen"), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ": " + (0, vue_exports.toDisplayString)(price.makeLabelDe), 1)], 8, ["onClick"])) : (0, vue_exports.createCommentVNode)("", true)])])) : (0, vue_exports.createCommentVNode)("", true)
							], 8, ["aria-current"]);
						}), 128))])])])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 1,
							kind: "empty",
							text: EMPTY_TEXT
						}))]),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: confirmOpen.value,
							"onUpdate:open": ($event) => confirmOpen.value = $event,
							title: `Preis für ${confirming.value?.makeLabelDe ?? ""} löschen?`,
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
//#region resources/js/Pages/Admin/Rdks/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Rdks/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-0c85a153"]]);
//#endregion
export { Index_default as default };
