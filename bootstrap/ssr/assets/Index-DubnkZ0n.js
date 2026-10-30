import { t as Dialog_default } from "./Dialog-CAlgTJaP.js";
import { a as DropdownMenuRoot_default, i as DropdownMenuContent_default, n as DropdownMenuPortal_default, r as DropdownMenuItem_default, t as DropdownMenuTrigger_default } from "./DropdownMenuTrigger-DxgIMivC.js";
import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage--D-DZQ_G.js";
import { t as DropdownMenuSeparator_default } from "./DropdownMenuSeparator-Bu32GjnF.js";
import { a as link_default, c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-COuF1lMZ.js";
import { t as AdminConfirm_default } from "./AdminConfirm-DBodxbIw.js";
import { t as AdminState_default } from "./AdminState-BXpi0AIC.js";
import { t as useOpenOnArrival } from "./useOpenOnArrival-BhtmDuub.js";
import { t as AdminSortHeader_default } from "./AdminSortHeader-BRAD0j7W.js";
//#region resources/js/Pages/Admin/Ratgeber/Index.vue?vue&type=script&setup=true&lang.ts
var BASE = "/admin/ratgeber";
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		articles: {},
		total: {},
		filters: {},
		can: {}
	},
	setup(__props) {
		/**
		* Inhalte › Ratgeber (the client's admin item 12, D-351): the Blog's articles on a page of their own — searched, sorted
		* by a column heading (F-32: `sort` and `richtung` in the address), opened in the page editor, published and withdrawn,
		* deleted. One primary action, *Artikel anlegen*; the rest of a row sits behind its more-menu, as on the FAQ page.
		* Every write is refused by the server regardless of what this page offers (PagePolicy).
		*/
		const props = __props;
		const FIRST = {
			geaendert: "ab",
			titel: "auf",
			veroeffentlicht: "ab"
		};
		const page = usePage();
		const live = (0, vue_exports.computed)(() => props.articles.filter((article) => article.published).length);
		const context = (0, vue_exports.computed)(() => {
			const all = props.total === 1 ? "1 Artikel" : `${props.total} Artikel`;
			return props.filters.q !== "" ? `${all} · gefiltert` : `${all} · ${live.value} im Shop`;
		});
		const refusal = (0, vue_exports.computed)(() => {
			const raw = page.props.errors;
			const bag = raw !== null && typeof raw === "object" ? raw : {};
			return bag.article ?? bag.page ?? bag.baseVersion ?? "";
		});
		const search = (0, vue_exports.ref)(props.filters.q);
		const busy = (0, vue_exports.ref)(false);
		(0, vue_exports.watch)(() => props.filters.q, (q) => search.value = q);
		function visit(query) {
			busy.value = true;
			router.get(BASE, query, {
				preserveScroll: true,
				preserveState: true,
				onFinish: () => {
					busy.value = false;
				}
			});
		}
		function query(overrides = {}) {
			const next = {
				q: search.value.trim(),
				sort: props.filters.sort,
				richtung: props.filters.richtung,
				...overrides
			};
			const out = {};
			if (next.q !== "") out.q = next.q;
			if (!(next.sort === "geaendert" && next.richtung === FIRST.geaendert)) {
				out.sort = next.sort;
				out.richtung = next.richtung;
			}
			return out;
		}
		function find() {
			visit(query());
		}
		function clear() {
			search.value = "";
			visit(query({ q: "" }));
		}
		function sortBy(column) {
			const chosen = column;
			visit(query({
				sort: chosen,
				richtung: props.filters.sort === chosen ? props.filters.richtung === "auf" ? "ab" : "auf" : FIRST[chosen]
			}));
		}
		const creating = (0, vue_exports.ref)(false);
		const title = (0, vue_exports.ref)("");
		const sending = (0, vue_exports.ref)(false);
		const sent = (0, vue_exports.ref)(false);
		const createError = (0, vue_exports.computed)(() => {
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
			if (sending.value) return;
			sending.value = true;
			sent.value = true;
			router.post(BASE, { title: title.value }, {
				preserveScroll: true,
				onError: () => void (0, vue_exports.nextTick)(() => document.getElementById("rg-title")?.focus()),
				onFinish: () => {
					sending.value = false;
				}
			});
		}
		const asked = (0, vue_exports.ref)(null);
		const askOpen = (0, vue_exports.computed)({
			get: () => asked.value !== null,
			set: (open) => {
				if (!open) asked.value = null;
			}
		});
		const askTitle = (0, vue_exports.computed)(() => asked.value === null ? "" : `${asked.value.article.title} ${asked.value.action === "delete" ? "löschen" : "zurückziehen"}?`);
		const askBody = (0, vue_exports.computed)(() => {
			if (asked.value === null) return "";
			if (asked.value.action === "withdraw") return "Der Artikel ist danach nicht mehr im Shop zu sehen. Seine Texte bleiben, du kannst ihn wieder veröffentlichen.";
			return asked.value.article.published ? "Der Artikel verschwindet aus dem Shop und aus dieser Liste. Seine veröffentlichten Fassungen bleiben gespeichert, seine Adresse bekommt kein anderer Artikel." : "Der Artikel verschwindet aus dieser Liste. Seine Adresse bekommt kein anderer Artikel.";
		});
		const mayDelete = (article) => props.can.delete && (!article.published || props.can.publish);
		const hasMenu = (article) => props.can.publish || mayDelete(article);
		function publish(article) {
			busy.value = true;
			router.post(`${BASE}/${article.id}/veroeffentlichen`, { baseVersion: article.version }, {
				preserveScroll: true,
				onFinish: () => {
					busy.value = false;
				}
			});
		}
		function confirmAsked() {
			const current = asked.value;
			if (current === null || busy.value) return;
			busy.value = true;
			const done = {
				preserveScroll: true,
				onFinish: () => {
					busy.value = false;
					asked.value = null;
				}
			};
			if (current.action === "withdraw") router.post(`/admin/seiten/${current.article.id}/zurueckziehen`, { baseVersion: current.article.version }, done);
			else router.delete(`${BASE}/${current.article.id}`, {
				data: { baseVersion: current.article.version },
				...done
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Ratgeber",
				context: context.value
			}, _attrs), (0, vue_exports.createSlots)({
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (refusal.value) _push(`<p class="adm-alert" role="alert" data-v-d6d99720${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(refusal.value)}</p>`);
						else _push(`<!---->`);
						_push(`<form class="rg__search" role="search"${(0, server_renderer_exports.ssrRenderAttr)("action", BASE)} method="get" data-v-d6d99720${_scopeId}><label class="visually-hidden" for="rg-q" data-v-d6d99720${_scopeId}>Ratgeber durchsuchen</label><input id="rg-q"${(0, server_renderer_exports.ssrRenderAttr)("value", search.value)} class="input" type="search" name="q" maxlength="90" placeholder="Titel oder Adresse" autocomplete="off" data-v-d6d99720${_scopeId}><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-d6d99720${_scopeId}>Suchen</button></form>`);
						if (__props.articles.length) {
							_push(`<div class="adm-panel" data-v-d6d99720${_scopeId}><table class="adm-table rg__table" data-v-d6d99720${_scopeId}><colgroup data-v-d6d99720${_scopeId}><col data-v-d6d99720${_scopeId}><col class="rg__col-date" data-v-d6d99720${_scopeId}><col class="rg__col-shop" data-v-d6d99720${_scopeId}><col class="rg__col-more" data-v-d6d99720${_scopeId}></colgroup><thead data-v-d6d99720${_scopeId}><tr data-v-d6d99720${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminSortHeader_default, {
								label: "Artikel",
								column: "titel",
								sort: __props.filters.sort,
								richtung: __props.filters.richtung,
								disabled: busy.value,
								onSort: sortBy
							}, null, _parent, _scopeId));
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminSortHeader_default, {
								label: "Geändert",
								column: "geaendert",
								sort: __props.filters.sort,
								richtung: __props.filters.richtung,
								disabled: busy.value,
								onSort: sortBy
							}, null, _parent, _scopeId));
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminSortHeader_default, {
								label: "Im Shop",
								column: "veroeffentlicht",
								sort: __props.filters.sort,
								richtung: __props.filters.richtung,
								disabled: busy.value,
								onSort: sortBy
							}, null, _parent, _scopeId));
							_push(`<th scope="col" data-v-d6d99720${_scopeId}><span class="visually-hidden" data-v-d6d99720${_scopeId}>Aktionen</span></th></tr></thead><tbody data-v-d6d99720${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.articles, (article) => {
								_push(`<tr data-v-d6d99720${_scopeId}><td data-label="Artikel" data-v-d6d99720${_scopeId}><span class="adm-table__key" data-v-d6d99720${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: `${BASE}/${article.id}`,
									class: "rg__link"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(article.title)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(article.title), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								_push(`</span><span class="adm-table__sub" data-v-d6d99720${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(article.href)}</span>`);
								if (article.draft) {
									_push(`<span class="adm-table__sub" data-v-d6d99720${_scopeId}> Entwurf vom ${(0, server_renderer_exports.ssrInterpolate)(article.draft.at)}`);
									if (article.draft.by) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(article.draft.by)}<!--]-->`);
									else _push(`<!---->`);
									_push(`</span>`);
								} else _push(`<!---->`);
								_push(`</td><td data-label="Geändert" class="rg__num" data-v-d6d99720${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(article.changedAt ?? "–")}</td><td data-label="Im Shop" class="rg__num" data-v-d6d99720${_scopeId}>`);
								if (article.published) _push(`<!--[-->seit ${(0, server_renderer_exports.ssrInterpolate)(article.publishedAt ?? "–")}<!--]-->`);
								else _push(`<span class="adm-tag adm-tag--neutral" data-v-d6d99720${_scopeId}>Nicht veröffentlicht</span>`);
								_push(`</td><td data-label="Aktionen" data-phone="menu" class="rg__more" data-v-d6d99720${_scopeId}>`);
								if (hasMenu(article)) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
												class: "adm-iconbtn",
												"aria-label": `Aktionen für ${article.title}`
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
																_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
																	default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																		if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
																			href: `${BASE}/${article.id}`,
																			class: "adm-menu__item"
																		}, {
																			default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																				if (_push) {
																					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																						name: "edit",
																						size: 20
																					}, null, _parent, _scopeId));
																					_push(`Bearbeiten`);
																				} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																					name: "edit",
																					size: 20
																				}), (0, vue_exports.createTextVNode)("Bearbeiten")];
																			}),
																			_: 2
																		}, _parent, _scopeId));
																		else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																			href: `${BASE}/${article.id}`,
																			class: "adm-menu__item"
																		}, {
																			default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																				name: "edit",
																				size: 20
																			}), (0, vue_exports.createTextVNode)("Bearbeiten")]),
																			_: 1
																		}, 8, ["href"])];
																	}),
																	_: 2
																}, _parent, _scopeId));
																if (__props.can.publish && !article.published) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	class: "adm-menu__item",
																	onSelect: ($event) => publish(article)
																}, {
																	default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																		if (_push) {
																			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																				name: "eye",
																				size: 20
																			}, null, _parent, _scopeId));
																			_push(` Veröffentlichen `);
																		} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "eye",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" Veröffentlichen ")];
																	}),
																	_: 2
																}, _parent, _scopeId));
																else _push(`<!---->`);
																if (__props.can.publish && article.published) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	class: "adm-menu__item",
																	onSelect: ($event) => asked.value = {
																		article,
																		action: "withdraw"
																	}
																}, {
																	default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																		if (_push) {
																			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																				name: "eye-off",
																				size: 20
																			}, null, _parent, _scopeId));
																			_push(` Zurückziehen `);
																		} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "eye-off",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" Zurückziehen ")];
																	}),
																	_: 2
																}, _parent, _scopeId));
																else _push(`<!---->`);
																if (mayDelete(article)) {
																	_push(`<!--[-->`);
																	_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }, null, _parent, _scopeId));
																	_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item adm-menu__item--danger",
																		onSelect: ($event) => asked.value = {
																			article,
																			action: "delete"
																		}
																	}, {
																		default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																			if (_push) {
																				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																					name: "delete",
																					size: 20
																				}, null, _parent, _scopeId));
																				_push(` Löschen `);
																			} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																				name: "delete",
																				size: 20
																			}), (0, vue_exports.createTextVNode)(" Löschen ")];
																		}),
																		_: 2
																	}, _parent, _scopeId));
																	_push(`<!--]-->`);
																} else _push(`<!---->`);
															} else return [
																(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																		href: `${BASE}/${article.id}`,
																		class: "adm-menu__item"
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "edit",
																			size: 20
																		}), (0, vue_exports.createTextVNode)("Bearbeiten")]),
																		_: 1
																	}, 8, ["href"])]),
																	_: 2
																}, 1024),
																__props.can.publish && !article.published ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	key: 0,
																	class: "adm-menu__item",
																	onSelect: ($event) => publish(article)
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "eye",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Veröffentlichen ")]),
																	_: 1
																}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
																__props.can.publish && article.published ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	key: 1,
																	class: "adm-menu__item",
																	onSelect: ($event) => asked.value = {
																		article,
																		action: "withdraw"
																	}
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "eye-off",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Zurückziehen ")]),
																	_: 1
																}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
																mayDelete(article) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	class: "adm-menu__item adm-menu__item--danger",
																	onSelect: ($event) => asked.value = {
																		article,
																		action: "delete"
																	}
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "delete",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Löschen ")]),
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
															(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
																	href: `${BASE}/${article.id}`,
																	class: "adm-menu__item"
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "edit",
																		size: 20
																	}), (0, vue_exports.createTextVNode)("Bearbeiten")]),
																	_: 1
																}, 8, ["href"])]),
																_: 2
															}, 1024),
															__props.can.publish && !article.published ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																key: 0,
																class: "adm-menu__item",
																onSelect: ($event) => publish(article)
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "eye",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Veröffentlichen ")]),
																_: 1
															}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
															__props.can.publish && article.published ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																key: 1,
																class: "adm-menu__item",
																onSelect: ($event) => asked.value = {
																	article,
																	action: "withdraw"
																}
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "eye-off",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Zurückziehen ")]),
																_: 1
															}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
															mayDelete(article) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																class: "adm-menu__item adm-menu__item--danger",
																onSelect: ($event) => asked.value = {
																	article,
																	action: "delete"
																}
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "delete",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Löschen ")]),
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
											"aria-label": `Aktionen für ${article.title}`
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "more",
												size: 20
											})]),
											_: 1
										}, 8, ["aria-label"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
												class: "adm-menu",
												align: "end",
												"side-offset": 4
											}, {
												default: (0, vue_exports.withCtx)(() => [
													(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
															href: `${BASE}/${article.id}`,
															class: "adm-menu__item"
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "edit",
																size: 20
															}), (0, vue_exports.createTextVNode)("Bearbeiten")]),
															_: 1
														}, 8, ["href"])]),
														_: 2
													}, 1024),
													__props.can.publish && !article.published ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
														key: 0,
														class: "adm-menu__item",
														onSelect: ($event) => publish(article)
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "eye",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Veröffentlichen ")]),
														_: 1
													}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
													__props.can.publish && article.published ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
														key: 1,
														class: "adm-menu__item",
														onSelect: ($event) => asked.value = {
															article,
															action: "withdraw"
														}
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "eye-off",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Zurückziehen ")]),
														_: 1
													}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
													mayDelete(article) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item adm-menu__item--danger",
														onSelect: ($event) => asked.value = {
															article,
															action: "delete"
														}
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "delete",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Löschen ")]),
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
								else _push(`<!---->`);
								_push(`</td></tr>`);
							});
							_push(`<!--]--></tbody></table></div>`);
						} else if (__props.filters.q !== "") {
							_push(`<div class="rg__none" data-v-d6d99720${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
								kind: "empty",
								text: `Kein Artikel passt zu „${__props.filters.q}“.`
							}, null, _parent, _scopeId));
							_push(`<button class="btn btn--secondary btn--sm" type="button" data-v-d6d99720${_scopeId}>Suche zurücksetzen</button></div>`);
						} else _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Noch kein Artikel. Was du hier anlegst, erscheint nach dem Veröffentlichen im Blog des Shops."
						}, null, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
							open: creating.value,
							"onUpdate:open": ($event) => creating.value = $event,
							title: "Artikel anlegen",
							"content-class": "adm-dialog adm-dialog--narrow"
						}, {
							actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-d6d99720${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="submit" form="rg-create"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sending.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", sending.value ? "true" : void 0)} data-v-d6d99720${_scopeId}> Anlegen </button>`);
								else return [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									onClick: ($event) => creating.value = false
								}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--primary",
									type: "submit",
									form: "rg-create",
									disabled: sending.value,
									"aria-busy": sending.value ? "true" : void 0
								}, " Anlegen ", 8, ["disabled", "aria-busy"])];
							}),
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<form id="rg-create" class="adm-fields" novalidate data-v-d6d99720${_scopeId}><div class="form-field" data-v-d6d99720${_scopeId}><label class="form-field__label" for="rg-title" data-v-d6d99720${_scopeId}>Titel</label><input id="rg-title"${(0, server_renderer_exports.ssrRenderAttr)("value", title.value)} class="input" type="text" maxlength="90" autocomplete="off" aria-required="true" aria-describedby="rg-title-help rg-title-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", createError.value ? "true" : void 0)} data-v-d6d99720${_scopeId}><p id="rg-title-help" class="form-field__help" data-v-d6d99720${_scopeId}> Aus dem Titel entsteht die Adresse, zum Beispiel /ratgeber/et-richtig-lesen. Der Artikel ist erst nach dem Veröffentlichen im Shop. </p><p id="rg-title-err" class="form-field__error" data-v-d6d99720${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(createError.value)}</p></div></form>`);
								else return [(0, vue_exports.createVNode)("form", {
									id: "rg-create",
									class: "adm-fields",
									novalidate: "",
									onSubmit: (0, vue_exports.withModifiers)(create, ["prevent"])
								}, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "rg-title"
									}, "Titel"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "rg-title",
										"onUpdate:modelValue": ($event) => title.value = $event,
										class: "input",
										type: "text",
										maxlength: "90",
										autocomplete: "off",
										"aria-required": "true",
										"aria-describedby": "rg-title-help rg-title-err",
										"aria-invalid": createError.value ? "true" : void 0
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, title.value]]),
									(0, vue_exports.createVNode)("p", {
										id: "rg-title-help",
										class: "form-field__help"
									}, " Aus dem Titel entsteht die Adresse, zum Beispiel /ratgeber/et-richtig-lesen. Der Artikel ist erst nach dem Veröffentlichen im Shop. "),
									(0, vue_exports.createVNode)("p", {
										id: "rg-title-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(createError.value), 1)
								])], 32)];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: askOpen.value,
							"onUpdate:open": ($event) => askOpen.value = $event,
							title: askTitle.value,
							body: askBody.value,
							"confirm-label": asked.value?.action === "withdraw" ? "Zurückziehen" : "Löschen",
							busy: busy.value,
							onConfirm: confirmAsked
						}, null, _parent, _scopeId));
					} else return [
						refusal.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-alert",
							role: "alert"
						}, (0, vue_exports.toDisplayString)(refusal.value), 1)) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("form", {
							class: "rg__search",
							role: "search",
							action: BASE,
							method: "get",
							onSubmit: (0, vue_exports.withModifiers)(find, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("label", {
								class: "visually-hidden",
								for: "rg-q"
							}, "Ratgeber durchsuchen"),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "rg-q",
								"onUpdate:modelValue": ($event) => search.value = $event,
								class: "input",
								type: "search",
								name: "q",
								maxlength: "90",
								placeholder: "Titel oder Adresse",
								autocomplete: "off"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, search.value]]),
							(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "submit",
								disabled: busy.value
							}, "Suchen", 8, ["disabled"])
						], 32),
						__props.articles.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 1,
							class: "adm-panel"
						}, [(0, vue_exports.createVNode)("table", { class: "adm-table rg__table" }, [
							(0, vue_exports.createVNode)("colgroup", null, [
								(0, vue_exports.createVNode)("col"),
								(0, vue_exports.createVNode)("col", { class: "rg__col-date" }),
								(0, vue_exports.createVNode)("col", { class: "rg__col-shop" }),
								(0, vue_exports.createVNode)("col", { class: "rg__col-more" })
							]),
							(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
								(0, vue_exports.createVNode)(AdminSortHeader_default, {
									label: "Artikel",
									column: "titel",
									sort: __props.filters.sort,
									richtung: __props.filters.richtung,
									disabled: busy.value,
									onSort: sortBy
								}, null, 8, [
									"sort",
									"richtung",
									"disabled"
								]),
								(0, vue_exports.createVNode)(AdminSortHeader_default, {
									label: "Geändert",
									column: "geaendert",
									sort: __props.filters.sort,
									richtung: __props.filters.richtung,
									disabled: busy.value,
									onSort: sortBy
								}, null, 8, [
									"sort",
									"richtung",
									"disabled"
								]),
								(0, vue_exports.createVNode)(AdminSortHeader_default, {
									label: "Im Shop",
									column: "veroeffentlicht",
									sort: __props.filters.sort,
									richtung: __props.filters.richtung,
									disabled: busy.value,
									onSort: sortBy
								}, null, 8, [
									"sort",
									"richtung",
									"disabled"
								]),
								(0, vue_exports.createVNode)("th", { scope: "col" }, [(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, "Aktionen")])
							])]),
							(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.articles, (article) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: article.id }, [
									(0, vue_exports.createVNode)("td", { "data-label": "Artikel" }, [
										(0, vue_exports.createVNode)("span", { class: "adm-table__key" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
											href: `${BASE}/${article.id}`,
											class: "rg__link"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(article.title), 1)]),
											_: 2
										}, 1032, ["href"])]),
										(0, vue_exports.createVNode)("span", { class: "adm-table__sub" }, (0, vue_exports.toDisplayString)(article.href), 1),
										article.draft ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: "adm-table__sub"
										}, [(0, vue_exports.createTextVNode)(" Entwurf vom " + (0, vue_exports.toDisplayString)(article.draft.at), 1), article.draft.by ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(article.draft.by), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true)
									]),
									(0, vue_exports.createVNode)("td", {
										"data-label": "Geändert",
										class: "rg__num"
									}, (0, vue_exports.toDisplayString)(article.changedAt ?? "–"), 1),
									(0, vue_exports.createVNode)("td", {
										"data-label": "Im Shop",
										class: "rg__num"
									}, [article.published ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("seit " + (0, vue_exports.toDisplayString)(article.publishedAt ?? "–"), 1)], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 1,
										class: "adm-tag adm-tag--neutral"
									}, "Nicht veröffentlicht"))]),
									(0, vue_exports.createVNode)("td", {
										"data-label": "Aktionen",
										"data-phone": "menu",
										class: "rg__more"
									}, [hasMenu(article) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuRoot_default), { key: 0 }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
											class: "adm-iconbtn",
											"aria-label": `Aktionen für ${article.title}`
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "more",
												size: 20
											})]),
											_: 1
										}, 8, ["aria-label"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
												class: "adm-menu",
												align: "end",
												"side-offset": 4
											}, {
												default: (0, vue_exports.withCtx)(() => [
													(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), { "as-child": "" }, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
															href: `${BASE}/${article.id}`,
															class: "adm-menu__item"
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "edit",
																size: 20
															}), (0, vue_exports.createTextVNode)("Bearbeiten")]),
															_: 1
														}, 8, ["href"])]),
														_: 2
													}, 1024),
													__props.can.publish && !article.published ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
														key: 0,
														class: "adm-menu__item",
														onSelect: ($event) => publish(article)
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "eye",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Veröffentlichen ")]),
														_: 1
													}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
													__props.can.publish && article.published ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
														key: 1,
														class: "adm-menu__item",
														onSelect: ($event) => asked.value = {
															article,
															action: "withdraw"
														}
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "eye-off",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Zurückziehen ")]),
														_: 1
													}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
													mayDelete(article) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item adm-menu__item--danger",
														onSelect: ($event) => asked.value = {
															article,
															action: "delete"
														}
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "delete",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Löschen ")]),
														_: 1
													}, 8, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true)
												]),
												_: 2
											}, 1024)]),
											_: 2
										}, 1024)]),
										_: 2
									}, 1024)) : (0, vue_exports.createCommentVNode)("", true)])
								]);
							}), 128))])
						])])) : __props.filters.q !== "" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 2,
							class: "rg__none"
						}, [(0, vue_exports.createVNode)(AdminState_default, {
							kind: "empty",
							text: `Kein Artikel passt zu „${__props.filters.q}“.`
						}, null, 8, ["text"]), (0, vue_exports.createVNode)("button", {
							class: "btn btn--secondary btn--sm",
							type: "button",
							onClick: clear
						}, "Suche zurücksetzen")])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 3,
							kind: "empty",
							text: "Noch kein Artikel. Was du hier anlegst, erscheint nach dem Veröffentlichen im Blog des Shops."
						})),
						(0, vue_exports.createVNode)(Dialog_default, {
							open: creating.value,
							"onUpdate:open": ($event) => creating.value = $event,
							title: "Artikel anlegen",
							"content-class": "adm-dialog adm-dialog--narrow"
						}, {
							actions: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "button",
								onClick: ($event) => creating.value = false
							}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "submit",
								form: "rg-create",
								disabled: sending.value,
								"aria-busy": sending.value ? "true" : void 0
							}, " Anlegen ", 8, ["disabled", "aria-busy"])]),
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("form", {
								id: "rg-create",
								class: "adm-fields",
								novalidate: "",
								onSubmit: (0, vue_exports.withModifiers)(create, ["prevent"])
							}, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rg-title"
								}, "Titel"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "rg-title",
									"onUpdate:modelValue": ($event) => title.value = $event,
									class: "input",
									type: "text",
									maxlength: "90",
									autocomplete: "off",
									"aria-required": "true",
									"aria-describedby": "rg-title-help rg-title-err",
									"aria-invalid": createError.value ? "true" : void 0
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, title.value]]),
								(0, vue_exports.createVNode)("p", {
									id: "rg-title-help",
									class: "form-field__help"
								}, " Aus dem Titel entsteht die Adresse, zum Beispiel /ratgeber/et-richtig-lesen. Der Artikel ist erst nach dem Veröffentlichen im Shop. "),
								(0, vue_exports.createVNode)("p", {
									id: "rg-title-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(createError.value), 1)
							])], 32)]),
							_: 1
						}, 8, ["open", "onUpdate:open"]),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: askOpen.value,
							"onUpdate:open": ($event) => askOpen.value = $event,
							title: askTitle.value,
							body: askBody.value,
							"confirm-label": asked.value?.action === "withdraw" ? "Zurückziehen" : "Löschen",
							busy: busy.value,
							onConfirm: confirmAsked
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
				_: 2
			}, [__props.can.create ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--primary" type="button" data-v-d6d99720${_scopeId}>Artikel anlegen</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						onClick: openCreate
					}, "Artikel anlegen")];
				}),
				key: "0"
			} : void 0]), _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Ratgeber/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Ratgeber/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-d6d99720"]]);
//#endregion
export { Index_default as default };
