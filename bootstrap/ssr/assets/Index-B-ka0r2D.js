import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-C_yULPOj.js";
import { c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as decimal } from "./format-6R0uUMt3.js";
import { t as AdminState_default } from "./AdminState-QyYV7E7y.js";
import { n as useFocusAfter } from "./useFocusAfter-B30tsjKa.js";
//#region resources/js/Pages/Admin/Konflikte/Index.vue?vue&type=script&setup=true&lang.ts
var Index_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Index",
	__ssrInlineRender: true,
	props: {
		open: {},
		decided: {},
		can: {}
	},
	setup(__props) {
		/**
		* Gutachten › Konflikte (the corrections memo §3) — every car and wheel two current documents disagree
		* about. The shop answers „Noch nicht bestätigt“ there until a person decides: „beide gelten jeweils für sich“ (the
		* shop names both and reads them together, the stricter way) or „nur Dokument X gilt“. Both sides stand
		* side by side, as each document says it, with the page to check it on. A decision needs its reason and
		* goes into the Protokoll.
		*/
		const props = __props;
		const page = usePage();
		const focus = useFocusAfter();
		const context = (0, vue_exports.computed)(() => props.open.length === 1 ? "1 offen" : `${decimal(props.open.length, 0)} offen`);
		/** `HSN 1860` never breaks between the word and its number. */
		const NBSP = String.fromCharCode(160);
		const tight = (label) => label.replace(/\b(HSN|TSN) (\S+)/g, `$1${NBSP}$2`);
		/** Which of a pair's facts differ between its sides: marked on each side, so the difference is seen. */
		function differs(pair, fact) {
			return new Set(pair.sides.map((side) => JSON.stringify(fact === "requiresEntry" ? side.requiresEntry : [...side[fact]].sort()))).size > 1;
		}
		/** `A01 – Die Anbauabnahme …`: the code apart from its sentence, as on the Gutachten page. */
		function codeOf(line) {
			const at = line.indexOf(" – ");
			return at === -1 ? {
				code: "",
				text: line
			} : {
				code: line.slice(0, at),
				text: line.slice(at + 3)
			};
		}
		/** The pair whose decision was sent last: its sentences, not another's. */
		const sentFor = (0, vue_exports.ref)(null);
		const busy = (0, vue_exports.ref)(false);
		const choice = (0, vue_exports.reactive)({});
		const reason = (0, vue_exports.reactive)({});
		const errors = (0, vue_exports.computed)(() => {
			const bag = page.props.errors ?? {};
			return (key, field) => sentFor.value === key ? bag[field] ?? "" : "";
		});
		const orphaned = (0, vue_exports.computed)(() => {
			const bag = page.props.errors ?? {};
			return sentFor.value !== null && !props.open.some((pair) => pair.key === sentFor.value) ? bag.mode ?? bag.document_id ?? bag.reason ?? "" : "";
		});
		function decide(pair) {
			if (busy.value) return;
			const picked = choice[pair.key] ?? "";
			const only = picked.startsWith("only:");
			const place = props.open.findIndex((p) => p.key === pair.key);
			busy.value = true;
			sentFor.value = pair.key;
			router.post("/admin/konflikte/entscheiden", {
				vehicle_id: pair.vehicleId,
				wheel_config_id: pair.configId,
				mode: picked === "" ? "" : only ? "only" : "each",
				document_id: only ? Number(picked.slice(5)) : null,
				reason: reason[pair.key] ?? ""
			}, {
				preserveScroll: true,
				onSuccess: () => {
					sentFor.value = null;
					const next = props.open[Math.min(place, props.open.length - 1)];
					focus.request(next ? [`kf-h-${next.key}`, "kf-title"] : ["kf-title"], { scroll: true });
				},
				onError: (bag) => {
					if (!props.open.some((p) => p.key === pair.key)) {
						focus.request("kf-title", { scroll: true });
						return;
					}
					focus.request(bag.mode || bag.document_id ? `kf-choice-${pair.key}-0` : `kf-reason-${pair.key}`);
				},
				onFinish: () => {
					busy.value = false;
				}
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: "Konflikte",
				context: context.value
			}, _attrs), {
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<p id="kf-title" class="adm-note kf-intro" tabindex="-1" data-v-4f0dc3cc${_scopeId}> Hier widersprechen sich zwei gültige Gutachten zur selben Kombination aus Fahrzeug und Felge. Bis du entscheidest, sagt der Shop dort „Noch nicht bestätigt“ – nie von sich aus das eine oder das andere. </p>`);
						if (orphaned.value) _push(`<p class="adm-alert" role="alert" data-v-4f0dc3cc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(orphaned.value)}</p>`);
						else _push(`<!---->`);
						if (__props.open.length === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Kein Konflikt offen. Ein neuer steht hier, sobald eine Freigabe einem anderen Gutachten widerspricht."
						}, null, _parent, _scopeId));
						else _push(`<!---->`);
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.open, (pair) => {
							_push(`<section${(0, server_renderer_exports.ssrRenderAttr)("id", `konflikt-${pair.key}`)} class="kf-pair"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `kf-h-${pair.key}`)} data-v-4f0dc3cc${_scopeId}><div class="kf-pair__head" data-v-4f0dc3cc${_scopeId}><h2${(0, server_renderer_exports.ssrRenderAttr)("id", `kf-h-${pair.key}`)} class="kf-pair__title" tabindex="-1" data-v-4f0dc3cc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(tight(pair.vehicle))}</h2><p class="kf-pair__wheel" data-v-4f0dc3cc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(pair.wheel)}</p><p class="kf-what" data-v-4f0dc3cc${_scopeId}>Unterschiedlich: ${(0, server_renderer_exports.ssrInterpolate)(pair.what.join(", "))}</p></div><div class="kf-sides" data-v-4f0dc3cc${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(pair.sides, (side) => {
								_push(`<article class="kf-side" data-v-4f0dc3cc${_scopeId}><h3 class="kf-side__title" data-v-4f0dc3cc${_scopeId}><a${(0, server_renderer_exports.ssrRenderAttr)("href", side.href)} data-v-4f0dc3cc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(side.document)}</a></h3>`);
								if (side.pdfHref) _push(`<p class="kf-side__page" data-v-4f0dc3cc${_scopeId}><a${(0, server_renderer_exports.ssrRenderAttr)("href", side.pdfHref)} target="_blank" rel="noopener" data-v-4f0dc3cc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(side.page ? `Seite ${side.page} im PDF` : "PDF öffnen")}</a></p>`);
								else _push(`<!---->`);
								_push(`<dl class="kf-facts" data-v-4f0dc3cc${_scopeId}><div class="${(0, server_renderer_exports.ssrRenderClass)([{ "kf-facts__row--differs": differs(pair, "requiresEntry") }, "kf-facts__row"])}" data-v-4f0dc3cc${_scopeId}><dt data-v-4f0dc3cc${_scopeId}>Eintragung</dt><dd data-v-4f0dc3cc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(side.requiresEntry ? "Erforderlich" : "Nicht erforderlich")}</dd></div><div class="${(0, server_renderer_exports.ssrRenderClass)([{ "kf-facts__row--differs": differs(pair, "sizes") }, "kf-facts__row"])}" data-v-4f0dc3cc${_scopeId}><dt data-v-4f0dc3cc${_scopeId}>Reifen</dt><dd data-v-4f0dc3cc${_scopeId}>`);
								if (side.sizes.length === 0) _push(`<span data-v-4f0dc3cc${_scopeId}>–</span>`);
								else _push(`<!---->`);
								_push(`<!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(side.sizes, (size) => {
									_push(`<span class="kf-line" data-v-4f0dc3cc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(size)}</span>`);
								});
								_push(`<!--]--></dd></div><div class="${(0, server_renderer_exports.ssrRenderClass)([{ "kf-facts__row--differs": differs(pair, "conditions") }, "kf-facts__row"])}" data-v-4f0dc3cc${_scopeId}><dt data-v-4f0dc3cc${_scopeId}>Auflagen</dt><dd data-v-4f0dc3cc${_scopeId}>`);
								if (side.conditions.length === 0) _push(`<span data-v-4f0dc3cc${_scopeId}>–</span>`);
								else _push(`<!---->`);
								_push(`<!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(side.conditions, (line) => {
									_push(`<span class="kf-line" data-v-4f0dc3cc${_scopeId}>`);
									if (codeOf(line).code) _push(`<b class="kf-code" translate="no" data-v-4f0dc3cc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(codeOf(line).code)}</b>`);
									else _push(`<!---->`);
									_push(` ${(0, server_renderer_exports.ssrInterpolate)(codeOf(line).text)}</span>`);
								});
								_push(`<!--]--></dd></div></dl></article>`);
							});
							_push(`<!--]--></div>`);
							if (__props.can.decide) {
								_push(`<form class="kf-decide" novalidate data-v-4f0dc3cc${_scopeId}><fieldset class="kf-choices" data-v-4f0dc3cc${_scopeId}><legend class="form-field__label" data-v-4f0dc3cc${_scopeId}>Wie gelten die Gutachten?</legend><label class="check" data-v-4f0dc3cc${_scopeId}><input${(0, server_renderer_exports.ssrRenderAttr)("id", `kf-choice-${pair.key}-0`)}${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(choice[pair.key], "each")) ? " checked" : ""} type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", `kf-${pair.key}`)} value="each"${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `kf-choice-${pair.key}-err`)} data-v-4f0dc3cc${_scopeId}><span data-v-4f0dc3cc${_scopeId}>Beide gelten jeweils für sich – der Shop nennt beide und liest sie zusammen; im Zweifel gilt die strengere Angabe.</span></label><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(pair.sides, (side) => {
									_push(`<label class="check" data-v-4f0dc3cc${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)((0, server_renderer_exports.ssrLooseEqual)(choice[pair.key], `only:${side.documentId}`)) ? " checked" : ""} type="radio"${(0, server_renderer_exports.ssrRenderAttr)("name", `kf-${pair.key}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", `only:${side.documentId}`)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `kf-choice-${pair.key}-err`)} data-v-4f0dc3cc${_scopeId}><span data-v-4f0dc3cc${_scopeId}>Nur ${(0, server_renderer_exports.ssrInterpolate)(side.document)} gilt.</span></label>`);
								});
								_push(`<!--]--><p${(0, server_renderer_exports.ssrRenderAttr)("id", `kf-choice-${pair.key}-err`)} class="form-field__error" data-v-4f0dc3cc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value(pair.key, "mode") || errors.value(pair.key, "document_id"))}</p></fieldset><div class="form-field" data-v-4f0dc3cc${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `kf-reason-${pair.key}`)} data-v-4f0dc3cc${_scopeId}>Warum?</label><textarea${(0, server_renderer_exports.ssrRenderAttr)("id", `kf-reason-${pair.key}`)} class="input kf-reason" rows="2" maxlength="1000"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value(pair.key, "reason") ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `kf-reason-${pair.key}-help kf-reason-${pair.key}-err`)} data-v-4f0dc3cc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(reason[pair.key])}</textarea><p${(0, server_renderer_exports.ssrRenderAttr)("id", `kf-reason-${pair.key}-help`)} class="form-field__help" data-v-4f0dc3cc${_scopeId}>Steht im Protokoll – zum Beispiel, was der Hersteller oder die Prüfstelle gesagt hat.</p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `kf-reason-${pair.key}-err`)} class="form-field__error" data-v-4f0dc3cc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value(pair.key, "reason"))}</p></div><div data-v-4f0dc3cc${_scopeId}><button class="btn btn--primary" type="submit"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value && sentFor.value === pair.key ? "true" : void 0)} data-v-4f0dc3cc${_scopeId}>Entscheiden</button></div></form>`);
							} else _push(`<!---->`);
							_push(`</section>`);
						});
						_push(`<!--]-->`);
						if (__props.decided.length) {
							_push(`<section class="adm-section kf-done" aria-labelledby="kf-done-h" data-v-4f0dc3cc${_scopeId}><div class="adm-section__head" data-v-4f0dc3cc${_scopeId}><h2 id="kf-done-h" class="adm-section__title" data-v-4f0dc3cc${_scopeId}>Entschieden</h2></div><div class="adm-panel" data-v-4f0dc3cc${_scopeId}><table class="adm-table" data-v-4f0dc3cc${_scopeId}><caption class="visually-hidden" data-v-4f0dc3cc${_scopeId}>Die letzten Entscheidungen</caption><thead data-v-4f0dc3cc${_scopeId}><tr data-v-4f0dc3cc${_scopeId}><th scope="col" data-v-4f0dc3cc${_scopeId}>Fahrzeug und Felge</th><th scope="col" data-v-4f0dc3cc${_scopeId}>Entscheidung</th><th scope="col" data-v-4f0dc3cc${_scopeId}>Grund</th><th scope="col" data-v-4f0dc3cc${_scopeId}>Von</th></tr></thead><tbody data-v-4f0dc3cc${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.decided, (pair) => {
								_push(`<tr data-v-4f0dc3cc${_scopeId}><td data-label="Fahrzeug und Felge" data-v-4f0dc3cc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(pair.vehicle)} <span class="adm-table__sub" data-v-4f0dc3cc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(pair.wheel)}</span></td><td data-label="Entscheidung" data-v-4f0dc3cc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(pair.decision?.mode === "only" ? `Nur ${pair.decision?.document ?? "ein Gutachten"} gilt` : "Beide gelten")}</td><td data-label="Grund" class="kf-text" data-v-4f0dc3cc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(pair.decision?.reason)}</td><td data-label="Von" data-v-4f0dc3cc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(pair.decision?.by ?? "–")} `);
								if (pair.decision?.at) _push(`<span class="adm-table__sub" data-v-4f0dc3cc${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(pair.decision.at)}</span>`);
								else _push(`<!---->`);
								_push(`</td></tr>`);
							});
							_push(`<!--]--></tbody></table></div></section>`);
						} else _push(`<!---->`);
					} else return [
						(0, vue_exports.createVNode)("p", {
							id: "kf-title",
							class: "adm-note kf-intro",
							tabindex: "-1"
						}, " Hier widersprechen sich zwei gültige Gutachten zur selben Kombination aus Fahrzeug und Felge. Bis du entscheidest, sagt der Shop dort „Noch nicht bestätigt“ – nie von sich aus das eine oder das andere. "),
						orphaned.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-alert",
							role: "alert"
						}, (0, vue_exports.toDisplayString)(orphaned.value), 1)) : (0, vue_exports.createCommentVNode)("", true),
						__props.open.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
							key: 1,
							kind: "empty",
							text: "Kein Konflikt offen. Ein neuer steht hier, sobald eine Freigabe einem anderen Gutachten widerspricht."
						})) : (0, vue_exports.createCommentVNode)("", true),
						((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.open, (pair) => {
							return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
								id: `konflikt-${pair.key}`,
								key: pair.key,
								class: "kf-pair",
								"aria-labelledby": `kf-h-${pair.key}`
							}, [
								(0, vue_exports.createVNode)("div", { class: "kf-pair__head" }, [
									(0, vue_exports.createVNode)("h2", {
										id: `kf-h-${pair.key}`,
										class: "kf-pair__title",
										tabindex: "-1"
									}, (0, vue_exports.toDisplayString)(tight(pair.vehicle)), 9, ["id"]),
									(0, vue_exports.createVNode)("p", { class: "kf-pair__wheel" }, (0, vue_exports.toDisplayString)(pair.wheel), 1),
									(0, vue_exports.createVNode)("p", { class: "kf-what" }, "Unterschiedlich: " + (0, vue_exports.toDisplayString)(pair.what.join(", ")), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "kf-sides" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(pair.sides, (side) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("article", {
										key: side.documentId,
										class: "kf-side"
									}, [
										(0, vue_exports.createVNode)("h3", { class: "kf-side__title" }, [(0, vue_exports.createVNode)("a", { href: side.href }, (0, vue_exports.toDisplayString)(side.document), 9, ["href"])]),
										side.pdfHref ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 0,
											class: "kf-side__page"
										}, [(0, vue_exports.createVNode)("a", {
											href: side.pdfHref,
											target: "_blank",
											rel: "noopener"
										}, (0, vue_exports.toDisplayString)(side.page ? `Seite ${side.page} im PDF` : "PDF öffnen"), 9, ["href"])])) : (0, vue_exports.createCommentVNode)("", true),
										(0, vue_exports.createVNode)("dl", { class: "kf-facts" }, [
											(0, vue_exports.createVNode)("div", { class: ["kf-facts__row", { "kf-facts__row--differs": differs(pair, "requiresEntry") }] }, [(0, vue_exports.createVNode)("dt", null, "Eintragung"), (0, vue_exports.createVNode)("dd", null, (0, vue_exports.toDisplayString)(side.requiresEntry ? "Erforderlich" : "Nicht erforderlich"), 1)], 2),
											(0, vue_exports.createVNode)("div", { class: ["kf-facts__row", { "kf-facts__row--differs": differs(pair, "sizes") }] }, [(0, vue_exports.createVNode)("dt", null, "Reifen"), (0, vue_exports.createVNode)("dd", null, [side.sizes.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 0 }, "–")) : (0, vue_exports.createCommentVNode)("", true), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(side.sizes, (size) => {
												return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
													key: size,
													class: "kf-line"
												}, (0, vue_exports.toDisplayString)(size), 1);
											}), 128))])], 2),
											(0, vue_exports.createVNode)("div", { class: ["kf-facts__row", { "kf-facts__row--differs": differs(pair, "conditions") }] }, [(0, vue_exports.createVNode)("dt", null, "Auflagen"), (0, vue_exports.createVNode)("dd", null, [side.conditions.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", { key: 0 }, "–")) : (0, vue_exports.createCommentVNode)("", true), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(side.conditions, (line) => {
												return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
													key: line,
													class: "kf-line"
												}, [codeOf(line).code ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("b", {
													key: 0,
													class: "kf-code",
													translate: "no"
												}, (0, vue_exports.toDisplayString)(codeOf(line).code), 1)) : (0, vue_exports.createCommentVNode)("", true), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(codeOf(line).text), 1)]);
											}), 128))])], 2)
										])
									]);
								}), 128))]),
								__props.can.decide ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("form", {
									key: 0,
									class: "kf-decide",
									novalidate: "",
									onSubmit: (0, vue_exports.withModifiers)(($event) => decide(pair), ["prevent"])
								}, [
									(0, vue_exports.createVNode)("fieldset", { class: "kf-choices" }, [
										(0, vue_exports.createVNode)("legend", { class: "form-field__label" }, "Wie gelten die Gutachten?"),
										(0, vue_exports.createVNode)("label", { class: "check" }, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											id: `kf-choice-${pair.key}-0`,
											"onUpdate:modelValue": ($event) => choice[pair.key] = $event,
											type: "radio",
											name: `kf-${pair.key}`,
											value: "each",
											"aria-describedby": `kf-choice-${pair.key}-err`
										}, null, 8, [
											"id",
											"onUpdate:modelValue",
											"name",
											"aria-describedby"
										]), [[vue_exports.vModelRadio, choice[pair.key]]]), (0, vue_exports.createVNode)("span", null, "Beide gelten jeweils für sich – der Shop nennt beide und liest sie zusammen; im Zweifel gilt die strengere Angabe.")]),
										((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(pair.sides, (side) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("label", {
												key: side.documentId,
												class: "check"
											}, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
												"onUpdate:modelValue": ($event) => choice[pair.key] = $event,
												type: "radio",
												name: `kf-${pair.key}`,
												value: `only:${side.documentId}`,
												"aria-describedby": `kf-choice-${pair.key}-err`
											}, null, 8, [
												"onUpdate:modelValue",
												"name",
												"value",
												"aria-describedby"
											]), [[vue_exports.vModelRadio, choice[pair.key]]]), (0, vue_exports.createVNode)("span", null, "Nur " + (0, vue_exports.toDisplayString)(side.document) + " gilt.", 1)]);
										}), 128)),
										(0, vue_exports.createVNode)("p", {
											id: `kf-choice-${pair.key}-err`,
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(errors.value(pair.key, "mode") || errors.value(pair.key, "document_id")), 9, ["id"])
									]),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `kf-reason-${pair.key}`
										}, "Warum?", 8, ["for"]),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("textarea", {
											id: `kf-reason-${pair.key}`,
											"onUpdate:modelValue": ($event) => reason[pair.key] = $event,
											class: "input kf-reason",
											rows: "2",
											maxlength: "1000",
											"aria-invalid": errors.value(pair.key, "reason") ? "true" : void 0,
											"aria-describedby": `kf-reason-${pair.key}-help kf-reason-${pair.key}-err`
										}, null, 8, [
											"id",
											"onUpdate:modelValue",
											"aria-invalid",
											"aria-describedby"
										]), [[vue_exports.vModelText, reason[pair.key]]]),
										(0, vue_exports.createVNode)("p", {
											id: `kf-reason-${pair.key}-help`,
											class: "form-field__help"
										}, "Steht im Protokoll – zum Beispiel, was der Hersteller oder die Prüfstelle gesagt hat.", 8, ["id"]),
										(0, vue_exports.createVNode)("p", {
											id: `kf-reason-${pair.key}-err`,
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(errors.value(pair.key, "reason")), 9, ["id"])
									]),
									(0, vue_exports.createVNode)("div", null, [(0, vue_exports.createVNode)("button", {
										class: "btn btn--primary",
										type: "submit",
										disabled: busy.value,
										"aria-busy": busy.value && sentFor.value === pair.key ? "true" : void 0
									}, "Entscheiden", 8, ["disabled", "aria-busy"])])
								], 40, ["onSubmit"])) : (0, vue_exports.createCommentVNode)("", true)
							], 8, ["id", "aria-labelledby"]);
						}), 128)),
						__props.decided.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 2,
							class: "adm-section kf-done",
							"aria-labelledby": "kf-done-h"
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "kf-done-h",
							class: "adm-section__title"
						}, "Entschieden")]), (0, vue_exports.createVNode)("div", { class: "adm-panel" }, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [
							(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Die letzten Entscheidungen"),
							(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Fahrzeug und Felge"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Entscheidung"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Grund"),
								(0, vue_exports.createVNode)("th", { scope: "col" }, "Von")
							])]),
							(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.decided, (pair) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: pair.key }, [
									(0, vue_exports.createVNode)("td", { "data-label": "Fahrzeug und Felge" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(pair.vehicle) + " ", 1), (0, vue_exports.createVNode)("span", { class: "adm-table__sub" }, (0, vue_exports.toDisplayString)(pair.wheel), 1)]),
									(0, vue_exports.createVNode)("td", { "data-label": "Entscheidung" }, (0, vue_exports.toDisplayString)(pair.decision?.mode === "only" ? `Nur ${pair.decision?.document ?? "ein Gutachten"} gilt` : "Beide gelten"), 1),
									(0, vue_exports.createVNode)("td", {
										"data-label": "Grund",
										class: "kf-text"
									}, (0, vue_exports.toDisplayString)(pair.decision?.reason), 1),
									(0, vue_exports.createVNode)("td", { "data-label": "Von" }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(pair.decision?.by ?? "–") + " ", 1), pair.decision?.at ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "adm-table__sub"
									}, (0, vue_exports.toDisplayString)(pair.decision.at), 1)) : (0, vue_exports.createCommentVNode)("", true)])
								]);
							}), 128))])
						])])])) : (0, vue_exports.createCommentVNode)("", true)
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Konflikte/Index.vue
var _sfc_setup = Index_vue_vue_type_script_setup_true_lang_default.setup;
Index_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Konflikte/Index.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Index_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Index_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-4f0dc3cc"]]);
//#endregion
export { Index_default as default };
