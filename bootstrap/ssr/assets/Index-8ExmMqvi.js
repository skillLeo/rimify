import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-CfOJdYqk.js";
import { a as link_default, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { n as CoverageMatrix_default, t as DashWidget_default } from "./DashWidget-oKfUs4Yd.js";
//#region resources/js/Pages/Admin/Abdeckung/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		matrix: {},
		selection: {}
	},
	setup(__props) {
		/**
		* Gutachten › Abdeckung: the Abdeckungs-Matrix at full size, and — once a cell is chosen — every
		* variant of that make with the Felgen of that size a customer may be shown for it. The variants with
		* none come first: they are the next Gutachten worth having.
		*/
		const props = __props;
		const result = (0, vue_exports.ref)(null);
		(0, vue_exports.onMounted)(() => {
			if (props.selection && result.value) {
				result.value.focus({ preventScroll: true });
				result.value.scrollIntoView({ block: "start" });
			}
		});
		const context = (0, vue_exports.computed)(() => `${props.matrix.summary.sentence} · Stand: ${props.matrix.computedAt}`);
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Abdeckung",
				dashboard: "",
				context: context.value
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="ab" data-v-76424d23${_scopeId}>`);
						if (__props.matrix.incomplete?.length) {
							_push(`<section class="adm-section ab__incomplete" aria-labelledby="ab-incomplete-h" data-v-76424d23${_scopeId}><div class="adm-section__head" data-v-76424d23${_scopeId}><h2 id="ab-incomplete-h" class="adm-section__title" data-v-76424d23${_scopeId}>Nachträge ohne Grundgutachten</h2></div><p class="adm-note" data-v-76424d23${_scopeId}>Die Matrix zählt ihre Freigaben mit. Ihr Grundgutachten liegt uns nicht vor – ein Nachtrag allein ist nicht die ganze Freigabe, und der Shop sagt das dazu.</p><ul class="ab__docs" data-v-76424d23${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.matrix.incomplete, (item) => {
								_push(`<li class="ab__doc" data-v-76424d23${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: item.href,
									class: "ab__link"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(item.document)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.document), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								if (item.base) _push(`<span class="ab__base" data-v-76424d23${_scopeId}>Grundgutachten ${(0, server_renderer_exports.ssrInterpolate)(item.base)}</span>`);
								else _push(`<!---->`);
								_push(`</li>`);
							});
							_push(`<!--]--></ul></section>`);
						} else _push(`<!---->`);
						if (__props.matrix.missingAnnexes?.length) {
							_push(`<section class="adm-section ab__incomplete" aria-labelledby="ab-annexes-h" data-v-76424d23${_scopeId}><div class="adm-section__head" data-v-76424d23${_scopeId}><h2 id="ab-annexes-h" class="adm-section__title" data-v-76424d23${_scopeId}>Verwendungsbereich unvollständig</h2></div><p class="adm-note" data-v-76424d23${_scopeId}> Von diesen Gutachten liegen uns nicht alle Anlagen vor. Die Matrix zählt nur die Fahrzeuge der vorliegenden Seiten. Ein Fahrzeug, das dort nicht steht, bekommt im Shop den Hinweis, dass die Anlage noch nicht vorliegt – kein „Nicht freigegeben“. </p><ul class="ab__docs" data-v-76424d23${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.matrix.missingAnnexes, (item) => {
								_push(`<li class="ab__doc" data-v-76424d23${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: item.href,
									class: "ab__link"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(item.document)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.document), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								_push(`<span class="ab__base" data-v-76424d23${_scopeId}>Fehlende Anlagen: ${(0, server_renderer_exports.ssrInterpolate)(item.annexes)}</span></li>`);
							});
							_push(`<!--]--></ul></section>`);
						} else _push(`<!---->`);
						if (__props.matrix.noSpeedTable?.length) {
							_push(`<section class="adm-section ab__incomplete" aria-labelledby="ab-speed-h" data-v-76424d23${_scopeId}><div class="adm-section__head" data-v-76424d23${_scopeId}><h2 id="ab-speed-h" class="adm-section__title" data-v-76424d23${_scopeId}>Gutachten ohne Tragfähigkeitstabelle</h2></div><p class="adm-note" data-v-76424d23${_scopeId}>Zu diesen Gutachten ist keine Tabelle zur Tragfähigkeit der Reifen bei hoher Geschwindigkeit hinterlegt. Für Fahrzeuge über 210 km/h bestätigt der Shop die Reifen daraus nicht und sagt der Kundschaft, warum. Die Felge selbst bleibt freigegeben.</p><ul class="ab__docs" data-v-76424d23${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.matrix.noSpeedTable, (item) => {
								_push(`<li class="ab__doc" data-v-76424d23${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: item.href,
									class: "ab__link"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(item.document)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.document), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								_push(`<span class="ab__base" data-v-76424d23${_scopeId}>Reifen nur bis 210 km/h</span></li>`);
							});
							_push(`<!--]--></ul></section>`);
						} else _push(`<!---->`);
						_push((0, server_renderer_exports.ssrRenderComponent)(DashWidget_default, {
							title: "Varianten mit freigegebener Felge, nach Marke und Größe",
							empty: __props.matrix.rows.length ? null : "Noch kein Fahrzeug im Katalog. Die Matrix füllt sich, sobald Fahrzeuge in einem Gutachten eingetragen sind oder der Fahrzeugdatensatz eingespielt ist.",
							"empty-link": __props.matrix.rows.length ? null : {
								label: "Zu den Gutachten",
								href: "/admin/gutachten"
							}
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(CoverageMatrix_default, {
									matrix: __props.matrix,
									selected: __props.selection ? {
										make: __props.selection.make,
										size: __props.selection.size
									} : null
								}, null, _parent, _scopeId));
								else return [(0, vue_exports.createVNode)(CoverageMatrix_default, {
									matrix: __props.matrix,
									selected: __props.selection ? {
										make: __props.selection.make,
										size: __props.selection.size
									} : null
								}, null, 8, ["matrix", "selected"])];
							}),
							_: 1
						}, _parent, _scopeId));
						if (__props.selection) {
							_push(`<div class="ab__result" tabindex="-1" role="region" aria-label="Varianten zur gewählten Marke und Größe" data-v-76424d23${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(DashWidget_default, {
								title: `${__props.selection.make}, ${__props.selection.size} Zoll`,
								href: "/admin/abdeckung",
								"href-label": "Auswahl aufheben",
								empty: __props.selection.total ? null : `Von ${__props.selection.make} ist kein Fahrzeug im Katalog.`
							}, {
								default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
									if (_push) {
										_push(`<p class="ab__lead" data-v-76424d23${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.selection.covered, 0))} von ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(__props.selection.total, 0))} Varianten haben mindestens eine freigegebene Felge in ${(0, server_renderer_exports.ssrInterpolate)(__props.selection.size)} Zoll. Die ohne stehen oben. </p><div class="ab__scroll" data-v-76424d23${_scopeId}><table class="adm-table ab__table" data-v-76424d23${_scopeId}><thead data-v-76424d23${_scopeId}><tr data-v-76424d23${_scopeId}><th scope="col" data-v-76424d23${_scopeId}>Fahrzeug</th><th scope="col" data-v-76424d23${_scopeId}>Bauzeitraum</th><th scope="col" data-v-76424d23${_scopeId}>HSN/TSN</th><th scope="col" class="num" data-v-76424d23${_scopeId}>Felgen in ${(0, server_renderer_exports.ssrInterpolate)(__props.selection.size)} Zoll</th><th scope="col" class="num" data-v-76424d23${_scopeId}>Gutachten</th></tr></thead><tbody data-v-76424d23${_scopeId}><!--[-->`);
										(0, server_renderer_exports.ssrRenderList)(__props.selection.rows, (row) => {
											_push(`<tr data-v-76424d23${_scopeId}><td data-label="Fahrzeug" data-v-76424d23${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.vehicle)}</td><td data-label="Bauzeitraum" class="num-plain" data-v-76424d23${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.period)}</td><td data-label="HSN/TSN" class="num-plain" data-v-76424d23${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.keys)}</td><td data-label="Felgen" class="num" data-v-76424d23${_scopeId}>`);
											if (row.wheels) _push(`<span data-v-76424d23${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(decimal)(row.wheels, 0))}</span>`);
											else _push(`<span class="adm-tag adm-tag--warn" data-v-76424d23${_scopeId}>keine</span>`);
											_push(`</td><td data-label="Gutachten" class="num" data-v-76424d23${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(row.documents ? (0, vue_exports.unref)(decimal)(row.documents, 0) : "–")}</td></tr>`);
										});
										_push(`<!--]--></tbody></table></div><p class="ab__hint" data-v-76424d23${_scopeId}> Wer auf ein Gutachten für sein Auto wartet, steht unter `);
										_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), { href: "/admin/anfragen" }, {
											default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
												if (_push) _push(`Anfragen`);
												else return [(0, vue_exports.createTextVNode)("Anfragen")];
											}),
											_: 1
										}, _parent, _scopeId));
										_push(`. </p>`);
									} else return [
										(0, vue_exports.createVNode)("p", { class: "ab__lead" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.selection.covered, 0)) + " von " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.selection.total, 0)) + " Varianten haben mindestens eine freigegebene Felge in " + (0, vue_exports.toDisplayString)(__props.selection.size) + " Zoll. Die ohne stehen oben. ", 1),
										(0, vue_exports.createVNode)("div", { class: "ab__scroll" }, [(0, vue_exports.createVNode)("table", { class: "adm-table ab__table" }, [(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
											(0, vue_exports.createVNode)("th", { scope: "col" }, "Fahrzeug"),
											(0, vue_exports.createVNode)("th", { scope: "col" }, "Bauzeitraum"),
											(0, vue_exports.createVNode)("th", { scope: "col" }, "HSN/TSN"),
											(0, vue_exports.createVNode)("th", {
												scope: "col",
												class: "num"
											}, "Felgen in " + (0, vue_exports.toDisplayString)(__props.selection.size) + " Zoll", 1),
											(0, vue_exports.createVNode)("th", {
												scope: "col",
												class: "num"
											}, "Gutachten")
										])]), (0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.selection.rows, (row) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: row.id }, [
												(0, vue_exports.createVNode)("td", { "data-label": "Fahrzeug" }, (0, vue_exports.toDisplayString)(row.vehicle), 1),
												(0, vue_exports.createVNode)("td", {
													"data-label": "Bauzeitraum",
													class: "num-plain"
												}, (0, vue_exports.toDisplayString)(row.period), 1),
												(0, vue_exports.createVNode)("td", {
													"data-label": "HSN/TSN",
													class: "num-plain"
												}, (0, vue_exports.toDisplayString)(row.keys), 1),
												(0, vue_exports.createVNode)("td", {
													"data-label": "Felgen",
													class: "num"
												}, [row.wheels ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 0 }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(row.wheels, 0)), 1)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
													key: 1,
													class: "adm-tag adm-tag--warn"
												}, "keine"))]),
												(0, vue_exports.createVNode)("td", {
													"data-label": "Gutachten",
													class: "num"
												}, (0, vue_exports.toDisplayString)(row.documents ? (0, vue_exports.unref)(decimal)(row.documents, 0) : "–"), 1)
											]);
										}), 128))])])]),
										(0, vue_exports.createVNode)("p", { class: "ab__hint" }, [
											(0, vue_exports.createTextVNode)(" Wer auf ein Gutachten für sein Auto wartet, steht unter "),
											(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), { href: "/admin/anfragen" }, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Anfragen")]),
												_: 1
											}),
											(0, vue_exports.createTextVNode)(". ")
										])
									];
								}),
								_: 1
							}, _parent, _scopeId));
							_push(`</div>`);
						} else _push(`<!---->`);
						_push(`</div>`);
					} else return [(0, vue_exports.createVNode)("div", { class: "ab" }, [
						__props.matrix.incomplete?.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 0,
							class: "adm-section ab__incomplete",
							"aria-labelledby": "ab-incomplete-h"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "ab-incomplete-h",
								class: "adm-section__title"
							}, "Nachträge ohne Grundgutachten")]),
							(0, vue_exports.createVNode)("p", { class: "adm-note" }, "Die Matrix zählt ihre Freigaben mit. Ihr Grundgutachten liegt uns nicht vor – ein Nachtrag allein ist nicht die ganze Freigabe, und der Shop sagt das dazu."),
							(0, vue_exports.createVNode)("ul", { class: "ab__docs" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.matrix.incomplete, (item) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
									key: item.href,
									class: "ab__doc"
								}, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
									href: item.href,
									class: "ab__link"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.document), 1)]),
									_: 2
								}, 1032, ["href"]), item.base ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: "ab__base"
								}, "Grundgutachten " + (0, vue_exports.toDisplayString)(item.base), 1)) : (0, vue_exports.createCommentVNode)("", true)]);
							}), 128))])
						])) : (0, vue_exports.createCommentVNode)("", true),
						__props.matrix.missingAnnexes?.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 1,
							class: "adm-section ab__incomplete",
							"aria-labelledby": "ab-annexes-h"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "ab-annexes-h",
								class: "adm-section__title"
							}, "Verwendungsbereich unvollständig")]),
							(0, vue_exports.createVNode)("p", { class: "adm-note" }, " Von diesen Gutachten liegen uns nicht alle Anlagen vor. Die Matrix zählt nur die Fahrzeuge der vorliegenden Seiten. Ein Fahrzeug, das dort nicht steht, bekommt im Shop den Hinweis, dass die Anlage noch nicht vorliegt – kein „Nicht freigegeben“. "),
							(0, vue_exports.createVNode)("ul", { class: "ab__docs" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.matrix.missingAnnexes, (item) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
									key: item.href,
									class: "ab__doc"
								}, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
									href: item.href,
									class: "ab__link"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.document), 1)]),
									_: 2
								}, 1032, ["href"]), (0, vue_exports.createVNode)("span", { class: "ab__base" }, "Fehlende Anlagen: " + (0, vue_exports.toDisplayString)(item.annexes), 1)]);
							}), 128))])
						])) : (0, vue_exports.createCommentVNode)("", true),
						__props.matrix.noSpeedTable?.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 2,
							class: "adm-section ab__incomplete",
							"aria-labelledby": "ab-speed-h"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "ab-speed-h",
								class: "adm-section__title"
							}, "Gutachten ohne Tragfähigkeitstabelle")]),
							(0, vue_exports.createVNode)("p", { class: "adm-note" }, "Zu diesen Gutachten ist keine Tabelle zur Tragfähigkeit der Reifen bei hoher Geschwindigkeit hinterlegt. Für Fahrzeuge über 210\xA0km/h bestätigt der Shop die Reifen daraus nicht und sagt der Kundschaft, warum. Die Felge selbst bleibt freigegeben."),
							(0, vue_exports.createVNode)("ul", { class: "ab__docs" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.matrix.noSpeedTable, (item) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
									key: item.href,
									class: "ab__doc"
								}, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
									href: item.href,
									class: "ab__link"
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(item.document), 1)]),
									_: 2
								}, 1032, ["href"]), (0, vue_exports.createVNode)("span", { class: "ab__base" }, "Reifen nur bis 210\xA0km/h")]);
							}), 128))])
						])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)(DashWidget_default, {
							title: "Varianten mit freigegebener Felge, nach Marke und Größe",
							empty: __props.matrix.rows.length ? null : "Noch kein Fahrzeug im Katalog. Die Matrix füllt sich, sobald Fahrzeuge in einem Gutachten eingetragen sind oder der Fahrzeugdatensatz eingespielt ist.",
							"empty-link": __props.matrix.rows.length ? null : {
								label: "Zu den Gutachten",
								href: "/admin/gutachten"
							}
						}, {
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(CoverageMatrix_default, {
								matrix: __props.matrix,
								selected: __props.selection ? {
									make: __props.selection.make,
									size: __props.selection.size
								} : null
							}, null, 8, ["matrix", "selected"])]),
							_: 1
						}, 8, ["empty", "empty-link"]),
						__props.selection ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
							key: 3,
							ref_key: "result",
							ref: result,
							class: "ab__result",
							tabindex: "-1",
							role: "region",
							"aria-label": "Varianten zur gewählten Marke und Größe"
						}, [(0, vue_exports.createVNode)(DashWidget_default, {
							title: `${__props.selection.make}, ${__props.selection.size} Zoll`,
							href: "/admin/abdeckung",
							"href-label": "Auswahl aufheben",
							empty: __props.selection.total ? null : `Von ${__props.selection.make} ist kein Fahrzeug im Katalog.`
						}, {
							default: (0, vue_exports.withCtx)(() => [
								(0, vue_exports.createVNode)("p", { class: "ab__lead" }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.selection.covered, 0)) + " von " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(__props.selection.total, 0)) + " Varianten haben mindestens eine freigegebene Felge in " + (0, vue_exports.toDisplayString)(__props.selection.size) + " Zoll. Die ohne stehen oben. ", 1),
								(0, vue_exports.createVNode)("div", { class: "ab__scroll" }, [(0, vue_exports.createVNode)("table", { class: "adm-table ab__table" }, [(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Fahrzeug"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Bauzeitraum"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "HSN/TSN"),
									(0, vue_exports.createVNode)("th", {
										scope: "col",
										class: "num"
									}, "Felgen in " + (0, vue_exports.toDisplayString)(__props.selection.size) + " Zoll", 1),
									(0, vue_exports.createVNode)("th", {
										scope: "col",
										class: "num"
									}, "Gutachten")
								])]), (0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.selection.rows, (row) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: row.id }, [
										(0, vue_exports.createVNode)("td", { "data-label": "Fahrzeug" }, (0, vue_exports.toDisplayString)(row.vehicle), 1),
										(0, vue_exports.createVNode)("td", {
											"data-label": "Bauzeitraum",
											class: "num-plain"
										}, (0, vue_exports.toDisplayString)(row.period), 1),
										(0, vue_exports.createVNode)("td", {
											"data-label": "HSN/TSN",
											class: "num-plain"
										}, (0, vue_exports.toDisplayString)(row.keys), 1),
										(0, vue_exports.createVNode)("td", {
											"data-label": "Felgen",
											class: "num"
										}, [row.wheels ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 0 }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(decimal)(row.wheels, 0)), 1)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 1,
											class: "adm-tag adm-tag--warn"
										}, "keine"))]),
										(0, vue_exports.createVNode)("td", {
											"data-label": "Gutachten",
											class: "num"
										}, (0, vue_exports.toDisplayString)(row.documents ? (0, vue_exports.unref)(decimal)(row.documents, 0) : "–"), 1)
									]);
								}), 128))])])]),
								(0, vue_exports.createVNode)("p", { class: "ab__hint" }, [
									(0, vue_exports.createTextVNode)(" Wer auf ein Gutachten für sein Auto wartet, steht unter "),
									(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), { href: "/admin/anfragen" }, {
										default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)("Anfragen")]),
										_: 1
									}),
									(0, vue_exports.createTextVNode)(". ")
								])
							]),
							_: 1
						}, 8, ["title", "empty"])], 512)) : (0, vue_exports.createCommentVNode)("", true)
					])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Abdeckung/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Abdeckung/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-76424d23"]]);
//#endregion
export { Index_default as default };
