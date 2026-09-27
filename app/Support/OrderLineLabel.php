<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\TyreVariant;
use App\Models\WheelConfig;

/**
 * An order line's description as the customer read it at the sale — frozen on the line, because
 * joining to the catalogue later would answer what the product is called today, which is the wrong
 * question on an invoice.
 */
final class OrderLineLabel
{
    /** `Bergsteig Gipfel · Hellgrau · 8,5J × 19 · ET 35 · 5/112 …` */
    public static function wheel(WheelConfig $config): string
    {
        $model = $config->wheelModel;
        $finish = $config->wheelFinish;

        return trim(sprintf(
            '%s %s · %s · %s',
            $model->brand->name,
            $model->name,
            $finish->name_de,
            GermanFormat::wheelLabel(
                (float) $config->width_in,
                (float) $config->diameter_in,
                (int) $config->et_mm,
                (int) $config->bolt_holes,
                (float) $config->bolt_circle_mm,
                (float) $config->centre_bore_mm,
            ),
        ));
    }

    public static function tyre(TyreVariant $tyre): string
    {
        return trim(sprintf(
            '%s %s · %s · %s',
            $tyre->brand->name,
            $tyre->name,
            ucfirst($tyre->season),
            GermanFormat::tyreSize(
                (int) $tyre->width_mm,
                (int) $tyre->aspect,
                (float) $tyre->diameter_in,
                (int) $tyre->load_index,
                $tyre->speed_symbol,
            ),
        ));
    }
}
