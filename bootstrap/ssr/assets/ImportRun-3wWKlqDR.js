import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-D5fYDVeQ.js";
import { a as link_default, c as router, o as useForm, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminConfirm_default } from "./AdminConfirm-DBodxbIw.js";
import { n as decimal } from "./format-6R0uUMt3.js";
//#region resources/js/Pages/Admin/Fahrzeuge/ImportRun.vue?vue&type=script&setup=true&lang.ts
var ImportRun_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "ImportRun",
	__ssrInlineRender: true,
	props: {
		run: {},
		fields: {},
		headers: {},
		examples: {},
		mapping: {},
		missing: {},
		gaps: {},
		implausible: {},
		rows: {},
		hiddenRows: {},
		planHash: {},
		can: {}
	},
	setup(__props) {
		/**
		* Fahrzeuge › Import › one run (his admin item 2, D-297): which column holds what, what the Probelauf found, and the
		* import itself (VehicleImporter).
		*
		* The mapping can change without a new upload: the file's cells were kept as read. The import applies exactly the
		* Probelauf on screen; if the cars changed in between, the server asks for a new one.
		*/
		const props = __props;
		const page = usePage();
		const mappingForm = useForm({ mapping: Object.fromEntries(props.fields.map((field) => [field.key, props.mapping[field.key] ?? ""])) });
		(0, vue_exports.watch)(() => props.mapping, (mapping) => {
			mappingForm.defaults({ mapping: Object.fromEntries(props.fields.map((field) => [field.key, mapping[field.key] ?? ""])) });
			mappingForm.reset();
		});
		function remap() {
			mappingForm.post(`/admin/fahrzeuge/import/${props.run.id}/zuordnung`, { preserveScroll: true });
		}
		const s = (0, vue_exports.computed)(() => props.run.summary);
		const ready = (0, vue_exports.computed)(() => props.missing.length === 0);
		const importable = (0, vue_exports.computed)(() => (s.value.create ?? 0) + (s.value.update ?? 0) + (s.value.merge ?? 0));
		const context = (0, vue_exports.computed)(() => {
			const rows = props.run.rowCount === 1 ? "1 Zeile" : `${decimal(props.run.rowCount, 0)} Zeilen`;
			return `${props.run.statusLabel} · ${props.run.source} · ${rows} · ${props.run.format}${props.run.at ? ` · ${props.run.at}` : ""}`;
		});
		const serverError = (0, vue_exports.computed)(() => (page.props.errors ?? {}).import ?? "");
		function result(check) {
			if (check.unmapped) return check.unmapped;
			if (check.unchecked) return check.unchecked;
			const checked = `geprüft: ${decimal(check.checked, 0)} von ${decimal(props.run.rowCount, 0)} Zeilen`;
			const count = check.count ?? 0;
			return count === 0 ? `In keiner Zeile · ${checked}` : `In ${count === 1 ? "einer Zeile" : `${decimal(count, 0)} Zeilen`} · ${checked}`;
		}
		const oddFound = (0, vue_exports.computed)(() => props.implausible.some((check) => (check.count ?? 0) > 0));
		const STATUS = {
			create: {
				label: "Neu",
				tag: null
			},
			update: {
				label: "Geändert",
				tag: null
			},
			merge: {
				label: "Ergänzt",
				tag: null
			},
			unchanged: {
				label: "Unverändert",
				tag: "adm-tag adm-tag--neutral"
			},
			kept: {
				label: "Nicht überschrieben",
				tag: "adm-tag adm-tag--neutral"
			},
			refused: {
				label: "Abgelehnt",
				tag: "adm-tag adm-tag--bad"
			}
		};
		const tiles = (0, vue_exports.computed)(() => [
			{
				key: "create",
				label: "Neue Fahrzeuge",
				n: s.value.create ?? 0,
				bad: false
			},
			{
				key: "update",
				label: "Geänderte Fahrzeuge",
				n: s.value.update ?? 0,
				bad: false
			},
			{
				key: "merge",
				label: "Ergänzte Fahrzeuge",
				n: s.value.merge ?? 0,
				bad: false
			},
			{
				key: "unchanged",
				label: "Unverändert",
				n: s.value.unchanged ?? 0,
				bad: false
			},
			{
				key: "kept",
				label: "Nicht überschrieben",
				n: s.value.kept ?? 0,
				bad: false
			},
			{
				key: "refused",
				label: "Abgelehnt",
				n: s.value.refused ?? 0,
				bad: true
			}
		]);
		const COLUMN = {
			make: "Hersteller",
			model: "Modell",
			type_designation: "Fahrzeugtyp",
			eg_nummer_raw: "EG-Nummer",
			power_kw: "Leistung",
			build_from: "Gebaut ab",
			build_to: "Gebaut bis",
			body_form: "Karosserie",
			drive_axle: "Antrieb",
			axle_load_front_kg: "Achslast vorn",
			axle_load_rear_kg: "Achslast hinten",
			max_speed_kmh: "Höchstgeschwindigkeit",
			hsn: "HSN",
			tsn: "TSN"
		};
		function detail(row) {
			const lines = [];
			if (row.reason) lines.push(row.reason);
			if (row.changes.length) lines.push(`${row.status === "merge" ? "Füllt" : "Ändert"}: ${row.changes.map((c) => COLUMN[c] ?? c).join(", ")}`);
			return [...lines, ...row.notes];
		}
		const confirmOpen = (0, vue_exports.ref)(false);
		const busy = (0, vue_exports.ref)(false);
		const confirmText = (0, vue_exports.computed)(() => {
			const parts = [
				{
					n: s.value.create ?? 0,
					verb: "anlegen"
				},
				{
					n: s.value.update ?? 0,
					verb: "ändern"
				},
				{
					n: s.value.merge ?? 0,
					verb: "ergänzen"
				}
			].filter((step) => step.n > 0).map((step, i) => i === 0 ? `${decimal(step.n, 0)} ${step.n === 1 ? "Fahrzeug" : "Fahrzeuge"} ${step.verb}` : `${decimal(step.n, 0)} ${step.verb}`);
			return {
				title: `${parts.length > 1 ? `${parts.slice(0, -1).join(", ")} und ${parts[parts.length - 1]}` : parts[0] ?? ""}?`,
				body: "Neue und geänderte Fahrzeuge stehen sofort in der Fahrzeugauswahl des Shops. Fahrzeuge ohne Achslasten oder Höchstgeschwindigkeit stehen danach unter „Zur Prüfung“." + (oddFound.value ? " Der Probelauf hat unplausible Werte gelesen – meist ist dann einem Feld die falsche Spalte zugeordnet. Prüf die Zuordnung, bevor du importierst." : "")
			};
		});
		function example(field) {
			const header = mappingForm.mapping[field] ?? "";
			return header === "" ? "–" : props.examples[header] ?? "–";
		}
		function runImport() {
			busy.value = true;
			router.post(`/admin/fahrzeuge/import/${props.run.id}/importieren`, { plan: props.planHash }, {
				preserveScroll: true,
				onFinish: () => {
					busy.value = false;
					confirmOpen.value = false;
				}
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: __props.run.file,
				context: context.value
			}, _attrs), (0, vue_exports.createSlots)({
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (serverError.value) _push(`<p class="adm-alert" role="alert" data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(serverError.value)}</p>`);
						else _push(`<!---->`);
						if (__props.run.status === "applied") _push(`<p class="adm-note fr-state" data-v-9b06caf4${_scopeId}>Importiert am ${(0, server_renderer_exports.ssrInterpolate)(__props.run.appliedAt)}.</p>`);
						else _push(`<!---->`);
						if (ready.value) {
							_push(`<section class="adm-section" aria-labelledby="fr-h-result" data-v-9b06caf4${_scopeId}><div class="adm-section__head" data-v-9b06caf4${_scopeId}><h2 id="fr-h-result" class="adm-section__title" data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.run.status === "previewed" ? "Probelauf" : "Ergebnis")}</h2></div><dl class="fr-counts" data-v-9b06caf4${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(tiles.value, (tile) => {
								_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([{
									"fr-count--none": tile.n === 0,
									"fr-count--bad": tile.bad && tile.n > 0
								}, "fr-count"])}" data-v-9b06caf4${_scopeId}><dt data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(tile.label)}</dt><dd data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(tile.n, 0))}</dd></div>`);
							});
							_push(`<!--]--></dl>`);
							if ((s.value.unread ?? 0) > 0) _push(`<p class="adm-note" data-v-9b06caf4${_scopeId}> In ${(0, server_renderer_exports.ssrInterpolate)(s.value.unread === 1 ? "einer Zeile" : `${(0, vue_exports.unref)(decimal)(s.value.unread ?? 0, 0)} Zeilen`)} ist mindestens ein Wert nicht lesbar oder unplausibel. Solche Werte bleiben leer und werden nie geraten; ein Fahrzeug ohne Achslasten oder Höchstgeschwindigkeit steht danach unter „Zur Prüfung“. </p>`);
							else _push(`<!---->`);
							if (__props.run.status === "previewed" && importable.value === 0) _push(`<p class="adm-note" data-v-9b06caf4${_scopeId}>Nichts zu importieren: Keine Zeile ist neu, geändert oder ergänzt.</p>`);
							else _push(`<!---->`);
							if (__props.run.status === "previewed" && (s.value.refused ?? 0) > 0) _push(`<p class="adm-note" data-v-9b06caf4${_scopeId}>Abgelehnte Zeilen übernimmt der Import nicht. Korrigier sie in der Datei und starte einen neuen Probelauf.</p>`);
							else _push(`<!---->`);
							if (__props.run.status === "previewed" && importable.value > 0 && !__props.can.apply) _push(`<p class="adm-note" data-v-9b06caf4${_scopeId}>Importieren kann, wer Fahrzeuge anlegen und ändern darf. Den Probelauf siehst du trotzdem.</p>`);
							else _push(`<!---->`);
							if (__props.gaps.length) {
								_push(`<div class="fr-gaps" data-v-9b06caf4${_scopeId}><h3 id="fr-h-gaps" class="fr-gaps__title" data-v-9b06caf4${_scopeId}>Was in der Datei fehlt</h3><p class="adm-note" data-v-9b06caf4${_scopeId}> Gezählt über ${(0, server_renderer_exports.ssrInterpolate)(__props.run.rowCount === 1 ? "die eine Zeile" : `alle ${(0, vue_exports.unref)(decimal)(__props.run.rowCount, 0)} Zeilen`)} der Datei, unabhängig davon, was der Import mit einer Zeile macht. Ein nicht lesbarer Wert zählt wie ein fehlender. Ist einem Feld keine Spalte zugeordnet, hat der Import es nicht gelesen. Statt der Zahlen steht dann „Keine Spalte zugeordnet“ – ob die Werte in der Datei fehlen, bleibt offen. </p><div class="adm-panel" data-v-9b06caf4${_scopeId}><table class="adm-table" aria-labelledby="fr-h-gaps" data-v-9b06caf4${_scopeId}><thead data-v-9b06caf4${_scopeId}><tr data-v-9b06caf4${_scopeId}><th scope="col" data-v-9b06caf4${_scopeId}>Angabe</th><th scope="col" class="num" data-v-9b06caf4${_scopeId}>Fehlt in</th><th scope="col" class="num" data-v-9b06caf4${_scopeId}>Anteil</th></tr></thead><tbody data-v-9b06caf4${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.gaps, (gap) => {
									_push(`<tr class="${(0, server_renderer_exports.ssrRenderClass)({
										"fr-gap--none": gap.count === 0,
										"fr-gap--unmapped": gap.unmapped !== null
									})}" data-v-9b06caf4${_scopeId}><td data-label="Angabe" class="fr-gap__label" data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(gap.label)}</td><td data-label="Fehlt in" class="num" data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(gap.unmapped ?? `${(0, vue_exports.unref)(decimal)(gap.count ?? 0, 0)} von ${(0, vue_exports.unref)(decimal)(__props.run.rowCount, 0)}`)}</td><td data-label="Anteil" class="num" data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(gap.share ?? "–")}</td></tr>`);
								});
								_push(`<!--]--></tbody></table></div></div>`);
							} else _push(`<!---->`);
							if (__props.implausible.length) {
								_push(`<div class="fr-checks" data-v-9b06caf4${_scopeId}><h3 id="fr-h-odd" class="fr-gaps__title" data-v-9b06caf4${_scopeId}>Gelesen, aber unplausibel</h3><p class="adm-note" data-v-9b06caf4${_scopeId}> Der Probelauf prüft, ob gelesene Werte im erwarteten Bereich liegen und zueinander passen. Fällt ein Wert auf, ist meist einem Feld die falsche Spalte zugeordnet: Prüf die Zuordnung unten. Eine Achslast oder Höchstgeschwindigkeit außerhalb des erwarteten Bereichs übernimmt der Import nicht. Die Zeile wird trotzdem importiert, das Fahrzeug steht danach unter „Zur Prüfung“. Achslasten, die erst im Vergleich auffallen, übernimmt der Import so, wie er sie gelesen hat. </p><ul class="fr-odd" aria-labelledby="fr-h-odd" data-v-9b06caf4${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.implausible, (check) => {
									_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{ "fr-odd__check--hit": (check.count ?? 0) > 0 }, "fr-odd__check"])}" data-v-9b06caf4${_scopeId}><p class="fr-odd__label" data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(check.label)}</p><p class="fr-odd__result" data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(result(check))}</p><p class="fr-odd__expected" data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(check.expected)}</p>`);
									if (check.examples.length) {
										_push(`<ul class="fr-odd__examples" data-v-9b06caf4${_scopeId}><!--[-->`);
										(0, server_renderer_exports.ssrRenderList)(check.examples, (example) => {
											_push(`<li data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(example)}</li>`);
										});
										_push(`<!--]--></ul>`);
									} else _push(`<!---->`);
									_push(`</li>`);
								});
								_push(`<!--]--></ul></div>`);
							} else _push(`<!---->`);
							if (__props.rows.length) {
								_push(`<div class="adm-panel fr-rows" data-v-9b06caf4${_scopeId}><table class="adm-table" data-v-9b06caf4${_scopeId}><caption class="visually-hidden" data-v-9b06caf4${_scopeId}>Zeilen der Datei, die sich ändern, bleiben oder abgelehnt sind</caption><thead data-v-9b06caf4${_scopeId}><tr data-v-9b06caf4${_scopeId}><th scope="col" class="num" data-v-9b06caf4${_scopeId}>Zeile</th><th scope="col" data-v-9b06caf4${_scopeId}>HSN/TSN</th><th scope="col" data-v-9b06caf4${_scopeId}>Fahrzeug</th><th scope="col" data-v-9b06caf4${_scopeId}>Ergebnis</th><th scope="col" data-v-9b06caf4${_scopeId}>Einzelheiten</th></tr></thead><tbody data-v-9b06caf4${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.rows, (row) => {
									_push(`<tr data-v-9b06caf4${_scopeId}><td data-label="Zeile" class="num" data-v-9b06caf4${_scopeId}><span class="fr-line-word" data-v-9b06caf4${_scopeId}>Zeile </span>${(0, server_renderer_exports.ssrInterpolate)(row.line)}</td><td data-label="HSN/TSN" class="fr-keys" data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.keys ?? "–")}</td><td data-label="Fahrzeug" class="fr-label" data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.label || "–")}</td><td data-label="Ergebnis" data-phone="status" data-v-9b06caf4${_scopeId}>`);
									if (STATUS[row.status].tag) _push(`<span class="${(0, server_renderer_exports.ssrRenderClass)(STATUS[row.status].tag)}" data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(STATUS[row.status].label)}</span>`);
									else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(STATUS[row.status].label)}<!--]-->`);
									_push(`</td><td data-label="Einzelheiten" class="fr-detail"${(0, server_renderer_exports.ssrRenderAttr)("data-phone", detail(row).length === 0 ? "hide" : void 0)} data-v-9b06caf4${_scopeId}><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(detail(row), (line) => {
										_push(`<span class="fr-detail-line" data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line)}</span>`);
									});
									_push(`<!--]--></td></tr>`);
								});
								_push(`<!--]--></tbody></table></div>`);
							} else _push(`<!---->`);
							if (__props.hiddenRows === 1) _push(`<p class="adm-note" data-v-9b06caf4${_scopeId}>Eine weitere Zeile ist in den Zahlen oben enthalten, aber hier nicht aufgeführt.</p>`);
							else if (__props.hiddenRows) _push(`<p class="adm-note" data-v-9b06caf4${_scopeId}>Weitere ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.hiddenRows, 0))} Zeilen sind in den Zahlen oben enthalten, aber hier nicht aufgeführt.</p>`);
							else _push(`<!---->`);
							_push(`</section>`);
						} else _push(`<!---->`);
						_push(`<section class="adm-section" aria-labelledby="fr-h-map" data-v-9b06caf4${_scopeId}><div class="adm-section__head" data-v-9b06caf4${_scopeId}><h2 id="fr-h-map" class="adm-section__title" data-v-9b06caf4${_scopeId}>Zuordnung der Spalten</h2></div>`);
						if (!ready.value) _push(`<p class="adm-alert" role="alert" data-v-9b06caf4${_scopeId}>Diese Felder brauchen noch eine Spalte aus der Datei: ${(0, server_renderer_exports.ssrInterpolate)(__props.missing.join(", "))}. Erst dann kann der Probelauf die Zeilen prüfen.</p>`);
						else _push(`<!---->`);
						_push(`<form class="fr-map" data-v-9b06caf4${_scopeId}><div class="adm-panel" data-v-9b06caf4${_scopeId}><table class="adm-table" data-v-9b06caf4${_scopeId}><caption class="visually-hidden" data-v-9b06caf4${_scopeId}>Welche Spalte der Datei welches Feld füllt</caption><thead data-v-9b06caf4${_scopeId}><tr data-v-9b06caf4${_scopeId}><th scope="col" data-v-9b06caf4${_scopeId}>Feld</th><th scope="col" data-v-9b06caf4${_scopeId}>Spalte aus der Datei</th><th scope="col" data-v-9b06caf4${_scopeId}>Erster Wert</th></tr></thead><tbody data-v-9b06caf4${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.fields, (field) => {
							_push(`<tr data-v-9b06caf4${_scopeId}><td data-label="Feld" data-v-9b06caf4${_scopeId}><label${(0, server_renderer_exports.ssrRenderAttr)("for", `fr-map-${field.key}`)} class="fr-field" data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(field.label)}</label>`);
							if (field.required) _push(`<span class="fr-req" data-v-9b06caf4${_scopeId}>Pflicht</span>`);
							else _push(`<!---->`);
							if (field.hint) _push(`<span class="fr-req" data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(field.hint)}</span>`);
							else _push(`<!---->`);
							_push(`</td><td data-label="Spalte" data-v-9b06caf4${_scopeId}><select${(0, server_renderer_exports.ssrRenderAttr)("id", `fr-map-${field.key}`)} class="input fr-select"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!__props.can.remap) ? " disabled" : ""} data-v-9b06caf4${_scopeId}><option value="" data-v-9b06caf4${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(mappingForm).mapping[field.key]) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(mappingForm).mapping[field.key], "") : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(mappingForm).mapping[field.key], "")) ? " selected" : ""}${_scopeId}>– keine –</option><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.headers, (header) => {
								_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", header)} data-v-9b06caf4${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(mappingForm).mapping[field.key]) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(mappingForm).mapping[field.key], header) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(mappingForm).mapping[field.key], header)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(header)}</option>`);
							});
							_push(`<!--]--></select></td><td data-label="Erster Wert" class="fr-example" data-v-9b06caf4${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(example(field.key))}</td></tr>`);
						});
						_push(`<!--]--></tbody></table></div>`);
						if (__props.can.remap) {
							_push(`<div class="fr-map__actions" data-v-9b06caf4${_scopeId}><button class="btn btn--secondary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(mappingForm).processing) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", (0, vue_exports.unref)(mappingForm).processing ? "true" : void 0)} data-v-9b06caf4${_scopeId}>Neu prüfen</button>`);
							if ((0, vue_exports.unref)(mappingForm).isDirty) _push(`<p class="adm-note" data-v-9b06caf4${_scopeId}>Die Zuordnung ist geändert. Prüf neu, bevor du importierst.</p>`);
							else _push(`<!---->`);
							_push(`</div>`);
						} else _push(`<!---->`);
						_push(`</form></section><p class="fr-back" data-v-9b06caf4${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/admin/fahrzeuge/import" }, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Zurück zum Import`);
								else return [(0, vue_exports.createTextVNode)("Zurück zum Import")];
							}),
							_: 1
						}, _parent, _scopeId));
						_push(`</p>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: confirmOpen.value,
							"onUpdate:open": ($event) => confirmOpen.value = $event,
							title: confirmText.value.title,
							body: confirmText.value.body,
							"confirm-label": "Importieren",
							busy: busy.value,
							onConfirm: runImport
						}, null, _parent, _scopeId));
					} else return [
						serverError.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-alert",
							role: "alert"
						}, (0, vue_exports.toDisplayString)(serverError.value), 1)) : (0, vue_exports.createCommentVNode)("", true),
						__props.run.status === "applied" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 1,
							class: "adm-note fr-state"
						}, "Importiert am " + (0, vue_exports.toDisplayString)(__props.run.appliedAt) + ".", 1)) : (0, vue_exports.createCommentVNode)("", true),
						ready.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 2,
							class: "adm-section",
							"aria-labelledby": "fr-h-result"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "fr-h-result",
								class: "adm-section__title"
							}, (0, vue_exports.toDisplayString)(__props.run.status === "previewed" ? "Probelauf" : "Ergebnis"), 1)]),
							(0, vue_exports.createVNode)("dl", { class: "fr-counts" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(tiles.value, (tile) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: tile.key,
									class: ["fr-count", {
										"fr-count--none": tile.n === 0,
										"fr-count--bad": tile.bad && tile.n > 0
									}]
								}, [(0, vue_exports.createVNode)("dt", null, (0, vue_exports.toDisplayString)(tile.label), 1), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(tile.n, 0)), 1)], 2);
							}), 128))]),
							(s.value.unread ?? 0) > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-note"
							}, " In " + (0, vue_exports.toDisplayString)(s.value.unread === 1 ? "einer Zeile" : `${(0, vue_exports.unref)(decimal)(s.value.unread ?? 0, 0)} Zeilen`) + " ist mindestens ein Wert nicht lesbar oder unplausibel. Solche Werte bleiben leer und werden nie geraten; ein Fahrzeug ohne Achslasten oder Höchstgeschwindigkeit steht danach unter „Zur Prüfung“. ", 1)) : (0, vue_exports.createCommentVNode)("", true),
							__props.run.status === "previewed" && importable.value === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 1,
								class: "adm-note"
							}, "Nichts zu importieren: Keine Zeile ist neu, geändert oder ergänzt.")) : (0, vue_exports.createCommentVNode)("", true),
							__props.run.status === "previewed" && (s.value.refused ?? 0) > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 2,
								class: "adm-note"
							}, "Abgelehnte Zeilen übernimmt der Import nicht. Korrigier sie in der Datei und starte einen neuen Probelauf.")) : (0, vue_exports.createCommentVNode)("", true),
							__props.run.status === "previewed" && importable.value > 0 && !__props.can.apply ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 3,
								class: "adm-note"
							}, "Importieren kann, wer Fahrzeuge anlegen und ändern darf. Den Probelauf siehst du trotzdem.")) : (0, vue_exports.createCommentVNode)("", true),
							__props.gaps.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 4,
								class: "fr-gaps"
							}, [
								(0, vue_exports.createVNode)("h3", {
									id: "fr-h-gaps",
									class: "fr-gaps__title"
								}, "Was in der Datei fehlt"),
								(0, vue_exports.createVNode)("p", { class: "adm-note" }, " Gezählt über " + (0, vue_exports.toDisplayString)(__props.run.rowCount === 1 ? "die eine Zeile" : `alle ${(0, vue_exports.unref)(decimal)(__props.run.rowCount, 0)} Zeilen`) + " der Datei, unabhängig davon, was der Import mit einer Zeile macht. Ein nicht lesbarer Wert zählt wie ein fehlender. Ist einem Feld keine Spalte zugeordnet, hat der Import es nicht gelesen. Statt der Zahlen steht dann „Keine Spalte zugeordnet“ – ob die Werte in der Datei fehlen, bleibt offen. ", 1),
								(0, vue_exports.createVNode)("div", { class: "adm-panel" }, [(0, vue_exports.createVNode)("table", {
									class: "adm-table",
									"aria-labelledby": "fr-h-gaps"
								}, [(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Angabe"),
									(0, vue_exports.createVNode)("th", {
										scope: "col",
										class: "num"
									}, "Fehlt in"),
									(0, vue_exports.createVNode)("th", {
										scope: "col",
										class: "num"
									}, "Anteil")
								])]), (0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.gaps, (gap) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", {
										key: gap.key,
										class: {
											"fr-gap--none": gap.count === 0,
											"fr-gap--unmapped": gap.unmapped !== null
										}
									}, [
										(0, vue_exports.createVNode)("td", {
											"data-label": "Angabe",
											class: "fr-gap__label"
										}, (0, vue_exports.toDisplayString)(gap.label), 1),
										(0, vue_exports.createVNode)("td", {
											"data-label": "Fehlt in",
											class: "num"
										}, (0, vue_exports.toDisplayString)(gap.unmapped ?? `${(0, vue_exports.unref)(decimal)(gap.count ?? 0, 0)} von ${(0, vue_exports.unref)(decimal)(__props.run.rowCount, 0)}`), 1),
										(0, vue_exports.createVNode)("td", {
											"data-label": "Anteil",
											class: "num"
										}, (0, vue_exports.toDisplayString)(gap.share ?? "–"), 1)
									], 2);
								}), 128))])])])
							])) : (0, vue_exports.createCommentVNode)("", true),
							__props.implausible.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 5,
								class: "fr-checks"
							}, [
								(0, vue_exports.createVNode)("h3", {
									id: "fr-h-odd",
									class: "fr-gaps__title"
								}, "Gelesen, aber unplausibel"),
								(0, vue_exports.createVNode)("p", { class: "adm-note" }, " Der Probelauf prüft, ob gelesene Werte im erwarteten Bereich liegen und zueinander passen. Fällt ein Wert auf, ist meist einem Feld die falsche Spalte zugeordnet: Prüf die Zuordnung unten. Eine Achslast oder Höchstgeschwindigkeit außerhalb des erwarteten Bereichs übernimmt der Import nicht. Die Zeile wird trotzdem importiert, das Fahrzeug steht danach unter „Zur Prüfung“. Achslasten, die erst im Vergleich auffallen, übernimmt der Import so, wie er sie gelesen hat. "),
								(0, vue_exports.createVNode)("ul", {
									class: "fr-odd",
									"aria-labelledby": "fr-h-odd"
								}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.implausible, (check) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
										key: check.key,
										class: ["fr-odd__check", { "fr-odd__check--hit": (check.count ?? 0) > 0 }]
									}, [
										(0, vue_exports.createVNode)("p", { class: "fr-odd__label" }, (0, vue_exports.toDisplayString)(check.label), 1),
										(0, vue_exports.createVNode)("p", { class: "fr-odd__result" }, (0, vue_exports.toDisplayString)(result(check)), 1),
										(0, vue_exports.createVNode)("p", { class: "fr-odd__expected" }, (0, vue_exports.toDisplayString)(check.expected), 1),
										check.examples.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ul", {
											key: 0,
											class: "fr-odd__examples"
										}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(check.examples, (example) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: example }, (0, vue_exports.toDisplayString)(example), 1);
										}), 128))])) : (0, vue_exports.createCommentVNode)("", true)
									], 2);
								}), 128))])
							])) : (0, vue_exports.createCommentVNode)("", true),
							__props.rows.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 6,
								class: "adm-panel fr-rows"
							}, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [
								(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Zeilen der Datei, die sich ändern, bleiben oder abgelehnt sind"),
								(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
									(0, vue_exports.createVNode)("th", {
										scope: "col",
										class: "num"
									}, "Zeile"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "HSN/TSN"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Fahrzeug"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Ergebnis"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Einzelheiten")
								])]),
								(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.rows, (row) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: row.line }, [
										(0, vue_exports.createVNode)("td", {
											"data-label": "Zeile",
											class: "num"
										}, [(0, vue_exports.createVNode)("span", { class: "fr-line-word" }, "Zeile "), (0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(row.line), 1)]),
										(0, vue_exports.createVNode)("td", {
											"data-label": "HSN/TSN",
											class: "fr-keys"
										}, (0, vue_exports.toDisplayString)(row.keys ?? "–"), 1),
										(0, vue_exports.createVNode)("td", {
											"data-label": "Fahrzeug",
											class: "fr-label"
										}, (0, vue_exports.toDisplayString)(row.label || "–"), 1),
										(0, vue_exports.createVNode)("td", {
											"data-label": "Ergebnis",
											"data-phone": "status"
										}, [STATUS[row.status].tag ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: STATUS[row.status].tag
										}, (0, vue_exports.toDisplayString)(STATUS[row.status].label), 3)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(STATUS[row.status].label), 1)], 64))]),
										(0, vue_exports.createVNode)("td", {
											"data-label": "Einzelheiten",
											class: "fr-detail",
											"data-phone": detail(row).length === 0 ? "hide" : void 0
										}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(detail(row), (line) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: line,
												class: "fr-detail-line"
											}, (0, vue_exports.toDisplayString)(line), 1);
										}), 128))], 8, ["data-phone"])
									]);
								}), 128))])
							])])) : (0, vue_exports.createCommentVNode)("", true),
							__props.hiddenRows === 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 7,
								class: "adm-note"
							}, "Eine weitere Zeile ist in den Zahlen oben enthalten, aber hier nicht aufgeführt.")) : __props.hiddenRows ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 8,
								class: "adm-note"
							}, "Weitere " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.hiddenRows, 0)) + " Zeilen sind in den Zahlen oben enthalten, aber hier nicht aufgeführt.", 1)) : (0, vue_exports.createCommentVNode)("", true)
						])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "fr-h-map"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "fr-h-map",
								class: "adm-section__title"
							}, "Zuordnung der Spalten")]),
							!ready.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-alert",
								role: "alert"
							}, "Diese Felder brauchen noch eine Spalte aus der Datei: " + (0, vue_exports.toDisplayString)(__props.missing.join(", ")) + ". Erst dann kann der Probelauf die Zeilen prüfen.", 1)) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("form", {
								class: "fr-map",
								onSubmit: (0, vue_exports.withModifiers)(remap, ["prevent"])
							}, [(0, vue_exports.createVNode)("div", { class: "adm-panel" }, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [
								(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Welche Spalte der Datei welches Feld füllt"),
								(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Feld"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Spalte aus der Datei"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Erster Wert")
								])]),
								(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.fields, (field) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: field.key }, [
										(0, vue_exports.createVNode)("td", { "data-label": "Feld" }, [
											(0, vue_exports.createVNode)("label", {
												for: `fr-map-${field.key}`,
												class: "fr-field"
											}, (0, vue_exports.toDisplayString)(field.label), 9, ["for"]),
											field.required ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 0,
												class: "fr-req"
											}, "Pflicht")) : (0, vue_exports.createCommentVNode)("", true),
											field.hint ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
												key: 1,
												class: "fr-req"
											}, (0, vue_exports.toDisplayString)(field.hint), 1)) : (0, vue_exports.createCommentVNode)("", true)
										]),
										(0, vue_exports.createVNode)("td", { "data-label": "Spalte" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
											id: `fr-map-${field.key}`,
											"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(mappingForm).mapping[field.key] = $event,
											class: "input fr-select",
											disabled: !__props.can.remap
										}, [(0, vue_exports.createVNode)("option", { value: "" }, "– keine –"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.headers, (header) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
												key: header,
												value: header
											}, (0, vue_exports.toDisplayString)(header), 9, ["value"]);
										}), 128))], 8, [
											"id",
											"onUpdate:modelValue",
											"disabled"
										]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(mappingForm).mapping[field.key]]])]),
										(0, vue_exports.createVNode)("td", {
											"data-label": "Erster Wert",
											class: "fr-example"
										}, (0, vue_exports.toDisplayString)(example(field.key)), 1)
									]);
								}), 128))])
							])]), __props.can.remap ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 0,
								class: "fr-map__actions"
							}, [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "submit",
								disabled: (0, vue_exports.unref)(mappingForm).processing,
								"aria-busy": (0, vue_exports.unref)(mappingForm).processing ? "true" : void 0
							}, "Neu prüfen", 8, ["disabled", "aria-busy"]), (0, vue_exports.unref)(mappingForm).isDirty ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-note"
							}, "Die Zuordnung ist geändert. Prüf neu, bevor du importierst.")) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true)], 32)
						]),
						(0, vue_exports.createVNode)("p", { class: "fr-back" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), { href: "/admin/fahrzeuge/import" }, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Zurück zum Import")]),
							_: 1
						})]),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: confirmOpen.value,
							"onUpdate:open": ($event) => confirmOpen.value = $event,
							title: confirmText.value.title,
							body: confirmText.value.body,
							"confirm-label": "Importieren",
							busy: busy.value,
							onConfirm: runImport
						}, null, 8, [
							"open",
							"onUpdate:open",
							"title",
							"body",
							"busy"
						])
					];
				}),
				_: 2
			}, [__props.can.apply && ready.value && importable.value > 0 ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, vue_exports.unref)(mappingForm).isDirty) ? " disabled" : ""} data-v-9b06caf4${_scopeId}>Importieren</button>`);
					else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						disabled: (0, vue_exports.unref)(mappingForm).isDirty,
						onClick: ($event) => confirmOpen.value = true
					}, "Importieren", 8, ["disabled", "onClick"])];
				}),
				key: "0"
			} : void 0]), _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Fahrzeuge/ImportRun.vue
var _sfc_setup = ImportRun_vue_vue_type_script_setup_true_lang_default.setup;
ImportRun_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Fahrzeuge/ImportRun.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var ImportRun_default = /*#__PURE__*/ _plugin_vue_export_helper_default(ImportRun_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-9b06caf4"]]);
//#endregion
export { ImportRun_default as default };
