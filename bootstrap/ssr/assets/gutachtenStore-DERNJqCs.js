import { u as vue_exports } from "../ssr.js";
import { n as decimal, s as withUnit } from "./format-6R0uUMt3.js";
import { t as SPEED_SYMBOLS, u as parseTyre } from "./rows-BeQ3HMfa.js";
//#region resources/js/Pages/Admin/Skizze/tyreInput.ts
/**
* The sketch's reading of tyres typed or pasted from a Gutachten (the Gutachten rework brief §6, §7 step 4): one size as the
* paper prints it, and „Mehrere einfügen" — one size or one front/rear pair per line. Typed text is split, never the PDF
* read. A figure the paper does not give stays not given; what does not read is said, never guessed.
*
* The size itself is the admin's own reading (`parseTyre`, rows.ts); this adds the one notation it leaves out, the load
* index after a hyphen (`225/40R18-88`), and refuses a speed symbol the server's table does not know.
*/
var ANY_SIZE = /\d{3}\s*\/\s*\d{2}/;
var PAIR = /\s*(?:→|->|\+|–|—)\s*|\s*-\s*(?=\d{3}\s*\/)/;
var NUMBER = /^(?:nr\.?\s*)?(\d{1,3})\s*[:.)]\s*(?=\S)/i;
/** `225/40R18 88W`, `225/40 R18 88W`, `225/40R18-88`, `245/45R18 100`, `235/50R18`, `255/35 R 18 90 W` → its parts. */
function readTyre(text) {
	const normalised = text.replace(/[\u00A0\u202F]/g, " ").replace(/\s+/g, " ").trim().replace(/^(\d{3}\s*\/\s*\d{2}\s*Z?R\s*\d{2})\s*-\s*(?=\d{2,3}(?:\s*[A-Za-z(]|\s*$))/i, "$1 ");
	const parsed = parseTyre(normalised);
	if (parsed === null) return null;
	const symbol = parsed.min_speed_symbol === "" ? null : parsed.min_speed_symbol;
	if (symbol !== null && !SPEED_SYMBOLS.includes(symbol)) return null;
	return {
		width: parsed.width_mm,
		aspect: parsed.aspect,
		diameter: parsed.diameter,
		li: parsed.min_load_index,
		si: symbol
	};
}
/**
* Why a size does not read, where there is more to say than „no size": the size and the load index read, and only the
* speed symbol is one the server's table does not know (`255/35R18 90X`). Null where nothing more can be said.
*/
function whyUnread(text) {
	const m = text.trim().toUpperCase().match(/^\d{3}\s*\/\s*\d{2}\s*Z?R\s*\d{2}\s*-?\s*\(?\s*\d{2,3}\s*([A-Z])\s*\)?$/);
	if (m === null || SPEED_SYMBOLS.includes(m[1] ?? "")) return null;
	return `Das Geschwindigkeitssymbol „${m[1]}“ gibt es nicht.`;
}
/** As the shop and the admin write it: `225/40 R18 88W`, `245/45 R18 100`, `235/50 R18`. */
function tyreLabel(tyre) {
	const minimum = `${tyre.li ?? ""}${tyre.si ?? ""}`;
	return `${tyre.width}/${tyre.aspect} R${tyre.diameter}${minimum === "" ? "" : ` ${minimum}`}`;
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
//#endregion
//#region resources/js/Pages/Admin/Skizze/gutachtenSketch.ts
var nextId = 1e3;
/** A fresh id for a line made in the browser: a copied line never shares one with its source. */
function lineId() {
	nextId += 1;
	return nextId;
}
/**
* After a session is restored: the counter starts above every id the restored lines hold, so a new line never takes
* one of theirs — typed text would land in the other line, and removing one would remove both.
*/
function reserveLineIds(cells) {
	for (const cell of cells) for (const line of [...cell.tyres, ...cell.pairs]) nextId = Math.max(nextId, line.id);
}
/** `2 Reifen · 1 Kombination`, `1 Reifen`, `noch leer`. */
function cellSummary(cell) {
	const parts = [];
	if (cell.tyres.length > 0) parts.push(`${cell.tyres.length} Reifen`);
	if (cell.pairs.length > 0) parts.push(`${cell.pairs.length} ${cell.pairs.length === 1 ? "Kombination" : "Kombinationen"}`);
	return parts.length === 0 ? "noch leer" : parts.join(" · ");
}
/** A row is entered once it holds one line that reads: an empty or unreadable line is not a tyre. */
function cellDone(cell) {
	return cell.tyres.some((line) => readTyre(line.text) !== null) || cell.pairs.some((pair) => readTyre(pair.front) !== null && readTyre(pair.rear) !== null);
}
/** The lines that do not read — empty, or not a size — which keep a paper from release until they are fixed or removed. */
function unreadableLines(cell) {
	return [...cell.tyres.filter((line) => readTyre(line.text) === null).map((line) => line.id), ...cell.pairs.filter((pair) => readTyre(pair.front) === null || readTyre(pair.rear) === null).map((pair) => pair.id)];
}
function lineKey(line) {
	const tyre = readTyre(line.text);
	return `${tyre === null ? line.text.trim() : sizeKey(tyre)}|${line.kw.trim()}|${line.axle}`;
}
function pairKey(pair) {
	const front = readTyre(pair.front);
	const rear = readTyre(pair.rear);
	return `${front === null ? pair.front : sizeKey(front)}|${rear === null ? pair.rear : sizeKey(rear)}`;
}
function copyTyre(line) {
	return {
		...line,
		id: lineId(),
		codes: [...line.codes]
	};
}
function copyPair(pair) {
	return {
		...pair,
		id: lineId(),
		codes: [...pair.codes]
	};
}
/**
* „Kopieren nach …": `ersetzen` puts the source's tyres, pairs and general codes in place of the target's; `hinzufuegen`
* adds the lines the target does not hold yet and keeps its own. Either way the target says where it came from until
* someone edits it, and keeps its own page: each row of a paper stands on a page of its own.
*/
function copyCell(source, target, mode, sourceName) {
	if (mode === "ersetzen") return {
		...target,
		tyres: source.tyres.map(copyTyre),
		pairs: source.pairs.map(copyPair),
		general: [...source.general],
		copiedFrom: sourceName
	};
	const tyreKeys = new Set(target.tyres.map(lineKey));
	const pairKeys = new Set(target.pairs.map(pairKey));
	return {
		...target,
		tyres: [...target.tyres, ...source.tyres.filter((line) => !tyreKeys.has(lineKey(line))).map(copyTyre)],
		pairs: [...target.pairs, ...source.pairs.filter((pair) => !pairKeys.has(pairKey(pair))).map(copyPair)],
		general: [.../* @__PURE__ */ new Set([...target.general, ...source.general])],
		copiedFrom: sourceName
	};
}
function counted(tyres, pairs) {
	return [tyres ? `${tyres} Reifen` : "", pairs ? `${pairs} ${pairs === 1 ? "Kombination" : "Kombinationen"}` : ""].filter(Boolean).join(" und ");
}
function groups(n) {
	return `${n} ${n === 1 ? "Fahrzeuggruppe" : "Fahrzeuggruppen"}`;
}
/**
* What a copy will do, before it does it: `ersetzen` replaces each target's lines with the source's; `hinzufuegen` counts
* only the lines a target does not hold yet — and says so when there are none.
*/
function copyPreview(source, targets, mode) {
	if (mode === "ersetzen") return `Ersetzt durch ${counted(source.tyres.length, source.pairs.length) || "nichts"} für ${groups(targets.length)}.`;
	let tyres = 0;
	let pairs = 0;
	for (const target of targets) {
		const tyreKeys = new Set(target.tyres.map(lineKey));
		const pairKeys = new Set(target.pairs.map(pairKey));
		tyres += source.tyres.filter((line) => !tyreKeys.has(lineKey(line))).length;
		pairs += source.pairs.filter((pair) => !pairKeys.has(pairKey(pair))).length;
	}
	return tyres + pairs === 0 ? "Nichts kommt hinzu: Alles steht dort schon." : `Hinzu ${tyres + pairs === 1 ? "kommt" : "kommen"} insgesamt ${counted(tyres, pairs)}, für ${groups(targets.length)}.`;
}
/** Every code a cell names: beside a tyre, beside a pair, or for the whole row. */
function usedCodes(cells) {
	const used = /* @__PURE__ */ new Set();
	for (const cell of cells) {
		cell.tyres.forEach((line) => line.codes.forEach((code) => used.add(code)));
		cell.pairs.forEach((pair) => pair.codes.forEach((code) => used.add(code)));
		cell.general.forEach((code) => used.add(code));
	}
	return used;
}
/** The codes in use that nobody has described yet, in the order of the paper's list, then any not in it at all. */
function undescribedCodes(cells, codes) {
	const used = usedCodes(cells);
	const described = new Set(codes.filter((code) => code.text !== null && code.text.trim() !== "").map((code) => code.code));
	const listed = codes.map((code) => code.code).filter((code) => used.has(code) && !described.has(code));
	const unlisted = [...used].filter((code) => !codes.some((listedCode) => listedCode.code === code));
	return [...listed, ...unlisted];
}
/** Every size the paper lists as a tyre line for this wheel size, in any cell. */
function paperSizes(cells) {
	const sizes = /* @__PURE__ */ new Set();
	for (const cell of cells) for (const line of cell.tyres) {
		const tyre = readTyre(line.text);
		if (tyre !== null) sizes.add(sizeKey(tyre));
	}
	return sizes;
}
/**
* A pair whose front or rear size is not among the tyre lines entered for this paper (the brief §4.3): if the paper does
* not list it, that axle needs another rim size, covered by another paper. Said in words of what is recorded (R-17), never
* refused — the existing staggered logic decides which rim goes where.
*/
function pairWarnings(cell, sizes) {
	const out = [];
	for (const pair of cell.pairs) {
		const front = readTyre(pair.front);
		const rear = readTyre(pair.rear);
		if (front !== null && !sizes.has(sizeKey(front))) out.push({
			id: pair.id,
			text: "Die vordere Reifengröße ist zu diesem Gutachten noch nicht als Reifen erfasst. Steht sie dort nicht, braucht sie eine andere Felgengröße."
		});
		if (rear !== null && !sizes.has(sizeKey(rear))) out.push({
			id: pair.id,
			text: "Die hintere Reifengröße ist zu diesem Gutachten noch nicht als Reifen erfasst. Steht sie dort nicht, braucht sie eine andere Felgengröße."
		});
	}
	return out;
}
/** The lines that repeat a size already on the row — the same size, power band and axle; the later one is named. */
function duplicateLines(cell) {
	const seen = /* @__PURE__ */ new Set();
	const twice = [];
	for (const line of cell.tyres) {
		const key = lineKey(line);
		if (readTyre(line.text) !== null && seen.has(key)) twice.push(line.id);
		seen.add(key);
	}
	return twice;
}
/** „Mehrere einfügen", confirmed: each size a tyre line, each pair a pair line, as the shop writes them; unread lines left out. */
function applyPaste(cell, lines) {
	const tyres = [];
	const pairs = [];
	for (const line of lines) {
		for (const size of line.sizes ?? []) tyres.push({
			id: lineId(),
			text: tyreLabel(size),
			codes: [],
			kw: "",
			axle: "ALL"
		});
		for (const pair of line.pairs ?? []) pairs.push({
			id: lineId(),
			front: tyreLabel(pair.front),
			rear: tyreLabel(pair.rear),
			codes: []
		});
	}
	return {
		...cell,
		tyres: [...cell.tyres, ...tyres],
		pairs: [...cell.pairs, ...pairs],
		copiedFrom: null
	};
}
//#endregion
//#region resources/js/Pages/Admin/Skizze/gutachtenDemo.ts
/**
* The Gutachten sketch's data, in memory only (the Gutachten rework brief §11, Phase 1): the example of the proposal — the
* Nachtrag N1 to ABE 53841, Borbet DB8GT2 8,5 × 18 ET 35, and its rows for the BMW M3, X3 and Z3. The codes are the ones
* the acceptance set holds for that paper (database/seeders/content/abnahme/gutachten.php), as printed; three are left
* undescribed on purpose, so the sketch can show what happens to a code nobody has described yet. Cars, HSN/TSN and the
* tyres of the X3 and Z3 rows are examples.
*/
/** The kinds as the admin names them (ConditionKind::labelDe), with the one value a kind needs. */
var KINDS = [
	{
		value: "abnahme",
		label: "Abnahme durch einen Prüfer"
	},
	{
		value: "karosseriearbeit",
		label: "Arbeit an der Karosserie"
	},
	{
		value: "karosserieform",
		label: "Nur für bestimmte Karosserieformen",
		needs: "Karosserieformen"
	},
	{
		value: "antrieb",
		label: "Nur mit / ohne bestimmten Antrieb",
		needs: "Antrieb"
	},
	{
		value: "befestigung",
		label: "Befestigungsmittel"
	},
	{
		value: "reifen_tragfaehigkeit",
		label: "Reifen: Tragfähigkeit",
		needs: "Achslast in kg"
	},
	{
		value: "reifen_achse",
		label: "Reifen: nur auf einer Achse",
		needs: "Achse"
	},
	{
		value: "reifen_kombination",
		label: "Reifen: erlaubte Kombinationen"
	},
	{
		value: "tacho",
		label: "Tachometer prüfen"
	},
	{
		value: "verbot",
		label: "Verbot"
	},
	{
		value: "hinweis",
		label: "Hinweis"
	},
	{
		value: "nacharbeitsprofil",
		label: "Nacharbeit mit Maßen"
	}
];
var LEVELS = [
	{
		value: "hinweis",
		label: "Hinweis"
	},
	{
		value: "auflage",
		label: "Auflage"
	},
	{
		value: "nicht_zulaessig",
		label: "Nicht zulässig"
	}
];
/** An Abnahme or work on the body is always at least an Auflage (ConditionLevel::floorFor). */
function levelFloor(kind) {
	return kind === "abnahme" || kind === "karosseriearbeit" ? "auflage" : "hinweis";
}
var PAPER = {
	kind: "ABE",
	number: "53841",
	supplement: "Nachtrag 366-0350-21-WIRD/N1",
	issuer: "TÜV Austria",
	issuedOn: "2025-07-02",
	file: "DB8GT2-8518_18_abe.pdf",
	pages: 24
};
var SCHWARZ = {
	name: "Schwarz matt",
	hex: "#26282B"
};
var BRONZE = {
	name: "Bronze matt",
	hex: "#7C6142"
};
var WHEELS = [{
	id: "db8gt2",
	brand: "Borbet",
	model: "DB8GT2",
	sizes: [
		{
			id: "db8gt2-18",
			diameter: 18,
			width: 8.5,
			et: 35,
			holes: 5,
			circle: 120,
			bore: 72.5,
			colours: [SCHWARZ, BRONZE]
		},
		{
			id: "db8gt2-19",
			diameter: 19,
			width: 8.5,
			et: 35,
			holes: 5,
			circle: 120,
			bore: 72.6,
			colours: [SCHWARZ, BRONZE]
		},
		{
			id: "db8gt2-18-112",
			diameter: 18,
			width: 8,
			et: 40,
			holes: 5,
			circle: 112,
			bore: 66.6,
			colours: [SCHWARZ]
		}
	]
}, {
	id: "lm124",
	brand: "BBS",
	model: "LeMans LM124",
	sizes: [{
		id: "lm124-18",
		diameter: 18,
		width: 8.5,
		et: 30,
		holes: 5,
		circle: 120,
		bore: 72.5,
		colours: [{
			name: "Black Gloss",
			hex: "#141518"
		}, {
			name: "Blue Gloss",
			hex: "#1F3E73"
		}]
	}]
}];
/** The paper's own wheel data, as printed on page 1, beside the choice. */
var PAPER_WHEEL = "Radgröße 8 1/2 J × 18 H2 · Einpresstiefe 35 · Lochkreis 120/5 · Mittenloch 72,5";
var GROUPS = [
	{
		id: "m3",
		sales: "BMW M3",
		type: "M3B",
		approvals: ["G191"],
		kwMin: 210,
		kwMax: 217,
		notes: "Pkw geschlossen; Cabrio;",
		page: 6,
		cars: [{
			id: "m3-1",
			name: "BMW M3 Coupé 3.0",
			hsn: "0005",
			tsn: "563",
			kw: 210,
			k: "G191",
			provenance: "import"
		}, {
			id: "m3-2",
			name: "BMW M3 Cabrio 3.2",
			hsn: "0005",
			tsn: "590",
			kw: 217,
			k: "G191",
			provenance: "import"
		}],
		withoutKw: []
	},
	{
		id: "x3",
		sales: "BMW X3",
		type: "X83",
		approvals: ["e1*2001/116*0249*.."],
		kwMin: 100,
		kwMax: 210,
		notes: "Allradantrieb;",
		page: 6,
		cars: [
			{
				id: "x3-1",
				name: "BMW X3 (E83) 2.0i",
				hsn: "0005",
				tsn: "AHH",
				kw: 110,
				k: "e1*2001/116*0249*00",
				provenance: "import"
			},
			{
				id: "x3-2",
				name: "BMW X3 (E83) 2.5i",
				hsn: "0005",
				tsn: "AHJ",
				kw: 141,
				k: "e1*2001/116*0249*00",
				provenance: "import"
			},
			{
				id: "x3-3",
				name: "BMW X3 (E83) 3.0i",
				hsn: "0005",
				tsn: "AHK",
				kw: 170,
				k: "e1*2001/116*0249*02",
				provenance: "import"
			},
			{
				id: "x3-4",
				name: "BMW X3 (E83) 2.0d",
				hsn: "0005",
				tsn: "AHL",
				kw: 110,
				k: "e1*2001/116*0249*04",
				provenance: "gutachten"
			},
			{
				id: "x3-5",
				name: "BMW X3 (E83) 3.0d",
				hsn: "0005",
				tsn: "AHM",
				kw: 150,
				k: "e1*2001/116*0249*04",
				provenance: "import"
			},
			{
				id: "x3-6",
				name: "BMW X3 (E83) 3.0sd",
				hsn: "0005",
				tsn: "AHN",
				kw: 210,
				k: "e1*2001/116*0249*07",
				provenance: "entwicklung"
			}
		],
		withoutKw: [{
			id: "x3-7",
			name: "BMW X3 (E83) 2.0d xDrive",
			hsn: "0005",
			tsn: "AHP",
			kw: null,
			k: "e1*2001/116*0249*09",
			provenance: "gutachten"
		}]
	},
	{
		id: "z3",
		sales: "BMW Z3",
		type: "R/C",
		approvals: ["e1*93/81*0029*.."],
		kwMin: 85,
		kwMax: 170,
		notes: "Roadster; Coupé;",
		page: 7,
		cars: [
			{
				id: "z3-1",
				name: "BMW Z3 Roadster 1.8",
				hsn: "0005",
				tsn: "692",
				kw: 85,
				k: "e1*93/81*0029*08",
				provenance: "entwicklung"
			},
			{
				id: "z3-2",
				name: "BMW Z3 Roadster 2.2i",
				hsn: "0005",
				tsn: "717",
				kw: 125,
				k: "e1*93/81*0029*12",
				provenance: "import"
			},
			{
				id: "z3-3",
				name: "BMW Z3 Coupé 3.0i",
				hsn: "0005",
				tsn: "718",
				kw: 170,
				k: "e1*93/81*0029*12",
				provenance: "import"
			}
		],
		withoutKw: []
	}
];
/** A row of the paper with no car in the database yet: „Fahrzeug anlegen", in the flow. */
var EMPTY_ROW = {
	id: "e46",
	sales: "BMW 3er",
	type: "3/B",
	approvals: ["e1*93/81*0016*.."],
	kwMin: 75,
	kwMax: 142,
	notes: "Limousine; Stufenheck;",
	page: 7
};
/** The paper's codes as printed (the acceptance set's Nachtrag N1); 721, 725 and 74A not yet described. */
var CODES = [
	{
		code: "10B",
		kind: "hinweis",
		level: "hinweis",
		page: 10,
		text: "Die mindestens erforderlichen Geschwindigkeitsbereiche der zu verwendenden Reifen sind, mit Ausnahme der Winterreifen Profile, den Fahrzeugpapieren zu entnehmen. Die für gesetzeskonforme Winterreifen zulässige Höchstgeschwindigkeit ist im Blickfeld des Fahrzeugführer sinnfällig anzugeben und im Betrieb nicht zu überschreiten."
	},
	{
		code: "11A",
		kind: "abnahme",
		level: "auflage",
		page: 10,
		text: "Der vorschriftsmäßige Zustand des Fahrzeuges ist durch einen amtlich anerkannten Sachverständigen oder Prüfer für den Kraftfahrzeugverkehr oder einen Prüfingenieur einer Überwachungsorganisation oder einen Angestellten nach Abschnitt 4 der Anlage VIIIb zur StVZO unter Angabe von FAHRZEUGHERSTELLER, FAHRZEUGTYP und FAHRZEUGIDENTIFIZIERUNGSNUMMER auf einem Nachweis entsprechend dem im Beispielkatalog zum §19 StVZO veröffentlichten Muster bescheinigen zu lassen."
	},
	{
		code: "11B",
		kind: "hinweis",
		level: "hinweis",
		page: 11,
		text: "Wird eine in diesem Gutachten aufgeführte Reifengröße verwendet, die nicht bereits in der Fahrzeuggenehmigung für diesen Fahrzeug-Typ/ -Variante/ -Version bzw. Fahrzeugausführung genannt ist, so sind die Angaben über die Reifengrößen in den Fahrzeugpapieren bei der nächsten Befassung mit den Fahrzeugpapieren durch die Zulassungsstelle berichtigen zu lassen."
	},
	{
		code: "11G",
		kind: "hinweis",
		level: "hinweis",
		page: 11,
		text: "Die Brems-, Lenkungsaggregate und das Fahrwerk mit Ausnahme von Sonder-Fahrwerksfedern müssen, sofern diese durch keine weiteren Auflagen berührt werden, dem Serienstand entsprechen."
	},
	{
		code: "11H",
		kind: "hinweis",
		level: "hinweis",
		page: 11,
		text: "Wird das serienmäßige Ersatzrad verwendet, soll mit mäßiger Geschwindigkeit und nicht länger als erforderlich gefahren werden. Hierbei müssen die serienmäßigen Befestigungsteile verwendet werden."
	},
	{
		code: "12A",
		kind: "verbot",
		level: "hinweis",
		page: 11,
		text: "Die Verwendung von Schneeketten ist nicht möglich, es sei denn, dass für den hier aufgeführten Fahrzeugtyp eine weitere Umrüstmöglichkeit im Gutachten aufgeführt ist."
	},
	{
		code: "21B",
		kind: "karosseriearbeit",
		level: "auflage",
		page: 11,
		text: "Durch Anlegen der vorderen Radhausausschnittkanten und Kunststoffinnenkotflügel über die gesamte Radhausausschnittkantenlänge ist die Freigängigkeit der Rad/Reifen-Kombination herzustellen."
	},
	{
		code: "22B",
		kind: "karosseriearbeit",
		level: "auflage",
		page: 11,
		text: "Durch Anlegen bzw. Bearbeiten der hinteren Radhausausschnittkanten und Kunststoffinnenkotflügel über die gesamte Radhausausschnittkantenlänge ist die Freigängigkeit der Rad/Reifen-Kombination herzustellen."
	},
	{
		code: "22F",
		kind: "karosseriearbeit",
		level: "auflage",
		page: 11,
		text: "Durch Aufweiten bzw. Ausstellen der hinteren Radhäuser im Bereich der Radaußenseite über die gesamte Radhausausschnittkantenlänge ist die Freigängigkeit der Rad/Reifen-Kombination herzustellen."
	},
	{
		code: "24D",
		kind: "karosseriearbeit",
		level: "auflage",
		page: 13,
		text: "Die Radabdeckung an Achse 2 ist durch Ausstellen der Heckschürze und des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 30 Grad vor der Radmitte und 50 Grad hinter der Radmitte herzustellen."
	},
	{
		code: "24J",
		kind: "karosseriearbeit",
		level: "auflage",
		page: 13,
		text: "Die Radabdeckung an Achse 1 ist durch Ausstellen der Frontschürze und des Kotflügels oder durch Anbau von dauerhaft befestigten Karosserieteilen im Bereich 30 Grad vor der Radmitte und 50 Grad hinter der Radmitte herzustellen."
	},
	{
		code: "51A",
		kind: "hinweis",
		level: "hinweis",
		page: 14,
		text: "Der vom Fahrzeughersteller (siehe Betriebsanleitung oder Reifenfülldruckhinweis am Fahrzeug) bzw. Reifenhersteller vorgeschriebene Reifenfülldruck ist zu beachten."
	},
	{
		code: "57E",
		kind: "reifen_achse",
		level: "auflage",
		page: 14,
		text: "Die Verwendung der angegebenen Reifengröße ist auf dieser Radgröße nur an der Vorderachse zulässig. Sie kann jedoch im Einzelfall auf einer anderen Radgröße an der Hinterachse kombiniert werden."
	},
	{
		code: "57F",
		kind: "reifen_achse",
		level: "auflage",
		page: 14,
		text: "Die Verwendung der angegebenen Reifengröße ist auf dieser Radgröße nur an der Hinterachse zulässig. Sie kann jedoch im Einzelfall auf einer anderen Radgröße an der Vorderachse kombiniert werden."
	},
	{
		code: "68B",
		kind: "reifen_kombination",
		level: "hinweis",
		page: 15,
		text: "Folgende Rad/Reifen-Kombination ist zulässig: Reifengröße: Vorderachse: 225/40R18 Hinterachse: 255/35R18 Ist eine der beiden Reifengrößen im Gutachten nicht aufgeführt, so ist die nicht aufgeführte Reifengröße nur auf einer anderen Felgengröße zulässig. Die erforderlichen Auflagen und Hinweise sind achsweise zu beachten. An Fahrzeugausführungen mit automatischem Blockierverhinderer (ABV) bzw. Antriebsschlupfregelung (ASR) dürfen nur Reifen verwendet werden, deren Differenz im Abrollumfang kleiner als 1% ist. Es ist eine Bestätigung des Reifenherstellers über die tatsächlichen Abrollumfänge erforderlich; es wird empfohlen den Nachweis der Eignung bei den Fahrzeugpapieren mitzuführen. Alle an ein und derselben Achse montierten Reifen müssen vom gleichen Reifentyp sein."
	},
	{
		code: "71C",
		kind: "hinweis",
		level: "hinweis",
		page: 16,
		text: "Zum Auswuchten der Sonderräder dürfen an der Felgeninnenseite nur Klebegewichte angebracht werden."
	},
	{
		code: "71K",
		kind: "hinweis",
		level: "hinweis",
		page: 16,
		text: "Zum Auswuchten dürfen nur Klebegewichte unterhalb des Tiefbetts an der Felgeninnenseite angebracht werden."
	},
	{
		code: "73C",
		kind: "hinweis",
		level: "hinweis",
		page: 16,
		text: "Es ist nur die Verwendung von schlauchlosen Reifen zulässig."
	},
	{
		code: "721",
		kind: null,
		level: null,
		page: null,
		text: null
	},
	{
		code: "725",
		kind: null,
		level: null,
		page: null,
		text: null
	},
	{
		code: "74A",
		kind: null,
		level: null,
		page: null,
		text: null
	}
];
/**
* What the paper prints that the sketch has not recorded: the three codes nobody described yet, on their pages, and the
* rows of its Verwendungsbereich as the PDF panel's placeholder pages show them.
*/
var PRINTED_ONLY = {
	"721": {
		page: 16,
		text: "Es ist nur die Verwendung von Gummiventilen oder Metallschraubventilen mit Überwurfmutter von außen, die weitgehend den Normen (DIN, E.T.R.T.O. bzw. Tire and Rim) entsprechen und die für einen Ventilloch-Nenndurchmesser von 11,3 mm geeignet sind, zulässig. Das Ventil darf nicht über den Felgenrand hinausragen."
	},
	"725": {
		page: 16,
		text: "Bei Fahrzeugen mit einer bauartbedingten Höchstgeschwindigkeit über 210 km/h sind nur Metallschraubventile zulässig. Es sind die Montagehinweise des Ventilherstellers zu beachten."
	},
	"74A": {
		page: 17,
		text: "Es dürfen nur die vom Radhersteller mitzuliefernden Radbefestigungsteile verwendet werden, dabei ist die Gewindegröße der serienmäßigen Befestigungsteile zu beachten."
	}
};
var PRINTED_ROWS = {
	6: [{
		group: "BMW M3",
		type: "M3B",
		approval: "G191",
		kw: "210-217",
		tyres: [{
			size: "225/40R18 88W",
			codes: "11A; 21B; 24J; 57E; 68B"
		}, {
			size: "255/35R18 90W",
			codes: "11A; 22B; 22F; 24D; 57F; 68B"
		}],
		general: "10B 11B 11G 11H 12A 51A 71C 71K 721 725 73C 74A; Pkw geschlossen; Cabrio;"
	}, {
		group: "BMW X3",
		type: "X83",
		approval: "e1*2001/116*0249*..",
		kw: "100-210",
		tyres: [
			{
				size: "235/50R18",
				codes: ""
			},
			{
				size: "245/45R18 100",
				codes: ""
			},
			{
				size: "245/45R18 96W",
				codes: ""
			},
			{
				size: "255/45R18 99",
				codes: ""
			}
		],
		general: "10B 11B 11G 11H 12A 51A 71C 71K 721 725 73C 74A 75I; Allradantrieb;"
	}],
	7: [{
		group: "BMW Z3",
		type: "R/C",
		approval: "e1*93/81*0029*..",
		kw: "85-170",
		tyres: [
			{
				size: "225/40R18-88 (85-142 kW)",
				codes: "11A; 21B"
			},
			{
				size: "245/35R18 88 (85-170 kW)",
				codes: "11A; 22B"
			},
			{
				size: "255/35R18-90 (85-170 kW)",
				codes: "11A; 22B; 22F"
			},
			{
				size: "225/40R18 88 (170 kW)",
				codes: "11A"
			}
		],
		general: "10B 11B 12A 71C 73C 74A; Roadster; Coupé;"
	}, {
		group: "BMW 3er",
		type: "3/B",
		approval: "e1*93/81*0016*..",
		kw: "75-142",
		tyres: [{
			size: "225/40R18 88W",
			codes: "11A; 21B"
		}, {
			size: "235/40R18 91",
			codes: "11A; 21B; 22B"
		}],
		general: "10B 11B 12A 71C 73C 74A; Limousine; Stufenheck;"
	}]
};
/** The page headings of the placeholder PDF, where the sketch knows one. */
var PAGE_TITLES = {
	1: "Gutachten 366-0350-21-WIRD/N1 · Raddaten",
	2: "Befestigungsteile und Anzugsmomente",
	6: "Verwendungsbereich",
	7: "Verwendungsbereich (Fortsetzung)",
	10: "Auflagen und Hinweise"
};
function initialCells() {
	return [
		{
			groupId: "m3",
			tyres: [{
				id: 1,
				text: "225/40 R18 88W",
				codes: [
					"11A",
					"21B",
					"24J",
					"57E",
					"68B"
				],
				kw: "",
				axle: "ALL"
			}, {
				id: 2,
				text: "255/35 R18 90W",
				codes: [
					"11A",
					"22B",
					"22F",
					"24D",
					"57F",
					"68B"
				],
				kw: "",
				axle: "ALL"
			}],
			pairs: [{
				id: 3,
				front: "225/40 R18",
				rear: "255/35 R18",
				codes: ["68B"]
			}],
			general: [
				"10B",
				"11B",
				"11G",
				"11H",
				"12A",
				"51A",
				"71C",
				"71K",
				"721",
				"725",
				"73C",
				"74A"
			],
			page: "6",
			copiedFrom: null
		},
		{
			groupId: "x3",
			tyres: [],
			pairs: [],
			general: [],
			page: "",
			copiedFrom: null
		},
		{
			groupId: "z3",
			tyres: [],
			pairs: [],
			general: [],
			page: "",
			copiedFrom: null
		}
	];
}
/** What „Beispiel einsetzen" puts into „Mehrere einfügen" for a row: the paper's lines, as staff would paste them. */
var PASTE_EXAMPLES = {
	m3: "225/40R18 88W\n255/35R18 90W\n225/40R18 – 255/35R18",
	x3: "235/50R18\n245/45R18 100\n245/45R18 96W\n255/45R18 99",
	z3: "225/40R18-88\n245/35R18 88\n255/35R18-90\nNr. 1: 225/40R18 – 255/35R18",
	e46: "225/40R18 88W\n235/40R18 91"
};
/** Where a car's data came from, as the release door reads it: an import, a paper, a check by hand — or none on record. */
function provenanceLabel(provenance) {
	return {
		import: "aus einem Import der Fahrzeugdaten",
		gutachten: "aus einem Gutachten",
		manuell: "von Hand geprüft",
		entwicklung: "aus den Entwicklungsdaten"
	}[provenance];
}
function documented(provenance) {
	return provenance !== "entwicklung";
}
/** `8,5 × 18 · ET 35 · 5 × 120` — a wheel size as the flow names it. */
function sizeName(size) {
	return `${widthText(size.width)} × ${size.diameter} · ET ${size.et} · ${size.holes} × ${size.circle}`;
}
/** `8,5`, `9` — a rim width as the paper and the admin write it. */
function widthText(width) {
	return decimal(width, Number.isInteger(width) ? 0 : 1);
}
/** `210–217 kW` — a power band as the paper prints it, the unit held to the figures (R-10). */
function kwRange(min, max) {
	return withUnit(max === void 0 ? String(min) : `${min}–${max}`, "kW");
}
/** `1 Fahrzeug` · `6 Fahrzeuge` */
function carCount(n) {
	return n === 1 ? "1 Fahrzeug" : `${n} Fahrzeuge`;
}
/** `BMW M3 · M3B · G191 · 210–217 kW` */
function groupName(group) {
	return `${group.sales} · ${group.type} · ${group.approvals.join(", ")} · ${kwRange(group.kwMin, group.kwMax)}`;
}
//#endregion
//#region resources/js/Pages/Admin/Skizze/gutachtenStore.ts
/**
* The state of the Gutachten sketch: one object for the five steps, handed to every part through provide/inject. Kept in
* the browser's session storage, so leaving and coming back resumes at the same step and the same cell, as the draft will
* (the brief §7) — and nothing reaches the server.
*/
var STEPS = [
	"Gutachten",
	"Felge",
	"Fahrzeuge",
	"Reifen",
	"Freigeben"
];
function initialState(step = 0, cell = "m3") {
	return {
		step,
		reached: step,
		art: "ABE",
		number: PAPER.number,
		issuer: PAPER.issuer,
		issuedOn: PAPER.issuedOn,
		supplement: PAPER.supplement,
		liSource: null,
		wheelId: "db8gt2",
		sizeId: "db8gt2-18",
		groups: [
			"m3",
			"x3",
			"z3"
		],
		excluded: [],
		added: [],
		created: [],
		cells: initialCells(),
		cell,
		pdfPage: 6,
		codes: CODES.map((code) => ({ ...code })),
		checked: [],
		complete: null,
		missing: "",
		released: false,
		more: {}
	};
}
var STORAGE_KEY = "rimify-skizze-gutachten";
function createStore(step, cell) {
	const state = (0, vue_exports.reactive)(initialState(step, cell));
	function allGroups() {
		return [...GROUPS, ...state.created];
	}
	function group(id) {
		return allGroups().find((g) => g.id === id);
	}
	/** The groups taken over, in the paper's order. */
	function chosenGroups() {
		return allGroups().filter((g) => state.groups.includes(g.id));
	}
	/** The cars a group links: its matches, minus those unticked, plus those added by hand. */
	function carsOf(g) {
		return [...g.cars, ...g.withoutKw.filter((car) => state.added.includes(car.id))].filter((car) => !state.excluded.includes(car.id));
	}
	function cellOf(groupId) {
		let found = state.cells.find((c) => c.groupId === groupId);
		if (found === void 0) {
			found = {
				groupId,
				tyres: [],
				pairs: [],
				general: [],
				page: "",
				copiedFrom: null
			};
			state.cells.push(found);
		}
		return found;
	}
	function go(step) {
		state.step = Math.max(0, Math.min(STEPS.length - 1, step));
		state.reached = Math.max(state.reached, state.step);
		if (typeof window !== "undefined") {
			window.scrollTo({ top: 0 });
			(0, vue_exports.nextTick)(() => document.querySelector(".sk-step h2[tabindex=\"-1\"]")?.focus({ preventScroll: true }));
		}
	}
	function toggleGroup(id) {
		state.groups = state.groups.includes(id) ? state.groups.filter((g) => g !== id) : allGroups().filter((g) => g.id === id || state.groups.includes(g.id)).map((g) => g.id);
	}
	function toggleCar(id) {
		state.excluded = state.excluded.includes(id) ? state.excluded.filter((c) => c !== id) : [...state.excluded, id];
	}
	function addCar(id) {
		if (!state.added.includes(id)) state.added.push(id);
	}
	function createGroup(g) {
		if (!state.created.some((c) => c.id === g.id)) state.created.push(g);
		if (!state.groups.includes(g.id)) state.groups.push(g.id);
	}
	/** Someone changed the cell: from now on it is theirs, no longer „kopiert von …". */
	function touched(groupId) {
		cellOf(groupId).copiedFrom = null;
	}
	function copy(from, to, mode) {
		const source = cellOf(from);
		const name = group(from)?.sales ?? "";
		state.cells = state.cells.map((c) => to.includes(c.groupId) ? copyCell(source, c, mode, name) : c);
		for (const id of to) if (!state.cells.some((c) => c.groupId === id)) state.cells.push(copyCell(source, cellOf(id), mode, name));
	}
	function define(code, text, kind, level) {
		const entry = {
			code,
			text,
			kind,
			level: level ?? levelFloor(kind),
			page: null
		};
		const at = state.codes.findIndex((c) => c.code === code);
		if (at === -1) state.codes.push(entry);
		else state.codes[at] = {
			...entry,
			page: state.codes[at]?.page ?? null
		};
	}
	function codeOf(code) {
		return state.codes.find((c) => c.code === code);
	}
	function described(code) {
		const entry = codeOf(code);
		return entry !== void 0 && entry.text !== null && entry.text.trim() !== "";
	}
	function reset() {
		Object.assign(state, initialState(0, "m3"));
	}
	return {
		state,
		allGroups,
		group,
		chosenGroups,
		carsOf,
		cellOf,
		go,
		toggleGroup,
		toggleCar,
		addCar,
		createGroup,
		touched,
		copy,
		define,
		codeOf,
		described,
		reset
	};
}
var SKETCH = Symbol("gutachten-skizze");
function useSketch() {
	const store = (0, vue_exports.inject)(SKETCH);
	if (store === void 0) throw new Error("The Gutachten sketch store is provided by its page.");
	return store;
}
//#endregion
export { duplicateLines as A, provenanceLabel as C, cellDone as D, applyPaste as E, unreadableLines as F, readPaste as I, readTyre as L, paperSizes as M, reserveLineIds as N, cellSummary as O, undescribedCodes as P, tyreLabel as R, levelFloor as S, widthText as T, WHEELS as _, initialState as a, groupName as b, EMPTY_ROW as c, PAGE_TITLES as d, PAPER as f, PRINTED_ROWS as g, PRINTED_ONLY as h, createStore as i, pairWarnings as j, copyPreview as k, KINDS as l, PASTE_EXAMPLES as m, STEPS as n, useSketch as o, PAPER_WHEEL as p, STORAGE_KEY as r, CODES as s, SKETCH as t, LEVELS as u, carCount as v, sizeName as w, kwRange as x, documented as y, whyUnread as z };
