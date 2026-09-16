import app from 'flarum/forum/app';
import UserPage from 'flarum/forum/components/UserPage';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import { pointsLabel } from '../../common/utils/pointsLabel';

/**
 * The authenticated user's point ledger. The API is deliberately scoped to
 * the current actor, and this component applies the same self-only gate as
 * UserTradesPage so a copied profile URL cannot show a confusing page.
 */
export default class UserPointTransactionsPage extends UserPage {
  loading = true;
  transactions: any[] = [];
  total = 0;
  offset = 0;
  limit = 25;
  err = '';

  oninit(vnode: any) {
    super.oninit(vnode);
    this.loadUser(m.route.param('username'));
  }

  show(user: any) {
    super.show(user);
    const me = app.session.user;
    if (!me || Number(me.id?.()) !== Number(user.id?.())) {
      m.route.set(app.route.user(user));
      return;
    }

    const title = app.translator.trans('ramon-point-system.forum.point_transactions_page.title') as string;
    app.history.push('point-transactions', title);
    app.setTitle(title);
    this.load();
  }

  async load(offset = this.offset) {
    this.loading = true;
    this.err = '';
    this.offset = Math.max(0, offset);
    m.redraw();

    try {
      const apiUrl = (app.forum.attribute('apiUrl') || '/api').replace(/\/+$/, '');
      const res: any = await app.request({
        method: 'GET',
        url: `${apiUrl}/point-system/transactions`,
        params: { offset: this.offset, limit: this.limit },
      });
      this.transactions = Array.isArray(res?.data) ? res.data : [];
      this.total = Math.max(0, Number(res?.meta?.total || 0));
      this.offset = Math.max(0, Number(res?.meta?.offset ?? this.offset));
      this.limit = Math.max(1, Number(res?.meta?.limit ?? this.limit));
    } catch (e: any) {
      this.err =
        e?.response?.errors?.[0]?.detail ||
        (app.translator.trans('ramon-point-system.forum.point_transactions_page.load_failed') as string);
    } finally {
      this.loading = false;
      m.redraw();
    }
  }

  content() {
    const t = (key: string, values?: any) =>
      app.translator.trans('ramon-point-system.forum.point_transactions_page.' + key, values);

    if (this.loading && this.transactions.length === 0) {
      return <LoadingIndicator />;
    }

    const hasPrevious = this.offset > 0;
    const hasNext = this.offset + this.transactions.length < this.total;

    return (
      <div className="PointSystemTransactionsPage PointSystemTransactionsPage--inProfile container">
        <header className="PointSystemTransactionsPage-header">
          <h1>
            <i className="fas fa-coins" aria-hidden="true" /> {t('title')}
          </h1>
          <p className="helpText">{t('subtitle')}</p>
        </header>

        {this.err && (
          <div className="PointSystemTransactionsPage-error" role="alert">
            <i className="fas fa-triangle-exclamation" aria-hidden="true" />
            <span>{this.err}</span>
            <Button className="Button Button--primary" icon="fas fa-redo" onclick={() => this.load()}>
              {t('retry')}
            </Button>
          </div>
        )}

        {!this.err && this.transactions.length === 0 ? (
          <div className="PointSystemTransactionsPage-empty">
            <i className="fas fa-receipt" aria-hidden="true" />
            <p>{t('empty')}</p>
          </div>
        ) : (
          <section className="PointSystemTransactionsPage-table" aria-label={t('title')}>
            <div className="PointSystemTransactionsPage-row PointSystemTransactionsPage-row--head" role="row">
              <span role="columnheader">{t('time')}</span>
              <span role="columnheader">{t('balance_change')}</span>
              <span role="columnheader">{t('reason')}</span>
              <span role="columnheader">{t('reference')}</span>
            </div>
            {this.transactions.map((transaction) => this.renderRow(transaction, t))}
          </section>
        )}

        {this.total > 0 && (
          <footer className="PointSystemTransactionsPage-pagination">
            <Button
              className="Button Button--default"
              icon="fas fa-chevron-left"
              disabled={!hasPrevious || this.loading}
              onclick={() => this.load(Math.max(0, this.offset - this.limit))}
            >
              {t('prev')}
            </Button>
            <span>
              {t('page', {
                from: this.offset + 1,
                to: Math.min(this.offset + this.transactions.length, this.total),
                total: this.total,
              })}
            </span>
            <Button
              className="Button Button--default"
              icon="fas fa-chevron-right"
              disabled={!hasNext || this.loading}
              onclick={() => this.load(this.offset + this.limit)}
            >
              {t('next')}
            </Button>
          </footer>
        )}
      </div>
    );
  }

  renderRow(transaction: any, t: (key: string, values?: any) => any) {
    const amount = Number(transaction?.amount || 0);
    const amountClass = amount > 0 ? 'is-positive' : amount < 0 ? 'is-negative' : 'is-neutral';
    const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
    const amountText = `${sign}${Math.abs(amount).toLocaleString()} ${pointsLabel(app)}`;

    return (
      <div className="PointSystemTransactionsPage-row" role="row" key={`point-transaction-${transaction?.id}`}>
        <span
          className="PointSystemTransactionsPage-cell PointSystemTransactionsPage-cell--time"
          data-label={t('time')}
        >
          {this.formatTime(transaction?.createdAt)}
        </span>
        <strong
          className={`PointSystemTransactionsPage-cell PointSystemTransactionsPage-cell--amount ${amountClass}`}
          data-label={t('balance_change')}
        >
          {amountText}
        </strong>
        <span className="PointSystemTransactionsPage-cell" data-label={t('reason')}>
          {this.reasonLabel(transaction?.reason)}
        </span>
        <span
          className="PointSystemTransactionsPage-cell PointSystemTransactionsPage-cell--reference"
          data-label={t('reference')}
        >
          {this.referenceLabel(transaction)}
        </span>
      </div>
    );
  }

  reasonLabel(reason?: string | null): string {
    const labels: Record<string, string> = {
      'discussion.started': 'discussion_started',
      'post.posted': 'post_posted',
      'like.received': 'like_received',
      'like.given': 'like_given',
      'like.received.revert': 'like_received_revert',
      'like.given.revert': 'like_given_revert',
      'user.registered': 'user_registered',
      'user.daily_login': 'user_daily_login',
      'shop.claim': 'shop_claim',
      'tier.claim': 'tier_claim',
      'group.purchase': 'group_purchase',
      'admin.adjustment': 'admin_adjustment',
      'lottery.entry': 'lottery_entry',
      'lottery.entry.refund': 'lottery_entry_refund',
      'lottery.host_reward': 'lottery_host_reward',
      'red_packet.create': 'red_packet_create',
      'red_packet.claim': 'red_packet_claim',
      'red_packet.refund': 'red_packet_refund',
    };

    const key = labels[String(reason || '')];

    return key ? (app.translator.trans(`ramon-point-system.forum.point_transactions_page.reasons.${key}`) as string) : String(reason || '-');
  }

  referenceLabel(transaction: any): string {
    if (!transaction?.referenceType && !transaction?.referenceId) return '-';
    const type = this.referenceTypeLabel(String(transaction.referenceType || 'record'));
    const id = transaction.referenceId ? Number(transaction.referenceId) : null;

    return id
      ? (app.translator.trans('ramon-point-system.forum.point_transactions_page.reference_with_id', {
          type,
          id,
        }) as string)
      : type;
  }

  referenceTypeLabel(referenceType: string): string {
    const labels: Record<string, string> = {
      avatar_decoration: 'avatar_decoration',
      name_decoration: 'name_decoration',
      cover_decoration: 'cover_decoration',
      title_decoration: 'title_decoration',
      post_highlight_decoration: 'post_highlight_decoration',
      group_offer: 'group_offer',
      lottery: 'lottery',
      'doingfb-red-packet': 'red_packet',
      red_packet: 'red_packet',
      trade: 'trade',
      record: 'record',
    };

    const key = labels[referenceType];

    return key
      ? (app.translator.trans(`ramon-point-system.forum.point_transactions_page.references.${key}`) as string)
      : referenceType;
  }

  formatTime(iso?: string | null): string {
    if (!iso) return '-';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat(undefined, {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  }
}
