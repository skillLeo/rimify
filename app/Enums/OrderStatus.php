<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Order state. Driven by the Stripe WEBHOOK, never by the browser redirect: a customer who closes
 * the tab after paying still gets an order, an email and a panel entry.
 */
enum OrderStatus: string
{
    case Draft = 'DRAFT';
    case PendingPayment = 'PENDING_PAYMENT';
    case Paid = 'PAID';
    case InFulfilment = 'IN_FULFILMENT';
    case Shipped = 'SHIPPED';
    case Completed = 'COMPLETED';
    case Failed = 'FAILED';
    case Expired = 'EXPIRED';
    case Cancelled = 'CANCELLED';
    case Refunded = 'REFUNDED';

    public function isPaid(): bool
    {
        return in_array($this, [
            self::Paid, self::InFulfilment, self::Shipped, self::Completed, self::Refunded,
        ], true);
    }

    /** Stock is committed once the money has arrived, and released if the order dies before that. */
    public function holdsStock(): bool
    {
        return in_array($this, [self::Paid, self::InFulfilment, self::Shipped, self::Completed], true);
    }

    public function labelDe(): string
    {
        return match ($this) {
            self::Draft => 'Entwurf',
            self::PendingPayment => 'Zahlung ausstehend',
            self::Paid => 'Bezahlt',
            self::InFulfilment => 'In Bearbeitung',
            self::Shipped => 'Versendet',
            self::Completed => 'Abgeschlossen',
            self::Failed => 'Fehlgeschlagen',
            self::Expired => 'Abgelaufen',
            self::Cancelled => 'Storniert',
            self::Refunded => 'Erstattet',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
