import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-LYFhyjjj.js";
import { o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
//#region resources/js/Pages/Admin/Bestaetigen/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		minutes: {},
		weiter: {}
	},
	setup(__props) {
		const form = useForm({
			password: "",
			weiter: __props.weiter ?? null
		});
		function confirm() {
			form.clearErrors();
			form.post("/admin/bestaetigen", { onFinish: () => form.reset("password") });
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Passwort bestätigen",
				context: `Dieser Bereich verwaltet die Zugänge des Shops. Dein Passwort gilt danach ${__props.minutes} Minuten lang.`
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<form class="adm-form" novalidate${_scopeId}><section class="adm-form__group" aria-labelledby="sudo-heading"${_scopeId}><h2 id="sudo-heading" class="adm-form__heading"${_scopeId}>Bevor es weitergeht</h2><div class="form-field"${_scopeId}><label class="form-field__label" for="sudo-password"${_scopeId}>Passwort</label><input id="sudo-password"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).password)} class="input" type="password" autocomplete="current-password" autofocus${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(form).errors.password ? "true" : void 0)} aria-describedby="sudo-password-error"${_scopeId}><p id="sudo-password-error" class="form-field__error"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).errors.password)}</p></div><div${_scopeId}><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)}${_scopeId}>Bestätigen</button></div></section></form>`);
					else return [(0, vue_exports.createVNode)("form", {
						class: "adm-form",
						novalidate: "",
						onSubmit: (0, vue_exports.withModifiers)(confirm, ["prevent"])
					}, [(0, vue_exports.createVNode)("section", {
						class: "adm-form__group",
						"aria-labelledby": "sudo-heading"
					}, [
						(0, vue_exports.createVNode)("h2", {
							id: "sudo-heading",
							class: "adm-form__heading"
						}, "Bevor es weitergeht"),
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "sudo-password"
							}, "Passwort"),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "sudo-password",
								"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).password = $event,
								class: "input",
								type: "password",
								autocomplete: "current-password",
								autofocus: "",
								"aria-invalid": (0, vue_exports.unref)(form).errors.password ? "true" : void 0,
								"aria-describedby": "sudo-password-error"
							}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).password]]),
							(0, vue_exports.createVNode)("p", {
								id: "sudo-password-error",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).errors.password), 1)
						]),
						(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("button", {
							class: "btn btn--primary",
							type: "submit",
							"aria-busy": (0, vue_exports.unref)(form).processing ? "true" : void 0
						}, "Bestätigen", 8, ["aria-busy"])])
					])], 32)];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Bestaetigen/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Bestaetigen/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = Index_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { Index_default as default };
