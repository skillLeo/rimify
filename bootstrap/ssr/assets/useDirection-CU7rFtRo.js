import { c as vue_exports } from "../ssr.js";
import { O as injectConfigProviderContext } from "./Dialog-DGnwH3Iu.js";
//#region node_modules/reka-ui/dist/shared/useDirection.js
/**
* The `useDirection` function provides a way to access the current direction in your application.
* @param {Ref<Direction | undefined>} [dir] - An optional ref containing the direction (ltr or rtl).
* @returns  computed value that combines with the resolved direction.
*/
function useDirection(dir) {
	const context = injectConfigProviderContext({ dir: (0, vue_exports.ref)("ltr") });
	return (0, vue_exports.computed)(() => dir?.value || context.dir?.value || "ltr");
}
//#endregion
export { useDirection as t };
