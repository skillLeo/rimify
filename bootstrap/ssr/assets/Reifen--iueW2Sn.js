import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BPlu6HXH.js";
import { u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { t as formatMoney } from "./num-Br8qlecZ.js";
import { c as zoll, s as withUnit, t as anzahl } from "./format-6R0uUMt3.js";
import { t as AdminState_default } from "./AdminState-QyYV7E7y.js";
import { t as AdminSortHeader_default } from "./AdminSortHeader-DiG7Jxor.js";
import { t as SketchBanner_default } from "./SketchBanner-xSNbXZv7.js";
import { n as SeasonMark_default, t as TyrePicture_default } from "./TyrePicture-MHB3RGrS.js";
import { a as SEASONS, o as TYRES, s as TYRE_BRANDS } from "./shopDemo-CkuVaHdt.js";
//#region resources/js/Pages/Admin/Skizze/reifenDemo.ts
/**
* The admin tyre sketch's data, in memory only (the Gutachten rework brief §9): tyre MODELS — maker, model, season,
* photos — each with its size lines, and on every line its supplier, price, availability and EU tyre label. The models
* are the shop sketch's invented ones; one size comes from two suppliers at two prices, to put the open question where
* it arises. Every figure is an example.
*/
var SUPPLIERS = [
	"Großhandel Nord",
	"Reifenlager Süd",
	"Direkt vom Hersteller"
];
function eprel(seed) {
	return String(4e5 + seed * 7919);
}
var MODELS = TYRES.map((tyre, index) => {
	const label = {
		fuel: tyre.label.fuel,
		wet: tyre.label.wet,
		noiseDb: tyre.label.noiseDb,
		noiseClass: tyre.label.noiseClass,
		snow: tyre.label.snow,
		ice: tyre.label.ice,
		eprel: eprel(index)
	};
	const sizes = [{
		id: `${tyre.id}-1`,
		size: tyre.front.size,
		li: tyre.front.li,
		si: tyre.front.si,
		supplier: SUPPLIERS[index % 3] ?? "",
		priceCents: tyre.front.priceCents,
		available: tyre.delivery !== "anfrage",
		label
	}];
	if (tyre.rear) sizes.push({
		id: `${tyre.id}-2`,
		size: tyre.rear.size,
		li: tyre.rear.li,
		si: tyre.rear.si,
		supplier: SUPPLIERS[(index + 1) % 3] ?? "",
		priceCents: tyre.rear.priceCents,
		available: tyre.delivery !== "anfrage",
		label: index % 4 === 3 ? null : {
			...label,
			noiseDb: label.noiseDb + 1,
			eprel: eprel(index + 50)
		}
	});
	if (index % 3 === 0) sizes.push({
		id: `${tyre.id}-3`,
		size: "235/35 R19",
		li: 91,
		si: tyre.front.si,
		supplier: SUPPLIERS[(index + 2) % 3] ?? "",
		priceCents: tyre.front.priceCents + 3e3,
		available: true,
		label: index === 3 ? null : {
			...label,
			eprel: eprel(index + 100)
		}
	});
	return {
		id: tyre.id,
		brand: tyre.brand,
		model: tyre.model,
		season: tyre.season,
		photos: tyre.photos,
		sizes,
		changed: `${String(28 - index).padStart(2, "0")}.10.2026`
	};
});
var first = MODELS[0];
if (first !== void 0 && first.sizes[0] !== void 0) first.sizes.splice(1, 0, {
	...first.sizes[0],
	id: `${first.id}-1b`,
	supplier: "Reifenlager Süd",
	priceCents: first.sizes[0].priceCents - 500
});
var SUPPLIER_QUESTION = "Kann derselbe Reifen (gleiche Marke, gleiches Modell, gleiche Größe) von mehreren Lieferanten mit unterschiedlichen Preisen kommen? Wenn ja: Welcher Preis soll im Shop stehen?";
//#endregion
//#region resources/js/Pages/Admin/Skizze/Reifen.vue?vue&type=script&setup=true&lang.ts
var Reifen_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Reifen",
	__ssrInlineRender: true,
	props: { modell: {} },
	setup(__props) {
		/**
		* Katalog › Reifen with tyre models, as a sketch (the Gutachten rework brief §9): the list as the live list is built —
		* search and selects at the top, sortable headings, the filtered state — with a photo thumbnail per model, made for
		* hundreds; and one model with up to four photos and its size lines: load index, speed symbol, supplier, price,
		* availability and the EU tyre label per line. The question only the client can answer stands where it arises. Nothing
		* reaches the server.
		*/
		const props = __props;
		function known(id) {
			return id === "neu" || MODELS.some((m) => m.id === id) ? id : null;
		}
		const modelId = (0, vue_exports.ref)(known(props.modell));
		const uploadNote = (0, vue_exports.ref)(false);
		const filters = (0, vue_exports.reactive)({
			q: "",
			marke: "",
			saison: ""
		});
		const order = (0, vue_exports.reactive)({
			sort: "reifen",
			richtung: "auf"
		});
		const editing = (0, vue_exports.ref)(null);
		const BLANK = {
			id: "neu",
			brand: TYRE_BRANDS[0] ?? "",
			model: "",
			season: "sommer",
			photos: 0,
			sizes: [],
			changed: ""
		};
		const model = (0, vue_exports.computed)(() => modelId.value === "neu" ? BLANK : MODELS.find((m) => m.id === modelId.value));
		const filtered = (0, vue_exports.computed)(() => filters.q.trim() !== "" || filters.marke !== "" || filters.saison !== "");
		function priceFrom(m) {
			return Math.min(...m.sizes.map((s) => s.priceCents));
		}
		const list = (0, vue_exports.computed)(() => {
			const squeeze = (text) => text.toLowerCase().replace(/\s+/g, "");
			const q = squeeze(filters.q);
			const found = MODELS.filter((m) => (q === "" || squeeze(`${m.brand} ${m.model} ${m.sizes.map((s) => s.size).join(" ")}`).includes(q)) && (filters.marke === "" || m.brand === filters.marke) && (filters.saison === "" || m.season === filters.saison));
			const way = order.richtung === "auf" ? 1 : -1;
			return found.sort((a, b) => {
				if (order.sort === "preis") return way * (priceFrom(a) - priceFrom(b));
				if (order.sort === "geaendert") return way * a.changed.localeCompare(b.changed);
				return way * (a.brand.localeCompare(b.brand, "de") || a.model.localeCompare(b.model, "de"));
			});
		});
		function sortBy(column) {
			order.richtung = order.sort === column && order.richtung === "auf" ? "ab" : "auf";
			order.sort = column;
		}
		function reset() {
			Object.assign(filters, {
				q: "",
				marke: "",
				saison: ""
			});
		}
		const sizeLines = (0, vue_exports.computed)(() => MODELS.reduce((n, m) => n + m.sizes.length, 0));
		function missingLabels(m) {
			return m.sizes.filter((s) => s.label === null).length;
		}
		function suppliers(m) {
			return new Set(m.sizes.map((s) => s.supplier)).size;
		}
		function diameters(m) {
			const list = [...new Set(m.sizes.map((s) => Number(s.size.slice(-2))))].sort((a, b) => a - b);
			return list.length === 1 ? zoll(list[0] ?? 0) : withUnit(`${list[0]}–${list[list.length - 1]}`, "Zoll");
		}
		function twice(m, size) {
			return m.sizes.filter((s) => s.size === size).length > 1;
		}
		function address(id) {
			const url = new URL(window.location.href);
			if (id === null) url.searchParams.delete("modell");
			else url.searchParams.set("modell", id);
			return url;
		}
		function show(id) {
			modelId.value = id;
			editing.value = null;
			uploadNote.value = false;
			window.scrollTo({ top: 0 });
			(0, vue_exports.nextTick)(() => document.querySelector(".adm-page__title")?.focus({ preventScroll: true }));
		}
		function open(id) {
			window.history.pushState({
				...window.history.state,
				skizzeModell: id
			}, "", address(id));
			show(id);
		}
		function back() {
			show(known(new URL(window.location.href).searchParams.get("modell")));
		}
		(0, vue_exports.onMounted)(() => {
			window.history.replaceState(window.history.state, "", address(modelId.value));
			window.addEventListener("popstate", back);
		});
		(0, vue_exports.onBeforeUnmount)(() => window.removeEventListener("popstate", back));
		const context = (0, vue_exports.computed)(() => model.value ? `${anzahl(model.value.sizes.length, "Größe", "Größen")} · ${anzahl(suppliers(model.value), "Lieferant", "Lieferanten")} · Skizze` : `${anzahl(MODELS.length, "Modell", "Modelle")} · ${anzahl(sizeLines.value, "Größe", "Größen")}${filtered.value ? " · gefiltert" : ""} · Skizze`);
		const title = (0, vue_exports.computed)(() => model.value === void 0 ? "Reifen" : model.value.id === "neu" ? "Neues Reifenmodell" : `${model.value.brand} ${model.value.model}`);
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "rk" }, _attrs))} data-v-36678e5c>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(SketchBanner_default, { note: "So sollen Reifen künftig gepflegt werden: je Modell Fotos und Größen, je Größe Lieferant, Preis und EU-Reifenlabel. Alle Werte sind Beispiele." }, null, _parent));
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, {
				title: title.value,
				context: context.value
			}, {
				primary: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (model.value) {
							_push(`<button class="btn btn--secondary" type="button" data-v-36678e5c${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "chevron-left",
								size: 20
							}, null, _parent, _scopeId));
							_push(` Alle Reifen </button>`);
						} else {
							_push(`<button class="btn btn--primary" type="button" data-v-36678e5c${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "plus",
								size: 20
							}, null, _parent, _scopeId));
							_push(` Neues Reifenmodell </button>`);
						}
					} else return [model.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
						key: 0,
						class: "btn btn--secondary",
						type: "button",
						onClick: ($event) => open(null)
					}, [(0, vue_exports.createVNode)(AdminIcon_default, {
						name: "chevron-left",
						size: 20
					}), (0, vue_exports.createTextVNode)(" Alle Reifen ")], 8, ["onClick"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
						key: 1,
						class: "btn btn--primary",
						type: "button",
						onClick: ($event) => open("neu")
					}, [(0, vue_exports.createVNode)(AdminIcon_default, {
						name: "plus",
						size: 20
					}), (0, vue_exports.createTextVNode)(" Neues Reifenmodell ")], 8, ["onClick"]))];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<section class="rk-note" aria-labelledby="rk-question-h" data-v-36678e5c${_scopeId}><h2 id="rk-question-h" class="rk-note__title" data-v-36678e5c${_scopeId}>Frage an euch</h2><p class="rk-note__text" data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(SUPPLIER_QUESTION))}</p><p class="rk-note__text rk-note__text--quiet" data-v-36678e5c${_scopeId}>Bis zu eurer Antwort entscheiden wir das nicht.`);
						if (model.value?.id === (0, vue_exports.unref)(MODELS)[0]?.id) _push(`<!--[--> In dieser Skizze kommt 225/40 R18 von zwei Lieferanten, zu zwei Preisen.<!--]-->`);
						else _push(`<!---->`);
						_push(`</p></section>`);
						if (!model.value) {
							_push(`<!--[--><form class="rk-search" role="search" data-v-36678e5c${_scopeId}><div class="form-field rk-search__q" data-v-36678e5c${_scopeId}><label class="form-field__label" for="rk-q" data-v-36678e5c${_scopeId}>Suche</label><input id="rk-q"${(0, server_renderer_exports.ssrRenderAttr)("value", filters.q)} class="input" type="search" placeholder="Marke, Modell oder Größe wie 225/40 R18" autocomplete="off" data-v-36678e5c${_scopeId}></div><div class="form-field" data-v-36678e5c${_scopeId}><label class="form-field__label" for="rk-marke" data-v-36678e5c${_scopeId}>Marke</label><select id="rk-marke" class="input" data-v-36678e5c${_scopeId}><option value="" data-v-36678e5c${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(filters.marke) ? (0, server_renderer_exports.ssrLooseContain)(filters.marke, "") : (0, server_renderer_exports.ssrLooseEqual)(filters.marke, "")) ? " selected" : ""}${_scopeId}>Alle</option><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(TYRE_BRANDS), (brand) => {
								_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", brand)} data-v-36678e5c${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(filters.marke) ? (0, server_renderer_exports.ssrLooseContain)(filters.marke, brand) : (0, server_renderer_exports.ssrLooseEqual)(filters.marke, brand)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(brand)}</option>`);
							});
							_push(`<!--]--></select></div><div class="form-field" data-v-36678e5c${_scopeId}><label class="form-field__label" for="rk-saison" data-v-36678e5c${_scopeId}>Saison</label><select id="rk-saison" class="input" data-v-36678e5c${_scopeId}><option value="" data-v-36678e5c${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(filters.saison) ? (0, server_renderer_exports.ssrLooseContain)(filters.saison, "") : (0, server_renderer_exports.ssrLooseEqual)(filters.saison, "")) ? " selected" : ""}${_scopeId}>Alle</option><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(SEASONS), (season) => {
								_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", season.value)} data-v-36678e5c${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(filters.saison) ? (0, server_renderer_exports.ssrLooseContain)(filters.saison, season.value) : (0, server_renderer_exports.ssrLooseEqual)(filters.saison, season.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(season.label)}</option>`);
							});
							_push(`<!--]--></select></div><div class="rk-search__actions" data-v-36678e5c${_scopeId}>`);
							if (filtered.value) _push(`<button class="btn btn--ghost" type="button" data-v-36678e5c${_scopeId}>Zurücksetzen</button>`);
							else _push(`<!---->`);
							_push(`</div></form>`);
							if (list.value.length === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
								kind: "filtered",
								total: (0, vue_exports.unref)(MODELS).length,
								onReset: reset
							}, null, _parent, _scopeId));
							else {
								_push(`<!--[--><div class="adm-panel" data-v-36678e5c${_scopeId}><table class="adm-table rk-table" data-v-36678e5c${_scopeId}><caption class="visually-hidden" data-v-36678e5c${_scopeId}>Reifenmodelle</caption><thead data-v-36678e5c${_scopeId}><tr data-v-36678e5c${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(AdminSortHeader_default, {
									label: "Reifen",
									column: "reifen",
									sort: order.sort,
									richtung: order.richtung,
									onSort: sortBy
								}, null, _parent, _scopeId));
								_push(`<th scope="col" data-v-36678e5c${_scopeId}>Saison</th><th scope="col" data-v-36678e5c${_scopeId}>Größen</th>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(AdminSortHeader_default, {
									label: "Preis ab",
									column: "preis",
									sort: order.sort,
									richtung: order.richtung,
									num: "",
									onSort: sortBy
								}, null, _parent, _scopeId));
								_push(`<th scope="col" class="num" data-v-36678e5c${_scopeId}>Lieferanten</th><th scope="col" data-v-36678e5c${_scopeId}>EU-Label</th>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(AdminSortHeader_default, {
									label: "Geändert",
									column: "geaendert",
									sort: order.sort,
									richtung: order.richtung,
									onSort: sortBy
								}, null, _parent, _scopeId));
								_push(`</tr></thead><tbody data-v-36678e5c${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(list.value, (item) => {
									_push(`<tr class="rk-row" data-v-36678e5c${_scopeId}><td data-label="Reifen" data-v-36678e5c${_scopeId}><span class="rk-name" data-v-36678e5c${_scopeId}><span class="${(0, server_renderer_exports.ssrRenderClass)([{ "rk-thumb--none": item.photos === 0 }, "rk-thumb"])}" data-v-36678e5c${_scopeId}>`);
									if (item.photos > 0) _push((0, server_renderer_exports.ssrRenderComponent)(TyrePicture_default, {
										px: 36,
										caption: ""
									}, null, _parent, _scopeId));
									else _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "media",
										size: 20
									}, null, _parent, _scopeId));
									_push(`</span><span data-v-36678e5c${_scopeId}><button class="rk-open" type="button" data-v-36678e5c${_scopeId}><span class="rk-brand" data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.brand)}</span> ${(0, server_renderer_exports.ssrInterpolate)(item.model)}</button><span class="adm-table__sub" data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.photos === 0 ? "kein Foto" : (0, vue_exports.unref)(anzahl)(item.photos, "Foto", "Fotos"))}</span></span></span></td><td data-label="Saison" data-v-36678e5c${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(SeasonMark_default, { season: item.season }, null, _parent, _scopeId));
									_push(`</td><td data-label="Größen" data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(anzahl)(item.sizes.length, "Größe", "Größen"))}, ${(0, server_renderer_exports.ssrInterpolate)(diameters(item))}</td><td class="num" data-label="Preis ab" data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(priceFrom(item)))}</td><td class="num" data-label="Lieferanten" data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(suppliers(item))}</td><td data-label="EU-Label" data-v-36678e5c${_scopeId}>`);
									if (missingLabels(item)) _push(`<span class="adm-tag adm-tag--warn" data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(missingLabels(item) === 1 ? "1 Größe ohne Label" : `${missingLabels(item)} Größen ohne Label`)}</span>`);
									else _push(`<!--[-->vollständig<!--]-->`);
									_push(`</td><td data-label="Geändert" data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(item.changed)}</td></tr>`);
								});
								_push(`<!--]--></tbody></table></div><p class="adm-note rk-scale" data-v-36678e5c${_scopeId}> Bei Hunderten von Reifen zeigt die Liste 50 je Seite; Suche, Filter und Sortierung bleiben beim Blättern erhalten. </p><!--]-->`);
							}
							_push(`<!--]-->`);
						} else {
							_push(`<!--[--><section class="adm-section" aria-labelledby="rk-photos-h" data-v-36678e5c${_scopeId}><div class="adm-section__head" data-v-36678e5c${_scopeId}><h2 id="rk-photos-h" class="adm-section__title" data-v-36678e5c${_scopeId}>Fotos</h2></div><p class="adm-note" data-v-36678e5c${_scopeId}>Bis zu vier Fotos je Modell (Seite, Lauffläche, Profil, schräg); sie gelten für alle seine Größen. Das erste ist das Hauptbild im Shop. Hochladen und Sortieren wie bei den Felgen.</p><ul class="rk-photos" data-v-36678e5c${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(4, (n) => {
								_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{ "rk-photo--empty": n > model.value.photos }, "rk-photo"])}" data-v-36678e5c${_scopeId}>`);
								if (n <= model.value.photos) _push((0, server_renderer_exports.ssrRenderComponent)(TyrePicture_default, {
									px: 120,
									caption: n === 1 ? "Beispielbild · Hauptbild" : "Beispielbild"
								}, null, _parent, _scopeId));
								else {
									_push(`<button class="rk-photo__add" type="button" data-v-36678e5c${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "plus",
										size: 20
									}, null, _parent, _scopeId));
									_push(` Foto hinzufügen </button>`);
								}
								_push(`</li>`);
							});
							_push(`<!--]--></ul>`);
							if (uploadNote.value) _push(`<p class="adm-note" role="status" data-v-36678e5c${_scopeId}>In der Skizze wird kein Foto hochgeladen. Im echten Admin öffnet sich hier die Dateiauswahl, wie bei den Felgen.</p>`);
							else _push(`<!---->`);
							_push(`</section><section class="adm-section" aria-labelledby="rk-facts-h" data-v-36678e5c${_scopeId}><div class="adm-section__head" data-v-36678e5c${_scopeId}><h2 id="rk-facts-h" class="adm-section__title" data-v-36678e5c${_scopeId}>Modell</h2></div><div class="rk-facts" data-v-36678e5c${_scopeId}><div class="form-field" data-v-36678e5c${_scopeId}><label class="form-field__label" for="rk-brand" data-v-36678e5c${_scopeId}>Marke</label><select id="rk-brand" class="input"${(0, server_renderer_exports.ssrRenderAttr)("value", model.value.brand)} data-v-36678e5c${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(TYRE_BRANDS), (brand) => {
								_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", brand)} data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(brand)}</option>`);
							});
							_push(`<!--]--></select></div><div class="form-field" data-v-36678e5c${_scopeId}><label class="form-field__label" for="rk-model" data-v-36678e5c${_scopeId}>Modell</label><input id="rk-model" class="input" type="text"${(0, server_renderer_exports.ssrRenderAttr)("value", model.value.model)} data-v-36678e5c${_scopeId}></div><fieldset class="form-field rk-fieldset rk-facts__season" data-v-36678e5c${_scopeId}><legend class="form-field__label" data-v-36678e5c${_scopeId}>Saison</legend><div class="rk-seg" data-v-36678e5c${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(SEASONS), (season) => {
								_push(`<label class="adm-chip" data-v-36678e5c${_scopeId}><input class="visually-hidden" type="radio" name="rk-season"${(0, server_renderer_exports.ssrRenderAttr)("value", season.value)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(season.value === model.value.season) ? " checked" : ""} data-v-36678e5c${_scopeId}> ${(0, server_renderer_exports.ssrInterpolate)(season.label)}</label>`);
							});
							_push(`<!--]--></div></fieldset></div></section><section class="adm-section" aria-labelledby="rk-sizes-h" data-v-36678e5c${_scopeId}><div class="adm-section__head" data-v-36678e5c${_scopeId}><h2 id="rk-sizes-h" class="adm-section__title" data-v-36678e5c${_scopeId}>Größen</h2><button class="btn btn--ghost" type="button" data-v-36678e5c${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "plus",
								size: 20
							}, null, _parent, _scopeId));
							_push(` Größe hinzufügen</button></div><p class="adm-note" data-v-36678e5c${_scopeId}>Je Größe: Lastindex und Geschwindigkeitssymbol, Lieferant, Preis, Verfügbarkeit und das EU-Reifenlabel. Ohne vollständiges Label bietet der Shop die Größe nicht an.</p>`);
							if (model.value.sizes.length === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
								kind: "empty",
								text: "Noch keine Größe. Leg die erste mit „Größe hinzufügen“ an: Größe mit Lastindex und Symbol, Lieferant, Preis und EU-Reifenlabel."
							}, null, _parent, _scopeId));
							else {
								_push(`<div class="adm-panel" data-v-36678e5c${_scopeId}><table class="adm-table rk-sizes" data-v-36678e5c${_scopeId}><caption class="visually-hidden" data-v-36678e5c${_scopeId}>Größen von ${(0, server_renderer_exports.ssrInterpolate)(model.value.brand)} ${(0, server_renderer_exports.ssrInterpolate)(model.value.model)}</caption><thead data-v-36678e5c${_scopeId}><tr data-v-36678e5c${_scopeId}><th scope="col" data-v-36678e5c${_scopeId}>Größe</th><th scope="col" data-v-36678e5c${_scopeId}>Lieferant</th><th scope="col" class="num" data-v-36678e5c${_scopeId}>Preis</th><th scope="col" data-v-36678e5c${_scopeId}>Verfügbar</th><th scope="col" data-v-36678e5c${_scopeId}>EU-Label</th><th scope="col" data-v-36678e5c${_scopeId}>EPREL</th></tr></thead><tbody data-v-36678e5c${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(model.value.sizes, (line) => {
									_push(`<!--[--><tr data-v-36678e5c${_scopeId}><td data-label="Größe" data-v-36678e5c${_scopeId}><button class="rk-open" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", editing.value === line.id)} data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.size)} ${(0, server_renderer_exports.ssrInterpolate)(line.li)}${(0, server_renderer_exports.ssrInterpolate)(line.si)}</button></td><td data-label="Lieferant" data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.supplier)} `);
									if (twice(model.value, line.size)) _push(`<span class="adm-tag adm-tag--warn" data-v-36678e5c${_scopeId}>gleiche Größe, anderer Preis</span>`);
									else _push(`<!---->`);
									_push(`</td><td class="num" data-label="Preis" data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(line.priceCents))}</td><td data-label="Verfügbar" data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.available ? "ja" : "nein")}</td><td data-label="EU-Label" data-v-36678e5c${_scopeId}>`);
									if (line.label) {
										_push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(line.label.fuel)} · ${(0, server_renderer_exports.ssrInterpolate)(line.label.wet)} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)(line.label.noiseDb, "dB"))} (${(0, server_renderer_exports.ssrInterpolate)(line.label.noiseClass)})`);
										if (line.label.snow) _push(`<!--[--> · Schnee<!--]-->`);
										else _push(`<!---->`);
										if (line.label.ice) _push(`<!--[--> · Eis<!--]-->`);
										else _push(`<!---->`);
										_push(`<!--]-->`);
									} else _push(`<span class="adm-tag adm-tag--warn" data-v-36678e5c${_scopeId}>fehlt</span>`);
									_push(`</td><td data-label="EPREL" data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.label?.eprel ?? "–")}</td></tr>`);
									if (editing.value === line.id) {
										_push(`<tr class="rk-edit" data-v-36678e5c${_scopeId}><td colspan="6" data-v-36678e5c${_scopeId}><div class="rk-editform" data-v-36678e5c${_scopeId}><div class="form-field" data-v-36678e5c${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `rk-size-${line.id}`)} data-v-36678e5c${_scopeId}>Größe</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `rk-size-${line.id}`)} class="input" type="text"${(0, server_renderer_exports.ssrRenderAttr)("value", `${line.size} ${line.li}${line.si}`)} data-v-36678e5c${_scopeId}></div><div class="form-field" data-v-36678e5c${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `rk-sup-${line.id}`)} data-v-36678e5c${_scopeId}>Lieferant</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `rk-sup-${line.id}`)} class="input"${(0, server_renderer_exports.ssrRenderAttr)("value", line.supplier)} data-v-36678e5c${_scopeId}><!--[-->`);
										(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(SUPPLIERS), (s) => {
											_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", s)} data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(s)}</option>`);
										});
										_push(`<!--]--></select></div><div class="form-field" data-v-36678e5c${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `rk-price-${line.id}`)} data-v-36678e5c${_scopeId}>Preis je Reifen (€)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `rk-price-${line.id}`)} class="input" type="text" inputmode="decimal"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(formatMoney)(line.priceCents).replace(/\s*€$/, ""))} data-v-36678e5c${_scopeId}></div><div class="form-field" data-v-36678e5c${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `rk-av-${line.id}`)} data-v-36678e5c${_scopeId}>Verfügbarkeit</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `rk-av-${line.id}`)} class="input"${(0, server_renderer_exports.ssrRenderAttr)("value", line.available ? "ja" : "nein")} data-v-36678e5c${_scopeId}><option value="ja" data-v-36678e5c${_scopeId}>Verfügbar</option><option value="nein" data-v-36678e5c${_scopeId}>Nicht verfügbar</option></select></div><div class="form-field" data-v-36678e5c${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `rk-fuel-${line.id}`)} data-v-36678e5c${_scopeId}>Kraftstoffeffizienz</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `rk-fuel-${line.id}`)} class="input"${(0, server_renderer_exports.ssrRenderAttr)("value", line.label?.fuel ?? "")} data-v-36678e5c${_scopeId}><option value="" data-v-36678e5c${_scopeId}>–</option><!--[-->`);
										(0, server_renderer_exports.ssrRenderList)([
											"A",
											"B",
											"C",
											"D",
											"E"
										], (c) => {
											_push(`<option data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(c)}</option>`);
										});
										_push(`<!--]--></select></div><div class="form-field" data-v-36678e5c${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `rk-wet-${line.id}`)} data-v-36678e5c${_scopeId}>Nasshaftung</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `rk-wet-${line.id}`)} class="input"${(0, server_renderer_exports.ssrRenderAttr)("value", line.label?.wet ?? "")} data-v-36678e5c${_scopeId}><option value="" data-v-36678e5c${_scopeId}>–</option><!--[-->`);
										(0, server_renderer_exports.ssrRenderList)([
											"A",
											"B",
											"C",
											"D",
											"E"
										], (c) => {
											_push(`<option data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(c)}</option>`);
										});
										_push(`<!--]--></select></div><div class="form-field" data-v-36678e5c${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `rk-db-${line.id}`)} data-v-36678e5c${_scopeId}>Rollgeräusch (dB)</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `rk-db-${line.id}`)} class="input" type="text" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("value", line.label?.noiseDb ?? "")} data-v-36678e5c${_scopeId}></div><div class="form-field" data-v-36678e5c${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `rk-nc-${line.id}`)} data-v-36678e5c${_scopeId}>Geräuschklasse</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `rk-nc-${line.id}`)} class="input"${(0, server_renderer_exports.ssrRenderAttr)("value", line.label?.noiseClass ?? "")} data-v-36678e5c${_scopeId}><option value="" data-v-36678e5c${_scopeId}>–</option><!--[-->`);
										(0, server_renderer_exports.ssrRenderList)([
											"A",
											"B",
											"C"
										], (c) => {
											_push(`<option data-v-36678e5c${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(c)}</option>`);
										});
										_push(`<!--]--></select></div><div class="form-field" data-v-36678e5c${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `rk-eprel-${line.id}`)} data-v-36678e5c${_scopeId}>EPREL-Nummer</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `rk-eprel-${line.id}`)} class="input" type="text" inputmode="numeric"${(0, server_renderer_exports.ssrRenderAttr)("value", line.label?.eprel ?? "")} data-v-36678e5c${_scopeId}></div><fieldset class="form-field rk-fieldset" data-v-36678e5c${_scopeId}><legend class="form-field__label" data-v-36678e5c${_scopeId}>Symbole</legend><label class="check" data-v-36678e5c${_scopeId}><input type="checkbox"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(line.label?.snow === true) ? " checked" : ""} data-v-36678e5c${_scopeId}> Schneegriffigkeit</label><label class="check" data-v-36678e5c${_scopeId}><input type="checkbox"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(line.label?.ice === true) ? " checked" : ""} data-v-36678e5c${_scopeId}> Eisgriffigkeit</label></fieldset></div><div class="rk-editbar" data-v-36678e5c${_scopeId}><span class="rk-editbar__status" data-v-36678e5c${_scopeId}>In der Skizze wird nichts gespeichert.</span><button class="btn btn--ghost" type="button" data-v-36678e5c${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="button" data-v-36678e5c${_scopeId}>Speichern</button></div></td></tr>`);
									} else _push(`<!---->`);
									_push(`<!--]-->`);
								});
								_push(`<!--]--></tbody></table></div>`);
							}
							if (editing.value === "neu") _push(`<p class="adm-note" role="status" data-v-36678e5c${_scopeId}>In der Skizze wird keine Größe angelegt. Eine neue Größe hat dieselben Felder wie eine bestehende; ein Klick auf eine Größe öffnet sie.</p>`);
							else _push(`<!---->`);
							_push(`</section><aside class="rk-note" aria-labelledby="rk-needs-h" data-v-36678e5c${_scopeId}><h2 id="rk-needs-h" class="rk-note__title" data-v-36678e5c${_scopeId}>Was wir von euch brauchen</h2><ul class="rk-note__list" data-v-36678e5c${_scopeId}><li data-v-36678e5c${_scopeId}>Fotos je Reifenmodell: mindestens eines, bis zu vier.</li><li data-v-36678e5c${_scopeId}>Die Daten des EU-Reifenlabels je Größe, mit der EPREL-Nummer.</li><li data-v-36678e5c${_scopeId}>Die Antwort auf die Frage oben: mehrere Lieferanten für denselben Reifen und welcher Preis dann gilt.</li></ul></aside><!--]-->`);
						}
					} else return [(0, vue_exports.createVNode)("section", {
						class: "rk-note",
						"aria-labelledby": "rk-question-h"
					}, [
						(0, vue_exports.createVNode)("h2", {
							id: "rk-question-h",
							class: "rk-note__title"
						}, "Frage an euch"),
						(0, vue_exports.createVNode)("p", { class: "rk-note__text" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(SUPPLIER_QUESTION)), 1),
						(0, vue_exports.createVNode)("p", { class: "rk-note__text rk-note__text--quiet" }, [(0, vue_exports.createTextVNode)("Bis zu eurer Antwort entscheiden wir das nicht."), model.value?.id === (0, vue_exports.unref)(MODELS)[0]?.id ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" In dieser Skizze kommt 225/40 R18 von zwei Lieferanten, zu zwei Preisen.")], 64)) : (0, vue_exports.createCommentVNode)("", true)])
					]), !model.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)("form", {
						class: "rk-search",
						role: "search",
						onSubmit: (0, vue_exports.withModifiers)(() => {}, ["prevent"])
					}, [
						(0, vue_exports.createVNode)("div", { class: "form-field rk-search__q" }, [(0, vue_exports.createVNode)("label", {
							class: "form-field__label",
							for: "rk-q"
						}, "Suche"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
							id: "rk-q",
							"onUpdate:modelValue": ($event) => filters.q = $event,
							class: "input",
							type: "search",
							placeholder: "Marke, Modell oder Größe wie 225/40 R18",
							autocomplete: "off"
						}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, filters.q]])]),
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
							class: "form-field__label",
							for: "rk-marke"
						}, "Marke"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
							id: "rk-marke",
							"onUpdate:modelValue": ($event) => filters.marke = $event,
							class: "input"
						}, [(0, vue_exports.createVNode)("option", { value: "" }, "Alle"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)((0, vue_exports.unref)(TYRE_BRANDS), (brand) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
								key: brand,
								value: brand
							}, (0, vue_exports.toDisplayString)(brand), 9, ["value"]);
						}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, filters.marke]])]),
						(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
							class: "form-field__label",
							for: "rk-saison"
						}, "Saison"), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
							id: "rk-saison",
							"onUpdate:modelValue": ($event) => filters.saison = $event,
							class: "input"
						}, [(0, vue_exports.createVNode)("option", { value: "" }, "Alle"), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)((0, vue_exports.unref)(SEASONS), (season) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
								key: season.value,
								value: season.value
							}, (0, vue_exports.toDisplayString)(season.label), 9, ["value"]);
						}), 128))], 8, ["onUpdate:modelValue"]), [[vue_exports.vModelSelect, filters.saison]])]),
						(0, vue_exports.createVNode)("div", { class: "rk-search__actions" }, [filtered.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
							key: 0,
							class: "btn btn--ghost",
							type: "button",
							onClick: reset
						}, "Zurücksetzen")) : (0, vue_exports.createCommentVNode)("", true)])
					], 40, ["onSubmit"]), list.value.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
						key: 0,
						kind: "filtered",
						total: (0, vue_exports.unref)(MODELS).length,
						onReset: reset
					}, null, 8, ["total"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createVNode)("div", { class: "adm-panel" }, [(0, vue_exports.createVNode)("table", { class: "adm-table rk-table" }, [
						(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Reifenmodelle"),
						(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
							(0, vue_exports.createVNode)(AdminSortHeader_default, {
								label: "Reifen",
								column: "reifen",
								sort: order.sort,
								richtung: order.richtung,
								onSort: sortBy
							}, null, 8, ["sort", "richtung"]),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Saison"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "Größen"),
							(0, vue_exports.createVNode)(AdminSortHeader_default, {
								label: "Preis ab",
								column: "preis",
								sort: order.sort,
								richtung: order.richtung,
								num: "",
								onSort: sortBy
							}, null, 8, ["sort", "richtung"]),
							(0, vue_exports.createVNode)("th", {
								scope: "col",
								class: "num"
							}, "Lieferanten"),
							(0, vue_exports.createVNode)("th", { scope: "col" }, "EU-Label"),
							(0, vue_exports.createVNode)(AdminSortHeader_default, {
								label: "Geändert",
								column: "geaendert",
								sort: order.sort,
								richtung: order.richtung,
								onSort: sortBy
							}, null, 8, ["sort", "richtung"])
						])]),
						(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(list.value, (item) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", {
								key: item.id,
								class: "rk-row"
							}, [
								(0, vue_exports.createVNode)("td", { "data-label": "Reifen" }, [(0, vue_exports.createVNode)("span", { class: "rk-name" }, [(0, vue_exports.createVNode)("span", { class: ["rk-thumb", { "rk-thumb--none": item.photos === 0 }] }, [item.photos > 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(TyrePicture_default, {
									key: 0,
									px: 36,
									caption: ""
								})) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminIcon_default, {
									key: 1,
									name: "media",
									size: 20
								}))], 2), (0, vue_exports.createVNode)("span", null, [(0, vue_exports.createVNode)("button", {
									class: "rk-open",
									type: "button",
									onClick: ($event) => open(item.id)
								}, [(0, vue_exports.createVNode)("span", { class: "rk-brand" }, (0, vue_exports.toDisplayString)(item.brand), 1), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(item.model), 1)], 8, ["onClick"]), (0, vue_exports.createVNode)("span", { class: "adm-table__sub" }, (0, vue_exports.toDisplayString)(item.photos === 0 ? "kein Foto" : (0, vue_exports.unref)(anzahl)(item.photos, "Foto", "Fotos")), 1)])])]),
								(0, vue_exports.createVNode)("td", { "data-label": "Saison" }, [(0, vue_exports.createVNode)(SeasonMark_default, { season: item.season }, null, 8, ["season"])]),
								(0, vue_exports.createVNode)("td", { "data-label": "Größen" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(anzahl)(item.sizes.length, "Größe", "Größen")) + ", " + (0, vue_exports.toDisplayString)(diameters(item)), 1),
								(0, vue_exports.createVNode)("td", {
									class: "num",
									"data-label": "Preis ab"
								}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(priceFrom(item))), 1),
								(0, vue_exports.createVNode)("td", {
									class: "num",
									"data-label": "Lieferanten"
								}, (0, vue_exports.toDisplayString)(suppliers(item)), 1),
								(0, vue_exports.createVNode)("td", { "data-label": "EU-Label" }, [missingLabels(item) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: "adm-tag adm-tag--warn"
								}, (0, vue_exports.toDisplayString)(missingLabels(item) === 1 ? "1 Größe ohne Label" : `${missingLabels(item)} Größen ohne Label`), 1)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("vollständig")], 64))]),
								(0, vue_exports.createVNode)("td", { "data-label": "Geändert" }, (0, vue_exports.toDisplayString)(item.changed), 1)
							]);
						}), 128))])
					])]), (0, vue_exports.createVNode)("p", { class: "adm-note rk-scale" }, " Bei Hunderten von Reifen zeigt die Liste 50 je Seite; Suche, Filter und Sortierung bleiben beim Blättern erhalten. ")], 64))], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "rk-photos-h"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "rk-photos-h",
								class: "adm-section__title"
							}, "Fotos")]),
							(0, vue_exports.createVNode)("p", { class: "adm-note" }, "Bis zu vier Fotos je Modell (Seite, Lauffläche, Profil, schräg); sie gelten für alle seine Größen. Das erste ist das Hauptbild im Shop. Hochladen und Sortieren wie bei den Felgen."),
							(0, vue_exports.createVNode)("ul", { class: "rk-photos" }, [((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(4, (n) => {
								return (0, vue_exports.createVNode)("li", {
									key: n,
									class: ["rk-photo", { "rk-photo--empty": n > model.value.photos }]
								}, [n <= model.value.photos ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(TyrePicture_default, {
									key: 0,
									px: 120,
									caption: n === 1 ? "Beispielbild · Hauptbild" : "Beispielbild"
								}, null, 8, ["caption"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 1,
									class: "rk-photo__add",
									type: "button",
									onClick: ($event) => uploadNote.value = true
								}, [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "plus",
									size: 20
								}), (0, vue_exports.createTextVNode)(" Foto hinzufügen ")], 8, ["onClick"]))], 2);
							}), 64))]),
							uploadNote.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-note",
								role: "status"
							}, "In der Skizze wird kein Foto hochgeladen. Im echten Admin öffnet sich hier die Dateiauswahl, wie bei den Felgen.")) : (0, vue_exports.createCommentVNode)("", true)
						]),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "rk-facts-h"
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "rk-facts-h",
							class: "adm-section__title"
						}, "Modell")]), (0, vue_exports.createVNode)("div", { class: "rk-facts" }, [
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "rk-brand"
							}, "Marke"), (0, vue_exports.createVNode)("select", {
								id: "rk-brand",
								class: "input",
								value: model.value.brand
							}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)((0, vue_exports.unref)(TYRE_BRANDS), (brand) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
									key: brand,
									value: brand
								}, (0, vue_exports.toDisplayString)(brand), 9, ["value"]);
							}), 128))], 8, ["value"])]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
								class: "form-field__label",
								for: "rk-model"
							}, "Modell"), (0, vue_exports.createVNode)("input", {
								id: "rk-model",
								class: "input",
								type: "text",
								value: model.value.model
							}, null, 8, ["value"])]),
							(0, vue_exports.createVNode)("fieldset", { class: "form-field rk-fieldset rk-facts__season" }, [(0, vue_exports.createVNode)("legend", { class: "form-field__label" }, "Saison"), (0, vue_exports.createVNode)("div", { class: "rk-seg" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)((0, vue_exports.unref)(SEASONS), (season) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("label", {
									key: season.value,
									class: "adm-chip"
								}, [(0, vue_exports.createVNode)("input", {
									class: "visually-hidden",
									type: "radio",
									name: "rk-season",
									value: season.value,
									checked: season.value === model.value.season
								}, null, 8, ["value", "checked"]), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(season.label), 1)]);
							}), 128))])])
						])]),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "rk-sizes-h"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "rk-sizes-h",
								class: "adm-section__title"
							}, "Größen"), (0, vue_exports.createVNode)("button", {
								class: "btn btn--ghost",
								type: "button",
								onClick: ($event) => editing.value = "neu"
							}, [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "plus",
								size: 20
							}), (0, vue_exports.createTextVNode)(" Größe hinzufügen")], 8, ["onClick"])]),
							(0, vue_exports.createVNode)("p", { class: "adm-note" }, "Je Größe: Lastindex und Geschwindigkeitssymbol, Lieferant, Preis, Verfügbarkeit und das EU-Reifenlabel. Ohne vollständiges Label bietet der Shop die Größe nicht an."),
							model.value.sizes.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
								key: 0,
								kind: "empty",
								text: "Noch keine Größe. Leg die erste mit „Größe hinzufügen“ an: Größe mit Lastindex und Symbol, Lieferant, Preis und EU-Reifenlabel."
							})) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 1,
								class: "adm-panel"
							}, [(0, vue_exports.createVNode)("table", { class: "adm-table rk-sizes" }, [
								(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Größen von " + (0, vue_exports.toDisplayString)(model.value.brand) + " " + (0, vue_exports.toDisplayString)(model.value.model), 1),
								(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Größe"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Lieferant"),
									(0, vue_exports.createVNode)("th", {
										scope: "col",
										class: "num"
									}, "Preis"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Verfügbar"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "EU-Label"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "EPREL")
								])]),
								(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(model.value.sizes, (line) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: line.id }, [(0, vue_exports.createVNode)("tr", null, [
										(0, vue_exports.createVNode)("td", { "data-label": "Größe" }, [(0, vue_exports.createVNode)("button", {
											class: "rk-open",
											type: "button",
											"aria-expanded": editing.value === line.id,
											onClick: ($event) => editing.value = editing.value === line.id ? null : line.id
										}, (0, vue_exports.toDisplayString)(line.size) + " " + (0, vue_exports.toDisplayString)(line.li) + (0, vue_exports.toDisplayString)(line.si), 9, ["aria-expanded", "onClick"])]),
										(0, vue_exports.createVNode)("td", { "data-label": "Lieferant" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(line.supplier) + " ", 1), twice(model.value, line.size) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: "adm-tag adm-tag--warn"
										}, "gleiche Größe, anderer Preis")) : (0, vue_exports.createCommentVNode)("", true)]),
										(0, vue_exports.createVNode)("td", {
											class: "num",
											"data-label": "Preis"
										}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(line.priceCents)), 1),
										(0, vue_exports.createVNode)("td", { "data-label": "Verfügbar" }, (0, vue_exports.toDisplayString)(line.available ? "ja" : "nein"), 1),
										(0, vue_exports.createVNode)("td", { "data-label": "EU-Label" }, [line.label ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [
											(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(line.label.fuel) + " · " + (0, vue_exports.toDisplayString)(line.label.wet) + " · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(withUnit)(line.label.noiseDb, "dB")) + " (" + (0, vue_exports.toDisplayString)(line.label.noiseClass) + ")", 1),
											line.label.snow ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" · Schnee")], 64)) : (0, vue_exports.createCommentVNode)("", true),
											line.label.ice ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)(" · Eis")], 64)) : (0, vue_exports.createCommentVNode)("", true)
										], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 1,
											class: "adm-tag adm-tag--warn"
										}, "fehlt"))]),
										(0, vue_exports.createVNode)("td", { "data-label": "EPREL" }, (0, vue_exports.toDisplayString)(line.label?.eprel ?? "–"), 1)
									]), editing.value === line.id ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", {
										key: 0,
										class: "rk-edit"
									}, [(0, vue_exports.createVNode)("td", { colspan: "6" }, [(0, vue_exports.createVNode)("div", { class: "rk-editform" }, [
										(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `rk-size-${line.id}`
										}, "Größe", 8, ["for"]), (0, vue_exports.createVNode)("input", {
											id: `rk-size-${line.id}`,
											class: "input",
											type: "text",
											value: `${line.size} ${line.li}${line.si}`
										}, null, 8, ["id", "value"])]),
										(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `rk-sup-${line.id}`
										}, "Lieferant", 8, ["for"]), (0, vue_exports.createVNode)("select", {
											id: `rk-sup-${line.id}`,
											class: "input",
											value: line.supplier
										}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)((0, vue_exports.unref)(SUPPLIERS), (s) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
												key: s,
												value: s
											}, (0, vue_exports.toDisplayString)(s), 9, ["value"]);
										}), 128))], 8, ["id", "value"])]),
										(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `rk-price-${line.id}`
										}, "Preis je Reifen (€)", 8, ["for"]), (0, vue_exports.createVNode)("input", {
											id: `rk-price-${line.id}`,
											class: "input",
											type: "text",
											inputmode: "decimal",
											value: (0, vue_exports.unref)(formatMoney)(line.priceCents).replace(/\s*€$/, "")
										}, null, 8, ["id", "value"])]),
										(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `rk-av-${line.id}`
										}, "Verfügbarkeit", 8, ["for"]), (0, vue_exports.createVNode)("select", {
											id: `rk-av-${line.id}`,
											class: "input",
											value: line.available ? "ja" : "nein"
										}, [(0, vue_exports.createVNode)("option", { value: "ja" }, "Verfügbar"), (0, vue_exports.createVNode)("option", { value: "nein" }, "Nicht verfügbar")], 8, ["id", "value"])]),
										(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `rk-fuel-${line.id}`
										}, "Kraftstoffeffizienz", 8, ["for"]), (0, vue_exports.createVNode)("select", {
											id: `rk-fuel-${line.id}`,
											class: "input",
											value: line.label?.fuel ?? ""
										}, [(0, vue_exports.createVNode)("option", { value: "" }, "–"), ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)([
											"A",
											"B",
											"C",
											"D",
											"E"
										], (c) => {
											return (0, vue_exports.createVNode)("option", { key: c }, (0, vue_exports.toDisplayString)(c), 1);
										}), 64))], 8, ["id", "value"])]),
										(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `rk-wet-${line.id}`
										}, "Nasshaftung", 8, ["for"]), (0, vue_exports.createVNode)("select", {
											id: `rk-wet-${line.id}`,
											class: "input",
											value: line.label?.wet ?? ""
										}, [(0, vue_exports.createVNode)("option", { value: "" }, "–"), ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)([
											"A",
											"B",
											"C",
											"D",
											"E"
										], (c) => {
											return (0, vue_exports.createVNode)("option", { key: c }, (0, vue_exports.toDisplayString)(c), 1);
										}), 64))], 8, ["id", "value"])]),
										(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `rk-db-${line.id}`
										}, "Rollgeräusch (dB)", 8, ["for"]), (0, vue_exports.createVNode)("input", {
											id: `rk-db-${line.id}`,
											class: "input",
											type: "text",
											inputmode: "numeric",
											value: line.label?.noiseDb ?? ""
										}, null, 8, ["id", "value"])]),
										(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `rk-nc-${line.id}`
										}, "Geräuschklasse", 8, ["for"]), (0, vue_exports.createVNode)("select", {
											id: `rk-nc-${line.id}`,
											class: "input",
											value: line.label?.noiseClass ?? ""
										}, [(0, vue_exports.createVNode)("option", { value: "" }, "–"), ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)([
											"A",
											"B",
											"C"
										], (c) => {
											return (0, vue_exports.createVNode)("option", { key: c }, (0, vue_exports.toDisplayString)(c), 1);
										}), 64))], 8, ["id", "value"])]),
										(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `rk-eprel-${line.id}`
										}, "EPREL-Nummer", 8, ["for"]), (0, vue_exports.createVNode)("input", {
											id: `rk-eprel-${line.id}`,
											class: "input",
											type: "text",
											inputmode: "numeric",
											value: line.label?.eprel ?? ""
										}, null, 8, ["id", "value"])]),
										(0, vue_exports.createVNode)("fieldset", { class: "form-field rk-fieldset" }, [
											(0, vue_exports.createVNode)("legend", { class: "form-field__label" }, "Symbole"),
											(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.createVNode)("input", {
												type: "checkbox",
												checked: line.label?.snow === true
											}, null, 8, ["checked"]), (0, vue_exports.createTextVNode)(" Schneegriffigkeit")]),
											(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.createVNode)("input", {
												type: "checkbox",
												checked: line.label?.ice === true
											}, null, 8, ["checked"]), (0, vue_exports.createTextVNode)(" Eisgriffigkeit")])
										])
									]), (0, vue_exports.createVNode)("div", { class: "rk-editbar" }, [
										(0, vue_exports.createVNode)("span", { class: "rk-editbar__status" }, "In der Skizze wird nichts gespeichert."),
										(0, vue_exports.createVNode)("button", {
											class: "btn btn--ghost",
											type: "button",
											onClick: ($event) => editing.value = null
										}, "Abbrechen", 8, ["onClick"]),
										(0, vue_exports.createVNode)("button", {
											class: "btn btn--primary",
											type: "button",
											onClick: ($event) => editing.value = null
										}, "Speichern", 8, ["onClick"])
									])])])) : (0, vue_exports.createCommentVNode)("", true)], 64);
								}), 128))])
							])])),
							editing.value === "neu" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 2,
								class: "adm-note",
								role: "status"
							}, "In der Skizze wird keine Größe angelegt. Eine neue Größe hat dieselben Felder wie eine bestehende; ein Klick auf eine Größe öffnet sie.")) : (0, vue_exports.createCommentVNode)("", true)
						]),
						(0, vue_exports.createVNode)("aside", {
							class: "rk-note",
							"aria-labelledby": "rk-needs-h"
						}, [(0, vue_exports.createVNode)("h2", {
							id: "rk-needs-h",
							class: "rk-note__title"
						}, "Was wir von euch brauchen"), (0, vue_exports.createVNode)("ul", { class: "rk-note__list" }, [
							(0, vue_exports.createVNode)("li", null, "Fotos je Reifenmodell: mindestens eines, bis zu vier."),
							(0, vue_exports.createVNode)("li", null, "Die Daten des EU-Reifenlabels je Größe, mit der EPREL-Nummer."),
							(0, vue_exports.createVNode)("li", null, "Die Antwort auf die Frage oben: mehrere Lieferanten für denselben Reifen und welcher Preis dann gilt.")
						])])
					], 64))];
				}),
				_: 1
			}, _parent));
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Skizze/Reifen.vue
var _sfc_setup = Reifen_vue_vue_type_script_setup_true_lang_default.setup;
Reifen_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Skizze/Reifen.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Reifen_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Reifen_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-36678e5c"]]);
//#endregion
export { Reifen_default as default };
