//#region resources/js/lib/adminSort.ts
/**
* A heading pressed: the same column turns around; another starts with what a person looks for first — `auf` for names
* and sizes, `ab` for counts and dates (the column's own first direction).
*/
function nextSort(current, column, first = "auf") {
	if (current.sort === column) return {
		sort: column,
		richtung: current.richtung === "auf" ? "ab" : "auf"
	};
	return {
		sort: column,
		richtung: first
	};
}
/** The query for an order: nothing for the default. */
function sortQuery(sort, fallback) {
	return sort.sort === fallback.sort && sort.richtung === fallback.richtung ? {} : {
		sort: sort.sort,
		richtung: sort.richtung
	};
}
//#endregion
export { sortQuery as n, nextSort as t };
