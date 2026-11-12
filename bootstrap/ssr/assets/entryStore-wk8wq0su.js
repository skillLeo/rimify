import { d as vue_exports, s as usePage } from "../ssr.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { n as xsrfToken } from "./preferences-y4YLrdI-.js";
import { a as readTyre, o as sizeKey } from "./tyreInput-CIjLTCSv.js";
//#region resources/js/Pages/Admin/Gutachten/Erfassung/entryStore.ts
/**
* The five steps of a Gutachten's entry, one object handed to every part (the Gutachten rework §7): what the server last said
* (`entry`), the step and the car on screen, and the one car being typed in. Every change is saved as it happens; the answer is
* what the page redraws from, so what staff see is what is stored. The rows the shop reads are written on the server, in the
* same transaction.
*
* Saves go out one after the other, so the answers come back in the order of the changes and the newest state stands. Leaving a
* step or a car goes through here too: the part on screen says what it still owes, and the screen only changes once the server
* has it. If it refuses, the person stays where the problem is.
*/
/** The page's props, as the parts of the five steps read them. */
function useGutachtenPage() {
	return usePage();
}
var STEPS = [
	"Gutachten",
	"Felge",
	"Fahrzeuge",
	"Reifen",
	"Freigeben"
];
var Refused = class extends Error {
	errors;
	constructor(errors) {
		super(Object.values(errors)[0]?.[0] ?? "Das wurde nicht gespeichert.");
		this.errors = errors;
	}
};
/** What the server said of a line's two sides, for as long as they still read as it read them. */
function refusedOf(line) {
	return {
		front: line.frontWhy === null ? null : {
			text: line.front,
			why: line.frontWhy
		},
		rear: line.rearWhy === null ? null : {
			text: line.rear,
			why: line.rearWhy
		}
	};
}
var NOT_SAVED = "Das wurde nicht gespeichert. Prüf die Verbindung und versuch es noch einmal.";
var SIGNED_OUT = "Das wurde nicht gespeichert: Deine Anmeldung ist abgelaufen. Melde dich in einem neuen Tab wieder an und versuch es dann noch einmal. Deine Eingaben bleiben hier stehen.";
var FORBIDDEN = "Das wurde nicht gespeichert: Dafür fehlt deinem Konto die Berechtigung.";
/** Sends a save or asks a question, as JSON, with the admin's XSRF header. */
async function send(method, url, body, headers = {}) {
	let response;
	try {
		response = await fetch(url, {
			method,
			credentials: "same-origin",
			headers: {
				Accept: "application/json",
				"X-Requested-With": "XMLHttpRequest",
				...body === void 0 ? {} : {
					"Content-Type": "application/json",
					"X-XSRF-TOKEN": xsrfToken()
				},
				...method === "GET" ? {} : { "X-XSRF-TOKEN": xsrfToken() },
				...headers
			},
			...body === void 0 ? {} : { body: JSON.stringify(body) }
		});
	} catch {
		throw new Error(NOT_SAVED);
	}
	if (response.status === 422) throw new Refused((await response.json()).errors ?? {});
	if (response.status === 401 || response.status === 419) throw new Error(SIGNED_OUT);
	if (response.status === 403) throw new Error(FORBIDDEN);
	if (!response.ok) throw new Error(NOT_SAVED);
	return await response.json();
}
var nextKey = 1;
function toEditLine(line) {
	return {
		key: nextKey++,
		id: line.id,
		front: line.front,
		rear: line.rear,
		kw: line.kw,
		codes: [...line.codes],
		oneSided: line.oneSided,
		outsideList: line.outsideList,
		follows: !line.oneSided && line.front === line.rear,
		refused: refusedOf(line)
	};
}
function blankLine(front = "", rear = front) {
	return {
		key: nextKey++,
		id: null,
		front,
		rear,
		kw: "",
		codes: [],
		oneSided: false,
		outsideList: false,
		follows: front === rear,
		refused: {
			front: null,
			rear: null
		}
	};
}
/** Whether this side's typed tyre cannot go on this side's wheel, in the server's words (EntryLineRules::misfit); null where it can. */
function misfit(text, wheelDiameter, side) {
	const tyre = readTyre(text);
	if (tyre === null || Math.abs(tyre.diameter - wheelDiameter) < .001) return null;
	return `Dieser Reifen passt nicht: Die Felge ${side === "front" ? "vorne" : "hinten"} hat ${decimal(wheelDiameter, Number.isInteger(wheelDiameter) ? 0 : 1)} Zoll, der Reifen R${decimal(tyre.diameter, Number.isInteger(tyre.diameter) ? 0 : 1)}.`;
}
/** The keys of lines that say the same as an earlier one: their sizes, figures and band. */
function duplicateKeys(lines) {
	const seen = /* @__PURE__ */ new Set();
	const twice = [];
	for (const line of lines) {
		const front = readTyre(line.front);
		const rear = readTyre(line.rear);
		if (front === null || rear === null) continue;
		const key = `${sizeKey(front)}|${front.li}|${front.si}|${sizeKey(rear)}|${rear.li}|${rear.si}|${line.kw.trim()}`;
		if (seen.has(key)) twice.push(line.key);
		seen.add(key);
	}
	return twice;
}
/** `2 Kombinationen`, or „noch leer“: every line is a combination. */
function carSummary(car) {
	if (car.lines === 0) return car.unread > 0 ? "nicht vollständig" : "noch leer";
	const lines = `${car.lines} ${car.lines === 1 ? "Kombination" : "Kombinationen"}`;
	return car.unread > 0 ? `${lines}, ${car.unread} nicht vollständig` : lines;
}
/** Every car once, however many wheel combinations it stands in: what step 3 lists and what its question counts. */
function distinctCars(cars) {
	const out = /* @__PURE__ */ new Map();
	for (const car of cars) {
		const seen = out.get(car.vehicleId);
		out.set(car.vehicleId, seen === void 0 ? { ...car } : {
			...seen,
			lines: seen.lines + car.lines,
			unread: seen.unread + car.unread,
			codes: seen.codes + car.codes,
			done: seen.done && car.done,
			finish: seen.finish ?? car.finish
		});
	}
	return [...out.values()];
}
/** A car's label in a narrow column: key numbers and power stay together, a separator at the end of its line, never alone on the next. */
function carLine(label) {
	return label.replace(/ · /g, "\xA0· ").replace(/(HSN|TSN) /g, "$1\xA0").replace(/ kW/g, "\xA0kW");
}
function createEntryStore(options) {
	const state = (0, vue_exports.reactive)({
		documentId: options.documentId,
		entry: options.entry,
		editable: options.editable,
		step: options.step,
		carId: options.car,
		/** The page the PDF panel shows. */
		pdfPage: 1,
		save: "idle",
		/** A person moved to another car: the next editor takes the focus, so the keyboard stays with the work. */
		focusEditor: false
	});
	const base = `/admin/gutachten/${options.documentId}/erfassung`;
	const holders = /* @__PURE__ */ new Set();
	const drafts = /* @__PURE__ */ new Map();
	let tail = Promise.resolve();
	let underWay = 0;
	/** A part with something typed in comes on stage; the function it gets takes it off again. */
	function hold(holder) {
		holders.add(holder);
		return () => holders.delete(holder);
	}
	/** Whether something typed has not reached the server: a reload then asks first. */
	function unsaved() {
		return underWay > 0 || [...holders].some((holder) => holder.owed());
	}
	/** Everything typed sent and answered. False: something was refused or did not arrive, and the part on screen says what. */
	async function settled() {
		const results = await Promise.all([...holders].map((holder) => holder.flush()));
		await tail;
		return results.every(Boolean);
	}
	function furthest() {
		if (state.entry.combinations.length === 0) return 1;
		return state.entry.cars.length === 0 ? 2 : STEPS.length - 1;
	}
	/** To another step, once what was typed here is saved: a refusal keeps the person here, with its reason. */
	async function go(step) {
		if (!await settled()) return;
		state.step = Math.max(0, Math.min(STEPS.length - 1, step));
		if (typeof window !== "undefined") {
			window.scrollTo({ top: 0 });
			(0, vue_exports.nextTick)(() => document.querySelector(".ef-step h2[tabindex=\"-1\"]")?.focus({ preventScroll: true }));
		}
	}
	function car(id) {
		return state.entry.cars.find((c) => c.id === id);
	}
	/** To another car, once what was typed for this one is saved. */
	async function openCar(id) {
		if (id === state.carId || !await settled()) return;
		state.focusEditor = true;
		state.carId = id;
	}
	/**
	* One save, after the ones before it: the state on screen is what the server answered last. A refusal keeps what was typed;
	* whoever asked says why, where it happened.
	*/
	function save(method, path, body, headers) {
		const run = async () => {
			state.save = "saving";
			try {
				const answer = await send(method, `${base}${path}`, body, headers);
				if (answer.entry) {
					state.entry = answer.entry;
					options.remember?.(answer.entry);
				}
				state.save = "saved";
				return answer;
			} catch (failure) {
				state.save = "failed";
				throw failure;
			} finally {
				underWay--;
			}
		};
		underWay++;
		const result = tail.then(run, run);
		tail = result.catch(() => void 0);
		return result;
	}
	/** The next car with nothing entered, in the order of the list; none where every one has something. */
	function nextOpen(from) {
		const cars = state.entry.cars;
		const at = cars.findIndex((c) => c.id === from);
		return [...cars.slice(at + 1), ...cars.slice(0, Math.max(at, 0))].find((c) => !c.done);
	}
	return {
		state,
		base,
		drafts,
		hold,
		unsaved,
		settled,
		furthest,
		go,
		openCar,
		car,
		save,
		nextOpen
	};
}
var ENTRY = Symbol("gutachten-erfassung");
function useEntry() {
	const store = (0, vue_exports.inject)(ENTRY);
	if (store === void 0) throw new Error("The entry store is provided by the Erfassung page.");
	return store;
}
//#endregion
export { carLine as a, distinctCars as c, refusedOf as d, send as f, useGutachtenPage as h, blankLine as i, duplicateKeys as l, useEntry as m, Refused as n, carSummary as o, toEditLine as p, STEPS as r, createEntryStore as s, ENTRY as t, misfit as u };
