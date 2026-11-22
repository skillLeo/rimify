//#region resources/js/composables/admin/menu.ts
/**
* The room a row's „⋯“ menu keeps from the viewport's edges when it opens (reka's collision padding). At
* the bottom it clears the phone's tab bar (--bottomnav-h, 56 px) and a little more, so no item lies under
* the bar or under a toast standing above it (K2-32).
*/
var MENU_ROOM = {
	top: 16,
	right: 16,
	bottom: 72,
	left: 16
};
//#endregion
export { MENU_ROOM as t };
