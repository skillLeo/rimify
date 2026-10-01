import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { t as Dialog_default } from "./Dialog-BCc6LoyQ.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Pages/Admin/Nachfrage/mailto.ts
/**
* A `mailto:` link with no recipient — the address is the sender's to fill in — carrying a subject and
* a text. RFC 6068: every line of the body ends in CRLF, and both are percent-encoded, so umlauts, „“
* and line breaks arrive in the mail program as they were written.
*/
function mailtoHref(subject, body) {
	const text = body.replace(/\r?\n/g, "\r\n");
	return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
}
//#endregion
//#region resources/js/Pages/Admin/Nachfrage/RequestDialog.vue?vue&type=script&setup=true&lang.ts
var RequestDialog_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "RequestDialog",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		gap: {},
		brands: {}
	}, {
		"open": {
			type: Boolean,
			default: false
		},
		"openModifiers": {}
	}),
	emits: /*@__PURE__*/ (0, vue_exports.mergeModels)(["requested"], ["update:open"]),
	setup(__props, { emit: __emit }) {
		/**
		* „Gutachten anfordern“: the request to a wheel brand, written and ready — subject and text from the
		* server, both editable — opened in the admin's own e-mail program. The brand's address is theirs to
		* fill in there: the shop keeps no contacts. Opening it records the gap as „angefordert“ (with the
		* brand, if one was chosen); copying the text records nothing, since nothing has been sent yet.
		*/
		const props = __props;
		const emit = __emit;
		const open = (0, vue_exports.useModel)(__props, "open");
		const brand = (0, vue_exports.ref)("");
		const subject = (0, vue_exports.ref)("");
		const body = (0, vue_exports.ref)("");
		const copied = (0, vue_exports.ref)(false);
		const copyFailed = (0, vue_exports.ref)(false);
		/** Sent once per opening: a double-click on the link — the dialog is still there while it fades — records one request and opens one e-mail. */
		const sentOnce = (0, vue_exports.ref)(false);
		(0, vue_exports.watch)(open, (value) => {
			if (value && props.gap) {
				brand.value = "";
				subject.value = props.gap.mail.subject;
				body.value = props.gap.mail.body;
				copied.value = false;
				copyFailed.value = false;
				sentOnce.value = false;
			}
		});
		function mailto() {
			return mailtoHref(subject.value, body.value);
		}
		async function copy() {
			try {
				await navigator.clipboard.writeText(`${subject.value}\n\n${body.value}`);
				copied.value = true;
				copyFailed.value = false;
				window.setTimeout(() => copied.value = false, 2e3);
			} catch {
				copied.value = false;
				copyFailed.value = true;
			}
		}
		function sent(event) {
			if (sentOnce.value) {
				event.preventDefault();
				return;
			}
			sentOnce.value = true;
			if (props.gap) emit("requested", props.gap, brand.value === "" ? null : Number(brand.value));
			open.value = false;
		}
		function onCloseFocus(event) {
			if (sentOnce.value) event.preventDefault();
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event,
				title: "Gutachten anfordern",
				description: __props.gap ? `Für ${__props.gap.title}. Die E-Mail öffnet sich in deinem E-Mail-Programm, die Adresse der Marke trägst du dort ein.` : void 0,
				"content-class": "adm-dialog",
				onCloseAutoFocus: onCloseFocus
			}, _attrs), {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-dc2a0911${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(copied.value ? "Kopiert" : "Text kopieren")}</button><a class="btn btn--primary"${(0, server_renderer_exports.ssrRenderAttr)("href", mailto())} data-v-dc2a0911${_scopeId}>Im E-Mail-Programm öffnen</a>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: copy
					}, (0, vue_exports.toDisplayString)(copied.value ? "Kopiert" : "Text kopieren"), 1), (0, vue_exports.createVNode)("a", {
						class: "btn btn--primary",
						href: mailto(),
						onClick: sent
					}, "Im E-Mail-Programm öffnen", 8, ["href"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="rq" data-v-dc2a0911${_scopeId}><div class="form-field" data-v-dc2a0911${_scopeId}><label class="form-field__label" for="demand-brand" data-v-dc2a0911${_scopeId}>Bei welcher Marke fragst du an?</label><select id="demand-brand" class="input" data-v-dc2a0911${_scopeId}><option value="" data-v-dc2a0911${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(brand.value) ? (0, server_renderer_exports.ssrLooseContain)(brand.value, "") : (0, server_renderer_exports.ssrLooseEqual)(brand.value, "")) ? " selected" : ""}${_scopeId}>Noch offen</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.brands, (b) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", String(b.id))} data-v-dc2a0911${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(brand.value) ? (0, server_renderer_exports.ssrLooseContain)(brand.value, String(b.id)) : (0, server_renderer_exports.ssrLooseEqual)(brand.value, String(b.id))) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(b.name)}</option>`);
						});
						_push(`<!--]--></select><span class="form-field__help" data-v-dc2a0911${_scopeId}>Die Marke steht dann bei der Lücke, damit niemand dieselbe Anfrage zweimal schickt.</span></div><div class="form-field" data-v-dc2a0911${_scopeId}><label class="form-field__label" for="demand-subject" data-v-dc2a0911${_scopeId}>Betreff</label><input id="demand-subject"${(0, server_renderer_exports.ssrRenderAttr)("value", subject.value)} class="input" type="text" autocomplete="off" data-v-dc2a0911${_scopeId}></div><div class="form-field" data-v-dc2a0911${_scopeId}><label class="form-field__label" for="demand-body" data-v-dc2a0911${_scopeId}>Text</label><textarea id="demand-body" class="input rq__body" rows="12" spellcheck="true" data-v-dc2a0911${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(body.value)}</textarea></div></div>`);
						if (copyFailed.value) _push(`<p class="form-field__error rq__error" role="alert" data-v-dc2a0911${_scopeId}>Betreff und Text konnten nicht kopiert werden. Kopier sie von Hand oder öffne die E-Mail mit „Im E-Mail-Programm öffnen“.</p>`);
						else _push(`<!---->`);
						_push(`<p class="visually-hidden" aria-live="polite" data-v-dc2a0911${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(copied.value ? "Betreff und Text sind kopiert." : "")}</p>`);
					} else return [
						(0, vue_exports.createVNode)("div", { class: "rq" }, [
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "demand-brand"
								}, "Bei welcher Marke fragst du an?"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "demand-brand",
									"onUpdate:modelValue": ($event) => brand.value = $event,
									class: "input"
								}, [(0, vue_exports.createVNode)("option", { value: "" }, "Noch offen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.brands, (b) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
										key: b.id,
										value: String(b.id)
									}, (0, vue_exports.toDisplayString)(b.name), 9, ["value"]);
								}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, brand.value]]),
								(0, vue_exports.createVNode)("span", { class: "form-field__help" }, "Die Marke steht dann bei der Lücke, damit niemand dieselbe Anfrage zweimal schickt.")
							]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "demand-subject"
							}, "Betreff"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "demand-subject",
								"onUpdate:modelValue": ($event) => subject.value = $event,
								class: "input",
								type: "text",
								autocomplete: "off"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, subject.value]])]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "demand-body"
							}, "Text"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("textarea", {
								id: "demand-body",
								"onUpdate:modelValue": ($event) => body.value = $event,
								class: "input rq__body",
								rows: "12",
								spellcheck: "true"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, body.value]])])
						]),
						copyFailed.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "form-field__error rq__error",
							role: "alert"
						}, "Betreff und Text konnten nicht kopiert werden. Kopier sie von Hand oder öffne die E-Mail mit „Im E-Mail-Programm öffnen“.")) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("p", {
							class: "visually-hidden",
							"aria-live": "polite"
						}, (0, vue_exports.toDisplayString)(copied.value ? "Betreff und Text sind kopiert." : ""), 1)
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Nachfrage/RequestDialog.vue
var RequestDialog_exports = /* @__PURE__ */ __exportAll({ default: () => RequestDialog_default });
var _sfc_setup = RequestDialog_vue_vue_type_script_setup_true_lang_default.setup;
RequestDialog_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Nachfrage/RequestDialog.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var RequestDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(RequestDialog_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-dc2a0911"]]);
//#endregion
export { RequestDialog_exports as n, RequestDialog_default as t };
