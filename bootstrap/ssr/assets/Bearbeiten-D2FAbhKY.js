import { t as Dialog_default } from "./Dialog-BPdFERzS.js";
import { n as AdminLayout_default, t as AdminPage_default } from "./AdminPage-yqAbwMfa.js";
import { c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { t as AdminConfirm_default } from "./AdminConfirm-CuIy_ILR.js";
import { a as toast } from "./toast-Ckkabove.js";
import { n as useDirtyForm } from "./useDirtyForm-jjlNVm-n.js";
import { t as AdminSaveBar_default } from "./AdminSaveBar-BwfIFyA9.js";
import { a as emptyItem, c as move, d as repeatables, i as emptyBlock, n as clickGuard, o as fieldId, r as diff, t as blockLabel, u as placeOf } from "./content-DmUz2EQt.js";
import { t as FieldInput_default } from "./FieldInput-CQMOF_nm.js";
import { t as DiffList_default } from "./DiffList-DKPKL-HB.js";
import { t as GridField_default } from "./GridField-3bfk4s04.js";
import { t as ImageField_default } from "./ImageField-BF9dg37K.js";
import { t as PreviewFrame_default } from "./PreviewFrame-BGepfi6n.js";
//#region resources/js/Pages/Admin/Seiten/Bearbeiten.vue?vue&type=script&setup=true&lang.ts
/** The switch asked for, held while its question is open. */
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
		/** What takes the focus for a field: a picture's button (FilePick hides the file input behind it), else the field. */
		function focusTarget(path) {
			const id = fieldId(path);
			return document.getElementById(`${id}-button`) ? `${id}-button` : id;
		}
		function focusField(path) {
			document.getElementById(focusTarget(path))?.focus();
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
		function cellsOf(index, key) {
			const value = form.blocks[index]?.data[key];
			return Array.isArray(value) ? value.map((cell) => typeof cell === "string" ? cell : "") : [];
		}
		function rowsOf(index) {
			const value = form.blocks[index]?.data.rows;
			return Array.isArray(value) ? value.map((row) => Array.isArray(row) ? row.map((cell) => typeof cell === "string" ? cell : "") : []) : [];
		}
		function setTable(index, key, table) {
			const block = form.blocks[index];
			if (block) {
				block.data[key] = table.head;
				block.data.rows = table.rows;
			}
		}
		function setImage(index, key, image) {
			const block = form.blocks[index];
			if (block) {
				block.data[key] = image.src;
				block.data.width = image.width;
				block.data.height = image.height;
			}
		}
		function textOf(index, key) {
			const value = form.blocks[index]?.data[key];
			return typeof value === "string" ? value : "";
		}
		const sectionTypes = (0, vue_exports.computed)(() => repeatables(props.schema));
		function isSection(type) {
			return sectionTypes.value.some((definition) => definition.type === type);
		}
		const sectionIndexes = (0, vue_exports.computed)(() => form.blocks.map((block, index) => isSection(block.type) ? index : -1).filter((index) => index >= 0));
		const fixedIndexes = (0, vue_exports.computed)(() => form.blocks.map((block, index) => isSection(block.type) ? -1 : index).filter((index) => index >= 0));
		function countOf(type) {
			return form.blocks.filter((block) => block.type === type).length;
		}
		function mayAdd(definition) {
			return countOf(definition.type) < definition.max;
		}
		function mayRemove(index) {
			const definition = schemaOf(index);
			return definition !== void 0 && countOf(definition.type) > definition.min;
		}
		/** The add button of a block type: the first keeps the id it always had. */
		function addId(definition) {
			return definition === sectionTypes.value[0] ? "pg-add-section" : `pg-add-${definition.type}`;
		}
		/** The kinds at their limit, said under the add buttons — a greyed button alone does not say why (SEI-32). */
		const limitsReached = (0, vue_exports.computed)(() => sectionTypes.value.filter((definition) => !mayAdd(definition)).map((definition) => `Höchstens ${definition.max} ${definition.many ?? definition.label} pro Seite.`));
		const blockKeys = /* @__PURE__ */ new WeakMap();
		let lastKey = 0;
		function keyOf(index) {
			const block = form.blocks[index];
			if (!block) return -index;
			const raw = (0, vue_exports.toRaw)(block);
			let key = blockKeys.get(raw);
			if (key === void 0) {
				key = ++lastKey;
				blockKeys.set(raw, key);
			}
			return key;
		}
		const settled = clickGuard();
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
		function addSection(definition) {
			if (!mayAdd(definition)) return;
			form.blocks = [...form.blocks, emptyBlock(definition)];
			structureChanged();
			const index = form.blocks.length - 1;
			const first = definition.fields[0];
			if (first) {
				const id = fieldId(`blocks.${index}.data.${first.key}`);
				focusAfter(first.kind === "image" ? `${id}-button` : id);
			}
		}
		function removeSection(index, event) {
			if (!mayRemove(index) || !settled(event)) return;
			const label = blockLabel(props.schema, form.blocks, index);
			const removed = form.blocks[index];
			const definition = schemaOf(index);
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
						if (definition && !mayAdd(definition)) {
							toast.show({
								text: `${label} kommt nicht zurück: Mehr als ${definition.max} ${definition.many ?? definition.label} hat eine Seite nicht.`,
								icon: "info"
							});
							return;
						}
						const blocks = [...form.blocks];
						blocks.splice(Math.min(index, blocks.length), 0, removed);
						form.blocks = blocks;
						structureChanged();
						focusAfter(`pg-section-${index}`);
					}
				}
			});
		}
		function moveSection(index, by, event) {
			const position = sectionIndexes.value.indexOf(index);
			const target = sectionIndexes.value[position + by];
			if (target === void 0 || !settled(event)) return;
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
		function removeItem(index, block, item, event) {
			const list = block.list;
			if (!list || items(index, list.key).length <= list.min || !settled(event)) return;
			setItems(index, list.key, items(index, list.key).filter((_, i) => i !== item));
			structureChanged();
			focusAfter(`pg-add-item-${index}`);
		}
		function moveItem(index, block, item, by, event) {
			const list = block.list;
			if (!list || !settled(event)) return;
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
		const switching = (0, vue_exports.ref)(null);
		const switchBusy = (0, vue_exports.ref)(false);
		const switchOpen = (0, vue_exports.computed)({
			get: () => switching.value !== null,
			set: (open) => {
				if (!open) switching.value = null;
			}
		});
		const textSwitchWaits = (0, vue_exports.computed)(() => props.page.placeholder && props.page.markerLeft);
		/** A refusal of the switch, beside the switches rather than above the fields. */
		const switchError = (0, vue_exports.computed)(() => {
			const raw = inertiaPage.props.errors;
			const bag = raw !== null && typeof raw === "object" ? raw : {};
			return bag.placeholder ?? bag.part ?? "";
		});
		const SWITCH_COPY = {
			"text-off": {
				title: "Platzhalter ausschalten?",
				body: "Besucher lesen dann den veröffentlichten Text dieser Seite. Schalte den Platzhalter nur aus, wenn dort der Text der Kanzlei steht.",
				confirm: "Ausschalten"
			},
			"text-on": {
				title: "Platzhalter einschalten?",
				body: "Besucher sehen dann statt des Textes nur den Hinweis, dass der Text der Kanzlei folgt. Solange der Platzhalter an ist, sperrt der Shop Suchmaschinen aus und nimmt keine echten Zahlungen an.",
				confirm: "Einschalten"
			},
			"formular-off": {
				title: "Platzhalter beim Muster-Widerrufsformular ausschalten?",
				body: "Besucher sehen dann das Muster-Widerrufsformular im Wortlaut des Gesetzes. Schalte den Platzhalter erst aus, wenn die Kanzlei das Formular freigegeben hat.",
				confirm: "Ausschalten"
			},
			"formular-on": {
				title: "Platzhalter beim Muster-Widerrufsformular einschalten?",
				body: "Besucher sehen dann statt des Formulars nur den Hinweis, dass der Text der Kanzlei folgt. Solange der Platzhalter an ist, sperrt der Shop Suchmaschinen aus und nimmt keine echten Zahlungen an.",
				confirm: "Einschalten"
			}
		};
		const switchCopy = (0, vue_exports.ref)(SWITCH_COPY["text-off"]);
		function askSwitch(part, on) {
			if (part === "text" && !on && textSwitchWaits.value) return;
			switchCopy.value = SWITCH_COPY[`${part}-${on ? "on" : "off"}`];
			switching.value = {
				part,
				on
			};
		}
		function switchPlaceholder() {
			const target = switching.value;
			if (target === null || switchBusy.value) return;
			switchBusy.value = true;
			router.post(`/admin/seiten/${props.page.id}/platzhalter`, {
				part: target.part,
				placeholder: target.on
			}, {
				preserveScroll: true,
				preserveState: true,
				onFinish: () => {
					switchBusy.value = false;
					switching.value = null;
				}
			});
		}
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
						_push(`<div class="pg" data-v-3a404ded${_scopeId}><div class="pg__fields" data-v-3a404ded${_scopeId}>`);
						if (errorList.value.length) {
							_push(`<div id="pg-problems" class="adm-alert pg__problems" role="alert" tabindex="-1" data-v-3a404ded${_scopeId}><p data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(lastAction.value === "publish" ? "Veröffentlichen" : "Speichern")} geht noch nicht. Bitte prüf ${(0, server_renderer_exports.ssrInterpolate)(errorList.value.length === 1 ? "diese Stelle" : `diese ${errorList.value.length} Stellen`)}: </p><ul data-v-3a404ded${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(errorList.value, ([path, message]) => {
								_push(`<li data-v-3a404ded${_scopeId}>`);
								if ((0, vue_exports.unref)(placeOf)(__props.schema, (0, vue_exports.unref)(form).blocks, path)) _push(`<a${(0, server_renderer_exports.ssrRenderAttr)("href", `#${(0, vue_exports.unref)(fieldId)(path)}`)} data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(placeOf)(__props.schema, (0, vue_exports.unref)(form).blocks, path))}: ${(0, server_renderer_exports.ssrInterpolate)(message)}</a>`);
								else _push(`<!--[-->${(0, server_renderer_exports.ssrInterpolate)(message)}<!--]-->`);
								_push(`</li>`);
							});
							_push(`<!--]--></ul></div>`);
						} else _push(`<!---->`);
						if (isLegal.value) {
							_push(`<section class="pg__switches" aria-labelledby="pg-switches" data-v-3a404ded${_scopeId}><h2 id="pg-switches" class="pg__heading" data-v-3a404ded${_scopeId}>Platzhalter</h2><div class="pg__switch" data-v-3a404ded${_scopeId}><p class="pg__switch-state" data-v-3a404ded${_scopeId}><span class="${(0, server_renderer_exports.ssrRenderClass)([__props.page.placeholder ? "adm-tag--warn" : "adm-tag--neutral", "adm-tag"])}" data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.page.placeholder ? "An" : "Aus")}</span> ${(0, server_renderer_exports.ssrInterpolate)(__props.page.placeholder ? "Besucher sehen statt des Textes nur den Hinweis, dass der Text der Kanzlei folgt." : "Besucher lesen den veröffentlichten Text.")}</p>`);
							if (__props.can.publish) _push(`<button id="pg-switch-text" class="btn btn--secondary btn--sm" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", textSwitchWaits.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", textSwitchWaits.value ? "pg-switch-waits" : void 0)} data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.page.placeholder ? "Platzhalter ausschalten" : "Platzhalter einschalten")}</button>`);
							else _push(`<!---->`);
							_push(`</div>`);
							if (textSwitchWaits.value) _push(`<p id="pg-switch-waits" class="adm-note" data-v-3a404ded${_scopeId}> Im veröffentlichten Text steht noch „[Rechtstext folgt von der Kanzlei …]“. Ersetz das in jedem Abschnitt durch den Text der Kanzlei, veröffentliche die Seite und schalte den Platzhalter danach aus. </p>`);
							else _push(`<!---->`);
							if (__props.page.formPlaceholder !== null) {
								_push(`<div class="pg__switch" data-v-3a404ded${_scopeId}><p class="pg__switch-state" data-v-3a404ded${_scopeId}><span class="${(0, server_renderer_exports.ssrRenderClass)([__props.page.formPlaceholder ? "adm-tag--warn" : "adm-tag--neutral", "adm-tag"])}" data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.page.formPlaceholder ? "An" : "Aus")}</span> ${(0, server_renderer_exports.ssrInterpolate)(__props.page.formPlaceholder ? "Muster-Widerrufsformular: Besucher sehen nur den Hinweis, dass der Text der Kanzlei folgt." : "Muster-Widerrufsformular: Besucher sehen das Formular im Wortlaut des Gesetzes.")}</p>`);
								if (__props.can.publish) _push(`<button id="pg-switch-form" class="btn btn--secondary btn--sm" type="button" data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.page.formPlaceholder ? "Platzhalter beim Formular ausschalten" : "Platzhalter beim Formular einschalten")}</button>`);
								else _push(`<!---->`);
								_push(`</div>`);
							} else _push(`<!---->`);
							if (switchError.value) _push(`<p class="adm-alert" role="alert" data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(switchError.value)}</p>`);
							else _push(`<!---->`);
							_push(`</section>`);
						} else _push(`<!---->`);
						if (__props.page.lawyerReviewed) _push(`<p class="adm-note" data-v-3a404ded${_scopeId}> Diese Fassung ist als vom Anwalt geprüft markiert. Änderst du den Text, bestätigst du das beim Veröffentlichen neu. </p>`);
						else _push(`<!---->`);
						if (pageError.value) _push(`<p class="adm-alert" role="alert" data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(pageError.value)}</p>`);
						else _push(`<!---->`);
						if (__props.draft) {
							_push(`<p class="adm-note" data-v-3a404ded${_scopeId}> Entwurf vom ${(0, server_renderer_exports.ssrInterpolate)(__props.draft.at)}`);
							if (__props.draft.by) _push(`<!--[--> von ${(0, server_renderer_exports.ssrInterpolate)(__props.draft.by)}<!--]-->`);
							else _push(`<!---->`);
							_push(`. ${(0, server_renderer_exports.ssrInterpolate)(__props.page.published ? "Im Shop steht noch die veröffentlichte Fassung." : "Der Artikel ist noch nicht im Shop zu sehen.")}</p>`);
						} else if (!__props.page.published) _push(`<p class="adm-note" data-v-3a404ded${_scopeId}>Dieser Artikel ist nicht veröffentlicht. Besucher sehen ihn erst, wenn du ihn veröffentlichst.</p>`);
						else _push(`<!---->`);
						if (__props.schema.page.length) {
							_push(`<div class="pg__group" data-v-3a404ded${_scopeId}><!--[-->`);
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
							_push(`<section class="pg__block"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `pg-block-${index}`)} data-v-3a404ded${_scopeId}><h2${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-block-${index}`)} class="pg__heading" data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(blockLabel)(__props.schema, (0, vue_exports.unref)(form).blocks, index))}</h2><!--[-->`);
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
								if (err(`blocks.${index}.data.${schemaOf(index).list.key}`)) _push(`<p class="form-field__error" data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err(`blocks.${index}.data.${schemaOf(index).list.key}`))}</p>`);
								else _push(`<!---->`);
								_push(`<!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(items(index, schemaOf(index).list.key), (item, j) => {
									_push(`<fieldset${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-item-${index}-${j}`)} class="pg__item" tabindex="-1" data-v-3a404ded${_scopeId}><legend class="visually-hidden" data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(schemaOf(index).list.itemLabel)} ${(0, server_renderer_exports.ssrInterpolate)(j + 1)}</legend><div class="pg__block-head" data-v-3a404ded${_scopeId}><span class="pg__item-title" aria-hidden="true" data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(schemaOf(index).list.itemLabel)} ${(0, server_renderer_exports.ssrInterpolate)(j + 1)}</span>`);
									if (!readonly.value) {
										_push(`<div class="pg__tools" data-v-3a404ded${_scopeId}><button${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-item-up-${index}-${j}`)} class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(j === 0) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${schemaOf(index).list.itemLabel} ${j + 1} nach oben`)} data-v-3a404ded${_scopeId}>`);
										_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
											name: "chevron-up",
											size: 20
										}, null, _parent, _scopeId));
										_push(`</button><button${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-item-down-${index}-${j}`)} class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(j === items(index, schemaOf(index).list.key).length - 1) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${schemaOf(index).list.itemLabel} ${j + 1} nach unten`)} data-v-3a404ded${_scopeId}>`);
										_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
											name: "chevron-down",
											size: 20
										}, null, _parent, _scopeId));
										_push(`</button><button class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(items(index, schemaOf(index).list.key).length <= schemaOf(index).list.min) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${schemaOf(index).list.itemLabel} ${j + 1} entfernen`)} data-v-3a404ded${_scopeId}>`);
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
									_push(`<button${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-add-item-${index}`)} class="btn btn--secondary pg__add" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(items(index, schemaOf(index).list.key).length >= schemaOf(index).list.max) ? " disabled" : ""} data-v-3a404ded${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "plus",
										size: 20
									}, null, _parent, _scopeId));
									_push(` ${(0, server_renderer_exports.ssrInterpolate)(schemaOf(index).list.itemLabel)} hinzufügen </button>`);
								} else _push(`<!---->`);
								if (!readonly.value && items(index, schemaOf(index).list.key).length >= schemaOf(index).list.max) _push(`<p class="form-field__help" data-v-3a404ded${_scopeId}> Mehr als ${(0, server_renderer_exports.ssrInterpolate)(schemaOf(index).list.max)} passen nicht in die Zeile. </p>`);
								else _push(`<!---->`);
								_push(`<!--]-->`);
							} else _push(`<!---->`);
							_push(`</section>`);
						});
						_push(`<!--]-->`);
						if (sectionTypes.value.length) {
							_push(`<!--[-->`);
							if (err("blocks")) _push(`<p class="form-field__error" data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(err("blocks"))}</p>`);
							else _push(`<!---->`);
							_push(`<!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(sectionIndexes.value, (index, position) => {
								_push(`<section${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-section-${index}`)} class="pg__block" tabindex="-1"${(0, server_renderer_exports.ssrRenderAttr)("aria-labelledby", `pg-block-${index}`)} data-v-3a404ded${_scopeId}><div class="pg__block-head" data-v-3a404ded${_scopeId}><h2${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-block-${index}`)} class="pg__heading" data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)((0, vue_exports.unref)(blockLabel)(__props.schema, (0, vue_exports.unref)(form).blocks, index))}</h2>`);
								if (!readonly.value) {
									_push(`<div class="pg__tools" data-v-3a404ded${_scopeId}><button${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-move-up-${index}`)} class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(position === 0) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${(0, vue_exports.unref)(blockLabel)(__props.schema, (0, vue_exports.unref)(form).blocks, index)} nach oben`)} data-v-3a404ded${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "chevron-up",
										size: 20
									}, null, _parent, _scopeId));
									_push(`</button><button${(0, server_renderer_exports.ssrRenderAttr)("id", `pg-move-down-${index}`)} class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(position === sectionIndexes.value.length - 1) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${(0, vue_exports.unref)(blockLabel)(__props.schema, (0, vue_exports.unref)(form).blocks, index)} nach unten`)} data-v-3a404ded${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "chevron-down",
										size: 20
									}, null, _parent, _scopeId));
									_push(`</button><button class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!mayRemove(index)) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `${(0, vue_exports.unref)(blockLabel)(__props.schema, (0, vue_exports.unref)(form).blocks, index)} entfernen`)} data-v-3a404ded${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "delete",
										size: 20
									}, null, _parent, _scopeId));
									_push(`</button></div>`);
								} else _push(`<!---->`);
								_push(`</div><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(schemaOf(index)?.fields ?? [], (field) => {
									_push(`<!--[-->`);
									if (field.kind === "image") _push((0, server_renderer_exports.ssrRenderComponent)(ImageField_default, {
										id: (0, vue_exports.unref)(fieldId)(`blocks.${index}.data.${field.key}`),
										label: field.label,
										help: field.help,
										"page-id": __props.page.id,
										src: textOf(index, field.key),
										alt: textOf(index, "alt"),
										error: err(`blocks.${index}.data.${field.key}`),
										readonly: readonly.value,
										onUploaded: ($event) => setImage(index, field.key, $event)
									}, null, _parent, _scopeId));
									else if (field.kind === "grid") _push((0, server_renderer_exports.ssrRenderComponent)(GridField_default, {
										id: (0, vue_exports.unref)(fieldId)(`blocks.${index}.data.${field.key}`),
										"rows-id": (0, vue_exports.unref)(fieldId)(`blocks.${index}.data.rows`),
										label: field.label,
										help: field.help,
										head: cellsOf(index, field.key),
										rows: rowsOf(index),
										max: field.max ?? 200,
										"head-error": err(`blocks.${index}.data.${field.key}`),
										"rows-error": err(`blocks.${index}.data.rows`),
										readonly: readonly.value,
										onChange: ($event) => setTable(index, field.key, $event)
									}, null, _parent, _scopeId));
									else _push((0, server_renderer_exports.ssrRenderComponent)(FieldInput_default, {
										id: (0, vue_exports.unref)(fieldId)(`blocks.${index}.data.${field.key}`),
										field,
										"model-value": blockValue(index, field.key),
										error: err(`blocks.${index}.data.${field.key}`),
										readonly: readonly.value,
										"onUpdate:modelValue": ($event) => setBlockValue(index, field.key, $event)
									}, null, _parent, _scopeId));
									_push(`<!--]-->`);
								});
								_push(`<!--]--></section>`);
							});
							_push(`<!--]-->`);
							if (!readonly.value) {
								_push(`<div class="pg__adds" data-v-3a404ded${_scopeId}><!--[-->`);
								(0, server_renderer_exports.ssrRenderList)(sectionTypes.value, (definition) => {
									_push(`<button${(0, server_renderer_exports.ssrRenderAttr)("id", addId(definition))} class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(!mayAdd(definition)) ? " disabled" : ""} data-v-3a404ded${_scopeId}>`);
									_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
										name: "plus",
										size: 20
									}, null, _parent, _scopeId));
									_push(` ${(0, server_renderer_exports.ssrInterpolate)(definition.label)} hinzufügen </button>`);
								});
								_push(`<!--]--></div>`);
							} else _push(`<!---->`);
							if (!readonly.value && limitsReached.value.length) _push(`<p class="form-field__help" data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(limitsReached.value.join(" "))}</p>`);
							else _push(`<!---->`);
							_push(`<!--]-->`);
						} else _push(`<!---->`);
						_push(`<section class="pg__versions" aria-labelledby="pg-versions" data-v-3a404ded${_scopeId}><h2 id="pg-versions" class="pg__heading" data-v-3a404ded${_scopeId}>Versionen</h2>`);
						if (__props.revisions.length === 0) _push(`<p class="adm-note" data-v-3a404ded${_scopeId}> Noch keine Version. Beim ersten Veröffentlichen wird auch die bisherige Fassung aus dem Shop gesichert. </p>`);
						else {
							_push(`<ul class="pg__revisions" data-v-3a404ded${_scopeId}><!--[-->`);
							(0, server_renderer_exports.ssrRenderList)(__props.revisions, (revision, index) => {
								_push(`<li class="pg__revision" data-v-3a404ded${_scopeId}><div class="pg__revision-text" data-v-3a404ded${_scopeId}><span class="pg__revision-at" data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(revision.at)}</span><span class="pg__revision-by" data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(revision.by ?? "Ausgangsstand")}</span>`);
								if (revision.note) _push(`<span class="pg__revision-note" data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(revision.note)}</span>`);
								else _push(`<!---->`);
								_push(`</div>`);
								if (isLive(revision, index)) _push(`<span class="pg__revision-live" data-v-3a404ded${_scopeId}>Steht im Shop</span>`);
								else if (__props.can.edit) _push(`<button class="btn btn--secondary btn--sm" type="button" data-v-3a404ded${_scopeId}>Als Entwurf laden</button>`);
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
								if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-3a404ded${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(publishing.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", publishing.value ? "true" : void 0)} data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(publishing.value ? "Wird veröffentlicht …" : "Veröffentlichen")}</button>`);
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
									_push(`<div class="adm-fields" data-v-3a404ded${_scopeId}>`);
									if (pending.value.length) {
										_push(`<!--[--><p class="adm-note" data-v-3a404ded${_scopeId}>Das ändert sich im Shop:</p>`);
										_push((0, server_renderer_exports.ssrRenderComponent)(DiffList_default, { changes: pending.value }, null, _parent, _scopeId));
										_push(`<!--]-->`);
									} else _push(`<p class="adm-note" data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(__props.page.published ? "Der Text ist derselbe wie im Shop." : "Der Artikel geht mit diesem Text in den Shop.")}</p>`);
									_push(`<div class="form-field" data-v-3a404ded${_scopeId}><label class="form-field__label" for="pg-note" data-v-3a404ded${_scopeId}>Notiz zur Version (optional)</label><input id="pg-note"${(0, server_renderer_exports.ssrRenderAttr)("value", note.value)} class="input" type="text" maxlength="200" autocomplete="off" data-v-3a404ded${_scopeId}><p class="form-field__help" data-v-3a404ded${_scopeId}>Steht in der Versionsliste, zum Beispiel „Neue Versandzeiten“.</p></div>`);
									if (isLegal.value) _push(`<label class="check" data-v-3a404ded${_scopeId}><input${(0, server_renderer_exports.ssrIncludeBooleanAttr)(Array.isArray(reviewed.value) ? (0, server_renderer_exports.ssrLooseContain)(reviewed.value, null) : reviewed.value) ? " checked" : ""} type="checkbox" data-v-3a404ded${_scopeId}> Dieser Text ist so vom Anwalt geprüft. </label>`);
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
								if (_push) _push(`<button class="btn btn--secondary" type="button" data-v-3a404ded${_scopeId}>Abbrechen</button><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-3a404ded${_scopeId}>Als Entwurf laden</button>`);
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
									_push(`<div class="adm-fields" data-v-3a404ded${_scopeId}><p class="adm-confirm__body" data-v-3a404ded${_scopeId}>${(0, server_renderer_exports.ssrInterpolate)(restoreBody.value)}</p>`);
									if (comparisonFailed.value) _push(`<p class="adm-note" data-v-3a404ded${_scopeId}>Der Vergleich mit dem Shop konnte nicht geladen werden. Du kannst die Version trotzdem laden und vor dem Veröffentlichen prüfen.</p>`);
									else if (comparison.value === null) _push(`<p class="adm-note" role="status" data-v-3a404ded${_scopeId}>Vergleich mit dem Shop wird geladen …</p>`);
									else if (comparison.value.length === 0) _push(`<p class="adm-note" data-v-3a404ded${_scopeId}>Diese Version hat denselben Text, der gerade im Shop steht.</p>`);
									else {
										_push(`<!--[--><p class="adm-note" data-v-3a404ded${_scopeId}>Gegenüber dem Shop ändert sich damit:</p>`);
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
							open: switchOpen.value,
							"onUpdate:open": ($event) => switchOpen.value = $event,
							title: switchCopy.value.title,
							body: switchCopy.value.body,
							"confirm-label": switchCopy.value.confirm,
							busy: switchBusy.value,
							onConfirm: switchPlaceholder
						}, null, _parent, _scopeId));
						_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
							open: withdrawing.value,
							"onUpdate:open": ($event) => withdrawing.value = $event,
							title: `${__props.page.title} zurückziehen?`,
							body: "Der Artikel verschwindet aus dem Shop und aus dem Blog. Seine Texte bleiben hier, und du kannst ihn jederzeit wieder veröffentlichen.",
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
							isLegal.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
								key: 1,
								class: "pg__switches",
								"aria-labelledby": "pg-switches"
							}, [
								(0, vue_exports.createVNode)("h2", {
									id: "pg-switches",
									class: "pg__heading"
								}, "Platzhalter"),
								(0, vue_exports.createVNode)("div", { class: "pg__switch" }, [(0, vue_exports.createVNode)("p", { class: "pg__switch-state" }, [(0, vue_exports.createVNode)("span", { class: ["adm-tag", __props.page.placeholder ? "adm-tag--warn" : "adm-tag--neutral"] }, (0, vue_exports.toDisplayString)(__props.page.placeholder ? "An" : "Aus"), 3), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(__props.page.placeholder ? "Besucher sehen statt des Textes nur den Hinweis, dass der Text der Kanzlei folgt." : "Besucher lesen den veröffentlichten Text."), 1)]), __props.can.publish ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 0,
									id: "pg-switch-text",
									class: "btn btn--secondary btn--sm",
									type: "button",
									"aria-disabled": textSwitchWaits.value ? "true" : void 0,
									"aria-describedby": textSwitchWaits.value ? "pg-switch-waits" : void 0,
									onClick: ($event) => askSwitch("text", !__props.page.placeholder)
								}, (0, vue_exports.toDisplayString)(__props.page.placeholder ? "Platzhalter ausschalten" : "Platzhalter einschalten"), 9, [
									"aria-disabled",
									"aria-describedby",
									"onClick"
								])) : (0, vue_exports.createCommentVNode)("", true)]),
								textSwitchWaits.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 0,
									id: "pg-switch-waits",
									class: "adm-note"
								}, " Im veröffentlichten Text steht noch „[Rechtstext folgt von der Kanzlei …]“. Ersetz das in jedem Abschnitt durch den Text der Kanzlei, veröffentliche die Seite und schalte den Platzhalter danach aus. ")) : (0, vue_exports.createCommentVNode)("", true),
								__props.page.formPlaceholder !== null ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 1,
									class: "pg__switch"
								}, [(0, vue_exports.createVNode)("p", { class: "pg__switch-state" }, [(0, vue_exports.createVNode)("span", { class: ["adm-tag", __props.page.formPlaceholder ? "adm-tag--warn" : "adm-tag--neutral"] }, (0, vue_exports.toDisplayString)(__props.page.formPlaceholder ? "An" : "Aus"), 3), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(__props.page.formPlaceholder ? "Muster-Widerrufsformular: Besucher sehen nur den Hinweis, dass der Text der Kanzlei folgt." : "Muster-Widerrufsformular: Besucher sehen das Formular im Wortlaut des Gesetzes."), 1)]), __props.can.publish ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
									key: 0,
									id: "pg-switch-form",
									class: "btn btn--secondary btn--sm",
									type: "button",
									onClick: ($event) => askSwitch("formular", !__props.page.formPlaceholder)
								}, (0, vue_exports.toDisplayString)(__props.page.formPlaceholder ? "Platzhalter beim Formular ausschalten" : "Platzhalter beim Formular einschalten"), 9, ["onClick"])) : (0, vue_exports.createCommentVNode)("", true)])) : (0, vue_exports.createCommentVNode)("", true),
								switchError.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 2,
									class: "adm-alert",
									role: "alert"
								}, (0, vue_exports.toDisplayString)(switchError.value), 1)) : (0, vue_exports.createCommentVNode)("", true)
							])) : (0, vue_exports.createCommentVNode)("", true),
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
														onClick: ($event) => moveItem(index, schemaOf(index), j, -1, $event)
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
														onClick: ($event) => moveItem(index, schemaOf(index), j, 1, $event)
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
														onClick: ($event) => removeItem(index, schemaOf(index), j, $event)
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
							sectionTypes.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 7 }, [
								err("blocks") ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 0,
									class: "form-field__error"
								}, (0, vue_exports.toDisplayString)(err("blocks")), 1)) : (0, vue_exports.createCommentVNode)("", true),
								((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(sectionIndexes.value, (index, position) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("section", {
										id: `pg-section-${index}`,
										key: `section-${keyOf(index)}`,
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
											onClick: ($event) => moveSection(index, -1, $event)
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
											onClick: ($event) => moveSection(index, 1, $event)
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
											disabled: !mayRemove(index),
											"aria-label": `${(0, vue_exports.unref)(blockLabel)(__props.schema, (0, vue_exports.unref)(form).blocks, index)} entfernen`,
											onClick: ($event) => removeSection(index, $event)
										}, [(0, vue_exports.createVNode)(AdminIcon_default, {
											name: "delete",
											size: 20
										})], 8, [
											"disabled",
											"aria-label",
											"onClick"
										])
									])) : (0, vue_exports.createCommentVNode)("", true)]), ((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(schemaOf(index)?.fields ?? [], (field) => {
										return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: field.key }, [field.kind === "image" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(ImageField_default, {
											key: 0,
											id: (0, vue_exports.unref)(fieldId)(`blocks.${index}.data.${field.key}`),
											label: field.label,
											help: field.help,
											"page-id": __props.page.id,
											src: textOf(index, field.key),
											alt: textOf(index, "alt"),
											error: err(`blocks.${index}.data.${field.key}`),
											readonly: readonly.value,
											onUploaded: ($event) => setImage(index, field.key, $event)
										}, null, 8, [
											"id",
											"label",
											"help",
											"page-id",
											"src",
											"alt",
											"error",
											"readonly",
											"onUploaded"
										])) : field.kind === "grid" ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(GridField_default, {
											key: 1,
											id: (0, vue_exports.unref)(fieldId)(`blocks.${index}.data.${field.key}`),
											"rows-id": (0, vue_exports.unref)(fieldId)(`blocks.${index}.data.rows`),
											label: field.label,
											help: field.help,
											head: cellsOf(index, field.key),
											rows: rowsOf(index),
											max: field.max ?? 200,
											"head-error": err(`blocks.${index}.data.${field.key}`),
											"rows-error": err(`blocks.${index}.data.rows`),
											readonly: readonly.value,
											onChange: ($event) => setTable(index, field.key, $event)
										}, null, 8, [
											"id",
											"rows-id",
											"label",
											"help",
											"head",
											"rows",
											"max",
											"head-error",
											"rows-error",
											"readonly",
											"onChange"
										])) : ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(FieldInput_default, {
											key: 2,
											id: (0, vue_exports.unref)(fieldId)(`blocks.${index}.data.${field.key}`),
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
										]))], 64);
									}), 128))], 8, ["id", "aria-labelledby"]);
								}), 128)),
								!readonly.value ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("div", {
									key: 1,
									class: "pg__adds"
								}, [((0, vue_exports.openBlock)(true), (0, vue_exports.createBlock)(vue_exports.Fragment, null, (0, vue_exports.renderList)(sectionTypes.value, (definition) => {
									return (0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("button", {
										id: addId(definition),
										key: definition.type,
										class: "btn btn--secondary",
										type: "button",
										disabled: !mayAdd(definition),
										onClick: ($event) => addSection(definition)
									}, [(0, vue_exports.createVNode)(AdminIcon_default, {
										name: "plus",
										size: 20
									}), (0, vue_exports.createTextVNode)(" " + (0, vue_exports.toDisplayString)(definition.label) + " hinzufügen ", 1)], 8, [
										"id",
										"disabled",
										"onClick"
									]);
								}), 128))])) : (0, vue_exports.createCommentVNode)("", true),
								!readonly.value && limitsReached.value.length ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)("p", {
									key: 2,
									class: "form-field__help"
								}, (0, vue_exports.toDisplayString)(limitsReached.value.join(" ")), 1)) : (0, vue_exports.createCommentVNode)("", true)
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
							open: switchOpen.value,
							"onUpdate:open": ($event) => switchOpen.value = $event,
							title: switchCopy.value.title,
							body: switchCopy.value.body,
							"confirm-label": switchCopy.value.confirm,
							busy: switchBusy.value,
							onConfirm: switchPlaceholder
						}, null, 8, [
							"open",
							"onUpdate:open",
							"title",
							"body",
							"confirm-label",
							"busy"
						]),
						(0, vue_exports.createVNode)(AdminConfirm_default, {
							open: withdrawing.value,
							"onUpdate:open": ($event) => withdrawing.value = $event,
							title: `${__props.page.title} zurückziehen?`,
							body: "Der Artikel verschwindet aus dem Shop und aus dem Blog. Seine Texte bleiben hier, und du kannst ihn jederzeit wieder veröffentlichen.",
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
						_push(`<button class="${(0, server_renderer_exports.ssrRenderClass)([publishIsNext.value ? "btn--primary" : "btn--secondary", "btn"])}" type="button"${(0, server_renderer_exports.ssrRenderAttr)("aria-disabled", nothingToPublish.value ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", nothingToPublish.value ? "pg-nothing" : void 0)} data-v-3a404ded${_scopeId}> Veröffentlichen </button>`);
						if (nothingToPublish.value) _push(`<span id="pg-nothing" class="visually-hidden" data-v-3a404ded${_scopeId}>Der Shop zeigt schon genau diesen Stand.</span>`);
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
var Bearbeiten_default = /*#__PURE__*/ _plugin_vue_export_helper_default(Bearbeiten_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-3a404ded"]]);
//#endregion
export { Bearbeiten_default as default };
