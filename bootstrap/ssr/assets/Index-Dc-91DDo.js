import { t as Dialog_default } from "./Dialog-C-07FMpe.js";
import { a as DropdownMenuRoot_default, i as DropdownMenuContent_default, n as DropdownMenuPortal_default, r as DropdownMenuItem_default, t as DropdownMenuTrigger_default } from "./DropdownMenuTrigger-DR2ieCu7.js";
import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-CzJXz77H.js";
import { t as DropdownMenuSeparator_default } from "./DropdownMenuSeparator-KcmMgHOf.js";
import { a as link_default, c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { t as AdminConfirm_default } from "./AdminConfirm-CJZtnwyX.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { n as AdminSaveBar_default, t as useDirtyForm } from "./useDirtyForm-D_oy2Apt.js";
import { t as RightBox_default } from "./RightBox-Ry18XAJW.js";
import { t as RoleDiffList_default } from "./RoleDiffList-CdtSZ412.js";
//#region resources/js/composables/admin/roleDiff.ts
function rightKey(module, action) {
	return `${module}.${action}`;
}
/**
* Every real cell of the grid, in its order: modules down, each module's own actions across.
*/
function realCells(modules) {
	return modules.flatMap((m) => m.actions.map((a) => rightKey(m.module, a)));
}
/**
* What changes when a role's rights go from `current` to `next`. Cells the grid does not know are
* ignored on both sides: they are not rights, so neither gaining nor losing one means anything.
*/
function roleDiff(current, next, modules, actions) {
	const before = new Set(current);
	const after = new Set(next);
	const actionLabel = new Map(actions.map((a) => [a.action, a.label]));
	const gained = [];
	const lost = [];
	for (const module of modules) for (const action of module.actions) {
		const key = rightKey(module.module, action);
		const had = before.has(key);
		const has = after.has(key);
		if (had === has) continue;
		const change = {
			key,
			module: module.module,
			action,
			label: `${module.label} · ${actionLabel.get(action) ?? action}`
		};
		(has ? gained : lost).push(change);
	}
	return {
		gained,
		lost
	};
}
/**
* The rights with one module switched wholly on or off, everything else untouched — what a
* module's *Alle* would save. Kept in the grid's order.
*/
function withModule(rights, modules, module, on) {
	const target = modules.find((m) => m.module === module);
	const next = new Set(rights);
	for (const action of target?.actions ?? []) {
		const key = rightKey(module, action);
		if (on) next.add(key);
		else next.delete(key);
	}
	return realCells(modules).filter((key) => next.has(key));
}
/** How much of one module a role holds: none, some, or all of its real actions. */
function moduleState(rights, module) {
	const held = module.actions.filter((a) => rights.includes(rightKey(module.module, a))).length;
	if (held === 0) return "none";
	return held === module.actions.length ? "all" : "some";
}
/**
* The modules whose German name contains the search, ignoring case and spacing at the edges. An
* empty search is every module.
*/
function matchModules(modules, query) {
	const needle = query.trim().toLocaleLowerCase("de-DE");
	if (needle === "") return [...modules];
	return modules.filter((m) => m.label.toLocaleLowerCase("de-DE").includes(needle));
}
//#endregion
//#region resources/js/Pages/Admin/Rollen/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		roles: {},
		accounts: {},
		modules: {},
		actions: {},
		selected: {},
		navigation: {},
		grantable: {},
		can: {}
	},
	setup(__props) {
		/**
		* Team › Rollen & Rechte (BRIEF.md §2).
		*
		* The roles on the left, one role's rights on the right: modules down, actions across, and only the
		* actions a module really has — a cell that cannot exist is left quiet, never a checkbox that does
		* nothing.
		*
		* Nothing saves on a click. Ticks, a module's "Alle" and "Von Rolle kopieren" all change a draft;
		* the save bar says so, and Speichern first shows exactly which rights the role gains and loses
		* (BRIEF §2: "a diff of what changes before saving", "every change is confirmed"). Leaving with an
		* unsaved draft is asked about, like every admin form.
		*
		* Every refusal is the server's (R-11): the Super-Admin always has everything, nobody widens a role
		* they hold themselves, and nobody takes away the last way back into this screen. The page only
		* draws what the viewer may try, and shows the server's sentence when a save is refused.
		*
		* Below 1024 px the role is chosen from a select and each module becomes a block of its actions.
		*/
		const props = __props;
		const page = usePage();
		const role = (0, vue_exports.computed)(() => props.roles.find((r) => r.id === props.selected) ?? null);
		const context = (0, vue_exports.computed)(() => `${decimal(props.roles.length, 0)} ${props.roles.length === 1 ? "Rolle" : "Rollen"} · ${decimal(props.accounts, 0)} ${props.accounts === 1 ? "Konto" : "Konten"}`);
		/** What this viewer may change on the selected role. */
		const editable = (0, vue_exports.computed)(() => props.can.update && role.value !== null && !role.value.isSuperAdmin);
		function actionLabel(action) {
			return props.actions.find((a) => a.action === action)?.label ?? action;
		}
		function accounts(n) {
			return `${decimal(n, 0)} ${n === 1 ? "Konto" : "Konten"}`;
		}
		/** The save waiting for its yes, while the difference is on screen. */
		let send = null;
		const confirmOpen = (0, vue_exports.ref)(false);
		const editor = useDirtyForm({ rights: [...role.value?.rights ?? []] }, {
			method: "put",
			url: () => `/admin/rollen/${props.selected ?? 0}/rechte`,
			beforeSave: (proceed) => {
				send = proceed;
				confirmOpen.value = true;
			}
		});
		const draft = (0, vue_exports.computed)(() => editor.form.rights);
		(0, vue_exports.watch)(() => [props.selected, role.value?.rights.join(",")], () => {
			editor.form.defaults({ rights: [...role.value?.rights ?? []] });
			editor.form.reset();
			confirmOpen.value = false;
		});
		function has(key) {
			return draft.value.includes(key);
		}
		/** Whether this viewer may hand out every one of these rights (they hold them, or are a Super-Admin). */
		function mayGrant(rights) {
			return props.grantable === null || rights.every((key) => props.grantable?.includes(key) === true);
		}
		/**
		* A box the viewer may change: never on the Super-Admin; a right the role already had may always go;
		* a new one only when the role is not their own and they hold that right themselves.
		*/
		function boxEditable(key) {
			if (!editable.value || role.value === null) return false;
			if (role.value.rights.includes(key)) return true;
			return !role.value.raiseBlocked && mayGrant([key]);
		}
		function setRight(key, on) {
			const next = new Set(draft.value);
			if (on) next.add(key);
			else next.delete(key);
			editor.form.rights = realCells(props.modules).filter((k) => next.has(k));
		}
		function moduleAll(module) {
			const on = moduleState(draft.value, module) !== "all";
			const next = withModule(draft.value, props.modules, module.module, on);
			editor.form.rights = on ? next.filter((key) => draft.value.includes(key) || role.value?.rights.includes(key) || mayGrant([key])) : next;
		}
		/** "Alle" is offered where it can do something for this viewer. */
		function allEditable(module) {
			return editable.value && role.value !== null && !role.value.raiseBlocked && module.actions.some((a) => boxEditable(rightKey(module.module, a)));
		}
		const saveDiff = (0, vue_exports.computed)(() => role.value === null ? null : roleDiff(role.value.rights, draft.value, props.modules, props.actions));
		function confirmSave() {
			confirmOpen.value = false;
			send?.();
			send = null;
		}
		const errors = (0, vue_exports.computed)(() => {
			const bag = page.props.errors;
			return bag !== null && typeof bag === "object" ? bag : {};
		});
		const refusal = (0, vue_exports.computed)(() => errors.value.rights ?? errors.value.allowed ?? errors.value.role ?? "");
		const copyOpen = (0, vue_exports.ref)(false);
		const copySource = (0, vue_exports.ref)("");
		/** Only roles whose rights this viewer may hand out can be copied from. */
		const copyCandidates = (0, vue_exports.computed)(() => props.roles.filter((r) => r.id !== props.selected && mayGrant(r.rights)));
		const createSources = (0, vue_exports.computed)(() => props.roles.filter((r) => mayGrant(r.rights)));
		const copyDiff = (0, vue_exports.computed)(() => {
			const source = props.roles.find((r) => r.id === copySource.value);
			return source ? roleDiff(draft.value, source.rights, props.modules, props.actions) : null;
		});
		function openCopy() {
			copySource.value = "";
			copyOpen.value = true;
		}
		function applyCopy() {
			const source = props.roles.find((r) => r.id === copySource.value);
			if (!source || !copyDiff.value || copyDiff.value.gained.length + copyDiff.value.lost.length === 0) return;
			const cells = new Set(source.rights);
			editor.form.rights = realCells(props.modules).filter((k) => cells.has(k));
			copyOpen.value = false;
		}
		/** Which dialog sent the last request: each shows only the server's messages about its own save. */
		const sentFrom = (0, vue_exports.ref)(null);
		function dialogError(from, key) {
			return sentFrom.value === from ? errors.value[key] ?? "" : "";
		}
		const createOpen = (0, vue_exports.ref)(false);
		const createForm = (0, vue_exports.ref)({
			label: "",
			description: "",
			copyFrom: ""
		});
		const createBusy = (0, vue_exports.ref)(false);
		function openCreate() {
			createForm.value = {
				label: "",
				description: "",
				copyFrom: ""
			};
			sentFrom.value = null;
			createOpen.value = true;
		}
		function submitCreate() {
			if (createBusy.value) return;
			sentFrom.value = "create";
			createBusy.value = true;
			router.post("/admin/rollen", {
				label: createForm.value.label,
				description: createForm.value.description || null,
				copyFrom: createForm.value.copyFrom === "" ? null : createForm.value.copyFrom
			}, {
				preserveScroll: true,
				onSuccess: () => createOpen.value = false,
				onFinish: () => createBusy.value = false
			});
		}
		const renameOpen = (0, vue_exports.ref)(false);
		const renameForm = (0, vue_exports.ref)({
			label: "",
			description: ""
		});
		const renameBusy = (0, vue_exports.ref)(false);
		function openRename() {
			renameForm.value = {
				label: role.value?.label ?? "",
				description: role.value?.description ?? ""
			};
			sentFrom.value = null;
			renameOpen.value = true;
		}
		function submitRename() {
			const current = role.value;
			if (current === null || renameBusy.value) return;
			sentFrom.value = "rename";
			renameBusy.value = true;
			router.patch(`/admin/rollen/${current.id}`, {
				label: renameForm.value.label,
				description: renameForm.value.description || null
			}, {
				preserveScroll: true,
				onSuccess: () => renameOpen.value = false,
				onFinish: () => renameBusy.value = false
			});
		}
		function duplicate() {
			if (role.value !== null) router.post(`/admin/rollen/${role.value.id}/duplizieren`, {}, { preserveScroll: true });
		}
		const deleteOpen = (0, vue_exports.ref)(false);
		const deleteBusy = (0, vue_exports.ref)(false);
		function submitDelete() {
			const current = role.value;
			if (current === null) return;
			deleteBusy.value = true;
			router.delete(`/admin/rollen/${current.id}`, { onFinish: () => {
				deleteBusy.value = false;
				deleteOpen.value = false;
			} });
		}
		/** The one menu of secondary actions for this role and this viewer (admin-shell §8.1). */
		const menu = (0, vue_exports.computed)(() => {
			const current = role.value;
			if (current === null || current.isSuperAdmin) return {
				copy: false,
				rename: false,
				duplicate: false,
				remove: false
			};
			return {
				copy: editable.value && !current.raiseBlocked && copyCandidates.value.length > 0,
				rename: props.can.update,
				duplicate: props.can.create && mayGrant(current.rights),
				remove: props.can.delete && !current.isSystem && current.users === 0
			};
		});
		const hasMenu = (0, vue_exports.computed)(() => menu.value.copy || menu.value.rename || menu.value.duplicate || menu.value.remove);
		const previewOpen = (0, vue_exports.ref)(false);
		const search = (0, vue_exports.ref)("");
		const shownModules = (0, vue_exports.computed)(() => matchModules(props.modules, search.value));
		let pendingPick = null;
		let arrowed = false;
		function goTo(id) {
			pendingPick = null;
			if (id !== String(props.selected)) router.get("/admin/rollen", { rolle: id }, { preserveScroll: true });
		}
		function pickKey(event) {
			if ([
				"ArrowUp",
				"ArrowDown",
				"Home",
				"End",
				"PageUp",
				"PageDown"
			].includes(event.key)) arrowed = true;
			else if (event.key === "Enter" && pendingPick !== null) {
				event.preventDefault();
				goTo(pendingPick);
			}
		}
		function pick(event) {
			const id = event.target.value;
			if (arrowed) {
				arrowed = false;
				pendingPick = id;
				return;
			}
			goTo(id);
		}
		function pickBlur() {
			arrowed = false;
			if (pendingPick !== null) goTo(pendingPick);
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Rollen & Rechte",
				context: context.value,
				"read-only": !__props.can.update && !__props.can.create
			}, _attrs), (0, vue_exports.createSlots)({
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="rol" data-v-65196a31${_scopeId}><nav class="rol__list" aria-label="Rollen" data-v-65196a31${_scopeId}><ul data-v-65196a31${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.roles, (item) => {
							_push(`<li data-v-65196a31${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
								href: `/admin/rollen?rolle=${item.id}`,
								class: "rol__role",
								"aria-current": item.id === __props.selected ? "page" : void 0,
								"preserve-scroll": ""
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push(`<span class="rol__role-name" data-v-65196a31${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.label)}</span><span class="rol__role-meta" data-v-65196a31${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(accounts(item.users))}</span>`);
									else return [(0, vue_exports.createVNode)("span", { class: "rol__role-name" }, (0, vue_exports.toDisplayString)(item.label), 1), (0, vue_exports.createVNode)("span", { class: "rol__role-meta" }, (0, vue_exports.toDisplayString)(accounts(item.users)), 1)];
								}),
								_: 2
							}, _parent, _scopeId));
							_push(`</li>`);
						});
						_push(`<!--]--></ul></nav><div class="form-field rol__pick" data-v-65196a31${_scopeId}><label class="form-field__label" for="rol-pick" data-v-65196a31${_scopeId}>Rolle</label><select id="rol-pick" class="input"${(0, server_renderer_exports.ssrRenderAttr)("value", __props.selected ?? "")} data-v-65196a31${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.roles, (item) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", item.id)} data-v-65196a31${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.label)} (${(0, server_renderer_exports.ssrInterpolate)(accounts(item.users))})</option>`);
						});
						_push(`<!--]--></select></div>`);
						if (role.value) {
							_push(`<section class="rol__editor" aria-labelledby="rol-title" data-v-65196a31${_scopeId}><header class="rol__head" data-v-65196a31${_scopeId}><div class="rol__titles" data-v-65196a31${_scopeId}><h2 id="rol-title" class="adm-section__title" data-v-65196a31${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(role.value.label)}</h2><p class="adm-note" data-v-65196a31${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(role.value.description ?? "Ohne Beschreibung.")} · ${(0, server_renderer_exports.ssrInterpolate)(accounts(role.value.users))}</p></div><div class="rol__actions" data-v-65196a31${_scopeId}><button class="btn btn--secondary" type="button" data-v-65196a31${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "eye",
								size: 16
							}, null, _parent, _scopeId));
							_push(` Ansicht als Rolle </button>`);
							if (hasMenu.value) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
											class: "adm-iconbtn rol__more",
											"aria-label": `Weitere Aktionen für ${role.value.label}`
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
															if (menu.value.copy) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																class: "adm-menu__item",
																onSelect: openCopy
															}, {
																default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																	if (_push) {
																		_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																			name: "imports",
																			size: 20
																		}, null, _parent, _scopeId));
																		_push(` Von Rolle kopieren `);
																	} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "imports",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Von Rolle kopieren ")];
																}),
																_: 1
															}, _parent, _scopeId));
															else _push(`<!---->`);
															if (menu.value.rename) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																class: "adm-menu__item",
																onSelect: openRename
															}, {
																default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																	if (_push) {
																		_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																			name: "edit",
																			size: 20
																		}, null, _parent, _scopeId));
																		_push(` ${(0, server_renderer_exports.ssrInterpolate)(role.value.isSystem ? "Beschreibung ändern" : "Umbenennen")}`);
																	} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "edit",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(role.value.isSystem ? "Beschreibung ändern" : "Umbenennen"), 1)];
																}),
																_: 1
															}, _parent, _scopeId));
															else _push(`<!---->`);
															if (menu.value.duplicate) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																class: "adm-menu__item",
																onSelect: duplicate
															}, {
																default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																	if (_push) {
																		_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																			name: "duplicate",
																			size: 20
																		}, null, _parent, _scopeId));
																		_push(` Duplizieren `);
																	} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "duplicate",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Duplizieren ")];
																}),
																_: 1
															}, _parent, _scopeId));
															else _push(`<!---->`);
															if (menu.value.remove) {
																_push(`<!--[-->`);
																_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }, null, _parent, _scopeId));
																_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	class: "adm-menu__item adm-menu__item--danger",
																	onSelect: ($event) => deleteOpen.value = true
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
																	_: 1
																}, _parent, _scopeId));
																_push(`<!--]-->`);
															} else _push(`<!---->`);
														} else return [
															menu.value.copy ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																key: 0,
																class: "adm-menu__item",
																onSelect: openCopy
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "imports",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Von Rolle kopieren ")]),
																_: 1
															})) : (0, vue_exports.createCommentVNode)("", true),
															menu.value.rename ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																key: 1,
																class: "adm-menu__item",
																onSelect: openRename
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "edit",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(role.value.isSystem ? "Beschreibung ändern" : "Umbenennen"), 1)]),
																_: 1
															})) : (0, vue_exports.createCommentVNode)("", true),
															menu.value.duplicate ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																key: 2,
																class: "adm-menu__item",
																onSelect: duplicate
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "duplicate",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Duplizieren ")]),
																_: 1
															})) : (0, vue_exports.createCommentVNode)("", true),
															menu.value.remove ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																class: "adm-menu__item adm-menu__item--danger",
																onSelect: ($event) => deleteOpen.value = true
															}, {
																default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "delete",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Löschen ")]),
																_: 1
															}, 8, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true)
														];
													}),
													_: 1
												}, _parent, _scopeId));
												else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
													class: "adm-menu",
													align: "end",
													"side-offset": 8
												}, {
													default: (0, vue_exports.withCtx)(() => [
														menu.value.copy ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
															key: 0,
															class: "adm-menu__item",
															onSelect: openCopy
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "imports",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Von Rolle kopieren ")]),
															_: 1
														})) : (0, vue_exports.createCommentVNode)("", true),
														menu.value.rename ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
															key: 1,
															class: "adm-menu__item",
															onSelect: openRename
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "edit",
																size: 20
															}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(role.value.isSystem ? "Beschreibung ändern" : "Umbenennen"), 1)]),
															_: 1
														})) : (0, vue_exports.createCommentVNode)("", true),
														menu.value.duplicate ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
															key: 2,
															class: "adm-menu__item",
															onSelect: duplicate
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "duplicate",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Duplizieren ")]),
															_: 1
														})) : (0, vue_exports.createCommentVNode)("", true),
														menu.value.remove ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
															class: "adm-menu__item adm-menu__item--danger",
															onSelect: ($event) => deleteOpen.value = true
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "delete",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Löschen ")]),
															_: 1
														}, 8, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true)
													]),
													_: 1
												})];
											}),
											_: 1
										}, _parent, _scopeId));
									} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
										class: "adm-iconbtn rol__more",
										"aria-label": `Weitere Aktionen für ${role.value.label}`
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
											"side-offset": 8
										}, {
											default: (0, vue_exports.withCtx)(() => [
												menu.value.copy ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: 0,
													class: "adm-menu__item",
													onSelect: openCopy
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "imports",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Von Rolle kopieren ")]),
													_: 1
												})) : (0, vue_exports.createCommentVNode)("", true),
												menu.value.rename ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: 1,
													class: "adm-menu__item",
													onSelect: openRename
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "edit",
														size: 20
													}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(role.value.isSystem ? "Beschreibung ändern" : "Umbenennen"), 1)]),
													_: 1
												})) : (0, vue_exports.createCommentVNode)("", true),
												menu.value.duplicate ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: 2,
													class: "adm-menu__item",
													onSelect: duplicate
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "duplicate",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Duplizieren ")]),
													_: 1
												})) : (0, vue_exports.createCommentVNode)("", true),
												menu.value.remove ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item adm-menu__item--danger",
													onSelect: ($event) => deleteOpen.value = true
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "delete",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Löschen ")]),
													_: 1
												}, 8, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true)
											]),
											_: 1
										})]),
										_: 1
									})];
								}),
								_: 1
							}, _parent, _scopeId));
							else _push(`<!---->`);
							_push(`</div></header>`);
							if (role.value.isSuperAdmin) _push(`<p class="adm-note rol__note" data-v-65196a31${_scopeId}>Super-Admin hat immer alle Rechte. Sie lassen sich nicht ändern.</p>`);
							else if (role.value.raiseBlocked && editable.value) _push(`<p class="adm-note rol__note" data-v-65196a31${_scopeId}> Du hast diese Rolle selbst. Rechte kannst du ihr nehmen, aber nicht geben – das macht eine andere Person. </p>`);
							else _push(`<!---->`);
							if (refusal.value) _push(`<p class="adm-alert" role="alert" data-v-65196a31${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(refusal.value)}</p>`);
							else _push(`<!---->`);
							_push(`<div class="form-field rol__search" data-v-65196a31${_scopeId}><label class="form-field__label" for="rol-search" data-v-65196a31${_scopeId}>Modul suchen</label><input id="rol-search"${(0, server_renderer_exports.ssrRenderAttr)("value", search.value)} class="input" type="search" autocomplete="off" data-v-65196a31${_scopeId}></div>`);
							if (shownModules.value.length === 0) _push(`<p class="adm-note" data-v-65196a31${_scopeId}>Kein Modul heißt so.</p>`);
							else _push(`<!---->`);
							if (shownModules.value.length) {
								_push(`<div class="rol__grid" data-v-65196a31${_scopeId}><table class="rol__table" data-v-65196a31${_scopeId}><colgroup data-v-65196a31${_scopeId}><col data-v-65196a31${_scopeId}>`);
								if (editable.value && !role.value.raiseBlocked) _push(`<col class="rol__col" data-v-65196a31${_scopeId}>`);
								else _push(`<!---->`);
								_push(`<!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.actions, (action) => {
									_push(`<col class="rol__col" data-v-65196a31${_scopeId}>`);
								});
								_push(`<!--]--></colgroup><thead data-v-65196a31${_scopeId}><tr data-v-65196a31${_scopeId}><th scope="col" data-v-65196a31${_scopeId}>Modul</th>`);
								if (editable.value && !role.value.raiseBlocked) _push(`<th scope="col" class="rol__c" data-v-65196a31${_scopeId}>Alle</th>`);
								else _push(`<!---->`);
								_push(`<!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.actions, (action) => {
									_push(`<th scope="col" class="rol__c" data-v-65196a31${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(action.label)}</th>`);
								});
								_push(`<!--]--></tr></thead><tbody data-v-65196a31${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(shownModules.value, (module) => {
									_push(`<tr data-v-65196a31${_scopeId}><th scope="row" class="rol__module" data-v-65196a31${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(module.label)}</th>`);
									if (editable.value && !role.value.raiseBlocked) {
										_push(`<td class="rol__c" data-v-65196a31${_scopeId}>`);
										if (allEditable(module)) _push((0, server_renderer_exports.ssrRenderComponent)(RightBox_default, {
											label: `${role.value.label}: ${module.label} – alle Rechte`,
											allowed: (0, vue_exports.unref)(moduleState)(draft.value, module) === "all",
											mixed: (0, vue_exports.unref)(moduleState)(draft.value, module) === "some",
											editable: "",
											onChange: ($event) => moduleAll(module)
										}, null, _parent, _scopeId));
										else _push(`<!---->`);
										_push(`</td>`);
									} else _push(`<!---->`);
									_push(`<!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(__props.actions, (action) => {
										_push(`<td class="rol__c" data-v-65196a31${_scopeId}>`);
										if (module.actions.includes(action.action)) _push((0, server_renderer_exports.ssrRenderComponent)(RightBox_default, {
											label: `${role.value.label}: ${module.label} – ${action.label}`,
											allowed: has((0, vue_exports.unref)(rightKey)(module.module, action.action)),
											editable: boxEditable((0, vue_exports.unref)(rightKey)(module.module, action.action)),
											onChange: ($event) => setRight((0, vue_exports.unref)(rightKey)(module.module, action.action), $event.target.checked)
										}, null, _parent, _scopeId));
										else _push(`<!---->`);
										_push(`</td>`);
									});
									_push(`<!--]--></tr>`);
								});
								_push(`<!--]--></tbody></table></div>`);
							} else _push(`<!---->`);
							if (shownModules.value.length) {
								_push(`<div class="rol__blocks" data-v-65196a31${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(shownModules.value, (module) => {
									_push(`<section class="rol__block"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", module.label)} data-v-65196a31${_scopeId}><div class="rol__block-head" data-v-65196a31${_scopeId}><h3 class="rol__block-title" data-v-65196a31${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(module.label)}</h3>`);
									if (allEditable(module)) {
										_push(`<span class="rol__all" data-v-65196a31${_scopeId}><span aria-hidden="true" data-v-65196a31${_scopeId}>Alle</span>`);
										_push((0, server_renderer_exports.ssrRenderComponent)(RightBox_default, {
											label: `${role.value.label}: ${module.label} – alle Rechte`,
											allowed: (0, vue_exports.unref)(moduleState)(draft.value, module) === "all",
											mixed: (0, vue_exports.unref)(moduleState)(draft.value, module) === "some",
											editable: "",
											onChange: ($event) => moduleAll(module)
										}, null, _parent, _scopeId));
										_push(`</span>`);
									} else _push(`<!---->`);
									_push(`</div><ul class="rol__rows" data-v-65196a31${_scopeId}><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(module.actions, (action) => {
										_push(`<li class="rol__row" data-v-65196a31${_scopeId}><span data-v-65196a31${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(actionLabel(action))}</span>`);
										_push((0, server_renderer_exports.ssrRenderComponent)(RightBox_default, {
											label: `${role.value.label}: ${module.label} – ${actionLabel(action)}`,
											allowed: has((0, vue_exports.unref)(rightKey)(module.module, action)),
											editable: boxEditable((0, vue_exports.unref)(rightKey)(module.module, action)),
											onChange: ($event) => setRight((0, vue_exports.unref)(rightKey)(module.module, action), $event.target.checked)
										}, null, _parent, _scopeId));
										_push(`</li>`);
									});
									_push(`<!--]--></ul></section>`);
								});
								_push(`<!--]--></div>`);
							} else _push(`<!---->`);
							_push(`</section>`);
						} else _push(`<!---->`);
						_push(`</div>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
							open: confirmOpen.value,
							"onUpdate:open": ($event) => confirmOpen.value = $event,
							title: `Rechte für „${role.value?.label ?? ""}“ speichern?`,
							"content-class": "adm-dialog adm-dialog--narrow"
						}, {
							actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-65196a31${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="button" data-v-65196a31${_scopeId}>Speichern</button>`);
								else return [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									onClick: ($event) => confirmOpen.value = false
								}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--primary",
									type: "button",
									onClick: confirmSave
								}, "Speichern")];
							}),
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									if (saveDiff.value && role.value) _push((0, server_renderer_exports.ssrRenderComponent)(RoleDiffList_default, {
										diff: saveDiff.value,
										"role-label": role.value.label
									}, null, _parent, _scopeId));
									else _push(`<!---->`);
								} else return [saveDiff.value && role.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(RoleDiffList_default, {
									key: 0,
									diff: saveDiff.value,
									"role-label": role.value.label
								}, null, 8, ["diff", "role-label"])) : (0, vue_exports.createCommentVNode)("", true)];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
							open: copyOpen.value,
							"onUpdate:open": ($event) => copyOpen.value = $event,
							title: `Rechte für „${role.value?.label ?? ""}“ kopieren`,
							"content-class": "adm-dialog adm-dialog--narrow"
						}, {
							actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-65196a31${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", !copyDiff.value || copyDiff.value.gained.length + copyDiff.value.lost.length === 0 ? "true" : void 0)} data-v-65196a31${_scopeId}> Übernehmen </button>`);
								else return [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									onClick: ($event) => copyOpen.value = false
								}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--primary",
									type: "button",
									"aria-disabled": !copyDiff.value || copyDiff.value.gained.length + copyDiff.value.lost.length === 0 ? "true" : void 0,
									onClick: applyCopy
								}, " Übernehmen ", 8, ["aria-disabled"])];
							}),
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<div class="form-field rol__dialog-field" data-v-65196a31${_scopeId}><label class="form-field__label" for="rol-copy" data-v-65196a31${_scopeId}>Rechte übernehmen von</label><select id="rol-copy" class="input" data-v-65196a31${_scopeId}><option value="" disabled data-v-65196a31${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(copySource.value) ? (0, server_renderer_exports.ssrLooseContain)(copySource.value, "") : (0, server_renderer_exports.ssrLooseEqual)(copySource.value, "")) ? " selected" : ""}${_scopeId}>Rolle wählen</option><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(copyCandidates.value, (item) => {
										_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", item.id)} data-v-65196a31${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(copySource.value) ? (0, server_renderer_exports.ssrLooseContain)(copySource.value, item.id) : (0, server_renderer_exports.ssrLooseEqual)(copySource.value, item.id)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.label)}</option>`);
									});
									_push(`<!--]--></select></div>`);
									if (copyDiff.value && role.value) _push((0, server_renderer_exports.ssrRenderComponent)(RoleDiffList_default, {
										diff: copyDiff.value,
										"role-label": role.value.label
									}, null, _parent, _scopeId));
									else _push(`<!---->`);
									_push(`<p class="adm-note rol__dialog-note" data-v-65196a31${_scopeId}>Gespeichert wird erst mit Speichern in der Leiste unten.</p>`);
								} else return [
									(0, vue_exports.createVNode)("div", { class: "form-field rol__dialog-field" }, [(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "rol-copy"
									}, "Rechte übernehmen von"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "rol-copy",
										"onUpdate:modelValue": ($event) => copySource.value = $event,
										class: "input"
									}, [(0, vue_exports.createVNode)("option", {
										value: "",
										disabled: ""
									}, "Rolle wählen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(copyCandidates.value, (item) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
											key: item.id,
											value: item.id
										}, (0, vue_exports.toDisplayString)(item.label), 9, ["value"]);
									}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, copySource.value]])]),
									copyDiff.value && role.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(RoleDiffList_default, {
										key: 0,
										diff: copyDiff.value,
										"role-label": role.value.label
									}, null, 8, ["diff", "role-label"])) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)("p", { class: "adm-note rol__dialog-note" }, "Gespeichert wird erst mit Speichern in der Leiste unten.")
								];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
							open: previewOpen.value,
							"onUpdate:open": ($event) => previewOpen.value = $event,
							title: `Ansicht als „${role.value?.label ?? ""}“`,
							"content-class": "adm-dialog adm-dialog--narrow"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<p class="adm-note rol__dialog-field" data-v-65196a31${_scopeId}> So sieht die Navigation für diese Rolle aus – mit den gespeicherten Rechten. Seiten, die sie nicht öffnen darf, kommen darin nicht vor. </p>`);
									if (__props.navigation.length === 0) _push(`<p class="adm-note" data-v-65196a31${_scopeId}>Diese Rolle sieht keine Seite außer ihrem Profil.</p>`);
									else _push(`<!---->`);
									_push(`<!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(__props.navigation, (group) => {
										_push(`<div class="rol__nav-group" data-v-65196a31${_scopeId}><p class="rol__nav-label" data-v-65196a31${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(group.label)}</p><ul class="rol__nav-list" data-v-65196a31${_scopeId}><!--[-->`);
										(0, server_renderer_exports.ssrRenderList)(group.pages, (item) => {
											_push(`<li class="rol__nav-item" data-v-65196a31${_scopeId}>`);
											_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
												name: item.icon,
												size: 20
											}, null, _parent, _scopeId));
											_push(` ${(0, server_renderer_exports.ssrInterpolate)(item.label)}</li>`);
										});
										_push(`<!--]--></ul></div>`);
									});
									_push(`<!--]-->`);
								} else return [
									(0, vue_exports.createVNode)("p", { class: "adm-note rol__dialog-field" }, " So sieht die Navigation für diese Rolle aus – mit den gespeicherten Rechten. Seiten, die sie nicht öffnen darf, kommen darin nicht vor. "),
									__props.navigation.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 0,
										class: "adm-note"
									}, "Diese Rolle sieht keine Seite außer ihrem Profil.")) : (0, vue_exports.createCommentVNode)("", true),
									((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.navigation, (group) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
											key: group.key,
											class: "rol__nav-group"
										}, [(0, vue_exports.createVNode)("p", { class: "rol__nav-label" }, (0, vue_exports.toDisplayString)(group.label), 1), (0, vue_exports.createVNode)("ul", { class: "rol__nav-list" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(group.pages, (item) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
												key: item.href,
												class: "rol__nav-item"
											}, [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: item.icon,
												size: 20
											}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(item.label), 1)]);
										}), 128))])]);
									}), 128))
								];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
							open: createOpen.value,
							"onUpdate:open": ($event) => createOpen.value = $event,
							title: "Rolle anlegen",
							"content-class": "adm-dialog adm-dialog--narrow"
						}, {
							actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-65196a31${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="submit" form="rol-create"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", createBusy.value ? "true" : void 0)} data-v-65196a31${_scopeId}>Rolle anlegen</button>`);
								else return [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									onClick: ($event) => createOpen.value = false
								}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--primary",
									type: "submit",
									form: "rol-create",
									"aria-busy": createBusy.value ? "true" : void 0
								}, "Rolle anlegen", 8, ["aria-busy"])];
							}),
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<form id="rol-create" class="rol__form" novalidate data-v-65196a31${_scopeId}><div class="form-field" data-v-65196a31${_scopeId}><label class="form-field__label" for="rol-new-label" data-v-65196a31${_scopeId}>Bezeichnung</label><input id="rol-new-label"${(0, server_renderer_exports.ssrRenderAttr)("value", createForm.value.label)} class="input" type="text" maxlength="60" autocomplete="off" aria-required="true"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", dialogError("create", "label") ? "true" : void 0)} aria-describedby="rol-new-label-err" data-v-65196a31${_scopeId}><p id="rol-new-label-err" class="form-field__error" data-v-65196a31${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(dialogError("create", "label"))}</p></div><div class="form-field" data-v-65196a31${_scopeId}><label class="form-field__label" for="rol-new-desc" data-v-65196a31${_scopeId}>Beschreibung (optional)</label><input id="rol-new-desc"${(0, server_renderer_exports.ssrRenderAttr)("value", createForm.value.description)} class="input" type="text" maxlength="500" autocomplete="off" data-v-65196a31${_scopeId}><p class="form-field__help" data-v-65196a31${_scopeId}>Für wen die Rolle gedacht ist, zum Beispiel „Lager und Versand“.</p></div><div class="form-field" data-v-65196a31${_scopeId}><label class="form-field__label" for="rol-new-copy" data-v-65196a31${_scopeId}>Rechte übernehmen von</label><select id="rol-new-copy" class="input" data-v-65196a31${_scopeId}><option value="" data-v-65196a31${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(createForm.value.copyFrom) ? (0, server_renderer_exports.ssrLooseContain)(createForm.value.copyFrom, "") : (0, server_renderer_exports.ssrLooseEqual)(createForm.value.copyFrom, "")) ? " selected" : ""}${_scopeId}>Keine – leer anfangen</option><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(createSources.value, (item) => {
										_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", item.id)} data-v-65196a31${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(createForm.value.copyFrom) ? (0, server_renderer_exports.ssrLooseContain)(createForm.value.copyFrom, item.id) : (0, server_renderer_exports.ssrLooseEqual)(createForm.value.copyFrom, item.id)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.label)}</option>`);
									});
									_push(`<!--]--></select><p class="form-field__error" data-v-65196a31${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(dialogError("create", "copyFrom"))}</p></div></form>`);
								} else return [(0, vue_exports.createVNode)("form", {
									id: "rol-create",
									class: "rol__form",
									novalidate: "",
									onSubmit: (0, vue_exports.withModifiers)(submitCreate, ["prevent"])
								}, [
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "rol-new-label"
										}, "Bezeichnung"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											id: "rol-new-label",
											"onUpdate:modelValue": ($event) => createForm.value.label = $event,
											class: "input",
											type: "text",
											maxlength: "60",
											autocomplete: "off",
											"aria-required": "true",
											"aria-invalid": dialogError("create", "label") ? "true" : void 0,
											"aria-describedby": "rol-new-label-err"
										}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, createForm.value.label]]),
										(0, vue_exports.createVNode)("p", {
											id: "rol-new-label-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(dialogError("create", "label")), 1)
									]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "rol-new-desc"
										}, "Beschreibung (optional)"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											id: "rol-new-desc",
											"onUpdate:modelValue": ($event) => createForm.value.description = $event,
											class: "input",
											type: "text",
											maxlength: "500",
											autocomplete: "off"
										}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, createForm.value.description]]),
										(0, vue_exports.createVNode)("p", { class: "form-field__help" }, "Für wen die Rolle gedacht ist, zum Beispiel „Lager und Versand“.")
									]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "rol-new-copy"
										}, "Rechte übernehmen von"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
											id: "rol-new-copy",
											"onUpdate:modelValue": ($event) => createForm.value.copyFrom = $event,
											class: "input"
										}, [(0, vue_exports.createVNode)("option", { value: "" }, "Keine – leer anfangen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(createSources.value, (item) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
												key: item.id,
												value: item.id
											}, (0, vue_exports.toDisplayString)(item.label), 9, ["value"]);
										}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, createForm.value.copyFrom]]),
										(0, vue_exports.createVNode)("p", { class: "form-field__error" }, (0, vue_exports.toDisplayString)(dialogError("create", "copyFrom")), 1)
									])
								], 32)];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
							open: renameOpen.value,
							"onUpdate:open": ($event) => renameOpen.value = $event,
							title: role.value?.isSystem ? "Beschreibung ändern" : "Rolle umbenennen",
							"content-class": "adm-dialog adm-dialog--narrow"
						}, {
							actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-65196a31${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="submit" form="rol-rename"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", renameBusy.value ? "true" : void 0)} data-v-65196a31${_scopeId}>Speichern</button>`);
								else return [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									onClick: ($event) => renameOpen.value = false
								}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--primary",
									type: "submit",
									form: "rol-rename",
									"aria-busy": renameBusy.value ? "true" : void 0
								}, "Speichern", 8, ["aria-busy"])];
							}),
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<form id="rol-rename" class="rol__form" novalidate data-v-65196a31${_scopeId}>`);
									if (!role.value?.isSystem) _push(`<div class="form-field" data-v-65196a31${_scopeId}><label class="form-field__label" for="rol-edit-label" data-v-65196a31${_scopeId}>Bezeichnung</label><input id="rol-edit-label"${(0, server_renderer_exports.ssrRenderAttr)("value", renameForm.value.label)} class="input" type="text" maxlength="60" autocomplete="off" aria-required="true"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", dialogError("rename", "label") ? "true" : void 0)} aria-describedby="rol-edit-label-err" data-v-65196a31${_scopeId}><p id="rol-edit-label-err" class="form-field__error" data-v-65196a31${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(dialogError("rename", "label"))}</p></div>`);
									else _push(`<!---->`);
									_push(`<div class="form-field" data-v-65196a31${_scopeId}><label class="form-field__label" for="rol-edit-desc" data-v-65196a31${_scopeId}>Beschreibung (optional)</label><input id="rol-edit-desc"${(0, server_renderer_exports.ssrRenderAttr)("value", renameForm.value.description)} class="input" type="text" maxlength="500" autocomplete="off" data-v-65196a31${_scopeId}><p class="form-field__error" data-v-65196a31${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(dialogError("rename", "description"))}</p></div></form>`);
								} else return [(0, vue_exports.createVNode)("form", {
									id: "rol-rename",
									class: "rol__form",
									novalidate: "",
									onSubmit: (0, vue_exports.withModifiers)(submitRename, ["prevent"])
								}, [!role.value?.isSystem ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "form-field"
								}, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "rol-edit-label"
									}, "Bezeichnung"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "rol-edit-label",
										"onUpdate:modelValue": ($event) => renameForm.value.label = $event,
										class: "input",
										type: "text",
										maxlength: "60",
										autocomplete: "off",
										"aria-required": "true",
										"aria-invalid": dialogError("rename", "label") ? "true" : void 0,
										"aria-describedby": "rol-edit-label-err"
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, renameForm.value.label]]),
									(0, vue_exports.createVNode)("p", {
										id: "rol-edit-label-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(dialogError("rename", "label")), 1)
								])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "rol-edit-desc"
									}, "Beschreibung (optional)"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "rol-edit-desc",
										"onUpdate:modelValue": ($event) => renameForm.value.description = $event,
										class: "input",
										type: "text",
										maxlength: "500",
										autocomplete: "off"
									}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, renameForm.value.description]]),
									(0, vue_exports.createVNode)("p", { class: "form-field__error" }, (0, vue_exports.toDisplayString)(dialogError("rename", "description")), 1)
								])], 32)];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: deleteOpen.value,
							"onUpdate:open": ($event) => deleteOpen.value = $event,
							title: `Rolle „${role.value?.label ?? ""}“ löschen?`,
							body: "Kein Konto hat diese Rolle. Ihre Rechte gehen mit ihr verloren; das Protokoll behält, was sie hatte.",
							busy: deleteBusy.value,
							onConfirm: submitDelete
						}, null, _parent, _scopeId));
						if (editable.value) _push((0, server_renderer_exports.ssrRenderComponent)(AdminSaveBar_default, { editor: (0, vue_exports.unref)(editor) }, null, _parent, _scopeId));
						else _push(`<!---->`);
					} else return [
						(0, vue_exports.createVNode)("div", { class: "rol" }, [
							(0, vue_exports.createVNode)("nav", {
								class: "rol__list",
								"aria-label": "Rollen"
							}, [(0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.roles, (item) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: item.id }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
									href: `/admin/rollen?rolle=${item.id}`,
									class: "rol__role",
									"aria-current": item.id === __props.selected ? "page" : void 0,
									"preserve-scroll": ""
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("span", { class: "rol__role-name" }, (0, vue_exports.toDisplayString)(item.label), 1), (0, vue_exports.createVNode)("span", { class: "rol__role-meta" }, (0, vue_exports.toDisplayString)(accounts(item.users)), 1)]),
									_: 2
								}, 1032, ["href", "aria-current"])]);
							}), 128))])]),
							(0, vue_exports.createVNode)("div", { class: "form-field rol__pick" }, [(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "rol-pick"
							}, "Rolle"), (0, vue_exports.createVNode)("select", {
								id: "rol-pick",
								class: "input",
								value: __props.selected ?? "",
								onChange: pick,
								onKeydown: pickKey,
								onBlur: pickBlur
							}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.roles, (item) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
									key: item.id,
									value: item.id
								}, (0, vue_exports.toDisplayString)(item.label) + " (" + (0, vue_exports.toDisplayString)(accounts(item.users)) + ")", 9, ["value"]);
							}), 128))], 40, ["value"])]),
							role.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
								key: 0,
								class: "rol__editor",
								"aria-labelledby": "rol-title"
							}, [
								(0, vue_exports.createVNode)("header", { class: "rol__head" }, [(0, vue_exports.createVNode)("div", { class: "rol__titles" }, [(0, vue_exports.createVNode)("h2", {
									id: "rol-title",
									class: "adm-section__title"
								}, (0, vue_exports.toDisplayString)(role.value.label), 1), (0, vue_exports.createVNode)("p", { class: "adm-note" }, (0, vue_exports.toDisplayString)(role.value.description ?? "Ohne Beschreibung.") + " · " + (0, vue_exports.toDisplayString)(accounts(role.value.users)), 1)]), (0, vue_exports.createVNode)("div", { class: "rol__actions" }, [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									onClick: ($event) => previewOpen.value = true
								}, [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "eye",
									size: 16
								}), (0, vue_exports.createTextVNode)(" Ansicht als Rolle ")], 8, ["onClick"]), hasMenu.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuRoot_default), { key: 0 }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
										class: "adm-iconbtn rol__more",
										"aria-label": `Weitere Aktionen für ${role.value.label}`
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
											"side-offset": 8
										}, {
											default: (0, vue_exports.withCtx)(() => [
												menu.value.copy ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: 0,
													class: "adm-menu__item",
													onSelect: openCopy
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "imports",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Von Rolle kopieren ")]),
													_: 1
												})) : (0, vue_exports.createCommentVNode)("", true),
												menu.value.rename ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: 1,
													class: "adm-menu__item",
													onSelect: openRename
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "edit",
														size: 20
													}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(role.value.isSystem ? "Beschreibung ändern" : "Umbenennen"), 1)]),
													_: 1
												})) : (0, vue_exports.createCommentVNode)("", true),
												menu.value.duplicate ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: 2,
													class: "adm-menu__item",
													onSelect: duplicate
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "duplicate",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Duplizieren ")]),
													_: 1
												})) : (0, vue_exports.createCommentVNode)("", true),
												menu.value.remove ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item adm-menu__item--danger",
													onSelect: ($event) => deleteOpen.value = true
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "delete",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Löschen ")]),
													_: 1
												}, 8, ["onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true)
											]),
											_: 1
										})]),
										_: 1
									})]),
									_: 1
								})) : (0, vue_exports.createCommentVNode)("", true)])]),
								role.value.isSuperAdmin ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 0,
									class: "adm-note rol__note"
								}, "Super-Admin hat immer alle Rechte. Sie lassen sich nicht ändern.")) : role.value.raiseBlocked && editable.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 1,
									class: "adm-note rol__note"
								}, " Du hast diese Rolle selbst. Rechte kannst du ihr nehmen, aber nicht geben – das macht eine andere Person. ")) : (0, vue_exports.createCommentVNode)("", true),
								refusal.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 2,
									class: "adm-alert",
									role: "alert"
								}, (0, vue_exports.toDisplayString)(refusal.value), 1)) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("div", { class: "form-field rol__search" }, [(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rol-search"
								}, "Modul suchen"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "rol-search",
									"onUpdate:modelValue": ($event) => search.value = $event,
									class: "input",
									type: "search",
									autocomplete: "off"
								}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, search.value]])]),
								shownModules.value.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 3,
									class: "adm-note"
								}, "Kein Modul heißt so.")) : (0, vue_exports.createCommentVNode)("", true),
								shownModules.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 4,
									class: "rol__grid"
								}, [(0, vue_exports.createVNode)("table", { class: "rol__table" }, [
									(0, vue_exports.createVNode)("colgroup", null, [
										(0, vue_exports.createVNode)("col"),
										editable.value && !role.value.raiseBlocked ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("col", {
											key: 0,
											class: "rol__col"
										})) : (0, vue_exports.createCommentVNode)("", true),
										((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.actions, (action) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("col", {
												key: action.action,
												class: "rol__col"
											});
										}), 128))
									]),
									(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
										(0, vue_exports.createVNode)("th", { scope: "col" }, "Modul"),
										editable.value && !role.value.raiseBlocked ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("th", {
											key: 0,
											scope: "col",
											class: "rol__c"
										}, "Alle")) : (0, vue_exports.createCommentVNode)("", true),
										((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.actions, (action) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("th", {
												key: action.action,
												scope: "col",
												class: "rol__c"
											}, (0, vue_exports.toDisplayString)(action.label), 1);
										}), 128))
									])]),
									(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(shownModules.value, (module) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: module.module }, [
											(0, vue_exports.createVNode)("th", {
												scope: "row",
												class: "rol__module"
											}, (0, vue_exports.toDisplayString)(module.label), 1),
											editable.value && !role.value.raiseBlocked ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
												key: 0,
												class: "rol__c"
											}, [allEditable(module) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(RightBox_default, {
												key: 0,
												label: `${role.value.label}: ${module.label} – alle Rechte`,
												allowed: (0, vue_exports.unref)(moduleState)(draft.value, module) === "all",
												mixed: (0, vue_exports.unref)(moduleState)(draft.value, module) === "some",
												editable: "",
												onChange: ($event) => moduleAll(module)
											}, null, 8, [
												"label",
												"allowed",
												"mixed",
												"onChange"
											])) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true),
											((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.actions, (action) => {
												return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
													key: action.action,
													class: "rol__c"
												}, [module.actions.includes(action.action) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(RightBox_default, {
													key: 0,
													label: `${role.value.label}: ${module.label} – ${action.label}`,
													allowed: has((0, vue_exports.unref)(rightKey)(module.module, action.action)),
													editable: boxEditable((0, vue_exports.unref)(rightKey)(module.module, action.action)),
													onChange: ($event) => setRight((0, vue_exports.unref)(rightKey)(module.module, action.action), $event.target.checked)
												}, null, 8, [
													"label",
													"allowed",
													"editable",
													"onChange"
												])) : (0, vue_exports.createCommentVNode)("", true)]);
											}), 128))
										]);
									}), 128))])
								])])) : (0, vue_exports.createCommentVNode)("", true),
								shownModules.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 5,
									class: "rol__blocks"
								}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(shownModules.value, (module) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
										key: module.module,
										class: "rol__block",
										"aria-label": module.label
									}, [(0, vue_exports.createVNode)("div", { class: "rol__block-head" }, [(0, vue_exports.createVNode)("h3", { class: "rol__block-title" }, (0, vue_exports.toDisplayString)(module.label), 1), allEditable(module) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "rol__all"
									}, [(0, vue_exports.createVNode)("span", { "aria-hidden": "true" }, "Alle"), (0, vue_exports.createVNode)(RightBox_default, {
										label: `${role.value.label}: ${module.label} – alle Rechte`,
										allowed: (0, vue_exports.unref)(moduleState)(draft.value, module) === "all",
										mixed: (0, vue_exports.unref)(moduleState)(draft.value, module) === "some",
										editable: "",
										onChange: ($event) => moduleAll(module)
									}, null, 8, [
										"label",
										"allowed",
										"mixed",
										"onChange"
									])])) : (0, vue_exports.createCommentVNode)("", true)]), (0, vue_exports.createVNode)("ul", { class: "rol__rows" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(module.actions, (action) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
											key: action,
											class: "rol__row"
										}, [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(actionLabel(action)), 1), (0, vue_exports.createVNode)(RightBox_default, {
											label: `${role.value.label}: ${module.label} – ${actionLabel(action)}`,
											allowed: has((0, vue_exports.unref)(rightKey)(module.module, action)),
											editable: boxEditable((0, vue_exports.unref)(rightKey)(module.module, action)),
											onChange: ($event) => setRight((0, vue_exports.unref)(rightKey)(module.module, action), $event.target.checked)
										}, null, 8, [
											"label",
											"allowed",
											"editable",
											"onChange"
										])]);
									}), 128))])], 8, ["aria-label"]);
								}), 128))])) : (0, vue_exports.createCommentVNode)("", true)
							])) : (0, vue_exports.createCommentVNode)("", true)
						]),
						(0, vue_exports.createVNode)(Dialog_default, {
							open: confirmOpen.value,
							"onUpdate:open": ($event) => confirmOpen.value = $event,
							title: `Rechte für „${role.value?.label ?? ""}“ speichern?`,
							"content-class": "adm-dialog adm-dialog--narrow"
						}, {
							actions: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "button",
								onClick: ($event) => confirmOpen.value = false
							}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "button",
								onClick: confirmSave
							}, "Speichern")]),
							default: (0, vue_exports.withCtx)(() => [saveDiff.value && role.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(RoleDiffList_default, {
								key: 0,
								diff: saveDiff.value,
								"role-label": role.value.label
							}, null, 8, ["diff", "role-label"])) : (0, vue_exports.createCommentVNode)("", true)]),
							_: 1
						}, 8, [
							"open",
							"onUpdate:open",
							"title"
						]),
						(0, vue_exports.createVNode)(Dialog_default, {
							open: copyOpen.value,
							"onUpdate:open": ($event) => copyOpen.value = $event,
							title: `Rechte für „${role.value?.label ?? ""}“ kopieren`,
							"content-class": "adm-dialog adm-dialog--narrow"
						}, {
							actions: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "button",
								onClick: ($event) => copyOpen.value = false
							}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "button",
								"aria-disabled": !copyDiff.value || copyDiff.value.gained.length + copyDiff.value.lost.length === 0 ? "true" : void 0,
								onClick: applyCopy
							}, " Übernehmen ", 8, ["aria-disabled"])]),
							default: (0, vue_exports.withCtx)(() => [
								(0, vue_exports.createVNode)("div", { class: "form-field rol__dialog-field" }, [(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rol-copy"
								}, "Rechte übernehmen von"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "rol-copy",
									"onUpdate:modelValue": ($event) => copySource.value = $event,
									class: "input"
								}, [(0, vue_exports.createVNode)("option", {
									value: "",
									disabled: ""
								}, "Rolle wählen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(copyCandidates.value, (item) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
										key: item.id,
										value: item.id
									}, (0, vue_exports.toDisplayString)(item.label), 9, ["value"]);
								}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, copySource.value]])]),
								copyDiff.value && role.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(RoleDiffList_default, {
									key: 0,
									diff: copyDiff.value,
									"role-label": role.value.label
								}, null, 8, ["diff", "role-label"])) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("p", { class: "adm-note rol__dialog-note" }, "Gespeichert wird erst mit Speichern in der Leiste unten.")
							]),
							_: 1
						}, 8, [
							"open",
							"onUpdate:open",
							"title"
						]),
						(0, vue_exports.createVNode)(Dialog_default, {
							open: previewOpen.value,
							"onUpdate:open": ($event) => previewOpen.value = $event,
							title: `Ansicht als „${role.value?.label ?? ""}“`,
							"content-class": "adm-dialog adm-dialog--narrow"
						}, {
							default: (0, vue_exports.withCtx)(() => [
								(0, vue_exports.createVNode)("p", { class: "adm-note rol__dialog-field" }, " So sieht die Navigation für diese Rolle aus – mit den gespeicherten Rechten. Seiten, die sie nicht öffnen darf, kommen darin nicht vor. "),
								__props.navigation.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 0,
									class: "adm-note"
								}, "Diese Rolle sieht keine Seite außer ihrem Profil.")) : (0, vue_exports.createCommentVNode)("", true),
								((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.navigation, (group) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: group.key,
										class: "rol__nav-group"
									}, [(0, vue_exports.createVNode)("p", { class: "rol__nav-label" }, (0, vue_exports.toDisplayString)(group.label), 1), (0, vue_exports.createVNode)("ul", { class: "rol__nav-list" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(group.pages, (item) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
											key: item.href,
											class: "rol__nav-item"
										}, [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: item.icon,
											size: 20
										}, null, 8, ["name"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(item.label), 1)]);
									}), 128))])]);
								}), 128))
							]),
							_: 1
						}, 8, [
							"open",
							"onUpdate:open",
							"title"
						]),
						(0, vue_exports.createVNode)(Dialog_default, {
							open: createOpen.value,
							"onUpdate:open": ($event) => createOpen.value = $event,
							title: "Rolle anlegen",
							"content-class": "adm-dialog adm-dialog--narrow"
						}, {
							actions: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "button",
								onClick: ($event) => createOpen.value = false
							}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "submit",
								form: "rol-create",
								"aria-busy": createBusy.value ? "true" : void 0
							}, "Rolle anlegen", 8, ["aria-busy"])]),
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("form", {
								id: "rol-create",
								class: "rol__form",
								novalidate: "",
								onSubmit: (0, vue_exports.withModifiers)(submitCreate, ["prevent"])
							}, [
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "rol-new-label"
									}, "Bezeichnung"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "rol-new-label",
										"onUpdate:modelValue": ($event) => createForm.value.label = $event,
										class: "input",
										type: "text",
										maxlength: "60",
										autocomplete: "off",
										"aria-required": "true",
										"aria-invalid": dialogError("create", "label") ? "true" : void 0,
										"aria-describedby": "rol-new-label-err"
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, createForm.value.label]]),
									(0, vue_exports.createVNode)("p", {
										id: "rol-new-label-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(dialogError("create", "label")), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "rol-new-desc"
									}, "Beschreibung (optional)"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "rol-new-desc",
										"onUpdate:modelValue": ($event) => createForm.value.description = $event,
										class: "input",
										type: "text",
										maxlength: "500",
										autocomplete: "off"
									}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, createForm.value.description]]),
									(0, vue_exports.createVNode)("p", { class: "form-field__help" }, "Für wen die Rolle gedacht ist, zum Beispiel „Lager und Versand“.")
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "rol-new-copy"
									}, "Rechte übernehmen von"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "rol-new-copy",
										"onUpdate:modelValue": ($event) => createForm.value.copyFrom = $event,
										class: "input"
									}, [(0, vue_exports.createVNode)("option", { value: "" }, "Keine – leer anfangen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(createSources.value, (item) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
											key: item.id,
											value: item.id
										}, (0, vue_exports.toDisplayString)(item.label), 9, ["value"]);
									}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, createForm.value.copyFrom]]),
									(0, vue_exports.createVNode)("p", { class: "form-field__error" }, (0, vue_exports.toDisplayString)(dialogError("create", "copyFrom")), 1)
								])
							], 32)]),
							_: 1
						}, 8, ["open", "onUpdate:open"]),
						(0, vue_exports.createVNode)(Dialog_default, {
							open: renameOpen.value,
							"onUpdate:open": ($event) => renameOpen.value = $event,
							title: role.value?.isSystem ? "Beschreibung ändern" : "Rolle umbenennen",
							"content-class": "adm-dialog adm-dialog--narrow"
						}, {
							actions: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "button",
								onClick: ($event) => renameOpen.value = false
							}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "submit",
								form: "rol-rename",
								"aria-busy": renameBusy.value ? "true" : void 0
							}, "Speichern", 8, ["aria-busy"])]),
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("form", {
								id: "rol-rename",
								class: "rol__form",
								novalidate: "",
								onSubmit: (0, vue_exports.withModifiers)(submitRename, ["prevent"])
							}, [!role.value?.isSystem ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 0,
								class: "form-field"
							}, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rol-edit-label"
								}, "Bezeichnung"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "rol-edit-label",
									"onUpdate:modelValue": ($event) => renameForm.value.label = $event,
									class: "input",
									type: "text",
									maxlength: "60",
									autocomplete: "off",
									"aria-required": "true",
									"aria-invalid": dialogError("rename", "label") ? "true" : void 0,
									"aria-describedby": "rol-edit-label-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, renameForm.value.label]]),
								(0, vue_exports.createVNode)("p", {
									id: "rol-edit-label-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(dialogError("rename", "label")), 1)
							])) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rol-edit-desc"
								}, "Beschreibung (optional)"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "rol-edit-desc",
									"onUpdate:modelValue": ($event) => renameForm.value.description = $event,
									class: "input",
									type: "text",
									maxlength: "500",
									autocomplete: "off"
								}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, renameForm.value.description]]),
								(0, vue_exports.createVNode)("p", { class: "form-field__error" }, (0, vue_exports.toDisplayString)(dialogError("rename", "description")), 1)
							])], 32)]),
							_: 1
						}, 8, [
							"open",
							"onUpdate:open",
							"title"
						]),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: deleteOpen.value,
							"onUpdate:open": ($event) => deleteOpen.value = $event,
							title: `Rolle „${role.value?.label ?? ""}“ löschen?`,
							body: "Kein Konto hat diese Rolle. Ihre Rechte gehen mit ihr verloren; das Protokoll behält, was sie hatte.",
							busy: deleteBusy.value,
							onConfirm: submitDelete
						}, null, 8, [
							"open",
							"onUpdate:open",
							"title",
							"busy"
						]),
						editable.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminSaveBar_default, {
							key: 0,
							editor: (0, vue_exports.unref)(editor)
						}, null, 8, ["editor"])) : (0, vue_exports.createCommentVNode)("", true)
					];
				}),
				_: 2
			}, [__props.can.create ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--primary" type="button" data-v-65196a31${_scopeId}>Rolle anlegen</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						onClick: openCreate
					}, "Rolle anlegen")];
				}),
				key: "0"
			} : void 0]), _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Rollen/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Rollen/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-65196a31"]]);
//#endregion
export { Index_default as default };
