import { r as __exportAll } from "./rolldown-runtime-Dr7-SnC6.js";
import { a as DropdownMenuRoot_default, i as DropdownMenuContent_default, n as DropdownMenuPortal_default, r as DropdownMenuItem_default, t as DropdownMenuTrigger_default } from "./DropdownMenuTrigger-DR2ieCu7.js";
import { t as DropdownMenuSeparator_default } from "./DropdownMenuSeparator-KcmMgHOf.js";
import { c as router, s as usePage, u as vue_exports } from "../ssr.js";
import { t as server_renderer_exports } from "./server-renderer-CE7M1dwI.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as AdminIcon_default } from "./AdminIcon-v0XGcwQg.js";
import { t as AdminConfirm_default } from "./AdminConfirm-CJZtnwyX.js";
import { t as FilePick_default } from "./FilePick-Omvaxw5M.js";
import { t as Picture_default } from "./Picture-Fl6hr1l0.js";
import { t as MENU_ROOM } from "./menu-CcR9FXu6.js";
import { n as useFocusAfter, t as resolveTarget } from "./useFocusAfter-B30tsjKa.js";
import { t as FILE_CHANGED } from "./file-65D2TnCP.js";
//#region resources/js/Pages/Admin/Felgen/FinishPhotos.vue?vue&type=script&setup=true&lang.ts
var FinishPhotos_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ (0, vue_exports.defineComponent)({
	__name: "FinishPhotos",
	__ssrInlineRender: true,
	props: {
		modelId: {},
		finishId: {},
		finishName: {},
		image: {},
		photos: {},
		max: {},
		editable: { type: Boolean },
		title: {}
	},
	setup(__props) {
		/**
		* One colour's photographs (COMPLIANCE row 23): as many as the colour needs, up to the server's limit,
		* in the order the shop shows them — the first is the cover on every tile and the product page's first
		* view. Every change is its own request beside the form's save, so a photograph is never lost to an
		* unsaved form or held back by one.
		*
		* The order moves with *nach oben* / *nach unten* (beside the photo from 768 px, always in its menu) and,
		* with a pointer, by dragging. Every photo keeps its own sentence for a screen reader; the server refuses
		* one without it (WheelImageRequest, WheelPhotoAltRequest). A generated drawing (the demo set) says it is one.
		*
		* The keyboard never falls to `<body>`: every action names where the focus goes next and useFocusAfter puts
		* it there once the round trip is over and the control is enabled again (K2-04, K2-22).
		*/
		const props = __props;
		const page = usePage();
		const focus = useFocusAfter();
		const base = (0, vue_exports.computed)(() => `/admin/felgen/${props.modelId}/ausfuehrungen/${props.finishId}`);
		const idBase = (0, vue_exports.computed)(() => `fe-photo-${props.finishId}`);
		const busy = (0, vue_exports.ref)(false);
		const fresh = (0, vue_exports.ref)(null);
		const announce = (0, vue_exports.ref)("");
		/** Whose errors this colour shows: only those of a request it sent itself, and only until it starts anew. */
		const mine = (0, vue_exports.ref)(null);
		const errors = (0, vue_exports.computed)(() => {
			const bag = page.props.errors ?? {};
			return {
				image: mine.value === "upload" ? bag.image ?? "" : "",
				alt: mine.value === "upload" || mine.value === "alt" ? bag.alt ?? "" : "",
				order: mine.value === "order" ? bag.ids ?? "" : ""
			};
		});
		const full = (0, vue_exports.computed)(() => props.photos.length >= props.max);
		const drawing = (0, vue_exports.computed)(() => props.photos.length === 0 && props.image?.placeholder === true);
		const startId = (0, vue_exports.computed)(() => `${idBase.value}-start`);
		const moreId = (id) => `${idBase.value}-more-${id}`;
		/** The last photo's „⋯“ — where the keyboard goes when „Foto hinzufügen“ is closed off by the limit. */
		const lastMore = () => {
			const last = props.photos.at(-1);
			return last === void 0 ? null : resolveTarget(moreId(last.id));
		};
		const adding = (0, vue_exports.ref)(false);
		const file = (0, vue_exports.ref)(null);
		const alt = (0, vue_exports.ref)("");
		/** A file dropped on the field that is not a photo: said by name, gone once a photo is chosen. */
		const refusedFile = (0, vue_exports.ref)(null);
		/** „Hochladen“ (or Enter) before a photo was chosen. */
		const missingFile = (0, vue_exports.ref)(false);
		/** The chosen photo was saved anew on disk since it was chosen: asked for again (K2-29). */
		const changedFile = (0, vue_exports.ref)(false);
		const refusedLine = (0, vue_exports.computed)(() => {
			if (refusedFile.value !== null) return `„${refusedFile.value}“ nimmt dieses Feld nicht – nur JPEG, PNG, WebP oder AVIF.`;
			if (changedFile.value) return FILE_CHANGED;
			return missingFile.value ? "Bitte wähl ein Foto aus." : "";
		});
		(0, vue_exports.watch)(file, (chosen) => {
			if (chosen !== null) {
				refusedFile.value = null;
				missingFile.value = false;
				changedFile.value = false;
			}
		});
		const spoken = (0, vue_exports.computed)(() => errors.value.image || refusedLine.value || errors.value.alt || errors.value.order);
		/** Photos whose file did not load: said plainly instead of the browser's alt text spilling into the frame. */
		const broken = (0, vue_exports.ref)(/* @__PURE__ */ new Set());
		function place(index) {
			return index === 0 ? "an erster Stelle und ist das Titelbild" : `an Stelle ${index + 1}`;
		}
		/**
		* @param ids the whole new order
		* @param keep where the keyboard stays: the photo's arrow (with the other arrow as the way out at the first
		*             or last place), or its „⋯“ when the move came from the menu (K2-22), or nothing for a drag
		*/
		function order(ids, moved, keep) {
			if (busy.value) return;
			busy.value = true;
			mine.value = "order";
			router.put(`${base.value}/fotos/reihenfolge`, { ids }, {
				preserveScroll: true,
				preserveState: true,
				onSuccess: () => {
					mine.value = null;
					fresh.value = moved;
					announce.value = `Das Foto steht jetzt ${place(ids.indexOf(moved))}.`;
				},
				onFinish: () => {
					busy.value = false;
					if (keep.length > 0) focus.request([...keep, moreId(moved)]);
				}
			});
		}
		function move(photo, by, from = "arrows") {
			const ids = props.photos.map((p) => p.id);
			const at = ids.indexOf(photo.id);
			const to = at + by;
			if (at < 0 || to < 0 || to >= ids.length) return;
			ids.splice(at, 1);
			ids.splice(to, 0, photo.id);
			const same = `${idBase.value}-${photo.id}-${by < 0 ? "up" : "down"}`;
			const other = `${idBase.value}-${photo.id}-${by < 0 ? "down" : "up"}`;
			order(ids, photo.id, from === "menu" ? [moreId(photo.id)] : [same, other]);
		}
		const dragging = (0, vue_exports.ref)(null);
		const over = (0, vue_exports.ref)(null);
		const editing = (0, vue_exports.ref)(null);
		const draft = (0, vue_exports.ref)("");
		function startEdit(photo) {
			editing.value = photo.id;
			draft.value = photo.alt;
			mine.value = null;
			focus.request(`${idBase.value}-alt-${photo.id}`);
		}
		const removing = (0, vue_exports.ref)(null);
		const confirmOpen = (0, vue_exports.ref)(false);
		const removeBody = (0, vue_exports.computed)(() => {
			const photo = removing.value;
			if (photo === null) return "";
			if (props.photos.length === 1) return "Es ist das einzige Foto dieser Farbe. Der Shop zeigt danach wieder die Umrisszeichnung.";
			return props.photos[0]?.id === photo.id ? "Es ist das Titelbild. Das nächste Foto rückt an seine Stelle." : "Die übrigen Fotos rücken nach.";
		});
		function askRemove(photo) {
			removing.value = photo;
			confirmOpen.value = true;
		}
		function remove() {
			const photo = removing.value;
			if (photo === null || busy.value) return;
			busy.value = true;
			router.delete(`${base.value}/fotos/${photo.id}`, {
				preserveScroll: true,
				onSuccess: () => {
					confirmOpen.value = false;
					removing.value = null;
					focus.request([startId.value, lastMore]);
				},
				onFinish: () => {
					busy.value = false;
				}
			});
		}
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${(0, server_renderer_exports.ssrRenderAttrs)((0, vue_exports.mergeProps)({ class: "fe-photos" }, _attrs))} data-v-cb73dc93>`);
			if (drawing.value) _push(`<p class="fe-photos__state" data-v-cb73dc93>Platzhalterbild der Demodaten – kein Produktfoto.</p>`);
			else if (__props.photos.length === 0) _push(`<p class="fe-photos__state" data-v-cb73dc93>Kein Foto. Der Shop zeigt die Umrisszeichnung, bis eines hochgeladen ist.</p>`);
			else if (__props.editable && __props.photos.length > 1) _push(`<p class="fe-photos__state" data-v-cb73dc93> Das erste Foto ist das Titelbild im Shop. <span class="fe-photos__how fe-photos__how--wide" data-v-cb73dc93>Zieh ein Foto an eine andere Stelle oder nutze die Pfeile.</span><span class="fe-photos__how fe-photos__how--narrow" data-v-cb73dc93>Die Reihenfolge änderst du im Menü eines Fotos.</span></p>`);
			else _push(`<!---->`);
			if (__props.photos.length) {
				_push(`<ol class="fe-photos__list"${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Fotos in ${__props.finishName}`)} data-v-cb73dc93><!--[-->`);
				(0, server_renderer_exports.ssrRenderList)(__props.photos, (photo, index) => {
					_push(`<li class="${(0, server_renderer_exports.ssrRenderClass)([{
						"adm-row--fresh": fresh.value === photo.id,
						"fe-photos__item--dragging": dragging.value === photo.id,
						"fe-photos__item--over": over.value?.id === photo.id && dragging.value !== photo.id && !over.value.after,
						"fe-photos__item--over-after": over.value?.id === photo.id && dragging.value !== photo.id && over.value.after
					}, "fe-photos__item"])}"${(0, server_renderer_exports.ssrRenderAttr)("draggable", __props.editable && !busy.value && editing.value === null && __props.photos.length > 1 ? "true" : void 0)} data-v-cb73dc93><div class="fe-photos__frame" data-v-cb73dc93>`);
					if (broken.value.has(photo.id)) _push(`<span class="fe-photos__missing" data-v-cb73dc93>Datei fehlt</span>`);
					else _push((0, server_renderer_exports.ssrRenderComponent)(Picture_default, {
						image: photo.manifest,
						alt: photo.alt,
						sizes: "64px",
						onFailed: ($event) => broken.value = /* @__PURE__ */ new Set([...broken.value, photo.id])
					}, null, _parent));
					_push(`</div><div class="fe-photos__text" data-v-cb73dc93><p class="fe-photos__place" data-v-cb73dc93> Foto ${(0, server_renderer_exports.ssrInterpolate)(index + 1)}`);
					if (index === 0) _push(`<span class="fe-photos__cover" data-v-cb73dc93> · Titelbild</span>`);
					else _push(`<!---->`);
					_push(`</p>`);
					if (editing.value !== photo.id) _push(`<p class="fe-photos__alt" data-v-cb73dc93>${(0, server_renderer_exports.ssrInterpolate)(photo.alt)}</p>`);
					else _push(`<div class="fe-photos__form" data-v-cb73dc93><div class="form-field" data-v-cb73dc93><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${idBase.value}-alt-${photo.id}`)} data-v-cb73dc93>Was zeigt das Foto?</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${idBase.value}-alt-${photo.id}`)}${(0, server_renderer_exports.ssrRenderAttr)("value", draft.value)} class="input" type="text" maxlength="200"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.alt ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${idBase.value}-alt-${photo.id}-help ${idBase.value}-alt-${photo.id}-err`)} data-v-cb73dc93><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${idBase.value}-alt-${photo.id}-help`)} class="form-field__help" data-v-cb73dc93>Diesen Satz hört, wer das Foto nicht sehen kann.</p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${idBase.value}-alt-${photo.id}-err`)} class="form-field__error" data-v-cb73dc93>${(0, server_renderer_exports.ssrInterpolate)(errors.value.alt)}</p></div><div class="fe-photos__actions" data-v-cb73dc93><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-cb73dc93>Speichern</button><button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-cb73dc93>Abbrechen</button></div></div>`);
					_push(`</div>`);
					if (__props.editable && editing.value !== photo.id) {
						_push(`<div class="fe-photos__tools" data-v-cb73dc93>`);
						if (__props.photos.length > 1) {
							_push(`<div class="adm-row-arrows" data-v-cb73dc93><button${(0, server_renderer_exports.ssrRenderAttr)("id", `${idBase.value}-${photo.id}-up`)} class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(index === 0 || busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Foto ${index + 1} nach oben`)} data-v-cb73dc93>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "chevron-up",
								size: 20
							}, null, _parent));
							_push(`</button><button${(0, server_renderer_exports.ssrRenderAttr)("id", `${idBase.value}-${photo.id}-down`)} class="adm-iconbtn" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(index === __props.photos.length - 1 || busy.value) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-label", `Foto ${index + 1} nach unten`)} data-v-cb73dc93>`);
							_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
								name: "chevron-down",
								size: 20
							}, null, _parent));
							_push(`</button></div>`);
						} else _push(`<!---->`);
						_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuRoot_default), null, {
							default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
								if (_push) {
									_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
										"data-focus": moreId(photo.id),
										class: "adm-iconbtn",
										disabled: busy.value,
										"aria-label": `Aktionen für Foto ${index + 1}`
									}, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) _push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
												name: "more",
												size: 20
											}, null, _parent, _scopeId));
											else return [(0, vue_exports.createVNode)(AdminIcon_default, {
												name: "more",
												size: 20
											})];
										}),
										_: 2
									}, _parent, _scopeId));
									_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
										default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
											if (_push) _push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuContent_default), {
												class: "adm-menu",
												align: "end",
												"side-offset": 4,
												"collision-padding": (0, vue_exports.unref)(MENU_ROOM),
												onCloseAutoFocus: (0, vue_exports.unref)(focus).onMenuClose
											}, {
												default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
													if (_push) {
														_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
															class: "adm-menu__item",
															onSelect: ($event) => startEdit(photo)
														}, {
															default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																if (_push) {
																	_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																		name: "edit",
																		size: 20
																	}, null, _parent, _scopeId));
																	_push(` Beschreibung ändern `);
																} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "edit",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Beschreibung ändern ")];
															}),
															_: 2
														}, _parent, _scopeId));
														if (__props.photos.length > 1) {
															_push(`<!--[-->`);
															_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																class: "adm-menu__item",
																disabled: index === 0,
																onSelect: ($event) => move(photo, -1, "menu")
															}, {
																default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																	if (_push) {
																		_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																			name: "chevron-up",
																			size: 20
																		}, null, _parent, _scopeId));
																		_push(` Nach oben `);
																	} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "chevron-up",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Nach oben ")];
																}),
																_: 2
															}, _parent, _scopeId));
															_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
																class: "adm-menu__item",
																disabled: index === __props.photos.length - 1,
																onSelect: ($event) => move(photo, 1, "menu")
															}, {
																default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																	if (_push) {
																		_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																			name: "chevron-down",
																			size: 20
																		}, null, _parent, _scopeId));
																		_push(` Nach unten `);
																	} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																		name: "chevron-down",
																		size: 20
																	}), (0, vue_exports.createTextVNode)(" Nach unten ")];
																}),
																_: 2
															}, _parent, _scopeId));
															_push(`<!--]-->`);
														} else _push(`<!---->`);
														_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }, null, _parent, _scopeId));
														_push((0, server_renderer_exports.ssrRenderComponent)((0, vue_exports.unref)(DropdownMenuItem_default), {
															class: "adm-menu__item adm-menu__item--danger",
															onSelect: ($event) => askRemove(photo)
														}, {
															default: (0, vue_exports.withCtx)((_, _push, _parent, _scopeId) => {
																if (_push) {
																	_push((0, server_renderer_exports.ssrRenderComponent)(AdminIcon_default, {
																		name: "delete",
																		size: 20
																	}, null, _parent, _scopeId));
																	_push(` Entfernen `);
																} else return [(0, vue_exports.createVNode)(AdminIcon_default, {
																	name: "delete",
																	size: 20
																}), (0, vue_exports.createTextVNode)(" Entfernen ")];
															}),
															_: 2
														}, _parent, _scopeId));
													} else return [
														(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
															class: "adm-menu__item",
															onSelect: ($event) => startEdit(photo)
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "edit",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Beschreibung ändern ")]),
															_: 1
														}, 8, ["onSelect"]),
														__props.photos.length > 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
															class: "adm-menu__item",
															disabled: index === 0,
															onSelect: ($event) => move(photo, -1, "menu")
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "chevron-up",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Nach oben ")]),
															_: 1
														}, 8, ["disabled", "onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
															class: "adm-menu__item",
															disabled: index === __props.photos.length - 1,
															onSelect: ($event) => move(photo, 1, "menu")
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "chevron-down",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Nach unten ")]),
															_: 1
														}, 8, ["disabled", "onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true),
														(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
														(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
															class: "adm-menu__item adm-menu__item--danger",
															onSelect: ($event) => askRemove(photo)
														}, {
															default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
																name: "delete",
																size: 20
															}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
															_: 1
														}, 8, ["onSelect"])
													];
												}),
												_: 2
											}, _parent, _scopeId));
											else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
												class: "adm-menu",
												align: "end",
												"side-offset": 4,
												"collision-padding": (0, vue_exports.unref)(MENU_ROOM),
												onCloseAutoFocus: (0, vue_exports.unref)(focus).onMenuClose
											}, {
												default: (0, vue_exports.withCtx)(() => [
													(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														onSelect: ($event) => startEdit(photo)
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "edit",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Beschreibung ändern ")]),
														_: 1
													}, 8, ["onSelect"]),
													__props.photos.length > 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														disabled: index === 0,
														onSelect: ($event) => move(photo, -1, "menu")
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "chevron-up",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Nach oben ")]),
														_: 1
													}, 8, ["disabled", "onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item",
														disabled: index === __props.photos.length - 1,
														onSelect: ($event) => move(photo, 1, "menu")
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "chevron-down",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Nach unten ")]),
														_: 1
													}, 8, ["disabled", "onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true),
													(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
													(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
														class: "adm-menu__item adm-menu__item--danger",
														onSelect: ($event) => askRemove(photo)
													}, {
														default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
															name: "delete",
															size: 20
														}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
														_: 1
													}, 8, ["onSelect"])
												]),
												_: 2
											}, 1032, ["collision-padding", "onCloseAutoFocus"])];
										}),
										_: 2
									}, _parent, _scopeId));
								} else return [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuTrigger_default), {
									"data-focus": moreId(photo.id),
									class: "adm-iconbtn",
									disabled: busy.value,
									"aria-label": `Aktionen für Foto ${index + 1}`
								}, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
										name: "more",
										size: 20
									})]),
									_: 1
								}, 8, [
									"data-focus",
									"disabled",
									"aria-label"
								]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuPortal_default), null, {
									default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuContent_default), {
										class: "adm-menu",
										align: "end",
										"side-offset": 4,
										"collision-padding": (0, vue_exports.unref)(MENU_ROOM),
										onCloseAutoFocus: (0, vue_exports.unref)(focus).onMenuClose
									}, {
										default: (0, vue_exports.withCtx)(() => [
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "adm-menu__item",
												onSelect: ($event) => startEdit(photo)
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "edit",
													size: 20
												}), (0, vue_exports.createTextVNode)(" Beschreibung ändern ")]),
												_: 1
											}, 8, ["onSelect"]),
											__props.photos.length > 1 ? ((0, vue_exports.openBlock)(), (0, vue_exports.createBlock)(vue_exports.Fragment, { key: 0 }, [(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "adm-menu__item",
												disabled: index === 0,
												onSelect: ($event) => move(photo, -1, "menu")
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "chevron-up",
													size: 20
												}), (0, vue_exports.createTextVNode)(" Nach oben ")]),
												_: 1
											}, 8, ["disabled", "onSelect"]), (0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "adm-menu__item",
												disabled: index === __props.photos.length - 1,
												onSelect: ($event) => move(photo, 1, "menu")
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "chevron-down",
													size: 20
												}), (0, vue_exports.createTextVNode)(" Nach unten ")]),
												_: 1
											}, 8, ["disabled", "onSelect"])], 64)) : (0, vue_exports.createCommentVNode)("", true),
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuSeparator_default), { class: "adm-menu__sep" }),
											(0, vue_exports.createVNode)((0, vue_exports.unref)(DropdownMenuItem_default), {
												class: "adm-menu__item adm-menu__item--danger",
												onSelect: ($event) => askRemove(photo)
											}, {
												default: (0, vue_exports.withCtx)(() => [(0, vue_exports.createVNode)(AdminIcon_default, {
													name: "delete",
													size: 20
												}), (0, vue_exports.createTextVNode)(" Entfernen ")]),
												_: 1
											}, 8, ["onSelect"])
										]),
										_: 2
									}, 1032, ["collision-padding", "onCloseAutoFocus"])]),
									_: 2
								}, 1024)];
							}),
							_: 2
						}, _parent));
						_push(`</div>`);
					} else _push(`<!---->`);
					_push(`</li>`);
				});
				_push(`<!--]--></ol>`);
			} else _push(`<!---->`);
			if (errors.value.order) _push(`<p class="form-field__error" role="alert" data-v-cb73dc93>${(0, server_renderer_exports.ssrInterpolate)(errors.value.order)}</p>`);
			else _push(`<!---->`);
			if (__props.editable && !adding.value) {
				_push(`<div class="fe-photos__add" data-v-cb73dc93><button${(0, server_renderer_exports.ssrRenderAttr)("id", startId.value)} class="btn btn--secondary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value || full.value) ? " disabled" : ""} data-v-cb73dc93>Foto hinzufügen</button><p class="fe-photos__count" data-v-cb73dc93>${(0, server_renderer_exports.ssrInterpolate)(__props.photos.length)} von höchstens ${(0, server_renderer_exports.ssrInterpolate)(__props.max)} Fotos`);
				if (full.value) _push(`<!--[--> – entferne eines, um ein weiteres hinzuzufügen<!--]-->`);
				else _push(`<!---->`);
				_push(`</p></div>`);
			} else _push(`<!---->`);
			if (adding.value) {
				_push(`<div class="fe-photos__form" data-v-cb73dc93><div class="form-field" data-v-cb73dc93><span${(0, server_renderer_exports.ssrRenderAttr)("id", `${idBase.value}-file-label`)} class="form-field__label" data-v-cb73dc93>Foto (JPEG, PNG, WebP oder AVIF, höchstens 10 MB)</span>`);
				_push((0, server_renderer_exports.ssrRenderComponent)(FilePick_default, {
					id: `${idBase.value}-file`,
					modelValue: file.value,
					"onUpdate:modelValue": ($event) => file.value = $event,
					accept: "image/jpeg,image/png,image/webp,image/avif",
					onRefused: (name) => refusedFile.value = name,
					label: "Foto auswählen",
					invalid: !!errors.value.image,
					describedby: `${idBase.value}-file-label ${idBase.value}-file-err`
				}, null, _parent));
				_push(`<p${(0, server_renderer_exports.ssrRenderAttr)("id", `${idBase.value}-file-err`)} class="form-field__error" data-v-cb73dc93>${(0, server_renderer_exports.ssrInterpolate)(errors.value.image || refusedLine.value)}</p></div><div class="form-field" data-v-cb73dc93><label class="form-field__label"${(0, server_renderer_exports.ssrRenderAttr)("for", `${idBase.value}-alt`)} data-v-cb73dc93>Was zeigt das Foto?</label><input${(0, server_renderer_exports.ssrRenderAttr)("id", `${idBase.value}-alt`)}${(0, server_renderer_exports.ssrRenderAttr)("value", alt.value)} class="input" type="text" maxlength="200"${(0, server_renderer_exports.ssrRenderAttr)("aria-invalid", errors.value.alt ? "true" : void 0)}${(0, server_renderer_exports.ssrRenderAttr)("aria-describedby", `${idBase.value}-alt-help ${idBase.value}-alt-err`)} data-v-cb73dc93><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${idBase.value}-alt-help`)} class="form-field__help" data-v-cb73dc93> Diesen Satz hört, wer das Foto nicht sehen kann – zum Beispiel „${(0, server_renderer_exports.ssrInterpolate)(__props.title)} in ${(0, server_renderer_exports.ssrInterpolate)(__props.finishName)}, schräg von der Seite“. </p><p${(0, server_renderer_exports.ssrRenderAttr)("id", `${idBase.value}-alt-err`)} class="form-field__error" data-v-cb73dc93>${(0, server_renderer_exports.ssrInterpolate)(errors.value.alt)}</p></div><div class="fe-photos__actions" data-v-cb73dc93><button class="btn btn--primary" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value || file.value === null) ? " disabled" : ""}${(0, server_renderer_exports.ssrRenderAttr)("aria-busy", busy.value ? "true" : void 0)} data-v-cb73dc93>Hochladen</button><button class="btn btn--ghost" type="button"${(0, server_renderer_exports.ssrIncludeBooleanAttr)(busy.value) ? " disabled" : ""} data-v-cb73dc93>Abbrechen</button></div></div>`);
			} else _push(`<!---->`);
			_push(`<p class="visually-hidden" aria-live="polite" data-v-cb73dc93>${(0, server_renderer_exports.ssrInterpolate)(announce.value)}</p><p class="visually-hidden" aria-live="assertive" data-v-cb73dc93>${(0, server_renderer_exports.ssrInterpolate)(spoken.value)}</p>`);
			_push((0, server_renderer_exports.ssrRenderComponent)(AdminConfirm_default, {
				open: confirmOpen.value,
				"onUpdate:open": ($event) => confirmOpen.value = $event,
				title: `Foto aus „${__props.finishName}“ entfernen?`,
				body: removeBody.value,
				"confirm-label": "Entfernen",
				busy: busy.value,
				onConfirm: remove
			}, null, _parent));
			_push(`</div>`);
		};
	}
});
//#endregion
//#region resources/js/Pages/Admin/Felgen/FinishPhotos.vue
var FinishPhotos_exports = /* @__PURE__ */ __exportAll({ default: () => FinishPhotos_default });
var _sfc_setup = FinishPhotos_vue_vue_type_script_setup_true_lang_default.setup;
FinishPhotos_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = (0, vue_exports.useSSRContext)();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/Felgen/FinishPhotos.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var FinishPhotos_default = /*#__PURE__*/ _plugin_vue_export_helper_default(FinishPhotos_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-cb73dc93"]]);
//#endregion
export { FinishPhotos_exports as n, FinishPhotos_default as t };
