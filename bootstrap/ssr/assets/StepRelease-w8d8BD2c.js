import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { d as vue_exports, l as router } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-D0z-a8p_.js";
import { t as AdminConfirm_default } from "./AdminConfirm-sC9Lzvnq.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { c as distinctCars, h as useGutachtenPage, m as useEntry, o as carSummary } from "./entryStore-XWwzBuxT.js";
import { t as ReleaseDialog_default } from "./ReleaseDialog-CVzCM37o.js";
import { t as CodeDefine_default } from "./CodeDefine-deF-12NI.js";
import { t as LegendDialog_default } from "./LegendDialog-DxtErlDh.js";
import { t as PreviewSection_default } from "./PreviewSection-BRsqSzTW.js";
//#region resources/js/Pages/Admin/Gutachten/Erfassung/StepRelease.vue?vue&type=script&setup=true&lang.ts
var StepRelease_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "StepRelease",
	__ssrInlineRender: true,
	setup(__props) {
		/**
		* Step 5, Freigeben (the Gutachten rework §7): every car at a glance, gaps flagged, a click back to the empty one. What used to
		* stand in two banners is asked here, where it is decided: the cars whose data has no documented provenance, the codes nobody has
		* described, how the paper gives load index and speed symbol. „Freigeben“ goes through the release door as before: it names what
		* is still open, and an undescribed code or two cars of one field K with different pairs are among those things.
		*/
		const store = useEntry();
		const { state } = store;
		const page = useGutachtenPage();
		const doc = (0, vue_exports.computed)(() => page.props.document);
		const describing = (0, vue_exports.ref)(null);
		const legendOpen = (0, vue_exports.ref)(false);
		const releaseOpen = (0, vue_exports.ref)(false);
		const busy = (0, vue_exports.ref)(null);
		const failure = (0, vue_exports.ref)("");
		const dropping = (0, vue_exports.ref)(null);
		const dropOpen = (0, vue_exports.computed)({
			get: () => dropping.value !== null,
			set: (open) => {
				if (!open) dropping.value = null;
			}
		});
		const cellBusy = (0, vue_exports.ref)(false);
		const cars = (0, vue_exports.computed)(() => state.entry.cars);
		const combinations = (0, vue_exports.computed)(() => state.entry.combinations);
		const vehicles = (0, vue_exports.computed)(() => distinctCars(cars.value));
		const empty = (0, vue_exports.computed)(() => cars.value.filter((car) => !car.done));
		const unreachable = (0, vue_exports.computed)(() => state.entry.unreachable.filter((item) => cars.value.some((car) => car.vehicleId === item.vehicleId && car.lines > 0)));
		const unproven = (0, vue_exports.computed)(() => vehicles.value.filter((car) => car.unsourced));
		const codes = (0, vue_exports.computed)(() => state.entry.undescribed);
		const rows = (0, vue_exports.computed)(() => page.props.rowsTotal ?? 0);
		const blockers = (0, vue_exports.computed)(() => page.props.blockers ?? []);
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
		const liSource = (0, vue_exports.computed)(() => doc.value.shape.tyre_index_source || null);
		function refresh() {
			router.reload({ only: [
				"blockers",
				"document",
				"rowsTotal",
				"vehicles",
				"entry",
				"conditions",
				"unresolved",
				"stamps",
				"flash"
			] });
		}
		(0, vue_exports.onMounted)(refresh);
		function cell(vehicleId, combinationId) {
			return cars.value.find((car) => car.vehicleId === vehicleId && car.combinationId === combinationId);
		}
		const isLastCell = (car) => cars.value.filter((other) => other.vehicleId === car.vehicleId).length === 1;
		const dropBody = (0, vue_exports.computed)(() => {
			const car = dropping.value;
			if (car === null) return "";
			return `${car.lines + car.unread + car.codes > 0 ? "Was in diesem Feld eingetragen ist, wird gelöscht. " : ""}${isLastCell(car) ? "Es ist das letzte Feld dieses Fahrzeugs: Das Fahrzeug fällt damit aus dieser Erfassung." : "Das Fahrzeug bleibt mit seinen anderen Feldern in der Erfassung."}`;
		});
		async function dropCell(car) {
			if (cellBusy.value) return;
			cellBusy.value = true;
			failure.value = "";
			try {
				await store.save("DELETE", `/fahrzeuge/${car.id}/zelle`);
				refresh();
			} catch (error) {
				failure.value = error instanceof Error ? error.message : "Das hat nicht geklappt.";
			} finally {
				dropping.value = null;
				cellBusy.value = false;
			}
		}
		function describedDone() {
			describing.value = null;
			(0, vue_exports.nextTick)(() => (document.getElementById("ef-open-h") ?? document.getElementById("ef-release-h"))?.focus());
		}
		const releaseBody = (0, vue_exports.computed)(() => {
			return `${rows.value === 0 ? "Der Shop übernimmt danach die Angaben dieses Grundgutachtens für seine Nachträge." : `${rows.value === 1 ? "Die Zeile gilt" : `Alle ${decimal(rows.value, 0)} Zeilen gelten`} danach sofort im Shop.`} Angaben, Codes und Zeilen lassen sich dann nicht mehr ändern – eine Korrektur geht über „Neue Fassung anlegen“, und die neue Fassung ersetzt dieses Gutachten, sobald sie freigegeben ist.`;
		});
		const gap = (0, vue_exports.computed)(() => {
			const count = empty.value.length;
			if (combinations.value.length > 1) return count === 1 ? "1 Feld der Übersicht ist noch leer." : `${decimal(count, 0)} Felder der Übersicht sind noch leer.`;
			return count === 1 ? "1 Fahrzeug hat noch keine Reifen." : `${decimal(count, 0)} Fahrzeuge haben noch keine Reifen.`;
		});
		const releaseError = (0, vue_exports.computed)(() => (page.props.errors ?? {}).release ?? "");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				class: "ef-step",
				"aria-labelledby": "ef-release-h"
			}, _attrs))} data-v-9ddb9666><h2 id="ef-release-h" class="adm-section__title" tabindex="-1" data-v-9ddb9666>Prüfen und freigeben</h2><p class="adm-note" data-v-9ddb9666>Alle Fahrzeuge auf einen Blick. Lücken sind markiert; ein Klick führt zurück zum Eintragen.</p>`);
			if (empty.value.length) {
				_push(`<p class="ef-gap" data-v-9ddb9666>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "warning",
					size: 20
				}, null, _parent));
				_push(` ${(0, server_renderer_exports.ssrInterpolate)(gap.value)} <button class="ef-link" type="button" data-v-9ddb9666>Jetzt eintragen</button></p>`);
			} else _push(`<!---->`);
			if (cars.value.length) {
				_push(`<div class="adm-panel ef-matrix" data-v-9ddb9666><table class="adm-table" data-v-9ddb9666><caption class="visually-hidden" data-v-9ddb9666>Fahrzeuge und ihre Reifen</caption><thead data-v-9ddb9666><tr data-v-9ddb9666><th scope="col" data-v-9ddb9666>Fahrzeug</th><th scope="col" data-v-9ddb9666>Feld K</th><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(combinations.value, (combination) => {
					_push(`<th scope="col" data-v-9ddb9666><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(combination.label.split(" · "), (part) => {
						_push(`<span class="ef-matrix__head" data-v-9ddb9666>${(0, server_renderer_exports.ssrInterpolate)(part)}</span>`);
					});
					_push(`<!--]--></th>`);
				});
				_push(`<!--]--></tr></thead><tbody data-v-9ddb9666><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(vehicles.value, (car) => {
					_push(`<tr data-v-9ddb9666><td data-label="Fahrzeug" data-v-9ddb9666><span class="adm-table__key" data-v-9ddb9666>${(0, server_renderer_exports.ssrInterpolate)(car.label)}</span>`);
					if (car.finish || car.axle !== "ALL") _push(`<span class="adm-tag adm-tag--neutral ef-matrix__scope" data-v-9ddb9666>${(0, server_renderer_exports.ssrInterpolate)([car.finish ? `nur ${car.finish}` : "", car.axle === "FRONT" ? "nur Vorderachse" : car.axle === "REAR" ? "nur Hinterachse" : ""].filter(Boolean).join(" · "))}</span>`);
					else _push(`<!---->`);
					_push(`</td><td data-label="Feld K" data-v-9ddb9666>${(0, server_renderer_exports.ssrInterpolate)(car.k ?? "–")}</td><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(combinations.value, (combination) => {
						_push(`<td${(0, server_renderer_exports.ssrRenderAttr)("data-label", combination.label)} data-v-9ddb9666>`);
						if (cell(car.vehicleId, combination.id)) {
							_push(`<div class="ef-matrix__cell" data-v-9ddb9666><button class="${(0, server_renderer_exports.ssrRenderClass)([{ "ef-cellbtn--empty": !cell(car.vehicleId, combination.id).done || cell(car.vehicleId, combination.id).unread > 0 || cell(car.vehicleId, combination.id).conflict }, "ef-cellbtn"])}" type="button" data-v-9ddb9666>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(carSummary)(cell(car.vehicleId, combination.id)))} `);
							if (cell(car.vehicleId, combination.id).conflict) _push(`<span class="adm-tag adm-tag--warn" data-v-9ddb9666>Prüfen</span>`);
							else _push(`<!---->`);
							if (cell(car.vehicleId, combination.id).copiedFrom) _push(`<span class="adm-tag adm-tag--neutral" data-v-9ddb9666>kopiert von ${(0, server_renderer_exports.ssrInterpolate)(cell(car.vehicleId, combination.id).copiedFrom)}</span>`);
							else _push(`<!---->`);
							_push(`</button>`);
							if ((0, vue_exports.unref)(state).editable && combinations.value.length > 1 && !cell(car.vehicleId, combination.id).done) _push(`<button class="ef-link ef-matrix__drop" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Gilt nicht für dieses Fahrzeug: ${combination.label}`)} data-v-9ddb9666>Gilt nicht</button>`);
							else _push(`<!---->`);
							_push(`</div>`);
						} else {
							_push(`<div class="ef-matrix__cell" data-v-9ddb9666><span class="quiet" data-v-9ddb9666>gilt nicht</span>`);
							if ((0, vue_exports.unref)(state).editable) _push(`<button class="ef-link ef-matrix__drop" type="button" data-v-9ddb9666>Wieder aufnehmen</button>`);
							else _push(`<!---->`);
							_push(`</div>`);
						}
						_push(`</td>`);
					});
					_push(`<!--]--></tr>`);
				});
				_push(`<!--]--></tbody></table></div>`);
			} else _push(`<!---->`);
			if (failure.value) _push(`<p class="adm-alert" role="alert" data-v-9ddb9666>${(0, server_renderer_exports.ssrInterpolate)(failure.value)}</p>`);
			else _push(`<!---->`);
			if (blockers.value.length) {
				_push(`<div id="ef-open-points" class="ef-blockers" role="status" tabindex="-1" data-dialog-fallback data-v-9ddb9666><p class="ef-blockers__title" data-v-9ddb9666>Noch offen vor der Freigabe</p><ul class="ef-blockers__list" data-v-9ddb9666><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(blockers.value, (line) => {
					_push(`<li data-v-9ddb9666>${(0, server_renderer_exports.ssrInterpolate)(line)}</li>`);
				});
				_push(`<!--]--></ul>`);
				if ((0, vue_exports.unref)(state).editable && blockers.value.some((line) => line.includes("Auflagenverzeichnis"))) _push(`<button class="ef-link" type="button" data-v-9ddb9666>Auflagenverzeichnis öffnen</button>`);
				else _push(`<!---->`);
				_push(`</div>`);
			} else _push(`<!---->`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
				open: dropOpen.value,
				"onUpdate:open": ($event) => dropOpen.value = $event,
				title: "Gilt nicht für dieses Fahrzeug?",
				body: dropBody.value,
				"confirm-label": "Feld entfernen",
				busy: cellBusy.value,
				onConfirm: ($event) => dropping.value && dropCell(dropping.value)
			}, null, _parent));
			_push(`<div class="ef-checks" data-v-9ddb9666>`);
			if ((0, vue_exports.unref)(state).entry.conflicts.length) {
				_push(`<section class="ef-check" aria-labelledby="ef-conflict-h" data-v-9ddb9666><h3 id="ef-conflict-h" class="ef-check__title" data-v-9ddb9666>Gleiche Betriebserlaubnis, andere Reifenkombinationen</h3><p class="adm-note" data-v-9ddb9666>Der Shop speichert Reifenkombinationen je Betriebserlaubnis (Feld K). Ein Fahrzeug bekäme hier eine Reifenkombination, die bei ihm nicht eingetragen ist. Trag sie bei allen betroffenen Fahrzeugen ein oder bei keinem: „Kopieren nach …“ gleicht sie an.</p><ul class="ef-check__list" data-v-9ddb9666><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(state).entry.conflicts, (conflict) => {
					_push(`<li class="ef-check__item" data-v-9ddb9666><span data-v-9ddb9666><strong data-v-9ddb9666>${(0, server_renderer_exports.ssrInterpolate)(conflict.car)}</strong>`);
					if (conflict.several) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(conflict.combination)}<!--]-->`);
					else _push(`<!---->`);
					_push(` · Feld K ${(0, server_renderer_exports.ssrInterpolate)(conflict.k)} · ${(0, server_renderer_exports.ssrInterpolate)(conflict.pair)}`);
					if (conflict.others.length) _push(`<!--[-->, eingetragen bei ${(0, server_renderer_exports.ssrInterpolate)(conflict.others.join(", "))}<!--]-->`);
					else _push(`<!---->`);
					_push(`</span><button class="btn btn--secondary" type="button" data-v-9ddb9666>Zum Fahrzeug</button></li>`);
				});
				_push(`<!--]--></ul></section>`);
			} else _push(`<!---->`);
			if (unreachable.value.length) {
				_push(`<section class="ef-check" aria-labelledby="ef-reach-h" data-v-9ddb9666><h3 id="ef-reach-h" class="ef-check__title" data-v-9ddb9666>Fahrzeuge, denen der Shop keine Reifenkombination zuordnen kann</h3><p class="adm-note" data-v-9ddb9666>Der Shop ordnet Reifenkombinationen über die EG-Nummer in Feld K zu. Bei diesen Fahrzeugen ist keine hinterlegt, oder sie passt zu keinem Eintrag. Ihre Felge lässt sich freigeben, ihre Reifen bleiben im Shop „Noch nicht bestätigt“.</p><ul class="ef-check__list" data-v-9ddb9666><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(unreachable.value, (car) => {
					_push(`<li class="ef-check__item" data-v-9ddb9666><span data-v-9ddb9666><strong data-v-9ddb9666>${(0, server_renderer_exports.ssrInterpolate)(car.car)}</strong> · Feld K ${(0, server_renderer_exports.ssrInterpolate)(car.k ?? "nicht hinterlegt")}</span></li>`);
				});
				_push(`<!--]--></ul></section>`);
			} else _push(`<!---->`);
			if ((0, vue_exports.unref)(state).entry.unread.length) {
				_push(`<section class="ef-check" aria-labelledby="ef-unread-h" data-v-9ddb9666><h3 id="ef-unread-h" class="ef-check__title" data-v-9ddb9666>Nicht lesbare Reifen</h3><ul class="ef-check__list" data-v-9ddb9666><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(state).entry.unread, (line) => {
					_push(`<li class="ef-check__item" data-v-9ddb9666><span data-v-9ddb9666><strong data-v-9ddb9666>${(0, server_renderer_exports.ssrInterpolate)(line.car)}</strong> · „${(0, server_renderer_exports.ssrInterpolate)(line.text)}“</span><button class="btn btn--secondary" type="button" data-v-9ddb9666>Zum Fahrzeug</button></li>`);
				});
				_push(`<!--]--></ul></section>`);
			} else _push(`<!---->`);
			if (unproven.value.length) {
				_push(`<section class="ef-check" aria-labelledby="ef-prov-h" data-v-9ddb9666><h3 id="ef-prov-h" class="ef-check__title" data-v-9ddb9666>Fahrzeuge ohne belegte Herkunft</h3><p class="adm-note" data-v-9ddb9666>Zur Freigabe müssen die Daten jedes Fahrzeugs aus einem Import oder aus einem Gutachten stammen oder von Hand geprüft sein.</p><ul class="ef-check__list" data-v-9ddb9666><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(unproven.value, (car) => {
					_push(`<li class="ef-check__item" data-v-9ddb9666><span data-v-9ddb9666><strong data-v-9ddb9666>${(0, server_renderer_exports.ssrInterpolate)(car.label)}</strong>`);
					if (car.sourceLabel) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(car.sourceLabel)}<!--]-->`);
					else _push(`<!---->`);
					_push(`</span><button class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value === car.id) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value === car.id ? "true" : void 0)} data-v-9ddb9666>Daten geprüft</button></li>`);
				});
				_push(`<!--]--></ul></section>`);
			} else _push(`<!---->`);
			if (codes.value.length) {
				_push(`<section class="ef-check" aria-labelledby="ef-open-h" data-v-9ddb9666><h3 id="ef-open-h" class="ef-check__title" tabindex="-1" data-v-9ddb9666>Codes ohne Beschreibung</h3><p class="adm-note" data-v-9ddb9666>Der Shop zeigt eine Auflage als ganzen Satz. Ohne Beschreibung hätte er keinen.</p><ul class="ef-check__list" data-v-9ddb9666><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(codes.value, (code) => {
					_push(`<li class="ef-check__item" data-v-9ddb9666><span class="ef-code ef-code--open" data-v-9ddb9666>${(0, server_renderer_exports.ssrInterpolate)(code)}</span>`);
					if (describing.value !== code) _push(`<button class="btn btn--secondary" type="button" data-v-9ddb9666>${(0, server_renderer_exports.ssrInterpolate)(code)} beschreiben</button>`);
					else {
						_push(`<div class="ef-check__form" data-v-9ddb9666>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(CodeDefine_default, {
							code,
							"id-prefix": `ef-release-${code}`,
							onDone: describedDone,
							onCancel: ($event) => describing.value = null
						}, null, _parent));
						_push(`</div>`);
					}
					_push(`</li>`);
				});
				_push(`<!--]--></ul></section>`);
			} else _push(`<!---->`);
			_push(`<fieldset class="ef-fieldset ef-check" data-v-9ddb9666><legend class="ef-check__title" data-v-9ddb9666>Wie gibt das Gutachten Lastindex und Geschwindigkeitssymbol an?</legend><!--[-->`);
			(0, server_renderer_exports.ssrRenderList)(LI_SOURCES, (option) => {
				_push(`<label class="check ef-check__radio" data-v-9ddb9666><input type="radio" name="ef-li-release"${(0, server_renderer_exports.ssrRenderAttr)("value", option.value)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(liSource.value === option.value) ? " checked" : ""} data-v-9ddb9666> ${(0, server_renderer_exports.ssrInterpolate)(option.label)} `);
				if ((0, vue_exports.unref)(state).entry.suggestion === option.value) _push(`<span class="adm-tag adm-tag--neutral" data-v-9ddb9666>Vorschlag</span>`);
				else _push(`<!---->`);
				_push(`</label>`);
			});
			_push(`<!--]-->`);
			if ((0, vue_exports.unref)(state).entry.suggestion) _push(`<p class="form-field__help" data-v-9ddb9666>Der Vorschlag kommt aus den eingetragenen Reifen. Entscheidend ist, was im Gutachten steht.</p>`);
			else _push(`<!---->`);
			_push(`</fieldset></div>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(PreviewSection_default, null, null, _parent));
			if (releaseError.value) _push(`<p class="adm-alert" role="alert" data-v-9ddb9666>${(0, server_renderer_exports.ssrInterpolate)(releaseError.value)}</p>`);
			else _push(`<!---->`);
			_push(`<div class="ef-actions" data-v-9ddb9666><button class="btn btn--secondary ef-actions__left" type="button" data-v-9ddb9666>Zurück</button>`);
			if (blockers.value.length) _push(`<a class="ef-link ef-actions__why" href="#ef-open-points" data-v-9ddb9666>${(0, server_renderer_exports.ssrInterpolate)(blockers.value.length === 1 ? "1 Punkt offen" : `${(0, vue_exports.unref)(decimal)(blockers.value.length, 0)} Punkte offen`)}</a>`);
			else _push(`<!---->`);
			if ((0, vue_exports.unref)(page).props.can.release) {
				_push(`<button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(blockers.value.length > 0) ? " disabled" : ""} data-v-9ddb9666>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
					name: "publish",
					size: 20
				}, null, _parent));
				_push(` Freigeben </button>`);
			} else _push(`<!---->`);
			_push(`</div>`);
			if ((0, vue_exports.unref)(page).props.can.release) _push((0, server_renderer_exports.ssrRenderComponent)(ReleaseDialog_default, {
				open: releaseOpen.value,
				"onUpdate:open": ($event) => releaseOpen.value = $event,
				mode: "release",
				document: doc.value,
				rows: rows.value,
				note: releaseBody.value
			}, null, _parent));
			else _push(`<!---->`);
			if ((0, vue_exports.unref)(state).editable) _push((0, server_renderer_exports.ssrRenderComponent)(LegendDialog_default, {
				open: legendOpen.value,
				"onUpdate:open": ($event) => legendOpen.value = $event
			}, null, _parent));
			else _push(`<!---->`);
			_push(`</section>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Erfassung/StepRelease.vue
var StepRelease_exports = /* @__PURE__ */ __exportAll({ default: () => StepRelease_default });
var _sfc_setup = StepRelease_vue_vue_type_script_setup_true_lang_default.setup;
StepRelease_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Erfassung/StepRelease.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var StepRelease_default = /*#__PURE__*/ _plugin_vue_export_helper_default(StepRelease_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-9ddb9666"]]);
//#endregion
export { StepRelease_exports as n, StepRelease_default as t };
