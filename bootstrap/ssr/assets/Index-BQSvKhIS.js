import { t as Dialog_default } from "./Dialog-C-07FMpe.js";
import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BmBly3wt.js";
import { a as link_default, c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminState_default } from "./AdminState-D6cOAUjW.js";
import { t as useOpenOnArrival } from "./useOpenOnArrival-BhtmDuub.js";
//#region resources/js/Pages/Admin/Seiten/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		groups: {},
		can: {}
	},
	setup(__props) {
		/**
		* Inhalte › Seiten — every page of the shop whose words the team edits: the homepage, the Ratgeber
		* articles and the legal pages (docs/admin/inhalte-build-plan.md).
		*
		* One primary action, *Ratgeber-Artikel anlegen* — the only kind of page a team adds; the others
		* are fixed by the shop's structure. A row says what differs from the normal state and nothing
		* else: not published, a draft waiting, the Kanzlei's text still missing.
		*/
		const props = __props;
		const page = usePage();
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
			return `Bei allen ${NUMBER_WORDS[n] ?? String(n)} Seiten fehlt noch der Text der Kanzlei.`;
		}
		const creating = (0, vue_exports.ref)(false);
		const title = (0, vue_exports.ref)("");
		const busy = (0, vue_exports.ref)(false);
		const sent = (0, vue_exports.ref)(false);
		const error = (0, vue_exports.computed)(() => {
			const raw = page.props.errors;
			const bag = raw !== null && typeof raw === "object" ? raw : {};
			return sent.value ? bag.title ?? bag.slug ?? "" : "";
		});
		function openCreate() {
			title.value = "";
			sent.value = false;
			creating.value = true;
		}
		useOpenOnArrival("neu", openCreate, () => props.can.create);
		function create() {
			if (busy.value) return;
			busy.value = true;
			sent.value = true;
			router.post("/admin/seiten", { title: title.value }, {
				preserveScroll: true,
				onError: () => void (0, vue_exports.nextTick)(() => document.getElementById("sn-title")?.focus()),
				onFinish: () => {
					busy.value = false;
				}
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Seiten",
				context: context.value
			}, _attrs), (0, vue_exports.createSlots)({
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (count.value > 0) {
							_push(`<div class="adm-panel" data-v-5c78f6cf${_scopeId}><table class="adm-table sn__table" data-v-5c78f6cf${_scopeId}><colgroup data-v-5c78f6cf${_scopeId}><col data-v-5c78f6cf${_scopeId}><col class="sn__col-shop" data-v-5c78f6cf${_scopeId}></colgroup><thead data-v-5c78f6cf${_scopeId}><tr data-v-5c78f6cf${_scopeId}><th scope="col" data-v-5c78f6cf${_scopeId}>Seite</th><th scope="col" data-v-5c78f6cf${_scopeId}>Im Shop</th></tr></thead><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.groups, (group) => {
								_push(`<tbody data-v-5c78f6cf${_scopeId}>`);
								if (!(group.pages.length === 1 && group.pages[0]?.title === group.label)) {
									_push(`<tr class="sn__group-row" data-v-5c78f6cf${_scopeId}><th scope="rowgroup" colspan="2" data-v-5c78f6cf${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(group.label)} `);
									if (allPlaceholders(group)) _push(`<span class="sn__group-note" data-v-5c78f6cf${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(placeholderNote(group))}</span>`);
									else _push(`<!---->`);
									_push(`</th></tr>`);
								} else _push(`<!---->`);
								_push(`<!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(group.pages, (row) => {
									_push(`<tr data-v-5c78f6cf${_scopeId}><td data-label="Seite" data-v-5c78f6cf${_scopeId}><span class="adm-table__key sn__name" data-v-5c78f6cf${_scopeId}>`);
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
									if (row.placeholder && !allPlaceholders(group)) _push(`<span class="adm-tag adm-tag--warn" data-v-5c78f6cf${_scopeId}>Text der Kanzlei fehlt</span>`);
									else _push(`<!---->`);
									_push(`</span><span class="adm-table__sub" data-v-5c78f6cf${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.href)}`);
									if (row.lawyerReviewed) _push(`<!--[--> · vom Anwalt geprüft<!--]-->`);
									else _push(`<!---->`);
									_push(`</span>`);
									if (row.draft) {
										_push(`<span class="adm-table__sub" data-v-5c78f6cf${_scopeId}> Entwurf vom ${(0, server_renderer_exports.ssrInterpolate)(row.draft.at)}`);
										if (row.draft.by) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(row.draft.by)}<!--]-->`);
										else _push(`<!---->`);
										_push(`</span>`);
									} else _push(`<!---->`);
									_push(`</td><td data-label="Im Shop" data-phone="status" class="sn__num" data-v-5c78f6cf${_scopeId}>`);
									if (row.published) _push(`<!--[-->seit ${(0, server_renderer_exports.ssrInterpolate)(row.publishedAt ?? "–")}<!--]-->`);
									else _push(`<span class="adm-tag adm-tag--neutral" data-v-5c78f6cf${_scopeId}>Nicht veröffentlicht</span>`);
									_push(`</td></tr>`);
								});
								_push(`<!--]--></tbody>`);
							});
							_push(`<!--]--></table></div>`);
						} else _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Noch keine Seite, deren Text du hier bearbeiten kannst."
						}, null, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
							open: creating.value,
							"onUpdate:open": ($event) => creating.value = $event,
							title: "Ratgeber-Artikel anlegen",
							"content-class": "adm-dialog adm-dialog--narrow"
						}, {
							actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-5c78f6cf${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="submit" form="sn-create"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-5c78f6cf${_scopeId}> Anlegen </button>`);
								else return [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									onClick: ($event) => creating.value = false
								}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--primary",
									type: "submit",
									form: "sn-create",
									disabled: busy.value,
									"aria-busy": busy.value ? "true" : void 0
								}, " Anlegen ", 8, ["disabled", "aria-busy"])];
							}),
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<form id="sn-create" class="adm-fields" novalidate data-v-5c78f6cf${_scopeId}><div class="form-field" data-v-5c78f6cf${_scopeId}><label class="form-field__label" for="sn-title" data-v-5c78f6cf${_scopeId}>Titel</label><input id="sn-title"${(0, server_renderer_exports.ssrRenderAttr)("value", title.value)} class="input" type="text" maxlength="90" autocomplete="off" aria-required="true" aria-describedby="sn-title-help sn-title-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", error.value ? "true" : void 0)} data-v-5c78f6cf${_scopeId}><p id="sn-title-help" class="form-field__help" data-v-5c78f6cf${_scopeId}> Aus dem Titel entsteht die Adresse, zum Beispiel /ratgeber/et-richtig-lesen. Der Artikel ist erst nach dem Veröffentlichen im Shop. </p><p id="sn-title-err" class="form-field__error" data-v-5c78f6cf${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(error.value)}</p></div></form>`);
								else return [(0, vue_exports.createVNode)("form", {
									id: "sn-create",
									class: "adm-fields",
									novalidate: "",
									onSubmit: (0, vue_exports.withModifiers)(create, ["prevent"])
								}, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "sn-title"
									}, "Titel"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "sn-title",
										"onUpdate:modelValue": ($event) => title.value = $event,
										class: "input",
										type: "text",
										maxlength: "90",
										autocomplete: "off",
										"aria-required": "true",
										"aria-describedby": "sn-title-help sn-title-err",
										"aria-invalid": error.value ? "true" : void 0
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, title.value]]),
									(0, vue_exports.createVNode)("p", {
										id: "sn-title-help",
										class: "form-field__help"
									}, " Aus dem Titel entsteht die Adresse, zum Beispiel /ratgeber/et-richtig-lesen. Der Artikel ist erst nach dem Veröffentlichen im Shop. "),
									(0, vue_exports.createVNode)("p", {
										id: "sn-title-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(error.value), 1)
								])], 32)];
							}),
							_: 1
						}, _parent, _scopeId));
					} else return [count.value > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
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
									}, "Text der Kanzlei fehlt")) : (0, vue_exports.createCommentVNode)("", true)]),
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
					})), (0, vue_exports.createVNode)(Dialog_default, {
						open: creating.value,
						"onUpdate:open": ($event) => creating.value = $event,
						title: "Ratgeber-Artikel anlegen",
						"content-class": "adm-dialog adm-dialog--narrow"
					}, {
						actions: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("button", {
							class: "btn btn--secondary",
							type: "button",
							onClick: ($event) => creating.value = false
						}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
							class: "btn btn--primary",
							type: "submit",
							form: "sn-create",
							disabled: busy.value,
							"aria-busy": busy.value ? "true" : void 0
						}, " Anlegen ", 8, ["disabled", "aria-busy"])]),
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("form", {
							id: "sn-create",
							class: "adm-fields",
							novalidate: "",
							onSubmit: (0, vue_exports.withModifiers)(create, ["prevent"])
						}, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
							(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "sn-title"
							}, "Titel"),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "sn-title",
								"onUpdate:modelValue": ($event) => title.value = $event,
								class: "input",
								type: "text",
								maxlength: "90",
								autocomplete: "off",
								"aria-required": "true",
								"aria-describedby": "sn-title-help sn-title-err",
								"aria-invalid": error.value ? "true" : void 0
							}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, title.value]]),
							(0, vue_exports.createVNode)("p", {
								id: "sn-title-help",
								class: "form-field__help"
							}, " Aus dem Titel entsteht die Adresse, zum Beispiel /ratgeber/et-richtig-lesen. Der Artikel ist erst nach dem Veröffentlichen im Shop. "),
							(0, vue_exports.createVNode)("p", {
								id: "sn-title-err",
								class: "form-field__error"
							}, (0, vue_exports.toDisplayString)(error.value), 1)
						])], 32)]),
						_: 1
					}, 8, ["open", "onUpdate:open"])];
				}),
				_: 2
			}, [__props.can.create ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--primary" type="button" data-v-5c78f6cf${_scopeId}>Ratgeber-Artikel anlegen</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						onClick: openCreate
					}, "Ratgeber-Artikel anlegen")];
				}),
				key: "0"
			} : void 0]), _parent));
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
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-5c78f6cf"]]);
//#endregion
export { Index_default as default };
