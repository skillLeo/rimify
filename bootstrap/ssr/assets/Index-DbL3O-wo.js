import { n as PeriodSwitcher_default, t as StateChip_default } from "./StateChip-BHuTrZuy.js";
import { a as DropdownMenuRoot_default, i as DropdownMenuContent_default, n as DropdownMenuPortal_default, r as DropdownMenuItem_default, t as DropdownMenuTrigger_default } from "./DropdownMenuTrigger-lkcRFLT8.js";
import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BeseBJf_.js";
import { t as DropdownMenuSeparator_default } from "./DropdownMenuSeparator-GAJuN4lI.js";
import { c as router, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { t as AdminState_default } from "./AdminState-QyYV7E7y.js";
import { t as ListPager_default } from "./ListPager-CZGH48Xr.js";
import { t as RequestDialog_default } from "./RequestDialog-IRzq31lk.js";
//#region resources/js/Pages/Admin/Nachfrage/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		period: {},
		state: {},
		search: {},
		demand: {},
		searches: {},
		weighting: {},
		brands: {},
		pagination: {},
		can: {}
	},
	setup(__props) {
		/**
		* Übersicht › Nachfrage: every car asked for in the Zeitraum that the shop has no approved wheel for,
		* the most in demand first — the list of which Gutachten to obtain next.
		*
		* The Zeitraum is the Übersicht's own (same switcher, same memory). Each gap says how often it was
		* asked for, how many people are waiting, and what the team has done: „Gutachten anfordern“ prepares
		* the e-mail to a wheel brand and records that it went; „Als beobachtet markieren“ says it was seen.
		* A role without the Gutachten edit right reads the list and nothing more.
		*/
		const props = __props;
		const FILTERS = [
			{
				key: "offen",
				label: "Offen"
			},
			{
				key: "beobachtet",
				label: "Beobachtet"
			},
			{
				key: "angefordert",
				label: "Angefordert"
			},
			{
				key: "alle",
				label: "Alle"
			}
		];
		const EMPTY = {
			offen: "Keine offene Lücke in diesem Zeitraum. Fragt jemand nach einem Auto, für das der Shop keine Felge zeigen kann, steht es hier.",
			beobachtet: "Keine Lücke ist als beobachtet markiert.",
			angefordert: "Für keine Lücke wurde bisher ein Gutachten angefordert.",
			alle: "In diesem Zeitraum hat niemand nach einem Auto gefragt, für das der Shop keine Felge zeigen kann."
		};
		const summary = (0, vue_exports.computed)(() => {
			const d = props.demand;
			const gaps = d.counts.alle === 1 ? "1 Lücke" : `${decimal(d.counts.alle, 0)} Lücken`;
			const waiting = d.waiting === 0 ? "niemand wartet" : d.waiting === 1 ? "1 Person wartet" : `${decimal(d.waiting, 0)} Personen warten`;
			return `${gaps} · ${decimal(d.asks, 0)}-mal gefragt · ${waiting}`;
		});
		const busy = (0, vue_exports.ref)(null);
		const requesting = (0, vue_exports.ref)(null);
		const dialogOpen = (0, vue_exports.ref)(false);
		/** The row the Übersicht's widget opened, lit until the reader moves on — the first click or key. */
		const target = (0, vue_exports.ref)(null);
		function moveOn() {
			target.value = null;
			window.removeEventListener("pointerdown", moveOn);
			window.removeEventListener("keydown", moveOn);
		}
		(0, vue_exports.onMounted)(() => {
			const id = window.location.hash.slice(1);
			if (id.startsWith("gap-")) {
				target.value = id;
				document.getElementById(id)?.scrollIntoView({ block: "center" });
				window.addEventListener("pointerdown", moveOn, { once: true });
				window.addEventListener("keydown", moveOn, { once: true });
			}
		});
		(0, vue_exports.onBeforeUnmount)(moveOn);
		function anchor(key) {
			return `gap-${key.replace(":", "-")}`;
		}
		/** The Zeitraum on screen, sent with every change of the list, so both always count the same days. */
		function shownPeriod() {
			return props.period.key === "eigen" ? {
				zeitraum: "eigen",
				von: props.period.von,
				bis: props.period.bis
			} : { zeitraum: props.period.key };
		}
		function show(stand) {
			if (stand !== props.state) router.get("/admin/nachfrage", {
				...shownPeriod(),
				stand,
				...searched()
			}, {
				preserveScroll: true,
				preserveState: true
			});
		}
		const q = (0, vue_exports.ref)(props.search ?? "");
		function searched() {
			return q.value.trim() === "" ? {} : { q: q.value.trim() };
		}
		function runSearch() {
			router.get("/admin/nachfrage", {
				...shownPeriod(),
				...props.state === "offen" ? {} : { stand: props.state },
				...searched()
			}, {
				preserveScroll: true,
				preserveState: true
			});
		}
		function resetSearch() {
			q.value = "";
			runSearch();
		}
		const table = (0, vue_exports.ref)(null);
		const filters = (0, vue_exports.ref)(null);
		function keepFocus(index) {
			(0, vue_exports.nextTick)(() => {
				const active = document.activeElement;
				if (active instanceof HTMLElement && active !== document.body && active.isConnected && !active.closest("[role=\"dialog\"]")) return;
				const rows = table.value?.querySelectorAll("tbody tr") ?? [];
				(rows[Math.min(index, rows.length - 1)]?.querySelector("button, a[href]") ?? filters.value?.querySelector("[aria-pressed=\"true\"]"))?.focus();
			});
		}
		/** One mark at a time: a second press while the first is on its way (a double-click) does nothing. */
		function mark(gap, state, brandId = null) {
			if (busy.value !== null) return;
			const index = props.demand.rows.findIndex((row) => row.key === gap.key);
			busy.value = gap.key;
			router.post("/admin/nachfrage/markierung", {
				key: gap.key,
				state,
				...brandId === null ? {} : { brand_id: brandId }
			}, {
				preserveScroll: true,
				onSuccess: () => keepFocus(index),
				onFinish: () => busy.value = null
			});
		}
		function unmark(gap) {
			if (busy.value !== null) return;
			const index = props.demand.rows.findIndex((row) => row.key === gap.key);
			busy.value = gap.key;
			router.delete("/admin/nachfrage/markierung", {
				data: { key: gap.key },
				preserveScroll: true,
				onSuccess: () => keepFocus(index),
				onFinish: () => busy.value = null
			});
		}
		function request(gap) {
			requesting.value = gap;
			dialogOpen.value = true;
		}
		function chip(gap) {
			return {
				label: gap.mark?.state === "requested" ? "Angefordert" : gap.mark?.state === "watched" ? "Beobachtet" : "Offen",
				tone: "neutral"
			};
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Nachfrage-Lücken",
				dashboard: "",
				context: summary.value
			}, _attrs), {
				primary: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(PeriodSwitcher_default, {
						period: __props.period,
						"export-url": null,
						base: "/admin/nachfrage",
						comparable: false,
						keep: {
							stand: __props.state,
							...(__props.search ?? "") === "" ? {} : { q: __props.search ?? "" }
						}
					}, null, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)(PeriodSwitcher_default, {
						period: __props.period,
						"export-url": null,
						base: "/admin/nachfrage",
						comparable: false,
						keep: {
							stand: __props.state,
							...(__props.search ?? "") === "" ? {} : { q: __props.search ?? "" }
						}
					}, null, 8, ["period", "keep"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="nf" data-v-a4da744d${_scopeId}><p class="nf__period" data-v-a4da744d${_scopeId}><span class="nf__period-name" data-v-a4da744d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.period.label)}</span><span data-v-a4da744d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.period.range)}</span></p><div class="adm-filters" data-v-a4da744d${_scopeId}><div class="adm-filter" role="group" aria-label="Stand" data-v-a4da744d${_scopeId}><span class="adm-filter__label" aria-hidden="true" data-v-a4da744d${_scopeId}>Stand</span><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(FILTERS, (f) => {
							_push(`<button class="adm-chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", __props.state === f.key)} data-v-a4da744d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(f.label)} <span class="adm-chip__n" data-v-a4da744d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.demand.counts[f.key], 0))}</span></button>`);
						});
						_push(`<!--]--></div></div><form class="nf__search" role="search" data-v-a4da744d${_scopeId}><div class="form-field" data-v-a4da744d${_scopeId}><label class="form-field__label" for="nf-q" data-v-a4da744d${_scopeId}>Suchen</label><input id="nf-q"${(0, server_renderer_exports.ssrRenderAttr)("value", q.value)} class="input" type="search" maxlength="100" autocomplete="off" placeholder="Fahrzeug oder HSN/TSN" data-v-a4da744d${_scopeId}></div><button class="btn btn--secondary" type="submit" data-v-a4da744d${_scopeId}>Suchen</button></form>`);
						if ((__props.search ?? "") !== "" && __props.pagination.total > 0) _push(`<p class="adm-note nf__found" data-v-a4da744d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.pagination.total === 1 ? "1 Lücke gefunden." : `${(0, vue_exports.unref)(decimal)(__props.pagination.total, 0)} Lücken gefunden.`)}</p>`);
						else _push(`<!---->`);
						_push(`<p class="nf__how" data-v-a4da744d${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: "info",
							size: 16
						}, null, _parent, _scopeId));
						_push(`<span data-v-a4da744d${_scopeId}> So entsteht die Reihenfolge: Jede Anfrage zählt, eine von vor ${(0, server_renderer_exports.ssrInterpolate)(__props.weighting.halfLife)} Tagen halb so viel wie eine von heute. Wer auf eine Nachricht wartet, zählt ${(0, server_renderer_exports.ssrInterpolate)(__props.weighting.waiting === 3 ? "dreifach" : `${__props.weighting.waiting}-fach`)}. </span></p>`);
						if (__props.demand.rows.length) {
							_push(`<div class="adm-panel nf__panel" data-v-a4da744d${_scopeId}><table class="adm-table nf__table" data-v-a4da744d${_scopeId}><thead data-v-a4da744d${_scopeId}><tr data-v-a4da744d${_scopeId}><th scope="col" data-v-a4da744d${_scopeId}>Fahrzeug</th><th scope="col" class="num" data-v-a4da744d${_scopeId}>Gefragt</th><th scope="col" class="num" data-v-a4da744d${_scopeId}>Warten</th><th scope="col" data-v-a4da744d${_scopeId}>Zuletzt</th><th scope="col" data-v-a4da744d${_scopeId}>Stand</th>`);
							if (__props.can.mark) _push(`<th scope="col" data-v-a4da744d${_scopeId}><span class="visually-hidden" data-v-a4da744d${_scopeId}>Aktionen</span></th>`);
							else _push(`<!---->`);
							_push(`</tr></thead><tbody data-v-a4da744d${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.demand.rows, (gap, i) => {
								_push(`<tr${(0, server_renderer_exports.ssrRenderAttr)("id", anchor(gap.key))}${(0, server_renderer_exports.ssrRenderAttr)("aria-current", target.value === anchor(gap.key) ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value === gap.key ? "true" : void 0)} data-v-a4da744d${_scopeId}><td data-label="Fahrzeug" data-v-a4da744d${_scopeId}><span class="nf__vehicle" data-v-a4da744d${_scopeId}><span class="nf__rank" aria-hidden="true" data-v-a4da744d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(gap.rank ?? i + 1)}</span><span data-v-a4da744d${_scopeId}><span class="adm-table__key" data-v-a4da744d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(gap.title)}</span><span class="adm-table__sub" data-v-a4da744d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(gap.detail)}</span></span></span></td><td data-label="Gefragt" class="num" data-v-a4da744d${_scopeId}><span class="nf__asked" data-v-a4da744d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(gap.asked, 0))}× <span class="nf__bar" aria-hidden="true" data-v-a4da744d${_scopeId}><span style="${(0, server_renderer_exports.ssrRenderStyle)({ width: `${gap.weight}%` })}" data-v-a4da744d${_scopeId}></span></span></span></td><td data-label="Warten" class="num" data-v-a4da744d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(gap.waiting ? (0, vue_exports.unref)(decimal)(gap.waiting, 0) : "–")}</td><td data-label="Zuletzt" data-v-a4da744d${_scopeId}><time${(0, server_renderer_exports.ssrRenderAttr)("datetime", gap.lastIso ?? void 0)} data-v-a4da744d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(gap.lastAgo ?? "–")}</time></td><td data-label="Stand" data-phone="status" data-v-a4da744d${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(StateChip_default, (0, vue_exports.mergeProps)({ ref_for: true }, chip(gap)), null, _parent, _scopeId));
								if (gap.mark) {
									_push(`<span class="adm-table__sub nf__mark" data-v-a4da744d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(gap.mark.label)}`);
									if (gap.mark.by) _push(`<!--[-->, ${(0, server_renderer_exports.ssrInterpolate)(gap.mark.by)}<!--]-->`);
									else _push(`<!---->`);
									_push(`</span>`);
								} else _push(`<!---->`);
								_push(`</td>`);
								if (__props.can.mark) {
									_push(`<td data-label="Aktionen" data-v-a4da744d${_scopeId}><div class="adm-table__actions nf__actions" data-v-a4da744d${_scopeId}>`);
									if (gap.mark?.state !== "requested") _push(`<button class="btn btn--secondary btn--sm" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", busy.value === gap.key ? "true" : void 0)} data-v-a4da744d${_scopeId}> Gutachten anfordern </button>`);
									else _push(`<!---->`);
									_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) {
												_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
													class: "adm-iconbtn",
													"aria-label": `Weitere Aktionen für ${gap.title}`,
													"aria-disabled": busy.value === gap.key ? "true" : void 0
												}, {
													default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
														if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
															name: "more",
															size: 20
														}, null, _parent, _scopeId));
														else return [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "more",
															size: 20
														})];
													}),
													_: 2
												}, _parent, _scopeId));
												_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
													default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
														if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuContent_default), {
															class: "adm-menu",
															align: "end",
															"side-offset": 4
														}, {
															default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																if (_push) {
																	if (gap.mark?.state !== "watched") _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item",
																		onSelect: ($event) => mark(gap, "watched")
																	}, {
																		default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																			if (_push) {
																				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																					name: "eye",
																					size: 20
																				}, null, _parent, _scopeId));
																				_push(` Als beobachtet markieren `);
																			} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																				name: "eye",
																				size: 20
																			}), (0, vue_exports.createTextVNode)(" Als beobachtet markieren ")];
																		}),
																		_: 2
																	}, _parent, _scopeId));
																	else _push(`<!---->`);
																	if (gap.mark?.state !== "requested") _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item",
																		onSelect: ($event) => mark(gap, "requested")
																	}, {
																		default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																			if (_push) {
																				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																					name: "check",
																					size: 20
																				}, null, _parent, _scopeId));
																				_push(` Als angefordert markieren `);
																			} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																				name: "check",
																				size: 20
																			}), (0, vue_exports.createTextVNode)(" Als angefordert markieren ")];
																		}),
																		_: 2
																	}, _parent, _scopeId));
																	else _push(`<!---->`);
																	if (gap.mark?.state === "requested") _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item",
																		onSelect: ($event) => request(gap)
																	}, {
																		default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																			if (_push) {
																				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																					name: "emails",
																					size: 20
																				}, null, _parent, _scopeId));
																				_push(` Erneut anfordern `);
																			} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																				name: "emails",
																				size: 20
																			}), (0, vue_exports.createTextVNode)(" Erneut anfordern ")];
																		}),
																		_: 2
																	}, _parent, _scopeId));
																	else _push(`<!---->`);
																	if (gap.mark) {
																		_push(`<!--[-->`);
																		_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }, null, _parent, _scopeId));
																		_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																			class: "adm-menu__item",
																			onSelect: ($event) => unmark(gap)
																		}, {
																			default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																				if (_push) {
																					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																						name: "close",
																						size: 20
																					}, null, _parent, _scopeId));
																					_push(` Markierung aufheben `);
																				} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																					name: "close",
																					size: 20
																				}), (0, vue_exports.createTextVNode)(" Markierung aufheben ")];
																			}),
																			_: 2
																		}, _parent, _scopeId));
																		_push(`<!--]-->`);
																	} else _push(`<!---->`);
																} else return [
																	gap.mark?.state !== "watched" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		key: 0,
																		class: "adm-menu__item",
																		onSelect: ($event) => mark(gap, "watched")
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "eye",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" Als beobachtet markieren ")]),
																		_: 1
																	}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
																	gap.mark?.state !== "requested" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		key: 1,
																		class: "adm-menu__item",
																		onSelect: ($event) => mark(gap, "requested")
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "check",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" Als angefordert markieren ")]),
																		_: 1
																	}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
																	gap.mark?.state === "requested" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		key: 2,
																		class: "adm-menu__item",
																		onSelect: ($event) => request(gap)
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "emails",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" Erneut anfordern ")]),
																		_: 1
																	}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
																	gap.mark ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item",
																		onSelect: ($event) => unmark(gap)
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "close",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" Markierung aufheben ")]),
																		_: 1
																	}, 8, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true)
																];
															}),
															_: 2
														}, _parent, _scopeId));
														else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
															class: "adm-menu",
															align: "end",
															"side-offset": 4
														}, {
															default: (0, vue_exports.withCtx)(() => [
																gap.mark?.state !== "watched" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	key: 0,
																	class: "adm-menu__item",
																	onSelect: ($event) => mark(gap, "watched")
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "eye",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Als beobachtet markieren ")]),
																	_: 1
																}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
																gap.mark?.state !== "requested" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	key: 1,
																	class: "adm-menu__item",
																	onSelect: ($event) => mark(gap, "requested")
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "check",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Als angefordert markieren ")]),
																	_: 1
																}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
																gap.mark?.state === "requested" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	key: 2,
																	class: "adm-menu__item",
																	onSelect: ($event) => request(gap)
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "emails",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Erneut anfordern ")]),
																	_: 1
																}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
																gap.mark ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	class: "adm-menu__item",
																	onSelect: ($event) => unmark(gap)
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "close",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Markierung aufheben ")]),
																	_: 1
																}, 8, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true)
															]),
															_: 2
														}, 1024)];
													}),
													_: 2
												}, _parent, _scopeId));
											} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
												class: "adm-iconbtn",
												"aria-label": `Weitere Aktionen für ${gap.title}`,
												"aria-disabled": busy.value === gap.key ? "true" : void 0
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "more",
													size: 20
												})]),
												_: 1
											}, 8, ["aria-label", "aria-disabled"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
													class: "adm-menu",
													align: "end",
													"side-offset": 4
												}, {
													default: (0, vue_exports.withCtx)(() => [
														gap.mark?.state !== "watched" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
															key: 0,
															class: "adm-menu__item",
															onSelect: ($event) => mark(gap, "watched")
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "eye",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Als beobachtet markieren ")]),
															_: 1
														}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
														gap.mark?.state !== "requested" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
															key: 1,
															class: "adm-menu__item",
															onSelect: ($event) => mark(gap, "requested")
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "check",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Als angefordert markieren ")]),
															_: 1
														}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
														gap.mark?.state === "requested" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
															key: 2,
															class: "adm-menu__item",
															onSelect: ($event) => request(gap)
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "emails",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Erneut anfordern ")]),
															_: 1
														}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
														gap.mark ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
															class: "adm-menu__item",
															onSelect: ($event) => unmark(gap)
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "close",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Markierung aufheben ")]),
															_: 1
														}, 8, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true)
													]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024)];
										}),
										_: 2
									}, _parent, _scopeId));
									_push(`</div></td>`);
								} else _push(`<!---->`);
								_push(`</tr>`);
							});
							_push(`<!--]--></tbody></table></div>`);
						} else if ((__props.search ?? "") !== "") _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "filtered",
							total: __props.demand.counts[__props.state],
							onReset: resetSearch
						}, null, _parent, _scopeId));
						else _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: EMPTY[__props.state]
						}, null, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(ListPager_default, {
							pagination: __props.pagination,
							label: "Seiten der Lücken"
						}, null, _parent, _scopeId));
						_push(`<section class="nf__searches" aria-labelledby="nf-searches" data-v-a4da744d${_scopeId}><div class="adm-section__head" data-v-a4da744d${_scopeId}><h2 id="nf-searches" class="adm-section__title" data-v-a4da744d${_scopeId}>Suchen ohne Treffer</h2></div><p class="nf__note" data-v-a4da744d${_scopeId}> Freitext nennt kein bestimmtes Auto, darum steht er hier und nicht in der Liste oben. Gezählt wird jede Suche ohne Treffer bisher, gezeigt die zuletzt in diesem Zeitraum gesuchten. </p>`);
						if (__props.searches.length) {
							_push(`<div class="adm-panel" data-v-a4da744d${_scopeId}><table class="adm-table nf__table" data-v-a4da744d${_scopeId}><thead data-v-a4da744d${_scopeId}><tr data-v-a4da744d${_scopeId}><th scope="col" data-v-a4da744d${_scopeId}>Suchbegriff</th><th scope="col" class="num" data-v-a4da744d${_scopeId}>Suchen bisher</th><th scope="col" data-v-a4da744d${_scopeId}>Zuletzt</th></tr></thead><tbody data-v-a4da744d${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.searches, (miss) => {
								_push(`<tr data-v-a4da744d${_scopeId}><td data-label="Suchbegriff" data-v-a4da744d${_scopeId}><span class="adm-table__key" data-v-a4da744d${_scopeId}>„${(0, server_renderer_exports.ssrInterpolate)(miss.query)}“</span></td><td data-label="Suchen bisher" class="num" data-v-a4da744d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(miss.misses, 0))}</td><td data-label="Zuletzt" data-phone="status" class="nf__ago" data-v-a4da744d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(miss.lastAgo ?? "–")}</td></tr>`);
							});
							_push(`<!--]--></tbody></table></div>`);
						} else _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "In diesem Zeitraum blieb keine Suche ohne Treffer."
						}, null, _parent, _scopeId));
						_push(`</section></div>`);
						if (__props.can.mark) _push((0, server_renderer_exports.ssrRenderComponent)(RequestDialog_default, {
							open: dialogOpen.value,
							"onUpdate:open": ($event) => dialogOpen.value = $event,
							gap: requesting.value,
							brands: __props.brands,
							onRequested: (gap, brandId) => mark(gap, "requested", brandId)
						}, null, _parent, _scopeId));
						else _push(`<!---->`);
					} else return [(0, vue_exports.createVNode)("div", { class: "nf" }, [
						(0, vue_exports.createVNode)("p", { class: "nf__period" }, [(0, vue_exports.createVNode)("span", { class: "nf__period-name" }, (0, vue_exports.toDisplayString)(__props.period.label), 1), (0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(__props.period.range), 1)]),
						(0, vue_exports.createVNode)("div", { class: "adm-filters" }, [(0, vue_exports.createVNode)("div", {
							ref_key: "filters",
							ref: filters,
							class: "adm-filter",
							role: "group",
							"aria-label": "Stand"
						}, [(0, vue_exports.createVNode)("span", {
							class: "adm-filter__label",
							"aria-hidden": "true"
						}, "Stand"), ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(FILTERS, (f) => {
							return (0, vue_exports.createVNode)("button", {
								key: f.key,
								class: "adm-chip",
								type: "button",
								"aria-pressed": __props.state === f.key,
								onClick: ($event) => show(f.key)
							}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(f.label) + " ", 1), (0, vue_exports.createVNode)("span", { class: "adm-chip__n" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.demand.counts[f.key], 0)), 1)], 8, ["aria-pressed", "onClick"]);
						}), 64))], 512)]),
						(0, vue_exports.createVNode)("form", {
							class: "nf__search",
							role: "search",
							onSubmit: (0, vue_exports.withModifiers)(runSearch, ["prevent"])
						}, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
							class: "form-field__label",
							for: "nf-q"
						}, "Suchen"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
							id: "nf-q",
							"onUpdate:modelValue": ($event) => q.value = $event,
							class: "input",
							type: "search",
							maxlength: "100",
							autocomplete: "off",
							placeholder: "Fahrzeug oder HSN/TSN"
						}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, q.value]])]), (0, vue_exports.createVNode)("button", {
							class: "btn btn--secondary",
							type: "submit"
						}, "Suchen")], 32),
						(__props.search ?? "") !== "" && __props.pagination.total > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-note nf__found"
						}, (0, vue_exports.toDisplayString)(__props.pagination.total === 1 ? "1 Lücke gefunden." : `${(0, vue_exports.unref)(decimal)(__props.pagination.total, 0)} Lücken gefunden.`), 1)) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("p", { class: "nf__how" }, [(0, vue_exports.createVNode)(AdminIcon_default, {
							name: "info",
							size: 16
						}), (0, vue_exports.createVNode)("span", null, " So entsteht die Reihenfolge: Jede Anfrage zählt, eine von vor " + (0, vue_exports.toDisplayString)(__props.weighting.halfLife) + " Tagen halb so viel wie eine von heute. Wer auf eine Nachricht wartet, zählt " + (0, vue_exports.toDisplayString)(__props.weighting.waiting === 3 ? "dreifach" : `${__props.weighting.waiting}-fach`) + ". ", 1)]),
						__props.demand.rows.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 1,
							class: "adm-panel nf__panel"
						}, [(0, vue_exports.createVNode)("table", {
							ref_key: "table",
							ref: table,
							class: "adm-table nf__table"
						}, [(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Fahrzeug"),
							(0, vue_exports.createVNode)("th", {
								scope: "col",
								class: "num"
							}, "Gefragt"),
							(0, vue_exports.createVNode)("th", {
								scope: "col",
								class: "num"
							}, "Warten"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Zuletzt"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Stand"),
							__props.can.mark ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("th", {
								key: 0,
								scope: "col"
							}, [(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, "Aktionen")])) : (0, vue_exports.createCommentVNode)("", true)
						])]), (0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.demand.rows, (gap, i) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", {
								id: anchor(gap.key),
								key: gap.key,
								"aria-current": target.value === anchor(gap.key) ? "true" : void 0,
								"aria-busy": busy.value === gap.key ? "true" : void 0
							}, [
								(0, vue_exports.createVNode)("td", { "data-label": "Fahrzeug" }, [(0, vue_exports.createVNode)("span", { class: "nf__vehicle" }, [(0, vue_exports.createVNode)("span", {
									class: "nf__rank",
									"aria-hidden": "true"
								}, (0, vue_exports.toDisplayString)(gap.rank ?? i + 1), 1), (0, vue_exports.createVNode)("span", null, [(0, vue_exports.createVNode)("span", { class: "adm-table__key" }, (0, vue_exports.toDisplayString)(gap.title), 1), (0, vue_exports.createVNode)("span", { class: "adm-table__sub" }, (0, vue_exports.toDisplayString)(gap.detail), 1)])])]),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Gefragt",
									class: "num"
								}, [(0, vue_exports.createVNode)("span", { class: "nf__asked" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(gap.asked, 0)) + "× ", 1), (0, vue_exports.createVNode)("span", {
									class: "nf__bar",
									"aria-hidden": "true"
								}, [(0, vue_exports.createVNode)("span", { style: { width: `${gap.weight}%` } }, null, 4)])])]),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Warten",
									class: "num"
								}, (0, vue_exports.toDisplayString)(gap.waiting ? (0, vue_exports.unref)(decimal)(gap.waiting, 0) : "–"), 1),
								(0, vue_exports.createVNode)("td", { "data-label": "Zuletzt" }, [(0, vue_exports.createVNode)("time", { datetime: gap.lastIso ?? void 0 }, (0, vue_exports.toDisplayString)(gap.lastAgo ?? "–"), 9, ["datetime"])]),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Stand",
									"data-phone": "status"
								}, [(0, vue_exports.createVNode)(StateChip_default, (0, vue_exports.mergeProps)({ ref_for: true }, chip(gap)), null, 16), gap.mark ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: "adm-table__sub nf__mark"
								}, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(gap.mark.label), 1), gap.mark.by ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(", " + (0, vue_exports.toDisplayString)(gap.mark.by), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true)]),
								__props.can.mark ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
									key: 0,
									"data-label": "Aktionen"
								}, [(0, vue_exports.createVNode)("div", { class: "adm-table__actions nf__actions" }, [gap.mark?.state !== "requested" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 0,
									class: "btn btn--secondary btn--sm",
									type: "button",
									"aria-disabled": busy.value === gap.key ? "true" : void 0,
									onClick: ($event) => busy.value === gap.key || request(gap)
								}, " Gutachten anfordern ", 8, ["aria-disabled", "onClick"])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
										class: "adm-iconbtn",
										"aria-label": `Weitere Aktionen für ${gap.title}`,
										"aria-disabled": busy.value === gap.key ? "true" : void 0
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "more",
											size: 20
										})]),
										_: 1
									}, 8, ["aria-label", "aria-disabled"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
											class: "adm-menu",
											align: "end",
											"side-offset": 4
										}, {
											default: (0, vue_exports.withCtx)(() => [
												gap.mark?.state !== "watched" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: 0,
													class: "adm-menu__item",
													onSelect: ($event) => mark(gap, "watched")
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "eye",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Als beobachtet markieren ")]),
													_: 1
												}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
												gap.mark?.state !== "requested" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: 1,
													class: "adm-menu__item",
													onSelect: ($event) => mark(gap, "requested")
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "check",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Als angefordert markieren ")]),
													_: 1
												}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
												gap.mark?.state === "requested" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: 2,
													class: "adm-menu__item",
													onSelect: ($event) => request(gap)
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "emails",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Erneut anfordern ")]),
													_: 1
												}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
												gap.mark ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item",
													onSelect: ($event) => unmark(gap)
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "close",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Markierung aufheben ")]),
													_: 1
												}, 8, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true)
											]),
											_: 2
										}, 1024)]),
										_: 2
									}, 1024)]),
									_: 2
								}, 1024)])])) : (0, vue_exports.createCommentVNode)("", true)
							], 8, [
								"id",
								"aria-current",
								"aria-busy"
							]);
						}), 128))])], 512)])) : (__props.search ?? "") !== "" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 2,
							kind: "filtered",
							total: __props.demand.counts[__props.state],
							onReset: resetSearch
						}, null, 8, ["total"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 3,
							kind: "empty",
							text: EMPTY[__props.state]
						}, null, 8, ["text"])),
						(0, vue_exports.createVNode)(ListPager_default, {
							pagination: __props.pagination,
							label: "Seiten der Lücken"
						}, null, 8, ["pagination"]),
						(0, vue_exports.createVNode)("section", {
							class: "nf__searches",
							"aria-labelledby": "nf-searches"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "nf-searches",
								class: "adm-section__title"
							}, "Suchen ohne Treffer")]),
							(0, vue_exports.createVNode)("p", { class: "nf__note" }, " Freitext nennt kein bestimmtes Auto, darum steht er hier und nicht in der Liste oben. Gezählt wird jede Suche ohne Treffer bisher, gezeigt die zuletzt in diesem Zeitraum gesuchten. "),
							__props.searches.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 0,
								class: "adm-panel"
							}, [(0, vue_exports.createVNode)("table", { class: "adm-table nf__table" }, [(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Suchbegriff"),
								(0, vue_exports.createVNode)("th", {
									scope: "col",
									class: "num"
								}, "Suchen bisher"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Zuletzt")
							])]), (0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.searches, (miss) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: miss.query }, [
									(0, vue_exports.createVNode)("td", { "data-label": "Suchbegriff" }, [(0, vue_exports.createVNode)("span", { class: "adm-table__key" }, "„" + (0, vue_exports.toDisplayString)(miss.query) + "“", 1)]),
									(0, vue_exports.createVNode)("td", {
										"data-label": "Suchen bisher",
										class: "num"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(miss.misses, 0)), 1),
									(0, vue_exports.createVNode)("td", {
										"data-label": "Zuletzt",
										"data-phone": "status",
										class: "nf__ago"
									}, (0, vue_exports.toDisplayString)(miss.lastAgo ?? "–"), 1)
								]);
							}), 128))])])])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
								key: 1,
								kind: "empty",
								text: "In diesem Zeitraum blieb keine Suche ohne Treffer."
							}))
						])
					]), __props.can.mark ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(RequestDialog_default, {
						key: 0,
						open: dialogOpen.value,
						"onUpdate:open": ($event) => dialogOpen.value = $event,
						gap: requesting.value,
						brands: __props.brands,
						onRequested: (gap, brandId) => mark(gap, "requested", brandId)
					}, null, 8, [
						"open",
						"onUpdate:open",
						"gap",
						"brands",
						"onRequested"
					])) : (0, vue_exports.createCommentVNode)("", true)];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Nachfrage/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Nachfrage/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-a4da744d"]]);
//#endregion
export { Index_default as default };
