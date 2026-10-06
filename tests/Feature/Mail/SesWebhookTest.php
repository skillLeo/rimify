<?php

declare(strict_types=1);

use App\Models\AuditLog;
use App\Models\MailSetting;
use App\Models\MailSuppression;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Tests\Support\FakeSns;

/*
 * POST /webhooks/ses — Amazon SES's bounces and complaints, by SNS (the brief „AFTER CI“, §3). A message counts only
 * when SNS signed it and it comes from the topic entered in Einstellungen › E-Mail; a permanent bounce or a complaint
 * blocks each address it names once, however often SNS delivers it; a transient bounce blocks nothing.
 */

beforeEach(function (): void {
    FakeSns::install();
    MailSetting::query()->forceCreate(['state' => MailSetting::ACTIVE, 'from_address' => 'bestellung@rimify.de', 'topic_arn' => FakeSns::TOPIC]);
});

/** As SNS posts: JSON in the body, sent as text/plain. */
function sesPost(mixed $message): TestResponse
{
    return test()->call('POST', '/webhooks/ses', [], [], [], ['CONTENT_TYPE' => 'text/plain; charset=UTF-8'], (string) json_encode($message));
}

it('blocks every address of a permanent bounce, once, however often SNS delivers it', function (): void {
    $message = FakeSns::signed('Notification', FakeSns::bounce(['Kunde@Example.org', 'zweite@example.org']));

    sesPost($message)->assertOk()->assertJson(['received' => true, 'handled' => 'bounce', 'suppressed' => 2]);
    sesPost($message)->assertOk()->assertJson(['received' => true, 'suppressed' => 0]);

    expect(MailSuppression::query()->orderBy('email')->pluck('email')->all())->toBe(['kunde@example.org', 'zweite@example.org'])
        ->and(MailSuppression::query()->pluck('detail')->unique()->all())->toBe(['Permanent/General'])
        ->and(AuditLog::query()->where('description', 'mail.suppressed')->count())->toBe(2);
});

it('blocks a complaining address, and nothing for a bounce that may deliver tomorrow', function (): void {
    sesPost(FakeSns::signed('Notification', FakeSns::bounce(['voll@example.org'], 'Transient', 'MailboxFull')))
        ->assertOk()->assertJson(['suppressed' => 0]);
    sesPost(FakeSns::signed('Notification', FakeSns::complaint(['spam@example.org'])))
        ->assertOk()->assertJson(['handled' => 'complaint', 'suppressed' => 1]);

    expect(MailSuppression::query()->pluck('email', 'reason')->all())->toBe(['complaint' => 'spam@example.org'])
        ->and(MailSuppression::query()->value('detail'))->toBe('abuse');
});

it('verifies the older signature version 1 as SNS still sends it', function (): void {
    sesPost(FakeSns::signed('Notification', FakeSns::bounce(['alt@example.org']), [], '1'))->assertOk()->assertJson(['suppressed' => 1]);
});

it('refuses a message SNS did not sign, one from another topic, and every message while no topic is entered', function (): void {
    $forged = [...FakeSns::signed('Notification', FakeSns::bounce(['a@example.org'])), 'Message' => FakeSns::bounce(['b@example.org'])];
    $foreign = FakeSns::signed('Notification', FakeSns::bounce(['a@example.org']), ['TopicArn' => 'arn:aws:sns:eu-north-1:123456789012:fremd']);

    sesPost($forged)->assertForbidden();
    sesPost($foreign)->assertForbidden();
    sesPost(['Type' => 'Notification'])->assertForbidden();
    test()->call('POST', '/webhooks/ses', [], [], [], ['CONTENT_TYPE' => 'text/plain'], 'kein JSON')->assertForbidden();

    MailSetting::query()->update(['topic_arn' => null]);
    sesPost(FakeSns::signed('Notification', FakeSns::bounce(['a@example.org'])))->assertForbidden();

    expect(MailSuppression::query()->count())->toBe(0);
});

it('trusts a certificate only from an SNS address over https', function (string $url): void {
    sesPost(FakeSns::signed('Notification', FakeSns::bounce(['a@example.org']), ['SigningCertURL' => $url]))->assertForbidden();

    Http::assertNotSent(static fn (Request $request): bool => $request->url() === $url);
    expect(MailSuppression::query()->count())->toBe(0);
})->with([
    'another host' => 'https://evil.example/SimpleNotificationService-fake.pem',
    'a look-alike host' => 'https://sns.eu-north-1.amazonaws.com.evil.example/cert.pem',
    'no https' => 'http://sns.eu-north-1.amazonaws.com/SimpleNotificationService-fake.pem',
]);

it('confirms the subscription by calling the address SNS sent, and says so in the Protokoll', function (): void {
    sesPost(FakeSns::signed('SubscriptionConfirmation', 'You have chosen to subscribe to the topic.'))
        ->assertOk()->assertJson(['handled' => 'subscribed']);

    Http::assertSent(static fn (Request $request): bool => str_starts_with($request->url(), 'https://sns.eu-north-1.amazonaws.com/?Action=ConfirmSubscription'));
    expect(AuditLog::query()->where('description', 'mail.sns_subscribed')->value('properties')['topic'] ?? null)->toBe(FakeSns::TOPIC);
});

it('never calls a confirmation address that is not SNS\'s, signed or not', function (): void {
    $message = FakeSns::signed('SubscriptionConfirmation', 'subscribe', ['SubscribeURL' => 'https://evil.example/confirm']);

    sesPost($message)->assertOk()->assertJson(['handled' => 'refused']);
    Http::assertNotSent(static fn (Request $request): bool => str_contains($request->url(), 'evil.example'));
});
