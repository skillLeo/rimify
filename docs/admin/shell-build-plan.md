# Admin shell — build plan (step 1)

Source: `BRIEF.md` §1, `BRIEF-2.md` §4–5, `docs/design/sections/admin-shell.md` (§0 overrides it).
Built sequentially, committed per step, no push, no deploy.

## Resolved (build it now, or it does not render)

| Item | Resolution |
|---|---|
| User menu *Profil*, *Passwort ändern* | **Built:** `/admin/profil`, one page, password section at `#passwort`. |
| User menu *Zwei-Faktor* | **Not rendered** — enrolment is the security step. |
| Notification bell | **Not rendered** — no team-notification data exists until notification rules land. |
| Help menu | *Tastenkürzel* (built) · *Hilfe per E-Mail* only when `rimify.admin.support_email` is set. |
| Palette record groups (Bestellungen, Kunden, Felgen …) | **Arrive with their pages.** No record type has an admin page to open yet, so step 1's palette searches the admin's pages and actions from the shared props, plus *Zuletzt geöffnet*. No endpoint until there is a record to link to. |
| Palette actions | Only what works now: *Navigation ein-/ausklappen*, *Tastenkürzel anzeigen*, *Abmelden*. |
| Mobile bottom bar | Übersicht · first two permitted groups **with a built page**, in rail order · Suche · Mehr. Bestellungen takes slot 2 automatically once it exists. |
| Dashboard | Renamed **Übersicht**. KPI row only (the brief: charts are step 7). A tile links only where its list exists. |
| `/admin/benachrichtigungen` | Renamed **Benachrichtigungswünsche** (the bell's word belongs to the team's own notifications). |
| Environment badge | `local` → *Lokal*, `staging` → *Staging*, production → nothing. |
| Rail collapse state | Server-side, `admin_users.preferences` (JSON, nullable) → first SSR frame, no snap. |
| Dark-mode toggle, `wordmark--light`, account block in the rail | Removed. The account moves to the user menu. |
| Motion | `BRIEF-2.md` §4 wins over spec §12: sheets 240 in / 180 out, dialogs 180 ms fade + scale from 0.98, toast 160 ms. Added as tokens. The save bar is always present (disabled until dirty), so its "appearing" row does not apply. |

## Shared props — `admin` (on `admin.*` routes only)

```ts
interface AdminShared {
  can: Record<PermissionModule, boolean>                     // View per module
  account: { name: string; email: string; role: string | null } | null
  nav: { key: string; label: string; icon: IconName;
         pages: { label: string; href: string; count: number | null; countTone: 'neutral' | 'bad' }[] }[]
  environment: 'local' | 'staging' | null
  preferences: { railCollapsed: boolean }
  breadcrumbs: { label: string; href: string | null }[]      // from the tree: group › page
  supportEmail: string | null
}
```

## Endpoints

| Method · path | Name | Controller | Request / guard | Answers |
|---|---|---|---|---|
| `PATCH /admin/ansicht` | `admin.ansicht` | `AdminPreferencesController@update` | `AdminPreferencesRequest` · `rail: open\|collapsed` · own row only | `back()` |
| `GET /admin/profil` | `admin.profil` | `AdminProfileController@show` | signed-in admin | Inertia `Admin/Profil/Index` |
| `PUT /admin/profil/passwort` | `admin.profil.passwort` | `AdminProfileController@updatePassword` | `AdminPasswordRequest` · current password · ≥ 12 · confirmed | `back()` + toast |

Migration: `admin_users.preferences` JSON nullable. (The breached-password check lands with the
security step — it calls an outside service and needs its own failure design.)

## Files

- **Tokens and icons:** `resources/css/tokens.css` (admin motion), `resources/js/icons/index.ts`
  (`text`, `import`, `bell`, `more`).
- **Backend:** migration · `AdminPreferencesController` · `AdminProfileController` ·
  `AdminPreferencesRequest` · `AdminPasswordRequest` · `AdminNavigation` · `HandleInertiaRequests` ·
  `config/rimify.php` · `routes/web.php` · `tests/Feature/Admin/AdminShellTest.php`.
- **Shell:** `resources/css/admin.css` · `Layouts/AdminLayout.vue` · `Components/Admin/`:
  `AdminRail`, `EnvironmentBadge`, `AdminTopbar`, `AdminUserMenu`, `AdminPalette`,
  `ShortcutsDialog` · `composables/admin/useAdminShortcuts.ts`.
- **Page pattern:** `Components/Admin/`: `AdminPage`, `AdminSaveBar`, `AdminConfirm`, `AdminState`,
  `AdminSkeletonRows` · `composables/admin/useDirtyForm.ts` (save bar + leave guard + ⌘S).
- **Phone:** `Components/Admin/`: `AdminAppBar`, `AdminBottomBar`, `AdminMoreSheet` (reusing
  `Mobile/BottomSheet`, `Mobile/ListRow`, `useVisualViewport`).
- **Pages:** `Admin/Profil/Index.vue` (new) · the six existing screens moved onto `AdminPage` ·
  `types/pages.ts` · Vitest beside each new component.

## Order

1 tokens + icons → 2 backend + tests → 3 frame (layout, rail, topbar, user menu, badge, shortcuts)
→ 4 palette → 5 page pattern and states → 6 phone shell → 7 existing screens, Übersicht, Profil →
8 build, SSR restart, browser check, full suites → review (`ai-look-critic`, `interaction-qa`,
15 lines each) → fixes. One commit per step.
