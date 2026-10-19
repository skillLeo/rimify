import { t as Dialog_default } from "./Dialog-BPdFERzS.js";
import { a as DropdownMenuRoot_default, i as DropdownMenuContent_default, n as DropdownMenuPortal_default, r as DropdownMenuItem_default, t as DropdownMenuTrigger_default } from "./DropdownMenuTrigger-lkcRFLT8.js";
import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage--fCiRsQr.js";
import { t as DropdownMenuSeparator_default } from "./DropdownMenuSeparator-GAJuN4lI.js";
import { c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { t as AdminConfirm_default } from "./AdminConfirm-CuIy_ILR.js";
import { t as AdminState_default } from "./AdminState-QyYV7E7y.js";
import { t as FieldInput_default } from "./FieldInput-CQMOF_nm.js";
//#region resources/js/Pages/Admin/Faq/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		groups: {},
		groupOptions: {},
		onHome: {},
		limits: {},
		can: {}
	},
	setup(__props) {
		/**
		* Inhalte › FAQ — the questions on /faq, under their two groups, and the five the homepage shows.
		*
		* One primary action, *Frage anlegen*. A question opens its dialog; everything else done to an
		* entry sits behind its more-menu, and its place in the list moves with *nach oben* / *nach unten*
		* (beside the row from 768 px, and always in the menu). There is no draft: a visible answer changes
		* on the shop when it is saved, so anything a visitor would see change is offered only to a role
		* that may publish — the server refuses it regardless (FaqEntryPolicy).
		*/
		const props = __props;
		const page = usePage();
		const all = (0, vue_exports.computed)(() => props.groups.flatMap((group) => group.entries));
		const context = (0, vue_exports.computed)(() => {
			const total = all.value.length;
			const visible = all.value.filter((entry) => entry.published).length;
			return `${total === 1 ? "1 Frage" : `${total} Fragen`} · ${visible} im Shop sichtbar`;
		});
		/** „KOMPATIBILITÄT & FREIGABE" is the shop's micro-label; here it is read as a heading. */
		function groupName(key) {
			return key.toLocaleLowerCase("de-DE").split(" ").map((word) => word === "&" ? word : word.charAt(0).toLocaleUpperCase("de-DE") + word.slice(1)).join(" ");
		}
		const NUMBERS = [
			"",
			"eine",
			"zwei",
			"drei",
			"vier",
			"fünf"
		];
		/** One fact about the list, in words: which of these questions the homepage shows too. */
		const homeNote = (0, vue_exports.computed)(() => {
			const n = props.onHome.length;
			if (n === 0) return "";
			return n === 1 ? "Die erste sichtbare Frage steht auch auf der Startseite." : `Die ersten ${NUMBERS[n] ?? String(n)} sichtbaren Fragen stehen auch auf der Startseite.`;
		});
		/** Change the words: a visible entry takes the right to publish. */
		function mayEdit(entry) {
			return props.can.edit && (!entry.published || props.can.publish);
		}
		const mayToggle = (0, vue_exports.computed)(() => props.can.edit && props.can.publish);
		const mayMove = (0, vue_exports.computed)(() => props.can.publish);
		function mayDelete(entry) {
			return props.can.delete && (!entry.published || props.can.publish);
		}
		/** A menu is offered only when it holds something: never an empty one. */
		function hasMenu(entry) {
			return mayEdit(entry) || mayToggle.value || mayMove.value || mayDelete(entry);
		}
		function groupOf(entry) {
			const group = props.groups.find((g) => g.entries.some((e) => e.id === entry.id));
			return {
				key: group?.key ?? "",
				index: group?.entries.findIndex((e) => e.id === entry.id) ?? -1,
				count: group?.entries.length ?? 0
			};
		}
		const fresh = (0, vue_exports.ref)(null);
		function markFresh(id) {
			if (id === void 0) return;
			fresh.value = null;
			(0, vue_exports.nextTick)(() => fresh.value = id);
		}
		let returnTo = "";
		function byKey(key) {
			return key === "" ? null : document.getElementById(key) ?? document.querySelector(`[data-focus="${key}"]`);
		}
		function restoreFocus(event) {
			const target = byKey(returnTo);
			if (target) {
				event.preventDefault();
				target.focus();
			}
		}
		/** A refusal about one row — out of date, no room, no right — said above the lists. */
		const rowError = (0, vue_exports.ref)("");
		function refused(bag) {
			rowError.value = Object.values(bag)[0] ?? "";
		}
		const editing = (0, vue_exports.ref)(null);
		const busy = (0, vue_exports.ref)(false);
		const title = (0, vue_exports.ref)("");
		let opened = 0;
		const sentFrom = (0, vue_exports.ref)(-1);
		const draft = (0, vue_exports.reactive)({
			group: "",
			question: "",
			answer: "",
			published: false
		});
		const dialogOpen = (0, vue_exports.computed)({
			get: () => editing.value !== null,
			set: (open) => {
				if (!open) editing.value = null;
			}
		});
		const questionField = (0, vue_exports.computed)(() => ({
			key: "question",
			label: "Frage",
			kind: "text",
			required: true,
			max: props.limits.question
		}));
		const answerField = (0, vue_exports.computed)(() => ({
			key: "answer",
			label: "Antwort",
			kind: "textarea",
			required: true,
			max: props.limits.answer,
			help: "Steht im Shop genau so, wie du sie hier schreibst. Eine Leerzeile beginnt einen neuen Absatz."
		}));
		const errors = (0, vue_exports.computed)(() => {
			const raw = page.props.errors;
			return sentFrom.value === opened && raw !== null && typeof raw === "object" ? raw : {};
		});
		function openNew(group) {
			Object.assign(draft, {
				group: group ?? props.groupOptions[0] ?? "",
				question: "",
				answer: "",
				published: false
			});
			opened++;
			title.value = "Frage anlegen";
			returnTo = group ? `faq-new-${props.groups.findIndex((g) => g.key === group)}` : "faq-new";
			editing.value = "new";
		}
		function openEdit(entry) {
			Object.assign(draft, {
				group: groupOf(entry).key || (props.groupOptions[0] ?? ""),
				question: entry.question,
				answer: entry.answer,
				published: entry.published
			});
			opened++;
			title.value = "Frage bearbeiten";
			returnTo = `faq-more-${entry.id}`;
			editing.value = entry;
		}
		function save() {
			if (busy.value || editing.value === null) return;
			const target = editing.value;
			const token = opened;
			busy.value = true;
			sentFrom.value = token;
			rowError.value = "";
			const options = {
				preserveScroll: true,
				preserveState: true,
				onSuccess: () => {
					const id = target === "new" ? props.groups.find((g) => g.key === draft.group)?.entries.at(-1)?.id : target.id;
					if (target === "new" && id !== void 0) returnTo = `faq-more-${id}`;
					if (opened === token) editing.value = null;
					markFresh(id);
				},
				onError: () => {
					if (opened === token) (0, vue_exports.nextTick)(() => document.querySelector(".adm-dialog [aria-invalid=\"true\"]")?.focus());
				},
				onFinish: () => {
					busy.value = false;
				}
			};
			if (target === "new") router.post("/admin/faq", { ...draft }, options);
			else router.put(`/admin/faq/${target.id}`, { ...draft }, options);
		}
		function toggle(entry) {
			rowError.value = "";
			router.patch(`/admin/faq/${entry.id}/sichtbarkeit`, { visible: !entry.published }, {
				preserveScroll: true,
				preserveState: true,
				onSuccess: () => markFresh(entry.id),
				onError: refused
			});
		}
		const deleting = (0, vue_exports.ref)(null);
		const deleteTitle = (0, vue_exports.ref)("");
		const deleteBody = (0, vue_exports.ref)("");
		const deleteOpen = (0, vue_exports.computed)({
			get: () => deleting.value !== null,
			set: (open) => {
				if (!open) deleting.value = null;
			}
		});
		function askDelete(entry) {
			deleteTitle.value = `Frage „${entry.question}“ löschen?`;
			deleteBody.value = entry.published ? "Die Frage und ihre Antwort verschwinden aus dem Shop. Das Protokoll behält ihren Wortlaut." : "Die Frage ist ausgeblendet und wird endgültig gelöscht. Das Protokoll behält ihren Wortlaut.";
			returnTo = `faq-more-${entry.id}`;
			deleting.value = entry;
		}
		function remove() {
			const entry = deleting.value;
			if (entry === null || busy.value) return;
			const list = all.value;
			const at = list.findIndex((e) => e.id === entry.id);
			const next = list[at + 1] ?? list[at - 1];
			busy.value = true;
			rowError.value = "";
			router.delete(`/admin/faq/${entry.id}`, {
				preserveScroll: true,
				preserveState: true,
				onSuccess: () => {
					returnTo = next ? `faq-more-${next.id}` : "faq-new";
				},
				onError: refused,
				onFinish: () => {
					busy.value = false;
					deleting.value = null;
				}
			});
		}
		const moving = (0, vue_exports.ref)(false);
		function move(entry, by) {
			if (moving.value) return;
			const group = props.groups.find((g) => g.entries.some((e) => e.id === entry.id));
			if (!group) return;
			const from = group.entries.findIndex((e) => e.id === entry.id);
			const to = from + by;
			if (to < 0 || to >= group.entries.length) return;
			const entries = [...group.entries];
			const [moved] = entries.splice(from, 1);
			entries.splice(to, 0, moved);
			const ids = props.groups.flatMap((g) => (g.key === group.key ? entries : g.entries).map((e) => e.id));
			moving.value = true;
			rowError.value = "";
			router.put("/admin/faq/reihenfolge", { ids }, {
				preserveScroll: true,
				preserveState: true,
				onSuccess: () => markFresh(entry.id),
				onError: refused,
				onFinish: () => {
					moving.value = false;
					(0, vue_exports.nextTick)(() => {
						([document.getElementById(`faq-${by < 0 ? "up" : "down"}-${entry.id}`), document.getElementById(`faq-${by < 0 ? "down" : "up"}-${entry.id}`)].find((button) => button !== null && !button.disabled && button.offsetParent !== null) ?? byKey(`faq-more-${entry.id}`))?.focus();
					});
				}
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "FAQ",
				context: context.value,
				"read-only": !__props.can.edit && !__props.can.create && !__props.can.publish && !__props.can.delete
			}, _attrs), (0, vue_exports.createSlots)({
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (rowError.value) _push(`<p class="adm-alert" role="alert" data-v-e66ab5a7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(rowError.value)}</p>`);
						else _push(`<!---->`);
						if (all.value.length) {
							_push(`<!--[-->`);
							if (homeNote.value) _push(`<p class="adm-note faq-adm__home" data-v-e66ab5a7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(homeNote.value)}</p>`);
							else _push(`<!---->`);
							_push(`<!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.groups, (group, g) => {
								_push(`<section class="faq-adm__group"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `faq-g-${g}`)} data-v-e66ab5a7${_scopeId}><h2${(0, server_renderer_exports.ssrRenderAttr)("id", `faq-g-${g}`)} class="adm-section__title" data-v-e66ab5a7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(groupName(group.key))}</h2>`);
								if (group.entries.length) {
									_push(`<ol class="faq-adm__list" data-v-e66ab5a7${_scopeId}><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(group.entries, (entry, index) => {
										_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{ "adm-row--fresh": fresh.value === entry.id }, "faq-adm__entry"])}" data-v-e66ab5a7${_scopeId}><div class="faq-adm__text" data-v-e66ab5a7${_scopeId}><p class="faq-adm__question" data-v-e66ab5a7${_scopeId}>`);
										if (mayEdit(entry)) _push(`<button class="faq-adm__open" type="button" data-v-e66ab5a7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.question)}</button>`);
										else _push(`<span data-v-e66ab5a7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.question)}</span>`);
										if (!entry.published) _push(`<span class="adm-tag adm-tag--neutral" data-v-e66ab5a7${_scopeId}>Ausgeblendet</span>`);
										else _push(`<!---->`);
										_push(`</p><p class="faq-adm__answer" data-v-e66ab5a7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.answer)}</p></div><div class="faq-adm__tools" data-v-e66ab5a7${_scopeId}>`);
										if (mayMove.value) {
											_push(`<div class="adm-row-arrows" data-v-e66ab5a7${_scopeId}><button${(0, server_renderer_exports.ssrRenderAttr)("id", `faq-up-${entry.id}`)} class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(index === 0 || moving.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${entry.question} nach oben`)} data-v-e66ab5a7${_scopeId}>`);
											_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
												name: "chevron-up",
												size: 20
											}, null, _parent, _scopeId));
											_push(`</button><button${(0, server_renderer_exports.ssrRenderAttr)("id", `faq-down-${entry.id}`)} class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(index === group.entries.length - 1 || moving.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${entry.question} nach unten`)} data-v-e66ab5a7${_scopeId}>`);
											_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
												name: "chevron-down",
												size: 20
											}, null, _parent, _scopeId));
											_push(`</button></div>`);
										} else _push(`<!---->`);
										if (hasMenu(entry)) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) {
													_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
														"data-focus": `faq-more-${entry.id}`,
														class: "adm-iconbtn",
														"aria-label": `Aktionen für ${entry.question}`
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
																		if (mayEdit(entry)) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																			class: "adm-menu__item",
																			onSelect: ($event) => openEdit(entry)
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
																		else _push(`<!---->`);
																		if (mayToggle.value) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																			class: "adm-menu__item",
																			onSelect: ($event) => toggle(entry)
																		}, {
																			default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																				if (_push) {
																					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																						name: entry.published ? "eye-off" : "eye",
																						size: 20
																					}, null, _parent, _scopeId));
																					_push(` ${(0, server_renderer_exports.ssrInterpolate)(entry.published ? "Im Shop ausblenden" : "Im Shop zeigen")}`);
																				} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																					name: entry.published ? "eye-off" : "eye",
																					size: 20
																				}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(entry.published ? "Im Shop ausblenden" : "Im Shop zeigen"), 1)];
																			}),
																			_: 2
																		}, _parent, _scopeId));
																		else _push(`<!---->`);
																		if (mayMove.value) {
																			_push(`<!--[-->`);
																			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																				class: "adm-menu__item",
																				disabled: groupOf(entry).index === 0 || moving.value,
																				onSelect: ($event) => move(entry, -1)
																			}, {
																				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																					if (_push) {
																						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																							name: "chevron-up",
																							size: 20
																						}, null, _parent, _scopeId));
																						_push(` Nach oben `);
																					} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																						name: "chevron-up",
																						size: 20
																					}), (0, vue_exports.createTextVNode)(" Nach oben ")];
																				}),
																				_: 2
																			}, _parent, _scopeId));
																			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																				class: "adm-menu__item",
																				disabled: groupOf(entry).index === groupOf(entry).count - 1 || moving.value,
																				onSelect: ($event) => move(entry, 1)
																			}, {
																				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																					if (_push) {
																						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																							name: "chevron-down",
																							size: 20
																						}, null, _parent, _scopeId));
																						_push(` Nach unten `);
																					} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																						name: "chevron-down",
																						size: 20
																					}), (0, vue_exports.createTextVNode)(" Nach unten ")];
																				}),
																				_: 2
																			}, _parent, _scopeId));
																			_push(`<!--]-->`);
																		} else _push(`<!---->`);
																		if (mayDelete(entry)) {
																			_push(`<!--[-->`);
																			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }, null, _parent, _scopeId));
																			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																				class: "adm-menu__item adm-menu__item--danger",
																				onSelect: ($event) => askDelete(entry)
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
																		mayEdit(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																			key: 0,
																			class: "adm-menu__item",
																			onSelect: ($event) => openEdit(entry)
																		}, {
																			default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																				name: "edit",
																				size: 20
																			}), (0, vue_exports.createTextVNode)(" Bearbeiten ")]),
																			_: 1
																		}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
																		mayToggle.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																			key: 1,
																			class: "adm-menu__item",
																			onSelect: ($event) => toggle(entry)
																		}, {
																			default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																				name: entry.published ? "eye-off" : "eye",
																				size: 20
																			}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(entry.published ? "Im Shop ausblenden" : "Im Shop zeigen"), 1)]),
																			_: 2
																		}, 1032, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
																		mayMove.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																			class: "adm-menu__item",
																			disabled: groupOf(entry).index === 0 || moving.value,
																			onSelect: ($event) => move(entry, -1)
																		}, {
																			default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																				name: "chevron-up",
																				size: 20
																			}), (0, vue_exports.createTextVNode)(" Nach oben ")]),
																			_: 1
																		}, 8, ["disabled", "onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																			class: "adm-menu__item",
																			disabled: groupOf(entry).index === groupOf(entry).count - 1 || moving.value,
																			onSelect: ($event) => move(entry, 1)
																		}, {
																			default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																				name: "chevron-down",
																				size: 20
																			}), (0, vue_exports.createTextVNode)(" Nach unten ")]),
																			_: 1
																		}, 8, ["disabled", "onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true),
																		mayDelete(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																			class: "adm-menu__item adm-menu__item--danger",
																			onSelect: ($event) => askDelete(entry)
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
																	mayEdit(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		key: 0,
																		class: "adm-menu__item",
																		onSelect: ($event) => openEdit(entry)
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "edit",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" Bearbeiten ")]),
																		_: 1
																	}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
																	mayToggle.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		key: 1,
																		class: "adm-menu__item",
																		onSelect: ($event) => toggle(entry)
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: entry.published ? "eye-off" : "eye",
																			size: 20
																		}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(entry.published ? "Im Shop ausblenden" : "Im Shop zeigen"), 1)]),
																		_: 2
																	}, 1032, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
																	mayMove.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item",
																		disabled: groupOf(entry).index === 0 || moving.value,
																		onSelect: ($event) => move(entry, -1)
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "chevron-up",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" Nach oben ")]),
																		_: 1
																	}, 8, ["disabled", "onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item",
																		disabled: groupOf(entry).index === groupOf(entry).count - 1 || moving.value,
																		onSelect: ($event) => move(entry, 1)
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "chevron-down",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" Nach unten ")]),
																		_: 1
																	}, 8, ["disabled", "onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true),
																	mayDelete(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item adm-menu__item--danger",
																		onSelect: ($event) => askDelete(entry)
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
													"data-focus": `faq-more-${entry.id}`,
													class: "adm-iconbtn",
													"aria-label": `Aktionen für ${entry.question}`
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "more",
														size: 20
													})]),
													_: 1
												}, 8, ["data-focus", "aria-label"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
														class: "adm-menu",
														align: "end",
														"side-offset": 4
													}, {
														default: (0, vue_exports.withCtx)(() => [
															mayEdit(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																key: 0,
																class: "adm-menu__item",
																onSelect: ($event) => openEdit(entry)
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "edit",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Bearbeiten ")]),
																_: 1
															}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
															mayToggle.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																key: 1,
																class: "adm-menu__item",
																onSelect: ($event) => toggle(entry)
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: entry.published ? "eye-off" : "eye",
																	size: 20
																}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(entry.published ? "Im Shop ausblenden" : "Im Shop zeigen"), 1)]),
																_: 2
															}, 1032, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
															mayMove.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																class: "adm-menu__item",
																disabled: groupOf(entry).index === 0 || moving.value,
																onSelect: ($event) => move(entry, -1)
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "chevron-up",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Nach oben ")]),
																_: 1
															}, 8, ["disabled", "onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																class: "adm-menu__item",
																disabled: groupOf(entry).index === groupOf(entry).count - 1 || moving.value,
																onSelect: ($event) => move(entry, 1)
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "chevron-down",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Nach unten ")]),
																_: 1
															}, 8, ["disabled", "onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true),
															mayDelete(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																class: "adm-menu__item adm-menu__item--danger",
																onSelect: ($event) => askDelete(entry)
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
										_push(`</div></li>`);
									});
									_push(`<!--]--></ol>`);
								} else {
									_push(`<div class="faq-adm__empty" data-v-e66ab5a7${_scopeId}><p class="adm-note" data-v-e66ab5a7${_scopeId}>In dieser Gruppe steht noch keine Frage.</p>`);
									if (__props.can.create) _push(`<button${(0, server_renderer_exports.ssrRenderAttr)("id", `faq-new-${g}`)} class="btn btn--secondary btn--sm" type="button" data-v-e66ab5a7${_scopeId}> Frage in dieser Gruppe anlegen </button>`);
									else _push(`<!---->`);
									_push(`</div>`);
								}
								_push(`</section>`);
							});
							_push(`<!--]--><!--]-->`);
						} else _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Noch keine Frage. Was du hier anlegst, steht auf der FAQ-Seite und – die ersten fünf – auf der Startseite."
						}, null, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
							open: dialogOpen.value,
							"onUpdate:open": ($event) => dialogOpen.value = $event,
							title: title.value,
							"content-class": "adm-dialog",
							onCloseAutoFocus: restoreFocus
						}, {
							actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-e66ab5a7${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="submit" form="faq-form"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-e66ab5a7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(title.value === "Frage anlegen" ? "Anlegen" : "Speichern")}</button>`);
								else return [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									onClick: ($event) => dialogOpen.value = false
								}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--primary",
									type: "submit",
									form: "faq-form",
									disabled: busy.value,
									"aria-busy": busy.value ? "true" : void 0
								}, (0, vue_exports.toDisplayString)(title.value === "Frage anlegen" ? "Anlegen" : "Speichern"), 9, ["disabled", "aria-busy"])];
							}),
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<form id="faq-form" class="adm-fields" novalidate data-v-e66ab5a7${_scopeId}><div class="form-field" data-v-e66ab5a7${_scopeId}><label class="form-field__label" for="faq-group" data-v-e66ab5a7${_scopeId}>Gruppe</label><select id="faq-group" class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.group ? "true" : void 0)} aria-describedby="faq-group-err" data-v-e66ab5a7${_scopeId}><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(__props.groupOptions, (option) => {
										_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", option)} data-v-e66ab5a7${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(draft.group) ? (0, server_renderer_exports.ssrLooseContain)(draft.group, option) : (0, server_renderer_exports.ssrLooseEqual)(draft.group, option)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(groupName(option))}</option>`);
									});
									_push(`<!--]--></select><p id="faq-group-err" class="form-field__error" data-v-e66ab5a7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.group ?? "")}</p></div>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(FieldInput_default, {
										id: "faq-question",
										"model-value": draft.question,
										field: questionField.value,
										error: errors.value.question ?? "",
										"onUpdate:modelValue": ($event) => draft.question = String($event ?? "")
									}, null, _parent, _scopeId));
									_push((0, server_renderer_exports.ssrRenderComponent)(FieldInput_default, {
										id: "faq-answer",
										"model-value": draft.answer,
										field: answerField.value,
										error: errors.value.answer ?? "",
										"onUpdate:modelValue": ($event) => draft.answer = String($event ?? "")
									}, null, _parent, _scopeId));
									_push(`<label class="check" data-v-e66ab5a7${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(draft.published) ? (0, server_renderer_exports.ssrLooseContain)(draft.published, null) : draft.published) ? " checked" : ""} type="checkbox"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!__props.can.publish) ? " disabled" : ""} data-v-e66ab5a7${_scopeId}> Im Shop zeigen </label>`);
									if (!__props.can.publish) _push(`<p class="form-field__help" data-v-e66ab5a7${_scopeId}>Zeigen und Ausblenden braucht das Recht „Inhalte · Veröffentlichen“. Deine Frage bleibt ausgeblendet, bis jemand mit diesem Recht sie zeigt.</p>`);
									else if (draft.published) _push(`<p class="form-field__help" data-v-e66ab5a7${_scopeId}>Sichtbar heißt: Die Änderung steht sofort im Shop.</p>`);
									else _push(`<!---->`);
									_push(`</form>`);
								} else return [(0, vue_exports.createVNode)("form", {
									id: "faq-form",
									class: "adm-fields",
									novalidate: "",
									onSubmit: (0, vue_exports.withModifiers)(save, ["prevent"])
								}, [
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "faq-group"
										}, "Gruppe"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
											id: "faq-group",
											"onUpdate:modelValue": ($event) => draft.group = $event,
											class: "input",
											"aria-invalid": errors.value.group ? "true" : void 0,
											"aria-describedby": "faq-group-err"
										}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.groupOptions, (option) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
												key: option,
												value: option
											}, (0, vue_exports.toDisplayString)(groupName(option)), 9, ["value"]);
										}), 128))], 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelSelect, draft.group]]),
										(0, vue_exports.createVNode)("p", {
											id: "faq-group-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(errors.value.group ?? ""), 1)
									]),
									(0, vue_exports.createVNode)(FieldInput_default, {
										id: "faq-question",
										"model-value": draft.question,
										field: questionField.value,
										error: errors.value.question ?? "",
										"onUpdate:modelValue": ($event) => draft.question = String($event ?? "")
									}, null, 8, [
										"model-value",
										"field",
										"error",
										"onUpdate:modelValue"
									]),
									(0, vue_exports.createVNode)(FieldInput_default, {
										id: "faq-answer",
										"model-value": draft.answer,
										field: answerField.value,
										error: errors.value.answer ?? "",
										"onUpdate:modelValue": ($event) => draft.answer = String($event ?? "")
									}, null, 8, [
										"model-value",
										"field",
										"error",
										"onUpdate:modelValue"
									]),
									(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										"onUpdate:modelValue": ($event) => draft.published = $event,
										type: "checkbox",
										disabled: !__props.can.publish
									}, null, 8, ["onUpdate:modelValue", "disabled"]), [[vue_exports.vModelCheckbox, draft.published]]), (0, vue_exports.createTextVNode)(" Im Shop zeigen ")]),
									!__props.can.publish ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 0,
										class: "form-field__help"
									}, "Zeigen und Ausblenden braucht das Recht „Inhalte · Veröffentlichen“. Deine Frage bleibt ausgeblendet, bis jemand mit diesem Recht sie zeigt.")) : draft.published ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 1,
										class: "form-field__help"
									}, "Sichtbar heißt: Die Änderung steht sofort im Shop.")) : (0, vue_exports.createCommentVNode)("", true)
								], 32)];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: deleteOpen.value,
							"onUpdate:open": ($event) => deleteOpen.value = $event,
							title: deleteTitle.value,
							body: deleteBody.value,
							"confirm-label": "Löschen",
							busy: busy.value,
							onConfirm: remove,
							onCloseAutoFocus: restoreFocus
						}, null, _parent, _scopeId));
					} else return [
						rowError.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-alert",
							role: "alert"
						}, (0, vue_exports.toDisplayString)(rowError.value), 1)) : (0, vue_exports.createCommentVNode)("", true),
						all.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [homeNote.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-note faq-adm__home"
						}, (0, vue_exports.toDisplayString)(homeNote.value), 1)) : (0, vue_exports.createCommentVNode)("", true), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.groups, (group, g) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
								key: group.key,
								class: "faq-adm__group",
								"aria-labelledby": `faq-g-${g}`
							}, [(0, vue_exports.createVNode)("h2", {
								id: `faq-g-${g}`,
								class: "adm-section__title"
							}, (0, vue_exports.toDisplayString)(groupName(group.key)), 9, ["id"]), group.entries.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ol", {
								key: 0,
								class: "faq-adm__list"
							}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(group.entries, (entry, index) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
									key: entry.id,
									class: ["faq-adm__entry", { "adm-row--fresh": fresh.value === entry.id }],
									onAnimationend: ($event) => fresh.value = null
								}, [(0, vue_exports.createVNode)("div", { class: "faq-adm__text" }, [(0, vue_exports.createVNode)("p", { class: "faq-adm__question" }, [mayEdit(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 0,
									class: "faq-adm__open",
									type: "button",
									onClick: ($event) => openEdit(entry)
								}, (0, vue_exports.toDisplayString)(entry.question), 9, ["onClick"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 1 }, (0, vue_exports.toDisplayString)(entry.question), 1)), !entry.published ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 2,
									class: "adm-tag adm-tag--neutral"
								}, "Ausgeblendet")) : (0, vue_exports.createCommentVNode)("", true)]), (0, vue_exports.createVNode)("p", { class: "faq-adm__answer" }, (0, vue_exports.toDisplayString)(entry.answer), 1)]), (0, vue_exports.createVNode)("div", { class: "faq-adm__tools" }, [mayMove.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "adm-row-arrows"
								}, [(0, vue_exports.createVNode)("button", {
									id: `faq-up-${entry.id}`,
									class: "adm-iconbtn",
									type: "button",
									disabled: index === 0 || moving.value,
									"aria-label": `${entry.question} nach oben`,
									onClick: ($event) => move(entry, -1)
								}, [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "chevron-up",
									size: 20
								})], 8, [
									"id",
									"disabled",
									"aria-label",
									"onClick"
								]), (0, vue_exports.createVNode)("button", {
									id: `faq-down-${entry.id}`,
									class: "adm-iconbtn",
									type: "button",
									disabled: index === group.entries.length - 1 || moving.value,
									"aria-label": `${entry.question} nach unten`,
									onClick: ($event) => move(entry, 1)
								}, [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "chevron-down",
									size: 20
								})], 8, [
									"id",
									"disabled",
									"aria-label",
									"onClick"
								])])) : (0, vue_exports.createCommentVNode)("", true), hasMenu(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuRoot_default), { key: 1 }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
										"data-focus": `faq-more-${entry.id}`,
										class: "adm-iconbtn",
										"aria-label": `Aktionen für ${entry.question}`
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "more",
											size: 20
										})]),
										_: 1
									}, 8, ["data-focus", "aria-label"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
											class: "adm-menu",
											align: "end",
											"side-offset": 4
										}, {
											default: (0, vue_exports.withCtx)(() => [
												mayEdit(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: 0,
													class: "adm-menu__item",
													onSelect: ($event) => openEdit(entry)
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "edit",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Bearbeiten ")]),
													_: 1
												}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
												mayToggle.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: 1,
													class: "adm-menu__item",
													onSelect: ($event) => toggle(entry)
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: entry.published ? "eye-off" : "eye",
														size: 20
													}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(entry.published ? "Im Shop ausblenden" : "Im Shop zeigen"), 1)]),
													_: 2
												}, 1032, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
												mayMove.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item",
													disabled: groupOf(entry).index === 0 || moving.value,
													onSelect: ($event) => move(entry, -1)
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "chevron-up",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Nach oben ")]),
													_: 1
												}, 8, ["disabled", "onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item",
													disabled: groupOf(entry).index === groupOf(entry).count - 1 || moving.value,
													onSelect: ($event) => move(entry, 1)
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "chevron-down",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Nach unten ")]),
													_: 1
												}, 8, ["disabled", "onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true),
												mayDelete(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item adm-menu__item--danger",
													onSelect: ($event) => askDelete(entry)
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
								}, 1024)) : (0, vue_exports.createCommentVNode)("", true)])], 42, ["onAnimationend"]);
							}), 128))])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 1,
								class: "faq-adm__empty"
							}, [(0, vue_exports.createVNode)("p", { class: "adm-note" }, "In dieser Gruppe steht noch keine Frage."), __props.can.create ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
								key: 0,
								id: `faq-new-${g}`,
								class: "btn btn--secondary btn--sm",
								type: "button",
								onClick: ($event) => openNew(group.key)
							}, " Frage in dieser Gruppe anlegen ", 8, ["id", "onClick"])) : (0, vue_exports.createCommentVNode)("", true)]))], 8, ["aria-labelledby"]);
						}), 128))], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 2,
							kind: "empty",
							text: "Noch keine Frage. Was du hier anlegst, steht auf der FAQ-Seite und – die ersten fünf – auf der Startseite."
						})),
						(0, vue_exports.createVNode)(Dialog_default, {
							open: dialogOpen.value,
							"onUpdate:open": ($event) => dialogOpen.value = $event,
							title: title.value,
							"content-class": "adm-dialog",
							onCloseAutoFocus: restoreFocus
						}, {
							actions: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "button",
								onClick: ($event) => dialogOpen.value = false
							}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "submit",
								form: "faq-form",
								disabled: busy.value,
								"aria-busy": busy.value ? "true" : void 0
							}, (0, vue_exports.toDisplayString)(title.value === "Frage anlegen" ? "Anlegen" : "Speichern"), 9, ["disabled", "aria-busy"])]),
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("form", {
								id: "faq-form",
								class: "adm-fields",
								novalidate: "",
								onSubmit: (0, vue_exports.withModifiers)(save, ["prevent"])
							}, [
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "faq-group"
									}, "Gruppe"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "faq-group",
										"onUpdate:modelValue": ($event) => draft.group = $event,
										class: "input",
										"aria-invalid": errors.value.group ? "true" : void 0,
										"aria-describedby": "faq-group-err"
									}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.groupOptions, (option) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
											key: option,
											value: option
										}, (0, vue_exports.toDisplayString)(groupName(option)), 9, ["value"]);
									}), 128))], 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelSelect, draft.group]]),
									(0, vue_exports.createVNode)("p", {
										id: "faq-group-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(errors.value.group ?? ""), 1)
								]),
								(0, vue_exports.createVNode)(FieldInput_default, {
									id: "faq-question",
									"model-value": draft.question,
									field: questionField.value,
									error: errors.value.question ?? "",
									"onUpdate:modelValue": ($event) => draft.question = String($event ?? "")
								}, null, 8, [
									"model-value",
									"field",
									"error",
									"onUpdate:modelValue"
								]),
								(0, vue_exports.createVNode)(FieldInput_default, {
									id: "faq-answer",
									"model-value": draft.answer,
									field: answerField.value,
									error: errors.value.answer ?? "",
									"onUpdate:modelValue": ($event) => draft.answer = String($event ?? "")
								}, null, 8, [
									"model-value",
									"field",
									"error",
									"onUpdate:modelValue"
								]),
								(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									"onUpdate:modelValue": ($event) => draft.published = $event,
									type: "checkbox",
									disabled: !__props.can.publish
								}, null, 8, ["onUpdate:modelValue", "disabled"]), [[vue_exports.vModelCheckbox, draft.published]]), (0, vue_exports.createTextVNode)(" Im Shop zeigen ")]),
								!__props.can.publish ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 0,
									class: "form-field__help"
								}, "Zeigen und Ausblenden braucht das Recht „Inhalte · Veröffentlichen“. Deine Frage bleibt ausgeblendet, bis jemand mit diesem Recht sie zeigt.")) : draft.published ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 1,
									class: "form-field__help"
								}, "Sichtbar heißt: Die Änderung steht sofort im Shop.")) : (0, vue_exports.createCommentVNode)("", true)
							], 32)]),
							_: 1
						}, 8, [
							"open",
							"onUpdate:open",
							"title"
						]),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: deleteOpen.value,
							"onUpdate:open": ($event) => deleteOpen.value = $event,
							title: deleteTitle.value,
							body: deleteBody.value,
							"confirm-label": "Löschen",
							busy: busy.value,
							onConfirm: remove,
							onCloseAutoFocus: restoreFocus
						}, null, 8, [
							"open",
							"onUpdate:open",
							"title",
							"body",
							"busy"
						])
					];
				}),
				_: 2
			}, [__props.can.create ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button id="faq-new" class="btn btn--primary" type="button" data-v-e66ab5a7${_scopeId}>Frage anlegen</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						id: "faq-new",
						class: "btn btn--primary",
						type: "button",
						onClick: ($event) => openNew()
					}, "Frage anlegen", 8, ["onClick"])];
				}),
				key: "0"
			} : void 0]), _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Faq/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Faq/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-e66ab5a7"]]);
//#endregion
export { Index_default as default };
