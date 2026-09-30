import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-CVLYqE90.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as decimal } from "./format-BSciVE2Q.js";
import { t as AdminState_default } from "./AdminState-Dv1vTfZV.js";
//#region resources/js/Pages/Admin/Anfragen/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		summary: {},
		subscriptions: {},
		demand: {}
	},
	setup(__props) {
		/**
		* Verkauf › Anfragen (the „Sag mir Bescheid“ subscriptions): customers who asked to be told when a document for their car
		* arrives. Not "Benachrichtigungen" — that word belongs to the team's own notifications.
		*
		* Two lists from the same rows. The demand ranking comes first because it answers the question this
		* feature exists for: which Gutachten is worth buying next, by how many people are waiting for it.
		* The full list underneath is for support, newest first.
		*/
		const props = __props;
		/**
		* Only the exception is tagged. Waiting and notified are the two normal outcomes and read as plain
		* text; an address never confirmed or since unsubscribed is set apart, neutral — it is nobody's fault.
		*/
		const TAGGED = /* @__PURE__ */ new Set(["Unbestätigt", "Abgemeldet"]);
		const context = (0, vue_exports.computed)(() => {
			const { waiting, total } = props.summary;
			if (total === 0) return "Noch niemand hat sich eingetragen";
			return `${decimal(waiting, 0)} warten · ${decimal(total, 0)} ${total === 1 ? "Eintragung" : "Eintragungen"} insgesamt`;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Anfragen",
				context: context.value
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.summary.total === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Kundinnen und Kunden tragen sich im Shop ein, wenn für ihr Fahrzeug noch keine Felge freigegeben ist."
						}, null, _parent, _scopeId));
						else {
							_push(`<!--[--><section class="adm-section" aria-labelledby="ben-demand" data-v-f0a14844${_scopeId}><div class="adm-section__head" data-v-f0a14844${_scopeId}><h2 id="ben-demand" class="adm-section__title" data-v-f0a14844${_scopeId}>Gefragte Fahrzeuge</h2></div><p class="adm-note ben__note" data-v-f0a14844${_scopeId}>Bestätigte Adressen, die noch auf ein Gutachten warten – je Fahrzeug, die meisten zuerst.</p>`);
							if (__props.demand.length === 0) _push(`<p class="adm-note" data-v-f0a14844${_scopeId}>Gerade wartet niemand.</p>`);
							else {
								_push(`<div class="adm-panel" data-v-f0a14844${_scopeId}><table class="adm-table" data-v-f0a14844${_scopeId}><thead data-v-f0a14844${_scopeId}><tr data-v-f0a14844${_scopeId}><th scope="col" data-v-f0a14844${_scopeId}>Fahrzeug</th><th scope="col" data-v-f0a14844${_scopeId}>HSN/TSN</th><th scope="col" class="num" data-v-f0a14844${_scopeId}>Wartende</th></tr></thead><tbody data-v-f0a14844${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.demand, (row) => {
									_push(`<tr data-v-f0a14844${_scopeId}><td data-label="Fahrzeug" data-v-f0a14844${_scopeId}><span class="adm-table__key" data-v-f0a14844${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.vehicle)}</span></td><td data-label="HSN/TSN" class="num ben__keys" data-v-f0a14844${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.keyNumbers)}</td><td data-label="Wartende" class="num" data-v-f0a14844${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(row.waiting, 0))}</td></tr>`);
								});
								_push(`<!--]--></tbody></table></div>`);
							}
							_push(`</section><section class="adm-section" aria-labelledby="ben-all" data-v-f0a14844${_scopeId}><div class="adm-section__head" data-v-f0a14844${_scopeId}><h2 id="ben-all" class="adm-section__title" data-v-f0a14844${_scopeId}>Alle Eintragungen</h2></div>`);
							if (__props.summary.total > __props.summary.limit) _push(`<p class="adm-note ben__note" data-v-f0a14844${_scopeId}> Die neuesten ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.summary.limit, 0))} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.summary.total, 0))}. </p>`);
							else _push(`<!---->`);
							_push(`<div class="adm-panel" data-v-f0a14844${_scopeId}><table class="adm-table" data-v-f0a14844${_scopeId}><thead data-v-f0a14844${_scopeId}><tr data-v-f0a14844${_scopeId}><th scope="col" data-v-f0a14844${_scopeId}>E-Mail</th><th scope="col" data-v-f0a14844${_scopeId}>Fahrzeug</th><th scope="col" data-v-f0a14844${_scopeId}>Status</th><th scope="col" class="num" data-v-f0a14844${_scopeId}>Eingetragen</th><th scope="col" class="num" data-v-f0a14844${_scopeId}>Benachrichtigt</th></tr></thead><tbody data-v-f0a14844${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.subscriptions, (row) => {
								_push(`<tr data-v-f0a14844${_scopeId}><td data-label="E-Mail" data-v-f0a14844${_scopeId}><span class="adm-table__key ben__mail" data-v-f0a14844${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.email)}</span></td><td data-label="Fahrzeug" data-v-f0a14844${_scopeId}><span data-v-f0a14844${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.vehicle)} <span class="adm-table__sub" data-v-f0a14844${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.keyNumbers)}</span></span></td><td data-label="Status" data-phone="status" data-v-f0a14844${_scopeId}>`);
								if ((0, vue_exports.unref)(TAGGED).has(row.status)) _push(`<span class="adm-tag adm-tag--neutral" data-v-f0a14844${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.status)}</span>`);
								else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(row.status)}<!--]-->`);
								_push(`</td><td data-label="Eingetragen" class="num" data-v-f0a14844${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.requestedAt)}</td><td data-label="Benachrichtigt" class="num" data-v-f0a14844${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.notifiedAt ?? "–")}</td></tr>`);
							});
							_push(`<!--]--></tbody></table></div></section><!--]-->`);
						}
					} else return [__props.summary.total === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
						key: 0,
						kind: "empty",
						text: "Kundinnen und Kunden tragen sich im Shop ein, wenn für ihr Fahrzeug noch keine Felge freigegeben ist."
					})) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createVNode)("section", {
						class: "adm-section",
						"aria-labelledby": "ben-demand"
					}, [
						(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "ben-demand",
							class: "adm-section__title"
						}, "Gefragte Fahrzeuge")]),
						(0, vue_exports.createVNode)("p", { class: "adm-note ben__note" }, "Bestätigte Adressen, die noch auf ein Gutachten warten – je Fahrzeug, die meisten zuerst."),
						__props.demand.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-note"
						}, "Gerade wartet niemand.")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 1,
							class: "adm-panel"
						}, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Fahrzeug"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "HSN/TSN"),
							(0, vue_exports.createVNode)("th", {
								scope: "col",
								class: "num"
							}, "Wartende")
						])]), (0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.demand, (row) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: row.keyNumbers + row.vehicle }, [
								(0, vue_exports.createVNode)("td", { "data-label": "Fahrzeug" }, [(0, vue_exports.createVNode)("span", { class: "adm-table__key" }, (0, vue_exports.toDisplayString)(row.vehicle), 1)]),
								(0, vue_exports.createVNode)("td", {
									"data-label": "HSN/TSN",
									class: "num ben__keys"
								}, (0, vue_exports.toDisplayString)(row.keyNumbers), 1),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Wartende",
									class: "num"
								}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(row.waiting, 0)), 1)
							]);
						}), 128))])])]))
					]), (0, vue_exports.createVNode)("section", {
						class: "adm-section",
						"aria-labelledby": "ben-all"
					}, [
						(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "ben-all",
							class: "adm-section__title"
						}, "Alle Eintragungen")]),
						__props.summary.total > __props.summary.limit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-note ben__note"
						}, " Die neuesten " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.summary.limit, 0)) + " von " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.summary.total, 0)) + ". ", 1)) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("div", { class: "adm-panel" }, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
							(0, vue_exports.createVNode)("th", { scope: "col" }, "E-Mail"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Fahrzeug"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Status"),
							(0, vue_exports.createVNode)("th", {
								scope: "col",
								class: "num"
							}, "Eingetragen"),
							(0, vue_exports.createVNode)("th", {
								scope: "col",
								class: "num"
							}, "Benachrichtigt")
						])]), (0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.subscriptions, (row) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: row.id }, [
								(0, vue_exports.createVNode)("td", { "data-label": "E-Mail" }, [(0, vue_exports.createVNode)("span", { class: "adm-table__key ben__mail" }, (0, vue_exports.toDisplayString)(row.email), 1)]),
								(0, vue_exports.createVNode)("td", { "data-label": "Fahrzeug" }, [(0, vue_exports.createVNode)("span", null, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(row.vehicle) + " ", 1), (0, vue_exports.createVNode)("span", { class: "adm-table__sub" }, (0, vue_exports.toDisplayString)(row.keyNumbers), 1)])]),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Status",
									"data-phone": "status"
								}, [(0, vue_exports.unref)(TAGGED).has(row.status) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: "adm-tag adm-tag--neutral"
								}, (0, vue_exports.toDisplayString)(row.status), 1)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(row.status), 1)], 64))]),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Eingetragen",
									class: "num"
								}, (0, vue_exports.toDisplayString)(row.requestedAt), 1),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Benachrichtigt",
									class: "num"
								}, (0, vue_exports.toDisplayString)(row.notifiedAt ?? "–"), 1)
							]);
						}), 128))])])])
					])], 64))];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Anfragen/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Anfragen/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f0a14844"]]);
//#endregion
export { Index_default as default };
