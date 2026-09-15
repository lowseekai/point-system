<?php

declare(strict_types=1);

namespace Ramon\PointSystem\Api\Resource;

use Flarum\Api\Context;
use Flarum\Api\Schema;
use Ramon\PointSystem\Support\ItemPricing;

/**
 * Shared catalog metadata fields for the five decoration resources.
 */
final class ShopPricingFields
{
    public static function fields(callable $managerOnly): array
    {
        return [
            Schema\Boolean::make('isRecommended')->property('is_recommended')
                ->writable($managerOnly),
            Schema\Boolean::make('isHot')->property('is_hot')
                ->writable($managerOnly),
            Schema\Integer::make('discountPercent')->property('discount_percent')
                ->writable($managerOnly),
            Schema\Integer::make('discountDays')->property('discount_days')
                ->writable($managerOnly),
            Schema\DateTime::make('discountStartedAt')->property('discount_started_at')
                ->nullable(),
            Schema\DateTime::make('discountEndsAt')
                ->nullable()
                ->get(fn ($item) => ItemPricing::discountEndsAt($item)),
            Schema\Integer::make('effectivePrice')
                ->get(fn ($item) => ItemPricing::effectivePrice($item)),
            Schema\Integer::make('originalPrice')
                ->get(fn ($item) => max(0, (int) ($item->price ?? 0))),
            Schema\Str::make('purchaseType')->property('purchase_type')
                ->writable($managerOnly),
        ];
    }

    public static function fillFromAttrs(\Flarum\Database\AbstractModel $item, array $attrs): void
    {
        \Ramon\PointSystem\Support\ItemPricing::fillFromAttrs($item, $attrs);
    }
}
