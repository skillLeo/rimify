import { t as Dialog_default } from "./Dialog-BPdFERzS.js";
import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-DeAbrKC4.js";
import { o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as focusRefused, t as afterDialogsClose } from "./focusRefused-BCX3fX_F.js";
//#region resources/js/Pages/Admin/Fahrzeuge/Neu.vue?vue&type=script&setup=true&lang.ts
var Neu_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Neu",
	__ssrInlineRender: true,
	props: {
		bodyForms: {},
		drives: {}
	},
	setup(__props) {
		/**
		* Fahrzeuge › Neues Fahrzeug (his admin items 1 and 3, D-296): a car typed by hand from its Zulassungsbescheinigung
		* Teil I, each field with the number it stands under in the papers. HSN and TSN are how a customer finds the car; field K
		* and the Fahrzeugtyp are how the Gutachten name it; the axle loads (8.1, 8.2) are what its tyres are answered from
		* (R-03). An axle load left empty costs what the dialog says before it saves, and the car waits under „Zur Prüfung“. The
		* top speed (T) is asked only where a released Gutachten needs it (D-287) — none names a car not yet saved, so it is
		* optional here and its page asks for it once one does.
		*
		* One column, as every admin form; what the papers print side by side stands side by side: 2.1 and 2.2, 8.1 and 8.2,
		* the start and the end of the build window.
		*/
		const form = useForm({
			make: "",
			model: "",
			variant: "",
			type_designation: "",
			hsn: "",
			tsn: "",
			eg_number: "",
			power_kw: "",
			build_from: "",
			build_to: "",
			body_form: "",
			drive_axle: "",
			axle_load_front_kg: "",
			axle_load_rear_kg: "",
			max_speed_kmh: ""
		});
		const errors = (0, vue_exports.computed)(() => form.errors);
		/** The axle loads left empty, each on its own as the vehicle's page names them (D-291): the tyres wait for them (R-03). */
		const missingAxles = (0, vue_exports.computed)(() => [...form.axle_load_front_kg.trim() === "" ? [{
			id: "fn-front",
			field: "8.1",
			name: "Achslast vorn"
		}] : [], ...form.axle_load_rear_kg.trim() === "" ? [{
			id: "fn-rear",
			field: "8.2",
			name: "Achslast hinten"
		}] : []]);
		/** The question before saving, naming only what is missing. */
		const warning = (0, vue_exports.computed)(() => {
			const both = missingAxles.value.length > 1;
			const what = both ? "Achslasten" : missingAxles.value[0]?.name ?? "";
			const where = both ? "aus den Feldern 8.1 und 8.2" : `aus Feld ${missingAxles.value[0]?.field ?? ""}`;
			return {
				title: `Ohne ${what} anlegen?`,
				body: `Ohne die ${what} ${where} bestätigt der Shop für dieses Fahrzeug keine Reifen und verkauft kein Komplettrad. Eine Felge allein verkauft er nur, wo ihre Freigabe nicht an einer Achslast hängt. Das Fahrzeug steht unter „Zur Prüfung“, bis du die fehlenden Werte einträgst.`,
				save: `Ohne ${what} anlegen`,
				enter: `${what} eintragen`
			};
		});
		/**
		* The fields ManualVehicleRequest requires. While one is empty the server refuses the save anyway, so the form is sent
		* without the question and each field says what it needs — the empty form asked about axle loads first, and named
		* Hersteller, HSN … only after „Ohne Achslasten anlegen“ (the admin audit's F-02).
		*/
		const REQUIRED = [
			"make",
			"model",
			"variant",
			"hsn",
			"tsn",
			"eg_number",
			"power_kw",
			"build_from"
		];
		const requiredEmpty = (0, vue_exports.computed)(() => REQUIRED.some((field) => form[field].trim() === ""));
		const warnOpen = (0, vue_exports.ref)(false);
		/** Where the focus goes when the dialog closes on „… eintragen“: the first empty axle load, not the button that opened it. */
		let enterAt = null;
		function submit() {
			if (form.processing) return;
			if (missingAxles.value.length > 0 && !requiredEmpty.value) {
				warnOpen.value = true;
				return;
			}
			send();
		}
		function send() {
			warnOpen.value = false;
			form.post("/admin/fahrzeuge", {
				preserveScroll: true,
				onError: () => afterDialogsClose(() => focusRefused(".fn-form"))
			});
		}
		function enterAxles() {
			enterAt = missingAxles.value[0]?.id ?? null;
			warnOpen.value = false;
		}
		function onWarnClosed(event) {
			const field = enterAt === null ? null : document.getElementById(enterAt);
			enterAt = null;
			if (field !== null) {
				event.preventDefault();
				field.focus();
			}
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Neues Fahrzeug",
				context: "Aus der Zulassungsbescheinigung Teil I, von Hand geprüft"
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<form class="adm-form fn-form" novalidate data-v-efcbb8e7${_scopeId}><section class="adm-form__group" aria-labelledby="fn-h-car" data-v-efcbb8e7${_scopeId}><h2 id="fn-h-car" class="adm-form__heading" data-v-efcbb8e7${_scopeId}>Das Fahrzeug</h2><div class="fn-grid" data-v-efcbb8e7${_scopeId}><div class="form-field" data-v-efcbb8e7${_scopeId}><label class="form-field__label" for="fn-make" data-v-efcbb8e7${_scopeId}>Hersteller <span class="fn-field" data-v-efcbb8e7${_scopeId}>(Feld D.1)</span></label><input id="fn-make"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).make)} class="input" type="text" maxlength="60" placeholder="BMW"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.make ? "true" : void 0)} aria-describedby="fn-make-err" data-v-efcbb8e7${_scopeId}><p id="fn-make-err" class="form-field__error" data-v-efcbb8e7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.make)}</p></div><div class="form-field" data-v-efcbb8e7${_scopeId}><label class="form-field__label" for="fn-model" data-v-efcbb8e7${_scopeId}>Handelsbezeichnung <span class="fn-field" data-v-efcbb8e7${_scopeId}>(Feld D.3)</span></label><input id="fn-model"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).model)} class="input" type="text" maxlength="80" placeholder="3er"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.model ? "true" : void 0)} aria-describedby="fn-model-err" data-v-efcbb8e7${_scopeId}><p id="fn-model-err" class="form-field__error" data-v-efcbb8e7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.model)}</p></div><div class="form-field" data-v-efcbb8e7${_scopeId}><label class="form-field__label" for="fn-variant" data-v-efcbb8e7${_scopeId}>Variante</label><input id="fn-variant"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).variant)} class="input" type="text" maxlength="80" placeholder="320i Limousine"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.variant ? "true" : void 0)} aria-describedby="fn-variant-help fn-variant-err" data-v-efcbb8e7${_scopeId}><p id="fn-variant-help" class="form-field__help" data-v-efcbb8e7${_scopeId}>So, wie Kunden das Fahrzeug in der Auswahl finden.</p><p id="fn-variant-err" class="form-field__error" data-v-efcbb8e7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.variant)}</p></div><div class="form-field" data-v-efcbb8e7${_scopeId}><label class="form-field__label" for="fn-type" data-v-efcbb8e7${_scopeId}>Fahrzeugtyp <span class="fn-field" data-v-efcbb8e7${_scopeId}>(Feld D.2, optional)</span></label><input id="fn-type"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).type_designation)} class="input fn-mid" type="text" maxlength="32" spellcheck="false" placeholder="3C"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.type_designation ? "true" : void 0)} aria-describedby="fn-type-help fn-type-err" data-v-efcbb8e7${_scopeId}><p id="fn-type-help" class="form-field__help" data-v-efcbb8e7${_scopeId}>Die erste Angabe in Feld D.2 – so nennen die Gutachten den Typ.</p><p id="fn-type-err" class="form-field__error" data-v-efcbb8e7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.type_designation)}</p></div></div></section><section class="adm-form__group" aria-labelledby="fn-h-keys" data-v-efcbb8e7${_scopeId}><h2 id="fn-h-keys" class="adm-form__heading" data-v-efcbb8e7${_scopeId}>Schlüsselnummern und Typgenehmigung</h2><div class="fn-grid" data-v-efcbb8e7${_scopeId}><div class="fn-pair" data-v-efcbb8e7${_scopeId}><div class="form-field" data-v-efcbb8e7${_scopeId}><label class="form-field__label" for="fn-hsn" data-v-efcbb8e7${_scopeId}>HSN <span class="fn-field" data-v-efcbb8e7${_scopeId}>(Feld 2.1)</span></label><input id="fn-hsn"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).hsn)} class="input input--code" type="text" inputmode="numeric" spellcheck="false" autocomplete="off" placeholder="0005"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.hsn ? "true" : void 0)} aria-describedby="fn-hsn-err" data-v-efcbb8e7${_scopeId}><p id="fn-hsn-err" class="form-field__error" data-v-efcbb8e7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.hsn)}</p></div><div class="form-field" data-v-efcbb8e7${_scopeId}><label class="form-field__label" for="fn-tsn" data-v-efcbb8e7${_scopeId}>TSN <span class="fn-field" data-v-efcbb8e7${_scopeId}>(Feld 2.2)</span></label><input id="fn-tsn"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).tsn)} class="input input--code" type="text" spellcheck="false" autocomplete="off" autocapitalize="characters" placeholder="AFD"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.tsn ? "true" : void 0)} aria-describedby="fn-tsn-help fn-tsn-err" data-v-efcbb8e7${_scopeId}><p id="fn-tsn-help" class="form-field__help" data-v-efcbb8e7${_scopeId}>Die ersten drei Zeichen aus Feld 2.2.</p><p id="fn-tsn-err" class="form-field__error" data-v-efcbb8e7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.tsn)}</p></div></div><div class="form-field" data-v-efcbb8e7${_scopeId}><label class="form-field__label" for="fn-eg" data-v-efcbb8e7${_scopeId}>EG-Typgenehmigungsnummer <span class="fn-field" data-v-efcbb8e7${_scopeId}>(Feld K)</span></label><input id="fn-eg"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).eg_number)} class="input num" type="text" maxlength="64" spellcheck="false" autocomplete="off" placeholder="e1*2007/46*0316*12"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.eg_number ? "true" : void 0)} aria-describedby="fn-eg-help fn-eg-err" data-v-efcbb8e7${_scopeId}><p id="fn-eg-help" class="form-field__help" data-v-efcbb8e7${_scopeId}>Bei älteren Fahrzeugen steht hier eine nationale ABE-Nummer. Über die Nummer und den Fahrzeugtyp findest du das Fahrzeug, wenn du die Zeilen eines Gutachtens erfasst.</p><p id="fn-eg-err" class="form-field__error" data-v-efcbb8e7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.eg_number)}</p></div></div></section><section class="adm-form__group" aria-labelledby="fn-h-build" data-v-efcbb8e7${_scopeId}><h2 id="fn-h-build" class="adm-form__heading" data-v-efcbb8e7${_scopeId}>Leistung, Bauzeit, Karosserie und Antrieb</h2><div class="fn-grid" data-v-efcbb8e7${_scopeId}><div class="form-field" data-v-efcbb8e7${_scopeId}><label class="form-field__label" for="fn-kw" data-v-efcbb8e7${_scopeId}>Leistung in kW <span class="fn-field" data-v-efcbb8e7${_scopeId}>(Feld P.2)</span></label><input id="fn-kw"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).power_kw)} class="input fn-short num" type="text" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="135"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.power_kw ? "true" : void 0)} aria-describedby="fn-kw-help fn-kw-err" data-v-efcbb8e7${_scopeId}><p id="fn-kw-help" class="form-field__help" data-v-efcbb8e7${_scopeId}>Die erste Zahl in Feld P.2.</p><p id="fn-kw-err" class="form-field__error" data-v-efcbb8e7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.power_kw)}</p></div><div class="fn-window" data-v-efcbb8e7${_scopeId}><div class="fn-pair" data-v-efcbb8e7${_scopeId}><div class="form-field" data-v-efcbb8e7${_scopeId}><label class="form-field__label" for="fn-from" data-v-efcbb8e7${_scopeId}>Gebaut ab</label><input id="fn-from"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).build_from)} class="input num" type="text" inputmode="decimal" maxlength="7" autocomplete="off" placeholder="MM.JJJJ"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.build_from ? "true" : void 0)} aria-describedby="fn-window-help fn-from-err" data-v-efcbb8e7${_scopeId}><p id="fn-from-err" class="form-field__error" data-v-efcbb8e7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.build_from)}</p></div><div class="form-field" data-v-efcbb8e7${_scopeId}><label class="form-field__label" for="fn-to" data-v-efcbb8e7${_scopeId}>Gebaut bis <span class="fn-optional" data-v-efcbb8e7${_scopeId}>(optional)</span></label><input id="fn-to"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).build_to)} class="input num" type="text" inputmode="decimal" maxlength="7" autocomplete="off" placeholder="MM.JJJJ"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.build_to ? "true" : void 0)} aria-describedby="fn-window-help fn-to-err" data-v-efcbb8e7${_scopeId}><p id="fn-to-err" class="form-field__error" data-v-efcbb8e7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.build_to)}</p></div></div><p id="fn-window-help" class="form-field__help" data-v-efcbb8e7${_scopeId}>Monat und Jahr, von wann bis wann das Fahrzeug in dieser Variante gebaut wird – nicht die Erstzulassung aus Feld B. „Gebaut bis“ bleibt leer, wenn es noch gebaut wird.</p></div><div class="form-field" data-v-efcbb8e7${_scopeId}><label class="form-field__label" for="fn-body" data-v-efcbb8e7${_scopeId}>Karosserie <span class="fn-optional" data-v-efcbb8e7${_scopeId}>(optional)</span></label><select id="fn-body" class="input fn-mid"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.body_form ? "true" : void 0)} aria-describedby="fn-body-err" data-v-efcbb8e7${_scopeId}><option value="" data-v-efcbb8e7${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).body_form) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).body_form, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).body_form, "")) ? " selected" : ""}${_scopeId}>Nicht angegeben</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.bodyForms, (body) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", body)} data-v-efcbb8e7${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).body_form) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).body_form, body) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).body_form, body)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(body)}</option>`);
						});
						_push(`<!--]--></select><p id="fn-body-err" class="form-field__error" data-v-efcbb8e7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.body_form)}</p></div><div class="form-field" data-v-efcbb8e7${_scopeId}><label class="form-field__label" for="fn-drive" data-v-efcbb8e7${_scopeId}>Antrieb <span class="fn-optional" data-v-efcbb8e7${_scopeId}>(optional)</span></label><select id="fn-drive" class="input fn-mid"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.drive_axle ? "true" : void 0)} aria-describedby="fn-drive-err" data-v-efcbb8e7${_scopeId}><option value="" data-v-efcbb8e7${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).drive_axle) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).drive_axle, "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).drive_axle, "")) ? " selected" : ""}${_scopeId}>Nicht angegeben</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.drives, (drive) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", drive)} data-v-efcbb8e7${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).drive_axle) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).drive_axle, drive) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).drive_axle, drive)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(drive)}</option>`);
						});
						_push(`<!--]--></select><p id="fn-drive-err" class="form-field__error" data-v-efcbb8e7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.drive_axle)}</p></div></div></section><section class="adm-form__group" aria-labelledby="fn-h-tyres" data-v-efcbb8e7${_scopeId}><h2 id="fn-h-tyres" class="adm-form__heading" data-v-efcbb8e7${_scopeId}>Für die Reifen</h2><div class="fn-grid" data-v-efcbb8e7${_scopeId}><div class="fn-pair" data-v-efcbb8e7${_scopeId}><div class="form-field" data-v-efcbb8e7${_scopeId}><label class="form-field__label" for="fn-front" data-v-efcbb8e7${_scopeId}>Achslast vorn in kg <span class="fn-field" data-v-efcbb8e7${_scopeId}>(Feld 8.1)</span></label><input id="fn-front"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).axle_load_front_kg)} class="input num" type="text" inputmode="numeric" maxlength="5" autocomplete="off" placeholder="1.160"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.axle_load_front_kg ? "true" : void 0)} aria-describedby="fn-front-err" data-v-efcbb8e7${_scopeId}><p id="fn-front-err" class="form-field__error" data-v-efcbb8e7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.axle_load_front_kg)}</p></div><div class="form-field" data-v-efcbb8e7${_scopeId}><label class="form-field__label" for="fn-rear" data-v-efcbb8e7${_scopeId}>Achslast hinten in kg <span class="fn-field" data-v-efcbb8e7${_scopeId}>(Feld 8.2)</span></label><input id="fn-rear"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).axle_load_rear_kg)} class="input num" type="text" inputmode="numeric" maxlength="5" autocomplete="off" placeholder="1.240"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.axle_load_rear_kg ? "true" : void 0)} aria-describedby="fn-rear-err" data-v-efcbb8e7${_scopeId}><p id="fn-rear-err" class="form-field__error" data-v-efcbb8e7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.axle_load_rear_kg)}</p></div></div><div class="form-field" data-v-efcbb8e7${_scopeId}><label class="form-field__label" for="fn-speed" data-v-efcbb8e7${_scopeId}>Höchstgeschwindigkeit in km/h <span class="fn-field" data-v-efcbb8e7${_scopeId}>(Feld T, optional)</span></label><input id="fn-speed"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).max_speed_kmh)} class="input fn-short num" type="text" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="230"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.max_speed_kmh ? "true" : void 0)} aria-describedby="fn-speed-help fn-speed-err" data-v-efcbb8e7${_scopeId}><p id="fn-speed-help" class="form-field__help" data-v-efcbb8e7${_scopeId}>Ohne sie steht das Fahrzeug unter „Zur Prüfung“. Nötig wird sie erst, wenn ein freigegebenes Gutachten dieses Fahrzeug nennt und sie für die Reifen braucht. Die Seite des Fahrzeugs nennt es dir dann.</p><p id="fn-speed-err" class="form-field__error" data-v-efcbb8e7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.max_speed_kmh)}</p></div></div></section><div class="fn-actions" data-v-efcbb8e7${_scopeId}><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)} data-v-efcbb8e7${_scopeId}>Fahrzeug anlegen</button></div></form>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
							open: warnOpen.value,
							"onUpdate:open": ($event) => warnOpen.value = $event,
							title: warning.value.title,
							description: warning.value.body,
							"content-class": "adm-dialog adm-dialog--narrow",
							"initial-focus": "#fn-warn-enter",
							onCloseAutoFocus: onWarnClosed
						}, {
							actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<button class="btn btn--secondary adm-btn--danger" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)} data-v-efcbb8e7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(warning.value.save)}</button><button id="fn-warn-enter" class="btn btn--primary" type="button" data-v-efcbb8e7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(warning.value.enter)}</button>`);
								else return [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary adm-btn--danger",
									type: "button",
									"aria-busy": (0, vue_exports.unref)(form).processing ? "true" : void 0,
									onClick: send
								}, (0, vue_exports.toDisplayString)(warning.value.save), 9, ["aria-busy"]), (0, vue_exports.createVNode)("button", {
									id: "fn-warn-enter",
									class: "btn btn--primary",
									type: "button",
									onClick: enterAxles
								}, (0, vue_exports.toDisplayString)(warning.value.enter), 1)];
							}),
							_: 1
						}, _parent, _scopeId));
					} else return [(0, vue_exports.createVNode)("form", {
						class: "adm-form fn-form",
						novalidate: "",
						onSubmit: (0, vue_exports.withModifiers)(submit, ["prevent"])
					}, [
						(0, vue_exports.createVNode)("section", {
							class: "adm-form__group",
							"aria-labelledby": "fn-h-car"
						}, [(0, vue_exports.createVNode)("h2", {
							id: "fn-h-car",
							class: "adm-form__heading"
						}, "Das Fahrzeug"), (0, vue_exports.createVNode)("div", { class: "fn-grid" }, [
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fn-make"
								}, [(0, vue_exports.createTextVNode)("Hersteller "), (0, vue_exports.createVNode)("span", { class: "fn-field" }, "(Feld D.1)")]),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "fn-make",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).make = $event,
									class: "input",
									type: "text",
									maxlength: "60",
									placeholder: "BMW",
									"aria-invalid": errors.value.make ? "true" : void 0,
									"aria-describedby": "fn-make-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).make]]),
								(0, vue_exports.createVNode)("p", {
									id: "fn-make-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.make), 1)
							]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fn-model"
								}, [(0, vue_exports.createTextVNode)("Handelsbezeichnung "), (0, vue_exports.createVNode)("span", { class: "fn-field" }, "(Feld D.3)")]),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "fn-model",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).model = $event,
									class: "input",
									type: "text",
									maxlength: "80",
									placeholder: "3er",
									"aria-invalid": errors.value.model ? "true" : void 0,
									"aria-describedby": "fn-model-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).model]]),
								(0, vue_exports.createVNode)("p", {
									id: "fn-model-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.model), 1)
							]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fn-variant"
								}, "Variante"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "fn-variant",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).variant = $event,
									class: "input",
									type: "text",
									maxlength: "80",
									placeholder: "320i Limousine",
									"aria-invalid": errors.value.variant ? "true" : void 0,
									"aria-describedby": "fn-variant-help fn-variant-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).variant]]),
								(0, vue_exports.createVNode)("p", {
									id: "fn-variant-help",
									class: "form-field__help"
								}, "So, wie Kunden das Fahrzeug in der Auswahl finden."),
								(0, vue_exports.createVNode)("p", {
									id: "fn-variant-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.variant), 1)
							]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fn-type"
								}, [(0, vue_exports.createTextVNode)("Fahrzeugtyp "), (0, vue_exports.createVNode)("span", { class: "fn-field" }, "(Feld D.2, optional)")]),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "fn-type",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).type_designation = $event,
									class: "input fn-mid",
									type: "text",
									maxlength: "32",
									spellcheck: "false",
									placeholder: "3C",
									"aria-invalid": errors.value.type_designation ? "true" : void 0,
									"aria-describedby": "fn-type-help fn-type-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).type_designation]]),
								(0, vue_exports.createVNode)("p", {
									id: "fn-type-help",
									class: "form-field__help"
								}, "Die erste Angabe in Feld D.2 – so nennen die Gutachten den Typ."),
								(0, vue_exports.createVNode)("p", {
									id: "fn-type-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.type_designation), 1)
							])
						])]),
						(0, vue_exports.createVNode)("section", {
							class: "adm-form__group",
							"aria-labelledby": "fn-h-keys"
						}, [(0, vue_exports.createVNode)("h2", {
							id: "fn-h-keys",
							class: "adm-form__heading"
						}, "Schlüsselnummern und Typgenehmigung"), (0, vue_exports.createVNode)("div", { class: "fn-grid" }, [(0, vue_exports.createVNode)("div", { class: "fn-pair" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "fn-hsn"
							}, [(0, vue_exports.createTextVNode)("HSN "), (0, vue_exports.createVNode)("span", { class: "fn-field" }, "(Feld 2.1)")]),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "fn-hsn",
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).hsn = $event,
								class: "input input--code",
								type: "text",
								inputmode: "numeric",
								spellcheck: "false",
								autocomplete: "off",
								placeholder: "0005",
								"aria-invalid": errors.value.hsn ? "true" : void 0,
								"aria-describedby": "fn-hsn-err"
							}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).hsn]]),
							(0, vue_exports.createVNode)("p", {
								id: "fn-hsn-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value.hsn), 1)
						]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "fn-tsn"
							}, [(0, vue_exports.createTextVNode)("TSN "), (0, vue_exports.createVNode)("span", { class: "fn-field" }, "(Feld 2.2)")]),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "fn-tsn",
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).tsn = $event,
								class: "input input--code",
								type: "text",
								spellcheck: "false",
								autocomplete: "off",
								autocapitalize: "characters",
								placeholder: "AFD",
								"aria-invalid": errors.value.tsn ? "true" : void 0,
								"aria-describedby": "fn-tsn-help fn-tsn-err"
							}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).tsn]]),
							(0, vue_exports.createVNode)("p", {
								id: "fn-tsn-help",
								class: "form-field__help"
							}, "Die ersten drei Zeichen aus Feld 2.2."),
							(0, vue_exports.createVNode)("p", {
								id: "fn-tsn-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value.tsn), 1)
						])]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "fn-eg"
							}, [(0, vue_exports.createTextVNode)("EG-Typgenehmigungsnummer "), (0, vue_exports.createVNode)("span", { class: "fn-field" }, "(Feld K)")]),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "fn-eg",
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).eg_number = $event,
								class: "input num",
								type: "text",
								maxlength: "64",
								spellcheck: "false",
								autocomplete: "off",
								placeholder: "e1*2007/46*0316*12",
								"aria-invalid": errors.value.eg_number ? "true" : void 0,
								"aria-describedby": "fn-eg-help fn-eg-err"
							}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).eg_number]]),
							(0, vue_exports.createVNode)("p", {
								id: "fn-eg-help",
								class: "form-field__help"
							}, "Bei älteren Fahrzeugen steht hier eine nationale ABE-Nummer. Über die Nummer und den Fahrzeugtyp findest du das Fahrzeug, wenn du die Zeilen eines Gutachtens erfasst."),
							(0, vue_exports.createVNode)("p", {
								id: "fn-eg-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value.eg_number), 1)
						])])]),
						(0, vue_exports.createVNode)("section", {
							class: "adm-form__group",
							"aria-labelledby": "fn-h-build"
						}, [(0, vue_exports.createVNode)("h2", {
							id: "fn-h-build",
							class: "adm-form__heading"
						}, "Leistung, Bauzeit, Karosserie und Antrieb"), (0, vue_exports.createVNode)("div", { class: "fn-grid" }, [
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fn-kw"
								}, [(0, vue_exports.createTextVNode)("Leistung in kW "), (0, vue_exports.createVNode)("span", { class: "fn-field" }, "(Feld P.2)")]),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "fn-kw",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).power_kw = $event,
									class: "input fn-short num",
									type: "text",
									inputmode: "numeric",
									maxlength: "4",
									autocomplete: "off",
									placeholder: "135",
									"aria-invalid": errors.value.power_kw ? "true" : void 0,
									"aria-describedby": "fn-kw-help fn-kw-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).power_kw]]),
								(0, vue_exports.createVNode)("p", {
									id: "fn-kw-help",
									class: "form-field__help"
								}, "Die erste Zahl in Feld P.2."),
								(0, vue_exports.createVNode)("p", {
									id: "fn-kw-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.power_kw), 1)
							]),
							(0, vue_exports.createVNode)("div", { class: "fn-window" }, [(0, vue_exports.createVNode)("div", { class: "fn-pair" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fn-from"
								}, "Gebaut ab"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "fn-from",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).build_from = $event,
									class: "input num",
									type: "text",
									inputmode: "decimal",
									maxlength: "7",
									autocomplete: "off",
									placeholder: "MM.JJJJ",
									"aria-invalid": errors.value.build_from ? "true" : void 0,
									"aria-describedby": "fn-window-help fn-from-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).build_from]]),
								(0, vue_exports.createVNode)("p", {
									id: "fn-from-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.build_from), 1)
							]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fn-to"
								}, [(0, vue_exports.createTextVNode)("Gebaut bis "), (0, vue_exports.createVNode)("span", { class: "fn-optional" }, "(optional)")]),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "fn-to",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).build_to = $event,
									class: "input num",
									type: "text",
									inputmode: "decimal",
									maxlength: "7",
									autocomplete: "off",
									placeholder: "MM.JJJJ",
									"aria-invalid": errors.value.build_to ? "true" : void 0,
									"aria-describedby": "fn-window-help fn-to-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).build_to]]),
								(0, vue_exports.createVNode)("p", {
									id: "fn-to-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.build_to), 1)
							])]), (0, vue_exports.createVNode)("p", {
								id: "fn-window-help",
								class: "form-field__help"
							}, "Monat und Jahr, von wann bis wann das Fahrzeug in dieser Variante gebaut wird – nicht die Erstzulassung aus Feld B. „Gebaut bis“ bleibt leer, wenn es noch gebaut wird.")]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fn-body"
								}, [(0, vue_exports.createTextVNode)("Karosserie "), (0, vue_exports.createVNode)("span", { class: "fn-optional" }, "(optional)")]),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "fn-body",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).body_form = $event,
									class: "input fn-mid",
									"aria-invalid": errors.value.body_form ? "true" : void 0,
									"aria-describedby": "fn-body-err"
								}, [(0, vue_exports.createVNode)("option", { value: "" }, "Nicht angegeben"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.bodyForms, (body) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
										key: body,
										value: body
									}, (0, vue_exports.toDisplayString)(body), 9, ["value"]);
								}), 128))], 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(form).body_form]]),
								(0, vue_exports.createVNode)("p", {
									id: "fn-body-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.body_form), 1)
							]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fn-drive"
								}, [(0, vue_exports.createTextVNode)("Antrieb "), (0, vue_exports.createVNode)("span", { class: "fn-optional" }, "(optional)")]),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "fn-drive",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).drive_axle = $event,
									class: "input fn-mid",
									"aria-invalid": errors.value.drive_axle ? "true" : void 0,
									"aria-describedby": "fn-drive-err"
								}, [(0, vue_exports.createVNode)("option", { value: "" }, "Nicht angegeben"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.drives, (drive) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
										key: drive,
										value: drive
									}, (0, vue_exports.toDisplayString)(drive), 9, ["value"]);
								}), 128))], 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(form).drive_axle]]),
								(0, vue_exports.createVNode)("p", {
									id: "fn-drive-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.drive_axle), 1)
							])
						])]),
						(0, vue_exports.createVNode)("section", {
							class: "adm-form__group",
							"aria-labelledby": "fn-h-tyres"
						}, [(0, vue_exports.createVNode)("h2", {
							id: "fn-h-tyres",
							class: "adm-form__heading"
						}, "Für die Reifen"), (0, vue_exports.createVNode)("div", { class: "fn-grid" }, [(0, vue_exports.createVNode)("div", { class: "fn-pair" }, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "fn-front"
							}, [(0, vue_exports.createTextVNode)("Achslast vorn in kg "), (0, vue_exports.createVNode)("span", { class: "fn-field" }, "(Feld 8.1)")]),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "fn-front",
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).axle_load_front_kg = $event,
								class: "input num",
								type: "text",
								inputmode: "numeric",
								maxlength: "5",
								autocomplete: "off",
								placeholder: "1.160",
								"aria-invalid": errors.value.axle_load_front_kg ? "true" : void 0,
								"aria-describedby": "fn-front-err"
							}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).axle_load_front_kg]]),
							(0, vue_exports.createVNode)("p", {
								id: "fn-front-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value.axle_load_front_kg), 1)
						]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "fn-rear"
							}, [(0, vue_exports.createTextVNode)("Achslast hinten in kg "), (0, vue_exports.createVNode)("span", { class: "fn-field" }, "(Feld 8.2)")]),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "fn-rear",
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).axle_load_rear_kg = $event,
								class: "input num",
								type: "text",
								inputmode: "numeric",
								maxlength: "5",
								autocomplete: "off",
								placeholder: "1.240",
								"aria-invalid": errors.value.axle_load_rear_kg ? "true" : void 0,
								"aria-describedby": "fn-rear-err"
							}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).axle_load_rear_kg]]),
							(0, vue_exports.createVNode)("p", {
								id: "fn-rear-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value.axle_load_rear_kg), 1)
						])]), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "fn-speed"
							}, [(0, vue_exports.createTextVNode)("Höchstgeschwindigkeit in km/h "), (0, vue_exports.createVNode)("span", { class: "fn-field" }, "(Feld T, optional)")]),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "fn-speed",
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).max_speed_kmh = $event,
								class: "input fn-short num",
								type: "text",
								inputmode: "numeric",
								maxlength: "3",
								autocomplete: "off",
								placeholder: "230",
								"aria-invalid": errors.value.max_speed_kmh ? "true" : void 0,
								"aria-describedby": "fn-speed-help fn-speed-err"
							}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).max_speed_kmh]]),
							(0, vue_exports.createVNode)("p", {
								id: "fn-speed-help",
								class: "form-field__help"
							}, "Ohne sie steht das Fahrzeug unter „Zur Prüfung“. Nötig wird sie erst, wenn ein freigegebenes Gutachten dieses Fahrzeug nennt und sie für die Reifen braucht. Die Seite des Fahrzeugs nennt es dir dann."),
							(0, vue_exports.createVNode)("p", {
								id: "fn-speed-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(errors.value.max_speed_kmh), 1)
						])])]),
						(0, vue_exports.createVNode)("div", { class: "fn-actions" }, [(0, vue_exports.createVNode)("button", {
							class: "btn btn--primary",
							type: "submit",
							disabled: (0, vue_exports.unref)(form).processing,
							"aria-busy": (0, vue_exports.unref)(form).processing ? "true" : void 0
						}, "Fahrzeug anlegen", 8, ["disabled", "aria-busy"])])
					], 32), (0, vue_exports.createVNode)(Dialog_default, {
						open: warnOpen.value,
						"onUpdate:open": ($event) => warnOpen.value = $event,
						title: warning.value.title,
						description: warning.value.body,
						"content-class": "adm-dialog adm-dialog--narrow",
						"initial-focus": "#fn-warn-enter",
						onCloseAutoFocus: onWarnClosed
					}, {
						actions: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("button", {
							class: "btn btn--secondary adm-btn--danger",
							type: "button",
							"aria-busy": (0, vue_exports.unref)(form).processing ? "true" : void 0,
							onClick: send
						}, (0, vue_exports.toDisplayString)(warning.value.save), 9, ["aria-busy"]), (0, vue_exports.createVNode)("button", {
							id: "fn-warn-enter",
							class: "btn btn--primary",
							type: "button",
							onClick: enterAxles
						}, (0, vue_exports.toDisplayString)(warning.value.enter), 1)]),
						_: 1
					}, 8, [
						"open",
						"onUpdate:open",
						"title",
						"description"
					])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Fahrzeuge/Neu.vue
var _sfc_setup = Neu_vue_vue_type_script_setup_true_lang_default.setup;
Neu_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Fahrzeuge/Neu.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Neu_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Neu_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-efcbb8e7"]]);
//#endregion
export { Neu_default as default };
