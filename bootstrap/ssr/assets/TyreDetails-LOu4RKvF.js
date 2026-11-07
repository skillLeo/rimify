import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { t as Dialog_default } from "./Dialog-Hg9IsA0U.js";
import { d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as Picture_default } from "./Picture-BCiP7qkM.js";
import { t as TyreLabel_default } from "./TyreLabel-Clkw8grh.js";
import { n as SeasonMark_default, t as TyreSilhouette_default } from "./TyreSilhouette-cwM27VIO.js";
//#region resources/js/Pages/Komplettrad/parts/TyreDetails.vue?vue&type=script&setup=true&lang.ts
var TyreDetails_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "TyreDetails",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		card: {},
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
		* „Details“ of one tyre (the Gutachten rework §9): its photographs large, or the neutral outline; what load index and speed symbol stand
		* for; the whole EU tyre label; price and availability; and „Auswählen“. One column at every width, and nothing runs past the dialog:
		* at 390 px the facts wrap, the label stays as wide as the dialog lets it.
		*/
		const props = __props;
		const open = (0, vue_exports.useModel)(__props, "open");
		const emit = __emit;
		const view = (0, vue_exports.ref)(0);
		(0, vue_exports.watch)(open, (value) => {
			if (value) view.value = 0;
		});
		const title = (0, vue_exports.computed)(() => props.card ? [props.card.brands.join(" · "), props.card.name].filter(Boolean).join(" ") : "Reifen");
		const failed = (0, vue_exports.reactive)(/* @__PURE__ */ new Set());
		const shots = (0, vue_exports.computed)(() => (props.card?.photos ?? []).filter((item) => !failed.has(item.name)));
		const photo = (0, vue_exports.computed)(() => shots.value[view.value] ?? shots.value[0] ?? null);
		const labels = (0, vue_exports.computed)(() => (props.card?.sides ?? []).filter((side) => side.eu !== null));
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event,
				title: title.value,
				"content-class": "tc-details",
				wide: ""
			}, _attrs), {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<button class="btn btn--secondary" type="button" data-v-27761ca2${_scopeId}>Schließen</button>`);
						if (!__props.chosen) _push(`<button class="btn btn--primary" type="button" data-v-27761ca2${_scopeId}>Auswählen</button>`);
						else _push(`<!---->`);
					} else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: ($event) => open.value = false
					}, "Schließen", 8, ["onClick"]), !__props.chosen ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
						key: 0,
						class: "btn btn--primary",
						type: "button",
						onClick: ($event) => {
							emit("choose");
							open.value = false;
						}
					}, "Auswählen", 8, ["onClick"])) : (0, vue_exports.createCommentVNode)("", true)];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.card) {
							_push(`<div class="td" data-v-27761ca2${_scopeId}><div class="td__gallery" data-v-27761ca2${_scopeId}><div class="td__picture" data-v-27761ca2${_scopeId}>`);
							if (photo.value) _push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
								key: photo.value.name,
								image: photo.value,
								alt: String(photo.value.alt ?? ""),
								sizes: "(min-width: 768px) 560px, 90vw"
							}, null, _parent, _scopeId));
							else _push((0, server_renderer_exports.ssrRenderComponent)(TyreSilhouette_default, null, null, _parent, _scopeId));
							_push(`</div>`);
							if (shots.value.length > 1) {
								_push(`<div class="td__thumbs" role="group" aria-label="Ansichten" data-v-27761ca2${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(shots.value, (item, index) => {
									_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([{ "td__thumb--on": index === view.value }, "td__thumb"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", index === view.value)}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", String(item.alt ?? `Ansicht ${index + 1}`))} data-v-27761ca2${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
										image: item,
										alt: "",
										sizes: "64px"
									}, null, _parent, _scopeId));
									_push(`</button>`);
								});
								_push(`<!--]--></div>`);
							} else _push(`<!---->`);
							_push(`</div><div class="td__facts" data-v-27761ca2${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(SeasonMark_default, { season: __props.card.season }, null, _parent, _scopeId));
							_push(`<dl class="td__list" data-v-27761ca2${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.card.sides, (side) => {
								_push(`<div data-v-27761ca2${_scopeId}><dt data-v-27761ca2${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(side.axle === "vorne" ? "Vorne" : side.axle === "hinten" ? "Hinten" : side.axle === "vorne und hinten" ? "Vorne und hinten" : "Größe")}</dt><dd data-v-27761ca2${_scopeId}>`);
								if (side.line) _push(`<span class="td__line" translate="no" data-v-27761ca2${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(side.line)}</span>`);
								else _push(`<!---->`);
								_push(`<span class="td__size" translate="no" data-v-27761ca2${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(side.size)}</span>`);
								if (side.facts) _push(`<span class="td__meaning" data-v-27761ca2${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(side.facts)}</span>`);
								else _push(`<!---->`);
								_push(`</dd></div>`);
							});
							_push(`<!--]--><div data-v-27761ca2${_scopeId}><dt data-v-27761ca2${_scopeId}>Preis</dt><dd data-v-27761ca2${_scopeId}><span class="td__size" translate="no" data-v-27761ca2${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.card.set)}</span><span class="td__meaning" data-v-27761ca2${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.card.unit)} · ${(0, server_renderer_exports.ssrInterpolate)(__props.card.each)}</span></dd></div><div data-v-27761ca2${_scopeId}><dt data-v-27761ca2${_scopeId}>Verfügbarkeit</dt><dd data-v-27761ca2${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.card.isDemo ? "Beispielsortiment" : "Verfügbar")}</dd></div></dl><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(labels.value, (side) => {
								_push((0, server_renderer_exports.ssrRenderComponent)(TyreLabel_default, (0, vue_exports.mergeProps)({ key: side.eu.eprelId }, { ref_for: true }, side.eu, { class: "td__label" }), null, _parent, _scopeId));
							});
							_push(`<!--]--></div></div>`);
						} else _push(`<!---->`);
					} else return [__props.card ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
						key: 0,
						class: "td"
					}, [(0, vue_exports.createVNode)("div", { class: "td__gallery" }, [(0, vue_exports.createVNode)("div", {
						class: "td__picture",
						onErrorCapture: ($event) => photo.value && failed.add(photo.value.name)
					}, [photo.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(Picture_default, {
						key: photo.value.name,
						image: photo.value,
						alt: String(photo.value.alt ?? ""),
						sizes: "(min-width: 768px) 560px, 90vw"
					}, null, 8, ["image", "alt"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(TyreSilhouette_default, { key: 1 }))], 40, ["onErrorCapture"]), shots.value.length > 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
						key: 0,
						class: "td__thumbs",
						role: "group",
						"aria-label": "Ansichten"
					}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(shots.value, (item, index) => {
						return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
							key: item.name,
							class: ["td__thumb", { "td__thumb--on": index === view.value }],
							type: "button",
							"aria-pressed": index === view.value,
							"aria-label": String(item.alt ?? `Ansicht ${index + 1}`),
							onClick: ($event) => view.value = index
						}, [(0, vue_exports.createVNode)(Picture_default, {
							image: item,
							alt: "",
							sizes: "64px"
						}, null, 8, ["image"])], 10, [
							"aria-pressed",
							"aria-label",
							"onClick"
						]);
					}), 128))])) : (0, vue_exports.createCommentVNode)("", true)]), (0, vue_exports.createVNode)("div", { class: "td__facts" }, [
						(0, vue_exports.createVNode)(SeasonMark_default, { season: __props.card.season }, null, 8, ["season"]),
						(0, vue_exports.createVNode)("dl", { class: "td__list" }, [
							((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.card.sides, (side) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", { key: `${side.axle}-${side.size}` }, [(0, vue_exports.createVNode)("dt", null, (0, vue_exports.toDisplayString)(side.axle === "vorne" ? "Vorne" : side.axle === "hinten" ? "Hinten" : side.axle === "vorne und hinten" ? "Vorne und hinten" : "Größe"), 1), (0, vue_exports.createVNode)("dd", null, [
									side.line ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "td__line",
										translate: "no"
									}, (0, vue_exports.toDisplayString)(side.line), 1)) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)("span", {
										class: "td__size",
										translate: "no"
									}, (0, vue_exports.toDisplayString)(side.size), 1),
									side.facts ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 1,
										class: "td__meaning"
									}, (0, vue_exports.toDisplayString)(side.facts), 1)) : (0, vue_exports.createCommentVNode)("", true)
								])]);
							}), 128)),
							(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("dt", null, "Preis"), (0, vue_exports.createVNode)("dd", null, [(0, vue_exports.createVNode)("span", {
								class: "td__size",
								translate: "no"
							}, (0, vue_exports.toDisplayString)(__props.card.set), 1), (0, vue_exports.createVNode)("span", { class: "td__meaning" }, (0, vue_exports.toDisplayString)(__props.card.unit) + " · " + (0, vue_exports.toDisplayString)(__props.card.each), 1)])]),
							(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("dt", null, "Verfügbarkeit"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.card.isDemo ? "Beispielsortiment" : "Verfügbar"), 1)])
						]),
						((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(labels.value, (side) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(TyreLabel_default, (0, vue_exports.mergeProps)({ key: side.eu.eprelId }, { ref_for: true }, side.eu, { class: "td__label" }), null, 16);
						}), 128))
					])])) : (0, vue_exports.createCommentVNode)("", true)];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Komplettrad/parts/TyreDetails.vue
var TyreDetails_exports = /* @__PURE__ */ __exportAll({ default: () => TyreDetails_default });
var _sfc_setup = TyreDetails_vue_vue_type_script_setup_true_lang_default.setup;
TyreDetails_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Komplettrad/parts/TyreDetails.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var TyreDetails_default = /*#__PURE__*/ _plugin_vue_export_helper_default(TyreDetails_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-27761ca2"]]);
//#endregion
export { TyreDetails_exports as n, TyreDetails_default as t };
