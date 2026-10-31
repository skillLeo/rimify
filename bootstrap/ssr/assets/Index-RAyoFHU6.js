import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-rIU_td1t.js";
import { a as link_default, c as router, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-COuF1lMZ.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { t as AdminState_default } from "./AdminState-BXpi0AIC.js";
import { t as ListPager_default } from "./ListPager-Dv3SlK7L.js";
//#region resources/js/Pages/Admin/Gutachten/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		documents: {},
		found: {},
		total: {},
		released: {},
		search: {},
		status: {},
		kind: {},
		statusOptions: {},
		kindOptions: {},
		pagination: {},
		can: {}
	},
	setup(__props) {
		/**
		* Gutachten › Dokumente: every approval document on file.
		*
		* The „Zeilen im Shop“ column shows released rows against all rows on purpose: a document with twenty
		* rows entered and none released is the most common half-finished state in this workflow, and it is
		* invisible unless the list says so.
		*
		* Only the exception is tagged: a released document says so in plain text, a draft is neutral
		* (never red — "not yet checked" is not "refused", R-03, R-07), a superseded one a warning and a
		* withdrawn one the failure tone. Status and type narrow the list in place, and a filter appears only
		* where there is something to choose between. Nothing on file and nothing matching the filters are two
		* different states with two different sentences (admin-shell.md §9.3).
		*/
		const props = __props;
		const KIND_LABEL = {
			ABE: "ABE",
			TEILEGUTACHTEN: "Teilegutachten",
			NACHTRAG: "Nachtrag",
			ECE: "ECE-Genehmigung",
			EC: "EG-Typgenehmigung"
		};
		/** `tag: null` is the normal state, printed as plain text. */
		const STATUS = {
			published: {
				label: "Freigegeben",
				tag: null
			},
			draft: {
				label: "Entwurf",
				tag: "adm-tag--neutral"
			},
			superseded: {
				label: "Ersetzt",
				tag: "adm-tag--warn"
			},
			withdrawn: {
				label: "Zurückgezogen",
				tag: "adm-tag--bad"
			}
		};
		function statusOf(status) {
			return STATUS[status] ?? {
				label: status,
				tag: "adm-tag--neutral"
			};
		}
		const status = (0, vue_exports.computed)(() => props.status === "" ? null : props.status);
		const kind = (0, vue_exports.computed)(() => props.kind === "" ? null : props.kind);
		const q = (0, vue_exports.ref)(props.search);
		/** Only the values that actually occur, each with its count. */
		const statusOptions = (0, vue_exports.computed)(() => props.statusOptions);
		const kindOptions = (0, vue_exports.computed)(() => props.kindOptions);
		/** A filter with one value filters nothing, so it is not drawn. */
		const showStatus = (0, vue_exports.computed)(() => statusOptions.value.length >= 2);
		const showKind = (0, vue_exports.computed)(() => kindOptions.value.length >= 2);
		function go(change) {
			const next = {
				q: props.search,
				status: props.status,
				art: props.kind,
				...change
			};
			const query = {};
			for (const [key, value] of Object.entries(next)) if (typeof value === "string" && value.trim() !== "") query[key] = value.trim();
			router.get("/admin/gutachten", query, {
				preserveScroll: true,
				preserveState: true
			});
		}
		function setStatus(value) {
			go({ status: value });
		}
		function setKind(value) {
			go({ art: value });
		}
		function runSearch() {
			go({ q: q.value });
		}
		function resetFilters() {
			q.value = "";
			router.get("/admin/gutachten", {}, {
				preserveScroll: true,
				preserveState: true
			});
		}
		const rows = (0, vue_exports.computed)(() => props.documents);
		const filtered = (0, vue_exports.computed)(() => props.search !== "" || props.status !== "" || props.kind !== "");
		const context = (0, vue_exports.computed)(() => {
			if (props.total === 0) return "Noch kein Dokument erfasst";
			if (filtered.value) return `${decimal(props.found, 0)} ${props.found === 1 ? "Dokument" : "Dokumente"} · gefiltert`;
			return `${decimal(props.total, 0)} ${props.total === 1 ? "Dokument" : "Dokumente"} · ${decimal(props.released, 0)} freigegeben`;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Dokumente",
				context: context.value
			}, _attrs), (0, vue_exports.createSlots)({
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.total > 0) _push(`<form class="gd-search" role="search" data-v-51416a35${_scopeId}><div class="form-field" data-v-51416a35${_scopeId}><label class="form-field__label" for="gd-q" data-v-51416a35${_scopeId}>Suchen</label><input id="gd-q"${(0, server_renderer_exports.ssrRenderAttr)("value", q.value)} class="input" type="search" maxlength="100" autocomplete="off" placeholder="Nummer, KBA-Nummer oder Aussteller" data-v-51416a35${_scopeId}></div><button class="btn btn--secondary" type="submit" data-v-51416a35${_scopeId}>Suchen</button></form>`);
						else _push(`<!---->`);
						if (showStatus.value || showKind.value) {
							_push(`<div class="adm-filters" data-v-51416a35${_scopeId}>`);
							if (showStatus.value) {
								_push(`<div class="adm-filter" role="group" aria-label="Status" data-v-51416a35${_scopeId}><span class="adm-filter__label" aria-hidden="true" data-v-51416a35${_scopeId}>Status</span><button class="adm-chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", status.value === null)} data-v-51416a35${_scopeId}>Alle</button><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(statusOptions.value, (option) => {
									_push(`<button class="adm-chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", status.value === option.value)} data-v-51416a35${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(statusOf(option.value).label)} <span class="adm-chip__n" data-v-51416a35${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(option.count, 0))}</span></button>`);
								});
								_push(`<!--]--></div>`);
							} else _push(`<!---->`);
							if (showKind.value) {
								_push(`<div class="adm-filter" role="group" aria-label="Art" data-v-51416a35${_scopeId}><span class="adm-filter__label" aria-hidden="true" data-v-51416a35${_scopeId}>Art</span><button class="adm-chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", kind.value === null)} data-v-51416a35${_scopeId}>Alle</button><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(kindOptions.value, (option) => {
									_push(`<button class="adm-chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", kind.value === option.value)} data-v-51416a35${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(KIND_LABEL[option.value] ?? option.value)} <span class="adm-chip__n" data-v-51416a35${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(option.count, 0))}</span></button>`);
								});
								_push(`<!--]--></div>`);
							} else _push(`<!---->`);
							_push(`</div>`);
						} else _push(`<!---->`);
						if (rows.value.length > 0) {
							_push(`<div class="adm-panel" data-v-51416a35${_scopeId}><table class="adm-table" data-v-51416a35${_scopeId}><thead data-v-51416a35${_scopeId}><tr data-v-51416a35${_scopeId}><th scope="col" data-v-51416a35${_scopeId}>Nummer</th><th scope="col" data-v-51416a35${_scopeId}>Art</th><th scope="col" data-v-51416a35${_scopeId}>Aussteller</th><th scope="col" class="num" data-v-51416a35${_scopeId}>Ausgestellt</th><th scope="col" data-v-51416a35${_scopeId}>Status</th><th scope="col" class="num" data-v-51416a35${_scopeId}>Zeilen im Shop</th></tr></thead><tbody data-v-51416a35${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(rows.value, (doc) => {
								_push(`<tr data-v-51416a35${_scopeId}><td data-label="Nummer" data-v-51416a35${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: doc.href,
									class: "adm-table__key gd-link"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(doc.reportNumber)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(doc.reportNumber), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								if (doc.kbaNumber) _push(`<span class="adm-table__sub" data-v-51416a35${_scopeId}>KBA ${(0, server_renderer_exports.ssrInterpolate)(doc.kbaNumber)}</span>`);
								else _push(`<!---->`);
								if (doc.demo) _push(`<span class="adm-tag adm-tag--neutral adm-demo" data-v-51416a35${_scopeId}>Demodaten</span>`);
								else _push(`<!---->`);
								_push(`</td><td data-label="Art" data-phone="hide" data-v-51416a35${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(KIND_LABEL[doc.kind] ?? doc.kind)}</td><td data-label="Aussteller" data-phone="hide" data-v-51416a35${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(doc.issuer)}</td><td data-label="Ausgestellt" class="num" data-v-51416a35${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(doc.issuedOn ?? "–")}</td><td data-label="Status" data-phone="status" data-v-51416a35${_scopeId}><span data-v-51416a35${_scopeId}>`);
								if (statusOf(doc.status).tag) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([statusOf(doc.status).tag, "adm-tag"])}" data-v-51416a35${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(statusOf(doc.status).label)}</span>`);
								else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(statusOf(doc.status).label)}<!--]-->`);
								_push(`<span class="adm-table__sub" data-v-51416a35${_scopeId}>Fassung ${(0, server_renderer_exports.ssrInterpolate)(doc.revision)}</span></span></td><td data-label="Zeilen im Shop" class="num" data-v-51416a35${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(doc.publishedCount, 0))} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(doc.fitmentCount, 0))}</td></tr>`);
							});
							_push(`<!--]--></tbody></table></div>`);
						} else if (__props.total === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Noch kein Gutachten erfasst. Jedes Gutachten, das du anlegst, steht hier, mit der Zahl seiner Zeilen."
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									if (__props.can.create) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
										href: "/admin/gutachten/neu",
										class: "btn btn--primary"
									}, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) _push(`Erstes Gutachten anlegen`);
											else return [(0, vue_exports.createTextVNode)("Erstes Gutachten anlegen")];
										}),
										_: 1
									}, _parent, _scopeId));
									else _push(`<!---->`);
								} else return [__props.can.create ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
									key: 0,
									href: "/admin/gutachten/neu",
									class: "btn btn--primary"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Erstes Gutachten anlegen")]),
									_: 1
								})) : (0, vue_exports.createCommentVNode)("", true)];
							}),
							_: 1
						}, _parent, _scopeId));
						else _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "filtered",
							total: __props.total,
							onReset: resetFilters
						}, null, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(ListPager_default, {
							pagination: __props.pagination,
							label: "Seiten der Dokumente"
						}, null, _parent, _scopeId));
					} else return [
						__props.total > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("form", {
							key: 0,
							class: "gd-search",
							role: "search",
							onSubmit: (0, vue_exports.withModifiers)(runSearch, ["prevent"])
						}, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
							class: "form-field__label",
							for: "gd-q"
						}, "Suchen"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
							id: "gd-q",
							"onUpdate:modelValue": ($event) => q.value = $event,
							class: "input",
							type: "search",
							maxlength: "100",
							autocomplete: "off",
							placeholder: "Nummer, KBA-Nummer oder Aussteller"
						}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, q.value]])]), (0, vue_exports.createVNode)("button", {
							class: "btn btn--secondary",
							type: "submit"
						}, "Suchen")], 32)) : (0, vue_exports.createCommentVNode)("", true),
						showStatus.value || showKind.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 1,
							class: "adm-filters"
						}, [showStatus.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 0,
							class: "adm-filter",
							role: "group",
							"aria-label": "Status"
						}, [
							(0, vue_exports.createVNode)("span", {
								class: "adm-filter__label",
								"aria-hidden": "true"
							}, "Status"),
							(0, vue_exports.createVNode)("button", {
								class: "adm-chip",
								type: "button",
								"aria-pressed": status.value === null,
								onClick: ($event) => setStatus(null)
							}, "Alle", 8, ["aria-pressed", "onClick"]),
							((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(statusOptions.value, (option) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: option.value,
									class: "adm-chip",
									type: "button",
									"aria-pressed": status.value === option.value,
									onClick: ($event) => setStatus(status.value === option.value ? null : option.value)
								}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(statusOf(option.value).label) + " ", 1), (0, vue_exports.createVNode)("span", { class: "adm-chip__n" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(option.count, 0)), 1)], 8, ["aria-pressed", "onClick"]);
							}), 128))
						])) : (0, vue_exports.createCommentVNode)("", true), showKind.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 1,
							class: "adm-filter",
							role: "group",
							"aria-label": "Art"
						}, [
							(0, vue_exports.createVNode)("span", {
								class: "adm-filter__label",
								"aria-hidden": "true"
							}, "Art"),
							(0, vue_exports.createVNode)("button", {
								class: "adm-chip",
								type: "button",
								"aria-pressed": kind.value === null,
								onClick: ($event) => setKind(null)
							}, "Alle", 8, ["aria-pressed", "onClick"]),
							((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(kindOptions.value, (option) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: option.value,
									class: "adm-chip",
									type: "button",
									"aria-pressed": kind.value === option.value,
									onClick: ($event) => setKind(kind.value === option.value ? null : option.value)
								}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(KIND_LABEL[option.value] ?? option.value) + " ", 1), (0, vue_exports.createVNode)("span", { class: "adm-chip__n" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(option.count, 0)), 1)], 8, ["aria-pressed", "onClick"]);
							}), 128))
						])) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true),
						rows.value.length > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 2,
							class: "adm-panel"
						}, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Nummer"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Art"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Aussteller"),
							(0, vue_exports.createVNode)("th", {
								scope: "col",
								class: "num"
							}, "Ausgestellt"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Status"),
							(0, vue_exports.createVNode)("th", {
								scope: "col",
								class: "num"
							}, "Zeilen im Shop")
						])]), (0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(rows.value, (doc) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: doc.id }, [
								(0, vue_exports.createVNode)("td", { "data-label": "Nummer" }, [
									(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
										href: doc.href,
										class: "adm-table__key gd-link"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(doc.reportNumber), 1)]),
										_: 2
									}, 1032, ["href"]),
									doc.kbaNumber ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "adm-table__sub"
									}, "KBA " + (0, vue_exports.toDisplayString)(doc.kbaNumber), 1)) : (0, vue_exports.createCommentVNode)("", true),
									doc.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 1,
										class: "adm-tag adm-tag--neutral adm-demo"
									}, "Demodaten")) : (0, vue_exports.createCommentVNode)("", true)
								]),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Art",
									"data-phone": "hide"
								}, (0, vue_exports.toDisplayString)(KIND_LABEL[doc.kind] ?? doc.kind), 1),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Aussteller",
									"data-phone": "hide"
								}, (0, vue_exports.toDisplayString)(doc.issuer), 1),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Ausgestellt",
									class: "num"
								}, (0, vue_exports.toDisplayString)(doc.issuedOn ?? "–"), 1),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Status",
									"data-phone": "status"
								}, [(0, vue_exports.createVNode)("span", null, [statusOf(doc.status).tag ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: ["adm-tag", statusOf(doc.status).tag]
								}, (0, vue_exports.toDisplayString)(statusOf(doc.status).label), 3)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(statusOf(doc.status).label), 1)], 64)), (0, vue_exports.createVNode)("span", { class: "adm-table__sub" }, "Fassung " + (0, vue_exports.toDisplayString)(doc.revision), 1)])]),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Zeilen im Shop",
									class: "num"
								}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(doc.publishedCount, 0)) + " von " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(doc.fitmentCount, 0)), 1)
							]);
						}), 128))])])])) : __props.total === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 3,
							kind: "empty",
							text: "Noch kein Gutachten erfasst. Jedes Gutachten, das du anlegst, steht hier, mit der Zahl seiner Zeilen."
						}, {
							default: (0, vue_exports.withCtx)(() => [__props.can.create ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
								key: 0,
								href: "/admin/gutachten/neu",
								class: "btn btn--primary"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Erstes Gutachten anlegen")]),
								_: 1
							})) : (0, vue_exports.createCommentVNode)("", true)]),
							_: 1
						})) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 4,
							kind: "filtered",
							total: __props.total,
							onReset: resetFilters
						}, null, 8, ["total"])),
						(0, vue_exports.createVNode)(ListPager_default, {
							pagination: __props.pagination,
							label: "Seiten der Dokumente"
						}, null, 8, ["pagination"])
					];
				}),
				_: 2
			}, [__props.can.create ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: "/admin/gutachten/neu",
						class: "btn btn--primary"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
									name: "plus",
									size: 20
								}, null, _parent, _scopeId));
								_push(` Neues Gutachten `);
							} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "plus",
								size: 20
							}), (0, vue_exports.createTextVNode)(" Neues Gutachten ")];
						}),
						_: 1
					}, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
						href: "/admin/gutachten/neu",
						class: "btn btn--primary"
					}, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
							name: "plus",
							size: 20
						}), (0, vue_exports.createTextVNode)(" Neues Gutachten ")]),
						_: 1
					})];
				}),
				key: "0"
			} : void 0]), _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-51416a35"]]);
//#endregion
export { Index_default as default };
