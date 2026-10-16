import { a as link_default, c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as Icon_default } from "./Icon-DUS6sqAV.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { O as useShared, i as WheelOutline_default, p as priceTerms, r as useCompare } from "./useShortcuts-BS69Lz6v.js";
import { t as formatMoney } from "./num-Br8qlecZ.js";
import { t as Picture_default } from "./Picture-Fl6hr1l0.js";
import { o as entryLineOrNone, s as papersLine } from "./papers-B4aUsj_q.js";
import { t as ValueText_default } from "./ValueText-DsF8Caj6.js";
import { t as VerdictBadge_default } from "./VerdictBadge-CH46vZP2.js";
import { t as compareKeyOf } from "./rimify-DyJVZT0A.js";
//#region resources/js/Components/Compare/CompareTable.vue?vue&type=script&setup=true&lang.ts
var ENTRY_VARIES = "Je nach Reifengröße – siehe Produktseite.";
/**
* Only the Auflagen that hold for every size of this wheel (CompareRows): which size the customer will fit is decided on the
* product page, where each size's stand with it — never one blended list here.
*/
var CompareTable_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "CompareTable",
	__ssrInlineRender: true,
	props: {
		items: {},
		missing: {},
		cap: {},
		demo: { type: Boolean },
		phone: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* The comparison (docs/design/sections/home-overhaul.md §2.6): up to four wheels side by side,
		* one column each — the head with the cut-out, the stick row that keeps naming the columns
		* while the head scrolls away, then the groups *Felge · Preis · Gutachten* and the actions.
		*
		* Every figure comes from the server. With a vehicle the Gutachten rows carry the engine's
		* four-state verdict per column and the action the server decided (`buy`); without one the
		* *Freigabe* row says what it would take, and claims nothing. The page never picks a size.
		*
		* *Unterschiede hervorheben* changes weight and ink only: a row whose cells agree steps back,
		* a differing cell comes forward, nothing hides and nothing moves. The flag travels in `?diff=1`
		* so a shared link keeps it.
		*
		* Below 1024 every row scrolls sideways on its own and the page keeps them in step, so the stick
		* row can stay sticky against the page (a row inside one horizontal scroller could not).
		*/
		const props = __props;
		const shared = useShared();
		const page = usePage();
		const store = useCompare();
		const vehicle = (0, vue_exports.computed)(() => shared.value.vehicle);
		const terms = (0, vue_exports.computed)(() => priceTerms(shared.value.smallBusiness === true));
		const count = (0, vue_exports.computed)(() => props.items.length);
		(0, vue_exports.computed)(() => props.items.map(compareKeyOf));
		const root = (0, vue_exports.ref)(null);
		(0, vue_exports.ref)(null);
		const title = (0, vue_exports.computed)(() => vehicle.value ? `Felgen vergleichen für ${vehicle.value.short}` : "Felgen vergleichen");
		const listingLabel = (0, vue_exports.computed)(() => vehicle.value ? "Passende Felgen anzeigen" : "Felgen ansehen");
		/** Read from the page URL, which SSR and the client share — never from `window`. */
		function readDiff(url) {
			return new URLSearchParams(url.split("?")[1] ?? "").get("diff") === "1";
		}
		const diff = (0, vue_exports.ref)(readDiff(page.url));
		(0, vue_exports.watch)(diff, (on) => {
			if (typeof window === "undefined") return;
			const url = new URL(window.location.href);
			if (on) url.searchParams.set("diff", "1");
			else url.searchParams.delete("diff");
			window.history.replaceState(window.history.state, "", url.toString());
		});
		const VALUE_ROWS = /* @__PURE__ */ new Set([
			"sizes",
			"et",
			"lk",
			"mlb",
			"finish",
			"price",
			"docs",
			"tyres"
		]);
		function row(id, label, kind, cells, link) {
			const first = cells[0]?.text ?? "";
			return {
				id,
				label,
				kind,
				cells,
				same: cells.every((cell) => cell.text === first),
				values: VALUE_ROWS.has(id),
				link
			};
		}
		function lines(list) {
			return list.length ? {
				text: list.join(" · "),
				lines: list
			} : {
				text: "–",
				lines: ["–"]
			};
		}
		function documentLine(document) {
			const name = document.kind === "ABE" ? document.number ? `ABE Nr. ${document.number}` : "ABE" : document.kind;
			return document.example ? `${name} (Beispiel)` : name;
		}
		/** Said where the Abnahme or Eintragung depends on the size, rather than one answer for every size. */
		function conditionLines(verdict) {
			const list = verdict?.conditions ?? [];
			return verdict?.conditionsVary === true ? [...list, "Weitere Auflagen je nach Größe – siehe Produktseite."] : list;
		}
		/** The product page's own two lines (fitment/papers.ts), so the two pages never say opposite things about the papers. */
		function entryLines(verdict) {
			if (verdict === null || !verdict.sellable) return lines([]);
			const exempt = verdict.papersExempt === true;
			const papers = papersLine(exempt);
			if (verdict.entryVaries === true) return lines(papers === null ? [ENTRY_VARIES] : [ENTRY_VARIES, papers]);
			return lines(papers === null ? [entryLineOrNone(verdict.requiresEntry, exempt)] : [entryLineOrNone(verdict.requiresEntry, exempt), papers]);
		}
		const perWheel = (item) => formatMoney(item.fromPriceCents);
		const groups = (0, vue_exports.computed)(() => {
			const items = props.items;
			const gutachten = [row("docs", "Dokument", "lines", items.map((item) => lines(item.specs.documents.map(documentLine))))];
			if (vehicle.value) gutachten.push(row("verdict", "Freigabe", "verdict", items.map((item) => ({
				text: item.verdict?.status ?? "UNKNOWN",
				verdict: item.verdict
			}))), row("tyres", "Reifengrößen", "lines", items.map((item) => lines(item.verdict?.tyreSizes ?? []))), row("conditions", "Auflagen", "lines", items.map((item) => lines(conditionLines(item.verdict)))), row("entry", "Abnahme / Eintragung", "lines", items.map((item) => entryLines(item.verdict))));
			else gutachten.push(row("verdict-none", "Freigabe", "muted", items.map(() => ({ text: "Wähle dein Fahrzeug – dann zeigen wir hier, ob die Felge freigegeben ist." })), {
				href: "/felgen-suchen?zurueck=/vergleich",
				label: "Fahrzeug wählen"
			}));
			return [
				{
					id: "felge",
					label: "Felge",
					rows: [
						row("sizes", "Breite × Durchmesser", "lines", items.map((item) => lines(item.specs.sizes))),
						row("et", "Einpresstiefe", "text", items.map((item) => ({ text: item.specs.etRange }))),
						row("lk", "Lochkreis", "text", items.map((item) => ({ text: item.specs.boltPattern }))),
						row("mlb", "Mittenlochbohrung", "text", items.map((item) => ({ text: item.specs.centreBore }))),
						row("finish", "Farbe", "text", items.map((item) => ({ text: item.finishName })))
					]
				},
				{
					id: "preis",
					label: "Preis",
					rows: [row("price", "Preis pro Felge", "text", items.map((item) => ({ text: `ab ${perWheel(item)}` }))), row("legal", "Hinweis", "muted", items.map(() => ({ text: terms.value.note })))]
				},
				{
					id: "gutachten",
					label: "Gutachten",
					rows: gutachten
				}
			];
		});
		const columnId = (item) => `compare-col-${compareKeyOf(item).replace(":", "-")}`;
		const headerIds = (0, vue_exports.computed)(() => props.items.map(columnId));
		function toEntry(item) {
			return {
				modelId: item.modelId,
				finishId: item.finishId,
				slug: item.slug,
				brandName: item.brandName,
				modelName: item.modelName,
				finishName: item.finishName,
				image: item.image,
				fromPriceCents: item.fromPriceCents
			};
		}
		let corrected = false;
		/**
		* The page's items replace the store (a shared link and the tray must agree). An empty page
		* asked for nothing, and the browser holds a list: re-request once with it — once, never a loop.
		*/
		function sync() {
			if (props.items.length > 0 || props.missing > 0) {
				store.replace(props.items.map(toEntry));
				return;
			}
			if (!corrected && store.count > 0) {
				corrected = true;
				router.get("/vergleich", { f: store.query }, {
					replace: true,
					preserveScroll: true,
					preserveState: true
				});
			}
		}
		(0, vue_exports.watch)(() => props.items, sync);
		const adding = (0, vue_exports.ref)(null);
		function onRowScroll(event) {
			const source = event.target;
			if (!(source instanceof HTMLElement) || !source.classList.contains("compare__row")) return;
			const left = source.scrollLeft;
			for (const other of root.value?.querySelectorAll(".compare__row") ?? []) if (other !== source && other.scrollLeft !== left) other.scrollLeft = left;
		}
		(0, vue_exports.onMounted)(() => {
			store.hydrate();
			sync();
			root.value?.addEventListener("scroll", onRowScroll, {
				capture: true,
				passive: true
			});
		});
		(0, vue_exports.onBeforeUnmount)(() => {
			root.value?.removeEventListener("scroll", onRowScroll, { capture: true });
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({
				ref_key: "root",
				ref: root,
				class: ["compare-page", { "compare-page--phone": __props.phone }]
			}, _attrs))} data-v-89f43240><header class="compare-head" data-v-89f43240><div class="compare-head__copy" data-v-89f43240><h1 id="vergleich-title" class="h1" tabindex="-1" data-v-89f43240>${(0, server_renderer_exports.ssrInterpolate)(title.value)} `);
			if (__props.demo) _push(`<span class="badge demo-note" data-v-89f43240>Demodaten</span>`);
			else _push(`<!---->`);
			_push(`</h1>`);
			if (count.value > 0) {
				_push(`<div class="compare-head__meta" data-v-89f43240><span class="small num muted" data-v-89f43240>${(0, server_renderer_exports.ssrInterpolate)(count.value)} von ${(0, server_renderer_exports.ssrInterpolate)(__props.cap)} Felgen</span>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen",
					class: "link small",
					prefetch: ""
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`Weitere Felgen hinzufügen`);
						else return [(0, vue_exports.createTextVNode)("Weitere Felgen hinzufügen")];
					}),
					_: 1
				}, _parent));
				_push(`</div>`);
			} else _push(`<!---->`);
			if (__props.demo) _push(`<p class="micro quiet" data-v-89f43240>Beispielsortiment – Preise und Bestände sind Beispielwerte.</p>`);
			else _push(`<!---->`);
			_push(`</div>`);
			if (count.value > 0) _push(`<label class="check compare-head__toggle" data-v-89f43240><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(diff.value) ? (0, server_renderer_exports.ssrLooseContain)(diff.value, null) : diff.value) ? " checked" : ""} type="checkbox" aria-controls="vergleich-tabelle" data-v-89f43240> Unterschiede hervorheben </label>`);
			else _push(`<!---->`);
			_push(`</header>`);
			if (count.value === 0) {
				_push(`<div class="empty" data-v-89f43240><p class="empty__title" data-v-89f43240>Noch keine Felgen im Vergleich.</p><p class="empty__text" data-v-89f43240>Setz auf einer Felge das Häkchen „Vergleichen“ – bis zu vier Felgen nebeneinander.</p>`);
				_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
					href: "/felgen",
					class: "btn btn--secondary",
					prefetch: ""
				}, {
					default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
						if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(listingLabel.value)}`);
						else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(listingLabel.value), 1)];
					}),
					_: 1
				}, _parent));
				_push(`</div>`);
			} else {
				_push(`<!--[-->`);
				if (__props.missing > 0) {
					_push(`<div class="notice compare-notice compare-table" role="status" data-v-89f43240>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "info",
						size: 20
					}, null, _parent));
					_push(`<p data-v-89f43240>${(0, server_renderer_exports.ssrInterpolate)(__props.missing === 1 ? "Eine Felge aus deinem Vergleich ist nicht mehr im Sortiment und wurde entfernt." : `${__props.missing} Felgen aus deinem Vergleich sind nicht mehr im Sortiment und wurden entfernt.`)}</p></div>`);
				} else _push(`<!---->`);
				if (count.value === 1) {
					_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([{ "compare-table": __props.missing === 0 }, "notice compare-notice"])}" data-v-89f43240>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "info",
						size: 20
					}, null, _parent));
					_push(`<p data-v-89f43240> Füge eine zweite Felge hinzu, um zu vergleichen. `);
					_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: "/felgen",
						class: "link",
						prefetch: ""
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`Felgen ansehen`);
							else return [(0, vue_exports.createTextVNode)("Felgen ansehen")];
						}),
						_: 1
					}, _parent));
					_push(`</p></div>`);
				} else _push(`<!---->`);
				_push(`<div id="vergleich-tabelle" class="${(0, server_renderer_exports.ssrRenderClass)([{
					"compare--phone": __props.phone,
					"compare-table": __props.missing === 0 && count.value > 1
				}, "compare"])}" style="${(0, server_renderer_exports.ssrRenderStyle)({ "--n": count.value })}" role="table" aria-labelledby="vergleich-title"${(0, server_renderer_exports.ssrRenderAttr)("data-diff", diff.value ? "on" : void 0)} data-v-89f43240><div class="compare__row compare__head" role="row" data-v-89f43240><div class="compare__label" role="cell" data-v-89f43240></div><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.items, (item, i) => {
					_push(`<div class="compare__cell" role="cell" data-v-89f43240><span class="compare__img" data-v-89f43240>`);
					if (item.image) _push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
						image: item.image,
						alt: `${item.brandName} ${item.modelName} in ${item.finishName}, Ansicht von vorn`,
						sizes: "(min-width: 1024px) 26vw, 45vw",
						eager: i < 2
					}, null, _parent));
					else _push((0, server_renderer_exports.ssrRenderComponent)(WheelOutline_default, {
						spokes: item.art.spokes,
						size: "60%"
					}, null, _parent));
					_push(`</span><span class="small quiet" translate="no" data-v-89f43240>${(0, server_renderer_exports.ssrInterpolate)(item.brandName)}</span><span class="h4" translate="no" data-v-89f43240>${(0, server_renderer_exports.ssrInterpolate)(item.modelName)}</span><span class="small muted" translate="no" data-v-89f43240>${(0, server_renderer_exports.ssrInterpolate)(item.finishName)}</span><span class="body num compare__price" data-v-89f43240>ab `);
					_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, {
						text: perWheel(item),
						whole: ""
					}, null, _parent));
					_push(` pro Felge</span><span class="micro quiet" data-v-89f43240>${(0, server_renderer_exports.ssrInterpolate)(terms.value.note)}</span>`);
					if (vehicle.value && item.verdict) _push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, {
						status: item.verdict.status,
						"notes-only": item.verdict.notesOnly === true,
						class: "compare__badge"
					}, null, _parent));
					else _push(`<!---->`);
					_push(`<button class="icon-btn compare__remove" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${item.brandName} ${item.modelName} aus dem Vergleich entfernen`)} data-v-89f43240>`);
					_push((0, server_renderer_exports.ssrRenderComponent)(Icon_default, {
						name: "close",
						size: 16
					}, null, _parent));
					_push(`</button></div>`);
				});
				_push(`<!--]--></div><div class="compare__row compare__stick" role="row" data-v-89f43240><div class="compare__label" role="columnheader" data-v-89f43240><span class="label" data-v-89f43240>Felge</span></div><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.items, (item) => {
					_push(`<div${(0, server_renderer_exports.ssrRenderAttr)("id", columnId(item))} class="compare__cell" role="columnheader" data-v-89f43240><span class="compare__img" data-v-89f43240>`);
					if (item.image) _push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
						image: item.image,
						alt: "",
						sizes: "48px"
					}, null, _parent));
					else _push((0, server_renderer_exports.ssrRenderComponent)(WheelOutline_default, { spokes: item.art.spokes }, null, _parent));
					_push(`</span><span class="compare__stick-name" translate="no" data-v-89f43240><span class="micro quiet" data-v-89f43240>${(0, server_renderer_exports.ssrInterpolate)(item.brandName)}</span><span data-v-89f43240>${(0, server_renderer_exports.ssrInterpolate)(item.modelName)}</span></span>`);
					if (vehicle.value && item.verdict) _push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, {
						status: item.verdict.status,
						"notes-only": item.verdict.notesOnly === true
					}, null, _parent));
					else _push(`<!---->`);
					_push(`</div>`);
				});
				_push(`<!--]--></div><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(groups.value, (group) => {
					_push(`<!--[--><div class="compare__row" role="row" data-v-89f43240><div class="compare__label compare__group" role="rowheader"${(0, server_renderer_exports.ssrRenderAttr)("aria-colspan", count.value + 1)} data-v-89f43240><span class="label" data-v-89f43240>${(0, server_renderer_exports.ssrInterpolate)(group.label)}</span></div></div><!--[-->`);
					(0, server_renderer_exports.ssrRenderList)(group.rows, (r) => {
						_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([{ "compare__row--same": r.same }, "compare__row compare__row--data"])}" role="row" data-v-89f43240><div class="compare__label" role="rowheader" data-v-89f43240><span class="label" data-v-89f43240>${(0, server_renderer_exports.ssrInterpolate)(r.label)}</span>`);
						if (r.link) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: r.link.href,
							class: "link small compare__label-link"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(r.link.label)}`);
								else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(r.link.label), 1)];
							}),
							_: 2
						}, _parent));
						else _push(`<!---->`);
						_push(`</div><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(r.cells, (cell, i) => {
							_push(`<div class="${(0, server_renderer_exports.ssrRenderClass)([{
								"compare__diff": !r.same,
								"compare__cell--muted": r.kind === "muted"
							}, "compare__cell"])}" role="cell"${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", headerIds.value[i])}${(0, server_renderer_exports.ssrRenderAttr)("translate", r.values ? "no" : void 0)} data-v-89f43240>`);
							if (r.kind === "verdict") {
								_push(`<!--[-->`);
								if (cell.verdict) _push((0, server_renderer_exports.ssrRenderComponent)(VerdictBadge_default, {
									status: cell.verdict.status,
									"notes-only": cell.verdict.notesOnly === true
								}, null, _parent));
								else _push(`<span class="small muted" data-v-89f43240>–</span>`);
								if (cell.verdict && cell.verdict.reason) _push(`<span class="small muted compare__reason" data-v-89f43240>${(0, server_renderer_exports.ssrInterpolate)(cell.verdict.reason)}</span>`);
								else _push(`<!---->`);
								_push(`<!--]-->`);
							} else if (r.kind === "lines") {
								_push(`<ul class="compare__list" data-v-89f43240><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(cell.lines, (line) => {
									_push(`<li data-v-89f43240>${(0, server_renderer_exports.ssrInterpolate)(line)}</li>`);
								});
								_push(`<!--]--></ul>`);
							} else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(cell.text)}<!--]-->`);
							_push(`</div>`);
						});
						_push(`<!--]--></div>`);
					});
					_push(`<!--]--><!--]-->`);
				});
				_push(`<!--]--><div class="compare__row compare__actions" role="row" data-v-89f43240><div class="compare__label" role="cell" data-v-89f43240></div><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.items, (item) => {
					_push(`<div class="compare__cell" role="cell" data-v-89f43240>`);
					if (item.buy.kind === "basket") {
						_push(`<!--[--><form class="compare__buy" data-v-89f43240><button class="btn btn--primary btn--block" type="submit"${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", adding.value === item.buy.configId ? "true" : void 0)} data-v-89f43240>In den Warenkorb</button></form><span class="small muted" data-v-89f43240>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(ValueText_default, { text: item.buy.sizeLabel }, null, _parent));
						_push(` · für ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value?.short)}</span><!--]-->`);
					} else if (item.buy.kind === "choose") _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: item.buy.href,
						class: "btn btn--secondary btn--block"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) _push(`Größe wählen`);
							else return [(0, vue_exports.createTextVNode)("Größe wählen")];
						}),
						_: 2
					}, _parent));
					else {
						_push(`<!--[--><span class="small muted" data-v-89f43240>Nicht freigegeben für ${(0, server_renderer_exports.ssrInterpolate)(vehicle.value?.short)}</span>`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: `/felgen/${item.slug}?ausfuehrung=${item.finishId}`,
							class: "link"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`Details ansehen`);
								else return [(0, vue_exports.createTextVNode)("Details ansehen")];
							}),
							_: 2
						}, _parent));
						_push(`<!--]-->`);
					}
					_push(`</div>`);
				});
				_push(`<!--]--></div></div><!--]-->`);
			}
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Components/Compare/CompareTable.vue
var _sfc_setup = CompareTable_vue_vue_type_script_setup_true_lang_default.setup;
CompareTable_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/Compare/CompareTable.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var CompareTable_default = /*#__PURE__*/ _plugin_vue_export_helper_default(CompareTable_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-89f43240"]]);
//#endregion
export { CompareTable_default as t };
