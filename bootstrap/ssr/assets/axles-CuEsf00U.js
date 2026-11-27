//#region resources/js/fitment/axles.ts
/**
* The tyre sizes of an answer, by axle: one list where both axles take the same sizes, otherwise each axle by name —
* „vorn …“ beside „hinten …“. The preview once named the rear and left the front to be guessed: „225/40 R18 · hinten
* 225/40 R18, 255/35 R18“ (the admin audit's F-06). Within an axle the sizes stand apart by commas, so the dot only
* ever separates the axles.
*/
function sizesByAxle(front, rear) {
	return rear.length > 0 && rear.join() !== front.join() ? `vorn ${front.join(", ")} · hinten ${rear.join(", ")}` : front.join(", ");
}
//#endregion
export { sizesByAxle as t };
