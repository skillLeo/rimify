<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use Database\Seeders\AccessSeeder;

/*
 * The admin audit's F-31 (ADMIN-AUDIT.md): Gutachten › Dokumente put every document on one page — 1.061 of them, with
 * no search, the chips counting in the browser. The list now comes in pages; a search finds a document by any number
 * it is known by or its issuer; status and kind narrow it on the server, each chip counting what is on file.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

function dokumenteAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

/** @return array<string, mixed> */
function dokumenteProps(string $query = ''): array
{
    return test()->actingAs(dokumenteAdmin(), 'admin')->get('/admin/gutachten'.$query)->assertOk()->viewData('page')['props'];
}

it('pages through every document, drafts first, and counts them all', function (): void {
    ApprovalDocument::factory()->count(110)->create();
    $draft = ApprovalDocument::factory()->draft()->create(['report_number' => '366-0350-23-AUDT']);

    $first = dokumenteProps();
    expect($first['total'])->toBe(111)
        ->and($first['released'])->toBe(110)
        ->and($first['documents'])->toHaveCount(50)
        ->and($first['documents'][0]['id'])->toBe($draft->id)
        ->and($first['pagination'])->toMatchArray(['current' => 1, 'last' => 3, 'next' => '/admin/gutachten?seite=2']);

    expect(dokumenteProps('?seite=3')['documents'])->toHaveCount(11);
});

it('finds a document by its number or its issuer, and narrows by status and kind on the server', function (): void {
    ApprovalDocument::factory()->count(60)->create(['kind' => 'ABE', 'issuer' => 'Kraftfahrt-Bundesamt']);
    ApprovalDocument::factory()->draft()->create(['kind' => 'TEILEGUTACHTEN', 'report_number' => '366-0350-23-AUDT', 'issuer' => 'TÜV SÜD Auto Service GmbH']);

    expect(array_column(dokumenteProps('?q=0350-23')['documents'], 'reportNumber'))->toBe(['366-0350-23-AUDT'])
        ->and(dokumenteProps('?q='.rawurlencode('TÜV SÜD'))['found'])->toBe(1)
        ->and(dokumenteProps('?status=draft')['found'])->toBe(1)
        ->and(dokumenteProps('?art=ABE')['found'])->toBe(60);

    $chips = dokumenteProps('?status=draft');
    expect(collect($chips['statusOptions'])->pluck('count', 'value')->all())->toEqualCanonicalizing(['published' => 60, 'draft' => 1])
        ->and($chips['pagination']['last'])->toBe(1);

    // A value that is not on file narrows nothing.
    expect(dokumenteProps('?status=erfunden')['found'])->toBe(61);
});

it('offers every document as a Nachtrag\'s base and every released one to replace, the oldest included (the admin audit\'s F-36)', function (): void {
    $oldest = ApprovalDocument::factory()->create(['issued_on' => '2009-03-01', 'report_number' => 'ALT-2009-1']);
    ApprovalDocument::factory()->count(305)->create(['issued_on' => '2024-05-01']);

    $new = test()->actingAs(dokumenteAdmin(), 'admin')->get('/admin/gutachten/neu')->assertOk()->viewData('page')['props'];

    expect($new['supplementable'])->toHaveCount(306)
        ->and(array_column($new['supplementable'], 'value'))->toContain($oldest->id)
        ->and($new['replaceable'])->toHaveCount(306)
        ->and(array_column($new['replaceable'], 'value'))->toContain($oldest->id)
        // Newest first: the oldest stands last.
        ->and(end($new['supplementable'])['value'])->toBe($oldest->id);
});
