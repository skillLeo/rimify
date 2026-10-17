<?php

declare(strict_types=1);

use App\Models\AdminUser;
use Database\Seeders\AccessSeeder;

/**
 * D-274: a desktop admin page paints once the admin layout's last element is parsed, as the shop does since D-177, and
 * the phone at once. On a loaded machine the Übersicht was painted with its header half-parsed — the Zeitraum's three
 * buttons beside the title — and rearranged when the rest arrived: the whole switcher beneath the title, CLS 0,039 at
 * 768. The element itself is rendered by AdminLayout on the server (e2e/cls-budget.spec.ts holds it there).
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

it('lets a desktop admin page paint once its layout is parsed, and the phone at once', function (): void {
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    $desktop = (string) $this->actingAs($admin, 'admin')->get('/admin/profil')->assertOk()->getContent();
    $phone = (string) $this->actingAs($admin, 'admin')
        ->withHeaders(['User-Agent' => 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'])
        ->get('/admin/profil')->assertOk()->getContent();

    expect($desktop)->toContain('<link rel="expect" href="#seitenende" blocking="render">')
        ->and($phone)->not->toContain('rel="expect"');
});
