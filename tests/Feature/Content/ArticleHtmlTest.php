<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\Page;
use App\Services\Content\ArticleHtml;
use App\Services\Content\PageContent;
use App\Services\Content\PageSchema;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/*
 * His admin item 11, answered (29.10.2026, D-352): „We will go with your proposal.“ — HTML within limits in an article's
 * HTML-Abschnitt. Kept: headings h2 to h4, paragraphs, line breaks, lists, tables (thead, tbody, tr, th, td), links (http,
 * https, mailto, a page of this shop — each with rel="noopener noreferrer"), images from our storage with their
 * description, bold and italic. Removed: everything else — script, iframe, style, every on… attribute, javascript: and
 * every other scheme, inline styles. Cleaned when the draft is saved and again when the article is served.
 */

/** A standard set of payloads (OWASP's filter-evasion sheet and the mutation classics), each with what may remain. */
dataset('payloads', [
    'script' => ['<script>alert(1)</script>Text', 'Text'],
    'script, upper case' => ['<SCRIPT SRC=//evil.example/x.js></SCRIPT>Text', 'Text'],
    'img onerror' => ['<img src=x onerror=alert(1)>', ''],
    'img onerror on our own picture' => ['<img src="/storage/blog/a.webp" alt="Felge" onerror="alert(1)">', '<img src="/storage/blog/a.webp" alt="Felge" loading="lazy" decoding="async">'],
    'img from elsewhere' => ['<img src="https://evil.example/a.png" alt="x">', ''],
    'img without its description' => ['<img src="/storage/blog/a.webp">', ''],
    'svg onload' => ['<svg onload=alert(1)><circle r=1></circle></svg>', ''],
    'iframe' => ['<iframe src="https://evil.example"></iframe>vor<iframe srcdoc="<script>alert(1)</script>"></iframe>', 'vor'],
    'javascript: link' => ['<a href="javascript:alert(1)">klick</a>', 'klick'],
    'JaVaScRiPt: link' => ['<a href="JaVaScRiPt:alert(1)">klick</a>', 'klick'],
    'javascript: with a tab inside' => ['<a href="jav&#x09;ascript:alert(1)">klick</a>', 'klick'],
    'javascript: with a leading space' => ['<a href=" javascript:alert(1)">klick</a>', 'klick'],
    'data: link' => ['<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">klick</a>', 'klick'],
    'vbscript: link' => ['<a href="vbscript:msgbox(1)">klick</a>', 'klick'],
    'protocol-relative link' => ['<a href="//evil.example">klick</a>', 'klick'],
    'backslash link' => ['<a href="/\evil.example">klick</a>', 'klick'],
    'link with a handler' => ['<a href="https://example.com" onclick="alert(1)" target="_blank">klick</a>', '<a href="https://example.com" rel="noopener noreferrer">klick</a>'],
    'inline style' => ['<p style="background:url(javascript:alert(1))">Text</p>', '<p>Text</p>'],
    'style element' => ['<style>body{display:none}</style><p>Text</p>', '<p>Text</p>'],
    'b onmouseover' => ['"><b onmouseover=alert(1)>fett</b>', '&quot;&gt;<b>fett</b>'],
    'details ontoggle' => ['<details open ontoggle=alert(1)>x</details>', 'x'],
    'input autofocus' => ['<input autofocus onfocus=alert(1)>', ''],
    'form action' => ['<form action="javascript:alert(1)"><button>Los</button></form>', ''],
    'object and embed' => ['<object data="x.swf"></object><embed src="x.swf">', ''],
    'meta refresh' => ['<meta http-equiv="refresh" content="0;url=javascript:alert(1)">Text', 'Text'],
    'base href' => ['<base href="javascript:/">Text', 'Text'],
    'comment' => ['<!--<img src=x onerror=alert(1)>-->Text', 'Text'],
    'mutation: noscript' => ['<noscript><p title="</noscript><img src=x onerror=alert(1)>">', ''],
    'mutation: math style' => ['<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>', ''],
    'td with a handler' => ['<table><tbody><tr><td onmouseover=alert(1)>Zelle</td></tr></tbody></table>', '<table><tbody><tr><td>Zelle</td></tr></tbody></table>'],
    'text that looks like a tag' => ['ET &lt; 30 &amp; &lt;script&gt;', 'ET &lt; 30 &amp; &lt;script&gt;'],
]);

it('strips every payload of the standard set, keeping only what is allowed', function (string $payload, string $kept): void {
    $clean = ArticleHtml::clean($payload);

    expect($clean)->toBe($kept)
        ->not->toMatch('/<\s*(script|iframe|style|svg|math|object|embed|form|input|meta|base|details|noscript)\b/i')
        ->not->toMatch('/\son[a-z]+\s*=/i')
        ->not->toMatch('/javascript:|vbscript:|data:/i')
        ->not->toMatch('/\sstyle\s*=/i');

    // Clean is clean: a second pass changes nothing.
    expect(ArticleHtml::clean($clean))->toBe($clean);
})->with('payloads');

it('keeps a table whole: its head, its body, every row and cell, the header cells’ scope', function (): void {
    $table = '<table><thead><tr><th scope="col">Feld</th><th scope="col">Steht dort</th></tr></thead>'
        .'<tbody><tr><td>2.1</td><td>HSN, vier Ziffern</td></tr><tr><td>2.2</td><td>TSN, die ersten drei Zeichen</td></tr></tbody></table>';

    expect(ArticleHtml::clean($table))->toBe($table);
});

it('keeps headings h2 to h4, paragraphs, breaks, lists, links, bold and italic as written', function (): void {
    $html = '<h2>Einpresstiefe</h2><h3>Was sie misst</h3><h4>Ein Beispiel</h4><p>Die <strong>ET</strong> in <em>Millimetern</em>,<br>'
        .'<b>fett</b> und <i>kursiv</i>.</p><ul><li>eins</li><li>zwei</li></ul><ol><li>erstens</li></ol>'
        .'<p><a href="https://www.kba.de/" rel="noopener noreferrer">KBA</a>, <a href="mailto:info@example.com" rel="noopener noreferrer">schreib uns</a>, '
        .'<a href="/felgenrechner" rel="noopener noreferrer">Felgenrechner</a></p>';

    expect(ArticleHtml::clean($html))->toBe($html);

    // h1, h5 and h6 are not on the list: their words stay, the element goes. So do div, span and font.
    expect(ArticleHtml::clean('<h1>Titel</h1><div><span style="color:red"><font color=red>Wort</font></span></div><h5>klein</h5>'))->toBe('TitelWortklein');
});

it('cleans when the draft is saved, and again when the article is served', function (): void {
    config(['rimify.reset.allowed' => false]);
    $this->seed([CommerceSeeder::class, AccessSeeder::class, ContentSeeder::class]);

    $guide = Page::query()->where('slug', 'hsn-und-tsn-finden')->firstOrFail();
    $live = PageContent::live($guide);
    $content = PageSchema::normalise(PageSchema::for($guide) ?? [], $live, $live);
    $content['blocks'][] = ['type' => 'html', 'data' => ['html' => '<p onclick="alert(1)">Auf dem Schein</p><script>alert(1)</script>']];

    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $this->actingAs($admin, 'admin')->from('/admin/ratgeber/'.$guide->id)
        ->put('/admin/seiten/'.$guide->id.'/entwurf', $content + ['baseVersion' => (int) $guide->content_version])
        ->assertSessionHasNoErrors();

    // Saved: only what the list allows is stored.
    $saved = collect($guide->refresh()->draft['blocks'] ?? [])->firstWhere('type', 'html');
    expect($saved['data']['html'] ?? null)->toBe('<p>Auf dem Schein</p>');

    // A row written past the editor still leaves cleaned.
    DB::table('page_blocks')->insert([
        'page_id' => $guide->id, 'type' => 'html', 'sort_order' => 999, 'created_at' => now(), 'updated_at' => now(),
        'data' => json_encode(['html' => '<h2>Tabelle</h2><table><tbody><tr><td onmouseover="alert(1)">2.1</td></tr></tbody></table><iframe src="https://evil.example"></iframe>']),
    ]);

    $this->get('/ratgeber/hsn-und-tsn-finden')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('guide.blocks', fn ($blocks): bool => collect($blocks)->contains(
            fn (array $block): bool => $block['type'] === 'html' && $block['data']['html'] === '<h2>Tabelle</h2><table><tbody><tr><td>2.1</td></tr></tbody></table>',
        )));
});
