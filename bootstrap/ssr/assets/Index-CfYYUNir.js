import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BSZH2tn1.js";
import { a as link_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { t as AdminState_default } from "./AdminState-QyYV7E7y.js";
//#region resources/js/Pages/Admin/Fehler/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		status: {},
		area: {}
	},
	setup(__props) {
		/**
		* A failure inside the admin, inside the admin's frame (AdminErrorPage): the rail stays, so the
		* person keeps their way around instead of being dropped onto the shop's error page.
		*
		* 403 is the no-permission state of admin-shell §9.5, naming the area when the server knows it. The
		* rail never leads here; this exists for a pasted link, a bookmark and a role changed mid-session.
		*/
		const props = __props;
		const page = (0, vue_exports.computed)(() => {
			switch (props.status) {
				case 403: return {
					title: "Keine Berechtigung",
					context: props.area ? `Bereich „${props.area}“` : "Diese Seite ist für deine Rolle nicht freigegeben"
				};
				case 404: return {
					title: "Seite nicht gefunden",
					context: "Diese Adresse gibt es im Admin nicht"
				};
				case 429: return {
					title: "Zu viele Anfragen",
					context: "In kurzer Zeit kam zu viel auf einmal"
				};
				default: return {
					title: "Nicht erreichbar",
					context: `Fehler ${props.status}`
				};
			}
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: page.value.title,
				context: page.value.context
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.status === 403) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "forbidden",
							module: __props.area ?? void 0
						}, null, _parent, _scopeId));
						else {
							_push(`<section class="adm-state"${(0, server_renderer_exports.ssrRenderAttr)("role", __props.status === 429 ? "status" : void 0)}${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								class: "adm-state__icon",
								name: __props.status === 404 ? "search" : "clock",
								size: 20
							}, null, _parent, _scopeId));
							_push(`<h2 class="adm-state__heading"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.status === 404 ? "Diese Seite gibt es nicht." : "Bitte warte einen Moment.")}</h2><p class="adm-state__text"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.status === 404 ? "Vielleicht war der Link veraltet oder falsch kopiert. Alles, was du öffnen darfst, findest du in der Navigation." : "Warte eine Minute und lade die Seite dann neu.")}</p><div class="adm-state__action"${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
								href: "/admin",
								class: "btn btn--secondary"
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push(`Zur Übersicht`);
									else return [(0, vue_exports.createTextVNode)("Zur Übersicht")];
								}),
								_: 1
							}, _parent, _scopeId));
							_push(`</div></section>`);
						}
					} else return [__props.status === 403 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
						key: 0,
						kind: "forbidden",
						module: __props.area ?? void 0
					}, null, 8, ["module"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
						key: 1,
						class: "adm-state",
						role: __props.status === 429 ? "status" : void 0
					}, [
						(0, vue_exports.createVNode)(AdminIcon_default, {
							class: "adm-state__icon",
							name: __props.status === 404 ? "search" : "clock",
							size: 20
						}, null, 8, ["name"]),
						(0, vue_exports.createVNode)("h2", { class: "adm-state__heading" }, (0, vue_exports.toDisplayString)(__props.status === 404 ? "Diese Seite gibt es nicht." : "Bitte warte einen Moment."), 1),
						(0, vue_exports.createVNode)("p", { class: "adm-state__text" }, (0, vue_exports.toDisplayString)(__props.status === 404 ? "Vielleicht war der Link veraltet oder falsch kopiert. Alles, was du öffnen darfst, findest du in der Navigation." : "Warte eine Minute und lade die Seite dann neu."), 1),
						(0, vue_exports.createVNode)("div", { class: "adm-state__action" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
							href: "/admin",
							class: "btn btn--secondary"
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Zur Übersicht")]),
							_: 1
						})])
					], 8, ["role"]))];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Fehler/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Fehler/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = Index_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { Index_default as default };
