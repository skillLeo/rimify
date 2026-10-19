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
	if (field.kind === "choice") return field.default ?? field.options?.[0]?.value ?? "";
	return "";
}
/** A new, empty item of a block's list — every field present, so the form's shape never shifts. */
function emptyItem(fields) {
	const item = {};
	for (const field of fields) item[field.key] = emptyValue(field);
	return item;
}
/** A table starts with two columns and one row, as the server's skeleton does (PageSchema::emptyValues). */
var NEW_TABLE_COLUMNS = 2;
/** A new, empty block of a type, including an empty list where the type has one. */
function emptyBlock(block) {
	const data = {};
	for (const field of block.fields) if (field.kind === "grid") {
		data[field.key] = Array.from({ length: NEW_TABLE_COLUMNS }, () => "");
		data.rows = [Array.from({ length: NEW_TABLE_COLUMNS }, () => "")];
	} else if (field.kind === "image") {
		data[field.key] = "";
		data.width = null;
		data.height = null;
	} else data[field.key] = emptyValue(field);
	if (block.list) data[block.list.key] = [emptyItem(block.list.fields)];
	return {
		type: block.type,
		data
	};
}
/** The repeatable block types of a page, in the schema's order: a legal page's sections, an article's building blocks. */
function repeatables(schema) {
	return schema.blocks.filter((block) => block.repeat);
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
	const stored = (value) => typeof value === "string" ? normalised(value) : value ?? null;
	if (a !== null && typeof a === "object" || b !== null && typeof b === "object") return JSON.stringify(a, (_key, value) => stored(value)) === JSON.stringify(b, (_key, value) => stored(value));
	return stored(a) === stored(b);
}
function words(value) {
	return value === null || value === void 0 ? "" : String(value);
}
/** A field's value as two versions are compared: a table's headings and rows together, anything else as stored. */
function comparable(field, data) {
	return field.kind === "grid" ? {
		head: data?.head ?? [],
		rows: data?.rows ?? []
	} : data?.[field.key];
}
/** A block's or an item's words in reading order, for a place that is new or gone as a whole. */
function allWords(data, fields) {
	return fields.filter((field) => field.kind !== "icon").map((field) => shown(field, comparable(field, data))).filter((text) => text !== "").join("\n\n");
}
/** A version's blocks by their place among their own kind, in reading order — PageSchema::placed on the server. */
function placed(schema, blocks) {
	const out = /* @__PURE__ */ new Map();
	const seen = {};
	for (const block of blocks) {
		const definition = schema.blocks.find((b) => b.type === block.type);
		if (!definition) continue;
		seen[block.type] = (seen[block.type] ?? 0) + 1;
		const nth = seen[block.type] ?? 1;
		out.set(`${block.type}#${nth}`, {
			definition,
			label: definition.repeat ? `${definition.label} ${nth}` : definition.label,
			data: block.data
		});
	}
	return out;
}
/**
* Every place where `after` differs from `before`, with its words: „Titel", „Einstieg · Überschrift",
* „Abschnitt 3 · Text", „Abschnitt 7 (neu)", „Zitat 1 (entfernt)". Each kind of block is compared among
* its own, by its place, like the server: a section moved up reads as the two places it changed, a quote
* removed between two sections as the quote's removal (SEI-25), and another order of the kinds as
* „Reihenfolge der Bausteine".
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
	const was = placed(schema, before.blocks);
	const is = placed(schema, after.blocks);
	for (const [key, place] of is) {
		const { definition, label: where } = place;
		const now = { data: place.data };
		const kept = was.get(key);
		if (!kept) {
			out.push({
				label: `${where} (neu)`,
				before: "",
				after: allWords(now.data, definition.fields)
			});
			continue;
		}
		const old = { data: kept.data };
		for (const field of definition.fields) {
			const a = comparable(field, old.data);
			const b = comparable(field, now.data);
			if (!same(a, b)) out.push({
				label: `${where} · ${field.label}`,
				before: shown(field, a),
				after: shown(field, b)
			});
		}
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
	for (const [key, place] of was) if (!is.has(key)) out.push({
		label: `${place.label} (entfernt)`,
		before: allWords(place.data, place.definition.fields),
		after: ""
	});
	const kept = [...was.keys()].filter((key) => is.has(key));
	const now = [...is.keys()].filter((key) => was.has(key));
	if (kept.join("|") !== now.join("|")) out.push({
		label: "Reihenfolge der Bausteine",
		before: kept.map((key) => was.get(key)?.label ?? "").join(", "),
		after: now.map((key) => is.get(key)?.label ?? "").join(", ")
	});
	return out;
}
/** A value as a person reads it: a glyph or a choice by its name („Werkzeug"), anything else as written. */
function shown(field, value) {
	if (field.kind === "icon" || field.kind === "choice") return field.options?.find((option) => option.value === value)?.label ?? words(value);
	if (field.kind === "image") return typeof value === "string" && value !== "" ? value.split("?")[0]?.split("/").pop() ?? "" : "";
	if (field.kind === "grid" && value !== null && typeof value === "object") {
		const table = value;
		const rows = Array.isArray(table.rows) ? table.rows : [];
		return [table.head, ...rows].map((row) => Array.isArray(row) ? row.filter((cell) => typeof cell === "string").join(" | ") : "").join("\n").trim();
	}
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
	const field = definition.fields.find((f) => f.key === match[2] || match[2] === "rows" && f.kind === "grid");
	return field ? `${where} · ${field.label}` : where;
}
/** The id a field's input carries, stable per position, so a server error can find its field. */
function fieldId(path) {
	return `pg-${path.replace(/[^a-zA-Z0-9]+/g, "-")}`;
}
/**
* A guard for buttons that change a list's structure. The second click of a double-click lands on whatever just moved
* into the place — it would remove that one too, or move it back (SEI-24, SEI-33). A pointer's click within 400 ms of
* the last change is taken once; a key press (`detail` 0) always, since focus follows what it moved.
*/
function clickGuard() {
	let last = Number.NEGATIVE_INFINITY;
	return (event) => {
		const now = performance.now();
		if (event !== void 0 && event.detail > 0 && (event.detail > 1 || now - last < 400)) return false;
		last = now;
		return true;
	};
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
export { emptyItem as a, move as c, repeatables as d, emptyBlock as i, overLimit as l, clickGuard as n, fieldId as o, diff as r, length as s, blockLabel as t, placeOf as u };
