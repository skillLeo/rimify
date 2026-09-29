<?php

declare(strict_types=1);

use App\Providers\AppServiceProvider;
use App\Providers\AuthServiceProvider;
use App\Providers\FitmentServiceProvider;
use App\Providers\StorageServiceProvider;

return [
    AppServiceProvider::class,
    AuthServiceProvider::class,
    FitmentServiceProvider::class,
    StorageServiceProvider::class,
];
