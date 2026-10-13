<?php

declare(strict_types=1);

use App\Mail\ContactConfirmationMail;
use App\Mail\ContactMessageMail;
use App\Models\ContactMessage;

/*
 * A mail is written in Markdown, and what a `{{ }}` prints into it is read as Markdown too — Laravel escapes it for
 * HTML, not for Markdown. So a visitor's words and a Gutachten's sentences must be made literal before they are printed
 * (App\Support\MailText), or the mail says something else than was written: „[Hier klicken](https://…)“ became a link in
 * a mail the shop sends to any address a visitor types, and „e1*2001/116*0314*10“ lost two of its stars to italics.
 * Found while reading what league/commonmark's advisories of 30.09.2026 touch (the operator's brief „UNBLOCK, PATCH“ §2.1).
 */

const WRITTEN = "Hallo,\n\n[Hier klicken](https://example.org/falle) ![](https://example.org/zaehler.png)\n\n# Wichtig\n\n"
    ."Typgenehmigung e1*2001/116*0314*10, Feld_K und __fett__, `code`, 1. erstens\n\n| a | b |\n|---|---|\n| 1 | 2 |";

function writtenMessage(): ContactMessage
{
    return (new ContactMessage)->forceFill([
        'name' => 'Jana *Beispiel*',
        'email' => 'jana@example.com',
        'subject' => 'Frage [zur Felge](https://example.org/betreff)',
        'message' => WRITTEN,
        'vehicle_label' => 'BMW 3er (E90) 320i',
    ]);
}

it('prints a visitor\'s words as written in the mail to the shop and in the copy to the sender — no link, image, heading or table made of them @kunde-12', function (string $mail): void {
    $html = (new $mail(writtenMessage()))->render();

    // Nothing of theirs became markup.
    expect($html)->not->toContain('href="https://example.org/falle"')
        ->not->toContain('href="https://example.org/betreff"')
        ->not->toContain('example.org/zaehler.png"')
        ->not->toContain('<em>')
        ->not->toContain('<code>')
        ->not->toMatch('/<h1[^>]*>\s*Wichtig/')
        ->not->toMatch('/<t[dh][^>]*>\s*[ab12]\s*</');

    // Every character they typed is there to read.
    $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');

    expect($text)->toContain('[Hier klicken](https://example.org/falle)')
        ->toContain('# Wichtig')
        ->toContain('e1*2001/116*0314*10, Feld_K und __fett__, `code`, 1. erstens')
        ->toContain('| a | b |')
        ->toContain('Jana *Beispiel*')
        ->toContain('Frage [zur Felge](https://example.org/betreff)');
})->with(['to the shop' => [ContactMessageMail::class], 'to the sender' => [ContactConfirmationMail::class]]);
