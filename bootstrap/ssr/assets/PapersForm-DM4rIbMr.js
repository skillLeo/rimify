import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as Icon_default } from "./Icon-Bryl-es8.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as useOcr } from "./useOcr-B7pOf1SA.js";
import { n as formatNumber } from "./num-Br8qlecZ.js";
import { s as withUnit } from "./format-6R0uUMt3.js";
import { r as papersSVG, t as Svg_default } from "./Svg-g00AmWNT.js";
//#region resources/js/Components/Product/BuildForm.vue?vue&type=script&setup=true&lang.ts
var BuildForm_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "BuildForm",
	__ssrInlineRender: true,
	props: {
		vehicleId: {},
		build: {},
		missing: {}
	},
	setup(__props) {
		/**
		* Karosserieform and Antriebsart, where the vehicle data has neither (the operator's last prompt §1.1).
		*
		* Derived first, asked second. What an unambiguous word of the car's name gives (`Touring` → Kombi) stands as a
		* filled answer with „stimmt das?“ and one click to change it. What the answer waits for and nothing gives is
		* asked, in plain words with small silhouettes: „Für dieses Fahrzeug fehlt die Karosserieform. Trag sie ein und
		* wir prüfen sofort.“ — a choice is sent at once and the answer above is given again, with no button to find.
		* Kept with THIS car beside 8.1, 8.2 and T (`rmf_papiere`).
		*/
		const props = __props;
		const BODIES = [
			{
				value: "Limousine",
				label: "Limousine",
				path: "M2 19V14L4 12H13L18 7H30L35 12H45L46 13V19Z"
			},
			{
				value: "Kombi",
				label: "Kombi",
				path: "M2 19V14L4 12H13L18 7H44L46 10V19Z"
			},
			{
				value: "Schrägheck",
				label: "Schrägheck",
				path: "M4 19V14L6 12H14L19 7H32L41 11V19Z"
			},
			{
				value: "Coupe",
				label: "Coupé",
				path: "M2 19V14L4 12H15L21 8.5H27L40 12H45L46 13V19Z"
			},
			{
				value: "Cabrio",
				label: "Cabrio",
				path: "M2 19V14L4 12H45L46 13V19ZM15 12L18 8M31 12L32 10H38L39 12"
			},
			{
				value: "Roadster",
				label: "Roadster",
				path: "M5 19V14L7 12H42L43 13V19ZM18 12L21 8M27 12V8.5H30V12"
			},
			{
				value: "SUV",
				label: "SUV",
				path: "M2 19V11L4 9H12L17 4H42L45 8V19Z"
			},
			{
				value: "Van",
				label: "Van",
				path: "M2 19V10L9 3H45V19Z"
			}
		];
		const WHEELS = [12, 36];
		const DRIVES = [
			{
				value: "Vorderachse",
				label: "Frontantrieb"
			},
			{
				value: "Hinterachse",
				label: "Heckantrieb"
			},
			{
				value: "Allrad",
				label: "Allradantrieb"
			}
		];
		const NAMES = {
			bodyForm: "Karosserieform",
			driveAxle: "Antriebsart"
		};
		const asked = (0, vue_exports.computed)(() => ["bodyForm", "driveAxle"].filter((fact) => props.missing.includes(fact)));
		/** „Für dieses Fahrzeug fehlt die Karosserieform. Trag sie ein und wir prüfen sofort.“ */
		const lead = (0, vue_exports.computed)(() => asked.value.length === 2 ? "Für dieses Fahrzeug fehlen Karosserieform und Antriebsart. Trag sie ein und wir prüfen sofort." : `Für dieses Fahrzeug fehlt die ${NAMES[asked.value[0] ?? "bodyForm"]}. Trag sie ein und wir prüfen sofort.`);
		const given = (0, vue_exports.computed)(() => {
			const build = props.build;
			if (build === null) return [];
			return [[
				"bodyForm",
				build.bodyForm,
				build.bodySource,
				build.bodyWord
			], [
				"driveAxle",
				build.driveAxle,
				build.driveSource,
				build.driveWord
			]].filter(([fact, value, source]) => value !== null && (source === "name" || source === "customer") && !asked.value.includes(fact)).map(([fact, value, source, word]) => ({
				fact,
				value: labelOf(fact, value ?? ""),
				source,
				word
			}));
		});
		function labelOf(fact, value) {
			return (fact === "bodyForm" ? BODIES.find((b) => b.value === value)?.label : DRIVES.find((d) => d.value === value)?.label) ?? value;
		}
		const changing = (0, vue_exports.ref)(null);
		const sending = (0, vue_exports.ref)(null);
		const deleting = (0, vue_exports.ref)(false);
		const error = (0, vue_exports.ref)("");
		const shown = (0, vue_exports.computed)(() => changing.value === null ? asked.value : [changing.value]);
		function current(fact) {
			if (sending.value?.fact === fact) return sending.value.value;
			return fact === "bodyForm" ? props.build?.bodyForm ?? null : props.build?.driveAxle ?? null;
		}
		function isSending(fact, value) {
			return sending.value?.fact === fact && sending.value.value === value;
		}
		const ownAnswers = (0, vue_exports.computed)(() => given.value.some((line) => line.source === "customer"));
		return (_ctx, _push, _parent, _attrs) => {
			if (asked.value.length || given.value.length) {
				_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "bf" }, _attrs))} data-v-82b2bfba>`);
				if (asked.value.length && changing.value === null) _push(`<p class="bf__lead" tabindex="-1" data-v-82b2bfba>${(0, server_renderer_exports.ssrInterpolate)(lead.value)}</p>`);
				else _push(`<!---->`);
				if (changing.value === null) {
					_push(`<!--[--><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(given.value, (line) => {
						_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `bf-given-${line.fact}`)} class="bf__given" tabindex="-1" data-v-82b2bfba><span data-v-82b2bfba>${(0, server_renderer_exports.ssrInterpolate)(NAMES[line.fact])}: <strong data-v-82b2bfba>${(0, server_renderer_exports.ssrInterpolate)(line.value)}</strong>`);
						if (line.source === "name") _push(`<!--[--> – erkannt an „${(0, server_renderer_exports.ssrInterpolate)(line.word)}“ im Fahrzeugnamen. Stimmt das?<!--]-->`);
						else _push(`<!--[--> – nach deiner Angabe.<!--]-->`);
						_push(`</span><button class="link" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sending.value !== null || deleting.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${NAMES[line.fact]} ändern`)} data-v-82b2bfba>Ändern</button></p>`);
					});
					_push(`<!--]-->`);
					if (ownAnswers.value) _push(`<button class="link bf__forget" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sending.value !== null || deleting.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", deleting.value ? "true" : void 0)} data-v-82b2bfba> Meine Angaben zu Karosserieform und Antriebsart löschen </button>`);
					else _push(`<!---->`);
					_push(`<!--]-->`);
				} else _push(`<!---->`);
				_push(`<!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(shown.value, (fact) => {
					_push(`<div${(0, server_renderer_exports.ssrRenderAttr)("id", `bf-${fact}`)} class="bf__group" role="group"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `bf-${fact}-h`)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", fact === "bodyForm" ? "bf-bodyForm-hint" : void 0)} data-v-82b2bfba><p${(0, server_renderer_exports.ssrRenderAttr)("id", `bf-${fact}-h`)} class="bf__label" data-v-82b2bfba>${(0, server_renderer_exports.ssrInterpolate)(NAMES[fact])}</p>`);
					if (fact === "bodyForm") _push(`<p id="bf-bodyForm-hint" class="bf__hint" data-v-82b2bfba> Wähle die Form, die dein Auto hat. In der Zulassungsbescheinigung heißt auch manches Schrägheck „Kombilimousine“. </p>`);
					else _push(`<!---->`);
					_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([fact === "bodyForm" ? "bf__options--body" : "bf__options--drive", "bf__options"])}" data-v-82b2bfba>`);
					if (fact === "bodyForm") {
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(BODIES, (body) => {
							_push(`<button class="bf__option" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", current(fact) === body.value ? "true" : "false")}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", isSending(fact, body.value) ? "true" : void 0)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sending.value !== null && !isSending(fact, body.value)) ? " disabled" : ""} data-v-82b2bfba><span class="bf__art" aria-hidden="true" data-v-82b2bfba>`);
							if (isSending(fact, body.value)) _push(`<span class="spinner bf__spinner" data-v-82b2bfba></span>`);
							else {
								_push(`<svg class="bf__shape" viewBox="0 0 48 24" focusable="false" data-v-82b2bfba><path${(0, server_renderer_exports.ssrRenderAttr)("d", body.path)} data-v-82b2bfba></path><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(WHEELS, (x) => {
									_push(`<circle${(0, server_renderer_exports.ssrRenderAttr)("cx", x)} cy="19" r="3.5" data-v-82b2bfba></circle>`);
								});
								_push(`<!--]--></svg>`);
							}
							_push(`</span><span class="bf__word" data-v-82b2bfba>${(0, server_renderer_exports.ssrInterpolate)(body.label)}</span></button>`);
						});
						_push(`<!--]-->`);
					} else {
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(DRIVES, (drive) => {
							_push(`<button class="bf__option bf__option--text" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", current(fact) === drive.value ? "true" : "false")}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", isSending(fact, drive.value) ? "true" : void 0)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sending.value !== null && !isSending(fact, drive.value)) ? " disabled" : ""} data-v-82b2bfba><span class="bf__word" data-v-82b2bfba>${(0, server_renderer_exports.ssrInterpolate)(drive.label)}</span>`);
							if (isSending(fact, drive.value)) _push(`<span class="spinner bf__spinner" aria-hidden="true" data-v-82b2bfba></span>`);
							else _push(`<!---->`);
							_push(`</button>`);
						});
						_push(`<!--]-->`);
					}
					_push(`</div></div>`);
				});
				_push(`<!--]-->`);
				if (changing.value !== null) _push(`<button class="link bf__cancel" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(sending.value !== null) ? " disabled" : ""} data-v-82b2bfba>Abbrechen</button>`);
				else _push(`<!---->`);
				if (error.value) _push(`<p class="form-field__error" role="alert" data-v-82b2bfba>${(0, server_renderer_exports.ssrInterpolate)(error.value)}</p>`);
				else _push(`<!---->`);
				_push(`<p class="visually-hidden" role="status" data-v-82b2bfba>${(0, server_renderer_exports.ssrInterpolate)(sending.value ? "Wird geprüft …" : "")}</p></div>`);
			} else _push(`<!---->`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/BuildForm.vue
var _sfc_setup$2 = BuildForm_vue_vue_type_script_setup_true_lang_default.setup;
BuildForm_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/BuildForm.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var BuildForm_default = /*#__PURE__*/ _plugin_vue_export_helper_default(BuildForm_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-82b2bfba"]]);
//#endregion
//#region resources/js/Components/Art/PapersFacsimile.vue?vue&type=script&setup=true&lang.ts
var PapersFacsimile_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "PapersFacsimile",
	__ssrInlineRender: true,
	props: {
		variant: { default: "neu" },
		width: { default: 560 },
		title: { default: void 0 }
	},
	setup(__props) {
		/**
		* Where the tyre check's figures stand in the papers: 8.1 and 8.2 (the permitted axle loads), T (the top
		* speed) and P.2 (the power) on the Zulassungsbescheinigung Teil I — Ziffer 16, 6 and 7 on the older
		* Fahrzeugschein. Both layouts, because both are in circulation.
		*/
		const props = __props;
		const markup = (0, vue_exports.computed)(() => papersSVG(props.variant, {
			width: props.width,
			title: props.title
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(Svg_default, (0, vue_exports.mergeProps)({ markup: markup.value }, _attrs), null, _parent));
		};
	}
});
//#endregion
//#region resources/js/Components/Art/PapersFacsimile.vue
var _sfc_setup$1 = PapersFacsimile_vue_vue_type_script_setup_true_lang_default.setup;
PapersFacsimile_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Art/PapersFacsimile.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var PapersFacsimile_default = PapersFacsimile_vue_vue_type_script_setup_true_lang_default;
//#endregion
//#region resources/js/Components/Product/PapersForm.vue?vue&type=script&setup=true&lang.ts
var KEPT = "Wir speichern die Werte zu diesem Fahrzeug als Cookie in deinem Browser.";
var FROM_DATA = "aus unseren Fahrzeugdaten";
var FROM_THEM = "von dir eingetragen";
var PapersForm_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "PapersForm",
	__ssrInlineRender: true,
	props: {
		vehicleId: {},
		papers: {},
		known: {},
		powerKw: {},
		asked: {},
		startClosed: { type: Boolean }
	},
	setup(__props) {
		/**
		* The three figures the tyre half needs, from the customer's own papers (Block C, item 10): 8.1 and 8.2,
		* the permitted axle loads front and rear, and T, the top speed. Where the car's data has them, optional; where
		* it lacks them the wheel answer stands and the tyres are „Noch nicht bestätigt“ until they are in (D-286) — then
		* this form is the way on. With them the tyre answer is definite and shows its sum.
		*
		* It asks for what is missing, never for all three (D-291): a field the answer waits for is asked, a figure we already
		* know stands beside it with where it came from — our vehicle data, or the customer's own earlier entry —, and what
		* neither knows nor needs is not asked at all. The fields are text fields that take only digits (`inputmode`), so a
		* mouse wheel turning over them never changes a figure (D-290).
		*
		* A drawing rings where the fields stand, on the certificate issued since 2005 and on the older
		* Fahrzeugschein. The figures are kept with THIS car in the browser (a cookie keyed by the vehicle, so two
		* saved cars never overwrite each other) until customer accounts exist, and the server reads them for every
		* answer about this car.
		*
		* A photo of the papers fills the fields (`useOcr`, on the device, never uploaded): 8.1, 8.2 and T go into
		* the fields for the customer to check before anything is kept; P.2 is compared with the chosen variant's
		* power, because the wheel answer rests on the variant, and a mismatch is said at once.
		*/
		const props = __props;
		const variant = (0, vue_exports.ref)("neu");
		const askedFields = (0, vue_exports.computed)(() => props.asked ?? []);
		const waits = (0, vue_exports.computed)(() => askedFields.value.length > 0);
		const open = (0, vue_exports.ref)(!props.startClosed && waits.value);
		const touched = (0, vue_exports.ref)(false);
		(0, vue_exports.watch)(waits, (now, before) => {
			if (now && !before && !props.startClosed) open.value = true;
		});
		(0, vue_exports.watch)(() => props.startClosed, (closed) => {
			if (!closed && waits.value) open.value = true;
			else if (closed && open.value && !touched.value && !busy.value) open.value = false;
		});
		const busy = (0, vue_exports.ref)(false);
		const errors = (0, vue_exports.ref)({});
		const failure = (0, vue_exports.ref)("");
		const root = (0, vue_exports.ref)(null);
		(0, vue_exports.onBeforeUnmount)(() => {});
		const FIGURES = [
			{
				key: "axle_front_kg",
				field: "8.1",
				prop: "axleFrontKg",
				label: "8.1 · zulässige Achslast vorn",
				unit: "kg"
			},
			{
				key: "axle_rear_kg",
				field: "8.2",
				prop: "axleRearKg",
				label: "8.2 · zulässige Achslast hinten",
				unit: "kg"
			},
			{
				key: "top_speed_kmh",
				field: "T",
				prop: "topSpeedKmh",
				label: "T · Höchstgeschwindigkeit",
				unit: "km/h"
			}
		];
		const figure = (n, unit) => withUnit(formatNumber(n), unit);
		const differs = (0, vue_exports.reactive)(/* @__PURE__ */ new Set());
		const rows = (0, vue_exports.computed)(() => {
			const asking = askedFields.value.length > 0;
			const out = [];
			for (const f of FIGURES) {
				const ours = props.known?.[f.prop] ?? null;
				const theirs = props.papers?.[f.prop] ?? null;
				const theirsGovern = theirs !== null && (ours === null || theirs > ours);
				if (askedFields.value.includes(f.field)) out.push({
					kind: "input",
					key: f.key,
					label: f.label,
					unit: f.unit,
					required: true
				});
				else if (differs.has(f.key)) out.push({
					kind: "input",
					key: f.key,
					label: f.label,
					unit: f.unit,
					required: false,
					...ours === null ? {} : { ours: figure(ours, f.unit) }
				});
				else if (asking && theirsGovern && theirs !== null) out.push({
					kind: "known",
					key: f.key,
					label: f.label,
					shown: figure(theirs, f.unit),
					source: FROM_THEM,
					mayDiffer: false
				});
				else if (ours !== null && (asking || theirs === null)) out.push({
					kind: "known",
					key: f.key,
					label: f.label,
					shown: figure(ours, f.unit),
					source: FROM_DATA,
					mayDiffer: true
				});
				else if (!asking) out.push({
					kind: "input",
					key: f.key,
					label: f.label,
					unit: f.unit,
					required: false
				});
			}
			if (props.powerKw == null) out.push({
				kind: "input",
				key: "power_kw",
				label: asking ? "P.2 · Leistung (erste Zahl, freiwillig)" : "P.2 · Leistung (erste Zahl)",
				unit: "kW",
				required: false
			});
			return out;
		});
		const fieldKeys = (0, vue_exports.computed)(() => rows.value.flatMap((row) => row.kind === "input" ? [row.key] : []));
		const asksFigures = (0, vue_exports.computed)(() => fieldKeys.value.some((key) => key !== "power_kw"));
		const moreOpen = (0, vue_exports.ref)(Boolean(props.papers?.index) || !asksFigures.value);
		const FIELD_NAMES = {
			axle_front_kg: "8.1",
			axle_rear_kg: "8.2",
			top_speed_kmh: "T",
			power_kw: "P.2"
		};
		const unread = (0, vue_exports.computed)(() => {
			const names = fieldKeys.value.map((key) => FIELD_NAMES[key]);
			const last = names.pop() ?? "";
			const list = names.length ? `${names.join(", ")} und ${last}` : last;
			return names.length ? `Wir konnten ${list} nicht lesen. Trag sie bitte von Hand ein.` : `Wir konnten ${list} nicht lesen. Trag den Wert bitte von Hand ein.`;
		});
		const typed = (n) => n == null ? "" : String(n);
		const form = (0, vue_exports.reactive)({
			axle_front_kg: typed(props.papers?.axleFrontKg),
			axle_rear_kg: typed(props.papers?.axleRearKg),
			top_speed_kmh: typed(props.papers?.topSpeedKmh),
			power_kw: typed(props.papers?.powerKw)
		});
		const INDEX_FIELDS = [{
			key: "index_front",
			label: "15.1 · Reifen vorn"
		}, {
			key: "index_rear",
			label: "15.2 · Reifen hinten"
		}];
		const index = (0, vue_exports.reactive)({
			index_front: props.papers?.index?.front ?? "",
			index_rear: props.papers?.index?.rear ?? ""
		});
		const entered = (0, vue_exports.computed)(() => props.papers !== null);
		const summary = (0, vue_exports.computed)(() => {
			const p = props.papers;
			if (p === null) return "";
			return [
				p.axleFrontKg == null ? null : `8.1 ${figure(p.axleFrontKg, "kg")}`,
				p.axleRearKg == null ? null : `8.2 ${figure(p.axleRearKg, "kg")}`,
				p.topSpeedKmh == null ? null : `T ${figure(p.topSpeedKmh, "km/h")}`,
				p.powerKw ? `P.2 ${figure(p.powerKw, "kW")}` : null,
				p.index ? `15.1 ${p.index.front} · 15.2 ${p.index.rear}` : null
			].filter((part) => part !== null).join(" · ");
		});
		/** The form as the kept figures say, nothing typed since — for „Ändern“ and „Abbrechen“; a photo's reading goes too. */
		function fromPapers() {
			form.axle_front_kg = typed(props.papers?.axleFrontKg);
			form.axle_rear_kg = typed(props.papers?.axleRearKg);
			form.top_speed_kmh = typed(props.papers?.topSpeedKmh);
			form.power_kw = typed(props.papers?.powerKw);
			index.index_front = props.papers?.index?.front ?? "";
			index.index_rear = props.papers?.index?.rear ?? "";
			errors.value = {};
			differs.clear();
			scan.value = "idle";
			readPowerKw.value = null;
			touched.value = false;
		}
		(0, vue_exports.watch)(() => props.papers, () => {
			if (!open.value || props.papers === null) fromPapers();
		});
		useOcr();
		(0, vue_exports.ref)(null);
		const scan = (0, vue_exports.ref)("idle");
		const readPowerKw = (0, vue_exports.ref)(null);
		const powerMismatch = (0, vue_exports.computed)(() => readPowerKw.value !== null && props.powerKw != null && readPowerKw.value !== props.powerKw);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				ref_key: "root",
				ref: root,
				class: "pp"
			}, _attrs))} data-v-edec8af0>`);
			if (__props.papers && !open.value && !askedFields.value.length) {
				_push(`<!--[--><p class="pp__summary" data-v-edec8af0><span data-v-edec8af0>Nach deinen Angaben: ${(0, server_renderer_exports.ssrInterpolate)(summary.value)}</span><button id="pp-change" class="btn btn--ghost btn--sm" type="button" data-v-edec8af0>Ändern</button></p><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.papers.notes, (note) => {
					_push(`<p class="pp__help" data-v-edec8af0>${(0, server_renderer_exports.ssrInterpolate)(note)}</p>`);
				});
				_push(`<!--]--><!--]-->`);
			} else if (!open.value) _push(`<button id="pp-open" class="btn btn--secondary btn--sm pp__open" type="button" data-v-edec8af0> Werte aus der Zulassungsbescheinigung eintragen </button>`);
			else {
				_push(`<form class="pp__form" novalidate aria-labelledby="pp-h" data-v-edec8af0><div class="pp__head" data-v-edec8af0><p id="pp-h" class="pp__title" data-v-edec8af0>Werte aus deiner Zulassungsbescheinigung</p>`);
				if (askedFields.value.length) _push(`<p class="pp__help" data-asked data-v-edec8af0>${(0, server_renderer_exports.ssrInterpolate)(KEPT)}</p>`);
				else if (asksFigures.value) _push(`<p class="pp__help" data-v-edec8af0> Freiwillig: Mit den zulässigen Achslasten und der Höchstgeschwindigkeit zeigen wir dir, welche Reifen du fahren darfst. ${(0, server_renderer_exports.ssrInterpolate)(KEPT)}</p>`);
				else _push(`<p class="pp__help" data-v-edec8af0> Die Achslasten und die Höchstgeschwindigkeit stehen schon in unseren Fahrzeugdaten. Die Reifen aus den Feldern 15.1 und 15.2 kannst du freiwillig ergänzen. ${(0, server_renderer_exports.ssrInterpolate)(KEPT)}</p>`);
				_push(`<!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.papers?.notes ?? [], (note) => {
					_push(`<p class="pp__help" data-v-edec8af0>${(0, server_renderer_exports.ssrInterpolate)(note)}</p>`);
				});
				_push(`<!--]--></div>`);
				if (rows.value.length) {
					_push(`<div class="pp__grid" data-v-edec8af0><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(rows.value, (row) => {
						_push(`<!--[-->`);
						if (row.kind === "input") {
							_push(`<div class="form-field" data-v-edec8af0><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `pp-${row.key}`)} data-v-edec8af0>${(0, server_renderer_exports.ssrInterpolate)(row.label)}<span class="visually-hidden" data-v-edec8af0> (${(0, server_renderer_exports.ssrInterpolate)(row.unit)})</span></label><div class="input-group" data-v-edec8af0><input${(0, server_renderer_exports.ssrRenderAttr)("id", `pp-${row.key}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", form[row.key])} class="input" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" data-pp-field${(0, server_renderer_exports.ssrRenderAttr)("aria-required", row.required ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value[row.key] ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `pp-${row.key}-err`)} data-v-edec8af0><span class="input-group__suffix" aria-hidden="true" translate="no" data-v-edec8af0>${(0, server_renderer_exports.ssrInterpolate)(row.unit)}</span></div>`);
							if (errors.value[row.key] || !row.ours) _push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `pp-${row.key}-err`)} class="form-field__error" data-v-edec8af0>${(0, server_renderer_exports.ssrInterpolate)(errors.value[row.key])}</p>`);
							else _push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `pp-${row.key}-err`)} class="pp__source" data-v-edec8af0>In unseren Fahrzeugdaten: ${(0, server_renderer_exports.ssrInterpolate)(row.ours)}. Wir rechnen mit dem höheren der beiden Werte.</p>`);
							_push(`</div>`);
						} else {
							_push(`<div class="form-field pp__known"${(0, server_renderer_exports.ssrRenderAttr)("data-pp-known", row.key)} data-v-edec8af0><span class="form-field__label" data-v-edec8af0>${(0, server_renderer_exports.ssrInterpolate)(row.label)}</span><span class="pp__value" data-v-edec8af0>${(0, server_renderer_exports.ssrInterpolate)(row.shown)}</span><span class="pp__source" data-v-edec8af0>${(0, server_renderer_exports.ssrInterpolate)(row.source)}`);
							if (row.mayDiffer) _push(`<!--[--> · <button class="link pp__differ" type="button" data-v-edec8af0>Steht in deinen Papieren ein anderer Wert?</button><!--]-->`);
							else _push(`<!---->`);
							_push(`</span></div>`);
						}
						_push(`<!--]-->`);
					});
					_push(`<!--]--></div>`);
				} else _push(`<!---->`);
				_push(`<details class="pp__fold" data-v-edec8af0><summary class="pp__toggle" data-v-edec8af0>Wo stehen die Werte?</summary><figure class="pp__figure" data-v-edec8af0><div class="pp__variants" role="group" aria-label="Welches Dokument hast du?" data-v-edec8af0><button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", variant.value === "neu" ? "true" : "false")} data-v-edec8af0>Zulassungsbescheinigung Teil I</button><button class="chip" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-pressed", variant.value === "alt" ? "true" : "false")} data-v-edec8af0>Alter Fahrzeugschein</button></div>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(PapersFacsimile_default, {
					variant: variant.value,
					width: 360,
					title: variant.value === "neu" ? "Zulassungsbescheinigung Teil I: die Felder 8.1, 8.2, T und P.2 sind markiert" : "Alter Fahrzeugschein: die Ziffern 6, 7 und 16 sind markiert"
				}, null, _parent));
				_push(`<figcaption class="pp__caption" data-v-edec8af0>${(0, server_renderer_exports.ssrInterpolate)(variant.value === "neu" ? "Die Achslasten stehen in 8.1 und 8.2, die Höchstgeschwindigkeit in T." : "Im alten Fahrzeugschein: Achslasten in Ziffer 16, Höchstgeschwindigkeit in Ziffer 6.")}</figcaption></figure></details>`);
				if (fieldKeys.value.length) {
					_push(`<div class="pp__scan" data-v-edec8af0><label for="pp-photo" class="visually-hidden" data-v-edec8af0>Foto der Zulassungsbescheinigung Teil I</label><input id="pp-photo" class="visually-hidden" type="file" accept="image/*" capture="environment" tabindex="-1" data-v-edec8af0><button class="btn btn--secondary btn--sm" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(scan.value === "busy") ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", scan.value === "busy" ? "true" : void 0)} data-v-edec8af0>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "camera",
						size: 20
					}, null, _parent));
					_push(` Zulassungsbescheinigung fotografieren </button><p class="pp__help" data-v-edec8af0>Die Erkennung läuft auf deinem Gerät. Das Foto wird nicht hochgeladen.</p>`);
					if (scan.value === "busy") _push(`<p class="pp__help" role="status" data-v-edec8af0>Erkennung läuft …</p>`);
					else if (scan.value === "read") _push(`<p class="pp__help" role="status" data-v-edec8af0>Aus dem Foto gelesen. Prüf die Werte, bevor du sie übernimmst.</p>`);
					else if (scan.value === "failed") {
						_push(`<p class="notice notice--warn" role="alert" data-v-edec8af0>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "warning",
							size: 20
						}, null, _parent));
						_push(`<span data-v-edec8af0>${(0, server_renderer_exports.ssrInterpolate)(unread.value)}</span></p>`);
					} else _push(`<!---->`);
					if (powerMismatch.value) {
						_push(`<p class="notice notice--warn" role="alert" data-v-edec8af0>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
							name: "warning",
							size: 20
						}, null, _parent));
						_push(`<span data-v-edec8af0> Laut Foto hat dein Fahrzeug ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)(readPowerKw.value ?? "", "kW"))} (Feld P.2), gewählt ist eine Variante mit ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)(__props.powerKw ?? "", "kW"))}. Prüf bitte, ob du die richtige Variante gewählt hast – davon hängt ab, welche Felgen freigegeben sind. </span></p>`);
					} else _push(`<!---->`);
					_push(`</div>`);
				} else _push(`<!---->`);
				_push(`<details class="pp__fold"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(moreOpen.value) ? " open" : ""} data-v-edec8af0><summary class="pp__toggle" data-v-edec8af0>Reifen aus den Feldern 15.1 und 15.2 eintragen (freiwillig)</summary><div class="pp__index" data-v-edec8af0><p class="pp__help" data-v-edec8af0> Trag beide ein, vorn und hinten, so wie sie dort stehen. Verlangen sie mehr als unsere Berechnung, gilt das Strengere. </p><div class="pp__pair" data-v-edec8af0><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(INDEX_FIELDS, (field) => {
					_push(`<div class="form-field" data-v-edec8af0><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `pp-${field.key}`)} data-v-edec8af0>${(0, server_renderer_exports.ssrInterpolate)(field.label)}</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `pp-${field.key}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", index[field.key])} class="input" type="text" autocomplete="off" spellcheck="false" placeholder="z. B. 225/45 R17 91W"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value[field.key] ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `pp-${field.key}-err`)} data-v-edec8af0><p${(0, server_renderer_exports.ssrRenderAttr)("id", `pp-${field.key}-err`)} class="form-field__error" data-v-edec8af0>${(0, server_renderer_exports.ssrInterpolate)(errors.value[field.key])}</p></div>`);
				});
				_push(`<!--]--></div></div></details><div class="pp__actions" data-v-edec8af0><button id="pp-save" class="btn btn--secondary btn--sm" type="submit"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-edec8af0>Werte übernehmen</button><button class="btn btn--ghost btn--sm" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", busy.value ? "true" : void 0)} data-v-edec8af0>Abbrechen</button>`);
				if (entered.value) _push(`<button class="btn btn--ghost btn--sm" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-edec8af0>Werte löschen</button>`);
				else _push(`<!---->`);
				_push(`</div>`);
				if (failure.value) _push(`<p class="form-field__error pp__failure" role="alert" data-v-edec8af0>${(0, server_renderer_exports.ssrInterpolate)(failure.value)}</p>`);
				else _push(`<!---->`);
				_push(`</form>`);
			}
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Product/PapersForm.vue
var _sfc_setup = PapersForm_vue_vue_type_script_setup_true_lang_default.setup;
PapersForm_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Product/PapersForm.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var PapersForm_default = /*#__PURE__*/ _plugin_vue_export_helper_default(PapersForm_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-edec8af0"]]);
//#endregion
export { BuildForm_default as n, PapersForm_default as t };
