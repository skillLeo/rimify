<?php

declare(strict_types=1);

/*
 * Block G: no Stripe-specific code anywhere outside the driver. The SDK's namespace is used in
 * app/Payments/Stripe and nowhere else in app/ — the checkout, the webhook route, the refund and the expiry run
 * speak PaymentGateway only.
 */

arch('the Stripe SDK is used only by the Stripe driver')
    ->expect('Stripe')
    ->toOnlyBeUsedIn('App\Payments\Stripe');

it('names Stripe’s namespace in no file of app/ outside the driver', function (): void {
    $root = dirname(__DIR__, 3).DIRECTORY_SEPARATOR.'app';
    $found = [];

    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS)) as $file) {
        $path = str_replace('\\', '/', (string) $file);

        if (! str_ends_with($path, '.php') || str_contains($path, '/app/Payments/Stripe/')) {
            continue;
        }

        // The SDK's root namespace — `use Stripe\…` or `\Stripe\…` — not the driver's own `App\Payments\Stripe\…`.
        if (preg_match('/(?<![\w\\\\])\\\\?Stripe\\\\[A-Z]/', (string) file_get_contents($path)) === 1) {
            $found[] = substr($path, strpos($path, '/app/') + 1);
        }
    }

    expect($found)->toBe([]);
});
