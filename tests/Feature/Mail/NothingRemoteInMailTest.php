<?php

declare(strict_types=1);

use App\Listeners\StripRemoteMailContent;
use App\Mail\ContactMessageMail;
use App\Models\ContactMessage;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/*
 * No mail of the shop makes the reader's mail program fetch anything from a host that is not the shop's own (finding
 * 102, D-218): a fetched image tells its host who opened which mail. Held three ways — the templates carry no image and
 * no address of their own; the layout's header is ours, without the framework's logo; and whatever is written next
 * passes StripRemoteMailContent on its way out.
 */

const OWN = ['shop.example'];

it('takes out what a mail program would fetch from another host', function (string $html, string $clean): void {
    expect(StripRemoteMailContent::clean($html, OWN))->toBe($clean);
})->with([
    'an image elsewhere leaves its alt text' => ['<p>A<img src="https://tracker.example/p.png" alt="Logo">B</p>', '<p>ALogoB</p>'],
    'an image without a scheme' => ['<img src="//tracker.example/p.png">', ''],
    'an image whose address is written with an entity' => ['<img src="https:&#47;&#47;tracker.example/p.png">', ''],
    'one of several sizes elsewhere' => ['<img src="/a.png" srcset="/a.png 1x, https://cdn.example/a2.png 2x" alt="">', ''],
    'a stylesheet' => ['<link rel="stylesheet" href="https://fonts.example/css?family=X">', ''],
    'a frame' => ['<iframe src="https://video.example/1"></iframe>', '</iframe>'],
    'a cell\'s background' => ['<td background="https://x.example/bg.png" width="10">', '<td width="10">'],
    'an import and a url() in a style element' => [
        '<style>@import url("https://x.example/a.css"); .a{background:url(https://x.example/b.png)} .b{background:url(/own.png)}</style>',
        '<style> .a{background:none} .b{background:url(/own.png)}</style>',
    ],
    'a url() in a style attribute' => ['<p style="background-image: url(\'https://x.example/c.png\')">x</p>', '<p style="background-image: none">x</p>'],
]);

it('leaves alone what is ours, what is attached, and what a person follows', function (string $html): void {
    expect(StripRemoteMailContent::clean($html, OWN))->toBe($html);
})->with([
    'an attached image' => ['<img src="cid:logo@rimify" alt="RIMIFY">'],
    'an inline image' => ['<img src="data:image/png;base64,iVBORw0KGgo=" alt="">'],
    'an image of the shop\'s own host' => ['<img src="https://shop.example/storage/wheels/a.jpg" alt="Felge">'],
    'a path' => ['<img src="/storage/wheels/a.jpg" alt="Felge">'],
    'a link elsewhere: followed by a person, not fetched' => ['<a href="https://example.org/seite">example.org</a>'],
    'a mail address' => ['<a href="mailto:service@example.org">service@example.org</a>'],
    'the words url() in the text of a mail' => ['<p>Im CSS steht url(https://x.example/c.png) – ist das richtig?</p>'],
]);

it('strips it on the way out of the mailer, sends the mail all the same, and says so in the log', function (): void {
    config(['app.url' => 'https://shop.example']);
    Log::spy();

    Mail::html('<p>Hallo</p><img src="https://tracker.example/pixel.gif" alt=""><img src="https://shop.example/logo.png" alt="RIMIFY">', function ($message): void {
        $message->to('jana@example.com')->subject('Probe');
    });

    $sent = app('mailer')->getSymfonyTransport()->messages();

    expect($sent)->toHaveCount(1)
        ->and($sent[0]->getOriginalMessage()->getHtmlBody())->toBe('<p>Hallo</p><img src="https://shop.example/logo.png" alt="RIMIFY">');
    Log::shouldHaveReceived('warning')->withArgs(fn (string $line, array $context): bool => str_contains($line, 'taken out before sending') && $context['subject'] === 'Probe')->once();
});

it('writes no image and no address of another host into any mail template', function (): void {
    $templates = [...glob(resource_path('views/mail/*/*.blade.php')) ?: [], ...glob(resource_path('views/vendor/mail/*/*.blade.php')) ?: []];

    expect(count($templates))->toBeGreaterThan(10);

    foreach ($templates as $template) {
        $source = (string) preg_replace('/\{\{--.*?--\}\}/s', '', (string) file_get_contents($template));

        expect($source)->not->toMatch('/<img\b|!\[[^\]]*\]\(|\bsrc\s*=|background\s*=|url\(|https?:\/\//i', basename(dirname($template)).'/'.basename($template));
    }
});

it('builds every mail from one of those templates', function (): void {
    foreach (glob(app_path('Mail/*.php')) ?: [] as $file) {
        $class = 'App\\Mail\\'.basename($file, '.php');

        if (! is_subclass_of($class, Mailable::class)) {
            continue;
        }

        // Markdown from resources/views/mail, or nothing: no mail assembles its own HTML somewhere the test above does not read.
        expect((string) file_get_contents($file))->toMatch("/markdown: 'mail\\.[a-z.-]+'/", $class)
            ->not->toMatch('/->html\(|->view\(|html:|view:/', $class);
    }
});

it('prints no logo from laravel.com even where the installation has no name of its own', function (): void {
    config(['app.name' => 'Laravel']);

    $html = (new ContactMessageMail((new ContactMessage)->forceFill([
        'name' => 'Jana Beispiel', 'email' => 'jana@example.com', 'subject' => 'Frage', 'message' => 'Passt die Felge auch mit Winterreifen?',
    ])))->render();

    expect($html)->not->toContain('laravel.com')
        ->not->toContain('<img');
});
