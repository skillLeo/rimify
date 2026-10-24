import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-YhdQ12hb.js";
import { a as link_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as decimal } from "./format-6R0uUMt3.js";
//#region resources/js/Pages/Admin/Review/Board.vue?vue&type=script&setup=true&lang.ts
var Board_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Board",
	__ssrInlineRender: true,
	props: {
		areas: {},
		counts: {}
	},
	setup(__props) {
		/**
		* Review › Stand der Seiten (the review release §3): every screen of the admin in the order to look at
		* them, each with its state — fertig, in Arbeit, noch nicht gebaut — a link where there is something
		* to open, one line on what it does, and how many points of the review are still open on it.
		*/
		/** Only the exception is tagged, and neutral: work still to do is no warning. */
		function stateTag(state) {
			return state === "fertig" ? null : "adm-tag adm-tag--neutral";
		}
		const STATE_LABEL = {
			fertig: "Fertig",
			"in Arbeit": "In Arbeit",
			"noch nicht gebaut": "Noch nicht gebaut"
		};
		function stateLabel(state) {
			return STATE_LABEL[state] ?? state;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Stand der Seiten",
				context: __props.counts.open === 1 ? "1 offene Rückmeldung" : `${(0, vue_exports.unref)(decimal)(__props.counts.open, 0)} offene Rückmeldungen`
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="adm-note rb-intro" data-v-7bcd06f4${_scopeId}> Fertige Seiten kannst du prüfen. Seiten, die noch fehlen, sind als „Noch nicht gebaut“ markiert. Zu jeder Seite kannst du mit „Rückmeldung geben“ etwas sagen – in der Leiste links, am Telefon unter „Mehr“. Ein Satz genügt, ein Bildschirmfoto wird automatisch mitgeschickt. </p><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.areas, (area) => {
							_push(`<section class="adm-section"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `rb-${area.key}`)} data-v-7bcd06f4${_scopeId}><div class="adm-section__head" data-v-7bcd06f4${_scopeId}><h2${(0, server_renderer_exports.ssrRenderAttr)("id", `rb-${area.key}`)} class="adm-section__title" data-v-7bcd06f4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(area.label)}</h2></div><ul class="rb-list" data-v-7bcd06f4${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(area.screens, (screen) => {
								_push(`<li class="rb-row" data-v-7bcd06f4${_scopeId}><span class="rb-state" data-v-7bcd06f4${_scopeId}>`);
								if (stateTag(screen.state)) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)(stateTag(screen.state))}" data-v-7bcd06f4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(stateLabel(screen.state))}</span>`);
								else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(stateLabel(screen.state))}<!--]-->`);
								_push(`</span><span class="rb-text" data-v-7bcd06f4${_scopeId}>`);
								if (screen.href) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: screen.href,
									class: "rb-label"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(screen.label)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(screen.label), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								else _push(`<span class="rb-label rb-label--plain" data-v-7bcd06f4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(screen.label)}</span>`);
								_push(`<span class="rb-line" data-v-7bcd06f4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(screen.line)}`);
								if (screen.locked) _push(`<!--[--> Mit deiner Rolle nicht zu öffnen.<!--]-->`);
								else _push(`<!---->`);
								_push(`</span></span>`);
								if (screen.open) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: `/admin/review/rueckmeldungen?seite=${encodeURIComponent(screen.label)}`,
									class: "rb-open"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(screen.open === 1 ? "1 offen" : `${(0, vue_exports.unref)(decimal)(screen.open, 0)} offen`)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(screen.open === 1 ? "1 offen" : `${(0, vue_exports.unref)(decimal)(screen.open, 0)} offen`), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								else _push(`<span class="rb-open rb-open--none" aria-hidden="true" data-v-7bcd06f4${_scopeId}></span>`);
								_push(`</li>`);
							});
							_push(`<!--]--></ul></section>`);
						});
						_push(`<!--]-->`);
					} else return [(0, vue_exports.createVNode)("p", { class: "adm-note rb-intro" }, " Fertige Seiten kannst du prüfen. Seiten, die noch fehlen, sind als „Noch nicht gebaut“ markiert. Zu jeder Seite kannst du mit „Rückmeldung geben“ etwas sagen – in der Leiste links, am Telefon unter „Mehr“. Ein Satz genügt, ein Bildschirmfoto wird automatisch mitgeschickt. "), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.areas, (area) => {
						return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: area.key,
							class: "adm-section",
							"aria-labelledby": `rb-${area.key}`
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: `rb-${area.key}`,
							class: "adm-section__title"
						}, (0, vue_exports.toDisplayString)(area.label), 9, ["id"])]), (0, vue_exports.createVNode)("ul", { class: "rb-list" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(area.screens, (screen) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
								key: screen.label,
								class: "rb-row"
							}, [
								(0, vue_exports.createVNode)("span", { class: "rb-state" }, [stateTag(screen.state) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: stateTag(screen.state)
								}, (0, vue_exports.toDisplayString)(stateLabel(screen.state)), 3)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(stateLabel(screen.state)), 1)], 64))]),
								(0, vue_exports.createVNode)("span", { class: "rb-text" }, [screen.href ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
									key: 0,
									href: screen.href,
									class: "rb-label"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(screen.label), 1)]),
									_: 2
								}, 1032, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 1,
									class: "rb-label rb-label--plain"
								}, (0, vue_exports.toDisplayString)(screen.label), 1)), (0, vue_exports.createVNode)("span", { class: "rb-line" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(screen.line), 1), screen.locked ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" Mit deiner Rolle nicht zu öffnen.")], 64)) : (0, vue_exports.createCommentVNode)("", true)])]),
								screen.open ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
									key: 0,
									href: `/admin/review/rueckmeldungen?seite=${encodeURIComponent(screen.label)}`,
									class: "rb-open"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(screen.open === 1 ? "1 offen" : `${(0, vue_exports.unref)(decimal)(screen.open, 0)} offen`), 1)]),
									_: 2
								}, 1032, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 1,
									class: "rb-open rb-open--none",
									"aria-hidden": "true"
								}))
							]);
						}), 128))])], 8, ["aria-labelledby"]);
					}), 128))];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Review/Board.vue
var _sfc_setup = Board_vue_vue_type_script_setup_true_lang_default.setup;
Board_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Review/Board.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Board_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Board_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-7bcd06f4"]]);
//#endregion
export { Board_default as default };
