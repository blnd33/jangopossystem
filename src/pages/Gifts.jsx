import { useState, useEffect } from 'react';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWindowSize } from '../hooks/useWindowSize';
import api from '../services/api';

const GIFT_TYPES = ['product', 'discount', 'credit', 'service'];
const GIFT_STATUSES = ['Pending', 'Sent', 'Cancelled'];
const STATUS_COLORS = {
  Pending: { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' },
  Sent: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
  Cancelled: { bg: '#FFF1F2', border: '#FECDD3', text: '#BE123C' },
};
const TYPE_ICONS = { product: '🎁', discount: '🏷️', credit: '💳', service: '🚚' };

export default function Gifts() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const C = useThemeColors();
  const { isMobile } = useWindowSize();

  const [gifts, setGifts] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [eligible, setEligible] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('gifts');
  const [showForm, setShowForm] = useState(false);
  const [showCertificate, setShowCertificate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [form, setForm] = useState({
    customer_id: '', customer_name: '', gift_type: 'product',
    description: '', gift_value: '', status: 'Pending', reason: 'vip', notes: '',
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    date: new Date().toISOString().split('T')[0], milestone_id: ''
  });

  const [milestoneForm, setMilestoneForm] = useState({
    threshold: '', gift_type: 'discount', gift_value: '', description: '', active: true
  });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [g, ms, el, custs] = await Promise.all([
        api.gifts.getAll(),
        api.giftMilestones.getAll(),
        api.gifts.getEligible(),
        api.customers.getAll(),
      ]);
      setGifts(g);
      setMilestones(ms);
      setEligible(el);
      setCustomers(custs);
    } catch (err) {
      console.error('Gifts fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  function getTypeLabel(type) {
    return { product: t('giftProduct'), discount: t('giftDiscount'), credit: t('giftCredit'), service: t('giftService') }[type] || type;
  }
  function getStatusLabel(status) {
    return { Pending: t('giftPending'), Sent: t('giftSent'), Cancelled: t('giftCancelled') }[status] || status;
  }
  function getReasonLabel(reason) {
    return {
      vip: language === 'ar' ? 'عميل VIP' : 'VIP Customer',
      milestone: t('milestone'),
      loyalty: language === 'ar' ? 'ولاء العميل' : 'Customer Loyalty',
      birthday: language === 'ar' ? 'عيد ميلاد' : 'Birthday',
      manual: t('manualGift'),
    }[reason] || reason;
  }

  async function handleSave() {
    if (!form.customer_name.trim()) return alert(t('customers') + ' ' + t('required'));
    if (!form.description.trim()) return alert(t('giftDescription') + ' ' + t('required'));
    try {
      const payload = { ...form, gift_value: parseFloat(form.gift_value) || 0 };
      const created = await api.gifts.create(payload);
      setGifts(gs => [created, ...gs]);
      resetForm();
    } catch (err) { alert(err.message); }
  }

  async function handleStatusChange(id, status) {
    try {
      const updated = await api.gifts.updateStatus(id, status);
      setGifts(gs => gs.map(g => g.id === id ? updated : g));
    } catch (err) { alert(err.message); }
  }

  async function handleDelete(id) {
    try {
      await api.gifts.delete(id);
      setGifts(gs => gs.filter(g => g.id !== id));
      setDeleteConfirm(null);
    } catch (err) { alert(err.message); }
  }

  async function handleSendGiftToEligible(customer, milestone) {
    try {
      const gift = {
        customer_id: customer.id, customer_name: customer.name,
        gift_type: milestone.gift_type, description: milestone.description,
        gift_value: milestone.gift_value || 0, status: 'Pending', reason: 'milestone',
        milestone_id: milestone.id,
        notes: `${language === 'ar' ? 'تم الكشف تلقائياً - إنفاق' : 'Auto detected - Spent'} ${fmt(customer.total_spent || 0)}`,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        date: new Date().toISOString().split('T')[0],
      };
      const created = await api.gifts.create(gift);
      setGifts(gs => [created, ...gs]);
      setEligible(el => el.map(c => c.id === customer.id
        ? { ...c, eligible_milestones: c.eligible_milestones.filter(m => m.id !== milestone.id) }
        : c).filter(c => c.eligible_milestones.length > 0));
    } catch (err) { alert(err.message); }
  }

  async function handleSaveMilestone() {
    if (!milestoneForm.threshold) return alert(t('giftThreshold') + ' ' + t('required'));
    if (!milestoneForm.description.trim()) return alert(t('giftDescription') + ' ' + t('required'));
    try {
      const created = await api.giftMilestones.create({
        ...milestoneForm,
        threshold: parseFloat(milestoneForm.threshold),
        gift_value: parseFloat(milestoneForm.gift_value) || 0,
      });
      setMilestones(ms => [...ms, created].sort((a, b) => a.threshold - b.threshold));
      setMilestoneForm({ threshold: '', gift_type: 'discount', gift_value: '', description: '', active: true });
    } catch (err) { alert(err.message); }
  }

  async function handleDeleteMilestone(id) {
    try {
      await api.giftMilestones.delete(id);
      setMilestones(ms => ms.filter(m => m.id !== id));
    } catch (err) { alert(err.message); }
  }

  async function toggleMilestone(id) {
    try {
      const updated = await api.giftMilestones.toggle(id);
      setMilestones(ms => ms.map(m => m.id === id ? updated : m));
    } catch (err) { alert(err.message); }
  }

  function resetForm() {
    setForm({ customer_id: '', customer_name: '', gift_type: 'product', description: '', gift_value: '', status: 'Pending', reason: 'vip', notes: '', valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], date: new Date().toISOString().split('T')[0], milestone_id: '' });
    setShowForm(false);
  }

  const filtered = gifts.filter(g => {
    const matchSearch = g.customer_name.toLowerCase().includes(search.toLowerCase()) || g.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || g.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendingCount = gifts.filter(g => g.status === 'Pending').length;
  const sentCount = gifts.filter(g => g.status === 'Sent').length;
  const totalGiftValue = gifts.filter(g => g.status === 'Sent').reduce((sum, g) => sum + g.gift_value, 0);
  const settings = JSON.parse(localStorage.getItem('jango_settings') || '{}');
  const companyName = settings.companyName || 'Jango';
  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  const printStyle = `@media print { @page { size: A5; margin: 10mm; } body * { visibility: hidden !important; } #gift-certificate, #gift-certificate * { visibility: visible !important; } #gift-certificate { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; } .no-print { display: none !important; } }`;

  const TABS = [
    { id: 'gifts', label: language === 'ar' ? 'الهدايا' : 'Gifts', count: gifts.length },
    { id: 'eligible', label: language === 'ar' ? 'مؤهلون' : 'Eligible', count: eligible.length },
    { id: 'milestones', label: isMobile ? (language === 'ar' ? 'الحدود' : 'Milestones') : t('giftMilestones'), count: milestones.length },
  ];

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 7,
    fontSize: 13, color: C.charcoal, outline: 'none', boxSizing: 'border-box',
    background: C.white, textAlign: isRTL ? 'right' : 'left'
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Loading...</div>;

  return (
    <div style={{ padding: isMobile ? 14 : 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>
      <style>{printStyle}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 14 : 20 }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>🎁 {t('gifts')}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            {pendingCount} {t('giftPending')} · {sentCount} {t('giftSent')}
            {eligible.length > 0 && <span style={{ color: C.red, fontWeight: 600 }}> · {eligible.length} {t('giftEligible')}</span>}
          </div>
        </div>
        {activeTab === 'gifts' && (
          <button onClick={() => setShowForm(true)} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, border: 'none', borderRadius: 8, padding: isMobile ? '9px 14px' : '10px 20px', color: '#fff', fontSize: isMobile ? 12 : 13, fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${C.red}44` }}>
            {isMobile ? '+ ' + t('add') : t('addGift')}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 12, marginBottom: isMobile ? 14 : 20 }}>
        {[
          { label: t('totalGiftsGiven'), value: gifts.length, color: C.info },
          { label: t('pendingGifts'), value: pendingCount, color: C.warning },
          { label: t('giftSent'), value: sentCount, color: C.success },
          { label: t('totalGiftValue'), value: fmt(totalGiftValue), color: C.red },
        ].map(card => (
          <div key={card.label} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: isMobile ? '12px 14px' : '14px 16px', borderTop: `3px solid ${card.color}` }}>
            <div style={{ fontSize: isMobile ? 9 : 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
            <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: C.charcoal, marginTop: 4 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: isMobile ? 14 : 20, background: C.offWhite, borderRadius: 10, padding: 4, border: `1px solid ${C.border}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: isMobile ? '8px 0' : '9px 0', borderRadius: 8, border: 'none', background: activeTab === tab.id ? C.white : 'none', color: activeTab === tab.id ? C.charcoal : C.textMuted, fontSize: isMobile ? 12 : 13, fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer', boxShadow: activeTab === tab.id ? `0 1px 4px ${C.shadow}` : 'none' }}>
            {tab.label}
            {tab.count > 0 && <span style={{ marginLeft: isRTL ? 0 : 5, marginRight: isRTL ? 5 : 0, background: activeTab === tab.id ? C.red : C.border, color: activeTab === tab.id ? '#fff' : C.textMuted, borderRadius: '50%', width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* GIFTS TAB */}
      {activeTab === 'gifts' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <input placeholder={`${t('search')}...`} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, textAlign: isRTL ? 'right' : 'left' }} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.charcoal, outline: 'none', background: C.white, cursor: 'pointer' }}>
              <option value="all">{t('all')}</option>
              {GIFT_STATUSES.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
            </select>
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: C.textMuted }}>{t('noGifts')}</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {filtered.map(gift => {
                const sc = STATUS_COLORS[gift.status] || STATUS_COLORS.Pending;
                return (
                  <div key={gift.id} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: isMobile ? '12px 14px' : '14px 20px', boxShadow: `0 1px 4px ${C.shadow}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <div style={{ width: isMobile ? 38 : 48, height: isMobile ? 38 : 48, borderRadius: 10, flexShrink: 0, background: `${C.red}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 18 : 22 }}>
                        {TYPE_ICONS[gift.gift_type]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                          <span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: C.charcoal }}>{gift.customer_name}</span>
                          <span style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>{getStatusLabel(gift.status)}</span>
                          <span style={{ background: `${C.info}12`, border: `1px solid ${C.info}33`, color: C.info, fontSize: 9, fontWeight: 600, padding: '1px 7px', borderRadius: 20 }}>{getTypeLabel(gift.gift_type)}</span>
                        </div>
                        <div style={{ fontSize: isMobile ? 11 : 12, color: C.charcoalMid, marginTop: 2 }}>{gift.description}</div>
                        <div style={{ fontSize: isMobile ? 10 : 11, color: C.textMuted, marginTop: 2 }}>
                          {getReasonLabel(gift.reason)} · {gift.date && new Date(gift.date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      {gift.gift_value > 0 && (
                        <div style={{ textAlign: isRTL ? 'left' : 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: C.red }}>
                            {gift.gift_type === 'discount' ? `${gift.gift_value}%` : fmt(gift.gift_value)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      {gift.status === 'Pending' && (
                        <button onClick={() => handleStatusChange(gift.id, 'Sent')} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.success}44`, background: `${C.success}12`, color: C.success, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>✅ {t('giftSent')}</button>
                      )}
                      <button onClick={() => setShowCertificate(gift)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.info}44`, background: `${C.info}12`, color: C.info, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>🖨️ {language === 'ar' ? 'طباعة' : 'Print'}</button>
                      {gift.status !== 'Sent' && (
                        <button onClick={() => setDeleteConfirm(gift.id)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.red}44`, background: `${C.red}11`, color: C.red, fontSize: 11, cursor: 'pointer' }}>{t('delete')}</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ELIGIBLE TAB */}
      {activeTab === 'eligible' && (
        <div>
          {eligible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.charcoal }}>{language === 'ar' ? 'لا يوجد عملاء مؤهلون حالياً' : 'No eligible customers right now'}</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {eligible.map(customer => (
                <div key={customer.id} style={{ background: C.white, borderRadius: 12, border: `2px solid ${C.warning}44`, padding: isMobile ? 14 : '16px 20px', boxShadow: `0 2px 12px ${C.warning}22` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row', marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #FFD700, #FFA500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                      <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: C.charcoal }}>{customer.name}</div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>{t('spentSoFar')}: <strong style={{ color: C.success }}>{fmt(customer.total_spent || 0)}</strong></div>
                    </div>
                    <div style={{ fontSize: 24 }}>🏆</div>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {customer.eligible_milestones.map(milestone => (
                      <div key={milestone.id} style={{ background: `${C.warning}08`, border: `1px solid ${C.warning}33`, borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>{TYPE_ICONS[milestone.gift_type]} {milestone.description}</div>
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{t('giftThreshold')}: {fmt(milestone.threshold)}</div>
                        </div>
                        <button onClick={() => handleSendGiftToEligible(customer, milestone)} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.warning}, #F59E0B)`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          🎁 {t('sendGift')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MILESTONES TAB */}
      {activeTab === 'milestones' && (
        <div>
          <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? 14 : '20px 24px', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, marginBottom: 14 }}>{language === 'ar' ? '+ إضافة حد إنفاق جديد' : '+ Add New Milestone'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('giftThreshold')} *</div>
                <input type="number" value={milestoneForm.threshold} onChange={e => setMilestoneForm({ ...milestoneForm, threshold: e.target.value })} placeholder="500" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('giftType')}</div>
                <select value={milestoneForm.gift_type} onChange={e => setMilestoneForm({ ...milestoneForm, gift_type: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {GIFT_TYPES.map(type => <option key={type} value={type}>{getTypeLabel(type)}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('giftValue')}</div>
                <input type="number" value={milestoneForm.gift_value} onChange={e => setMilestoneForm({ ...milestoneForm, gift_value: e.target.value })} placeholder="0" style={inputStyle} />
              </div>
              <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('giftDescription')} *</div>
                <input value={milestoneForm.description} onChange={e => setMilestoneForm({ ...milestoneForm, description: e.target.value })} placeholder={language === 'ar' ? 'وصف الهدية...' : 'Gift description...'} style={inputStyle} />
              </div>
              <button onClick={handleSaveMilestone} style={{ padding: '9px 16px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', gridColumn: isMobile ? '1 / -1' : 'auto' }}>
                {t('add')}
              </button>
            </div>
          </div>
          {milestones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: C.textMuted }}>{t('noMilestones')}</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {milestones.map(ms => (
                <div key={ms.id} style={{ background: C.white, borderRadius: 10, border: `1px solid ${ms.active ? C.success + '44' : C.border}`, padding: isMobile ? '12px 14px' : '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row', opacity: ms.active ? 1 : 0.6 }}>
                  <div style={{ fontSize: 24, flexShrink: 0 }}>{TYPE_ICONS[ms.gift_type]}</div>
                  <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: C.charcoal }}>{ms.description}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                      {language === 'ar' ? 'عند الإنفاق:' : 'When spent:'} <strong style={{ color: C.success }}>{fmt(ms.threshold)}</strong>
                      {ms.gift_value > 0 && ` · ${ms.gift_type === 'discount' ? `${ms.gift_value}%` : fmt(ms.gift_value)}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <button onClick={() => toggleMilestone(ms.id)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${ms.active ? C.success + '44' : C.border}`, background: ms.active ? `${C.success}12` : C.offWhite, color: ms.active ? C.success : C.textMuted, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                      {ms.active ? '✅' : '⏸️'}
                    </button>
                    <button onClick={() => handleDeleteMilestone(ms.id)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.red}44`, background: `${C.red}11`, color: C.red, fontSize: 11, cursor: 'pointer' }}>{t('delete')}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Gift Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 0 : 20 }}>
          <div style={{ background: C.white, borderRadius: isMobile ? '16px 16px 0 0' : 14, padding: isMobile ? '20px 16px' : 28, width: isMobile ? '100%' : 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 18 }}>🎁 {t('addGift')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('customers')} *</div>
                <select value={form.customer_id} onChange={e => {
                  const c = customers.find(c => c.id === parseInt(e.target.value));
                  setForm({ ...form, customer_id: e.target.value, customer_name: c?.name || '' });
                }} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">{language === 'ar' ? 'اختر عميلاً' : 'Select customer'}</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({fmt(c.total_spent || 0)})</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('giftType')} *</div>
                <select value={form.gift_type} onChange={e => setForm({ ...form, gift_type: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {GIFT_TYPES.map(type => <option key={type} value={type}>{TYPE_ICONS[type]} {getTypeLabel(type)}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{language === 'ar' ? 'السبب' : 'Reason'}</div>
                <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="vip">{language === 'ar' ? 'عميل VIP' : 'VIP Customer'}</option>
                  <option value="milestone">{t('milestone')}</option>
                  <option value="loyalty">{language === 'ar' ? 'ولاء العميل' : 'Loyalty'}</option>
                  <option value="birthday">{language === 'ar' ? 'عيد ميلاد' : 'Birthday'}</option>
                  <option value="manual">{t('manualGift')}</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('giftDescription')} *</div>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={language === 'ar' ? 'مثال: كنبة صغيرة مجانية' : 'e.g. Free small sofa'} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('giftValue')}</div>
                <input type="number" value={form.gift_value} onChange={e => setForm({ ...form, gift_value: e.target.value })} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('validUntil')}</div>
                <input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>{t('notes')}</div>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={resetForm} style={{ padding: '9px 20px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer' }}>{t('cancel')}</button>
              <button onClick={handleSave} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>🎁 {t('addGift')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: C.white, borderRadius: 12, padding: 28, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>{t('deleteGift')}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>{t('permanentDelete')}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 24px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer' }}>{t('cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: C.red, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{t('yesDelete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Gift Certificate */}
      {showCertificate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 0 : 20 }}>
          <div style={{ background: C.white, borderRadius: isMobile ? '16px 16px 0 0' : 14, padding: isMobile ? '20px 16px' : 28, width: isMobile ? '100%' : 520, boxShadow: '0 8px 40px rgba(0,0,0,0.3)', direction: isRTL ? 'rtl' : 'ltr', maxHeight: isMobile ? '90vh' : 'auto', overflowY: 'auto' }}>
            <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 16, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={() => window.print()} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${C.charcoal}, #1e293b)`, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>🖨️ {t('printReceipt')}</button>
              <button onClick={() => setShowCertificate(null)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer' }}>{t('cancel')}</button>
            </div>
            <div id="gift-certificate" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderRadius: 12, padding: isMobile ? '20px 16px' : '28px 32px', color: '#fff', fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif', position: 'relative', overflow: 'hidden' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: isMobile ? 10 : 11, letterSpacing: 3, color: '#FFD700', textTransform: 'uppercase', marginBottom: 4 }}>{language === 'ar' ? 'من' : 'FROM'}</div>
                <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, letterSpacing: 2, color: '#fff' }}>{companyName.toUpperCase()}</div>
              </div>
              <div style={{ textAlign: 'center', fontSize: isMobile ? 40 : 52, marginBottom: 12 }}>🎁</div>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: '#FFD700', marginBottom: 6 }}>{t('congratulations')}</div>
                <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{showCertificate.customer_name}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '14px 16px', marginBottom: 12, border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: isMobile ? 12 : 14, color: '#FFD700', fontWeight: 600, marginBottom: 4 }}>{TYPE_ICONS[showCertificate.gift_type]} {getTypeLabel(showCertificate.gift_type)}</div>
                <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, color: '#fff' }}>{showCertificate.description}</div>
                {showCertificate.gift_value > 0 && (
                  <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: '#FFD700', marginTop: 6 }}>
                    {showCertificate.gift_type === 'discount' ? `${showCertificate.gift_value}%` : fmt(showCertificate.gift_value)}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase' }}>{t('validUntil')}</div>
                <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: '#fff', marginTop: 2 }}>
                  {showCertificate.valid_until && new Date(showCertificate.valid_until).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div style={{ textAlign: 'center', paddingTop: 10, borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize: 9, color: '#888', letterSpacing: 1 }}>Certificate #{String(showCertificate.id).slice(-8).toUpperCase()}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}