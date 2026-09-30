<?php

declare(strict_types=1);

use App\Enums\AdminUserStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Vehicle;
use App\Services\Admin\AdminNavigation;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Testing\AssertableInertia;

/**
 * The admin shell's server half: the tree the rail draws, the counts on it, where the reader is,
 * which copy of the shop this is, and the two things every person may change about themselves.
 *
 * The rule every test here serves is the brief's: no dead navigation and no 403 after a click. So
 * the tree is checked the way a person would find a dead link — by opening every entry it offers.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    RateLimiter::clear('super-admin@rimify.test|127.0.0.1');
});

function shellAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** @return list<string> */
function shellRoles(): array
{
    return ['super-admin', 'catalogue-manager', 'compliance-editor', 'order-manager', 'content-editor', 'support-agent', 'accountant'];
}

/**
 * @return list<array<string, mixed>>
 */
function sharedNav(AdminUser $admin): array
{
    $nav = [];

    test()->actingAs($admin, 'admin')->get('/admin')
        ->assertInertia(function (AssertableInertia $page) use (&$nav): void {
            $nav = $page->toArray()['props']['admin']['nav'];
        });

    return $nav;
}

describe('the tree', function (): void {
    it('opens every entry it offers, for every role — no dead link and no 403 after a click', function (string $role): void {
        $admin = shellAdmin($role);

        foreach (sharedNav($admin) as $group) {
            foreach ($group['pages'] as $page) {
                // An item with tabs beneath it (Zubehörpreise) leads to its first tab.
                $this->actingAs($admin, 'admin')->followingRedirects()->get($page['href'])->assertOk();
            }
        }
    })->with(fn (): array => shellRoles());

    it('leads the old addresses of moved pages to their new place', function (): void {
        $this->actingAs(shellAdmin(), 'admin')->get('/admin/wuchtgewichte')->assertRedirect('/admin/zubehoerpreise/wuchtgewichte')->assertStatus(301);
        $this->actingAs(shellAdmin(), 'admin')->get('/admin/rdks-preise')->assertRedirect('/admin/zubehoerpreise/rdks')->assertStatus(301);
        $this->actingAs(shellAdmin(), 'admin')->get('/admin/zubehoerpreise')->assertRedirect('/admin/zubehoerpreise/wuchtgewichte');
        // A bookmark keeps the rest of its path and its query.
        $this->actingAs(shellAdmin(), 'admin')->get('/admin/rdks-preise/7?seite=2')->assertRedirect('/admin/zubehoerpreise/rdks/7?seite=2');
    });

    it('keeps the accessory prices with the catalogue right, under Einstellungen', function (): void {
        // The catalogue manager may not open the settings, and still finds the prices they keep.
        $admin = shellAdmin('catalogue-manager');
        $einstellungen = collect(sharedNav($admin))->firstWhere('key', 'einstellungen');

        expect($admin->may(PermissionModule::Settings, PermissionAction::View))->toBeFalse()
            ->and(array_column($einstellungen['pages'] ?? [], 'label'))->toBe(['Zubehörpreise']);
    });

    it('never offers a page that has not been built', function (string $role): void {
        foreach (sharedNav(shellAdmin($role)) as $group) {
            foreach ($group['pages'] as $page) {
                expect($page['href'])->toBeIn(AdminNavigation::BUILT);
            }
        }
    })->with(fn (): array => shellRoles());

    it('gives the super-admin every built page, grouped the way the team works', function (): void {
        $nav = sharedNav(shellAdmin());

        expect(array_column($nav, 'label'))->toBe(['Übersicht', 'Verkauf', 'Katalog', 'Gutachten', 'Fahrzeuge', 'Inhalte', 'Einstellungen', 'Team', 'System'])
            ->and(array_column($nav[1]['pages'], 'label'))->toBe(['Bestellungen', 'Rückbuchungen', 'Anfragen'])
            ->and(array_column($nav[2]['pages'], 'label'))->toBe(['Felgen', 'Marken', 'Import'])
            ->and(array_column($nav[3]['pages'], 'label'))->toBe(['Dokumente', 'Auflagen', 'Abdeckung', 'Konflikte'])
            ->and(array_column($nav[4]['pages'], 'label'))->toBe(['Fahrzeuge', 'Zur Prüfung'])
            ->and(array_column($nav[5]['pages'], 'label'))->toBe(['Seiten', 'FAQ', 'Navigation'])
            ->and(array_column($nav[6]['pages'], 'label'))->toBe(['Zubehörpreise', 'Medien und Speicher', 'Zahlung', 'Verkäufer & Versand'])
            ->and(array_column($nav[7]['pages'], 'label'))->toBe(['Benutzer', 'Rollen & Rechte', 'Protokoll'])
            ->and(array_column($nav[8]['pages'], 'label'))->toBe(['Zustand']);
    });

    it('lets a page belong to another area than its group: the Protokoll needs the audit log, not the roles', function (): void {
        // Gutachten may read the audit log but may not manage roles: Team shows only the Protokoll.
        $nav = collect(sharedNav(shellAdmin('compliance-editor')));
        $team = $nav->firstWhere('key', 'team');

        expect($team)->not->toBeNull()
            ->and(array_column($team['pages'] ?? [], 'label'))->toBe(['Protokoll']);
    });

    it('leaves out a whole group a role may not see, rather than drawing it empty', function (): void {
        $labels = array_column(sharedNav(shellAdmin('accountant')), 'label');

        expect($labels)->toContain('Übersicht')
            ->and($labels)->not->toContain('Team')
            ->and($labels)->not->toContain('Katalog');
    });

    it('always keeps Übersicht, so the rail is never empty', function (string $role): void {
        expect(sharedNav(shellAdmin($role))[0]['label'])->toBe('Übersicht');
    })->with(fn (): array => shellRoles());
});

describe('the counts', function (): void {
    it('shows no count at zero — not a 0, not an empty badge', function (): void {
        $verkauf = collect(sharedNav(shellAdmin()))->firstWhere('key', 'verkauf');

        expect(collect($verkauf['pages'])->firstWhere('label', 'Anfragen')['count'])->toBeNull();
    });

    it('counts the customers still waiting on a document, and only them', function (): void {
        $vehicle = Vehicle::factory()->create();
        $row = fn (array $overrides): array => [
            'email' => fake()->unique()->safeEmail(),
            'vehicle_id' => $vehicle->id,
            'confirm_token' => bin2hex(random_bytes(32)),
            'unsubscribe_token' => bin2hex(random_bytes(32)),
            'confirmed_at' => now(),
            // Every row carries every column: a multi-row insert needs the same shape throughout.
            'unsubscribed_at' => null,
            'notified_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
            ...$overrides,
        ];

        DB::table('fitment_subscriptions')->insert([
            $row([]),
            $row([]),
            $row(['confirmed_at' => null]),          // never confirmed: not a request yet
            $row(['unsubscribed_at' => now()]),      // withdrawn
            $row(['notified_at' => now()]),          // already told
        ]);

        $verkauf = collect(sharedNav(shellAdmin()))->firstWhere('key', 'verkauf');
        $page = collect($verkauf['pages'])->firstWhere('label', 'Anfragen');

        expect($page['count'])->toBe(2)
            ->and($page['countTone'])->toBe('neutral');
    });
});

describe('where the reader is', function (): void {
    it('names the group and the page, and links neither', function (): void {
        $this->actingAs(shellAdmin(), 'admin')->get('/admin/rollen')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('admin.breadcrumbs', [
                ['label' => 'Team', 'href' => null],
                ['label' => 'Rollen & Rechte', 'href' => null],
            ]));
    });

    it('names the tab beneath a rail item, and does not link the item: it has no page but its tabs', function (): void {
        $this->actingAs(shellAdmin(), 'admin')->get('/admin/zubehoerpreise/rdks')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('admin.breadcrumbs', [
                ['label' => 'Einstellungen', 'href' => null],
                ['label' => 'Zubehörpreise', 'href' => null],
                ['label' => 'RDKS-Sensoren', 'href' => null],
            ]));
    });

    it('names the notification centre, which sits outside the rail', function (): void {
        $this->actingAs(shellAdmin(), 'admin')->get('/admin/benachrichtigungen')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('admin.breadcrumbs', [
                ['label' => 'Benachrichtigungen', 'href' => null],
            ]));
    });

    it('does not say "Übersicht › Übersicht" for a group that is one page', function (): void {
        $this->actingAs(shellAdmin(), 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('admin.breadcrumbs', [
                ['label' => 'Übersicht', 'href' => null],
            ]));
    });
});

describe('which copy of the shop this is', function (): void {
    it('says it out loud on a copy where work does not count', function (): void {
        $this->actingAs(shellAdmin(), 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('admin.environment', 'local'));
    });

    it('says nothing in production, because the absence of a badge is the least ambiguous answer', function (): void {
        app()->detectEnvironment(fn (): string => 'production');

        $this->actingAs(shellAdmin(), 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('admin.environment', null));
    });
});

describe('the sign-in screen', function (): void {
    it('carries no account and no tree, because nobody is signed in to be named', function (): void {
        $this->get('/admin/anmelden')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('admin.account', null)
                ->where('admin.nav', []));
    });
});

describe('the rail, remembered', function (): void {
    it('starts open for somebody who never touched it', function (): void {
        $this->actingAs(shellAdmin(), 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('admin.preferences.railCollapsed', false));
    });

    it('keeps the choice on the account, so the next page is right in its first frame', function (): void {
        $admin = shellAdmin();

        $this->actingAs($admin, 'admin')->from('/admin')->patch('/admin/ansicht', ['rail' => 'collapsed'])->assertRedirect('/admin');

        expect($admin->fresh()?->railCollapsed())->toBeTrue();

        $this->actingAs($admin, 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('admin.preferences.railCollapsed', true));
    });

    it('merges into the other choices rather than wiping them', function (): void {
        $admin = shellAdmin();
        $admin->forceFill(['preferences' => ['period' => '30']])->save();

        $this->actingAs($admin, 'admin')->patch('/admin/ansicht', ['rail' => 'collapsed']);

        // toEqual, not toBe: MySQL's JSON type stores object keys in its own order (shorter first), so
        // the question is whether both choices survive, not which one is listed first.
        expect($admin->fresh()?->preferences)->toEqual(['period' => '30', 'rail' => 'collapsed']);
    });

    it('refuses anything but open or collapsed', function (): void {
        $this->actingAs(shellAdmin(), 'admin')->from('/admin')
            ->patch('/admin/ansicht', ['rail' => 'sideways'])
            ->assertSessionHasErrors('rail');
    });

    it('only ever writes the caller\'s own row', function (): void {
        $other = shellAdmin('accountant');

        $this->actingAs(shellAdmin(), 'admin')->patch('/admin/ansicht', ['rail' => 'collapsed', 'id' => $other->id]);

        expect($other->fresh()?->railCollapsed())->toBeFalse();
    });

    it('sends somebody who is not signed in to the sign-in screen', function (): void {
        $this->patch('/admin/ansicht', ['rail' => 'collapsed'])->assertRedirect('/admin/anmelden');
    });

    it('starts at 260 px, and keeps the width it was dragged to for the next page, on any machine', function (): void {
        $admin = shellAdmin();

        $this->actingAs($admin, 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('admin.preferences.railWidth', 260));

        // What the handle sends while dragging and when it lets go: the state and the width together.
        $this->actingAs($admin, 'admin')->patchJson('/admin/ansicht', ['rail' => 'open', 'width' => 320])->assertNoContent();

        expect($admin->fresh()?->railWidth())->toBe(320);

        $this->actingAs($admin->fresh() ?? $admin, 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('admin.preferences.railWidth', 320)
                ->where('admin.preferences.railCollapsed', false));
    });

    it('takes a width only in whole pixels between 232 and 400', function (mixed $width): void {
        $admin = shellAdmin();

        $this->actingAs($admin, 'admin')->patchJson('/admin/ansicht', ['width' => $width])->assertUnprocessable();

        expect($admin->fresh()?->railWidth())->toBe(260);
    })->with([231, 401, 'breit', 300.5]);

    it('reads a width that is not one (an old or hand-edited row) as the default', function (): void {
        $admin = shellAdmin();
        $admin->forceFill(['preferences' => ['railWidth' => 999]])->save();

        expect($admin->fresh()?->railWidth())->toBe(260);
    });

    it('keeps the newest save of the rail and drops an older one that arrives after it', function (): void {
        $admin = shellAdmin();

        $this->actingAs($admin, 'admin')->patchJson('/admin/ansicht', ['rail' => 'open', 'width' => 320, 'rev' => 20])->assertNoContent();
        // Overtaken on its way: an earlier save of the same drag gets there second.
        $this->actingAs($admin, 'admin')->patchJson('/admin/ansicht', ['rail' => 'open', 'width' => 276, 'rev' => 10])->assertNoContent();

        expect($admin->fresh()?->railWidth())->toBe(320)
            ->and($admin->fresh()?->railRev())->toBe(20);

        $this->actingAs($admin->fresh() ?? $admin, 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('admin.preferences.railRev', 20));
    });

    it('takes the last width from a closing tab: a beacon, a form post with its token and method in fields', function (): void {
        $admin = shellAdmin();

        // navigator.sendBeacon sends no headers: `_method` makes it the PATCH, `_token` passes the check.
        $this->actingAs($admin, 'admin')
            ->post('/admin/ansicht', ['_method' => 'PATCH', '_token' => 'from-the-page', 'rail' => 'open', 'width' => '344', 'rev' => '1727000000000'])
            ->assertRedirect();

        expect($admin->fresh()?->railWidth())->toBe(344)
            ->and($admin->fresh()?->railRev())->toBe(1727000000000);
    });

    it('never lets one save undo another made from an older copy — a rail save beside a period choice', function (): void {
        $admin = shellAdmin();

        // Two requests that read the account at the same moment, then each save one choice.
        $rail = AdminUser::query()->findOrFail($admin->id);
        $period = AdminUser::query()->findOrFail($admin->id);

        $rail->rememberPreferences(['railWidth' => 320]);
        $period->rememberPreferences(['dashboard' => ['zeitraum' => '7']]);

        expect($admin->fresh()?->preferences)->toEqual(['railWidth' => 320, 'dashboard' => ['zeitraum' => '7']])
            ->and($period->preferences)->toEqual(['railWidth' => 320, 'dashboard' => ['zeitraum' => '7']]);
    });
});

describe('the rail, narrow', function (): void {
    it('gives every group a short word of its own for a rail narrower than 248 px', function (): void {
        $groups = collect(sharedNav(shellAdmin()))->keyBy('key');

        expect($groups->every(fn (array $group): bool => is_string($group['short']) && $group['short'] !== '' && ! str_contains($group['short'], '…')))->toBeTrue()
            ->and($groups['einstellungen']['short'])->toBe('Vorgaben')
            ->and($groups['verkauf']['short'])->toBe('Verkauf');
    });
});

describe('the profile', function (): void {
    it('opens for every role, says who they are, and names itself in the breadcrumbs', function (string $role): void {
        $admin = shellAdmin($role);

        $this->actingAs($admin, 'admin')->get('/admin/profil')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Profil/Index')
                ->where('profile.name', $admin->name)
                ->where('profile.email', $admin->email)
                ->where('profile.role', $admin->roleLabel())
                ->where('admin.breadcrumbs', [['label' => 'Profil', 'href' => null]]));
    })->with(shellRoles());

    it('never sends the password hash or the two-factor secret to the page', function (): void {
        $this->actingAs(shellAdmin(), 'admin')->get('/admin/profil')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->missing('profile.password')
                ->missing('profile.totp_secret'));
    });
});

describe('changing your own password', function (): void {
    it('changes it, and the new one signs in', function (): void {
        $admin = shellAdmin();

        $this->actingAs($admin, 'admin')->from('/admin/profil')->put('/admin/profil/passwort', [
            'current_password' => 'rimify-dev-2026',
            'password' => 'ein-neues-langes-passwort',
            'password_confirmation' => 'ein-neues-langes-passwort',
        ])->assertRedirect('/admin/profil')->assertSessionHasNoErrors();

        expect(Hash::check('ein-neues-langes-passwort', (string) $admin->fresh()?->getAuthPassword()))->toBeTrue();
    });

    it('asks for the current one, so a panel left open on a desk cannot lock its owner out', function (): void {
        $this->actingAs(shellAdmin(), 'admin')->from('/admin/profil')->put('/admin/profil/passwort', [
            'current_password' => 'falsch',
            'password' => 'ein-neues-langes-passwort',
            'password_confirmation' => 'ein-neues-langes-passwort',
        ])->assertSessionHasErrors(['current_password' => 'Das aktuelle Passwort stimmt nicht.']);
    });

    it('wants at least twelve characters, typed the same twice', function (): void {
        $this->actingAs(shellAdmin(), 'admin')->from('/admin/profil')->put('/admin/profil/passwort', [
            'current_password' => 'rimify-dev-2026',
            'password' => 'kurz',
            'password_confirmation' => 'anders',
        ])->assertSessionHasErrors(['password']);
    });

    it('records that it happened and never what it was', function (): void {
        $admin = shellAdmin();

        $this->actingAs($admin, 'admin')->put('/admin/profil/passwort', [
            'current_password' => 'rimify-dev-2026',
            'password' => 'ein-neues-langes-passwort',
            'password_confirmation' => 'ein-neues-langes-passwort',
        ]);

        $entry = AuditLog::query()->where('description', 'admin.password_changed')->latest('id')->first();

        expect($entry)->not->toBeNull()
            ->and($entry?->actor_email)->toBe($admin->email)
            ->and(json_encode($entry?->properties))->not->toContain('ein-neues-langes-passwort');
    });
});

describe('signing in', function (): void {
    it('refuses an account that has been suspended, even with the right password', function (): void {
        shellAdmin()->forceFill(['status' => AdminUserStatus::Suspended])->save();

        $this->from('/admin/anmelden')->post('/admin/anmelden', [
            'email' => 'super-admin@rimify.test',
            'password' => 'rimify-dev-2026',
        ])->assertSessionHasErrors('email');

        expect(auth('admin')->check())->toBeFalse();
    });

    it('refuses an account under a lock', function (): void {
        shellAdmin()->forceFill(['locked_until' => now()->addHour()])->save();

        $this->post('/admin/anmelden', ['email' => 'super-admin@rimify.test', 'password' => 'rimify-dev-2026'])
            ->assertSessionHasErrors('email');

        expect(auth('admin')->check())->toBeFalse();
    });

    it('notes when an account last signed in', function (): void {
        $this->post('/admin/anmelden', ['email' => 'super-admin@rimify.test', 'password' => 'rimify-dev-2026']);

        expect(shellAdmin()->last_login_at)->not->toBeNull();
    });
});
