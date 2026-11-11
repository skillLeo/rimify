import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-BA7BbMo6.js";
import { a as link_default, d as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-BdAJibZ6.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-D0z-a8p_.js";
import { t as formatMoney } from "./num-Br8qlecZ.js";
import { s as withUnit, t as anzahl } from "./format-6R0uUMt3.js";
import { t as AdminState_default } from "./AdminState-DSdumcrf.js";
import { n as useDirtyForm } from "./useDirtyForm-CUSvyfaU.js";
import { t as AdminSaveBar_default } from "./AdminSaveBar-BD5_vH_r.js";
import { t as FinishPhotos_default } from "./FinishPhotos-BO8vdngA.js";
//#region resources/js/Pages/Admin/Reifen/Modell.vue?vue&type=script&setup=true&lang.ts
var NEW_BRAND = -1;
var Modell_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Modell",
	__ssrInlineRender: true,
	props: {
		model: {},
		photos: {},
		photoOrderStamp: {},
		maxPhotos: {},
		sizes: {},
		stamp: {},
		brands: {},
		seasons: {},
		can: {}
	},
	setup(__props) {
		/**
		* Katalog › Reifen › one tyre model (the Gutachten rework §9): its photographs — up to four, by the rim page's own upload, sorted the
		* same way —, its facts, and its sizes with price, availability and EU label per line. A size opens on its own page. A photo
		* applies to every size of the model; without one the shop draws a neutral outline, never another tyre's picture.
		*/
		const props = __props;
		const editor = useDirtyForm({
			brand_id: props.model.brandId,
			brand_new: "",
			name: props.model.name,
			season: props.model.season
		}, {
			method: "put",
			url: () => `/admin/reifen/modell/${props.model.id}`,
			stamp: () => props.stamp
		});
		const form = editor.form;
		(0, vue_exports.watch)(() => [
			props.model.brandId,
			props.model.name,
			props.model.season
		], () => {
			form.defaults({
				brand_id: props.model.brandId,
				brand_new: "",
				name: props.model.name,
				season: props.model.season
			});
			form.reset();
		});
		form.transform((data) => ({
			...data,
			brand_id: data.brand_id === NEW_BRAND ? null : data.brand_id,
			brand_new: data.brand_id === NEW_BRAND ? data.brand_new : ""
		}));
		const editable = (0, vue_exports.computed)(() => props.can.edit && !props.model.demo);
		const errors = (0, vue_exports.computed)(() => form.errors);
		const context = (0, vue_exports.computed)(() => `${anzahl(props.sizes.length, "Größe", "Größen")}${props.model.updated ? ` · Geändert am ${props.model.updated}` : ""}`);
		const firstSize = (0, vue_exports.computed)(() => props.sizes[0]?.id ?? null);
		const photoSubject = (0, vue_exports.computed)(() => ({
			base: `/admin/reifen/modell/${props.model.id}`,
			idBase: `rm-photo-${props.model.id}`,
			list: `Fotos von ${props.model.title}`,
			suggestion: `${props.model.title}, Seitenansicht`,
			example: `${props.model.title}, Lauffläche`,
			only: "Es ist das einzige Foto dieses Modells. Der Shop zeigt danach wieder die neutrale Reifenzeichnung.",
			removeTitle: "Foto entfernen?"
		}));
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: __props.model.title,
				context: context.value,
				"read-only": !__props.can.edit && !__props.model.demo
			}, _attrs), {
				primary: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
						href: "/admin/reifen",
						class: "btn btn--secondary"
					}, {
						default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
									name: "chevron-left",
									size: 20
								}, null, _parent, _scopeId));
								_push(` Alle Reifen `);
							} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
								name: "chevron-left",
								size: 20
							}), (0, vue_exports.createTextVNode)(" Alle Reifen ")];
						}),
						_: 1
					}, _parent, _scopeId));
					else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
						href: "/admin/reifen",
						class: "btn btn--secondary"
					}, {
						default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
							name: "chevron-left",
							size: 20
						}), (0, vue_exports.createTextVNode)(" Alle Reifen ")]),
						_: 1
					})];
				}),
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.model.demo) _push(`<p class="adm-note rm-note" data-v-2136038d${_scopeId}>Dieses Reifenmodell gehört zu den Demodaten. Du kannst es ansehen, aber nicht ändern. Es wird zusammen mit den Demodaten entfernt.</p>`);
						else _push(`<!---->`);
						_push(`<section class="adm-section" aria-labelledby="rm-photos-h" data-v-2136038d${_scopeId}><div class="adm-section__head" data-v-2136038d${_scopeId}><h2 id="rm-photos-h" class="adm-section__title" data-v-2136038d${_scopeId}>Fotos</h2></div><p class="adm-note rm-note" data-v-2136038d${_scopeId}>Bis zu vier Fotos je Modell, zum Beispiel Seitenansicht, Lauffläche, Profil und Schrägansicht. Sie gelten für alle Größen.</p>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(FinishPhotos_default, {
							"model-id": __props.model.id,
							"finish-id": __props.model.id,
							"finish-name": "",
							image: null,
							photos: __props.photos,
							"order-stamp": __props.photoOrderStamp,
							max: __props.maxPhotos,
							editable: editable.value,
							title: __props.model.title,
							subject: photoSubject.value
						}, null, _parent, _scopeId));
						_push(`</section><section class="adm-section" aria-labelledby="rm-facts-h" data-v-2136038d${_scopeId}><div class="adm-section__head" data-v-2136038d${_scopeId}><h2 id="rm-facts-h" class="adm-section__title" data-v-2136038d${_scopeId}>Modell</h2></div><form id="rm-form" class="adm-fields rm-facts" novalidate data-v-2136038d${_scopeId}><div class="form-field" data-v-2136038d${_scopeId}><label class="form-field__label" for="rm-brand" data-v-2136038d${_scopeId}>Marke</label><select id="rm-brand" class="input"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!editable.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.brand_id ? "true" : void 0)} aria-describedby="rm-brand-err" data-v-2136038d${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.brands, (brand) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", brand.value)} data-v-2136038d${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).brand_id) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).brand_id, brand.value) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).brand_id, brand.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(brand.label)}</option>`);
						});
						_push(`<!--]--><option${(0, server_renderer_exports.ssrRenderAttr)("value", NEW_BRAND)} data-v-2136038d${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).brand_id) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).brand_id, NEW_BRAND) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).brand_id, NEW_BRAND)) ? " selected" : ""}${_scopeId}>Neue Marke anlegen …</option></select><p id="rm-brand-err" class="form-field__error" data-v-2136038d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.brand_id)}</p></div>`);
						if ((0, vue_exports.unref)(form).brand_id === NEW_BRAND) _push(`<div class="form-field" data-v-2136038d${_scopeId}><label class="form-field__label" for="rm-brand-new" data-v-2136038d${_scopeId}>Name der neuen Marke</label><input id="rm-brand-new"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).brand_new)} class="input" type="text" maxlength="60"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.brand_new ? "true" : void 0)} aria-describedby="rm-brand-new-err" data-v-2136038d${_scopeId}><p id="rm-brand-new-err" class="form-field__error" data-v-2136038d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.brand_new)}</p></div>`);
						else _push(`<!---->`);
						_push(`<div class="form-field" data-v-2136038d${_scopeId}><label class="form-field__label" for="rm-name" data-v-2136038d${_scopeId}>Modell</label><input id="rm-name"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).name)} class="input" type="text" maxlength="80"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!editable.value) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.name ? "true" : void 0)} aria-describedby="rm-name-err" data-v-2136038d${_scopeId}><p id="rm-name-err" class="form-field__error" data-v-2136038d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.name)}</p></div><div class="form-field" data-v-2136038d${_scopeId}><label class="form-field__label" for="rm-season" data-v-2136038d${_scopeId}>Saison</label><select id="rm-season" class="input"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!editable.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.season ? "true" : void 0)} aria-describedby="rm-season-err" data-v-2136038d${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.seasons, (season) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", season.value)} data-v-2136038d${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).season) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).season, season.value) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).season, season.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(season.label)}</option>`);
						});
						_push(`<!--]--></select><p id="rm-season-err" class="form-field__error" data-v-2136038d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errors.value.season)}</p></div></form></section><section class="adm-section" aria-labelledby="rm-sizes-h" data-v-2136038d${_scopeId}><div class="adm-section__head" data-v-2136038d${_scopeId}><h2 id="rm-sizes-h" class="adm-section__title" data-v-2136038d${_scopeId}>Größen</h2>`);
						if (__props.can.create && !__props.model.demo) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
							href: firstSize.value ? `/admin/reifen/neu?wie=${firstSize.value}` : `/admin/reifen/neu?modell=${__props.model.id}`,
							class: "btn btn--secondary"
						}, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "plus",
										size: 20
									}, null, _parent, _scopeId));
									_push(` Größe hinzufügen `);
								} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "plus",
									size: 20
								}), (0, vue_exports.createTextVNode)(" Größe hinzufügen ")];
							}),
							_: 1
						}, _parent, _scopeId));
						else _push(`<!---->`);
						_push(`</div><p class="adm-note rm-note" data-v-2136038d${_scopeId}>Je Größe: Lastindex und Geschwindigkeitssymbol, Preis, Verfügbarkeit und EU-Reifenlabel. Ohne vollständiges Label bietet der Shop die Größe nicht an.</p>`);
						if (__props.sizes.length === 0) _push((0, server_renderer_exports.ssrRenderComponent)(AdminState_default, {
							kind: "empty",
							text: "Dieses Modell hat keine Größe mehr. Der Shop bietet es nicht an."
						}, null, _parent, _scopeId));
						else {
							_push(`<div class="adm-panel" data-v-2136038d${_scopeId}><table class="adm-table" data-v-2136038d${_scopeId}><caption class="visually-hidden" data-v-2136038d${_scopeId}>Größen von ${(0, server_renderer_exports.ssrInterpolate)(__props.model.title)}</caption><thead data-v-2136038d${_scopeId}><tr data-v-2136038d${_scopeId}><th scope="col" data-v-2136038d${_scopeId}>Größe</th><th scope="col" class="num" data-v-2136038d${_scopeId}>Preis</th><th scope="col" data-v-2136038d${_scopeId}>EU-Reifenlabel</th><th scope="col" data-v-2136038d${_scopeId}>EPREL</th><th scope="col" data-v-2136038d${_scopeId}>Stand</th></tr></thead><tbody data-v-2136038d${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.sizes, (line) => {
								_push(`<tr data-v-2136038d${_scopeId}><td data-label="Größe" data-v-2136038d${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(link_default), {
									href: line.href,
									class: "rm-size"
								}, {
									default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
										if (_push) _push(`${(0, server_renderer_exports.ssrInterpolate)(line.size)}`);
										else return [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(line.size), 1)];
									}),
									_: 2
								}, _parent, _scopeId));
								_push(`</td><td data-label="Preis" class="num" data-v-2136038d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(formatMoney)(line.priceCents))}</td><td data-label="EU-Reifenlabel" data-v-2136038d${_scopeId}>`);
								if (line.label) {
									_push(`<!--[--><span class="rm-label" data-v-2136038d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.label.fuel)} · ${(0, server_renderer_exports.ssrInterpolate)(line.label.wet)} · ${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(withUnit)(line.label.noiseDb, "dB"))} (${(0, server_renderer_exports.ssrInterpolate)(line.label.noiseClass)})</span>`);
									if (line.label.snow || line.label.ice) _push(`<span class="rm-sub" data-v-2136038d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)([line.label.snow ? "Schneegriffigkeit" : "", line.label.ice ? "Eisgriffigkeit" : ""].filter(Boolean).join(" · "))}</span>`);
									else _push(`<!---->`);
									_push(`<!--]-->`);
								} else if (line.demo) _push(`<!--[-->–<!--]-->`);
								else _push(`<span class="adm-tag adm-tag--warn"${(0, server_renderer_exports.ssrRenderAttr)("title", `Noch nicht eingetragen: ${line.missingLabel.join(", ")}`)} data-v-2136038d${_scopeId}>Unvollständig</span>`);
								_push(`</td><td data-label="EPREL" data-phone="hide" data-v-2136038d${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(line.eprel ?? "–")}</td><td data-label="Stand" data-phone="status" data-v-2136038d${_scopeId}>`);
								if (line.demo) _push(`<span class="rm-quiet" data-v-2136038d${_scopeId}>Demodaten</span>`);
								else if (!line.available) _push(`<span class="adm-tag adm-tag--neutral" data-v-2136038d${_scopeId}>Nicht verfügbar</span>`);
								else if (!line.offered) _push(`<span class="adm-tag adm-tag--warn" data-v-2136038d${_scopeId}>Nicht im Shop</span>`);
								else _push(`<!--[-->Im Shop<!--]-->`);
								_push(`</td></tr>`);
							});
							_push(`<!--]--></tbody></table></div>`);
						}
						_push(`</section>`);
						if (editable.value) _push((0, server_renderer_exports.ssrRenderComponent)(AdminSaveBar_default, { editor: (0, vue_exports.unref)(editor) }, null, _parent, _scopeId));
						else _push(`<!---->`);
					} else return [
						__props.model.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 0,
							class: "adm-note rm-note"
						}, "Dieses Reifenmodell gehört zu den Demodaten. Du kannst es ansehen, aber nicht ändern. Es wird zusammen mit den Demodaten entfernt.")) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "rm-photos-h"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "rm-photos-h",
								class: "adm-section__title"
							}, "Fotos")]),
							(0, vue_exports.createVNode)("p", { class: "adm-note rm-note" }, "Bis zu vier Fotos je Modell, zum Beispiel Seitenansicht, Lauffläche, Profil und Schrägansicht. Sie gelten für alle Größen."),
							(0, vue_exports.createVNode)(FinishPhotos_default, {
								"model-id": __props.model.id,
								"finish-id": __props.model.id,
								"finish-name": "",
								image: null,
								photos: __props.photos,
								"order-stamp": __props.photoOrderStamp,
								max: __props.maxPhotos,
								editable: editable.value,
								title: __props.model.title,
								subject: photoSubject.value
							}, null, 8, [
								"model-id",
								"finish-id",
								"photos",
								"order-stamp",
								"max",
								"editable",
								"title",
								"subject"
							])
						]),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "rm-facts-h"
						}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
							id: "rm-facts-h",
							class: "adm-section__title"
						}, "Modell")]), (0, vue_exports.createVNode)("form", {
							id: "rm-form",
							class: "adm-fields rm-facts",
							novalidate: "",
							onSubmit: (0, vue_exports.withModifiers)((0, vue_exports.unref)(editor).save, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rm-brand"
								}, "Marke"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "rm-brand",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).brand_id = $event,
									class: "input",
									disabled: !editable.value,
									"aria-invalid": errors.value.brand_id ? "true" : void 0,
									"aria-describedby": "rm-brand-err"
								}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.brands, (brand) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
										key: brand.value,
										value: brand.value
									}, (0, vue_exports.toDisplayString)(brand.label), 9, ["value"]);
								}), 128)), (0, vue_exports.createVNode)("option", { value: NEW_BRAND }, "Neue Marke anlegen …")], 8, [
									"onUpdate:modelValue",
									"disabled",
									"aria-invalid"
								]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(form).brand_id]]),
								(0, vue_exports.createVNode)("p", {
									id: "rm-brand-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.brand_id), 1)
							]),
							(0, vue_exports.unref)(form).brand_id === NEW_BRAND ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 0,
								class: "form-field"
							}, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rm-brand-new"
								}, "Name der neuen Marke"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "rm-brand-new",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).brand_new = $event,
									class: "input",
									type: "text",
									maxlength: "60",
									"aria-invalid": errors.value.brand_new ? "true" : void 0,
									"aria-describedby": "rm-brand-new-err"
								}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).brand_new]]),
								(0, vue_exports.createVNode)("p", {
									id: "rm-brand-new-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.brand_new), 1)
							])) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rm-name"
								}, "Modell"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									id: "rm-name",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).name = $event,
									class: "input",
									type: "text",
									maxlength: "80",
									readonly: !editable.value,
									"aria-invalid": errors.value.name ? "true" : void 0,
									"aria-describedby": "rm-name-err"
								}, null, 8, [
									"onUpdate:modelValue",
									"readonly",
									"aria-invalid"
								]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).name]]),
								(0, vue_exports.createVNode)("p", {
									id: "rm-name-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.name), 1)
							]),
							(0, vue_exports.createVNode)("div", { class: "form-field" }, [
								(0, vue_exports.createVNode)("label", {
									class: "form-field__label",
									for: "rm-season"
								}, "Saison"),
								(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
									id: "rm-season",
									"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).season = $event,
									class: "input",
									disabled: !editable.value,
									"aria-invalid": errors.value.season ? "true" : void 0,
									"aria-describedby": "rm-season-err"
								}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.seasons, (season) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
										key: season.value,
										value: season.value
									}, (0, vue_exports.toDisplayString)(season.label), 9, ["value"]);
								}), 128))], 8, [
									"onUpdate:modelValue",
									"disabled",
									"aria-invalid"
								]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(form).season]]),
								(0, vue_exports.createVNode)("p", {
									id: "rm-season-err",
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(errors.value.season), 1)
							])
						], 40, ["onSubmit"])]),
						(0, vue_exports.createVNode)("section", {
							class: "adm-section",
							"aria-labelledby": "rm-sizes-h"
						}, [
							(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "rm-sizes-h",
								class: "adm-section__title"
							}, "Größen"), __props.can.create && !__props.model.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)((0, vue_exports.unref)(link_default), {
								key: 0,
								href: firstSize.value ? `/admin/reifen/neu?wie=${firstSize.value}` : `/admin/reifen/neu?modell=${__props.model.id}`,
								class: "btn btn--secondary"
							}, {
								default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "plus",
									size: 20
								}), (0, vue_exports.createTextVNode)(" Größe hinzufügen ")]),
								_: 1
							}, 8, ["href"])) : (0, vue_exports.createCommentVNode)("", true)]),
							(0, vue_exports.createVNode)("p", { class: "adm-note rm-note" }, "Je Größe: Lastindex und Geschwindigkeitssymbol, Preis, Verfügbarkeit und EU-Reifenlabel. Ohne vollständiges Label bietet der Shop die Größe nicht an."),
							__props.sizes.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminState_default, {
								key: 0,
								kind: "empty",
								text: "Dieses Modell hat keine Größe mehr. Der Shop bietet es nicht an."
							})) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 1,
								class: "adm-panel"
							}, [(0, vue_exports.createVNode)("table", { class: "adm-table" }, [
								(0, vue_exports.createVNode)("caption", { class: "visually-hidden" }, "Größen von " + (0, vue_exports.toDisplayString)(__props.model.title), 1),
								(0, vue_exports.createVNode)("thead", null, [(0, vue_exports.createVNode)("tr", null, [
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Größe"),
									(0, vue_exports.createVNode)("th", {
										scope: "col",
										class: "num"
									}, "Preis"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "EU-Reifenlabel"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "EPREL"),
									(0, vue_exports.createVNode)("th", { scope: "col" }, "Stand")
								])]),
								(0, vue_exports.createVNode)("tbody", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.sizes, (line) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("tr", { key: line.id }, [
										(0, vue_exports.createVNode)("td", { "data-label": "Größe" }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(link_default), {
											href: line.href,
											class: "rm-size"
										}, {
											default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(line.size), 1)]),
											_: 2
										}, 1032, ["href"])]),
										(0, vue_exports.createVNode)("td", {
											"data-label": "Preis",
											class: "num"
										}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(formatMoney)(line.priceCents)), 1),
										(0, vue_exports.createVNode)("td", { "data-label": "EU-Reifenlabel" }, [line.label ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)("span", { class: "rm-label" }, (0, vue_exports.toDisplayString)(line.label.fuel) + " · " + (0, vue_exports.toDisplayString)(line.label.wet) + " · " + (0, vue_exports.toDisplayString)((0, vue_exports.unref)(withUnit)(line.label.noiseDb, "dB")) + " (" + (0, vue_exports.toDisplayString)(line.label.noiseClass) + ")", 1), line.label.snow || line.label.ice ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: "rm-sub"
										}, (0, vue_exports.toDisplayString)([line.label.snow ? "Schneegriffigkeit" : "", line.label.ice ? "Eisgriffigkeit" : ""].filter(Boolean).join(" · ")), 1)) : (0, vue_exports.createCommentVNode)("", true)], 64)) : line.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("–")], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 2,
											class: "adm-tag adm-tag--warn",
											title: `Noch nicht eingetragen: ${line.missingLabel.join(", ")}`
										}, "Unvollständig", 8, ["title"]))]),
										(0, vue_exports.createVNode)("td", {
											"data-label": "EPREL",
											"data-phone": "hide"
										}, (0, vue_exports.toDisplayString)(line.eprel ?? "–"), 1),
										(0, vue_exports.createVNode)("td", {
											"data-label": "Stand",
											"data-phone": "status"
										}, [line.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 0,
											class: "rm-quiet"
										}, "Demodaten")) : !line.available ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 1,
											class: "adm-tag adm-tag--neutral"
										}, "Nicht verfügbar")) : !line.offered ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
											key: 2,
											class: "adm-tag adm-tag--warn"
										}, "Nicht im Shop")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createTextVNode)("Im Shop")], 64))])
									]);
								}), 128))])
							])]))
						]),
						editable.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminSaveBar_default, {
							key: 1,
							editor: (0, vue_exports.unref)(editor)
						}, null, 8, ["editor"])) : (0, vue_exports.createCommentVNode)("", true)
					];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Reifen/Modell.vue
var _sfc_setup = Modell_vue_vue_type_script_setup_true_lang_default.setup;
Modell_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Reifen/Modell.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Modell_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Modell_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-2136038d"]]);
//#endregion
export { Modell_default as default };
