import { t as Dialog_default } from "./Dialog-C-07FMpe.js";
import { a as DropdownMenuRoot_default, i as DropdownMenuContent_default, n as DropdownMenuPortal_default, r as DropdownMenuItem_default, t as DropdownMenuTrigger_default } from "./DropdownMenuTrigger-DR2ieCu7.js";
import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BmBly3wt.js";
import { t as DropdownMenuSeparator_default } from "./DropdownMenuSeparator-KcmMgHOf.js";
import { c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-D5rHGI5v.js";
import { t as AdminConfirm_default } from "./AdminConfirm-CJZtnwyX.js";
import { n as decimal } from "./format-DGFu8Y3r.js";
import { t as AdminState_default } from "./AdminState-D6cOAUjW.js";
import { t as useOpenOnArrival } from "./useOpenOnArrival-BhtmDuub.js";
//#region resources/js/Pages/Admin/Benutzer/benutzer.ts
/**
* The sentences Team › Benutzer builds from its data, kept out of the component so each one is
* tested on its own: the context line under the title, and what each account action does.
*
* Counts go through format.ts (R-10). Names are the server's; nothing here invents a figure.
*/
function count(n, one, many) {
	return `${decimal(n, 0)} ${n === 1 ? one : many}`;
}
/** `7 Konten · 1 Einladung offen · 1 gesperrt` — only the parts that are not zero, accounts always. */
function contextLine(accounts, invitations) {
	const open = invitations.filter((i) => !i.expired).length;
	const expired = invitations.length - open;
	const suspended = accounts.filter((a) => a.status === "suspended").length;
	const parts = [count(accounts.length, "Konto", "Konten")];
	if (open > 0) parts.push(`${count(open, "Einladung", "Einladungen")} offen`);
	if (expired > 0) parts.push(`${count(expired, "Einladung", "Einladungen")} abgelaufen`);
	if (suspended > 0) parts.push(`${decimal(suspended, 0)} gesperrt`);
	return parts.join(" · ");
}
/** The confirmation's title, naming the person. */
function actionTitle(action, account) {
	switch (action) {
		case "suspend": return `${account.name} sperren?`;
		case "reactivate": return `${account.name} entsperren?`;
		case "signout": return `${account.name} überall abmelden?`;
	}
}
/** What happens, in one or two sentences — the consequence, not a restatement of the button. */
function actionBody(action, account) {
	switch (action) {
		case "suspend": return `${account.name} wird auf allen Geräten abgemeldet und kann sich nicht mehr anmelden, bis jemand das Konto entsperrt. Das Konto und seine Einträge im Protokoll bleiben erhalten.`;
		case "reactivate": return account.role === null ? `${account.name} kann sich danach wieder mit dem bisherigen Passwort anmelden. Das Konto hat keine Rolle.` : `${account.name} kann sich danach wieder mit dem bisherigen Passwort anmelden, in der Rolle ${account.role}.`;
		case "signout": return `${account.name} wird auf allen Geräten abgemeldet und muss sich neu anmelden. Das Konto bleibt aktiv.`;
	}
}
/** The confirming button's label. */
function actionLabel(action) {
	return {
		suspend: "Sperren",
		reactivate: "Entsperren",
		signout: "Überall abmelden"
	}[action];
}
/** Where each action posts. */
function actionUrl(action, account) {
	const path = {
		suspend: "sperren",
		reactivate: "entsperren",
		signout: "abmelden"
	}[action];
	return `/admin/benutzer/${account.id}/${path}`;
}
//#endregion
//#region resources/js/Pages/Admin/Benutzer/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		accounts: {},
		invitations: {},
		assignableRoles: {},
		can: {}
	},
	setup(__props) {
		/**
		* Team › Benutzer — who can sign in to the admin, in which role, and who has been invited.
		*
		* One primary action, *Person einladen*. Everything done to an account sits behind its row's
		* more-menu: *Rolle ändern…*, *Überall abmelden*, and *Sperren* or *Entsperren*, each confirmed with
		* what it does. Your own row has no menu, and neither has a row whose account holds a right you
		* lack — the server refuses both regardless (R-11); the page only stops offering them.
		*
		* An account is never deleted here. The role select offers only the roles this viewer may hand
		* out, so the refusal the server would give is never the first thing somebody meets.
		*/
		const props = __props;
		const page = usePage();
		/** Which request the server's messages belong to: each form only shows what it sent itself. */
		const sender = (0, vue_exports.ref)(null);
		const busy = (0, vue_exports.ref)(false);
		const bag = (0, vue_exports.computed)(() => {
			const raw = page.props.errors;
			return raw !== null && typeof raw === "object" ? raw : {};
		});
		const inviteErrors = (0, vue_exports.computed)(() => sender.value === "invite" ? bag.value : {});
		const roleErrors = (0, vue_exports.computed)(() => sender.value === "role" ? bag.value : {});
		/** A refusal about a row, said once above the lists and read before the retry. */
		const alert = (0, vue_exports.computed)(() => {
			if (sender.value === "account") return bag.value.account ?? "";
			return sender.value === "invitation" ? bag.value.invitation ?? "" : "";
		});
		const context = (0, vue_exports.computed)(() => contextLine(props.accounts, props.invitations));
		/** Under an invitation's name: the address (when a name stands above it) and who invited. */
		function invitationSub(invitation) {
			return [invitation.name ? invitation.email : null, invitation.invitedBy ? `eingeladen von ${invitation.invitedBy}` : null].filter(Boolean).join(" · ");
		}
		const readOnly = (0, vue_exports.computed)(() => !props.can.invite && !props.can.manage);
		const hasRowActions = (0, vue_exports.computed)(() => props.can.manage && props.accounts.some((a) => a.manageable));
		const inviting = (0, vue_exports.ref)(false);
		const invite = (0, vue_exports.reactive)({
			name: "",
			email: "",
			role_id: ""
		});
		function openInvite() {
			Object.assign(invite, {
				name: "",
				email: "",
				role_id: props.assignableRoles.length === 1 ? props.assignableRoles[0].id : ""
			});
			sender.value = null;
			inviting.value = true;
		}
		useOpenOnArrival("einladen", openInvite, () => props.can.invite);
		function sendInvite() {
			if (busy.value) return;
			sender.value = "invite";
			busy.value = true;
			router.post("/admin/benutzer/einladungen", { ...invite }, {
				preserveScroll: true,
				onSuccess: () => {
					inviting.value = false;
				},
				onFinish: () => {
					busy.value = false;
				}
			});
		}
		const reroling = (0, vue_exports.ref)(null);
		const roleChoice = (0, vue_exports.ref)("");
		const roleOpen = (0, vue_exports.computed)({
			get: () => reroling.value !== null,
			set: (open) => {
				if (!open) reroling.value = null;
			}
		});
		const roleUnchanged = (0, vue_exports.computed)(() => reroling.value !== null && roleChoice.value === reroling.value.roleId);
		function openRole(account) {
			sender.value = null;
			roleChoice.value = account.roleId ?? "";
			reroling.value = account;
		}
		function saveRole() {
			const account = reroling.value;
			if (account === null || busy.value || roleUnchanged.value) return;
			sender.value = "role";
			busy.value = true;
			router.patch(`/admin/benutzer/${account.id}/rolle`, { role_id: roleChoice.value }, {
				preserveScroll: true,
				onSuccess: () => {
					reroling.value = null;
				},
				onFinish: () => {
					busy.value = false;
				}
			});
		}
		const asking = (0, vue_exports.ref)(null);
		const askOpen = (0, vue_exports.computed)({
			get: () => asking.value !== null,
			set: (open) => {
				if (!open) asking.value = null;
			}
		});
		function ask(action, account) {
			sender.value = null;
			asking.value = {
				action,
				account
			};
		}
		function runAction() {
			const current = asking.value;
			if (current === null || busy.value) return;
			sender.value = "account";
			busy.value = true;
			router.post(actionUrl(current.action, current.account), {}, {
				preserveScroll: true,
				onFinish: () => {
					busy.value = false;
					asking.value = null;
				}
			});
		}
		const sending = (0, vue_exports.ref)(null);
		const withdrawing = (0, vue_exports.ref)(null);
		const withdrawOpen = (0, vue_exports.computed)({
			get: () => withdrawing.value !== null,
			set: (open) => {
				if (!open) withdrawing.value = null;
			}
		});
		function resend(invitation) {
			if (sending.value !== null) return;
			sender.value = "invitation";
			sending.value = invitation.id;
			router.post(`/admin/benutzer/einladungen/${invitation.id}/erneut`, {}, {
				preserveScroll: true,
				onFinish: () => {
					sending.value = null;
				}
			});
		}
		function withdraw() {
			const invitation = withdrawing.value;
			if (invitation === null || busy.value) return;
			sender.value = "invitation";
			busy.value = true;
			router.delete(`/admin/benutzer/einladungen/${invitation.id}`, {
				preserveScroll: true,
				onFinish: () => {
					busy.value = false;
					withdrawing.value = null;
				}
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Benutzer",
				context: context.value,
				"read-only": readOnly.value
			}, _attrs), (0, vue_exports.createSlots)({
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (alert.value) _push(`<p class="adm-alert" role="alert" data-v-27ddb3ba${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(alert.value)}</p>`);
						else _push(`<!---->`);
						if (__props.accounts.length > 0 || __props.invitations.length > 0) {
							_push(`<div class="adm-panel" data-v-27ddb3ba${_scopeId}><table class="adm-table" data-v-27ddb3ba${_scopeId}><thead data-v-27ddb3ba${_scopeId}><tr data-v-27ddb3ba${_scopeId}><th scope="col" data-v-27ddb3ba${_scopeId}>Name</th><th scope="col" data-v-27ddb3ba${_scopeId}>Rolle</th><th scope="col" data-v-27ddb3ba${_scopeId}>Letzte Anmeldung</th><th scope="col" data-v-27ddb3ba${_scopeId}>Zwei-Faktor</th>`);
							if (hasRowActions.value || __props.can.invite) _push(`<th scope="col" data-v-27ddb3ba${_scopeId}><span class="visually-hidden" data-v-27ddb3ba${_scopeId}>Aktionen</span></th>`);
							else _push(`<!---->`);
							_push(`</tr></thead><tbody data-v-27ddb3ba${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.accounts, (account) => {
								_push(`<tr data-v-27ddb3ba${_scopeId}><td data-label="Name" data-v-27ddb3ba${_scopeId}><span class="adm-table__key bn__name" data-v-27ddb3ba${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(account.name)}`);
								if (account.isSelf) _push(`<span class="bn__you" data-v-27ddb3ba${_scopeId}> (du)</span>`);
								else _push(`<!---->`);
								if (account.status === "suspended") _push(`<span class="adm-tag adm-tag--bad" data-v-27ddb3ba${_scopeId}>Gesperrt</span>`);
								else if (account.status === "invited") _push(`<span class="adm-tag adm-tag--neutral" data-v-27ddb3ba${_scopeId}>Eingeladen</span>`);
								else _push(`<!---->`);
								_push(`</span><span class="adm-table__sub" data-v-27ddb3ba${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(account.email)}</span></td><td data-label="Rolle" data-v-27ddb3ba${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(account.role ?? "Keine Rolle")}</td><td data-label="Letzte Anmeldung" class="bn__num" data-v-27ddb3ba${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(account.lastLogin ?? "Noch nie")}</td><td data-label="Zwei-Faktor" data-phone="hide" data-v-27ddb3ba${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(account.twoFactor ? "Ja" : "Nein")}</td>`);
								if (hasRowActions.value || __props.can.invite) {
									_push(`<td data-label="Aktionen" data-phone="menu" class="bn__actions" data-v-27ddb3ba${_scopeId}>`);
									if (account.manageable) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) {
												_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
													class: "adm-iconbtn",
													"aria-label": `Aktionen für ${account.name}`
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
																	_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item",
																		onSelect: ($event) => openRole(account)
																	}, {
																		default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																			if (_push) {
																				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																					name: "shield",
																					size: 20
																				}, null, _parent, _scopeId));
																				_push(` Rolle ändern… `);
																			} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																				name: "shield",
																				size: 20
																			}), (0, vue_exports.createTextVNode)(" Rolle ändern… ")];
																		}),
																		_: 2
																	}, _parent, _scopeId));
																	if (account.status !== "suspended") _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item",
																		onSelect: ($event) => ask("signout", account)
																	}, {
																		default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																			if (_push) {
																				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																					name: "logout",
																					size: 20
																				}, null, _parent, _scopeId));
																				_push(` Überall abmelden `);
																			} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																				name: "logout",
																				size: 20
																			}), (0, vue_exports.createTextVNode)(" Überall abmelden ")];
																		}),
																		_: 2
																	}, _parent, _scopeId));
																	else _push(`<!---->`);
																	_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }, null, _parent, _scopeId));
																	if (account.status === "suspended") _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item",
																		onSelect: ($event) => ask("reactivate", account)
																	}, {
																		default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																			if (_push) {
																				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																					name: "check",
																					size: 20
																				}, null, _parent, _scopeId));
																				_push(` Entsperren `);
																			} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																				name: "check",
																				size: 20
																			}), (0, vue_exports.createTextVNode)(" Entsperren ")];
																		}),
																		_: 2
																	}, _parent, _scopeId));
																	else _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item adm-menu__item--danger",
																		onSelect: ($event) => ask("suspend", account)
																	}, {
																		default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																			if (_push) {
																				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																					name: "lock",
																					size: 20
																				}, null, _parent, _scopeId));
																				_push(` Sperren `);
																			} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																				name: "lock",
																				size: 20
																			}), (0, vue_exports.createTextVNode)(" Sperren ")];
																		}),
																		_: 2
																	}, _parent, _scopeId));
																} else return [
																	(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item",
																		onSelect: ($event) => openRole(account)
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "shield",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" Rolle ändern… ")]),
																		_: 1
																	}, 8, ["onSelect"]),
																	account.status !== "suspended" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		key: 0,
																		class: "adm-menu__item",
																		onSelect: ($event) => ask("signout", account)
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "logout",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" Überall abmelden ")]),
																		_: 1
																	}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
																	(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
																	account.status === "suspended" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		key: 1,
																		class: "adm-menu__item",
																		onSelect: ($event) => ask("reactivate", account)
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "check",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" Entsperren ")]),
																		_: 1
																	}, 8, ["onSelect"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		key: 2,
																		class: "adm-menu__item adm-menu__item--danger",
																		onSelect: ($event) => ask("suspend", account)
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "lock",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" Sperren ")]),
																		_: 1
																	}, 8, ["onSelect"]))
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
																(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	class: "adm-menu__item",
																	onSelect: ($event) => openRole(account)
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "shield",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Rolle ändern… ")]),
																	_: 1
																}, 8, ["onSelect"]),
																account.status !== "suspended" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	key: 0,
																	class: "adm-menu__item",
																	onSelect: ($event) => ask("signout", account)
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "logout",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Überall abmelden ")]),
																	_: 1
																}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
																(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
																account.status === "suspended" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	key: 1,
																	class: "adm-menu__item",
																	onSelect: ($event) => ask("reactivate", account)
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "check",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Entsperren ")]),
																	_: 1
																}, 8, ["onSelect"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	key: 2,
																	class: "adm-menu__item adm-menu__item--danger",
																	onSelect: ($event) => ask("suspend", account)
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "lock",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Sperren ")]),
																	_: 1
																}, 8, ["onSelect"]))
															]),
															_: 2
														}, 1024)];
													}),
													_: 2
												}, _parent, _scopeId));
											} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
												class: "adm-iconbtn",
												"aria-label": `Aktionen für ${account.name}`
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
														(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
															class: "adm-menu__item",
															onSelect: ($event) => openRole(account)
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "shield",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Rolle ändern… ")]),
															_: 1
														}, 8, ["onSelect"]),
														account.status !== "suspended" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
															key: 0,
															class: "adm-menu__item",
															onSelect: ($event) => ask("signout", account)
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "logout",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Überall abmelden ")]),
															_: 1
														}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
														(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
														account.status === "suspended" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
															key: 1,
															class: "adm-menu__item",
															onSelect: ($event) => ask("reactivate", account)
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "check",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Entsperren ")]),
															_: 1
														}, 8, ["onSelect"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
															key: 2,
															class: "adm-menu__item adm-menu__item--danger",
															onSelect: ($event) => ask("suspend", account)
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "lock",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Sperren ")]),
															_: 1
														}, 8, ["onSelect"]))
													]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024)];
										}),
										_: 2
									}, _parent, _scopeId));
									else _push(`<!---->`);
									_push(`</td>`);
								} else _push(`<!---->`);
								_push(`</tr>`);
							});
							_push(`<!--]--><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.invitations, (invitation) => {
								_push(`<tr data-v-27ddb3ba${_scopeId}><td data-label="Name" data-v-27ddb3ba${_scopeId}><span class="adm-table__key bn__name" data-v-27ddb3ba${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(invitation.name || invitation.email)} <span class="adm-tag adm-tag--neutral" data-v-27ddb3ba${_scopeId}>Eingeladen</span></span>`);
								if (invitationSub(invitation)) _push(`<span class="adm-table__sub" data-v-27ddb3ba${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(invitationSub(invitation))}</span>`);
								else _push(`<!---->`);
								_push(`</td><td data-label="Rolle" data-v-27ddb3ba${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(invitation.role ?? "Keine Rolle")}</td><td data-label="Letzte Anmeldung" class="bn__num" data-v-27ddb3ba${_scopeId}>`);
								if (invitation.expired) _push(`<span class="adm-tag adm-tag--warn" data-v-27ddb3ba${_scopeId}>Link abgelaufen</span>`);
								else _push(`<!--[-->Link gültig bis ${(0, server_renderer_exports.ssrInterpolate)(invitation.expiresAt)}<!--]-->`);
								_push(`</td><td data-label="Zwei-Faktor" data-phone="hide" data-v-27ddb3ba${_scopeId}>–</td>`);
								if (hasRowActions.value || __props.can.invite) {
									_push(`<td data-label="Aktionen" data-phone="menu" class="bn__actions" data-v-27ddb3ba${_scopeId}>`);
									if (__props.can.invite) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) {
												_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
													class: "adm-iconbtn",
													"aria-label": `Aktionen für die Einladung an ${invitation.email}`
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
																	_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item",
																		disabled: sending.value !== null,
																		onSelect: ($event) => resend(invitation)
																	}, {
																		default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																			if (_push) {
																				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																					name: "emails",
																					size: 20
																				}, null, _parent, _scopeId));
																				_push(` ${(0, server_renderer_exports.ssrInterpolate)(sending.value === invitation.id ? "Wird gesendet …" : "Erneut senden")}`);
																			} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																				name: "emails",
																				size: 20
																			}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(sending.value === invitation.id ? "Wird gesendet …" : "Erneut senden"), 1)];
																		}),
																		_: 2
																	}, _parent, _scopeId));
																	_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }, null, _parent, _scopeId));
																	_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item adm-menu__item--danger",
																		onSelect: ($event) => withdrawing.value = invitation
																	}, {
																		default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																			if (_push) {
																				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																					name: "close",
																					size: 20
																				}, null, _parent, _scopeId));
																				_push(` Widerrufen `);
																			} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																				name: "close",
																				size: 20
																			}), (0, vue_exports.createTextVNode)(" Widerrufen ")];
																		}),
																		_: 2
																	}, _parent, _scopeId));
																} else return [
																	(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item",
																		disabled: sending.value !== null,
																		onSelect: ($event) => resend(invitation)
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "emails",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(sending.value === invitation.id ? "Wird gesendet …" : "Erneut senden"), 1)]),
																		_: 2
																	}, 1032, ["disabled", "onSelect"]),
																	(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
																	(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																		class: "adm-menu__item adm-menu__item--danger",
																		onSelect: ($event) => withdrawing.value = invitation
																	}, {
																		default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																			name: "close",
																			size: 20
																		}), (0, vue_exports.createTextVNode)(" Widerrufen ")]),
																		_: 1
																	}, 8, ["onSelect"])
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
																(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	class: "adm-menu__item",
																	disabled: sending.value !== null,
																	onSelect: ($event) => resend(invitation)
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "emails",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(sending.value === invitation.id ? "Wird gesendet …" : "Erneut senden"), 1)]),
																	_: 2
																}, 1032, ["disabled", "onSelect"]),
																(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
																(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
																	class: "adm-menu__item adm-menu__item--danger",
																	onSelect: ($event) => withdrawing.value = invitation
																}, {
																	default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "close",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Widerrufen ")]),
																	_: 1
																}, 8, ["onSelect"])
															]),
															_: 2
														}, 1024)];
													}),
													_: 2
												}, _parent, _scopeId));
											} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
												class: "adm-iconbtn",
												"aria-label": `Aktionen für die Einladung an ${invitation.email}`
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
														(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
															class: "adm-menu__item",
															disabled: sending.value !== null,
															onSelect: ($event) => resend(invitation)
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "emails",
																size: 20
															}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(sending.value === invitation.id ? "Wird gesendet …" : "Erneut senden"), 1)]),
															_: 2
														}, 1032, ["disabled", "onSelect"]),
														(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
														(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
															class: "adm-menu__item adm-menu__item--danger",
															onSelect: ($event) => withdrawing.value = invitation
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "close",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Widerrufen ")]),
															_: 1
														}, 8, ["onSelect"])
													]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024)];
										}),
										_: 2
									}, _parent, _scopeId));
									else _push(`<!---->`);
									_push(`</td>`);
								} else _push(`<!---->`);
								_push(`</tr>`);
							});
							_push(`<!--]--></tbody></table></div>`);
						} else _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Noch kein Konto und keine Einladung. Wer eingeladen wird, erscheint hier und bekommt ein Konto, sobald die Einladung angenommen ist."
						}, null, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
							open: inviting.value,
							"onUpdate:open": ($event) => inviting.value = $event,
							title: "Person einladen",
							"content-class": "adm-dialog"
						}, {
							actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-27ddb3ba${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="submit" form="bn-invite"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-27ddb3ba${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(busy.value ? "Wird gesendet …" : "Einladung senden")}</button>`);
								else return [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									onClick: ($event) => inviting.value = false
								}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--primary",
									type: "submit",
									form: "bn-invite",
									"aria-busy": busy.value ? "true" : void 0,
									disabled: busy.value
								}, (0, vue_exports.toDisplayString)(busy.value ? "Wird gesendet …" : "Einladung senden"), 9, ["aria-busy", "disabled"])];
							}),
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<form id="bn-invite" class="adm-fields" novalidate data-v-27ddb3ba${_scopeId}><p class="adm-note" data-v-27ddb3ba${_scopeId}>Die Person bekommt eine E-Mail mit einem Link. Darüber legt sie ihr Passwort fest und ist danach angemeldet.</p><div class="form-field" data-v-27ddb3ba${_scopeId}><label class="form-field__label" for="bn-invite-name" data-v-27ddb3ba${_scopeId}>Name (optional)</label><input id="bn-invite-name"${(0, server_renderer_exports.ssrRenderAttr)("value", invite.name)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": inviteErrors.value.name }, "input"])}" type="text" maxlength="255" autocomplete="off" aria-describedby="bn-invite-name-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", inviteErrors.value.name ? "true" : void 0)} data-v-27ddb3ba${_scopeId}><p id="bn-invite-name-err" class="form-field__error" data-v-27ddb3ba${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(inviteErrors.value.name ?? "")}</p></div><div class="form-field" data-v-27ddb3ba${_scopeId}><label class="form-field__label" for="bn-invite-email" data-v-27ddb3ba${_scopeId}>E-Mail</label><input id="bn-invite-email"${(0, server_renderer_exports.ssrRenderAttr)("value", invite.email)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": inviteErrors.value.email }, "input"])}" type="email" inputmode="email" maxlength="255" autocomplete="off" spellcheck="false" aria-required="true" aria-describedby="bn-invite-email-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", inviteErrors.value.email ? "true" : void 0)} data-v-27ddb3ba${_scopeId}><p id="bn-invite-email-err" class="form-field__error" data-v-27ddb3ba${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(inviteErrors.value.email ?? "")}</p></div><div class="form-field" data-v-27ddb3ba${_scopeId}><label class="form-field__label" for="bn-invite-role" data-v-27ddb3ba${_scopeId}>Rolle</label><select id="bn-invite-role" class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": inviteErrors.value.role_id }, "input"])}" aria-required="true" aria-describedby="bn-invite-role-help bn-invite-role-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", inviteErrors.value.role_id ? "true" : void 0)} data-v-27ddb3ba${_scopeId}><option value="" disabled data-v-27ddb3ba${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(invite.role_id) ? (0, server_renderer_exports.ssrLooseContain)(invite.role_id, "") : (0, server_renderer_exports.ssrLooseEqual)(invite.role_id, "")) ? " selected" : ""}${_scopeId}>Rolle wählen</option><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(__props.assignableRoles, (role) => {
										_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", role.id)} data-v-27ddb3ba${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(invite.role_id) ? (0, server_renderer_exports.ssrLooseContain)(invite.role_id, role.id) : (0, server_renderer_exports.ssrLooseEqual)(invite.role_id, role.id)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(role.label)}</option>`);
									});
									_push(`<!--]--></select><p id="bn-invite-role-help" class="form-field__help" data-v-27ddb3ba${_scopeId}>Du kannst nur Rollen vergeben, deren Rechte du selbst hast.</p><p id="bn-invite-role-err" class="form-field__error" data-v-27ddb3ba${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(inviteErrors.value.role_id ?? "")}</p></div></form>`);
								} else return [(0, vue_exports.createVNode)("form", {
									id: "bn-invite",
									class: "adm-fields",
									novalidate: "",
									onSubmit: (0, vue_exports.withModifiers)(sendInvite, ["prevent"])
								}, [
									(0, vue_exports.createVNode)("p", { class: "adm-note" }, "Die Person bekommt eine E-Mail mit einem Link. Darüber legt sie ihr Passwort fest und ist danach angemeldet."),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "bn-invite-name"
										}, "Name (optional)"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											id: "bn-invite-name",
											"onUpdate:modelValue": ($event) => invite.name = $event,
											class: ["input", { "input--error": inviteErrors.value.name }],
											type: "text",
											maxlength: "255",
											autocomplete: "off",
											"aria-describedby": "bn-invite-name-err",
											"aria-invalid": inviteErrors.value.name ? "true" : void 0
										}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, invite.name]]),
										(0, vue_exports.createVNode)("p", {
											id: "bn-invite-name-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(inviteErrors.value.name ?? ""), 1)
									]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "bn-invite-email"
										}, "E-Mail"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											id: "bn-invite-email",
											"onUpdate:modelValue": ($event) => invite.email = $event,
											class: ["input", { "input--error": inviteErrors.value.email }],
											type: "email",
											inputmode: "email",
											maxlength: "255",
											autocomplete: "off",
											spellcheck: "false",
											"aria-required": "true",
											"aria-describedby": "bn-invite-email-err",
											"aria-invalid": inviteErrors.value.email ? "true" : void 0
										}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, invite.email]]),
										(0, vue_exports.createVNode)("p", {
											id: "bn-invite-email-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(inviteErrors.value.email ?? ""), 1)
									]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "bn-invite-role"
										}, "Rolle"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
											id: "bn-invite-role",
											"onUpdate:modelValue": ($event) => invite.role_id = $event,
											class: ["input", { "input--error": inviteErrors.value.role_id }],
											"aria-required": "true",
											"aria-describedby": "bn-invite-role-help bn-invite-role-err",
											"aria-invalid": inviteErrors.value.role_id ? "true" : void 0
										}, [(0, vue_exports.createVNode)("option", {
											value: "",
											disabled: ""
										}, "Rolle wählen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.assignableRoles, (role) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
												key: role.id,
												value: role.id
											}, (0, vue_exports.toDisplayString)(role.label), 9, ["value"]);
										}), 128))], 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelSelect, invite.role_id]]),
										(0, vue_exports.createVNode)("p", {
											id: "bn-invite-role-help",
											class: "form-field__help"
										}, "Du kannst nur Rollen vergeben, deren Rechte du selbst hast."),
										(0, vue_exports.createVNode)("p", {
											id: "bn-invite-role-err",
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(inviteErrors.value.role_id ?? ""), 1)
									])
								], 32)];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
							open: roleOpen.value,
							"onUpdate:open": ($event) => roleOpen.value = $event,
							title: `Rolle von ${reroling.value?.name ?? ""} ändern`,
							"content-class": "adm-dialog adm-dialog--narrow"
						}, {
							actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-27ddb3ba${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="submit" form="bn-role"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value || roleUnchanged.value || roleChoice.value === "") ? " disabled" : ""} data-v-27ddb3ba${_scopeId}> Rolle speichern </button>`);
								else return [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									onClick: ($event) => roleOpen.value = false
								}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--primary",
									type: "submit",
									form: "bn-role",
									"aria-busy": busy.value ? "true" : void 0,
									disabled: busy.value || roleUnchanged.value || roleChoice.value === ""
								}, " Rolle speichern ", 8, ["aria-busy", "disabled"])];
							}),
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<form id="bn-role" class="adm-fields" novalidate data-v-27ddb3ba${_scopeId}><div class="form-field" data-v-27ddb3ba${_scopeId}><label class="form-field__label" for="bn-role-select" data-v-27ddb3ba${_scopeId}>Rolle</label><select id="bn-role-select" class="${(0, server_renderer_exports.ssrRenderClass)([{ "input--error": roleErrors.value.role_id }, "input"])}" aria-describedby="bn-role-help bn-role-err"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", roleErrors.value.role_id ? "true" : void 0)} data-v-27ddb3ba${_scopeId}><option value="" disabled data-v-27ddb3ba${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(roleChoice.value) ? (0, server_renderer_exports.ssrLooseContain)(roleChoice.value, "") : (0, server_renderer_exports.ssrLooseEqual)(roleChoice.value, "")) ? " selected" : ""}${_scopeId}>Rolle wählen</option><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(__props.assignableRoles, (role) => {
										_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", role.id)} data-v-27ddb3ba${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(roleChoice.value) ? (0, server_renderer_exports.ssrLooseContain)(roleChoice.value, role.id) : (0, server_renderer_exports.ssrLooseEqual)(roleChoice.value, role.id)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(role.label)}</option>`);
									});
									_push(`<!--]--></select><p id="bn-role-help" class="form-field__help" data-v-27ddb3ba${_scopeId}>Die neuen Rechte gelten ab dem nächsten Klick der Person.</p><p id="bn-role-err" class="form-field__error" data-v-27ddb3ba${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(roleErrors.value.role_id ?? "")}</p></div></form>`);
								} else return [(0, vue_exports.createVNode)("form", {
									id: "bn-role",
									class: "adm-fields",
									novalidate: "",
									onSubmit: (0, vue_exports.withModifiers)(saveRole, ["prevent"])
								}, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "bn-role-select"
									}, "Rolle"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "bn-role-select",
										"onUpdate:modelValue": ($event) => roleChoice.value = $event,
										class: ["input", { "input--error": roleErrors.value.role_id }],
										"aria-describedby": "bn-role-help bn-role-err",
										"aria-invalid": roleErrors.value.role_id ? "true" : void 0
									}, [(0, vue_exports.createVNode)("option", {
										value: "",
										disabled: ""
									}, "Rolle wählen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.assignableRoles, (role) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
											key: role.id,
											value: role.id
										}, (0, vue_exports.toDisplayString)(role.label), 9, ["value"]);
									}), 128))], 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelSelect, roleChoice.value]]),
									(0, vue_exports.createVNode)("p", {
										id: "bn-role-help",
										class: "form-field__help"
									}, "Die neuen Rechte gelten ab dem nächsten Klick der Person."),
									(0, vue_exports.createVNode)("p", {
										id: "bn-role-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(roleErrors.value.role_id ?? ""), 1)
								])], 32)];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: askOpen.value,
							"onUpdate:open": ($event) => askOpen.value = $event,
							title: asking.value ? (0, vue_exports.unref)(actionTitle)(asking.value.action, asking.value.account) : "",
							body: asking.value ? (0, vue_exports.unref)(actionBody)(asking.value.action, asking.value.account) : "",
							"confirm-label": asking.value ? (0, vue_exports.unref)(actionLabel)(asking.value.action) : "",
							busy: busy.value,
							onConfirm: runAction
						}, null, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: withdrawOpen.value,
							"onUpdate:open": ($event) => withdrawOpen.value = $event,
							title: `Einladung an ${withdrawing.value?.email ?? ""} widerrufen?`,
							body: "Der Link in der E-Mail funktioniert danach nicht mehr. Du kannst die Person jederzeit neu einladen.",
							"confirm-label": "Widerrufen",
							busy: busy.value,
							onConfirm: withdraw
						}, null, _parent, _scopeId));
					} else return [
						alert.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-alert",
							role: "alert"
						}, (0, vue_exports.toDisplayString)(alert.value), 1)) : (0, vue_exports.createCommentVNode)("", true),
						__props.accounts.length > 0 || __props.invitations.length > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 1,
							class: "adm-panel"
						}, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Name"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Rolle"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Letzte Anmeldung"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Zwei-Faktor"),
							hasRowActions.value || __props.can.invite ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("th", {
								key: 0,
								scope: "col"
							}, [(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, "Aktionen")])) : (0, vue_exports.createCommentVNode)("", true)
						])]), (0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.accounts, (account) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: `a${account.id}` }, [
								(0, vue_exports.createVNode)("td", { "data-label": "Name" }, [(0, vue_exports.createVNode)("span", { class: "adm-table__key bn__name" }, [
									(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(account.name), 1),
									account.isSelf ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "bn__you"
									}, " (du)")) : (0, vue_exports.createCommentVNode)("", true),
									account.status === "suspended" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 1,
										class: "adm-tag adm-tag--bad"
									}, "Gesperrt")) : account.status === "invited" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 2,
										class: "adm-tag adm-tag--neutral"
									}, "Eingeladen")) : (0, vue_exports.createCommentVNode)("", true)
								]), (0, vue_exports.createVNode)("span", { class: "adm-table__sub" }, (0, vue_exports.toDisplayString)(account.email), 1)]),
								(0, vue_exports.createVNode)("td", { "data-label": "Rolle" }, (0, vue_exports.toDisplayString)(account.role ?? "Keine Rolle"), 1),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Letzte Anmeldung",
									class: "bn__num"
								}, (0, vue_exports.toDisplayString)(account.lastLogin ?? "Noch nie"), 1),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Zwei-Faktor",
									"data-phone": "hide"
								}, (0, vue_exports.toDisplayString)(account.twoFactor ? "Ja" : "Nein"), 1),
								hasRowActions.value || __props.can.invite ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
									key: 0,
									"data-label": "Aktionen",
									"data-phone": "menu",
									class: "bn__actions"
								}, [account.manageable ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuRoot_default), { key: 0 }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
										class: "adm-iconbtn",
										"aria-label": `Aktionen für ${account.name}`
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
												(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item",
													onSelect: ($event) => openRole(account)
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "shield",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Rolle ändern… ")]),
													_: 1
												}, 8, ["onSelect"]),
												account.status !== "suspended" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: 0,
													class: "adm-menu__item",
													onSelect: ($event) => ask("signout", account)
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "logout",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Überall abmelden ")]),
													_: 1
												}, 8, ["onSelect"])) : (0, vue_exports.createCommentVNode)("", true),
												(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
												account.status === "suspended" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: 1,
													class: "adm-menu__item",
													onSelect: ($event) => ask("reactivate", account)
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "check",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Entsperren ")]),
													_: 1
												}, 8, ["onSelect"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuItem_default), {
													key: 2,
													class: "adm-menu__item adm-menu__item--danger",
													onSelect: ($event) => ask("suspend", account)
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "lock",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Sperren ")]),
													_: 1
												}, 8, ["onSelect"]))
											]),
											_: 2
										}, 1024)]),
										_: 2
									}, 1024)]),
									_: 2
								}, 1024)) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true)
							]);
						}), 128)), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.invitations, (invitation) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: `i${invitation.id}` }, [
								(0, vue_exports.createVNode)("td", { "data-label": "Name" }, [(0, vue_exports.createVNode)("span", { class: "adm-table__key bn__name" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(invitation.name || invitation.email) + " ", 1), (0, vue_exports.createVNode)("span", { class: "adm-tag adm-tag--neutral" }, "Eingeladen")]), invitationSub(invitation) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: "adm-table__sub"
								}, (0, vue_exports.toDisplayString)(invitationSub(invitation)), 1)) : (0, vue_exports.createCommentVNode)("", true)]),
								(0, vue_exports.createVNode)("td", { "data-label": "Rolle" }, (0, vue_exports.toDisplayString)(invitation.role ?? "Keine Rolle"), 1),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Letzte Anmeldung",
									class: "bn__num"
								}, [invitation.expired ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: "adm-tag adm-tag--warn"
								}, "Link abgelaufen")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Link gültig bis " + (0, vue_exports.toDisplayString)(invitation.expiresAt), 1)], 64))]),
								(0, vue_exports.createVNode)("td", {
									"data-label": "Zwei-Faktor",
									"data-phone": "hide"
								}, "–"),
								hasRowActions.value || __props.can.invite ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("td", {
									key: 0,
									"data-label": "Aktionen",
									"data-phone": "menu",
									class: "bn__actions"
								}, [__props.can.invite ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(DropdownMenuRoot_default), { key: 0 }, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
										class: "adm-iconbtn",
										"aria-label": `Aktionen für die Einladung an ${invitation.email}`
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
												(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item",
													disabled: sending.value !== null,
													onSelect: ($event) => resend(invitation)
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "emails",
														size: 20
													}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(sending.value === invitation.id ? "Wird gesendet …" : "Erneut senden"), 1)]),
													_: 2
												}, 1032, ["disabled", "onSelect"]),
												(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
												(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
													class: "adm-menu__item adm-menu__item--danger",
													onSelect: ($event) => withdrawing.value = invitation
												}, {
													default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "close",
														size: 20
													}), (0, vue_exports.createTextVNode)(" Widerrufen ")]),
													_: 1
												}, 8, ["onSelect"])
											]),
											_: 2
										}, 1024)]),
										_: 2
									}, 1024)]),
									_: 2
								}, 1024)) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true)
							]);
						}), 128))])])])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 2,
							kind: "empty",
							text: "Noch kein Konto und keine Einladung. Wer eingeladen wird, erscheint hier und bekommt ein Konto, sobald die Einladung angenommen ist."
						})),
						(0, vue_exports.createVNode)(Dialog_default, {
							open: inviting.value,
							"onUpdate:open": ($event) => inviting.value = $event,
							title: "Person einladen",
							"content-class": "adm-dialog"
						}, {
							actions: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "button",
								onClick: ($event) => inviting.value = false
							}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "submit",
								form: "bn-invite",
								"aria-busy": busy.value ? "true" : void 0,
								disabled: busy.value
							}, (0, vue_exports.toDisplayString)(busy.value ? "Wird gesendet …" : "Einladung senden"), 9, ["aria-busy", "disabled"])]),
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("form", {
								id: "bn-invite",
								class: "adm-fields",
								novalidate: "",
								onSubmit: (0, vue_exports.withModifiers)(sendInvite, ["prevent"])
							}, [
								(0, vue_exports.createVNode)("p", { class: "adm-note" }, "Die Person bekommt eine E-Mail mit einem Link. Darüber legt sie ihr Passwort fest und ist danach angemeldet."),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "bn-invite-name"
									}, "Name (optional)"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "bn-invite-name",
										"onUpdate:modelValue": ($event) => invite.name = $event,
										class: ["input", { "input--error": inviteErrors.value.name }],
										type: "text",
										maxlength: "255",
										autocomplete: "off",
										"aria-describedby": "bn-invite-name-err",
										"aria-invalid": inviteErrors.value.name ? "true" : void 0
									}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, invite.name]]),
									(0, vue_exports.createVNode)("p", {
										id: "bn-invite-name-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(inviteErrors.value.name ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "bn-invite-email"
									}, "E-Mail"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "bn-invite-email",
										"onUpdate:modelValue": ($event) => invite.email = $event,
										class: ["input", { "input--error": inviteErrors.value.email }],
										type: "email",
										inputmode: "email",
										maxlength: "255",
										autocomplete: "off",
										spellcheck: "false",
										"aria-required": "true",
										"aria-describedby": "bn-invite-email-err",
										"aria-invalid": inviteErrors.value.email ? "true" : void 0
									}, null, 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, invite.email]]),
									(0, vue_exports.createVNode)("p", {
										id: "bn-invite-email-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(inviteErrors.value.email ?? ""), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "bn-invite-role"
									}, "Rolle"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "bn-invite-role",
										"onUpdate:modelValue": ($event) => invite.role_id = $event,
										class: ["input", { "input--error": inviteErrors.value.role_id }],
										"aria-required": "true",
										"aria-describedby": "bn-invite-role-help bn-invite-role-err",
										"aria-invalid": inviteErrors.value.role_id ? "true" : void 0
									}, [(0, vue_exports.createVNode)("option", {
										value: "",
										disabled: ""
									}, "Rolle wählen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.assignableRoles, (role) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
											key: role.id,
											value: role.id
										}, (0, vue_exports.toDisplayString)(role.label), 9, ["value"]);
									}), 128))], 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelSelect, invite.role_id]]),
									(0, vue_exports.createVNode)("p", {
										id: "bn-invite-role-help",
										class: "form-field__help"
									}, "Du kannst nur Rollen vergeben, deren Rechte du selbst hast."),
									(0, vue_exports.createVNode)("p", {
										id: "bn-invite-role-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(inviteErrors.value.role_id ?? ""), 1)
								])
							], 32)]),
							_: 1
						}, 8, ["open", "onUpdate:open"]),
						(0, vue_exports.createVNode)(Dialog_default, {
							open: roleOpen.value,
							"onUpdate:open": ($event) => roleOpen.value = $event,
							title: `Rolle von ${reroling.value?.name ?? ""} ändern`,
							"content-class": "adm-dialog adm-dialog--narrow"
						}, {
							actions: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "button",
								onClick: ($event) => roleOpen.value = false
							}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "submit",
								form: "bn-role",
								"aria-busy": busy.value ? "true" : void 0,
								disabled: busy.value || roleUnchanged.value || roleChoice.value === ""
							}, " Rolle speichern ", 8, ["aria-busy", "disabled"])]),
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("form", {
								id: "bn-role",
								class: "adm-fields",
								novalidate: "",
								onSubmit: (0, vue_exports.withModifiers)(saveRole, ["prevent"])
							}, [(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "bn-role-select"
								}, "Rolle"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "bn-role-select",
									"onUpdate:modelValue": ($event) => roleChoice.value = $event,
									class: ["input", { "input--error": roleErrors.value.role_id }],
									"aria-describedby": "bn-role-help bn-role-err",
									"aria-invalid": roleErrors.value.role_id ? "true" : void 0
								}, [(0, vue_exports.createVNode)("option", {
									value: "",
									disabled: ""
								}, "Rolle wählen"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.assignableRoles, (role) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
										key: role.id,
										value: role.id
									}, (0, vue_exports.toDisplayString)(role.label), 9, ["value"]);
								}), 128))], 10, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelSelect, roleChoice.value]]),
								(0, vue_exports.createVNode)("p", {
									id: "bn-role-help",
									class: "form-field__help"
								}, "Die neuen Rechte gelten ab dem nächsten Klick der Person."),
								(0, vue_exports.createVNode)("p", {
									id: "bn-role-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(roleErrors.value.role_id ?? ""), 1)
							])], 32)]),
							_: 1
						}, 8, [
							"open",
							"onUpdate:open",
							"title"
						]),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: askOpen.value,
							"onUpdate:open": ($event) => askOpen.value = $event,
							title: asking.value ? (0, vue_exports.unref)(actionTitle)(asking.value.action, asking.value.account) : "",
							body: asking.value ? (0, vue_exports.unref)(actionBody)(asking.value.action, asking.value.account) : "",
							"confirm-label": asking.value ? (0, vue_exports.unref)(actionLabel)(asking.value.action) : "",
							busy: busy.value,
							onConfirm: runAction
						}, null, 8, [
							"open",
							"onUpdate:open",
							"title",
							"body",
							"confirm-label",
							"busy"
						]),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: withdrawOpen.value,
							"onUpdate:open": ($event) => withdrawOpen.value = $event,
							title: `Einladung an ${withdrawing.value?.email ?? ""} widerrufen?`,
							body: "Der Link in der E-Mail funktioniert danach nicht mehr. Du kannst die Person jederzeit neu einladen.",
							"confirm-label": "Widerrufen",
							busy: busy.value,
							onConfirm: withdraw
						}, null, 8, [
							"open",
							"onUpdate:open",
							"title",
							"busy"
						])
					];
				}),
				_: 2
			}, [__props.can.invite ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--primary" type="button" data-v-27ddb3ba${_scopeId}>Person einladen</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						onClick: openInvite
					}, "Person einladen")];
				}),
				key: "0"
			} : void 0]), _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Benutzer/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Benutzer/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-27ddb3ba"]]);
//#endregion
export { Index_default as default };
