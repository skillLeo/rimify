<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Support\GermanFormat;
use App\Support\Money;
use App\Support\Shipping;
use App\Support\WheelTitle;

/**
 * The product page's structured data for search engines (his admin item 14, D-305): schema.org, as JSON-LD in the page's
 * head — a ProductGroup for the Felge, one Product per size and colour the shop sells, each with its own Offer.
 *
 * Only what is on record goes in (R-17): the name the shop shows, the brand, the description where one is written, the
 * photographs where there are some (never the outline drawing), each size's SKU, EAN, price and availability (D-299).
 * A rating only where buyers' visible reviews make one (ReviewSummary writes it, no form can, § 5 UWG). Shipping only
 * where Einstellungen › Verkäufer & Versand gives a price; the delivery time and a return policy are left out — the
 * settings hold no split into handling and transit, and no return policy is on record. Example data gets none: it is not
 * a product anyone can buy.
 */
final class ProductJsonLd
{
    private const AVAILABLE = 'https://schema.org/InStock';

    private const NOT_AVAILABLE = 'https://schema.org/OutOfStock';

    /**
     * The structured data for one Felge as its page shows it, or null where it gets none. `$evenForDemo` is the admin's
     * look at what a real rim's page would carry (his admin item 14): the shop's own pages never pass it.
     *
     * @return array<string, mixed>|null
     */
    public static function for(WheelModel $wheel, string $url, bool $evenForDemo = false): ?array
    {
        if ($wheel->is_demo && ! $evenForDemo) {
            return null;
        }

        $wheel->loadMissing(['brand', 'finishes', 'configs']);
        $name = WheelTitle::full($wheel);
        $finishes = $wheel->finishes->keyBy('id');
        $shipping = Shipping::current();
        $variants = [];
        $images = [];

        foreach ($wheel->finishes as $finish) {
            $image = self::image($finish);

            if ($image !== null) {
                $images[] = $image;
            }
        }

        foreach ($wheel->configs->sortBy(['diameter_in', 'width_in', 'et_mm', 'id'])->values() as $config) {
            /** @var WheelFinish|null $finish */
            $finish = $finishes->get($config->wheel_finish_id);
            $variants[] = self::variant($config, $finish, $name, $url, $shipping);
        }

        if ($variants === []) {
            return null;
        }

        $description = trim((string) $wheel->description_de);
        $data = [
            '@context' => 'https://schema.org',
            '@type' => 'ProductGroup',
            'name' => $name,
            'productGroupID' => (string) $wheel->slug,
            'url' => $url,
            'brand' => ['@type' => 'Brand', 'name' => (string) $wheel->brand->name],
        ];

        if ($description !== '') {
            $data['description'] = $description;
        }

        if ($images !== []) {
            $data['image'] = array_values(array_unique($images));
        }

        $data['variesBy'] = $wheel->finishes->count() > 1 ? ['https://schema.org/size', 'https://schema.org/color'] : ['https://schema.org/size'];

        // What the buyers' visible reviews add up to, and nothing where there are none.
        if ($wheel->rating !== null && $wheel->rating_count > 0) {
            $data['aggregateRating'] = [
                '@type' => 'AggregateRating',
                'ratingValue' => number_format($wheel->rating, 1, '.', ''),
                'reviewCount' => $wheel->rating_count,
                'bestRating' => '5',
                'worstRating' => '1',
            ];
        }

        $data['hasVariant'] = $variants;

        return $data;
    }

    /**
     * The JSON as it stands in the page: no `</script>` can end the block early, and no `&` or `<` reads as markup.
     *
     * @param  array<string, mixed>  $data
     */
    public static function encode(array $data): string
    {
        return json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_THROW_ON_ERROR);
    }

    /**
     * The block as a person pastes it into Google's Rich Results Test („Code“): the page's own escaping, set out on lines,
     * inside its script tag.
     *
     * @param  array<string, mixed>  $data
     */
    public static function snippet(array $data): string
    {
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_THROW_ON_ERROR);

        return "<script type=\"application/ld+json\">\n{$json}\n</script>";
    }

    /** @return array<string, mixed> */
    private static function variant(WheelConfig $config, ?WheelFinish $finish, string $name, string $url, Shipping $shipping): array
    {
        $size = GermanFormat::wheelSize((float) $config->width_in, (float) $config->diameter_in, (int) $config->et_mm);
        $colour = $finish === null ? null : trim((string) $finish->name_de);
        $price = Money::fromMinor((int) $config->price_cents, (string) ($config->currency ?: 'EUR'));

        $offer = [
            '@type' => 'Offer',
            'url' => $url.'?groesse='.$config->id,
            'price' => $price->toDecimal(),
            'priceCurrency' => $price->currency(),
            'availability' => $config->available ? self::AVAILABLE : self::NOT_AVAILABLE,
            'itemCondition' => 'https://schema.org/NewCondition',
        ];

        // One rim as the basket would ship it to Germany — only where a price is given.
        $shippingCents = $shipping->forSubtotal((int) $config->price_cents);

        if ($shippingCents !== null) {
            $offer['shippingDetails'] = [
                '@type' => 'OfferShippingDetails',
                'shippingRate' => ['@type' => 'MonetaryAmount', 'value' => Money::fromMinor($shippingCents, $price->currency())->toDecimal(), 'currency' => $price->currency()],
                'shippingDestination' => ['@type' => 'DefinedRegion', 'addressCountry' => Shipping::DOMESTIC],
            ];
        }

        $variant = [
            '@type' => 'Product',
            'name' => trim($name.' '.$size.($colour === null || $colour === '' ? '' : ' '.$colour)),
            'sku' => (string) $config->sku,
            'size' => $size,
        ];

        $ean = $config->getAttribute('ean');

        if (is_string($ean) && preg_match('/^\d{8,14}$/', $ean) === 1) {
            $variant['gtin'] = $ean;
        }

        if ($colour !== null && $colour !== '') {
            $variant['color'] = $colour;
        }

        $image = $finish === null ? null : self::image($finish);

        if ($image !== null) {
            $variant['image'] = $image;
        }

        $variant['offers'] = $offer;

        return $variant;
    }

    /** The finish's own photograph at its largest width, in the format every reader takes — never a drawing. */
    private static function image(WheelFinish $finish): ?string
    {
        $manifest = $finish->image_manifest;

        if (! is_array($manifest) || ($manifest['kind'] ?? null) === 'placeholder') {
            return null;
        }

        $base = $manifest['base'] ?? null;
        $widths = $manifest['widths'] ?? null;
        $format = $manifest['fallback'] ?? null;

        if (! is_string($base) || ! is_array($widths) || $widths === [] || ! is_string($format) || $format === 'svg') {
            return null;
        }

        $path = $base.'-'.max(array_map('intval', $widths)).'.'.$format;

        return str_starts_with($path, '/') ? url($path) : $path;
    }
}
