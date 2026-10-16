<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\Page;
use App\Services\Content\PageContent;
use App\Services\Content\PagePublisher;
use App\Services\Content\PageSchema;
use App\Support\HeroPhotos;
use Carbon\CarbonImmutable;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\Artisan;

/*
 * `rimify:review-ready` (the operator's brief „THE HERO SAYS „(VIELLEICHT)““ §2): before anybody is invited, what the
 * shop's words say now and what changed since the last release — trials marked. Played here as the client's own session
 * of 10.10.2026 on the preview: the headline published with the note „test1“, the photo set and replaced 28 seconds
 * later, a draft left for six days, an empty guide page „test“.
 */

beforeEach(function (): void {
    config(['rimify.reset.allowed' => false]);
    $this->seed([CommerceSeeder::class, AccessSeeder::class, ContentSeeder::class]);
});

afterEach(fn () => CarbonImmutable::setTestNow());

function readyAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

/** @return array{0: Page, 1: array{page: list<array<string, mixed>>, blocks: list<array<string, mixed>>}, 2: array{title: string, metaDescription: string, blocks: list<array{type: string, data: array<string, mixed>}>}} */
function readyHome(): array
{
    $home = Page::query()->where('slug', Page::HOME_SLUG)->firstOrFail();
    $schema = PageSchema::for($home) ?? throw new RuntimeException('The homepage has no schema.');
    $live = PageContent::live($home);

    return [$home, $schema, PageSchema::normalise($schema, $live, $live)];
}

/** @param array{title: string, metaDescription: string, blocks: list<array{type: string, data: array<string, mixed>}>} $content */
function readyPublish(array $content, ?string $note): void
{
    [$home, $schema] = readyHome();
    app(PagePublisher::class)->publish($home, $home->content_version, $schema, $content, false, $note, readyAdmin());
}

/** The output of one run, and its exit code. */
function readyRun(string $since): array
{
    $code = Artisan::call('rimify:review-ready', ['--since' => $since]);

    return [$code, Artisan::output()];
}

it('marks the client\'s own session as trials, says each change in words, and leaves the invitation until they are settled', function (): void {
    $photos = array_column(HeroPhotos::options(), 'value');
    $other = collect($photos)->first(fn (string $slug): bool => $slug !== HeroPhotos::DEFAULT) ?? throw new RuntimeException('One photo only.');

    // 10.10.2026, 20:09:03 in Berlin: the headline, with the note „test1“.
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-10-10 18:09:03', 'UTC'));
    [, , $content] = readyHome();
    $before = (string) $content['blocks'][0]['data']['headline'];
    $content['blocks'][0]['data']['headline'] = $before.' (Vielleicht)';
    readyPublish($content, 'test1');

    // The photo set, and 28 seconds later set again — the first was a try.
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-10-10 18:09:40', 'UTC'));
    [, , $content] = readyHome();
    $content['blocks'][0]['data']['foto'] = $other;
    readyPublish($content, null);
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-10-10 18:10:08', 'UTC'));
    [, , $content] = readyHome();
    $content['blocks'][0]['data']['foto'] = HeroPhotos::DEFAULT;
    readyPublish($content, 'test2');

    // 20:10: a draft that changes a promise's glyph, never published.
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-10-10 18:10:30', 'UTC'));
    [$home, , $content] = readyHome();
    $content['blocks'][1]['data']['items'][0]['icon'] = $content['blocks'][1]['data']['items'][0]['icon'] === 'clock' ? 'truck' : 'clock';
    app(PagePublisher::class)->saveDraft($home, $home->content_version, $content, readyAdmin());

    // An empty article called „test“.
    app(PagePublisher::class)->createGuide('test', 'test', PageSchema::for(new Page(['kind' => Page::KIND_GUIDE])) ?? [], readyAdmin());

    // Six days on, before the invitation.
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-10-16 18:00:00', 'UTC'));
    [$code, $out] = readyRun('2026-10-01 00:00');

    expect($code)->toBe(1)
        // The headline first, as visitors read it now.
        ->and($out)->toContain('== Startseite, wie sie jetzt im Shop steht')
        ->and($out)->toContain('Überschrift: '.$before.' (Vielleicht)')
        ->and($out)->toContain('== Veröffentlicht seit 01.10.2026, 00:00')
        ->and($out)->toContain('Einstieg · Überschrift: „'.$before.'“ → „'.$before.' (Vielleicht)“')
        ->and($out)->toContain('10.10.2026, 20:09')
        ->and($out)->toContain('Notiz: „test1“')
        ->and($out)->toContain('! Versuch? Die Notiz „test1“ nennt keinen Grund.')
        ->and($out)->toContain('! Versuch? Nach 28 Sekunden wieder geändert: Einstieg · Foto.')
        // The headline was followed within a minute, never changed again: no „wieder geändert“ for it.
        ->and(substr_count($out, 'wieder geändert'))->toBe(1)
        ->and($out)->toContain('! Versuch? Die Notiz „test2“ nennt keinen Grund.')
        ->and($out)->toContain('== Entwürfe, noch nicht veröffentlicht: 2')
        ->and($out)->toContain('! Versuch? Seit 5 Tagen nicht veröffentlicht.')
        ->and($out)->toContain('! Versuch? Der Titel „test“ nennt keinen Inhalt.')
        ->and($out)->toContain('Versprechen 1 · Symbol')
        ->and($out)->toContain('Erst klären, dann einladen.');
});

it('says so when nothing reads as a trial, and counts from the release stamp by default', function (): void {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-10-16 10:00:00', 'UTC'));
    [, , $content] = readyHome();
    $content['blocks'][0]['data']['headline'] = 'Felgen, die zu deinem Auto passen.';
    readyPublish($content, 'Überschrift nach Rücksprache mit dem Inhaber');

    [$code, $out] = readyRun('2026-10-16 11:00');

    expect($code)->toBe(0)
        ->and($out)->toContain('Notiz: „Überschrift nach Rücksprache mit dem Inhaber“')
        ->and($out)->toContain('Nichts sieht nach einem Versuch aus.');

    // Without --since and without a release stamp it asks, rather than guess.
    expect(Artisan::call('rimify:review-ready'))->toBe(1)
        ->and(Artisan::output())->toContain('Kein Release-Stempel');
});
