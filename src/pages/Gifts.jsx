import { useState, useEffect } from 'react';
import { COLORS } from '../data/store';
import {
  getGifts, saveGifts, getCustomers,
  getGiftMilestones, saveGiftMilestones, generateId
} from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

const GIFT_TYPES = ['product', 'discount', 'credit', 'service'];
const GIFT_STATUSES = ['Pending', 'Sent', 'Cancelled'];

const STATUS_COLORS = {
  Pending: { bg: `${COLORS.warning}15`, border: `${COLORS.warning}44`, text: COLORS.warning },
  Sent: { bg: `${COLORS.success}15`, border: `${COLORS.success}44`, text: COLORS.success },
  Cancelled: { bg: `${COLORS.red}15`, border: `${COLORS.red}44`, text: COLORS.red },
};

const TYPE_ICONS = {
  product: '🎁', discount: '🏷️', credit: '💳', service: '🚚'
};

export default function Gifts() {
  const { t, isRTL, language } = useLanguage();
  const { fmt } = useCurrency();
  const [gifts, setGifts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [activeTab, setActiveTab] = useState('gifts');
  const [showForm, setShowForm] = useState(false);
  const [showCertificate, setShowCertificate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const [form, setForm] = useState({
    customerId: '', customerName: '', giftType: 'product',
    description: '', giftValue: '', status: 'Pending',
    reason: 'vip', notes: '',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    date: new Date().toISOString().split('T')[0],
    milestoneId: ''
  });

  const [milestoneForm, setMilestoneForm] = useState({
    threshold: '', giftType: 'discount', giftValue: '', description: '', active: true
  });

  useEffect(() => {
    setGifts(getGifts());
    setCustomers(getCustomers());
    setMilestones(getGiftMilestones());
  }, []);

  function getTypeLabel(type) {
    const labels = { product: t('giftProduct'), discount: t('giftDiscount'), credit: t('giftCredit'), service: t('giftService') };
    return labels[type] || type;
  }

  function getStatusLabel(status) {
    const labels = { Pending: t('giftPending'), Sent: t('giftSent'), Cancelled: t('giftCancelled') };
    return labels[status] || status;
  }

  function getReasonLabel(reason) {
    const labels = {
      vip: language === 'ar' ? 'عميل VIP' : 'VIP Customer',
      milestone: t('milestone'),
      loyalty: language === 'ar' ? 'ولاء العميل' : 'Customer Loyalty',
      birthday: language === 'ar' ? 'عيد ميلاد' : 'Birthday',
      manual: t('manualGift'),
    };
    return labels[reason] || reason;
  }

  // Detect eligible customers based on milestones
  const eligibleCustomers = customers.filter(customer => {
    const spent = customer.totalSpent || 0;
    const alreadyGifted = gifts.filter(g => g.customerId === customer.id && g.status !== 'Cancelled').map(g => g.milestoneId);
    return milestones.some(ms => ms.active && spent >= ms.threshold && !alreadyGifted.includes(ms.id));
  });

  function handleSave() {
    if (!form.customerName.trim()) return alert(t('customers') + ' ' + t('required'));
    if (!form.description.trim()) return alert(t('giftDescription') + ' ' + t('required'));
    const gift = { ...form, giftValue: parseFloat(form.giftValue) || 0 };
    const updated = [...gifts, { id: generateId(), ...gift, createdAt: new Date().toISOString() }];
    saveGifts(updated);
    setGifts(updated);
    resetForm();
  }

  function handleStatusChange(id, newStatus) {
    const updated = gifts.map(g => g.id === id ? { ...g, status: newStatus, sentAt: newStatus === 'Sent' ? new Date().toISOString() : g.sentAt } : g);
    saveGifts(updated);
    setGifts(updated);
  }

  function handleDelete(id) {
    const updated = gifts.filter(g => g.id !== id);
    saveGifts(updated);
    setGifts(updated);
    setDeleteConfirm(null);
  }

  function handleSendGiftToEligible(customer, milestone) {
    const gift = {
      id: generateId(),
      customerId: customer.id,
      customerName: customer.name,
      giftType: milestone.giftType,
      description: milestone.description,
      giftValue: milestone.giftValue || 0,
      status: 'Pending',
      reason: 'milestone',
      milestoneId: milestone.id,
      notes: `${language === 'ar' ? 'تم الكشف تلقائياً - إنفاق' : 'Auto detected - Spent'} ${fmt(customer.totalSpent || 0)}`,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    const updated = [...gifts, gift];
    saveGifts(updated);
    setGifts(updated);
  }

  function handleSaveMilestone() {
    if (!milestoneForm.threshold) return alert(t('giftThreshold') + ' ' + t('required'));
    if (!milestoneForm.description.trim()) return alert(t('giftDescription') + ' ' + t('required'));
    const updated = [...milestones, { id: generateId(), ...milestoneForm, threshold: parseFloat(milestoneForm.threshold), giftValue: parseFloat(milestoneForm.giftValue) || 0 }];
    saveGiftMilestones(updated);
    setMilestones(updated);
    setMilestoneForm({ threshold: '', giftType: 'discount', giftValue: '', description: '', active: true });
  }

  function handleDeleteMilestone(id) {
    const updated = milestones.filter(m => m.id !== id);
    saveGiftMilestones(updated);
    setMilestones(updated);
  }

  function toggleMilestone(id) {
    const updated = milestones.map(m => m.id === id ? { ...m, active: !m.active } : m);
    saveGiftMilestones(updated);
    setMilestones(updated);
  }

  function resetForm() {
    setForm({
      customerId: '', customerName: '', giftType: 'product',
      description: '', giftValue: '', status: 'Pending',
      reason: 'vip', notes: '',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      date: new Date().toISOString().split('T')[0],
      milestoneId: ''
    });
    setShowForm(false);
  }

  const filtered = gifts.filter(g => {
    const matchSearch = g.customerName.toLowerCase().includes(search.toLowerCase()) || g.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || g.status === filterStatus;
    const matchType = filterType === 'all' || g.giftType === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const pendingCount = gifts.filter(g => g.status === 'Pending').length;
  const sentCount = gifts.filter(g => g.status === 'Sent').length;
  const totalGiftValue = gifts.filter(g => g.status === 'Sent').reduce((sum, g) => sum + g.giftValue, 0);
  const settings = JSON.parse(localStorage.getItem('jango_settings') || '{}');
  const companyName = settings.companyName || 'Jango';
  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  const printStyle = `
    @media print {
      @page { size: A5; margin: 10mm; }
      body * { visibility: hidden !important; }
      #gift-certificate, #gift-certificate * { visibility: visible !important; }
      #gift-certificate { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; }
      .no-print { display: none !important; }
    }
  `;

  const TABS = [
    { id: 'gifts', label: language === 'ar' ? 'الهدايا' : 'Gifts', count: gifts.length },
    { id: 'eligible', label: language === 'ar' ? 'مؤهلون للهدايا' : 'Eligible Customers', count: eligibleCustomers.length },
    { id: 'milestones', label: t('giftMilestones'), count: milestones.length },
  ];

  return (
    <div style={{ padding: 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily }}>
      <style>{printStyle}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
            🎁 {t('gifts')}
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            {pendingCount} {t('giftPending')} · {sentCount} {t('giftSent')}
            {eligibleCustomers.length > 0 && (
              <span style={{ color: COLORS.red, fontWeight: 600 }}> · {eligibleCustomers.length} {t('giftEligible')}</span>
            )}
          </div>
        </div>
        {activeTab === 'gifts' && (
          <button onClick={() => setShowForm(true)} style={{
            background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
            border: 'none', borderRadius: 8, padding: '10px 20px',
            color: COLORS.white, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', boxShadow: `0 2px 8px ${COLORS.red}44`
          }}>
            {t('addGift')}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: t('totalGiftsGiven'), value: gifts.length, color: COLORS.info },
          { label: t('pendingGifts'), value: pendingCount, color: COLORS.warning },
          { label: t('giftSent'), value: sentCount, color: COLORS.success },
          { label: t('totalGiftValue'), value: fmt(totalGiftValue), color: COLORS.red },
        ].map(card => (
          <div key={card.label} style={{
            background: COLORS.white, borderRadius: 10,
            border: `1px solid ${COLORS.border}`, padding: '14px 16px',
            borderTop: `3px solid ${card.color}`,
          }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.charcoal, marginTop: 4, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 2, marginBottom: 24,
        background: COLORS.offWhite, borderRadius: 10,
        padding: 4, border: `1px solid ${COLORS.border}`,
        flexDirection: isRTL ? 'row-reverse' : 'row'
      }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
            background: activeTab === tab.id ? COLORS.white : 'none',
            color: activeTab === tab.id ? COLORS.charcoal : COLORS.textMuted,
            fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
            cursor: 'pointer',
            boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0,
                background: activeTab === tab.id ? COLORS.red : COLORS.border,
                color: activeTab === tab.id ? COLORS.white : COLORS.textMuted,
                borderRadius: '50%', width: 18, height: 18,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── GIFTS TAB ── */}
      {activeTab === 'gifts' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <input placeholder={`${t('search')}...`} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, padding: '10px 14px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, color: COLORS.charcoal, outline: 'none', background: COLORS.white, textAlign: isRTL ? 'right' : 'left' }} />
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '10px 14px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, color: COLORS.charcoal, outline: 'none', background: COLORS.white, cursor: 'pointer' }}>
              <option value="all">{t('all')}</option>
              {GIFT_TYPES.map(type => <option key={type} value={type}>{getTypeLabel(type)}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '10px 14px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, color: COLORS.charcoal, outline: 'none', background: COLORS.white, cursor: 'pointer' }}>
              <option value="all">{t('all')}</option>
              {GIFT_STATUSES.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textMuted, fontSize: 14 }}>{t('noGifts')}</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(gift => {
                const sc = STATUS_COLORS[gift.status] || STATUS_COLORS.Pending;
                return (
                  <div key={gift.id} style={{
                    background: COLORS.white, borderRadius: 10,
                    border: `1px solid ${COLORS.border}`, padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 50, height: 50, borderRadius: 12, flexShrink: 0,
                      background: `${COLORS.red}12`, border: `1px solid ${COLORS.red}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                    }}>
                      {TYPE_ICONS[gift.giftType]}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.charcoal }}>{gift.customerName}</span>
                        <span style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 20 }}>
                          {getStatusLabel(gift.status)}
                        </span>
                        <span style={{ background: `${COLORS.info}12`, border: `1px solid ${COLORS.info}33`, color: COLORS.info, fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 20 }}>
                          {getTypeLabel(gift.giftType)}
                        </span>
                        {gift.reason === 'milestone' && (
                          <span style={{ background: `${COLORS.warning}12`, border: `1px solid ${COLORS.warning}33`, color: COLORS.warning, fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 20 }}>
                            🏆 {t('milestone')}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.charcoalMid, marginTop: 3 }}>{gift.description}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                        {getReasonLabel(gift.reason)} ·
                        {new Date(gift.date).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{language === 'ar' ? 'صالح حتى' : 'Valid until'}: {new Date(gift.validUntil).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Value */}
                    {gift.giftValue > 0 && (
                      <div style={{ textAlign: isRTL ? 'left' : 'right', minWidth: 80 }}>
                        <div style={{ fontSize: 11, color: COLORS.textMuted }}>{t('giftValue')}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.red }}>
                          {gift.giftType === 'discount' ? `${gift.giftValue}%` : fmt(gift.giftValue)}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
                      {gift.status === 'Pending' && (
                        <button onClick={() => handleStatusChange(gift.id, 'Sent')} style={{
                          padding: '6px 12px', borderRadius: 7, border: `1px solid ${COLORS.success}44`,
                          background: `${COLORS.success}12`, color: COLORS.success,
                          fontSize: 11, cursor: 'pointer', fontWeight: 600
                        }}>
                          ✅ {t('giftSent')}
                        </button>
                      )}
                      <button onClick={() => setShowCertificate(gift)} style={{
                        padding: '6px 12px', borderRadius: 7, border: `1px solid ${COLORS.info}44`,
                        background: `${COLORS.info}12`, color: COLORS.info,
                        fontSize: 11, cursor: 'pointer', fontWeight: 600
                      }}>
                        🖨️ {language === 'ar' ? 'طباعة' : 'Print'}
                      </button>
                      {gift.status !== 'Sent' && (
                        <button onClick={() => setDeleteConfirm(gift.id)} style={{
                          padding: '6px 12px', borderRadius: 7, border: `1px solid ${COLORS.red}44`,
                          background: `${COLORS.red}11`, color: COLORS.red,
                          fontSize: 11, cursor: 'pointer', fontWeight: 600
                        }}>
                          {t('delete')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── ELIGIBLE CUSTOMERS TAB ── */}
      {activeTab === 'eligible' && (
        <div>
          {eligibleCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.charcoal, marginBottom: 8 }}>
                {language === 'ar' ? 'لا يوجد عملاء مؤهلون حالياً' : 'No eligible customers right now'}
              </div>
              <div style={{ fontSize: 13, color: COLORS.textMuted }}>
                {language === 'ar' ? 'عندما يصل العميل لحد إنفاق معين سيظهر هنا' : 'When a customer reaches a spending milestone they will appear here'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {eligibleCustomers.map(customer => {
                const alreadyGifted = gifts.filter(g => g.customerId === customer.id && g.status !== 'Cancelled').map(g => g.milestoneId);
                const eligibleMilestones = milestones.filter(ms => ms.active && (customer.totalSpent || 0) >= ms.threshold && !alreadyGifted.includes(ms.id));
                return (
                  <div key={customer.id} style={{
                    background: COLORS.white, borderRadius: 12,
                    border: `2px solid ${COLORS.warning}44`,
                    padding: '16px 20px',
                    boxShadow: `0 2px 12px ${COLORS.warning}22`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexDirection: isRTL ? 'row-reverse' : 'row', marginBottom: 12 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: `linear-gradient(135deg, #FFD700, #FFA500)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, fontWeight: 700, color: COLORS.white,
                        fontFamily: 'Georgia, serif', flexShrink: 0
                      }}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.charcoal }}>{customer.name}</div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                          {t('spentSoFar')}: <strong style={{ color: COLORS.success }}>{fmt(customer.totalSpent || 0)}</strong> ·
                          {customer.phone}
                        </div>
                      </div>
                      <div style={{ fontSize: 28 }}>🏆</div>
                    </div>

                    <div style={{ display: 'grid', gap: 8 }}>
                      {eligibleMilestones.map(milestone => (
                        <div key={milestone.id} style={{
                          background: `${COLORS.warning}08`, border: `1px solid ${COLORS.warning}33`,
                          borderRadius: 8, padding: '10px 14px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          flexDirection: isRTL ? 'row-reverse' : 'row'
                        }}>
                          <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>
                              {TYPE_ICONS[milestone.giftType]} {milestone.description}
                            </div>
                            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                              {t('giftThreshold')}: {fmt(milestone.threshold)}
                              {milestone.giftValue > 0 && ` · ${language === 'ar' ? 'القيمة' : 'Value'}: ${milestone.giftType === 'discount' ? `${milestone.giftValue}%` : fmt(milestone.giftValue)}`}
                            </div>
                          </div>
                          <button onClick={() => handleSendGiftToEligible(customer, milestone)} style={{
                            padding: '8px 16px', borderRadius: 8, border: 'none',
                            background: `linear-gradient(135deg, ${COLORS.warning}, #F59E0B)`,
                            color: COLORS.white, fontSize: 12, fontWeight: 700,
                            cursor: 'pointer', whiteSpace: 'nowrap'
                          }}>
                            🎁 {t('sendGift')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MILESTONES TAB ── */}
      {activeTab === 'milestones' && (
        <div>
          {/* Add Milestone Form */}
          <div style={{
            background: COLORS.white, borderRadius: 12,
            border: `1px solid ${COLORS.border}`, padding: '20px 24px', marginBottom: 20
          }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.charcoal, marginBottom: 16 }}>
              {language === 'ar' ? '+ إضافة حد إنفاق جديد' : '+ Add New Milestone'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('giftThreshold')} *</div>
                <input type="number" value={milestoneForm.threshold} onChange={e => setMilestoneForm({ ...milestoneForm, threshold: e.target.value })} placeholder="500" style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('giftType')} *</div>
                <select value={milestoneForm.giftType} onChange={e => setMilestoneForm({ ...milestoneForm, giftType: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: COLORS.white, boxSizing: 'border-box' }}>
                  {GIFT_TYPES.map(type => <option key={type} value={type}>{getTypeLabel(type)}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('giftValue')}</div>
                <input type="number" value={milestoneForm.giftValue} onChange={e => setMilestoneForm({ ...milestoneForm, giftValue: e.target.value })} placeholder="0" style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('giftDescription')} *</div>
                <input value={milestoneForm.description} onChange={e => setMilestoneForm({ ...milestoneForm, description: e.target.value })} placeholder={language === 'ar' ? 'وصف الهدية...' : 'Gift description...'} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left' }} />
              </div>
              <button onClick={handleSaveMilestone} style={{
                padding: '9px 18px', borderRadius: 7, border: 'none',
                background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
                color: COLORS.white, fontSize: 13, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap'
              }}>
                {t('add')}
              </button>
            </div>
          </div>

          {/* Milestones List */}
          {milestones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: COLORS.textMuted }}>{t('noMilestones')}</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {milestones.sort((a, b) => a.threshold - b.threshold).map(ms => (
                <div key={ms.id} style={{
                  background: COLORS.white, borderRadius: 10,
                  border: `1px solid ${ms.active ? COLORS.success + '44' : COLORS.border}`,
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  opacity: ms.active ? 1 : 0.6
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 12, flexShrink: 0,
                    background: ms.active ? `${COLORS.warning}15` : COLORS.offWhite,
                    border: `1px solid ${ms.active ? COLORS.warning + '44' : COLORS.border}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <div style={{ fontSize: 20 }}>{TYPE_ICONS[ms.giftType]}</div>
                  </div>

                  <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.charcoal }}>{ms.description}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>
                      {language === 'ar' ? 'عند الإنفاق:' : 'When spent:'} <strong style={{ color: COLORS.success }}>{fmt(ms.threshold)}</strong>
                      {' · '}{getTypeLabel(ms.giftType)}
                      {ms.giftValue > 0 && ` · ${ms.giftType === 'discount' ? `${ms.giftValue}%` : fmt(ms.giftValue)}`}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                      {language === 'ar' ? 'مؤهلون حالياً:' : 'Currently eligible:'}
                      <strong style={{ color: COLORS.red }}> {customers.filter(c => (c.totalSpent || 0) >= ms.threshold).length} {language === 'ar' ? 'عميل' : 'customers'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <button onClick={() => toggleMilestone(ms.id)} style={{
                      padding: '7px 14px', borderRadius: 7,
                      border: `1px solid ${ms.active ? COLORS.success + '44' : COLORS.border}`,
                      background: ms.active ? `${COLORS.success}12` : COLORS.offWhite,
                      color: ms.active ? COLORS.success : COLORS.textMuted,
                      fontSize: 12, cursor: 'pointer', fontWeight: 600
                    }}>
                      {ms.active ? (language === 'ar' ? '✅ نشط' : '✅ Active') : (language === 'ar' ? '⏸️ متوقف' : '⏸️ Paused')}
                    </button>
                    <button onClick={() => handleDeleteMilestone(ms.id)} style={{
                      padding: '7px 14px', borderRadius: 7, border: `1px solid ${COLORS.red}44`,
                      background: `${COLORS.red}11`, color: COLORS.red,
                      fontSize: 12, cursor: 'pointer', fontWeight: 500
                    }}>{t('delete')}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ADD GIFT MODAL ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: COLORS.white, borderRadius: 14, padding: 28, width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.charcoal, marginBottom: 20, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
              🎁 {t('addGift')}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Customer */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('customers')} *</div>
                <select value={form.customerId} onChange={e => {
                  const customer = customers.find(c => c.id === e.target.value);
                  setForm({ ...form, customerId: e.target.value, customerName: customer?.name || '' });
                }} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', background: COLORS.white, boxSizing: 'border-box' }}>
                  <option value="">{t('selectSupplier')}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.phone} {c.tag === 'VIP' ? '⭐ VIP' : ''} ({language === 'ar' ? 'أنفق' : 'Spent'}: {fmt(c.totalSpent || 0)})
                    </option>
                  ))}
                </select>
                {form.customerId && (() => {
                  const cust = customers.find(c => c.id === form.customerId);
                  if (!cust) return null;
                  return (
                    <div style={{ marginTop: 6, padding: '8px 12px', background: `${COLORS.info}10`, border: `1px solid ${COLORS.info}33`, borderRadius: 7, fontSize: 12 }}>
                      💰 {t('spentSoFar')}: <strong>{fmt(cust.totalSpent || 0)}</strong> · {t('totalPurchases')}: <strong>{cust.totalPurchases || 0}</strong> ·
                      <span style={{ color: cust.tag === 'VIP' ? '#B8860B' : COLORS.textMuted }}> {cust.tag}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Gift Type */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('giftType')} *</div>
                <select value={form.giftType} onChange={e => setForm({ ...form, giftType: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', background: COLORS.white, boxSizing: 'border-box' }}>
                  {GIFT_TYPES.map(type => <option key={type} value={type}>{TYPE_ICONS[type]} {getTypeLabel(type)}</option>)}
                </select>
              </div>

              {/* Reason */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{language === 'ar' ? 'السبب' : 'Reason'} *</div>
                <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', background: COLORS.white, boxSizing: 'border-box' }}>
                  <option value="vip">{language === 'ar' ? 'عميل VIP' : 'VIP Customer'}</option>
                  <option value="milestone">{t('milestone')}</option>
                  <option value="loyalty">{language === 'ar' ? 'ولاء العميل' : 'Customer Loyalty'}</option>
                  <option value="birthday">{language === 'ar' ? 'عيد ميلاد' : 'Birthday'}</option>
                  <option value="manual">{t('manualGift')}</option>
                </select>
              </div>

              {/* Description */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('giftDescription')} *</div>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={language === 'ar' ? 'مثال: كنبة صغيرة مجانية' : 'e.g. Free small sofa'} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left' }} />
              </div>

              {/* Gift Value */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>
                  {t('giftValue')} {form.giftType === 'discount' ? '(%)' : '($)'}
                </div>
                <input type="number" value={form.giftValue} onChange={e => setForm({ ...form, giftValue: e.target.value })} placeholder="0" style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Date */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('date')}</div>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Valid Until */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('validUntil')}</div>
                <input type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Notes */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 5 }}>{t('notes')}</div>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder={t('notes')} rows={3} style={{ width: '100%', padding: '9px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 13, color: COLORS.charcoal, outline: 'none', resize: 'vertical', boxSizing: 'border-box', textAlign: isRTL ? 'right' : 'left' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={resetForm} style={{ padding: '9px 20px', borderRadius: 7, border: `1px solid ${COLORS.border}`, background: COLORS.white, color: COLORS.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>{t('cancel')}</button>
              <button onClick={handleSave} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`, color: COLORS.white, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>🎁 {t('addGift')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: COLORS.white, borderRadius: 12, padding: 28, width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.charcoal, marginBottom: 8 }}>{t('deleteGift')}</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 24 }}>{t('permanentDelete')}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '9px 24px', borderRadius: 7, border: `1px solid ${COLORS.border}`, background: COLORS.white, color: COLORS.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>{t('cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: COLORS.red, color: COLORS.white, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>{t('yesDelete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── GIFT CERTIFICATE MODAL ── */}
      {showCertificate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: COLORS.white, borderRadius: 14, padding: 28, width: 520, boxShadow: '0 8px 40px rgba(0,0,0,0.3)', direction: isRTL ? 'rtl' : 'ltr' }}>

            {/* Action Buttons */}
            <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={() => window.print()} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${COLORS.charcoal}, ${COLORS.charcoalLight})`, color: COLORS.white, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                🖨️ {t('printReceipt')}
              </button>
              <button onClick={() => setShowCertificate(null)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.white, color: COLORS.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                {t('cancel')}
              </button>
            </div>

            {/* Gift Certificate */}
            <div id="gift-certificate" style={{
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
              borderRadius: 12, padding: '28px 32px', color: COLORS.white,
              fontFamily: language === 'ar' ? 'Arial, sans-serif' : "'Georgia', serif",
              position: 'relative', overflow: 'hidden'
            }}>
              {/* Decorative circles */}
              <div style={{ position: 'absolute', top: -30, right: isRTL ? 'auto' : -30, left: isRTL ? -30 : 'auto', width: 120, height: 120, borderRadius: '50%', background: `${COLORS.red}22`, border: `2px solid ${COLORS.red}33` }} />
              <div style={{ position: 'absolute', bottom: -20, left: isRTL ? 'auto' : -20, right: isRTL ? -20 : 'auto', width: 80, height: 80, borderRadius: '50%', background: '#FFD70022', border: '2px solid #FFD70033' }} />

              {/* Company */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: '#FFD700', textTransform: 'uppercase', marginBottom: 4 }}>
                  {language === 'ar' ? 'من' : 'FROM'}
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 2, color: COLORS.white }}>
                  {language === 'ar' ? 'جانغو' : companyName.toUpperCase()}
                </div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 2, letterSpacing: 1 }}>
                  {language === 'ar' ? 'أثاث فاخر' : 'PREMIUM FURNITURE'}
                </div>
              </div>

              {/* Gift Icon */}
              <div style={{ textAlign: 'center', fontSize: 52, marginBottom: 16 }}>🎁</div>

              {/* Congratulations */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#FFD700', marginBottom: 6 }}>{t('congratulations')}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.white, marginBottom: 8 }}>{showCertificate.customerName}</div>
                <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>{t('giftMessage')}</div>
              </div>

              {/* Gift Details */}
              <div style={{
                background: 'rgba(255,255,255,0.1)', borderRadius: 10,
                padding: '16px 20px', marginBottom: 16,
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, color: '#FFD700', fontWeight: 600, marginBottom: 4 }}>
                    {TYPE_ICONS[showCertificate.giftType]} {getTypeLabel(showCertificate.giftType)}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.white }}>{showCertificate.description}</div>
                  {showCertificate.giftValue > 0 && (
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#FFD700', marginTop: 6 }}>
                      {showCertificate.giftType === 'discount' ? `${showCertificate.giftValue}%` : fmt(showCertificate.giftValue)}
                    </div>
                  )}
                </div>
              </div>

              {/* Valid Until */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase' }}>{t('validUntil')}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.white, marginTop: 2 }}>
                  {new Date(showCertificate.validUntil).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              {/* Certificate ID */}
              <div style={{ textAlign: 'center', paddingTop: 12, borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize: 10, color: '#888', letterSpacing: 1 }}>
                  {language === 'ar' ? 'رقم الشهادة' : 'Certificate'} #{showCertificate.id.slice(-8).toUpperCase()}
                </div>
                <div style={{ fontSize: 8, color: '#666', marginTop: 4, letterSpacing: 0.5 }}>
                  Powered by CodaTechAgency
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}