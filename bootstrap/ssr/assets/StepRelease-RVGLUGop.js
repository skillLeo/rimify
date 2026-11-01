import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-COuF1lMZ.js";
import { C as provenanceLabel, D as cellDone, F as unreadableLines, L as readTyre, O as cellSummary, P as undescribedCodes, _ as WHEELS, h as PRINTED_ONLY, o as useSketch, v as carCount, w as sizeName, x as kwRange, y as documented } from "./gutachtenStore-DERNJqCs.js";
import { t as CodeDefine_default } from "./CodeDefine-9FJkBZOa.js";
//#region resources/js/Pages/Admin/Skizze/parts/StepRelease.vue?vue&type=script&setup=true&lang.ts
var StepRelease_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "StepRelease",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* Step 5, Freigeben (the brief §7): everything at a glance — one line per car group, gaps flagged, a click back to the
		* empty cell. What used to stand in two banners is asked here, where it is decided: the cars whose data has no
		* documented provenance, the codes nobody has described, how the paper gives load index and speed symbol, and whether
		* the whole paper is entered (D-227, three answers, no default). „Freigeben" goes through the release door as today: it
		* names what is still open, and an undescribed code is one of those things (Phase 0, difference 2).
		*/
		const store = useSketch();
		const { state } = store;
		const describing = (0, vue_exports.ref)(null);
		const size = (0, vue_exports.computed)(() => {
			const wheel = WHEELS.find((w) => w.id === state.wheelId);
			return wheel?.sizes.find((s) => s.id === state.sizeId) ?? wheel?.sizes[0];
		});
		const groups = (0, vue_exports.computed)(() => store.chosenGroups());
		const empty = (0, vue_exports.computed)(() => groups.value.filter((group) => !cellDone(store.cellOf(group.id))));
		const codes = (0, vue_exports.computed)(() => undescribedCodes(groups.value.map((group) => store.cellOf(group.id)), state.codes));
		const unproven = (0, vue_exports.computed)(() => groups.value.flatMap((group) => store.carsOf(group)).filter((car) => !documented(car.provenance)));
		const unconfirmed = (0, vue_exports.computed)(() => unproven.value.filter((car) => !state.checked.includes(car.id)));
		const sizesEntered = (0, vue_exports.computed)(() => groups.value.flatMap((group) => {
			return store.cellOf(group.id).tyres.map((line) => line.text);
		}));
		const withoutIndex = (0, vue_exports.computed)(() => sizesEntered.value.filter((text) => {
			const tyre = readTyre(text);
			return tyre === null || tyre.li === null || tyre.si === null;
		}).length);
		const suggestion = (0, vue_exports.computed)(() => sizesEntered.value.length > 0 && withoutIndex.value === 0 ? "document" : "papers");
		const LI_SOURCES = [
			{
				value: "document",
				label: "Bei jeder Reifengröße"
			},
			{
				value: "papers",
				label: "Mit einem Verweis auf die Fahrzeugpapiere"
			},
			{
				value: "table",
				label: "In einer Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit"
			}
		];
		const blockers = (0, vue_exports.computed)(() => {
			const out = [];
			if (state.number.trim() === "") out.push("Die Nummer des Gutachtens fehlt (Schritt 1).");
			if (groups.value.length === 0) out.push("Keine Fahrzeuggruppe übernommen (Schritt 3).");
			for (const group of groups.value.filter((g) => store.carsOf(g).length === 0)) out.push(`${group.sales} (${group.type}) verknüpft kein Fahrzeug (Schritt 3).`);
			const unreadable = groups.value.reduce((n, g) => n + unreadableLines(store.cellOf(g.id)).length, 0);
			if (unreadable) out.push(`${unreadable === 1 ? "Eine Reifenzeile ist" : `${unreadable} Reifenzeilen sind`} leer oder nicht lesbar (Schritt 4).`);
			if (empty.value.length) out.push(empty.value.length === 1 ? "1 Fahrzeuggruppe hat noch keine Reifen." : `${empty.value.length} Fahrzeuggruppen haben noch keine Reifen.`);
			if (codes.value.length) out.push(`${codes.value.length === 1 ? "Ein Code ist" : `${codes.value.length} Codes sind`} noch ohne Beschreibung: ${codes.value.join(", ")}.`);
			if (unconfirmed.value.length) out.push(`${unconfirmed.value.length === 1 ? "Ein Fahrzeug hat" : `${unconfirmed.value.length} Fahrzeuge haben`} keine belegte Herkunft.`);
			if (state.liSource === null) out.push("Noch offen: wie das Gutachten Lastindex und Geschwindigkeitssymbol angibt.");
			if (state.complete === null) out.push("Noch offen: ob das Gutachten vollständig erfasst ist.");
			else if (state.complete === "teilweise" && state.missing.trim() === "") out.push("Noch offen: was vom Gutachten noch nicht erfasst ist.");
			return out;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "sk-step",
				"aria-labelledby": "sk-release-h"
			}, _attrs))} data-v-587b0e9b>`);
			if (!(0, vue_exports.unref)(state).released) {
				_push(`<!--[--><h2 id="sk-release-h" class="adm-section__title" tabindex="-1" data-v-587b0e9b>Prüfen und freigeben</h2><p class="adm-note" data-v-587b0e9b>Alle Fahrzeuggruppen auf einen Blick. Lücken sind markiert; ein Klick führt zurück zum Eintragen.</p>`);
				if (empty.value.length) {
					_push(`<p class="sk-gap" data-v-587b0e9b>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
						name: "warning",
						size: 20
					}, null, _parent));
					_push(` ${(0, server_renderer_exports.ssrInterpolate)(empty.value.length === 1 ? "1 Fahrzeuggruppe hat" : `${empty.value.length} Fahrzeuggruppen haben`)} noch keine Reifen. <button class="sk-link" type="button" data-v-587b0e9b>Jetzt eintragen</button></p>`);
				} else _push(`<!---->`);
				_push(`<div class="adm-panel sk-matrix" data-v-587b0e9b><table class="adm-table" data-v-587b0e9b><caption class="visually-hidden" data-v-587b0e9b>Fahrzeuggruppen und ihre Reifen</caption><thead data-v-587b0e9b><tr data-v-587b0e9b><th scope="col" data-v-587b0e9b>Fahrzeuggruppe</th><th scope="col" class="num" data-v-587b0e9b>Fahrzeuge</th><th scope="col" data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)(size.value ? (0, vue_exports.unref)(sizeName)(size.value) : "")}</th></tr></thead><tbody data-v-587b0e9b><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(groups.value, (group) => {
					_push(`<tr data-v-587b0e9b><td data-label="Fahrzeuggruppe" data-v-587b0e9b><span class="adm-table__key" data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)(group.sales)} (${(0, server_renderer_exports.ssrInterpolate)(group.type)})</span><span class="adm-table__sub" data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)(group.approvals.join(", "))} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(kwRange)(group.kwMin, group.kwMax))}</span></td><td class="num" data-label="Fahrzeuge" data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(store).carsOf(group).length)}</td><td data-label="Reifen" data-v-587b0e9b><button class="${(0, server_renderer_exports.ssrRenderClass)([{ "sk-cellbtn--empty": !(0, vue_exports.unref)(cellDone)((0, vue_exports.unref)(store).cellOf(group.id)) }, "sk-cellbtn"])}" type="button" data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(cellSummary)((0, vue_exports.unref)(store).cellOf(group.id)))} `);
					if ((0, vue_exports.unref)(store).cellOf(group.id).copiedFrom) _push(`<span class="adm-tag adm-tag--neutral" data-v-587b0e9b>kopiert von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(store).cellOf(group.id).copiedFrom)}</span>`);
					else _push(`<!---->`);
					_push(`</button></td></tr>`);
				});
				_push(`<!--]--></tbody></table></div><div class="sk-checks" data-v-587b0e9b>`);
				if (unproven.value.length) {
					_push(`<section class="sk-check" aria-labelledby="sk-prov-h" data-v-587b0e9b><h3 id="sk-prov-h" class="sk-check__title" data-v-587b0e9b>Fahrzeuge ohne belegte Herkunft</h3><p class="adm-note" data-v-587b0e9b>Zur Freigabe müssen die Daten jedes Fahrzeugs aus einem Import oder aus einem Gutachten stammen oder von Hand geprüft sein.</p><ul class="sk-check__list" data-v-587b0e9b><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(unproven.value, (car) => {
						_push(`<li class="sk-check__item" data-v-587b0e9b><span data-v-587b0e9b><strong data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)(car.name)}</strong> · HSN/TSN ${(0, server_renderer_exports.ssrInterpolate)(car.hsn)}/${(0, server_renderer_exports.ssrInterpolate)(car.tsn)} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(provenanceLabel)(car.provenance))}</span>`);
						if (!(0, vue_exports.unref)(state).checked.includes(car.id)) _push(`<button class="btn btn--secondary" type="button" data-v-587b0e9b>Daten geprüft</button>`);
						else {
							_push(`<span class="sk-done" data-v-587b0e9b>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "check",
								size: 16
							}, null, _parent));
							_push(` geprüft</span>`);
						}
						_push(`</li>`);
					});
					_push(`<!--]--></ul></section>`);
				} else _push(`<!---->`);
				if (codes.value.length || describing.value) {
					_push(`<section class="sk-check" aria-labelledby="sk-open-h" data-v-587b0e9b><h3 id="sk-open-h" class="sk-check__title" data-v-587b0e9b>Codes ohne Beschreibung</h3><p class="adm-note" data-v-587b0e9b>Der Shop zeigt eine Auflage als ganzen Satz. Ohne Beschreibung hätte er keinen.</p><ul class="sk-check__list" data-v-587b0e9b><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(codes.value, (code) => {
						_push(`<li class="sk-check__item" data-v-587b0e9b><span class="sk-code sk-code--open" data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)(code)}</span><span class="sk-check__page" data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(PRINTED_ONLY)[code] ? `im PDF auf Seite ${(0, vue_exports.unref)(PRINTED_ONLY)[code]?.page}` : "")}</span>`);
						if (describing.value !== code) _push(`<button class="btn btn--secondary" type="button" data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)(code)} beschreiben</button>`);
						else {
							_push(`<div class="sk-check__form" data-v-587b0e9b>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(CodeDefine_default, {
								code,
								"id-prefix": `sk-release-${code}`,
								onDone: ($event) => describing.value = null,
								onCancel: ($event) => describing.value = null
							}, null, _parent));
							_push(`</div>`);
						}
						_push(`</li>`);
					});
					_push(`<!--]--></ul></section>`);
				} else _push(`<!---->`);
				_push(`<fieldset class="sk-fieldset sk-check" data-v-587b0e9b><legend class="sk-check__title" data-v-587b0e9b>Wie gibt das Gutachten Lastindex und Geschwindigkeitssymbol an?</legend><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(LI_SOURCES, (option) => {
					_push(`<label class="check" data-v-587b0e9b><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(state).liSource, option.value)) ? " checked" : ""} type="radio" name="sk-li-release"${(0, server_renderer_exports.ssrRenderAttr)("value", option.value)} data-v-587b0e9b><span data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)(option.label)}`);
					if (option.value === suggestion.value) _push(`<span class="adm-tag adm-tag--neutral sk-suggest" data-v-587b0e9b>Vorschlag</span>`);
					else _push(`<!---->`);
					_push(`</span></label>`);
				});
				_push(`<!--]--><p class="form-field__help" data-v-587b0e9b> Vorschlag aus den eingetragenen Reifen: ${(0, server_renderer_exports.ssrInterpolate)(withoutIndex.value === 0 ? "Alle nennen Lastindex und Symbol." : `${withoutIndex.value} von ${sizesEntered.value.length} Reifen ohne Lastindex oder Symbol.`)} Entscheidend ist, was im Gutachten steht. </p></fieldset><fieldset class="sk-fieldset sk-check" data-v-587b0e9b><legend class="sk-check__title" data-v-587b0e9b>Ist das Gutachten vollständig erfasst?</legend><label class="check" data-v-587b0e9b><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(state).complete, "ja")) ? " checked" : ""} type="radio" name="sk-complete" value="ja" aria-describedby="sk-complete-ja" data-v-587b0e9b><span data-v-587b0e9b>Ja, alle Zeilen des Gutachtens sind erfasst</span></label><p id="sk-complete-ja" class="form-field__help sk-check__then" data-v-587b0e9b>Ein Fahrzeug, das hier nicht steht, ist im Shop dann „nicht freigegeben“.</p><label class="check" data-v-587b0e9b><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(state).complete, "teilweise")) ? " checked" : ""} type="radio" name="sk-complete" value="teilweise" aria-describedby="sk-complete-teil" data-v-587b0e9b><span data-v-587b0e9b>Noch nicht vollständig</span></label><p id="sk-complete-teil" class="form-field__help sk-check__then" data-v-587b0e9b>Ein Fahrzeug, das hier nicht steht, ist im Shop dann „noch nicht bestätigt“.</p>`);
				if ((0, vue_exports.unref)(state).complete === "teilweise") _push(`<div class="form-field sk-check__missing" data-v-587b0e9b><label class="form-field__label" for="sk-missing" data-v-587b0e9b>Was fehlt noch?</label><input id="sk-missing"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(state).missing)} class="input" type="text" maxlength="255" placeholder="z. B. Anlagen 1–15" data-v-587b0e9b></div>`);
				else _push(`<!---->`);
				_push(`<label class="check" data-v-587b0e9b><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(state).complete, "unbekannt")) ? " checked" : ""} type="radio" name="sk-complete" value="unbekannt" aria-describedby="sk-complete-unb" data-v-587b0e9b><span data-v-587b0e9b>Weiß ich nicht</span></label><p id="sk-complete-unb" class="form-field__help sk-check__then" data-v-587b0e9b>Wie „Noch nicht vollständig“: Ein Fahrzeug, das hier nicht steht, ist „noch nicht bestätigt“.</p></fieldset></div><div class="sk-release" data-v-587b0e9b>`);
				if (blockers.value.length) {
					_push(`<div class="sk-release__open" role="status" data-v-587b0e9b><p class="sk-check__title" data-v-587b0e9b>Noch offen vor der Freigabe</p><ul data-v-587b0e9b><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(blockers.value, (line) => {
						_push(`<li data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)(line)}</li>`);
					});
					_push(`<!--]--></ul></div>`);
				} else _push(`<!---->`);
				_push(`<div class="sk-actions" data-v-587b0e9b><button class="btn btn--secondary sk-actions__left" type="button" data-v-587b0e9b>Zurück</button><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(blockers.value.length > 0) ? " disabled" : ""} data-v-587b0e9b>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "publish",
					size: 20
				}, null, _parent));
				_push(` Freigeben </button></div></div><!--]-->`);
			} else {
				_push(`<!--[--><h2 id="sk-release-h" class="adm-section__title" tabindex="-1" data-v-587b0e9b>Freigegeben</h2><p class="adm-note" data-v-587b0e9b>So sieht das Gutachten nach der Freigabe aus: die Codes kurz, ihr Text beim Darüberfahren mit der Maus. Ändern geht über eine neue Fassung; bis sie freigegeben ist, nutzt der Shop die alte.</p><div class="adm-panel" data-v-587b0e9b><table class="adm-table sk-read" data-v-587b0e9b><caption class="visually-hidden" data-v-587b0e9b>Verwendungsbereich</caption><thead data-v-587b0e9b><tr data-v-587b0e9b><th scope="col" data-v-587b0e9b>Fahrzeuggruppe</th><th scope="col" data-v-587b0e9b>Reifen</th><th scope="col" data-v-587b0e9b>Allgemeine Codes</th><th scope="col" class="num" data-v-587b0e9b>Seite</th></tr></thead><tbody data-v-587b0e9b><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(groups.value, (group) => {
					_push(`<tr data-v-587b0e9b><td data-label="Fahrzeuggruppe" data-v-587b0e9b><span class="adm-table__key" data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)(group.sales)} (${(0, server_renderer_exports.ssrInterpolate)(group.type)})</span><span class="adm-table__sub" data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)(group.approvals.join(", "))} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(kwRange)(group.kwMin, group.kwMax))} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(carCount)((0, vue_exports.unref)(store).carsOf(group).length))}</span></td><td data-label="Reifen" data-v-587b0e9b><ul class="sk-read__tyres" data-v-587b0e9b><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(store).cellOf(group.id).tyres, (line) => {
						_push(`<li data-v-587b0e9b><span class="sk-read__size" data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)(line.text)}</span>`);
						if (line.kw) _push(`<span class="sk-count" data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(kwRange)(line.kw.replace("-", "–")))}</span>`);
						else _push(`<!---->`);
						_push(`<span class="sk-codes" data-v-587b0e9b><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(line.codes, (code) => {
							_push(`<span class="sk-code"${(0, server_renderer_exports.ssrRenderAttr)("title", (0, vue_exports.unref)(store).codeOf(code)?.text ?? "")} data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)(code)}</span>`);
						});
						_push(`<!--]--></span></li>`);
					});
					_push(`<!--]--><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(store).cellOf(group.id).pairs, (pair) => {
						_push(`<li data-v-587b0e9b><span class="sk-read__size" data-v-587b0e9b>vorne ${(0, server_renderer_exports.ssrInterpolate)(pair.front)} · hinten ${(0, server_renderer_exports.ssrInterpolate)(pair.rear)}</span><span class="sk-codes" data-v-587b0e9b><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(pair.codes, (code) => {
							_push(`<span class="sk-code"${(0, server_renderer_exports.ssrRenderAttr)("title", (0, vue_exports.unref)(store).codeOf(code)?.text ?? "")} data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)(code)}</span>`);
						});
						_push(`<!--]--></span></li>`);
					});
					_push(`<!--]--></ul></td><td data-label="Allgemeine Codes" data-v-587b0e9b><span class="sk-codes" data-v-587b0e9b><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(store).cellOf(group.id).general, (code) => {
						_push(`<span class="sk-code"${(0, server_renderer_exports.ssrRenderAttr)("title", (0, vue_exports.unref)(store).codeOf(code)?.text ?? "")} data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)(code)}</span>`);
					});
					_push(`<!--]--></span></td><td class="num" data-label="Seite" data-v-587b0e9b>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(store).cellOf(group.id).page || "–")}</td></tr>`);
				});
				_push(`<!--]--></tbody></table></div><div class="sk-actions" data-v-587b0e9b><button class="btn btn--secondary sk-actions__left" type="button" data-v-587b0e9b>Zurück zur Eingabe</button><button class="btn btn--primary" type="button" data-v-587b0e9b>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "edit",
					size: 20
				}, null, _parent));
				_push(` Neue Fassung anlegen </button></div><!--]-->`);
			}
			_push(`</section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Skizze/parts/StepRelease.vue
var StepRelease_exports = /* @__PURE__ */ __exportAll({ default: () => StepRelease_default });
var _sfc_setup = StepRelease_vue_vue_type_script_setup_true_lang_default.setup;
StepRelease_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Skizze/parts/StepRelease.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var StepRelease_default = /*#__PURE__*/ _plugin_vue_export_helper_default(StepRelease_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-587b0e9b"]]);
//#endregion
export { StepRelease_exports as n, StepRelease_default as t };
