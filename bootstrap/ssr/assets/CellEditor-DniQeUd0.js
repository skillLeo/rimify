import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { l as parseKwBand } from "./rows-BeQ3HMfa.js";
import { A as duplicateLines, D as cellDone, L as readTyre, M as paperSizes, P as undescribedCodes, b as groupName, j as pairWarnings, o as useSketch, v as carCount, x as kwRange, z as whyUnread } from "./gutachtenStore-DERNJqCs.js";
import { t as CodeTags_default } from "./CodeTags-CSbWncom.js";
import { t as CopyDialog_default } from "./CopyDialog-8-Qxor5Z.js";
import { t as PasteDialog_default } from "./PasteDialog-BicmZPqK.js";
//#region resources/js/Pages/Admin/Skizze/parts/CellEditor.vue?vue&type=script&setup=true&lang.ts
var CellEditor_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CellEditor",
	__ssrInlineRender: true,
	props: {
		group: {},
		wheelName: {},
		sizeName: {}
	},
	setup(__props) {
		/**
		* The tyres of one car group on the paper's wheel size (the brief §6 level 4, §7 step 4): sizes the same on both axles,
		* pairs that differ front and rear, the row's general codes, and the page. A size is typed as the paper prints it and
		* split as it is typed; a power band or an axle restriction sits behind a line's „…". Warnings say, they never block.
		*/
		const props = __props;
		const store = useSketch();
		const { state } = store;
		const cell = (0, vue_exports.computed)(() => store.cellOf(props.group.id));
		const copyOpen = (0, vue_exports.ref)(false);
		const pasteOpen = (0, vue_exports.ref)(false);
		const openLine = (0, vue_exports.ref)(null);
		const warnings = (0, vue_exports.computed)(() => pairWarnings(cell.value, paperSizes(state.cells)));
		const twice = (0, vue_exports.computed)(() => duplicateLines(cell.value));
		const open = (0, vue_exports.computed)(() => undescribedCodes([cell.value], state.codes));
		function changed() {
			store.touched(props.group.id);
		}
		function parsed(line) {
			if (line.text.trim() === "") return {
				ok: true,
				text: "Größe wie im Gutachten, z. B. 225/40R18 88W"
			};
			const tyre = readTyre(line.text);
			if (tyre === null) return {
				ok: false,
				text: whyUnread(line.text) ?? "Nicht lesbar. Schreib die Größe etwa so: 225/40 R18 88W, 245/45R18 100 oder 235/50R18."
			};
			return {
				ok: true,
				text: `${tyre.li === null ? "ohne Lastindex" : `Lastindex ${tyre.li}`} · ${tyre.si === null ? "ohne Symbol" : `Symbol ${tyre.si}`}`
			};
		}
		function kwOk(line) {
			return line.kw.trim() === "" || parseKwBand(line.kw) !== null;
		}
		function sizeOk(text) {
			return text.trim() === "" || readTyre(text) !== null;
		}
		function axleText(axle) {
			return axle === "FRONT" ? "nur Vorderachse" : axle === "REAR" ? "nur Hinterachse" : "";
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "sk-editor",
				"aria-labelledby": "sk-editor-h"
			}, _attrs))} data-v-6b0176a8><header class="sk-editor__head" data-v-6b0176a8><h3 id="sk-editor-h" class="sk-editor__title" tabindex="-1" data-v-6b0176a8>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(groupName)(__props.group))}</h3><p class="sk-editor__sub" data-v-6b0176a8> Felge ${(0, server_renderer_exports.ssrInterpolate)(__props.wheelName)} · ${(0, server_renderer_exports.ssrInterpolate)(__props.sizeName)} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(carCount)((0, vue_exports.unref)(store).carsOf(__props.group).length))} `);
			if (cell.value.copiedFrom) _push(`<span class="adm-tag adm-tag--neutral" data-v-6b0176a8>kopiert von ${(0, server_renderer_exports.ssrInterpolate)(cell.value.copiedFrom)}</span>`);
			else _push(`<!---->`);
			_push(`</p></header><div class="sk-editor__block" data-v-6b0176a8><h4 class="sk-editor__label" data-v-6b0176a8>Reifen · vorne und hinten gleich</h4><ul class="sk-lines" data-v-6b0176a8><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(cell.value.tyres, (line) => {
				_push(`<li class="sk-line" data-v-6b0176a8><div class="sk-line__size" data-v-6b0176a8><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", `sk-tyre-${line.id}`)} data-v-6b0176a8>Reifengröße</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `sk-tyre-${line.id}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", line.text)} class="input" type="text" spellcheck="false" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", parsed(line).ok ? void 0 : "true")} data-v-6b0176a8></div>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(CodeTags_default, {
					id: `sk-tyre-codes-${line.id}`,
					modelValue: line.codes,
					"onUpdate:modelValue": ($event) => line.codes = $event,
					label: `Codes für ${line.text || "diese Größe"}`,
					onChanged: changed
				}, null, _parent));
				_push(`<div class="sk-line__more" data-v-6b0176a8><button class="sk-iconbtn" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", openLine.value === line.id)}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Weitere Angaben zu ${line.text || "dieser Größe"}`)} data-v-6b0176a8>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "more",
					size: 20
				}, null, _parent));
				_push(`</button></div><div class="sk-line__notes" data-v-6b0176a8><span class="${(0, server_renderer_exports.ssrRenderClass)(parsed(line).ok ? "sk-line__hint" : "sk-line__error")}" data-v-6b0176a8>${(0, server_renderer_exports.ssrInterpolate)(parsed(line).text)}</span>`);
				if (line.kw && kwOk(line)) _push(`<span class="adm-tag adm-tag--neutral" data-v-6b0176a8>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(kwRange)(line.kw.replace("-", "–")))}</span>`);
				else if (line.kw) _push(`<span class="sk-line__error" data-v-6b0176a8>Der kW-Bereich ist nicht lesbar. So geht es: 85-142, der kleinere Wert zuerst.</span>`);
				else _push(`<!---->`);
				if (line.axle !== "ALL") _push(`<span class="adm-tag adm-tag--neutral" data-v-6b0176a8>${(0, server_renderer_exports.ssrInterpolate)(axleText(line.axle))}</span>`);
				else _push(`<!---->`);
				if (twice.value.includes(line.id)) _push(`<span class="sk-warn" data-v-6b0176a8>Diese Größe steht schon in der Zeile.</span>`);
				else _push(`<!---->`);
				_push(`</div>`);
				if (openLine.value === line.id) {
					_push(`<div class="sk-line__extra" data-v-6b0176a8><div class="form-field" data-v-6b0176a8><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `sk-kw-${line.id}`)} data-v-6b0176a8>kW-Bereich</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `sk-kw-${line.id}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", line.kw)} class="input sk-line__kw" type="text" placeholder="z. B. 85-142"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", kwOk(line) ? void 0 : "true")} data-v-6b0176a8></div><div class="form-field" data-v-6b0176a8><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `sk-axle-${line.id}`)} data-v-6b0176a8>Achse</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `sk-axle-${line.id}`)} class="input" data-v-6b0176a8><option value="ALL" data-v-6b0176a8${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(line.axle) ? (0, server_renderer_exports.ssrLooseContain)(line.axle, "ALL") : (0, server_renderer_exports.ssrLooseEqual)(line.axle, "ALL")) ? " selected" : ""}>Beide Achsen</option><option value="FRONT" data-v-6b0176a8${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(line.axle) ? (0, server_renderer_exports.ssrLooseContain)(line.axle, "FRONT") : (0, server_renderer_exports.ssrLooseEqual)(line.axle, "FRONT")) ? " selected" : ""}>Nur Vorderachse</option><option value="REAR" data-v-6b0176a8${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(line.axle) ? (0, server_renderer_exports.ssrLooseContain)(line.axle, "REAR") : (0, server_renderer_exports.ssrLooseEqual)(line.axle, "REAR")) ? " selected" : ""}>Nur Hinterachse</option></select></div><button class="btn btn--ghost sk-line__remove" type="button" data-v-6b0176a8>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "delete",
						size: 20
					}, null, _parent));
					_push(` Zeile entfernen </button></div>`);
				} else _push(`<!---->`);
				_push(`</li>`);
			});
			_push(`<!--]--></ul>`);
			if (cell.value.tyres.length === 0) _push(`<p class="sk-empty" data-v-6b0176a8>Noch kein Reifen. Nutze „Reifen hinzufügen“ oder „Mehrere einfügen“.</p>`);
			else _push(`<!---->`);
			_push(`<div class="sk-editor__adds" data-v-6b0176a8><button class="btn btn--secondary" type="button" data-v-6b0176a8>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "plus",
				size: 20
			}, null, _parent));
			_push(` Reifen hinzufügen</button><button class="btn btn--ghost" type="button" data-v-6b0176a8>Mehrere einfügen</button></div></div><div class="sk-editor__block" data-v-6b0176a8><h4 class="sk-editor__label" data-v-6b0176a8>Kombinationen · vorne anders als hinten</h4><ul class="sk-lines" data-v-6b0176a8><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(cell.value.pairs, (pair) => {
				_push(`<li class="sk-line sk-line--pair" data-v-6b0176a8><div class="sk-pairfields" data-v-6b0176a8><label class="sk-pairfields__field" data-v-6b0176a8><span class="form-field__label" data-v-6b0176a8>vorne</span><input${(0, server_renderer_exports.ssrRenderAttr)("id", `sk-pair-front-${pair.id}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", pair.front)} class="input" type="text" spellcheck="false"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", sizeOk(pair.front) ? void 0 : "true")} data-v-6b0176a8></label><label class="sk-pairfields__field" data-v-6b0176a8><span class="form-field__label" data-v-6b0176a8>hinten</span><input${(0, server_renderer_exports.ssrRenderAttr)("value", pair.rear)} class="input" type="text" spellcheck="false"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", sizeOk(pair.rear) ? void 0 : "true")} data-v-6b0176a8></label></div>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(CodeTags_default, {
					id: `sk-pair-codes-${pair.id}`,
					modelValue: pair.codes,
					"onUpdate:modelValue": ($event) => pair.codes = $event,
					label: `Codes für die Kombination ${pair.front} und ${pair.rear}`,
					onChanged: changed
				}, null, _parent));
				_push(`<div class="sk-line__more" data-v-6b0176a8><button class="sk-iconbtn" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Kombination ${pair.front} und ${pair.rear} entfernen`)} data-v-6b0176a8>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "delete",
					size: 20
				}, null, _parent));
				_push(`</button></div>`);
				if (!sizeOk(pair.front) || !sizeOk(pair.rear)) _push(`<p class="sk-line__error sk-line__wide" data-v-6b0176a8>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(whyUnread)(sizeOk(pair.front) ? pair.rear : pair.front) ?? "Eine Größe der Kombination ist nicht lesbar. Schreib sie etwa so: 225/40 R18.")}</p>`);
				else _push(`<!---->`);
				_push(`<!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(warnings.value.filter((w) => w.id === pair.id), (warning) => {
					_push(`<p class="sk-warn sk-line__wide" data-v-6b0176a8>${(0, server_renderer_exports.ssrInterpolate)(warning.text)}</p>`);
				});
				_push(`<!--]--></li>`);
			});
			_push(`<!--]--></ul>`);
			if (cell.value.pairs.length === 0) _push(`<p class="sk-empty" data-v-6b0176a8>Keine Kombination. Nennt das Gutachten vorne und hinten verschiedene Größen, trag das Paar hier ein.</p>`);
			else _push(`<!---->`);
			_push(`<div class="sk-editor__adds" data-v-6b0176a8><button class="btn btn--secondary" type="button" data-v-6b0176a8>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "plus",
				size: 20
			}, null, _parent));
			_push(` Kombination hinzufügen</button></div></div><div class="sk-editor__block" data-v-6b0176a8><h4 id="sk-general-h" class="sk-editor__label" data-v-6b0176a8>Allgemeine Codes dieser Zeile</h4>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(CodeTags_default, {
				id: "sk-general",
				modelValue: cell.value.general,
				"onUpdate:modelValue": ($event) => cell.value.general = $event,
				label: "Allgemeine Codes dieser Zeile",
				onChanged: changed
			}, null, _parent));
			_push(`</div><div class="sk-editor__block sk-editor__page" data-v-6b0176a8><div class="form-field" data-v-6b0176a8><label class="form-field__label" for="sk-page" data-v-6b0176a8>Seite im Gutachten <span class="sk-optional" data-v-6b0176a8>(optional)</span></label><input id="sk-page"${(0, server_renderer_exports.ssrRenderAttr)("value", cell.value.page)} class="input sk-editor__pageinput" type="text" inputmode="numeric" data-v-6b0176a8></div><button class="btn btn--ghost" type="button" data-v-6b0176a8>PDF-Seite ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(state).pdfPage)} übernehmen</button></div>`);
			if (open.value.length) _push(`<p class="sk-warn" data-v-6b0176a8>${(0, server_renderer_exports.ssrInterpolate)(open.value.length === 1 ? "Ein Code ist" : `${open.value.length} Codes sind`)} noch ohne Beschreibung: ${(0, server_renderer_exports.ssrInterpolate)(open.value.join(", "))}. Klick beim Code auf „beschreiben“. </p>`);
			else _push(`<!---->`);
			_push(`<div class="sk-actions" data-v-6b0176a8><button class="btn btn--secondary sk-actions__left" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!(0, vue_exports.unref)(cellDone)(cell.value)) ? " disabled" : ""} data-v-6b0176a8>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "duplicate",
				size: 20
			}, null, _parent));
			_push(` Kopieren nach … </button><button class="btn btn--primary" type="button" data-v-6b0176a8> Weiter zur nächsten offenen Zeile `);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "arrow-right",
				size: 20
			}, null, _parent));
			_push(`</button></div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(CopyDialog_default, {
				open: copyOpen.value,
				"onUpdate:open": ($event) => copyOpen.value = $event,
				from: __props.group
			}, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(PasteDialog_default, {
				open: pasteOpen.value,
				"onUpdate:open": ($event) => pasteOpen.value = $event,
				group: __props.group
			}, null, _parent));
			_push(`</section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Skizze/parts/CellEditor.vue
var CellEditor_exports = /* @__PURE__ */ __exportAll({ default: () => CellEditor_default });
var _sfc_setup = CellEditor_vue_vue_type_script_setup_true_lang_default.setup;
CellEditor_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Skizze/parts/CellEditor.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var CellEditor_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CellEditor_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-6b0176a8"]]);
//#endregion
export { CellEditor_exports as n, CellEditor_default as t };
