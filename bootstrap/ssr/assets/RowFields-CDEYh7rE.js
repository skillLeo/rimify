import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { t as DateField_default } from "./DateField-COag7VXL.js";
import { c as parseCodes, f as sentIndex, i as derivedEntry, l as parseKwBand, n as badCodes, s as loadIndex, t as SPEED_SYMBOLS, u as parseTyre } from "./rows-BeQ3HMfa.js";
//#region resources/js/Pages/Admin/Gutachten/RowFields.vue?vue&type=script&setup=true&lang.ts
var RowFields_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "RowFields",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		conditions: {},
		errors: {},
		idPrefix: {},
		pageCount: {}
	}, {
		"form": { required: true },
		"formModifiers": {}
	}),
	emits: /*@__PURE__*/ (0, vue_exports.mergeModels)(["sizes-changed"], ["update:form"]),
	setup(__props, { emit: __emit }) {
		/**
		* What one Verwendungsbereich entry says, typed as the Gutachten prints it: the tyre sizes (`225/40
		* R18`, per axle, each with its own codes), the row's codes (`A01 A12 K1c`) — their meaning is this
		* document's Auflagenverzeichnis, shown under them — the Eintragung, the page it stands on, and, folded
		* away because most rows need none of it, the document's own limits (build period, width and ET range,
		* centre bore).
		*
		* The Eintragung is not typed: it follows from an Abnahme among the codes (the corrections memo §2). A
		* person may set it otherwise only with the reason, which the customer reads as the Prüfer's.
		*
		* Used for adding rows and for changing one; the page owns the values.
		*/
		const props = __props;
		const form = (0, vue_exports.useModel)(__props, "form");
		const left = (0, vue_exports.ref)(/* @__PURE__ */ new Set());
		(0, vue_exports.watch)(() => props.errors, () => {
			left.value = new Set(form.value.tyre_sizes.map((_, index) => index));
		});
		const AXLES = [
			{
				value: "ALL",
				label: "Alle Achsen"
			},
			{
				value: "FRONT",
				label: "Vorderachse"
			},
			{
				value: "REAR",
				label: "Hinterachse"
			}
		];
		const LIMITS = [
			"build_from",
			"build_to",
			"width_min",
			"width_max",
			"et_min",
			"et_max",
			"centre_bore"
		];
		const limits = (0, vue_exports.ref)(null);
		const limitRefused = (0, vue_exports.computed)(() => LIMITS.some((key) => Boolean(props.errors[key])));
		function unfoldLimits() {
			if (limits.value) limits.value.open = true;
		}
		(0, vue_exports.onMounted)(() => {
			if (LIMITS.some((key) => form.value[key] !== "") || limitRefused.value) unfoldLimits();
		});
		(0, vue_exports.watch)(limitRefused, (value) => {
			if (value) unfoldLimits();
		}, { flush: "pre" });
		function id(name) {
			return `${props.idPrefix}-${name}`;
		}
		function err(key) {
			return props.errors[key] ?? "";
		}
		/** What is wrong with a size line's size itself — shown under the line, marked on the size field. */
		function textError(index) {
			const size = form.value.tyre_sizes[index];
			const text = size?.text ?? "";
			if (text.trim() !== "" && parseTyre(text) === null) return left.value.has(index) ? "Diese Reifengröße können wir nicht lesen. Schreib sie bitte so: 225/40 R18 oder 225/40 R18 92Y." : "";
			if (text.trim() === "" && (size?.codes ?? "").trim() !== "") return left.value.has(index) ? "Zu diesen Codes fehlt die Reifengröße." : "";
			const sent = sentIndex(form.value, index);
			return sent === null ? "" : [
				"width_mm",
				"aspect",
				"diameter",
				"axle"
			].map((f) => err(`tyre_sizes.${sent}.${f}`)).find(Boolean) ?? "";
		}
		/** What is wrong with a size line's load index — marked on its own field (his admin item 9). */
		function loadIndexError(index) {
			const size = form.value.tyre_sizes[index];
			if (size !== void 0 && loadIndex(size.min_load_index) === void 0) return left.value.has(index) ? "Diesen Lastindex können wir nicht lesen. Trag nur die ganze Zahl ein, etwa 93; das Geschwindigkeitssymbol hat ein eigenes Feld." : "";
			const sent = sentIndex(form.value, index);
			return sent === null ? "" : err(`tyre_sizes.${sent}.min_load_index`);
		}
		/** What the server said of a size line's speed symbol — marked on its own field. */
		function symbolError(index) {
			const sent = sentIndex(form.value, index);
			return sent === null ? "" : err(`tyre_sizes.${sent}.min_speed_symbol`);
		}
		/** What is wrong with a size line's kW band — marked on its field (Block D). */
		function kwError(index) {
			const size = form.value.tyre_sizes[index];
			if (size !== void 0 && parseKwBand(size.kw ?? "") === null) return left.value.has(index) ? "Den kW-Bereich bitte so, wie das Gutachten ihn druckt: 85-195 – der kleinere Wert zuerst." : "";
			const sent = sentIndex(form.value, index);
			return sent === null ? "" : err(`tyre_sizes.${sent}.kw_min`) || err(`tyre_sizes.${sent}.kw_max`);
		}
		/** What is wrong with a size line's codes — marked on the codes field. */
		function sizeCodesError(index) {
			const sent = sentIndex(form.value, index);
			return (sent === null ? void 0 : err(`tyre_sizes.${sent}.codes`) || Object.entries(props.errors).find(([key, message]) => message && key.startsWith(`tyre_sizes.${sent}.codes.`))?.[1]) || codeWords(form.value.tyre_sizes[index]?.codes ?? "");
		}
		function sizeError(index) {
			return textError(index) || loadIndexError(index) || symbolError(index) || kwError(index) || sizeCodesError(index);
		}
		const byCode = (0, vue_exports.computed)(() => new Map(props.conditions.map((c) => [c.code, c])));
		/** A code that is not a code at all, said before the server has to. */
		function codeWords(text) {
			const bad = badCodes(text);
			return bad.length === 0 ? "" : `${bad.map((c) => `„${c}“`).join(", ")} ${bad.length === 1 ? "ist kein Code" : "sind keine Codes"}: Buchstaben und Ziffern, höchstens 32 Zeichen, so wie im Gutachten.`;
		}
		const rowCodes = (0, vue_exports.computed)(() => parseCodes(form.value.codes).filter((code) => badCodes(code).length === 0));
		const codesError = (0, vue_exports.computed)(() => {
			return err("conditions") || (Object.entries(props.errors).find(([key, message]) => message && /^conditions\.\d+\./.test(key))?.[1] ?? "") || codeWords(form.value.codes);
		});
		/** A size's codes, each with what the document calls it: `T88 · Reifen: Tragfähigkeit`. */
		function sizeMeaning(text) {
			return parseCodes(text).filter((code) => badCodes(code).length === 0).map((code) => {
				const c = byCode.value.get(code);
				return {
					code,
					label: c ? c.kindLabel : "Nicht im Auflagenverzeichnis",
					defined: c !== void 0
				};
			});
		}
		const noting = (0, vue_exports.ref)(new Set(Object.keys(form.value.notes)));
		const entry = (0, vue_exports.computed)(() => derivedEntry(form.value, props.conditions));
		(0, vue_exports.watch)(() => entry.value.required, (required) => {
			if (!required) form.value.entry_note = "";
		});
		/** What the codes alone say, whatever the override. */
		const fromCodes = (0, vue_exports.computed)(() => derivedEntry({
			...form.value,
			entry_override: ""
		}, props.conditions));
		const overriding = (0, vue_exports.computed)({
			get: () => form.value.entry_override !== "",
			set: (on) => {
				form.value.entry_override = on ? fromCodes.value.required ? "not_required" : "required" : "";
			}
		});
		const entryLine = (0, vue_exports.computed)(() => {
			const derived = fromCodes.value;
			const sizes = form.value.tyre_sizes.filter((s) => parseTyre(s.text) !== null);
			const partly = derived.required && derived.sizes.length > 0 && derived.sizes.length < sizes.length ? ` – für ${derived.sizes.map((i) => form.value.tyre_sizes[i]?.text.trim()).filter(Boolean).join(", ")}` : "";
			return derived.required ? `Erforderlich${partly}. Folgt aus ${derived.sources.join(" und ")}.` : "Nicht erforderlich: Kein Code dieser Zeile ist eine Abnahme.";
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "rf" }, _attrs))} data-v-cd4e4110><div class="rf-pair" data-v-cd4e4110><div class="form-field" data-v-cd4e4110><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("axle"))} data-v-cd4e4110>Achse</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", id("axle"))} class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("axle") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("axle")}-err`)} data-v-cd4e4110><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(AXLES, (axle) => {
				_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", axle.value)} data-v-cd4e4110${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.axle) ? (0, server_renderer_exports.ssrLooseContain)(form.value.axle, axle.value) : (0, server_renderer_exports.ssrLooseEqual)(form.value.axle, axle.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(axle.label)}</option>`);
			});
			_push(`<!--]--></select><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("axle")}-err`)} class="form-field__error" data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(err("axle"))}</p></div><div class="form-field" data-v-cd4e4110><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("page"))} data-v-cd4e4110>Seite im Gutachten <span class="rf-optional" data-v-cd4e4110>(optional)</span></label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("page"))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.source_page)} class="input" type="number" min="1"${(0, server_renderer_exports.ssrRenderAttr)("max", __props.pageCount ?? void 0)} inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("source_page") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("page")}-err`)} data-v-cd4e4110><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("page")}-err`)} class="form-field__error" data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(err("source_page"))}</p></div></div><fieldset class="rf-group" data-v-cd4e4110><legend class="form-field__label" data-v-cd4e4110>Reifengrößen</legend>`);
			if (err("tyre_sizes")) _push(`<p class="form-field__error" data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(err("tyre_sizes"))}</p>`);
			else _push(`<!---->`);
			_push(`<div class="rf-sizes-head" aria-hidden="true" data-v-cd4e4110><span data-v-cd4e4110>Größe</span><span data-v-cd4e4110>Lastindex</span><span data-v-cd4e4110>Symbol</span><span data-v-cd4e4110>kW-Bereich</span><span data-v-cd4e4110>Achse</span><span data-v-cd4e4110>Codes nur dieser Größe</span></div><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(form.value.tyre_sizes, (size, index) => {
				_push(`<div class="rf-size" data-v-cd4e4110><div class="form-field rf-size__text" data-v-cd4e4110><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(`size-${index}`))} data-v-cd4e4110>Reifengröße ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id(`size-${index}`))}${(0, server_renderer_exports.ssrRenderAttr)("value", size.text)} class="input" type="text" placeholder="225/40 R18" spellcheck="false" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", textError(index) ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id(`size-${index}`)}-err`)} data-v-cd4e4110></div><div class="form-field rf-size__li" data-v-cd4e4110><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(`size-${index}-li`))} data-v-cd4e4110>Mindest-Lastindex der Reifengröße ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id(`size-${index}-li`))}${(0, server_renderer_exports.ssrRenderAttr)("value", size.min_load_index)} class="input num" type="text" inputmode="numeric" maxlength="3" placeholder="Lastindex" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", loadIndexError(index) ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id(`size-${index}`)}-err`)} data-v-cd4e4110></div><div class="form-field rf-size__symbol" data-v-cd4e4110><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(`size-${index}-symbol`))} data-v-cd4e4110>Mindest-Geschwindigkeitssymbol der Reifengröße ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", id(`size-${index}-symbol`))} class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", symbolError(index) ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id(`size-${index}`)}-err`)} data-v-cd4e4110><option value="" data-v-cd4e4110${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(size.min_speed_symbol) ? (0, server_renderer_exports.ssrLooseContain)(size.min_speed_symbol, "") : (0, server_renderer_exports.ssrLooseEqual)(size.min_speed_symbol, "")) ? " selected" : ""}>Symbol</option><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(SPEED_SYMBOLS), (symbol) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", symbol)} data-v-cd4e4110${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(size.min_speed_symbol) ? (0, server_renderer_exports.ssrLooseContain)(size.min_speed_symbol, symbol) : (0, server_renderer_exports.ssrLooseEqual)(size.min_speed_symbol, symbol)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(symbol)}</option>`);
				});
				_push(`<!--]--></select></div><div class="form-field rf-size__kw" data-v-cd4e4110><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(`size-${index}-kw`))} data-v-cd4e4110>kW-Bereich der Reifengröße ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id(`size-${index}-kw`))}${(0, server_renderer_exports.ssrRenderAttr)("value", size.kw)} class="input" type="text" inputmode="numeric" placeholder="kW, z. B. 85-195" spellcheck="false" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", kwError(index) ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id(`size-${index}`)}-err`)} data-v-cd4e4110></div><div class="form-field rf-size__axle" data-v-cd4e4110><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(`size-${index}-axle`))} data-v-cd4e4110>Achse der Reifengröße ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", id(`size-${index}-axle`))} class="input" data-v-cd4e4110><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(AXLES, (axle) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", axle.value)} data-v-cd4e4110${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(size.axle) ? (0, server_renderer_exports.ssrLooseContain)(size.axle, axle.value) : (0, server_renderer_exports.ssrLooseEqual)(size.axle, axle.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(axle.label)}</option>`);
				});
				_push(`<!--]--></select></div><div class="form-field rf-size__codes" data-v-cd4e4110><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(`size-${index}-codes`))} data-v-cd4e4110>Codes der Reifengröße ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id(`size-${index}-codes`))}${(0, server_renderer_exports.ssrRenderAttr)("value", size.codes)} class="input" type="text" placeholder="Codes, z. B. T88" spellcheck="false" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", sizeCodesError(index) ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id(`size-${index}`)}-err ${id(`size-${index}`)}-codes`)} data-v-cd4e4110></div>`);
				if (form.value.tyre_sizes.length > 1) {
					_push(`<button class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Reifengröße ${index + 1} entfernen`)} data-v-cd4e4110>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "close",
						size: 20
					}, null, _parent));
					_push(`</button>`);
				} else _push(`<!---->`);
				if (sizeMeaning(size.codes).length) {
					_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id(`size-${index}`)}-codes`)} class="rf-size__meaning" data-v-cd4e4110><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(sizeMeaning(size.codes), (m) => {
						_push(`<span class="${(0, server_renderer_exports.ssrRenderClass)({ "rf-undefined": !m.defined })}" data-v-cd4e4110><b data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(m.code)}</b> ${(0, server_renderer_exports.ssrInterpolate)(m.label)}</span>`);
					});
					_push(`<!--]--></p>`);
				} else _push(`<!---->`);
				_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id(`size-${index}`)}-err`)} class="form-field__error rf-size__err" data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(sizeError(index))}</p></div>`);
			});
			_push(`<!--]--><p class="form-field__help" data-v-cd4e4110>Mindest-Lastindex und Geschwindigkeitssymbol, die das Gutachten zur Größe nennt, trägst du in ihre eigenen Felder ein: 93 und Y. Fügst du die Größe so ein, wie das Gutachten sie druckt – 245/35 R19 93Y –, verteilt das Formular die Angaben, sobald du das Feld verlässt. Ein Paar für vorne und hinten – 225/40 R18 92Y / 255/35 R18 94Y – wird zu zwei Zeilen. Druckt das Gutachten neben der Größe einen kW-Bereich, trägst du ihn ins kW-Feld ein, etwa 85-195; die Größe gilt dann nur für Fahrzeuge in diesem Bereich. Codes, die das Gutachten nur bei dieser Größe druckt, trägst du ins Feld für die Codes ein.</p><div data-v-cd4e4110><button class="btn btn--ghost" type="button" data-v-cd4e4110>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "plus",
				size: 20
			}, null, _parent));
			_push(` Reifengröße hinzufügen </button></div></fieldset><div class="rf-group" data-v-cd4e4110><div class="form-field" data-v-cd4e4110><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("codes"))} data-v-cd4e4110>Auflagen dieser Zeile <span class="rf-optional" data-v-cd4e4110>(Codes)</span></label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("codes"))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.codes)} class="input" type="text" placeholder="A01 A12 K1c" spellcheck="false" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", codesError.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("codes")}-help ${id("codes")}-err`)} data-v-cd4e4110><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("codes")}-help`)} class="form-field__help" data-v-cd4e4110>So, wie das Gutachten sie druckt, mit Leerzeichen getrennt; ein Eintrag aus mehreren Wörtern in Anführungszeichen: „Nicht 330D“. Was ein Code bedeutet, steht im Auflagenverzeichnis dieses Gutachtens.</p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("codes")}-err`)} class="form-field__error" data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(codesError.value)}</p></div>`);
			if (rowCodes.value.length) {
				_push(`<ul class="rf-codes" data-v-cd4e4110><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(rowCodes.value, (code) => {
					_push(`<li class="rf-code" data-v-cd4e4110><div class="rf-code__line" data-v-cd4e4110><b class="rf-code__code" data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(code)}</b>`);
					if (byCode.value.get(code)) {
						_push(`<span class="rf-code__text" data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(byCode.value.get(code).text)}<span class="rf-code__meta" data-v-cd4e4110> · ${(0, server_renderer_exports.ssrInterpolate)(byCode.value.get(code).kindLabel)}`);
						if (byCode.value.get(code).page) _push(`<!--[--> · S. ${(0, server_renderer_exports.ssrInterpolate)(byCode.value.get(code).page)}<!--]-->`);
						else _push(`<!---->`);
						_push(`</span></span>`);
					} else _push(`<span class="rf-code__text rf-undefined" data-v-cd4e4110>Nicht im Auflagenverzeichnis. Die Zeile bleibt „Noch nicht bestätigt“ und das Gutachten nicht freigebbar, bis der Code dort steht.</span>`);
					if (!noting.value.has(code)) _push(`<button class="btn btn--ghost rf-code__add" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Zusatz zu ${code}`)} data-v-cd4e4110>Zusatz</button>`);
					else _push(`<!---->`);
					_push(`</div>`);
					if (noting.value.has(code)) _push(`<div class="form-field rf-code__note" data-v-cd4e4110><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id(`note-${code}`))} data-v-cd4e4110>Zusatz zu ${(0, server_renderer_exports.ssrInterpolate)(code)} aus diesem Gutachten <span class="rf-optional" data-v-cd4e4110>(optional)</span></label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id(`note-${code}`))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.notes[code] ?? "")} class="input" type="text" maxlength="300" placeholder="z. B. Nur an der Hinterachse." data-v-cd4e4110></div>`);
					else _push(`<!---->`);
					_push(`</li>`);
				});
				_push(`<!--]--></ul>`);
			} else _push(`<!---->`);
			_push(`</div><div class="rf-group" data-v-cd4e4110><p class="form-field__label rf-entry__label" data-v-cd4e4110>Eintragung in die Fahrzeugpapiere</p><p class="${(0, server_renderer_exports.ssrRenderClass)([{ "rf-entry--struck": overriding.value }, "rf-entry"])}" data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(entryLine.value)}</p><label class="check" data-v-cd4e4110><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(overriding.value) ? (0, server_renderer_exports.ssrLooseContain)(overriding.value, null) : overriding.value) ? " checked" : ""} type="checkbox" data-v-cd4e4110><span data-v-cd4e4110>Abweichend festlegen – laut Prüfer</span></label>`);
			if (overriding.value) _push(`<div class="rf-override" data-v-cd4e4110><div class="rf-radios" role="radiogroup"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", "Eintragung laut Prüfer")} data-v-cd4e4110><label class="check" data-v-cd4e4110><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(form.value.entry_override, "required")) ? " checked" : ""} type="radio" value="required"${(0, server_renderer_exports.ssrRenderAttr)("name", id("override"))} data-v-cd4e4110> <span data-v-cd4e4110>Erforderlich</span></label><label class="check" data-v-cd4e4110><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(form.value.entry_override, "not_required")) ? " checked" : ""} type="radio" value="not_required"${(0, server_renderer_exports.ssrRenderAttr)("name", id("override"))} data-v-cd4e4110> <span data-v-cd4e4110>Nicht erforderlich</span></label></div><div class="form-field" data-v-cd4e4110><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("override-reason"))} data-v-cd4e4110>Warum?</label><textarea${(0, server_renderer_exports.ssrRenderAttr)("id", id("override-reason"))} class="input rf-reason" rows="2" maxlength="500"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("entry_override_reason") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("override-reason")}-help ${id("override-reason")}-err`)} data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(form.value.entry_override_reason)}</textarea><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("override-reason")}-help`)} class="form-field__help" data-v-cd4e4110>Steht im Protokoll und beim Kunden als „Laut Prüfer: …“.</p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("override-reason")}-err`)} class="form-field__error" data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(err("entry_override_reason") || err("entry_override"))}</p></div></div>`);
			else _push(`<!---->`);
			if (entry.value.required) _push(`<div class="form-field" data-v-cd4e4110><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("entry"))} data-v-cd4e4110>Hinweis zur Eintragung <span class="rf-optional" data-v-cd4e4110>(optional)</span></label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("entry"))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.entry_note)} class="input" type="text" maxlength="500" placeholder="z. B. Abnahme nach § 19 Abs. 3 StVZO."${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("entry_note") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("entry")}-err`)} data-v-cd4e4110><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("entry")}-err`)} class="form-field__error" data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(err("entry_note"))}</p></div>`);
			else _push(`<!---->`);
			_push(`</div><details class="rf-more" data-v-cd4e4110><summary class="rf-more__summary" data-v-cd4e4110>Grenzen aus dem Gutachten</summary><p class="form-field__help" data-v-cd4e4110>Nur ausfüllen, wenn das Gutachten sie für diese Zeile nennt. Leer heißt: keine eigene Grenze.</p><div class="rf-pair" data-v-cd4e4110><div class="form-field" data-v-cd4e4110><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("from"))} data-v-cd4e4110>Baujahr ab</label>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(DateField_default, {
				id: id("from"),
				modelValue: form.value.build_from,
				"onUpdate:modelValue": ($event) => form.value.build_from = $event,
				invalid: Boolean(err("build_from")),
				describedby: `${id("from")}-err`
			}, null, _parent));
			_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("from")}-err`)} class="form-field__error" data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(err("build_from"))}</p></div><div class="form-field" data-v-cd4e4110><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("to"))} data-v-cd4e4110>Baujahr bis</label>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(DateField_default, {
				id: id("to"),
				modelValue: form.value.build_to,
				"onUpdate:modelValue": ($event) => form.value.build_to = $event,
				invalid: Boolean(err("build_to")),
				describedby: `${id("to")}-err`
			}, null, _parent));
			_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("to")}-err`)} class="form-field__error" data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(err("build_to"))}</p></div><div class="form-field" data-v-cd4e4110><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("wmin"))} data-v-cd4e4110>Breite von (Zoll)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("wmin"))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.width_min)} class="input" type="text" inputmode="decimal" placeholder="8"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("width_min") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("wmin")}-err`)} data-v-cd4e4110><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("wmin")}-err`)} class="form-field__error" data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(err("width_min"))}</p></div><div class="form-field" data-v-cd4e4110><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("wmax"))} data-v-cd4e4110>Breite bis (Zoll)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("wmax"))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.width_max)} class="input" type="text" inputmode="decimal" placeholder="9"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("width_max") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("wmax")}-err`)} data-v-cd4e4110><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("wmax")}-err`)} class="form-field__error" data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(err("width_max"))}</p></div><div class="form-field" data-v-cd4e4110><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("emin"))} data-v-cd4e4110>ET von (mm)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("emin"))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.et_min)} class="input" type="text" inputmode="numeric" placeholder="30"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("et_min") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("emin")}-err`)} data-v-cd4e4110><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("emin")}-err`)} class="form-field__error" data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(err("et_min"))}</p></div><div class="form-field" data-v-cd4e4110><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("emax"))} data-v-cd4e4110>ET bis (mm)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("emax"))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.et_max)} class="input" type="text" inputmode="numeric" placeholder="45"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("et_max") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("emax")}-err`)} data-v-cd4e4110><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("emax")}-err`)} class="form-field__error" data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(err("et_max"))}</p></div><div class="form-field" data-v-cd4e4110><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("bore"))} data-v-cd4e4110>Mittenlochbohrung laut Gutachten (mm)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("bore"))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.centre_bore)} class="input" type="text" inputmode="decimal" placeholder="66,6"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("centre_bore") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("bore")}-err`)} data-v-cd4e4110><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("bore")}-err`)} class="form-field__error" data-v-cd4e4110>${(0, server_renderer_exports.ssrInterpolate)(err("centre_bore"))}</p></div></div></details></div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/RowFields.vue
var RowFields_exports = /* @__PURE__ */ __exportAll({ default: () => RowFields_default });
var _sfc_setup = RowFields_vue_vue_type_script_setup_true_lang_default.setup;
RowFields_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/RowFields.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var RowFields_default = /*#__PURE__*/ _plugin_vue_export_helper_default(RowFields_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-cd4e4110"]]);
//#endregion
export { RowFields_exports as n, RowFields_default as t };
