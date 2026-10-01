import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { a as DropdownMenuRoot_default, i as DropdownMenuContent_default, n as DropdownMenuPortal_default, r as DropdownMenuItem_default, t as DropdownMenuTrigger_default } from "./DropdownMenuTrigger-xBPJueVr.js";
import { c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-CUJcjiDR.js";
import { t as AdminConfirm_default } from "./AdminConfirm-lE_VO-0x.js";
import { o as withUnit } from "./format-DGFu8Y3r.js";
import { t as MENU_ROOM } from "./menu-CcR9FXu6.js";
import { n as useFocusAfter } from "./useFocusAfter-B30tsjKa.js";
//#region resources/js/Pages/Admin/Gutachten/DocumentExtras.vue?vue&type=script&setup=true&lang.ts
var BAG = "angaben";
var DocumentExtras_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "DocumentExtras",
	__ssrInlineRender: true,
	props: {
		documentId: {},
		fasteners: {},
		notices: {},
		reworks: {},
		conditions: {},
		editable: { type: Boolean },
		pageCount: {}
	},
	setup(__props) {
		/**
		* What a document states beside its codes (the corrections memo §4): the Befestigungsmittel it names —
		* thread, seat, torque, shaft — the duties it always states (Pflichthinweise: the torque check after 50 km,
		* the TPMS note, the papers), and the millimetres of each „Nacharbeit mit Maßen“ code, per vehicle type and
		* axle. Entered as the PDF prints them while the document is a draft; the shop shows them with the verdict.
		*
		* Each list is read first: its form opens from its own button, and an entry is taken away from its „⋯“
		* menu after a confirm — as in the Auflagenverzeichnis above it.
		*/
		const props = __props;
		const page = usePage();
		const focus = useFocusAfter();
		const base = (0, vue_exports.computed)(() => `/admin/gutachten/${props.documentId}`);
		const busy = (0, vue_exports.ref)(false);
		/** Which list's form is open, and which one's was sent last: its sentences, not another's. */
		const open = (0, vue_exports.ref)(null);
		const sent = (0, vue_exports.ref)(null);
		const PATH = {
			fastener: "befestigungsmittel",
			notice: "hinweise",
			rework: "nacharbeit"
		};
		const OPENER = {
			fastener: "dx-f-open",
			notice: "dx-n-open",
			rework: "dx-r-open"
		};
		const AXLE = {
			FRONT: "Vorderachse",
			REAR: "Hinterachse",
			ALL: "Alle Achsen"
		};
		const bag = (0, vue_exports.computed)(() => {
			const raw = page.props.errors?.[BAG];
			return raw !== null && typeof raw === "object" ? raw : {};
		});
		function err(list, field) {
			return sent.value === list ? bag.value[field] ?? "" : "";
		}
		/** The codes whose millimetres are entered here. */
		const reworkCodes = (0, vue_exports.computed)(() => props.conditions.filter((c) => c.kind === "nacharbeitsprofil"));
		const blankFastener = () => ({
			number: "",
			thread: "",
			seat: "",
			torque_nm: "",
			shaft_length_mm: "",
			article_number: "",
			vehicle_types: ""
		});
		const blankNotice = () => ({
			text_de: "",
			source_page: ""
		});
		const blankRework = () => ({
			document_condition_id: null,
			vehicle_type: "",
			axle: "ALL",
			from_mm: "",
			to_mm: "",
			flare_mm: ""
		});
		const fastener = (0, vue_exports.reactive)(blankFastener());
		const notice = (0, vue_exports.reactive)(blankNotice());
		const rework = (0, vue_exports.reactive)(blankRework());
		const removing = (0, vue_exports.ref)(null);
		const confirmOpen = (0, vue_exports.computed)({
			get: () => removing.value !== null,
			set: (value) => {
				if (!value) removing.value = null;
			}
		});
		const TITLE = {
			fastener: "Befestigungsmittel entfernen?",
			notice: "Hinweis entfernen?",
			rework: "Maß entfernen?"
		};
		function remove() {
			const target = removing.value;
			if (target === null || busy.value) return;
			busy.value = true;
			router.delete(`${base.value}/${PATH[target.list]}/${target.id}`, {
				preserveScroll: true,
				preserveState: true,
				errorBag: BAG,
				onFinish: () => {
					busy.value = false;
					removing.value = null;
					focus.request([OPENER[target.list], `dx-${target.list[0]}-h`]);
				}
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "dx" }, _attrs))} data-v-6e761f7c><section class="dx-list" aria-labelledby="dx-f-h" data-v-6e761f7c><h3 id="dx-f-h" class="dx-list__title" tabindex="-1" data-v-6e761f7c>Befestigungsmittel</h3>`);
			if (__props.fasteners.length) {
				_push(`<div class="adm-panel" data-v-6e761f7c><table class="adm-table" data-v-6e761f7c><caption class="visually-hidden" data-v-6e761f7c>Befestigungsmittel dieses Gutachtens</caption><thead data-v-6e761f7c><tr data-v-6e761f7c><th scope="col" data-v-6e761f7c>Nr.</th><th scope="col" data-v-6e761f7c>Gewinde und Sitz</th><th scope="col" class="num" data-v-6e761f7c>Anzugsmoment</th><th scope="col" class="num" data-v-6e761f7c>Schaft</th><th scope="col" data-v-6e761f7c>Für</th>`);
				if (__props.editable) _push(`<th scope="col" data-v-6e761f7c><span class="visually-hidden" data-v-6e761f7c>Aktionen</span></th>`);
				else _push(`<!---->`);
				_push(`</tr></thead><tbody data-v-6e761f7c><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.fasteners, (f) => {
					_push(`<tr data-v-6e761f7c><td data-label="Nr." data-v-6e761f7c><span class="adm-table__key" translate="no" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(f.number)}</span></td><td data-label="Gewinde und Sitz" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(f.thread)} · ${(0, server_renderer_exports.ssrInterpolate)(f.seat)} `);
					if (f.articleNumber) _push(`<span class="adm-table__sub" data-v-6e761f7c>Artikel ${(0, server_renderer_exports.ssrInterpolate)(f.articleNumber)}</span>`);
					else _push(`<!---->`);
					_push(`</td><td data-label="Anzugsmoment" class="num" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(f.torqueNm === null ? "–" : (0, vue_exports.unref)(withUnit)(f.torqueNm, "Nm"))}</td><td data-label="Schaft" class="num" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(f.shaftLengthMm === null ? "–" : (0, vue_exports.unref)(withUnit)(f.shaftLengthMm, "mm"))}</td><td data-label="Für" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(f.vehicleTypes ?? "Alle Fahrzeugtypen")}</td>`);
					if (__props.editable) {
						_push(`<td data-label="Aktionen" data-phone="menu" data-v-6e761f7c>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
										"data-focus": `dx-f-more-${f.id}`,
										class: "adm-iconbtn",
										disabled: busy.value,
										"aria-label": `Aktionen für Befestigungsmittel ${f.number}`
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
												"side-offset": 4,
												"collision-padding": (0, vue_exports.unref)(MENU_ROOM),
												onCloseAutoFocus: (0, vue_exports.unref)(focus).onMenuClose
											}, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item adm-menu__item--danger",
														onSelect: ($event) => removing.value = {
															list: "fastener",
															id: f.id,
															label: `${f.number} · ${f.thread}`
														}
													}, {
														default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
															if (_push) {
																_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																	name: "delete",
																	size: 20
																}, null, _parent, _scopeId));
																_push(` Entfernen `);
															} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "delete",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Entfernen ")];
														}),
														_: 2
													}, _parent, _scopeId));
													else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item adm-menu__item--danger",
														onSelect: ($event) => removing.value = {
															list: "fastener",
															id: f.id,
															label: `${f.number} · ${f.thread}`
														}
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "delete",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
														_: 1
													}, 8, ["onSelect"])];
												}),
												_: 2
											}, _parent, _scopeId));
											else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
												class: "adm-menu",
												align: "end",
												"side-offset": 4,
												"collision-padding": (0, vue_exports.unref)(MENU_ROOM),
												onCloseAutoFocus: (0, vue_exports.unref)(focus).onMenuClose
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item adm-menu__item--danger",
													onSelect: ($event) => removing.value = {
														list: "fastener",
														id: f.id,
														label: `${f.number} · ${f.thread}`
													}
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "delete",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
													_: 1
												}, 8, ["onSelect"])]),
												_: 2
											}, 1032, ["collision-padding", "onCloseAutoFocus"])];
										}),
										_: 2
									}, _parent, _scopeId));
								} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
									"data-focus": `dx-f-more-${f.id}`,
									class: "adm-iconbtn",
									disabled: busy.value,
									"aria-label": `Aktionen für Befestigungsmittel ${f.number}`
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
										name: "more",
										size: 20
									})]),
									_: 1
								}, 8, [
									"data-focus",
									"disabled",
									"aria-label"
								]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
										class: "adm-menu",
										align: "end",
										"side-offset": 4,
										"collision-padding": (0, vue_exports.unref)(MENU_ROOM),
										onCloseAutoFocus: (0, vue_exports.unref)(focus).onMenuClose
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
											class: "adm-menu__item adm-menu__item--danger",
											onSelect: ($event) => removing.value = {
												list: "fastener",
												id: f.id,
												label: `${f.number} · ${f.thread}`
											}
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "delete",
												size: 20
											}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
											_: 1
										}, 8, ["onSelect"])]),
										_: 2
									}, 1032, ["collision-padding", "onCloseAutoFocus"])]),
									_: 2
								}, 1024)];
							}),
							_: 2
						}, _parent));
						_push(`</td>`);
					} else _push(`<!---->`);
					_push(`</tr>`);
				});
				_push(`<!--]--></tbody></table></div>`);
			} else _push(`<p class="adm-note" data-v-6e761f7c>Keine eingetragen.</p>`);
			if (__props.editable && open.value !== "fastener") {
				_push(`<div data-v-6e761f7c><button id="dx-f-open" class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-6e761f7c>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "plus",
					size: 20
				}, null, _parent));
				_push(` Befestigungsmittel hinzufügen </button></div>`);
			} else _push(`<!---->`);
			if (__props.editable && open.value === "fastener") _push(`<form class="dx-form" novalidate data-v-6e761f7c><div class="dx-grid" data-v-6e761f7c><div class="form-field" data-v-6e761f7c><label class="form-field__label" for="dx-f-number" data-v-6e761f7c>Nr.</label><input id="dx-f-number"${(0, server_renderer_exports.ssrRenderAttr)("value", fastener.number)} class="input" type="text" maxlength="16" placeholder="S01"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("fastener", "number") ? "true" : void 0)} aria-describedby="dx-f-number-err" data-v-6e761f7c><p id="dx-f-number-err" class="form-field__error" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(err("fastener", "number"))}</p></div><div class="form-field" data-v-6e761f7c><label class="form-field__label" for="dx-f-thread" data-v-6e761f7c>Gewinde</label><input id="dx-f-thread"${(0, server_renderer_exports.ssrRenderAttr)("value", fastener.thread)} class="input" type="text" maxlength="32" placeholder="M14x1,25"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("fastener", "thread") ? "true" : void 0)} aria-describedby="dx-f-thread-err" data-v-6e761f7c><p id="dx-f-thread-err" class="form-field__error" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(err("fastener", "thread"))}</p></div><div class="form-field" data-v-6e761f7c><label class="form-field__label" for="dx-f-seat" data-v-6e761f7c>Sitz</label><input id="dx-f-seat"${(0, server_renderer_exports.ssrRenderAttr)("value", fastener.seat)} class="input" type="text" maxlength="48" placeholder="Kegelbund 60°"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("fastener", "seat") ? "true" : void 0)} aria-describedby="dx-f-seat-err" data-v-6e761f7c><p id="dx-f-seat-err" class="form-field__error" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(err("fastener", "seat"))}</p></div><div class="form-field" data-v-6e761f7c><label class="form-field__label" for="dx-f-torque-nm" data-v-6e761f7c>Anzugsmoment (Nm)</label><input id="dx-f-torque-nm"${(0, server_renderer_exports.ssrRenderAttr)("value", fastener.torque_nm)} class="input" type="text" maxlength="6" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("fastener", "torque_nm") ? "true" : void 0)} aria-describedby="dx-f-torque-nm-err" data-v-6e761f7c><p id="dx-f-torque-nm-err" class="form-field__error" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(err("fastener", "torque_nm"))}</p></div><div class="form-field" data-v-6e761f7c><label class="form-field__label" for="dx-f-shaft-length-mm" data-v-6e761f7c>Schaftlänge (mm)</label><input id="dx-f-shaft-length-mm"${(0, server_renderer_exports.ssrRenderAttr)("value", fastener.shaft_length_mm)} class="input" type="text" maxlength="6" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("fastener", "shaft_length_mm") ? "true" : void 0)} aria-describedby="dx-f-shaft-length-mm-err" data-v-6e761f7c><p id="dx-f-shaft-length-mm-err" class="form-field__error" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(err("fastener", "shaft_length_mm"))}</p></div><div class="form-field" data-v-6e761f7c><label class="form-field__label" for="dx-f-article-number" data-v-6e761f7c>Artikelnummer <span class="dx-optional" data-v-6e761f7c>(optional)</span></label><input id="dx-f-article-number"${(0, server_renderer_exports.ssrRenderAttr)("value", fastener.article_number)} class="input" type="text" maxlength="64" data-v-6e761f7c></div><div class="form-field dx-wide" data-v-6e761f7c><label class="form-field__label" for="dx-f-vehicle-types" data-v-6e761f7c>Für diese Fahrzeugtypen <span class="dx-optional" data-v-6e761f7c>(optional, leer: alle)</span></label><input id="dx-f-vehicle-types"${(0, server_renderer_exports.ssrRenderAttr)("value", fastener.vehicle_types)} class="input" type="text" maxlength="255" placeholder="3C, 4C" data-v-6e761f7c></div></div><div class="dx-actions" data-v-6e761f7c><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value && sent.value === "fastener" ? "true" : void 0)} data-v-6e761f7c>Speichern</button><button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-6e761f7c>Schließen</button></div></form>`);
			else _push(`<!---->`);
			_push(`</section><section class="dx-list" aria-labelledby="dx-n-h" data-v-6e761f7c><h3 id="dx-n-h" class="dx-list__title" tabindex="-1" data-v-6e761f7c>Pflichthinweise</h3><p class="adm-note" data-v-6e761f7c>Was das Gutachten immer sagt – etwa das Nachziehen der Radschrauben nach 50 km. Der Shop zeigt es bei jeder Freigabe.</p>`);
			if (__props.notices.length) {
				_push(`<ul class="dx-notices" data-v-6e761f7c><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.notices, (n) => {
					_push(`<li class="dx-notice" data-v-6e761f7c><span data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(n.text)}`);
					if (n.page) _push(`<span class="dx-page" data-v-6e761f7c> · S. ${(0, server_renderer_exports.ssrInterpolate)(n.page)}</span>`);
					else _push(`<!---->`);
					_push(`</span>`);
					if (__props.editable) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
									"data-focus": `dx-n-more-${n.id}`,
									class: "adm-iconbtn",
									disabled: busy.value,
									"aria-label": "Aktionen für diesen Hinweis"
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
											"side-offset": 4,
											"collision-padding": (0, vue_exports.unref)(MENU_ROOM),
											onCloseAutoFocus: (0, vue_exports.unref)(focus).onMenuClose
										}, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item adm-menu__item--danger",
													onSelect: ($event) => removing.value = {
														list: "notice",
														id: n.id,
														label: n.text
													}
												}, {
													default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
														if (_push) {
															_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																name: "delete",
																size: 20
															}, null, _parent, _scopeId));
															_push(` Entfernen `);
														} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "delete",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Entfernen ")];
													}),
													_: 2
												}, _parent, _scopeId));
												else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item adm-menu__item--danger",
													onSelect: ($event) => removing.value = {
														list: "notice",
														id: n.id,
														label: n.text
													}
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "delete",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
													_: 1
												}, 8, ["onSelect"])];
											}),
											_: 2
										}, _parent, _scopeId));
										else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
											class: "adm-menu",
											align: "end",
											"side-offset": 4,
											"collision-padding": (0, vue_exports.unref)(MENU_ROOM),
											onCloseAutoFocus: (0, vue_exports.unref)(focus).onMenuClose
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "adm-menu__item adm-menu__item--danger",
												onSelect: ($event) => removing.value = {
													list: "notice",
													id: n.id,
													label: n.text
												}
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "delete",
													size: 20
												}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
												_: 1
											}, 8, ["onSelect"])]),
											_: 2
										}, 1032, ["collision-padding", "onCloseAutoFocus"])];
									}),
									_: 2
								}, _parent, _scopeId));
							} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
								"data-focus": `dx-n-more-${n.id}`,
								class: "adm-iconbtn",
								disabled: busy.value,
								"aria-label": "Aktionen für diesen Hinweis"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "more",
									size: 20
								})]),
								_: 1
							}, 8, ["data-focus", "disabled"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
									class: "adm-menu",
									align: "end",
									"side-offset": 4,
									"collision-padding": (0, vue_exports.unref)(MENU_ROOM),
									onCloseAutoFocus: (0, vue_exports.unref)(focus).onMenuClose
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
										class: "adm-menu__item adm-menu__item--danger",
										onSelect: ($event) => removing.value = {
											list: "notice",
											id: n.id,
											label: n.text
										}
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "delete",
											size: 20
										}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
										_: 1
									}, 8, ["onSelect"])]),
									_: 2
								}, 1032, ["collision-padding", "onCloseAutoFocus"])]),
								_: 2
							}, 1024)];
						}),
						_: 2
					}, _parent));
					else _push(`<!---->`);
					_push(`</li>`);
				});
				_push(`<!--]--></ul>`);
			} else _push(`<!---->`);
			if (__props.editable && open.value !== "notice") {
				_push(`<div data-v-6e761f7c><button id="dx-n-open" class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-6e761f7c>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "plus",
					size: 20
				}, null, _parent));
				_push(` Hinweis hinzufügen </button></div>`);
			} else _push(`<!---->`);
			if (__props.editable && open.value === "notice") _push(`<form class="dx-form" novalidate data-v-6e761f7c><div class="form-field" data-v-6e761f7c><label class="form-field__label" for="dx-n-text-de" data-v-6e761f7c>Hinweis, als ganzer Satz</label><textarea id="dx-n-text-de" class="input dx-area" rows="2" maxlength="1000"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("notice", "text_de") ? "true" : void 0)} aria-describedby="dx-n-text-de-err" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(notice.text_de)}</textarea><p id="dx-n-text-de-err" class="form-field__error" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(err("notice", "text_de"))}</p></div><div class="form-field dx-narrow" data-v-6e761f7c><label class="form-field__label" for="dx-n-source-page" data-v-6e761f7c>Seite <span class="dx-optional" data-v-6e761f7c>(optional)</span></label><input id="dx-n-source-page"${(0, server_renderer_exports.ssrRenderAttr)("value", notice.source_page)} class="input" type="number" min="1"${(0, server_renderer_exports.ssrRenderAttr)("max", __props.pageCount ?? void 0)} inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("notice", "source_page") ? "true" : void 0)} aria-describedby="dx-n-source-page-err" data-v-6e761f7c><p id="dx-n-source-page-err" class="form-field__error" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(err("notice", "source_page"))}</p></div><div class="dx-actions" data-v-6e761f7c><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value && sent.value === "notice" ? "true" : void 0)} data-v-6e761f7c>Speichern</button><button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-6e761f7c>Schließen</button></div></form>`);
			else _push(`<!---->`);
			_push(`</section>`);
			if (reworkCodes.value.length || __props.reworks.length) {
				_push(`<section class="dx-list" aria-labelledby="dx-r-h" data-v-6e761f7c><h3 id="dx-r-h" class="dx-list__title" tabindex="-1" data-v-6e761f7c>Nacharbeit mit Maßen</h3>`);
				if (__props.reworks.length) {
					_push(`<div class="adm-panel" data-v-6e761f7c><table class="adm-table" data-v-6e761f7c><caption class="visually-hidden" data-v-6e761f7c>Maße der Nacharbeit</caption><thead data-v-6e761f7c><tr data-v-6e761f7c><th scope="col" data-v-6e761f7c>Code</th><th scope="col" data-v-6e761f7c>Fahrzeugtyp</th><th scope="col" data-v-6e761f7c>Achse</th><th scope="col" data-v-6e761f7c>Maß</th>`);
					if (__props.editable) _push(`<th scope="col" data-v-6e761f7c><span class="visually-hidden" data-v-6e761f7c>Aktionen</span></th>`);
					else _push(`<!---->`);
					_push(`</tr></thead><tbody data-v-6e761f7c><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.reworks, (r) => {
						_push(`<tr data-v-6e761f7c><td data-label="Code" data-v-6e761f7c><span class="adm-table__key" translate="no" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(r.code)}</span></td><td data-label="Fahrzeugtyp" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(r.vehicleType)}</td><td data-label="Achse" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(AXLE[r.axle])}</td><td data-label="Maß" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(r.measure)} `);
						if (r.note) _push(`<span class="adm-table__sub" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(r.note)}</span>`);
						else _push(`<!---->`);
						_push(`</td>`);
						if (__props.editable) {
							_push(`<td data-label="Aktionen" data-phone="menu" data-v-6e761f7c>`);
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
											"data-focus": `dx-r-more-${r.id}`,
											class: "adm-iconbtn",
											disabled: busy.value,
											"aria-label": `Aktionen für das Maß ${r.code}, ${r.vehicleType}`
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
													"side-offset": 4,
													"collision-padding": (0, vue_exports.unref)(MENU_ROOM),
													onCloseAutoFocus: (0, vue_exports.unref)(focus).onMenuClose
												}, {
													default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
														if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
															class: "adm-menu__item adm-menu__item--danger",
															onSelect: ($event) => removing.value = {
																list: "rework",
																id: r.id,
																label: `${r.code} · ${r.vehicleType} · ${r.measure}`
															}
														}, {
															default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																if (_push) {
																	_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																		name: "delete",
																		size: 20
																	}, null, _parent, _scopeId));
																	_push(` Entfernen `);
																} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "delete",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Entfernen ")];
															}),
															_: 2
														}, _parent, _scopeId));
														else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
															class: "adm-menu__item adm-menu__item--danger",
															onSelect: ($event) => removing.value = {
																list: "rework",
																id: r.id,
																label: `${r.code} · ${r.vehicleType} · ${r.measure}`
															}
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "delete",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
															_: 1
														}, 8, ["onSelect"])];
													}),
													_: 2
												}, _parent, _scopeId));
												else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
													class: "adm-menu",
													align: "end",
													"side-offset": 4,
													"collision-padding": (0, vue_exports.unref)(MENU_ROOM),
													onCloseAutoFocus: (0, vue_exports.unref)(focus).onMenuClose
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item adm-menu__item--danger",
														onSelect: ($event) => removing.value = {
															list: "rework",
															id: r.id,
															label: `${r.code} · ${r.vehicleType} · ${r.measure}`
														}
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "delete",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
														_: 1
													}, 8, ["onSelect"])]),
													_: 2
												}, 1032, ["collision-padding", "onCloseAutoFocus"])];
											}),
											_: 2
										}, _parent, _scopeId));
									} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
										"data-focus": `dx-r-more-${r.id}`,
										class: "adm-iconbtn",
										disabled: busy.value,
										"aria-label": `Aktionen für das Maß ${r.code}, ${r.vehicleType}`
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "more",
											size: 20
										})]),
										_: 1
									}, 8, [
										"data-focus",
										"disabled",
										"aria-label"
									]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
											class: "adm-menu",
											align: "end",
											"side-offset": 4,
											"collision-padding": (0, vue_exports.unref)(MENU_ROOM),
											onCloseAutoFocus: (0, vue_exports.unref)(focus).onMenuClose
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "adm-menu__item adm-menu__item--danger",
												onSelect: ($event) => removing.value = {
													list: "rework",
													id: r.id,
													label: `${r.code} · ${r.vehicleType} · ${r.measure}`
												}
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "delete",
													size: 20
												}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
												_: 1
											}, 8, ["onSelect"])]),
											_: 2
										}, 1032, ["collision-padding", "onCloseAutoFocus"])]),
										_: 2
									}, 1024)];
								}),
								_: 2
							}, _parent));
							_push(`</td>`);
						} else _push(`<!---->`);
						_push(`</tr>`);
					});
					_push(`<!--]--></tbody></table></div>`);
				} else _push(`<!---->`);
				if (__props.editable && reworkCodes.value.length && open.value !== "rework") {
					_push(`<div data-v-6e761f7c><button id="dx-r-open" class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-6e761f7c>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "plus",
						size: 20
					}, null, _parent));
					_push(` Maß hinzufügen </button></div>`);
				} else _push(`<!---->`);
				if (__props.editable && reworkCodes.value.length && open.value === "rework") {
					_push(`<form class="dx-form" novalidate data-v-6e761f7c><div class="dx-grid" data-v-6e761f7c><div class="form-field" data-v-6e761f7c><label class="form-field__label" for="dx-r-document-condition-id" data-v-6e761f7c>Code</label><select id="dx-r-document-condition-id" class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("rework", "document_condition_id") ? "true" : void 0)} aria-describedby="dx-r-document-condition-id-err" data-v-6e761f7c><option${(0, server_renderer_exports.ssrRenderAttr)("value", null)} disabled data-v-6e761f7c${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(rework.document_condition_id) ? (0, server_renderer_exports.ssrLooseContain)(rework.document_condition_id, null) : (0, server_renderer_exports.ssrLooseEqual)(rework.document_condition_id, null)) ? " selected" : ""}>Bitte wählen</option><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(reworkCodes.value, (c) => {
						_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", c.id)} data-v-6e761f7c${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(rework.document_condition_id) ? (0, server_renderer_exports.ssrLooseContain)(rework.document_condition_id, c.id) : (0, server_renderer_exports.ssrLooseEqual)(rework.document_condition_id, c.id)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(c.code)}</option>`);
					});
					_push(`<!--]--></select><p id="dx-r-document-condition-id-err" class="form-field__error" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(err("rework", "document_condition_id"))}</p></div><div class="form-field" data-v-6e761f7c><label class="form-field__label" for="dx-r-vehicle-type" data-v-6e761f7c>Fahrzeugtyp</label><input id="dx-r-vehicle-type"${(0, server_renderer_exports.ssrRenderAttr)("value", rework.vehicle_type)} class="input" type="text" maxlength="64" placeholder="3C"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("rework", "vehicle_type") ? "true" : void 0)} aria-describedby="dx-r-vehicle-type-err" data-v-6e761f7c><p id="dx-r-vehicle-type-err" class="form-field__error" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(err("rework", "vehicle_type"))}</p></div><div class="form-field" data-v-6e761f7c><label class="form-field__label" for="dx-r-axle" data-v-6e761f7c>Achse</label><select id="dx-r-axle" class="input" data-v-6e761f7c><option value="ALL" data-v-6e761f7c${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(rework.axle) ? (0, server_renderer_exports.ssrLooseContain)(rework.axle, "ALL") : (0, server_renderer_exports.ssrLooseEqual)(rework.axle, "ALL")) ? " selected" : ""}>Alle Achsen</option><option value="FRONT" data-v-6e761f7c${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(rework.axle) ? (0, server_renderer_exports.ssrLooseContain)(rework.axle, "FRONT") : (0, server_renderer_exports.ssrLooseEqual)(rework.axle, "FRONT")) ? " selected" : ""}>Vorderachse</option><option value="REAR" data-v-6e761f7c${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(rework.axle) ? (0, server_renderer_exports.ssrLooseContain)(rework.axle, "REAR") : (0, server_renderer_exports.ssrLooseEqual)(rework.axle, "REAR")) ? " selected" : ""}>Hinterachse</option></select></div><div class="form-field" data-v-6e761f7c><label class="form-field__label" for="dx-r-from-mm" data-v-6e761f7c>Von (mm)</label><input id="dx-r-from-mm"${(0, server_renderer_exports.ssrRenderAttr)("value", rework.from_mm)} class="input" type="text" inputmode="decimal" maxlength="6"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("rework", "from_mm") ? "true" : void 0)} aria-describedby="dx-r-from-mm-err" data-v-6e761f7c><p id="dx-r-from-mm-err" class="form-field__error" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(err("rework", "from_mm"))}</p></div><div class="form-field" data-v-6e761f7c><label class="form-field__label" for="dx-r-to-mm" data-v-6e761f7c>Bis (mm)</label><input id="dx-r-to-mm"${(0, server_renderer_exports.ssrRenderAttr)("value", rework.to_mm)} class="input" type="text" inputmode="decimal" maxlength="6"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("rework", "to_mm") ? "true" : void 0)} aria-describedby="dx-r-to-mm-err" data-v-6e761f7c><p id="dx-r-to-mm-err" class="form-field__error" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(err("rework", "to_mm"))}</p></div><div class="form-field" data-v-6e761f7c><label class="form-field__label" for="dx-r-flare-mm" data-v-6e761f7c>Aufweitung (mm)</label><input id="dx-r-flare-mm"${(0, server_renderer_exports.ssrRenderAttr)("value", rework.flare_mm)} class="input" type="text" inputmode="decimal" maxlength="5"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("rework", "flare_mm") ? "true" : void 0)} aria-describedby="dx-r-flare-mm-err" data-v-6e761f7c><p id="dx-r-flare-mm-err" class="form-field__error" data-v-6e761f7c>${(0, server_renderer_exports.ssrInterpolate)(err("rework", "flare_mm"))}</p></div></div><div class="dx-actions" data-v-6e761f7c><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value && sent.value === "rework" ? "true" : void 0)} data-v-6e761f7c>Speichern</button><button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-6e761f7c>Schließen</button></div></form>`);
				} else _push(`<!---->`);
				_push(`</section>`);
			} else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
				open: confirmOpen.value,
				"onUpdate:open": ($event) => confirmOpen.value = $event,
				title: removing.value ? TITLE[removing.value.list] : "",
				body: removing.value ? `„${removing.value.label}“ wird aus diesem Gutachten entfernt. Das Protokoll hält fest, wer es war.` : "",
				"confirm-label": "Entfernen",
				busy: busy.value,
				onConfirm: remove
			}, null, _parent));
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/DocumentExtras.vue
var DocumentExtras_exports = /* @__PURE__ */ __exportAll({ default: () => DocumentExtras_default });
var _sfc_setup = DocumentExtras_vue_vue_type_script_setup_true_lang_default.setup;
DocumentExtras_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/DocumentExtras.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var DocumentExtras_default = /*#__PURE__*/ _plugin_vue_export_helper_default(DocumentExtras_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-6e761f7c"]]);
//#endregion
export { DocumentExtras_exports as n, DocumentExtras_default as t };
