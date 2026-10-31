import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BeseBJf_.js";
import { c as router, o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { t as AdminState_default } from "./AdminState-QyYV7E7y.js";
import { t as ListPager_default } from "./ListPager-CZGH48Xr.js";
//#region resources/js/Pages/Admin/Nachrichten/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		items: {},
		count: {},
		search: {},
		pagination: {},
		total: {},
		filter: {},
		filters: {},
		canMarkRead: { type: Boolean },
		keepMonths: {},
		recipient: {}
	},
	setup(__props) {
		/**
		* Verkauf › Nachrichten (the client's #12, D-123): what came through the contact form, newest first. The page opens on
		* the unread ones — the queue the rail counts. „Antworten“ opens the team's own mail program addressed to the sender;
		* „Als gelesen markieren“ takes a message out of the queue. Nothing here writes or edits a message.
		*/
		const props = __props;
		const recipientForm = useForm({ address: props.recipient?.address ?? "" });
		const editingRecipient = (0, vue_exports.ref)(false);
		function saveRecipient() {
			recipientForm.put("/admin/nachrichten/empfaenger", {
				preserveScroll: true,
				onSuccess: () => {
					editingRecipient.value = false;
				}
			});
		}
		const status = (0, vue_exports.ref)(props.filter);
		const q = (0, vue_exports.ref)(props.search);
		function apply() {
			const query = {};
			if (status.value !== "ungelesen") query.status = status.value;
			if (q.value.trim() !== "") query.q = q.value.trim();
			router.get("/admin/nachrichten", query, {
				preserveScroll: true,
				preserveState: true
			});
		}
		function showAll() {
			status.value = "alle";
			q.value = "";
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
						_push(`<p class="nfa-lead" data-v-8eba2228${_scopeId}> Hier steht, was über das Kontaktformular im Shop kam – mit dem Fahrzeug, wenn die Person es mitgeschickt hat. Geantwortet wird per E-Mail. Jede Nachricht wird nach ${(0, server_renderer_exports.ssrInterpolate)(__props.keepMonths)} Monaten gelöscht. </p>`);
						if (__props.recipient) {
							_push(`<section class="nfa-recipient" aria-labelledby="nfa-recipient-h" data-recipient data-v-8eba2228${_scopeId}><h2 id="nfa-recipient-h" class="nfa-recipient__title" data-v-8eba2228${_scopeId}>Weiterleitung per E-Mail</h2>`);
							if (!editingRecipient.value) {
								_push(`<p class="nfa-recipient__now" data-v-8eba2228${_scopeId}> Neue Nachrichten gehen an <strong data-v-8eba2228${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.recipient.address || "keine Adresse")}</strong>. `);
								if (__props.recipient.canChange) _push(`<button class="btn btn--ghost btn--sm" type="button" data-v-8eba2228${_scopeId}>Ändern</button>`);
								else _push(`<!---->`);
								_push(`</p>`);
							} else _push(`<form class="nfa-recipient__form" novalidate data-v-8eba2228${_scopeId}><div class="form-field" data-v-8eba2228${_scopeId}><label class="form-field__label" for="nfa-recipient" data-v-8eba2228${_scopeId}>An diese Adresse</label><input id="nfa-recipient"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(recipientForm).address)} class="input" type="email" maxlength="190" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(recipientForm).errors.address ? "true" : void 0)} aria-describedby="nfa-recipient-err" data-v-8eba2228${_scopeId}><p id="nfa-recipient-err" class="form-field__error" data-v-8eba2228${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(recipientForm).errors.address ?? "")}</p></div><div class="nfa-recipient__actions" data-v-8eba2228${_scopeId}><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(recipientForm).processing) ? " disabled" : ""} data-v-8eba2228${_scopeId}>Speichern</button><button class="btn btn--ghost" type="button" data-v-8eba2228${_scopeId}>Abbrechen</button></div></form>`);
							if (!__props.recipient.mailing) _push(`<p class="adm-alert nfa-recipient__warn" role="status" data-v-8eba2228${_scopeId}> Der Shop verschickt noch keine E-Mails. Neue Nachrichten stehen bis dahin nur hier. Einrichten lässt sich der Versand unter Einstellungen › E-Mail. </p>`);
							else _push(`<!---->`);
							_push(`</section>`);
						} else _push(`<!---->`);
						_push(`<form class="nfa-filters" data-v-8eba2228${_scopeId}><div class="form-field" data-v-8eba2228${_scopeId}><label class="form-field__label" for="nfa-q" data-v-8eba2228${_scopeId}>Suchen</label><input id="nfa-q"${(0, server_renderer_exports.ssrRenderAttr)("value", q.value)} class="input" type="search" maxlength="100" autocomplete="off" placeholder="Name, E-Mail-Adresse oder ein Wort" data-v-8eba2228${_scopeId}></div><div class="form-field" data-v-8eba2228${_scopeId}><label class="form-field__label" for="nfa-status" data-v-8eba2228${_scopeId}>Zeigen</label><select id="nfa-status" class="input" data-v-8eba2228${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.filters, (option) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", option.value)} data-v-8eba2228${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(status.value) ? (0, server_renderer_exports.ssrLooseContain)(status.value, option.value) : (0, server_renderer_exports.ssrLooseEqual)(status.value, option.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(option.label)}</option>`);
						});
						_push(`<!--]--></select></div><div class="nfa-filters__go" data-v-8eba2228${_scopeId}><button class="btn btn--secondary" type="submit" data-v-8eba2228${_scopeId}>Anwenden</button></div></form>`);
						if (__props.total === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Hier erscheint jede Nachricht, die jemand über das Kontaktformular im Shop schickt."
						}, null, _parent, _scopeId));
						else if (__props.items.length === 0 && __props.search !== "") _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "filtered",
							total: __props.total,
							onReset: showAll
						}, null, _parent, _scopeId));
						else if (__props.items.length === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Alles gelesen. Ältere Nachrichten stehen unter „Alle“."
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-8eba2228${_scopeId}>Alle zeigen</button>`);
								else return [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									onClick: showAll
								}, "Alle zeigen")];
							}),
							_: 1
						}, _parent, _scopeId));
						else {
							_push(`<ol class="nfa-list" data-v-8eba2228${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.items, (item) => {
								_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{ "nfa-item--read": item.read }, "nfa-item"])}" data-v-8eba2228${_scopeId}><div class="nfa-item__top" data-v-8eba2228${_scopeId}><div class="nfa-item__head" data-v-8eba2228${_scopeId}><h2 class="nfa-item__subject" data-v-8eba2228${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.subject)}</h2>`);
								if (!item.read && __props.filter !== "ungelesen") _push(`<span class="adm-tag adm-tag--neutral" data-v-8eba2228${_scopeId}>Ungelesen</span>`);
								else _push(`<!---->`);
								_push(`<time class="nfa-item__at num" data-v-8eba2228${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.at)}</time></div><p class="nfa-item__meta" data-v-8eba2228${_scopeId}><span class="nfa-item__from" data-v-8eba2228${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.name)}</span> · <span class="nfa-item__email" data-v-8eba2228${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.email)}</span></p></div><p class="nfa-item__body" data-v-8eba2228${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.message)}</p>`);
								if (item.vehicle || item.from) {
									_push(`<dl class="nfa-facts" data-v-8eba2228${_scopeId}>`);
									if (item.vehicle) _push(`<!--[--><dt data-v-8eba2228${_scopeId}>Fahrzeug</dt><dd data-v-8eba2228${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.vehicle)}</dd><!--]-->`);
									else _push(`<!---->`);
									if (item.from) _push(`<!--[--><dt data-v-8eba2228${_scopeId}>Gesendet von der Seite</dt><dd data-v-8eba2228${_scopeId}><a${(0, server_renderer_exports.ssrRenderAttr)("href", item.from)} target="_blank" rel="noopener" data-v-8eba2228${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.from)}</a></dd><!--]-->`);
									else _push(`<!---->`);
									_push(`</dl>`);
								} else _push(`<!---->`);
								_push(`<div class="nfa-item__actions" data-v-8eba2228${_scopeId}><a class="btn btn--secondary"${(0, server_renderer_exports.ssrRenderAttr)("href", item.replyHref)} data-v-8eba2228${_scopeId}>Antworten</a>`);
								if (__props.canMarkRead && !item.read) _push(`<button class="btn btn--ghost" type="button" data-v-8eba2228${_scopeId}>Als gelesen markieren</button>`);
								else if (item.read) _push(`<span class="nfa-item__meta num" data-v-8eba2228${_scopeId}>Gelesen am ${(0, server_renderer_exports.ssrInterpolate)(item.readAt)}</span>`);
								else _push(`<!---->`);
								_push(`</div></li>`);
							});
							_push(`<!--]--></ol>`);
						}
						_push((0, server_renderer_exports.ssrRenderComponent)(ListPager_default, {
							pagination: __props.pagination,
							label: "Seiten der Nachrichten"
						}, null, _parent, _scopeId));
					} else return [
						(0, vue_exports.createVNode)("p", { class: "nfa-lead" }, " Hier steht, was über das Kontaktformular im Shop kam – mit dem Fahrzeug, wenn die Person es mitgeschickt hat. Geantwortet wird per E-Mail. Jede Nachricht wird nach " + (0, vue_exports.toDisplayString)(__props.keepMonths) + " Monaten gelöscht. ", 1),
						__props.recipient ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 0,
							class: "nfa-recipient",
							"aria-labelledby": "nfa-recipient-h",
							"data-recipient": ""
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "nfa-recipient-h",
								class: "nfa-recipient__title"
							}, "Weiterleitung per E-Mail"),
							!editingRecipient.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "nfa-recipient__now"
							}, [
								(0, vue_exports.createTextVNode)(" Neue Nachrichten gehen an "),
								(0, vue_exports.createVNode)("strong", null, (0, vue_exports.toDisplayString)(__props.recipient.address || "keine Adresse"), 1),
								(0, vue_exports.createTextVNode)(". "),
								__props.recipient.canChange ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 0,
									class: "btn btn--ghost btn--sm",
									type: "button",
									onClick: ($event) => editingRecipient.value = true
								}, "Ändern", 8, ["onClick"])) : (0, vue_exports.createCommentVNode)("", true)
							])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("form", {
								key: 1,
								class: "nfa-recipient__form",
								novalidate: "",
								onSubmit: (0, vue_exports.withModifiers)(saveRecipient, ["prevent"])
							}, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "nfa-recipient"
								}, "An diese Adresse"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "nfa-recipient",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(recipientForm).address = $event,
									class: "input",
									type: "email",
									maxlength: "190",
									autocomplete: "off",
									"aria-invalid": (0, vue_exports.unref)(recipientForm).errors.address ? "true" : void 0,
									"aria-describedby": "nfa-recipient-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(recipientForm).address]]),
								(0, vue_exports.createVNode)("p", {
									id: "nfa-recipient-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(recipientForm).errors.address ?? ""), 1)
							]), (0, vue_exports.createVNode)("div", { class: "nfa-recipient__actions" }, [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "submit",
								disabled: (0, vue_exports.unref)(recipientForm).processing
							}, "Speichern", 8, ["disabled"]), (0, vue_exports.createVNode)("button", {
								class: "btn btn--ghost",
								type: "button",
								onClick: ($event) => editingRecipient.value = false
							}, "Abbrechen", 8, ["onClick"])])], 32)),
							!__props.recipient.mailing ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 2,
								class: "adm-alert nfa-recipient__warn",
								role: "status"
							}, " Der Shop verschickt noch keine E-Mails. Neue Nachrichten stehen bis dahin nur hier. Einrichten lässt sich der Versand unter Einstellungen › E-Mail. ")) : (0, vue_exports.createCommentVNode)("", true)
						])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("form", {
							class: "nfa-filters",
							onSubmit: (0, vue_exports.withModifiers)(apply, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "nfa-q"
							}, "Suchen"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "nfa-q",
								"onUpdate:modelValue": ($event) => q.value = $event,
								class: "input",
								type: "search",
								maxlength: "100",
								autocomplete: "off",
								placeholder: "Name, E-Mail-Adresse oder ein Wort"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, q.value]])]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
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
							}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, status.value]])]),
							(0, vue_exports.createVNode)("div", { class: "nfa-filters__go" }, [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "submit"
							}, "Anwenden")])
						], 32),
						__props.total === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 1,
							kind: "empty",
							text: "Hier erscheint jede Nachricht, die jemand über das Kontaktformular im Shop schickt."
						})) : __props.items.length === 0 && __props.search !== "" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 2,
							kind: "filtered",
							total: __props.total,
							onReset: showAll
						}, null, 8, ["total"])) : __props.items.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 3,
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
							key: 4,
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
						}), 128))])),
						(0, vue_exports.createVNode)(ListPager_default, {
							pagination: __props.pagination,
							label: "Seiten der Nachrichten"
						}, null, 8, ["pagination"])
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
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-8eba2228"]]);
//#endregion
export { Index_default as default };
