import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { t as DateField_default } from "./DateField-COag7VXL.js";
//#region resources/js/Pages/Admin/Gutachten/rows.ts
/**
* `225/40 R18`, `225/40R18`, `225/40 ZR18 92Y`, `225/40-18` → its parts; null when it is not a tyre
* size. What follows the size is the document's own minimum, as a Gutachten prints it: a load index
* and a speed symbol (`92Y`, `92 Y`, `(92Y)`), a load index alone (`93`) or a symbol alone (`Y`). A
* trailing `XL` or `RF` names the tyre's build, not a minimum, and is read past.
*/
function parseTyre(text) {
	const m = text.replace(/[\u00A0\u202F]/g, " ").trim().toUpperCase().match(/^(\d{3})\s*\/\s*(\d{2})\s*(?:Z?R|-)\s*(\d{2})(?:\s*\(?\s*(?:(\d{2,3})\s*([A-Z])?|([A-Z]))\s*\)?)?(?:\s+(?:XL|RF|REINF|EXTRA LOAD))?$/);
	if (!m) return null;
	return {
		width_mm: Number(m[1]),
		aspect: Number(m[2]),
		diameter: Number(m[3]),
		min_load_index: m[4] ? Number(m[4]) : null,
		min_speed_symbol: m[5] ?? m[6] ?? ""
	};
}
/**
* The kW band as a Gutachten prints it beside a size (Block D): `85-195`, `85 – 195 kW`. Undefined for an empty
* field (no band), null for one that does not read — or reads the wrong way round.
*/
function parseKwBand(text) {
	const trimmed = text.replace(/\s+/g, " ").trim();
	if (trimmed === "") return;
	const m = trimmed.match(/^(\d{1,4})\s*[-–]\s*(\d{1,4})(?:\s*kW)?$/i);
	if (!m) return null;
	const [min, max] = [Number(m[1]), Number(m[2])];
	return min >= 1 && max <= 1e3 && min <= max ? {
		kw_min: min,
		kw_max: max
	} : null;
}
/** A band as the form shows it: `85-195`. */
function kwText(size) {
	return size.kw_min == null || size.kw_max == null ? "" : `${size.kw_min}-${size.kw_max}`;
}
/** A size as the form shows it, with the document's minimum where it names one: `245/35 R19 93Y`, `… 93`. */
function tyreText(size) {
	const minimum = `${size.min_load_index ?? ""}${size.min_speed_symbol ?? ""}`;
	return `${size.width_mm}/${size.aspect} R${size.diameter}${minimum === "" ? "" : ` ${minimum}`}`;
}
/**
* A code as the documents print it: letters and digits, words joined by a space or a hyphen — `A01`, `K1c`,
* `5FE`, and what the 18″ Nachtrag prints in its Auflagen column: `Cabrio`, `Heckantrieb`, `Nicht 330D` — at
* most 32 characters. The same rule as the server's (DocumentConditions::CODE).
*/
var CODE = /^[\p{L}\p{N}](?:[\p{L}\p{N} -]{0,30}[\p{L}\p{N}])?$/u;
/**
* The codes typed for a row or a size, as the document prints them: split at spaces, commas and
* semicolons, each kept exactly as typed (`K1c` is not `K1C`), each once, in the order typed. A code of
* several words stands in quotes: `„Nicht 330D“ 57F 68T`.
*/
function parseCodes(text) {
	const seen = /* @__PURE__ */ new Set();
	for (const match of text.matchAll(/„([^“”]*)[“”]|"([^"]*)"|[^\s,;„“”"]+/g)) {
		const code = (match[1] ?? match[2] ?? match[0]).replace(/\s+/g, " ").trim();
		if (code !== "") seen.add(code);
	}
	return [...seen];
}
/** Codes as the form shows them to type again: one of several words in quotes, so it reads back as one. */
function codesText(codes) {
	return codes.map((code) => /\s/.test(code) ? `„${code}“` : code).join(" ");
}
/** A typed code the server will refuse as a code: longer than 32 characters, or not letters and digits. */
function badCodes(text) {
	return parseCodes(text).filter((code) => !CODE.test(code));
}
/**
* The Eintragung the form's codes derive in this document, as the server derives it (FitmentRows): an
* Abnahme among the row's codes or a size's. A person's override decides instead, and says so.
*/
function derivedEntry(form, conditions) {
	const abnahme = new Map(conditions.filter((c) => c.kind === "abnahme").map((c) => [c.code, c]));
	const label = (code) => {
		const page = abnahme.get(code)?.page;
		return page ? `${code}, Seite ${page}` : code;
	};
	const rowSources = parseCodes(form.codes).filter((code) => abnahme.has(code));
	const sizes = [];
	const sources = new Set(rowSources.map(label));
	form.tyre_sizes.forEach((size, index) => {
		if (parseTyre(size.text) === null) return;
		const own = parseCodes(size.codes).filter((code) => abnahme.has(code));
		own.forEach((code) => sources.add(label(code)));
		if (rowSources.length > 0 || own.length > 0) sizes.push(index);
	});
	const fromCodes = sources.size > 0;
	if (form.entry_override !== "") return {
		required: form.entry_override === "required",
		derived: false,
		sources: [...sources],
		sizes
	};
	return {
		required: fromCodes,
		derived: true,
		sources: [...sources],
		sizes
	};
}
function emptySize(axle = "ALL") {
	return {
		text: "",
		axle,
		min_load_index: null,
		min_speed_symbol: "",
		kw: "",
		codes: ""
	};
}
function emptyRow() {
	return {
		axle: "ALL",
		codes: "",
		entry_override: "",
		entry_override_reason: "",
		entry_note: "",
		source_page: null,
		build_from: "",
		build_to: "",
		width_min: "",
		width_max: "",
		et_min: "",
		et_max: "",
		centre_bore: "",
		tyre_sizes: [emptySize()],
		notes: {}
	};
}
/** A saved row, back in the form it was typed in. */
function formFromRow(row) {
	return {
		axle: row.axle,
		codes: codesText(row.conditions.map((c) => c.code)),
		entry_override: row.entryOverride ?? "",
		entry_override_reason: row.entryOverrideReason,
		entry_note: row.entryNote,
		source_page: row.sourcePage,
		build_from: row.buildFrom,
		build_to: row.buildTo,
		width_min: row.widthMin,
		width_max: row.widthMax,
		et_min: row.etMin,
		et_max: row.etMax,
		centre_bore: row.centreBore,
		tyre_sizes: row.tyreSizes.map((s) => ({
			text: tyreText(s),
			axle: s.axle,
			min_load_index: s.min_load_index,
			min_speed_symbol: s.min_speed_symbol,
			kw: kwText(s),
			codes: codesText(s.codes.map((c) => c.code))
		})),
		notes: Object.fromEntries(row.conditions.filter((c) => c.note !== "").map((c) => [c.code, c.note]))
	};
}
/** The lines that cannot be sent: a size that does not read, or codes without their size — by their place. */
function unreadable(form) {
	return form.tyre_sizes.flatMap((size, index) => {
		const text = size.text.trim();
		return text !== "" && parseTyre(size.text) === null || text === "" && size.codes.trim() !== "" || parseKwBand(size.kw ?? "") === null ? [index] : [];
	});
}
/**
* Where the server finds the size on this line: empty and unreadable lines are not sent, so the
* server counts only the sent ones — its sentence about size 2 belongs to the second line sent, not
* to the second line on screen. Null for a line that is not sent.
*/
function sentIndex(form, index) {
	if (parseTyre(form.tyre_sizes[index]?.text ?? "") === null) return null;
	return form.tyre_sizes.slice(0, index).filter((size) => parseTyre(size.text) !== null).length;
}
/** What the server reads: empty size lines left out, each size in its parts. */
function payload(form) {
	const sizes = form.tyre_sizes.map((size) => ({
		size,
		parsed: parseTyre(size.text)
	})).filter((entry) => entry.parsed !== null).map(({ size, parsed }) => ({
		width_mm: parsed.width_mm,
		aspect: parsed.aspect,
		diameter: parsed.diameter,
		min_load_index: parsed.min_load_index,
		min_speed_symbol: parsed.min_speed_symbol,
		axle: size.axle,
		kw_min: parseKwBand(size.kw ?? "")?.kw_min ?? null,
		kw_max: parseKwBand(size.kw ?? "")?.kw_max ?? null,
		codes: parseCodes(size.codes)
	}));
	return {
		axle: form.axle,
		entry_override: form.entry_override === "" ? null : form.entry_override,
		entry_override_reason: form.entry_override === "" ? null : form.entry_override_reason,
		entry_note: form.entry_note,
		source_page: form.source_page === null || String(form.source_page) === "" ? null : Number(form.source_page),
		build_from: form.build_from || null,
		build_to: form.build_to || null,
		width_min: form.width_min,
		width_max: form.width_max,
		et_min: form.et_min,
		et_max: form.et_max,
		centre_bore: form.centre_bore,
		tyre_sizes: sizes,
		conditions: parseCodes(form.codes).map((code) => ({
			code,
			note: form.notes[code] ?? ""
		}))
	};
}
//#endregion
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
				"min_load_index",
				"min_speed_symbol",
				"axle"
			].map((f) => err(`tyre_sizes.${sent}.${f}`)).find(Boolean) ?? "";
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
			return textError(index) || kwError(index) || sizeCodesError(index);
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
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "rf" }, _attrs))} data-v-530bdf01><div class="rf-pair" data-v-530bdf01><div class="form-field" data-v-530bdf01><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("axle"))} data-v-530bdf01>Achse</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", id("axle"))} class="input"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("axle") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("axle")}-err`)} data-v-530bdf01><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(AXLES, (axle) => {
				_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", axle.value)} data-v-530bdf01${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(form.value.axle) ? (0, server_renderer_exports.ssrLooseContain)(form.value.axle, axle.value) : (0, server_renderer_exports.ssrLooseEqual)(form.value.axle, axle.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(axle.label)}</option>`);
			});
			_push(`<!--]--></select><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("axle")}-err`)} class="form-field__error" data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(err("axle"))}</p></div><div class="form-field" data-v-530bdf01><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("page"))} data-v-530bdf01>Seite im Gutachten <span class="rf-optional" data-v-530bdf01>(optional)</span></label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("page"))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.source_page)} class="input" type="number" min="1"${(0, server_renderer_exports.ssrRenderAttr)("max", __props.pageCount ?? void 0)} inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("source_page") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("page")}-err`)} data-v-530bdf01><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("page")}-err`)} class="form-field__error" data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(err("source_page"))}</p></div></div><fieldset class="rf-group" data-v-530bdf01><legend class="form-field__label" data-v-530bdf01>Reifengrößen</legend>`);
			if (err("tyre_sizes")) _push(`<p class="form-field__error" data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(err("tyre_sizes"))}</p>`);
			else _push(`<!---->`);
			_push(`<div class="rf-sizes-head" aria-hidden="true" data-v-530bdf01><span data-v-530bdf01>Größe</span><span data-v-530bdf01>kW-Bereich</span><span data-v-530bdf01>Achse</span><span data-v-530bdf01>Codes nur dieser Größe</span></div><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(form.value.tyre_sizes, (size, index) => {
				_push(`<div class="rf-size" data-v-530bdf01><div class="form-field rf-size__text" data-v-530bdf01><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(`size-${index}`))} data-v-530bdf01>Reifengröße ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id(`size-${index}`))}${(0, server_renderer_exports.ssrRenderAttr)("value", size.text)} class="input" type="text" placeholder="225/40 R18" spellcheck="false" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", textError(index) ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id(`size-${index}`)}-err`)} data-v-530bdf01></div><div class="form-field rf-size__kw" data-v-530bdf01><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(`size-${index}-kw`))} data-v-530bdf01>kW-Bereich der Reifengröße ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id(`size-${index}-kw`))}${(0, server_renderer_exports.ssrRenderAttr)("value", size.kw)} class="input" type="text" inputmode="numeric" placeholder="kW, z. B. 85-195" spellcheck="false" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", kwError(index) ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id(`size-${index}`)}-err`)} data-v-530bdf01></div><div class="form-field rf-size__axle" data-v-530bdf01><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(`size-${index}-axle`))} data-v-530bdf01>Achse der Reifengröße ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", id(`size-${index}-axle`))} class="input" data-v-530bdf01><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(AXLES, (axle) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", axle.value)} data-v-530bdf01${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(size.axle) ? (0, server_renderer_exports.ssrLooseContain)(size.axle, axle.value) : (0, server_renderer_exports.ssrLooseEqual)(size.axle, axle.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(axle.label)}</option>`);
				});
				_push(`<!--]--></select></div><div class="form-field rf-size__codes" data-v-530bdf01><label class="visually-hidden"${(0, server_renderer_exports.ssrRenderAttr)("for", id(`size-${index}-codes`))} data-v-530bdf01>Codes der Reifengröße ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id(`size-${index}-codes`))}${(0, server_renderer_exports.ssrRenderAttr)("value", size.codes)} class="input" type="text" placeholder="Codes, z. B. T88" spellcheck="false" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", sizeCodesError(index) ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id(`size-${index}`)}-err ${id(`size-${index}`)}-codes`)} data-v-530bdf01></div>`);
				if (form.value.tyre_sizes.length > 1) {
					_push(`<button class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Reifengröße ${index + 1} entfernen`)} data-v-530bdf01>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "close",
						size: 20
					}, null, _parent));
					_push(`</button>`);
				} else _push(`<!---->`);
				if (sizeMeaning(size.codes).length) {
					_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id(`size-${index}`)}-codes`)} class="rf-size__meaning" data-v-530bdf01><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(sizeMeaning(size.codes), (m) => {
						_push(`<span class="${(0, server_renderer_exports.ssrRenderClass)({ "rf-undefined": !m.defined })}" data-v-530bdf01><b data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(m.code)}</b> ${(0, server_renderer_exports.ssrInterpolate)(m.label)}</span>`);
					});
					_push(`<!--]--></p>`);
				} else _push(`<!---->`);
				_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id(`size-${index}`)}-err`)} class="form-field__error rf-size__err" data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(sizeError(index))}</p></div>`);
			});
			_push(`<!--]--><p class="form-field__help" data-v-530bdf01>Nennt das Gutachten einen Mindest-Lastindex oder ein Geschwindigkeitssymbol, steht es hinter der Größe: 245/35 R19 93Y oder 245/35 R19 93. Den kW-Bereich, den das Gutachten neben die Größe druckt, trägst du daneben ein – 85-195; nur für diese Leistung gilt die Größe. Codes, die das Gutachten nur bei dieser Größe druckt, stehen dahinter.</p><div data-v-530bdf01><button class="btn btn--ghost" type="button" data-v-530bdf01>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
				name: "plus",
				size: 20
			}, null, _parent));
			_push(` Reifengröße hinzufügen </button></div></fieldset><div class="rf-group" data-v-530bdf01><div class="form-field" data-v-530bdf01><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("codes"))} data-v-530bdf01>Auflagen dieser Zeile <span class="rf-optional" data-v-530bdf01>(Codes)</span></label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("codes"))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.codes)} class="input" type="text" placeholder="A01 A12 K1c" spellcheck="false" autocomplete="off"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", codesError.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("codes")}-help ${id("codes")}-err`)} data-v-530bdf01><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("codes")}-help`)} class="form-field__help" data-v-530bdf01>So, wie das Gutachten sie druckt, mit Leerzeichen getrennt; ein Eintrag aus mehreren Wörtern in Anführungszeichen: „Nicht 330D“. Was ein Code bedeutet, steht im Auflagenverzeichnis dieses Gutachtens.</p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("codes")}-err`)} class="form-field__error" data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(codesError.value)}</p></div>`);
			if (rowCodes.value.length) {
				_push(`<ul class="rf-codes" data-v-530bdf01><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(rowCodes.value, (code) => {
					_push(`<li class="rf-code" data-v-530bdf01><div class="rf-code__line" data-v-530bdf01><b class="rf-code__code" data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(code)}</b>`);
					if (byCode.value.get(code)) {
						_push(`<span class="rf-code__text" data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(byCode.value.get(code).text)}<span class="rf-code__meta" data-v-530bdf01> · ${(0, server_renderer_exports.ssrInterpolate)(byCode.value.get(code).kindLabel)}`);
						if (byCode.value.get(code).page) _push(`<!--[--> · S. ${(0, server_renderer_exports.ssrInterpolate)(byCode.value.get(code).page)}<!--]-->`);
						else _push(`<!---->`);
						_push(`</span></span>`);
					} else _push(`<span class="rf-code__text rf-undefined" data-v-530bdf01>Nicht im Auflagenverzeichnis. Die Zeile bleibt „Noch nicht bestätigt“ und das Gutachten nicht freigebbar, bis der Code dort steht.</span>`);
					if (!noting.value.has(code)) _push(`<button class="btn btn--ghost rf-code__add" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Zusatz zu ${code}`)} data-v-530bdf01>Zusatz</button>`);
					else _push(`<!---->`);
					_push(`</div>`);
					if (noting.value.has(code)) _push(`<div class="form-field rf-code__note" data-v-530bdf01><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id(`note-${code}`))} data-v-530bdf01>Zusatz zu ${(0, server_renderer_exports.ssrInterpolate)(code)} aus diesem Gutachten <span class="rf-optional" data-v-530bdf01>(optional)</span></label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id(`note-${code}`))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.notes[code] ?? "")} class="input" type="text" maxlength="300" placeholder="z. B. Nur an der Hinterachse." data-v-530bdf01></div>`);
					else _push(`<!---->`);
					_push(`</li>`);
				});
				_push(`<!--]--></ul>`);
			} else _push(`<!---->`);
			_push(`</div><div class="rf-group" data-v-530bdf01><p class="form-field__label rf-entry__label" data-v-530bdf01>Eintragung in die Fahrzeugpapiere</p><p class="${(0, server_renderer_exports.ssrRenderClass)([{ "rf-entry--struck": overriding.value }, "rf-entry"])}" data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(entryLine.value)}</p><label class="check" data-v-530bdf01><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(overriding.value) ? (0, server_renderer_exports.ssrLooseContain)(overriding.value, null) : overriding.value) ? " checked" : ""} type="checkbox" data-v-530bdf01><span data-v-530bdf01>Abweichend festlegen – laut Prüfer</span></label>`);
			if (overriding.value) _push(`<div class="rf-override" data-v-530bdf01><div class="rf-radios" role="radiogroup"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", "Eintragung laut Prüfer")} data-v-530bdf01><label class="check" data-v-530bdf01><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(form.value.entry_override, "required")) ? " checked" : ""} type="radio" value="required"${(0, server_renderer_exports.ssrRenderAttr)("name", id("override"))} data-v-530bdf01> <span data-v-530bdf01>Erforderlich</span></label><label class="check" data-v-530bdf01><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(form.value.entry_override, "not_required")) ? " checked" : ""} type="radio" value="not_required"${(0, server_renderer_exports.ssrRenderAttr)("name", id("override"))} data-v-530bdf01> <span data-v-530bdf01>Nicht erforderlich</span></label></div><div class="form-field" data-v-530bdf01><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("override-reason"))} data-v-530bdf01>Warum?</label><textarea${(0, server_renderer_exports.ssrRenderAttr)("id", id("override-reason"))} class="input rf-reason" rows="2" maxlength="500"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("entry_override_reason") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("override-reason")}-help ${id("override-reason")}-err`)} data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(form.value.entry_override_reason)}</textarea><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("override-reason")}-help`)} class="form-field__help" data-v-530bdf01>Steht im Protokoll und beim Kunden als „Laut Prüfer: …“.</p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("override-reason")}-err`)} class="form-field__error" data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(err("entry_override_reason") || err("entry_override"))}</p></div></div>`);
			else _push(`<!---->`);
			if (entry.value.required) _push(`<div class="form-field" data-v-530bdf01><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("entry"))} data-v-530bdf01>Hinweis zur Eintragung <span class="rf-optional" data-v-530bdf01>(optional)</span></label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("entry"))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.entry_note)} class="input" type="text" maxlength="500" placeholder="z. B. Abnahme nach § 19 Abs. 3 StVZO."${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("entry_note") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("entry")}-err`)} data-v-530bdf01><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("entry")}-err`)} class="form-field__error" data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(err("entry_note"))}</p></div>`);
			else _push(`<!---->`);
			_push(`</div><details class="rf-more" data-v-530bdf01><summary class="rf-more__summary" data-v-530bdf01>Grenzen aus dem Gutachten</summary><p class="form-field__help" data-v-530bdf01>Nur ausfüllen, wenn das Gutachten sie für diese Zeile nennt. Leer heißt: keine eigene Grenze.</p><div class="rf-pair" data-v-530bdf01><div class="form-field" data-v-530bdf01><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("from"))} data-v-530bdf01>Baujahr ab</label>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(DateField_default, {
				id: id("from"),
				modelValue: form.value.build_from,
				"onUpdate:modelValue": ($event) => form.value.build_from = $event,
				invalid: Boolean(err("build_from")),
				describedby: `${id("from")}-err`
			}, null, _parent));
			_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("from")}-err`)} class="form-field__error" data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(err("build_from"))}</p></div><div class="form-field" data-v-530bdf01><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("to"))} data-v-530bdf01>Baujahr bis</label>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(DateField_default, {
				id: id("to"),
				modelValue: form.value.build_to,
				"onUpdate:modelValue": ($event) => form.value.build_to = $event,
				invalid: Boolean(err("build_to")),
				describedby: `${id("to")}-err`
			}, null, _parent));
			_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("to")}-err`)} class="form-field__error" data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(err("build_to"))}</p></div><div class="form-field" data-v-530bdf01><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("wmin"))} data-v-530bdf01>Breite von (Zoll)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("wmin"))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.width_min)} class="input" type="text" inputmode="decimal" placeholder="8"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("width_min") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("wmin")}-err`)} data-v-530bdf01><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("wmin")}-err`)} class="form-field__error" data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(err("width_min"))}</p></div><div class="form-field" data-v-530bdf01><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("wmax"))} data-v-530bdf01>Breite bis (Zoll)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("wmax"))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.width_max)} class="input" type="text" inputmode="decimal" placeholder="9"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("width_max") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("wmax")}-err`)} data-v-530bdf01><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("wmax")}-err`)} class="form-field__error" data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(err("width_max"))}</p></div><div class="form-field" data-v-530bdf01><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("emin"))} data-v-530bdf01>ET von (mm)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("emin"))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.et_min)} class="input" type="text" inputmode="numeric" placeholder="30"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("et_min") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("emin")}-err`)} data-v-530bdf01><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("emin")}-err`)} class="form-field__error" data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(err("et_min"))}</p></div><div class="form-field" data-v-530bdf01><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("emax"))} data-v-530bdf01>ET bis (mm)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("emax"))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.et_max)} class="input" type="text" inputmode="numeric" placeholder="45"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("et_max") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("emax")}-err`)} data-v-530bdf01><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("emax")}-err`)} class="form-field__error" data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(err("et_max"))}</p></div><div class="form-field" data-v-530bdf01><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", id("bore"))} data-v-530bdf01>Mittenlochbohrung laut Gutachten (mm)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", id("bore"))}${(0, server_renderer_exports.ssrRenderAttr)("value", form.value.centre_bore)} class="input" type="text" inputmode="decimal" placeholder="66,6"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("centre_bore") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${id("bore")}-err`)} data-v-530bdf01><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${id("bore")}-err`)} class="form-field__error" data-v-530bdf01>${(0, server_renderer_exports.ssrInterpolate)(err("centre_bore"))}</p></div></div></details></div>`);
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
var RowFields_default = /*#__PURE__*/ _plugin_vue_export_helper_default(RowFields_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-530bdf01"]]);
//#endregion
export { formFromRow as a, emptyRow as i, RowFields_exports as n, payload as o, codesText as r, unreadable as s, RowFields_default as t };
