<?php

declare(strict_types=1);

namespace App\Exceptions;

use App\Enums\OrderStatus;
use LogicException;

/**
 * An order asked to move where its state machine does not go (OrderStatus::next) — or towards fulfilment while
 * its payment is flagged. Thrown by the Order model on save: an illegal move is impossible there, not only
 * hidden in a page.
 */
final class IllegalOrderTransition extends LogicException
{
    public static function between(string $orderNumber, OrderStatus $from, OrderStatus $to): self
    {
        return new self(sprintf('Order %s cannot move from %s to %s.', $orderNumber, $from->value, $to->value));
    }

    public static function flagged(string $orderNumber, string $flag): self
    {
        return new self(sprintf('Order %s is held back from fulfilment: %s', $orderNumber, $flag));
    }
}
