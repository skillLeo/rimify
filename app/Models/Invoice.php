<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

/**
 * A §14 UStG invoice or credit note (Invoices issues them): numbered without gaps per series, written once with
 * the frozen seller, buyer and lines and the PDF's key and checksum. Never changed, never deleted — the model
 * refuses, and a trigger refuses underneath it. A wrong invoice is corrected by a credit note.
 *
 * @property int $id
 * @property int $order_id
 * @property 'invoice'|'credit_note' $kind
 * @property string $series
 * @property int $sequence
 * @property string $number
 * @property CarbonImmutable $issued_at
 * @property int $net_cents
 * @property int $tax_cents
 * @property int $gross_cents
 * @property int $tax_rate_bp
 * @property string $currency
 * @property array<string, mixed> $seller
 * @property array<string, mixed> $buyer
 * @property list<array<string, mixed>> $lines
 * @property int|null $refund_id
 * @property int|null $corrects_invoice_id
 * @property string $pdf_key
 * @property string $pdf_sha256
 */
class Invoice extends Model
{
    public const INVOICE = 'invoice';

    public const CREDIT_NOTE = 'credit_note';

    public const UPDATED_AT = null;

    protected $guarded = ['id'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'issued_at' => 'immutable_datetime',
            'net_cents' => 'integer',
            'tax_cents' => 'integer',
            'gross_cents' => 'integer',
            'tax_rate_bp' => 'integer',
            'sequence' => 'integer',
            'seller' => 'array',
            'buyer' => 'array',
            'lines' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::updating(static fn (): never => throw new LogicException('An issued invoice is never changed: correct it with a credit note.'));
        static::deleting(static fn (): never => throw new LogicException('An issued invoice is never deleted.'));
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
