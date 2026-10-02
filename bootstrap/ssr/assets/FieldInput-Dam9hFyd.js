import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { i as isIconName, t as Icon_default } from "./Icon-DUS6sqAV.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as formatNumber } from "./num-Br8qlecZ.js";
//#region resources/js/Pages/Admin/Seiten/content.ts
/** A text as the server keeps it (PageSchema::string): line endings as `\n`, trimmed. */
function normalised(value) {
	return value.replace(/\r\n?/g, "\n").trim();
}
/** Characters as the server's mb_strlen counts them, after it trims: an emoji is one, not two. */
function length(value) {
	return typeof value === "string" ? Array.from(normalised(value)).length : 0;
}
/** Over its limit, the way the publish check will say it is. */
function overLimit(field, value) {
	return field.max !== null && field.kind !== "number" && length(value) > field.max;
}
function emptyValue(field) {
	if (field.kind === "number") return field.min ?? 1;
	if (field.kind === "icon") return field.options?.[0]?.value ?? "";
	return "";
}
/** A new, empty item of a block's list — every field present, so the form's shape never shifts. */
function emptyItem(fields) {
	const item = {};
	for (const field of fields) item[field.key] = emptyValue(field);
	return item;
}
/** A new, empty block of a type, including an empty list where the type has one. */
function emptyBlock(block) {
	const data = { ...emptyItem(block.fields) };
	if (block.list) data[block.list.key] = [emptyItem(block.list.fields)];
	return {
		type: block.type,
		data
	};
}
/** The one repeatable block type of a page, if it has one (guide and legal sections). */
function repeatable(schema) {
	return schema.blocks.find((block) => block.repeat) ?? null;
}
/** „Abschnitt 3" for a repeatable block, the plain label for a fixed one. */
function blockLabel(schema, blocks, index) {
	const block = blocks[index];
	const definition = schema.blocks.find((b) => b.type === block?.type);
	if (!block || !definition) return "";
	if (!definition.repeat) return definition.label;
	const nth = blocks.slice(0, index + 1).filter((b) => b.type === block.type).length;
	return `${definition.label} ${nth}`;
}
function same(a, b) {
	return (typeof a === "string" ? normalised(a) : a ?? null) === (typeof b === "string" ? normalised(b) : b ?? null);
}
function words(value) {
	return value === null || value === void 0 ? "" : String(value);
}
/** A block's or an item's words in reading order, for a place that is new or gone as a whole. */
function allWords(data, fields) {
	return fields.filter((field) => field.kind !== "icon").map((field) => words(data?.[field.key])).filter((text) => text !== "").join("\n\n");
}
/**
* Every place where `after` differs from `before`, in reading order, with its words: „Titel",
* „Einstieg · Überschrift", „Abschnitt 3 · Text", „Abschnitt 7 (neu)", „Versprechen 2 (entfernt)".
* Positional, like the server: a section moved up reads as the two places it changed.
*/
function diff(schema, before, after) {
	const out = [];
	for (const field of schema.page) {
		const key = field.key;
		if (!same(before[key] ?? "", after[key] ?? "")) out.push({
			label: field.label,
			before: words(before[key]),
			after: words(after[key])
		});
	}
	const seen = {};
	const total = Math.max(before.blocks.length, after.blocks.length);
	for (let i = 0; i < total; i++) {
		const old = before.blocks[i];
		const now = after.blocks[i];
		const type = (now ?? old)?.type ?? "";
		const definition = schema.blocks.find((b) => b.type === type);
		if (!definition) continue;
		seen[type] = (seen[type] ?? 0) + 1;
		const where = definition.repeat ? `${definition.label} ${seen[type]}` : definition.label;
		if (!old || old.type !== type) {
			out.push({
				label: `${where} (neu)`,
				before: "",
				after: allWords(now?.data, definition.fields)
			});
			continue;
		}
		if (!now) {
			out.push({
				label: `${where} (entfernt)`,
				before: allWords(old.data, definition.fields),
				after: ""
			});
			continue;
		}
		for (const field of definition.fields) if (!same(old.data[field.key], now.data[field.key])) out.push({
			label: `${where} · ${field.label}`,
			before: shown(field, old.data[field.key]),
			after: shown(field, now.data[field.key])
		});
		const list = definition.list;
		if (list) {
			const oldItems = Array.isArray(old.data[list.key]) ? old.data[list.key] : [];
			const newItems = Array.isArray(now.data[list.key]) ? now.data[list.key] : [];
			const items = Math.max(oldItems.length, newItems.length);
			for (let j = 0; j < items; j++) {
				const itemWhere = `${list.itemLabel} ${j + 1}`;
				const a = oldItems[j];
				const b = newItems[j];
				if (!a) out.push({
					label: `${itemWhere} (neu)`,
					before: "",
					after: allWords(b, list.fields)
				});
				else if (!b) out.push({
					label: `${itemWhere} (entfernt)`,
					before: allWords(a, list.fields),
					after: ""
				});
				else for (const field of list.fields) if (!same(a[field.key], b[field.key])) out.push({
					label: `${itemWhere} · ${field.label}`,
					before: shown(field, a[field.key]),
					after: shown(field, b[field.key])
				});
			}
		}
	}
	return out;
}
/** A value as a person reads it: a glyph by its name („Werkzeug"), anything else as written. */
function shown(field, value) {
	if (field.kind === "icon") return field.options?.find((option) => option.value === value)?.label ?? words(value);
	return words(value);
}
/**
* Where an error of the publish check sits, named as the diff names places: „Titel", „Einstieg ·
* Überschrift", „Abschnitt 3 · Text", „Versprechen 2 · Titel". The server's message is said under
* the field without a place; the summary above the fields puts the two together. Empty for an
* error about the page as a whole, whose sentence stands on its own.
*/
function placeOf(schema, blocks, path) {
	const pageField = schema.page.find((field) => field.key === path);
	if (pageField) return pageField.label;
	const match = /^blocks\.(\d+)\.data\.([^.]+)(?:\.(\d+)\.([^.]+))?$/.exec(path);
	if (!match) return "";
	const index = Number(match[1]);
	const definition = schema.blocks.find((b) => b.type === blocks[index]?.type);
	const where = blockLabel(schema, blocks, index);
	if (!definition) return where;
	if (match[3] !== void 0 && definition.list) {
		const field = definition.list.fields.find((f) => f.key === match[4]);
		return `${definition.list.itemLabel} ${Number(match[3]) + 1}${field ? ` · ${field.label}` : ""}`;
	}
	const field = definition.fields.find((f) => f.key === match[2]);
	return field ? `${where} · ${field.label}` : where;
}
/** The id a field's input carries, stable per position, so a server error can find its field. */
function fieldId(path) {
	return `pg-${path.replace(/[^a-zA-Z0-9]+/g, "-")}`;
}
/** Moves one element of a list by one place; out of bounds leaves the list as it is. */
function move(list, from, to) {
	if (to < 0 || to >= list.length || from === to) return list;
	const next = [...list];
	const [item] = next.splice(from, 1);
	next.splice(to, 0, item);
	return next;
}
//#endregion
//#region resources/js/Pages/Admin/Seiten/FieldInput.vue?vue&type=script&setup=true&lang.ts
var FieldInput_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "FieldInput",
	__ssrInlineRender: true,
	props: /*@__PURE__*/ (0, vue_exports.mergeModels)({
		field: {},
		id: {},
		error: { default: "" },
		readonly: {
			type: Boolean,
			default: false
		}
	}, {
		"modelValue": { required: true },
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		/**
		* One field of a page, drawn from its schema: the label, the right control, the counter, the help
		* line and the error. The counter reads the same limit the publish check enforces, so a text that
		* turns red here is exactly a text the server will refuse — never a guess (BRIEF-2 §1).
		*
		* The counter is quiet until it matters: always on for short fields, where every character counts,
		* and on a long text only once it passes nine tenths of the limit.
		*/
		const props = __props;
		const model = (0, vue_exports.useModel)(__props, "modelValue");
		const count = (0, vue_exports.computed)(() => length(model.value));
		const over = (0, vue_exports.computed)(() => overLimit(props.field, model.value));
		const showCounter = (0, vue_exports.computed)(() => {
			const max = props.field.max;
			if (max === null || props.field.kind === "number" || props.field.kind === "icon") return false;
			return max <= 300 || count.value >= max * .9;
		});
		const counterText = (0, vue_exports.computed)(() => {
			const max = props.field.max ?? 0;
			return `${formatNumber(count.value)} / ${formatNumber(max)}`;
		});
		const rows = (0, vue_exports.computed)(() => {
			const lines = (typeof model.value === "string" ? model.value : "").split("\n").reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / 72)), 0);
			return Math.min(20, Math.max(props.field.max !== null && props.field.max <= 250 ? 2 : 4, lines));
		});
		const describedBy = (0, vue_exports.computed)(() => [
			props.field.help ? `${props.id}-help` : null,
			`${props.id}-err`,
			showCounter.value ? `${props.id}-count` : null
		].filter(Boolean).join(" "));
		const iconName = (0, vue_exports.computed)(() => typeof model.value === "string" && isIconName(model.value) ? model.value : null);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "form-field pg-field" }, _attrs))} data-v-40be2ee3><div class="pg-field__top" data-v-40be2ee3><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", __props.id)} data-v-40be2ee3>${(0, server_renderer_exports.ssrInterpolate)(__props.field.label)}`);
			if (!__props.field.required) _push(`<span class="pg-field__optional" data-v-40be2ee3> (optional)</span>`);
			else _push(`<!---->`);
			_push(`</label>`);
			if (showCounter.value) _push(`<span${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-count`)} class="${(0, server_renderer_exports.ssrRenderClass)([{ "pg-field__count--over": over.value }, "pg-field__count"])}"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${count.value} von höchstens ${__props.field.max} Zeichen`)} data-v-40be2ee3>${(0, server_renderer_exports.ssrInterpolate)(counterText.value)}</span>`);
			else _push(`<!---->`);
			_push(`</div>`);
			if (__props.field.kind === "textarea") _push(`<textarea${(0, server_renderer_exports.ssrRenderAttr)("id", __props.id)} class="input pg-field__area"${(0, server_renderer_exports.ssrRenderAttr)("rows", rows.value)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.readonly) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-required", __props.field.required ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", __props.error || over.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy.value)} data-v-40be2ee3>${(0, server_renderer_exports.ssrInterpolate)(model.value)}</textarea>`);
			else if (__props.field.kind === "icon") {
				_push(`<div class="pg-field__icon" data-v-40be2ee3><span class="pg-field__glyph" aria-hidden="true" data-v-40be2ee3>`);
				if (iconName.value) _push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
					name: iconName.value,
					size: 20
				}, null, _parent));
				else _push(`<!---->`);
				_push(`</span><select${(0, server_renderer_exports.ssrRenderAttr)("id", __props.id)} class="input"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.readonly) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", __props.error ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy.value)} data-v-40be2ee3><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.field.options ?? [], (option) => {
					_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", option.value)} data-v-40be2ee3${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(model.value) ? (0, server_renderer_exports.ssrLooseContain)(model.value, option.value) : (0, server_renderer_exports.ssrLooseEqual)(model.value, option.value)) ? " selected" : ""}>${(0, server_renderer_exports.ssrInterpolate)(option.label)}</option>`);
				});
				_push(`<!--]--></select></div>`);
			} else if (__props.field.kind === "number") _push(`<input${(0, server_renderer_exports.ssrRenderAttr)("id", __props.id)} class="input pg-field__number" type="text" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("value", model.value ?? "")}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.readonly) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-required", __props.field.required ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", __props.error ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy.value)} data-v-40be2ee3>`);
			else _push(`<input${(0, server_renderer_exports.ssrRenderAttr)("id", __props.id)}${(0, server_renderer_exports.ssrRenderAttr)("value", model.value)} class="input" type="text"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.readonly) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-required", __props.field.required ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", __props.error || over.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", describedBy.value)} data-v-40be2ee3>`);
			if (__props.field.help) _push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-help`)} class="form-field__help" data-v-40be2ee3>${(0, server_renderer_exports.ssrInterpolate)(__props.field.help)}</p>`);
			else _push(`<!---->`);
			_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${__props.id}-err`)} class="form-field__error" data-v-40be2ee3>${(0, server_renderer_exports.ssrInterpolate)(__props.error)}</p></div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Seiten/FieldInput.vue
var FieldInput_exports = /* @__PURE__ */ __exportAll({ default: () => FieldInput_default });
var _sfc_setup = FieldInput_vue_vue_type_script_setup_true_lang_default.setup;
FieldInput_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Seiten/FieldInput.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var FieldInput_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FieldInput_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-40be2ee3"]]);
//#endregion
export { emptyBlock as a, move as c, diff as i, placeOf as l, FieldInput_exports as n, emptyItem as o, blockLabel as r, fieldId as s, FieldInput_default as t, repeatable as u };
