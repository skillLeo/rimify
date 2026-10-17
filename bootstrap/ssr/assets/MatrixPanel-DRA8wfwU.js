import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region resources/js/Pages/Admin/Felgen/matrix.ts
/**
* A list as typed: `8 8,5 9`, `8; 8,5; 9` or one per line. The comma is the decimal mark, so it never
* separates. Each value is kept as typed, doubles dropped.
*/
function parseList(text) {
	const seen = /* @__PURE__ */ new Set();
	return text.split(/[\s;]+/).map((value) => value.trim().replace(/,$/, "")).filter((value) => {
		if (value === "" || seen.has(normal(value))) return false;
		seen.add(normal(value));
		return true;
	});
}
/** `8,50` and `8,5` and `8.5` are one width. */
function normal(value) {
	const n = Number(value.trim().replace(",", "."));
	return Number.isFinite(n) ? String(n) : value.trim().toLowerCase();
}
/** The key two sizes share when they are the same size in the same finish. */
function sizeKey(size) {
	return [
		size.finish,
		normal(size.diameter),
		normal(size.width),
		normal(size.et),
		normal(size.bolt_circle)
	].join("|");
}
/** `Graphit matt` → `GM`; `Silber` → `S`. */
function finishCode(name) {
	return ascii(name).split(/[^A-Z0-9]+/).filter(Boolean).map((word) => word[0]).join("") || "F";
}
/** `NORDFELGE-FJORD-18X8.5-ET35-GM` */
function skuFor(brand, model, finish, diameter, width, et) {
	const part = (s) => ascii(s).replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
	return [
		part(brand) || "MARKE",
		part(model) || "MODELL",
		`${normal(diameter)}X${normal(width)}`,
		`ET${normal(et)}`,
		finishCode(finish)
	].join("-").replace(/-{2,}/g, "-").slice(0, 64);
}
function ascii(s) {
	return s.toUpperCase().replace(/Ä/g, "AE").replace(/Ö/g, "OE").replace(/Ü/g, "UE").replace(/ß/g, "SS").normalize("NFD").replace(/[̀-ͯ]/g, "");
}
/**
* The new sizes for the lists, in finish, diameter, width, ET order — none that the table already
* holds. `nextKey` names each new row for the page.
*/
function generate(input, finishes, existing, brand, model, nextKey) {
	const have = new Set(existing.map(sizeKey));
	const skus = new Set(existing.map((size) => size.sku.toLowerCase()));
	const out = [];
	for (const finishKey of input.finishes) {
		const finish = finishes.find((f) => f.key === finishKey);
		if (!finish) continue;
		for (const diameter of parseList(input.diameters)) for (const width of parseList(input.widths)) for (const et of parseList(input.ets)) {
			const size = {
				key: nextKey(),
				id: null,
				finish: finish.key,
				diameter,
				width,
				et,
				bolt_holes: input.bolt_holes,
				bolt_circle: input.bolt_circle.trim(),
				bore: input.bore.trim(),
				sku: skuFor(brand, model, finish.name, diameter, width, et),
				ean: "",
				kba: "",
				price: input.price.trim(),
				stock: input.stock,
				weight_g: null
			};
			if (have.has(sizeKey(size))) continue;
			let sku = size.sku;
			let n = 2;
			while (skus.has(sku.toLowerCase())) sku = `${size.sku.slice(0, 60)}-${n++}`;
			size.sku = sku;
			skus.add(sku.toLowerCase());
			have.add(sizeKey(size));
			out.push(size);
		}
	}
	return out;
}
/** How many sizes the lists would make, before the existing ones are left out. */
function planned(input) {
	return input.finishes.length * parseList(input.diameters).length * parseList(input.widths).length * parseList(input.ets).length;
}
//#endregion
//#region resources/js/Pages/Admin/Felgen/MatrixPanel.vue?vue&type=script&setup=true&lang.ts
var MatrixPanel_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "MatrixPanel",
	__ssrInlineRender: true,
	props: {
		finishes: {},
		boltHoles: {},
		start: {}
	},
	emits: ["add"],
	setup(__props, { emit: __emit }) {
		/**
		* „Größen erzeugen“: the sizes of a model from lists — finishes × diameters × widths × ETs — sharing
		* one bolt pattern, bore, price and stock (matrix.ts). What it adds lands in the table as unsaved rows;
		* nothing is stored until the form is saved, and a size the table already holds is left out.
		*/
		const props = __props;
		const input = (0, vue_exports.ref)({
			finishes: props.finishes.map((finish) => finish.key),
			diameters: "",
			widths: "",
			ets: "",
			bolt_holes: props.start.bolt_holes,
			bolt_circle: props.start.bolt_circle,
			bore: props.start.bore,
			price: "",
			stock: 0
		});
		(0, vue_exports.watch)(() => props.finishes.map((finish) => finish.key).join("|"), (now, before) => {
			const keys = props.finishes.map((finish) => finish.key);
			const kept = input.value.finishes.filter((key) => keys.includes(key));
			const added = keys.filter((key) => !(before ?? "").split("|").includes(key));
			input.value.finishes = kept.length === 0 ? keys : [...kept, ...added];
		});
		const count = (0, vue_exports.computed)(() => planned(input.value));
		const missing = (0, vue_exports.computed)(() => {
			const out = [];
			if (input.value.finishes.length === 0) out.push("eine Ausführung");
			if (parseList(input.value.diameters).length === 0) out.push("ein Durchmesser");
			if (parseList(input.value.widths).length === 0) out.push("eine Breite");
			if (parseList(input.value.ets).length === 0) out.push("eine Einpresstiefe");
			return out;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "fe-matrix",
				role: "group",
				"aria-label": "Größen aus Listen erzeugen"
			}, _attrs))} data-v-345ccb7d><div class="fe-matrix__body" data-v-345ccb7d><p class="adm-note" data-v-345ccb7d>Mehrere Werte trennst du mit Leerzeichen oder Semikolon, zum Beispiel „8 8,5 9“. Jede Kombination wird eine Zeile in der Tabelle; vorhandene Größen bleiben, wie sie sind.</p><fieldset class="fe-matrix__finishes" data-v-345ccb7d><legend class="form-field__label" data-v-345ccb7d>Ausführungen</legend><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.finishes, (finish) => {
				_push(`<label class="fe-matrix__check" data-v-345ccb7d><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(input.value.finishes) ? (0, server_renderer_exports.ssrLooseContain)(input.value.finishes, finish.key) : input.value.finishes) ? " checked" : ""} type="checkbox"${(0, server_renderer_exports.ssrRenderAttr)("value", finish.key)} data-v-345ccb7d> ${(0, server_renderer_exports.ssrInterpolate)(finish.name || "Neue Ausführung")}</label>`);
			});
			_push(`<!--]--></fieldset><div class="fe-matrix__grid" data-v-345ccb7d><div class="form-field" data-v-345ccb7d><label class="form-field__label" for="fe-m-d" data-v-345ccb7d>Durchmesser (Zoll)</label><input id="fe-m-d"${(0, server_renderer_exports.ssrRenderAttr)("value", input.value.diameters)} class="input" type="text" inputmode="decimal" placeholder="18 19" data-v-345ccb7d></div><div class="form-field" data-v-345ccb7d><label class="form-field__label" for="fe-m-w" data-v-345ccb7d>Breiten (Zoll)</label><input id="fe-m-w"${(0, server_renderer_exports.ssrRenderAttr)("value", input.value.widths)} class="input" type="text" inputmode="decimal" placeholder="8 8,5" data-v-345ccb7d></div><div class="form-field" data-v-345ccb7d><label class="form-field__label" for="fe-m-et" data-v-345ccb7d>Einpresstiefen (ET, mm)</label><input id="fe-m-et"${(0, server_renderer_exports.ssrRenderAttr)("value", input.value.ets)} class="input" type="text" inputmode="text" placeholder="35 40 -5" data-v-345ccb7d></div><div class="form-field" data-v-345ccb7d><label class="form-field__label" for="fe-m-holes" data-v-345ccb7d>Lochzahl</label><select id="fe-m-holes" class="input" data-v-345ccb7d><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(__props.boltHoles, (n) => {
				_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", n)} data-v-345ccb7d${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(input.value.bolt_holes) ? (0, server_renderer_exports.ssrLooseContain)(input.value.bolt_holes, n) : (0, server_renderer_exports.ssrLooseEqual)(input.value.bolt_holes, n)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(n)}</option>`);
			});
			_push(`<!--]--></select></div><div class="form-field" data-v-345ccb7d><label class="form-field__label" for="fe-m-lk" data-v-345ccb7d>Lochkreis (mm)</label><input id="fe-m-lk"${(0, server_renderer_exports.ssrRenderAttr)("value", input.value.bolt_circle)} class="input" type="text" inputmode="decimal" placeholder="112" data-v-345ccb7d></div><div class="form-field" data-v-345ccb7d><label class="form-field__label" for="fe-m-bore" data-v-345ccb7d>Mittenlochbohrung (mm)</label><input id="fe-m-bore"${(0, server_renderer_exports.ssrRenderAttr)("value", input.value.bore)} class="input" type="text" inputmode="decimal" placeholder="66,6" data-v-345ccb7d></div><div class="form-field" data-v-345ccb7d><label class="form-field__label" for="fe-m-price" data-v-345ccb7d>Preis je Felge (€)</label><input id="fe-m-price"${(0, server_renderer_exports.ssrRenderAttr)("value", input.value.price)} class="input" type="text" inputmode="decimal" placeholder="189,00" data-v-345ccb7d></div><div class="form-field" data-v-345ccb7d><label class="form-field__label" for="fe-m-stock" data-v-345ccb7d>Bestand je Größe</label><input id="fe-m-stock"${(0, server_renderer_exports.ssrRenderAttr)("value", input.value.stock)} class="input" type="number" min="0" step="1" data-v-345ccb7d></div></div><div class="fe-matrix__foot" data-v-345ccb7d><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(missing.value.length > 0) ? " disabled" : ""} data-v-345ccb7d>${(0, server_renderer_exports.ssrInterpolate)(count.value === 1 ? "1 Größe in die Tabelle" : `${count.value} Größen in die Tabelle`)}</button>`);
			if (missing.value.length) _push(`<p class="adm-note" aria-live="polite" data-v-345ccb7d>Noch nötig: ${(0, server_renderer_exports.ssrInterpolate)(missing.value.join(", "))}.</p>`);
			else _push(`<!---->`);
			_push(`</div></div></div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Felgen/MatrixPanel.vue
var MatrixPanel_exports = /* @__PURE__ */ __exportAll({ default: () => MatrixPanel_default });
var _sfc_setup = MatrixPanel_vue_vue_type_script_setup_true_lang_default.setup;
MatrixPanel_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Felgen/MatrixPanel.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var MatrixPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(MatrixPanel_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-345ccb7d"]]);
//#endregion
export { MatrixPanel_exports as n, generate as r, MatrixPanel_default as t };
