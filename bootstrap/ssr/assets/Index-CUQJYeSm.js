import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-Bh3el5Y6.js";
import { n as ColumnChooser_default, t as ListViews_default } from "./ListViews-DMW2_28T.js";
import { a as link_default, c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { t as AdminConfirm_default } from "./AdminConfirm-CJZtnwyX.js";
import { o as BottomSheet_default, u as hasMobileShell } from "./Toast-BAo4c4LN.js";
import { t as formatMoney } from "./num-Br8qlecZ.js";
import { n as decimal } from "./format-DGFu8Y3r.js";
import { t as AdminState_default } from "./AdminState-CulrVZYL.js";
import { t as Picture_default } from "./Picture-UPZyuHVR.js";
//#region resources/js/Pages/Admin/Felgen/list.ts
/**
* The Felgen list's filter form and sort, kept apart from the page so their rules are tested. Defaults
* are left out of every query, so the plain list is the bare URL.
*/
function formFromFilters(filters) {
	return {
		status: filters.status,
		marke: filters.marke,
		freigaben: filters.freigaben,
		demo: filters.demo
	};
}
function queryFromForm(form, search, sort) {
	const query = {};
	const q = search.trim();
	if (q) query.q = q;
	for (const key of [
		"status",
		"marke",
		"freigaben",
		"demo"
	]) if (form[key]) query[key] = form[key];
	return {
		...query,
		...sortQuery(sort)
	};
}
/** The sort as query parameters; the default — by brand and name, A to Z — is the bare URL. */
function sortQuery(sort) {
	return sort.sort === "name" && sort.richtung === "auf" ? {} : {
		sort: sort.sort,
		richtung: sort.richtung
	};
}
/**
* A column heading: the same column turns around; another starts with what a person looks for first —
* names A to Z, the newest change, the lowest price, the most sizes.
*/
function nextSort(current, column) {
	if (current.sort === column) return {
		sort: column,
		richtung: current.richtung === "ab" ? "auf" : "ab"
	};
	return {
		sort: column,
		richtung: column === "name" || column === "preis" ? "auf" : "ab"
	};
}
/** How many filters are on — for the phone's „Filter · 2“. The search is its own field. */
function activeCount(filters) {
	return [
		filters.status,
		filters.marke,
		filters.freigaben,
		filters.demo
	].filter(Boolean).length;
}
/** `3 Felgen`, `1 Felge` — German grouping through the one formatter (R-10). */
function felgen(n) {
	return `${decimal(n, 0)} ${n === 1 ? "Felge" : "Felgen"}`;
}
//#endregion
//#region resources/js/Pages/Admin/Felgen/Index.vue?vue&type=script&setup=true&lang.ts
var BASE = "/admin/felgen";
var EMPTY_TEXT = "Hier erscheint jede Felge, sobald du eine anlegst oder eine Lieferantendatei importierst.";
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		wheels: {},
		filters: {},
		options: {},
		filtered: { type: Boolean },
		totalAll: {},
		pagination: {},
		query: {},
		views: {},
		columns: {},
		can: {}
	},
	setup(__props) {
		/**
		* Katalog › Felgen: every wheel model, found by brand, name, SKU or EAN (the review release §4.2).
		*
		* A row is a model with what its sizes add up to — how many, from which price, how much stock, and
		* how many of them an approval document already covers. „Freigaben noch nicht hinterlegt“ is counted
		* from published fitment rows, never a flag. Filters and sort live in the URL, so a view is a link.
		*
		* Several models can be published, taken out or archived at once. The server asks for each one: a
		* demo model, or one the Freigabe-Check stops, stays as it was and is named in the answer.
		*/
		const props = __props;
		const COLUMNS = [
			{
				id: "felge",
				key: "name",
				label: "Felge"
			},
			{
				id: "status",
				key: null,
				label: "Status"
			},
			{
				id: "groessen",
				key: "groessen",
				label: "Größen"
			},
			{
				id: "preis",
				key: "preis",
				label: "Preis ab",
				num: true
			},
			{
				id: "bestand",
				key: null,
				label: "Bestand",
				num: true
			},
			{
				id: "freigaben",
				key: null,
				label: "Freigaben"
			},
			{
				id: "aktualisiert",
				key: "aktualisiert",
				label: "Geändert"
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
		const sortedColumn = (0, vue_exports.computed)(() => props.filters.sort === "name" && props.filters.richtung === "auf" ? null : COLUMNS.find((column) => column.key === props.filters.sort)?.id ?? null);
		const visible = (0, vue_exports.computed)(() => sortedColumn.value && !shown.value.includes(sortedColumn.value) ? [...shown.value, sortedColumn.value] : shown.value);
		const columns = (0, vue_exports.computed)(() => COLUMNS.filter((column) => visible.value.includes(column.id)));
		const has = (id) => visible.value.includes(id);
		function refreshFromServer() {
			router.reload({ only: ["views", "columns"] });
		}
		(0, vue_exports.onMounted)(() => window.addEventListener("popstate", refreshFromServer));
		(0, vue_exports.onBeforeUnmount)(() => window.removeEventListener("popstate", refreshFromServer));
		const form = (0, vue_exports.ref)(formFromFilters(props.filters));
		const search = (0, vue_exports.ref)(props.filters.q);
		const busy = (0, vue_exports.ref)(false);
		const sheetAvailable = hasMobileShell();
		const sheetOpen = (0, vue_exports.ref)(false);
		const active = (0, vue_exports.computed)(() => activeCount(props.filters));
		const sort = (0, vue_exports.computed)(() => ({
			sort: props.filters.sort,
			richtung: props.filters.richtung
		}));
		(0, vue_exports.watch)(() => props.filters, (filters) => {
			form.value = formFromFilters(filters);
			search.value = filters.q;
		});
		const context = (0, vue_exports.computed)(() => props.filtered ? `${felgen(props.pagination.total)} · gefiltert` : felgen(props.pagination.total));
		const FILTER_KEYS = [
			"q",
			"status",
			"marke",
			"freigaben",
			"demo",
			"sort",
			"richtung",
			"seite",
			"ansicht"
		];
		const refusals = (0, vue_exports.computed)(() => {
			const raw = page.props.errors;
			if (raw === null || typeof raw !== "object") return [];
			return Object.entries(raw).filter(([key]) => FILTER_KEYS.includes(key) || key === "action" || key.startsWith("ids")).map(([, message]) => message).filter((m) => typeof m === "string" && m !== "");
		});
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
		const sheetSort = (0, vue_exports.ref)(`${props.filters.sort}:${props.filters.richtung}`);
		(0, vue_exports.watch)(() => `${props.filters.sort}:${props.filters.richtung}`, (value) => sheetSort.value = value);
		function apply() {
			const [column, direction] = sheetSort.value.split(":");
			const chosen = sheetOpen.value ? {
				sort: column,
				richtung: direction
			} : sort.value;
			sheetOpen.value = false;
			visit(queryFromForm(form.value, search.value, chosen));
		}
		function reset() {
			search.value = "";
			form.value = {
				status: "",
				marke: "",
				freigaben: "",
				demo: ""
			};
			sheetOpen.value = false;
			visit(sortQuery(sort.value), false);
		}
		function sortBy(column) {
			visit({
				...Object.fromEntries(Object.entries(props.query).filter(([key]) => key !== "sort" && key !== "richtung")),
				...sortQuery(nextSort(sort.value, column))
			});
		}
		function sortState(column) {
			if (column === null || props.filters.sort !== column) return;
			return props.filters.richtung === "auf" ? "ascending" : "descending";
		}
		function tagClass(state) {
			return state.tone === "plain" ? null : `adm-tag adm-tag--${state.tone}`;
		}
		function statusTag(status) {
			return status === "archived" ? "adm-tag adm-tag--neutral" : null;
		}
		const canBulk = (0, vue_exports.computed)(() => props.can.publish || props.can.archive);
		const selected = (0, vue_exports.ref)([]);
		(0, vue_exports.watch)(() => props.wheels.map((wheel) => wheel.id).join(), () => selected.value = selected.value.filter((id) => props.wheels.some((wheel) => wheel.id === id)));
		const allOnPage = (0, vue_exports.computed)({
			get: () => props.wheels.length > 0 && props.wheels.every((wheel) => selected.value.includes(wheel.id)),
			set: (on) => selected.value = on ? props.wheels.map((wheel) => wheel.id) : []
		});
		const pending = (0, vue_exports.ref)(null);
		const confirmOpen = (0, vue_exports.computed)({
			get: () => pending.value !== null,
			set: (open) => {
				if (!open) pending.value = null;
			}
		});
		const BULK = {
			publish: {
				label: "Veröffentlichen",
				title: (n) => `${n} veröffentlichen?`,
				body: "Die Felgen sind danach im Shop. Demodaten und Felgen, die die Prüfung vor dem Veröffentlichen stoppt, bleiben, wie sie sind."
			},
			unpublish: {
				label: "Zurückziehen",
				title: (n) => `${n} zurückziehen?`,
				body: "Sie sind danach nicht mehr im Shop. Offene Warenkörbe mit diesen Felgen können nicht mehr bestellt werden."
			},
			archive: {
				label: "Archivieren",
				title: (n) => `${n} archivieren?`,
				body: "Sie verschwinden aus dem Shop und aus dieser Liste. Unter „Status: Archiviert“ findest du sie wieder."
			}
		};
		function runBulk() {
			if (pending.value === null) return;
			busy.value = true;
			router.post(`${BASE}/sammelaktion`, {
				action: pending.value,
				ids: selected.value
			}, {
				preserveScroll: true,
				onSuccess: () => {
					selected.value = [];
				},
				onFinish: () => {
					busy.value = false;
					pending.value = null;
					(0, vue_exports.nextTick)(() => document.querySelector(".fg-table tbody .fg-check, .fg-table tbody .fg-name")?.focus());
				}
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Felgen",
				context: context.value
			}, _attrs), {
				primary: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<span class="fg-columns" data-v-4deb0468${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(ColumnChooser_default, {
							shown: shown.value,
							"onUpdate:shown": ($event) => shown.value = $event,
							list: "felgen",
							columns: props.columns.all,
							defaults: props.columns.defaults,
							sorted: sortedColumn.value,
							owner: inForce.value.fromView ? "view" : "person"
						}, null, _parent, _scopeId));
						_push(`</span>`);
						if (__props.can.import) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: "/admin/katalog/import",
							class: "btn btn--secondary fg-import"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "imports",
										size: 20
									}, null, _parent, _scopeId));
									_push(` Importieren `);
								} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "imports",
									size: 20
								}), (0, vue_exports.createTextVNode)(" Importieren ")];
							}),
							_: 1
						}, _parent, _scopeId));
						else _push(`<!---->`);
						if (__props.can.create) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: "/admin/felgen/neu",
							class: "btn btn--primary"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "plus",
										size: 20
									}, null, _parent, _scopeId));
									_push(` Neue Felge `);
								} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "plus",
									size: 20
								}), (0, vue_exports.createTextVNode)(" Neue Felge ")];
							}),
							_: 1
						}, _parent, _scopeId));
						else _push(`<!---->`);
					} else return [
						(0, vue_exports.createVNode)("span", { class: "fg-columns" }, [(0, vue_exports.createVNode)(ColumnChooser_default, {
							shown: shown.value,
							"onUpdate:shown": ($event) => shown.value = $event,
							list: "felgen",
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
						])]),
						__props.can.import ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
							key: 0,
							href: "/admin/katalog/import",
							class: "btn btn--secondary fg-import"
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "imports",
								size: 20
							}), (0, vue_exports.createTextVNode)(" Importieren ")]),
							_: 1
						})) : (0, vue_exports.createCommentVNode)("", true),
						__props.can.create ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
							key: 1,
							href: "/admin/felgen/neu",
							class: "btn btn--primary"
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "plus",
								size: 20
							}), (0, vue_exports.createTextVNode)(" Neue Felge ")]),
							_: 1
						})) : (0, vue_exports.createCommentVNode)("", true)
					];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)(ListViews_default, {
							list: "felgen",
							base: BASE,
							"all-label": "Alle Felgen",
							views: __props.views,
							query: __props.query,
							columns: inForce.value,
							onOwnColumns: ownColumns
						}, null, _parent, _scopeId));
						if (refusals.value.length) {
							_push(`<div class="adm-alert" role="alert" data-v-4deb0468${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(refusals.value, (message) => {
								_push(`<p class="fg-refusal" data-v-4deb0468${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(message)}</p>`);
							});
							_push(`<!--]--></div>`);
						} else _push(`<!---->`);
						_push(`<form class="fg-search" role="search"${(0, server_renderer_exports.ssrRenderAttr)("action", BASE)} method="get" data-v-4deb0468${_scopeId}><label class="visually-hidden" for="fg-q" data-v-4deb0468${_scopeId}>Felgen durchsuchen</label><input id="fg-q"${(0, server_renderer_exports.ssrRenderAttr)("value", search.value)} class="input" type="search" name="q" maxlength="120" placeholder="Marke, Modell, SKU oder EAN" autocomplete="off" data-v-4deb0468${_scopeId}><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-4deb0468${_scopeId}>Suchen</button></form><form class="fg-filters"${(0, server_renderer_exports.ssrRenderAttr)("action", BASE)} method="get" aria-label="Felgen filtern" data-v-4deb0468${_scopeId}><div class="fg-filters__fields" data-v-4deb0468${_scopeId}><div class="form-field" data-v-4deb0468${_scopeId}><label class="form-field__label" for="fg-status" data-v-4deb0468${_scopeId}>Status</label><select id="fg-status" class="input" data-v-4deb0468${_scopeId}><option value="" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.status) ? (0, server_renderer_exports.ssrLooseContain)(form.value.status, "") : (0, server_renderer_exports.ssrLooseEqual)(form.value.status, "")) ? " selected" : ""}${_scopeId}>Entwurf und im Shop</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.options.statuses, (status) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", status.value)} data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.status) ? (0, server_renderer_exports.ssrLooseContain)(form.value.status, status.value) : (0, server_renderer_exports.ssrLooseEqual)(form.value.status, status.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(status.label)} (${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(status.count, 0))})</option>`);
						});
						_push(`<!--]--></select></div><div class="form-field" data-v-4deb0468${_scopeId}><label class="form-field__label" for="fg-marke" data-v-4deb0468${_scopeId}>Marke</label><select id="fg-marke" class="input" data-v-4deb0468${_scopeId}><option value="" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.marke) ? (0, server_renderer_exports.ssrLooseContain)(form.value.marke, "") : (0, server_renderer_exports.ssrLooseEqual)(form.value.marke, "")) ? " selected" : ""}${_scopeId}>Alle</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.options.brands, (brand) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", brand.value)} data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.marke) ? (0, server_renderer_exports.ssrLooseContain)(form.value.marke, brand.value) : (0, server_renderer_exports.ssrLooseEqual)(form.value.marke, brand.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(brand.label)}</option>`);
						});
						_push(`<!--]--></select></div><div class="form-field" data-v-4deb0468${_scopeId}><label class="form-field__label" for="fg-freigaben" data-v-4deb0468${_scopeId}>Freigaben</label><select id="fg-freigaben" class="input" data-v-4deb0468${_scopeId}><option value="" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.freigaben) ? (0, server_renderer_exports.ssrLooseContain)(form.value.freigaben, "") : (0, server_renderer_exports.ssrLooseEqual)(form.value.freigaben, "")) ? " selected" : ""}${_scopeId}>Alle</option><option value="keine" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.freigaben) ? (0, server_renderer_exports.ssrLooseContain)(form.value.freigaben, "keine") : (0, server_renderer_exports.ssrLooseEqual)(form.value.freigaben, "keine")) ? " selected" : ""}${_scopeId}>Noch nicht hinterlegt</option><option value="teilweise" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.freigaben) ? (0, server_renderer_exports.ssrLooseContain)(form.value.freigaben, "teilweise") : (0, server_renderer_exports.ssrLooseEqual)(form.value.freigaben, "teilweise")) ? " selected" : ""}${_scopeId}>Für einen Teil der Größen</option><option value="alle" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.freigaben) ? (0, server_renderer_exports.ssrLooseContain)(form.value.freigaben, "alle") : (0, server_renderer_exports.ssrLooseEqual)(form.value.freigaben, "alle")) ? " selected" : ""}${_scopeId}>Für alle Größen</option></select></div><div class="form-field" data-v-4deb0468${_scopeId}><label class="form-field__label" for="fg-demo" data-v-4deb0468${_scopeId}>Herkunft</label><select id="fg-demo" class="input" data-v-4deb0468${_scopeId}><option value="" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.demo) ? (0, server_renderer_exports.ssrLooseContain)(form.value.demo, "") : (0, server_renderer_exports.ssrLooseEqual)(form.value.demo, "")) ? " selected" : ""}${_scopeId}>Alle</option><option value="nein" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.demo) ? (0, server_renderer_exports.ssrLooseContain)(form.value.demo, "nein") : (0, server_renderer_exports.ssrLooseEqual)(form.value.demo, "nein")) ? " selected" : ""}${_scopeId}>Echte Felgen</option><option value="ja" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.demo) ? (0, server_renderer_exports.ssrLooseContain)(form.value.demo, "ja") : (0, server_renderer_exports.ssrLooseEqual)(form.value.demo, "ja")) ? " selected" : ""}${_scopeId}>Demodaten</option></select></div><div class="fg-filters__actions" data-v-4deb0468${_scopeId}><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-4deb0468${_scopeId}>Anwenden</button>`);
						if (__props.filtered) _push(`<button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-4deb0468${_scopeId}>Zurücksetzen</button>`);
						else _push(`<!---->`);
						_push(`</div></div></form>`);
						if ((0, vue_exports.unref)(sheetAvailable)) {
							_push(`<div class="fg-filterbar" data-v-4deb0468${_scopeId}><button class="btn btn--secondary" type="button" aria-haspopup="dialog" data-v-4deb0468${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "filter",
								size: 20
							}, null, _parent, _scopeId));
							_push(` ${(0, server_renderer_exports.ssrInterpolate)(active.value > 0 ? `Filter · ${active.value}` : "Filter und Sortierung")}</button>`);
							if (__props.filtered) _push(`<button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-4deb0468${_scopeId}>Zurücksetzen</button>`);
							else _push(`<!---->`);
							_push(`</div>`);
						} else _push(`<!---->`);
						if ((0, vue_exports.unref)(sheetAvailable)) _push((0, server_renderer_exports.ssrRenderComponent)(BottomSheet_default, {
							id: "felgen-filter",
							open: sheetOpen.value,
							"onUpdate:open": ($event) => sheetOpen.value = $event,
							title: "Felgen filtern"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<form class="fg-sheet" aria-label="Felgen filtern" data-v-4deb0468${_scopeId}><div class="form-field" data-v-4deb0468${_scopeId}><label class="form-field__label" for="fg-s-sort" data-v-4deb0468${_scopeId}>Sortierung</label><select id="fg-s-sort" class="input" data-v-4deb0468${_scopeId}><option value="name:auf" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(sheetSort.value) ? (0, server_renderer_exports.ssrLooseContain)(sheetSort.value, "name:auf") : (0, server_renderer_exports.ssrLooseEqual)(sheetSort.value, "name:auf")) ? " selected" : ""}${_scopeId}>Name, A bis Z</option><option value="name:ab" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(sheetSort.value) ? (0, server_renderer_exports.ssrLooseContain)(sheetSort.value, "name:ab") : (0, server_renderer_exports.ssrLooseEqual)(sheetSort.value, "name:ab")) ? " selected" : ""}${_scopeId}>Name, Z bis A</option><option value="aktualisiert:ab" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(sheetSort.value) ? (0, server_renderer_exports.ssrLooseContain)(sheetSort.value, "aktualisiert:ab") : (0, server_renderer_exports.ssrLooseEqual)(sheetSort.value, "aktualisiert:ab")) ? " selected" : ""}${_scopeId}>Zuletzt geändert zuerst</option><option value="preis:auf" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(sheetSort.value) ? (0, server_renderer_exports.ssrLooseContain)(sheetSort.value, "preis:auf") : (0, server_renderer_exports.ssrLooseEqual)(sheetSort.value, "preis:auf")) ? " selected" : ""}${_scopeId}>Niedrigster Preis zuerst</option><option value="preis:ab" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(sheetSort.value) ? (0, server_renderer_exports.ssrLooseContain)(sheetSort.value, "preis:ab") : (0, server_renderer_exports.ssrLooseEqual)(sheetSort.value, "preis:ab")) ? " selected" : ""}${_scopeId}>Höchster Preis zuerst</option><option value="groessen:ab" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(sheetSort.value) ? (0, server_renderer_exports.ssrLooseContain)(sheetSort.value, "groessen:ab") : (0, server_renderer_exports.ssrLooseEqual)(sheetSort.value, "groessen:ab")) ? " selected" : ""}${_scopeId}>Meiste Größen zuerst</option></select></div><div class="form-field" data-v-4deb0468${_scopeId}><label class="form-field__label" for="fg-s-status" data-v-4deb0468${_scopeId}>Status</label><select id="fg-s-status" class="input" data-v-4deb0468${_scopeId}><option value="" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.status) ? (0, server_renderer_exports.ssrLooseContain)(form.value.status, "") : (0, server_renderer_exports.ssrLooseEqual)(form.value.status, "")) ? " selected" : ""}${_scopeId}>Entwurf und im Shop</option><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(__props.options.statuses, (status) => {
										_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", status.value)} data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.status) ? (0, server_renderer_exports.ssrLooseContain)(form.value.status, status.value) : (0, server_renderer_exports.ssrLooseEqual)(form.value.status, status.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(status.label)} (${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(status.count, 0))})</option>`);
									});
									_push(`<!--]--></select></div><div class="form-field" data-v-4deb0468${_scopeId}><label class="form-field__label" for="fg-s-marke" data-v-4deb0468${_scopeId}>Marke</label><select id="fg-s-marke" class="input" data-v-4deb0468${_scopeId}><option value="" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.marke) ? (0, server_renderer_exports.ssrLooseContain)(form.value.marke, "") : (0, server_renderer_exports.ssrLooseEqual)(form.value.marke, "")) ? " selected" : ""}${_scopeId}>Alle</option><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(__props.options.brands, (brand) => {
										_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", brand.value)} data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.marke) ? (0, server_renderer_exports.ssrLooseContain)(form.value.marke, brand.value) : (0, server_renderer_exports.ssrLooseEqual)(form.value.marke, brand.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(brand.label)}</option>`);
									});
									_push(`<!--]--></select></div><div class="form-field" data-v-4deb0468${_scopeId}><label class="form-field__label" for="fg-s-freigaben" data-v-4deb0468${_scopeId}>Freigaben</label><select id="fg-s-freigaben" class="input" data-v-4deb0468${_scopeId}><option value="" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.freigaben) ? (0, server_renderer_exports.ssrLooseContain)(form.value.freigaben, "") : (0, server_renderer_exports.ssrLooseEqual)(form.value.freigaben, "")) ? " selected" : ""}${_scopeId}>Alle</option><option value="keine" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.freigaben) ? (0, server_renderer_exports.ssrLooseContain)(form.value.freigaben, "keine") : (0, server_renderer_exports.ssrLooseEqual)(form.value.freigaben, "keine")) ? " selected" : ""}${_scopeId}>Noch nicht hinterlegt</option><option value="teilweise" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.freigaben) ? (0, server_renderer_exports.ssrLooseContain)(form.value.freigaben, "teilweise") : (0, server_renderer_exports.ssrLooseEqual)(form.value.freigaben, "teilweise")) ? " selected" : ""}${_scopeId}>Für einen Teil der Größen</option><option value="alle" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.freigaben) ? (0, server_renderer_exports.ssrLooseContain)(form.value.freigaben, "alle") : (0, server_renderer_exports.ssrLooseEqual)(form.value.freigaben, "alle")) ? " selected" : ""}${_scopeId}>Für alle Größen</option></select></div><div class="form-field" data-v-4deb0468${_scopeId}><label class="form-field__label" for="fg-s-demo" data-v-4deb0468${_scopeId}>Herkunft</label><select id="fg-s-demo" class="input" data-v-4deb0468${_scopeId}><option value="" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.demo) ? (0, server_renderer_exports.ssrLooseContain)(form.value.demo, "") : (0, server_renderer_exports.ssrLooseEqual)(form.value.demo, "")) ? " selected" : ""}${_scopeId}>Alle</option><option value="nein" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.demo) ? (0, server_renderer_exports.ssrLooseContain)(form.value.demo, "nein") : (0, server_renderer_exports.ssrLooseEqual)(form.value.demo, "nein")) ? " selected" : ""}${_scopeId}>Echte Felgen</option><option value="ja" data-v-4deb0468${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.demo) ? (0, server_renderer_exports.ssrLooseContain)(form.value.demo, "ja") : (0, server_renderer_exports.ssrLooseEqual)(form.value.demo, "ja")) ? " selected" : ""}${_scopeId}>Demodaten</option></select></div><button class="btn btn--primary btn--block" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-4deb0468${_scopeId}>Anwenden</button>`);
									if (__props.filtered) _push(`<button class="btn btn--secondary btn--block" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-4deb0468${_scopeId}>Zurücksetzen</button>`);
									else _push(`<!---->`);
									_push(`</form>`);
								} else return [(0, vue_exports.createVNode)("form", {
									class: "fg-sheet",
									"aria-label": "Felgen filtern",
									onSubmit: (0, vue_exports.withModifiers)(apply, ["prevent"])
								}, [
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "fg-s-sort"
									}, "Sortierung"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "fg-s-sort",
										"onUpdate:modelValue": ($event) => sheetSort.value = $event,
										class: "input"
									}, [
										(0, vue_exports.createVNode)("option", { value: "name:auf" }, "Name, A bis Z"),
										(0, vue_exports.createVNode)("option", { value: "name:ab" }, "Name, Z bis A"),
										(0, vue_exports.createVNode)("option", { value: "aktualisiert:ab" }, "Zuletzt geändert zuerst"),
										(0, vue_exports.createVNode)("option", { value: "preis:auf" }, "Niedrigster Preis zuerst"),
										(0, vue_exports.createVNode)("option", { value: "preis:ab" }, "Höchster Preis zuerst"),
										(0, vue_exports.createVNode)("option", { value: "groessen:ab" }, "Meiste Größen zuerst")
									], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, sheetSort.value]])]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "fg-s-status"
									}, "Status"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "fg-s-status",
										"onUpdate:modelValue": ($event) => form.value.status = $event,
										class: "input"
									}, [(0, vue_exports.createVNode)("option", { value: "" }, "Entwurf und im Shop"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.options.statuses, (status) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
											key: status.value,
											value: status.value
										}, (0, vue_exports.toDisplayString)(status.label) + " (" + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(status.count, 0)) + ")", 9, ["value"]);
									}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, form.value.status]])]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "fg-s-marke"
									}, "Marke"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "fg-s-marke",
										"onUpdate:modelValue": ($event) => form.value.marke = $event,
										class: "input"
									}, [(0, vue_exports.createVNode)("option", { value: "" }, "Alle"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.options.brands, (brand) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
											key: brand.value,
											value: brand.value
										}, (0, vue_exports.toDisplayString)(brand.label), 9, ["value"]);
									}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, form.value.marke]])]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "fg-s-freigaben"
									}, "Freigaben"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "fg-s-freigaben",
										"onUpdate:modelValue": ($event) => form.value.freigaben = $event,
										class: "input"
									}, [
										(0, vue_exports.createVNode)("option", { value: "" }, "Alle"),
										(0, vue_exports.createVNode)("option", { value: "keine" }, "Noch nicht hinterlegt"),
										(0, vue_exports.createVNode)("option", { value: "teilweise" }, "Für einen Teil der Größen"),
										(0, vue_exports.createVNode)("option", { value: "alle" }, "Für alle Größen")
									], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, form.value.freigaben]])]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "fg-s-demo"
									}, "Herkunft"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "fg-s-demo",
										"onUpdate:modelValue": ($event) => form.value.demo = $event,
										class: "input"
									}, [
										(0, vue_exports.createVNode)("option", { value: "" }, "Alle"),
										(0, vue_exports.createVNode)("option", { value: "nein" }, "Echte Felgen"),
										(0, vue_exports.createVNode)("option", { value: "ja" }, "Demodaten")
									], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, form.value.demo]])]),
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
									}, "Zurücksetzen", 8, ["disabled"])) : (0, vue_exports.createCommentVNode)("", true)
								], 32)];
							}),
							_: 1
						}, _parent, _scopeId));
						else _push(`<!---->`);
						if (__props.wheels.length === 0) {
							_push(`<!--[-->`);
							if (__props.filtered) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
								kind: "filtered",
								total: __props.totalAll,
								onReset: reset
							}, null, _parent, _scopeId));
							else _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
								kind: "empty",
								text: EMPTY_TEXT
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										_push(`<div class="fg-empty-actions" data-v-4deb0468${_scopeId}>`);
										if (__props.can.create) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
											href: "/admin/felgen/neu",
											class: "btn btn--primary"
										}, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) _push(`Neue Felge anlegen`);
												else return [(0, vue_exports.createTextVNode)("Neue Felge anlegen")];
											}),
											_: 1
										}, _parent, _scopeId));
										else _push(`<!---->`);
										if (__props.can.import) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
											href: "/admin/katalog/import",
											class: "btn btn--secondary"
										}, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) _push(`Lieferantendatei importieren`);
												else return [(0, vue_exports.createTextVNode)("Lieferantendatei importieren")];
											}),
											_: 1
										}, _parent, _scopeId));
										else _push(`<!---->`);
										_push(`</div>`);
									} else return [(0, vue_exports.createVNode)("div", { class: "fg-empty-actions" }, [__props.can.create ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
										key: 0,
										href: "/admin/felgen/neu",
										class: "btn btn--primary"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Neue Felge anlegen")]),
										_: 1
									})) : (0, vue_exports.createCommentVNode)("", true), __props.can.import ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
										key: 1,
										href: "/admin/katalog/import",
										class: "btn btn--secondary"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Lieferantendatei importieren")]),
										_: 1
									})) : (0, vue_exports.createCommentVNode)("", true)])];
								}),
								_: 1
							}, _parent, _scopeId));
							_push(`<!--]-->`);
						} else {
							_push(`<!--[-->`);
							if (canBulk.value) {
								_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([{ "fg-bulk--idle": selected.value.length === 0 }, "fg-bulk"])}" role="region" aria-label="Auswahl" data-v-4deb0468${_scopeId}>`);
								if (selected.value.length === 0) _push(`<p class="fg-bulk__count fg-bulk__hint" data-v-4deb0468${_scopeId}>Wähl Felgen aus, um mehrere auf einmal zu veröffentlichen, zurückzuziehen oder zu archivieren.</p>`);
								else _push(`<p class="fg-bulk__count" aria-live="polite" data-v-4deb0468${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(felgen)(selected.value.length))} ausgewählt</p>`);
								if (selected.value.length) {
									_push(`<div class="fg-bulk__actions" data-v-4deb0468${_scopeId}>`);
									if (__props.can.publish) _push(`<button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-4deb0468${_scopeId}>Veröffentlichen</button>`);
									else _push(`<!---->`);
									if (__props.can.publish) _push(`<button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-4deb0468${_scopeId}>Zurückziehen</button>`);
									else _push(`<!---->`);
									if (__props.can.archive) _push(`<button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-4deb0468${_scopeId}>Archivieren</button>`);
									else _push(`<!---->`);
									_push(`<button class="btn btn--ghost" type="button" data-v-4deb0468${_scopeId}>Auswahl aufheben</button></div>`);
								} else _push(`<!---->`);
								_push(`</div>`);
							} else _push(`<!---->`);
							_push(`<div class="adm-panel"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-4deb0468${_scopeId}><table class="adm-table fg-table" data-v-4deb0468${_scopeId}><caption class="visually-hidden" data-v-4deb0468${_scopeId}>Felgen, ${(0, server_renderer_exports.ssrInterpolate)(context.value)}</caption><thead data-v-4deb0468${_scopeId}><tr data-v-4deb0468${_scopeId}>`);
							if (canBulk.value) _push(`<th scope="col" class="fg-pick" data-v-4deb0468${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(allOnPage.value) ? (0, server_renderer_exports.ssrLooseContain)(allOnPage.value, null) : allOnPage.value) ? " checked" : ""} class="fg-check" type="checkbox" aria-label="Alle Felgen dieser Seite auswählen" data-v-4deb0468${_scopeId}></th>`);
							else _push(`<!---->`);
							_push(`<!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(columns.value, (column) => {
								_push(`<th scope="col" class="${(0, server_renderer_exports.ssrRenderClass)({ num: column.num })}"${(0, server_renderer_exports.ssrRenderAttr)("aria-sort", sortState(column.key))} data-v-4deb0468${_scopeId}>`);
								if (column.key) {
									_push(`<button class="fg-sort" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-4deb0468${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(column.label)} `);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										class: ["fg-sort__icon", { "fg-sort__icon--on": __props.filters.sort === column.key }],
										name: __props.filters.sort === column.key && __props.filters.richtung === "auf" ? "chevron-up" : "chevron-down",
										size: 16
									}, null, _parent, _scopeId));
									_push(`</button>`);
								} else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(column.label)}<!--]-->`);
								_push(`</th>`);
							});
							_push(`<!--]--></tr></thead><tbody data-v-4deb0468${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.wheels, (wheel) => {
								_push(`<tr data-v-4deb0468${_scopeId}>`);
								if (canBulk.value) _push(`<td class="fg-pick" data-phone="hide" data-v-4deb0468${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(selected.value) ? (0, server_renderer_exports.ssrLooseContain)(selected.value, wheel.id) : selected.value) ? " checked" : ""} class="fg-check" type="checkbox"${(0, server_renderer_exports.ssrRenderAttr)("value", wheel.id)}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${wheel.brand} ${wheel.name} auswählen`)} data-v-4deb0468${_scopeId}></td>`);
								else _push(`<!---->`);
								_push(`<td data-label="Felge" class="fg-key" data-v-4deb0468${_scopeId}><div class="fg-wheel" data-v-4deb0468${_scopeId}><span class="fg-thumb" aria-hidden="true" data-v-4deb0468${_scopeId}>`);
								if (wheel.image) _push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
									image: wheel.image.manifest,
									alt: "",
									sizes: "40px"
								}, null, _parent, _scopeId));
								else _push(`<!---->`);
								_push(`</span><span class="fg-wheel__text" data-v-4deb0468${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: wheel.href,
									class: "fg-name"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`<span class="fg-brand" data-v-4deb0468${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(wheel.brand)}</span> ${(0, server_renderer_exports.ssrInterpolate)(wheel.name)}`);
										else return [(0, vue_exports.createVNode)("span", { class: "fg-brand" }, (0, vue_exports.toDisplayString)(wheel.brand), 1), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(wheel.name), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								_push(`<span class="fg-sub" data-v-4deb0468${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(wheel.finishes === 1 ? "1 Ausführung" : `${(0, vue_exports.unref)(decimal)(wheel.finishes, 0)} Ausführungen`)} `);
								if (wheel.demo) _push(`<span class="adm-tag adm-tag--neutral fg-demo" data-v-4deb0468${_scopeId}>Demodaten</span>`);
								else _push(`<!---->`);
								_push(`</span>`);
								if (wheel.internalNote) _push(`<span class="fg-memo" data-v-4deb0468${_scopeId}>Notiz: ${(0, server_renderer_exports.ssrInterpolate)(wheel.internalNote)}</span>`);
								else _push(`<!---->`);
								_push(`</span></div></td>`);
								if (has("status")) {
									_push(`<td data-label="Status" data-phone="status" data-v-4deb0468${_scopeId}>`);
									if (statusTag(wheel.status)) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)(statusTag(wheel.status))}" data-v-4deb0468${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(wheel.statusLabel)}</span>`);
									else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(wheel.statusLabel)}<!--]-->`);
									_push(`</td>`);
								} else _push(`<!---->`);
								if (has("groessen")) {
									_push(`<td data-label="Größen" data-v-4deb0468${_scopeId}><span data-v-4deb0468${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(wheel.sizes === 0 ? "–" : (0, vue_exports.unref)(decimal)(wheel.sizes, 0))} `);
									if (wheel.diameters) _push(`<span class="fg-sub" data-v-4deb0468${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(wheel.diameters)}</span>`);
									else _push(`<!---->`);
									_push(`</span></td>`);
								} else _push(`<!---->`);
								if (has("preis")) _push(`<td data-label="Preis ab" class="num" data-v-4deb0468${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(wheel.fromCents === null ? "–" : (0, vue_exports.unref)(formatMoney)(wheel.fromCents))}</td>`);
								else _push(`<!---->`);
								if (has("bestand")) _push(`<td data-label="Bestand" class="num" data-v-4deb0468${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(wheel.stock, 0))}</td>`);
								else _push(`<!---->`);
								if (has("freigaben")) {
									_push(`<td data-label="Freigaben" data-v-4deb0468${_scopeId}>`);
									if (tagClass(wheel.coverage)) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([tagClass(wheel.coverage), "fg-coverage"])}" data-v-4deb0468${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(wheel.coverage.label)}</span>`);
									else _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)([{ "fg-covered--partial": wheel.covered < wheel.sizes }, "fg-covered"])}" data-v-4deb0468${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(wheel.coverage.label)}</span>`);
									_push(`</td>`);
								} else _push(`<!---->`);
								if (has("aktualisiert")) _push(`<td data-label="Geändert" class="fg-date" data-v-4deb0468${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(wheel.updated ?? "–")}</td>`);
								else _push(`<!---->`);
								_push(`</tr>`);
							});
							_push(`<!--]--></tbody></table></div>`);
							if (__props.pagination.last > 1) {
								_push(`<nav class="fg-pages" aria-label="Seiten der Felgen" data-v-4deb0468${_scopeId}>`);
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
								else _push(`<span class="fg-pages__spacer" aria-hidden="true" data-v-4deb0468${_scopeId}></span>`);
								_push(`<p class="fg-pages__where" data-v-4deb0468${_scopeId}>Seite ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.pagination.current, 0))} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.pagination.last, 0))}</p>`);
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
								else _push(`<span class="fg-pages__spacer" aria-hidden="true" data-v-4deb0468${_scopeId}></span>`);
								_push(`</nav>`);
							} else _push(`<!---->`);
							_push(`<!--]-->`);
						}
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: confirmOpen.value,
							"onUpdate:open": ($event) => confirmOpen.value = $event,
							title: pending.value ? BULK[pending.value].title((0, vue_exports.unref)(felgen)(selected.value.length)) : "",
							body: pending.value ? BULK[pending.value].body : "",
							"confirm-label": pending.value ? BULK[pending.value].label : "",
							busy: busy.value,
							onConfirm: runBulk
						}, null, _parent, _scopeId));
					} else return [
						(0, vue_exports.createVNode)(ListViews_default, {
							list: "felgen",
							base: BASE,
							"all-label": "Alle Felgen",
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
								class: "fg-refusal"
							}, (0, vue_exports.toDisplayString)(message), 1);
						}), 128))])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("form", {
							class: "fg-search",
							role: "search",
							action: BASE,
							method: "get",
							onSubmit: (0, vue_exports.withModifiers)(apply, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("label", {
								class: "visually-hidden",
								for: "fg-q"
							}, "Felgen durchsuchen"),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "fg-q",
								"onUpdate:modelValue": ($event) => search.value = $event,
								class: "input",
								type: "search",
								name: "q",
								maxlength: "120",
								placeholder: "Marke, Modell, SKU oder EAN",
								autocomplete: "off"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, search.value]]),
							(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "submit",
								disabled: busy.value
							}, "Suchen", 8, ["disabled"])
						], 32),
						(0, vue_exports.createVNode)("form", {
							class: "fg-filters",
							action: BASE,
							method: "get",
							"aria-label": "Felgen filtern",
							onSubmit: (0, vue_exports.withModifiers)(apply, ["prevent"])
						}, [(0, vue_exports.createVNode)("div", { class: "fg-filters__fields" }, [
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "fg-status"
							}, "Status"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
								id: "fg-status",
								"onUpdate:modelValue": ($event) => form.value.status = $event,
								class: "input"
							}, [(0, vue_exports.createVNode)("option", { value: "" }, "Entwurf und im Shop"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.options.statuses, (status) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
									key: status.value,
									value: status.value
								}, (0, vue_exports.toDisplayString)(status.label) + " (" + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(status.count, 0)) + ")", 9, ["value"]);
							}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, form.value.status]])]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "fg-marke"
							}, "Marke"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
								id: "fg-marke",
								"onUpdate:modelValue": ($event) => form.value.marke = $event,
								class: "input"
							}, [(0, vue_exports.createVNode)("option", { value: "" }, "Alle"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.options.brands, (brand) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
									key: brand.value,
									value: brand.value
								}, (0, vue_exports.toDisplayString)(brand.label), 9, ["value"]);
							}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, form.value.marke]])]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "fg-freigaben"
							}, "Freigaben"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
								id: "fg-freigaben",
								"onUpdate:modelValue": ($event) => form.value.freigaben = $event,
								class: "input"
							}, [
								(0, vue_exports.createVNode)("option", { value: "" }, "Alle"),
								(0, vue_exports.createVNode)("option", { value: "keine" }, "Noch nicht hinterlegt"),
								(0, vue_exports.createVNode)("option", { value: "teilweise" }, "Für einen Teil der Größen"),
								(0, vue_exports.createVNode)("option", { value: "alle" }, "Für alle Größen")
							], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, form.value.freigaben]])]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "fg-demo"
							}, "Herkunft"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
								id: "fg-demo",
								"onUpdate:modelValue": ($event) => form.value.demo = $event,
								class: "input"
							}, [
								(0, vue_exports.createVNode)("option", { value: "" }, "Alle"),
								(0, vue_exports.createVNode)("option", { value: "nein" }, "Echte Felgen"),
								(0, vue_exports.createVNode)("option", { value: "ja" }, "Demodaten")
							], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, form.value.demo]])]),
							(0, vue_exports.createVNode)("div", { class: "fg-filters__actions" }, [(0, vue_exports.createVNode)("button", {
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
							}, "Zurücksetzen", 8, ["disabled"])) : (0, vue_exports.createCommentVNode)("", true)])
						])], 32),
						(0, vue_exports.unref)(sheetAvailable) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 1,
							class: "fg-filterbar"
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
							id: "felgen-filter",
							open: sheetOpen.value,
							"onUpdate:open": ($event) => sheetOpen.value = $event,
							title: "Felgen filtern"
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("form", {
								class: "fg-sheet",
								"aria-label": "Felgen filtern",
								onSubmit: (0, vue_exports.withModifiers)(apply, ["prevent"])
							}, [
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fg-s-sort"
								}, "Sortierung"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "fg-s-sort",
									"onUpdate:modelValue": ($event) => sheetSort.value = $event,
									class: "input"
								}, [
									(0, vue_exports.createVNode)("option", { value: "name:auf" }, "Name, A bis Z"),
									(0, vue_exports.createVNode)("option", { value: "name:ab" }, "Name, Z bis A"),
									(0, vue_exports.createVNode)("option", { value: "aktualisiert:ab" }, "Zuletzt geändert zuerst"),
									(0, vue_exports.createVNode)("option", { value: "preis:auf" }, "Niedrigster Preis zuerst"),
									(0, vue_exports.createVNode)("option", { value: "preis:ab" }, "Höchster Preis zuerst"),
									(0, vue_exports.createVNode)("option", { value: "groessen:ab" }, "Meiste Größen zuerst")
								], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, sheetSort.value]])]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fg-s-status"
								}, "Status"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "fg-s-status",
									"onUpdate:modelValue": ($event) => form.value.status = $event,
									class: "input"
								}, [(0, vue_exports.createVNode)("option", { value: "" }, "Entwurf und im Shop"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.options.statuses, (status) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
										key: status.value,
										value: status.value
									}, (0, vue_exports.toDisplayString)(status.label) + " (" + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(status.count, 0)) + ")", 9, ["value"]);
								}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, form.value.status]])]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fg-s-marke"
								}, "Marke"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "fg-s-marke",
									"onUpdate:modelValue": ($event) => form.value.marke = $event,
									class: "input"
								}, [(0, vue_exports.createVNode)("option", { value: "" }, "Alle"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.options.brands, (brand) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
										key: brand.value,
										value: brand.value
									}, (0, vue_exports.toDisplayString)(brand.label), 9, ["value"]);
								}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, form.value.marke]])]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fg-s-freigaben"
								}, "Freigaben"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "fg-s-freigaben",
									"onUpdate:modelValue": ($event) => form.value.freigaben = $event,
									class: "input"
								}, [
									(0, vue_exports.createVNode)("option", { value: "" }, "Alle"),
									(0, vue_exports.createVNode)("option", { value: "keine" }, "Noch nicht hinterlegt"),
									(0, vue_exports.createVNode)("option", { value: "teilweise" }, "Für einen Teil der Größen"),
									(0, vue_exports.createVNode)("option", { value: "alle" }, "Für alle Größen")
								], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, form.value.freigaben]])]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "fg-s-demo"
								}, "Herkunft"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "fg-s-demo",
									"onUpdate:modelValue": ($event) => form.value.demo = $event,
									class: "input"
								}, [
									(0, vue_exports.createVNode)("option", { value: "" }, "Alle"),
									(0, vue_exports.createVNode)("option", { value: "nein" }, "Echte Felgen"),
									(0, vue_exports.createVNode)("option", { value: "ja" }, "Demodaten")
								], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, form.value.demo]])]),
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
								}, "Zurücksetzen", 8, ["disabled"])) : (0, vue_exports.createCommentVNode)("", true)
							], 32)]),
							_: 1
						}, 8, ["open", "onUpdate:open"])) : (0, vue_exports.createCommentVNode)("", true),
						__props.wheels.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [__props.filtered ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 0,
							kind: "filtered",
							total: __props.totalAll,
							onReset: reset
						}, null, 8, ["total"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 1,
							kind: "empty",
							text: EMPTY_TEXT
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("div", { class: "fg-empty-actions" }, [__props.can.create ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
								key: 0,
								href: "/admin/felgen/neu",
								class: "btn btn--primary"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Neue Felge anlegen")]),
								_: 1
							})) : (0, vue_exports.createCommentVNode)("", true), __props.can.import ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
								key: 1,
								href: "/admin/katalog/import",
								class: "btn btn--secondary"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Lieferantendatei importieren")]),
								_: 1
							})) : (0, vue_exports.createCommentVNode)("", true)])]),
							_: 1
						}))], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 4 }, [
							canBulk.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 0,
								class: ["fg-bulk", { "fg-bulk--idle": selected.value.length === 0 }],
								role: "region",
								"aria-label": "Auswahl"
							}, [selected.value.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "fg-bulk__count fg-bulk__hint"
							}, "Wähl Felgen aus, um mehrere auf einmal zu veröffentlichen, zurückzuziehen oder zu archivieren.")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 1,
								class: "fg-bulk__count",
								"aria-live": "polite"
							}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(felgen)(selected.value.length)) + " ausgewählt", 1)), selected.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 2,
								class: "fg-bulk__actions"
							}, [
								__props.can.publish ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 0,
									class: "btn btn--secondary",
									type: "button",
									disabled: busy.value,
									onClick: ($event) => pending.value = "publish"
								}, "Veröffentlichen", 8, ["disabled", "onClick"])) : (0, vue_exports.createCommentVNode)("", true),
								__props.can.publish ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 1,
									class: "btn btn--secondary",
									type: "button",
									disabled: busy.value,
									onClick: ($event) => pending.value = "unpublish"
								}, "Zurückziehen", 8, ["disabled", "onClick"])) : (0, vue_exports.createCommentVNode)("", true),
								__props.can.archive ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 2,
									class: "btn btn--secondary",
									type: "button",
									disabled: busy.value,
									onClick: ($event) => pending.value = "archive"
								}, "Archivieren", 8, ["disabled", "onClick"])) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("button", {
									class: "btn btn--ghost",
									type: "button",
									onClick: ($event) => selected.value = []
								}, "Auswahl aufheben", 8, ["onClick"])
							])) : (0, vue_exports.createCommentVNode)("", true)], 2)) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("div", {
								class: "adm-panel",
								"aria-busy": busy.value ? "true" : void 0
							}, [(0, vue_exports.createVNode)("table", { class: "adm-table fg-table" }, [
								(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Felgen, " + (0, vue_exports.toDisplayString)(context.value), 1),
								(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [canBulk.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("th", {
									key: 0,
									scope: "col",
									class: "fg-pick"
								}, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									"onUpdate:modelValue": ($event) => allOnPage.value = $event,
									class: "fg-check",
									type: "checkbox",
									"aria-label": "Alle Felgen dieser Seite auswählen"
								}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelCheckbox, allOnPage.value]])])) : (0, vue_exports.createCommentVNode)("", true), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(columns.value, (column) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("th", {
										key: column.id,
										scope: "col",
										class: { num: column.num },
										"aria-sort": sortState(column.key)
									}, [column.key ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
										key: 0,
										class: "fg-sort",
										type: "button",
										disabled: busy.value,
										onClick: ($event) => sortBy(column.key)
									}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(column.label) + " ", 1), (0, vue_exports.createVNode)(AdminIcon_default, {
										class: ["fg-sort__icon", { "fg-sort__icon--on": __props.filters.sort === column.key }],
										name: __props.filters.sort === column.key && __props.filters.richtung === "auf" ? "chevron-up" : "chevron-down",
										size: 16
									}, null, 8, ["class", "name"])], 8, ["disabled", "onClick"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(column.label), 1)], 64))], 10, ["aria-sort"]);
								}), 128))])]),
								(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.wheels, (wheel) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: wheel.id }, [
										canBulk.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
											key: 0,
											class: "fg-pick",
											"data-phone": "hide"
										}, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											"onUpdate:modelValue": ($event) => selected.value = $event,
											class: "fg-check",
											type: "checkbox",
											value: wheel.id,
											"aria-label": `${wheel.brand} ${wheel.name} auswählen`
										}, null, 8, [
											"onUpdate:modelValue",
											"value",
											"aria-label"
										]), [[vue_exports.vModelCheckbox, selected.value]])])) : (0, vue_exports.createCommentVNode)("", true),
										(0, vue_exports.createVNode)("td", {
											"data-label": "Felge",
											class: "fg-key"
										}, [(0, vue_exports.createVNode)("div", { class: "fg-wheel" }, [(0, vue_exports.createVNode)("span", {
											class: "fg-thumb",
											"aria-hidden": "true"
										}, [wheel.image ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(Picture_default, {
											key: 0,
											image: wheel.image.manifest,
											alt: "",
											sizes: "40px"
										}, null, 8, ["image"])) : (0, vue_exports.createCommentVNode)("", true)]), (0, vue_exports.createVNode)("span", { class: "fg-wheel__text" }, [
											(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
												href: wheel.href,
												class: "fg-name"
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "fg-brand" }, (0, vue_exports.toDisplayString)(wheel.brand), 1), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(wheel.name), 1)]),
												_: 2
											}, 1032, ["href"]),
											(0, vue_exports.createVNode)("span", { class: "fg-sub" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(wheel.finishes === 1 ? "1 Ausführung" : `${(0, vue_exports.unref)(decimal)(wheel.finishes, 0)} Ausführungen`) + " ", 1), wheel.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 0,
												class: "adm-tag adm-tag--neutral fg-demo"
											}, "Demodaten")) : (0, vue_exports.createCommentVNode)("", true)]),
											wheel.internalNote ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 0,
												class: "fg-memo"
											}, "Notiz: " + (0, vue_exports.toDisplayString)(wheel.internalNote), 1)) : (0, vue_exports.createCommentVNode)("", true)
										])])]),
										has("status") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
											key: 1,
											"data-label": "Status",
											"data-phone": "status"
										}, [statusTag(wheel.status) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: statusTag(wheel.status)
										}, (0, vue_exports.toDisplayString)(wheel.statusLabel), 3)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(wheel.statusLabel), 1)], 64))])) : (0, vue_exports.createCommentVNode)("", true),
										has("groessen") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
											key: 2,
											"data-label": "Größen"
										}, [(0, vue_exports.createVNode)("span", null, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(wheel.sizes === 0 ? "–" : (0, vue_exports.unref)(decimal)(wheel.sizes, 0)) + " ", 1), wheel.diameters ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: "fg-sub"
										}, (0, vue_exports.toDisplayString)(wheel.diameters), 1)) : (0, vue_exports.createCommentVNode)("", true)])])) : (0, vue_exports.createCommentVNode)("", true),
										has("preis") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
											key: 3,
											"data-label": "Preis ab",
											class: "num"
										}, (0, vue_exports.toDisplayString)(wheel.fromCents === null ? "–" : (0, vue_exports.unref)(formatMoney)(wheel.fromCents)), 1)) : (0, vue_exports.createCommentVNode)("", true),
										has("bestand") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
											key: 4,
											"data-label": "Bestand",
											class: "num"
										}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(wheel.stock, 0)), 1)) : (0, vue_exports.createCommentVNode)("", true),
										has("freigaben") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
											key: 5,
											"data-label": "Freigaben"
										}, [tagClass(wheel.coverage) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: ["fg-coverage", tagClass(wheel.coverage)]
										}, (0, vue_exports.toDisplayString)(wheel.coverage.label), 3)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 1,
											class: ["fg-covered", { "fg-covered--partial": wheel.covered < wheel.sizes }]
										}, (0, vue_exports.toDisplayString)(wheel.coverage.label), 3))])) : (0, vue_exports.createCommentVNode)("", true),
										has("aktualisiert") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
											key: 6,
											"data-label": "Geändert",
											class: "fg-date"
										}, (0, vue_exports.toDisplayString)(wheel.updated ?? "–"), 1)) : (0, vue_exports.createCommentVNode)("", true)
									]);
								}), 128))])
							])], 8, ["aria-busy"]),
							__props.pagination.last > 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("nav", {
								key: 1,
								class: "fg-pages",
								"aria-label": "Seiten der Felgen"
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
									class: "fg-pages__spacer",
									"aria-hidden": "true"
								})),
								(0, vue_exports.createVNode)("p", { class: "fg-pages__where" }, "Seite " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.pagination.current, 0)) + " von " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.pagination.last, 0)), 1),
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
									class: "fg-pages__spacer",
									"aria-hidden": "true"
								}))
							])) : (0, vue_exports.createCommentVNode)("", true)
						], 64)),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: confirmOpen.value,
							"onUpdate:open": ($event) => confirmOpen.value = $event,
							title: pending.value ? BULK[pending.value].title((0, vue_exports.unref)(felgen)(selected.value.length)) : "",
							body: pending.value ? BULK[pending.value].body : "",
							"confirm-label": pending.value ? BULK[pending.value].label : "",
							busy: busy.value,
							onConfirm: runBulk
						}, null, 8, [
							"open",
							"onUpdate:open",
							"title",
							"body",
							"confirm-label",
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
//#region resources/js/Pages/Admin/Felgen/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Felgen/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-4deb0468"]]);
//#endregion
export { Index_default as default };
