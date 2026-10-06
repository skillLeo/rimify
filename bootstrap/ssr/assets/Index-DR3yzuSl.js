import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-ziTZL4Iw.js";
import { c as router, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as decimal } from "./format-DGFu8Y3r.js";
import { t as AdminState_default } from "./AdminState-CulrVZYL.js";
//#region resources/js/Pages/Admin/Nachrichten/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		items: {},
		count: {},
		total: {},
		filter: {},
		filters: {},
		canMarkRead: { type: Boolean },
		keepMonths: {}
	},
	setup(__props) {
		/**
		* Verkauf › Nachrichten (the client's #12, D-123): what came through the contact form, newest first. The page opens on
		* the unread ones — the queue the rail counts. „Antworten“ opens the team's own mail program addressed to the sender;
		* „Als gelesen markieren“ takes a message out of the queue. Nothing here writes or edits a message.
		*/
		const props = __props;
		const status = (0, vue_exports.ref)(props.filter);
		function apply() {
			router.get("/admin/nachrichten", status.value === "ungelesen" ? {} : { status: status.value }, {
				preserveScroll: true,
				preserveState: true
			});
		}
		function showAll() {
			status.value = "alle";
			apply();
		}
		function markRead(item) {
			router.post(`/admin/nachrichten/${item.id}/gelesen`, {}, { preserveScroll: true });
		}
		function context() {
			const n = props.count;
			const noun = props.filter === "ungelesen" ? n === 1 ? "ungelesene Nachricht" : "ungelesene Nachrichten" : n === 1 ? "Nachricht" : "Nachrichten";
			return `${decimal(n, 0)} ${noun}`;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Nachrichten",
				context: context()
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="nfa-lead" data-v-31790b7d${_scopeId}> Hier steht, was über das Kontaktformular im Shop kam – mit dem Fahrzeug, wenn die Person es mitgeschickt hat. Geantwortet wird per E-Mail. Jede Nachricht wird nach ${(0, server_renderer_exports.ssrInterpolate)(__props.keepMonths)} Monaten gelöscht. </p><form class="nfa-filters" data-v-31790b7d${_scopeId}><div class="form-field" data-v-31790b7d${_scopeId}><label class="form-field__label" for="nfa-status" data-v-31790b7d${_scopeId}>Zeigen</label><select id="nfa-status" class="input" data-v-31790b7d${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.filters, (option) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", option.value)} data-v-31790b7d${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(status.value) ? (0, server_renderer_exports.ssrLooseContain)(status.value, option.value) : (0, server_renderer_exports.ssrLooseEqual)(status.value, option.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(option.label)}</option>`);
						});
						_push(`<!--]--></select></div><div class="nfa-filters__go" data-v-31790b7d${_scopeId}><button class="btn btn--secondary" type="submit" data-v-31790b7d${_scopeId}>Anwenden</button></div></form>`);
						if (__props.total === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Hier erscheint jede Nachricht, die jemand über das Kontaktformular im Shop schickt."
						}, null, _parent, _scopeId));
						else if (__props.items.length === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Alles gelesen. Ältere Nachrichten stehen unter „Alle“."
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-31790b7d${_scopeId}>Alle zeigen</button>`);
								else return [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									onClick: showAll
								}, "Alle zeigen")];
							}),
							_: 1
						}, _parent, _scopeId));
						else {
							_push(`<ol class="nfa-list" data-v-31790b7d${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.items, (item) => {
								_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{ "nfa-item--read": item.read }, "nfa-item"])}" data-v-31790b7d${_scopeId}><div class="nfa-item__top" data-v-31790b7d${_scopeId}><div class="nfa-item__head" data-v-31790b7d${_scopeId}><h2 class="nfa-item__subject" data-v-31790b7d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.subject)}</h2>`);
								if (!item.read && __props.filter !== "ungelesen") _push(`<span class="adm-tag adm-tag--neutral" data-v-31790b7d${_scopeId}>Ungelesen</span>`);
								else _push(`<!---->`);
								_push(`<time class="nfa-item__at num" data-v-31790b7d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.at)}</time></div><p class="nfa-item__meta" data-v-31790b7d${_scopeId}><span class="nfa-item__from" data-v-31790b7d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.name)}</span> · <span class="nfa-item__email" data-v-31790b7d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.email)}</span></p></div><p class="nfa-item__body" data-v-31790b7d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.message)}</p>`);
								if (item.vehicle || item.from) {
									_push(`<dl class="nfa-facts" data-v-31790b7d${_scopeId}>`);
									if (item.vehicle) _push(`<!--[--><dt data-v-31790b7d${_scopeId}>Fahrzeug</dt><dd data-v-31790b7d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.vehicle)}</dd><!--]-->`);
									else _push(`<!---->`);
									if (item.from) _push(`<!--[--><dt data-v-31790b7d${_scopeId}>Gesendet von der Seite</dt><dd data-v-31790b7d${_scopeId}><a${(0, server_renderer_exports.ssrRenderAttr)("href", item.from)} target="_blank" rel="noopener" data-v-31790b7d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.from)}</a></dd><!--]-->`);
									else _push(`<!---->`);
									_push(`</dl>`);
								} else _push(`<!---->`);
								_push(`<div class="nfa-item__actions" data-v-31790b7d${_scopeId}><a class="btn btn--secondary"${(0, server_renderer_exports.ssrRenderAttr)("href", item.replyHref)} data-v-31790b7d${_scopeId}>Antworten</a>`);
								if (__props.canMarkRead && !item.read) _push(`<button class="btn btn--ghost" type="button" data-v-31790b7d${_scopeId}>Als gelesen markieren</button>`);
								else if (item.read) _push(`<span class="nfa-item__meta num" data-v-31790b7d${_scopeId}>Gelesen am ${(0, server_renderer_exports.ssrInterpolate)(item.readAt)}</span>`);
								else _push(`<!---->`);
								_push(`</div></li>`);
							});
							_push(`<!--]--></ol>`);
						}
					} else return [
						(0, vue_exports.createVNode)("p", { class: "nfa-lead" }, " Hier steht, was über das Kontaktformular im Shop kam – mit dem Fahrzeug, wenn die Person es mitgeschickt hat. Geantwortet wird per E-Mail. Jede Nachricht wird nach " + (0, vue_exports.toDisplayString)(__props.keepMonths) + " Monaten gelöscht. ", 1),
						(0, vue_exports.createVNode)("form", {
							class: "nfa-filters",
							onSubmit: (0, vue_exports.withModifiers)(apply, ["prevent"])
						}, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
							class: "form-field__label",
							for: "nfa-status"
						}, "Zeigen"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
							id: "nfa-status",
							"onUpdate:modelValue": ($event) => status.value = $event,
							class: "input"
						}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.filters, (option) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
								key: option.value,
								value: option.value
							}, (0, vue_exports.toDisplayString)(option.label), 9, ["value"]);
						}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, status.value]])]), (0, vue_exports.createVNode)("div", { class: "nfa-filters__go" }, [(0, vue_exports.createVNode)("button", {
							class: "btn btn--secondary",
							type: "submit"
						}, "Anwenden")])], 32),
						__props.total === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 0,
							kind: "empty",
							text: "Hier erscheint jede Nachricht, die jemand über das Kontaktformular im Shop schickt."
						})) : __props.items.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 1,
							kind: "empty",
							text: "Alles gelesen. Ältere Nachrichten stehen unter „Alle“."
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "button",
								onClick: showAll
							}, "Alle zeigen")]),
							_: 1
						})) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ol", {
							key: 2,
							class: "nfa-list"
						}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.items, (item) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
								key: item.id,
								class: ["nfa-item", { "nfa-item--read": item.read }]
							}, [
								(0, vue_exports.createVNode)("div", { class: "nfa-item__top" }, [(0, vue_exports.createVNode)("div", { class: "nfa-item__head" }, [
									(0, vue_exports.createVNode)("h2", { class: "nfa-item__subject" }, (0, vue_exports.toDisplayString)(item.subject), 1),
									!item.read && __props.filter !== "ungelesen" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "adm-tag adm-tag--neutral"
									}, "Ungelesen")) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)("time", { class: "nfa-item__at num" }, (0, vue_exports.toDisplayString)(item.at), 1)
								]), (0, vue_exports.createVNode)("p", { class: "nfa-item__meta" }, [
									(0, vue_exports.createVNode)("span", { class: "nfa-item__from" }, (0, vue_exports.toDisplayString)(item.name), 1),
									(0, vue_exports.createTextVNode)(" · "),
									(0, vue_exports.createVNode)("span", { class: "nfa-item__email" }, (0, vue_exports.toDisplayString)(item.email), 1)
								])]),
								(0, vue_exports.createVNode)("p", { class: "nfa-item__body" }, (0, vue_exports.toDisplayString)(item.message), 1),
								item.vehicle || item.from ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("dl", {
									key: 0,
									class: "nfa-facts"
								}, [item.vehicle ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)("dt", null, "Fahrzeug"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(item.vehicle), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true), item.from ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createVNode)("dt", null, "Gesendet von der Seite"), (0, vue_exports.createVNode)("dd", null, [(0, vue_exports.createVNode)("a", {
									href: item.from,
									target: "_blank",
									rel: "noopener"
								}, (0, vue_exports.toDisplayString)(item.from), 9, ["href"])])], 64)) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("div", { class: "nfa-item__actions" }, [(0, vue_exports.createVNode)("a", {
									class: "btn btn--secondary",
									href: item.replyHref
								}, "Antworten", 8, ["href"]), __props.canMarkRead && !item.read ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 0,
									class: "btn btn--ghost",
									type: "button",
									onClick: ($event) => markRead(item)
								}, "Als gelesen markieren", 8, ["onClick"])) : item.read ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 1,
									class: "nfa-item__meta num"
								}, "Gelesen am " + (0, vue_exports.toDisplayString)(item.readAt), 1)) : (0, vue_exports.createCommentVNode)("", true)])
							], 2);
						}), 128))]))
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Nachrichten/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Nachrichten/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-31790b7d"]]);
//#endregion
export { Index_default as default };
