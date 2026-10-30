import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-D5fYDVeQ.js";
import { a as link_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminState_default } from "./AdminState-BXpi0AIC.js";
//#region resources/js/Pages/Admin/Seiten/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		groups: {},
		ratgeber: {}
	},
	setup(__props) {
		/**
		* Inhalte › Seiten — every page of the shop whose words the team edits and whose place the shop's structure fixes: the
		* homepage and the legal pages (docs/admin/inhalte-build-plan.md). The Ratgeber articles have their own page since his
		* admin item 12 (D-351); one line here says where they went.
		*
		* A row says what differs from the normal state and nothing else: not published, a draft waiting, a legal text still a
		* placeholder (D-319).
		*/
		const props = __props;
		const count = (0, vue_exports.computed)(() => props.groups.reduce((sum, group) => sum + group.pages.length, 0));
		const context = (0, vue_exports.computed)(() => {
			const drafts = props.groups.reduce((sum, group) => sum + group.pages.filter((p) => p.draft !== null).length, 0);
			const pages = count.value === 1 ? "1 Seite" : `${count.value} Seiten`;
			return drafts === 0 ? pages : `${pages} · ${drafts === 1 ? "1 Entwurf wartet" : `${drafts} Entwürfe warten`}`;
		});
		function allPlaceholders(group) {
			return group.pages.length > 1 && group.pages.every((p) => p.placeholder);
		}
		const NUMBER_WORDS = [
			"null",
			"eine",
			"zwei",
			"drei",
			"vier",
			"fünf",
			"sechs",
			"sieben",
			"acht",
			"neun",
			"zehn",
			"elf",
			"zwölf"
		];
		function placeholderNote(group) {
			const n = group.pages.length;
			return `Alle ${NUMBER_WORDS[n] ?? String(n)} Seiten sind noch Platzhalter.`;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Seiten",
				context: context.value
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="adm-note sn__moved" data-v-311db1da${_scopeId}> Die Blog-Artikel haben eine eigene Seite: `);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: __props.ratgeber }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Ratgeber`);
								else return [(0, vue_exports.createTextVNode)("Ratgeber")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`. </p>`);
						if (count.value > 0) {
							_push(`<div class="adm-panel" data-v-311db1da${_scopeId}><table class="adm-table sn__table" data-v-311db1da${_scopeId}><colgroup data-v-311db1da${_scopeId}><col data-v-311db1da${_scopeId}><col class="sn__col-shop" data-v-311db1da${_scopeId}></colgroup><thead data-v-311db1da${_scopeId}><tr data-v-311db1da${_scopeId}><th scope="col" data-v-311db1da${_scopeId}>Seite</th><th scope="col" data-v-311db1da${_scopeId}>Im Shop</th></tr></thead><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.groups, (group) => {
								_push(`<tbody data-v-311db1da${_scopeId}>`);
								if (!(group.pages.length === 1 && group.pages[0]?.title === group.label)) {
									_push(`<tr class="sn__group-row" data-v-311db1da${_scopeId}><th scope="rowgroup" colspan="2" data-v-311db1da${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(group.label)} `);
									if (allPlaceholders(group)) _push(`<span class="sn__group-note" data-v-311db1da${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(placeholderNote(group))}</span>`);
									else _push(`<!---->`);
									_push(`</th></tr>`);
								} else _push(`<!---->`);
								_push(`<!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(group.pages, (row) => {
									_push(`<tr data-v-311db1da${_scopeId}><td data-label="Seite" data-v-311db1da${_scopeId}><span class="adm-table__key sn__name" data-v-311db1da${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
										href: `/admin/seiten/${row.id}`,
										class: "sn__link"
									}, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(row.title)}`);
											else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(row.title), 1)];
										}),
										_: 2
									}, _parent, _scopeId));
									if (row.placeholder && !allPlaceholders(group)) _push(`<span class="adm-tag adm-tag--warn" data-v-311db1da${_scopeId}>Platzhalter</span>`);
									else _push(`<!---->`);
									_push(`</span><span class="adm-table__sub" data-v-311db1da${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.href)}`);
									if (row.lawyerReviewed) _push(`<!--[--> · vom Anwalt geprüft<!--]-->`);
									else _push(`<!---->`);
									_push(`</span>`);
									if (row.draft) {
										_push(`<span class="adm-table__sub" data-v-311db1da${_scopeId}> Entwurf vom ${(0, server_renderer_exports.ssrInterpolate)(row.draft.at)}`);
										if (row.draft.by) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(row.draft.by)}<!--]-->`);
										else _push(`<!---->`);
										_push(`</span>`);
									} else _push(`<!---->`);
									_push(`</td><td data-label="Im Shop" data-phone="status" class="sn__num" data-v-311db1da${_scopeId}>`);
									if (row.published) _push(`<!--[-->seit ${(0, server_renderer_exports.ssrInterpolate)(row.publishedAt ?? "–")}<!--]-->`);
									else _push(`<span class="adm-tag adm-tag--neutral" data-v-311db1da${_scopeId}>Nicht veröffentlicht</span>`);
									_push(`</td></tr>`);
								});
								_push(`<!--]--></tbody>`);
							});
							_push(`<!--]--></table></div>`);
						} else _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Noch keine Seite, deren Text du hier bearbeiten kannst."
						}, null, _parent, _scopeId));
					} else return [(0, vue_exports.createVNode)("p", { class: "adm-note sn__moved" }, [
						(0, vue_exports.createTextVNode)(" Die Blog-Artikel haben eine eigene Seite: "),
						(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), { href: __props.ratgeber }, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Ratgeber")]),
							_: 1
						}, 8, ["href"]),
						(0, vue_exports.createTextVNode)(". ")
					]), count.value > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
						key: 0,
						class: "adm-panel"
					}, [(0, vue_exports.createVNode)("table", { class: "adm-table sn__table" }, [
						(0, vue_exports.createVNode)("colgroup", null, [(0, vue_exports.createVNode)("col"), (0, vue_exports.createVNode)("col", { class: "sn__col-shop" })]),
						(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [(0, vue_exports.createVNode)("th", { scope: "col" }, "Seite"), (0, vue_exports.createVNode)("th", { scope: "col" }, "Im Shop")])]),
						((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.groups, (group) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tbody", { key: group.key }, [!(group.pages.length === 1 && group.pages[0]?.title === group.label) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", {
								key: 0,
								class: "sn__group-row"
							}, [(0, vue_exports.createVNode)("th", {
								scope: "rowgroup",
								colspan: "2"
							}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(group.label) + " ", 1), allPlaceholders(group) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 0,
								class: "sn__group-note"
							}, (0, vue_exports.toDisplayString)(placeholderNote(group)), 1)) : (0, vue_exports.createCommentVNode)("", true)])])) : (0, vue_exports.createCommentVNode)("", true), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(group.pages, (row) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: row.id }, [(0, vue_exports.createVNode)("td", { "data-label": "Seite" }, [
									(0, vue_exports.createVNode)("span", { class: "adm-table__key sn__name" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
										href: `/admin/seiten/${row.id}`,
										class: "sn__link"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(row.title), 1)]),
										_: 2
									}, 1032, ["href"]), row.placeholder && !allPlaceholders(group) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "adm-tag adm-tag--warn"
									}, "Platzhalter")) : (0, vue_exports.createCommentVNode)("", true)]),
									(0, vue_exports.createVNode)("span", { class: "adm-table__sub" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(row.href), 1), row.lawyerReviewed ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · vom Anwalt geprüft")], 64)) : (0, vue_exports.createCommentVNode)("", true)]),
									row.draft ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "adm-table__sub"
									}, [(0, vue_exports.createTextVNode)(" Entwurf vom " + (0, vue_exports.toDisplayString)(row.draft.at), 1), row.draft.by ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(row.draft.by), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true)
								]), (0, vue_exports.createVNode)("td", {
									"data-label": "Im Shop",
									"data-phone": "status",
									class: "sn__num"
								}, [row.published ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("seit " + (0, vue_exports.toDisplayString)(row.publishedAt ?? "–"), 1)], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 1,
									class: "adm-tag adm-tag--neutral"
								}, "Nicht veröffentlicht"))])]);
							}), 128))]);
						}), 128))
					])])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
						key: 1,
						kind: "empty",
						text: "Noch keine Seite, deren Text du hier bearbeiten kannst."
					}))];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Seiten/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Seiten/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-311db1da"]]);
//#endregion
export { Index_default as default };
