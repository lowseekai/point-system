<?php

declare(strict_types=1);

namespace Ramon\PointSystem\Support;

use Carbon\Carbon;
use Flarum\Database\AbstractModel;
use Ramon\PointSystem\Model\ShopClaim;

/**
 * Centralizes catalog pricing and user entitlement terms.
 *
 * The base `price` remains the admin-entered price. The effective price is
 * calculated at request time so discount expiry cannot be bypassed by a stale
 * browser payload.
 */
final class ItemPricing
{
    public const TYPE_ONETIME = 'onetime';
    public const TYPE_MONTHLY = 'monthly';
    public const TYPE_YEARLY  = 'yearly';

    public static function purchaseType(AbstractModel $item): string
    {
        $type = (string) ($item->purchase_type ?? self::TYPE_ONETIME);

        return in_array($type, [self::TYPE_ONETIME, self::TYPE_MONTHLY, self::TYPE_YEARLY], true)
            ? $type
            : self::TYPE_ONETIME;
    }

    public static function effectivePrice(AbstractModel $item, ?Carbon $now = null): int
    {
        $price = max(0, (int) ($item->price ?? 0));
        $percent = self::activeDiscountPercent($item, $now);

        if ($percent <= 0 || $price <= 0) {
            return $price;
        }

        return max(0, (int) floor($price * (100 - $percent) / 100));
    }

    public static function activeDiscountPercent(AbstractModel $item, ?Carbon $now = null): int
    {
        $percent = max(0, min(100, (int) ($item->discount_percent ?? 0)));
        $days = max(0, (int) ($item->discount_days ?? 0));
        $startedAt = $item->discount_started_at ?? null;

        if ($percent <= 0 || $days <= 0 || ! $startedAt instanceof \DateTimeInterface) {
            return 0;
        }

        $now ??= Carbon::now();
        $started = Carbon::instance($startedAt);
        $endsAt = $started->copy()->addDays($days);

        return $now->lt($endsAt) ? $percent : 0;
    }

    public static function discountEndsAt(AbstractModel $item): ?Carbon
    {
        $days = max(0, (int) ($item->discount_days ?? 0));
        $startedAt = $item->discount_started_at ?? null;

        if ($days <= 0 || ! $startedAt instanceof \DateTimeInterface) {
            return null;
        }

        return Carbon::instance($startedAt)->addDays($days);
    }

    /**
     * Returns the new claim expiry. A permanent entitlement is never
     * downgraded by changing the catalog item to a timed purchase later.
     */
    public static function nextExpiry(AbstractModel $item, ?ShopClaim $existing, Carbon $now): ?Carbon
    {
        $type = self::purchaseType($item);
        if ($type === self::TYPE_ONETIME) {
            return null;
        }

        if (self::isPermanentEntitlement($existing)) {
            return null;
        }

        $days = $type === self::TYPE_YEARLY ? 365 : 30;
        $base = $existing?->expires_at instanceof \DateTimeInterface
            && Carbon::instance($existing->expires_at)->gt($now)
            ? Carbon::instance($existing->expires_at)
            : $now;

        return $base->copy()->addDays($days);
    }

    /**
     * A permanent claim is stronger than the current catalog term. Editing
     * an item from permanent to timed must never silently downgrade users.
     */
    public static function isPermanentEntitlement(?ShopClaim $claim): bool
    {
        return $claim !== null
            && $claim->expires_at === null
            && ($claim->purchase_type === null
                || $claim->purchase_type === ''
                || $claim->purchase_type === self::TYPE_ONETIME);
    }

    public static function fillFromAttrs(AbstractModel $item, array $attrs): void
    {
        if (array_key_exists('isRecommended', $attrs)) {
            $item->is_recommended = (bool) $attrs['isRecommended'];
        }
        if (array_key_exists('isHot', $attrs)) {
            $item->is_hot = (bool) $attrs['isHot'];
        }

        $discountChanged = false;
        if (array_key_exists('discountPercent', $attrs)) {
            $value = max(0, min(100, (int) $attrs['discountPercent']));
            $discountChanged = $discountChanged || $value !== (int) ($item->discount_percent ?? 0);
            $item->discount_percent = $value;
        }
        if (array_key_exists('discountDays', $attrs)) {
            $value = max(0, (int) $attrs['discountDays']);
            $discountChanged = $discountChanged || $value !== (int) ($item->discount_days ?? 0);
            $item->discount_days = $value;
        }
        if (array_key_exists('purchaseType', $attrs)) {
            $value = (string) $attrs['purchaseType'];
            $item->purchase_type = in_array($value, [
                self::TYPE_ONETIME,
                self::TYPE_MONTHLY,
                self::TYPE_YEARLY,
            ], true) ? $value : self::TYPE_ONETIME;
        }

        if ($discountChanged || ($item->exists === false && (($item->discount_percent ?? 0) > 0))) {
            $item->discount_started_at = (int) ($item->discount_percent ?? 0) > 0
                && (int) ($item->discount_days ?? 0) > 0
                ? Carbon::now()
                : null;
        }
    }

    public static function claimIsActive(ShopClaim $claim, ?Carbon $now = null): bool
    {
        if ($claim->expires_at === null) {
            return true;
        }

        $now ??= Carbon::now();

        return Carbon::instance($claim->expires_at)->gt($now);
    }
}
