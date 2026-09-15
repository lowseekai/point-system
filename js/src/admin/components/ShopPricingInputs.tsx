import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Switch from 'flarum/common/components/Switch';

interface ShopPricingAttrs extends ComponentAttrs {
  state?: Record<string, any>;
  onchange?: (state: Record<string, any>) => void;
}

/**
 * Shared catalog metadata form for all decoration families.
 */
export default class ShopPricingInputs extends Component<ShopPricingAttrs> {
  view() {
    const s = this.attrs.state || {};
    const set = (key: string, value: any) => {
      s[key] = value;
      this.attrs.onchange?.(s);
      m.redraw();
    };
    const t = (key: string) => app.translator.trans('ramon-point-system.admin.shop_pricing.' + key);

    return (
      <fieldset className="PointSystemAdmin-shopPricing">
        <legend>{t('legend')}</legend>
        <div className="PointSystemAdmin-shopPricing-toggles">
          <Switch state={!!s.isRecommended} onchange={(value: boolean) => set('isRecommended', value)}>
            {t('recommended')}
          </Switch>
          <Switch state={!!s.isHot} onchange={(value: boolean) => set('isHot', value)}>
            {t('hot')}
          </Switch>
        </div>

        <div className="PointSystemAdmin-shopPricing-grid">
          <div className="Form-group">
            <label>{t('discount_percent')}</label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              className="FormControl"
              value={s.discountPercent ?? 0}
              oninput={(e: Event) => set('discountPercent', Math.max(0, Math.min(100, Number((e.target as HTMLInputElement).value) || 0)))}
            />
          </div>
          <div className="Form-group">
            <label>{t('discount_days')}</label>
            <input
              type="number"
              min="0"
              step="1"
              className="FormControl"
              value={s.discountDays ?? 0}
              oninput={(e: Event) => set('discountDays', Math.max(0, Number((e.target as HTMLInputElement).value) || 0))}
            />
          </div>
          <div className="Form-group">
            <label>{t('purchase_type')}</label>
            <select className="FormControl" value={s.purchaseType || 'onetime'} onchange={(e: Event) => set('purchaseType', (e.target as HTMLSelectElement).value)}>
              <option value="onetime">{t('onetime')}</option>
              <option value="monthly">{t('monthly')}</option>
              <option value="yearly">{t('yearly')}</option>
            </select>
          </div>
        </div>
        <p className="helpText">{t('help')}</p>
      </fieldset>
    );
  }
}
