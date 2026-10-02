import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { a as DropdownMenuRoot_default, i as DropdownMenuContent_default, n as DropdownMenuPortal_default, r as DropdownMenuItem_default, t as DropdownMenuTrigger_default } from "./DropdownMenuTrigger-DR2ieCu7.js";
import { t as DropdownMenuSeparator_default } from "./DropdownMenuSeparator-KcmMgHOf.js";
import { c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-B-w0IEde.js";
import { t as AdminConfirm_default } from "./AdminConfirm-B0U_hb1E.js";
import { n as formatNumber } from "./num-Br8qlecZ.js";
import { t as MENU_ROOM } from "./menu-CcR9FXu6.js";
import { n as useFocusAfter } from "./useFocusAfter-B30tsjKa.js";
//#region resources/js/Pages/Admin/Gutachten/Auflagenverzeichnis.vue?vue&type=script&setup=true&lang.ts
var BAG = "auflagen";
var Auflagenverzeichnis_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Auflagenverzeichnis",
	__ssrInlineRender: true,
	props: {
		documentId: {},
		conditions: {},
		choices: {},
		unresolved: {},
		editable: { type: Boolean },
		pageCount: {},
		levels: {},
		levelsEditable: { type: Boolean },
		levelFloorSentence: {}
	},
	setup(__props) {
		/**
		* Step 4 of the entry flow: this Gutachten's own Auflagenverzeichnis — the codes it prints, each with its
		* kind, its whole sentence and its page (the corrections memo §1).
		*
		* A code means what this document says and nothing else; rows of this document carry codes, and the
		* shop reads each sentence here. Nothing is classified by the machine: a pasted legend is split at its
		* codes for a person to correct, and every code gets its kind from that person — the kind decides what a
		* customer is told. A code a row still carries is not taken away (the server says so). A code a row
		* carries that is not defined here is listed on top: the row is UNKNOWN until it is.
		*/
		const props = __props;
		function levelLabel(value) {
			return props.levels?.find((l) => l.value === value)?.label ?? "–";
		}
		const page = usePage();
		const focus = useFocusAfter();
		const base = (0, vue_exports.computed)(() => `/admin/gutachten/${props.documentId}/auflagen`);
		const busy = (0, vue_exports.ref)(false);
		const sent = (0, vue_exports.ref)(false);
		const bag = (0, vue_exports.computed)(() => {
			const raw = page.props.errors?.[BAG];
			return raw !== null && typeof raw === "object" ? raw : {};
		});
		const errors = (0, vue_exports.computed)(() => sent.value ? bag.value : {});
		const listError = (0, vue_exports.computed)(() => bag.value.condition ?? "");
		const levelError = (0, vue_exports.computed)(() => bag.value.level ?? "");
		function blank() {
			return {
				code: "",
				kind: "",
				text_de: "",
				source_page: "",
				body_forms: [],
				drive: {
					mode: "only",
					drive: ""
				},
				max_axle_load_kg: "",
				axle: ""
			};
		}
		const form = (0, vue_exports.reactive)(blank());
		const editing = (0, vue_exports.ref)(null);
		const formOpen = (0, vue_exports.ref)(false);
		function openEdit(condition) {
			Object.assign(form, {
				code: condition.code,
				kind: condition.kind,
				text_de: condition.text,
				source_page: condition.page ?? "",
				body_forms: [...condition.bodyForms],
				drive: condition.drive ?? {
					mode: "only",
					drive: ""
				},
				max_axle_load_kg: condition.maxAxleLoadKg ?? "",
				axle: condition.axle ?? ""
			});
			editing.value = condition.id;
			sent.value = false;
			formOpen.value = true;
			focus.request("av-code", { scroll: true });
		}
		const removing = (0, vue_exports.ref)(null);
		const confirmOpen = (0, vue_exports.computed)({
			get: () => removing.value !== null,
			set: (open) => {
				if (!open) removing.value = null;
			}
		});
		function remove() {
			const condition = removing.value;
			if (condition === null) return;
			const index = props.conditions.findIndex((c) => c.id === condition.id);
			const neighbours = [props.conditions[index + 1]?.id, props.conditions[index - 1]?.id].filter((id) => id !== void 0).map((id) => `av-more-${id}`);
			busy.value = true;
			router.delete(`${base.value}/${condition.id}`, {
				preserveScroll: true,
				preserveState: true,
				errorBag: BAG,
				onSuccess: () => {
					removing.value = null;
					focus.request([...neighbours, "av-new"]);
				},
				onError: () => {
					removing.value = null;
					focus.request(`av-more-${condition.id}`);
				},
				onFinish: () => {
					busy.value = false;
				}
			});
		}
		const pasteOpen = (0, vue_exports.ref)(false);
		const pasted = (0, vue_exports.ref)("");
		const split = (0, vue_exports.ref)([]);
		const pasteSent = (0, vue_exports.ref)(false);
		const splitReady = (0, vue_exports.computed)(() => split.value.length > 0 && split.value.every((entry) => entry.kind !== "" && entry.code.trim() !== "" && entry.text_de.trim() !== ""));
		function splitError(index, field) {
			return pasteSent.value ? bag.value[`entries.${index}.${field}`] ?? "" : "";
		}
		function parameter(condition) {
			if (condition.kind === "karosserieform") return condition.bodyForms.length ? `Nur: ${condition.bodyForms.join(", ")}` : "Karosserieformen fehlen";
			if (condition.kind === "antrieb" && condition.drive) return `${condition.drive.mode === "only" ? "Nur mit" : "Nicht mit"} ${condition.drive.drive}`;
			if (condition.kind === "reifen_tragfaehigkeit" && condition.maxAxleLoadKg !== null) return `Achslast bis ${formatNumber(condition.maxAxleLoadKg)} kg`;
			if (condition.kind === "reifen_achse" && condition.axle) return condition.axle === "FRONT" ? "Nur Vorderachse" : "Nur Hinterachse";
			return "";
		}
		function uses(condition) {
			return condition.uses === 0 ? "–" : formatNumber(condition.uses);
		}
		const limitWarnings = (0, vue_exports.computed)(() => props.conditions.filter((condition) => Boolean(condition.limitWarning)));
		const limitReasons = (0, vue_exports.reactive)({});
		const limitErrors = (0, vue_exports.reactive)({});
		/** The condition whose confirmation is on its way: its button shows it. */
		const limitBusy = (0, vue_exports.ref)(null);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "av" }, _attrs))} data-v-02e632a3>`);
			if (__props.unresolved.length) _push(`<p class="adm-alert" role="alert" data-v-02e632a3> Nicht im Auflagenverzeichnis: ${(0, server_renderer_exports.ssrInterpolate)(__props.unresolved.map((u) => u.code).join(", "))}. Zeilen mit diesen Codes bleiben „Unbekannt“, bis der Code hier steht – und das Gutachten ist so lange nicht freigebbar. </p>`);
			else _push(`<!---->`);
			if (listError.value) _push(`<p class="adm-alert" role="alert" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(listError.value)}</p>`);
			else _push(`<!---->`);
			if (__props.conditions.length) {
				_push(`<div class="adm-panel" data-v-02e632a3><table class="adm-table av__table" data-v-02e632a3><caption class="visually-hidden" data-v-02e632a3>Auflagenverzeichnis dieses Gutachtens</caption><thead data-v-02e632a3><tr data-v-02e632a3><th scope="col" data-v-02e632a3>Code</th><th scope="col" data-v-02e632a3>Art</th><th scope="col" data-v-02e632a3>Satz aus dem Gutachten</th>`);
				if (__props.levels) _push(`<th scope="col" data-v-02e632a3>Im Shop</th>`);
				else _push(`<!---->`);
				_push(`<th scope="col" class="num" data-v-02e632a3>Seite</th><th scope="col" class="num" data-v-02e632a3>Verwendet</th>`);
				if (__props.editable) _push(`<th scope="col" data-v-02e632a3><span class="visually-hidden" data-v-02e632a3>Aktionen</span></th>`);
				else _push(`<!---->`);
				_push(`</tr></thead><tbody data-v-02e632a3><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.conditions, (condition) => {
					_push(`<tr data-v-02e632a3><td data-label="Code" data-v-02e632a3><span class="adm-table__key av__code" translate="no" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(condition.code)}</span></td><td data-label="Art" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(condition.kindLabel)} `);
					if (parameter(condition)) _push(`<span class="adm-table__sub" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(parameter(condition))}</span>`);
					else _push(`<!---->`);
					_push(`</td><td data-label="Satz" class="av__text" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(condition.text)}</td>`);
					if (__props.levels) {
						_push(`<td data-label="Im Shop" class="av__level" data-v-02e632a3>`);
						if (__props.levelsEditable) {
							_push(`<!--[--><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", `av-level-${condition.id}`)} data-v-02e632a3>So erscheint Code ${(0, server_renderer_exports.ssrInterpolate)(condition.code)} im Shop</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `av-level-${condition.id}`)} class="input av__level-select"${(0, server_renderer_exports.ssrRenderAttr)("value", condition.level)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-02e632a3><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.levels, (level) => {
								_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", level.value)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(level.value === "hinweis" && condition.levelFloor === "auflage") ? " disabled" : ""} data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(level.label)}</option>`);
							});
							_push(`<!--]--></select><!--]-->`);
						} else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(levelLabel(condition.level))}<!--]-->`);
						_push(`</td>`);
					} else _push(`<!---->`);
					_push(`<td data-label="Seite" class="num" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(condition.page ?? "–")}</td><td data-label="Verwendet" data-phone="hide" class="num" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(uses(condition))}</td>`);
					if (__props.editable) {
						_push(`<td data-label="Aktionen" data-phone="menu" data-v-02e632a3>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
										"data-focus": `av-more-${condition.id}`,
										class: "adm-iconbtn",
										disabled: busy.value,
										"aria-label": `Aktionen für Code ${condition.code}`
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
													if (_push) {
														_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
															class: "adm-menu__item",
															onSelect: ($event) => openEdit(condition)
														}, {
															default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																if (_push) {
																	_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																		name: "edit",
																		size: 20
																	}, null, _parent, _scopeId));
																	_push(` Bearbeiten `);
																} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "edit",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Bearbeiten ")];
															}),
															_: 2
														}, _parent, _scopeId));
														if (condition.uses === 0) {
															_push(`<!--[-->`);
															_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }, null, _parent, _scopeId));
															_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																class: "adm-menu__item adm-menu__item--danger",
																onSelect: ($event) => removing.value = condition
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
															_push(`<!--]-->`);
														} else _push(`<!---->`);
													} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														onSelect: ($event) => openEdit(condition)
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "edit",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Bearbeiten ")]),
														_: 1
													}, 8, ["onSelect"]), condition.uses === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item adm-menu__item--danger",
														onSelect: ($event) => removing.value = condition
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "delete",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
														_: 1
													}, 8, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true)];
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
													class: "adm-menu__item",
													onSelect: ($event) => openEdit(condition)
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "edit",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Bearbeiten ")]),
													_: 1
												}, 8, ["onSelect"]), condition.uses === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item adm-menu__item--danger",
													onSelect: ($event) => removing.value = condition
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "delete",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
													_: 1
												}, 8, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true)]),
												_: 2
											}, 1032, ["collision-padding", "onCloseAutoFocus"])];
										}),
										_: 2
									}, _parent, _scopeId));
								} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
									"data-focus": `av-more-${condition.id}`,
									class: "adm-iconbtn",
									disabled: busy.value,
									"aria-label": `Aktionen für Code ${condition.code}`
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
											class: "adm-menu__item",
											onSelect: ($event) => openEdit(condition)
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "edit",
												size: 20
											}), (0, vue_exports.createTextVNode)(" Bearbeiten ")]),
											_: 1
										}, 8, ["onSelect"]), condition.uses === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
											class: "adm-menu__item adm-menu__item--danger",
											onSelect: ($event) => removing.value = condition
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "delete",
												size: 20
											}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
											_: 1
										}, 8, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true)]),
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
			} else _push(`<p class="adm-note" data-v-02e632a3>Noch kein Code. Trag die Auflagen so ein, wie das Gutachten sie druckt – einzeln oder als ganze Legende.</p>`);
			if (__props.levels && __props.conditions.length) {
				_push(`<p class="adm-note av__levels-note" data-v-02e632a3> „Im Shop“ bestimmt, wie eine Auflage erscheint: Ein Hinweis steht ruhig in Schwarz, eine Auflage gelb. Sind alle Auflagen einer Felge Hinweise, steht „Freigegeben“ statt „Mit Auflagen“. Am Urteil des Gutachtens ändert das nichts. `);
				if (__props.conditions.some((c) => c.levelFloor === "auflage")) _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(__props.levelFloorSentence)}<!--]-->`);
				else _push(`<!---->`);
				_push(`</p>`);
			} else _push(`<!---->`);
			if (levelError.value) _push(`<p class="adm-alert" role="alert" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(levelError.value)}</p>`);
			else _push(`<!---->`);
			_push(`<!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(limitWarnings.value, (condition) => {
				_push(`<div class="av-limit" data-v-02e632a3><p class="${(0, server_renderer_exports.ssrRenderClass)(condition.limitConfirmed ? "adm-note" : "adm-alert")}"${(0, server_renderer_exports.ssrRenderAttr)("role", condition.limitConfirmed ? void 0 : "alert")} data-v-02e632a3><span translate="no" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(condition.code)}</span>: ${(0, server_renderer_exports.ssrInterpolate)(condition.limitWarning)}</p>`);
				if (condition.limitConfirmed) _push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `av-limit-done-${condition.id}`)} class="adm-note av-limit__done" tabindex="-1" data-v-02e632a3> Bestätigt${(0, server_renderer_exports.ssrInterpolate)(condition.limitConfirmed.by ? ` von ${condition.limitConfirmed.by}` : "")} am ${(0, server_renderer_exports.ssrInterpolate)(condition.limitConfirmed.at)}: „${(0, server_renderer_exports.ssrInterpolate)(condition.limitConfirmed.reason)}“ </p>`);
				else if (__props.editable) _push(`<form class="av-limit__form" novalidate data-v-02e632a3><div class="form-field" data-v-02e632a3><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `av-limit-${condition.id}`)} data-v-02e632a3>Warum steht die Zahl so im Gutachten?</label><textarea${(0, server_renderer_exports.ssrRenderAttr)("id", `av-limit-${condition.id}`)} class="input" rows="2" maxlength="500"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", limitErrors[condition.id] ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `av-limit-${condition.id}-err`)} data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(limitReasons[condition.id])}</textarea><p${(0, server_renderer_exports.ssrRenderAttr)("id", `av-limit-${condition.id}-err`)} class="form-field__error" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(limitErrors[condition.id])}</p></div><div data-v-02e632a3><button class="btn btn--secondary btn--sm" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value || limitBusy.value === condition.id) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", limitBusy.value === condition.id ? "true" : void 0)} data-v-02e632a3> Zahl bestätigen </button></div></form>`);
				else _push(`<!---->`);
				_push(`</div>`);
			});
			_push(`<!--]-->`);
			if (__props.editable && !formOpen.value && !pasteOpen.value) {
				_push(`<div class="av__actions" data-v-02e632a3><button id="av-new" class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-02e632a3>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "plus",
					size: 20
				}, null, _parent));
				_push(` Code hinzufügen </button><button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-02e632a3>Legende einfügen</button></div>`);
			} else _push(`<!---->`);
			if (formOpen.value) {
				_push(`<div class="av__form" role="group"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", editing.value === null ? "Neuer Code" : `Code ${form.code} bearbeiten`)} data-v-02e632a3><div class="av__pair" data-v-02e632a3><div class="form-field" data-v-02e632a3><label class="form-field__label" for="av-code" data-v-02e632a3>Code</label><input id="av-code"${(0, server_renderer_exports.ssrRenderAttr)("value", form.code)} class="input av__code-input" type="text" maxlength="32" spellcheck="false" autocomplete="off" translate="no"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.code ? "true" : void 0)} aria-describedby="av-code-err" data-v-02e632a3><p id="av-code-err" class="form-field__error" aria-live="polite" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(errors.value.code)}</p></div><div class="form-field" data-v-02e632a3><label class="form-field__label" for="av-kind" data-v-02e632a3>Art</label><select id="av-kind" class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.kind ? "true" : void 0)} aria-describedby="av-kind-help av-kind-err" data-v-02e632a3><option value="" disabled data-v-02e632a3${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.kind) ? (0, server_renderer_exports.ssrLooseContain)(form.kind, "") : (0, server_renderer_exports.ssrLooseEqual)(form.kind, "")) ? " selected" : ""}>Bitte wählen</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.choices.kinds, (kind) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", kind.value)} data-v-02e632a3${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.kind) ? (0, server_renderer_exports.ssrLooseContain)(form.kind, kind.value) : (0, server_renderer_exports.ssrLooseEqual)(form.kind, kind.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(kind.label)}</option>`);
				});
				_push(`<!--]--></select><p id="av-kind-help" class="form-field__help" data-v-02e632a3>Die Art entscheidet, wo und wie laut der Satz im Shop steht.</p><p id="av-kind-err" class="form-field__error" aria-live="polite" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(errors.value.kind)}</p></div></div><div class="form-field" data-v-02e632a3><label class="form-field__label" for="av-text" data-v-02e632a3>Satz aus dem Gutachten</label><textarea id="av-text" class="input av__textarea" rows="3" maxlength="2000"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.text_de ? "true" : void 0)} aria-describedby="av-text-err" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(form.text_de)}</textarea><p id="av-text-err" class="form-field__error" aria-live="polite" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(errors.value.text_de)}</p></div><div class="form-field" data-v-02e632a3><label class="form-field__label" for="av-page" data-v-02e632a3>Seite im Gutachten <span class="av__optional" data-v-02e632a3>(optional)</span></label><input id="av-page"${(0, server_renderer_exports.ssrRenderAttr)("value", form.source_page)} class="input av__narrow" type="number" min="1"${(0, server_renderer_exports.ssrRenderAttr)("max", __props.pageCount ?? void 0)} inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.source_page ? "true" : void 0)} aria-describedby="av-page-err" data-v-02e632a3><p id="av-page-err" class="form-field__error" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(errors.value.source_page)}</p></div>`);
				if (form.kind === "karosserieform") {
					_push(`<fieldset class="av__group" data-v-02e632a3><legend class="form-field__label" data-v-02e632a3>Nur für diese Karosserieformen</legend><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.choices.bodyForms, (bodyForm, i) => {
						_push(`<label class="check" data-v-02e632a3><input${(0, server_renderer_exports.ssrRenderAttr)("id", `av-body-${i}`)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.body_forms) ? (0, server_renderer_exports.ssrLooseContain)(form.body_forms, bodyForm) : form.body_forms) ? " checked" : ""} type="checkbox"${(0, server_renderer_exports.ssrRenderAttr)("value", bodyForm)} data-v-02e632a3> ${(0, server_renderer_exports.ssrInterpolate)(bodyForm)}</label>`);
					});
					_push(`<!--]--><p class="form-field__error" aria-live="polite" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(errors.value.body_forms)}</p></fieldset>`);
				} else _push(`<!---->`);
				if (form.kind === "antrieb") {
					_push(`<div class="av__pair" data-v-02e632a3><div class="form-field" data-v-02e632a3><label class="form-field__label" for="av-drive-mode" data-v-02e632a3>Gilt</label><select id="av-drive-mode" class="input" data-v-02e632a3><option value="only" data-v-02e632a3${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.drive.mode) ? (0, server_renderer_exports.ssrLooseContain)(form.drive.mode, "only") : (0, server_renderer_exports.ssrLooseEqual)(form.drive.mode, "only")) ? " selected" : ""}>nur mit</option><option value="not" data-v-02e632a3${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.drive.mode) ? (0, server_renderer_exports.ssrLooseContain)(form.drive.mode, "not") : (0, server_renderer_exports.ssrLooseEqual)(form.drive.mode, "not")) ? " selected" : ""}>nicht mit</option></select></div><div class="form-field" data-v-02e632a3><label class="form-field__label" for="av-drive" data-v-02e632a3>Antrieb</label><select id="av-drive" class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value["drive.drive"] ? "true" : void 0)} aria-describedby="av-drive-err" data-v-02e632a3><option value="" disabled data-v-02e632a3${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.drive.drive) ? (0, server_renderer_exports.ssrLooseContain)(form.drive.drive, "") : (0, server_renderer_exports.ssrLooseEqual)(form.drive.drive, "")) ? " selected" : ""}>Bitte wählen</option><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.choices.drives, (drive) => {
						_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", drive)} data-v-02e632a3${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.drive.drive) ? (0, server_renderer_exports.ssrLooseContain)(form.drive.drive, drive) : (0, server_renderer_exports.ssrLooseEqual)(form.drive.drive, drive)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(drive)}</option>`);
					});
					_push(`<!--]--></select><p id="av-drive-err" class="form-field__error" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(errors.value["drive.drive"] ?? errors.value.drive)}</p></div></div>`);
				} else _push(`<!---->`);
				if (form.kind === "reifen_tragfaehigkeit") _push(`<div class="form-field" data-v-02e632a3><label class="form-field__label" for="av-load" data-v-02e632a3>Gilt bis zur zulässigen Achslast (kg)</label><input id="av-load"${(0, server_renderer_exports.ssrRenderAttr)("value", form.max_axle_load_kg)} class="input av__narrow" type="number" min="200" max="4000" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.max_axle_load_kg ? "true" : void 0)} aria-describedby="av-load-help av-load-err" data-v-02e632a3><p id="av-load-help" class="form-field__help" data-v-02e632a3>Die Zahl aus dem Satz, zum Beispiel 1120. Der Shop vergleicht sie mit Feld 8.1 und 8.2 der Zulassungsbescheinigung.</p><p id="av-load-err" class="form-field__error" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(errors.value.max_axle_load_kg)}</p></div>`);
				else _push(`<!---->`);
				if (form.kind === "reifen_achse") _push(`<div class="form-field" data-v-02e632a3><label class="form-field__label" for="av-axle" data-v-02e632a3>Nur auf der</label><select id="av-axle" class="input av__narrow"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.axle ? "true" : void 0)} aria-describedby="av-axle-err" data-v-02e632a3><option value="" disabled data-v-02e632a3${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.axle) ? (0, server_renderer_exports.ssrLooseContain)(form.axle, "") : (0, server_renderer_exports.ssrLooseEqual)(form.axle, "")) ? " selected" : ""}>Bitte wählen</option><option value="FRONT" data-v-02e632a3${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.axle) ? (0, server_renderer_exports.ssrLooseContain)(form.axle, "FRONT") : (0, server_renderer_exports.ssrLooseEqual)(form.axle, "FRONT")) ? " selected" : ""}>Vorderachse</option><option value="REAR" data-v-02e632a3${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.axle) ? (0, server_renderer_exports.ssrLooseContain)(form.axle, "REAR") : (0, server_renderer_exports.ssrLooseEqual)(form.axle, "REAR")) ? " selected" : ""}>Hinterachse</option></select><p id="av-axle-err" class="form-field__error" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(errors.value.axle)}</p></div>`);
				else _push(`<!---->`);
				_push(`<div class="av__actions" data-v-02e632a3><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(editing.value === null ? "Code speichern" : "Änderungen speichern")}</button><button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-02e632a3>Abbrechen</button></div></div>`);
			} else _push(`<!---->`);
			if (pasteOpen.value) {
				_push(`<div class="av__form" data-v-02e632a3><div class="form-field" data-v-02e632a3><label class="form-field__label" for="av-paste" data-v-02e632a3>Legende aus dem Gutachten</label><textarea id="av-paste" class="input av__textarea" rows="6" aria-describedby="av-paste-help" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(pasted.value)}</textarea><p id="av-paste-help" class="form-field__help" data-v-02e632a3>Den Block mit den Auflagen und Hinweisen kopieren und einfügen. Er wird an den Codes geteilt; du prüfst jede Zeile und wählst ihre Art.</p></div><div class="av__actions" data-v-02e632a3><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(pasted.value.trim() === "") ? " disabled" : ""} data-v-02e632a3>Aufteilen</button><button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-02e632a3>Abbrechen</button></div>`);
				if (split.value.length) {
					_push(`<ol class="av__split" data-v-02e632a3><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(split.value, (entry, index) => {
						_push(`<li class="av__split-item" data-v-02e632a3><div class="av__pair" data-v-02e632a3><div class="form-field" data-v-02e632a3><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `av-split-code-${index}`)} data-v-02e632a3>Code</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `av-split-code-${index}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", entry.code)} class="input av__code-input" type="text" maxlength="32" translate="no"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", splitError(index, "code") ? "true" : void 0)} data-v-02e632a3><p class="form-field__error" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(splitError(index, "code"))}</p></div><div class="form-field" data-v-02e632a3><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `av-split-kind-${index}`)} data-v-02e632a3>Art</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `av-split-kind-${index}`)} class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", splitError(index, "kind") ? "true" : void 0)} data-v-02e632a3><option value="" disabled data-v-02e632a3${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(entry.kind) ? (0, server_renderer_exports.ssrLooseContain)(entry.kind, "") : (0, server_renderer_exports.ssrLooseEqual)(entry.kind, "")) ? " selected" : ""}>Bitte wählen</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.choices.kinds, (kind) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", kind.value)} data-v-02e632a3${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(entry.kind) ? (0, server_renderer_exports.ssrLooseContain)(entry.kind, kind.value) : (0, server_renderer_exports.ssrLooseEqual)(entry.kind, kind.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(kind.label)}</option>`);
						});
						_push(`<!--]--></select><p class="form-field__error" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(splitError(index, "kind"))}</p></div></div><div class="form-field" data-v-02e632a3><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `av-split-text-${index}`)} data-v-02e632a3>Satz</label><textarea${(0, server_renderer_exports.ssrRenderAttr)("id", `av-split-text-${index}`)} class="input av__textarea" rows="2" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(entry.text_de)}</textarea><p class="form-field__error" data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(splitError(index, "text_de"))}</p></div>`);
						if ([
							"karosserieform",
							"antrieb",
							"reifen_tragfaehigkeit",
							"reifen_achse"
						].includes(entry.kind)) _push(`<p class="form-field__help" data-v-02e632a3> Diese Art braucht eine Angabe mehr. Speichere erst die anderen und trag diesen Code einzeln ein. </p>`);
						else _push(`<!---->`);
						_push(`<div data-v-02e632a3><button class="btn btn--ghost" type="button" data-v-02e632a3>Diese Zeile weglassen</button></div></li>`);
					});
					_push(`<!--]--></ol>`);
				} else _push(`<!---->`);
				if (split.value.length) {
					_push(`<div class="av__actions" data-v-02e632a3><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value || !splitReady.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-02e632a3>${(0, server_renderer_exports.ssrInterpolate)(split.value.length === 1 ? "1 Code speichern" : `${split.value.length} Codes speichern`)}</button>`);
					if (!splitReady.value) _push(`<p class="form-field__help" data-v-02e632a3>Jede Zeile braucht ihre Art.</p>`);
					else _push(`<!---->`);
					_push(`</div>`);
				} else _push(`<!---->`);
				_push(`</div>`);
			} else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
				open: confirmOpen.value,
				"onUpdate:open": ($event) => confirmOpen.value = $event,
				title: `Code ${removing.value?.code ?? ""} entfernen?`,
				body: "Keine Zeile trägt ihn. Das Protokoll hält fest, wer ihn entfernt hat.",
				"confirm-label": "Entfernen",
				busy: busy.value,
				onConfirm: remove
			}, null, _parent));
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Auflagenverzeichnis.vue
var Auflagenverzeichnis_exports = /* @__PURE__ */ __exportAll({ default: () => Auflagenverzeichnis_default });
var _sfc_setup = Auflagenverzeichnis_vue_vue_type_script_setup_true_lang_default.setup;
Auflagenverzeichnis_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Auflagenverzeichnis.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Auflagenverzeichnis_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Auflagenverzeichnis_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-02e632a3"]]);
//#endregion
export { Auflagenverzeichnis_exports as n, Auflagenverzeichnis_default as t };
