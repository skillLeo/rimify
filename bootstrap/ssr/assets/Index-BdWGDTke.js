import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-rIU_td1t.js";
import { c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-COuF1lMZ.js";
//#region resources/js/Pages/Admin/MeistgekaufteFelgen/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		size: {},
		picks: {},
		options: {},
		shelf: {},
		can: {}
	},
	setup(__props) {
		/**
		* Inhalte › Meistgekaufte Felgen (the client's #5, „please show 8 rims“; D-353): the homepage's shelf as it stands now —
		* each rim with the reason it stands there — and the team's picks that fill the places sales leave free, in their order.
		* Saved straight to the shop; the server refuses a save to a role without the rights to edit and to publish.
		*/
		const props = __props;
		const page = usePage();
		const SOURCE = {
			verkauft: {
				label: "Verkauft",
				tone: "adm-tag--ok"
			},
			ausgewaehlt: {
				label: "Deine Auswahl",
				tone: "adm-tag--neutral"
			},
			neu: {
				label: "Neu im Shop",
				tone: ""
			}
		};
		const context = (0, vue_exports.computed)(() => `Startseite · zeigt ${props.size} Felgen`);
		const fill = (picks) => Array.from({ length: props.size }, (_, i) => picks[i] ?? "");
		const slots = (0, vue_exports.ref)(fill(props.picks));
		const busy = (0, vue_exports.ref)(false);
		(0, vue_exports.watch)(() => props.picks, (picks) => slots.value = fill(picks));
		const chosen = (0, vue_exports.computed)(() => slots.value.filter((key) => key !== ""));
		const dirty = (0, vue_exports.computed)(() => chosen.value.join("|") !== props.picks.join("|"));
		const labelOf = (key) => props.options.find((o) => o.value === key)?.label ?? key;
		function takenElsewhere(key, index) {
			return slots.value.some((other, i) => i !== index && other === key);
		}
		function move(index, by) {
			const next = [...slots.value];
			const target = index + by;
			const a = next[index] ?? "";
			next[index] = next[target] ?? "";
			next[target] = a;
			slots.value = next;
		}
		const refusal = (0, vue_exports.computed)(() => {
			const raw = page.props.errors;
			return Object.entries(raw !== null && typeof raw === "object" ? raw : {}).find(([key]) => key === "picks" || key.startsWith("picks."))?.[1] ?? "";
		});
		function save() {
			if (busy.value) return;
			busy.value = true;
			router.put("/admin/meistgekaufte-felgen", { picks: chosen.value }, {
				preserveScroll: true,
				onFinish: () => {
					busy.value = false;
				}
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Meistgekaufte Felgen",
				context: context.value
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="adm-note mf__rule" data-v-a7fbc475${_scopeId}> Der Bereich auf der Startseite zeigt immer ${(0, server_renderer_exports.ssrInterpolate)(__props.size)} Felgen. Vorn stehen die Felgen, die in den letzten 90 Tagen verkauft wurden, die meistverkauften zuerst. Die freien Plätze füllt deine Auswahl in ihrer Reihenfolge; ist dann noch ein Platz frei, die neuesten Felgen im Shop. Solange nichts verkauft ist, heißt der Bereich „Empfohlene Felgen“, ohne Auswahl „Neu im Shop“. </p><section class="adm-panel mf__now" aria-labelledby="mf-now" data-v-a7fbc475${_scopeId}><h2 id="mf-now" class="adm-form__heading" data-v-a7fbc475${_scopeId}>So steht der Bereich jetzt</h2>`);
						if (__props.shelf.length) {
							_push(`<ol class="mf__list" data-v-a7fbc475${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.shelf, (row, index) => {
								_push(`<li class="mf__row" data-v-a7fbc475${_scopeId}><span class="mf__place" data-v-a7fbc475${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</span><a${(0, server_renderer_exports.ssrRenderAttr)("href", row.href)} class="mf__name" target="_blank" rel="noopener" data-v-a7fbc475${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.label)}</a><span class="${(0, server_renderer_exports.ssrRenderClass)([SOURCE[row.source].tone, "adm-tag"])}" data-v-a7fbc475${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(SOURCE[row.source].label)}</span></li>`);
							});
							_push(`<!--]--></ol>`);
						} else _push(`<!---->`);
						if (__props.shelf.length < __props.size) _push(`<p class="adm-note" data-v-a7fbc475${_scopeId}> Im Shop sind zurzeit ${(0, server_renderer_exports.ssrInterpolate)(__props.shelf.length === 0 ? "keine Felgen" : __props.shelf.length === 1 ? "eine Felge" : `${__props.shelf.length} Felgen`)} zu kaufen; der Bereich zeigt ${(0, server_renderer_exports.ssrInterpolate)(__props.size)}, sobald es so viele gibt. </p>`);
						else _push(`<!---->`);
						_push(`</section><section class="adm-panel mf__picks" aria-labelledby="mf-picks" data-v-a7fbc475${_scopeId}><h2 id="mf-picks" class="adm-form__heading" data-v-a7fbc475${_scopeId}>Deine Auswahl</h2>`);
						if (refusal.value) _push(`<p class="adm-alert" role="alert" data-v-a7fbc475${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(refusal.value)}</p>`);
						else _push(`<!---->`);
						if (__props.can.update) {
							_push(`<form class="mf__form" novalidate data-v-a7fbc475${_scopeId}><ol class="mf__slots" data-v-a7fbc475${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(slots.value, (_, index) => {
								_push(`<li class="mf__slot" data-v-a7fbc475${_scopeId}><label class="mf__place"${(0, server_renderer_exports.ssrRenderAttr)("for", `mf-slot-${index}`)} data-v-a7fbc475${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(index + 1)}<span class="visually-hidden" data-v-a7fbc475${_scopeId}>. Platz</span></label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `mf-slot-${index}`)} class="input mf__select" data-v-a7fbc475${_scopeId}><option value="" data-v-a7fbc475${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(slots.value[index]) ? (0, server_renderer_exports.ssrLooseContain)(slots.value[index], "") : (0, server_renderer_exports.ssrLooseEqual)(slots.value[index], "")) ? " selected" : ""}${_scopeId}>Platz frei</option><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.options, (option) => {
									_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", option.value)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(takenElsewhere(option.value, index)) ? " disabled" : ""} data-v-a7fbc475${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(slots.value[index]) ? (0, server_renderer_exports.ssrLooseContain)(slots.value[index], option.value) : (0, server_renderer_exports.ssrLooseEqual)(slots.value[index], option.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(option.label)}</option>`);
								});
								_push(`<!--]--></select><span class="mf__moves" data-v-a7fbc475${_scopeId}><button class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(index === 0) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${index + 1}. Platz nach oben`)} data-v-a7fbc475${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
									name: "chevron-up",
									size: 20
								}, null, _parent, _scopeId));
								_push(`</button><button class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(index === slots.value.length - 1) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${index + 1}. Platz nach unten`)} data-v-a7fbc475${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
									name: "chevron-down",
									size: 20
								}, null, _parent, _scopeId));
								_push(`</button></span></li>`);
							});
							_push(`<!--]--></ol><div class="mf__actions" data-v-a7fbc475${_scopeId}><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value || !dirty.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-a7fbc475${_scopeId}>Speichern</button>`);
							if (dirty.value) _push(`<span class="adm-note" data-v-a7fbc475${_scopeId}>Noch nicht gespeichert.</span>`);
							else _push(`<!---->`);
							_push(`</div></form>`);
						} else {
							_push(`<!--[-->`);
							if (__props.picks.length) {
								_push(`<ol class="mf__list" data-v-a7fbc475${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.picks, (key, index) => {
									_push(`<li class="mf__row" data-v-a7fbc475${_scopeId}><span class="mf__place" data-v-a7fbc475${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</span><span class="mf__name" data-v-a7fbc475${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(labelOf(key))}</span></li>`);
								});
								_push(`<!--]--></ol>`);
							} else _push(`<p class="adm-note" data-v-a7fbc475${_scopeId}>Noch keine Auswahl.</p>`);
							_push(`<p class="adm-note" data-v-a7fbc475${_scopeId}>Ändern braucht die Rechte „Inhalte · Bearbeiten“ und „Inhalte · Veröffentlichen“.</p><!--]-->`);
						}
						_push(`</section>`);
					} else return [
						(0, vue_exports.createVNode)("p", { class: "adm-note mf__rule" }, " Der Bereich auf der Startseite zeigt immer " + (0, vue_exports.toDisplayString)(__props.size) + " Felgen. Vorn stehen die Felgen, die in den letzten 90 Tagen verkauft wurden, die meistverkauften zuerst. Die freien Plätze füllt deine Auswahl in ihrer Reihenfolge; ist dann noch ein Platz frei, die neuesten Felgen im Shop. Solange nichts verkauft ist, heißt der Bereich „Empfohlene Felgen“, ohne Auswahl „Neu im Shop“. ", 1),
						(0, vue_exports.createVNode)("section", {
							class: "adm-panel mf__now",
							"aria-labelledby": "mf-now"
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "mf-now",
								class: "adm-form__heading"
							}, "So steht der Bereich jetzt"),
							__props.shelf.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ol", {
								key: 0,
								class: "mf__list"
							}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.shelf, (row, index) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
									key: row.key,
									class: "mf__row"
								}, [
									(0, vue_exports.createVNode)("span", { class: "mf__place" }, (0, vue_exports.toDisplayString)(index + 1), 1),
									(0, vue_exports.createVNode)("a", {
										href: row.href,
										class: "mf__name",
										target: "_blank",
										rel: "noopener"
									}, (0, vue_exports.toDisplayString)(row.label), 9, ["href"]),
									(0, vue_exports.createVNode)("span", { class: ["adm-tag", SOURCE[row.source].tone] }, (0, vue_exports.toDisplayString)(SOURCE[row.source].label), 3)
								]);
							}), 128))])) : (0, vue_exports.createCommentVNode)("", true),
							__props.shelf.length < __props.size ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 1,
								class: "adm-note"
							}, " Im Shop sind zurzeit " + (0, vue_exports.toDisplayString)(__props.shelf.length === 0 ? "keine Felgen" : __props.shelf.length === 1 ? "eine Felge" : `${__props.shelf.length} Felgen`) + " zu kaufen; der Bereich zeigt " + (0, vue_exports.toDisplayString)(__props.size) + ", sobald es so viele gibt. ", 1)) : (0, vue_exports.createCommentVNode)("", true)
						]),
						(0, vue_exports.createVNode)("section", {
							class: "adm-panel mf__picks",
							"aria-labelledby": "mf-picks"
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "mf-picks",
								class: "adm-form__heading"
							}, "Deine Auswahl"),
							refusal.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-alert",
								role: "alert"
							}, (0, vue_exports.toDisplayString)(refusal.value), 1)) : (0, vue_exports.createCommentVNode)("", true),
							__props.can.update ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("form", {
								key: 1,
								class: "mf__form",
								novalidate: "",
								onSubmit: (0, vue_exports.withModifiers)(save, ["prevent"])
							}, [(0, vue_exports.createVNode)("ol", { class: "mf__slots" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(slots.value, (_, index) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
									key: index,
									class: "mf__slot"
								}, [
									(0, vue_exports.createVNode)("label", {
										class: "mf__place",
										for: `mf-slot-${index}`
									}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(index + 1), 1), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ". Platz")], 8, ["for"]),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: `mf-slot-${index}`,
										"onUpdate:modelValue": ($event) => slots.value[index] = $event,
										class: "input mf__select"
									}, [(0, vue_exports.createVNode)("option", { value: "" }, "Platz frei"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.options, (option) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
											key: option.value,
											value: option.value,
											disabled: takenElsewhere(option.value, index)
										}, (0, vue_exports.toDisplayString)(option.label), 9, ["value", "disabled"]);
									}), 128))], 8, ["id", "onUpdate:modelValue"]), [[vue_exports.vModelSelect, slots.value[index]]]),
									(0, vue_exports.createVNode)("span", { class: "mf__moves" }, [(0, vue_exports.createVNode)("button", {
										class: "adm-iconbtn",
										type: "button",
										disabled: index === 0,
										"aria-label": `${index + 1}. Platz nach oben`,
										onClick: ($event) => move(index, -1)
									}, [(0, vue_exports.createVNode)(AdminIcon_default, {
										name: "chevron-up",
										size: 20
									})], 8, [
										"disabled",
										"aria-label",
										"onClick"
									]), (0, vue_exports.createVNode)("button", {
										class: "adm-iconbtn",
										type: "button",
										disabled: index === slots.value.length - 1,
										"aria-label": `${index + 1}. Platz nach unten`,
										onClick: ($event) => move(index, 1)
									}, [(0, vue_exports.createVNode)(AdminIcon_default, {
										name: "chevron-down",
										size: 20
									})], 8, [
										"disabled",
										"aria-label",
										"onClick"
									])])
								]);
							}), 128))]), (0, vue_exports.createVNode)("div", { class: "mf__actions" }, [(0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "submit",
								disabled: busy.value || !dirty.value,
								"aria-busy": busy.value ? "true" : void 0
							}, "Speichern", 8, ["disabled", "aria-busy"]), dirty.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 0,
								class: "adm-note"
							}, "Noch nicht gespeichert.")) : (0, vue_exports.createCommentVNode)("", true)])], 32)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [__props.picks.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ol", {
								key: 0,
								class: "mf__list"
							}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.picks, (key, index) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
									key,
									class: "mf__row"
								}, [(0, vue_exports.createVNode)("span", { class: "mf__place" }, (0, vue_exports.toDisplayString)(index + 1), 1), (0, vue_exports.createVNode)("span", { class: "mf__name" }, (0, vue_exports.toDisplayString)(labelOf(key)), 1)]);
							}), 128))])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 1,
								class: "adm-note"
							}, "Noch keine Auswahl.")), (0, vue_exports.createVNode)("p", { class: "adm-note" }, "Ändern braucht die Rechte „Inhalte · Bearbeiten“ und „Inhalte · Veröffentlichen“.")], 64))
						])
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/MeistgekaufteFelgen/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/MeistgekaufteFelgen/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-a7fbc475"]]);
//#endregion
export { Index_default as default };
