import { t as Dialog_default } from "./Dialog-C-07FMpe.js";
import { a as DropdownMenuRoot_default, i as DropdownMenuContent_default, n as DropdownMenuPortal_default, r as DropdownMenuItem_default, t as DropdownMenuTrigger_default } from "./DropdownMenuTrigger-DR2ieCu7.js";
import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-ziTZL4Iw.js";
import { t as DropdownMenuSeparator_default } from "./DropdownMenuSeparator-KcmMgHOf.js";
import { c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { i as isIconName, t as Icon_default } from "./Icon-DUS6sqAV.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { t as AdminConfirm_default } from "./AdminConfirm-CJZtnwyX.js";
import { t as FieldInput_default } from "./FieldInput-Diz9zs9m.js";
//#region resources/js/Pages/Admin/Navigation/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		menus: {},
		targets: {},
		icons: {},
		can: {}
	},
	setup(__props) {
		/**
		* Inhalte › Navigation — the shop's five menus: the header, the three footer columns and the phone's
		* bottom bar (docs/admin/inhalte-build-plan.md, "Navigation").
		*
		* One primary action, *Eintrag anlegen*. An entry opens its dialog; its place moves with *nach
		* oben* / *nach unten* (beside the row from 768 px, and always in its menu); everything else is
		* behind its more-menu. A target is chosen from a list, never typed. Every change is live on every
		* page at once, and Impressum and Datenschutz can only be moved, never hidden, renamed or removed.
		*/
		const props = __props;
		const page = usePage();
		const readOnly = (0, vue_exports.computed)(() => !props.can.edit && !props.can.create && !props.can.delete);
		const context = (0, vue_exports.computed)(() => {
			const entries = props.menus.reduce((sum, menu) => sum + menu.items.length, 0);
			return `${props.menus.length} Menüs · ${entries} Einträge`;
		});
		/** What a menu holds, said once under its name: its room and its label length. */
		function menuNote(menu) {
			return [
				menu.maxVisible === null ? null : `höchstens ${menu.maxVisible} sichtbare Einträge`,
				`Namen bis ${menu.max} Zeichen`,
				menu.icon ? "jeder mit Symbol" : null
			].filter(Boolean).join(" · ");
		}
		function menuOf(entry) {
			return props.menus.find((menu) => menu.items.some((item) => item.id === entry.id));
		}
		function positionOf(entry) {
			const menu = menuOf(entry);
			return {
				index: menu?.items.findIndex((item) => item.id === entry.id) ?? -1,
				count: menu?.items.length ?? 0
			};
		}
		function glyph(name) {
			return name !== null && isIconName(name) ? name : null;
		}
		function iconLabel(name) {
			return props.icons.find((option) => option.value === name)?.label ?? "keins";
		}
		function mayChange(entry) {
			return props.can.edit && !entry.locked;
		}
		function mayDelete(entry) {
			return props.can.delete && !entry.locked;
		}
		/** A menu is offered only when it holds something: never an empty one. */
		function hasMenu(entry) {
			return mayChange(entry) || props.can.edit || mayDelete(entry);
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
		/** A refusal about one row — no room, the legal floor, out of date — said in that row's menu, in view. */
		const rowError = (0, vue_exports.ref)(null);
		function refused(menu) {
			return (bag) => {
				rowError.value = {
					menu,
					text: Object.values(bag)[0] ?? ""
				};
			};
		}
		const editing = (0, vue_exports.ref)(null);
		const busy = (0, vue_exports.ref)(false);
		const title = (0, vue_exports.ref)("");
		let opened = 0;
		const sentFrom = (0, vue_exports.ref)(-1);
		const draft = (0, vue_exports.reactive)({
			menu: "",
			label: "",
			target: "",
			icon: "",
			visible: true
		});
		const dialogOpen = (0, vue_exports.computed)({
			get: () => editing.value !== null,
			set: (open) => {
				if (!open) editing.value = null;
			}
		});
		const draftMenu = (0, vue_exports.computed)(() => props.menus.find((menu) => menu.key === draft.menu));
		const errors = (0, vue_exports.computed)(() => {
			const raw = page.props.errors;
			return sentFrom.value === opened && raw !== null && typeof raw === "object" ? raw : {};
		});
		const labelField = (0, vue_exports.computed)(() => ({
			key: "label",
			label: "Name",
			kind: "text",
			required: true,
			max: draftMenu.value?.max ?? 32
		}));
		const iconField = (0, vue_exports.computed)(() => ({
			key: "icon",
			label: "Symbol",
			kind: "icon",
			required: true,
			max: null,
			options: props.icons
		}));
		function openNew() {
			const first = props.menus[0];
			Object.assign(draft, {
				menu: first?.key ?? "",
				label: "",
				target: "",
				icon: first?.icon ? props.icons[0]?.value ?? "" : "",
				visible: true
			});
			opened++;
			title.value = "Eintrag anlegen";
			returnTo = "nav-new";
			editing.value = "new";
		}
		function openEdit(entry) {
			Object.assign(draft, {
				menu: menuOf(entry)?.key ?? "",
				label: entry.label,
				target: entry.target,
				icon: entry.icon ?? "",
				visible: entry.visible
			});
			opened++;
			title.value = "Eintrag bearbeiten";
			returnTo = `nav-more-${entry.id}`;
			editing.value = entry;
		}
		function onMenuChange() {
			draft.icon = draftMenu.value?.icon ? draft.icon || (props.icons[0]?.value ?? "") : "";
		}
		function save() {
			if (busy.value || editing.value === null) return;
			const target = editing.value;
			const token = opened;
			busy.value = true;
			sentFrom.value = token;
			rowError.value = null;
			const options = {
				preserveScroll: true,
				preserveState: true,
				onSuccess: () => {
					const id = target === "new" ? props.menus.find((menu) => menu.key === draft.menu)?.items.at(-1)?.id : target.id;
					if (target === "new" && id !== void 0) returnTo = `nav-more-${id}`;
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
			const payload = {
				...draft,
				icon: draftMenu.value?.icon ? draft.icon : null
			};
			if (target === "new") router.post("/admin/navigation", payload, options);
			else router.put(`/admin/navigation/${target.id}`, payload, options);
		}
		function toggle(entry) {
			rowError.value = null;
			router.patch(`/admin/navigation/${entry.id}/sichtbarkeit`, { visible: !entry.visible }, {
				preserveScroll: true,
				preserveState: true,
				onSuccess: () => markFresh(entry.id),
				onError: refused(menuOf(entry)?.key ?? "")
			});
		}
		const deleting = (0, vue_exports.ref)(null);
		const deleteTitle = (0, vue_exports.ref)("");
		const deleteOpen = (0, vue_exports.computed)({
			get: () => deleting.value !== null,
			set: (open) => {
				if (!open) deleting.value = null;
			}
		});
		function askDelete(entry) {
			deleteTitle.value = `Eintrag „${entry.label}“ löschen?`;
			returnTo = `nav-more-${entry.id}`;
			deleting.value = entry;
		}
		function remove() {
			const entry = deleting.value;
			const menu = entry ? menuOf(entry) : void 0;
			if (entry === null || busy.value) return;
			const at = menu?.items.findIndex((item) => item.id === entry.id) ?? -1;
			const next = menu?.items[at + 1] ?? menu?.items[at - 1];
			busy.value = true;
			rowError.value = null;
			router.delete(`/admin/navigation/${entry.id}`, {
				preserveScroll: true,
				preserveState: true,
				onSuccess: () => {
					returnTo = next ? `nav-more-${next.id}` : "nav-new";
				},
				onError: refused(menu?.key ?? ""),
				onFinish: () => {
					busy.value = false;
					deleting.value = null;
				}
			});
		}
		const moving = (0, vue_exports.ref)(false);
		function move(entry, by) {
			const menu = menuOf(entry);
			if (moving.value || !menu) return;
			const from = menu.items.findIndex((item) => item.id === entry.id);
			const to = from + by;
			if (to < 0 || to >= menu.items.length) return;
			const items = [...menu.items];
			const [moved] = items.splice(from, 1);
			items.splice(to, 0, moved);
			moving.value = true;
			rowError.value = null;
			router.put("/admin/navigation/reihenfolge", {
				menu: menu.key,
				ids: items.map((item) => item.id)
			}, {
				preserveScroll: true,
				preserveState: true,
				onSuccess: () => markFresh(entry.id),
				onError: refused(menu.key),
				onFinish: () => {
					moving.value = false;
					(0, vue_exports.nextTick)(() => {
						([document.getElementById(`nav-${by < 0 ? "up" : "down"}-${entry.id}`), document.getElementById(`nav-${by < 0 ? "down" : "up"}-${entry.id}`)].find((button) => button !== null && !button.disabled && button.offsetParent !== null) ?? byKey(`nav-more-${entry.id}`))?.focus();
					});
				}
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Navigation",
				context: context.value,
				"read-only": readOnly.value
			}, _attrs), (0, vue_exports.createSlots)({
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="adm-note nav-adm__live" data-v-b4f44dc0${_scopeId}>Jede Änderung steht sofort im Shop, auf jeder Seite.</p><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.menus, (menu) => {
							_push(`<section class="nav-adm__menu"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `nav-m-${menu.key}`)} data-v-b4f44dc0${_scopeId}><div class="nav-adm__head" data-v-b4f44dc0${_scopeId}><h2${(0, server_renderer_exports.ssrRenderAttr)("id", `nav-m-${menu.key}`)} class="adm-section__title" data-v-b4f44dc0${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(menu.label)}</h2><p class="nav-adm__note" data-v-b4f44dc0${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(menuNote(menu))}</p></div>`);
							if (rowError.value?.menu === menu.key) _push(`<p class="adm-alert" role="alert" data-v-b4f44dc0${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(rowError.value.text)}</p>`);
							else _push(`<!---->`);
							_push(`<ol class="nav-adm__list" data-v-b4f44dc0${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(menu.items, (entry, index) => {
								_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{ "adm-row--fresh": fresh.value === entry.id }, "nav-adm__entry"])}" data-v-b4f44dc0${_scopeId}><div class="nav-adm__text" data-v-b4f44dc0${_scopeId}><p class="nav-adm__label" data-v-b4f44dc0${_scopeId}>`);
								if (mayChange(entry)) _push(`<button class="nav-adm__open" type="button" data-v-b4f44dc0${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.label)}</button>`);
								else _push(`<span data-v-b4f44dc0${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.label)}</span>`);
								if (!entry.visible) _push(`<span class="adm-tag adm-tag--neutral" data-v-b4f44dc0${_scopeId}>Ausgeblendet</span>`);
								else _push(`<!---->`);
								_push(`</p><p class="nav-adm__target" data-v-b4f44dc0${_scopeId}> führt zu ${(0, server_renderer_exports.ssrInterpolate)(entry.targetLabel)}`);
								if (entry.locked) _push(`<!--[--> · muss auf jeder Seite erreichbar sein<!--]-->`);
								else _push(`<!---->`);
								if (menu.icon) {
									_push(`<!--[--> · Symbol: `);
									if (glyph(entry.icon)) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
										class: "nav-adm__glyph",
										name: glyph(entry.icon),
										size: 16
									}, null, _parent, _scopeId));
									else _push(`<!---->`);
									_push(` ${(0, server_renderer_exports.ssrInterpolate)(iconLabel(entry.icon))}<!--]-->`);
								} else _push(`<!---->`);
								_push(`</p></div><div class="nav-adm__tools" data-v-b4f44dc0${_scopeId}>`);
								if (__props.can.edit) {
									_push(`<div class="adm-row-arrows" data-v-b4f44dc0${_scopeId}><button${(0, server_renderer_exports.ssrRenderAttr)("id", `nav-up-${entry.id}`)} class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(index === 0 || moving.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${entry.label} nach oben`)} data-v-b4f44dc0${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "chevron-up",
										size: 20
									}, null, _parent, _scopeId));
									_push(`</button><button${(0, server_renderer_exports.ssrRenderAttr)("id", `nav-down-${entry.id}`)} class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(index === menu.items.length - 1 || moving.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${entry.label} nach unten`)} data-v-b4f44dc0${_scopeId}>`);
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
												"data-focus": `nav-more-${entry.id}`,
												class: "adm-iconbtn",
												"aria-label": `Aktionen für ${entry.label}`
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
																if (mayChange(entry)) {
																	_push(`<!--[-->`);
																	_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
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
																	_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item",
																		onSelect: ($event) => toggle(entry)
																	}, {
																		default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																			if (_push) {
																				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																					name: entry.visible ? "eye-off" : "eye",
																					size: 20
																				}, null, _parent, _scopeId));
																				_push(` ${(0, server_renderer_exports.ssrInterpolate)(entry.visible ? "Ausblenden" : "Zeigen")}`);
																			} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																				name: entry.visible ? "eye-off" : "eye",
																				size: 20
																			}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(entry.visible ? "Ausblenden" : "Zeigen"), 1)];
																		}),
																		_: 2
																	}, _parent, _scopeId));
																	_push(`<!--]-->`);
																} else _push(`<!---->`);
																if (__props.can.edit) {
																	_push(`<!--[-->`);
																	_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item",
																		disabled: positionOf(entry).index === 0 || moving.value,
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
																		disabled: positionOf(entry).index === positionOf(entry).count - 1 || moving.value,
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
																mayChange(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	class: "adm-menu__item",
																	onSelect: ($event) => openEdit(entry)
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "edit",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Bearbeiten ")]),
																	_: 1
																}, 8, ["onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	class: "adm-menu__item",
																	onSelect: ($event) => toggle(entry)
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: entry.visible ? "eye-off" : "eye",
																		size: 20
																	}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(entry.visible ? "Ausblenden" : "Zeigen"), 1)]),
																	_: 2
																}, 1032, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true),
																__props.can.edit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	class: "adm-menu__item",
																	disabled: positionOf(entry).index === 0 || moving.value,
																	onSelect: ($event) => move(entry, -1)
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "chevron-up",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Nach oben ")]),
																	_: 1
																}, 8, ["disabled", "onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	class: "adm-menu__item",
																	disabled: positionOf(entry).index === positionOf(entry).count - 1 || moving.value,
																	onSelect: ($event) => move(entry, 1)
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "chevron-down",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Nach unten ")]),
																	_: 1
																}, 8, ["disabled", "onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true),
																mayDelete(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
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
															mayChange(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																class: "adm-menu__item",
																onSelect: ($event) => openEdit(entry)
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "edit",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Bearbeiten ")]),
																_: 1
															}, 8, ["onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																class: "adm-menu__item",
																onSelect: ($event) => toggle(entry)
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: entry.visible ? "eye-off" : "eye",
																	size: 20
																}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(entry.visible ? "Ausblenden" : "Zeigen"), 1)]),
																_: 2
															}, 1032, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true),
															__props.can.edit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																class: "adm-menu__item",
																disabled: positionOf(entry).index === 0 || moving.value,
																onSelect: ($event) => move(entry, -1)
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "chevron-up",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Nach oben ")]),
																_: 1
															}, 8, ["disabled", "onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																class: "adm-menu__item",
																disabled: positionOf(entry).index === positionOf(entry).count - 1 || moving.value,
																onSelect: ($event) => move(entry, 1)
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "chevron-down",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Nach unten ")]),
																_: 1
															}, 8, ["disabled", "onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true),
															mayDelete(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
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
											"data-focus": `nav-more-${entry.id}`,
											class: "adm-iconbtn",
											"aria-label": `Aktionen für ${entry.label}`
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
													mayChange(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														onSelect: ($event) => openEdit(entry)
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "edit",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Bearbeiten ")]),
														_: 1
													}, 8, ["onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														onSelect: ($event) => toggle(entry)
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: entry.visible ? "eye-off" : "eye",
															size: 20
														}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(entry.visible ? "Ausblenden" : "Zeigen"), 1)]),
														_: 2
													}, 1032, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true),
													__props.can.edit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														disabled: positionOf(entry).index === 0 || moving.value,
														onSelect: ($event) => move(entry, -1)
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "chevron-up",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Nach oben ")]),
														_: 1
													}, 8, ["disabled", "onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														disabled: positionOf(entry).index === positionOf(entry).count - 1 || moving.value,
														onSelect: ($event) => move(entry, 1)
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "chevron-down",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Nach unten ")]),
														_: 1
													}, 8, ["disabled", "onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true),
													mayDelete(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
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
							_push(`<!--]--></ol></section>`);
						});
						_push(`<!--]-->`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
							open: dialogOpen.value,
							"onUpdate:open": ($event) => dialogOpen.value = $event,
							title: title.value,
							"content-class": "adm-dialog",
							onCloseAutoFocus: restoreFocus
						}, {
							actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-b4f44dc0${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="submit" form="nav-form"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-b4f44dc0${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(title.value === "Eintrag anlegen" ? "Anlegen" : "Speichern")}</button>`);
								else return [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									onClick: ($event) => dialogOpen.value = false
								}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--primary",
									type: "submit",
									form: "nav-form",
									disabled: busy.value,
									"aria-busy": busy.value ? "true" : void 0
								}, (0, vue_exports.toDisplayString)(title.value === "Eintrag anlegen" ? "Anlegen" : "Speichern"), 9, ["disabled", "aria-busy"])];
							}),
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<form id="nav-form" class="adm-fields" novalidate data-v-b4f44dc0${_scopeId}>`);
									if (editing.value === "new") {
										_push(`<div class="form-field" data-v-b4f44dc0${_scopeId}><label class="form-field__label" for="nav-menu" data-v-b4f44dc0${_scopeId}>Menü</label><select id="nav-menu" class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.menu ? "true" : void 0)} aria-describedby="nav-menu-err" data-v-b4f44dc0${_scopeId}><!--[-->`);
										(0, server_renderer_exports.ssrRenderList)(__props.menus, (menu) => {
											_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", menu.key)} data-v-b4f44dc0${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(draft.menu) ? (0, server_renderer_exports.ssrLooseContain)(draft.menu, menu.key) : (0, server_renderer_exports.ssrLooseEqual)(draft.menu, menu.key)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(menu.label)}</option>`);
										});
										_push(`<!--]--></select><p id="nav-menu-err" class="form-field__error" data-v-b4f44dc0${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.menu ?? "")}</p></div>`);
									} else _push(`<!---->`);
									_push((0, server_renderer_exports.ssrRenderComponent)(FieldInput_default, {
										id: "nav-label",
										"model-value": draft.label,
										field: labelField.value,
										error: errors.value.label ?? "",
										"onUpdate:modelValue": ($event) => draft.label = String($event ?? "")
									}, null, _parent, _scopeId));
									_push(`<div class="form-field" data-v-b4f44dc0${_scopeId}><label class="form-field__label" for="nav-target" data-v-b4f44dc0${_scopeId}>Führt zu</label><select id="nav-target" class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.target ? "true" : void 0)} aria-describedby="nav-target-help nav-target-err" data-v-b4f44dc0${_scopeId}><option value="" disabled data-v-b4f44dc0${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(draft.target) ? (0, server_renderer_exports.ssrLooseContain)(draft.target, "") : (0, server_renderer_exports.ssrLooseEqual)(draft.target, "")) ? " selected" : ""}${_scopeId}>Ziel wählen</option><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(__props.targets, (option) => {
										_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", option.value)} data-v-b4f44dc0${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(draft.target) ? (0, server_renderer_exports.ssrLooseContain)(draft.target, option.value) : (0, server_renderer_exports.ssrLooseEqual)(draft.target, option.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(option.label)}</option>`);
									});
									_push(`<!--]--></select><p id="nav-target-help" class="form-field__help" data-v-b4f44dc0${_scopeId}>Nur Seiten dieses Shops. Einen Ratgeber-Artikel legst du unter Seiten an.</p><p id="nav-target-err" class="form-field__error" data-v-b4f44dc0${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.target ?? "")}</p></div>`);
									if (draftMenu.value?.icon) _push((0, server_renderer_exports.ssrRenderComponent)(FieldInput_default, {
										id: "nav-icon",
										"model-value": draft.icon,
										field: iconField.value,
										error: errors.value.icon ?? "",
										"onUpdate:modelValue": ($event) => draft.icon = String($event ?? "")
									}, null, _parent, _scopeId));
									else _push(`<!---->`);
									_push(`<label class="check" data-v-b4f44dc0${_scopeId}><input id="nav-visible"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(draft.visible) ? (0, server_renderer_exports.ssrLooseContain)(draft.visible, null) : draft.visible) ? " checked" : ""} type="checkbox"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.visible ? "true" : void 0)} aria-describedby="nav-visible-err" data-v-b4f44dc0${_scopeId}> Im Shop zeigen </label><p id="nav-visible-err" class="form-field__error" data-v-b4f44dc0${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.visible ?? "")}</p></form>`);
								} else return [(0, vue_exports.createVNode)("form", {
									id: "nav-form",
									class: "adm-fields",
									novalidate: "",
									onSubmit: (0, vue_exports.withModifiers)(save, ["prevent"])
								}, [
									editing.value === "new" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 0,
										class: "form-field"
									}, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "nav-menu"
										}, "Menü"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
											id: "nav-menu",
											"onUpdate:modelValue": ($event) => draft.menu = $event,
											class: "input",
											"aria-invalid": errors.value.menu ? "true" : void 0,
											"aria-describedby": "nav-menu-err",
											onChange: onMenuChange
										}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.menus, (menu) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
												key: menu.key,
												value: menu.key
											}, (0, vue_exports.toDisplayString)(menu.label), 9, ["value"]);
										}), 128))], 40, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelSelect, draft.menu]]),
										(0, vue_exports.createVNode)("p", {
											id: "nav-menu-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(errors.value.menu ?? ""), 1)
									])) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)(FieldInput_default, {
										id: "nav-label",
										"model-value": draft.label,
										field: labelField.value,
										error: errors.value.label ?? "",
										"onUpdate:modelValue": ($event) => draft.label = String($event ?? "")
									}, null, 8, [
										"model-value",
										"field",
										"error",
										"onUpdate:modelValue"
									]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "nav-target"
										}, "Führt zu"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
											id: "nav-target",
											"onUpdate:modelValue": ($event) => draft.target = $event,
											class: "input",
											"aria-invalid": errors.value.target ? "true" : void 0,
											"aria-describedby": "nav-target-help nav-target-err"
										}, [(0, vue_exports.createVNode)("option", {
											value: "",
											disabled: ""
										}, "Ziel wählen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.targets, (option) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
												key: option.value,
												value: option.value
											}, (0, vue_exports.toDisplayString)(option.label), 9, ["value"]);
										}), 128))], 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelSelect, draft.target]]),
										(0, vue_exports.createVNode)("p", {
											id: "nav-target-help",
											class: "form-field__help"
										}, "Nur Seiten dieses Shops. Einen Ratgeber-Artikel legst du unter Seiten an."),
										(0, vue_exports.createVNode)("p", {
											id: "nav-target-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(errors.value.target ?? ""), 1)
									]),
									draftMenu.value?.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(FieldInput_default, {
										key: 1,
										id: "nav-icon",
										"model-value": draft.icon,
										field: iconField.value,
										error: errors.value.icon ?? "",
										"onUpdate:modelValue": ($event) => draft.icon = String($event ?? "")
									}, null, 8, [
										"model-value",
										"field",
										"error",
										"onUpdate:modelValue"
									])) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "nav-visible",
										"onUpdate:modelValue": ($event) => draft.visible = $event,
										type: "checkbox",
										"aria-invalid": errors.value.visible ? "true" : void 0,
										"aria-describedby": "nav-visible-err"
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelCheckbox, draft.visible]]), (0, vue_exports.createTextVNode)(" Im Shop zeigen ")]),
									(0, vue_exports.createVNode)("p", {
										id: "nav-visible-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(errors.value.visible ?? ""), 1)
								], 32)];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: deleteOpen.value,
							"onUpdate:open": ($event) => deleteOpen.value = $event,
							title: deleteTitle.value,
							body: "Der Eintrag verschwindet aus dem Menü, auf jeder Seite des Shops. Die Seite, zu der er führt, bleibt bestehen.",
							"confirm-label": "Löschen",
							busy: busy.value,
							onConfirm: remove,
							onCloseAutoFocus: restoreFocus
						}, null, _parent, _scopeId));
					} else return [
						(0, vue_exports.createVNode)("p", { class: "adm-note nav-adm__live" }, "Jede Änderung steht sofort im Shop, auf jeder Seite."),
						((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.menus, (menu) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
								key: menu.key,
								class: "nav-adm__menu",
								"aria-labelledby": `nav-m-${menu.key}`
							}, [
								(0, vue_exports.createVNode)("div", { class: "nav-adm__head" }, [(0, vue_exports.createVNode)("h2", {
									id: `nav-m-${menu.key}`,
									class: "adm-section__title"
								}, (0, vue_exports.toDisplayString)(menu.label), 9, ["id"]), (0, vue_exports.createVNode)("p", { class: "nav-adm__note" }, (0, vue_exports.toDisplayString)(menuNote(menu)), 1)]),
								rowError.value?.menu === menu.key ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 0,
									class: "adm-alert",
									role: "alert"
								}, (0, vue_exports.toDisplayString)(rowError.value.text), 1)) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("ol", { class: "nav-adm__list" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(menu.items, (entry, index) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
										key: entry.id,
										class: ["nav-adm__entry", { "adm-row--fresh": fresh.value === entry.id }],
										onAnimationend: ($event) => fresh.value = null
									}, [(0, vue_exports.createVNode)("div", { class: "nav-adm__text" }, [(0, vue_exports.createVNode)("p", { class: "nav-adm__label" }, [mayChange(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
										key: 0,
										class: "nav-adm__open",
										type: "button",
										onClick: ($event) => openEdit(entry)
									}, (0, vue_exports.toDisplayString)(entry.label), 9, ["onClick"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 1 }, (0, vue_exports.toDisplayString)(entry.label), 1)), !entry.visible ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 2,
										class: "adm-tag adm-tag--neutral"
									}, "Ausgeblendet")) : (0, vue_exports.createCommentVNode)("", true)]), (0, vue_exports.createVNode)("p", { class: "nav-adm__target" }, [
										(0, vue_exports.createTextVNode)(" führt zu " + (0, vue_exports.toDisplayString)(entry.targetLabel), 1),
										entry.locked ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · muss auf jeder Seite erreichbar sein")], 64)) : (0, vue_exports.createCommentVNode)("", true),
										menu.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [
											(0, vue_exports.createTextVNode)(" · Symbol: "),
											glyph(entry.icon) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(Icon_default, {
												key: 0,
												class: "nav-adm__glyph",
												name: glyph(entry.icon),
												size: 16
											}, null, 8, ["name"])) : (0, vue_exports.createCommentVNode)("", true),
											(0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(iconLabel(entry.icon)), 1)
										], 64)) : (0, vue_exports.createCommentVNode)("", true)
									])]), (0, vue_exports.createVNode)("div", { class: "nav-adm__tools" }, [__props.can.edit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 0,
										class: "adm-row-arrows"
									}, [(0, vue_exports.createVNode)("button", {
										id: `nav-up-${entry.id}`,
										class: "adm-iconbtn",
										type: "button",
										disabled: index === 0 || moving.value,
										"aria-label": `${entry.label} nach oben`,
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
										id: `nav-down-${entry.id}`,
										class: "adm-iconbtn",
										type: "button",
										disabled: index === menu.items.length - 1 || moving.value,
										"aria-label": `${entry.label} nach unten`,
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
											"data-focus": `nav-more-${entry.id}`,
											class: "adm-iconbtn",
											"aria-label": `Aktionen für ${entry.label}`
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
													mayChange(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														onSelect: ($event) => openEdit(entry)
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "edit",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Bearbeiten ")]),
														_: 1
													}, 8, ["onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														onSelect: ($event) => toggle(entry)
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: entry.visible ? "eye-off" : "eye",
															size: 20
														}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(entry.visible ? "Ausblenden" : "Zeigen"), 1)]),
														_: 2
													}, 1032, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true),
													__props.can.edit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														disabled: positionOf(entry).index === 0 || moving.value,
														onSelect: ($event) => move(entry, -1)
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "chevron-up",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Nach oben ")]),
														_: 1
													}, 8, ["disabled", "onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														disabled: positionOf(entry).index === positionOf(entry).count - 1 || moving.value,
														onSelect: ($event) => move(entry, 1)
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "chevron-down",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Nach unten ")]),
														_: 1
													}, 8, ["disabled", "onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true),
													mayDelete(entry) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
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
								}), 128))])
							], 8, ["aria-labelledby"]);
						}), 128)),
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
								form: "nav-form",
								disabled: busy.value,
								"aria-busy": busy.value ? "true" : void 0
							}, (0, vue_exports.toDisplayString)(title.value === "Eintrag anlegen" ? "Anlegen" : "Speichern"), 9, ["disabled", "aria-busy"])]),
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("form", {
								id: "nav-form",
								class: "adm-fields",
								novalidate: "",
								onSubmit: (0, vue_exports.withModifiers)(save, ["prevent"])
							}, [
								editing.value === "new" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "form-field"
								}, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "nav-menu"
									}, "Menü"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "nav-menu",
										"onUpdate:modelValue": ($event) => draft.menu = $event,
										class: "input",
										"aria-invalid": errors.value.menu ? "true" : void 0,
										"aria-describedby": "nav-menu-err",
										onChange: onMenuChange
									}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.menus, (menu) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
											key: menu.key,
											value: menu.key
										}, (0, vue_exports.toDisplayString)(menu.label), 9, ["value"]);
									}), 128))], 40, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelSelect, draft.menu]]),
									(0, vue_exports.createVNode)("p", {
										id: "nav-menu-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(errors.value.menu ?? ""), 1)
								])) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)(FieldInput_default, {
									id: "nav-label",
									"model-value": draft.label,
									field: labelField.value,
									error: errors.value.label ?? "",
									"onUpdate:modelValue": ($event) => draft.label = String($event ?? "")
								}, null, 8, [
									"model-value",
									"field",
									"error",
									"onUpdate:modelValue"
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "nav-target"
									}, "Führt zu"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "nav-target",
										"onUpdate:modelValue": ($event) => draft.target = $event,
										class: "input",
										"aria-invalid": errors.value.target ? "true" : void 0,
										"aria-describedby": "nav-target-help nav-target-err"
									}, [(0, vue_exports.createVNode)("option", {
										value: "",
										disabled: ""
									}, "Ziel wählen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.targets, (option) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
											key: option.value,
											value: option.value
										}, (0, vue_exports.toDisplayString)(option.label), 9, ["value"]);
									}), 128))], 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelSelect, draft.target]]),
									(0, vue_exports.createVNode)("p", {
										id: "nav-target-help",
										class: "form-field__help"
									}, "Nur Seiten dieses Shops. Einen Ratgeber-Artikel legst du unter Seiten an."),
									(0, vue_exports.createVNode)("p", {
										id: "nav-target-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(errors.value.target ?? ""), 1)
								]),
								draftMenu.value?.icon ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(FieldInput_default, {
									key: 1,
									id: "nav-icon",
									"model-value": draft.icon,
									field: iconField.value,
									error: errors.value.icon ?? "",
									"onUpdate:modelValue": ($event) => draft.icon = String($event ?? "")
								}, null, 8, [
									"model-value",
									"field",
									"error",
									"onUpdate:modelValue"
								])) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "nav-visible",
									"onUpdate:modelValue": ($event) => draft.visible = $event,
									type: "checkbox",
									"aria-invalid": errors.value.visible ? "true" : void 0,
									"aria-describedby": "nav-visible-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelCheckbox, draft.visible]]), (0, vue_exports.createTextVNode)(" Im Shop zeigen ")]),
								(0, vue_exports.createVNode)("p", {
									id: "nav-visible-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.visible ?? ""), 1)
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
							body: "Der Eintrag verschwindet aus dem Menü, auf jeder Seite des Shops. Die Seite, zu der er führt, bleibt bestehen.",
							"confirm-label": "Löschen",
							busy: busy.value,
							onConfirm: remove,
							onCloseAutoFocus: restoreFocus
						}, null, 8, [
							"open",
							"onUpdate:open",
							"title",
							"busy"
						])
					];
				}),
				_: 2
			}, [__props.can.create ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button id="nav-new" class="btn btn--primary" type="button" data-v-b4f44dc0${_scopeId}>Eintrag anlegen</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						id: "nav-new",
						class: "btn btn--primary",
						type: "button",
						onClick: openNew
					}, "Eintrag anlegen")];
				}),
				key: "0"
			} : void 0]), _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Navigation/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Navigation/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-b4f44dc0"]]);
//#endregion
export { Index_default as default };
