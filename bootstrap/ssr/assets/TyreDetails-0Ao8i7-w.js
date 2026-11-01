import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { t as Dialog_default } from "./Dialog-Bv2Ro0-J.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as formatMoney } from "./num-Br8qlecZ.js";
import { s as withUnit } from "./format-6R0uUMt3.js";
import { t as TyreLabel_default } from "./TyreLabel-Dt9-zZ9f.js";
import { n as SeasonMark_default, t as TyrePicture_default } from "./TyrePicture-CtK6s6hO.js";
import { f as deliveryText } from "./shopDemo-CkuVaHdt.js";
import { o as setPrice } from "./komplettradSketch-BcLQsC6z.js";
//#region resources/js/Pages/Skizze/parts/TyreDetails.vue?vue&type=script&setup=true&lang.ts
var TyreDetails_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "TyreDetails",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		tyre: {},
		mode: {},
		chosen: { type: Boolean }
	}, {
		"open": {
			type: Boolean,
			required: true
		},
		"openModifiers": {}
	}),
	emits: /*@__PURE__*/ (0, vue_exports.mergeModels)(["choose"], ["update:open"]),
	setup(__props, { emit: __emit }) {
		/**
		* „Details" of one tyre (the brief §9): its pictures large — up to four per model, placeholders until the photographs
		* arrive — what load index and speed symbol mean, the whole EU tyre label, price and delivery, and „Auswählen".
		*/
		const props = __props;
		const open = (0, vue_exports.useModel)(__props, "open");
		const emit = __emit;
		const VIEWS = [
			"Seitenansicht",
			"Lauffläche",
			"Profil",
			"Schräg"
		];
		const view = (0, vue_exports.ref)(0);
		(0, vue_exports.watch)(open, (value) => {
			if (value) view.value = 0;
		});
		const LOAD = {
			92: withUnit(630, "kg"),
			94: withUnit(670, "kg")
		};
		const SPEED = {
			V: withUnit(240, "km/h"),
			W: withUnit(270, "km/h"),
			Y: withUnit(300, "km/h")
		};
		const views = (0, vue_exports.computed)(() => VIEWS.slice(0, Math.max(1, props.tyre?.photos ?? 1)));
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event,
				title: __props.tyre ? `${__props.tyre.brand} ${__props.tyre.model}` : "Reifen",
				description: "Bilder und Werte sind Beispiele und gehören zu keinem echten Reifen.",
				wide: ""
			}, _attrs), {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-8473f1fe${_scopeId}>Schließen</button><button class="btn btn--primary" type="button" data-v-8473f1fe${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.chosen ? "Ausgewählt" : "Diesen Reifen auswählen")}</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: ($event) => open.value = false
					}, "Schließen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						onClick: ($event) => {
							emit("choose");
							open.value = false;
						}
					}, (0, vue_exports.toDisplayString)(__props.chosen ? "Ausgewählt" : "Diesen Reifen auswählen"), 9, ["onClick"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.tyre) {
							_push(`<div class="kr-det" data-v-8473f1fe${_scopeId}><div class="kr-det__gallery" data-v-8473f1fe${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(TyrePicture_default, {
								size: __props.tyre.front.size,
								px: 240,
								caption: `Beispielbild · ${views.value[view.value] ?? ""}`
							}, null, _parent, _scopeId));
							if (views.value.length > 1) {
								_push(`<div class="kr-det__thumbs" role="group" aria-label="Ansichten" data-v-8473f1fe${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(views.value, (name, index) => {
									_push(`<button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", index === view.value)} data-v-8473f1fe${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(name)}</button>`);
								});
								_push(`<!--]--></div>`);
							} else _push(`<!---->`);
							_push(`<p class="t-small quiet" data-v-8473f1fe${_scopeId}>Bis zu vier Fotos je Reifenmodell.</p></div><div class="kr-det__facts" data-v-8473f1fe${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(SeasonMark_default, { season: __props.tyre.season }, null, _parent, _scopeId));
							_push(`<dl class="kr-det__list" data-v-8473f1fe${_scopeId}><div data-v-8473f1fe${_scopeId}><dt data-v-8473f1fe${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.mode === "mixed" && __props.tyre.rear ? "Vorne" : "Größe")}</dt><dd data-v-8473f1fe${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.front.size)} ${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.front.li)}${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.front.si)} · Lastindex ${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.front.li)}: bis ${(0, server_renderer_exports.ssrInterpolate)(LOAD[__props.tyre.front.li])} je Reifen · ${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.front.si)}: bis ${(0, server_renderer_exports.ssrInterpolate)(SPEED[__props.tyre.front.si])}</dd></div>`);
							if (__props.mode === "mixed" && __props.tyre.rear) _push(`<div data-v-8473f1fe${_scopeId}><dt data-v-8473f1fe${_scopeId}>Hinten</dt><dd data-v-8473f1fe${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.rear.size)} ${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.rear.li)}${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.rear.si)} · Lastindex ${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.rear.li)}: bis ${(0, server_renderer_exports.ssrInterpolate)(LOAD[__props.tyre.rear.li])} je Reifen · ${(0, server_renderer_exports.ssrInterpolate)(__props.tyre.rear.si)}: bis ${(0, server_renderer_exports.ssrInterpolate)(SPEED[__props.tyre.rear.si])}</dd></div>`);
							else _push(`<!---->`);
							_push(`<div data-v-8473f1fe${_scopeId}><dt data-v-8473f1fe${_scopeId}>Preis</dt><dd data-v-8473f1fe${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)((0, vue_exports.unref)(setPrice)(__props.tyre, __props.mode)))} für 4 Reifen`);
							if (__props.mode !== "mixed" || !__props.tyre.rear) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(__props.tyre.front.priceCents))} je Reifen<!--]-->`);
							else _push(`<!---->`);
							_push(`</dd></div><div data-v-8473f1fe${_scopeId}><dt data-v-8473f1fe${_scopeId}>Lieferung</dt><dd data-v-8473f1fe${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(deliveryText)(__props.tyre.delivery))}</dd></div></dl>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(TyreLabel_default, {
								fuel: __props.tyre.label.fuel,
								wet: __props.tyre.label.wet,
								"noise-db": __props.tyre.label.noiseDb,
								"noise-class": __props.tyre.label.noiseClass,
								title: `${__props.tyre.brand} ${__props.tyre.model} · ${__props.tyre.front.size} ${__props.tyre.front.li}${__props.tyre.front.si} · Beispielwerte`,
								"snow-grip": __props.tyre.label.snow,
								"ice-grip": __props.tyre.label.ice
							}, null, _parent, _scopeId));
							_push(`</div></div>`);
						} else _push(`<!---->`);
					} else return [__props.tyre ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
						key: 0,
						class: "kr-det"
					}, [(0, vue_exports.createVNode)("div", { class: "kr-det__gallery" }, [
						(0, vue_exports.createVNode)(TyrePicture_default, {
							size: __props.tyre.front.size,
							px: 240,
							caption: `Beispielbild · ${views.value[view.value] ?? ""}`
						}, null, 8, ["size", "caption"]),
						views.value.length > 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 0,
							class: "kr-det__thumbs",
							role: "group",
							"aria-label": "Ansichten"
						}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(views.value, (name, index) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
								key: name,
								class: "chip",
								type: "button",
								"aria-pressed": index === view.value,
								onClick: ($event) => view.value = index
							}, (0, vue_exports.toDisplayString)(name), 9, ["aria-pressed", "onClick"]);
						}), 128))])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("p", { class: "t-small quiet" }, "Bis zu vier Fotos je Reifenmodell.")
					]), (0, vue_exports.createVNode)("div", { class: "kr-det__facts" }, [
						(0, vue_exports.createVNode)(SeasonMark_default, { season: __props.tyre.season }, null, 8, ["season"]),
						(0, vue_exports.createVNode)("dl", { class: "kr-det__list" }, [
							(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("dt", null, (0, vue_exports.toDisplayString)(__props.mode === "mixed" && __props.tyre.rear ? "Vorne" : "Größe"), 1), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.tyre.front.size) + " " + (0, vue_exports.toDisplayString)(__props.tyre.front.li) + (0, vue_exports.toDisplayString)(__props.tyre.front.si) + " · Lastindex " + (0, vue_exports.toDisplayString)(__props.tyre.front.li) + ": bis " + (0, vue_exports.toDisplayString)(LOAD[__props.tyre.front.li]) + " je Reifen · " + (0, vue_exports.toDisplayString)(__props.tyre.front.si) + ": bis " + (0, vue_exports.toDisplayString)(SPEED[__props.tyre.front.si]), 1)]),
							__props.mode === "mixed" && __props.tyre.rear ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", { key: 0 }, [(0, vue_exports.createVNode)("dt", null, "Hinten"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.tyre.rear.size) + " " + (0, vue_exports.toDisplayString)(__props.tyre.rear.li) + (0, vue_exports.toDisplayString)(__props.tyre.rear.si) + " · Lastindex " + (0, vue_exports.toDisplayString)(__props.tyre.rear.li) + ": bis " + (0, vue_exports.toDisplayString)(LOAD[__props.tyre.rear.li]) + " je Reifen · " + (0, vue_exports.toDisplayString)(__props.tyre.rear.si) + ": bis " + (0, vue_exports.toDisplayString)(SPEED[__props.tyre.rear.si]), 1)])) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("dt", null, "Preis"), (0, vue_exports.createVNode)("dd", null, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)((0, vue_exports.unref)(setPrice)(__props.tyre, __props.mode))) + " für 4 Reifen", 1), __props.mode !== "mixed" || !__props.tyre.rear ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(__props.tyre.front.priceCents)) + " je Reifen", 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])]),
							(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("dt", null, "Lieferung"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(deliveryText)(__props.tyre.delivery)), 1)])
						]),
						(0, vue_exports.createVNode)(TyreLabel_default, {
							fuel: __props.tyre.label.fuel,
							wet: __props.tyre.label.wet,
							"noise-db": __props.tyre.label.noiseDb,
							"noise-class": __props.tyre.label.noiseClass,
							title: `${__props.tyre.brand} ${__props.tyre.model} · ${__props.tyre.front.size} ${__props.tyre.front.li}${__props.tyre.front.si} · Beispielwerte`,
							"snow-grip": __props.tyre.label.snow,
							"ice-grip": __props.tyre.label.ice
						}, null, 8, [
							"fuel",
							"wet",
							"noise-db",
							"noise-class",
							"title",
							"snow-grip",
							"ice-grip"
						])
					])])) : (0, vue_exports.createCommentVNode)("", true)];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Skizze/parts/TyreDetails.vue
var TyreDetails_exports = /* @__PURE__ */ __exportAll({ default: () => TyreDetails_default });
var _sfc_setup = TyreDetails_vue_vue_type_script_setup_true_lang_default.setup;
TyreDetails_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Skizze/parts/TyreDetails.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var TyreDetails_default = /*#__PURE__*/ _plugin_vue_export_helper_default(TyreDetails_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-8473f1fe"]]);
//#endregion
export { TyreDetails_exports as n, TyreDetails_default as t };
