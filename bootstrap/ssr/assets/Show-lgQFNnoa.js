import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BA7BbMo6.js";
import { d as vue_exports, l as router, s as usePage } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-D0z-a8p_.js";
import { t as AdminConfirm_default } from "./AdminConfirm-sC9Lzvnq.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { t as Auflagenverzeichnis_default } from "./Auflagenverzeichnis-pWYWRqN5.js";
import { t as DeratingTable_default } from "./DeratingTable-C_7GKnVA.js";
import { t as DocumentExtras_default } from "./DocumentExtras-BVFXNgqn.js";
import { n as deratingShown, t as deratingAbsent } from "./derating-HgTblNFT.js";
import { t as ReleaseDialog_default } from "./ReleaseDialog-CVzCM37o.js";
import { t as PreviewSection_default } from "./PreviewSection-DdlGQVzf.js";
//#region resources/js/Pages/Admin/Gutachten/Show.vue?vue&type=script&setup=true&lang.ts
var Show_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Show",
	__ssrInlineRender: true,
	props: {
		stamps: {},
		document: {},
		rowsTotal: {},
		vehicles: {},
		blockers: {},
		preview: {},
		previewVehicle: {},
		conditions: {},
		choices: {},
		unresolved: {},
		kinds: {},
		replaceable: {},
		supplementable: {},
		fasteners: {},
		notices: {},
		reworks: {},
		derating: {},
		openConflicts: {},
		can: {},
		revisionDraft: {},
		levels: {},
		levelFloorSentence: {},
		readView: {},
		carryFailed: {}
	},
	setup(__props) {
		/**
		* Gutachten › one document, to read: a released paper, or a draft for who may only look (a draft someone may edit opens the five
		* steps, Erfassung.vue). Its facts and PDF, its cars with their tyres — codes as short tags, the text on hover and in the
		* Auflagenverzeichnis, never the wall of repeated text the rows once printed (screen 11) — the preview of what the shop says, and
		* the way back: „Neue Fassung anlegen“.
		*/
		const props = __props;
		const page = usePage();
		const draft = (0, vue_exports.computed)(() => props.document.status === "draft");
		/** Every row of the document, across colours: what a release brings into the shop. */
		const rowsTotal = (0, vue_exports.computed)(() => props.rowsTotal ?? 0);
		const context = (0, vue_exports.computed)(() => {
			const cars = props.readView.length;
			const said = cars === 1 ? "1 Fahrzeug" : `${decimal(cars, 0)} Fahrzeuge`;
			return `${props.document.statusLabel} · ${said} · Fassung ${props.document.revision}`;
		});
		function pageHref(n) {
			return props.document.pdfUrl && n !== null ? `${props.document.pdfUrl}#page=${n}` : null;
		}
		function codeHint(code) {
			const entry = props.conditions.find((c) => c.code === code);
			return entry ? `${code} · ${entry.kindLabel}\n${entry.text}` : `${code}: im Auflagenverzeichnis nicht hinterlegt`;
		}
		function lineText(line) {
			if (line.front === "" || line.rear === "") return line.front === "" ? `nur hinten ${line.rear}` : `nur vorne ${line.front}`;
			return line.front === line.rear ? line.front : `vorne ${line.front} · hinten ${line.rear}`;
		}
		const releaseError = (0, vue_exports.computed)(() => (page.props.errors ?? {}).release ?? "");
		const deratingShown$1 = (0, vue_exports.computed)(() => deratingShown(props.document.shape.tyre_index_source, props.derating.rows.length));
		const deratingAbsent$1 = (0, vue_exports.computed)(() => deratingAbsent(props.document.shape.tyre_index_source, false));
		const more = (0, vue_exports.computed)(() => props.document.pdfUrl ? [{
			label: "PDF öffnen",
			href: props.document.pdfUrl,
			external: true,
			icon: "documents"
		}] : []);
		const releaseOpen = (0, vue_exports.ref)(false);
		const answerOpen = (0, vue_exports.ref)(false);
		const releaseNote = (0, vue_exports.computed)(() => {
			if (rowsTotal.value === 0) return "Mit der Freigabe übernimmt der Shop die Angaben dieses Grundgutachtens für seine Nachträge. Eigene Zeilen hat es nicht.";
			return rowsTotal.value === 1 ? "Mit der Freigabe gilt die Zeile sofort im Shop. Prüf sie vorher in der Vorschau unten." : `Mit der Freigabe gelten alle ${decimal(rowsTotal.value, 0)} Zeilen auf einmal im Shop. Prüf sie vorher in der Vorschau unten.`;
		});
		const releaseBody = (0, vue_exports.computed)(() => {
			return `${rowsTotal.value === 0 ? "Der Shop übernimmt danach die Angaben dieses Grundgutachtens für seine Nachträge." : `${rowsTotal.value === 1 ? "Die Zeile gilt" : `Alle ${decimal(rowsTotal.value, 0)} Zeilen gelten`} danach sofort im Shop.`} Angaben, Codes und Zeilen lassen sich dann nicht mehr ändern – eine Korrektur geht über „Neue Fassung anlegen“, und die neue Fassung ersetzt dieses Gutachten, sobald sie freigegeben ist.`;
		});
		const reviseOpen = (0, vue_exports.ref)(false);
		const reviseBusy = (0, vue_exports.ref)(false);
		function revise() {
			reviseBusy.value = true;
			router.post(`/admin/gutachten/${props.document.id}/neue-fassung`, {}, { onFinish: () => {
				reviseBusy.value = false;
				reviseOpen.value = false;
			} });
		}
		function focusState() {
			(0, vue_exports.nextTick)(() => document.getElementById("gs-state-h")?.focus());
		}
		(0, vue_exports.watch)(() => props.document.status, (now, was) => {
			if (now === "published" && was === "draft") focusState();
		}, { flush: "post" });
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: __props.document.label,
				context: context.value,
				more: more.value,
				"read-only": !__props.can.edit && draft.value
			}, _attrs), (0, vue_exports.createSlots)({
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.carryFailed) _push(`<p class="adm-alert" role="alert" data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.carryFailed)}</p>`);
						else _push(`<!---->`);
						_push(`<section class="${(0, server_renderer_exports.ssrRenderClass)([{ "gs-state--blocked": draft.value && __props.blockers.length }, "gs-state"])}" aria-labelledby="gs-state-h" data-v-2f59b6ea${_scopeId}><h2 id="gs-state-h" class="gs-state__title" tabindex="-1" data-v-2f59b6ea${_scopeId}>`);
						if (draft.value && __props.blockers.length) _push(`<!--[-->Noch nicht freigebbar<!--]-->`);
						else if (draft.value) _push(`<!--[-->Kann freigegeben werden<!--]-->`);
						else {
							_push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(__props.document.statusLabel)}`);
							if (__props.document.status === "published" && __props.document.validFrom) _push(`<!--[--> seit ${(0, server_renderer_exports.ssrInterpolate)(__props.document.validFrom)}<!--]-->`);
							else if (__props.document.status !== "published" && __props.document.validTo) _push(`<!--[--> seit ${(0, server_renderer_exports.ssrInterpolate)(__props.document.validTo)}<!--]-->`);
							else _push(`<!---->`);
							_push(`<!--]-->`);
						}
						_push(`</h2>`);
						if (draft.value && __props.blockers.length) {
							_push(`<ul class="gs-state__list" data-v-2f59b6ea${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.blockers, (line) => {
								_push(`<li data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line)}</li>`);
							});
							_push(`<!--]--></ul>`);
						} else if (draft.value) _push(`<p class="adm-note" data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(releaseNote.value)}</p>`);
						else if (__props.document.status === "withdrawn") _push(`<p class="adm-note" data-v-2f59b6ea${_scopeId}>Dieses Dokument wurde zurückgezogen. Seine Zeilen sind nicht mehr im Shop; Bestellungen darauf bleiben erklärbar.</p>`);
						else if (__props.document.status === "superseded") _push(`<p class="adm-note" data-v-2f59b6ea${_scopeId}>Eine neuere Fassung hat dieses Dokument ersetzt. Seine Zeilen sind nicht mehr im Shop; Bestellungen darauf bleiben erklärbar.</p>`);
						else if (__props.revisionDraft) _push(`<p class="adm-note" data-v-2f59b6ea${_scopeId}>Angaben, Codes und Zeilen eines freigegebenen Gutachtens lassen sich nicht mehr ändern. Fassung ${(0, server_renderer_exports.ssrInterpolate)(__props.revisionDraft.revision)} ist schon als Entwurf angelegt; sobald sie freigegeben ist, ersetzt sie diese Fassung.</p>`);
						else _push(`<p class="adm-note" data-v-2f59b6ea${_scopeId}>Angaben, Codes und Zeilen eines freigegebenen Gutachtens lassen sich nicht mehr ändern. Änderungen gehen über eine neue Fassung: Sie bringt alle Zeilen und Codes mit; sobald sie freigegeben ist, ersetzt sie diese Fassung.</p>`);
						if (__props.document.status === "published") {
							_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([{ "gs-complete--open": !__props.document.completeness }, "gs-complete"])}" data-v-2f59b6ea${_scopeId}><p class="adm-note" data-v-2f59b6ea${_scopeId}><strong data-v-2f59b6ea${_scopeId}>Erfasst:</strong> ${(0, server_renderer_exports.ssrInterpolate)(__props.document.completenessLabel)}`);
							if (__props.document.completenessBy || __props.document.completenessAt) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)([__props.document.completenessBy, __props.document.completenessAt].filter(Boolean).join(", "))}<!--]-->`);
							else _push(`<!---->`);
							_push(`</p>`);
							if (__props.can.answer) _push(`<button class="btn btn--secondary" type="button" data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.completeness ? "Antwort ändern" : "Jetzt beantworten")}</button>`);
							else _push(`<!---->`);
							_push(`</div>`);
						} else _push(`<!---->`);
						if (__props.openConflicts) _push(`<p class="adm-note" data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.openConflicts === 1 ? "Eine Zeile widerspricht" : `${(0, vue_exports.unref)(decimal)(__props.openConflicts, 0)} Zeilen widersprechen`)} einem anderen Gutachten. Bis unter <a href="/admin/konflikte" data-v-2f59b6ea${_scopeId}>Konflikte</a> entschieden ist, sagt der Shop dort „Noch nicht bestätigt“. </p>`);
						else _push(`<!---->`);
						if (releaseError.value) _push(`<p class="adm-alert" role="alert" data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(releaseError.value)}</p>`);
						else _push(`<!---->`);
						_push(`</section><section class="adm-section" aria-labelledby="gs-facts-h" data-v-2f59b6ea${_scopeId}><div class="adm-section__head" data-v-2f59b6ea${_scopeId}><h2 id="gs-facts-h" class="adm-section__title" data-v-2f59b6ea${_scopeId}>Angaben</h2></div><dl class="adm-facts gs-facts" data-v-2f59b6ea${_scopeId}><div class="adm-facts__row" data-v-2f59b6ea${_scopeId}><dt data-v-2f59b6ea${_scopeId}>Art</dt><dd data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.kindLabel)}`);
						if (__props.document.demo) _push(`<span class="adm-tag adm-tag--neutral adm-demo" data-v-2f59b6ea${_scopeId}>Demodaten</span>`);
						else _push(`<!---->`);
						_push(`</dd></div>`);
						if (__props.document.kbaNumber) _push(`<div class="adm-facts__row" data-v-2f59b6ea${_scopeId}><dt data-v-2f59b6ea${_scopeId}>KBA-Nummer</dt><dd data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.kbaNumber)}</dd></div>`);
						else _push(`<!---->`);
						if (__props.document.reportNumber) _push(`<div class="adm-facts__row" data-v-2f59b6ea${_scopeId}><dt data-v-2f59b6ea${_scopeId}>Gutachten-Nummer</dt><dd data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.reportNumber)}</dd></div>`);
						else _push(`<!---->`);
						if (__props.document.approvalMark) _push(`<div class="adm-facts__row" data-v-2f59b6ea${_scopeId}><dt data-v-2f59b6ea${_scopeId}>Genehmigungszeichen</dt><dd data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.approvalMark)}</dd></div>`);
						else _push(`<!---->`);
						_push(`<div class="adm-facts__row" data-v-2f59b6ea${_scopeId}><dt data-v-2f59b6ea${_scopeId}>Aussteller</dt><dd data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.issuer || "–")}</dd></div><div class="adm-facts__row" data-v-2f59b6ea${_scopeId}><dt data-v-2f59b6ea${_scopeId}>Ausgestellt am</dt><dd data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.issuedOnLabel ?? "–")}</dd></div><div class="adm-facts__row" data-v-2f59b6ea${_scopeId}><dt data-v-2f59b6ea${_scopeId}>Seiten</dt><dd data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.pageCount ?? "–")}</dd></div><div class="adm-facts__row" data-v-2f59b6ea${_scopeId}><dt data-v-2f59b6ea${_scopeId}>Fassung</dt><dd data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.revision)}`);
						if (__props.document.supersedesLabel) _push(`<!--[--> · ersetzt ${(0, server_renderer_exports.ssrInterpolate)(__props.document.supersedesLabel)}<!--]-->`);
						else _push(`<!---->`);
						_push(`</dd></div>`);
						if (__props.document.supplementTo) {
							_push(`<div class="adm-facts__row" data-v-2f59b6ea${_scopeId}><dt data-v-2f59b6ea${_scopeId}>Nachtrag zu</dt><dd data-v-2f59b6ea${_scopeId}>`);
							if (__props.document.supplementTo.href) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", __props.document.supplementTo.href)} data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.supplementTo.label)}</a>`);
							else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(__props.document.supplementTo.label)} – liegt uns nicht vor<!--]-->`);
							if (__props.document.baseMissing) _push(`<span class="gs-sub" data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.baseMissing)}</span>`);
							else _push(`<!---->`);
							_push(`</dd></div>`);
						} else _push(`<!---->`);
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.document.header, (entry) => {
							_push(`<div class="adm-facts__row" data-v-2f59b6ea${_scopeId}><dt data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.label)}</dt><dd data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(entry.value)}</dd></div>`);
						});
						_push(`<!--]-->`);
						if (__props.document.scopeIncomplete) _push(`<div class="adm-facts__row" data-v-2f59b6ea${_scopeId}><dt data-v-2f59b6ea${_scopeId}>Verwendungsbereich</dt><dd data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.document.scopeIncomplete)}</dd></div>`);
						else _push(`<!---->`);
						_push(`<div class="adm-facts__row" data-v-2f59b6ea${_scopeId}><dt data-v-2f59b6ea${_scopeId}>PDF</dt><dd data-v-2f59b6ea${_scopeId}>`);
						if (__props.document.pdfUrl) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", __props.document.pdfUrl)} target="_blank" rel="noopener" data-v-2f59b6ea${_scopeId}>PDF öffnen</a>`);
						else if (__props.document.pdfMissing) _push(`<!--[-->Die Datei fehlt im Speicher. Lad das PDF über „Ändern“ neu hoch.<!--]-->`);
						else _push(`<!--[-->Kein PDF hinterlegt<!--]-->`);
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.document.samePdf ?? [], (twin) => {
							_push(`<span class="gs-sub gs-same-pdf" data-v-2f59b6ea${_scopeId}> Dieselbe Datei liegt auch bei <a${(0, server_renderer_exports.ssrRenderAttr)("href", twin.href)} data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(twin.label)}</a> (${(0, server_renderer_exports.ssrInterpolate)(twin.status)}`);
							if (twin.demo) _push(`<!--[-->, Demodaten<!--]-->`);
							else _push(`<!---->`);
							_push(`). </span>`);
						});
						_push(`<!--]--></dd></div></dl></section><section class="adm-section" aria-labelledby="gs-conditions-h" data-v-2f59b6ea${_scopeId}><div class="adm-section__head" data-v-2f59b6ea${_scopeId}><h2 id="gs-conditions-h" class="adm-section__title" data-v-2f59b6ea${_scopeId}>Auflagenverzeichnis</h2></div><p class="adm-note gs-lead" data-v-2f59b6ea${_scopeId}>Die Zeilen nennen nur Codes. Was ein Code bedeutet, steht hier – so, wie dieses Gutachten ihn druckt.</p>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Auflagenverzeichnis_default, {
							"document-id": __props.document.id,
							conditions: __props.conditions,
							choices: __props.choices,
							unresolved: __props.unresolved,
							editable: false,
							"page-count": __props.document.pageCount,
							levels: __props.levels,
							"levels-editable": __props.can.levels === true,
							"level-floor-sentence": __props.levelFloorSentence
						}, null, _parent, _scopeId));
						_push(`</section><section class="adm-section" aria-labelledby="gs-extras-h" data-v-2f59b6ea${_scopeId}><div class="adm-section__head" data-v-2f59b6ea${_scopeId}><h2 id="gs-extras-h" class="adm-section__title" data-v-2f59b6ea${_scopeId}>Befestigung und Hinweise</h2></div>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(DocumentExtras_default, {
							"document-id": __props.document.id,
							fasteners: __props.fasteners,
							notices: __props.notices,
							reworks: __props.reworks,
							conditions: __props.conditions,
							editable: false,
							"page-count": __props.document.pageCount
						}, null, _parent, _scopeId));
						_push(`</section>`);
						if (deratingShown$1.value) {
							_push(`<section class="adm-section" aria-labelledby="gs-derating-h" data-v-2f59b6ea${_scopeId}><div class="adm-section__head" data-v-2f59b6ea${_scopeId}><h2 id="gs-derating-h" class="adm-section__title" data-v-2f59b6ea${_scopeId}>Tragfähigkeit bei hoher Geschwindigkeit</h2>`);
							if (__props.derating.seededFrom) _push(`<span class="adm-tag adm-tag--neutral" data-v-2f59b6ea${_scopeId}>Demodaten</span>`);
							else _push(`<!---->`);
							_push(`</div>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(DeratingTable_default, {
								"document-id": __props.document.id,
								stamp: __props.stamps.derating,
								derating: __props.derating,
								editable: false,
								"page-count": __props.document.pageCount,
								required: false
							}, null, _parent, _scopeId));
							_push(`</section>`);
						} else _push(`<details class="adm-section gs-fold" data-v-2f59b6ea${_scopeId}><summary class="gs-fold__summary" data-v-2f59b6ea${_scopeId}><h2 id="gs-derating-h" class="adm-section__title" data-v-2f59b6ea${_scopeId}>Tragfähigkeit bei hoher Geschwindigkeit</h2><span class="gs-fold__state" data-v-2f59b6ea${_scopeId}>Keine Tabelle hinterlegt</span></summary><p class="adm-note" data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(deratingAbsent$1.value)}</p></details>`);
						_push(`<section class="adm-section" aria-labelledby="gs-rows-h" data-v-2f59b6ea${_scopeId}><div class="adm-section__head" data-v-2f59b6ea${_scopeId}><h2 id="gs-rows-h" class="adm-section__title" tabindex="-1" data-v-2f59b6ea${_scopeId}>Fahrzeuge und Reifen</h2></div>`);
						if (__props.readView.length === 0) _push(`<p class="adm-note" data-v-2f59b6ea${_scopeId}>Noch kein Fahrzeug.</p>`);
						else {
							_push(`<ul class="gs-cars" data-v-2f59b6ea${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.readView, (car) => {
								_push(`<li class="gs-car" data-v-2f59b6ea${_scopeId}><div class="gs-car__head" data-v-2f59b6ea${_scopeId}><h3 class="gs-car__name" data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(car.car)}</h3>`);
								if (car.finish) _push(`<span class="adm-tag adm-tag--neutral" data-v-2f59b6ea${_scopeId}>nur ${(0, server_renderer_exports.ssrInterpolate)(car.finish)}</span>`);
								else _push(`<!---->`);
								if (car.axle !== "ALL") _push(`<span class="adm-tag adm-tag--neutral" data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(car.axle === "FRONT" ? "nur Vorderachse" : "nur Hinterachse")}</span>`);
								else _push(`<!---->`);
								if (pageHref(car.page)) _push(`<a class="gs-car__page"${(0, server_renderer_exports.ssrRenderAttr)("href", pageHref(car.page))} target="_blank" rel="noopener" data-v-2f59b6ea${_scopeId}>S. ${(0, server_renderer_exports.ssrInterpolate)(car.page)}</a>`);
								else if (car.page) _push(`<span class="gs-car__page" data-v-2f59b6ea${_scopeId}>S. ${(0, server_renderer_exports.ssrInterpolate)(car.page)}</span>`);
								else _push(`<!---->`);
								_push(`</div><p class="gs-sub" data-v-2f59b6ea${_scopeId}>`);
								if (car.k) _push(`<!--[-->Feld K ${(0, server_renderer_exports.ssrInterpolate)(car.k)}<!--]-->`);
								else _push(`<!---->`);
								if (car.k && car.wheel) _push(`<!--[--> · <!--]-->`);
								else _push(`<!---->`);
								if (car.wheel) _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(car.wheel)}<!--]-->`);
								else _push(`<!---->`);
								_push(`</p>`);
								if (car.lines.length === 0) _push(`<p class="gs-missing" data-v-2f59b6ea${_scopeId}>Keine Reifengröße – im Shop nicht bestellbar</p>`);
								else {
									_push(`<ul class="gs-lines" data-v-2f59b6ea${_scopeId}><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(car.lines, (line) => {
										_push(`<li class="gs-readline" data-v-2f59b6ea${_scopeId}><span class="gs-readline__tyres" data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(lineText(line))}`);
										if (line.kw) _push(`<!--[--> · ${(0, server_renderer_exports.ssrInterpolate)(line.kw)} kW<!--]-->`);
										else _push(`<!---->`);
										_push(`</span>`);
										if (line.codes.length) {
											_push(`<span class="gs-tags" translate="no" data-v-2f59b6ea${_scopeId}><!--[-->`);
											(0, server_renderer_exports.ssrRenderList)(line.codes, (code) => {
												_push(`<span class="gs-tag"${(0, server_renderer_exports.ssrRenderAttr)("title", codeHint(code))} data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(code)}</span>`);
											});
											_push(`<!--]--></span>`);
										} else _push(`<!---->`);
										_push(`</li>`);
									});
									_push(`<!--]--></ul>`);
								}
								if (car.codes.length) {
									_push(`<p class="gs-general" data-v-2f59b6ea${_scopeId}> Allgemeine Codes: <span class="gs-tags" translate="no" data-v-2f59b6ea${_scopeId}><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(car.codes, (code) => {
										_push(`<span class="gs-tag"${(0, server_renderer_exports.ssrRenderAttr)("title", codeHint(code))} data-v-2f59b6ea${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(code)}</span>`);
									});
									_push(`<!--]--></span></p>`);
								} else _push(`<!---->`);
								_push(`</li>`);
							});
							_push(`<!--]--></ul>`);
						}
						_push(`</section>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(PreviewSection_default, null, null, _parent, _scopeId));
						if (__props.can.release) _push((0, server_renderer_exports.ssrRenderComponent)(ReleaseDialog_default, {
							open: releaseOpen.value,
							"onUpdate:open": ($event) => releaseOpen.value = $event,
							mode: "release",
							document: __props.document,
							rows: rowsTotal.value,
							note: releaseBody.value,
							onDone: focusState
						}, null, _parent, _scopeId));
						else _push(`<!---->`);
						if (__props.can.answer) _push((0, server_renderer_exports.ssrRenderComponent)(ReleaseDialog_default, {
							open: answerOpen.value,
							"onUpdate:open": ($event) => answerOpen.value = $event,
							mode: "answer",
							document: __props.document,
							rows: rowsTotal.value
						}, null, _parent, _scopeId));
						else _push(`<!---->`);
						if (__props.can.revise) _push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: reviseOpen.value,
							"onUpdate:open": ($event) => reviseOpen.value = $event,
							title: "Neue Fassung anlegen?",
							body: "Die neue Fassung beginnt als Entwurf mit allen Angaben, Codes und Zeilen dieser Fassung. Im Shop gilt diese Fassung weiter, bis die neue freigegeben ist und sie ersetzt.",
							"confirm-label": "Neue Fassung anlegen",
							busy: reviseBusy.value,
							onConfirm: revise
						}, null, _parent, _scopeId));
						else _push(`<!---->`);
					} else return [
						__props.carryFailed ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-alert",
							role: "alert"
						}, (0, vue_exports.toDisplayString)(__props.carryFailed), 1)) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("section", {
							class: ["gs-state", { "gs-state--blocked": draft.value && __props.blockers.length }],
							"aria-labelledby": "gs-state-h"
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "gs-state-h",
								class: "gs-state__title",
								tabindex: "-1"
							}, [draft.value && __props.blockers.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("Noch nicht freigebbar")], 64)) : draft.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Kann freigegeben werden")], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.document.statusLabel), 1), __props.document.status === "published" && __props.document.validFrom ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" seit " + (0, vue_exports.toDisplayString)(__props.document.validFrom), 1)], 64)) : __props.document.status !== "published" && __props.document.validTo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)(" seit " + (0, vue_exports.toDisplayString)(__props.document.validTo), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)], 64))]),
							draft.value && __props.blockers.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ul", {
								key: 0,
								class: "gs-state__list"
							}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.blockers, (line) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: line }, (0, vue_exports.toDisplayString)(line), 1);
							}), 128))])) : draft.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 1,
								class: "adm-note"
							}, (0, vue_exports.toDisplayString)(releaseNote.value), 1)) : __props.document.status === "withdrawn" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 2,
								class: "adm-note"
							}, "Dieses Dokument wurde zurückgezogen. Seine Zeilen sind nicht mehr im Shop; Bestellungen darauf bleiben erklärbar.")) : __props.document.status === "superseded" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 3,
								class: "adm-note"
							}, "Eine neuere Fassung hat dieses Dokument ersetzt. Seine Zeilen sind nicht mehr im Shop; Bestellungen darauf bleiben erklärbar.")) : __props.revisionDraft ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 4,
								class: "adm-note"
							}, "Angaben, Codes und Zeilen eines freigegebenen Gutachtens lassen sich nicht mehr ändern. Fassung " + (0, vue_exports.toDisplayString)(__props.revisionDraft.revision) + " ist schon als Entwurf angelegt; sobald sie freigegeben ist, ersetzt sie diese Fassung.", 1)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 5,
								class: "adm-note"
							}, "Angaben, Codes und Zeilen eines freigegebenen Gutachtens lassen sich nicht mehr ändern. Änderungen gehen über eine neue Fassung: Sie bringt alle Zeilen und Codes mit; sobald sie freigegeben ist, ersetzt sie diese Fassung.")),
							__props.document.status === "published" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 6,
								class: ["gs-complete", { "gs-complete--open": !__props.document.completeness }]
							}, [(0, vue_exports.createVNode)("p", { class: "adm-note" }, [
								(0, vue_exports.createVNode)("strong", null, "Erfasst:"),
								(0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(__props.document.completenessLabel), 1),
								__props.document.completenessBy || __props.document.completenessAt ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)([__props.document.completenessBy, __props.document.completenessAt].filter(Boolean).join(", ")), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)
							]), __props.can.answer ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
								key: 0,
								class: "btn btn--secondary",
								type: "button",
								onClick: ($event) => answerOpen.value = true
							}, (0, vue_exports.toDisplayString)(__props.document.completeness ? "Antwort ändern" : "Jetzt beantworten"), 9, ["onClick"])) : (0, vue_exports.createCommentVNode)("", true)], 2)) : (0, vue_exports.createCommentVNode)("", true),
							__props.openConflicts ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 7,
								class: "adm-note"
							}, [
								(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.openConflicts === 1 ? "Eine Zeile widerspricht" : `${(0, vue_exports.unref)(decimal)(__props.openConflicts, 0)} Zeilen widersprechen`) + " einem anderen Gutachten. Bis unter ", 1),
								(0, vue_exports.createVNode)("a", { href: "/admin/konflikte" }, "Konflikte"),
								(0, vue_exports.createTextVNode)(" entschieden ist, sagt der Shop dort „Noch nicht bestätigt“. ")
							])) : (0, vue_exports.createCommentVNode)("", true),
							releaseError.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 8,
								class: "adm-alert",
								role: "alert"
							}, (0, vue_exports.toDisplayString)(releaseError.value), 1)) : (0, vue_exports.createCommentVNode)("", true)
						], 2),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "gs-facts-h"
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "gs-facts-h",
							class: "adm-section__title"
						}, "Angaben")]), (0, vue_exports.createVNode)("dl", { class: "adm-facts gs-facts" }, [
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Art"), (0, vue_exports.createVNode)("dd", null, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.document.kindLabel), 1), __props.document.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 0,
								class: "adm-tag adm-tag--neutral adm-demo"
							}, "Demodaten")) : (0, vue_exports.createCommentVNode)("", true)])]),
							__props.document.kbaNumber ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 0,
								class: "adm-facts__row"
							}, [(0, vue_exports.createVNode)("dt", null, "KBA-Nummer"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.document.kbaNumber), 1)])) : (0, vue_exports.createCommentVNode)("", true),
							__props.document.reportNumber ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 1,
								class: "adm-facts__row"
							}, [(0, vue_exports.createVNode)("dt", null, "Gutachten-Nummer"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.document.reportNumber), 1)])) : (0, vue_exports.createCommentVNode)("", true),
							__props.document.approvalMark ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 2,
								class: "adm-facts__row"
							}, [(0, vue_exports.createVNode)("dt", null, "Genehmigungszeichen"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.document.approvalMark), 1)])) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Aussteller"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.document.issuer || "–"), 1)]),
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Ausgestellt am"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.document.issuedOnLabel ?? "–"), 1)]),
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Seiten"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.document.pageCount ?? "–"), 1)]),
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "Fassung"), (0, vue_exports.createVNode)("dd", null, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.document.revision), 1), __props.document.supersedesLabel ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · ersetzt " + (0, vue_exports.toDisplayString)(__props.document.supersedesLabel), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)])]),
							__props.document.supplementTo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 3,
								class: "adm-facts__row"
							}, [(0, vue_exports.createVNode)("dt", null, "Nachtrag zu"), (0, vue_exports.createVNode)("dd", null, [__props.document.supplementTo.href ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("a", {
								key: 0,
								href: __props.document.supplementTo.href
							}, (0, vue_exports.toDisplayString)(__props.document.supplementTo.label), 9, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(__props.document.supplementTo.label) + " – liegt uns nicht vor", 1)], 64)), __props.document.baseMissing ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
								key: 2,
								class: "gs-sub"
							}, (0, vue_exports.toDisplayString)(__props.document.baseMissing), 1)) : (0, vue_exports.createCommentVNode)("", true)])])) : (0, vue_exports.createCommentVNode)("", true),
							((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.document.header, (entry) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: entry.label,
									class: "adm-facts__row"
								}, [(0, vue_exports.createVNode)("dt", null, (0, vue_exports.toDisplayString)(entry.label), 1), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(entry.value), 1)]);
							}), 128)),
							__props.document.scopeIncomplete ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 4,
								class: "adm-facts__row"
							}, [(0, vue_exports.createVNode)("dt", null, "Verwendungsbereich"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(__props.document.scopeIncomplete), 1)])) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("div", { class: "adm-facts__row" }, [(0, vue_exports.createVNode)("dt", null, "PDF"), (0, vue_exports.createVNode)("dd", null, [__props.document.pdfUrl ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("a", {
								key: 0,
								href: __props.document.pdfUrl,
								target: "_blank",
								rel: "noopener"
							}, "PDF öffnen", 8, ["href"])) : __props.document.pdfMissing ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Die Datei fehlt im Speicher. Lad das PDF über „Ändern“ neu hoch.")], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createTextVNode)("Kein PDF hinterlegt")], 64)), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.document.samePdf ?? [], (twin) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: twin.href,
									class: "gs-sub gs-same-pdf"
								}, [
									(0, vue_exports.createTextVNode)(" Dieselbe Datei liegt auch bei "),
									(0, vue_exports.createVNode)("a", { href: twin.href }, (0, vue_exports.toDisplayString)(twin.label), 9, ["href"]),
									(0, vue_exports.createTextVNode)(" (" + (0, vue_exports.toDisplayString)(twin.status), 1),
									twin.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(", Demodaten")], 64)) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createTextVNode)("). ")
								]);
							}), 128))])])
						])]),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "gs-conditions-h"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "gs-conditions-h",
								class: "adm-section__title"
							}, "Auflagenverzeichnis")]),
							(0, vue_exports.createVNode)("p", { class: "adm-note gs-lead" }, "Die Zeilen nennen nur Codes. Was ein Code bedeutet, steht hier – so, wie dieses Gutachten ihn druckt."),
							(0, vue_exports.createVNode)(Auflagenverzeichnis_default, {
								"document-id": __props.document.id,
								conditions: __props.conditions,
								choices: __props.choices,
								unresolved: __props.unresolved,
								editable: false,
								"page-count": __props.document.pageCount,
								levels: __props.levels,
								"levels-editable": __props.can.levels === true,
								"level-floor-sentence": __props.levelFloorSentence
							}, null, 8, [
								"document-id",
								"conditions",
								"choices",
								"unresolved",
								"page-count",
								"levels",
								"levels-editable",
								"level-floor-sentence"
							])
						]),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "gs-extras-h"
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "gs-extras-h",
							class: "adm-section__title"
						}, "Befestigung und Hinweise")]), (0, vue_exports.createVNode)(DocumentExtras_default, {
							"document-id": __props.document.id,
							fasteners: __props.fasteners,
							notices: __props.notices,
							reworks: __props.reworks,
							conditions: __props.conditions,
							editable: false,
							"page-count": __props.document.pageCount
						}, null, 8, [
							"document-id",
							"fasteners",
							"notices",
							"reworks",
							"conditions",
							"page-count"
						])]),
						deratingShown$1.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 1,
							class: "adm-section",
							"aria-labelledby": "gs-derating-h"
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "gs-derating-h",
							class: "adm-section__title"
						}, "Tragfähigkeit bei hoher Geschwindigkeit"), __props.derating.seededFrom ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
							key: 0,
							class: "adm-tag adm-tag--neutral"
						}, "Demodaten")) : (0, vue_exports.createCommentVNode)("", true)]), (0, vue_exports.createVNode)(DeratingTable_default, {
							"document-id": __props.document.id,
							stamp: __props.stamps.derating,
							derating: __props.derating,
							editable: false,
							"page-count": __props.document.pageCount,
							required: false
						}, null, 8, [
							"document-id",
							"stamp",
							"derating",
							"page-count"
						])])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("details", {
							key: 2,
							class: "adm-section gs-fold"
						}, [(0, vue_exports.createVNode)("summary", { class: "gs-fold__summary" }, [(0, vue_exports.createVNode)("h2", {
							id: "gs-derating-h",
							class: "adm-section__title"
						}, "Tragfähigkeit bei hoher Geschwindigkeit"), (0, vue_exports.createVNode)("span", { class: "gs-fold__state" }, "Keine Tabelle hinterlegt")]), (0, vue_exports.createVNode)("p", { class: "adm-note" }, (0, vue_exports.toDisplayString)(deratingAbsent$1.value), 1)])),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "gs-rows-h"
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "gs-rows-h",
							class: "adm-section__title",
							tabindex: "-1"
						}, "Fahrzeuge und Reifen")]), __props.readView.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-note"
						}, "Noch kein Fahrzeug.")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ul", {
							key: 1,
							class: "gs-cars"
						}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.readView, (car) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
								key: car.id,
								class: "gs-car"
							}, [
								(0, vue_exports.createVNode)("div", { class: "gs-car__head" }, [
									(0, vue_exports.createVNode)("h3", { class: "gs-car__name" }, (0, vue_exports.toDisplayString)(car.car), 1),
									car.finish ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "adm-tag adm-tag--neutral"
									}, "nur " + (0, vue_exports.toDisplayString)(car.finish), 1)) : (0, vue_exports.createCommentVNode)("", true),
									car.axle !== "ALL" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 1,
										class: "adm-tag adm-tag--neutral"
									}, (0, vue_exports.toDisplayString)(car.axle === "FRONT" ? "nur Vorderachse" : "nur Hinterachse"), 1)) : (0, vue_exports.createCommentVNode)("", true),
									pageHref(car.page) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("a", {
										key: 2,
										class: "gs-car__page",
										href: pageHref(car.page),
										target: "_blank",
										rel: "noopener"
									}, "S. " + (0, vue_exports.toDisplayString)(car.page), 9, ["href"])) : car.page ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 3,
										class: "gs-car__page"
									}, "S. " + (0, vue_exports.toDisplayString)(car.page), 1)) : (0, vue_exports.createCommentVNode)("", true)
								]),
								(0, vue_exports.createVNode)("p", { class: "gs-sub" }, [
									car.k ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("Feld K " + (0, vue_exports.toDisplayString)(car.k), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true),
									car.k && car.wheel ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)(" · ")], 64)) : (0, vue_exports.createCommentVNode)("", true),
									car.wheel ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(car.wheel), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)
								]),
								car.lines.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 0,
									class: "gs-missing"
								}, "Keine Reifengröße – im Shop nicht bestellbar")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ul", {
									key: 1,
									class: "gs-lines"
								}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(car.lines, (line) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
										key: line.id,
										class: "gs-readline"
									}, [(0, vue_exports.createVNode)("span", { class: "gs-readline__tyres" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(lineText(line)), 1), line.kw ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · " + (0, vue_exports.toDisplayString)(line.kw) + " kW", 1)], 64)) : (0, vue_exports.createCommentVNode)("", true)]), line.codes.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "gs-tags",
										translate: "no"
									}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(line.codes, (code) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: code,
											class: "gs-tag",
											title: codeHint(code)
										}, (0, vue_exports.toDisplayString)(code), 9, ["title"]);
									}), 128))])) : (0, vue_exports.createCommentVNode)("", true)]);
								}), 128))])),
								car.codes.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 2,
									class: "gs-general"
								}, [(0, vue_exports.createTextVNode)(" Allgemeine Codes: "), (0, vue_exports.createVNode)("span", {
									class: "gs-tags",
									translate: "no"
								}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(car.codes, (code) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: code,
										class: "gs-tag",
										title: codeHint(code)
									}, (0, vue_exports.toDisplayString)(code), 9, ["title"]);
								}), 128))])])) : (0, vue_exports.createCommentVNode)("", true)
							]);
						}), 128))]))]),
						(0, vue_exports.createVNode)(PreviewSection_default),
						__props.can.release ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ReleaseDialog_default, {
							key: 3,
							open: releaseOpen.value,
							"onUpdate:open": ($event) => releaseOpen.value = $event,
							mode: "release",
							document: __props.document,
							rows: rowsTotal.value,
							note: releaseBody.value,
							onDone: focusState
						}, null, 8, [
							"open",
							"onUpdate:open",
							"document",
							"rows",
							"note"
						])) : (0, vue_exports.createCommentVNode)("", true),
						__props.can.answer ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ReleaseDialog_default, {
							key: 4,
							open: answerOpen.value,
							"onUpdate:open": ($event) => answerOpen.value = $event,
							mode: "answer",
							document: __props.document,
							rows: rowsTotal.value
						}, null, 8, [
							"open",
							"onUpdate:open",
							"document",
							"rows"
						])) : (0, vue_exports.createCommentVNode)("", true),
						__props.can.revise ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminConfirm_default, {
							key: 5,
							open: reviseOpen.value,
							"onUpdate:open": ($event) => reviseOpen.value = $event,
							title: "Neue Fassung anlegen?",
							body: "Die neue Fassung beginnt als Entwurf mit allen Angaben, Codes und Zeilen dieser Fassung. Im Shop gilt diese Fassung weiter, bis die neue freigegeben ist und sie ersetzt.",
							"confirm-label": "Neue Fassung anlegen",
							busy: reviseBusy.value,
							onConfirm: revise
						}, null, 8, [
							"open",
							"onUpdate:open",
							"busy"
						])) : (0, vue_exports.createCommentVNode)("", true)
					];
				}),
				_: 2
			}, [__props.can.release ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(__props.blockers.length > 0) ? " disabled" : ""} data-v-2f59b6ea${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: "publish",
							size: 20
						}, null, _parent, _scopeId));
						_push(` Freigeben </button>`);
					} else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						disabled: __props.blockers.length > 0,
						onClick: ($event) => releaseOpen.value = true
					}, [(0, vue_exports.createVNode)(AdminIcon_default, {
						name: "publish",
						size: 20
					}), (0, vue_exports.createTextVNode)(" Freigeben ")], 8, ["disabled", "onClick"])];
				}),
				key: "0"
			} : __props.document.status === "published" && (__props.revisionDraft || __props.can.revise) ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.revisionDraft) {
							_push(`<a class="btn btn--primary"${(0, server_renderer_exports.ssrRenderAttr)("href", `/admin/gutachten/${__props.revisionDraft.id}`)} data-v-2f59b6ea${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "edit",
								size: 20
							}, null, _parent, _scopeId));
							_push(` Neue Fassung öffnen </a>`);
						} else {
							_push(`<button class="btn btn--primary" type="button" data-v-2f59b6ea${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "edit",
								size: 20
							}, null, _parent, _scopeId));
							_push(` Neue Fassung anlegen </button>`);
						}
					} else return [__props.revisionDraft ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("a", {
						key: 0,
						class: "btn btn--primary",
						href: `/admin/gutachten/${__props.revisionDraft.id}`
					}, [(0, vue_exports.createVNode)(AdminIcon_default, {
						name: "edit",
						size: 20
					}), (0, vue_exports.createTextVNode)(" Neue Fassung öffnen ")], 8, ["href"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
						key: 1,
						class: "btn btn--primary",
						type: "button",
						onClick: ($event) => reviseOpen.value = true
					}, [(0, vue_exports.createVNode)(AdminIcon_default, {
						name: "edit",
						size: 20
					}), (0, vue_exports.createTextVNode)(" Neue Fassung anlegen ")], 8, ["onClick"]))];
				}),
				key: "1"
			} : void 0]), _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Gutachten/Show.vue
var _sfc_setup = Show_vue_vue_type_script_setup_true_lang_default.setup;
Show_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Gutachten/Show.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Show_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Show_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-2f59b6ea"]]);
//#endregion
export { Show_default as default };
