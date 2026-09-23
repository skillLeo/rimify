import { d as __toESM, l as __exportAll, s as require_server_renderer_cjs_prod, u as __reExport } from "../ssr.js";
//#region node_modules/vue/server-renderer/index.mjs
var server_renderer_exports = /* @__PURE__ */ __exportAll({});
__reExport(server_renderer_exports, /* @__PURE__ */ __toESM(require_server_renderer_cjs_prod(), 1));
//#endregion
//#region \0plugin-vue:export-helper
var _plugin_vue_export_helper_default = (sfc, props) => {
	const target = sfc.__vccOpts || sfc;
	for (const [key, val] of props) target[key] = val;
	return target;
};
//#endregion
export { server_renderer_exports as n, _plugin_vue_export_helper_default as t };
