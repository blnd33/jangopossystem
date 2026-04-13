import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';
import api from '../services/api';

const TYPE_CONFIG = {
  sale:     { icon: '🧾', labelAr: 'بيع',       labelEn: 'Sale',          colorKey: 'info' },
  purchase: { icon: '📦', labelAr: 'شراء',      labelEn: 'Purchase',      colorKey: 'warning' },
  debt:     { icon: '💳', labelAr: 'دين',        labelEn: 'Debt',          colorKey: 'red' },
  payment:  { icon: '💵', labelAr: 'دفعة',       labelEn: 'Payment',       colorKey: 'success' },
  return:   { icon: '↩️', labelAr: 'مرتجع',     labelEn: 'Return',        colorKey: 'warning' },
};

const STATUS_COLORS = {
  completed: { bg: '#dcfce7', text: '#15803d' },
  paid:      { bg: '#dcfce7', text: '#15803d' },
  Received:  { bg: '#dcfce7', text: '#15803d' },
  refunded:  { bg: '#e0f2fe', text: '#0369a1' },
  unpaid:    { bg: '#fee2e2', text: '#b91c1c' },
  partial:   { bg: '#fef3c7', text: '#92400e' },
  Pending:   { bg: '#fef3c7', text: '#92400e' },
  Draft:     { bg: '#f1f5f9', text: '#64748b' },
  Approved:  { bg: '#e0f2fe', text: '#0369a1' },
  Cancelled: { bg: '#fee2e2', text: '#b91c1c' },
};

export default function History() {
  const { isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const { isMobile } = useWindowSize();

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(true);

  const [typeFilter, setType]   = useState('all');
  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  const L = (ar, en) => language === 'ar' ? ar : en;

  async function fetchHistory(p = 1, append = false) {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = { page: p, per_page: 30 };
      if (typeFilter !== 'all') params.type = typeFilter;
      if (search) params.search = search;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await api.history.getAll(params);

      if (append) {
        setData(prev => ({
          ...res,
          timeline: [...(prev?.timeline || []), ...res.timeline],
        }));
      } else {
        setData(res);
      }
      setHasMore(p < res.pages);
      setPage(p);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => { fetchHistory(1); }, [typeFilter, search, dateFrom, dateTo]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  function loadMore() {
    fetchHistory(page + 1, true);
  }

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  const inputStyle = {
    padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8,
    fontSize: 13, color: C.charcoal, outline: 'none',
    background: C.white, textAlign: isRTL ? 'right' : 'left',
  };

  return (
    <div style={{ padding: isMobile ? 14 : 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
          {L('سجل النشاط الكامل', 'Full Activity History')}
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
          {L('كل العمليات — مبيعات، مشتريات، ديون، دفعات، مرتجعات', 'All operations — sales, purchases, debts, payments, returns')}
        </div>
      </div>

      {/* Summary Cards */}
      {data?.summary && !isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: L('المبيعات', 'Sales'),     value: fmt(data.summary.total_sales),     color: C.info },
            { label: L('المشتريات', 'Purchases'), value: fmt(data.summary.total_purchases), color: C.warning },
            { label: L('الدفعات', 'Payments'),   value: fmt(data.summary.total_payments),  color: C.success },
            { label: L('المرتجعات', 'Returns'),  value: fmt(data.summary.total_returns),   color: '#8b5cf6' },
            { label: L('الصافي', 'Net'),         value: fmt(data.summary.net),             color: data.summary.net >= 0 ? C.success : C.red },
          ].map(card => (
            <div key={card.label} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '12px 14px', borderTop: `3px solid ${card.color}` }}>
              <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: card.color, marginTop: 4 }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        {/* Search */}
        <input
          placeholder={`🔍 ${L('ابحث عن شخص أو عملية...', 'Search party or operation...')}`}
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 180 }}
        />

        {/* Date from/to */}
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inputStyle, width: 140 }} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inputStyle, width: 140 }} />

        {/* Clear dates */}
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ ...inputStyle, cursor: 'pointer', color: C.red, borderColor: C.red }}>✕</button>
        )}
      </div>

      {/* Type Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        {[
          { id: 'all',      labelAr: 'الكل',      labelEn: 'All' },
          { id: 'sale',     labelAr: 'مبيعات',    labelEn: 'Sales' },
          { id: 'purchase', labelAr: 'مشتريات',   labelEn: 'Purchases' },
          { id: 'debt',     labelAr: 'ديون',       labelEn: 'Debts' },
          { id: 'payment',  labelAr: 'دفعات',      labelEn: 'Payments' },
          { id: 'return',   labelAr: 'مرتجعات',   labelEn: 'Returns' },
        ].map(f => (
          <button key={f.id} onClick={() => setType(f.id)} style={{
            padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
            background: typeFilter === f.id ? C.charcoal : C.surface,
            color: typeFilter === f.id ? '#fff' : C.textMuted,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {f.id !== 'all' && TYPE_CONFIG[f.id]?.icon}
            {language === 'ar' ? f.labelAr : f.labelEn}
          </button>
        ))}

        {data && (
          <span style={{ marginInlineStart: 'auto', fontSize: 12, color: C.textMuted, alignSelf: 'center' }}>
            {data.total} {L('نتيجة', 'results')}
          </span>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          {L('جاري التحميل...', 'Loading...')}
        </div>
      ) : !data?.timeline?.length ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{L('لا توجد نتائج', 'No results found')}</div>
        </div>
      ) : (
        <>
          <div style={{ position: 'relative' }}>
            {/* vertical line */}
            {!isMobile && (
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: isRTL ? 'auto' : 22, right: isRTL ? 22 : 'auto', width: 2, background: C.border, zIndex: 0 }} />
            )}

            {data.timeline.map((item, i) => {
              const cfg = TYPE_CONFIG[item.type] || { icon: '📋', labelAr: item.type, labelEn: item.type, colorKey: 'textMuted' };
              const color = C[cfg.colorKey] || C.textMuted;
              const statusStyle = STATUS_COLORS[item.status] || { bg: C.surface, text: C.textMuted };
              const dateObj = new Date(item.date);
              const dateStr = dateObj.toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              const timeStr = dateObj.toLocaleTimeString(language === 'ar' ? 'ar-IQ' : 'en-GB', { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={i} style={{ display: 'flex', gap: isMobile ? 10 : 16, marginBottom: 12, paddingInlineStart: isMobile ? 0 : 52, position: 'relative', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  {/* dot */}
                  {!isMobile && (
                    <div style={{
                      position: 'absolute',
                      left: isRTL ? 'auto' : 10, right: isRTL ? 10 : 'auto',
                      top: 12, width: 26, height: 26, borderRadius: '50%',
                      background: C.white, border: `2px solid ${color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, zIndex: 1,
                    }}>
                      {cfg.icon}
                    </div>
                  )}

                  {/* Card */}
                  <div style={{
                    flex: 1, background: C.white, borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    borderInlineStart: `3px solid ${color}`,
                    padding: isMobile ? '12px 14px' : '14px 18px',
                    boxShadow: `0 1px 4px ${C.shadow}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8 }}>

                      {/* Left side */}
                      <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
                          {isMobile && <span style={{ fontSize: 16 }}>{cfg.icon}</span>}
                          <span style={{ fontSize: 14, fontWeight: 700, color: C.charcoal }}>{item.party}</span>
                          <span style={{ fontSize: 10, background: item.party_type === 'customer' ? `${C.info}18` : `${C.warning}18`, color: item.party_type === 'customer' ? C.info : C.warning, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                            {item.party_type === 'customer' ? L('عميل', 'Customer') : L('مورد', 'Supplier')}
                          </span>
                          <span style={{ fontSize: 11, background: `${color}18`, color: color, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                            {language === 'ar' ? cfg.labelAr : cfg.labelEn}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{item.title}</div>
                        {item.detail && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{item.detail}</div>}
                        {item.payment_method && (
                          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                            💳 {item.payment_method}
                          </div>
                        )}
                      </div>

                      {/* Right side */}
                      <div style={{ textAlign: isRTL ? 'left' : 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: color }}>{fmt(item.amount)}</div>
                        <div style={{ marginTop: 4 }}>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: statusStyle.bg, color: statusStyle.text }}>
                            {item.status}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{dateStr}</div>
                        <div style={{ fontSize: 10, color: C.textMuted }}>{timeStr}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button onClick={loadMore} disabled={loadingMore} style={{
                padding: '10px 32px', borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.white, color: C.charcoal, fontSize: 13, cursor: 'pointer', fontWeight: 600,
              }}>
                {loadingMore ? '...' : L('تحميل المزيد', 'Load More')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}