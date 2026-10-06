import { t as AppLayout_default } from "./AppLayout-DhCuH0p_.js";
import { a as link_default, i as head_default, o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as Icon_default } from "./Icon-DUS6sqAV.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { x as useShared } from "./useShortcuts-B6ckgfRC.js";
//#region resources/js/Pages/Kontakt/Index.vue?vue&type=script&setup=true&lang.ts
var DRAFT_KEY = "rmf-kontakt-entwurf";
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AppLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		contact: {},
		prefill: {}
	},
	setup(__props) {
		/**
		* Kontakt: the contact form (the client's #12, D-123).
		*
		* Name, e-mail, subject and message go to `POST /kontakt` (ContactRequest, ContactMessagePolicy): the message is kept
		* for the team (Verkauf › Nachrichten), mailed to the shop with the sender as reply-to, and confirmed to the sender.
		* Every e-mail button in the shop leads here (#26), with a subject where the page knows one and the path it came from.
		*
		* The chosen car is offered as a ticked box — the first thing we would ask is which car the question is about — and
		* the server names it from the visitor's own cookie, never from the form. `rmf_leer` is the honeypot: a field nobody
		* sees, so a filled one is a script. A draft survives a failed send (a limit, an expired page) in this tab's own
		* storage, so the visitor never finds the form cleared (R-09).
		*
		* Every contact detail renders from `config('rimify.contact')` (D-023). No reply-time promise: the client gave service
		* hours, not a response time.
		*/
		const props = __props;
		const shared = useShared();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle ?? null);
		const vehicleLine = (0, vue_exports.computed)(() => vehicle.value === null ? null : `${vehicle.value.label} (${vehicle.value.approval ?? vehicle.value.keyNumbers})`);
		const copyByMail = (0, vue_exports.computed)(() => shared.value.notifyByMail === true);
		const form = useForm({
			name: "",
			email: "",
			subject: props.prefill?.subject ?? "",
			message: "",
			withVehicle: true,
			from: props.prefill?.from ?? null,
			rmf_leer: ""
		});
		const sent = (0, vue_exports.ref)(false);
		(0, vue_exports.useTemplateRef)("done");
		function readDraft() {
			try {
				const raw = window.sessionStorage.getItem(DRAFT_KEY);
				return raw === null ? null : JSON.parse(raw);
			} catch {
				return null;
			}
		}
		function writeDraft() {
			try {
				window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
					name: form.name,
					email: form.email,
					subject: form.subject,
					message: form.message
				}));
			} catch {}
		}
		(0, vue_exports.onMounted)(() => {
			const draft = readDraft();
			if (draft === null) return;
			form.name = typeof draft.name === "string" ? draft.name : form.name;
			form.email = typeof draft.email === "string" ? draft.email : form.email;
			form.message = typeof draft.message === "string" ? draft.message : form.message;
			if (form.message.trim() !== "" && typeof draft.subject === "string" && draft.subject.trim() !== "") form.subject = draft.subject;
			else if (!props.prefill?.subject && typeof draft.subject === "string") form.subject = draft.subject;
		});
		(0, vue_exports.watch)(() => [
			form.name,
			form.email,
			form.subject,
			form.message
		], writeDraft);
		const offline = (0, vue_exports.ref)(false);
		const telHref = (0, vue_exports.computed)(() => `tel:${(props.contact.phoneIntl ?? props.contact.phone ?? "").replace(/\s/g, "")}`);
		const waHref = (0, vue_exports.computed)(() => `https://wa.me/${(props.contact.whatsapp ?? "").replace(/[^0-9]/g, "")}`);
		const backHref = (0, vue_exports.computed)(() => props.prefill?.from ?? "/");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[-->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(head_default), { title: "Kontakt" }, null, _parent));
			_push(`<section class="section--tight" data-v-dd785223><div class="container grid kon" data-v-dd785223><header class="kon__head" data-v-dd785223><h1 class="h1" data-v-dd785223>Kontakt</h1><p class="body-l muted prose kon__lead" data-v-dd785223>Fragen zur Passform, zu einer Bestellung oder zu einem Gutachten? Schreib uns.</p></header><div class="kon__main" data-v-dd785223>`);
			if (sent.value) {
				_push(`<div class="kon__done" role="status" tabindex="-1" data-v-dd785223><h2 class="h3 kon__done-title" data-v-dd785223>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "check",
					size: 24,
					class: "kon__done-mark"
				}, null, _parent));
				_push(`<span data-v-dd785223>Danke${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).name ? `, ${(0, vue_exports.unref)(form).name}` : "")} – deine Nachricht ist angekommen.</span></h2><p class="body muted kon__done-text" data-v-dd785223> Wir antworten dir an <strong class="kon__email" data-v-dd785223>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).email)}</strong>.`);
				if (copyByMail.value) _push(`<!--[--> Eine Kopie deiner Nachricht ist schon in deinem Postfach.<!--]-->`);
				else _push(`<!---->`);
				_push(`</p><div class="kon__done-go" data-v-dd785223>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					class: "btn btn--primary",
					href: backHref.value
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(__props.prefill?.from ? "Zurück zur vorherigen Seite" : "Zur Startseite")}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.prefill?.from ? "Zurück zur vorherigen Seite" : "Zur Startseite"), 1)];
					}),
					_: 1
				}, _parent));
				_push(`<button class="btn btn--secondary" type="button" data-v-dd785223>Noch eine Nachricht schreiben</button></div></div>`);
			} else {
				_push(`<form class="kon__form" novalidate data-v-dd785223><div class="kon__pair" data-v-dd785223><div class="form-field" data-v-dd785223><label class="form-field__label" for="kon-name" data-v-dd785223>Dein Name</label><input id="kon-name"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).name)} class="input" type="text" autocomplete="name" maxlength="120" aria-describedby="kon-name-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.name ? "true" : void 0)} data-v-dd785223><p id="kon-name-err" class="form-field__error" data-v-dd785223>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.name ?? "")}</p></div><div class="form-field" data-v-dd785223><label class="form-field__label" for="kon-email" data-v-dd785223>Deine E-Mail-Adresse</label><input id="kon-email"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).email)} class="input" type="email" inputmode="email" autocomplete="email" maxlength="190" aria-describedby="kon-email-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.email ? "true" : void 0)} data-v-dd785223><p id="kon-email-err" class="form-field__error" data-v-dd785223>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.email ?? "")}</p></div></div><div class="form-field" data-v-dd785223><label class="form-field__label" for="kon-subject" data-v-dd785223>Betreff</label><input id="kon-subject"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).subject)} class="input" type="text" maxlength="150" placeholder="z. B. Frage zu einer Felge" aria-describedby="kon-subject-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.subject ? "true" : void 0)} data-v-dd785223><p id="kon-subject-err" class="form-field__error" data-v-dd785223>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.subject ?? "")}</p></div><div class="form-field" data-v-dd785223><label class="form-field__label" for="kon-message" data-v-dd785223>Deine Nachricht</label><textarea id="kon-message" class="input kon__area" rows="7" maxlength="5000"${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", vehicle.value ? "kon-message-err" : "kon-message-help kon-message-err")}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.message ? "true" : void 0)} data-v-dd785223>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).message)}</textarea>`);
				if (!vehicle.value) _push(`<p id="kon-message-help" class="form-field__help" data-v-dd785223>Geht es um die Passform? Dann nenn uns gern HSN, TSN und Modell – du findest sie im Fahrzeugschein.</p>`);
				else _push(`<!---->`);
				_push(`<p id="kon-message-err" class="form-field__error" data-v-dd785223>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.message ?? "")}</p></div>`);
				if (vehicleLine.value) _push(`<label class="check kon__vehicle" data-v-dd785223><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).withVehicle) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).withVehicle, null) : (0, vue_exports.unref)(form).withVehicle) ? " checked" : ""} type="checkbox" data-v-dd785223><span data-v-dd785223>Mein Fahrzeug mitschicken: <strong data-v-dd785223>${(0, server_renderer_exports.ssrInterpolate)(vehicleLine.value)}</strong></span></label>`);
				else _push(`<!---->`);
				_push(`<div class="kon__trap" aria-hidden="true" data-v-dd785223><label for="kon-leer" data-v-dd785223>Bitte dieses Feld leer lassen</label><input id="kon-leer"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).rmf_leer)} type="text" name="rmf_leer" tabindex="-1" autocomplete="off" data-v-dd785223></div><p class="small muted kon__privacy" data-v-dd785223> Wir verwenden deine Angaben nur, um deine Nachricht zu beantworten. Mehr dazu in der `);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/rechtliches/datenschutz" }, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Datenschutzerklärung`);
						else return [(0, vue_exports.createTextVNode)("Datenschutzerklärung")];
					}),
					_: 1
				}, _parent));
				_push(`. </p><div class="kon__go" data-v-dd785223><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)} data-v-dd785223>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "mail",
					size: 20
				}, null, _parent));
				_push(` Nachricht senden </button>`);
				if (copyByMail.value) _push(`<p class="small muted kon__copy" data-v-dd785223>Du bekommst eine Kopie an deine E-Mail-Adresse.</p>`);
				else _push(`<!---->`);
				_push(`</div>`);
				if (offline.value) _push(`<p class="notice notice--bad kon__offline" role="alert" data-v-dd785223> Die Nachricht ist nicht bei uns angekommen – die Verbindung ist gerade weg. Dein Text bleibt hier stehen; schick ihn gleich noch einmal. </p>`);
				else _push(`<!---->`);
				_push(`</form>`);
			}
			_push(`</div><aside class="kon__aside" aria-labelledby="kon-aside-title" data-v-dd785223><h2 id="kon-aside-title" class="h4" data-v-dd785223>Lieber direkt?</h2><ul class="kon__ways" data-v-dd785223><li class="kon__way kon__way--text" data-v-dd785223>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "mail",
				size: 20,
				class: "kon__way-mark"
			}, null, _parent));
			_push(`<span data-v-dd785223><span class="kon__way-value kon__way-value--copy" translate="no" data-v-dd785223>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.email)}</span><span class="kon__way-note" data-v-dd785223>Zum Kopieren in dein eigenes E-Mail-Programm</span></span></li>`);
			if (__props.contact.phone) {
				_push(`<li data-v-dd785223><a class="kon__way"${(0, server_renderer_exports.ssrRenderAttr)("href", telHref.value)} data-v-dd785223>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "phone",
					size: 20,
					class: "kon__way-mark"
				}, null, _parent));
				_push(`<span data-v-dd785223><span class="kon__way-value num" data-v-dd785223>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.phone)}</span><span class="kon__way-note" data-v-dd785223>Telefon</span></span></a></li>`);
			} else _push(`<!---->`);
			if (__props.contact.whatsapp) _push(`<li data-v-dd785223><a class="kon__way"${(0, server_renderer_exports.ssrRenderAttr)("href", waHref.value)} rel="noopener" data-v-dd785223><span class="kon__slot" aria-hidden="true" data-v-dd785223></span><span data-v-dd785223><span class="kon__way-value num" data-v-dd785223>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.whatsapp)}</span><span class="kon__way-note" data-v-dd785223>WhatsApp</span></span></a></li>`);
			else _push(`<!---->`);
			_push(`<li class="kon__hours" data-v-dd785223>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "clock",
				size: 20
			}, null, _parent));
			_push(`<span class="num" data-v-dd785223>${(0, server_renderer_exports.ssrInterpolate)(__props.contact.hours)}</span></li></ul></aside></div></section><!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Kontakt/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Kontakt/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-dd785223"]]);
//#endregion
export { Index_default as default };
