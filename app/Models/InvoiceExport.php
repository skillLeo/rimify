<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;

/**
 * One Stripe invoice's copy in the S3 bucket (rimify:invoices:export-s3, D-361): stored — PDF and JSON written and their
 * sizes checked — or failed after the last try, with the error the admin is shown.
 *
 * @property int $id
 * @property string $stripe_invoice_id
 * @property string|null $number
 * @property string|null $order_number
 * @property CarbonImmutable $invoice_date
 * @property string|null $pdf_path
 * @property int|null $pdf_bytes
 * @property int|null $json_bytes
 * @property string $status
 * @property string|null $error
 * @property int $attempts
 */
class InvoiceExport extends Model
{
    public const STORED = 'stored';

    public const FAILED = 'failed';

    protected $fillable = [
        'stripe_invoice_id', 'number', 'order_number', 'invoice_date', 'pdf_path', 'pdf_bytes', 'json_bytes', 'status', 'error', 'attempts',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'invoice_date' => 'immutable_date',
            'pdf_bytes' => 'integer',
            'json_bytes' => 'integer',
            'attempts' => 'integer',
        ];
    }
}
