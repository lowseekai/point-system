// @ts-nocheck
import app from 'flarum/admin/app';
import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import AvailabilityInputs from './AvailabilityInputs';
import ShopPricingInputs from './ShopPricingInputs';
import { pointsLabel } from '../../common/utils/pointsLabel';
import { cssVar } from '../../common/utils/contrastClass';

const EMPTY_AVAILABILITY = () => ({
  maxClaims: null,
  claimCount: 0,
  availableFrom: '',
  availableUntil: '',
  isListed: true,
  allowedGroupIds: [],
});

export default class CreateTitleDecorationModal extends Modal {
  static dismissibleOptions = {
    viaEscKey: true,
    viaCloseButton: true,
    viaBackdropClick: false,
  };

  draft: any = {
    name: '',
    titleText: '',
    description: '',
    color: cssVar('--primary-color', '#6cc04a'),
    price: 100,
    customCss: '',
    availability: EMPTY_AVAILABILITY(),
    pricing: {
      isRecommended: false,
      isHot: false,
      discountPercent: 0,
      discountDays: 0,
      purchaseType: 'onetime',
    },
  };
  saving = false;

  oninit(vnode: any) {
    super.oninit(vnode);
    const deco = this.attrs.deco;
    if (!deco) return;

    this.draft = {
      name: deco.attribute('name') || '',
      titleText: deco.attribute('titleText') || '',
      description: deco.attribute('description') || '',
      color: deco.attribute('color') || '',
      price: Number(deco.attribute('price') || 0),
      customCss: deco.attribute('customCss') || '',
      availability: {
        maxClaims: deco.attribute('maxClaims'),
        claimCount: Number(deco.attribute('claimCount') || 0),
        availableFrom: deco.attribute('availableFrom') || '',
        availableUntil: deco.attribute('availableUntil') || '',
        isListed: deco.attribute('isListed') !== false,
        allowedGroupIds: Array.isArray(deco.attribute('allowedGroupIds')) ? deco.attribute('allowedGroupIds') : [],
      },
      pricing: {
        isRecommended: !!deco.attribute('isRecommended'),
        isHot: !!deco.attribute('isHot'),
        discountPercent: Number(deco.attribute('discountPercent') || 0),
        discountDays: Number(deco.attribute('discountDays') || 0),
        purchaseType: deco.attribute('purchaseType') || 'onetime',
      },
    };
  }

  className() {
    return 'EditDecorationModal CreateDecorationModal Modal--medium';
  }

  title() {
    return this.attrs.deco
      ? app.translator.trans('ramon-point-system.admin.title.edit_title', { name: this.attrs.deco.attribute('name') || '' })
      : app.translator.trans('ramon-point-system.admin.title.create_title');
  }

  content() {
    const draft = this.draft;
    const t = (k: string) => app.translator.trans('ramon-point-system.admin.title.' + k);

    return (
      <div className="Modal-body">
        <div className="PointSystemAdmin-preview">
          <span className="ps-title-preview" style={draft.color ? `--ps-title-color:${draft.color}` : null}>
            {draft.titleText || '—'}
          </span>
        </div>

        <div className="Form-group">
          <label>{t('field_name')}</label>
          <input className="FormControl" value={draft.name} oninput={(e: Event) => (draft.name = (e.target as HTMLInputElement).value)} autofocus />
        </div>

        <div className="Form-group">
          <label>{t('field_title_text')}</label>
          <input
            className="FormControl"
            maxlength="60"
            value={draft.titleText}
            oninput={(e: Event) => (draft.titleText = (e.target as HTMLInputElement).value)}
          />
          <p className="helpText">{t('field_title_text_help')}</p>
        </div>

        <div className="Form-group">
          <label>{t('field_color')}</label>
          <input className="FormControl" value={draft.color} oninput={(e: Event) => (draft.color = (e.target as HTMLInputElement).value)} />
          <p className="helpText">{t('field_color_help')}</p>
        </div>

        <div className="Form-group">
          <label>
            {t('field_price')} ({pointsLabel(app)})
          </label>
          <input
            type="number"
            min="0"
            className="FormControl"
            value={draft.price}
            oninput={(e: Event) => (draft.price = Number((e.target as HTMLInputElement).value))}
          />
        </div>

        <div className="Form-group">
          <label>{t('field_description')}</label>
          <input
            className="FormControl"
            value={draft.description}
            oninput={(e: Event) => (draft.description = (e.target as HTMLInputElement).value)}
          />
        </div>

        <div className="Form-group">
          <label>{t('field_css')}</label>
          <textarea
            className="FormControl PointSystemAdmin-css"
            rows={4}
            placeholder="font-weight: 700; text-transform: uppercase;"
            value={draft.customCss}
            oninput={(e: Event) => (draft.customCss = (e.target as HTMLTextAreaElement).value)}
          />
          <p className="helpText">{t('field_css_help')}</p>
        </div>

        <ShopPricingInputs state={draft.pricing} onchange={(s: any) => (draft.pricing = s)} />
        <AvailabilityInputs state={draft.availability} onchange={(s: any) => (draft.availability = s)} />

        <div className="Form-group EditDecorationModal-actions">
          <Button
            className="Button Button--primary"
            loading={this.saving}
            disabled={this.saving || !draft.name.trim() || !draft.titleText.trim()}
            onclick={() => this.commit()}
          >
            <i className={this.attrs.deco ? 'fas fa-save' : 'fas fa-plus'} />{' '}
            {this.attrs.deco ? app.translator.trans('ramon-point-system.admin.save') : t('create')}
          </Button>
          <Button className="Button" disabled={this.saving} onclick={() => this.hide()}>
            {app.translator.trans('ramon-point-system.admin.cancel')}
          </Button>
        </div>
      </div>
    );
  }

  async commit() {
    const draft = this.draft;
    if (!draft.name.trim() || !draft.titleText.trim()) return;
    this.saving = true;
    m.redraw();
    try {
      const av = draft.availability || EMPTY_AVAILABILITY();
      const pricing = draft.pricing || {};
      const attrs = {
        name: draft.name.trim(),
        titleText: draft.titleText.trim(),
        description: draft.description || null,
        color: draft.color || null,
        customCss: draft.customCss || null,
        price: Number(draft.price) || 0,
        maxClaims: av.maxClaims,
        availableFrom: av.availableFrom || null,
        availableUntil: av.availableUntil || null,
        isListed: !!av.isListed,
        allowedGroupIds: Array.isArray(av.allowedGroupIds) ? av.allowedGroupIds : [],
        isRecommended: !!pricing.isRecommended,
        isHot: !!pricing.isHot,
        discountPercent: Number(pricing.discountPercent) || 0,
        discountDays: Number(pricing.discountDays) || 0,
        purchaseType: pricing.purchaseType || 'onetime',
      };
      if (this.attrs.deco) {
        await this.attrs.deco.save(attrs);
        if (this.attrs.onSaved) this.attrs.onSaved();
        app.alerts.show({ type: 'success' }, app.translator.trans('ramon-point-system.admin.saved_message'));
      } else {
        await app.store.createRecord('point-system-title-decorations').save({ ...attrs, isEnabled: true });
        if (this.attrs.onCreated) this.attrs.onCreated();
        app.alerts.show({ type: 'success' }, app.translator.trans('ramon-point-system.admin.title.created'));
      }
      this.hide();
    } catch (e: any) {
      app.alerts.show({ type: 'error' }, e?.response?.errors?.[0]?.detail || 'Error');
    } finally {
      this.saving = false;
      m.redraw();
    }
  }
}
