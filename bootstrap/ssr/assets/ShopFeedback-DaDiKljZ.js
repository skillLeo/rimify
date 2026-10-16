import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as Icon_default } from "./Icon-Di2lIpO_.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as feedback, t as FeedbackDialog_default } from "./FeedbackDialog-C4wW6fT9.js";
//#region resources/js/Components/Chrome/ShopFeedback.vue?vue&type=script&setup=true&lang.ts
var BARS = ".stickybar, .msticky, .tray";
var ShopFeedback_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ShopFeedback",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* „Rückmeldung geben“ on the shop's own pages (D-142): the admin's feedback point — one sentence, sent with the
		* page's address, the window, the browser, the role and a screenshot — for a signed-in admin while the review is on.
		*
		* The server decides it (`reviewer`, HandleInertiaRequests): an ordinary visitor's page carries neither the button
		* nor its code. The page loads it once it is awake and the server never draws it (useShopFeedback, D-255): drawn there,
		* a page left before its code arrived tried to hydrate it and reported a mismatch. Bottom right, out of the design's way, above
		* whatever holds a page's bottom edge — the price bar, the compare tray — and never in its own screenshot
		* (`data-feedback-skip`). On a phone it is the bubble alone, with the same name for assistive technology. While the
		* page is drawn for the screenshot the bubble gives way to the system's spinner; the label stays, so nothing moves.
		*/
		const lift = (0, vue_exports.ref)(0);
		let resize = null;
		let mutation = null;
		let frame = 0;
		function measure() {
			let highest = 0;
			for (const bar of document.querySelectorAll(BARS)) {
				const box = bar.getBoundingClientRect();
				if (box.height > 0 && box.bottom >= window.innerHeight - 1) highest = Math.max(highest, window.innerHeight - box.top);
			}
			lift.value = Math.ceil(highest);
		}
		function watchBars() {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				resize?.disconnect();
				document.querySelectorAll(BARS).forEach((bar) => resize?.observe(bar));
				measure();
			});
		}
		(0, vue_exports.onMounted)(() => {
			resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
			mutation = new MutationObserver(watchBars);
			mutation.observe(document.body, {
				childList: true,
				subtree: true
			});
			window.addEventListener("resize", measure);
			window.addEventListener("scroll", measure, { passive: true });
			document.addEventListener("transitionend", measure, true);
			document.addEventListener("animationend", measure, true);
			watchBars();
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			cancelAnimationFrame(frame);
			resize?.disconnect();
			mutation?.disconnect();
			window.removeEventListener("resize", measure);
			window.removeEventListener("scroll", measure);
			document.removeEventListener("transitionend", measure, true);
			document.removeEventListener("animationend", measure, true);
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<!--[--><button class="shop-fb" style="${(0, server_renderer_exports.ssrRenderStyle)(lift.value > 0 ? { "--shop-fb-lift": `${lift.value}px` } : void 0)}" type="button" aria-label="Rückmeldung geben" aria-keyshortcuts="R"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(feedback).capturing ? "true" : void 0)} data-feedback-skip data-v-9b159644>`);
			if ((0, vue_exports.unref)(feedback).capturing) _push(`<span class="shop-fb__spin" aria-hidden="true" data-v-9b159644></span>`);
			else _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "feedback",
				size: 20
			}, null, _parent));
			_push(`<span class="shop-fb__label" aria-hidden="true" data-v-9b159644>Rückmeldung geben</span></button>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(FeedbackDialog_default, { surface: "shop" }, null, _parent));
			_push(`<!--]-->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/ShopFeedback.vue
var _sfc_setup = ShopFeedback_vue_vue_type_script_setup_true_lang_default.setup;
ShopFeedback_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/ShopFeedback.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var ShopFeedback_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ShopFeedback_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-9b159644"]]);
//#endregion
export { ShopFeedback_default as default };
