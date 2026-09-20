<?php

declare(strict_types=1);

use App\Domain\Storefront\DeviceDetector;
use App\Domain\Storefront\VehicleContext;

const UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const UA_ANDROID_PHONE = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const UA_ANDROID_TABLET = 'Mozilla/5.0 (Linux; Android 15; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const UA_IPAD = 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/604.1';
const UA_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

it('detects phones from the User-Agent and keeps tablets and desktops on the desktop layout', function (): void {
    $detector = new DeviceDetector;

    expect($detector->isMobile(UA_IPHONE, null))->toBeTrue()
        ->and($detector->isMobile(UA_ANDROID_PHONE, null))->toBeTrue()
        ->and($detector->isMobile(UA_ANDROID_TABLET, null))->toBeFalse()
        ->and($detector->isMobile(UA_IPAD, null))->toBeFalse()
        ->and($detector->isMobile(UA_DESKTOP, null))->toBeFalse()
        ->and($detector->isMobile(null, null))->toBeFalse()
        ->and($detector->isMobile('', null))->toBeFalse();
});

it('lets the Sec-CH-UA-Mobile client hint outrank the User-Agent', function (): void {
    $detector = new DeviceDetector;

    expect($detector->isMobile(UA_DESKTOP, '?1'))->toBeTrue()
        ->and($detector->isMobile(UA_IPHONE, '?0'))->toBeFalse()
        ->and($detector->isMobile(UA_IPHONE, ' ?1 '))->toBeTrue()
        ->and($detector->isMobile(UA_IPHONE, 'garbage'))->toBeTrue();
});

it('lets the demo override outrank everything and ignores unknown override values', function (): void {
    $detector = new DeviceDetector;

    expect($detector->isMobile(UA_DESKTOP, '?0', 'mobile'))->toBeTrue()
        ->and($detector->isMobile(UA_IPHONE, '?1', 'desktop'))->toBeFalse()
        ->and(DeviceDetector::normaliseOverride('tablet'))->toBeNull()
        ->and(DeviceDetector::normaliseOverride(['mobile']))->toBeNull()
        ->and(DeviceDetector::normaliseOverride('mobile'))->toBe('mobile');
});

it('round-trips the vehicle context cookie payload', function (): void {
    $context = new VehicleContext(42, true);

    expect(VehicleContext::decode($context->encode()))->toEqual($context)
        ->and(VehicleContext::decode((new VehicleContext(7))->encode())?->hasEnteredBooking)->toBeFalse();
});

it('decodes anything malformed to "no vehicle" instead of failing', function (?string $payload): void {
    expect(VehicleContext::decode($payload))->toBeNull();
})->with([
    'null' => [null],
    'empty' => [''],
    'not json' => ['{{{'],
    'string id' => ['{"v":"42","b":true}'],
    'zero id' => ['{"v":0}'],
    'negative id' => ['{"v":-3}'],
    'missing id' => ['{"b":true}'],
    'a list' => ['[1,2]'],
    'a scalar' => ['42'],
]);

it('only treats an explicit true as having entered the booking process', function (): void {
    expect(VehicleContext::decode('{"v":5,"b":1}')?->hasEnteredBooking)->toBeFalse()
        ->and(VehicleContext::decode('{"v":5,"b":"true"}')?->hasEnteredBooking)->toBeFalse()
        ->and(VehicleContext::decode('{"v":5,"b":true}')?->hasEnteredBooking)->toBeTrue();
});

it('keeps the booking flag when the visitor switches to another vehicle', function (): void {
    $context = (new VehicleContext(1))->enteredBooking()->withVehicle(2);

    expect($context->vehicleId)->toBe(2)->and($context->hasEnteredBooking)->toBeTrue();
});
