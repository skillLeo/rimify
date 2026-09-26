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

    /**
     * The money half of the status, as Verkauf › Bestellungen shows it in its own column. `tone`
     * is the state tag's colour: only the exception is tagged (admin-shell.md §6.4).
     *
     * @return array{label: string, tone: 'plain'|'warn'|'bad'|'neutral'}
     */
    public function paymentState(): array
    {
        return match ($this) {
            self::Draft, self::PendingPayment => ['label' => 'Offen', 'tone' => 'warn'],
            self::Paid, self::InFulfilment, self::Shipped, self::Completed => ['label' => 'Bezahlt', 'tone' => 'plain'],
            self::Refunded => ['label' => 'Erstattet', 'tone' => 'neutral'],
            self::Failed => ['label' => 'Fehlgeschlagen', 'tone' => 'bad'],
            self::Expired => ['label' => 'Abgelaufen', 'tone' => 'neutral'],
            self::Cancelled => ['label' => 'Storniert', 'tone' => 'neutral'],
        };
    }

    /**
     * The goods half: whether the wheels have left. An order that was never paid has nothing to send,
     * and says so with a dash rather than "offen", which would read as work waiting.
     *
     * @return array{label: string, tone: 'plain'|'warn'|'bad'|'neutral'}
     */
    public function fulfilmentState(): array
    {
        return match ($this) {
            self::Paid => ['label' => 'Zu versenden', 'tone' => 'warn'],
            self::InFulfilment => ['label' => 'In Bearbeitung', 'tone' => 'plain'],
            self::Shipped => ['label' => 'Versendet', 'tone' => 'plain'],
            self::Completed => ['label' => 'Abgeschlossen', 'tone' => 'plain'],
            self::Draft, self::PendingPayment, self::Failed, self::Expired, self::Cancelled, self::Refunded => ['label' => '–', 'tone' => 'plain'],
        };
    }

    /**
     * The statuses whose money stayed with the shop: paid and not refunded. What the Übersicht counts
     * as Umsatz and as Bestellungen.
     *
     * @return list<self>
     */
    public static function revenue(): array
    {
        return [self::Paid, self::InFulfilment, self::Shipped, self::Completed];
    }

    /**
     * The statuses whose orders the team still has to send: the Übersicht's "Offene Bestellungen".
     *
     * @return list<self>
     */
    public static function open(): array
    {
        return [self::Paid, self::InFulfilment];
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
