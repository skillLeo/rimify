import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-B8jfLKlm.js";
import { c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-DVxSMX1j.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-COuF1lMZ.js";
import { t as AdminConfirm_default } from "./AdminConfirm-DBodxbIw.js";
import { n as useDirtyForm } from "./useDirtyForm-jjlNVm-n.js";
import { t as AdminSaveBar_default } from "./AdminSaveBar-Cubm1Sz1.js";
import { t as FinishPhotos_default } from "./FinishPhotos-oQyUBlaf.js";
import { r as generate, t as MatrixPanel_default } from "./MatrixPanel-BwNEVoKj.js";
import { t as SizesTable_default } from "./SizesTable-kKUrWPsy.js";
//#region resources/js/lib/wheelTitle.ts
/**
* A wheel's name in the shop (his admin items 5, 6 and 13, D-298) — the rule of App\Support\WheelTitle, for the admin's
* preview while typing: the brand, the model and the Radtypenbezeichnung, the last left out where it is empty or the
* model's name already holds it. The brand always leads; a typed title is read as what follows it.
*/
function tidy(text) {
	return text.replace(/\s+/gu, " ").trim();
}
var lower = (text) => text.toLocaleLowerCase("de-DE");
/** `BORBET Havanna HA 8018` */
function composedTitle(brand, model, designation) {
	const rtb = tidy(designation);
	const parts = [brand, model];
	if (rtb !== "" && !lower(model).includes(lower(rtb))) parts.push(rtb);
	return tidy(parts.join(" "));
}
/** A title without a leading brand name; a title that does not start with it, whole. */
function afterBrand(brand, full) {
	const b = tidy(brand);
	const f = tidy(full);
	return b !== "" && lower(`${f} `).startsWith(lower(`${b} `)) ? tidy(f.slice(b.length)) : f;
}
/** The title the shop shows: the brand, then the typed title's rest or the composition's. */
function shopTitle(brand, model, designation, typed) {
	return tidy(`${brand} ${afterBrand(brand, tidy(typed) || composedTitle(brand, model, designation))}`);
}
/** Whether a typed title differs from what the parts make — said, never silently replaced. */
function titleDiverges(brand, model, designation, typed) {
	return tidy(typed) !== "" && shopTitle(brand, model, designation, typed) !== composedTitle(brand, model, designation);
}
//#endregion
//#region resources/js/Pages/Admin/Felgen/Edit.vue?vue&type=script&setup=true&lang.ts
var NEW_BRAND = -1;
var Edit_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Edit",
	__ssrInlineRender: true,
	props: {
		stamp: {},
		model: {},
		finishes: {},
		configs: {},
		documents: {},
		check: {},
		brands: {},
		options: {},
		can: {}
	},
	setup(__props) {
		/**
		* Katalog › Felgen › one Felge — its master data, finishes with photographs, the size matrix, and the
		* words for search engines, saved together (WheelEditor); and its step into the shop, which is not a
		* save (the review release §4.2).
		*
		* The Freigabe-Check stands above the form: what stops publishing, and what only needs knowing. It is
		* the server's reading of the saved rows, so it changes when the form is saved, not while typing.
		* A size an approval names keeps its measurements (SizesTable).
		*/
		const props = __props;
		function fromProps() {
			const model = props.model;
			return {
				brand_id: model?.brandId ?? null,
				brand_new: "",
				name: model?.name ?? "",
				type_designation: model?.typeDesignation ?? "",
				title: model?.title ?? "",
				spoke_count: model?.spokeCount ?? 5,
				description: model?.description ?? "",
				seo_title: model?.seoTitle ?? "",
				seo_description: model?.seoDescription ?? "",
				internal_note: model?.internalNote ?? "",
				finishes: props.finishes.length ? props.finishes.map((f) => ({
					key: f.key,
					id: f.id,
					name: f.name,
					hex: f.hex,
					art_finish: f.artFinish
				})) : [{
					key: "n1",
					id: null,
					name: "",
					hex: "",
					art_finish: "graphite"
				}],
				configs: props.configs.map(({ locked: _locked, ...size }) => ({ ...size }))
			};
		}
		const editor = useDirtyForm(fromProps(), {
			method: () => props.model ? "put" : "post",
			url: () => props.model ? `/admin/felgen/${props.model.id}` : "/admin/felgen",
			stamp: () => props.stamp,
			onSaved: () => sync()
		});
		const form = editor.form;
		form.transform((data) => ({
			...data,
			brand_id: data.brand_id === NEW_BRAND ? null : data.brand_id,
			brand_new: data.brand_id === NEW_BRAND ? data.brand_new : ""
		}));
		/**
		* After a save the server's rows are the truth: new finishes and sizes now have ids, and a second
		* save must not create them again.
		*/
		function sync() {
			const fresh = fromProps();
			form.defaults(fresh);
			form.reset();
			form.clearErrors();
		}
		(0, vue_exports.watch)(() => props.model?.id, () => sync());
		const editable = (0, vue_exports.computed)(() => props.model ? props.can.edit : props.can.create);
		const readonly = (0, vue_exports.computed)(() => !editable.value);
		const locked = (0, vue_exports.computed)(() => props.configs.flatMap((c) => c.locked && c.id !== null ? [c.id] : []));
		const title = (0, vue_exports.computed)(() => props.model ? props.model.fullTitle : "Neue Felge");
		const context = (0, vue_exports.computed)(() => {
			if (!props.model) return "Entwurf, noch nicht gespeichert";
			const sizes = props.configs.length === 1 ? "1 Größe" : `${props.configs.length} Größen`;
			return `${props.model.statusLabel} · ${sizes}${props.model.updated ? ` · geändert am ${props.model.updated}` : ""}`;
		});
		const inertiaPage = usePage();
		const errors = (0, vue_exports.computed)(() => form.errors);
		const stepError = (0, vue_exports.computed)(() => (inertiaPage.props.errors ?? {}).publish ?? "");
		function err(path) {
			return errors.value[path] ?? "";
		}
		const errorCount = (0, vue_exports.computed)(() => Object.values(errors.value).filter((value) => typeof value === "string" && value !== "").length);
		let counter = 0;
		function nextKey(prefix) {
			counter++;
			return `${prefix}${Date.now().toString(36)}${counter}`;
		}
		function addFinish() {
			form.finishes.push({
				key: nextKey("n"),
				id: null,
				name: "",
				hex: "",
				art_finish: "graphite"
			});
			(0, vue_exports.nextTick)(() => document.getElementById(`fe-f-${form.finishes.length - 1}-name`)?.focus());
		}
		function usedBy(finish) {
			return form.configs.filter((size) => size.finish === finish.key).length;
		}
		function removeFinish(index) {
			form.finishes.splice(index, 1);
			form.clearErrors();
			(0, vue_exports.nextTick)(() => document.getElementById(`fe-f-${Math.min(index, form.finishes.length - 1)}-name`)?.focus());
		}
		function serverFinish(finish) {
			return finish.id === null ? null : props.finishes.find((f) => f.id === finish.id) ?? null;
		}
		const brandName = (0, vue_exports.computed)(() => {
			if (form.brand_id === NEW_BRAND) return form.brand_new;
			return props.brands.find((b) => b.value === form.brand_id)?.label ?? "";
		});
		const matrixStart = (0, vue_exports.computed)(() => {
			const first = form.configs[0];
			return {
				bolt_holes: first?.bolt_holes ?? 5,
				bolt_circle: first?.bolt_circle ?? "",
				bore: first?.bore ?? ""
			};
		});
		const added = (0, vue_exports.ref)("");
		const matrixOpen = (0, vue_exports.ref)(props.configs.length === 0);
		function addSizes(input) {
			const rows = generate(input, form.finishes, form.configs, brandName.value, form.name, () => nextKey("m"));
			form.configs.push(...rows);
			added.value = rows.length === 0 ? "Alle diese Größen stehen schon in der Tabelle." : `${rows.length === 1 ? "1 Größe" : `${rows.length} Größen`} hinzugefügt. Sie werden mit „Speichern“ angelegt.`;
		}
		function addSize() {
			const last = form.configs[form.configs.length - 1];
			const size = {
				key: nextKey("m"),
				id: null,
				finish: last?.finish ?? form.finishes[0]?.key ?? "",
				diameter: last?.diameter ?? "",
				width: last?.width ?? "",
				et: "",
				bolt_holes: last?.bolt_holes ?? 5,
				bolt_circle: last?.bolt_circle ?? "",
				bore: last?.bore ?? "",
				sku: "",
				ean: "",
				kba: "",
				price: last?.price ?? "",
				available: true,
				weight_g: null
			};
			form.configs.push(size);
			(0, vue_exports.nextTick)(() => {
				const field = document.getElementById(`fe-size-${form.configs.length - 1}-finish`);
				field?.scrollIntoView({ block: "center" });
				field?.focus({ preventScroll: true });
			});
		}
		function removeSize(index) {
			form.configs.splice(index, 1);
			form.clearErrors();
			(0, vue_exports.nextTick)(() => {
				(document.getElementById(`fe-size-${Math.min(index, form.configs.length - 1)}-sku`) ?? document.getElementById("fe-add-size"))?.focus();
			});
		}
		/** What brand, model and Radtypenbezeichnung make — the title while none is typed. */
		const composed = (0, vue_exports.computed)(() => composedTitle(brandName.value, form.name, form.type_designation));
		/** What the shop will show: the brand, then the typed title's rest or the composition's. */
		const inShop = (0, vue_exports.computed)(() => shopTitle(brandName.value, form.name, form.type_designation, form.title));
		/** A typed title the parts no longer make: said, and the composition offered — never overwritten unasked. */
		const diverges = (0, vue_exports.computed)(() => titleDiverges(brandName.value, form.name, form.type_designation, form.title));
		/** Saved before the rule (D-298): a Felge without its Radtypenbezeichnung saves, the list names it, and it is not published (D-300). Read from the saved record, not the field being typed. */
		const designationMissing = (0, vue_exports.computed)(() => props.model !== null && props.model.typeDesignation.trim() === "");
		function useComposedTitle() {
			form.title = "";
			document.getElementById("fe-title")?.focus();
		}
		const seoTitlePreview = (0, vue_exports.computed)(() => form.seo_title || inShop.value || "Titel der Felge");
		const seoDescriptionPreview = (0, vue_exports.computed)(() => form.seo_description || form.description.slice(0, 160) || "Beschreibung der Felge für Suchmaschinen.");
		const step = (0, vue_exports.ref)(null);
		const stepBusy = (0, vue_exports.ref)(false);
		const stepOpen = (0, vue_exports.computed)({
			get: () => step.value !== null,
			set: (open) => {
				if (!open) step.value = null;
			}
		});
		const STEPS = {
			veroeffentlichen: {
				title: "Felge veröffentlichen?",
				body: "Sie ist danach im Shop und wird bei jedem Fahrzeug gezeigt, für das eine Freigabe hinterlegt ist.",
				label: "Veröffentlichen"
			},
			zurueckziehen: {
				title: "Felge zurückziehen?",
				body: "Sie ist danach nicht mehr im Shop. Offene Warenkörbe mit ihr können nicht mehr bestellt werden.",
				label: "Zurückziehen"
			},
			archivieren: {
				title: "Felge archivieren?",
				body: "Sie verschwindet aus dem Shop und aus der Liste. Unter „Status: Archiviert“ findest du sie wieder.",
				label: "Archivieren"
			},
			wiederherstellen: {
				title: "Felge wiederherstellen?",
				body: "Sie wird wieder ein Entwurf und steht in der Liste. In den Shop kommt sie erst, wenn du sie veröffentlichst.",
				label: "Wiederherstellen"
			}
		};
		function runStep() {
			if (!props.model || step.value === null) return;
			stepBusy.value = true;
			router.post(`/admin/felgen/${props.model.id}/${step.value}`, {}, {
				preserveScroll: true,
				onFinish: () => {
					stepBusy.value = false;
					step.value = null;
				}
			});
		}
		const blocked = (0, vue_exports.computed)(() => (props.check?.blockers.length ?? 0) > 0);
		const canPublish = (0, vue_exports.computed)(() => !!props.model && props.can.publish && !props.model.demo && props.model.status === "draft");
		const canUnpublish = (0, vue_exports.computed)(() => !!props.model && props.can.publish && props.model.status === "published");
		const more = (0, vue_exports.computed)(() => {
			const actions = [];
			const model = props.model;
			if (!model) return actions;
			if (model.shopUrl) actions.push({
				label: "Im Shop ansehen",
				href: model.shopUrl,
				icon: "eye"
			});
			if (canUnpublish.value) actions.push({
				label: "Zurückziehen",
				run: () => step.value = "zurueckziehen",
				icon: "eye-off"
			});
			if (props.can.archive && model.status === "archived") actions.push({
				label: "Wiederherstellen",
				run: () => step.value = "wiederherstellen"
			});
			else if (props.can.archive) actions.push({
				label: "Archivieren",
				run: () => step.value = "archivieren",
				danger: true
			});
			return actions;
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: title.value,
				context: context.value,
				more: more.value,
				"read-only": readonly.value
			}, _attrs), (0, vue_exports.createSlots)({
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						if (__props.model) {
							_push(`<section class="${(0, server_renderer_exports.ssrRenderClass)([{ "fe-check--blocked": blocked.value }, "fe-check"])}" aria-labelledby="fe-check-h" data-v-c420258b${_scopeId}><h2 id="fe-check-h" class="fe-check__title" data-v-c420258b${_scopeId}> Vor dem Veröffentlichen <span class="fe-check__verdict" data-v-c420258b${_scopeId}>`);
							if (__props.model.demo) _push(`<!--[-->Nicht veröffentlichbar<!--]-->`);
							else if (__props.model.status === "published") _push(`<!--[-->Im Shop<!--]-->`);
							else if (blocked.value) _push(`<!--[-->Noch nicht veröffentlichbar<!--]-->`);
							else _push(`<!--[-->Kann veröffentlicht werden<!--]-->`);
							_push(`</span></h2>`);
							if (__props.check && (__props.check.blockers.length || __props.check.hints.length)) {
								_push(`<ul class="fe-check__list" data-v-c420258b${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.check.blockers, (line) => {
									_push(`<li class="fe-check__item fe-check__item--bad" data-v-c420258b${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "warning",
										size: 16
									}, null, _parent, _scopeId));
									_push(` ${(0, server_renderer_exports.ssrInterpolate)(line)}</li>`);
								});
								_push(`<!--]--><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(__props.check.hints, (line) => {
									_push(`<li class="fe-check__item" data-v-c420258b${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "info",
										size: 16
									}, null, _parent, _scopeId));
									_push(` ${(0, server_renderer_exports.ssrInterpolate)(line)}</li>`);
								});
								_push(`<!--]--></ul>`);
							} else _push(`<p class="adm-note" data-v-c420258b${_scopeId}>Nichts steht im Weg.</p>`);
							if (canPublish.value && (0, vue_exports.unref)(editor).dirty.value) _push(`<p class="adm-note" data-v-c420258b${_scopeId}>Speichere zuerst deine Änderungen – veröffentlicht wird, was gespeichert ist.</p>`);
							else _push(`<!---->`);
							if (stepError.value) _push(`<p class="adm-alert" role="alert" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(stepError.value)}</p>`);
							else _push(`<!---->`);
							_push(`</section>`);
						} else _push(`<p class="adm-note fe-first" data-v-c420258b${_scopeId}>Nach dem ersten Speichern steht hier, ob die Felge in den Shop kann. Gespeichert wird sie als Entwurf.</p>`);
						if (__props.model?.internalNote) {
							_push(`<p class="fe-memo" role="note" data-v-c420258b${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "info",
								size: 16
							}, null, _parent, _scopeId));
							_push(`<span data-v-c420258b${_scopeId}><strong data-v-c420258b${_scopeId}>Interne Notiz:</strong> ${(0, server_renderer_exports.ssrInterpolate)(__props.model.internalNote)}</span></p>`);
						} else _push(`<!---->`);
						if (errorCount.value) _push(`<p class="adm-alert" role="alert" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(errorCount.value === 1 ? "Eine Angabe muss noch korrigiert werden." : `${errorCount.value} Angaben müssen noch korrigiert werden.`)} Die Hinweise stehen bei den Feldern. </p>`);
						else _push(`<!---->`);
						if (err("configs")) _push(`<p class="adm-alert" role="alert" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("configs"))}</p>`);
						else _push(`<!---->`);
						_push(`<form class="fe-form" novalidate data-v-c420258b${_scopeId}><section class="adm-section" aria-labelledby="fe-h-base" data-v-c420258b${_scopeId}><div class="adm-section__head" data-v-c420258b${_scopeId}><h2 id="fe-h-base" class="adm-section__title" data-v-c420258b${_scopeId}>Stammdaten</h2></div><div class="adm-fields fe-narrow" data-v-c420258b${_scopeId}><div class="form-field" data-v-c420258b${_scopeId}><label class="form-field__label" for="fe-brand" data-v-c420258b${_scopeId}>Marke</label><select id="fe-brand" class="input"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("brand_id") ? "true" : void 0)} aria-describedby="fe-brand-err" data-v-c420258b${_scopeId}><option${(0, server_renderer_exports.ssrRenderAttr)("value", null)} disabled data-v-c420258b${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).brand_id) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).brand_id, null) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).brand_id, null)) ? " selected" : ""}${_scopeId}>Marke wählen</option><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.brands, (brand) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", brand.value)} data-v-c420258b${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).brand_id) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).brand_id, brand.value) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).brand_id, brand.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(brand.label)}</option>`);
						});
						_push(`<!--]--><option${(0, server_renderer_exports.ssrRenderAttr)("value", NEW_BRAND)} data-v-c420258b${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).brand_id) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).brand_id, NEW_BRAND) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).brand_id, NEW_BRAND)) ? " selected" : ""}${_scopeId}>Neue Marke anlegen …</option></select><p id="fe-brand-err" class="form-field__error" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("brand_id"))}</p></div>`);
						if ((0, vue_exports.unref)(form).brand_id === NEW_BRAND) _push(`<div class="form-field" data-v-c420258b${_scopeId}><label class="form-field__label" for="fe-brand-new" data-v-c420258b${_scopeId}>Name der neuen Marke</label><input id="fe-brand-new"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).brand_new)} class="input" type="text" maxlength="60"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("brand_new") ? "true" : void 0)} aria-describedby="fe-brand-new-err" data-v-c420258b${_scopeId}><p id="fe-brand-new-err" class="form-field__error" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("brand_new"))}</p></div>`);
						else _push(`<!---->`);
						_push(`<div class="form-field" data-v-c420258b${_scopeId}><label class="form-field__label" for="fe-name" data-v-c420258b${_scopeId}>Modell</label><input id="fe-name"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).name)} class="input" type="text" maxlength="80"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("name") ? "true" : void 0)} aria-describedby="fe-name-err" data-v-c420258b${_scopeId}><p id="fe-name-err" class="form-field__error" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("name"))}</p></div><div class="form-field" data-v-c420258b${_scopeId}><label class="form-field__label" for="fe-type" data-v-c420258b${_scopeId}>Radtypenbezeichnung</label><input id="fe-type"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).type_designation)} class="input" type="text" maxlength="80" spellcheck="false"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("type_designation") ? "true" : void 0)} aria-describedby="fe-type-help fe-type-err" data-v-c420258b${_scopeId}><p id="fe-type-help" class="form-field__help" data-v-c420258b${_scopeId}> So, wie das Gutachten sie druckt. Ohne eigenen Titel im Shop steht sie im Namen der Felge – so findet ein Kunde die Felge im Gutachten wieder. `);
						if (designationMissing.value) _push(`<!--[--> Diese Felge ist noch ohne Radtypenbezeichnung gespeichert und lässt sich so nicht veröffentlichen. Trag sie nach, sobald du das Gutachten zur Hand hast.<!--]-->`);
						else _push(`<!---->`);
						_push(`</p><p id="fe-type-err" class="form-field__error" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("type_designation"))}</p></div><div class="form-field" data-v-c420258b${_scopeId}><label class="form-field__label" for="fe-title" data-v-c420258b${_scopeId}>Titel im Shop <span class="fe-optional" data-v-c420258b${_scopeId}>(optional)</span></label><input id="fe-title"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).title)} class="input" type="text" maxlength="160"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("title") ? "true" : void 0)} aria-describedby="fe-title-help fe-title-err" data-v-c420258b${_scopeId}><p id="fe-title-help" class="form-field__help" data-v-c420258b${_scopeId}> Bleibt das Feld leer, setzt der Shop den Titel aus Marke, Modell und Radtypenbezeichnung zusammen. Die Marke steht immer vorn. Im Shop: „${(0, server_renderer_exports.ssrInterpolate)(inShop.value || "–")}“. </p>`);
						if (diverges.value) {
							_push(`<div class="fe-title-diverges" role="status" data-v-c420258b${_scopeId}><p class="adm-note" data-v-c420258b${_scopeId}>Dieser Titel weicht vom zusammengesetzten ab: <span class="fe-title-composed" data-v-c420258b${_scopeId}>„${(0, server_renderer_exports.ssrInterpolate)(composed.value)}“</span>.</p>`);
							if (!readonly.value) _push(`<button class="btn btn--ghost btn--sm fe-title-use" type="button" data-v-c420258b${_scopeId}>Zusammengesetzten Titel verwenden</button>`);
							else _push(`<!---->`);
							_push(`</div>`);
						} else _push(`<!---->`);
						_push(`<p id="fe-title-err" class="form-field__error" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("title"))}</p></div><div class="form-field" data-v-c420258b${_scopeId}><label class="form-field__label" for="fe-spokes" data-v-c420258b${_scopeId}>Speichen</label><select id="fe-spokes" class="input fe-short"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " disabled" : ""} aria-describedby="fe-spokes-help" data-v-c420258b${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(__props.options.spokes, (n) => {
							_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", n)} data-v-c420258b${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray((0, vue_exports.unref)(form).spoke_count) ? (0, server_renderer_exports.ssrLooseContain)((0, vue_exports.unref)(form).spoke_count, n) : (0, server_renderer_exports.ssrLooseEqual)((0, vue_exports.unref)(form).spoke_count, n)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(n)}</option>`);
						});
						_push(`<!--]--></select><p id="fe-spokes-help" class="form-field__help" data-v-c420258b${_scopeId}>Bestimmt die Umrisszeichnung, solange es kein Foto gibt.</p></div><div class="form-field" data-v-c420258b${_scopeId}><label class="form-field__label" for="fe-desc" data-v-c420258b${_scopeId}>Beschreibung <span class="fe-optional" data-v-c420258b${_scopeId}>(optional)</span></label><textarea id="fe-desc" class="input fe-area" rows="5" maxlength="4000"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("description") ? "true" : void 0)} aria-describedby="fe-desc-err" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).description)}</textarea><p id="fe-desc-err" class="form-field__error" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("description"))}</p></div><div class="form-field" data-v-c420258b${_scopeId}><label class="form-field__label" for="fe-memo" data-v-c420258b${_scopeId}>Interne Notiz <span class="fe-optional" data-v-c420258b${_scopeId}>(optional, nur im Admin)</span></label><textarea id="fe-memo" class="input fe-area" rows="2" maxlength="500"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err("internal_note") ? "true" : void 0)} aria-describedby="fe-memo-help fe-memo-err" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).internal_note)}</textarea><p id="fe-memo-help" class="form-field__help" data-v-c420258b${_scopeId}>Steht über dieser Felge und in der Liste, nie im Shop – etwa „Platzhalterpreise, vom Kunden zu ersetzen“.</p><p id="fe-memo-err" class="form-field__error" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("internal_note"))}</p></div></div></section><section class="adm-section" aria-labelledby="fe-h-finishes" data-v-c420258b${_scopeId}><div class="adm-section__head" data-v-c420258b${_scopeId}><h2 id="fe-h-finishes" class="adm-section__title" data-v-c420258b${_scopeId}>Ausführungen</h2>`);
						if (!readonly.value) {
							_push(`<button class="btn btn--ghost" type="button" data-v-c420258b${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "plus",
								size: 20
							}, null, _parent, _scopeId));
							_push(` Ausführung hinzufügen </button>`);
						} else _push(`<!---->`);
						_push(`</div>`);
						if (err("finishes")) _push(`<p class="form-field__error" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("finishes"))}</p>`);
						else _push(`<!---->`);
						_push(`<ol class="fe-finishes" data-v-c420258b${_scopeId}><!--[-->`);
						(0, server_renderer_exports.ssrRenderList)((0, vue_exports.unref)(form).finishes, (finish, index) => {
							_push(`<li class="fe-finish" data-v-c420258b${_scopeId}><div class="fe-finish__fields" data-v-c420258b${_scopeId}><div class="form-field" data-v-c420258b${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `fe-f-${index}-name`)} data-v-c420258b${_scopeId}>Name</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `fe-f-${index}-name`)}${(0, server_renderer_exports.ssrRenderAttr)("value", finish.name)} class="input" type="text" maxlength="60" placeholder="z. B. Graphit matt"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err(`finishes.${index}.name`) ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `fe-f-${index}-name-err`)} data-v-c420258b${_scopeId}><p${(0, server_renderer_exports.ssrRenderAttr)("id", `fe-f-${index}-name-err`)} class="form-field__error" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err(`finishes.${index}.name`))}</p></div><div class="form-field" data-v-c420258b${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `fe-f-${index}-hex`)} data-v-c420258b${_scopeId}>Farbfeld <span class="fe-optional" data-v-c420258b${_scopeId}>(optional)</span></label><div class="fe-hex" data-v-c420258b${_scopeId}><input class="fe-hex__swatch" type="color"${(0, server_renderer_exports.ssrRenderAttr)("value", /^#[0-9A-Fa-f]{6}$/.test(finish.hex) ? finish.hex : "#C9CED5")}${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Farbe für ${finish.name || "die Ausführung"} wählen`)} data-v-c420258b${_scopeId}><input${(0, server_renderer_exports.ssrRenderAttr)("id", `fe-f-${index}-hex`)}${(0, server_renderer_exports.ssrRenderAttr)("value", finish.hex)} class="input" type="text" maxlength="7" placeholder="#3F454D" spellcheck="false"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " readonly" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", err(`finishes.${index}.hex`) ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `fe-f-${index}-hex-err`)} data-v-c420258b${_scopeId}></div><p${(0, server_renderer_exports.ssrRenderAttr)("id", `fe-f-${index}-hex-err`)} class="form-field__error" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err(`finishes.${index}.hex`))}</p></div><div class="form-field" data-v-c420258b${_scopeId}><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `fe-f-${index}-art`)} data-v-c420258b${_scopeId}>Farbe der Umrisszeichnung</label><select${(0, server_renderer_exports.ssrRenderAttr)("id", `fe-f-${index}-art`)} class="input"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " disabled" : ""} data-v-c420258b${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.options.artFinishes, (option) => {
								_push(`<option${(0, server_renderer_exports.ssrRenderAttr)("value", option.value)} data-v-c420258b${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(finish.art_finish) ? (0, server_renderer_exports.ssrLooseContain)(finish.art_finish, option.value) : (0, server_renderer_exports.ssrLooseEqual)(finish.art_finish, option.value)) ? " selected" : ""}${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(option.label)}</option>`);
							});
							_push(`<!--]--></select></div>`);
							if (!readonly.value && (0, vue_exports.unref)(form).finishes.length > 1) {
								_push(`<div class="fe-finish__remove" data-v-c420258b${_scopeId}>`);
								if (usedBy(finish) === 0) _push(`<button class="btn btn--ghost" type="button" data-v-c420258b${_scopeId}>Entfernen</button>`);
								else _push(`<p class="adm-note fe-finish__used" data-v-c420258b${_scopeId}>Von ${(0, server_renderer_exports.ssrInterpolate)(usedBy(finish) === 1 ? "einer Größe" : `${usedBy(finish)} Größen`)} genutzt – erst die Größen entfernen.</p>`);
								_push(`</div>`);
							} else _push(`<!---->`);
							_push(`</div>`);
							if (__props.model && finish.id !== null && serverFinish(finish)) _push((0, server_renderer_exports.ssrRenderComponent)(FinishPhotos_default, {
								"model-id": __props.model.id,
								"finish-id": finish.id,
								"finish-name": serverFinish(finish).name,
								image: serverFinish(finish).image,
								photos: serverFinish(finish).photos,
								"order-stamp": serverFinish(finish).photoOrderStamp,
								max: __props.options.maxPhotos,
								editable: editable.value,
								title: title.value
							}, null, _parent, _scopeId));
							else _push(`<p class="adm-note" data-v-c420258b${_scopeId}>Nach dem Speichern kannst du für diese Ausführung Fotos hochladen.</p>`);
							_push(`</li>`);
						});
						_push(`<!--]--></ol></section><section class="adm-section" aria-labelledby="fe-h-sizes" data-v-c420258b${_scopeId}><div class="adm-section__head" data-v-c420258b${_scopeId}><h2 id="fe-h-sizes" class="adm-section__title" data-v-c420258b${_scopeId}>Größen</h2>`);
						if (!readonly.value) {
							_push(`<div class="fe-size-actions" data-v-c420258b${_scopeId}><button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-expanded", matrixOpen.value ? "true" : "false")} aria-controls="fe-matrix" data-v-c420258b${_scopeId}> Größen aus Listen erzeugen `);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: matrixOpen.value ? "chevron-up" : "chevron-down",
								size: 16
							}, null, _parent, _scopeId));
							_push(`</button><button id="fe-add-size" class="btn btn--ghost" type="button" data-v-c420258b${_scopeId}>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "plus",
								size: 20
							}, null, _parent, _scopeId));
							_push(` Eine Größe hinzufügen </button></div>`);
						} else _push(`<!---->`);
						_push(`</div><p class="adm-note" data-v-c420258b${_scopeId}>Preis je Felge, mit Mehrwertsteuer. Eine Größe, die in einem Gutachten steht, behält ihre Maße.</p>`);
						if (!readonly.value && matrixOpen.value) _push((0, server_renderer_exports.ssrRenderComponent)(MatrixPanel_default, {
							id: "fe-matrix",
							finishes: (0, vue_exports.unref)(form).finishes,
							"bolt-holes": __props.options.boltHoles,
							start: matrixStart.value,
							onAdd: addSizes
						}, null, _parent, _scopeId));
						else _push(`<!---->`);
						if (added.value) _push(`<p class="adm-note fe-added" role="status" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(added.value)}</p>`);
						else _push(`<!---->`);
						if ((0, vue_exports.unref)(form).configs.length) _push((0, server_renderer_exports.ssrRenderComponent)(SizesTable_default, {
							sizes: (0, vue_exports.unref)(form).configs,
							"onUpdate:sizes": ($event) => (0, vue_exports.unref)(form).configs = $event,
							finishes: (0, vue_exports.unref)(form).finishes,
							documents: __props.documents,
							locked: locked.value,
							errors: errors.value,
							readonly: readonly.value,
							"bolt-holes": __props.options.boltHoles,
							onRemove: removeSize
						}, null, _parent, _scopeId));
						else _push(`<p class="adm-note fe-nosizes" data-v-c420258b${_scopeId}>Noch keine Größe. Erzeuge sie oben aus Listen oder füge eine einzeln hinzu.</p>`);
						_push(`</section><section class="adm-section" aria-labelledby="fe-h-seo" data-v-c420258b${_scopeId}><div class="adm-section__head" data-v-c420258b${_scopeId}><h2 id="fe-h-seo" class="adm-section__title" data-v-c420258b${_scopeId}>Suchmaschinen</h2></div><div class="adm-fields fe-narrow" data-v-c420258b${_scopeId}><div class="form-field" data-v-c420258b${_scopeId}><div class="fe-count-head" data-v-c420258b${_scopeId}><label class="form-field__label" for="fe-seo-t" data-v-c420258b${_scopeId}>Titel <span class="fe-optional" data-v-c420258b${_scopeId}>(optional)</span></label><span class="${(0, server_renderer_exports.ssrRenderClass)([{ "fe-count--over": (0, vue_exports.unref)(form).seo_title.length > 60 }, "fe-count"])}" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).seo_title.length)} / 60</span></div><input id="fe-seo-t"${(0, server_renderer_exports.ssrRenderAttr)("value", (0, vue_exports.unref)(form).seo_title)} class="input" type="text" maxlength="70"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " readonly" : ""} aria-describedby="fe-seo-t-help fe-seo-t-err" data-v-c420258b${_scopeId}><p id="fe-seo-t-help" class="form-field__help" data-v-c420258b${_scopeId}>Leer lassen, dann besteht der Titel aus Marke und Modell. Suchmaschinen zeigen meist etwa 60 Zeichen; speichern kannst du bis zu 70.</p><p id="fe-seo-t-err" class="form-field__error" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("seo_title"))}</p></div><div class="form-field" data-v-c420258b${_scopeId}><div class="fe-count-head" data-v-c420258b${_scopeId}><label class="form-field__label" for="fe-seo-d" data-v-c420258b${_scopeId}>Beschreibung <span class="fe-optional" data-v-c420258b${_scopeId}>(optional)</span></label><span class="${(0, server_renderer_exports.ssrRenderClass)([{ "fe-count--over": (0, vue_exports.unref)(form).seo_description.length > 155 }, "fe-count"])}" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).seo_description.length)} / 155</span></div><textarea id="fe-seo-d" class="input fe-area" rows="3" maxlength="170"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(readonly.value) ? " readonly" : ""} aria-describedby="fe-seo-d-help fe-seo-d-err" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(form).seo_description)}</textarea><p id="fe-seo-d-help" class="form-field__help" data-v-c420258b${_scopeId}>Suchmaschinen zeigen meist etwa 155 Zeichen; speichern kannst du bis zu 170.</p><p id="fe-seo-d-err" class="form-field__error" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("seo_description"))}</p></div><figure class="fe-serp" aria-label="So etwa erscheint die Felge in den Suchergebnissen" data-v-c420258b${_scopeId}><p class="fe-serp__title" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(seoTitlePreview.value)}</p><p class="fe-serp__desc" data-v-c420258b${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(seoDescriptionPreview.value)}</p></figure></div></section></form>`);
						if (editable.value) _push((0, server_renderer_exports.ssrRenderComponent)(AdminSaveBar_default, { editor: (0, vue_exports.unref)(editor) }, null, _parent, _scopeId));
						else _push(`<!---->`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: stepOpen.value,
							"onUpdate:open": ($event) => stepOpen.value = $event,
							title: step.value ? STEPS[step.value].title : "",
							body: step.value ? STEPS[step.value].body : "",
							"confirm-label": step.value ? STEPS[step.value].label : "",
							busy: stepBusy.value,
							onConfirm: runStep
						}, null, _parent, _scopeId));
					} else return [
						__props.model ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
							key: 0,
							class: ["fe-check", { "fe-check--blocked": blocked.value }],
							"aria-labelledby": "fe-check-h"
						}, [
							(0, vue_exports.createVNode)("h2", {
								id: "fe-check-h",
								class: "fe-check__title"
							}, [(0, vue_exports.createTextVNode)(" Vor dem Veröffentlichen "), (0, vue_exports.createVNode)("span", { class: "fe-check__verdict" }, [__props.model.demo ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)("Nicht veröffentlichbar")], 64)) : __props.model.status === "published" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)("Im Shop")], 64)) : blocked.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 2 }, [(0, vue_exports.createTextVNode)("Noch nicht veröffentlichbar")], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createTextVNode)("Kann veröffentlicht werden")], 64))])]),
							__props.check && (__props.check.blockers.length || __props.check.hints.length) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ul", {
								key: 0,
								class: "fe-check__list"
							}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.check.blockers, (line) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
									key: line,
									class: "fe-check__item fe-check__item--bad"
								}, [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "warning",
									size: 16
								}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(line), 1)]);
							}), 128)), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.check.hints, (line) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
									key: line,
									class: "fe-check__item"
								}, [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "info",
									size: 16
								}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(line), 1)]);
							}), 128))])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 1,
								class: "adm-note"
							}, "Nichts steht im Weg.")),
							canPublish.value && (0, vue_exports.unref)(editor).dirty.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 2,
								class: "adm-note"
							}, "Speichere zuerst deine Änderungen – veröffentlicht wird, was gespeichert ist.")) : (0, vue_exports.createCommentVNode)("", true),
							stepError.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 3,
								class: "adm-alert",
								role: "alert"
							}, (0, vue_exports.toDisplayString)(stepError.value), 1)) : (0, vue_exports.createCommentVNode)("", true)
						], 2)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 1,
							class: "adm-note fe-first"
						}, "Nach dem ersten Speichern steht hier, ob die Felge in den Shop kann. Gespeichert wird sie als Entwurf.")),
						__props.model?.internalNote ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 2,
							class: "fe-memo",
							role: "note"
						}, [(0, vue_exports.createVNode)(AdminIcon_default, {
							name: "info",
							size: 16
						}), (0, vue_exports.createVNode)("span", null, [(0, vue_exports.createVNode)("strong", null, "Interne Notiz:"), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(__props.model.internalNote), 1)])])) : (0, vue_exports.createCommentVNode)("", true),
						errorCount.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 3,
							class: "adm-alert",
							role: "alert"
						}, (0, vue_exports.toDisplayString)(errorCount.value === 1 ? "Eine Angabe muss noch korrigiert werden." : `${errorCount.value} Angaben müssen noch korrigiert werden.`) + " Die Hinweise stehen bei den Feldern. ", 1)) : (0, vue_exports.createCommentVNode)("", true),
						err("configs") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
							key: 4,
							class: "adm-alert",
							role: "alert"
						}, (0, vue_exports.toDisplayString)(err("configs")), 1)) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)("form", {
							class: "fe-form",
							novalidate: "",
							onSubmit: (0, vue_exports.withModifiers)((0, vue_exports.unref)(editor).save, ["prevent"])
						}, [
							(0, vue_exports.createVNode)("section", {
								class: "adm-section",
								"aria-labelledby": "fe-h-base"
							}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "fe-h-base",
								class: "adm-section__title"
							}, "Stammdaten")]), (0, vue_exports.createVNode)("div", { class: "adm-fields fe-narrow" }, [
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "fe-brand"
									}, "Marke"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "fe-brand",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).brand_id = $event,
										class: "input",
										disabled: readonly.value,
										"aria-invalid": err("brand_id") ? "true" : void 0,
										"aria-describedby": "fe-brand-err"
									}, [
										(0, vue_exports.createVNode)("option", {
											value: null,
											disabled: ""
										}, "Marke wählen"),
										((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.brands, (brand) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
												key: brand.value,
												value: brand.value
											}, (0, vue_exports.toDisplayString)(brand.label), 9, ["value"]);
										}), 128)),
										(0, vue_exports.createVNode)("option", { value: NEW_BRAND }, "Neue Marke anlegen …")
									], 8, [
										"onUpdate:modelValue",
										"disabled",
										"aria-invalid"
									]), [[vue_exports.vModelSelect, (0, vue_exports.unref)(form).brand_id]]),
									(0, vue_exports.createVNode)("p", {
										id: "fe-brand-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(err("brand_id")), 1)
								]),
								(0, vue_exports.unref)(form).brand_id === NEW_BRAND ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "form-field"
								}, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "fe-brand-new"
									}, "Name der neuen Marke"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "fe-brand-new",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).brand_new = $event,
										class: "input",
										type: "text",
										maxlength: "60",
										"aria-invalid": err("brand_new") ? "true" : void 0,
										"aria-describedby": "fe-brand-new-err"
									}, null, 8, ["onUpdate:modelValue", "aria-invalid"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).brand_new]]),
									(0, vue_exports.createVNode)("p", {
										id: "fe-brand-new-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(err("brand_new")), 1)
								])) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "fe-name"
									}, "Modell"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "fe-name",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).name = $event,
										class: "input",
										type: "text",
										maxlength: "80",
										readonly: readonly.value,
										"aria-invalid": err("name") ? "true" : void 0,
										"aria-describedby": "fe-name-err"
									}, null, 8, [
										"onUpdate:modelValue",
										"readonly",
										"aria-invalid"
									]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).name]]),
									(0, vue_exports.createVNode)("p", {
										id: "fe-name-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(err("name")), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "fe-type"
									}, "Radtypenbezeichnung"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "fe-type",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).type_designation = $event,
										class: "input",
										type: "text",
										maxlength: "80",
										spellcheck: "false",
										readonly: readonly.value,
										"aria-invalid": err("type_designation") ? "true" : void 0,
										"aria-describedby": "fe-type-help fe-type-err"
									}, null, 8, [
										"onUpdate:modelValue",
										"readonly",
										"aria-invalid"
									]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).type_designation]]),
									(0, vue_exports.createVNode)("p", {
										id: "fe-type-help",
										class: "form-field__help"
									}, [(0, vue_exports.createTextVNode)(" So, wie das Gutachten sie druckt. Ohne eigenen Titel im Shop steht sie im Namen der Felge – so findet ein Kunde die Felge im Gutachten wieder. "), designationMissing.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" Diese Felge ist noch ohne Radtypenbezeichnung gespeichert und lässt sich so nicht veröffentlichen. Trag sie nach, sobald du das Gutachten zur Hand hast.")], 64)) : (0, vue_exports.createCommentVNode)("", true)]),
									(0, vue_exports.createVNode)("p", {
										id: "fe-type-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(err("type_designation")), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "fe-title"
									}, [(0, vue_exports.createTextVNode)("Titel im Shop "), (0, vue_exports.createVNode)("span", { class: "fe-optional" }, "(optional)")]),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "fe-title",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).title = $event,
										class: "input",
										type: "text",
										maxlength: "160",
										readonly: readonly.value,
										"aria-invalid": err("title") ? "true" : void 0,
										"aria-describedby": "fe-title-help fe-title-err"
									}, null, 8, [
										"onUpdate:modelValue",
										"readonly",
										"aria-invalid"
									]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).title]]),
									(0, vue_exports.createVNode)("p", {
										id: "fe-title-help",
										class: "form-field__help"
									}, " Bleibt das Feld leer, setzt der Shop den Titel aus Marke, Modell und Radtypenbezeichnung zusammen. Die Marke steht immer vorn. Im Shop: „" + (0, vue_exports.toDisplayString)(inShop.value || "–") + "“. ", 1),
									diverges.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 0,
										class: "fe-title-diverges",
										role: "status"
									}, [(0, vue_exports.createVNode)("p", { class: "adm-note" }, [
										(0, vue_exports.createTextVNode)("Dieser Titel weicht vom zusammengesetzten ab: "),
										(0, vue_exports.createVNode)("span", { class: "fe-title-composed" }, "„" + (0, vue_exports.toDisplayString)(composed.value) + "“", 1),
										(0, vue_exports.createTextVNode)(".")
									]), !readonly.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
										key: 0,
										class: "btn btn--ghost btn--sm fe-title-use",
										type: "button",
										onClick: useComposedTitle
									}, "Zusammengesetzten Titel verwenden")) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true),
									(0, vue_exports.createVNode)("p", {
										id: "fe-title-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(err("title")), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "fe-spokes"
									}, "Speichen"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
										id: "fe-spokes",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).spoke_count = $event,
										class: "input fe-short",
										disabled: readonly.value,
										"aria-describedby": "fe-spokes-help"
									}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.options.spokes, (n) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
											key: n,
											value: n
										}, (0, vue_exports.toDisplayString)(n), 9, ["value"]);
									}), 128))], 8, ["onUpdate:modelValue", "disabled"]), [[
										vue_exports.vModelSelect,
										(0, vue_exports.unref)(form).spoke_count,
										void 0,
										{ number: true }
									]]),
									(0, vue_exports.createVNode)("p", {
										id: "fe-spokes-help",
										class: "form-field__help"
									}, "Bestimmt die Umrisszeichnung, solange es kein Foto gibt.")
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "fe-desc"
									}, [(0, vue_exports.createTextVNode)("Beschreibung "), (0, vue_exports.createVNode)("span", { class: "fe-optional" }, "(optional)")]),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("textarea", {
										id: "fe-desc",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).description = $event,
										class: "input fe-area",
										rows: "5",
										maxlength: "4000",
										readonly: readonly.value,
										"aria-invalid": err("description") ? "true" : void 0,
										"aria-describedby": "fe-desc-err"
									}, null, 8, [
										"onUpdate:modelValue",
										"readonly",
										"aria-invalid"
									]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).description]]),
									(0, vue_exports.createVNode)("p", {
										id: "fe-desc-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(err("description")), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "fe-memo"
									}, [(0, vue_exports.createTextVNode)("Interne Notiz "), (0, vue_exports.createVNode)("span", { class: "fe-optional" }, "(optional, nur im Admin)")]),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("textarea", {
										id: "fe-memo",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).internal_note = $event,
										class: "input fe-area",
										rows: "2",
										maxlength: "500",
										readonly: readonly.value,
										"aria-invalid": err("internal_note") ? "true" : void 0,
										"aria-describedby": "fe-memo-help fe-memo-err"
									}, null, 8, [
										"onUpdate:modelValue",
										"readonly",
										"aria-invalid"
									]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).internal_note]]),
									(0, vue_exports.createVNode)("p", {
										id: "fe-memo-help",
										class: "form-field__help"
									}, "Steht über dieser Felge und in der Liste, nie im Shop – etwa „Platzhalterpreise, vom Kunden zu ersetzen“."),
									(0, vue_exports.createVNode)("p", {
										id: "fe-memo-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(err("internal_note")), 1)
								])
							])]),
							(0, vue_exports.createVNode)("section", {
								class: "adm-section",
								"aria-labelledby": "fe-h-finishes"
							}, [
								(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
									id: "fe-h-finishes",
									class: "adm-section__title"
								}, "Ausführungen"), !readonly.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 0,
									class: "btn btn--ghost",
									type: "button",
									onClick: addFinish
								}, [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "plus",
									size: 20
								}), (0, vue_exports.createTextVNode)(" Ausführung hinzufügen ")])) : (0, vue_exports.createCommentVNode)("", true)]),
								err("finishes") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 0,
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(err("finishes")), 1)) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createVNode)("ol", { class: "fe-finishes" }, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)((0, vue_exports.unref)(form).finishes, (finish, index) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
										key: finish.key,
										class: "fe-finish"
									}, [(0, vue_exports.createVNode)("div", { class: "fe-finish__fields" }, [
										(0, vue_exports.createVNode)("div", { class: "form-field" }, [
											(0, vue_exports.createVNode)("label", {
												class: "form-field__label",
												for: `fe-f-${index}-name`
											}, "Name", 8, ["for"]),
											(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
												id: `fe-f-${index}-name`,
												"onUpdate:modelValue": ($event) => finish.name = $event,
												class: "input",
												type: "text",
												maxlength: "60",
												placeholder: "z. B. Graphit matt",
												readonly: readonly.value,
												"aria-invalid": err(`finishes.${index}.name`) ? "true" : void 0,
												"aria-describedby": `fe-f-${index}-name-err`
											}, null, 8, [
												"id",
												"onUpdate:modelValue",
												"readonly",
												"aria-invalid",
												"aria-describedby"
											]), [[vue_exports.vModelText, finish.name]]),
											(0, vue_exports.createVNode)("p", {
												id: `fe-f-${index}-name-err`,
												class: "form-field__error"
											}, (0, vue_exports.toDisplayString)(err(`finishes.${index}.name`)), 9, ["id"])
										]),
										(0, vue_exports.createVNode)("div", { class: "form-field" }, [
											(0, vue_exports.createVNode)("label", {
												class: "form-field__label",
												for: `fe-f-${index}-hex`
											}, [(0, vue_exports.createTextVNode)("Farbfeld "), (0, vue_exports.createVNode)("span", { class: "fe-optional" }, "(optional)")], 8, ["for"]),
											(0, vue_exports.createVNode)("div", { class: "fe-hex" }, [(0, vue_exports.createVNode)("input", {
												class: "fe-hex__swatch",
												type: "color",
												value: /^#[0-9A-Fa-f]{6}$/.test(finish.hex) ? finish.hex : "#C9CED5",
												disabled: readonly.value,
												"aria-label": `Farbe für ${finish.name || "die Ausführung"} wählen`,
												onInput: ($event) => finish.hex = $event.target.value.toUpperCase()
											}, null, 40, [
												"value",
												"disabled",
												"aria-label",
												"onInput"
											]), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
												id: `fe-f-${index}-hex`,
												"onUpdate:modelValue": ($event) => finish.hex = $event,
												class: "input",
												type: "text",
												maxlength: "7",
												placeholder: "#3F454D",
												spellcheck: "false",
												readonly: readonly.value,
												"aria-invalid": err(`finishes.${index}.hex`) ? "true" : void 0,
												"aria-describedby": `fe-f-${index}-hex-err`
											}, null, 8, [
												"id",
												"onUpdate:modelValue",
												"readonly",
												"aria-invalid",
												"aria-describedby"
											]), [[vue_exports.vModelText, finish.hex]])]),
											(0, vue_exports.createVNode)("p", {
												id: `fe-f-${index}-hex-err`,
												class: "form-field__error"
											}, (0, vue_exports.toDisplayString)(err(`finishes.${index}.hex`)), 9, ["id"])
										]),
										(0, vue_exports.createVNode)("div", { class: "form-field" }, [(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: `fe-f-${index}-art`
										}, "Farbe der Umrisszeichnung", 8, ["for"]), (0, vue_exports.withDirectives)((0, vue_exports.createVNode)("select", {
											id: `fe-f-${index}-art`,
											"onUpdate:modelValue": ($event) => finish.art_finish = $event,
											class: "input",
											disabled: readonly.value
										}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.options.artFinishes, (option) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("option", {
												key: option.value,
												value: option.value
											}, (0, vue_exports.toDisplayString)(option.label), 9, ["value"]);
										}), 128))], 8, [
											"id",
											"onUpdate:modelValue",
											"disabled"
										]), [[vue_exports.vModelSelect, finish.art_finish]])]),
										!readonly.value && (0, vue_exports.unref)(form).finishes.length > 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
											key: 0,
											class: "fe-finish__remove"
										}, [usedBy(finish) === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
											key: 0,
											class: "btn btn--ghost",
											type: "button",
											onClick: ($event) => removeFinish(index)
										}, "Entfernen", 8, ["onClick"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 1,
											class: "adm-note fe-finish__used"
										}, "Von " + (0, vue_exports.toDisplayString)(usedBy(finish) === 1 ? "einer Größe" : `${usedBy(finish)} Größen`) + " genutzt – erst die Größen entfernen.", 1))])) : (0, vue_exports.createCommentVNode)("", true)
									]), __props.model && finish.id !== null && serverFinish(finish) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(FinishPhotos_default, {
										key: 0,
										"model-id": __props.model.id,
										"finish-id": finish.id,
										"finish-name": serverFinish(finish).name,
										image: serverFinish(finish).image,
										photos: serverFinish(finish).photos,
										"order-stamp": serverFinish(finish).photoOrderStamp,
										max: __props.options.maxPhotos,
										editable: editable.value,
										title: title.value
									}, null, 8, [
										"model-id",
										"finish-id",
										"finish-name",
										"image",
										"photos",
										"order-stamp",
										"max",
										"editable",
										"title"
									])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 1,
										class: "adm-note"
									}, "Nach dem Speichern kannst du für diese Ausführung Fotos hochladen."))]);
								}), 128))])
							]),
							(0, vue_exports.createVNode)("section", {
								class: "adm-section",
								"aria-labelledby": "fe-h-sizes"
							}, [
								(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
									id: "fe-h-sizes",
									class: "adm-section__title"
								}, "Größen"), !readonly.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 0,
									class: "fe-size-actions"
								}, [(0, vue_exports.createVNode)("button", {
									class: "btn btn--ghost",
									type: "button",
									"aria-expanded": matrixOpen.value ? "true" : "false",
									"aria-controls": "fe-matrix",
									onClick: ($event) => matrixOpen.value = !matrixOpen.value
								}, [(0, vue_exports.createTextVNode)(" Größen aus Listen erzeugen "), (0, vue_exports.createVNode)(AdminIcon_default, {
									name: matrixOpen.value ? "chevron-up" : "chevron-down",
									size: 16
								}, null, 8, ["name"])], 8, ["aria-expanded", "onClick"]), (0, vue_exports.createVNode)("button", {
									id: "fe-add-size",
									class: "btn btn--ghost",
									type: "button",
									onClick: addSize
								}, [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "plus",
									size: 20
								}), (0, vue_exports.createTextVNode)(" Eine Größe hinzufügen ")])])) : (0, vue_exports.createCommentVNode)("", true)]),
								(0, vue_exports.createVNode)("p", { class: "adm-note" }, "Preis je Felge, mit Mehrwertsteuer. Eine Größe, die in einem Gutachten steht, behält ihre Maße."),
								!readonly.value && matrixOpen.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(MatrixPanel_default, {
									key: 0,
									id: "fe-matrix",
									finishes: (0, vue_exports.unref)(form).finishes,
									"bolt-holes": __props.options.boltHoles,
									start: matrixStart.value,
									onAdd: addSizes
								}, null, 8, [
									"finishes",
									"bolt-holes",
									"start"
								])) : (0, vue_exports.createCommentVNode)("", true),
								added.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 1,
									class: "adm-note fe-added",
									role: "status"
								}, (0, vue_exports.toDisplayString)(added.value), 1)) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.unref)(form).configs.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(SizesTable_default, {
									key: 2,
									sizes: (0, vue_exports.unref)(form).configs,
									"onUpdate:sizes": ($event) => (0, vue_exports.unref)(form).configs = $event,
									finishes: (0, vue_exports.unref)(form).finishes,
									documents: __props.documents,
									locked: locked.value,
									errors: errors.value,
									readonly: readonly.value,
									"bolt-holes": __props.options.boltHoles,
									onRemove: removeSize
								}, null, 8, [
									"sizes",
									"onUpdate:sizes",
									"finishes",
									"documents",
									"locked",
									"errors",
									"readonly",
									"bolt-holes"
								])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 3,
									class: "adm-note fe-nosizes"
								}, "Noch keine Größe. Erzeuge sie oben aus Listen oder füge eine einzeln hinzu."))
							]),
							(0, vue_exports.createVNode)("section", {
								class: "adm-section",
								"aria-labelledby": "fe-h-seo"
							}, [(0, vue_exports.createVNode)("div", { class: "adm-section__head" }, [(0, vue_exports.createVNode)("h2", {
								id: "fe-h-seo",
								class: "adm-section__title"
							}, "Suchmaschinen")]), (0, vue_exports.createVNode)("div", { class: "adm-fields fe-narrow" }, [
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("div", { class: "fe-count-head" }, [(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "fe-seo-t"
									}, [(0, vue_exports.createTextVNode)("Titel "), (0, vue_exports.createVNode)("span", { class: "fe-optional" }, "(optional)")]), (0, vue_exports.createVNode)("span", { class: ["fe-count", { "fe-count--over": (0, vue_exports.unref)(form).seo_title.length > 60 }] }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).seo_title.length) + " / 60", 3)]),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "fe-seo-t",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).seo_title = $event,
										class: "input",
										type: "text",
										maxlength: "70",
										readonly: readonly.value,
										"aria-describedby": "fe-seo-t-help fe-seo-t-err"
									}, null, 8, ["onUpdate:modelValue", "readonly"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).seo_title]]),
									(0, vue_exports.createVNode)("p", {
										id: "fe-seo-t-help",
										class: "form-field__help"
									}, "Leer lassen, dann besteht der Titel aus Marke und Modell. Suchmaschinen zeigen meist etwa 60 Zeichen; speichern kannst du bis zu 70."),
									(0, vue_exports.createVNode)("p", {
										id: "fe-seo-t-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(err("seo_title")), 1)
								]),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("div", { class: "fe-count-head" }, [(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "fe-seo-d"
									}, [(0, vue_exports.createTextVNode)("Beschreibung "), (0, vue_exports.createVNode)("span", { class: "fe-optional" }, "(optional)")]), (0, vue_exports.createVNode)("span", { class: ["fe-count", { "fe-count--over": (0, vue_exports.unref)(form).seo_description.length > 155 }] }, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(form).seo_description.length) + " / 155", 3)]),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("textarea", {
										id: "fe-seo-d",
										"onUpdate:modelValue": ($event) => (0, vue_exports.unref)(form).seo_description = $event,
										class: "input fe-area",
										rows: "3",
										maxlength: "170",
										readonly: readonly.value,
										"aria-describedby": "fe-seo-d-help fe-seo-d-err"
									}, null, 8, ["onUpdate:modelValue", "readonly"]), [[vue_exports.vModelText, (0, vue_exports.unref)(form).seo_description]]),
									(0, vue_exports.createVNode)("p", {
										id: "fe-seo-d-help",
										class: "form-field__help"
									}, "Suchmaschinen zeigen meist etwa 155 Zeichen; speichern kannst du bis zu 170."),
									(0, vue_exports.createVNode)("p", {
										id: "fe-seo-d-err",
										class: "form-field__error"
									}, (0, vue_exports.toDisplayString)(err("seo_description")), 1)
								]),
								(0, vue_exports.createVNode)("figure", {
									class: "fe-serp",
									"aria-label": "So etwa erscheint die Felge in den Suchergebnissen"
								}, [(0, vue_exports.createVNode)("p", { class: "fe-serp__title" }, (0, vue_exports.toDisplayString)(seoTitlePreview.value), 1), (0, vue_exports.createVNode)("p", { class: "fe-serp__desc" }, (0, vue_exports.toDisplayString)(seoDescriptionPreview.value), 1)])
							])])
						], 40, ["onSubmit"]),
						editable.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminSaveBar_default, {
							key: 5,
							editor: (0, vue_exports.unref)(editor)
						}, null, 8, ["editor"])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: stepOpen.value,
							"onUpdate:open": ($event) => stepOpen.value = $event,
							title: step.value ? STEPS[step.value].title : "",
							body: step.value ? STEPS[step.value].body : "",
							"confirm-label": step.value ? STEPS[step.value].label : "",
							busy: stepBusy.value,
							onConfirm: runStep
						}, null, 8, [
							"open",
							"onUpdate:open",
							"title",
							"body",
							"confirm-label",
							"busy"
						])
					];
				}),
				_: 2
			}, [canPublish.value ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(blocked.value || (0, vue_exports.unref)(editor).dirty.value) ? " disabled" : ""} data-v-c420258b${_scopeId}>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
							name: "publish",
							size: 20
						}, null, _parent, _scopeId));
						_push(` Veröffentlichen </button>`);
					} else return [(0, vue_exports.createVNode)("button", {
						class: "btn btn--primary",
						type: "button",
						disabled: blocked.value || (0, vue_exports.unref)(editor).dirty.value,
						onClick: ($event) => step.value = "veroeffentlichen"
					}, [(0, vue_exports.createVNode)(AdminIcon_default, {
						name: "publish",
						size: 20
					}), (0, vue_exports.createTextVNode)(" Veröffentlichen ")], 8, ["disabled", "onClick"])];
				}),
				key: "0"
			} : void 0]), _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Felgen/Edit.vue
var _sfc_setup = Edit_vue_vue_type_script_setup_true_lang_default.setup;
Edit_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Felgen/Edit.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Edit_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Edit_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-c420258b"]]);
//#endregion
export { Edit_default as default };
