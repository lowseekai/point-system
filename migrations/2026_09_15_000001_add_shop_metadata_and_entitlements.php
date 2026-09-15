<?php

declare(strict_types=1);

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

/**
 * Adds catalog labels, discount rules and purchase-term metadata to the five
 * decoration families. Claims keep their own entitlement term and expiry so
 * later catalog edits cannot change an already purchased item.
 */
return [
    'up' => function (Builder $schema) {
        $decorationTables = [
            'point_system_avatar_decorations',
            'point_system_name_decorations',
            'point_system_cover_decorations',
            'point_system_title_decorations',
            'point_system_post_highlight_decorations',
        ];

        foreach ($decorationTables as $table) {
            if (! $schema->hasTable($table)) {
                continue;
            }

            $schema->table($table, function (Blueprint $t) use ($schema, $table) {
                if (! $schema->hasColumn($table, 'is_recommended')) {
                    $t->boolean('is_recommended')->default(false);
                }
                if (! $schema->hasColumn($table, 'is_hot')) {
                    $t->boolean('is_hot')->default(false);
                }
                if (! $schema->hasColumn($table, 'discount_percent')) {
                    $t->unsignedTinyInteger('discount_percent')->default(0);
                }
                if (! $schema->hasColumn($table, 'discount_days')) {
                    $t->unsignedInteger('discount_days')->default(0);
                }
                if (! $schema->hasColumn($table, 'discount_started_at')) {
                    $t->dateTime('discount_started_at')->nullable();
                }
                if (! $schema->hasColumn($table, 'purchase_type')) {
                    $t->string('purchase_type', 16)->default('onetime');
                }
            });
        }

        if ($schema->hasTable('point_system_claims')) {
            $schema->table('point_system_claims', function (Blueprint $t) use ($schema) {
                if (! $schema->hasColumn('point_system_claims', 'purchase_type')) {
                    $t->string('purchase_type', 16)->default('onetime');
                }
                if (! $schema->hasColumn('point_system_claims', 'expires_at')) {
                    $t->dateTime('expires_at')->nullable();
                }
            });
        }
    },
    'down' => function (Builder $schema) {
        $decorationTables = [
            'point_system_avatar_decorations',
            'point_system_name_decorations',
            'point_system_cover_decorations',
            'point_system_title_decorations',
            'point_system_post_highlight_decorations',
        ];

        $decorationColumns = [
            'is_recommended',
            'is_hot',
            'discount_percent',
            'discount_days',
            'discount_started_at',
            'purchase_type',
        ];

        foreach ($decorationTables as $table) {
            if (! $schema->hasTable($table)) {
                continue;
            }

            $schema->table($table, function (Blueprint $t) use ($schema, $table, $decorationColumns) {
                foreach ($decorationColumns as $column) {
                    if ($schema->hasColumn($table, $column)) {
                        $t->dropColumn($column);
                    }
                }
            });
        }

        if ($schema->hasTable('point_system_claims')) {
            $schema->table('point_system_claims', function (Blueprint $t) use ($schema) {
                if ($schema->hasColumn('point_system_claims', 'purchase_type')) {
                    $t->dropColumn('purchase_type');
                }
                if ($schema->hasColumn('point_system_claims', 'expires_at')) {
                    $t->dropColumn('expires_at');
                }
            });
        }
    },
];
