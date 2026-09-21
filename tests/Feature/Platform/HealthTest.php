<?php

declare(strict_types=1);

it('answers the health endpoint', function (): void {
    $this->get('/up')->assertOk();
});
