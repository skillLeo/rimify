import { s as vue_exports } from "../ssr.js";
import { n as server_renderer_exports, t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-CwXNU_Ma.js";
import { r as useShared } from "./useShared-Cs__JTYP.js";
//#region resources/js/Components/Media/Photo.vue?vue&type=script&setup=true&lang.ts
var Photo_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "Photo",
	__ssrInlineRender: true,
	props: {
		photo: {},
		eager: {
			type: Boolean,
			default: false
		},
		fit: { default: "cover" }
	},
	setup(__props) {
		/**
		* A photograph, with the drawn SVG behind it as the fallback.
		*
		* The build pack's rule 1 is that every visual ships as inline SVG, because "external images
		* cannot load in this environment. A grey box with a picture icon is a failure." This component
		* keeps that guarantee while letting photography sit on top for client review: the fallback slot
		* is what renders when the flag is off, when the URL is blocked by CSP, when the host throttles,
		* and when the image 404s. There is no state in which this shows an empty box.
		*
		* The failure is tracked per component instance rather than globally, so one dead URL does not
		* take down every photograph on the page.
		*
		* `eager` exists for the hero. It is the LCP element and must be painted, not faded in — so it
		* carries fetchpriority and skips lazy loading, and the CSS never animates its opacity.
		*/
		const props = __props;
		const shared = useShared();
		const failed = (0, vue_exports.ref)(false);
		const showPhoto = (0, vue_exports.computed)(() => shared.value.photography === true && props.photo !== null && !failed.value);
		/**
		* Decorative photographs are hidden from assistive tech; a photograph carrying meaning keeps its
		* alt. The drawn art follows the same rule, so the two are interchangeable to a screen reader.
		*/
		const alt = (0, vue_exports.computed)(() => props.photo?.alt ?? "");
		return (_ctx, _push, _parent, _attrs) => {
			if (showPhoto.value && __props.photo) _push(`<img${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: ["photo", [`photo--${__props.fit}`, { "photo--eager": __props.eager }]],
				src: __props.photo.url,
				alt: alt.value,
				"aria-hidden": alt.value === "" ? "true" : void 0,
				loading: __props.eager ? "eager" : "lazy",
				fetchpriority: __props.eager ? "high" : "auto",
				style: __props.photo.position ? { objectPosition: __props.photo.position } : void 0,
				decoding: "async"
			}, _attrs))} data-v-3017b89c>`);
			else (0, server_renderer_exports.ssrRenderSlot)(_ctx.$slots, "default", {}, null, _push, _parent);
		};
	}
});
//#endregion
//#region resources/js/Components/Media/Photo.vue
var _sfc_setup = Photo_vue_vue_type_script_setup_true_lang_default.setup;
Photo_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Media/Photo.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Photo_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Photo_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-3017b89c"]]);
//#endregion
//#region resources/js/media/photos.ts
/** Every URL is built through here so a moved folder is one change. */
function photo(file, alt, shows, position) {
	return {
		url: `/images/${file}`,
		alt,
		shows,
		...position === void 0 ? {} : { position }
	};
}
var PHOTOS = {
	heroDesktop: photo("hero.jpg", "", "Dark studio front three-quarter of a performance car, headlight lit, near-black left side", "60% center"),
	/** The same scene at 4:5 with a top-to-bottom scrim; a tighter composition survives portrait. */
	heroMobile: photo("hero-mobile.jpg", "", "Front three-quarter at dusk, wheels prominent, dark surroundings", "center 40%"),
	/** Homepage, "Dein Vorteil: RIMIFY-CHECK": wheel and body both clearly separated. */
	checkBlock: photo("check-car.jpg", "Vorderrad und Karosserie eines Sportwagens in der Seitenansicht", "Side view of a coupé cropped low, front wheel and body panel both clearly readable"),
	/** The RIMIFY-CHECK page hero, behind the full-bleed blue panel. */
	checkHero: photo("check-car.jpg", "", "Side view of a coupé, both wheels clearly visible"),
	/** "Dein Felgenpaket": racked stock, repetition and depth. */
	lager: photo("lager.jpg", "Gestapelte Reifen im Lager", "Rows of new tyres stacked in a warehouse, cool light, strong receding repetition"),
	/** The FAQ help card. Hands and tools only; faces and teams are banned. */
	werkstatt: photo("werkstatt.jpg", "Hände mit Werkzeug an einem Fahrzeug in der Werkstatt", "A mechanic's hands with a wrench on dark machinery, warm key light, no face in frame"),
	/** Kontakt: a real workshop, and nobody in it at all. */
	kontakt: photo("werkstatt.jpg", "Werkstatt mit Werkzeug", "Workshop, utilitarian, no people")
};
photo("banner-1.jpg", "", "Dark wheel close-up, deep shadow across the left of the frame"), photo("banner-2.jpg", "", "Studio wheel detail with a single cold light source"), photo("banner-3.jpg", "", "Wheel and brake detail, dark metal, strong texture"), photo("banner-4.jpg", "", "Wheel under dramatic directional light"), photo("banner-1.jpg", "", "Dark wheel close-up"), photo("banner-2.jpg", "", "Studio wheel detail");
//#endregion
export { Photo_default as n, PHOTOS as t };
