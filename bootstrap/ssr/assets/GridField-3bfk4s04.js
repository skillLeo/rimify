import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import "./toast-Ckkabove.js";
import { n as clickGuard, s as length } from "./content-DmUz2EQt.js";
//#region resources/js/Pages/Admin/Seiten/GridField.vue?vue&type=script&setup=true&lang.ts
var GridField_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "GridField",
	__ssrInlineRender: true,
	props: {
		id: {},
		rowsId: {},
		label: {},
		help: { default: "" },
		head: {},
		rows: {},
		max: {},
		headError: { default: "" },
		rowsError: { default: "" },
		readonly: {
			type: Boolean,
			default: false
		}
	},
	emits: ["change"],
	setup(__props, { emit: __emit }) {
		/**
		* An article's table (his admin item 11, D-306), typed cell by cell: the first row holds the column headings,
		* the rows below the content. Columns and rows are added and removed with buttons — 2 to 6 columns, up to 30
		* rows, as PageSchema checks them — and every cell is plain text, never HTML.
		*
		* The first heading carries the field's id and the first cell the rows' id, so an error of the publish check
		* finds its place (Bearbeiten.vue › focusField).
		*/
		const props = __props;
		function headId(column) {
			return column === 0 ? props.id : `${props.id}-${column}`;
		}
		function cellId(row, column) {
			return row === 0 && column === 0 ? props.rowsId : `${props.rowsId}-${row}-${column}`;
		}
		clickGuard();
		function over(value) {
			return length(value) > props.max;
		}
		function describedBy(kind) {
			return [props.help ? `${props.id}-help` : null, `${props.id}-${kind}-err`].filter(Boolean).join(" ");
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "form-field pg-grid" }, _attrs))} data-v-15584821><span${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-label`)} class="form-field__label" data-v-15584821>${(0, server_renderer_exports.ssrInterpolate)(__props.label)}</span><div class="pg-grid__frame" data-v-15584821><table class="pg-grid__table"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `${__props.id}-label`)} style="${(0, server_renderer_exports.ssrRenderStyle)({ "--pg-grid-columns": __props.head.length })}" data-v-15584821><thead data-v-15584821>`);
			if (!__props.readonly && __props.head.length > (0, vue_exports.unref)(2)) {
				_push(`<tr class="pg-grid__column-tools" data-v-15584821><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.head, (_, c) => {
					_push(`<td data-v-15584821><button class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Spalte ${c + 1} entfernen`)} data-v-15584821>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "delete",
						size: 20
					}, null, _parent));
					_push(`</button></td>`);
				});
				_push(`<!--]--><td class="pg-grid__tools" data-v-15584821></td></tr>`);
			} else _push(`<!---->`);
			_push(`<tr data-v-15584821><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.head, (cell, c) => {
				_push(`<th scope="col" class="pg-grid__head" data-v-15584821><input${(0, server_renderer_exports.ssrRenderAttr)("id", headId(c))} class="input pg-grid__input pg-grid__input--head" type="text"${(0, server_renderer_exports.ssrRenderAttr)("value", cell)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.readonly) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Spaltenkopf ${c + 1}`)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", __props.headError || over(cell) ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy("head"))} data-v-15584821></th>`);
			});
			_push(`<!--]-->`);
			if (!__props.readonly) _push(`<td class="pg-grid__tools" data-v-15584821></td>`);
			else _push(`<!---->`);
			_push(`</tr></thead><tbody data-v-15584821><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.rows, (cells, r) => {
				_push(`<tr data-v-15584821><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(cells, (cell, c) => {
					_push(`<td data-v-15584821><input${(0, server_renderer_exports.ssrRenderAttr)("id", cellId(r, c))} class="input pg-grid__input" type="text"${(0, server_renderer_exports.ssrRenderAttr)("value", cell)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.readonly) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Zeile ${r + 1}, ${__props.head[c] || `Spalte ${c + 1}`}`)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", over(cell) ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy("rows"))} data-v-15584821></td>`);
				});
				_push(`<!--]-->`);
				if (!__props.readonly) {
					_push(`<td class="pg-grid__tools" data-v-15584821><button class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.rows.length <= 1) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Zeile ${r + 1} entfernen`)} data-v-15584821>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "delete",
						size: 20
					}, null, _parent));
					_push(`</button></td>`);
				} else _push(`<!---->`);
				_push(`</tr>`);
			});
			_push(`<!--]--></tbody></table></div>`);
			if (!__props.readonly) {
				_push(`<div class="pg-grid__actions" data-v-15584821><button${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-add-row`)} class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.rows.length >= (0, vue_exports.unref)(30)) ? " disabled" : ""} data-v-15584821>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "plus",
					size: 20
				}, null, _parent));
				_push(` Zeile hinzufügen </button><button${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-add-column`)} class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.head.length >= (0, vue_exports.unref)(6)) ? " disabled" : ""} data-v-15584821>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "plus",
					size: 20
				}, null, _parent));
				_push(` Spalte hinzufügen </button></div>`);
			} else _push(`<!---->`);
			if (__props.help) _push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-help`)} class="form-field__help" data-v-15584821>${(0, server_renderer_exports.ssrInterpolate)(__props.help)}</p>`);
			else _push(`<!---->`);
			_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-head-err`)} class="form-field__error" data-v-15584821>${(0, server_renderer_exports.ssrInterpolate)(__props.headError)}</p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-rows-err`)} class="form-field__error" data-v-15584821>${(0, server_renderer_exports.ssrInterpolate)(__props.rowsError)}</p></div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Seiten/GridField.vue
var GridField_exports = /* @__PURE__ */ __exportAll({ default: () => GridField_default });
var _sfc_setup = GridField_vue_vue_type_script_setup_true_lang_default.setup;
GridField_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Seiten/GridField.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var GridField_default = /*#__PURE__*/ _plugin_vue_export_helper_default(GridField_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-15584821"]]);
//#endregion
export { GridField_exports as n, GridField_default as t };
