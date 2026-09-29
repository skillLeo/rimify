import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-CttJDbw1.js";
import { a as link_default, c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminConfirm_default } from "./AdminConfirm-lE_VO-0x.js";
import { t as formatMoney } from "./num-Br8qlecZ.js";
import { t as AdminState_default } from "./AdminState-Dv1vTfZV.js";
import { t as FilePick_default } from "./FilePick-B_4pn1x_.js";
//#region resources/js/Pages/Admin/Rueckbuchungen/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		disputes: {},
		canRespond: { type: Boolean }
	},
	setup(__props) {
		/**
		* Verkauf › Rückbuchungen (Block G §5): the chargebacks Stripe reported, open ones first — each with its reason, the
		* amount, the order, and the days left to answer, counted down, because an unanswered one is money gone. Answered
		* here once: an explanation for the bank and up to two files; the order's invoice goes with them as the receipt.
		* Stripe takes one answer per chargeback, so the button asks before it sends.
		*/
		const props = __props;
		const page = usePage();
		const errors = (0, vue_exports.computed)(() => {
			const raw = page.props.errors;
			return raw !== null && typeof raw === "object" ? raw : {};
		});
		const context = (0, vue_exports.computed)(() => {
			const open = props.disputes.filter((d) => d.open).length;
			return props.disputes.length === 0 ? "Keine Rückbuchung" : `${open} offen · ${props.disputes.length} insgesamt`;
		});
		/** „noch 5 Tage“, „noch heute“, „Frist abgelaufen“ — the deadline the bank set, counted down. */
		function countdown(row) {
			if (row.daysLeft === null) return null;
			if (row.overdue) return "Frist abgelaufen";
			return row.daysLeft === 0 ? "noch heute" : row.daysLeft === 1 ? "noch 1 Tag" : `noch ${row.daysLeft} Tage`;
		}
		function urgency(row) {
			if (row.overdue) return "adm-tag adm-tag--bad";
			return row.daysLeft !== null && row.daysLeft <= 3 ? "adm-tag adm-tag--warn" : "adm-tag adm-tag--neutral";
		}
		const answering = (0, vue_exports.ref)(null);
		const form = (0, vue_exports.reactive)({
			note: "",
			shipping: null,
			other: null
		});
		const confirmOpen = (0, vue_exports.ref)(false);
		const busy = (0, vue_exports.ref)(false);
		function answer(row) {
			answering.value = row;
			form.note = "";
			form.shipping = null;
			form.other = null;
		}
		function send() {
			const row = answering.value;
			if (row === null) return;
			busy.value = true;
			router.post(`/admin/rueckbuchungen/${row.id}/nachweise`, {
				note: form.note,
				shipping: form.shipping,
				other: form.other
			}, {
				forceFormData: true,
				preserveScroll: true,
				onSuccess: () => {
					answering.value = null;
				},
				onFinish: () => {
					busy.value = false;
					confirmOpen.value = false;
				}
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Rückbuchungen",
				context: context.value,
				"read-only": !__props.canRespond
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="adm-note rb__lead" data-v-6b58e052${_scopeId}> Eine Rückbuchung holt eine Zahlung über die Bank zurück. Bis zur Frist kannst du einmal antworten: was bestellt, wann versandt und zugestellt wurde – die Rechnung geht von selbst mit. </p>`);
						if (__props.disputes.length) {
							_push(`<ul class="rb__list" data-v-6b58e052${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.disputes, (row) => {
								_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{ "rb__item--closed": !row.open }, "adm-panel rb__item"])}" data-v-6b58e052${_scopeId}><div class="rb__head" data-v-6b58e052${_scopeId}><p class="rb__title" data-v-6b58e052${_scopeId}><span class="rb__amount" data-v-6b58e052${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(row.amount))}</span> · ${(0, server_renderer_exports.ssrInterpolate)(row.reason)}</p>`);
								if (row.open && countdown(row)) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)(urgency(row))}" data-v-6b58e052${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(countdown(row))}</span>`);
								else _push(`<!---->`);
								_push(`</div><dl class="adm-facts" data-v-6b58e052${_scopeId}><div class="adm-facts__row" data-v-6b58e052${_scopeId}><dt data-v-6b58e052${_scopeId}>Stand</dt><dd data-v-6b58e052${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.status)}</dd></div><div class="adm-facts__row" data-v-6b58e052${_scopeId}><dt data-v-6b58e052${_scopeId}>Bestellung</dt><dd data-v-6b58e052${_scopeId}>`);
								if (row.order) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: `/admin/bestellungen/${row.order.id}` }, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(row.order.number)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(row.order.number), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								else _push(`<!--[-->keiner Bestellung zugeordnet<!--]-->`);
								_push(`</dd></div>`);
								if (row.dueBy && row.open) _push(`<div class="adm-facts__row" data-v-6b58e052${_scopeId}><dt data-v-6b58e052${_scopeId}>Antwort bis</dt><dd data-v-6b58e052${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.dueBy)}</dd></div>`);
								else _push(`<!---->`);
								if (row.answered) _push(`<div class="adm-facts__row" data-v-6b58e052${_scopeId}><dt data-v-6b58e052${_scopeId}>Nachweise</dt><dd data-v-6b58e052${_scopeId}>gesendet am ${(0, server_renderer_exports.ssrInterpolate)(row.answeredAt)}</dd></div>`);
								else _push(`<!---->`);
								if (row.outcome) _push(`<div class="adm-facts__row" data-v-6b58e052${_scopeId}><dt data-v-6b58e052${_scopeId}>Ergebnis</dt><dd data-v-6b58e052${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.outcome)}</dd></div>`);
								else _push(`<!---->`);
								_push(`<div class="adm-facts__row" data-v-6b58e052${_scopeId}><dt data-v-6b58e052${_scopeId}>Bei Stripe</dt><dd class="rb__ref" data-v-6b58e052${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.reference)}</dd></div></dl>`);
								if (__props.canRespond && row.open && !row.answered) {
									_push(`<!--[-->`);
									if (answering.value?.id !== row.id) _push(`<button class="btn btn--secondary" type="button" data-v-6b58e052${_scopeId}>Antworten</button>`);
									else {
										_push(`<form class="rb__form" novalidate data-v-6b58e052${_scopeId}><div class="form-field" data-v-6b58e052${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `rb-note-${row.id}`)} data-v-6b58e052${_scopeId}>Was geschehen ist</label><textarea${(0, server_renderer_exports.ssrRenderAttr)("id", `rb-note-${row.id}`)} class="input" rows="6" maxlength="20000"${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `rb-note-help-${row.id} rb-err-${row.id}`)} data-v-6b58e052${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(form.note)}</textarea><p${(0, server_renderer_exports.ssrRenderAttr)("id", `rb-note-help-${row.id}`)} class="form-field__help" data-v-6b58e052${_scopeId}>Für die Bank, sachlich: was bestellt wurde, wann versandt, mit welcher Sendungsnummer zugestellt.</p></div><div class="form-field" data-v-6b58e052${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `rb-ship-${row.id}`)} data-v-6b58e052${_scopeId}>Versandnachweis (PDF oder Bild)</label>`);
										_push((0, server_renderer_exports.ssrRenderComponent)(FilePick_default, {
											id: `rb-ship-${row.id}`,
											modelValue: form.shipping,
											"onUpdate:modelValue": ($event) => form.shipping = $event,
											accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
											label: "Datei auswählen"
										}, null, _parent, _scopeId));
										_push(`</div><div class="form-field" data-v-6b58e052${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `rb-other-${row.id}`)} data-v-6b58e052${_scopeId}>Weiterer Nachweis (optional)</label>`);
										_push((0, server_renderer_exports.ssrRenderComponent)(FilePick_default, {
											id: `rb-other-${row.id}`,
											modelValue: form.other,
											"onUpdate:modelValue": ($event) => form.other = $event,
											accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
											label: "Datei auswählen"
										}, null, _parent, _scopeId));
										_push(`</div><p${(0, server_renderer_exports.ssrRenderAttr)("id", `rb-err-${row.id}`)} class="form-field__error" role="alert" data-v-6b58e052${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.evidence ?? errors.value.note ?? errors.value.shipping ?? errors.value.other ?? "")}</p><div class="adm-fields__actions" data-v-6b58e052${_scopeId}><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-6b58e052${_scopeId}>Nachweise an Stripe senden …</button><button class="btn btn--secondary" type="button" data-v-6b58e052${_scopeId}>Abbrechen</button></div></form>`);
									}
									_push(`<!--]-->`);
								} else _push(`<!---->`);
								_push(`</li>`);
							});
							_push(`<!--]--></ul>`);
						} else _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Meldet Stripe eine Rückbuchung, steht sie hier – mit der Frist für die Antwort."
						}, null, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: confirmOpen.value,
							"onUpdate:open": ($event) => confirmOpen.value = $event,
							title: "Nachweise senden?",
							body: "Stripe nimmt pro Rückbuchung eine Antwort an; danach entscheidet die Bank. Die Rechnung geht mit.",
							"confirm-label": "Senden",
							busy: busy.value,
							onConfirm: send
						}, null, _parent, _scopeId));
					} else return [
						(0, vue_exports.createVNode)("p", { class: "adm-note rb__lead" }, " Eine Rückbuchung holt eine Zahlung über die Bank zurück. Bis zur Frist kannst du einmal antworten: was bestellt, wann versandt und zugestellt wurde – die Rechnung geht von selbst mit. "),
						__props.disputes.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ul", {
							key: 0,
							class: "rb__list"
						}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.disputes, (row) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
								key: row.id,
								class: ["adm-panel rb__item", { "rb__item--closed": !row.open }]
							}, [
								(0, vue_exports.createVNode)("div", { class: "rb__head" }, [(0, vue_exports.createVNode)("p", { class: "rb__title" }, [(0, vue_exports.createVNode)("span", { class: "rb__amount" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(row.amount)), 1), (0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(row.reason), 1)]), row.open && countdown(row) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: urgency(row)
								}, (0, vue_exports.toDisplayString)(countdown(row)), 3)) : (0, vue_exports.createCommentVNode)("", true)]),
								(0, vue_exports.createVNode)("dl", { class: "adm-facts" }, [
									(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Stand"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(row.status), 1)]),
									(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Bestellung"), (0, vue_exports.createVNode)("dd", null, [row.order ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
										key: 0,
										href: `/admin/bestellungen/${row.order.id}`
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(row.order.number), 1)]),
										_: 2
									}, 1032, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("keiner Bestellung zugeordnet")], 64))])]),
									row.dueBy && row.open ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 0,
										class: "adm-facts__row"
									}, [(0, vue_exports.createVNode)("dt", null, "Antwort bis"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(row.dueBy), 1)])) : (0, vue_exports.createCommentVNode)("", true),
									row.answered ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 1,
										class: "adm-facts__row"
									}, [(0, vue_exports.createVNode)("dt", null, "Nachweise"), (0, vue_exports.createVNode)("dd", null, "gesendet am " + (0, vue_exports.toDisplayString)(row.answeredAt), 1)])) : (0, vue_exports.createCommentVNode)("", true),
									row.outcome ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 2,
										class: "adm-facts__row"
									}, [(0, vue_exports.createVNode)("dt", null, "Ergebnis"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(row.outcome), 1)])) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Bei Stripe"), (0, vue_exports.createVNode)("dd", { class: "rb__ref" }, (0, vue_exports.toDisplayString)(row.reference), 1)])
								]),
								__props.canRespond && row.open && !row.answered ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [answering.value?.id !== row.id ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 0,
									class: "btn btn--secondary",
									type: "button",
									onClick: ($event) => answer(row)
								}, "Antworten", 8, ["onClick"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("form", {
									key: 1,
									class: "rb__form",
									novalidate: "",
									onSubmit: (0, vue_exports.withModifiers)(($event) => confirmOpen.value = true, ["prevent"])
								}, [
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `rb-note-${row.id}`
										}, "Was geschehen ist", 8, ["for"]),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("textarea", {
											id: `rb-note-${row.id}`,
											"onUpdate:modelValue": ($event) => form.note = $event,
											class: "input",
											rows: "6",
											maxlength: "20000",
											"aria-describedby": `rb-note-help-${row.id} rb-err-${row.id}`
										}, null, 8, [
											"id",
											"onUpdate:modelValue",
											"aria-describedby"
										]), [[vue_exports.vModelText, form.note]]),
										(0, vue_exports.createVNode)("p", {
											id: `rb-note-help-${row.id}`,
											class: "form-field__help"
										}, "Für die Bank, sachlich: was bestellt wurde, wann versandt, mit welcher Sendungsnummer zugestellt.", 8, ["id"])
									]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: `rb-ship-${row.id}`
									}, "Versandnachweis (PDF oder Bild)", 8, ["for"]), (0, vue_exports.createVNode)(FilePick_default, {
										id: `rb-ship-${row.id}`,
										modelValue: form.shipping,
										"onUpdate:modelValue": ($event) => form.shipping = $event,
										accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
										label: "Datei auswählen"
									}, null, 8, [
										"id",
										"modelValue",
										"onUpdate:modelValue"
									])]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: `rb-other-${row.id}`
									}, "Weiterer Nachweis (optional)", 8, ["for"]), (0, vue_exports.createVNode)(FilePick_default, {
										id: `rb-other-${row.id}`,
										modelValue: form.other,
										"onUpdate:modelValue": ($event) => form.other = $event,
										accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
										label: "Datei auswählen"
									}, null, 8, [
										"id",
										"modelValue",
										"onUpdate:modelValue"
									])]),
									(0, vue_exports.createVNode)("p", {
										id: `rb-err-${row.id}`,
										class: "form-field__error",
										role: "alert"
									}, (0, vue_exports.toDisplayString)(errors.value.evidence ?? errors.value.note ?? errors.value.shipping ?? errors.value.other ?? ""), 9, ["id"]),
									(0, vue_exports.createVNode)("div", { class: "adm-fields__actions" }, [(0, vue_exports.createVNode)("button", {
										class: "btn btn--primary",
										type: "submit",
										disabled: busy.value
									}, "Nachweise an Stripe senden …", 8, ["disabled"]), (0, vue_exports.createVNode)("button", {
										class: "btn btn--secondary",
										type: "button",
										onClick: ($event) => answering.value = null
									}, "Abbrechen", 8, ["onClick"])])
								], 40, ["onSubmit"]))], 64)) : (0, vue_exports.createCommentVNode)("", true)
							], 2);
						}), 128))])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 1,
							kind: "empty",
							text: "Meldet Stripe eine Rückbuchung, steht sie hier – mit der Frist für die Antwort."
						})),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: confirmOpen.value,
							"onUpdate:open": ($event) => confirmOpen.value = $event,
							title: "Nachweise senden?",
							body: "Stripe nimmt pro Rückbuchung eine Antwort an; danach entscheidet die Bank. Die Rechnung geht mit.",
							"confirm-label": "Senden",
							busy: busy.value,
							onConfirm: send
						}, null, 8, [
							"open",
							"onUpdate:open",
							"busy"
						])
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Rueckbuchungen/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Rueckbuchungen/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-6b58e052"]]);
//#endregion
export { Index_default as default };
