//#region resources/js/composables/admin/days.ts
/** Today in Berlin as YYYY-MM-DD — the day the server reads, wherever the browser is. */
function berlinToday(now = /* @__PURE__ */ new Date()) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "Europe/Berlin",
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(now);
}
/** An ISO day moved by whole days, without a time of day to trip over a clock change. */
function shiftDay(iso, days) {
	const [y, m, d] = iso.split("-").map(Number);
	const date = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().slice(0, 10);
}
/**
* `01.09.2026` → `2026-09-01`; null for anything that is not a real day.
*
* Also as the phone's number pad can type it — it has no full stop: eight digits (`01092026`), or the
* comma the German decimal pad offers (`1,9,2026`).
*/
function parseGermanDay(text) {
	const match = /^\s*(\d{1,2})[.,](\d{1,2})[.,](\d{4})\s*$/.exec(text) ?? /^\s*(\d{2})(\d{2})(\d{4})\s*$/.exec(text);
	if (!match) return null;
	const [, d, m, y] = match;
	const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
	const date = /* @__PURE__ */ new Date(`${iso}T00:00:00Z`);
	return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso ? null : iso;
}
/** `2026-09-01` → `01.09.2026`. */
function formatGermanDay(iso) {
	const [y, m, d] = iso.split("-");
	return `${d}.${m}.${y}`;
}
/** The range a preset stands for, ending today. */
function presetRange(zeitraum, today) {
	return {
		von: shiftDay(today, -(zeitraum === "heute" ? 0 : Number(zeitraum) - 1)),
		bis: today
	};
}
/** The Zeitraum form for a range the server applied: a preset where it matches one, else an own range. */
function rangeForm(von, bis, today) {
	if (!von && !bis) return {
		zeitraum: "",
		von: "",
		bis: ""
	};
	for (const preset of [
		"heute",
		"7",
		"30"
	]) {
		const range = presetRange(preset, today);
		if (von === range.von && bis === range.bis) return {
			zeitraum: preset,
			von: "",
			bis: ""
		};
	}
	return {
		zeitraum: "eigen",
		von: von ? formatGermanDay(von) : "",
		bis: bis ? formatGermanDay(bis) : ""
	};
}
/**
* The ISO range a Zeitraum form asks for, or the German sentence that says what is wrong with an own
* range. Empty ends are left out.
*/
function rangeQuery(form, today) {
	if (form.zeitraum === "heute" || form.zeitraum === "7" || form.zeitraum === "30") return { query: presetRange(form.zeitraum, today) };
	if (form.zeitraum !== "eigen") return { query: {} };
	const von = form.von.trim() === "" ? "" : parseGermanDay(form.von);
	const bis = form.bis.trim() === "" ? "" : parseGermanDay(form.bis);
	if (von === null || bis === null) return { error: "Bitte schreib das Datum als TT.MM.JJJJ, zum Beispiel 01.09.2026." };
	if (von && bis && bis < von) return { error: "Das Enddatum liegt vor dem Anfangsdatum." };
	return { query: {
		...von ? { von } : {},
		...bis ? { bis } : {}
	} };
}
//#endregion
export { rangeQuery as a, rangeForm as i, formatGermanDay as n, parseGermanDay as r, berlinToday as t };
