import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-rIU_td1t.js";
import { a as link_default, c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-COuF1lMZ.js";
import { t as formatMoney } from "./num-Br8qlecZ.js";
import { n as decimal, s as withUnit } from "./format-6R0uUMt3.js";
import { t as AdminState_default } from "./AdminState-BXpi0AIC.js";
import { t as AdminSortHeader_default } from "./AdminSortHeader-BRAD0j7W.js";
import { n as sortQuery, t as nextSort } from "./adminSort-D4HWGPab.js";
//#region resources/js/Pages/Admin/Reifen/Index.vue?vue&type=script&setup=true&lang.ts
var BASE = "/admin/reifen";
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		tyres: {},
		filters: {},
		options: {},
		missingLabels: {},
		filtered: { type: Boolean },
		query: {},
		totalAll: {},
		pagination: {},
		can: {}
	},
	setup(__props) {
		/**
		* Katalog › Reifen (his admin item 10, D-302): every tyre the shop can put on a Felge — one size of one profile per row —
		* and whether the shop offers it now. Offered means available (D-301) and its EU label complete on record (D-303); only
		* the exception is tagged, the normal state is plain text. A tyre whose label is still missing is kept and listed for the
		* backfill, one click away.
		*/
		const props = __props;
		const form = (0, vue_exports.reactive)({
			q: props.filters.q,
			marke: props.filters.marke,
			saison: props.filters.saison,
			zoll: props.filters.zoll,
			stand: props.filters.stand
		});
		const PLAIN = {
			sort: "reifen",
			richtung: "auf"
		};
		const order = (0, vue_exports.computed)(() => ({
			sort: props.filters.sort,
			richtung: props.filters.richtung
		}));
		function sortBy(column) {
			const rest = Object.fromEntries(Object.entries(props.query).filter(([key]) => key !== "sort" && key !== "richtung"));
			router.get(BASE, {
				...rest,
				...sortQuery(nextSort(order.value, column), PLAIN)
			}, {
				preserveScroll: true,
				preserveState: true
			});
		}
		const context = (0, vue_exports.computed)(() => {
			const text = `${decimal(props.pagination.total, 0)} Reifen`;
			return props.filtered ? `${text} · gefiltert` : text;
		});
		const FILTER_KEYS = [
			"q",
			"marke",
			"saison",
			"zoll",
			"stand",
			"sort",
			"richtung",
			"seite"
		];
		const page = usePage();
		const refusals = (0, vue_exports.computed)(() => {
			const raw = page.props.errors;
			if (raw === null || typeof raw !== "object") return [];
			return Object.entries(raw).filter(([key]) => FILTER_KEYS.includes(key)).map(([, message]) => message).filter((m) => typeof m === "string" && m !== "");
		});
		function query() {
			const out = {};
			for (const [key, value] of Object.entries(form)) if (value.trim() !== "") out[key] = value.trim();
			return {
				...out,
				...sortQuery(order.value, PLAIN)
			};
		}
		function apply() {
			router.get(BASE, query(), {
				preserveScroll: true,
				preserveState: true
			});
		}
		function reset() {
			Object.assign(form, {
				q: "",
				marke: "",
				saison: "",
				zoll: "",
				stand: ""
			});
			router.get(BASE, sortQuery(order.value, PLAIN), {
				preserveScroll: true,
				preserveState: true
			});
		}
		/** `B · A · 71 dB (B)` — the label's classes in the order the printed label stands them. */
		function labelLine(row) {
			const label = row.label;
			return label === null ? "" : `${label.fuel} · ${label.wet} · ${withUnit(label.noiseDb, "dB")} (${label.noiseClass})`;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Reifen",
				context: context.value
			}, _attrs), (0, vue_exports.createSlots)({
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="adm-note rf-intro" data-v-3c7d32a8${_scopeId}> Reifen verkauft der Shop als Komplettrad, nie allein. Angeboten wird ein Reifen auf Felgen, deren Gutachten seine Größe für das Fahrzeug des Kunden freigibt. Dafür muss er verfügbar und sein EU-Reifenlabel vollständig eingetragen sein. </p>`);
						if (refusals.value.length) {
							_push(`<div class="adm-alert" role="alert" data-v-3c7d32a8${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(refusals.value, (message) => {
								_push(`<p data-v-3c7d32a8${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(message)}</p>`);
							});
							_push(`<!--]--></div>`);
						} else _push(`<!---->`);
						if (__props.missingLabels > 0 && __props.filters.stand !== "label-fehlt") {
							_push(`<p class="adm-note rf-backfill" data-v-3c7d32a8${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.missingLabels, 0))} ${(0, server_renderer_exports.ssrInterpolate)(__props.missingLabels === 1 ? "Reifen ist" : "Reifen sind")} ohne vollständiges EU-Reifenlabel und ${(0, server_renderer_exports.ssrInterpolate)(__props.missingLabels === 1 ? "wird" : "werden")} deshalb nicht angeboten. `);
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/admin/reifen?stand=label-fehlt" }, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(__props.missingLabels === 1 ? "Nur diesen anzeigen" : "Nur diese anzeigen")}`);
									else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.missingLabels === 1 ? "Nur diesen anzeigen" : "Nur diese anzeigen"), 1)];
								}),
								_: 1
							}, _parent, _scopeId));
							_push(`</p>`);
						} else _push(`<!---->`);
						_push(`<form class="rf-search" role="search"${(0, server_renderer_exports.ssrRenderAttr)("action", BASE)} method="get" data-v-3c7d32a8${_scopeId}><div class="form-field rf-search__q" data-v-3c7d32a8${_scopeId}><label class="form-field__label" for="rf-q" data-v-3c7d32a8${_scopeId}>Suche</label><input id="rf-q"${(0, server_renderer_exports.ssrRenderAttr)("value", form.q)} class="input" type="search" name="q" maxlength="80" placeholder="Marke, Profil oder Größe wie 225/45 R18" autocomplete="off" data-v-3c7d32a8${_scopeId}></div><div class="form-field" data-v-3c7d32a8${_scopeId}><label class="form-field__label" for="rf-marke" data-v-3c7d32a8${_scopeId}>Marke</label><select id="rf-marke" class="input" data-v-3c7d32a8${_scopeId}><option value="" data-v-3c7d32a8${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.marke) ? (0, server_renderer_exports.ssrLooseContain)(form.marke, "") : (0, server_renderer_exports.ssrLooseEqual)(form.marke, "")) ? " selected" : ""}${_scopeId}>Alle</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.options.brands, (brand) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", brand.value)} data-v-3c7d32a8${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.marke) ? (0, server_renderer_exports.ssrLooseContain)(form.marke, brand.value) : (0, server_renderer_exports.ssrLooseEqual)(form.marke, brand.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(brand.label)}</option>`);
						});
						_push(`<!--]--></select></div><div class="form-field" data-v-3c7d32a8${_scopeId}><label class="form-field__label" for="rf-saison" data-v-3c7d32a8${_scopeId}>Saison</label><select id="rf-saison" class="input" data-v-3c7d32a8${_scopeId}><option value="" data-v-3c7d32a8${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.saison) ? (0, server_renderer_exports.ssrLooseContain)(form.saison, "") : (0, server_renderer_exports.ssrLooseEqual)(form.saison, "")) ? " selected" : ""}${_scopeId}>Alle</option><option value="sommer" data-v-3c7d32a8${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.saison) ? (0, server_renderer_exports.ssrLooseContain)(form.saison, "sommer") : (0, server_renderer_exports.ssrLooseEqual)(form.saison, "sommer")) ? " selected" : ""}${_scopeId}>Sommerreifen</option><option value="winter" data-v-3c7d32a8${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.saison) ? (0, server_renderer_exports.ssrLooseContain)(form.saison, "winter") : (0, server_renderer_exports.ssrLooseEqual)(form.saison, "winter")) ? " selected" : ""}${_scopeId}>Winterreifen</option><option value="ganzjahres" data-v-3c7d32a8${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.saison) ? (0, server_renderer_exports.ssrLooseContain)(form.saison, "ganzjahres") : (0, server_renderer_exports.ssrLooseEqual)(form.saison, "ganzjahres")) ? " selected" : ""}${_scopeId}>Ganzjahresreifen</option></select></div><div class="form-field" data-v-3c7d32a8${_scopeId}><label class="form-field__label" for="rf-zoll" data-v-3c7d32a8${_scopeId}>Durchmesser</label><select id="rf-zoll" class="input" data-v-3c7d32a8${_scopeId}><option value="" data-v-3c7d32a8${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.zoll) ? (0, server_renderer_exports.ssrLooseContain)(form.zoll, "") : (0, server_renderer_exports.ssrLooseEqual)(form.zoll, "")) ? " selected" : ""}${_scopeId}>Alle</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.options.diameters, (d) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", d.value)} data-v-3c7d32a8${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.zoll) ? (0, server_renderer_exports.ssrLooseContain)(form.zoll, d.value) : (0, server_renderer_exports.ssrLooseEqual)(form.zoll, d.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(d.label)}</option>`);
						});
						_push(`<!--]--></select></div><div class="form-field" data-v-3c7d32a8${_scopeId}><label class="form-field__label" for="rf-stand" data-v-3c7d32a8${_scopeId}>Stand</label><select id="rf-stand" class="input" data-v-3c7d32a8${_scopeId}><option value="" data-v-3c7d32a8${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.stand) ? (0, server_renderer_exports.ssrLooseContain)(form.stand, "") : (0, server_renderer_exports.ssrLooseEqual)(form.stand, "")) ? " selected" : ""}${_scopeId}>Alle</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.options.stands, (s) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", s.value)} data-v-3c7d32a8${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.stand) ? (0, server_renderer_exports.ssrLooseContain)(form.stand, s.value) : (0, server_renderer_exports.ssrLooseEqual)(form.stand, s.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(s.label)}</option>`);
						});
						_push(`<!--]--></select></div><div class="rf-search__actions" data-v-3c7d32a8${_scopeId}><button class="btn btn--secondary" type="submit" data-v-3c7d32a8${_scopeId}>Suchen</button>`);
						if (__props.filtered) _push(`<button class="btn btn--ghost" type="button" data-v-3c7d32a8${_scopeId}>Zurücksetzen</button>`);
						else _push(`<!---->`);
						_push(`</div></form>`);
						if (__props.tyres.length === 0 && __props.filtered) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "filtered",
							total: __props.totalAll,
							onReset: reset
						}, null, _parent, _scopeId));
						else if (__props.tyres.length === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Reifen erscheinen hier, sobald du einen anlegst – jede Größe eines Profils als eigenen Reifen, mit ihrem EU-Reifenlabel."
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									if (__props.can.create) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
										href: "/admin/reifen/neu",
										class: "btn btn--primary"
									}, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) _push(`Neuer Reifen`);
											else return [(0, vue_exports.createTextVNode)("Neuer Reifen")];
										}),
										_: 1
									}, _parent, _scopeId));
									else _push(`<!---->`);
								} else return [__props.can.create ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
									key: 0,
									href: "/admin/reifen/neu",
									class: "btn btn--primary"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Neuer Reifen")]),
									_: 1
								})) : (0, vue_exports.createCommentVNode)("", true)];
							}),
							_: 1
						}, _parent, _scopeId));
						else {
							_push(`<!--[--><div class="adm-panel" data-v-3c7d32a8${_scopeId}><table class="adm-table" data-v-3c7d32a8${_scopeId}><caption class="visually-hidden" data-v-3c7d32a8${_scopeId}>Reifen, ${(0, server_renderer_exports.ssrInterpolate)(context.value)}</caption><thead data-v-3c7d32a8${_scopeId}><tr data-v-3c7d32a8${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminSortHeader_default, {
								label: "Reifen",
								column: "reifen",
								sort: __props.filters.sort,
								richtung: __props.filters.richtung,
								onSort: sortBy
							}, null, _parent, _scopeId));
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminSortHeader_default, {
								label: "Größe",
								column: "groesse",
								sort: __props.filters.sort,
								richtung: __props.filters.richtung,
								onSort: sortBy
							}, null, _parent, _scopeId));
							_push(`<th scope="col" data-v-3c7d32a8${_scopeId}>EU-Reifenlabel</th>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminSortHeader_default, {
								label: "Preis",
								column: "preis",
								sort: __props.filters.sort,
								richtung: __props.filters.richtung,
								num: "",
								onSort: sortBy
							}, null, _parent, _scopeId));
							_push(`<th scope="col" data-v-3c7d32a8${_scopeId}>Stand</th></tr></thead><tbody data-v-3c7d32a8${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.tyres, (tyre) => {
								_push(`<tr data-v-3c7d32a8${_scopeId}><td data-label="Reifen" data-v-3c7d32a8${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: tyre.href,
									class: "rf-name"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`<span class="rf-brand" data-v-3c7d32a8${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(tyre.brand)}</span> ${(0, server_renderer_exports.ssrInterpolate)(tyre.name)}`);
										else return [(0, vue_exports.createVNode)("span", { class: "rf-brand" }, (0, vue_exports.toDisplayString)(tyre.brand), 1), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(tyre.name), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								if (tyre.demo) _push(`<span class="adm-tag adm-tag--neutral adm-demo" data-v-3c7d32a8${_scopeId}>Demodaten</span>`);
								else _push(`<!---->`);
								_push(`<span class="rf-sub" data-v-3c7d32a8${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(tyre.season)}</span></td><td data-label="Größe" class="rf-size" data-v-3c7d32a8${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(tyre.size)}</td><td data-label="EU-Reifenlabel" data-v-3c7d32a8${_scopeId}>`);
								if (tyre.label) {
									_push(`<!--[--><span class="rf-label" data-v-3c7d32a8${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(labelLine(tyre))}</span>`);
									if (tyre.label.snow || tyre.label.ice) _push(`<span class="rf-sub" data-v-3c7d32a8${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)([tyre.label.snow ? "Schneegriffigkeit" : "", tyre.label.ice ? "Eisgriffigkeit" : ""].filter(Boolean).join(" · "))}</span>`);
									else _push(`<!---->`);
									_push(`<!--]-->`);
								} else if (tyre.demo) _push(`<!--[-->–<!--]-->`);
								else _push(`<span class="adm-tag adm-tag--warn"${(0, server_renderer_exports.ssrRenderAttr)("title", `Noch nicht eingetragen: ${tyre.missingLabel.join(", ")}`)} data-v-3c7d32a8${_scopeId}>Unvollständig</span>`);
								_push(`</td><td data-label="Preis" class="num" data-v-3c7d32a8${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(tyre.priceCents))}</td><td data-label="Stand" data-phone="status" data-v-3c7d32a8${_scopeId}>`);
								if (tyre.demo) _push(`<span class="rf-quiet" data-v-3c7d32a8${_scopeId}>Demodaten</span>`);
								else if (!tyre.available) _push(`<span class="adm-tag adm-tag--neutral" data-v-3c7d32a8${_scopeId}>Nicht verfügbar</span>`);
								else if (!tyre.offered) _push(`<span class="adm-tag adm-tag--warn" data-v-3c7d32a8${_scopeId}>Nicht im Shop</span>`);
								else _push(`<!--[-->Im Shop<!--]-->`);
								_push(`</td></tr>`);
							});
							_push(`<!--]--></tbody></table></div>`);
							if (__props.pagination.last > 1) {
								_push(`<nav class="rf-pages" aria-label="Seiten der Reifen" data-v-3c7d32a8${_scopeId}>`);
								if (__props.pagination.prev) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: __props.pagination.prev,
									class: "btn btn--secondary",
									"preserve-scroll": ""
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
								else _push(`<span aria-hidden="true" data-v-3c7d32a8${_scopeId}></span>`);
								_push(`<p class="rf-pages__where" data-v-3c7d32a8${_scopeId}>Seite ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.pagination.current, 0))} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.pagination.last, 0))}</p>`);
								if (__props.pagination.next) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: __props.pagination.next,
									class: "btn btn--secondary",
									"preserve-scroll": ""
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
								else _push(`<span aria-hidden="true" data-v-3c7d32a8${_scopeId}></span>`);
								_push(`</nav>`);
							} else _push(`<!---->`);
							_push(`<!--]-->`);
						}
					} else return [
						(0, vue_exports.createVNode)("p", { class: "adm-note rf-intro" }, " Reifen verkauft der Shop als Komplettrad, nie allein. Angeboten wird ein Reifen auf Felgen, deren Gutachten seine Größe für das Fahrzeug des Kunden freigibt. Dafür muss er verfügbar und sein EU-Reifenlabel vollständig eingetragen sein. "),
						refusals.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 0,
							class: "adm-alert",
							role: "alert"
						}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(refusals.value, (message) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", { key: message }, (0, vue_exports.toDisplayString)(message), 1);
						}), 128))])) : (0, vue_exports.createCommentVNode)("", true),
						__props.missingLabels > 0 && __props.filters.stand !== "label-fehlt" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 1,
							class: "adm-note rf-backfill"
						}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.missingLabels, 0)) + " " + (0, vue_exports.toDisplayString)(__props.missingLabels === 1 ? "Reifen ist" : "Reifen sind") + " ohne vollständiges EU-Reifenlabel und " + (0, vue_exports.toDisplayString)(__props.missingLabels === 1 ? "wird" : "werden") + " deshalb nicht angeboten. ", 1), (0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), { href: "/admin/reifen?stand=label-fehlt" }, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.missingLabels === 1 ? "Nur diesen anzeigen" : "Nur diese anzeigen"), 1)]),
							_: 1
						})])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("form", {
							class: "rf-search",
							role: "search",
							action: BASE,
							method: "get",
							onSubmit: (0, vue_exports.withModifiers)(apply, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("div", { class: "form-field rf-search__q" }, [(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "rf-q"
							}, "Suche"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "rf-q",
								"onUpdate:modelValue": ($event) => form.q = $event,
								class: "input",
								type: "search",
								name: "q",
								maxlength: "80",
								placeholder: "Marke, Profil oder Größe wie 225/45 R18",
								autocomplete: "off"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, form.q]])]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "rf-marke"
							}, "Marke"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
								id: "rf-marke",
								"onUpdate:modelValue": ($event) => form.marke = $event,
								class: "input"
							}, [(0, vue_exports.createVNode)("option", { value: "" }, "Alle"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.options.brands, (brand) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
									key: brand.value,
									value: brand.value
								}, (0, vue_exports.toDisplayString)(brand.label), 9, ["value"]);
							}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, form.marke]])]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "rf-saison"
							}, "Saison"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
								id: "rf-saison",
								"onUpdate:modelValue": ($event) => form.saison = $event,
								class: "input"
							}, [
								(0, vue_exports.createVNode)("option", { value: "" }, "Alle"),
								(0, vue_exports.createVNode)("option", { value: "sommer" }, "Sommerreifen"),
								(0, vue_exports.createVNode)("option", { value: "winter" }, "Winterreifen"),
								(0, vue_exports.createVNode)("option", { value: "ganzjahres" }, "Ganzjahresreifen")
							], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, form.saison]])]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "rf-zoll"
							}, "Durchmesser"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
								id: "rf-zoll",
								"onUpdate:modelValue": ($event) => form.zoll = $event,
								class: "input"
							}, [(0, vue_exports.createVNode)("option", { value: "" }, "Alle"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.options.diameters, (d) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
									key: d.value,
									value: d.value
								}, (0, vue_exports.toDisplayString)(d.label), 9, ["value"]);
							}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, form.zoll]])]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "rf-stand"
							}, "Stand"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
								id: "rf-stand",
								"onUpdate:modelValue": ($event) => form.stand = $event,
								class: "input"
							}, [(0, vue_exports.createVNode)("option", { value: "" }, "Alle"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.options.stands, (s) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
									key: s.value,
									value: s.value
								}, (0, vue_exports.toDisplayString)(s.label), 9, ["value"]);
							}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, form.stand]])]),
							(0, vue_exports.createVNode)("div", { class: "rf-search__actions" }, [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "submit"
							}, "Suchen"), __props.filtered ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
								key: 0,
								class: "btn btn--ghost",
								type: "button",
								onClick: reset
							}, "Zurücksetzen")) : (0, vue_exports.createCommentVNode)("", true)])
						], 32),
						__props.tyres.length === 0 && __props.filtered ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 2,
							kind: "filtered",
							total: __props.totalAll,
							onReset: reset
						}, null, 8, ["total"])) : __props.tyres.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 3,
							kind: "empty",
							text: "Reifen erscheinen hier, sobald du einen anlegst – jede Größe eines Profils als eigenen Reifen, mit ihrem EU-Reifenlabel."
						}, {
							default: (0, vue_exports.withCtx)(() => [__props.can.create ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
								key: 0,
								href: "/admin/reifen/neu",
								class: "btn btn--primary"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Neuer Reifen")]),
								_: 1
							})) : (0, vue_exports.createCommentVNode)("", true)]),
							_: 1
						})) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 4 }, [(0, vue_exports.createVNode)("div", { class: "adm-panel" }, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [
							(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Reifen, " + (0, vue_exports.toDisplayString)(context.value), 1),
							(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
								(0, vue_exports.createVNode)(AdminSortHeader_default, {
									label: "Reifen",
									column: "reifen",
									sort: __props.filters.sort,
									richtung: __props.filters.richtung,
									onSort: sortBy
								}, null, 8, ["sort", "richtung"]),
								(0, vue_exports.createVNode)(AdminSortHeader_default, {
									label: "Größe",
									column: "groesse",
									sort: __props.filters.sort,
									richtung: __props.filters.richtung,
									onSort: sortBy
								}, null, 8, ["sort", "richtung"]),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "EU-Reifenlabel"),
								(0, vue_exports.createVNode)(AdminSortHeader_default, {
									label: "Preis",
									column: "preis",
									sort: __props.filters.sort,
									richtung: __props.filters.richtung,
									num: "",
									onSort: sortBy
								}, null, 8, ["sort", "richtung"]),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Stand")
							])]),
							(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.tyres, (tyre) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: tyre.id }, [
									(0, vue_exports.createVNode)("td", { "data-label": "Reifen" }, [
										(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
											href: tyre.href,
											class: "rf-name"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "rf-brand" }, (0, vue_exports.toDisplayString)(tyre.brand), 1), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(tyre.name), 1)]),
											_: 2
										}, 1032, ["href"]),
										tyre.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: "adm-tag adm-tag--neutral adm-demo"
										}, "Demodaten")) : (0, vue_exports.createCommentVNode)("", true),
										(0, vue_exports.createVNode)("span", { class: "rf-sub" }, (0, vue_exports.toDisplayString)(tyre.season), 1)
									]),
									(0, vue_exports.createVNode)("td", {
										"data-label": "Größe",
										class: "rf-size"
									}, (0, vue_exports.toDisplayString)(tyre.size), 1),
									(0, vue_exports.createVNode)("td", { "data-label": "EU-Reifenlabel" }, [tyre.label ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)("span", { class: "rf-label" }, (0, vue_exports.toDisplayString)(labelLine(tyre)), 1), tyre.label.snow || tyre.label.ice ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "rf-sub"
									}, (0, vue_exports.toDisplayString)([tyre.label.snow ? "Schneegriffigkeit" : "", tyre.label.ice ? "Eisgriffigkeit" : ""].filter(Boolean).join(" · ")), 1)) : (0, vue_exports.createCommentVNode)("", true)], 64)) : tyre.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("–")], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 2,
										class: "adm-tag adm-tag--warn",
										title: `Noch nicht eingetragen: ${tyre.missingLabel.join(", ")}`
									}, "Unvollständig", 8, ["title"]))]),
									(0, vue_exports.createVNode)("td", {
										"data-label": "Preis",
										class: "num"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(tyre.priceCents)), 1),
									(0, vue_exports.createVNode)("td", {
										"data-label": "Stand",
										"data-phone": "status"
									}, [tyre.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "rf-quiet"
									}, "Demodaten")) : !tyre.available ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 1,
										class: "adm-tag adm-tag--neutral"
									}, "Nicht verfügbar")) : !tyre.offered ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 2,
										class: "adm-tag adm-tag--warn"
									}, "Nicht im Shop")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createTextVNode)("Im Shop")], 64))])
								]);
							}), 128))])
						])]), __props.pagination.last > 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("nav", {
							key: 0,
							class: "rf-pages",
							"aria-label": "Seiten der Reifen"
						}, [
							__props.pagination.prev ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
								key: 0,
								href: __props.pagination.prev,
								class: "btn btn--secondary",
								"preserve-scroll": ""
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "chevron-left",
									size: 16
								}), (0, vue_exports.createTextVNode)(" Vorherige ")]),
								_: 1
							}, 8, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 1,
								"aria-hidden": "true"
							})),
							(0, vue_exports.createVNode)("p", { class: "rf-pages__where" }, "Seite " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.pagination.current, 0)) + " von " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.pagination.last, 0)), 1),
							__props.pagination.next ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
								key: 2,
								href: __props.pagination.next,
								class: "btn btn--secondary",
								"preserve-scroll": ""
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)(" Nächste "), (0, vue_exports.createVNode)(AdminIcon_default, {
									name: "chevron-right",
									size: 16
								})]),
								_: 1
							}, 8, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 3,
								"aria-hidden": "true"
							}))
						])) : (0, vue_exports.createCommentVNode)("", true)], 64))
					];
				}),
				_: 2
			}, [__props.can.create ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: "/admin/reifen/neu",
						class: "btn btn--primary"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
									name: "plus",
									size: 20
								}, null, _parent, _scopeId));
								_push(` Neuer Reifen `);
							} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "plus",
								size: 20
							}), (0, vue_exports.createTextVNode)(" Neuer Reifen ")];
						}),
						_: 1
					}, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
						href: "/admin/reifen/neu",
						class: "btn btn--primary"
					}, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
							name: "plus",
							size: 20
						}), (0, vue_exports.createTextVNode)(" Neuer Reifen ")]),
						_: 1
					})];
				}),
				key: "0"
			} : void 0]), _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Reifen/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Reifen/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-3c7d32a8"]]);
//#endregion
export { Index_default as default };
