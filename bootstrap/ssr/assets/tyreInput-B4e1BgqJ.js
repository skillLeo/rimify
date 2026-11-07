//#region resources/js/Pages/Admin/Gutachten/Erfassung/tyreInput.ts
/**
* Tyres as a Gutachten prints them, typed or pasted by staff (the Gutachten rework §6, §7 step 4): one size, and „Mehrere
* einfügen" — one size or one front/rear pair per line. Typed text is split, never the PDF read. A figure the paper does not
* give stays not given; what does not read is said, never guessed. The server reads the same notations the same way
* (App\Support\TyreText); both tests read one list of them (tests/Fixtures/tyre-notations.json).
*/
var SPEED_SYMBOLS = [
	"L",
	"M",
	"N",
	"P",
	"Q",
	"R",
	"S",
	"T",
	"U",
	"H",
	"V",
	"W",
	"Y",
	"(Y)"
];
var TYRE = new RegExp(`^(\\d{3})\\s*\\/\\s*(\\d{2})\\s*(?:Z?\\s*R|-)\\s*(\\d{2})(?:\\s*-?\\s*(?:(\\d{2,3})\\s*(\\(Y\\))|\\(?\\s*(?:(\\d{2,3})\\s*([A-Z])?|([A-Z]))\\s*\\)?))?$`);
var ANY_SIZE = /\d{3}\s*\/\s*\d{2}/;
var PAIR = /\s*(?:→|->|\+|–|—)\s*|\s*-\s*(?=(?:(?:HL|XL)\s+)?\d{3}\s*\/)/i;
var NUMBER = /^(?:nr\.?\s*)?(\d{1,3})\s*[:.)]\s*(?=\S)/i;
/** `225/40R18 88W`, `225/40R18-88`, `245/45R18 100`, `235/50R18`, `255/35 R 18 90 W`, `HL 255/35R20 100` → its parts. */
function readTyre(text) {
	let normal = text.replace(/\s+/g, " ").trim().toUpperCase();
	let marker = null;
	const prefix = normal.match(/^(HL|XL)\s+(.*)$/);
	if (prefix) {
		marker = prefix[1] ?? null;
		normal = prefix[2] ?? "";
	}
	const suffix = normal.match(/^(.*?)\s+(XL|HL|RF|REINF|EXTRA LOAD)$/);
	if (suffix) {
		marker ??= suffix[2] === "XL" || suffix[2] === "HL" ? suffix[2] : null;
		normal = suffix[1] ?? "";
	}
	const m = normal.match(TYRE);
	if (!m) return null;
	const symbol = m[5] ?? m[7] ?? m[8] ?? null;
	if (symbol !== null && !SPEED_SYMBOLS.includes(symbol)) return null;
	const index = m[4] ?? m[6] ?? null;
	return {
		width: Number(m[1]),
		aspect: Number(m[2]),
		diameter: Number(m[3]),
		li: index === null ? null : Number(index),
		si: symbol,
		marker
	};
}
/**
* Why a size does not read, where there is more to say than „no size": the size and the load index read, and only the
* speed symbol is one nobody knows (`255/35R18 90X`). Null where nothing more can be said.
*/
function whyUnread(text) {
	const m = text.trim().toUpperCase().match(/^(?:(?:HL|XL)\s+)?\d{3}\s*\/\s*\d{2}\s*Z?\s*R\s*\d{2}\s*-?\s*\(?\s*\d{2,3}\s*([A-Z])\s*\)?$/);
	if (m === null || SPEED_SYMBOLS.includes(m[1] ?? "")) return null;
	return `Das Geschwindigkeitssymbol „${m[1]}“ gibt es nicht.`;
}
/** As the shop and the admin write it: `225/40 R18 88W`, `HL 255/35 R20 100`, `235/50 R18`. */
function tyreLabel(tyre) {
	const minimum = `${tyre.li ?? ""}${tyre.si ?? ""}`;
	return `${tyre.marker ? `${tyre.marker} ` : ""}${tyre.width}/${tyre.aspect} R${tyre.diameter}${minimum === "" ? "" : ` ${minimum}`}`;
}
/** The size alone, whatever the minimum: what a duplicate or a pair is compared by. */
function sizeKey(tyre) {
	return `${tyre.width}/${tyre.aspect}R${tyre.diameter}`;
}
/**
* The box of „Mehrere einfügen": every line on its own, and a paragraph pasted whole from the paper split at each „Nr."
* („Nr. 1: 215/35R19 – 245/30R19, 255/30R19; Nr. 2: …"). One front with several rears is one pair each.
*/
function readPaste(text) {
	const out = [];
	text.split(/\r?\n/).forEach((raw, index) => {
		for (const segment of raw.split(/;\s*(?=nr\.?\s*\d)/i)) {
			const entry = segment.trim();
			if (entry !== "") out.push(readEntry(entry, index + 1));
		}
	});
	return out;
}
function readEntry(entry, line) {
	const numbered = entry.match(NUMBER);
	const number = numbered?.[1];
	const body = numbered ? entry.slice(numbered[0].length) : entry;
	const base = {
		line,
		text: entry,
		...number === void 0 ? {} : { number }
	};
	if (!ANY_SIZE.test(body)) return {
		...base,
		status: "unread",
		reason: "Keine Reifengröße erkannt."
	};
	const parts = body.split(PAIR).map((part) => part.trim());
	if (parts.length > 2) return {
		...base,
		status: "unread",
		reason: "Mehr als zwei Größen in einer Zeile."
	};
	if (parts.length === 2) {
		const front = readTyre(parts[0] ?? "");
		const rears = (parts[1] ?? "").split(/\s*,\s*/).map((part) => readTyre(part));
		if (front === null) return {
			...base,
			status: "unread",
			reason: whyUnread(parts[0] ?? "") ?? "Die vordere Größe ist nicht lesbar."
		};
		if (rears.length === 0 || rears.some((rear) => rear === null)) {
			const bad = (parts[1] ?? "").split(/\s*,\s*/).find((part) => readTyre(part) === null) ?? "";
			return {
				...base,
				status: "unread",
				reason: whyUnread(bad) ?? "Die hintere Größe ist nicht lesbar."
			};
		}
		return {
			...base,
			status: "pair",
			pairs: rears.map((rear) => ({
				front,
				rear
			}))
		};
	}
	const sizes = body.split(/\s*[,;]\s*/).filter((part) => part !== "").map((part) => readTyre(part));
	if (sizes.some((size) => size === null)) {
		const why = whyUnread(body);
		return {
			...base,
			status: "unread",
			reason: why ?? (sizes.every((size) => size === null) ? "Keine Reifengröße erkannt." : "Nicht jede Größe in der Zeile ist lesbar.")
		};
	}
	return {
		...base,
		status: "single",
		sizes
	};
}
/**
* The paste against the wheels of this combination (the operator's brief of 07.11.2026, §3): a size alone stands for both axles
* only where both wheels share its diameter; a pair's sides each on their own wheel. What does not fit is an error line, with the
* reason, and left out like one that does not read.
*/
function checkPaste(lines, wheels) {
	const inch = (value) => String(value).replace(".", ",");
	const misfit = (tyre, wheel, side) => Math.abs(tyre.diameter - wheel) < .001 ? null : `Passt nicht: Die Felge ${side} hat ${inch(wheel)} Zoll, der Reifen R${inch(tyre.diameter)}.`;
	return lines.map((line) => {
		for (const size of line.sizes ?? []) {
			if (Math.abs(wheels.front - wheels.rear) >= .001) return {
				...line,
				status: "unread",
				reason: `Eine Größe allein geht hier nicht: Die Felgen haben vorne ${inch(wheels.front)} und hinten ${inch(wheels.rear)} Zoll. Schreib vorne + hinten.`,
				sizes: void 0
			};
			const why = misfit(size, wheels.front, "vorne und hinten");
			if (why !== null) return {
				...line,
				status: "unread",
				reason: why,
				sizes: void 0
			};
		}
		for (const pair of line.pairs ?? []) {
			const why = misfit(pair.front, wheels.front, "vorne") ?? misfit(pair.rear, wheels.rear, "hinten");
			if (why !== null) return {
				...line,
				status: "unread",
				reason: why,
				pairs: void 0
			};
		}
		return line;
	});
}
/** What „Mehrere einfügen" adds: each read line as vorne + hinten — a size alone on both sides, a pair as a pair. */
function pasteToSides(lines) {
	const out = [];
	for (const line of lines) {
		for (const size of line.sizes ?? []) out.push({
			front: tyreLabel(size),
			rear: tyreLabel(size)
		});
		for (const pair of line.pairs ?? []) out.push({
			front: tyreLabel(pair.front),
			rear: tyreLabel(pair.rear)
		});
	}
	return out;
}
/**
* A kW band as the paper prints it: `85-142`, or one figure for one power (`170 kW`, the §4 Z3). Undefined where nothing is typed,
* null where it does not read. The same reading as the server's (EntryLinesRequest::band).
*/
function parseKwBand(text) {
	const trimmed = text.replace(/\s+/g, " ").trim();
	if (trimmed === "") return;
	const m = trimmed.match(/^(\d{1,4})(?:\s*[-–]\s*(\d{1,4}))?(?:\s*kW)?$/i);
	if (!m) return null;
	const min = Number(m[1]);
	const max = Number(m[2] ?? m[1]);
	return min >= 1 && max <= 1e3 && min <= max ? {
		kw_min: min,
		kw_max: max
	} : null;
}
//#endregion
export { readTyre as a, whyUnread as c, readPaste as i, parseKwBand as n, sizeKey as o, pasteToSides as r, tyreLabel as s, checkPaste as t };
