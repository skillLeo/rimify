<?php

declare(strict_types=1);

namespace App\Services\Mail;

/**
 * A DNS lookup, as PHP's dns_get_record() answers it. Bound to the system resolver (AppServiceProvider); a test binds
 * records of its own, so no test asks the network.
 */
class DnsLookup
{
    /** @return list<array<string, mixed>> */
    public function records(string $host, int $type): array
    {
        $records = @dns_get_record($host, $type);

        return is_array($records) ? array_values(array_filter($records, 'is_array')) : [];
    }
}
