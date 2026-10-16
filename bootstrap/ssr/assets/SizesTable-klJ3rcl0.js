import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-COuF1lMZ.js";
//#region resources/js/Pages/Admin/Felgen/SizesTable.vue?vue&type=script&setup=true&lang.ts
var SizesTable_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "SizesTable",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		finishes: {},
		documents: {},
		locked: {},
		errors: {},
		readonly: { type: Boolean },
		boltHoles: {}
	}, {
		"sizes": { required: true },
		"sizesModifiers": {}
	}),
	emits: /*@__PURE__*/ (0, vue_exports.mergeModels)(["remove"], ["update:sizes"]),
	setup(__props, { emit: __emit }) {
		/**
		* The sizes of one Felge as a table of fields: one row per size, typed the German way (`8,5`, `66,6`,
		* `189,00`). A size an approval document names keeps its measurements and its finish — they are what
		* the Gutachten approves — so those are shown as plain figures, not fields, and the row cannot be
		* removed; price, stock and SKU stay open (WheelEditor).
		*
		* A row's refusals are listed under the table, each field pointing at its row's sentence. Below 768 px
		* each row is a card of labelled fields (the admin table's own pattern).
		*/
		const props = __props;
		const sizes = (0, vue_exports.useModel)(__props, "sizes");
		const FIELDS = [
			"finish",
			"diameter",
			"width",
			"et",
			"bolt_holes",
			"bolt_circle",
			"bore",
			"sku",
			"ean",
			"kba",
			"price",
			"stock",
			"weight_g"
		];
		function isLocked(size) {
			return size.id !== null && props.locked.includes(size.id);
		}
		function err(index, field) {
			return props.errors[`configs.${index}.${field}`] ?? "";
		}
		function rowError(index) {
			return FIELDS.map((field) => err(index, field)).filter(Boolean).join(" ");
		}
		function docs(size) {
			return size.id === null ? [] : props.documents[String(size.id)] ?? [];
		}
		function finishName(key) {
			return props.finishes.find((finish) => finish.key === key)?.name ?? "–";
		}
		function id(index, field) {
			return `fe-size-${index}-${field}`;
		}
		/** Every field of a row names the row's refusal, so a screen reader hears it on the field. */
		function describedBy(index) {
			return rowError(index) ? `fe-size-${index}-err` : void 0;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "adm-panel fe-sizes" }, _attrs))} data-v-4d25de45><table class="adm-table fe-sizes__table" data-v-4d25de45><caption class="visually-hidden" data-v-4d25de45>Größen dieser Felge</caption><thead data-v-4d25de45><tr data-v-4d25de45><th scope="col" data-v-4d25de45>Ausführung</th><th scope="col" data-v-4d25de45>Ø Zoll</th><th scope="col" data-v-4d25de45>Breite Zoll</th><th scope="col" data-v-4d25de45>ET mm</th><th scope="col" data-v-4d25de45>Lochzahl</th><th scope="col" data-v-4d25de45>Lochkreis mm</th><th scope="col" data-v-4d25de45>MLB mm</th><th scope="col" data-v-4d25de45>SKU</th><th scope="col" class="num" data-v-4d25de45>Preis €</th><th scope="col" class="num" data-v-4d25de45>Bestand</th><th scope="col" data-v-4d25de45>Freigaben</th>`);
			if (!__props.readonly) _push(`<th scope="col" data-v-4d25de45><span class="visually-hidden" data-v-4d25de45>Entfernen</span></th>`);
			else _push(`<!---->`);
			_push(`</tr></thead><tbody data-v-4d25de45><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(sizes.value, (size, index) => {
				_push(`<tr class="${(0, server_renderer_exports.ssrRenderClass)({ "fe-sizes__row--bad": rowError(index) })}" data-v-4d25de45>`);
				if (isLocked(size) || __props.readonly) _push(`<!--[--><td data-label="Ausführung" data-v-4d25de45><span class="fe-fixed" data-v-4d25de45>${(0, server_renderer_exports.ssrInterpolate)(finishName(size.finish))}</span></td><td data-label="Ø Zoll" class="fe-fixed" data-v-4d25de45>${(0, server_renderer_exports.ssrInterpolate)(size.diameter)}</td><td data-label="Breite Zoll" class="fe-fixed" data-v-4d25de45>${(0, server_renderer_exports.ssrInterpolate)(size.width)}</td><td data-label="ET mm" class="fe-fixed" data-v-4d25de45>${(0, server_renderer_exports.ssrInterpolate)(size.et)}</td><td data-label="Lochzahl" class="fe-fixed" data-v-4d25de45>${(0, server_renderer_exports.ssrInterpolate)(size.bolt_holes)}</td><td data-label="Lochkreis mm" class="fe-fixed" data-v-4d25de45>${(0, server_renderer_exports.ssrInterpolate)(size.bolt_circle)}</td><td data-label="MLB mm" class="fe-fixed" data-v-4d25de45>${(0, server_renderer_exports.ssrInterpolate)(size.bore)}</td><!--]-->`);
				else {
					_push(`<!--[--><td data-label="Ausführung" data-v-4d25de45><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(index, "finish"))} data-v-4d25de45>Ausführung, Zeile ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", id(index, "finish"))} class="input fe-in fe-in--finish"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err(index, "finish") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy(index))} data-v-4d25de45><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.finishes, (finish) => {
						_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", finish.key)} data-v-4d25de45${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(size.finish) ? (0, server_renderer_exports.ssrLooseContain)(size.finish, finish.key) : (0, server_renderer_exports.ssrLooseEqual)(size.finish, finish.key)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(finish.name || "Neue Ausführung")}</option>`);
					});
					_push(`<!--]--></select></td><td data-label="Ø Zoll" data-v-4d25de45><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(index, "diameter"))} data-v-4d25de45>Durchmesser in Zoll, Zeile ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id(index, "diameter"))}${(0, server_renderer_exports.ssrRenderAttr)("value", size.diameter)} class="input fe-in fe-in--xs" type="text" inputmode="decimal"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err(index, "diameter") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy(index))} data-v-4d25de45></td><td data-label="Breite Zoll" data-v-4d25de45><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(index, "width"))} data-v-4d25de45>Breite in Zoll, Zeile ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id(index, "width"))}${(0, server_renderer_exports.ssrRenderAttr)("value", size.width)} class="input fe-in fe-in--xs" type="text" inputmode="decimal"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err(index, "width") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy(index))} data-v-4d25de45></td><td data-label="ET mm" data-v-4d25de45><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(index, "et"))} data-v-4d25de45>Einpresstiefe in Millimetern, Zeile ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id(index, "et"))}${(0, server_renderer_exports.ssrRenderAttr)("value", size.et)} class="input fe-in fe-in--xs" type="text" inputmode="text"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err(index, "et") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy(index))} data-v-4d25de45></td><td data-label="Lochzahl" data-v-4d25de45><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(index, "bolt_holes"))} data-v-4d25de45>Lochzahl, Zeile ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", id(index, "bolt_holes"))} class="input fe-in fe-in--xs"${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy(index))} data-v-4d25de45><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.boltHoles, (n) => {
						_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", n)} data-v-4d25de45${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(size.bolt_holes) ? (0, server_renderer_exports.ssrLooseContain)(size.bolt_holes, n) : (0, server_renderer_exports.ssrLooseEqual)(size.bolt_holes, n)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(n)}</option>`);
					});
					_push(`<!--]--></select></td><td data-label="Lochkreis mm" data-v-4d25de45><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(index, "bolt_circle"))} data-v-4d25de45>Lochkreis in Millimetern, Zeile ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id(index, "bolt_circle"))}${(0, server_renderer_exports.ssrRenderAttr)("value", size.bolt_circle)} class="input fe-in fe-in--s" type="text" inputmode="decimal"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err(index, "bolt_circle") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy(index))} data-v-4d25de45></td><td data-label="MLB mm" data-v-4d25de45><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(index, "bore"))} data-v-4d25de45>Mittenlochbohrung in Millimetern, Zeile ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id(index, "bore"))}${(0, server_renderer_exports.ssrRenderAttr)("value", size.bore)} class="input fe-in fe-in--s" type="text" inputmode="decimal"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err(index, "bore") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy(index))} data-v-4d25de45></td><!--]-->`);
				}
				_push(`<td data-label="SKU" data-v-4d25de45>`);
				if (__props.readonly) _push(`<span class="fe-fixed" data-v-4d25de45>${(0, server_renderer_exports.ssrInterpolate)(size.sku)}</span>`);
				else _push(`<!--[--><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(index, "sku"))} data-v-4d25de45>SKU, Zeile ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id(index, "sku"))}${(0, server_renderer_exports.ssrRenderAttr)("value", size.sku)} class="input fe-in fe-in--sku" type="text" maxlength="64" spellcheck="false"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err(index, "sku") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy(index))} data-v-4d25de45><!--]-->`);
				_push(`</td><td data-label="Preis €" class="num" data-v-4d25de45>`);
				if (__props.readonly) _push(`<span class="fe-fixed" data-v-4d25de45>${(0, server_renderer_exports.ssrInterpolate)(size.price)}</span>`);
				else _push(`<!--[--><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(index, "price"))} data-v-4d25de45>Preis je Felge in Euro, Zeile ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id(index, "price"))}${(0, server_renderer_exports.ssrRenderAttr)("value", size.price)} class="input fe-in fe-in--s num" type="text" inputmode="decimal"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err(index, "price") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy(index))} data-v-4d25de45><!--]-->`);
				_push(`</td><td data-label="Bestand" class="num" data-v-4d25de45>`);
				if (__props.readonly) _push(`<span class="fe-fixed" data-v-4d25de45>${(0, server_renderer_exports.ssrInterpolate)(size.stock)}</span>`);
				else _push(`<!--[--><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(index, "stock"))} data-v-4d25de45>Bestand, Zeile ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id(index, "stock"))}${(0, server_renderer_exports.ssrRenderAttr)("value", size.stock)} class="input fe-in fe-in--xs num" type="number" min="0" step="1"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err(index, "stock") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy(index))} data-v-4d25de45><!--]-->`);
				_push(`</td><td data-label="Freigaben" class="fe-sizes__docs" data-v-4d25de45>`);
				if (size.id === null) _push(`<!--[-->–<!--]-->`);
				else if (docs(size).length) {
					_push(`<!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(docs(size), (doc) => {
						_push(`<span class="fe-doc" data-v-4d25de45>${(0, server_renderer_exports.ssrInterpolate)(doc.label)}</span>`);
					});
					_push(`<!--]-->`);
				} else _push(`<span class="adm-tag adm-tag--warn" data-v-4d25de45>Noch keine</span>`);
				if (isLocked(size)) {
					_push(`<span class="fe-sizes__lock" data-v-4d25de45>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "lock",
						size: 16
					}, null, _parent));
					_push(` Maße aus dem Gutachten </span>`);
				} else _push(`<!---->`);
				_push(`</td>`);
				if (!__props.readonly) {
					_push(`<td class="fe-sizes__remove" data-v-4d25de45>`);
					if (!isLocked(size)) {
						_push(`<button class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Zeile ${index + 1} entfernen`)} title="Entfernen" data-v-4d25de45>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: "delete",
							size: 20
						}, null, _parent));
						_push(`</button>`);
					} else _push(`<!---->`);
					_push(`</td>`);
				} else _push(`<!---->`);
				_push(`</tr>`);
			});
			_push(`<!--]--></tbody></table>`);
			if (sizes.value.some((_, index) => rowError(index))) {
				_push(`<ul class="fe-sizes__errors" data-v-4d25de45><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(sizes.value, (size, index) => {
					_push(`<!--[-->`);
					if (rowError(index)) _push(`<li${(0, server_renderer_exports.ssrRenderAttr)("id", `fe-size-${index}-err`)} data-v-4d25de45>Zeile ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}: ${(0, server_renderer_exports.ssrInterpolate)(rowError(index))}</li>`);
					else _push(`<!---->`);
					_push(`<!--]-->`);
				});
				_push(`<!--]--></ul>`);
			} else _push(`<!---->`);
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Felgen/SizesTable.vue
var SizesTable_exports = /* @__PURE__ */ __exportAll({ default: () => SizesTable_default });
var _sfc_setup = SizesTable_vue_vue_type_script_setup_true_lang_default.setup;
SizesTable_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Felgen/SizesTable.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var SizesTable_default = /*#__PURE__*/ _plugin_vue_export_helper_default(SizesTable_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-4d25de45"]]);
//#endregion
export { SizesTable_exports as n, SizesTable_default as t };
