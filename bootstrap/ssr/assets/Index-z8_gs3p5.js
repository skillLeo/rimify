import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-yqAbwMfa.js";
import { a as link_default, c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { i as hasMobileShell, r as BottomSheet_default } from "./Toast-B_WK2e8v.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { t as AdminState_default } from "./AdminState-QyYV7E7y.js";
import { a as rangeQuery, i as rangeForm, t as berlinToday } from "./days-BEXWaUP_.js";
import { t as FilterFields_default } from "./FilterFields-B3sizF8g.js";
//#region resources/js/Pages/Admin/Protokoll/filters.ts
/** The form that shows the filters the server applied: a preset where they match one, else an own range. */
function formFromFilters(filters, today) {
	return {
		person: filters.person ?? "",
		bereich: filters.bereich ?? "",
		...rangeForm(filters.von, filters.bis, today)
	};
}
/**
* The query the form asks for, or the German sentence that says what is wrong with an own range.
* Empty values are left out, so an unfiltered log is the bare URL.
*/
function queryFromForm(form, today) {
	const range = rangeQuery(form, today);
	if ("error" in range) return range;
	const query = { ...range.query };
	if (form.person) query.person = form.person;
	if (form.bereich) query.bereich = form.bereich;
	return { query };
}
/** How many filters are on — for the phone's "Filter · 2". */
function activeCount(filters) {
	return [
		filters.person,
		filters.bereich,
		filters.von || filters.bis
	].filter(Boolean).length;
}
//#endregion
//#region resources/js/Pages/Admin/Protokoll/Index.vue?vue&type=script&setup=true&lang.ts
var BASE = "/admin/protokoll";
var EMPTY_TEXT = "Jede Änderung im Admin-Bereich erscheint hier, sobald jemand aus dem Team sie speichert – mit Zeitpunkt, Person und dem Wert davor und danach.";
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		entries: {},
		filters: {},
		options: {},
		filtered: { type: Boolean },
		oldestFirst: { type: Boolean },
		totalAll: {},
		pagination: {},
		exportUrl: {},
		can: {}
	},
	setup(__props) {
		/**
		* Team › Protokoll: every change made in the panel — who, when, what it was before (BRIEF.md §2).
		*
		* Read-only by nature: the log is append-only, so there is no form here, only filters and a list.
		* The entries arrive in words, grouped by the Berlin day they happened on; each one can open to show
		* its before → after and the IP it came from. The filters live in the URL, so a filtered view is a
		* link and the CSV export takes exactly the set on screen.
		*
		* The filters are applied with a button, not on every change: a native select fires `change` on each
		* arrow key in some browsers, and a list that reloads under the keyboard is a list nobody can use.
		*
		* On a phone the list comes first: the filters, and the export, wait behind one "Filter" button in
		* a sheet (admin-shell §11.4), which says how many are on.
		*/
		const props = __props;
		const page = usePage();
		const form = (0, vue_exports.ref)(formFromFilters(props.filters, berlinToday()));
		const order = (0, vue_exports.ref)(props.oldestFirst ? "alt" : "neu");
		const ORDER = () => order.value === "alt" ? { reihenfolge: "alt" } : {};
		const dateError = (0, vue_exports.ref)("");
		const busy = (0, vue_exports.ref)(false);
		/** The entries whose details are open, by id. */
		const open = (0, vue_exports.ref)([]);
		/** The phone's filter sheet — only where the admin layout provides the sheet's shell. */
		const sheetAvailable = hasMobileShell();
		const sheetOpen = (0, vue_exports.ref)(false);
		const active = (0, vue_exports.computed)(() => activeCount(props.filters));
		(0, vue_exports.watch)(() => props.filters, (filters) => {
			form.value = formFromFilters(filters, berlinToday());
			order.value = props.oldestFirst ? "alt" : "neu";
			dateError.value = "";
		});
		const context = (0, vue_exports.computed)(() => {
			const n = props.pagination.total;
			const count = `${decimal(n, 0)} ${n === 1 ? "Eintrag" : "Einträge"}`;
			return props.filtered ? `${count} · gefiltert` : count;
		});
		/** A filter the server refused, in its own words. */
		const refusals = (0, vue_exports.computed)(() => {
			const raw = page.props.errors;
			if (raw === null || typeof raw !== "object") return [];
			return Object.values(raw).filter((m) => typeof m === "string" && m !== "");
		});
		/** Consecutive entries of one Berlin day under one heading; the server already sent them newest first. */
		const days = (0, vue_exports.computed)(() => {
			const groups = [];
			for (const entry of props.entries) {
				const key = entry.day ?? "ohne-datum";
				const last = groups[groups.length - 1];
				if (last !== void 0 && last.key === key) last.entries.push(entry);
				else groups.push({
					key,
					label: entry.dayLabel,
					entries: [entry]
				});
			}
			return groups;
		});
		const showFilters = (0, vue_exports.computed)(() => props.totalAll > 0 || props.filtered);
		function visit(query) {
			busy.value = true;
			open.value = [];
			router.get(BASE, query, {
				preserveScroll: true,
				preserveState: true,
				onFinish: () => {
					busy.value = false;
				}
			});
		}
		function apply() {
			const result = queryFromForm(form.value, berlinToday());
			if ("error" in result) {
				dateError.value = result.error;
				return;
			}
			dateError.value = "";
			sheetOpen.value = false;
			visit({
				...result.query,
				...ORDER()
			});
		}
		function reset() {
			form.value = {
				person: "",
				bereich: "",
				zeitraum: "",
				von: "",
				bis: ""
			};
			dateError.value = "";
			sheetOpen.value = false;
			visit(ORDER());
		}
		function hasDetails(entry) {
			return entry.changes.length > 0 || entry.ip !== null;
		}
		function isOpen(id) {
			return open.value.includes(id);
		}
		function toggle(id) {
			open.value = isOpen(id) ? open.value.filter((o) => o !== id) : [...open.value, id];
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Protokoll",
				context: context.value
			}, _attrs), (0, vue_exports.createSlots)({
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (refusals.value.length) {
							_push(`<div class="adm-alert" role="alert" data-v-c529c9bd${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(refusals.value, (message) => {
								_push(`<p class="pk__refusal" data-v-c529c9bd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(message)}</p>`);
							});
							_push(`<!--]--></div>`);
						} else _push(`<!---->`);
						if (showFilters.value) {
							_push(`<form class="pk-filters"${(0, server_renderer_exports.ssrRenderAttr)("action", BASE)} method="get" aria-label="Protokoll filtern" data-v-c529c9bd${_scopeId}><div class="${(0, server_renderer_exports.ssrRenderClass)([{ "pk-filters__fields--range": form.value.zeitraum === "eigen" }, "pk-filters__fields"])}" data-v-c529c9bd${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(FilterFields_default, {
								form: form.value,
								"onUpdate:form": ($event) => form.value = $event,
								people: __props.options.people,
								areas: __props.options.areas,
								"id-prefix": "pk",
								"date-error": dateError.value
							}, null, _parent, _scopeId));
							_push(`<div class="form-field" data-v-c529c9bd${_scopeId}><label class="form-field__label" for="pk-reihenfolge" data-v-c529c9bd${_scopeId}>Reihenfolge</label><select id="pk-reihenfolge" class="input" data-v-c529c9bd${_scopeId}><option value="neu" data-v-c529c9bd${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(order.value) ? (0, server_renderer_exports.ssrLooseContain)(order.value, "neu") : (0, server_renderer_exports.ssrLooseEqual)(order.value, "neu")) ? " selected" : ""}${_scopeId}>Neueste zuerst</option><option value="alt" data-v-c529c9bd${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(order.value) ? (0, server_renderer_exports.ssrLooseContain)(order.value, "alt") : (0, server_renderer_exports.ssrLooseEqual)(order.value, "alt")) ? " selected" : ""}${_scopeId}>Älteste zuerst</option></select></div><div class="pk-filters__actions" data-v-c529c9bd${_scopeId}><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-c529c9bd${_scopeId}>Anwenden</button>`);
							if (__props.filtered) _push(`<button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-c529c9bd${_scopeId}>Zurücksetzen</button>`);
							else _push(`<!---->`);
							_push(`</div></div></form>`);
						} else _push(`<!---->`);
						if (showFilters.value && (0, vue_exports.unref)(sheetAvailable)) {
							_push(`<div class="pk-filterbar" data-v-c529c9bd${_scopeId}><button class="btn btn--secondary" type="button" aria-haspopup="dialog" data-v-c529c9bd${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "filter",
								size: 20
							}, null, _parent, _scopeId));
							_push(` ${(0, server_renderer_exports.ssrInterpolate)(active.value > 0 ? `Filter · ${active.value}` : "Filter")}</button>`);
							if (__props.filtered) _push(`<button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-c529c9bd${_scopeId}>Zurücksetzen</button>`);
							else _push(`<!---->`);
							_push(`</div>`);
						} else _push(`<!---->`);
						if ((0, vue_exports.unref)(sheetAvailable)) _push((0, server_renderer_exports.ssrRenderComponent)(BottomSheet_default, {
							id: "protokoll-filter",
							open: sheetOpen.value,
							"onUpdate:open": ($event) => sheetOpen.value = $event,
							title: "Protokoll filtern"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<form class="pk-sheet" aria-label="Protokoll filtern" data-v-c529c9bd${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(FilterFields_default, {
										form: form.value,
										"onUpdate:form": ($event) => form.value = $event,
										people: __props.options.people,
										areas: __props.options.areas,
										"id-prefix": "pk-s",
										"date-error": dateError.value
									}, null, _parent, _scopeId));
									_push(`<div class="form-field" data-v-c529c9bd${_scopeId}><label class="form-field__label" for="pk-s-reihenfolge" data-v-c529c9bd${_scopeId}>Reihenfolge</label><select id="pk-s-reihenfolge" class="input" data-v-c529c9bd${_scopeId}><option value="neu" data-v-c529c9bd${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(order.value) ? (0, server_renderer_exports.ssrLooseContain)(order.value, "neu") : (0, server_renderer_exports.ssrLooseEqual)(order.value, "neu")) ? " selected" : ""}${_scopeId}>Neueste zuerst</option><option value="alt" data-v-c529c9bd${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(order.value) ? (0, server_renderer_exports.ssrLooseContain)(order.value, "alt") : (0, server_renderer_exports.ssrLooseEqual)(order.value, "alt")) ? " selected" : ""}${_scopeId}>Älteste zuerst</option></select></div><button class="btn btn--primary btn--block" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-c529c9bd${_scopeId}>Anwenden</button>`);
									if (__props.filtered) _push(`<button class="btn btn--secondary btn--block" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-c529c9bd${_scopeId}>Zurücksetzen</button>`);
									else _push(`<!---->`);
									if (__props.can.export && __props.exportUrl) {
										_push(`<a class="btn btn--ghost btn--block"${(0, server_renderer_exports.ssrRenderAttr)("href", __props.exportUrl)} download data-v-c529c9bd${_scopeId}>`);
										_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
											name: "export",
											size: 20
										}, null, _parent, _scopeId));
										_push(` Als CSV exportieren </a>`);
									} else _push(`<!---->`);
									_push(`</form>`);
								} else return [(0, vue_exports.createVNode)("form", {
									class: "pk-sheet",
									"aria-label": "Protokoll filtern",
									onSubmit: (0, vue_exports.withModifiers)(apply, ["prevent"])
								}, [
									(0, vue_exports.createVNode)(FilterFields_default, {
										form: form.value,
										"onUpdate:form": ($event) => form.value = $event,
										people: __props.options.people,
										areas: __props.options.areas,
										"id-prefix": "pk-s",
										"date-error": dateError.value
									}, null, 8, [
										"form",
										"onUpdate:form",
										"people",
										"areas",
										"date-error"
									]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "pk-s-reihenfolge"
									}, "Reihenfolge"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "pk-s-reihenfolge",
										"onUpdate:modelValue": ($event) => order.value = $event,
										class: "input"
									}, [(0, vue_exports.createVNode)("option", { value: "neu" }, "Neueste zuerst"), (0, vue_exports.createVNode)("option", { value: "alt" }, "Älteste zuerst")], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, order.value]])]),
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
									__props.can.export && __props.exportUrl ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("a", {
										key: 1,
										class: "btn btn--ghost btn--block",
										href: __props.exportUrl,
										download: ""
									}, [(0, vue_exports.createVNode)(AdminIcon_default, {
										name: "export",
										size: 20
									}), (0, vue_exports.createTextVNode)(" Als CSV exportieren ")], 8, ["href"])) : (0, vue_exports.createCommentVNode)("", true)
								], 32)];
							}),
							_: 1
						}, _parent, _scopeId));
						else _push(`<!---->`);
						if (__props.entries.length === 0) {
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
							_push(`<div class="pk-days"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-c529c9bd${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(days.value, (group) => {
								_push(`<section class="adm-section pk-day"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `pk-day-${group.key}`)} data-v-c529c9bd${_scopeId}><h2${(0, server_renderer_exports.ssrRenderAttr)("id", `pk-day-${group.key}`)} class="adm-section__title pk-day__title" data-v-c529c9bd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(group.label)}</h2><ol class="adm-panel pk-list" data-v-c529c9bd${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(group.entries, (entry) => {
									_push(`<li class="pk-entry" data-v-c529c9bd${_scopeId}>`);
									(0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)(hasDetails(entry) ? "button" : "div"), {
										class: ["pk-entry__row", { "pk-entry__row--button": hasDetails(entry) }],
										type: hasDetails(entry) ? "button" : void 0,
										"aria-expanded": hasDetails(entry) ? isOpen(entry.id) ? "true" : "false" : void 0,
										"aria-controls": hasDetails(entry) ? `pk-details-${entry.id}` : void 0,
										onClick: ($event) => hasDetails(entry) && toggle(entry.id)
									}, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) {
												_push(`<time class="pk-entry__time"${(0, server_renderer_exports.ssrRenderAttr)("datetime", entry.iso ?? void 0)}${(0, server_renderer_exports.ssrRenderAttr)("title", entry.at ?? void 0)} data-v-c529c9bd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.time ?? "–")}</time><span class="pk-entry__text" data-v-c529c9bd${_scopeId}><span class="pk-entry__who" data-v-c529c9bd${_scopeId}><span class="pk-entry__person" data-v-c529c9bd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.person)}</span><span class="pk-entry__area" data-v-c529c9bd${_scopeId}><span aria-hidden="true" data-v-c529c9bd${_scopeId}> · </span><span class="visually-hidden" data-v-c529c9bd${_scopeId}>, Bereich </span>${(0, server_renderer_exports.ssrInterpolate)(entry.area)}</span></span><span class="pk-entry__sentence" data-v-c529c9bd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.sentence)}</span></span>`);
												if (hasDetails(entry)) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
													class: "pk-entry__chevron",
													name: "chevron-down",
													size: 16
												}, null, _parent, _scopeId));
												else _push(`<!---->`);
											} else return [
												(0, vue_exports.createVNode)("time", {
													class: "pk-entry__time",
													datetime: entry.iso ?? void 0,
													title: entry.at ?? void 0
												}, (0, vue_exports.toDisplayString)(entry.time ?? "–"), 9, ["datetime", "title"]),
												(0, vue_exports.createVNode)("span", { class: "pk-entry__text" }, [(0, vue_exports.createVNode)("span", { class: "pk-entry__who" }, [(0, vue_exports.createVNode)("span", { class: "pk-entry__person" }, (0, vue_exports.toDisplayString)(entry.person), 1), (0, vue_exports.createVNode)("span", { class: "pk-entry__area" }, [
													(0, vue_exports.createVNode)("span", { "aria-hidden": "true" }, " · "),
													(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ", Bereich "),
													(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(entry.area), 1)
												])]), (0, vue_exports.createVNode)("span", { class: "pk-entry__sentence" }, (0, vue_exports.toDisplayString)(entry.sentence), 1)]),
												hasDetails(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
													key: 0,
													class: "pk-entry__chevron",
													name: "chevron-down",
													size: 16
												})) : (0, vue_exports.createCommentVNode)("", true)
											];
										}),
										_: 2
									}), _parent, _scopeId);
									if (hasDetails(entry)) {
										_push(`<dl${(0, server_renderer_exports.ssrRenderAttr)("id", `pk-details-${entry.id}`)} class="adm-facts pk-entry__details" style="${(0, server_renderer_exports.ssrRenderStyle)(isOpen(entry.id) ? null : { display: "none" })}" data-v-c529c9bd${_scopeId}><!--[-->`);
										(0, server_renderer_exports.ssrRenderList)(entry.changes, (change, i) => {
											_push(`<div class="adm-facts__row" data-v-c529c9bd${_scopeId}><dt data-v-c529c9bd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(change.label)}</dt><dd class="pk-change" data-v-c529c9bd${_scopeId}><span class="visually-hidden" data-v-c529c9bd${_scopeId}>vorher: </span><span class="pk-change__before" data-v-c529c9bd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(change.before)}</span><span class="pk-change__arrow" aria-hidden="true" data-v-c529c9bd${_scopeId}>→</span><span class="visually-hidden" data-v-c529c9bd${_scopeId}>, nachher: </span><span class="pk-change__after" data-v-c529c9bd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(change.after)}</span></dd></div>`);
										});
										_push(`<!--]-->`);
										if (entry.ip) _push(`<div class="adm-facts__row" data-v-c529c9bd${_scopeId}><dt data-v-c529c9bd${_scopeId}>IP-Adresse</dt><dd class="pk-entry__ip" data-v-c529c9bd${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.ip)}</dd></div>`);
										else _push(`<!---->`);
										_push(`</dl>`);
									} else _push(`<!---->`);
									_push(`</li>`);
								});
								_push(`<!--]--></ol></section>`);
							});
							_push(`<!--]-->`);
							if (__props.pagination.last > 1) {
								_push(`<nav class="pk-pages" aria-label="Seiten des Protokolls" data-v-c529c9bd${_scopeId}>`);
								if (__props.pagination.prev) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: __props.pagination.prev,
									class: "btn btn--secondary"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
												name: "chevron-left",
												size: 16
											}, null, _parent, _scopeId));
											_push(` ${(0, server_renderer_exports.ssrInterpolate)(__props.oldestFirst ? "Ältere" : "Neuere")}`);
										} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "chevron-left",
											size: 16
										}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(__props.oldestFirst ? "Ältere" : "Neuere"), 1)];
									}),
									_: 1
								}, _parent, _scopeId));
								else _push(`<span class="pk-pages__spacer" aria-hidden="true" data-v-c529c9bd${_scopeId}></span>`);
								_push(`<p class="pk-pages__where" data-v-c529c9bd${_scopeId}>Seite ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.pagination.current, 0))} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.pagination.last, 0))}</p>`);
								if (__props.pagination.next) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: __props.pagination.next,
									class: "btn btn--secondary"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push(`${(0, server_renderer_exports.ssrInterpolate)(__props.oldestFirst ? "Neuere" : "Ältere")} `);
											_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
												name: "chevron-right",
												size: 16
											}, null, _parent, _scopeId));
										} else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.oldestFirst ? "Neuere" : "Ältere") + " ", 1), (0, vue_exports.createVNode)(AdminIcon_default, {
											name: "chevron-right",
											size: 16
										})];
									}),
									_: 1
								}, _parent, _scopeId));
								else _push(`<span class="pk-pages__spacer" aria-hidden="true" data-v-c529c9bd${_scopeId}></span>`);
								_push(`</nav>`);
							} else _push(`<!---->`);
							_push(`</div>`);
						}
					} else return [
						refusals.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 0,
							class: "adm-alert",
							role: "alert"
						}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(refusals.value, (message) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: message,
								class: "pk__refusal"
							}, (0, vue_exports.toDisplayString)(message), 1);
						}), 128))])) : (0, vue_exports.createCommentVNode)("", true),
						showFilters.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("form", {
							key: 1,
							class: "pk-filters",
							action: BASE,
							method: "get",
							"aria-label": "Protokoll filtern",
							onSubmit: (0, vue_exports.withModifiers)(apply, ["prevent"])
						}, [(0, vue_exports.createVNode)("div", { class: ["pk-filters__fields", { "pk-filters__fields--range": form.value.zeitraum === "eigen" }] }, [
							(0, vue_exports.createVNode)(FilterFields_default, {
								form: form.value,
								"onUpdate:form": ($event) => form.value = $event,
								people: __props.options.people,
								areas: __props.options.areas,
								"id-prefix": "pk",
								"date-error": dateError.value
							}, null, 8, [
								"form",
								"onUpdate:form",
								"people",
								"areas",
								"date-error"
							]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "pk-reihenfolge"
							}, "Reihenfolge"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
								id: "pk-reihenfolge",
								"onUpdate:modelValue": ($event) => order.value = $event,
								class: "input"
							}, [(0, vue_exports.createVNode)("option", { value: "neu" }, "Neueste zuerst"), (0, vue_exports.createVNode)("option", { value: "alt" }, "Älteste zuerst")], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, order.value]])]),
							(0, vue_exports.createVNode)("div", { class: "pk-filters__actions" }, [(0, vue_exports.createVNode)("button", {
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
						], 2)], 32)) : (0, vue_exports.createCommentVNode)("", true),
						showFilters.value && (0, vue_exports.unref)(sheetAvailable) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 2,
							class: "pk-filterbar"
						}, [(0, vue_exports.createVNode)("button", {
							class: "btn btn--secondary",
							type: "button",
							"aria-haspopup": "dialog",
							onClick: ($event) => sheetOpen.value = true
						}, [(0, vue_exports.createVNode)(AdminIcon_default, {
							name: "filter",
							size: 20
						}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(active.value > 0 ? `Filter · ${active.value}` : "Filter"), 1)], 8, ["onClick"]), __props.filtered ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
							key: 0,
							class: "btn btn--ghost",
							type: "button",
							disabled: busy.value,
							onClick: reset
						}, "Zurücksetzen", 8, ["disabled"])) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.unref)(sheetAvailable) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(BottomSheet_default, {
							key: 3,
							id: "protokoll-filter",
							open: sheetOpen.value,
							"onUpdate:open": ($event) => sheetOpen.value = $event,
							title: "Protokoll filtern"
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("form", {
								class: "pk-sheet",
								"aria-label": "Protokoll filtern",
								onSubmit: (0, vue_exports.withModifiers)(apply, ["prevent"])
							}, [
								(0, vue_exports.createVNode)(FilterFields_default, {
									form: form.value,
									"onUpdate:form": ($event) => form.value = $event,
									people: __props.options.people,
									areas: __props.options.areas,
									"id-prefix": "pk-s",
									"date-error": dateError.value
								}, null, 8, [
									"form",
									"onUpdate:form",
									"people",
									"areas",
									"date-error"
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "pk-s-reihenfolge"
								}, "Reihenfolge"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "pk-s-reihenfolge",
									"onUpdate:modelValue": ($event) => order.value = $event,
									class: "input"
								}, [(0, vue_exports.createVNode)("option", { value: "neu" }, "Neueste zuerst"), (0, vue_exports.createVNode)("option", { value: "alt" }, "Älteste zuerst")], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, order.value]])]),
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
								__props.can.export && __props.exportUrl ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("a", {
									key: 1,
									class: "btn btn--ghost btn--block",
									href: __props.exportUrl,
									download: ""
								}, [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "export",
									size: 20
								}), (0, vue_exports.createTextVNode)(" Als CSV exportieren ")], 8, ["href"])) : (0, vue_exports.createCommentVNode)("", true)
							], 32)]),
							_: 1
						}, 8, ["open", "onUpdate:open"])) : (0, vue_exports.createCommentVNode)("", true),
						__props.entries.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 4 }, [__props.filtered ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 0,
							kind: "filtered",
							total: __props.totalAll,
							onReset: reset
						}, null, 8, ["total"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 1,
							kind: "empty",
							text: EMPTY_TEXT
						}))], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 5,
							class: "pk-days",
							"aria-busy": busy.value ? "true" : void 0
						}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(days.value, (group) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
								key: group.key,
								class: "adm-section pk-day",
								"aria-labelledby": `pk-day-${group.key}`
							}, [(0, vue_exports.createVNode)("h2", {
								id: `pk-day-${group.key}`,
								class: "adm-section__title pk-day__title"
							}, (0, vue_exports.toDisplayString)(group.label), 9, ["id"]), (0, vue_exports.createVNode)("ol", { class: "adm-panel pk-list" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(group.entries, (entry) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
									key: entry.id,
									class: "pk-entry"
								}, [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.resolveDynamicComponent)(hasDetails(entry) ? "button" : "div"), {
									class: ["pk-entry__row", { "pk-entry__row--button": hasDetails(entry) }],
									type: hasDetails(entry) ? "button" : void 0,
									"aria-expanded": hasDetails(entry) ? isOpen(entry.id) ? "true" : "false" : void 0,
									"aria-controls": hasDetails(entry) ? `pk-details-${entry.id}` : void 0,
									onClick: ($event) => hasDetails(entry) && toggle(entry.id)
								}, {
									default: (0, vue_exports.withCtx)(() => [
										(0, vue_exports.createVNode)("time", {
											class: "pk-entry__time",
											datetime: entry.iso ?? void 0,
											title: entry.at ?? void 0
										}, (0, vue_exports.toDisplayString)(entry.time ?? "–"), 9, ["datetime", "title"]),
										(0, vue_exports.createVNode)("span", { class: "pk-entry__text" }, [(0, vue_exports.createVNode)("span", { class: "pk-entry__who" }, [(0, vue_exports.createVNode)("span", { class: "pk-entry__person" }, (0, vue_exports.toDisplayString)(entry.person), 1), (0, vue_exports.createVNode)("span", { class: "pk-entry__area" }, [
											(0, vue_exports.createVNode)("span", { "aria-hidden": "true" }, " · "),
											(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ", Bereich "),
											(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(entry.area), 1)
										])]), (0, vue_exports.createVNode)("span", { class: "pk-entry__sentence" }, (0, vue_exports.toDisplayString)(entry.sentence), 1)]),
										hasDetails(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
											key: 0,
											class: "pk-entry__chevron",
											name: "chevron-down",
											size: 16
										})) : (0, vue_exports.createCommentVNode)("", true)
									]),
									_: 2
								}, 1032, [
									"class",
									"type",
									"aria-expanded",
									"aria-controls",
									"onClick"
								])), hasDetails(entry) ? (0, vue_exports.withDirectives)(((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("dl", {
									key: 0,
									id: `pk-details-${entry.id}`,
									class: "adm-facts pk-entry__details"
								}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(entry.changes, (change, i) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: `${entry.id}-${i}`,
										class: "adm-facts__row"
									}, [(0, vue_exports.createVNode)("dt", null, (0, vue_exports.toDisplayString)(change.label), 1), (0, vue_exports.createVNode)("dd", { class: "pk-change" }, [
										(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, "vorher: "),
										(0, vue_exports.createVNode)("span", { class: "pk-change__before" }, (0, vue_exports.toDisplayString)(change.before), 1),
										(0, vue_exports.createVNode)("span", {
											class: "pk-change__arrow",
											"aria-hidden": "true"
										}, "→"),
										(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ", nachher: "),
										(0, vue_exports.createVNode)("span", { class: "pk-change__after" }, (0, vue_exports.toDisplayString)(change.after), 1)
									])]);
								}), 128)), entry.ip ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "adm-facts__row"
								}, [(0, vue_exports.createVNode)("dt", null, "IP-Adresse"), (0, vue_exports.createVNode)("dd", { class: "pk-entry__ip" }, (0, vue_exports.toDisplayString)(entry.ip), 1)])) : (0, vue_exports.createCommentVNode)("", true)], 8, ["id"])), [[vue_exports.vShow, isOpen(entry.id)]]) : (0, vue_exports.createCommentVNode)("", true)]);
							}), 128))])], 8, ["aria-labelledby"]);
						}), 128)), __props.pagination.last > 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("nav", {
							key: 0,
							class: "pk-pages",
							"aria-label": "Seiten des Protokolls"
						}, [
							__props.pagination.prev ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
								key: 0,
								href: __props.pagination.prev,
								class: "btn btn--secondary"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "chevron-left",
									size: 16
								}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(__props.oldestFirst ? "Ältere" : "Neuere"), 1)]),
								_: 1
							}, 8, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 1,
								class: "pk-pages__spacer",
								"aria-hidden": "true"
							})),
							(0, vue_exports.createVNode)("p", { class: "pk-pages__where" }, "Seite " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.pagination.current, 0)) + " von " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.pagination.last, 0)), 1),
							__props.pagination.next ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
								key: 2,
								href: __props.pagination.next,
								class: "btn btn--secondary"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.oldestFirst ? "Neuere" : "Ältere") + " ", 1), (0, vue_exports.createVNode)(AdminIcon_default, {
									name: "chevron-right",
									size: 16
								})]),
								_: 1
							}, 8, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 3,
								class: "pk-pages__spacer",
								"aria-hidden": "true"
							}))
						])) : (0, vue_exports.createCommentVNode)("", true)], 8, ["aria-busy"]))
					];
				}),
				_: 2
			}, [__props.can.export && __props.exportUrl ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<a class="btn btn--secondary pk-export"${(0, server_renderer_exports.ssrRenderAttr)("href", __props.exportUrl)} download data-v-c529c9bd${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: "export",
							size: 20
						}, null, _parent, _scopeId));
						_push(` Als CSV exportieren </a>`);
					} else return [(0, vue_exports.createVNode)("a", {
						class: "btn btn--secondary pk-export",
						href: __props.exportUrl,
						download: ""
					}, [(0, vue_exports.createVNode)(AdminIcon_default, {
						name: "export",
						size: 20
					}), (0, vue_exports.createTextVNode)(" Als CSV exportieren ")], 8, ["href"])];
				}),
				key: "0"
			} : void 0]), _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Protokoll/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Protokoll/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-c529c9bd"]]);
//#endregion
export { Index_default as default };
