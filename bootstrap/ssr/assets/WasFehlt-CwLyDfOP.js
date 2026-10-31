import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BeseBJf_.js";
import { a as link_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Pages/Admin/System/WasFehlt.vue?vue&type=script&setup=true&lang.ts
var WasFehlt_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "WasFehlt",
	__ssrInlineRender: true,
	props: {
		summary: {},
		groups: {},
		owners: {},
		owner: {},
		checks: {},
		checkedAt: {}
	},
	setup(__props) {
		/**
		* System › Was fehlt: what the live shop still needs, read from the state it is in (GoLiveChecks; the operator's brief
		* of 05.10.2026, §7) — the same checks `php artisan rimify:go-live-check` prints. Read only. The client's items by
		* default; the choice is a link, so it works before the page is interactive. What is open comes first in each group;
		* the state is a word beside its dot, never the colour alone.
		*/
		const props = __props;
		const STATE_WORD = {
			ok: "Erfüllt",
			fehlt: "Offen",
			"nicht prüfbar": "Nicht prüfbar"
		};
		const STATE_DOT = {
			ok: "ok",
			fehlt: "bad",
			"nicht prüfbar": "warn"
		};
		const STATE_ORDER = {
			fehlt: 0,
			"nicht prüfbar": 1,
			ok: 2
		};
		const OWNER_WORD = {
			kunde: "Kunde",
			wir: "RIMIFY",
			host: "Host"
		};
		const FILTERS = [
			{
				key: "kunde",
				label: "Beim Kunden"
			},
			{
				key: "wir",
				label: "Bei uns"
			},
			{
				key: "host",
				label: "Beim Host"
			},
			{
				key: "alle",
				label: "Alle"
			}
		];
		/** How many checks are open per owner — the number beside each choice. */
		const openCount = (key) => props.checks.filter((c) => c.state === "fehlt" && (key === "alle" || c.owner === key)).length;
		const shown = (0, vue_exports.computed)(() => props.groups.map((group) => ({
			group,
			checks: props.checks.filter((c) => c.group === group && (props.owner === "alle" || c.owner === props.owner)).sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state])
		})).filter((g) => g.checks.length > 0));
		const isAdminPath = (place) => place.startsWith("/admin");
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Was fehlt",
				context: `Stand: ${__props.checkedAt}`
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="wf-summary" role="status" data-v-9980561e${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.summary)}</p><p class="wf-intro" data-v-9980561e${_scopeId}> Die Prüfungen zeigen den aktuellen Zustand des Shops. Echte Zahlungen bleiben gesperrt, bis unter „Recht und Pflichtangaben“ alles erfüllt ist. </p><nav class="wf-filter" aria-label="Nach Zuständigkeit filtern" data-v-9980561e${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(FILTERS, (filter) => {
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
								key: filter.key,
								href: `/admin/system/was-fehlt?wer=${filter.key}`,
								class: "wf-filter__item",
								"aria-current": __props.owner === filter.key ? "page" : void 0,
								"preserve-scroll": "",
								replace: ""
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(filter.label)} <span class="wf-filter__count num" data-v-9980561e${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(openCount(filter.key))} offen</span>`);
									else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(filter.label) + " ", 1), (0, vue_exports.createVNode)("span", { class: "wf-filter__count num" }, (0, vue_exports.toDisplayString)(openCount(filter.key)) + " offen", 1)];
								}),
								_: 2
							}, _parent, _scopeId));
						});
						_push(`<!--]--></nav>`);
						if (shown.value.length === 0) _push(`<p class="wf-empty" data-v-9980561e${_scopeId}>Für diese Auswahl gibt es keine Prüfung.</p>`);
						else _push(`<!---->`);
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(shown.value, (part) => {
							_push(`<section class="wf-group"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `wf-${part.group}`)} data-v-9980561e${_scopeId}><h2${(0, server_renderer_exports.ssrRenderAttr)("id", `wf-${part.group}`)} class="adm-form__heading" data-v-9980561e${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(part.group)}</h2><ul class="adm-panel wf-list" data-v-9980561e${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(part.checks, (check) => {
								_push(`<li class="wf-check"${(0, server_renderer_exports.ssrRenderAttr)("data-state", check.state)} data-v-9980561e${_scopeId}><span class="${(0, server_renderer_exports.ssrRenderClass)([`adm-health__dot--${STATE_DOT[check.state]}`, "adm-health__dot"])}" aria-hidden="true" data-v-9980561e${_scopeId}></span><span class="wf-check__title" data-v-9980561e${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(check.title)}</span><span class="${(0, server_renderer_exports.ssrRenderClass)([`wf-check__state--${STATE_DOT[check.state]}`, "wf-check__state"])}" data-v-9980561e${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(STATE_WORD[check.state])}</span><p class="wf-check__sentence" data-v-9980561e${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(check.sentence)}</p><p class="wf-check__place" data-v-9980561e${_scopeId}>`);
								if (__props.owner === "alle") _push(`<span class="wf-check__owner" data-v-9980561e${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(OWNER_WORD[check.owner])} · </span>`);
								else _push(`<!---->`);
								_push(` Wo: `);
								if (isAdminPath(check.place)) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: check.place }, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(check.place)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(check.place), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								else _push(`<code data-v-9980561e${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(check.place)}</code>`);
								_push(`</p></li>`);
							});
							_push(`<!--]--></ul></section>`);
						});
						_push(`<!--]-->`);
					} else return [
						(0, vue_exports.createVNode)("p", {
							class: "wf-summary",
							role: "status"
						}, (0, vue_exports.toDisplayString)(__props.summary), 1),
						(0, vue_exports.createVNode)("p", { class: "wf-intro" }, " Die Prüfungen zeigen den aktuellen Zustand des Shops. Echte Zahlungen bleiben gesperrt, bis unter „Recht und Pflichtangaben“ alles erfüllt ist. "),
						(0, vue_exports.createVNode)("nav", {
							class: "wf-filter",
							"aria-label": "Nach Zuständigkeit filtern"
						}, [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(FILTERS, (filter) => {
							return (0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
								key: filter.key,
								href: `/admin/system/was-fehlt?wer=${filter.key}`,
								class: "wf-filter__item",
								"aria-current": __props.owner === filter.key ? "page" : void 0,
								"preserve-scroll": "",
								replace: ""
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(filter.label) + " ", 1), (0, vue_exports.createVNode)("span", { class: "wf-filter__count num" }, (0, vue_exports.toDisplayString)(openCount(filter.key)) + " offen", 1)]),
								_: 2
							}, 1032, ["href", "aria-current"]);
						}), 64))]),
						shown.value.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "wf-empty"
						}, "Für diese Auswahl gibt es keine Prüfung.")) : (0, vue_exports.createCommentVNode)("", true),
						((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(shown.value, (part) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
								key: part.group,
								class: "wf-group",
								"aria-labelledby": `wf-${part.group}`
							}, [(0, vue_exports.createVNode)("h2", {
								id: `wf-${part.group}`,
								class: "adm-form__heading"
							}, (0, vue_exports.toDisplayString)(part.group), 9, ["id"]), (0, vue_exports.createVNode)("ul", { class: "adm-panel wf-list" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(part.checks, (check) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
									key: check.id,
									class: "wf-check",
									"data-state": check.state
								}, [
									(0, vue_exports.createVNode)("span", {
										class: ["adm-health__dot", `adm-health__dot--${STATE_DOT[check.state]}`],
										"aria-hidden": "true"
									}, null, 2),
									(0, vue_exports.createVNode)("span", { class: "wf-check__title" }, (0, vue_exports.toDisplayString)(check.title), 1),
									(0, vue_exports.createVNode)("span", { class: ["wf-check__state", `wf-check__state--${STATE_DOT[check.state]}`] }, (0, vue_exports.toDisplayString)(STATE_WORD[check.state]), 3),
									(0, vue_exports.createVNode)("p", { class: "wf-check__sentence" }, (0, vue_exports.toDisplayString)(check.sentence), 1),
									(0, vue_exports.createVNode)("p", { class: "wf-check__place" }, [
										__props.owner === "alle" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: "wf-check__owner"
										}, (0, vue_exports.toDisplayString)(OWNER_WORD[check.owner]) + " · ", 1)) : (0, vue_exports.createCommentVNode)("", true),
										(0, vue_exports.createTextVNode)(" Wo: "),
										isAdminPath(check.place) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
											key: 1,
											href: check.place
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(check.place), 1)]),
											_: 2
										}, 1032, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("code", { key: 2 }, (0, vue_exports.toDisplayString)(check.place), 1))
									])
								], 8, ["data-state"]);
							}), 128))])], 8, ["aria-labelledby"]);
						}), 128))
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/System/WasFehlt.vue
var _sfc_setup = WasFehlt_vue_vue_type_script_setup_true_lang_default.setup;
WasFehlt_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/System/WasFehlt.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var WasFehlt_default = /*#__PURE__*/ _plugin_vue_export_helper_default(WasFehlt_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-9980561e"]]);
//#endregion
export { WasFehlt_default as default };
