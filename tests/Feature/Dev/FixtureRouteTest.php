<?php

declare(strict_types=1);

use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Route;

/**
 * The fixture route sets vehicle state from an unauthenticated GET. That is exactly what a visual
 * fixture is for, and exactly what must never be reachable in production — so the guard around it
 * is tested rather than trusted.
 */
it('is registered in the testing environment', function (): void {
    expect(Route::has('fixture'))->toBeTrue();
});

it('is not registered when the environment is production', function (): void {
    // Swap in an empty router, tell the container it is production, and re-run the route file.
    // This exercises the real condition in routes/web.php rather than asserting something about
    // the string it is written with.
    $this->app['env'] = 'production';

    $router = new Router($this->app['events'], $this->app);
    Route::swap($router);

    require base_path('routes/web.php');

    expect($router->getRoutes()->getByName('fixture'))
        ->toBeNull('The fixture route must not exist outside local and testing.');
});

it('refuses an unmapped case instead of guessing a route', function (): void {
    // A fixture that fell back to a plausible route would render the wrong screen, and the visual
    // gate would then go green against a page nobody compared. 404 naming the missing key is the
    // only safe answer.
    $this->get('/__fixture/does-not-exist')->assertNotFound();
});

it('refuses an unmapped state on a page that exists', function (): void {
    $this->get('/__fixture/does-not-exist@vehicle')->assertNotFound();
});
