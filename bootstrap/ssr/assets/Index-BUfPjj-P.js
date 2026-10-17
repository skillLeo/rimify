import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-C_yULPOj.js";
import { a as link_default, c as router, o as useForm, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { t as AdminState_default } from "./AdminState-QyYV7E7y.js";
//#region resources/js/Pages/Admin/Bewertungen/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		items: {},
		total: {},
		filter: {},
		filters: {},
		canModerate: { type: Boolean }
	},
	setup(__props) {
		const status = (0, vue_exports.ref)(__props.filter);
		function apply() {
			router.get("/admin/bewertungen", status.value === "alle" ? {} : { status: status.value }, {
				preserveScroll: true,
				preserveState: true
			});
		}
		function resetFilter() {
			status.value = "alle";
			apply();
		}
		function stars(n) {
			return n === 1 ? "1 von 5 Sternen" : `${n} von 5 Sternen`;
		}
		const open = (0, vue_exports.ref)(null);
		const hideForm = useForm({ reason: "" });
		const replyForm = useForm({ reply: "" });
		function start(item, what) {
			open.value = {
				id: item.id,
				what
			};
			hideForm.reset();
			hideForm.clearErrors();
			replyForm.defaults({ reply: item.reply ?? "" });
			replyForm.reset();
			replyForm.clearErrors();
			(0, vue_exports.nextTick)(() => document.getElementById(`bw-${what}-${item.id}`)?.focus());
		}
		function close(id) {
			const what = open.value?.what;
			open.value = null;
			(0, vue_exports.nextTick)(() => document.querySelector(`[data-start="${what}-${id}"]`)?.focus());
		}
		function hide(item) {
			hideForm.post(`/admin/bewertungen/${item.id}/ausblenden`, {
				preserveScroll: true,
				onSuccess: () => close(item.id)
			});
		}
		function reveal(item) {
			router.post(`/admin/bewertungen/${item.id}/einblenden`, {}, { preserveScroll: true });
		}
		function reply(item) {
			replyForm.put(`/admin/bewertungen/${item.id}/antwort`, {
				preserveScroll: true,
				onSuccess: () => close(item.id)
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Bewertungen",
				context: __props.items.length === 1 ? "1 Bewertung" : `${(0, vue_exports.unref)(decimal)(__props.items.length, 0)} Bewertungen`
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="bwa-lead" data-v-02ace4e9${_scopeId}> Hier stehen die Bewertungen der Käuferinnen und Käufer. Sie kommen nur über den Link aus der Einladung, die der Shop einige Tage nach „Zugestellt“ verschickt – anlegen kann sie hier niemand. Eine ausgeblendete Bewertung zählt nicht mehr zur Bewertung der Felge. </p><form class="bwa-filters" data-v-02ace4e9${_scopeId}><div class="form-field" data-v-02ace4e9${_scopeId}><label class="form-field__label" for="bwa-status" data-v-02ace4e9${_scopeId}>Zeigen</label><select id="bwa-status" class="input" data-v-02ace4e9${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.filters, (option) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", option.value)} data-v-02ace4e9${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(status.value) ? (0, server_renderer_exports.ssrLooseContain)(status.value, option.value) : (0, server_renderer_exports.ssrLooseEqual)(status.value, option.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(option.label)}</option>`);
						});
						_push(`<!--]--></select></div><div class="bwa-filters__go" data-v-02ace4e9${_scopeId}><button class="btn btn--secondary" type="submit" data-v-02ace4e9${_scopeId}>Anwenden</button></div></form>`);
						if (__props.items.length === 0 && __props.total === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Hier erscheint jede Bewertung, sobald eine Käuferin oder ein Käufer über den Link aus der Einladung bewertet hat."
						}, null, _parent, _scopeId));
						else if (__props.items.length === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "filtered",
							total: __props.total,
							onReset: resetFilter
						}, null, _parent, _scopeId));
						else {
							_push(`<ol class="bwa-list" data-v-02ace4e9${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.items, (item) => {
								_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{ "bwa-item--hidden": item.hidden }, "bwa-item"])}" data-v-02ace4e9${_scopeId}><div class="bwa-item__head" data-v-02ace4e9${_scopeId}><span class="bwa-stars"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", stars(item.rating))} role="img" data-v-02ace4e9${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(5, (n) => {
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										key: n,
										name: "ratings",
										size: 16,
										class: n <= item.rating ? "bwa-on" : "bwa-off"
									}, null, _parent, _scopeId));
								});
								_push(`<!--]--></span>`);
								if (item.wheelHref) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: item.wheelHref,
									class: "bwa-item__wheel"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(item.wheel)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.wheel), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								else _push(`<span class="bwa-item__wheel" data-v-02ace4e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.wheel)}</span>`);
								_push(`<span class="bwa-item__meta" data-v-02ace4e9${_scopeId}>`);
								if (item.orderHref) {
									_push(`<!--[-->aus `);
									_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: item.orderHref }, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(item.order)}`);
											else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.order), 1)];
										}),
										_: 2
									}, _parent, _scopeId));
									_push(`, <!--]-->`);
								} else _push(`<!---->`);
								_push(`${(0, server_renderer_exports.ssrInterpolate)(item.at)}</span>`);
								if (item.hidden) _push(`<span class="adm-tag adm-tag--neutral" data-v-02ace4e9${_scopeId}>Ausgeblendet</span>`);
								else _push(`<!---->`);
								_push(`</div>`);
								if (item.body) _push(`<p class="bwa-item__body" data-v-02ace4e9${_scopeId}>„${(0, server_renderer_exports.ssrInterpolate)(item.body)}“</p>`);
								else _push(`<p class="bwa-item__meta" data-v-02ace4e9${_scopeId}>Nur Sterne, ohne Text.</p>`);
								if (item.hidden) _push(`<p class="bwa-item__meta" data-v-02ace4e9${_scopeId}>Ausgeblendet am ${(0, server_renderer_exports.ssrInterpolate)(item.hiddenAt)}: ${(0, server_renderer_exports.ssrInterpolate)(item.hiddenReason)}</p>`);
								else _push(`<!---->`);
								if (item.reply && open.value?.id !== item.id) _push(`<p class="bwa-item__reply" data-v-02ace4e9${_scopeId}><strong data-v-02ace4e9${_scopeId}>Unsere Antwort</strong> (${(0, server_renderer_exports.ssrInterpolate)(item.repliedAt)}): ${(0, server_renderer_exports.ssrInterpolate)(item.reply)}</p>`);
								else _push(`<!---->`);
								if (__props.canModerate) {
									_push(`<div class="bwa-item__actions" data-v-02ace4e9${_scopeId}>`);
									if (open.value?.id !== item.id) {
										_push(`<!--[--><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrRenderAttr)("data-start", `reply-${item.id}`)} data-v-02ace4e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.reply ? "Antwort ändern" : "Antworten")}</button>`);
										if (!item.hidden) _push(`<button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrRenderAttr)("data-start", `hide-${item.id}`)} data-v-02ace4e9${_scopeId}>Ausblenden</button>`);
										else _push(`<button class="btn btn--ghost" type="button" data-v-02ace4e9${_scopeId}>Wieder einblenden</button>`);
										_push(`<!--]-->`);
									} else if (open.value.what === "hide") _push(`<form class="bwa-form" data-v-02ace4e9${_scopeId}><div class="form-field" data-v-02ace4e9${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `bw-hide-${item.id}`)} data-v-02ace4e9${_scopeId}>Warum wird sie ausgeblendet?</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `bw-hide-${item.id}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(hideForm).reason)} class="input" maxlength="500"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(hideForm).errors.reason ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `bw-hide-${item.id}-err`)} data-v-02ace4e9${_scopeId}><p${(0, server_renderer_exports.ssrRenderAttr)("id", `bw-hide-${item.id}-err`)} class="form-field__error" data-v-02ace4e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(hideForm).errors.reason)}</p></div><div class="bwa-form__go" data-v-02ace4e9${_scopeId}><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(hideForm).processing) ? " disabled" : ""} data-v-02ace4e9${_scopeId}>Ausblenden</button><button class="btn btn--ghost" type="button" data-v-02ace4e9${_scopeId}>Abbrechen</button></div></form>`);
									else _push(`<form class="bwa-form" data-v-02ace4e9${_scopeId}><div class="form-field" data-v-02ace4e9${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `bw-reply-${item.id}`)} data-v-02ace4e9${_scopeId}>Antwort (steht im Shop unter der Bewertung)</label><textarea${(0, server_renderer_exports.ssrRenderAttr)("id", `bw-reply-${item.id}`)} class="input bwa-area" rows="3" maxlength="1000"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", (0, vue_exports.unref)(replyForm).errors.reply ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `bw-reply-${item.id}-err`)} data-v-02ace4e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(replyForm).reply)}</textarea><p${(0, server_renderer_exports.ssrRenderAttr)("id", `bw-reply-${item.id}-err`)} class="form-field__error" data-v-02ace4e9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(replyForm).errors.reply)}</p></div><div class="bwa-form__go" data-v-02ace4e9${_scopeId}><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(replyForm).processing) ? " disabled" : ""} data-v-02ace4e9${_scopeId}>Speichern</button><button class="btn btn--ghost" type="button" data-v-02ace4e9${_scopeId}>Abbrechen</button></div></form>`);
									_push(`</div>`);
								} else _push(`<!---->`);
								_push(`</li>`);
							});
							_push(`<!--]--></ol>`);
						}
					} else return [
						(0, vue_exports.createVNode)("p", { class: "bwa-lead" }, " Hier stehen die Bewertungen der Käuferinnen und Käufer. Sie kommen nur über den Link aus der Einladung, die der Shop einige Tage nach „Zugestellt“ verschickt – anlegen kann sie hier niemand. Eine ausgeblendete Bewertung zählt nicht mehr zur Bewertung der Felge. "),
						(0, vue_exports.createVNode)("form", {
							class: "bwa-filters",
							onSubmit: (0, vue_exports.withModifiers)(apply, ["prevent"])
						}, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
							class: "form-field__label",
							for: "bwa-status"
						}, "Zeigen"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
							id: "bwa-status",
							"onUpdate:modelValue": ($event) => status.value = $event,
							class: "input"
						}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.filters, (option) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
								key: option.value,
								value: option.value
							}, (0, vue_exports.toDisplayString)(option.label), 9, ["value"]);
						}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, status.value]])]), (0, vue_exports.createVNode)("div", { class: "bwa-filters__go" }, [(0, vue_exports.createVNode)("button", {
							class: "btn btn--secondary",
							type: "submit"
						}, "Anwenden")])], 32),
						__props.items.length === 0 && __props.total === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 0,
							kind: "empty",
							text: "Hier erscheint jede Bewertung, sobald eine Käuferin oder ein Käufer über den Link aus der Einladung bewertet hat."
						})) : __props.items.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 1,
							kind: "filtered",
							total: __props.total,
							onReset: resetFilter
						}, null, 8, ["total"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ol", {
							key: 2,
							class: "bwa-list"
						}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.items, (item) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
								key: item.id,
								class: ["bwa-item", { "bwa-item--hidden": item.hidden }]
							}, [
								(0, vue_exports.createVNode)("div", { class: "bwa-item__head" }, [
									(0, vue_exports.createVNode)("span", {
										class: "bwa-stars",
										"aria-label": stars(item.rating),
										role: "img"
									}, [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(5, (n) => {
										return (0, vue_exports.createVNode)(AdminIcon_default, {
											key: n,
											name: "ratings",
											size: 16,
											class: n <= item.rating ? "bwa-on" : "bwa-off"
										}, null, 8, ["class"]);
									}), 64))], 8, ["aria-label"]),
									item.wheelHref ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
										key: 0,
										href: item.wheelHref,
										class: "bwa-item__wheel"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.wheel), 1)]),
										_: 2
									}, 1032, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 1,
										class: "bwa-item__wheel"
									}, (0, vue_exports.toDisplayString)(item.wheel), 1)),
									(0, vue_exports.createVNode)("span", { class: "bwa-item__meta" }, [item.orderHref ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [
										(0, vue_exports.createTextVNode)("aus "),
										(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), { href: item.orderHref }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.order), 1)]),
											_: 2
										}, 1032, ["href"]),
										(0, vue_exports.createTextVNode)(", ")
									], 64)) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.at), 1)]),
									item.hidden ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 2,
										class: "adm-tag adm-tag--neutral"
									}, "Ausgeblendet")) : (0, vue_exports.createCommentVNode)("", true)
								]),
								item.body ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 0,
									class: "bwa-item__body"
								}, "„" + (0, vue_exports.toDisplayString)(item.body) + "“", 1)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 1,
									class: "bwa-item__meta"
								}, "Nur Sterne, ohne Text.")),
								item.hidden ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 2,
									class: "bwa-item__meta"
								}, "Ausgeblendet am " + (0, vue_exports.toDisplayString)(item.hiddenAt) + ": " + (0, vue_exports.toDisplayString)(item.hiddenReason), 1)) : (0, vue_exports.createCommentVNode)("", true),
								item.reply && open.value?.id !== item.id ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 3,
									class: "bwa-item__reply"
								}, [(0, vue_exports.createVNode)("strong", null, "Unsere Antwort"), (0, vue_exports.createTextVNode)(" (" + (0, vue_exports.toDisplayString)(item.repliedAt) + "): " + (0, vue_exports.toDisplayString)(item.reply), 1)])) : (0, vue_exports.createCommentVNode)("", true),
								__props.canModerate ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 4,
									class: "bwa-item__actions"
								}, [open.value?.id !== item.id ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									"data-start": `reply-${item.id}`,
									onClick: ($event) => start(item, "reply")
								}, (0, vue_exports.toDisplayString)(item.reply ? "Antwort ändern" : "Antworten"), 9, ["data-start", "onClick"]), !item.hidden ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 0,
									class: "btn btn--ghost",
									type: "button",
									"data-start": `hide-${item.id}`,
									onClick: ($event) => start(item, "hide")
								}, "Ausblenden", 8, ["data-start", "onClick"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 1,
									class: "btn btn--ghost",
									type: "button",
									onClick: ($event) => reveal(item)
								}, "Wieder einblenden", 8, ["onClick"]))], 64)) : open.value.what === "hide" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("form", {
									key: 1,
									class: "bwa-form",
									onSubmit: (0, vue_exports.withModifiers)(($event) => hide(item), ["prevent"])
								}, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: `bw-hide-${item.id}`
									}, "Warum wird sie ausgeblendet?", 8, ["for"]),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: `bw-hide-${item.id}`,
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(hideForm).reason = $event,
										class: "input",
										maxlength: "500",
										"aria-invalid": (0, vue_exports.unref)(hideForm).errors.reason ? "true" : void 0,
										"aria-describedby": `bw-hide-${item.id}-err`
									}, null, 8, [
										"id",
										"onUpdate:modelValue",
										"aria-invalid",
										"aria-describedby"
									]), [[vue_exports.vModelText, (0, vue_exports.unref)(hideForm).reason]]),
									(0, vue_exports.createVNode)("p", {
										id: `bw-hide-${item.id}-err`,
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(hideForm).errors.reason), 9, ["id"])
								]), (0, vue_exports.createVNode)("div", { class: "bwa-form__go" }, [(0, vue_exports.createVNode)("button", {
									class: "btn btn--primary",
									type: "submit",
									disabled: (0, vue_exports.unref)(hideForm).processing
								}, "Ausblenden", 8, ["disabled"]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--ghost",
									type: "button",
									onClick: ($event) => close(item.id)
								}, "Abbrechen", 8, ["onClick"])])], 40, ["onSubmit"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("form", {
									key: 2,
									class: "bwa-form",
									onSubmit: (0, vue_exports.withModifiers)(($event) => reply(item), ["prevent"])
								}, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: `bw-reply-${item.id}`
									}, "Antwort (steht im Shop unter der Bewertung)", 8, ["for"]),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("textarea", {
										id: `bw-reply-${item.id}`,
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(replyForm).reply = $event,
										class: "input bwa-area",
										rows: "3",
										maxlength: "1000",
										"aria-invalid": (0, vue_exports.unref)(replyForm).errors.reply ? "true" : void 0,
										"aria-describedby": `bw-reply-${item.id}-err`
									}, null, 8, [
										"id",
										"onUpdate:modelValue",
										"aria-invalid",
										"aria-describedby"
									]), [[vue_exports.vModelText, (0, vue_exports.unref)(replyForm).reply]]),
									(0, vue_exports.createVNode)("p", {
										id: `bw-reply-${item.id}-err`,
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(replyForm).errors.reply), 9, ["id"])
								]), (0, vue_exports.createVNode)("div", { class: "bwa-form__go" }, [(0, vue_exports.createVNode)("button", {
									class: "btn btn--primary",
									type: "submit",
									disabled: (0, vue_exports.unref)(replyForm).processing
								}, "Speichern", 8, ["disabled"]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--ghost",
									type: "button",
									onClick: ($event) => close(item.id)
								}, "Abbrechen", 8, ["onClick"])])], 40, ["onSubmit"]))])) : (0, vue_exports.createCommentVNode)("", true)
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
//#region resources/js/Pages/Admin/Bewertungen/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Bewertungen/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-02ace4e9"]]);
//#endregion
export { Index_default as default };
