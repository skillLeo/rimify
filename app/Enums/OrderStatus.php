<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Order state. Driven by the payment provider's WEBHOOK, never by the browser redirect: a customer who
 * closes the tab after paying still gets an order, an email and a panel entry; a customer who only reaches
 * the return address has paid nothing yet.
 *
 * The moves between states are this enum's (`canBecome`), enforced by the Order model on every save
 * (Block G, the order state machine): an illegal move is impossible in the model, not only hidden in the UI.
 *
 *   wartet auf Zahlung → Zahlung läuft → bezahlt → in Bearbeitung → versendet → abgeschlossen
 *   plus fehlgeschlagen (a retry is allowed), storniert, abgelaufen (24 h unpaid), erstattet, teilweise erstattet.
 */
enum OrderStatus: string
{
    case Draft = 'DRAFT';
    case PendingPayment = 'PENDING_PAYMENT';
    /** SEPA and Klarna settle days later: the money is on its way, not here. */
    case Processing = 'PROCESSING';
    case Paid = 'PAID';
    case InFulfilment = 'IN_FULFILMENT';
    case Shipped = 'SHIPPED';
    case Completed = 'COMPLETED';
    case Failed = 'FAILED';
    case Expired = 'EXPIRED';
    case Cancelled = 'CANCELLED';
    case PartiallyRefunded = 'PARTIALLY_REFUNDED';
    case Refunded = 'REFUNDED';

    /** The states an order may move to from this one. A state not listed is refused by the model. */
    public function next(): array
    {
        return match ($this) {
            self::Draft => [self::PendingPayment, self::Cancelled],
            self::PendingPayment => [self::Processing, self::Paid, self::Failed, self::Cancelled, self::Expired],
            self::Processing => [self::Paid, self::Failed, self::Cancelled],
            // A declined card may be tried again: the same intent, the same order.
            self::Failed => [self::PendingPayment, self::Processing, self::Paid, self::Cancelled, self::Expired],
            self::Paid => [self::InFulfilment, self::Shipped, self::PartiallyRefunded, self::Refunded],
            self::InFulfilment => [self::Shipped, self::PartiallyRefunded, self::Refunded],
            self::Shipped => [self::Completed, self::PartiallyRefunded, self::Refunded],
            self::Completed => [self::PartiallyRefunded, self::Refunded],
            self::PartiallyRefunded => [self::PartiallyRefunded, self::InFulfilment, self::Shipped, self::Completed, self::Refunded],
            self::Expired, self::Cancelled, self::Refunded => [],
        };
    }

    public function canBecome(self $to): bool
    {
        return in_array($to, $this->next(), true);
    }

    public function isPaid(): bool
    {
        return in_array($this, [
            self::Paid, self::InFulfilment, self::Shipped, self::Completed, self::PartiallyRefunded, self::Refunded,
        ], true);
    }

    /**
     * Stock is reserved when the order is written and released when it dies unpaid (storniert, abgelaufen).
     * A declined payment keeps it for the retry until the order expires; money returned does not put wheels
     * back on the shelf — a person restocks what really came back.
     */
    public function holdsStock(): bool
    {
        return ! in_array($this, [self::Draft, self::Cancelled, self::Expired], true);
    }

    public function labelDe(): string
    {
        return match ($this) {
            self::Draft => 'Entwurf',
            self::PendingPayment => 'Wartet auf Zahlung',
            self::Processing => 'Zahlung läuft',
            self::Paid => 'Bezahlt',
            self::InFulfilment => 'In Bearbeitung',
            self::Shipped => 'Versendet',
            self::Completed => 'Abgeschlossen',
            self::Failed => 'Fehlgeschlagen',
            self::Expired => 'Abgelaufen',
            self::Cancelled => 'Storniert',
            self::PartiallyRefunded => 'Teilweise erstattet',
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
            self::Processing => ['label' => 'Zahlung läuft', 'tone' => 'warn'],
            self::Paid, self::InFulfilment, self::Shipped, self::Completed => ['label' => 'Bezahlt', 'tone' => 'plain'],
            self::PartiallyRefunded => ['label' => 'Teilweise erstattet', 'tone' => 'neutral'],
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
            self::PartiallyRefunded => ['label' => 'Zu prüfen', 'tone' => 'warn'],
            self::Draft, self::PendingPayment, self::Processing, self::Failed, self::Expired, self::Cancelled, self::Refunded => ['label' => '–', 'tone' => 'plain'],
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
