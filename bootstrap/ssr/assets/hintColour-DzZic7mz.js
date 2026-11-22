// resources/js/fitment/hintColour.ts
/** In the order staff choose from, quiet to loud. */
var HINT_COLOURS = [
	{
		value: "green",
		label: "Grün"
	},
	{
		value: "yellow",
		label: "Gelb"
	},
	{
		value: "red",
		label: "Rot"
	}
];
function hintColourLabel(colour) {
	return HINT_COLOURS.find((c) => c.value === colour)?.label ?? "Grün";
}
export { hintColourLabel as n, HINT_COLOURS as t };
