import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { t as Dialog_default } from "./Dialog-Bv2Ro0-J.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { O as cellSummary, k as copyPreview, o as useSketch } from "./gutachtenStore-DERNJqCs.js";
//#region resources/js/Pages/Admin/Skizze/parts/CopyDialog.vue?vue&type=script&setup=true&lang.ts
var CopyDialog_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CopyDialog",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({ from: {} }, {
		"open": {
			type: Boolean,
			required: true
		},
		"openModifiers": {}
	}),
	emits: ["update:open"],
	setup(__props) {
		/**
		* „Kopieren nach …" (the brief §7 step 4): the tyres of one car group copied to others on the same wheel size, replacing
		* theirs or added to them, with a count before anything happens. A copied cell says where it came from until edited.
		*/
		const props = __props;
		const open = (0, vue_exports.useModel)(__props, "open");
		const store = useSketch();
		const targets = (0, vue_exports.ref)([]);
		const mode = (0, vue_exports.ref)("ersetzen");
		const others = (0, vue_exports.computed)(() => store.chosenGroups().filter((group) => group.id !== props.from.id));
		const preview = (0, vue_exports.computed)(() => copyPreview(store.cellOf(props.from.id), targets.value.map((id) => store.cellOf(id)), mode.value));
		(0, vue_exports.watch)(open, (value) => {
			if (value) {
				targets.value = others.value.filter((group) => cellSummary(store.cellOf(group.id)) === "noch leer").map((group) => group.id);
				mode.value = "ersetzen";
			}
		});
		function copy() {
			store.copy(props.from.id, targets.value, mode.value);
			open.value = false;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, (0, vue_exports.mergeProps)({
				open: open.value,
				"onUpdate:open": ($event) => open.value = $event,
				title: `Reifen von ${__props.from.sales} kopieren`,
				description: "Auf dieselbe Felgengröße, für andere Fahrzeuggruppen dieses Gutachtens.",
				"content-class": "adm-dialog adm-dialog--narrow"
			}, _attrs), {
				actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--secondary" type="button"${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(targets.value.length === 0) ? " disabled" : ""}${_scopeId}>Kopieren</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--secondary",
						type: "button",
						onClick: ($event) => open.value = false
					}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						disabled: targets.value.length === 0,
						onClick: copy
					}, "Kopieren", 8, ["disabled"])];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="adm-fields"${_scopeId}><fieldset class="sk-fieldset"${_scopeId}><legend class="form-field__label"${_scopeId}>Nach</legend><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(others.value, (group) => {
							_push(`<label class="check"${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(targets.value) ? (0, server_renderer_exports.ssrLooseContain)(targets.value, group.id) : targets.value) ? " checked" : ""} type="checkbox"${(0, server_renderer_exports.ssrRenderAttr)("value", group.id)}${_scopeId}> ${(0, server_renderer_exports.ssrInterpolate)(group.sales)} (${(0, server_renderer_exports.ssrInterpolate)(group.type)}) · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(cellSummary)((0, vue_exports.unref)(store).cellOf(group.id)))}</label>`);
						});
						_push(`<!--]-->`);
						if (others.value.length === 0) _push(`<p class="adm-note"${_scopeId}>Es gibt keine andere Fahrzeuggruppe. Übernimm in Schritt 3 weitere Zeilen.</p>`);
						else _push(`<!---->`);
						_push(`</fieldset><fieldset class="sk-fieldset"${_scopeId}><legend class="form-field__label"${_scopeId}>Was dort schon steht</legend><label class="check"${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(mode.value, "ersetzen")) ? " checked" : ""} type="radio" name="sk-copy-mode" value="ersetzen"${_scopeId}> ersetzen</label><label class="check"${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(mode.value, "hinzufuegen")) ? " checked" : ""} type="radio" name="sk-copy-mode" value="hinzufuegen"${_scopeId}> behalten und Fehlendes hinzufügen</label></fieldset><p class="sk-count" role="status"${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(targets.value.length ? preview.value : "Wähl mindestens eine Fahrzeuggruppe.")}</p></div>`);
					} else return [(0, vue_exports.createVNode)("div", { class: "adm-fields" }, [
						(0, vue_exports.createVNode)("fieldset", { class: "sk-fieldset" }, [
							(0, vue_exports.createVNode)("legend", { class: "form-field__label" }, "Nach"),
							((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(others.value, (group) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("label", {
									key: group.id,
									class: "check"
								}, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									"onUpdate:modelValue": ($event) => targets.value = $event,
									type: "checkbox",
									value: group.id
								}, null, 8, ["onUpdate:modelValue", "value"]), [[vue_exports.vModelCheckbox, targets.value]]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(group.sales) + " (" + (0, vue_exports.toDisplayString)(group.type) + ") · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(cellSummary)((0, vue_exports.unref)(store).cellOf(group.id))), 1)]);
							}), 128)),
							others.value.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-note"
							}, "Es gibt keine andere Fahrzeuggruppe. Übernimm in Schritt 3 weitere Zeilen.")) : (0, vue_exports.createCommentVNode)("", true)
						]),
						(0, vue_exports.createVNode)("fieldset", { class: "sk-fieldset" }, [
							(0, vue_exports.createVNode)("legend", { class: "form-field__label" }, "Was dort schon steht"),
							(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								"onUpdate:modelValue": ($event) => mode.value = $event,
								type: "radio",
								name: "sk-copy-mode",
								value: "ersetzen"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelRadio, mode.value]]), (0, vue_exports.createTextVNode)(" ersetzen")]),
							(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
								"onUpdate:modelValue": ($event) => mode.value = $event,
								type: "radio",
								name: "sk-copy-mode",
								value: "hinzufuegen"
							}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelRadio, mode.value]]), (0, vue_exports.createTextVNode)(" behalten und Fehlendes hinzufügen")])
						]),
						(0, vue_exports.createVNode)("p", {
							class: "sk-count",
							role: "status"
						}, (0, vue_exports.toDisplayString)(targets.value.length ? preview.value : "Wähl mindestens eine Fahrzeuggruppe."), 1)
					])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Skizze/parts/CopyDialog.vue
var CopyDialog_exports = /* @__PURE__ */ __exportAll({ default: () => CopyDialog_default });
var _sfc_setup = CopyDialog_vue_vue_type_script_setup_true_lang_default.setup;
CopyDialog_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Skizze/parts/CopyDialog.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var CopyDialog_default = CopyDialog_vue_vue_type_script_setup_true_lang_default;
//#endregion
export { CopyDialog_exports as n, CopyDialog_default as t };
