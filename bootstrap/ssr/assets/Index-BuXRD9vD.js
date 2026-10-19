import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage--fCiRsQr.js";
import { c as router, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Pages/Admin/System/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		report: {},
		checkedAt: {}
	},
	setup(__props) {
		/**
		* System › Zustand: every check behind the rail's health line, each as a sentence with its state
		* (SystemHealth). The dot is never the only signal — the word next to it says the same thing, so the
		* page reads the same in black and white and to a screen reader.
		*/
		const STATE_WORD = {
			ok: "In Ordnung",
			warn: "Achtung",
			bad: "Gestört"
		};
		const busy = (0, vue_exports.ref)(false);
		function check() {
			busy.value = true;
			router.reload({ onFinish: () => busy.value = false });
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Systemzustand",
				context: `Zuletzt geprüft: ${__props.checkedAt}`
			}, _attrs), {
				primary: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-bd2d23ec${_scopeId}> Erneut prüfen </button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						disabled: busy.value,
						"aria-busy": busy.value ? "true" : void 0,
						onClick: check
					}, " Erneut prüfen ", 8, ["disabled", "aria-busy"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="${(0, server_renderer_exports.ssrRenderClass)([`sy-headline--${__props.report.state}`, "sy-headline"])}" role="status" data-v-bd2d23ec${_scopeId}><span class="${(0, server_renderer_exports.ssrRenderClass)([`adm-health__dot--${__props.report.state}`, "adm-health__dot"])}" aria-hidden="true" data-v-bd2d23ec${_scopeId}></span> ${(0, server_renderer_exports.ssrInterpolate)(__props.report.sentence)}</p><ul class="adm-panel sy-list" data-v-bd2d23ec${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.report.checks, (item) => {
							_push(`<li class="sy-check" data-v-bd2d23ec${_scopeId}><span class="${(0, server_renderer_exports.ssrRenderClass)([`adm-health__dot--${item.state}`, "adm-health__dot"])}" aria-hidden="true" data-v-bd2d23ec${_scopeId}></span><span class="sy-check__label" data-v-bd2d23ec${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.label)}</span><span class="sy-check__sentence" data-v-bd2d23ec${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.sentence)}</span><span class="${(0, server_renderer_exports.ssrRenderClass)([`sy-check__state--${item.state}`, "sy-check__state"])}" data-v-bd2d23ec${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(STATE_WORD[item.state])}</span></li>`);
						});
						_push(`<!--]--></ul>`);
					} else return [(0, vue_exports.createVNode)("p", {
						class: ["sy-headline", `sy-headline--${__props.report.state}`],
						role: "status"
					}, [(0, vue_exports.createVNode)("span", {
						class: ["adm-health__dot", `adm-health__dot--${__props.report.state}`],
						"aria-hidden": "true"
					}, null, 2), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(__props.report.sentence), 1)], 2), (0, vue_exports.createVNode)("ul", { class: "adm-panel sy-list" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.report.checks, (item) => {
						return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
							key: item.key,
							class: "sy-check"
						}, [
							(0, vue_exports.createVNode)("span", {
								class: ["adm-health__dot", `adm-health__dot--${item.state}`],
								"aria-hidden": "true"
							}, null, 2),
							(0, vue_exports.createVNode)("span", { class: "sy-check__label" }, (0, vue_exports.toDisplayString)(item.label), 1),
							(0, vue_exports.createVNode)("span", { class: "sy-check__sentence" }, (0, vue_exports.toDisplayString)(item.sentence), 1),
							(0, vue_exports.createVNode)("span", { class: ["sy-check__state", `sy-check__state--${item.state}`] }, (0, vue_exports.toDisplayString)(STATE_WORD[item.state]), 3)
						]);
					}), 128))])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/System/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/System/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-bd2d23ec"]]);
//#endregion
export { Index_default as default };
