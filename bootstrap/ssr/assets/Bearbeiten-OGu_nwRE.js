import { t as Dialog_default } from "./Dialog-C-07FMpe.js";
import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-CzJXz77H.js";
import { c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { t as AdminConfirm_default } from "./AdminConfirm-CJZtnwyX.js";
import { i as toast } from "./Toast-BAo4c4LN.js";
import { n as AdminSaveBar_default, t as useDirtyForm } from "./useDirtyForm-D_oy2Apt.js";
import { a as emptyBlock, c as move, i as diff, l as placeOf, o as emptyItem, r as blockLabel, s as fieldId, t as FieldInput_default, u as repeatable } from "./FieldInput-Diz9zs9m.js";
import { t as DiffList_default } from "./DiffList-DKPKL-HB.js";
import { t as PreviewFrame_default } from "./PreviewFrame-BGepfi6n.js";
//#region resources/js/Pages/Admin/Seiten/Bearbeiten.vue?vue&type=script&setup=true&lang.ts
var Bearbeiten_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	layout: AdminLayout_default,
	inheritAttrs: false,
	__name: "Bearbeiten",
	__ssrInlineRender: true,
	props: {
		page: {},
		schema: {},
		content: {},
		live: {},
		draft: {},
		revisions: {},
		preview: {},
		can: {}
	},
	setup(__props) {
		/**
		* Inhalte › Seiten › one page — its words edited beside the real shop (docs/admin/inhalte-build-plan.md).
		*
		* *Speichern* keeps a draft that visitors never see; the preview beside the fields shows that saved
		* draft in the storefront's own page. *Veröffentlichen* — the page's one primary action — first
		* lists every place that changes, then the server runs the publish check and puts the page live
		* whole. Every published state stays in *Versionen* and can be loaded back as the draft.
		*
		* Sections of a Ratgeber article or a legal page are added, removed and moved with buttons, never
		* by dragging alone (BRIEF-2 §1): a keyboard reaches everything a mouse does.
		*/
		const props = __props;
		function clone(value) {
			return JSON.parse(JSON.stringify(value));
		}
		const previewVersion = (0, vue_exports.ref)(0);
		/** Which button the last answer belongs to, so its refusal is headed with the right verb. */
		const lastAction = (0, vue_exports.ref)("save");
		const editor = useDirtyForm(clone(props.content), {
			method: "put",
			url: () => `/admin/seiten/${props.page.id}/entwurf`,
			beforeSave: (send) => {
				lastAction.value = "save";
				send();
			},
			onSaved: () => {
				previewVersion.value++;
			}
		});
		const form = editor.form;
		const readonly = (0, vue_exports.computed)(() => !props.can.edit);
		function withVersion(data) {
			return {
				...data,
				baseVersion: props.page.version
			};
		}
		form.transform(withVersion);
		/** A refusal about the page as a whole — changed meanwhile, still in a menu — said above the fields. */
		const inertiaPage = usePage();
		const pageError = (0, vue_exports.computed)(() => {
			const raw = inertiaPage.props.errors;
			return (raw !== null && typeof raw === "object" ? raw : {}).page ?? form.errors.page ?? "";
		});
		/** After the server changed what "unchanged" means — published, restored, discarded. */
		function syncFromServer() {
			form.defaults(clone(props.content));
			form.reset();
			form.clearErrors();
			previewVersion.value++;
		}
		const errors = (0, vue_exports.computed)(() => form.errors);
		function err(path) {
			return errors.value[path] ?? "";
		}
		const errorList = (0, vue_exports.computed)(() => Object.entries(errors.value).filter((entry) => entry[0] !== "page" && typeof entry[1] === "string" && entry[1] !== ""));
		function focusField(path) {
			document.getElementById(fieldId(path))?.focus();
		}
		function pageValue(field) {
			return field.key === "metaDescription" ? form.metaDescription : form.title;
		}
		function setPageValue(field, value) {
			if (field.key === "metaDescription") form.metaDescription = String(value ?? "");
			else form.title = String(value ?? "");
		}
		function blockValue(index, key) {
			const value = form.blocks[index]?.data[key];
			return Array.isArray(value) ? null : value ?? null;
		}
		function setBlockValue(index, key, value) {
			const block = form.blocks[index];
			if (block) block.data[key] = value;
		}
		function items(index, list) {
			const value = form.blocks[index]?.data[list];
			return Array.isArray(value) ? value : [];
		}
		function setItems(index, list, next) {
			const block = form.blocks[index];
			if (block) block.data[list] = next;
		}
		function schemaOf(index) {
			return props.schema.blocks.find((b) => b.type === form.blocks[index]?.type);
		}
		const sectionType = (0, vue_exports.computed)(() => repeatable(props.schema));
		const sectionIndexes = (0, vue_exports.computed)(() => form.blocks.map((block, index) => block.type === sectionType.value?.type ? index : -1).filter((index) => index >= 0));
		const fixedIndexes = (0, vue_exports.computed)(() => form.blocks.map((block, index) => block.type !== sectionType.value?.type ? index : -1).filter((index) => index >= 0));
		const mayAddSection = (0, vue_exports.computed)(() => sectionType.value !== null && sectionIndexes.value.length < sectionType.value.max);
		const mayRemoveSection = (0, vue_exports.computed)(() => sectionType.value !== null && sectionIndexes.value.length > sectionType.value.min);
		function focusAfter(id, fallback) {
			(0, vue_exports.nextTick)(() => {
				const target = document.getElementById(id);
				if (target && !target.disabled) {
					target.focus();
					return;
				}
				if (fallback) document.getElementById(fallback)?.focus();
			});
		}
		function structureChanged() {
			form.clearErrors();
		}
		function addSection() {
			if (!sectionType.value || !mayAddSection.value) return;
			form.blocks = [...form.blocks, emptyBlock(sectionType.value)];
			structureChanged();
			const index = form.blocks.length - 1;
			const first = sectionType.value.fields[0];
			if (first) focusAfter(fieldId(`blocks.${index}.data.${first.key}`));
		}
		function removeSection(index) {
			if (!mayRemoveSection.value) return;
			const label = blockLabel(props.schema, form.blocks, index);
			const removed = form.blocks[index];
			const position = sectionIndexes.value.indexOf(index);
			form.blocks = form.blocks.filter((_, i) => i !== index);
			structureChanged();
			const next = sectionIndexes.value[Math.min(position, sectionIndexes.value.length - 1)];
			focusAfter(next === void 0 ? "pg-add-section" : `pg-section-${next}`);
			if (removed) toast.show({
				text: `${label} entfernt.`,
				action: {
					label: "Rückgängig",
					run: () => {
						const blocks = [...form.blocks];
						blocks.splice(index, 0, removed);
						form.blocks = blocks;
						structureChanged();
						focusAfter(`pg-section-${index}`);
					}
				}
			});
		}
		function moveSection(index, by) {
			const position = sectionIndexes.value.indexOf(index);
			const target = sectionIndexes.value[position + by];
			if (target === void 0) return;
			form.blocks = move(form.blocks, index, target);
			structureChanged();
			focusAfter(`pg-move-${by < 0 ? "up" : "down"}-${target}`, `pg-section-${target}`);
		}
		function addItem(index, block) {
			const list = block.list;
			if (!list || items(index, list.key).length >= list.max) return;
			setItems(index, list.key, [...items(index, list.key), emptyItem(list.fields)]);
			structureChanged();
			const first = list.fields.find((f) => f.kind !== "icon") ?? list.fields[0];
			if (first) focusAfter(fieldId(`blocks.${index}.data.${list.key}.${items(index, list.key).length - 1}.${first.key}`));
		}
		function removeItem(index, block, item) {
			const list = block.list;
			if (!list || items(index, list.key).length <= list.min) return;
			setItems(index, list.key, items(index, list.key).filter((_, i) => i !== item));
			structureChanged();
			focusAfter(`pg-add-item-${index}`);
		}
		function moveItem(index, block, item, by) {
			const list = block.list;
			if (!list) return;
			setItems(index, list.key, move(items(index, list.key), item, item + by));
			structureChanged();
			focusAfter(`pg-item-${by < 0 ? "up" : "down"}-${index}-${item + by}`, `pg-item-${index}-${item + by}`);
		}
		const context = (0, vue_exports.computed)(() => {
			const parts = props.page.group === props.page.title ? [] : [props.page.group];
			parts.push(props.page.published ? `Veröffentlicht am ${props.page.publishedAt ?? "–"}` : "Nicht veröffentlicht");
			return parts.join(" · ");
		});
		const discarding = (0, vue_exports.ref)(false);
		const withdrawing = (0, vue_exports.ref)(false);
		const busy = (0, vue_exports.ref)(false);
		function copyPreviewLink() {
			navigator.clipboard.writeText(props.preview.desktop).then(() => toast.show({ text: `Vorschau-Link kopiert. Er funktioniert ${props.preview.days} Tage lang, ohne Anmeldung.` })).catch(() => toast.show({
				text: "Der Link konnte nicht kopiert werden. Öffne die Vorschau in einem neuen Tab und kopier ihn dort.",
				icon: "info"
			}));
		}
		const more = (0, vue_exports.computed)(() => {
			const actions = [];
			if (props.page.published) actions.push({
				label: "Im Shop ansehen",
				icon: "eye",
				run: () => window.open(props.page.href, "_blank", "noopener")
			});
			actions.push({
				label: "Vorschau in neuem Tab",
				icon: "arrow-right",
				run: () => window.open(props.preview.desktop, "_blank", "noopener")
			}, {
				label: "Vorschau-Link kopieren",
				icon: "duplicate",
				run: copyPreviewLink
			});
			if (props.draft && props.can.edit) actions.push({
				label: "Entwurf verwerfen",
				icon: "delete",
				danger: true,
				run: () => discarding.value = true
			});
			if (props.can.withdraw) actions.push({
				label: "Zurückziehen",
				icon: "close",
				danger: true,
				run: () => withdrawing.value = true
			});
			return actions;
		});
		function discardDraft() {
			if (busy.value) return;
			busy.value = true;
			router.delete(`/admin/seiten/${props.page.id}/entwurf`, {
				data: { baseVersion: props.page.version },
				preserveScroll: true,
				onSuccess: syncFromServer,
				onFinish: () => {
					busy.value = false;
					discarding.value = false;
				}
			});
		}
		function withdraw() {
			if (busy.value) return;
			busy.value = true;
			router.post(`/admin/seiten/${props.page.id}/zurueckziehen`, { baseVersion: props.page.version }, {
				preserveScroll: true,
				onFinish: () => {
					busy.value = false;
					withdrawing.value = false;
				}
			});
		}
		const publishOpen = (0, vue_exports.ref)(false);
		const publishing = (0, vue_exports.ref)(false);
		const note = (0, vue_exports.ref)("");
		const reviewed = (0, vue_exports.ref)(false);
		const pending = (0, vue_exports.computed)(() => diff(props.schema, props.live, form.data()));
		const isLegal = (0, vue_exports.computed)(() => props.page.kind === "legal");
		const nothingToPublish = (0, vue_exports.computed)(() => props.page.published && props.draft === null && !editor.dirty.value && !(isLegal.value && props.page.lawyerReviewed !== true));
		const publishIsNext = (0, vue_exports.computed)(() => !editor.dirty.value && (props.draft !== null || !props.page.published));
		let refused = false;
		function onPublishClosed(event) {
			if (!refused) return;
			refused = false;
			event.preventDefault();
			document.getElementById("pg-problems")?.focus();
		}
		function openPublish() {
			if (nothingToPublish.value) return;
			note.value = "";
			reviewed.value = props.page.lawyerReviewed === true && pending.value.length === 0;
			publishOpen.value = true;
		}
		function publish() {
			if (publishing.value) return;
			publishing.value = true;
			lastAction.value = "publish";
			form.transform((data) => ({
				...withVersion(data),
				note: note.value,
				lawyerReviewed: reviewed.value
			})).post(`/admin/seiten/${props.page.id}/veroeffentlichen`, {
				preserveScroll: true,
				onSuccess: () => {
					publishOpen.value = false;
					syncFromServer();
				},
				onError: () => {
					if (publishOpen.value) {
						refused = true;
						publishOpen.value = false;
					} else (0, vue_exports.nextTick)(() => document.getElementById("pg-problems")?.focus());
				},
				onFinish: () => {
					publishing.value = false;
					form.transform(withVersion);
				}
			});
		}
		const restoring = (0, vue_exports.ref)(null);
		const restoreOpen = (0, vue_exports.computed)({
			get: () => restoring.value !== null,
			set: (open) => {
				if (!open) restoring.value = null;
			}
		});
		const comparison = (0, vue_exports.ref)(null);
		const comparisonFailed = (0, vue_exports.ref)(false);
		const shownRevision = (0, vue_exports.ref)(null);
		function openRestore(revision) {
			restoring.value = revision;
			shownRevision.value = revision;
			comparison.value = null;
			comparisonFailed.value = false;
			fetch(`/admin/seiten/${props.page.id}/versionen/${revision.id}/vergleich`, {
				headers: {
					Accept: "application/json",
					"X-Requested-With": "XMLHttpRequest"
				},
				credentials: "same-origin"
			}).then((response) => response.ok ? response.json() : Promise.reject(new Error(String(response.status)))).then((body) => {
				if (restoring.value?.id === revision.id) comparison.value = body.changes;
			}).catch(() => {
				if (restoring.value?.id === revision.id) comparisonFailed.value = true;
			});
		}
		function restore() {
			const revision = restoring.value;
			if (revision === null || busy.value) return;
			busy.value = true;
			router.post(`/admin/seiten/${props.page.id}/versionen/${revision.id}`, { baseVersion: props.page.version }, {
				preserveScroll: true,
				onSuccess: syncFromServer,
				onFinish: () => {
					busy.value = false;
					restoring.value = null;
				}
			});
		}
		const restoreBody = (0, vue_exports.computed)(() => {
			return `Diese Version wird dein Entwurf.${props.draft || editor.dirty.value ? " Sie ersetzt deinen jetzigen Entwurf und alles, was noch nicht gespeichert ist." : ""} Im Shop ändert sich erst etwas, wenn du veröffentlichst.`;
		});
		/** The newest version is what the shop shows while the page is live; it has nothing to load. */
		function isLive(revision, index) {
			return index === 0 && props.page.published;
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminPage_default, (0, vue_exports.mergeProps)({
				title: __props.page.title,
				context: context.value,
				more: more.value,
				"read-only": readonly.value
			}, _attrs), (0, vue_exports.createSlots)({
				default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="pg" data-v-e2b41aa7${_scopeId}><div class="pg__fields" data-v-e2b41aa7${_scopeId}>`);
						if (errorList.value.length) {
							_push(`<div id="pg-problems" class="adm-alert pg__problems" role="alert" tabindex="-1" data-v-e2b41aa7${_scopeId}><p data-v-e2b41aa7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(lastAction.value === "publish" ? "Veröffentlichen" : "Speichern")} geht noch nicht. Bitte prüf ${(0, server_renderer_exports.ssrInterpolate)(errorList.value.length === 1 ? "diese Stelle" : `diese ${errorList.value.length} Stellen`)}: </p><ul data-v-e2b41aa7${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(errorList.value, ([path, message]) => {
								_push(`<li data-v-e2b41aa7${_scopeId}>`);
								if ((0, vue_exports.unref)(placeOf)(__props.schema, (0, vue_exports.unref)(form).blocks, path)) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", `#${(0, vue_exports.unref)(fieldId)(path)}`)} data-v-e2b41aa7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(placeOf)(__props.schema, (0, vue_exports.unref)(form).blocks, path))}: ${(0, server_renderer_exports.ssrInterpolate)(message)}</a>`);
								else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(message)}<!--]-->`);
								_push(`</li>`);
							});
							_push(`<!--]--></ul></div>`);
						} else _push(`<!---->`);
						if (__props.page.placeholder) _push(`<p class="adm-note" data-v-e2b41aa7${_scopeId}> Auf dieser Seite steht noch der Platzhalter der Kanzlei. Füg den Text ein, den die Kanzlei geliefert hat, und veröffentliche ihn. </p>`);
						else _push(`<!---->`);
						if (__props.page.lawyerReviewed) _push(`<p class="adm-note" data-v-e2b41aa7${_scopeId}> Diese Fassung ist als vom Anwalt geprüft markiert. Änderst du den Text, bestätigst du das beim Veröffentlichen neu. </p>`);
						else _push(`<!---->`);
						if (pageError.value) _push(`<p class="adm-alert" role="alert" data-v-e2b41aa7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(pageError.value)}</p>`);
						else _push(`<!---->`);
						if (__props.draft) {
							_push(`<p class="adm-note" data-v-e2b41aa7${_scopeId}> Entwurf vom ${(0, server_renderer_exports.ssrInterpolate)(__props.draft.at)}`);
							if (__props.draft.by) _push(`<!--[--> von ${(0, server_renderer_exports.ssrInterpolate)(__props.draft.by)}<!--]-->`);
							else _push(`<!---->`);
							_push(`. ${(0, server_renderer_exports.ssrInterpolate)(__props.page.published ? "Im Shop steht noch die veröffentlichte Fassung." : "Der Artikel ist noch nicht im Shop zu sehen.")}</p>`);
						} else if (!__props.page.published) _push(`<p class="adm-note" data-v-e2b41aa7${_scopeId}>Dieser Artikel ist nicht veröffentlicht. Besucher sehen ihn erst, wenn du ihn veröffentlichst.</p>`);
						else _push(`<!---->`);
						if (__props.schema.page.length) {
							_push(`<div class="pg__group" data-v-e2b41aa7${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.schema.page, (field) => {
								_push((0, server_renderer_exports.ssrRenderComponent)(FieldInput_default, {
									id: (0, vue_exports.unref)(fieldId)(field.key),
									key: field.key,
									field,
									"model-value": pageValue(field),
									error: err(field.key),
									readonly: readonly.value,
									"onUpdate:modelValue": ($event) => setPageValue(field, $event)
								}, null, _parent, _scopeId));
							});
							_push(`<!--]--></div>`);
						} else _push(`<!---->`);
						_push(`<!--[-->`);
						(0, server_renderer_exports.ssrRenderList)(fixedIndexes.value, (index) => {
							_push(`<section class="pg__block"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `pg-block-${index}`)} data-v-e2b41aa7${_scopeId}><h2${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-block-${index}`)} class="pg__heading" data-v-e2b41aa7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(blockLabel)(__props.schema, (0, vue_exports.unref)(form).blocks, index))}</h2><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(schemaOf(index)?.fields ?? [], (field) => {
								_push((0, server_renderer_exports.ssrRenderComponent)(FieldInput_default, {
									id: (0, vue_exports.unref)(fieldId)(`blocks.${index}.data.${field.key}`),
									key: field.key,
									field,
									"model-value": blockValue(index, field.key),
									error: err(`blocks.${index}.data.${field.key}`),
									readonly: readonly.value,
									"onUpdate:modelValue": ($event) => setBlockValue(index, field.key, $event)
								}, null, _parent, _scopeId));
							});
							_push(`<!--]-->`);
							if (schemaOf(index)?.list) {
								_push(`<!--[-->`);
								if (err(`blocks.${index}.data.${schemaOf(index).list.key}`)) _push(`<p class="form-field__error" data-v-e2b41aa7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err(`blocks.${index}.data.${schemaOf(index).list.key}`))}</p>`);
								else _push(`<!---->`);
								_push(`<!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(items(index, schemaOf(index).list.key), (item, j) => {
									_push(`<fieldset${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-item-${index}-${j}`)} class="pg__item" tabindex="-1" data-v-e2b41aa7${_scopeId}><legend class="visually-hidden" data-v-e2b41aa7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(schemaOf(index).list.itemLabel)} ${(0, server_renderer_exports.ssrInterpolate)(j + 1)}</legend><div class="pg__block-head" data-v-e2b41aa7${_scopeId}><span class="pg__item-title" aria-hidden="true" data-v-e2b41aa7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(schemaOf(index).list.itemLabel)} ${(0, server_renderer_exports.ssrInterpolate)(j + 1)}</span>`);
									if (!readonly.value) {
										_push(`<div class="pg__tools" data-v-e2b41aa7${_scopeId}><button${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-item-up-${index}-${j}`)} class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(j === 0) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${schemaOf(index).list.itemLabel} ${j + 1} nach oben`)} data-v-e2b41aa7${_scopeId}>`);
										_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
											name: "chevron-up",
											size: 20
										}, null, _parent, _scopeId));
										_push(`</button><button${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-item-down-${index}-${j}`)} class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(j === items(index, schemaOf(index).list.key).length - 1) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${schemaOf(index).list.itemLabel} ${j + 1} nach unten`)} data-v-e2b41aa7${_scopeId}>`);
										_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
											name: "chevron-down",
											size: 20
										}, null, _parent, _scopeId));
										_push(`</button><button class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(items(index, schemaOf(index).list.key).length <= schemaOf(index).list.min) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${schemaOf(index).list.itemLabel} ${j + 1} entfernen`)} data-v-e2b41aa7${_scopeId}>`);
										_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
											name: "delete",
											size: 20
										}, null, _parent, _scopeId));
										_push(`</button></div>`);
									} else _push(`<!---->`);
									_push(`</div><!--[-->`);
									(0, server_renderer_exports.ssrRenderList)(schemaOf(index).list.fields, (field) => {
										_push((0, server_renderer_exports.ssrRenderComponent)(FieldInput_default, {
											id: (0, vue_exports.unref)(fieldId)(`blocks.${index}.data.${schemaOf(index).list.key}.${j}.${field.key}`),
											key: field.key,
											field,
											"model-value": item[field.key] ?? null,
											error: err(`blocks.${index}.data.${schemaOf(index).list.key}.${j}.${field.key}`),
											readonly: readonly.value,
											"onUpdate:modelValue": ($event) => item[field.key] = $event
										}, null, _parent, _scopeId));
									});
									_push(`<!--]--></fieldset>`);
								});
								_push(`<!--]-->`);
								if (!readonly.value) {
									_push(`<button${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-add-item-${index}`)} class="btn btn--secondary pg__add" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(items(index, schemaOf(index).list.key).length >= schemaOf(index).list.max) ? " disabled" : ""} data-v-e2b41aa7${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "plus",
										size: 20
									}, null, _parent, _scopeId));
									_push(` ${(0, server_renderer_exports.ssrInterpolate)(schemaOf(index).list.itemLabel)} hinzufügen </button>`);
								} else _push(`<!---->`);
								if (!readonly.value && items(index, schemaOf(index).list.key).length >= schemaOf(index).list.max) _push(`<p class="form-field__help" data-v-e2b41aa7${_scopeId}> Mehr als ${(0, server_renderer_exports.ssrInterpolate)(schemaOf(index).list.max)} passen nicht in die Zeile. </p>`);
								else _push(`<!---->`);
								_push(`<!--]-->`);
							} else _push(`<!---->`);
							_push(`</section>`);
						});
						_push(`<!--]-->`);
						if (sectionType.value) {
							_push(`<!--[-->`);
							if (err("blocks")) _push(`<p class="form-field__error" data-v-e2b41aa7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("blocks"))}</p>`);
							else _push(`<!---->`);
							_push(`<!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(sectionIndexes.value, (index, position) => {
								_push(`<section${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-section-${index}`)} class="pg__block" tabindex="-1"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `pg-block-${index}`)} data-v-e2b41aa7${_scopeId}><div class="pg__block-head" data-v-e2b41aa7${_scopeId}><h2${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-block-${index}`)} class="pg__heading" data-v-e2b41aa7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(blockLabel)(__props.schema, (0, vue_exports.unref)(form).blocks, index))}</h2>`);
								if (!readonly.value) {
									_push(`<div class="pg__tools" data-v-e2b41aa7${_scopeId}><button${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-move-up-${index}`)} class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(position === 0) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${(0, vue_exports.unref)(blockLabel)(__props.schema, (0, vue_exports.unref)(form).blocks, index)} nach oben`)} data-v-e2b41aa7${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "chevron-up",
										size: 20
									}, null, _parent, _scopeId));
									_push(`</button><button${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-move-down-${index}`)} class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(position === sectionIndexes.value.length - 1) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${(0, vue_exports.unref)(blockLabel)(__props.schema, (0, vue_exports.unref)(form).blocks, index)} nach unten`)} data-v-e2b41aa7${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "chevron-down",
										size: 20
									}, null, _parent, _scopeId));
									_push(`</button><button class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!mayRemoveSection.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${(0, vue_exports.unref)(blockLabel)(__props.schema, (0, vue_exports.unref)(form).blocks, index)} entfernen`)} data-v-e2b41aa7${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "delete",
										size: 20
									}, null, _parent, _scopeId));
									_push(`</button></div>`);
								} else _push(`<!---->`);
								_push(`</div><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(sectionType.value.fields, (field) => {
									_push((0, server_renderer_exports.ssrRenderComponent)(FieldInput_default, {
										id: (0, vue_exports.unref)(fieldId)(`blocks.${index}.data.${field.key}`),
										key: field.key,
										field,
										"model-value": blockValue(index, field.key),
										error: err(`blocks.${index}.data.${field.key}`),
										readonly: readonly.value,
										"onUpdate:modelValue": ($event) => setBlockValue(index, field.key, $event)
									}, null, _parent, _scopeId));
								});
								_push(`<!--]--></section>`);
							});
							_push(`<!--]-->`);
							if (!readonly.value) {
								_push(`<button id="pg-add-section" class="btn btn--secondary pg__add" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!mayAddSection.value) ? " disabled" : ""} data-v-e2b41aa7${_scopeId}>`);
								_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
									name: "plus",
									size: 20
								}, null, _parent, _scopeId));
								_push(` ${(0, server_renderer_exports.ssrInterpolate)(sectionType.value.label)} hinzufügen </button>`);
							} else _push(`<!---->`);
							_push(`<!--]-->`);
						} else _push(`<!---->`);
						_push(`<section class="pg__versions" aria-labelledby="pg-versions" data-v-e2b41aa7${_scopeId}><h2 id="pg-versions" class="pg__heading" data-v-e2b41aa7${_scopeId}>Versionen</h2>`);
						if (__props.revisions.length === 0) _push(`<p class="adm-note" data-v-e2b41aa7${_scopeId}> Noch keine Version. Beim ersten Veröffentlichen wird auch die bisherige Fassung aus dem Shop gesichert. </p>`);
						else {
							_push(`<ul class="pg__revisions" data-v-e2b41aa7${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.revisions, (revision, index) => {
								_push(`<li class="pg__revision" data-v-e2b41aa7${_scopeId}><div class="pg__revision-text" data-v-e2b41aa7${_scopeId}><span class="pg__revision-at" data-v-e2b41aa7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(revision.at)}</span><span class="pg__revision-by" data-v-e2b41aa7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(revision.by ?? "Ausgangsstand")}</span>`);
								if (revision.note) _push(`<span class="pg__revision-note" data-v-e2b41aa7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(revision.note)}</span>`);
								else _push(`<!---->`);
								_push(`</div>`);
								if (isLive(revision, index)) _push(`<span class="pg__revision-live" data-v-e2b41aa7${_scopeId}>Steht im Shop</span>`);
								else if (__props.can.edit) _push(`<button class="btn btn--secondary btn--sm" type="button" data-v-e2b41aa7${_scopeId}>Als Entwurf laden</button>`);
								else _push(`<!---->`);
								_push(`</li>`);
							});
							_push(`<!--]--></ul>`);
						}
						_push(`</section></div>`);
						_push((0, server_renderer_exports.ssrRenderComponent)(PreviewFrame_default, {
							class: "pg__preview",
							urls: __props.preview,
							version: previewVersion.value,
							unsaved: (0, vue_exports.unref)(editor).dirty.value
						}, null, _parent, _scopeId));
						_push(`</div>`);
						if (__props.can.edit) _push((0, server_renderer_exports.ssrRenderComponent)(AdminSaveBar_default, { editor: (0, vue_exports.unref)(editor) }, null, _parent, _scopeId));
						else _push(`<!---->`);
						_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
							open: publishOpen.value,
							"onUpdate:open": ($event) => publishOpen.value = $event,
							title: "Seite veröffentlichen?",
							"content-class": "adm-dialog",
							onCloseAutoFocus: onPublishClosed
						}, {
							actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-e2b41aa7${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(publishing.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", publishing.value ? "true" : void 0)} data-v-e2b41aa7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(publishing.value ? "Wird veröffentlicht …" : "Veröffentlichen")}</button>`);
								else return [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									onClick: ($event) => publishOpen.value = false
								}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--primary",
									type: "button",
									disabled: publishing.value,
									"aria-busy": publishing.value ? "true" : void 0,
									onClick: publish
								}, (0, vue_exports.toDisplayString)(publishing.value ? "Wird veröffentlicht …" : "Veröffentlichen"), 9, ["disabled", "aria-busy"])];
							}),
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<div class="adm-fields" data-v-e2b41aa7${_scopeId}>`);
									if (pending.value.length) {
										_push(`<!--[--><p class="adm-note" data-v-e2b41aa7${_scopeId}>Das ändert sich im Shop:</p>`);
										_push((0, server_renderer_exports.ssrRenderComponent)(DiffList_default, { changes: pending.value }, null, _parent, _scopeId));
										_push(`<!--]-->`);
									} else _push(`<p class="adm-note" data-v-e2b41aa7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.page.published ? "Der Text ist derselbe wie im Shop." : "Der Artikel geht mit diesem Text in den Shop.")}</p>`);
									_push(`<div class="form-field" data-v-e2b41aa7${_scopeId}><label class="form-field__label" for="pg-note" data-v-e2b41aa7${_scopeId}>Notiz zur Version (optional)</label><input id="pg-note"${(0, server_renderer_exports.ssrRenderAttr)("value", note.value)} class="input" type="text" maxlength="200" autocomplete="off" data-v-e2b41aa7${_scopeId}><p class="form-field__help" data-v-e2b41aa7${_scopeId}>Steht in der Versionsliste, zum Beispiel „Neue Versandzeiten“.</p></div>`);
									if (isLegal.value) _push(`<label class="check" data-v-e2b41aa7${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(reviewed.value) ? (0, server_renderer_exports.ssrLooseContain)(reviewed.value, null) : reviewed.value) ? " checked" : ""} type="checkbox" data-v-e2b41aa7${_scopeId}> Dieser Text ist so vom Anwalt geprüft. </label>`);
									else _push(`<!---->`);
									_push(`</div>`);
								} else return [(0, vue_exports.createVNode)("div", { class: "adm-fields" }, [
									pending.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)("p", { class: "adm-note" }, "Das ändert sich im Shop:"), (0, vue_exports.createVNode)(DiffList_default, { changes: pending.value }, null, 8, ["changes"])], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
										key: 1,
										class: "adm-note"
									}, (0, vue_exports.toDisplayString)(__props.page.published ? "Der Text ist derselbe wie im Shop." : "Der Artikel geht mit diesem Text in den Shop."), 1)),
									(0, vue_exports.createVNode)("div", { class: "form-field" }, [
										(0, vue_exports.createVNode)("label", {
											class: "form-field__label",
											for: "pg-note"
										}, "Notiz zur Version (optional)"),
										(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
											id: "pg-note",
											"onUpdate:modelValue": ($event) => note.value = $event,
											class: "input",
											type: "text",
											maxlength: "200",
											autocomplete: "off"
										}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, note.value]]),
										(0, vue_exports.createVNode)("p", { class: "form-field__help" }, "Steht in der Versionsliste, zum Beispiel „Neue Versandzeiten“.")
									]),
									isLegal.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("label", {
										key: 2,
										class: "check"
									}, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										"onUpdate:modelValue": ($event) => reviewed.value = $event,
										type: "checkbox"
									}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelCheckbox, reviewed.value]]), (0, vue_exports.createTextVNode)(" Dieser Text ist so vom Anwalt geprüft. ")])) : (0, vue_exports.createCommentVNode)("", true)
								])];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(Dialog_default, {
							open: restoreOpen.value,
							"onUpdate:open": ($event) => restoreOpen.value = $event,
							title: `Version vom ${shownRevision.value?.at ?? ""} laden?`,
							"content-class": "adm-dialog"
						}, {
							actions: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-e2b41aa7${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-e2b41aa7${_scopeId}>Als Entwurf laden</button>`);
								else return [(0, vue_exports.createVNode)("button", {
									class: "btn btn--secondary",
									type: "button",
									onClick: ($event) => restoreOpen.value = false
								}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
									class: "btn btn--primary",
									type: "button",
									disabled: busy.value,
									"aria-busy": busy.value ? "true" : void 0,
									onClick: restore
								}, "Als Entwurf laden", 8, ["disabled", "aria-busy"])];
							}),
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push(`<div class="adm-fields" data-v-e2b41aa7${_scopeId}><p class="adm-confirm__body" data-v-e2b41aa7${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(restoreBody.value)}</p>`);
									if (comparisonFailed.value) _push(`<p class="adm-note" data-v-e2b41aa7${_scopeId}>Der Vergleich mit dem Shop konnte nicht geladen werden. Du kannst die Version trotzdem laden und vor dem Veröffentlichen prüfen.</p>`);
									else if (comparison.value === null) _push(`<p class="adm-note" role="status" data-v-e2b41aa7${_scopeId}>Vergleich mit dem Shop wird geladen …</p>`);
									else if (comparison.value.length === 0) _push(`<p class="adm-note" data-v-e2b41aa7${_scopeId}>Diese Version hat denselben Text, der gerade im Shop steht.</p>`);
									else {
										_push(`<!--[--><p class="adm-note" data-v-e2b41aa7${_scopeId}>Gegenüber dem Shop ändert sich damit:</p>`);
										_push((0, server_renderer_exports.ssrRenderComponent)(DiffList_default, { changes: comparison.value }, null, _parent, _scopeId));
										_push(`<!--]-->`);
									}
									_push(`</div>`);
								} else return [(0, vue_exports.createVNode)("div", { class: "adm-fields" }, [(0, vue_exports.createVNode)("p", { class: "adm-confirm__body" }, (0, vue_exports.toDisplayString)(restoreBody.value), 1), comparisonFailed.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 0,
									class: "adm-note"
								}, "Der Vergleich mit dem Shop konnte nicht geladen werden. Du kannst die Version trotzdem laden und vor dem Veröffentlichen prüfen.")) : comparison.value === null ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 1,
									class: "adm-note",
									role: "status"
								}, "Vergleich mit dem Shop wird geladen …")) : comparison.value.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 2,
									class: "adm-note"
								}, "Diese Version hat denselben Text, der gerade im Shop steht.")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createVNode)("p", { class: "adm-note" }, "Gegenüber dem Shop ändert sich damit:"), (0, vue_exports.createVNode)(DiffList_default, { changes: comparison.value }, null, 8, ["changes"])], 64))])];
							}),
							_: 1
						}, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: discarding.value,
							"onUpdate:open": ($event) => discarding.value = $event,
							title: "Entwurf verwerfen?",
							body: __props.live.blocks.length ? "Die Änderungen im Entwurf gehen verloren. Im Shop ändert sich nichts." : "Der Artikel beginnt wieder leer, mit seinem Titel. Im Shop ändert sich nichts.",
							"confirm-label": "Verwerfen",
							busy: busy.value,
							onConfirm: discardDraft
						}, null, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: withdrawing.value,
							"onUpdate:open": ($event) => withdrawing.value = $event,
							title: `${__props.page.title} zurückziehen?`,
							body: "Der Artikel verschwindet aus dem Shop und aus der Liste der Ratgeber. Seine Texte bleiben hier, und du kannst ihn jederzeit wieder veröffentlichen.",
							"confirm-label": "Zurückziehen",
							busy: busy.value,
							onConfirm: withdraw
						}, null, _parent, _scopeId));
					} else return [
						(0, vue_exports.createVNode)("div", { class: "pg" }, [(0, vue_exports.createVNode)("div", { class: "pg__fields" }, [
							errorList.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 0,
								id: "pg-problems",
								class: "adm-alert pg__problems",
								role: "alert",
								tabindex: "-1"
							}, [(0, vue_exports.createVNode)("p", null, (0, vue_exports.toDisplayString)(lastAction.value === "publish" ? "Veröffentlichen" : "Speichern") + " geht noch nicht. Bitte prüf " + (0, vue_exports.toDisplayString)(errorList.value.length === 1 ? "diese Stelle" : `diese ${errorList.value.length} Stellen`) + ": ", 1), (0, vue_exports.createVNode)("ul", null, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(errorList.value, ([path, message]) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", { key: path }, [(0, vue_exports.unref)(placeOf)(__props.schema, (0, vue_exports.unref)(form).blocks, path) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("a", {
									key: 0,
									href: `#${(0, vue_exports.unref)(fieldId)(path)}`,
									onClick: (0, vue_exports.withModifiers)(($event) => focusField(path), ["prevent"])
								}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(placeOf)(__props.schema, (0, vue_exports.unref)(form).blocks, path)) + ": " + (0, vue_exports.toDisplayString)(message), 9, ["href", "onClick"])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 1 }, [(0, vue_exports.createTextVNode)((0, vue_exports.toDisplayString)(message), 1)], 64))]);
							}), 128))])])) : (0, vue_exports.createCommentVNode)("", true),
							__props.page.placeholder ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 1,
								class: "adm-note"
							}, " Auf dieser Seite steht noch der Platzhalter der Kanzlei. Füg den Text ein, den die Kanzlei geliefert hat, und veröffentliche ihn. ")) : (0, vue_exports.createCommentVNode)("", true),
							__props.page.lawyerReviewed ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 2,
								class: "adm-note"
							}, " Diese Fassung ist als vom Anwalt geprüft markiert. Änderst du den Text, bestätigst du das beim Veröffentlichen neu. ")) : (0, vue_exports.createCommentVNode)("", true),
							pageError.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 3,
								class: "adm-alert",
								role: "alert"
							}, (0, vue_exports.toDisplayString)(pageError.value), 1)) : (0, vue_exports.createCommentVNode)("", true),
							__props.draft ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 4,
								class: "adm-note"
							}, [
								(0, vue_exports.createTextVNode)(" Entwurf vom " + (0, vue_exports.toDisplayString)(__props.draft.at), 1),
								__props.draft.by ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createTextVNode)(" von " + (0, vue_exports.toDisplayString)(__props.draft.by), 1)], 64)) : (0, vue_exports.createCommentVNode)("", true),
								(0, vue_exports.createTextVNode)(". " + (0, vue_exports.toDisplayString)(__props.page.published ? "Im Shop steht noch die veröffentlichte Fassung." : "Der Artikel ist noch nicht im Shop zu sehen."), 1)
							])) : !__props.page.published ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 5,
								class: "adm-note"
							}, "Dieser Artikel ist nicht veröffentlicht. Besucher sehen ihn erst, wenn du ihn veröffentlichst.")) : (0, vue_exports.createCommentVNode)("", true),
							__props.schema.page.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
								key: 6,
								class: "pg__group"
							}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.schema.page, (field) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(FieldInput_default, {
									id: (0, vue_exports.unref)(fieldId)(field.key),
									key: field.key,
									field,
									"model-value": pageValue(field),
									error: err(field.key),
									readonly: readonly.value,
									"onUpdate:modelValue": ($event) => setPageValue(field, $event)
								}, null, 8, [
									"id",
									"field",
									"model-value",
									"error",
									"readonly",
									"onUpdate:modelValue"
								]);
							}), 128))])) : (0, vue_exports.createCommentVNode)("", true),
							((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(fixedIndexes.value, (index) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
									key: `fixed-${index}`,
									class: "pg__block",
									"aria-labelledby": `pg-block-${index}`
								}, [
									(0, vue_exports.createVNode)("h2", {
										id: `pg-block-${index}`,
										class: "pg__heading"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(blockLabel)(__props.schema, (0, vue_exports.unref)(form).blocks, index)), 9, ["id"]),
									((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(schemaOf(index)?.fields ?? [], (field) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(FieldInput_default, {
											id: (0, vue_exports.unref)(fieldId)(`blocks.${index}.data.${field.key}`),
											key: field.key,
											field,
											"model-value": blockValue(index, field.key),
											error: err(`blocks.${index}.data.${field.key}`),
											readonly: readonly.value,
											"onUpdate:modelValue": ($event) => setBlockValue(index, field.key, $event)
										}, null, 8, [
											"id",
											"field",
											"model-value",
											"error",
											"readonly",
											"onUpdate:modelValue"
										]);
									}), 128)),
									schemaOf(index)?.list ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [
										err(`blocks.${index}.data.${schemaOf(index).list.key}`) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 0,
											class: "form-field__error"
										}, (0, vue_exports.toDisplayString)(err(`blocks.${index}.data.${schemaOf(index).list.key}`)), 1)) : (0, vue_exports.createCommentVNode)("", true),
										((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(items(index, schemaOf(index).list.key), (item, j) => {
											return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("fieldset", {
												id: `pg-item-${index}-${j}`,
												key: j,
												class: "pg__item",
												tabindex: "-1"
											}, [
												(0, vue_exports.createVNode)("legend", { class: "visually-hidden" }, (0, vue_exports.toDisplayString)(schemaOf(index).list.itemLabel) + " " + (0, vue_exports.toDisplayString)(j + 1), 1),
												(0, vue_exports.createVNode)("div", { class: "pg__block-head" }, [(0, vue_exports.createVNode)("span", {
													class: "pg__item-title",
													"aria-hidden": "true"
												}, (0, vue_exports.toDisplayString)(schemaOf(index).list.itemLabel) + " " + (0, vue_exports.toDisplayString)(j + 1), 1), !readonly.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
													key: 0,
													class: "pg__tools"
												}, [
													(0, vue_exports.createVNode)("button", {
														id: `pg-item-up-${index}-${j}`,
														class: "adm-iconbtn",
														type: "button",
														disabled: j === 0,
														"aria-label": `${schemaOf(index).list.itemLabel} ${j + 1} nach oben`,
														onClick: ($event) => moveItem(index, schemaOf(index), j, -1)
													}, [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "chevron-up",
														size: 20
													})], 8, [
														"id",
														"disabled",
														"aria-label",
														"onClick"
													]),
													(0, vue_exports.createVNode)("button", {
														id: `pg-item-down-${index}-${j}`,
														class: "adm-iconbtn",
														type: "button",
														disabled: j === items(index, schemaOf(index).list.key).length - 1,
														"aria-label": `${schemaOf(index).list.itemLabel} ${j + 1} nach unten`,
														onClick: ($event) => moveItem(index, schemaOf(index), j, 1)
													}, [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "chevron-down",
														size: 20
													})], 8, [
														"id",
														"disabled",
														"aria-label",
														"onClick"
													]),
													(0, vue_exports.createVNode)("button", {
														class: "adm-iconbtn",
														type: "button",
														disabled: items(index, schemaOf(index).list.key).length <= schemaOf(index).list.min,
														"aria-label": `${schemaOf(index).list.itemLabel} ${j + 1} entfernen`,
														onClick: ($event) => removeItem(index, schemaOf(index), j)
													}, [(0, vue_exports.createVNode)(AdminIcon_default, {
														name: "delete",
														size: 20
													})], 8, [
														"disabled",
														"aria-label",
														"onClick"
													])
												])) : (0, vue_exports.createCommentVNode)("", true)]),
												((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(schemaOf(index).list.fields, (field) => {
													return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(FieldInput_default, {
														id: (0, vue_exports.unref)(fieldId)(`blocks.${index}.data.${schemaOf(index).list.key}.${j}.${field.key}`),
														key: field.key,
														field,
														"model-value": item[field.key] ?? null,
														error: err(`blocks.${index}.data.${schemaOf(index).list.key}.${j}.${field.key}`),
														readonly: readonly.value,
														"onUpdate:modelValue": ($event) => item[field.key] = $event
													}, null, 8, [
														"id",
														"field",
														"model-value",
														"error",
														"readonly",
														"onUpdate:modelValue"
													]);
												}), 128))
											], 8, ["id"]);
										}), 128)),
										!readonly.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
											key: 1,
											id: `pg-add-item-${index}`,
											class: "btn btn--secondary pg__add",
											type: "button",
											disabled: items(index, schemaOf(index).list.key).length >= schemaOf(index).list.max,
											onClick: ($event) => addItem(index, schemaOf(index))
										}, [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "plus",
											size: 20
										}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(schemaOf(index).list.itemLabel) + " hinzufügen ", 1)], 8, [
											"id",
											"disabled",
											"onClick"
										])) : (0, vue_exports.createCommentVNode)("", true),
										!readonly.value && items(index, schemaOf(index).list.key).length >= schemaOf(index).list.max ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
											key: 2,
											class: "form-field__help"
										}, " Mehr als " + (0, vue_exports.toDisplayString)(schemaOf(index).list.max) + " passen nicht in die Zeile. ", 1)) : (0, vue_exports.createCommentVNode)("", true)
									], 64)) : (0, vue_exports.createCommentVNode)("", true)
								], 8, ["aria-labelledby"]);
							}), 128)),
							sectionType.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 7 }, [
								err("blocks") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 0,
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(err("blocks")), 1)) : (0, vue_exports.createCommentVNode)("", true),
								((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(sectionIndexes.value, (index, position) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
										id: `pg-section-${index}`,
										key: `section-${index}`,
										class: "pg__block",
										tabindex: "-1",
										"aria-labelledby": `pg-block-${index}`
									}, [(0, vue_exports.createVNode)("div", { class: "pg__block-head" }, [(0, vue_exports.createVNode)("h2", {
										id: `pg-block-${index}`,
										class: "pg__heading"
									}, (0, vue_exports.toDisplayString)((0, vue_exports.unref)(blockLabel)(__props.schema, (0, vue_exports.unref)(form).blocks, index)), 9, ["id"]), !readonly.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
										key: 0,
										class: "pg__tools"
									}, [
										(0, vue_exports.createVNode)("button", {
											id: `pg-move-up-${index}`,
											class: "adm-iconbtn",
											type: "button",
											disabled: position === 0,
											"aria-label": `${(0, vue_exports.unref)(blockLabel)(__props.schema, (0, vue_exports.unref)(form).blocks, index)} nach oben`,
											onClick: ($event) => moveSection(index, -1)
										}, [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "chevron-up",
											size: 20
										})], 8, [
											"id",
											"disabled",
											"aria-label",
											"onClick"
										]),
										(0, vue_exports.createVNode)("button", {
											id: `pg-move-down-${index}`,
											class: "adm-iconbtn",
											type: "button",
											disabled: position === sectionIndexes.value.length - 1,
											"aria-label": `${(0, vue_exports.unref)(blockLabel)(__props.schema, (0, vue_exports.unref)(form).blocks, index)} nach unten`,
											onClick: ($event) => moveSection(index, 1)
										}, [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "chevron-down",
											size: 20
										})], 8, [
											"id",
											"disabled",
											"aria-label",
											"onClick"
										]),
										(0, vue_exports.createVNode)("button", {
											class: "adm-iconbtn",
											type: "button",
											disabled: !mayRemoveSection.value,
											"aria-label": `${(0, vue_exports.unref)(blockLabel)(__props.schema, (0, vue_exports.unref)(form).blocks, index)} entfernen`,
											onClick: ($event) => removeSection(index)
										}, [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "delete",
											size: 20
										})], 8, [
											"disabled",
											"aria-label",
											"onClick"
										])
									])) : (0, vue_exports.createCommentVNode)("", true)]), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(sectionType.value.fields, (field) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(FieldInput_default, {
											id: (0, vue_exports.unref)(fieldId)(`blocks.${index}.data.${field.key}`),
											key: field.key,
											field,
											"model-value": blockValue(index, field.key),
											error: err(`blocks.${index}.data.${field.key}`),
											readonly: readonly.value,
											"onUpdate:modelValue": ($event) => setBlockValue(index, field.key, $event)
										}, null, 8, [
											"id",
											"field",
											"model-value",
											"error",
											"readonly",
											"onUpdate:modelValue"
										]);
									}), 128))], 8, ["id", "aria-labelledby"]);
								}), 128)),
								!readonly.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 1,
									id: "pg-add-section",
									class: "btn btn--secondary pg__add",
									type: "button",
									disabled: !mayAddSection.value,
									onClick: addSection
								}, [(0, vue_exports.createVNode)(AdminIcon_default, {
									name: "plus",
									size: 20
								}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(sectionType.value.label) + " hinzufügen ", 1)], 8, ["disabled"])) : (0, vue_exports.createCommentVNode)("", true)
							], 64)) : (0, vue_exports.createCommentVNode)("", true),
							(0, vue_exports.createVNode)("section", {
								class: "pg__versions",
								"aria-labelledby": "pg-versions"
							}, [(0, vue_exports.createVNode)("h2", {
								id: "pg-versions",
								class: "pg__heading"
							}, "Versionen"), __props.revisions.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-note"
							}, " Noch keine Version. Beim ersten Veröffentlichen wird auch die bisherige Fassung aus dem Shop gesichert. ")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("ul", {
								key: 1,
								class: "pg__revisions"
							}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(__props.revisions, (revision, index) => {
								return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("li", {
									key: revision.id,
									class: "pg__revision"
								}, [(0, vue_exports.createVNode)("div", { class: "pg__revision-text" }, [
									(0, vue_exports.createVNode)("span", { class: "pg__revision-at" }, (0, vue_exports.toDisplayString)(revision.at), 1),
									(0, vue_exports.createVNode)("span", { class: "pg__revision-by" }, (0, vue_exports.toDisplayString)(revision.by ?? "Ausgangsstand"), 1),
									revision.note ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
										key: 0,
										class: "pg__revision-note"
									}, (0, vue_exports.toDisplayString)(revision.note), 1)) : (0, vue_exports.createCommentVNode)("", true)
								]), isLive(revision, index) ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
									key: 0,
									class: "pg__revision-live"
								}, "Steht im Shop")) : __props.can.edit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 1,
									class: "btn btn--secondary btn--sm",
									type: "button",
									onClick: ($event) => openRestore(revision)
								}, "Als Entwurf laden", 8, ["onClick"])) : (0, vue_exports.createCommentVNode)("", true)]);
							}), 128))]))])
						]), (0, vue_exports.createVNode)(PreviewFrame_default, {
							class: "pg__preview",
							urls: __props.preview,
							version: previewVersion.value,
							unsaved: (0, vue_exports.unref)(editor).dirty.value
						}, null, 8, [
							"urls",
							"version",
							"unsaved"
						])]),
						__props.can.edit ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(AdminSaveBar_default, {
							key: 0,
							editor: (0, vue_exports.unref)(editor)
						}, null, 8, ["editor"])) : (0, vue_exports.createCommentVNode)("", true),
						(0, vue_exports.createVNode)(Dialog_default, {
							open: publishOpen.value,
							"onUpdate:open": ($event) => publishOpen.value = $event,
							title: "Seite veröffentlichen?",
							"content-class": "adm-dialog",
							onCloseAutoFocus: onPublishClosed
						}, {
							actions: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "button",
								onClick: ($event) => publishOpen.value = false
							}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "button",
								disabled: publishing.value,
								"aria-busy": publishing.value ? "true" : void 0,
								onClick: publish
							}, (0, vue_exports.toDisplayString)(publishing.value ? "Wird veröffentlicht …" : "Veröffentlichen"), 9, ["disabled", "aria-busy"])]),
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("div", { class: "adm-fields" }, [
								pending.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)("p", { class: "adm-note" }, "Das ändert sich im Shop:"), (0, vue_exports.createVNode)(DiffList_default, { changes: pending.value }, null, 8, ["changes"])], 64)) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 1,
									class: "adm-note"
								}, (0, vue_exports.toDisplayString)(__props.page.published ? "Der Text ist derselbe wie im Shop." : "Der Artikel geht mit diesem Text in den Shop."), 1)),
								(0, vue_exports.createVNode)("div", { class: "form-field" }, [
									(0, vue_exports.createVNode)("label", {
										class: "form-field__label",
										for: "pg-note"
									}, "Notiz zur Version (optional)"),
									(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
										id: "pg-note",
										"onUpdate:modelValue": ($event) => note.value = $event,
										class: "input",
										type: "text",
										maxlength: "200",
										autocomplete: "off"
									}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelText, note.value]]),
									(0, vue_exports.createVNode)("p", { class: "form-field__help" }, "Steht in der Versionsliste, zum Beispiel „Neue Versandzeiten“.")
								]),
								isLegal.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("label", {
									key: 2,
									class: "check"
								}, [(0, vue_exports.withDirectives)((0, vue_exports.createVNode)("input", {
									"onUpdate:modelValue": ($event) => reviewed.value = $event,
									type: "checkbox"
								}, null, 8, ["onUpdate:modelValue"]), [[vue_exports.vModelCheckbox, reviewed.value]]), (0, vue_exports.createTextVNode)(" Dieser Text ist so vom Anwalt geprüft. ")])) : (0, vue_exports.createCommentVNode)("", true)
							])]),
							_: 1
						}, 8, ["open", "onUpdate:open"]),
						(0, vue_exports.createVNode)(Dialog_default, {
							open: restoreOpen.value,
							"onUpdate:open": ($event) => restoreOpen.value = $event,
							title: `Version vom ${shownRevision.value?.at ?? ""} laden?`,
							"content-class": "adm-dialog"
						}, {
							actions: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("button", {
								class: "btn btn--secondary",
								type: "button",
								onClick: ($event) => restoreOpen.value = false
							}, "Abbrechen", 8, ["onClick"]), (0, vue_exports.createVNode)("button", {
								class: "btn btn--primary",
								type: "button",
								disabled: busy.value,
								"aria-busy": busy.value ? "true" : void 0,
								onClick: restore
							}, "Als Entwurf laden", 8, ["disabled", "aria-busy"])]),
							default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)("div", { class: "adm-fields" }, [(0, vue_exports.createVNode)("p", { class: "adm-confirm__body" }, (0, vue_exports.toDisplayString)(restoreBody.value), 1), comparisonFailed.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 0,
								class: "adm-note"
							}, "Der Vergleich mit dem Shop konnte nicht geladen werden. Du kannst die Version trotzdem laden und vor dem Veröffentlichen prüfen.")) : comparison.value === null ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 1,
								class: "adm-note",
								role: "status"
							}, "Vergleich mit dem Shop wird geladen …")) : comparison.value.length === 0 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
								key: 2,
								class: "adm-note"
							}, "Diese Version hat denselben Text, der gerade im Shop steht.")) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 3 }, [(0, vue_exports.createVNode)("p", { class: "adm-note" }, "Gegenüber dem Shop ändert sich damit:"), (0, vue_exports.createVNode)(DiffList_default, { changes: comparison.value }, null, 8, ["changes"])], 64))])]),
							_: 1
						}, 8, [
							"open",
							"onUpdate:open",
							"title"
						]),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: discarding.value,
							"onUpdate:open": ($event) => discarding.value = $event,
							title: "Entwurf verwerfen?",
							body: __props.live.blocks.length ? "Die Änderungen im Entwurf gehen verloren. Im Shop ändert sich nichts." : "Der Artikel beginnt wieder leer, mit seinem Titel. Im Shop ändert sich nichts.",
							"confirm-label": "Verwerfen",
							busy: busy.value,
							onConfirm: discardDraft
						}, null, 8, [
							"open",
							"onUpdate:open",
							"body",
							"busy"
						]),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: withdrawing.value,
							"onUpdate:open": ($event) => withdrawing.value = $event,
							title: `${__props.page.title} zurückziehen?`,
							body: "Der Artikel verschwindet aus dem Shop und aus der Liste der Ratgeber. Seine Texte bleiben hier, und du kannst ihn jederzeit wieder veröffentlichen.",
							"confirm-label": "Zurückziehen",
							busy: busy.value,
							onConfirm: withdraw
						}, null, 8, [
							"open",
							"onUpdate:open",
							"title",
							"busy"
						])
					];
				}),
				_: 2
			}, [__props.can.publish ? {
				name: "primary",
				fn: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([publishIsNext.value ? "btn--primary" : "btn--secondary", "btn"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", nothingToPublish.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", nothingToPublish.value ? "pg-nothing" : void 0)} data-v-e2b41aa7${_scopeId}> Veröffentlichen </button>`);
						if (nothingToPublish.value) _push(`<span id="pg-nothing" class="visually-hidden" data-v-e2b41aa7${_scopeId}>Der Shop zeigt schon genau diesen Stand.</span>`);
						else _push(`<!---->`);
					} else return [(0, vue_exports.createVNode)("button", {
						class: ["btn", publishIsNext.value ? "btn--primary" : "btn--secondary"],
						type: "button",
						"aria-disabled": nothingToPublish.value ? "true" : void 0,
						"aria-describedby": nothingToPublish.value ? "pg-nothing" : void 0,
						onClick: openPublish
					}, " Veröffentlichen ", 10, ["aria-disabled", "aria-describedby"]), nothingToPublish.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("span", {
						key: 0,
						id: "pg-nothing",
						class: "visually-hidden"
					}, "Der Shop zeigt schon genau diesen Stand.")) : (0, vue_exports.createCommentVNode)("", true)];
				}),
				key: "0"
			} : void 0]), _parent));
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Seiten/Bearbeiten.vue
var _sfc_setup = Bearbeiten_vue_vue_type_script_setup_true_lang_default.setup;
Bearbeiten_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Seiten/Bearbeiten.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var Bearbeiten_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Bearbeiten_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-e2b41aa7"]]);
//#endregion
export { Bearbeiten_default as default };
