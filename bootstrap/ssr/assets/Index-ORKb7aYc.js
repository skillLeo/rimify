import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage--D-DZQ_G.js";
import { a as link_default, c as router, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-COuF1lMZ.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { t as AdminState_default } from "./AdminState-BXpi0AIC.js";
import { t as stampHeaders } from "./useDirtyForm-jjlNVm-n.js";
//#region resources/js/Pages/Admin/Benachrichtigungen/Index.vue?vue&type=script&setup=true&lang.ts
var BASE = "/admin/benachrichtigungen";
var STALE_SWITCHES = "In einem anderen Tab oder auf einem anderen Gerät wurde inzwischen etwas umgestellt, deshalb ist deine Änderung hier nicht gespeichert. Die Schalter zeigen jetzt, was gespeichert ist. Steht einer nicht so, wie du willst, stell ihn noch einmal um.";
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		filter: {},
		items: {},
		counts: {},
		pagination: {},
		kinds: {},
		kindsStamp: {}
	},
	setup(__props) {
		/**
		* Benachrichtigungen — the team's own alerts, behind the bell (docs/admin/rest-build-plan.md, step 1).
		*
		* Everything on this page belongs to the reader: their alerts, newest first under the Berlin day
		* they arrived, and „Was du bekommst“ — per kind, in the admin and by e-mail. A switch saves as it
		* is flipped, like a light switch; there is no form to forget to send. Choosing an alert marks it
		* read and, where it has a page, opens it; *Gelesen* only marks it.
		*/
		const props = __props;
		const busy = (0, vue_exports.ref)(false);
		const saving = (0, vue_exports.ref)(false);
		/** The switches as shown; put back to the server's answer after every visit. */
		const choices = (0, vue_exports.ref)(props.kinds.map((k) => ({ ...k })));
		(0, vue_exports.watch)(() => props.kinds, (kinds) => {
			choices.value = kinds.map((k) => ({ ...k }));
		});
		const context = (0, vue_exports.computed)(() => {
			const { unread, all } = props.counts;
			if (all === 0) return "Noch keine Benachrichtigungen";
			const total = `${decimal(all, 0)} insgesamt`;
			return unread === 0 ? `Alles gelesen · ${total}` : `${decimal(unread, 0)} ungelesen · ${total}`;
		});
		const emptyText = (0, vue_exports.computed)(() => {
			if (props.kinds.length === 0) return "Für die Bereiche, die du öffnen darfst, gibt es noch keine Benachrichtigungen.";
			const names = props.kinds.map((k) => `„${k.label}“`);
			return `Hier erscheint, was du wissen musst – ${names.length > 1 ? `${names.slice(0, -1).join(", ")} und ${names[names.length - 1]}` : names[0]}. Was davon du bekommst, legst du unten fest.`;
		});
		/** Consecutive alerts of one Berlin day under one heading; the server sent them newest first. */
		const days = (0, vue_exports.computed)(() => {
			const groups = [];
			for (const item of props.items) {
				const key = item.day === "" ? "ohne-datum" : item.day;
				const last = groups[groups.length - 1];
				if (last !== void 0 && last.key === key) last.items.push(item);
				else groups.push({
					key,
					label: item.dayLabel,
					items: [item]
				});
			}
			return groups;
		});
		function filterHref(filter) {
			return filter === "ungelesen" ? `${BASE}?filter=ungelesen` : BASE;
		}
		/**
		* After a read, the control that was pressed may be gone — the title of an alert without a page
		* becomes plain text, *Gelesen* and *Alle als gelesen markieren* disappear, under *Ungelesen* the
		* whole row goes. Focus then moves to the row, or to the one now in its place, or to the list, never
		* back to the top of the document.
		*/
		async function keepFocus(id, index) {
			await (0, vue_exports.nextTick)();
			const rows = Array.from(document.querySelectorAll(".bn-item"));
			((id === null ? null : document.getElementById(`bn-item-${id}`)) ?? rows[Math.min(index, rows.length - 1)] ?? document.querySelector(".bn-days, .bn-done, .adm-page__title"))?.focus();
		}
		function markRead(item, then) {
			router.post(`${BASE}/${item.id}/gelesen`, { bleiben: true }, {
				preserveScroll: true,
				preserveState: true,
				onSuccess: then
			});
		}
		/** An alert's title: an unread one is marked read, then its page opens — as its own visit, at the page's top. */
		function open(item) {
			const index = props.items.findIndex((i) => i.id === item.id);
			if (item.read) {
				if (item.href !== null) router.visit(item.href);
				return;
			}
			markRead(item, () => {
				if (item.href !== null) router.visit(item.href);
				else keepFocus(item.id, index);
			});
		}
		function markOnly(item) {
			const index = props.items.findIndex((i) => i.id === item.id);
			markRead(item, () => void keepFocus(item.id, index));
		}
		function readAll() {
			busy.value = true;
			router.post(`${BASE}/gelesen`, {}, {
				preserveScroll: true,
				preserveState: true,
				onSuccess: () => void keepFocus(null, 0),
				onFinish: () => busy.value = false
			});
		}
		/** A flip made while the last one is still on its way: sent as soon as that one has answered. */
		let pending = false;
		/** Why the last flip was not saved — said beside the switches, which go back to what is stored. */
		const prefsError = (0, vue_exports.ref)("");
		function saveChoices() {
			if (saving.value) {
				pending = true;
				return;
			}
			saving.value = true;
			let saved = false;
			router.put(`${BASE}/einstellungen`, { kinds: choices.value.map(({ kind, inApp, email }) => ({
				kind,
				inApp,
				email
			})) }, {
				preserveScroll: true,
				preserveState: true,
				headers: stampHeaders(props.kindsStamp),
				onSuccess: () => {
					saved = true;
					prefsError.value = "";
				},
				onError: (bag) => {
					prefsError.value = bag._stamp ? STALE_SWITCHES : Object.values(bag)[0] ?? "";
				},
				onFinish: () => {
					saving.value = false;
					if (pending) {
						pending = false;
						saveChoices();
						return;
					}
					if (!saved) choices.value = props.kinds.map((k) => ({ ...k }));
				}
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Benachrichtigungen",
				context: context.value
			}, _attrs), (0, vue_exports.createSlots)({
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.counts.all > 0) {
							_push(`<nav class="adm-tabs" aria-label="Anzeigen" data-v-62668b5c${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
								href: filterHref("alle"),
								class: "adm-tabs__item",
								"aria-current": __props.filter === "alle" ? "page" : void 0,
								"preserve-scroll": ""
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) _push(` Alle `);
									else return [(0, vue_exports.createTextVNode)(" Alle ")];
								}),
								_: 1
							}, _parent, _scopeId));
							_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
								href: filterHref("ungelesen"),
								class: "adm-tabs__item",
								"aria-current": __props.filter === "ungelesen" ? "page" : void 0,
								"preserve-scroll": ""
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										_push(` Ungelesen`);
										if (__props.counts.unread > 0) _push(`<span class="bn-count" data-v-62668b5c${_scopeId}><span class="visually-hidden" data-v-62668b5c${_scopeId}>, </span>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.counts.unread, 0))}</span>`);
										else _push(`<!---->`);
									} else return [(0, vue_exports.createTextVNode)(" Ungelesen"), __props.counts.unread > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "bn-count"
									}, [(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ", "), (0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.counts.unread, 0)), 1)])) : (0, vue_exports.createCommentVNode)("", true)];
								}),
								_: 1
							}, _parent, _scopeId));
							_push(`</nav>`);
						} else _push(`<!---->`);
						if (__props.items.length === 0) {
							_push(`<!--[-->`);
							if (__props.filter === "ungelesen" && __props.counts.all > 0) {
								_push(`<div class="bn-done" tabindex="-1" data-v-62668b5c${_scopeId}><p class="bn-done__title" data-v-62668b5c${_scopeId}>Alles gelesen.</p>`);
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: filterHref("alle"),
									class: "btn btn--secondary"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`Alle anzeigen`);
										else return [(0, vue_exports.createTextVNode)("Alle anzeigen")];
									}),
									_: 1
								}, _parent, _scopeId));
								_push(`</div>`);
							} else _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
								kind: "empty",
								text: emptyText.value
							}, null, _parent, _scopeId));
							_push(`<!--]-->`);
						} else {
							_push(`<div class="bn-days" tabindex="-1" aria-label="Benachrichtigungen" data-v-62668b5c${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(days.value, (group) => {
								_push(`<section class="adm-section bn-day"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `bn-day-${group.key}`)} data-v-62668b5c${_scopeId}><h2${(0, server_renderer_exports.ssrRenderAttr)("id", `bn-day-${group.key}`)} class="adm-section__title bn-day__title" data-v-62668b5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(group.label)}</h2><ol class="adm-panel bn-list" data-v-62668b5c${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(group.items, (item) => {
									_push(`<li${(0, server_renderer_exports.ssrRenderAttr)("id", `bn-item-${item.id}`)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "bn-item--unread": !item.read }, "bn-item"])}" tabindex="-1" data-v-62668b5c${_scopeId}><span class="bn-item__dot" aria-hidden="true" data-v-62668b5c${_scopeId}></span><div class="bn-item__text" data-v-62668b5c${_scopeId}>`);
									if (item.href || !item.read) {
										_push(`<button class="bn-item__title bn-item__title--button" type="button" data-v-62668b5c${_scopeId}>`);
										if (!item.read) _push(`<span class="visually-hidden" data-v-62668b5c${_scopeId}>Ungelesen: </span>`);
										else _push(`<!---->`);
										_push(`${(0, server_renderer_exports.ssrInterpolate)(item.title)} `);
										if (item.href) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
											class: "bn-item__go",
											name: "chevron-right",
											size: 16
										}, null, _parent, _scopeId));
										else _push(`<!---->`);
										_push(`</button>`);
									} else _push(`<p class="bn-item__title" data-v-62668b5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.title)}</p>`);
									if (item.detail) _push(`<p class="bn-item__detail" data-v-62668b5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.detail)}</p>`);
									else _push(`<!---->`);
									_push(`<p class="bn-item__meta" data-v-62668b5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.kindLabel)}<span aria-hidden="true" data-v-62668b5c${_scopeId}> · </span><span class="visually-hidden" data-v-62668b5c${_scopeId}>, </span><time${(0, server_renderer_exports.ssrRenderAttr)("datetime", item.iso ?? void 0)}${(0, server_renderer_exports.ssrRenderAttr)("title", item.at ?? void 0)} data-v-62668b5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.time ?? "–")}</time></p></div>`);
									if (!item.read && item.href) _push(`<button class="btn btn--ghost btn--sm bn-item__read" type="button" data-v-62668b5c${_scopeId}> Gelesen<span class="visually-hidden" data-v-62668b5c${_scopeId}>: ${(0, server_renderer_exports.ssrInterpolate)(item.title)}</span></button>`);
									else _push(`<!---->`);
									_push(`</li>`);
								});
								_push(`<!--]--></ol></section>`);
							});
							_push(`<!--]-->`);
							if (__props.pagination.last > 1) {
								_push(`<nav class="bn-pages" aria-label="Seiten der Benachrichtigungen" data-v-62668b5c${_scopeId}>`);
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
											_push(` Neuere `);
										} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "chevron-left",
											size: 16
										}), (0, vue_exports.createTextVNode)(" Neuere ")];
									}),
									_: 1
								}, _parent, _scopeId));
								else _push(`<span aria-hidden="true" data-v-62668b5c${_scopeId}></span>`);
								_push(`<p class="bn-pages__where" data-v-62668b5c${_scopeId}>Seite ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.pagination.current, 0))} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.pagination.last, 0))}</p>`);
								if (__props.pagination.next) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: __props.pagination.next,
									class: "btn btn--secondary"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push(` Ältere `);
											_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
												name: "chevron-right",
												size: 16
											}, null, _parent, _scopeId));
										} else return [(0, vue_exports.createTextVNode)(" Ältere "), (0, vue_exports.createVNode)(AdminIcon_default, {
											name: "chevron-right",
											size: 16
										})];
									}),
									_: 1
								}, _parent, _scopeId));
								else _push(`<span aria-hidden="true" data-v-62668b5c${_scopeId}></span>`);
								_push(`</nav>`);
							} else _push(`<!---->`);
							_push(`</div>`);
						}
						if (choices.value.length) {
							_push(`<section class="adm-section bn-prefs" aria-labelledby="bn-prefs" data-v-62668b5c${_scopeId}><h2 id="bn-prefs" class="adm-section__title" data-v-62668b5c${_scopeId}>Was du bekommst</h2><p class="adm-note" data-v-62668b5c${_scopeId}>Jede Änderung gilt sofort. E-Mails gehen an die Adresse deines Kontos.</p>`);
							if (prefsError.value) _push(`<p class="adm-alert" role="alert" data-v-62668b5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(prefsError.value)}</p>`);
							else _push(`<!---->`);
							_push(`<table class="adm-table bn-prefs__table"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", saving.value ? "true" : void 0)} data-v-62668b5c${_scopeId}><thead data-v-62668b5c${_scopeId}><tr data-v-62668b5c${_scopeId}><th scope="col" data-v-62668b5c${_scopeId}>Benachrichtigung</th><th scope="col" class="bn-prefs__col" data-v-62668b5c${_scopeId}>Im Admin</th><th scope="col" class="bn-prefs__col" data-v-62668b5c${_scopeId}>Per E-Mail</th></tr></thead><tbody data-v-62668b5c${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(choices.value, (choice) => {
								_push(`<tr data-v-62668b5c${_scopeId}><th scope="row" class="bn-prefs__kind" data-v-62668b5c${_scopeId}><span class="bn-prefs__label" data-v-62668b5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(choice.label)}</span><span class="bn-prefs__desc" data-v-62668b5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(choice.description)}</span></th><td class="bn-prefs__col" data-label="Im Admin" data-v-62668b5c${_scopeId}><label class="check bn-prefs__check" data-v-62668b5c${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(choice.inApp) ? (0, server_renderer_exports.ssrLooseContain)(choice.inApp, null) : choice.inApp) ? " checked" : ""} type="checkbox" data-v-62668b5c${_scopeId}><span class="visually-hidden" data-v-62668b5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(choice.label)} im Admin</span></label></td><td class="bn-prefs__col" data-label="Per E-Mail" data-v-62668b5c${_scopeId}><label class="check bn-prefs__check" data-v-62668b5c${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(choice.email) ? (0, server_renderer_exports.ssrLooseContain)(choice.email, null) : choice.email) ? " checked" : ""} type="checkbox" data-v-62668b5c${_scopeId}><span class="visually-hidden" data-v-62668b5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(choice.label)} per E-Mail</span></label></td></tr>`);
							});
							_push(`<!--]--></tbody></table></section>`);
						} else _push(`<!---->`);
					} else return [
						__props.counts.all > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("nav", {
							key: 0,
							class: "adm-tabs",
							"aria-label": "Anzeigen"
						}, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
							href: filterHref("alle"),
							class: "adm-tabs__item",
							"aria-current": __props.filter === "alle" ? "page" : void 0,
							"preserve-scroll": ""
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)(" Alle ")]),
							_: 1
						}, 8, ["href", "aria-current"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
							href: filterHref("ungelesen"),
							class: "adm-tabs__item",
							"aria-current": __props.filter === "ungelesen" ? "page" : void 0,
							"preserve-scroll": ""
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)(" Ungelesen"), __props.counts.unread > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 0,
								class: "bn-count"
							}, [(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ", "), (0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.counts.unread, 0)), 1)])) : (0, vue_exports.createCommentVNode)("", true)]),
							_: 1
						}, 8, ["href", "aria-current"])])) : (0, vue_exports.createCommentVNode)("", true),
						__props.items.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [__props.filter === "ungelesen" && __props.counts.all > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 0,
							class: "bn-done",
							tabindex: "-1"
						}, [(0, vue_exports.createVNode)("p", { class: "bn-done__title" }, "Alles gelesen."), (0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
							href: filterHref("alle"),
							class: "btn btn--secondary"
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Alle anzeigen")]),
							_: 1
						}, 8, ["href"])])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 1,
							kind: "empty",
							text: emptyText.value
						}, null, 8, ["text"]))], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 2,
							class: "bn-days",
							tabindex: "-1",
							"aria-label": "Benachrichtigungen"
						}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(days.value, (group) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
								key: group.key,
								class: "adm-section bn-day",
								"aria-labelledby": `bn-day-${group.key}`
							}, [(0, vue_exports.createVNode)("h2", {
								id: `bn-day-${group.key}`,
								class: "adm-section__title bn-day__title"
							}, (0, vue_exports.toDisplayString)(group.label), 9, ["id"]), (0, vue_exports.createVNode)("ol", { class: "adm-panel bn-list" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(group.items, (item) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
									id: `bn-item-${item.id}`,
									key: item.id,
									class: ["bn-item", { "bn-item--unread": !item.read }],
									tabindex: "-1"
								}, [
									(0, vue_exports.createVNode)("span", {
										class: "bn-item__dot",
										"aria-hidden": "true"
									}),
									(0, vue_exports.createVNode)("div", { class: "bn-item__text" }, [
										item.href || !item.read ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
											key: 0,
											class: "bn-item__title bn-item__title--button",
											type: "button",
											onClick: ($event) => open(item)
										}, [
											!item.read ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 0,
												class: "visually-hidden"
											}, "Ungelesen: ")) : (0, vue_exports.createCommentVNode)("", true),
											(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.title) + " ", 1),
											item.href ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
												key: 1,
												class: "bn-item__go",
												name: "chevron-right",
												size: 16
											})) : (0, vue_exports.createCommentVNode)("", true)
										], 8, ["onClick"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 1,
											class: "bn-item__title"
										}, (0, vue_exports.toDisplayString)(item.title), 1)),
										item.detail ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 2,
											class: "bn-item__detail"
										}, (0, vue_exports.toDisplayString)(item.detail), 1)) : (0, vue_exports.createCommentVNode)("", true),
										(0, vue_exports.createVNode)("p", { class: "bn-item__meta" }, [
											(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.kindLabel), 1),
											(0, vue_exports.createVNode)("span", { "aria-hidden": "true" }, " · "),
											(0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ", "),
											(0, vue_exports.createVNode)("time", {
												datetime: item.iso ?? void 0,
												title: item.at ?? void 0
											}, (0, vue_exports.toDisplayString)(item.time ?? "–"), 9, ["datetime", "title"])
										])
									]),
									!item.read && item.href ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
										key: 0,
										class: "btn btn--ghost btn--sm bn-item__read",
										type: "button",
										onClick: ($event) => markOnly(item)
									}, [(0, vue_exports.createTextVNode)(" Gelesen"), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, ": " + (0, vue_exports.toDisplayString)(item.title), 1)], 8, ["onClick"])) : (0, vue_exports.createCommentVNode)("", true)
								], 10, ["id"]);
							}), 128))])], 8, ["aria-labelledby"]);
						}), 128)), __props.pagination.last > 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("nav", {
							key: 0,
							class: "bn-pages",
							"aria-label": "Seiten der Benachrichtigungen"
						}, [
							__props.pagination.prev ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
								key: 0,
								href: __props.pagination.prev,
								class: "btn btn--secondary"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "chevron-left",
									size: 16
								}), (0, vue_exports.createTextVNode)(" Neuere ")]),
								_: 1
							}, 8, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 1,
								"aria-hidden": "true"
							})),
							(0, vue_exports.createVNode)("p", { class: "bn-pages__where" }, "Seite " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.pagination.current, 0)) + " von " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.pagination.last, 0)), 1),
							__props.pagination.next ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
								key: 2,
								href: __props.pagination.next,
								class: "btn btn--secondary"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)(" Ältere "), (0, vue_exports.createVNode)(AdminIcon_default, {
									name: "chevron-right",
									size: 16
								})]),
								_: 1
							}, 8, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 3,
								"aria-hidden": "true"
							}))
						])) : (0, vue_exports.createCommentVNode)("", true)])),
						choices.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 3,
							class: "adm-section bn-prefs",
							"aria-labelledby": "bn-prefs"
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "bn-prefs",
								class: "adm-section__title"
							}, "Was du bekommst"),
							(0, vue_exports.createVNode)("p", { class: "adm-note" }, "Jede Änderung gilt sofort. E-Mails gehen an die Adresse deines Kontos."),
							prefsError.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-alert",
								role: "alert"
							}, (0, vue_exports.toDisplayString)(prefsError.value), 1)) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("table", {
								class: "adm-table bn-prefs__table",
								"aria-busy": saving.value ? "true" : void 0
							}, [(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Benachrichtigung"),
								(0, vue_exports.createVNode)("th", {
									scope: "col",
									class: "bn-prefs__col"
								}, "Im Admin"),
								(0, vue_exports.createVNode)("th", {
									scope: "col",
									class: "bn-prefs__col"
								}, "Per E-Mail")
							])]), (0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(choices.value, (choice) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: choice.kind }, [
									(0, vue_exports.createVNode)("th", {
										scope: "row",
										class: "bn-prefs__kind"
									}, [(0, vue_exports.createVNode)("span", { class: "bn-prefs__label" }, (0, vue_exports.toDisplayString)(choice.label), 1), (0, vue_exports.createVNode)("span", { class: "bn-prefs__desc" }, (0, vue_exports.toDisplayString)(choice.description), 1)]),
									(0, vue_exports.createVNode)("td", {
										class: "bn-prefs__col",
										"data-label": "Im Admin"
									}, [(0, vue_exports.createVNode)("label", { class: "check bn-prefs__check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										"onUpdate:modelValue": ($event) => choice.inApp = $event,
										type: "checkbox",
										onChange: saveChoices
									}, null, 40, ["onUpdate:modelValue"]), [[vue_exports.vModelCheckbox, choice.inApp]]), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, (0, vue_exports.toDisplayString)(choice.label) + " im Admin", 1)])]),
									(0, vue_exports.createVNode)("td", {
										class: "bn-prefs__col",
										"data-label": "Per E-Mail"
									}, [(0, vue_exports.createVNode)("label", { class: "check bn-prefs__check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										"onUpdate:modelValue": ($event) => choice.email = $event,
										type: "checkbox",
										onChange: saveChoices
									}, null, 40, ["onUpdate:modelValue"]), [[vue_exports.vModelCheckbox, choice.email]]), (0, vue_exports.createVNode)("span", { class: "visually-hidden" }, (0, vue_exports.toDisplayString)(choice.label) + " per E-Mail", 1)])])
								]);
							}), 128))])], 8, ["aria-busy"])
						])) : (0, vue_exports.createCommentVNode)("", true)
					];
				}),
				_: 2
			}, [__props.counts.unread > 0 ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-62668b5c${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: "check",
							size: 20
						}, null, _parent, _scopeId));
						_push(` Alle als gelesen markieren </button>`);
					} else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						disabled: busy.value,
						"aria-busy": busy.value ? "true" : void 0,
						onClick: readAll
					}, [(0, vue_exports.createVNode)(AdminIcon_default, {
						name: "check",
						size: 20
					}), (0, vue_exports.createTextVNode)(" Alle als gelesen markieren ")], 8, ["disabled", "aria-busy"])];
				}),
				key: "0"
			} : void 0]), _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Benachrichtigungen/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Benachrichtigungen/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-62668b5c"]]);
//#endregion
export { Index_default as default };
