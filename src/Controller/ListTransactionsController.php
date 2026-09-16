<?php

declare(strict_types=1);

namespace Ramon\PointSystem\Controller;

use Flarum\Http\RequestUtil;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Ramon\PointSystem\Model\PointTransaction;

/**
 * GET /api/point-system/transactions
 *
 * Returns the authenticated user's own point ledger, newest first.
 */
class ListTransactionsController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();

        $query = (array) $request->getQueryParams();
        $offset = max(0, (int) ($query['offset'] ?? 0));
        $limit = min(100, max(1, (int) ($query['limit'] ?? 25)));

        $builder = PointTransaction::query()
            ->where('user_id', $actor->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        $total = (clone $builder)->count();
        $transactions = $builder->offset($offset)->limit($limit)->get();

        return new JsonResponse([
            'data' => $transactions->map(fn (PointTransaction $tx) => [
                'id' => (int) $tx->id,
                'amount' => (int) $tx->amount,
                'reason' => (string) $tx->reason,
                'referenceType' => $tx->reference_type !== null ? (string) $tx->reference_type : null,
                'referenceId' => $tx->reference_id !== null ? (int) $tx->reference_id : null,
                'createdAt' => optional($tx->created_at)?->toIso8601String(),
            ])->values()->toArray(),
            'meta' => [
                'total' => (int) $total,
                'offset' => $offset,
                'limit' => $limit,
            ],
        ]);
    }
}
