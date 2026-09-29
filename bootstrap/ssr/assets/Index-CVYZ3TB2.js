import { a as DropdownMenuRoot_default, i as DropdownMenuContent_default, n as DropdownMenuPortal_default, r as DropdownMenuItem_default, t as DropdownMenuTrigger_default } from "./DropdownMenuTrigger-xBPJueVr.js";
import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-CttJDbw1.js";
import { n as ColumnChooser_default, t as ListViews_default } from "./ListViews-BinymZsT.js";
import { a as link_default, c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-CUJcjiDR.js";
import { c as hasMobileShell, i as BottomSheet_default } from "./Toast-vSaJvIKJ.js";
import { t as formatMoney } from "./num-Br8qlecZ.js";
import { t as decimal } from "./format-BSciVE2Q.js";
import { t as AdminState_default } from "./AdminState-Dv1vTfZV.js";
import { t as FilterFields_default } from "./FilterFields-DAAZfKEH.js";
import { a as rangeQuery, i as rangeForm, t as berlinToday } from "./days-BEXWaUP_.js";
//#region resources/js/Pages/Admin/Bestellungen/filters.ts
/**
* The Bestellungen filter form, kept apart from the page so its rules are tested.
*
* The days are the admin's shared rules (composables/admin/days.ts). Amounts travel as they were
* typed — `1.425,50` — and the server reads them with the same parser that reads every price in the
* admin, so the page never turns a German number into a float of its own.
*/
var PRESETS = [
	"heute",
	"7",
	"30"
];
function isPreset(value) {
	return PRESETS.includes(value);
}
function formFromFilters(filters, today) {
	return {
		status: filters.status,
		...isPreset(filters.zeitraum) ? {
			zeitraum: filters.zeitraum,
			von: "",
			bis: ""
		} : rangeForm(filters.von || null, filters.bis || null, today),
		zahlart: filters.zahlart,
		versandart: filters.versandart,
		min: filters.min,
		max: filters.max,
		auflagen: filters.auflagen
	};
}
/**
* The query for the form, the search and the sort in force — or the German sentence that says what
* is wrong with an own date range. Defaults are left out, so the plain list is the bare URL.
*/
function queryFromForm(form, search, sort, today) {
	const range = rangeQuery(form, today);
	if ("error" in range) return range;
	const query = {};
	const q = search.trim();
	if (q) query.q = q;
	if (form.status) query.status = form.status;
	if (isPreset(form.zeitraum)) query.zeitraum = form.zeitraum;
	else Object.assign(query, range.query);
	for (const key of [
		"zahlart",
		"versandart",
		"min",
		"max"
	]) {
		const value = form[key].trim();
		if (value) query[key] = value;
	}
	if (form.auflagen) query.auflagen = "1";
	return { query: {
		...query,
		...sortQuery(sort)
	} };
}
/** The sort as query parameters; the default — newest first — is the bare URL. */
function sortQuery(sort) {
	return sort.sort === "datum" && sort.richtung === "ab" ? {} : {
		sort: sort.sort,
		richtung: sort.richtung
	};
}
/**
* Clicking a column heading: the same column turns its direction around; another column starts
* with what a person looks for first there — the newest, the largest, the earliest step.
*/
function nextSort(current, column) {
	if (current.sort === column) return {
		sort: column,
		richtung: current.richtung === "ab" ? "auf" : "ab"
	};
	return {
		sort: column,
		richtung: column === "status" ? "auf" : "ab"
	};
}
/** How many filters are on — for the phone's "Filter · 2". The search is its own field. */
function activeCount(filters) {
	return [
		filters.status,
		filters.zeitraum || filters.von || filters.bis,
		filters.zahlart,
		filters.versandart,
		filters.min || filters.max,
		filters.auflagen
	].filter(Boolean).length;
}
//#endregion
//#region resources/js/Pages/Admin/Bestellungen/Index.vue?vue&type=script&setup=true&lang.ts
var BASE = "/admin/bestellungen";
var EMPTY_TEXT = "Hier erscheint jede Bestellung, sobald jemand im Shop bestellt – mit Zahlung, Versand und dem Gutachten, unter dem sie verkauft wurde.";
/** The table's columns, in the list's order (AdminLists on the server names the same keys). */
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		orders: {},
		filters: {},
		options: {},
		filtered: { type: Boolean },
		totalAll: {},
		pagination: {},
		query: {},
		exportUrls: {},
		can: {},
		views: {},
		columns: {}
	},
	setup(__props) {
		/**
		* Verkauf › Bestellungen: every order, found by what the team knows about it — the number, a name,
		* an e-mail address, the car (docs/admin/rest-build-plan.md, step 2.1).
		*
		* Search, filters and sort live in the URL, so a view is a link and Back returns to it. The filters
		* are applied with a button, not on every change: a list that reloads under the keyboard is a list
		* nobody can use. Each row says in words how the order stands — paid or not, sent or not — and a
		* seeded order says it is Demodaten, so nobody ships wheels to a customer who does not exist.
		*
		* On a phone the list comes first; the filters, the sort and the export wait behind one "Filter"
		* button in a sheet, which says how many are on.
		*/
		const props = __props;
		const COLUMNS = [
			{
				id: "nummer",
				key: null,
				label: "Nummer"
			},
			{
				id: "datum",
				key: "datum",
				label: "Datum"
			},
			{
				id: "kunde",
				key: null,
				label: "Kundin oder Kunde"
			},
			{
				id: "fahrzeug",
				key: null,
				label: "Fahrzeug"
			},
			{
				id: "summe",
				key: "summe",
				label: "Summe",
				num: true
			},
			{
				id: "zahlung",
				key: "status",
				label: "Zahlung"
			},
			{
				id: "versand",
				key: null,
				label: "Versand"
			}
		];
		const page = usePage();
		const mine = (0, vue_exports.ref)([...props.columns.shown]);
		(0, vue_exports.watch)(() => props.columns.shown, (value) => mine.value = [...value]);
		const openView = (0, vue_exports.computed)(() => props.views.items.find((view) => view.id === props.views.active) ?? null);
		const draft = (0, vue_exports.ref)(null);
		const ownFor = (0, vue_exports.ref)(null);
		(0, vue_exports.watch)(() => `${props.views.active ?? ""}:${openView.value?.columns?.join() ?? ""}`, () => draft.value = null);
		const inForce = (0, vue_exports.computed)(() => {
			const view = openView.value;
			return view?.storesColumns && view.columns && ownFor.value !== view.id ? {
				keys: draft.value ?? view.columns,
				fromView: true
			} : {
				keys: mine.value,
				fromView: false
			};
		});
		const shown = (0, vue_exports.computed)({
			get: () => inForce.value.keys,
			set: (keys) => {
				if (inForce.value.fromView) draft.value = keys;
				else mine.value = keys;
			}
		});
		function ownColumns() {
			ownFor.value = props.views.active;
			draft.value = null;
		}
		const sortedColumn = (0, vue_exports.computed)(() => props.filters.sort === "datum" && props.filters.richtung === "ab" ? null : COLUMNS.find((column) => column.key === props.filters.sort)?.id ?? null);
		const visible = (0, vue_exports.computed)(() => sortedColumn.value && !shown.value.includes(sortedColumn.value) ? [...shown.value, sortedColumn.value] : shown.value);
		const columns = (0, vue_exports.computed)(() => COLUMNS.filter((column) => visible.value.includes(column.id)));
		const has = (id) => visible.value.includes(id);
		function refreshFromServer() {
			router.reload({ only: ["views", "columns"] });
		}
		(0, vue_exports.onMounted)(() => window.addEventListener("popstate", refreshFromServer));
		(0, vue_exports.onBeforeUnmount)(() => window.removeEventListener("popstate", refreshFromServer));
		const form = (0, vue_exports.ref)(formFromFilters(props.filters, berlinToday()));
		const search = (0, vue_exports.ref)(props.filters.q);
		const dateError = (0, vue_exports.ref)("");
		const busy = (0, vue_exports.ref)(false);
		/** The phone's filter sheet — only where the admin layout provides the sheet's shell. */
		const sheetAvailable = hasMobileShell();
		const sheetOpen = (0, vue_exports.ref)(false);
		const active = (0, vue_exports.computed)(() => activeCount(props.filters));
		const sort = (0, vue_exports.computed)(() => ({
			sort: props.filters.sort,
			richtung: props.filters.richtung
		}));
		(0, vue_exports.watch)(() => props.filters, (filters) => {
			form.value = formFromFilters(filters, berlinToday());
			search.value = filters.q;
			dateError.value = "";
		});
		const context = (0, vue_exports.computed)(() => {
			const n = props.pagination.total;
			const count = `${decimal(n, 0)} ${n === 1 ? "Bestellung" : "Bestellungen"}`;
			return props.filtered ? `${count} · gefiltert` : count;
		});
		/** The query's own keys (BestellungenFilterRequest): only their refusals belong above the list. */
		const FILTER_KEYS = [
			"q",
			"status",
			"zeitraum",
			"von",
			"bis",
			"zahlart",
			"versandart",
			"min",
			"max",
			"auflagen",
			"sort",
			"richtung",
			"seite",
			"ansicht"
		];
		/** A filter the server refused, in its own words — a view's name refused is the dialog's to say. */
		const refusals = (0, vue_exports.computed)(() => {
			const raw = page.props.errors;
			if (raw === null || typeof raw !== "object") return [];
			return Object.entries(raw).filter(([key]) => FILTER_KEYS.includes(key)).map(([, message]) => message).filter((m) => typeof m === "string" && m !== "");
		});
		/**
		* Filters applied, a column sorted: the open view stays open, now changed — so it can be saved over
		* or set back (ListViews). `keepView: false` leaves it: back to the whole list.
		*/
		function visit(query, keepView = true) {
			busy.value = true;
			if (keepView && props.views.active !== null) query = {
				...query,
				ansicht: String(props.views.active)
			};
			router.get(BASE, query, {
				preserveScroll: true,
				preserveState: true,
				onFinish: () => {
					busy.value = false;
				}
			});
		}
		function apply() {
			const result = queryFromForm(form.value, search.value, sort.value, berlinToday());
			if ("error" in result) {
				dateError.value = result.error;
				return;
			}
			dateError.value = "";
			sheetOpen.value = false;
			visit(result.query);
		}
		function reset() {
			search.value = "";
			form.value = {
				status: "",
				zeitraum: "",
				von: "",
				bis: "",
				zahlart: "",
				versandart: "",
				min: "",
				max: "",
				auflagen: false
			};
			dateError.value = "";
			sheetOpen.value = false;
			visit(sortQuery(sort.value), false);
		}
		/** A column heading re-sorts the list as it stands: the filters in force stay. */
		function sortBy(column) {
			const next = nextSort(sort.value, column);
			visit({
				...Object.fromEntries(Object.entries(props.query).filter(([key]) => key !== "sort" && key !== "richtung")),
				...sortQuery(next)
			});
		}
		function sortState(column) {
			if (column === null || props.filters.sort !== column) return;
			return props.filters.richtung === "auf" ? "ascending" : "descending";
		}
		/** The phone sheet's sort select: one value per field and direction. */
		const sortChoice = (0, vue_exports.computed)({
			get: () => `${props.filters.sort}:${props.filters.richtung}`,
			set: (value) => {
				const [column, direction] = value.split(":");
				const query = Object.fromEntries(Object.entries(props.query).filter(([key]) => key !== "sort" && key !== "richtung"));
				sheetOpen.value = false;
				visit({
					...query,
					...sortQuery({
						sort: column,
						richtung: direction
					})
				});
			}
		});
		function tagClass(state) {
			return state.tone === "plain" ? null : `adm-tag adm-tag--${state.tone}`;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Bestellungen",
				context: context.value
			}, _attrs), {
				primary: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<span class="ob-columns" data-v-3866cf42${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(ColumnChooser_default, {
							shown: shown.value,
							"onUpdate:shown": ($event) => shown.value = $event,
							list: "bestellungen",
							columns: props.columns.all,
							defaults: props.columns.defaults,
							sorted: sortedColumn.value,
							owner: inForce.value.fromView ? "view" : "person"
						}, null, _parent, _scopeId));
						_push(`</span>`);
						if (__props.exportUrls) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), { class: "btn btn--secondary ob-export" }, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) {
												_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
													name: "export",
													size: 20
												}, null, _parent, _scopeId));
												_push(` Exportieren `);
												_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
													name: "chevron-down",
													size: 16
												}, null, _parent, _scopeId));
											} else return [
												(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "export",
													size: 20
												}),
												(0, vue_exports.createTextVNode)(" Exportieren "),
												(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "chevron-down",
													size: 16
												})
											];
										}),
										_: 1
									}, _parent, _scopeId));
									_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuContent_default), {
												class: "adm-menu",
												align: "end",
												"side-offset": 8
											}, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) {
														_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
															default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																if (_push) _push(`<a class="adm-menu__item"${(0, server_renderer_exports.ssrRenderAttr)("href", __props.exportUrls.xlsx)} download data-v-3866cf42${_scopeId}>Als Excel-Datei (.xlsx)</a>`);
																else return [(0, vue_exports.createVNode)("a", {
																	class: "adm-menu__item",
																	href: __props.exportUrls.xlsx,
																	download: ""
																}, "Als Excel-Datei (.xlsx)", 8, ["href"])];
															}),
															_: 1
														}, _parent, _scopeId));
														_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
															default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																if (_push) _push(`<a class="adm-menu__item"${(0, server_renderer_exports.ssrRenderAttr)("href", __props.exportUrls.csv)} download data-v-3866cf42${_scopeId}>Als CSV-Datei</a>`);
																else return [(0, vue_exports.createVNode)("a", {
																	class: "adm-menu__item",
																	href: __props.exportUrls.csv,
																	download: ""
																}, "Als CSV-Datei", 8, ["href"])];
															}),
															_: 1
														}, _parent, _scopeId));
													} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
															class: "adm-menu__item",
															href: __props.exportUrls.xlsx,
															download: ""
														}, "Als Excel-Datei (.xlsx)", 8, ["href"])]),
														_: 1
													}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
															class: "adm-menu__item",
															href: __props.exportUrls.csv,
															download: ""
														}, "Als CSV-Datei", 8, ["href"])]),
														_: 1
													})];
												}),
												_: 1
											}, _parent, _scopeId));
											else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
												class: "adm-menu",
												align: "end",
												"side-offset": 8
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
														class: "adm-menu__item",
														href: __props.exportUrls.xlsx,
														download: ""
													}, "Als Excel-Datei (.xlsx)", 8, ["href"])]),
													_: 1
												}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
														class: "adm-menu__item",
														href: __props.exportUrls.csv,
														download: ""
													}, "Als CSV-Datei", 8, ["href"])]),
													_: 1
												})]),
												_: 1
											})];
										}),
										_: 1
									}, _parent, _scopeId));
								} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), { class: "btn btn--secondary ob-export" }, {
									default: (0, vue_exports.withCtx)(() => [
										(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "export",
											size: 20
										}),
										(0, vue_exports.createTextVNode)(" Exportieren "),
										(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "chevron-down",
											size: 16
										})
									]),
									_: 1
								}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
										class: "adm-menu",
										align: "end",
										"side-offset": 8
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
												class: "adm-menu__item",
												href: __props.exportUrls.xlsx,
												download: ""
											}, "Als Excel-Datei (.xlsx)", 8, ["href"])]),
											_: 1
										}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
												class: "adm-menu__item",
												href: __props.exportUrls.csv,
												download: ""
											}, "Als CSV-Datei", 8, ["href"])]),
											_: 1
										})]),
										_: 1
									})]),
									_: 1
								})];
							}),
							_: 1
						}, _parent, _scopeId));
						else _push(`<!---->`);
					} else return [(0, vue_exports.createVNode)("span", { class: "ob-columns" }, [(0, vue_exports.createVNode)(ColumnChooser_default, {
						shown: shown.value,
						"onUpdate:shown": ($event) => shown.value = $event,
						list: "bestellungen",
						columns: props.columns.all,
						defaults: props.columns.defaults,
						sorted: sortedColumn.value,
						owner: inForce.value.fromView ? "view" : "person"
					}, null, 8, [
						"shown",
						"onUpdate:shown",
						"columns",
						"defaults",
						"sorted",
						"owner"
					])]), __props.exportUrls ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuRoot_default), { key: 0 }, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), { class: "btn btn--secondary ob-export" }, {
							default: (0, vue_exports.withCtx)(() => [
								(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "export",
									size: 20
								}),
								(0, vue_exports.createTextVNode)(" Exportieren "),
								(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "chevron-down",
									size: 16
								})
							]),
							_: 1
						}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
								class: "adm-menu",
								align: "end",
								"side-offset": 8
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
										class: "adm-menu__item",
										href: __props.exportUrls.xlsx,
										download: ""
									}, "Als Excel-Datei (.xlsx)", 8, ["href"])]),
									_: 1
								}), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("a", {
										class: "adm-menu__item",
										href: __props.exportUrls.csv,
										download: ""
									}, "Als CSV-Datei", 8, ["href"])]),
									_: 1
								})]),
								_: 1
							})]),
							_: 1
						})]),
						_: 1
					})) : (0, vue_exports.createCommentVNode)("", true)];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)(ListViews_default, {
							list: "bestellungen",
							base: BASE,
							"all-label": "Alle Bestellungen",
							views: __props.views,
							query: __props.query,
							columns: inForce.value,
							onOwnColumns: ownColumns
						}, null, _parent, _scopeId));
						if (refusals.value.length) {
							_push(`<div class="adm-alert" role="alert" data-v-3866cf42${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(refusals.value, (message) => {
								_push(`<p class="ob-refusal" data-v-3866cf42${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(message)}</p>`);
							});
							_push(`<!--]--></div>`);
						} else _push(`<!---->`);
						_push(`<form class="ob-search" role="search"${(0, server_renderer_exports.ssrRenderAttr)("action", BASE)} method="get" data-v-3866cf42${_scopeId}><label class="visually-hidden" for="ob-q" data-v-3866cf42${_scopeId}>Bestellungen durchsuchen</label><input id="ob-q"${(0, server_renderer_exports.ssrRenderAttr)("value", search.value)} class="input" type="search" name="q" maxlength="120" placeholder="Nummer, Name, E-Mail oder Fahrzeug" autocomplete="off" data-v-3866cf42${_scopeId}><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-3866cf42${_scopeId}>Suchen</button></form><form class="ob-filters"${(0, server_renderer_exports.ssrRenderAttr)("action", BASE)} method="get" aria-label="Bestellungen filtern" data-v-3866cf42${_scopeId}><div class="ob-filters__fields" data-v-3866cf42${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(FilterFields_default, {
							form: form.value,
							"onUpdate:form": ($event) => form.value = $event,
							statuses: __props.options.statuses,
							payment: __props.options.payment,
							shipping: __props.options.shipping,
							"id-prefix": "ob",
							"date-error": dateError.value
						}, null, _parent, _scopeId));
						_push(`<div class="ob-filters__actions" data-v-3866cf42${_scopeId}><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-3866cf42${_scopeId}>Anwenden</button>`);
						if (__props.filtered) _push(`<button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-3866cf42${_scopeId}>Zurücksetzen</button>`);
						else _push(`<!---->`);
						_push(`</div></div></form>`);
						if ((0, vue_exports.unref)(sheetAvailable)) {
							_push(`<div class="ob-filterbar" data-v-3866cf42${_scopeId}><button class="btn btn--secondary" type="button" aria-haspopup="dialog" data-v-3866cf42${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "filter",
								size: 20
							}, null, _parent, _scopeId));
							_push(` ${(0, server_renderer_exports.ssrInterpolate)(active.value > 0 ? `Filter · ${active.value}` : "Filter und Sortierung")}</button>`);
							if (__props.filtered) _push(`<button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-3866cf42${_scopeId}>Zurücksetzen</button>`);
							else _push(`<!---->`);
							_push(`</div>`);
						} else _push(`<!---->`);
						if ((0, vue_exports.unref)(sheetAvailable)) _push((0, server_renderer_exports.ssrRenderComponent)(BottomSheet_default, {
							id: "bestellungen-filter",
							open: sheetOpen.value,
							"onUpdate:open": ($event) => sheetOpen.value = $event,
							title: "Bestellungen filtern"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<form class="ob-sheet" aria-label="Bestellungen filtern" data-v-3866cf42${_scopeId}><div class="form-field" data-v-3866cf42${_scopeId}><label class="form-field__label" for="ob-s-sort" data-v-3866cf42${_scopeId}>Sortierung</label><select id="ob-s-sort" class="input" data-v-3866cf42${_scopeId}><option value="datum:ab" data-v-3866cf42${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(sortChoice.value) ? (0, server_renderer_exports.ssrLooseContain)(sortChoice.value, "datum:ab") : (0, server_renderer_exports.ssrLooseEqual)(sortChoice.value, "datum:ab")) ? " selected" : ""}${_scopeId}>Neueste zuerst</option><option value="datum:auf" data-v-3866cf42${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(sortChoice.value) ? (0, server_renderer_exports.ssrLooseContain)(sortChoice.value, "datum:auf") : (0, server_renderer_exports.ssrLooseEqual)(sortChoice.value, "datum:auf")) ? " selected" : ""}${_scopeId}>Älteste zuerst</option><option value="summe:ab" data-v-3866cf42${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(sortChoice.value) ? (0, server_renderer_exports.ssrLooseContain)(sortChoice.value, "summe:ab") : (0, server_renderer_exports.ssrLooseEqual)(sortChoice.value, "summe:ab")) ? " selected" : ""}${_scopeId}>Höchste Summe zuerst</option><option value="summe:auf" data-v-3866cf42${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(sortChoice.value) ? (0, server_renderer_exports.ssrLooseContain)(sortChoice.value, "summe:auf") : (0, server_renderer_exports.ssrLooseEqual)(sortChoice.value, "summe:auf")) ? " selected" : ""}${_scopeId}>Niedrigste Summe zuerst</option><option value="status:auf" data-v-3866cf42${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(sortChoice.value) ? (0, server_renderer_exports.ssrLooseContain)(sortChoice.value, "status:auf") : (0, server_renderer_exports.ssrLooseEqual)(sortChoice.value, "status:auf")) ? " selected" : ""}${_scopeId}>Nach Status</option></select></div>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(FilterFields_default, {
										form: form.value,
										"onUpdate:form": ($event) => form.value = $event,
										statuses: __props.options.statuses,
										payment: __props.options.payment,
										shipping: __props.options.shipping,
										"id-prefix": "ob-s",
										"date-error": dateError.value
									}, null, _parent, _scopeId));
									_push(`<button class="btn btn--primary btn--block" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-3866cf42${_scopeId}>Anwenden</button>`);
									if (__props.filtered) _push(`<button class="btn btn--secondary btn--block" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-3866cf42${_scopeId}>Zurücksetzen</button>`);
									else _push(`<!---->`);
									if (__props.exportUrls) _push(`<!--[--><a class="btn btn--ghost btn--block"${(0, server_renderer_exports.ssrRenderAttr)("href", __props.exportUrls.xlsx)} download data-v-3866cf42${_scopeId}>Als Excel-Datei exportieren</a><a class="btn btn--ghost btn--block"${(0, server_renderer_exports.ssrRenderAttr)("href", __props.exportUrls.csv)} download data-v-3866cf42${_scopeId}>Als CSV-Datei exportieren</a><!--]-->`);
									else _push(`<!---->`);
									_push(`</form>`);
								} else return [(0, vue_exports.createVNode)("form", {
									class: "ob-sheet",
									"aria-label": "Bestellungen filtern",
									onSubmit: (0, vue_exports.withModifiers)(apply, ["prevent"])
								}, [
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "ob-s-sort"
									}, "Sortierung"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "ob-s-sort",
										"onUpdate:modelValue": ($event) => sortChoice.value = $event,
										class: "input"
									}, [
										(0, vue_exports.createVNode)("option", { value: "datum:ab" }, "Neueste zuerst"),
										(0, vue_exports.createVNode)("option", { value: "datum:auf" }, "Älteste zuerst"),
										(0, vue_exports.createVNode)("option", { value: "summe:ab" }, "Höchste Summe zuerst"),
										(0, vue_exports.createVNode)("option", { value: "summe:auf" }, "Niedrigste Summe zuerst"),
										(0, vue_exports.createVNode)("option", { value: "status:auf" }, "Nach Status")
									], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, sortChoice.value]])]),
									(0, vue_exports.createVNode)(FilterFields_default, {
										form: form.value,
										"onUpdate:form": ($event) => form.value = $event,
										statuses: __props.options.statuses,
										payment: __props.options.payment,
										shipping: __props.options.shipping,
										"id-prefix": "ob-s",
										"date-error": dateError.value
									}, null, 8, [
										"form",
										"onUpdate:form",
										"statuses",
										"payment",
										"shipping",
										"date-error"
									]),
									(0, vue_exports.createVNode)("button", {
										class: "btn btn--primary btn--block",
										type: "submit",
										disabled: busy.value
									}, "Anwenden", 8, ["disabled"]),
									__props.filtered ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
										key: 0,
										class: "btn btn--secondary btn--block",
										type: "button",
										disabled: busy.value,
										onClick: reset
									}, "Zurücksetzen", 8, ["disabled"])) : (0, vue_exports.createCommentVNode)("", true),
									__props.exportUrls ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createVNode)("a", {
										class: "btn btn--ghost btn--block",
										href: __props.exportUrls.xlsx,
										download: ""
									}, "Als Excel-Datei exportieren", 8, ["href"]), (0, vue_exports.createVNode)("a", {
										class: "btn btn--ghost btn--block",
										href: __props.exportUrls.csv,
										download: ""
									}, "Als CSV-Datei exportieren", 8, ["href"])], 64)) : (0, vue_exports.createCommentVNode)("", true)
								], 32)];
							}),
							_: 1
						}, _parent, _scopeId));
						else _push(`<!---->`);
						if (__props.orders.length === 0) {
							_push(`<!--[-->`);
							if (__props.filtered) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
								kind: "filtered",
								total: __props.totalAll,
								onReset: reset
							}, null, _parent, _scopeId));
							else _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
								kind: "empty",
								text: EMPTY_TEXT
							}, null, _parent, _scopeId));
							_push(`<!--]-->`);
						} else {
							_push(`<!--[--><div class="adm-panel"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-3866cf42${_scopeId}><table class="adm-table ob-table" data-v-3866cf42${_scopeId}><caption class="visually-hidden" data-v-3866cf42${_scopeId}>Bestellungen, ${(0, server_renderer_exports.ssrInterpolate)(context.value)}</caption><thead data-v-3866cf42${_scopeId}><tr data-v-3866cf42${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(columns.value, (column) => {
								_push(`<th scope="col" class="${(0, server_renderer_exports.ssrRenderClass)({ num: column.num })}"${(0, server_renderer_exports.ssrRenderAttr)("aria-sort", sortState(column.key))} data-v-3866cf42${_scopeId}>`);
								if (column.key) {
									_push(`<button class="ob-sort" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-3866cf42${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(column.label)} `);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										class: ["ob-sort__icon", { "ob-sort__icon--on": __props.filters.sort === column.key }],
										name: __props.filters.sort === column.key && __props.filters.richtung === "auf" ? "chevron-up" : "chevron-down",
										size: 16
									}, null, _parent, _scopeId));
									_push(`</button>`);
								} else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(column.label)}<!--]-->`);
								_push(`</th>`);
							});
							_push(`<!--]--></tr></thead><tbody data-v-3866cf42${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.orders, (order) => {
								_push(`<tr data-v-3866cf42${_scopeId}><td data-label="Nummer" data-v-3866cf42${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: order.href,
									class: "ob-number"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(order.number)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(order.number), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								if (order.demo) _push(`<span class="adm-tag adm-tag--neutral ob-demo" data-v-3866cf42${_scopeId}>Demodaten</span>`);
								else if (order.test) _push(`<span class="adm-tag adm-tag--neutral ob-demo" title="Testzahlung – es ist kein Geld geflossen" data-v-3866cf42${_scopeId}>Testbestellung</span>`);
								else _push(`<!---->`);
								if (order.conditions) _push(`<span class="ob-sub" data-v-3866cf42${_scopeId}>mit Auflagen</span>`);
								else _push(`<!---->`);
								_push(`</td>`);
								if (has("datum")) {
									_push(`<td data-label="Datum" class="ob-date" data-v-3866cf42${_scopeId}><time${(0, server_renderer_exports.ssrRenderAttr)("datetime", order.iso ?? void 0)}${(0, server_renderer_exports.ssrRenderAttr)("title", order.at ?? void 0)} data-v-3866cf42${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(order.date ?? "–")}</time>`);
									if (!order.placed) _push(`<span class="ob-sub" data-v-3866cf42${_scopeId}>begonnen, nicht abgeschickt</span>`);
									else _push(`<!---->`);
									_push(`</td>`);
								} else _push(`<!---->`);
								if (has("kunde")) {
									_push(`<td data-label="Kundin oder Kunde" data-v-3866cf42${_scopeId}><span class="ob-customer" data-v-3866cf42${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(order.customer ?? order.email ?? "–")}</span>`);
									if (order.customer && order.email) _push(`<span class="ob-sub" data-v-3866cf42${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(order.email)}</span>`);
									else _push(`<!---->`);
									_push(`</td>`);
								} else _push(`<!---->`);
								if (has("fahrzeug")) _push(`<td data-label="Fahrzeug" data-v-3866cf42${_scopeId}><span class="ob-vehicle" data-v-3866cf42${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(order.vehicle ?? "–")}</span></td>`);
								else _push(`<!---->`);
								if (has("summe")) _push(`<td data-label="Summe" class="num" data-v-3866cf42${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(order.total))}</td>`);
								else _push(`<!---->`);
								if (has("zahlung")) {
									_push(`<td data-label="Zahlung" data-v-3866cf42${_scopeId}>`);
									if (tagClass(order.payment)) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)(tagClass(order.payment))}" data-v-3866cf42${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(order.payment.label)}</span>`);
									else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(order.payment.label)}<!--]-->`);
									if (order.paymentMethod) _push(`<span class="ob-sub" data-v-3866cf42${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(order.paymentMethod)}</span>`);
									else _push(`<!---->`);
									_push(`</td>`);
								} else _push(`<!---->`);
								if (has("versand")) {
									_push(`<td data-label="Versand" data-v-3866cf42${_scopeId}>`);
									if (tagClass(order.fulfilment)) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)(tagClass(order.fulfilment))}" data-v-3866cf42${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(order.fulfilment.label)}</span>`);
									else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(order.fulfilment.label)}<!--]-->`);
									if (order.shippingMethod) _push(`<span class="ob-sub" data-v-3866cf42${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(order.shippingMethod)}</span>`);
									else _push(`<!---->`);
									_push(`</td>`);
								} else _push(`<!---->`);
								_push(`</tr>`);
							});
							_push(`<!--]--></tbody></table></div>`);
							if (__props.pagination.last > 1) {
								_push(`<nav class="ob-pages" aria-label="Seiten der Bestellungen" data-v-3866cf42${_scopeId}>`);
								if (__props.pagination.prev) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: __props.pagination.prev,
									class: "btn btn--secondary",
									"preserve-scroll": "",
									"preserve-state": ""
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
												name: "chevron-left",
												size: 16
											}, null, _parent, _scopeId));
											_push(` Vorherige `);
										} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "chevron-left",
											size: 16
										}), (0, vue_exports.createTextVNode)(" Vorherige ")];
									}),
									_: 1
								}, _parent, _scopeId));
								else _push(`<span class="ob-pages__spacer" aria-hidden="true" data-v-3866cf42${_scopeId}></span>`);
								_push(`<p class="ob-pages__where" data-v-3866cf42${_scopeId}>Seite ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.pagination.current, 0))} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.pagination.last, 0))}</p>`);
								if (__props.pagination.next) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: __props.pagination.next,
									class: "btn btn--secondary",
									"preserve-scroll": "",
									"preserve-state": ""
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push(` Nächste `);
											_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
												name: "chevron-right",
												size: 16
											}, null, _parent, _scopeId));
										} else return [(0, vue_exports.createTextVNode)(" Nächste "), (0, vue_exports.createVNode)(AdminIcon_default, {
											name: "chevron-right",
											size: 16
										})];
									}),
									_: 1
								}, _parent, _scopeId));
								else _push(`<span class="ob-pages__spacer" aria-hidden="true" data-v-3866cf42${_scopeId}></span>`);
								_push(`</nav>`);
							} else _push(`<!---->`);
							_push(`<!--]-->`);
						}
					} else return [
						(0, vue_exports.createVNode)(ListViews_default, {
							list: "bestellungen",
							base: BASE,
							"all-label": "Alle Bestellungen",
							views: __props.views,
							query: __props.query,
							columns: inForce.value,
							onOwnColumns: ownColumns
						}, null, 8, [
							"views",
							"query",
							"columns"
						]),
						refusals.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 0,
							class: "adm-alert",
							role: "alert"
						}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(refusals.value, (message) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: message,
								class: "ob-refusal"
							}, (0, vue_exports.toDisplayString)(message), 1);
						}), 128))])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("form", {
							class: "ob-search",
							role: "search",
							action: BASE,
							method: "get",
							onSubmit: (0, vue_exports.withModifiers)(apply, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("label", {
								class: "visually-hidden",
								for: "ob-q"
							}, "Bestellungen durchsuchen"),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "ob-q",
								"onUpdate:modelValue": ($event) => search.value = $event,
								class: "input",
								type: "search",
								name: "q",
								maxlength: "120",
								placeholder: "Nummer, Name, E-Mail oder Fahrzeug",
								autocomplete: "off"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, search.value]]),
							(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "submit",
								disabled: busy.value
							}, "Suchen", 8, ["disabled"])
						], 32),
						(0, vue_exports.createVNode)("form", {
							class: "ob-filters",
							action: BASE,
							method: "get",
							"aria-label": "Bestellungen filtern",
							onSubmit: (0, vue_exports.withModifiers)(apply, ["prevent"])
						}, [(0, vue_exports.createVNode)("div", { class: "ob-filters__fields" }, [(0, vue_exports.createVNode)(FilterFields_default, {
							form: form.value,
							"onUpdate:form": ($event) => form.value = $event,
							statuses: __props.options.statuses,
							payment: __props.options.payment,
							shipping: __props.options.shipping,
							"id-prefix": "ob",
							"date-error": dateError.value
						}, null, 8, [
							"form",
							"onUpdate:form",
							"statuses",
							"payment",
							"shipping",
							"date-error"
						]), (0, vue_exports.createVNode)("div", { class: "ob-filters__actions" }, [(0, vue_exports.createVNode)("button", {
							class: "btn btn--secondary",
							type: "submit",
							disabled: busy.value,
							"aria-busy": busy.value ? "true" : void 0
						}, "Anwenden", 8, ["disabled", "aria-busy"]), __props.filtered ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
							key: 0,
							class: "btn btn--ghost",
							type: "button",
							disabled: busy.value,
							onClick: reset
						}, "Zurücksetzen", 8, ["disabled"])) : (0, vue_exports.createCommentVNode)("", true)])])], 32),
						(0, vue_exports.unref)(sheetAvailable) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 1,
							class: "ob-filterbar"
						}, [(0, vue_exports.createVNode)("button", {
							class: "btn btn--secondary",
							type: "button",
							"aria-haspopup": "dialog",
							onClick: ($event) => sheetOpen.value = true
						}, [(0, vue_exports.createVNode)(AdminIcon_default, {
							name: "filter",
							size: 20
						}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(active.value > 0 ? `Filter · ${active.value}` : "Filter und Sortierung"), 1)], 8, ["onClick"]), __props.filtered ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
							key: 0,
							class: "btn btn--ghost",
							type: "button",
							disabled: busy.value,
							onClick: reset
						}, "Zurücksetzen", 8, ["disabled"])) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.unref)(sheetAvailable) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(BottomSheet_default, {
							key: 2,
							id: "bestellungen-filter",
							open: sheetOpen.value,
							"onUpdate:open": ($event) => sheetOpen.value = $event,
							title: "Bestellungen filtern"
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("form", {
								class: "ob-sheet",
								"aria-label": "Bestellungen filtern",
								onSubmit: (0, vue_exports.withModifiers)(apply, ["prevent"])
							}, [
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "ob-s-sort"
								}, "Sortierung"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "ob-s-sort",
									"onUpdate:modelValue": ($event) => sortChoice.value = $event,
									class: "input"
								}, [
									(0, vue_exports.createVNode)("option", { value: "datum:ab" }, "Neueste zuerst"),
									(0, vue_exports.createVNode)("option", { value: "datum:auf" }, "Älteste zuerst"),
									(0, vue_exports.createVNode)("option", { value: "summe:ab" }, "Höchste Summe zuerst"),
									(0, vue_exports.createVNode)("option", { value: "summe:auf" }, "Niedrigste Summe zuerst"),
									(0, vue_exports.createVNode)("option", { value: "status:auf" }, "Nach Status")
								], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, sortChoice.value]])]),
								(0, vue_exports.createVNode)(FilterFields_default, {
									form: form.value,
									"onUpdate:form": ($event) => form.value = $event,
									statuses: __props.options.statuses,
									payment: __props.options.payment,
									shipping: __props.options.shipping,
									"id-prefix": "ob-s",
									"date-error": dateError.value
								}, null, 8, [
									"form",
									"onUpdate:form",
									"statuses",
									"payment",
									"shipping",
									"date-error"
								]),
								(0, vue_exports.createVNode)("button", {
									class: "btn btn--primary btn--block",
									type: "submit",
									disabled: busy.value
								}, "Anwenden", 8, ["disabled"]),
								__props.filtered ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 0,
									class: "btn btn--secondary btn--block",
									type: "button",
									disabled: busy.value,
									onClick: reset
								}, "Zurücksetzen", 8, ["disabled"])) : (0, vue_exports.createCommentVNode)("", true),
								__props.exportUrls ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createVNode)("a", {
									class: "btn btn--ghost btn--block",
									href: __props.exportUrls.xlsx,
									download: ""
								}, "Als Excel-Datei exportieren", 8, ["href"]), (0, vue_exports.createVNode)("a", {
									class: "btn btn--ghost btn--block",
									href: __props.exportUrls.csv,
									download: ""
								}, "Als CSV-Datei exportieren", 8, ["href"])], 64)) : (0, vue_exports.createCommentVNode)("", true)
							], 32)]),
							_: 1
						}, 8, ["open", "onUpdate:open"])) : (0, vue_exports.createCommentVNode)("", true),
						__props.orders.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [__props.filtered ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 0,
							kind: "filtered",
							total: __props.totalAll,
							onReset: reset
						}, null, 8, ["total"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 1,
							kind: "empty",
							text: EMPTY_TEXT
						}))], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 4 }, [(0, vue_exports.createVNode)("div", {
							class: "adm-panel",
							"aria-busy": busy.value ? "true" : void 0
						}, [(0, vue_exports.createVNode)("table", { class: "adm-table ob-table" }, [
							(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Bestellungen, " + (0, vue_exports.toDisplayString)(context.value), 1),
							(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(columns.value, (column) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("th", {
									key: column.id,
									scope: "col",
									class: { num: column.num },
									"aria-sort": sortState(column.key)
								}, [column.key ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 0,
									class: "ob-sort",
									type: "button",
									disabled: busy.value,
									onClick: ($event) => sortBy(column.key)
								}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(column.label) + " ", 1), (0, vue_exports.createVNode)(AdminIcon_default, {
									class: ["ob-sort__icon", { "ob-sort__icon--on": __props.filters.sort === column.key }],
									name: __props.filters.sort === column.key && __props.filters.richtung === "auf" ? "chevron-up" : "chevron-down",
									size: 16
								}, null, 8, ["class", "name"])], 8, ["disabled", "onClick"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(column.label), 1)], 64))], 10, ["aria-sort"]);
							}), 128))])]),
							(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.orders, (order) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: order.id }, [
									(0, vue_exports.createVNode)("td", { "data-label": "Nummer" }, [
										(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
											href: order.href,
											class: "ob-number"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(order.number), 1)]),
											_: 2
										}, 1032, ["href"]),
										order.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: "adm-tag adm-tag--neutral ob-demo"
										}, "Demodaten")) : order.test ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 1,
											class: "adm-tag adm-tag--neutral ob-demo",
											title: "Testzahlung – es ist kein Geld geflossen"
										}, "Testbestellung")) : (0, vue_exports.createCommentVNode)("", true),
										order.conditions ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 2,
											class: "ob-sub"
										}, "mit Auflagen")) : (0, vue_exports.createCommentVNode)("", true)
									]),
									has("datum") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
										key: 0,
										"data-label": "Datum",
										class: "ob-date"
									}, [(0, vue_exports.createVNode)("time", {
										datetime: order.iso ?? void 0,
										title: order.at ?? void 0
									}, (0, vue_exports.toDisplayString)(order.date ?? "–"), 9, ["datetime", "title"]), !order.placed ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "ob-sub"
									}, "begonnen, nicht abgeschickt")) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true),
									has("kunde") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
										key: 1,
										"data-label": "Kundin oder Kunde"
									}, [(0, vue_exports.createVNode)("span", { class: "ob-customer" }, (0, vue_exports.toDisplayString)(order.customer ?? order.email ?? "–"), 1), order.customer && order.email ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "ob-sub"
									}, (0, vue_exports.toDisplayString)(order.email), 1)) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true),
									has("fahrzeug") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
										key: 2,
										"data-label": "Fahrzeug"
									}, [(0, vue_exports.createVNode)("span", { class: "ob-vehicle" }, (0, vue_exports.toDisplayString)(order.vehicle ?? "–"), 1)])) : (0, vue_exports.createCommentVNode)("", true),
									has("summe") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
										key: 3,
										"data-label": "Summe",
										class: "num"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(order.total)), 1)) : (0, vue_exports.createCommentVNode)("", true),
									has("zahlung") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
										key: 4,
										"data-label": "Zahlung"
									}, [tagClass(order.payment) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: tagClass(order.payment)
									}, (0, vue_exports.toDisplayString)(order.payment.label), 3)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(order.payment.label), 1)], 64)), order.paymentMethod ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 2,
										class: "ob-sub"
									}, (0, vue_exports.toDisplayString)(order.paymentMethod), 1)) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true),
									has("versand") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
										key: 5,
										"data-label": "Versand"
									}, [tagClass(order.fulfilment) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: tagClass(order.fulfilment)
									}, (0, vue_exports.toDisplayString)(order.fulfilment.label), 3)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(order.fulfilment.label), 1)], 64)), order.shippingMethod ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 2,
										class: "ob-sub"
									}, (0, vue_exports.toDisplayString)(order.shippingMethod), 1)) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true)
								]);
							}), 128))])
						])], 8, ["aria-busy"]), __props.pagination.last > 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("nav", {
							key: 0,
							class: "ob-pages",
							"aria-label": "Seiten der Bestellungen"
						}, [
							__props.pagination.prev ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
								key: 0,
								href: __props.pagination.prev,
								class: "btn btn--secondary",
								"preserve-scroll": "",
								"preserve-state": ""
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "chevron-left",
									size: 16
								}), (0, vue_exports.createTextVNode)(" Vorherige ")]),
								_: 1
							}, 8, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 1,
								class: "ob-pages__spacer",
								"aria-hidden": "true"
							})),
							(0, vue_exports.createVNode)("p", { class: "ob-pages__where" }, "Seite " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.pagination.current, 0)) + " von " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.pagination.last, 0)), 1),
							__props.pagination.next ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
								key: 2,
								href: __props.pagination.next,
								class: "btn btn--secondary",
								"preserve-scroll": "",
								"preserve-state": ""
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)(" Nächste "), (0, vue_exports.createVNode)(AdminIcon_default, {
									name: "chevron-right",
									size: 16
								})]),
								_: 1
							}, 8, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 3,
								class: "ob-pages__spacer",
								"aria-hidden": "true"
							}))
						])) : (0, vue_exports.createCommentVNode)("", true)], 64))
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Bestellungen/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Bestellungen/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-3866cf42"]]);
//#endregion
export { Index_default as default };
