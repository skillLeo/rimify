import { t as Dialog_default } from "./Dialog-CAlgTJaP.js";
import { t as Toast_default } from "./Toast-BH3wkw4w.js";
import { C as remember, S as readRecent, T as useShared, _ as provideConsent, b as provideShell, d as AddedPanel_default, h as CookieConsent_default, l as PreviewRibbon_default, n as useShortcuts, o as SiteHeader_default, r as CompareTray_default, s as SiteFooter_default, t as useShopFeedback, u as CanonicalLink_default, v as useVehicleChangeHref, w as useSearch, x as useShell } from "./useShopFeedback-CzxxZ4Cu.js";
import { a as link_default, c as router, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as Icon_default } from "./Icon-Bryl-es8.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as Kbd_default } from "./Kbd-CfHih0Lf.js";
//#region resources/js/Components/Chrome/CommandPalette.vue?vue&type=script&setup=true&lang.ts
var CommandPalette_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CommandPalette",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The command palette: Ctrl/⌘+K anywhere, or the search icon on a phone. One field, and under it
		* the instant search's groups plus the handful of actions people reach for by keyboard — the
		* vehicle, the basket, the check, the contact, the shortcut list. Arrow keys move, Enter goes,
		* Esc closes; the field keeps focus throughout (aria-activedescendant), so a screen reader hears
		* every move.
		*/
		const shell = useShell();
		const shared = useShared();
		const changeHref = useVehicleChangeHref();
		const search = useSearch();
		const query = (0, vue_exports.ref)("");
		const active = (0, vue_exports.ref)(0);
		const input = (0, vue_exports.ref)(null);
		const recent = (0, vue_exports.ref)([]);
		const actions = (0, vue_exports.computed)(() => {
			const vehicle = shared.value.vehicle;
			const list = [];
			if (vehicle) {
				list.push({
					id: "a-felgen",
					group: "Aktionen",
					label: `Passende Felgen für ${vehicle.short}`,
					sub: null,
					href: "/felgen",
					icon: "wheel"
				});
				list.push({
					id: "a-change",
					group: "Aktionen",
					label: "Fahrzeug ändern",
					sub: vehicle.label,
					href: changeHref.value,
					icon: "car"
				});
			} else list.push({
				id: "a-choose",
				group: "Aktionen",
				label: "Fahrzeug wählen",
				sub: "Marke und Modell oder HSN/TSN",
				href: "/felgen-suchen",
				icon: "car"
			});
			list.push({
				id: "a-cart",
				group: "Aktionen",
				label: "Warenkorb öffnen",
				sub: shared.value.cartCount > 0 ? `${shared.value.cartCount} Artikel` : null,
				href: "/warenkorb",
				icon: "cart"
			});
			list.push({
				id: "a-check",
				group: "Aktionen",
				label: "RIMIFY-Check",
				sub: "Passt eine Felge an mein Auto?",
				href: "/rimify-check",
				icon: "check-circle"
			});
			const phone = shared.value.contact.phone;
			list.push({
				id: "a-contact",
				group: "Aktionen",
				label: "Kontakt",
				sub: phone ?? shared.value.contact.email,
				href: "/kontakt",
				icon: phone ? "phone" : "mail"
			});
			list.push({
				id: "a-help",
				group: "Aktionen",
				label: "Tastenkürzel",
				sub: null,
				href: "#",
				icon: "keyboard",
				action: () => {
					shell.paletteOpen.value = false;
					shell.helpOpen.value = true;
				}
			});
			return list;
		});
		const ICONS = {
			felgen: "wheel",
			marken: "grid",
			groessen: "ruler",
			seiten: "document"
		};
		const entries = (0, vue_exports.computed)(() => {
			const result = search.result.value;
			const found = [];
			if (result) for (const group of result.groups) for (const [i, item] of group.items.entries()) found.push({
				id: `${group.key}-${i}`,
				group: group.label,
				label: item.label,
				sub: item.sub,
				href: item.href,
				icon: ICONS[group.key] ?? "search"
			});
			const needle = query.value.trim().toLowerCase();
			const matching = needle === "" ? actions.value : actions.value.filter((a) => a.label.toLowerCase().includes(needle));
			return [...found, ...matching];
		});
		const groups = (0, vue_exports.computed)(() => {
			const out = [];
			for (const entry of entries.value) {
				const last = out[out.length - 1];
				if (last && last.label === entry.group) last.entries.push(entry);
				else out.push({
					label: entry.group,
					entries: [entry]
				});
			}
			return out;
		});
		const activeId = (0, vue_exports.computed)(() => entries.value[active.value]?.id ?? void 0);
		(0, vue_exports.watch)(query, (value) => {
			active.value = 0;
			search.run(value);
		});
		(0, vue_exports.watch)(() => shell.paletteOpen.value, async (open) => {
			if (open) {
				query.value = "";
				active.value = 0;
				search.clear();
				recent.value = readRecent();
				await (0, vue_exports.nextTick)();
				input.value?.focus();
			}
		});
		function go(entry) {
			if (entry.action) {
				entry.action();
				return;
			}
			if (query.value.trim() !== "") remember(query.value.trim());
			shell.paletteOpen.value = false;
			router.visit(entry.href);
		}
		function onKeydown(event) {
			const count = entries.value.length;
			if (event.key === "ArrowDown") {
				event.preventDefault();
				active.value = count === 0 ? 0 : (active.value + 1) % count;
			} else if (event.key === "ArrowUp") {
				event.preventDefault();
				active.value = count === 0 ? 0 : (active.value - 1 + count) % count;
			} else if (event.key === "Enter") {
				const entry = entries.value[active.value];
				if (entry) {
					event.preventDefault();
					go(entry);
				}
			}
		}
		function useSuggestion() {
			if (search.result.value?.suggestion) query.value = search.result.value.suggestion;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: (0, vue_exports.unref)(shell).paletteOpen.value,
				"onUpdate:open": ($event) => (0, vue_exports.unref)(shell).paletteOpen.value = $event,
				title: "Suche und Befehle",
				"hide-title": "",
				class: "palette"
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="palette__field input-group" data-v-8c9aa9d9${_scopeId}><span class="input-group__icon" data-v-8c9aa9d9${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "search",
							size: 20
						}, null, _parent, _scopeId));
						_push(`</span><input${(0, server_renderer_exports.ssrRenderAttr)("value", query.value)} class="input palette__input" type="text" role="combobox" aria-label="Suche und Befehle" aria-autocomplete="list" aria-controls="palette-list"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", entries.value.length > 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-activedescendant", activeId.value)} placeholder="Felge, Marke, Größe oder Seite" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" data-v-8c9aa9d9${_scopeId}></div><div id="palette-list" class="palette__list" role="listbox" aria-label="Ergebnisse"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(search).loading.value ? "true" : void 0)} data-v-8c9aa9d9${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(groups.value, (group) => {
							_push(`<!--[--><p class="menu__label" role="presentation" data-v-8c9aa9d9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(group.label)}</p><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(group.entries, (entry) => {
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									id: entry.id,
									key: entry.id,
									href: entry.href,
									role: "option",
									"aria-selected": entry.id === activeId.value,
									class: ["menu__item palette__item", { "palette__item--active": entry.id === activeId.value }],
									tabindex: "-1",
									onClick: ($event) => go(entry),
									onMousemove: ($event) => active.value = entries.value.indexOf(entry)
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
												name: entry.icon,
												size: 20
											}, null, _parent, _scopeId));
											_push(`<span class="palette__text" data-v-8c9aa9d9${_scopeId}><span data-v-8c9aa9d9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.label)}</span>`);
											if (entry.sub) _push(`<span class="small quiet" data-v-8c9aa9d9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.sub)}</span>`);
											else _push(`<!---->`);
											_push(`</span>`);
										} else return [(0, vue_exports.createVNode)(Icon_default, {
											name: entry.icon,
											size: 20
										}, null, 8, ["name"]), (0, vue_exports.createVNode)("span", { class: "palette__text" }, [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(entry.label), 1), entry.sub ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: "small quiet"
										}, (0, vue_exports.toDisplayString)(entry.sub), 1)) : (0, vue_exports.createCommentVNode)("", true)])];
									}),
									_: 2
								}, _parent, _scopeId));
							});
							_push(`<!--]--><!--]-->`);
						});
						_push(`<!--]-->`);
						if ((0, vue_exports.unref)(search).loading.value && entries.value.length === 0) _push(`<p class="palette__empty" data-v-8c9aa9d9${_scopeId}>Suche läuft …</p>`);
						else if (query.value.trim() !== "" && (0, vue_exports.unref)(search).result.value && (0, vue_exports.unref)(search).result.value.total === 0) {
							_push(`<p class="palette__empty" data-v-8c9aa9d9${_scopeId}> Nichts gefunden für „${(0, server_renderer_exports.ssrInterpolate)(query.value.trim())}“. `);
							if ((0, vue_exports.unref)(search).result.value.suggestion) _push(`<button class="link" type="button" data-v-8c9aa9d9${_scopeId}> Meintest du „${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(search).result.value.suggestion)}“? </button>`);
							else _push(`<!--[-->Versuch es mit einer Marke oder einer Größe, zum Beispiel „19 Zoll“ oder „8,5J“.<!--]-->`);
							_push(`</p>`);
						} else _push(`<!---->`);
						if ((0, vue_exports.unref)(search).failed.value) _push(`<p class="palette__empty" data-v-8c9aa9d9${_scopeId}>Die Suche ist gerade nicht erreichbar. Versuch es gleich noch einmal.</p>`);
						else _push(`<!---->`);
						if (query.value.trim() === "" && recent.value.length) {
							_push(`<!--[--><p class="menu__label" role="presentation" data-v-8c9aa9d9${_scopeId}>Zuletzt gesucht</p><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(recent.value, (term) => {
								_push(`<button class="menu__item palette__item" type="button" tabindex="-1" data-v-8c9aa9d9${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
									name: "clock",
									size: 20
								}, null, _parent, _scopeId));
								_push(`<span data-v-8c9aa9d9${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(term)}</span></button>`);
							});
							_push(`<!--]--><!--]-->`);
						} else _push(`<!---->`);
						_push(`</div><p class="palette__hints small quiet" data-v-8c9aa9d9${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["↑", "↓"] }, null, _parent, _scopeId));
						_push(` wählen `);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["↵"] }, null, _parent, _scopeId));
						_push(` öffnen `);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["Esc"] }, null, _parent, _scopeId));
						_push(` schließen </p>`);
					} else return [
						(0, vue_exports.createVNode)("div", { class: "palette__field input-group" }, [(0, vue_exports.createVNode)("span", { class: "input-group__icon" }, [(0, vue_exports.createVNode)(Icon_default, {
							name: "search",
							size: 20
						})]), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
							ref_key: "input",
							ref: input,
							"onUpdate:modelValue": ($event) => query.value = $event,
							class: "input palette__input",
							type: "text",
							role: "combobox",
							"aria-label": "Suche und Befehle",
							"aria-autocomplete": "list",
							"aria-controls": "palette-list",
							"aria-expanded": entries.value.length > 0,
							"aria-activedescendant": activeId.value,
							placeholder: "Felge, Marke, Größe oder Seite",
							autocomplete: "off",
							autocapitalize: "off",
							spellcheck: "false",
							enterkeyhint: "go",
							onKeydown
						}, null, 40, [
							"onUpdate:modelValue",
							"aria-expanded",
							"aria-activedescendant"
						]), [[vue_exports.vModelText, query.value]])]),
						(0, vue_exports.createVNode)("div", {
							id: "palette-list",
							class: "palette__list",
							role: "listbox",
							"aria-label": "Ergebnisse",
							"aria-busy": (0, vue_exports.unref)(search).loading.value ? "true" : void 0
						}, [
							((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(groups.value, (group) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: group.label }, [(0, vue_exports.createVNode)("p", {
									class: "menu__label",
									role: "presentation"
								}, (0, vue_exports.toDisplayString)(group.label), 1), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(group.entries, (entry) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
										id: entry.id,
										key: entry.id,
										href: entry.href,
										role: "option",
										"aria-selected": entry.id === activeId.value,
										class: ["menu__item palette__item", { "palette__item--active": entry.id === activeId.value }],
										tabindex: "-1",
										onClick: (0, vue_exports.withModifiers)(($event) => go(entry), ["prevent"]),
										onMousemove: ($event) => active.value = entries.value.indexOf(entry)
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(Icon_default, {
											name: entry.icon,
											size: 20
										}, null, 8, ["name"]), (0, vue_exports.createVNode)("span", { class: "palette__text" }, [(0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(entry.label), 1), entry.sub ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: "small quiet"
										}, (0, vue_exports.toDisplayString)(entry.sub), 1)) : (0, vue_exports.createCommentVNode)("", true)])]),
										_: 2
									}, 1032, [
										"id",
										"href",
										"aria-selected",
										"class",
										"onClick",
										"onMousemove"
									]);
								}), 128))], 64);
							}), 128)),
							(0, vue_exports.unref)(search).loading.value && entries.value.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "palette__empty"
							}, "Suche läuft …")) : query.value.trim() !== "" && (0, vue_exports.unref)(search).result.value && (0, vue_exports.unref)(search).result.value.total === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 1,
								class: "palette__empty"
							}, [(0, vue_exports.createTextVNode)(" Nichts gefunden für „" + (0, vue_exports.toDisplayString)(query.value.trim()) + "“. ", 1), (0, vue_exports.unref)(search).result.value.suggestion ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
								key: 0,
								class: "link",
								type: "button",
								onClick: useSuggestion
							}, " Meintest du „" + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(search).result.value.suggestion) + "“? ", 1)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Versuch es mit einer Marke oder einer Größe, zum Beispiel „19 Zoll“ oder „8,5J“.")], 64))])) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.unref)(search).failed.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 2,
								class: "palette__empty"
							}, "Die Suche ist gerade nicht erreichbar. Versuch es gleich noch einmal.")) : (0, vue_exports.createCommentVNode)("", true),
							query.value.trim() === "" && recent.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createVNode)("p", {
								class: "menu__label",
								role: "presentation"
							}, "Zuletzt gesucht"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(recent.value, (term) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: term,
									class: "menu__item palette__item",
									type: "button",
									tabindex: "-1",
									onClick: ($event) => query.value = term
								}, [(0, vue_exports.createVNode)(Icon_default, {
									name: "clock",
									size: 20
								}), (0, vue_exports.createVNode)("span", null, (0, vue_exports.toDisplayString)(term), 1)], 8, ["onClick"]);
							}), 128))], 64)) : (0, vue_exports.createCommentVNode)("", true)
						], 8, ["aria-busy"]),
						(0, vue_exports.createVNode)("p", { class: "palette__hints small quiet" }, [
							(0, vue_exports.createVNode)(Kbd_default, { keys: ["↑", "↓"] }),
							(0, vue_exports.createTextVNode)(" wählen "),
							(0, vue_exports.createVNode)(Kbd_default, { keys: ["↵"] }),
							(0, vue_exports.createTextVNode)(" öffnen "),
							(0, vue_exports.createVNode)(Kbd_default, { keys: ["Esc"] }),
							(0, vue_exports.createTextVNode)(" schließen ")
						])
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/CommandPalette.vue
var _sfc_setup$2 = CommandPalette_vue_vue_type_script_setup_true_lang_default.setup;
CommandPalette_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/CommandPalette.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var CommandPalette_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CommandPalette_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-8c9aa9d9"]]);
//#endregion
//#region resources/js/Components/Chrome/ShortcutsDialog.vue?vue&type=script&setup=true&lang.ts
var ShortcutsDialog_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "ShortcutsDialog",
	__ssrInlineRender: true,
	setup(__props) {
		/** The shortcut list: opened with `?` or from the footer. */
		const shell = useShell();
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: (0, vue_exports.unref)(shell).helpOpen.value,
				"onUpdate:open": ($event) => (0, vue_exports.unref)(shell).helpOpen.value = $event,
				title: "Tastenkürzel",
				description: "Die Kürzel gelten überall, außer wenn du gerade in ein Feld schreibst."
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<dl class="shortcuts" data-v-533b9687${_scopeId}><dt data-v-533b9687${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["/"] }, null, _parent, _scopeId));
						_push(`</dt><dd data-v-533b9687${_scopeId}>Suche fokussieren</dd><dt data-v-533b9687${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, {
							keys: ["K"],
							modifier: ""
						}, null, _parent, _scopeId));
						_push(`</dt><dd data-v-533b9687${_scopeId}>Suche und Befehle öffnen</dd><dt data-v-533b9687${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["?"] }, null, _parent, _scopeId));
						_push(`</dt><dd data-v-533b9687${_scopeId}>Diese Liste</dd><dt data-v-533b9687${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["Esc"] }, null, _parent, _scopeId));
						_push(`</dt><dd data-v-533b9687${_scopeId}>Dialog oder Menü schließen</dd><dt data-v-533b9687${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["↑", "↓"] }, null, _parent, _scopeId));
						_push(`</dt><dd data-v-533b9687${_scopeId}>In Listen bewegen</dd><dt data-v-533b9687${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["↵"] }, null, _parent, _scopeId));
						_push(`</dt><dd data-v-533b9687${_scopeId}>Auswahl öffnen</dd><dt data-v-533b9687${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Kbd_default, { keys: ["F8"] }, null, _parent, _scopeId));
						_push(`</dt><dd data-v-533b9687${_scopeId}>Letzte Meldung</dd></dl>`);
					} else return [(0, vue_exports.createVNode)("dl", { class: "shortcuts" }, [
						(0, vue_exports.createVNode)("dt", null, [(0, vue_exports.createVNode)(Kbd_default, { keys: ["/"] })]),
						(0, vue_exports.createVNode)("dd", null, "Suche fokussieren"),
						(0, vue_exports.createVNode)("dt", null, [(0, vue_exports.createVNode)(Kbd_default, {
							keys: ["K"],
							modifier: ""
						})]),
						(0, vue_exports.createVNode)("dd", null, "Suche und Befehle öffnen"),
						(0, vue_exports.createVNode)("dt", null, [(0, vue_exports.createVNode)(Kbd_default, { keys: ["?"] })]),
						(0, vue_exports.createVNode)("dd", null, "Diese Liste"),
						(0, vue_exports.createVNode)("dt", null, [(0, vue_exports.createVNode)(Kbd_default, { keys: ["Esc"] })]),
						(0, vue_exports.createVNode)("dd", null, "Dialog oder Menü schließen"),
						(0, vue_exports.createVNode)("dt", null, [(0, vue_exports.createVNode)(Kbd_default, { keys: ["↑", "↓"] })]),
						(0, vue_exports.createVNode)("dd", null, "In Listen bewegen"),
						(0, vue_exports.createVNode)("dt", null, [(0, vue_exports.createVNode)(Kbd_default, { keys: ["↵"] })]),
						(0, vue_exports.createVNode)("dd", null, "Auswahl öffnen"),
						(0, vue_exports.createVNode)("dt", null, [(0, vue_exports.createVNode)(Kbd_default, { keys: ["F8"] })]),
						(0, vue_exports.createVNode)("dd", null, "Letzte Meldung")
					])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/ShortcutsDialog.vue
var _sfc_setup$1 = ShortcutsDialog_vue_vue_type_script_setup_true_lang_default.setup;
ShortcutsDialog_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/ShortcutsDialog.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var ShortcutsDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ShortcutsDialog_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-533b9687"]]);
//#endregion
//#region resources/js/Layouts/AppLayout.vue?vue&type=script&setup=true&lang.ts
var AppLayout_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AppLayout",
	__ssrInlineRender: true,
	props: { title: { default: void 0 } },
	setup(__props) {
		/**
		* The storefront frame: header, page, footer, and the overlays the shell
		* owns — the palette, the shortcut list, the vehicle sheet, the cookie choice, the toast.
		*
		* Everything the shell shares between its parts is provided here, so the footer's
		* "Cookie-Einstellungen" and the header's search icon open the very same dialogs. Every
		* navigation closes whatever is open, and so does the back button.
		*/
		const shared = useShared();
		const shopFeedback = useShopFeedback(() => Boolean(shared.value.reviewer));
		const shell = provideShell();
		const changeHref = useVehicleChangeHref();
		provideConsent(shared.value.consent ?? null);
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const vehicleSheet = (0, vue_exports.computed)({
			get: () => shell.vehicleOpen.value && vehicle.value !== null,
			set: (open) => {
				shell.vehicleOpen.value = open;
			}
		});
		useShortcuts({
			onSearch: () => shell.focusSearch(),
			onPalette: () => {
				shell.paletteOpen.value = !shell.paletteOpen.value;
			},
			onHelp: () => {
				shell.helpOpen.value = true;
			}
		});
		function closeAll() {
			shell.paletteOpen.value = false;
			shell.helpOpen.value = false;
			shell.vehicleOpen.value = false;
		}
		let stopNavigate;
		(0, vue_exports.onMounted)(() => {
			stopNavigate = router.on("navigate", closeAll);
		});
		(0, vue_exports.onBeforeUnmount)(() => stopNavigate?.());
		function removeVehicle() {
			router.delete("/fahrzeug", { preserveScroll: true });
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["shell", { "shell--vbar": vehicle.value !== null && ((0, vue_exports.unref)(shared).headerMode === "WHITE_BOX" || (0, vue_exports.unref)(shared).headerMode === "BLUE_BAR") }] }, _attrs))} data-v-79837321><a class="skip-link" href="#inhalt" data-v-79837321>Zum Inhalt springen</a>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(CanonicalLink_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(PreviewRibbon_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(SiteHeader_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(AddedPanel_default, null, null, _parent));
			_push(`<main id="inhalt" class="shell__main" data-v-79837321>`);
			(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent);
			_push(`</main>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(CompareTray_default, { hidden: (0, vue_exports.unref)(shell).stickyBar.value }, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(SiteFooter_default, null, null, _parent));
			if (vehicle.value) _push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
				open: vehicleSheet.value,
				"onUpdate:open": ($event) => vehicleSheet.value = $event,
				variant: "sheet",
				title: "Dein Fahrzeug"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p class="h4" data-v-79837321${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</p><p class="small muted num" data-v-79837321${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.approval ?? `${vehicle.value.buildWindow} · ${vehicle.value.keyNumbers}`)}</p><div class="shell__vehicle-actions" data-v-79837321${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: "/felgen",
							class: "btn btn--primary btn--block",
							prefetch: ""
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Passende Felgen anzeigen`);
								else return [(0, vue_exports.createTextVNode)("Passende Felgen anzeigen")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: (0, vue_exports.unref)(changeHref),
							class: "btn btn--secondary btn--block"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Fahrzeug ändern`);
								else return [(0, vue_exports.createTextVNode)("Fahrzeug ändern")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`<button class="btn btn--ghost btn--block" type="button" data-v-79837321${_scopeId}>Fahrzeug entfernen</button></div>`);
					} else return [
						(0, vue_exports.createVNode)("p", { class: "h4" }, (0, vue_exports.toDisplayString)(vehicle.value.label), 1),
						(0, vue_exports.createVNode)("p", { class: "small muted num" }, (0, vue_exports.toDisplayString)(vehicle.value.approval ?? `${vehicle.value.buildWindow} · ${vehicle.value.keyNumbers}`), 1),
						(0, vue_exports.createVNode)("div", { class: "shell__vehicle-actions" }, [
							(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
								href: "/felgen",
								class: "btn btn--primary btn--block",
								prefetch: ""
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Passende Felgen anzeigen")]),
								_: 1
							}),
							(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
								href: (0, vue_exports.unref)(changeHref),
								class: "btn btn--secondary btn--block"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Fahrzeug ändern")]),
								_: 1
							}, 8, ["href"]),
							(0, vue_exports.createVNode)("button", {
								class: "btn btn--ghost btn--block",
								type: "button",
								onClick: removeVehicle
							}, "Fahrzeug entfernen")
						])
					];
				}),
				_: 1
			}, _parent));
			else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(CommandPalette_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(ShortcutsDialog_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(CookieConsent_default, null, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(Toast_default, null, null, _parent));
			if ((0, vue_exports.unref)(shopFeedback) && (0, vue_exports.unref)(shared).reviewer) (0, server_renderer_exports.ssrRenderVNode)(_push, (0, vue_exports.createVNode)((0, vue_exports.resolveDynamicComponent)((0, vue_exports.unref)(shopFeedback)), null, null), _parent);
			else _push(`<!---->`);
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Layouts/AppLayout.vue
var _sfc_setup = AppLayout_vue_vue_type_script_setup_true_lang_default.setup;
AppLayout_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Layouts/AppLayout.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var AppLayout_default = /*#__PURE__*/ _plugin_vue_export_helper_default(AppLayout_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-79837321"]]);
//#endregion
export { AppLayout_default as t };
