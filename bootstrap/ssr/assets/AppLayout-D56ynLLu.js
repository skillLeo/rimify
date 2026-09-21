import { n as link_default, s as vue_exports } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { t as Icon_default } from "./Icon--IDqhJtF.js";
import { n as useMenus, r as useShared, t as resolveHref } from "./useShared-Cs__JTYP.js";
//#region resources/js/Components/Chrome/SiteFooter.vue?vue&type=script&setup=true&lang.ts
var SiteFooter_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "SiteFooter",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The footer.
		*
		* Its job is to answer the three questions a German shopper checks before paying: who is behind
		* this shop, how do I reach a person, and what happens if I want to send it back. So the first
		* column is a real phone number with real hours rather than a row of reassuring icons — a claim
		* with a number behind it is worth more than four claims without one.
		*/
		const shared = useShared();
		const menus = useMenus();
		const contact = (0, vue_exports.computed)(() => shared.value.contact);
		const telHref = (0, vue_exports.computed)(() => `tel:${(contact.value?.phoneIntl ?? "").replace(/\s/g, "")}`);
		const year = (/* @__PURE__ */ new Date()).getFullYear();
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<footer${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "ftr" }, _attrs))} data-v-0455469c><div class="ftr__cols" data-v-0455469c><div data-v-0455469c><span class="wordmark wordmark--light" data-v-0455469c>RIMIFY</span><p class="ftr__company" data-v-0455469c> Felgen und Kompletträder mit geprüfter Freigabe für dein Fahrzeug. </p>`);
			if (contact.value) {
				_push(`<!--[--><p class="ftr__head" data-v-0455469c>Wir sind erreichbar</p><a class="ftr__phone"${(0, server_renderer_exports.ssrRenderAttr)("href", telHref.value)} data-v-0455469c>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "phone",
					size: 20
				}, null, _parent));
				_push(` ${(0, server_renderer_exports.ssrInterpolate)(contact.value.phone)}</a><p class="ftr__hours" data-v-0455469c>${(0, server_renderer_exports.ssrInterpolate)(contact.value.hours)}</p><a class="ftr__mail"${(0, server_renderer_exports.ssrRenderAttr)("href", `mailto:${contact.value.email}`)} data-v-0455469c>${(0, server_renderer_exports.ssrInterpolate)(contact.value.email)}</a><!--]-->`);
			} else _push(`<!---->`);
			_push(`</div><div data-v-0455469c><p class="ftr__head" data-v-0455469c>Seiten</p><ul class="ftr__list" data-v-0455469c><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(menus).footer_pages, (item) => {
				_push(`<li data-v-0455469c>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: item.href }, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(item.label)}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label), 1)];
					}),
					_: 2
				}, _parent));
				_push(`</li>`);
			});
			_push(`<!--]--></ul></div><div data-v-0455469c><p class="ftr__head" data-v-0455469c>Rechtliches</p><ul class="ftr__list" data-v-0455469c><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(menus).footer_legal, (item) => {
				_push(`<li data-v-0455469c>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: item.href }, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(item.label)}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label), 1)];
					}),
					_: 2
				}, _parent));
				_push(`</li>`);
			});
			_push(`<!--]--></ul></div><div data-v-0455469c><p class="ftr__head" data-v-0455469c>Kauf bei RIMIFY</p><ul class="ftr__list ftr__facts" data-v-0455469c><li data-v-0455469c>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "truck",
				size: 20
			}, null, _parent));
			_push(` Versand aus Deutschland, versichert mit DHL </li><li data-v-0455469c>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "document",
				size: 20
			}, null, _parent));
			_push(` Gutachten zu jeder Felge als PDF </li><li data-v-0455469c>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "shield",
				size: 20
			}, null, _parent));
			_push(` 14 Tage Widerrufsrecht auf unmontierte Ware </li></ul></div></div><div class="ftr__base" data-v-0455469c><span data-v-0455469c>© RIMIFY ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(year))}</span><span data-v-0455469c>Alle Preise inkl. MwSt., zzgl. Versand</span></div></footer>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/SiteFooter.vue
var _sfc_setup$3 = SiteFooter_vue_vue_type_script_setup_true_lang_default.setup;
SiteFooter_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/SiteFooter.vue");
	return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var SiteFooter_default = /*#__PURE__*/ _plugin_vue_export_helper_default(SiteFooter_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-0455469c"]]);
//#endregion
//#region resources/js/Components/Chrome/SiteHeader.vue?vue&type=script&setup=true&lang.ts
var SiteHeader_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "SiteHeader",
	__ssrInlineRender: true,
	emits: ["open-menu", "open-vehicle"],
	setup(__props) {
		/**
		* The header.
		*
		* White, sticky, one hairline, and it lifts only once the page has scrolled under it — the one
		* static-looking element allowed a shadow, because at that moment it genuinely floats above the
		* content.
		*
		* Two rules it must never break:
		*
		*  - The navigation is never removed. Choosing a vehicle changes what the pages show, not whether
		*    the customer can still reach the rest of the site.
		*  - The chosen vehicle is one chip, in one place, on every route. `headerMode` arrives from the
		*    server in the first response (R-08) and decides whether the chip is shown, never what shape
		*    it takes — a header that rearranges itself between pages reads as two different sites.
		*/
		const shared = useShared();
		const menus = useMenus();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const showVehicle = (0, vue_exports.computed)(() => vehicle.value !== null && shared.value.headerMode !== "SUPPRESSED");
		const items = (0, vue_exports.computed)(() => menus.value.header.map((item) => ({
			...item,
			target: resolveHref(item.href, item.behaviour, vehicle.value !== null, "/felgen")
		})));
		const lifted = (0, vue_exports.ref)(false);
		function onScroll() {
			lifted.value = window.scrollY > 4;
		}
		(0, vue_exports.onMounted)(() => {
			onScroll();
			window.addEventListener("scroll", onScroll, { passive: true });
		});
		(0, vue_exports.onBeforeUnmount)(() => window.removeEventListener("scroll", onScroll));
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<header${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: ["hdr", { "hdr--lifted": lifted.value }] }, _attrs))} data-v-5878f583><div class="hdr__bar" data-v-5878f583><button class="hdr__icon mobile-only" type="button" aria-label="Menü öffnen" data-v-5878f583>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
				name: "menu",
				size: 24
			}, null, _parent));
			_push(`</button>`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/",
				class: "wordmark",
				"aria-label": "RIMIFY — Startseite"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`RIMIFY`);
					else return [(0, vue_exports.createTextVNode)("RIMIFY")];
				}),
				_: 1
			}, _parent));
			_push(`<nav class="hdr__nav" aria-label="Hauptnavigation" data-v-5878f583><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(items.value, (item) => {
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					key: item.label,
					href: item.target,
					class: "hdr__link",
					"aria-current": (0, vue_exports.unref)(shared).routeName === item.routeName ? "page" : void 0
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(item.label)}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label), 1)];
					}),
					_: 2
				}, _parent));
			});
			_push(`<!--]--></nav>`);
			if (showVehicle.value && vehicle.value) {
				_push(`<button class="vchip desktop-only" type="button" data-v-5878f583>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "wheel",
					size: 20
				}, null, _parent));
				_push(`<span class="vchip__name" data-v-5878f583>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.label)}</span><span class="vchip__keys" data-v-5878f583>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.keyNumbers)}</span>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "chevron-down",
					size: 20
				}, null, _parent));
				_push(`</button>`);
			} else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
				href: "/warenkorb",
				class: "hdr__cart",
				"aria-label": "Warenkorb"
			}, {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "cart",
							size: 24
						}, null, _parent, _scopeId));
						_push(`<span class="hdr__cart-label desktop-only" data-v-5878f583${_scopeId}>Warenkorb</span>`);
						if ((0, vue_exports.unref)(shared).cartCount > 0) _push(`<span class="hdr__badge" data-v-5878f583${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(shared).cartCount)}</span>`);
						else _push(`<!---->`);
					} else return [
						(0, vue_exports.createVNode)(Icon_default, {
							name: "cart",
							size: 24
						}),
						(0, vue_exports.createVNode)("span", { class: "hdr__cart-label desktop-only" }, "Warenkorb"),
						(0, vue_exports.unref)(shared).cartCount > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
							key: 0,
							class: "hdr__badge"
						}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(shared).cartCount), 1)) : (0, vue_exports.createCommentVNode)("", true)
					];
				}),
				_: 1
			}, _parent));
			_push(`</div>`);
			if (showVehicle.value && vehicle.value) {
				_push(`<div class="hdr__vrow mobile-only" data-v-5878f583><button class="vchip vchip--full" type="button" data-v-5878f583>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "wheel",
					size: 20
				}, null, _parent));
				_push(`<span class="vchip__name" data-v-5878f583>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.short)}</span><span class="vchip__keys" data-v-5878f583>${(0, server_renderer_exports.ssrInterpolate)(vehicle.value.keyNumbers)}</span>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "chevron-down",
					size: 20
				}, null, _parent));
				_push(`</button></div>`);
			} else _push(`<!---->`);
			_push(`</header>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/SiteHeader.vue
var _sfc_setup$2 = SiteHeader_vue_vue_type_script_setup_true_lang_default.setup;
SiteHeader_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/SiteHeader.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var SiteHeader_default = /*#__PURE__*/ _plugin_vue_export_helper_default(SiteHeader_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-5878f583"]]);
//#endregion
//#region resources/js/Components/Chrome/Toast.vue?vue&type=script&setup=true&lang.ts
var Toast_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Toast",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* The toast.
		*
		* Confirmations only — never a failure, and never a conflict. Anything the customer needs to act
		* on stays on the page as a row or a panel, because a toast that scrolls away is a message nobody
		* can go back and read.
		*
		* It is polite, not assertive: adding a wheel to the basket should not interrupt a screen reader
		* mid-sentence.
		*/
		const shared = useShared();
		const message = (0, vue_exports.ref)(null);
		let timer;
		(0, vue_exports.watch)(() => shared.value.flash?.toast ?? null, (next) => {
			if (next === null || next === "") return;
			message.value = next;
			if (timer !== void 0) clearTimeout(timer);
			timer = setTimeout(() => {
				message.value = null;
			}, 4e3);
		}, { immediate: true });
		return (_ctx, _push, _parent, _attrs) => {
			if (message.value) {
				_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
					class: "toast",
					role: "status",
					"aria-live": "polite"
				}, _attrs))} data-v-36abece4>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "check-circle",
					size: 20
				}, null, _parent));
				_push(` ${(0, server_renderer_exports.ssrInterpolate)(message.value)} <button class="toast__close" type="button" aria-label="Schließen" data-v-36abece4>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "close",
					size: 20
				}, null, _parent));
				_push(`</button></div>`);
			} else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Chrome/Toast.vue
var _sfc_setup$1 = Toast_vue_vue_type_script_setup_true_lang_default.setup;
Toast_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Chrome/Toast.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var Toast_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Toast_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-36abece4"]]);
//#endregion
//#region resources/js/Layouts/AppLayout.vue?vue&type=script&setup=true&lang.ts
var AppLayout_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "AppLayout",
	__ssrInlineRender: true,
	props: { title: { default: void 0 } },
	setup(__props) {
		/**
		* The storefront frame: header, page, footer, and the two overlays the header can open.
		*
		* There is no bottom tab bar. Navigation on a phone lives in a drawer behind the menu button:
		* a fixed bar would spend a fifth of an 844px screen on chrome that is used occasionally, and the
		* product page needs the bottom edge for its price and its one real action.
		*
		* Both overlays live here rather than in the header so that Esc has one owner and focus returns
		* to one place.
		*/
		const shared = useShared();
		const menus = useMenus();
		const menuOpen = (0, vue_exports.ref)(false);
		const vehicleOpen = (0, vue_exports.ref)(false);
		const anyOpen = (0, vue_exports.computed)(() => menuOpen.value || vehicleOpen.value);
		const sheetItems = (0, vue_exports.computed)(() => menus.value.header.map((item) => ({
			...item,
			target: resolveHref(item.href, item.behaviour, shared.value.vehicle !== null, "/felgen")
		})));
		function closeAll() {
			menuOpen.value = false;
			vehicleOpen.value = false;
		}
		function onKeydown(event) {
			if (event.key === "Escape") closeAll();
		}
		(0, vue_exports.onMounted)(() => document.addEventListener("keydown", onKeydown));
		(0, vue_exports.onBeforeUnmount)(() => {
			document.removeEventListener("keydown", onKeydown);
			document.body.style.removeProperty("overflow");
		});
		(0, vue_exports.watch)(anyOpen, (open) => {
			document.body.style.overflow = open ? "hidden" : "";
		});
		(0, vue_exports.watch)(() => shared.value.routeName, closeAll);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "shell" }, _attrs))} data-v-bb9f9d54><a class="skip-link" href="#inhalt" data-v-bb9f9d54>Zum Inhalt springen</a>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(SiteHeader_default, {
				onOpenMenu: ($event) => menuOpen.value = true,
				onOpenVehicle: ($event) => vehicleOpen.value = true
			}, null, _parent));
			_push(`<main id="inhalt" class="shell__main" data-v-bb9f9d54>`);
			(0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent);
			_push(`</main>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(SiteFooter_default, null, null, _parent));
			if (menuOpen.value) {
				_push(`<!--[--><div class="scrim" data-v-bb9f9d54></div><div class="drawer" role="dialog" aria-modal="true" aria-label="Menü" data-v-bb9f9d54><div class="between" data-v-bb9f9d54><span class="t-h3" data-v-bb9f9d54>Menü</span><button class="hdr__icon" type="button" aria-label="Schließen" data-v-bb9f9d54>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: "close",
					size: 24
				}, null, _parent));
				_push(`</button></div><nav class="drawer__nav" data-v-bb9f9d54><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(sheetItems.value, (item) => {
					_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						key: item.label,
						href: item.target,
						class: "drawer__link"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push(`${(0, server_renderer_exports.ssrInterpolate)(item.label)} `);
								_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
									name: "chevron-right",
									size: 20
								}, null, _parent, _scopeId));
							} else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.label) + " ", 1), (0, vue_exports.createVNode)(Icon_default, {
								name: "chevron-right",
								size: 20
							})];
						}),
						_: 2
					}, _parent));
				});
				_push(`<!--]--></nav></div><!--]-->`);
			} else _push(`<!---->`);
			if (vehicleOpen.value && (0, vue_exports.unref)(shared).vehicle) {
				_push(`<!--[--><div class="scrim" data-v-bb9f9d54></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Fahrzeug" data-v-bb9f9d54><div class="sheet__grab" data-v-bb9f9d54></div><span class="micro" data-v-bb9f9d54>Gewähltes Fahrzeug</span><p class="t-h3 sheet__vehicle" data-v-bb9f9d54>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(shared).vehicle.label)}</p><p class="data" data-v-bb9f9d54>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(shared).vehicle.keyNumbers)} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(shared).vehicle.buildWindow)}</p><div class="sheet__actions" data-v-bb9f9d54>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen-suchen",
					class: "btn btn--primary btn--block"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Fahrzeug ändern`);
						else return [(0, vue_exports.createTextVNode)("Fahrzeug ändern")];
					}),
					_: 1
				}, _parent));
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/fahrzeug",
					method: "delete",
					as: "button",
					class: "btn btn--secondary btn--block"
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(` Fahrzeug entfernen `);
						else return [(0, vue_exports.createTextVNode)(" Fahrzeug entfernen ")];
					}),
					_: 1
				}, _parent));
				_push(`</div></div><!--]-->`);
			} else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(Toast_default, null, null, _parent));
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
var AppLayout_default = /*#__PURE__*/ _plugin_vue_export_helper_default(AppLayout_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-bb9f9d54"]]);
//#endregion
export { AppLayout_default as t };
