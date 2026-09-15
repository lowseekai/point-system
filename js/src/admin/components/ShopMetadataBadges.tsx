import app from 'flarum/admin/app';
import { pointsLabel } from '../../common/utils/pointsLabel';

export default function ShopMetadataBadges({ deco }: { deco: any }) {
  const original = Number(deco.attribute('originalPrice') ?? deco.attribute('price') ?? 0);
  const effective = Number(deco.attribute('effectivePrice') ?? deco.attribute('price') ?? 0);
  const discount = Number(deco.attribute('discountPercent') ?? 0);
  const purchaseType = String(deco.attribute('purchaseType') || 'onetime');
  const endsAt = deco.attribute('discountEndsAt');
  const typeLabel =
    purchaseType === 'monthly'
      ? app.translator.trans('ramon-point-system.admin.shop_pricing.monthly')
      : purchaseType === 'yearly'
        ? app.translator.trans('ramon-point-system.admin.shop_pricing.yearly')
        : app.translator.trans('ramon-point-system.admin.shop_pricing.onetime');

  return (
    <div className="PointSystemAdmin-shopMeta">
      <span className="PointSystemAdmin-tag">
        {effective.toLocaleString()} {pointsLabel(app)}
        {effective < original && <del>{original.toLocaleString()}</del>}
      </span>
      <span className="PointSystemAdmin-tag">{typeLabel}</span>
      {!!deco.attribute('isRecommended') && (
        <span className="PointSystemAdmin-tag PointSystemAdmin-tag--recommended">
          <i className="fas fa-star" /> {app.translator.trans('ramon-point-system.admin.shop_pricing.recommended')}
        </span>
      )}
      {!!deco.attribute('isHot') && (
        <span className="PointSystemAdmin-tag PointSystemAdmin-tag--hot">
          <i className="fas fa-fire" /> {app.translator.trans('ramon-point-system.admin.shop_pricing.hot')}
        </span>
      )}
      {discount > 0 && effective < original && (
        <span className="PointSystemAdmin-tag PointSystemAdmin-tag--discount">-{discount}%</span>
      )}
      {endsAt && discount > 0 && (
        <span className="PointSystemAdmin-tag">
          {app.translator.trans('ramon-point-system.admin.shop_pricing.discount_ends', {
            date: new Date(endsAt).toLocaleDateString(),
          })}
        </span>
      )}
    </div>
  );
}
