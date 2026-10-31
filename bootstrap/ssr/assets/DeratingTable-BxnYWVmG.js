import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { o as useForm, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import "./useDirtyForm-Dq1y6dPH.js";
import { n as useFocusAfter } from "./useFocusAfter-B30tsjKa.js";
//#region resources/js/Pages/Admin/Gutachten/DeratingTable.vue?vue&type=script&setup=true&lang.ts
var BAG = "tabelle";
var DeratingTable_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "DeratingTable",
	__ssrInlineRender: true,
	props: {
		documentId: {},
		derating: {},
		editable: { type: Boolean },
		pageCount: {},
		required: { type: Boolean },
		stamp: {}
	},
	setup(__props) {
		/**
		* The document's own table of tyre load at speed (ABE 55255, page 6) — typed as it stands in the PDF: a
		* row per speed, a column per speed symbol, each cell a percentage, „–“ (a tyre of that symbol is not
		* permitted at that speed) or empty (the table does not say). The table belongs to its document; without
		* one, the shop cannot confirm tyres above 210 km/h (the operator's review of C9, §5).
		*
		* Saved whole, into its own error bag (`tabelle`).
		*/
		const props = __props;
		useFocusAfter();
		const page = usePage();
		const initialSymbols = props.derating.symbols.length > 0 ? [...props.derating.symbols] : [
			"V",
			"W",
			"Y"
		];
		const form = useForm({
			source_page: props.derating.sourcePage ?? "",
			symbols: initialSymbols,
			rows: props.derating.rows.map((row) => ({
				speed_kmh: row.speed,
				cells: { ...row.cells }
			}))
		});
		const editing = (0, vue_exports.ref)(false);
		const empty = (0, vue_exports.computed)(() => props.derating.rows.length === 0);
		const errors = (0, vue_exports.computed)(() => (page.props.errors ?? {})[BAG] ?? {});
		function cellError(i, symbol) {
			return errors.value[`rows.${i}.cells.${symbol}`] ?? "";
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "dt" }, _attrs))} data-v-7e8f2985><p class="adm-note" data-v-7e8f2985> Wie viel ihrer Last Reifen mit V, W oder Y bei hoher Geschwindigkeit tragen dürfen – so, wie dieses Gutachten es druckt. `);
			if (__props.required) _push(`<!--[-->Laut den Angaben druckt dieses Gutachten eine solche Tabelle. Ohne sie ist keine Freigabe möglich, und für Fahrzeuge mit mehr als 210 km/h Höchstgeschwindigkeit kann der Shop die Reifen nicht bestätigen.<!--]-->`);
			else _push(`<!---->`);
			_push(`</p>`);
			if (!editing.value) {
				_push(`<!--[-->`);
				if (empty.value) _push(`<p class="adm-note" data-v-7e8f2985>Zu diesem Gutachten ist noch keine Tabelle hinterlegt.</p>`);
				else {
					_push(`<div class="dt-scroll" data-v-7e8f2985><table class="adm-table dt-table" data-v-7e8f2985><caption class="visually-hidden" data-v-7e8f2985>Tragfähigkeit bei hoher Geschwindigkeit</caption><thead data-v-7e8f2985><tr data-v-7e8f2985><th scope="col" data-v-7e8f2985>km/h</th><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.derating.symbols, (symbol) => {
						_push(`<th scope="col" class="num" data-v-7e8f2985>${(0, server_renderer_exports.ssrInterpolate)(symbol)}</th>`);
					});
					_push(`<!--]--></tr></thead><tbody data-v-7e8f2985><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(__props.derating.rows, (row) => {
						_push(`<tr data-v-7e8f2985><th scope="row" class="num dt-speed" data-v-7e8f2985>${(0, server_renderer_exports.ssrInterpolate)(row.speed)}</th><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.derating.symbols, (symbol) => {
							_push(`<td class="num"${(0, server_renderer_exports.ssrRenderAttr)("data-label", symbol)} data-v-7e8f2985>${(0, server_renderer_exports.ssrInterpolate)(row.cells[symbol] === void 0 ? "" : row.cells[symbol] === "–" ? "–" : `${row.cells[symbol]} %`)}</td>`);
						});
						_push(`<!--]--></tr>`);
					});
					_push(`<!--]--></tbody></table></div>`);
				}
				if (!empty.value && __props.derating.seededFrom) _push(`<p class="adm-note" data-v-7e8f2985> Beispieltabelle aus den Demodaten (${(0, server_renderer_exports.ssrInterpolate)(__props.derating.seededFrom)}) – nicht aus diesem Gutachten übertragen. </p>`);
				else if (!empty.value && __props.derating.sourcePage) _push(`<p class="adm-note" data-v-7e8f2985>Seite ${(0, server_renderer_exports.ssrInterpolate)(__props.derating.sourcePage)} im Gutachten.</p>`);
				else _push(`<!---->`);
				if (__props.editable) {
					_push(`<button id="dt-edit" class="btn btn--ghost" type="button" data-v-7e8f2985>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: empty.value ? "plus" : "edit",
						size: 20
					}, null, _parent));
					_push(` ${(0, server_renderer_exports.ssrInterpolate)(empty.value ? "Tabelle eintragen" : "Tabelle ändern")}</button>`);
				} else _push(`<!---->`);
				_push(`<!--]-->`);
			} else {
				_push(`<form class="dt-form" novalidate aria-labelledby="dt-form-h" data-v-7e8f2985>`);
				if (errors.value._stamp) _push(`<p class="adm-alert" role="alert" data-v-7e8f2985>${(0, server_renderer_exports.ssrInterpolate)(errors.value._stamp)}</p>`);
				else _push(`<!---->`);
				_push(`<p id="dt-form-h" class="form-field__label" data-v-7e8f2985>Tabelle aus dem Gutachten</p><p class="form-field__help" data-v-7e8f2985>In jede Zelle die Prozentzahl, „–“ wenn die Tabelle einen Strich zeigt, oder nichts, wenn die Tabelle dazu nichts sagt.</p><div class="form-field dt-page" data-v-7e8f2985><label class="form-field__label" for="dt-page" data-v-7e8f2985>Seite im Gutachten</label><input id="dt-page"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).source_page)} class="input" type="number" min="1"${(0, server_renderer_exports.ssrRenderAttr)("max", __props.pageCount ?? void 0)} inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.source_page ? "true" : void 0)} aria-describedby="dt-page-err" data-v-7e8f2985><p id="dt-page-err" class="form-field__error" data-v-7e8f2985>${(0, server_renderer_exports.ssrInterpolate)(errors.value.source_page)}</p></div><div class="dt-scroll" data-v-7e8f2985><table class="dt-grid" data-v-7e8f2985><thead data-v-7e8f2985><tr data-v-7e8f2985><th scope="col" data-v-7e8f2985>km/h</th><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(form).symbols, (symbol) => {
					_push(`<th scope="col" data-v-7e8f2985>${(0, server_renderer_exports.ssrInterpolate)(symbol)}</th>`);
				});
				_push(`<!--]--><th scope="col" data-v-7e8f2985><span class="visually-hidden" data-v-7e8f2985>Zeile entfernen</span></th></tr></thead><tbody data-v-7e8f2985><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(form).rows, (row, i) => {
					_push(`<tr data-v-7e8f2985><td data-v-7e8f2985><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", `dt-speed-${i}`)} data-v-7e8f2985>Geschwindigkeit der Zeile ${(0, server_renderer_exports.ssrInterpolate)(i + 1)} in km/h</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `dt-speed-${i}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", row.speed_kmh)} class="input dt-input" type="number" min="100" max="400" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value[`rows.${i}.speed_kmh`] ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `dt-speed-${i}-err`)} data-v-7e8f2985><p${(0, server_renderer_exports.ssrRenderAttr)("id", `dt-speed-${i}-err`)} class="form-field__error" data-v-7e8f2985>${(0, server_renderer_exports.ssrInterpolate)(errors.value[`rows.${i}.speed_kmh`])}</p></td><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(form).symbols, (symbol) => {
						_push(`<td data-v-7e8f2985><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", `dt-cell-${i}-${symbol}`)} data-v-7e8f2985>${(0, server_renderer_exports.ssrInterpolate)(symbol)} bei ${(0, server_renderer_exports.ssrInterpolate)(row.speed_kmh || "…")} km/h</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `dt-cell-${i}-${symbol}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", row.cells[symbol])} class="input dt-input" type="text" inputmode="decimal" maxlength="6" placeholder="%"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", cellError(i, symbol) ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `dt-cell-${i}-${symbol}-err`)} data-v-7e8f2985><p${(0, server_renderer_exports.ssrRenderAttr)("id", `dt-cell-${i}-${symbol}-err`)} class="form-field__error" data-v-7e8f2985>${(0, server_renderer_exports.ssrInterpolate)(cellError(i, symbol))}</p></td>`);
					});
					_push(`<!--]--><td data-v-7e8f2985><button class="btn btn--ghost btn--icon" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Zeile ${row.speed_kmh || i + 1} entfernen`)} data-v-7e8f2985>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "close",
						size: 20
					}, null, _parent));
					_push(`</button></td></tr>`);
				});
				_push(`<!--]--></tbody></table></div><div class="dt-actions" data-v-7e8f2985><button id="dt-add-row" class="btn btn--ghost" type="button" data-v-7e8f2985>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "plus",
					size: 20
				}, null, _parent));
				_push(` Zeile </button></div><div class="dt-actions" data-v-7e8f2985><button id="dt-save" class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(form).processing ? "true" : void 0)} data-v-7e8f2985>Tabelle speichern</button><button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(form).processing) ? " disabled" : ""} data-v-7e8f2985>Abbrechen</button></div></form>`);
			}
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/DeratingTable.vue
var DeratingTable_exports = /* @__PURE__ */ __exportAll({ default: () => DeratingTable_default });
var _sfc_setup = DeratingTable_vue_vue_type_script_setup_true_lang_default.setup;
DeratingTable_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/DeratingTable.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var DeratingTable_default = /*#__PURE__*/ _plugin_vue_export_helper_default(DeratingTable_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-7e8f2985"]]);
//#endregion
export { DeratingTable_exports as n, DeratingTable_default as t };
