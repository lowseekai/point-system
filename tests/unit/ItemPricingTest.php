<?php

declare(strict_types=1);

namespace Ramon\PointSystem\Tests\unit;

use Carbon\Carbon;
use PHPUnit\Framework\TestCase;
use Ramon\PointSystem\Model\AvatarDecoration;
use Ramon\PointSystem\Model\ShopClaim;
use Ramon\PointSystem\Support\ItemPricing;

class ItemPricingTest extends TestCase
{
    public function test_permanent_claim_is_detected_from_legacy_and_current_rows(): void
    {
        $legacy = new ShopClaim();
        $legacy->expires_at = null;
        $legacy->purchase_type = null;

        $current = new ShopClaim();
        $current->expires_at = null;
        $current->purchase_type = ItemPricing::TYPE_ONETIME;

        $this->assertTrue(ItemPricing::isPermanentEntitlement($legacy));
        $this->assertTrue(ItemPricing::isPermanentEntitlement($current));
    }

    public function test_timed_purchase_does_not_replace_permanent_entitlement(): void
    {
        $item = new AvatarDecoration();
        $item->purchase_type = ItemPricing::TYPE_MONTHLY;

        $claim = new ShopClaim();
        $claim->purchase_type = ItemPricing::TYPE_ONETIME;
        $claim->expires_at = null;

        $now = Carbon::create(2026, 9, 15, 12);

        $this->assertNull(ItemPricing::nextExpiry($item, $claim, $now));
    }

    public function test_timed_renewal_extends_an_active_term(): void
    {
        $item = new AvatarDecoration();
        $item->purchase_type = ItemPricing::TYPE_MONTHLY;

        $claim = $this->timedClaim(ItemPricing::TYPE_MONTHLY, Carbon::create(2026, 9, 20, 12));

        $now = Carbon::create(2026, 9, 15, 12);

        $this->assertSame(
            '2026-10-20 12:00:00',
            ItemPricing::nextExpiry($item, $claim, $now)?->format('Y-m-d H:i:s')
        );
    }

    public function test_expired_timed_term_renews_from_now(): void
    {
        $item = new AvatarDecoration();
        $item->purchase_type = ItemPricing::TYPE_YEARLY;

        $claim = $this->timedClaim(ItemPricing::TYPE_YEARLY, Carbon::create(2026, 8, 1, 12));

        $now = Carbon::create(2026, 9, 15, 12);

        $this->assertSame(
            '2027-09-15 12:00:00',
            ItemPricing::nextExpiry($item, $claim, $now)?->format('Y-m-d H:i:s')
        );
    }

    private function timedClaim(string $purchaseType, Carbon $expiresAt): ShopClaim
    {
        $claim = new class extends ShopClaim {
            private array $testAttributes = [];

            public function setTestAttributes(array $attributes): void
            {
                $this->testAttributes = $attributes;
            }

            public function getAttribute($key)
            {
                if (array_key_exists($key, $this->testAttributes)) {
                    return $this->testAttributes[$key];
                }

                return parent::getAttribute($key);
            }
        };

        $claim->setTestAttributes([
            'purchase_type' => $purchaseType,
            'expires_at' => $expiresAt,
        ]);

        return $claim;
    }
}
