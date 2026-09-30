import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-CVLYqE90.js";
import { a as link_default, c as router, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-CUJcjiDR.js";
import { t as decimal } from "./format-BSciVE2Q.js";
import { t as AdminState_default } from "./AdminState-Dv1vTfZV.js";
//#region resources/js/Pages/Admin/Fahrzeuge/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		review: { type: Boolean },
		vehicles: {},
		filters: {},
		makes: {},
		counts: {},
		pagination: {}
	},
	setup(__props) {
		/**
		* Fahrzeuge — every vehicle variant the shop knows (and, as „Zur Prüfung“, the ones still missing the
		* legal data a verdict needs, R-03). Found by name or HSN/TSN; each row says how many released
		* Gutachten rows name it.
		*/
		const props = __props;
		const BASE = (0, vue_exports.computed)(() => props.review ? "/admin/fahrzeuge/pruefung" : "/admin/fahrzeuge");
		const q = (0, vue_exports.ref)(props.filters.q);
		const marke = (0, vue_exports.ref)(props.filters.marke);
		const filtered = (0, vue_exports.computed)(() => props.filters.q !== "" || props.filters.marke !== "");
		const context = (0, vue_exports.computed)(() => {
			const n = props.pagination.total;
			const text = `${decimal(n, 0)} ${n === 1 ? "Fahrzeug" : "Fahrzeuge"}`;
			return filtered.value ? `${text} · gefiltert` : text;
		});
		function apply() {
			const query = {};
			if (q.value.trim()) query.q = q.value.trim();
			if (marke.value) query.marke = marke.value;
			router.get(BASE.value, query, {
				preserveScroll: true,
				preserveState: true
			});
		}
		function reset() {
			q.value = "";
			marke.value = "";
			router.get(BASE.value, {}, {
				preserveScroll: true,
				preserveState: true
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: __props.review ? "Zur Prüfung" : "Fahrzeuge",
				context: context.value
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.review) _push(`<p class="adm-note fz-intro" data-v-d91a7835${_scopeId}>Diesen Fahrzeugen fehlen Achslasten oder die Höchstgeschwindigkeit. Solange sie fehlen, zeigt der Shop für sie keine Felge als passend. Die Werte stehen in der Zulassungsbescheinigung (Felder 8.1, 8.2 und T).</p>`);
						else _push(`<!---->`);
						_push(`<nav class="fz-tabs" aria-label="Fahrzeuge" data-v-d91a7835${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: "/admin/fahrzeuge",
							class: "fz-tab",
							"aria-current": __props.review ? void 0 : "page"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Alle · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.counts.all, 0))}`);
								else return [(0, vue_exports.createTextVNode)("Alle · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.counts.all, 0)), 1)];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: "/admin/fahrzeuge/pruefung",
							class: "fz-tab",
							"aria-current": __props.review ? "page" : void 0
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Zur Prüfung · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.counts.review, 0))}`);
								else return [(0, vue_exports.createTextVNode)("Zur Prüfung · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.counts.review, 0)), 1)];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`</nav><form class="fz-search" role="search" data-v-d91a7835${_scopeId}><label class="visually-hidden" for="fz-q" data-v-d91a7835${_scopeId}>Fahrzeuge durchsuchen</label><input id="fz-q"${(0, server_renderer_exports.ssrRenderAttr)("value", q.value)} class="input" type="search" maxlength="80" placeholder="Marke, Modell oder HSN/TSN" autocomplete="off" data-v-d91a7835${_scopeId}><label class="visually-hidden" for="fz-marke" data-v-d91a7835${_scopeId}>Marke</label><select id="fz-marke" class="input fz-make" data-v-d91a7835${_scopeId}><option value="" data-v-d91a7835${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(marke.value) ? (0, server_renderer_exports.ssrLooseContain)(marke.value, "") : (0, server_renderer_exports.ssrLooseEqual)(marke.value, "")) ? " selected" : ""}${_scopeId}>Alle Marken</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.makes, (make) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", make)} data-v-d91a7835${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(marke.value) ? (0, server_renderer_exports.ssrLooseContain)(marke.value, make) : (0, server_renderer_exports.ssrLooseEqual)(marke.value, make)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(make)}</option>`);
						});
						_push(`<!--]--></select><button class="btn btn--secondary" type="submit" data-v-d91a7835${_scopeId}>Suchen</button>`);
						if (filtered.value) _push(`<button class="btn btn--ghost" type="button" data-v-d91a7835${_scopeId}>Zurücksetzen</button>`);
						else _push(`<!---->`);
						_push(`</form>`);
						if (__props.vehicles.length === 0 && filtered.value) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "filtered",
							total: __props.review ? __props.counts.review : __props.counts.all,
							onReset: reset
						}, null, _parent, _scopeId));
						else if (__props.vehicles.length === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: __props.review ? "Kein Fahrzeug wartet auf seine Angaben." : "Hier erscheint jedes Fahrzeug, sobald die Fahrzeugdaten eingespielt sind."
						}, null, _parent, _scopeId));
						else {
							_push(`<!--[--><div class="adm-panel" data-v-d91a7835${_scopeId}><table class="adm-table" data-v-d91a7835${_scopeId}><caption class="visually-hidden" data-v-d91a7835${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.review ? "Fahrzeuge zur Prüfung" : "Fahrzeuge")}, ${(0, server_renderer_exports.ssrInterpolate)(context.value)}</caption><thead data-v-d91a7835${_scopeId}><tr data-v-d91a7835${_scopeId}><th scope="col" data-v-d91a7835${_scopeId}>Fahrzeug</th><th scope="col" data-v-d91a7835${_scopeId}>HSN/TSN</th><th scope="col" data-v-d91a7835${_scopeId}>Bauzeitraum</th><th scope="col" class="num" data-v-d91a7835${_scopeId}>Freigaben</th><th scope="col" data-v-d91a7835${_scopeId}>Stand</th></tr></thead><tbody data-v-d91a7835${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.vehicles, (vehicle) => {
								_push(`<tr data-v-d91a7835${_scopeId}><td data-label="Fahrzeug" data-v-d91a7835${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: vehicle.href,
									class: "fz-name"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(vehicle.name)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(vehicle.name), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								_push(`<span class="fz-sub" data-v-d91a7835${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.variant)}`);
								if (vehicle.power) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(vehicle.power)}<!--]-->`);
								else _push(`<!---->`);
								_push(`</span></td><td data-label="HSN/TSN" class="fz-keys" data-v-d91a7835${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.keys)}</td><td data-label="Bauzeitraum" data-v-d91a7835${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(vehicle.window)}</td><td data-label="Freigaben" class="num" data-v-d91a7835${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(vehicle.approvals, 0))}</td><td data-label="Stand" data-phone="status" data-v-d91a7835${_scopeId}>`);
								if (vehicle.needsReview) _push(`<span class="adm-tag adm-tag--warn" data-v-d91a7835${_scopeId}>Angaben fehlen</span>`);
								else _push(`<!--[-->Vollständig<!--]-->`);
								_push(`</td></tr>`);
							});
							_push(`<!--]--></tbody></table></div>`);
							if (__props.pagination.last > 1) {
								_push(`<nav class="fz-pages" aria-label="Seiten der Fahrzeuge" data-v-d91a7835${_scopeId}>`);
								if (__props.pagination.prev) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: __props.pagination.prev,
									class: "btn btn--secondary",
									"preserve-scroll": ""
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
												name: "chevron-left",
												size: 16
											}, null, _parent, _scopeId));
											_push(` Vorherige `);
										} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "chevron-left",
											size: 16
										}), (0, vue_exports.createTextVNode)(" Vorherige ")];
									}),
									_: 1
								}, _parent, _scopeId));
								else _push(`<span aria-hidden="true" data-v-d91a7835${_scopeId}></span>`);
								_push(`<p class="fz-pages__where" data-v-d91a7835${_scopeId}>Seite ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.pagination.current, 0))} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.pagination.last, 0))}</p>`);
								if (__props.pagination.next) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: __props.pagination.next,
									class: "btn btn--secondary",
									"preserve-scroll": ""
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) {
											_push(` Nächste `);
											_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
												name: "chevron-right",
												size: 16
											}, null, _parent, _scopeId));
										} else return [(0, vue_exports.createTextVNode)(" Nächste "), (0, vue_exports.createVNode)(AdminIcon_default, {
											name: "chevron-right",
											size: 16
										})];
									}),
									_: 1
								}, _parent, _scopeId));
								else _push(`<span aria-hidden="true" data-v-d91a7835${_scopeId}></span>`);
								_push(`</nav>`);
							} else _push(`<!---->`);
							_push(`<!--]-->`);
						}
					} else return [
						__props.review ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-note fz-intro"
						}, "Diesen Fahrzeugen fehlen Achslasten oder die Höchstgeschwindigkeit. Solange sie fehlen, zeigt der Shop für sie keine Felge als passend. Die Werte stehen in der Zulassungsbescheinigung (Felder 8.1, 8.2 und T).")) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("nav", {
							class: "fz-tabs",
							"aria-label": "Fahrzeuge"
						}, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
							href: "/admin/fahrzeuge",
							class: "fz-tab",
							"aria-current": __props.review ? void 0 : "page"
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Alle · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.counts.all, 0)), 1)]),
							_: 1
						}, 8, ["aria-current"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
							href: "/admin/fahrzeuge/pruefung",
							class: "fz-tab",
							"aria-current": __props.review ? "page" : void 0
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Zur Prüfung · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.counts.review, 0)), 1)]),
							_: 1
						}, 8, ["aria-current"])]),
						(0, vue_exports.createVNode)("form", {
							class: "fz-search",
							role: "search",
							onSubmit: (0, vue_exports.withModifiers)(apply, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("label", {
								class: "visually-hidden",
								for: "fz-q"
							}, "Fahrzeuge durchsuchen"),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								id: "fz-q",
								"onUpdate:modelValue": ($event) => q.value = $event,
								class: "input",
								type: "search",
								maxlength: "80",
								placeholder: "Marke, Modell oder HSN/TSN",
								autocomplete: "off"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, q.value]]),
							(0, vue_exports.createVNode)("label", {
								class: "visually-hidden",
								for: "fz-marke"
							}, "Marke"),
							(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
								id: "fz-marke",
								"onUpdate:modelValue": ($event) => marke.value = $event,
								class: "input fz-make"
							}, [(0, vue_exports.createVNode)("option", { value: "" }, "Alle Marken"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.makes, (make) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
									key: make,
									value: make
								}, (0, vue_exports.toDisplayString)(make), 9, ["value"]);
							}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, marke.value]]),
							(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "submit"
							}, "Suchen"),
							filtered.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
								key: 0,
								class: "btn btn--ghost",
								type: "button",
								onClick: reset
							}, "Zurücksetzen")) : (0, vue_exports.createCommentVNode)("", true)
						], 32),
						__props.vehicles.length === 0 && filtered.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 1,
							kind: "filtered",
							total: __props.review ? __props.counts.review : __props.counts.all,
							onReset: reset
						}, null, 8, ["total"])) : __props.vehicles.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 2,
							kind: "empty",
							text: __props.review ? "Kein Fahrzeug wartet auf seine Angaben." : "Hier erscheint jedes Fahrzeug, sobald die Fahrzeugdaten eingespielt sind."
						}, null, 8, ["text"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createVNode)("div", { class: "adm-panel" }, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [
							(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, (0, vue_exports.toDisplayString)(__props.review ? "Fahrzeuge zur Prüfung" : "Fahrzeuge") + ", " + (0, vue_exports.toDisplayString)(context.value), 1),
							(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Fahrzeug"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "HSN/TSN"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Bauzeitraum"),
								(0, vue_exports.createVNode)("th", {
									scope: "col",
									class: "num"
								}, "Freigaben"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Stand")
							])]),
							(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.vehicles, (vehicle) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: vehicle.id }, [
									(0, vue_exports.createVNode)("td", { "data-label": "Fahrzeug" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
										href: vehicle.href,
										class: "fz-name"
									}, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(vehicle.name), 1)]),
										_: 2
									}, 1032, ["href"]), (0, vue_exports.createVNode)("span", { class: "fz-sub" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(vehicle.variant), 1), vehicle.power ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(vehicle.power), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])]),
									(0, vue_exports.createVNode)("td", {
										"data-label": "HSN/TSN",
										class: "fz-keys"
									}, (0, vue_exports.toDisplayString)(vehicle.keys), 1),
									(0, vue_exports.createVNode)("td", { "data-label": "Bauzeitraum" }, (0, vue_exports.toDisplayString)(vehicle.window), 1),
									(0, vue_exports.createVNode)("td", {
										"data-label": "Freigaben",
										class: "num"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(vehicle.approvals, 0)), 1),
									(0, vue_exports.createVNode)("td", {
										"data-label": "Stand",
										"data-phone": "status"
									}, [vehicle.needsReview ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "adm-tag adm-tag--warn"
									}, "Angaben fehlen")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Vollständig")], 64))])
								]);
							}), 128))])
						])]), __props.pagination.last > 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("nav", {
							key: 0,
							class: "fz-pages",
							"aria-label": "Seiten der Fahrzeuge"
						}, [
							__props.pagination.prev ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
								key: 0,
								href: __props.pagination.prev,
								class: "btn btn--secondary",
								"preserve-scroll": ""
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "chevron-left",
									size: 16
								}), (0, vue_exports.createTextVNode)(" Vorherige ")]),
								_: 1
							}, 8, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 1,
								"aria-hidden": "true"
							})),
							(0, vue_exports.createVNode)("p", { class: "fz-pages__where" }, "Seite " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.pagination.current, 0)) + " von " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.pagination.last, 0)), 1),
							__props.pagination.next ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
								key: 2,
								href: __props.pagination.next,
								class: "btn btn--secondary",
								"preserve-scroll": ""
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)(" Nächste "), (0, vue_exports.createVNode)(AdminIcon_default, {
									name: "chevron-right",
									size: 16
								})]),
								_: 1
							}, 8, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 3,
								"aria-hidden": "true"
							}))
						])) : (0, vue_exports.createCommentVNode)("", true)], 64))
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Fahrzeuge/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Fahrzeuge/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-d91a7835"]]);
//#endregion
export { Index_default as default };
