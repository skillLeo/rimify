# Admin step 2 — Rollen, Benutzer, Protokoll (build contract)

Source: `BRIEF.md` §2, `BRIEF-2.md` §2–3 and §9, `admin-shell.md` §8–9. The shell (step 1) is done:
build every page on `AdminPage`, `AdminState`, `AdminConfirm`, `useDirtyForm`/`AdminSaveBar` and the
`adm-*` classes in `resources/css/admin.css`. German only, informal *du*, sentence case.

## Shared, already in place before the builders start (do not edit these files)

| File | What it holds |
|---|---|
| `routes/web.php` | Every route below, pointing at the controller and method named here. |
| `app/Services/Admin/AdminNavigation.php` | `/admin/benutzer`, `/admin/rollen`, `/admin/protokoll` in `BUILT`; a per-page `module` (Protokoll → `audit_log`). |
| `app/Services/Admin/AuditTrail.php` | `AuditTrail::record(AdminUser $actor, string $event, array $properties, ?Model $subject = null): void` — the one way new code writes an audit entry (actor e-mail, IP, causer, subject). |
| `resources/css/admin.css` | Owned by the polish builder in this round. Builders put page-only styles in a scoped `<style>`; tokens only. |

## Ownership (one builder per row; nobody edits another row's files)

| Builder | Owns |
|---|---|
| **Rollen** | `RollenController` (extend), `app/Http/Requests/Admin/Role*Request.php`, `app/Enums/PermissionModule.php` (`actions()`), `app/Enums/PermissionAction.php`, `database/seeders/AccessSeeder.php` (labels only), one data migration for the German role labels, `Pages/Admin/Rollen/*`, `resources/js/types/admin/rollen.ts`, `tests/Feature/Admin/RollenVerwaltungTest.php`, `tests/Feature/Admin/RollenRechteTest.php`. May add `AdminNavigation::forRole(int $roleId): array` (a new public method only). |
| **Benutzer** | `BenutzerController`, `EinladungController`, `app/Http/Requests/Admin/{Invite,UserRole,AcceptInvitation}*Request.php`, `app/Models/AdminInvitation.php`, migrations `admin_invitations` + `admin_users.sessions_revoked_at`, `app/Mail/AdminInvitationMail.php` + its view, `app/Http/Middleware/EnsureAdminSessionValid.php` + its registration in `bootstrap/app.php`, a two-line change in `AdminLoginRequest` / `EinladungController` to stamp `session('admin_authenticated_at')`, `Pages/Admin/Benutzer/*`, `Pages/Admin/Einladung/*`, `resources/js/types/admin/benutzer.ts`, `tests/Feature/Admin/BenutzerTest.php`, `tests/Feature/Admin/EinladungTest.php`. |
| **Protokoll** | `ProtokollController`, `app/Services/Admin/AuditDescriber.php`, `Pages/Admin/Protokoll/*`, `resources/js/types/admin/protokoll.ts`, `tests/Feature/Admin/ProtokollTest.php`. |
| **Polish** | `resources/css/admin.css`, `Pages/Admin/{Gutachten,Benachrichtigungen,Wuchtgewichte,Rdks,Uebersicht,Profil}/*` and their tests, `Components/Admin/*` (not `AdminPage`'s API), `app/Support/GermanFormat.php` (no-break space before *Uhr* only). |

## Routes (all under `auth:admin`, prefix `/admin`, name prefix `admin.`)

```
GET    /rollen                              RollenController@index           rollen.index      roles.view
POST   /rollen                              RollenController@store           rollen.store      roles.create
PATCH  /rollen/{role}                       RollenController@update          rollen.update     roles.edit
POST   /rollen/{role}/duplizieren           RollenController@duplicate       rollen.duplicate  roles.create
DELETE /rollen/{role}                       RollenController@destroy         rollen.destroy    roles.delete
PATCH  /rollen/{role}/rechte                RollenController@updatePermission rollen.rechte    roles.edit   (exists)
PUT    /rollen/{role}/rechte                RollenController@replacePermissions rollen.rechte.ersetzen roles.edit
GET    /benutzer                            BenutzerController@index         benutzer.index    roles.view
POST   /benutzer/einladungen                BenutzerController@invite        benutzer.einladen roles.create
POST   /benutzer/einladungen/{invitation}/erneut  BenutzerController@resend  benutzer.einladung.erneut roles.create
DELETE /benutzer/einladungen/{invitation}   BenutzerController@revoke        benutzer.einladung.widerrufen roles.create
PATCH  /benutzer/{user}/rolle               BenutzerController@changeRole    benutzer.rolle    roles.edit
POST   /benutzer/{user}/sperren             BenutzerController@suspend       benutzer.sperren  roles.edit
POST   /benutzer/{user}/entsperren          BenutzerController@reactivate    benutzer.entsperren roles.edit
POST   /benutzer/{user}/abmelden            BenutzerController@revokeSessions benutzer.abmelden roles.edit
GET    /protokoll                           ProtokollController@index        protokoll.index   audit_log.view
GET    /protokoll/export                    ProtokollController@export       protokoll.export  audit_log.export
```

Outside `auth:admin`, under `guest:admin`: `GET /admin/einladung/{token}` → `EinladungController@show`
(`admin.einladung`), `POST /admin/einladung/{token}` → `EinladungController@accept`
(`admin.einladung.annehmen`, `throttle:6,1`).

Every mutation: a Form Request whose `authorize()` asks `AdminUser::may()`, a feature test for allowed
(200/302) and refused (403) for at least one role without the right, and an audit entry through
`AuditTrail`. Toasts are flashed as `back()->with('toast', '…')`.

## Audit events (names and property keys are the contract the Protokoll reads)

| Event | Properties |
|---|---|
| `role.created` | `role_id`, `label`, `copied_from_label` (nullable) |
| `role.updated` | `role_id`, `old` {label, description}, `new` {label, description} |
| `role.duplicated` | `role_id`, `label`, `copied_from_label` |
| `role.deleted` | `role_id`, `label` |
| `role_permission.updated` | `role_id`, `module`, `action`, `old` (bool|null), `allowed` (bool) — exists |
| `role_permissions.replaced` | `role_id`, `label`, `added` list<"module.action">, `removed` list<"module.action"> |
| `admin.invited` | `email`, `role_label` |
| `admin.invitation_resent` / `admin.invitation_revoked` | `email` |
| `admin.invitation_accepted` | `email`, `role_label` |
| `admin.role_changed` | `user_id`, `email`, `old_role_label`, `new_role_label` |
| `admin.suspended` / `admin.reactivated` / `admin.sessions_revoked` | `user_id`, `email` |
| existing | `admin.password_changed`, `permission.denied` {ability, route}, `weight_colour.{created,updated,deleted}`, `mounting_fee.updated`, `tpms_price.{created,updated,deleted}`, `tpms_default_price.updated` — read the controllers for their keys |

## Guards (each one a test)

- The Super-Admin role (`super-admin`) is always everything: its rights are not editable, it cannot be
  renamed or deleted. System roles cannot be deleted or renamed; their rights can be edited.
- A role that accounts still hold cannot be deleted: *Diese Rolle haben noch {n} Konten. Gib ihnen
  zuerst eine andere Rolle.*
- Nobody raises their own rights: a non-super-admin cannot allow a cell on a role they hold, and
  cannot give anybody (invitation or role change) a role with a right they do not have themselves.
- The last account that can edit roles cannot be demoted, suspended or have that right removed
  (reuse the existing lockout check and its sentence).
- Nobody suspends, re-roles or force-logs-out themselves.
- Accounts are never hard-deleted (R-04 in spirit); suspension also ends their sessions.
- Invitations: token 32 random bytes, stored as SHA-256 only, valid 7 days, single use; an address
  that already has an account or an open invitation is refused in German.
- `rollen` actions shown and accepted are only a module's real actions (`PermissionModule::actions()`);
  an unreal cell (e.g. Protokoll · Löschen) is refused by the request.

## Out of scope this round (said so in the UI nowhere; simply not built)

Two-factor enrolment and enforcement, sudo mode, the sessions list with devices, "Ansicht als"
impersonation, the four-eyes principle, audit-coverage by model events for older code.
