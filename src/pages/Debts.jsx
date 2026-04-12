import { useState, useEffect } from 'react';
import api from '../services/api';
import { useLanguage } from '../data/LanguageContext';
import { useThemeColors } from '../hooks/useThemeColors';

const STATUS_COLOR = {
  unpaid: { bg: '#fee2e2', text: '#b91c1c' },
  partial: { bg: '#fef3c7', text: '#92400e' },
  paid:    { bg: '#dcfce7', text: '#15803d' },
};

const TYPE_COLOR = {
  purchase: { bg: '#ede9fe', text: '#6d28d9' },
  sale:     { bg: '#e0f2fe', text: '#0369a1' },
};

export default function Debts() {
  const { isRTL, language } = useLanguage();
  const C = useThemeColors();

  const [debts, setDebts]         = useState([]);
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');   // all | purchase | sale
  const [statusFilter, setStatus] = useState('all');   // all | unpaid | partial | paid
  const [selected, setSelected]   = useState(null);    // debt detail modal
  const [payModal, setPayModal]   = useState(null);    // payment modal
  const [addModal, setAddModal]   = useState(false);   // add debt modal
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote]     = useState('');
  const [payDate, setPayDate]     = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);

  // add form
  const [form, setForm] = useState({
    debt_type: 'purchase', party_name: '', total_amount: '',
    due_date: '', notes: '',
  });

  const t = (ar, en) => language === 'ar' ? ar : en;

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.type = filter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const [d, s] = await Promise.all([
        api.debts.getAll(params),
        api.debts.getSummary(),
      ]);
      setDebts(d);
      setSummary(s);
    } catch (e) {
      showToast(e.message, 'error');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter, statusFilter]);

  async function handleAddPayment() {
    if (!payAmount || parseFloat(payAmount) <= 0) return;
    setSaving(true);
    try {
      await api.debts.addPayment(payModal.id, {
        amount: parseFloat(payAmount),
        payment_date: payDate,
        note: payNote,
      });
      showToast(t('تم تسجيل الدفعة', 'Payment recorded'));
      setPayModal(null);
      setPayAmount(''); setPayNote('');
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
    setSaving(false);
  }

  async function handleAddDebt() {
    if (!form.party_name || !form.total_amount) return;
    setSaving(true);
    try {
      await api.debts.create({
        ...form,
        total_amount: parseFloat(form.total_amount),
      });
      showToast(t('تم إضافة الدين', 'Debt added'));
      setAddModal(false);
      setForm({ debt_type: 'purchase', party_name: '', total_amount: '', due_date: '', notes: '' });
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm(t('هل تريد حذف هذا الدين؟', 'Delete this debt?'))) return;
    try {
      await api.debts.delete(id);
      showToast(t('تم الحذف', 'Deleted'));
      setSelected(null);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: `1px solid ${C.border}`, fontSize: 13,
    background: C.white, color: C.charcoal, outline: 'none',
    boxSizing: 'border-box',
  };

  const btnPrimary = {
    padding: '9px 20px', borderRadius: 8, border: 'none',
    background: C.red, color: '#fff', fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
  };

  const btnGhost = {
    padding: '9px 16px', borderRadius: 8,
    border: `1px solid ${C.border}`, background: 'none',
    color: C.charcoal, fontSize: 13, cursor: 'pointer',
  };

  return (
    <div style={{ padding: 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily: language === 'ar' ? 'Arial' : 'inherit' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 10,
          background: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: toast.type === 'error' ? '#b91c1c' : '#15803d',
          fontWeight: 600, fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.charcoal }}>
            {t('إدارة الديون', 'Debt Management')}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.textMuted }}>
            {t('تتبع ديون الشراء والبيع', 'Track purchase & sale debts')}
          </p>
        </div>
        <button onClick={() => setAddModal(true)} style={btnPrimary}>
          + {t('إضافة دين', 'Add Debt')}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: t('ديون الشراء', 'Purchase Debts'), value: `$${summary.purchase_debt.toFixed(2)}`, color: '#6d28d9', bg: '#ede9fe' },
            { label: t('ديون البيع', 'Sale Debts'), value: `$${summary.sale_debt.toFixed(2)}`, color: '#0369a1', bg: '#e0f2fe' },
            { label: t('إجمالي الديون', 'Total Debts'), value: `$${summary.total_debt.toFixed(2)}`, color: C.red, bg: '#fee2e2' },
            { label: t('ديون متأخرة', 'Overdue'), value: summary.overdue_count, color: '#92400e', bg: '#fef3c7' },
          ].map((card, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        {[
          { val: 'all', label: t('الكل', 'All') },
          { val: 'purchase', label: t('ديون الشراء', 'Purchase') },
          { val: 'sale', label: t('ديون البيع', 'Sale') },
        ].map(f => (
          <button key={f.val} onClick={() => setFilter(f.val)} style={{
            padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: filter === f.val ? C.red : C.surface,
            color: filter === f.val ? '#fff' : C.textMuted,
          }}>{f.label}</button>
        ))}
        <div style={{ width: 1, background: C.border, margin: '0 4px' }} />
        {[
          { val: 'all', label: t('كل الحالات', 'All Status') },
          { val: 'unpaid', label: t('غير مدفوع', 'Unpaid') },
          { val: 'partial', label: t('جزئي', 'Partial') },
          { val: 'paid', label: t('مدفوع', 'Paid') },
        ].map(f => (
          <button key={f.val} onClick={() => setStatus(f.val)} style={{
            padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: statusFilter === f.val ? C.charcoal : C.surface,
            color: statusFilter === f.val ? '#fff' : C.textMuted,
          }}>{f.label}</button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>{t('جاري التحميل...', 'Loading...')}</div>
      ) : debts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
          <div>{t('لا توجد ديون', 'No debts found')}</div>
        </div>
      ) : (
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface }}>
                {[
                  t('الطرف', 'Party'),
                  t('النوع', 'Type'),
                  t('الإجمالي', 'Total'),
                  t('المدفوع', 'Paid'),
                  t('المتبقي', 'Remaining'),
                  t('تاريخ الاستحقاق', 'Due Date'),
                  t('الحالة', 'Status'),
                  t('إجراءات', 'Actions'),
                ].map((h, i) => (
                  <th key={i} style={{ padding: '12px 14px', textAlign: isRTL ? 'right' : 'left', fontWeight: 600, color: C.textMuted, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {debts.map(debt => (
                <tr key={debt.id} style={{ borderTop: `1px solid ${C.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surface}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: C.charcoal }}>
                    {debt.party_name}
                    {debt.overdue && <span style={{ marginInlineStart: 6, fontSize: 10, background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                      {t('متأخر', 'OVERDUE')}
                    </span>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: TYPE_COLOR[debt.debt_type]?.bg, color: TYPE_COLOR[debt.debt_type]?.text }}>
                      {debt.debt_type === 'purchase' ? t('شراء', 'Purchase') : t('بيع', 'Sale')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: C.charcoal }}>${debt.total_amount.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', color: '#15803d' }}>${debt.paid_amount.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: debt.remaining_amount > 0 ? C.red : '#15803d' }}>
                    ${debt.remaining_amount.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 14px', color: debt.overdue ? '#b91c1c' : C.textMuted }}>
                    {debt.due_date || '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: STATUS_COLOR[debt.status]?.bg, color: STATUS_COLOR[debt.status]?.text }}>
                      {debt.status === 'paid' ? t('مدفوع', 'Paid') : debt.status === 'partial' ? t('جزئي', 'Partial') : t('غير مدفوع', 'Unpaid')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <button onClick={() => setSelected(debt)} style={{ ...btnGhost, padding: '5px 10px', fontSize: 12 }}>
                        {t('تفاصيل', 'Details')}
                      </button>
                      {debt.status !== 'paid' && (
                        <button onClick={() => { setPayModal(debt); setPayAmount(''); setPayNote(''); setPayDate(new Date().toISOString().split('T')[0]); }}
                          style={{ ...btnPrimary, padding: '5px 10px', fontSize: 12 }}>
                          {t('دفع', 'Pay')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.white, borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '80vh', overflowY: 'auto', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: C.charcoal }}>{selected.party_name}</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.textMuted }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                [t('النوع', 'Type'), selected.debt_type === 'purchase' ? t('شراء', 'Purchase') : t('بيع', 'Sale')],
                [t('الحالة', 'Status'), selected.status],
                [t('الإجمالي', 'Total'), `$${selected.total_amount.toFixed(2)}`],
                [t('المدفوع', 'Paid'), `$${selected.paid_amount.toFixed(2)}`],
                [t('المتبقي', 'Remaining'), `$${selected.remaining_amount.toFixed(2)}`],
                [t('تاريخ الاستحقاق', 'Due Date'), selected.due_date || '—'],
              ].map(([label, val], i) => (
                <div key={i} style={{ background: C.surface, borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal }}>{val}</div>
                </div>
              ))}
            </div>

            {selected.notes && (
              <div style={{ background: C.surface, borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: C.textMuted }}>
                {selected.notes}
              </div>
            )}

            {/* Payments history */}
            <h4 style={{ fontSize: 14, fontWeight: 700, color: C.charcoal, marginBottom: 12 }}>
              {t('سجل الدفعات', 'Payment History')} ({selected.payments?.length || 0})
            </h4>
            {selected.payments?.length === 0 ? (
              <div style={{ textAlign: 'center', color: C.textMuted, fontSize: 13, padding: '12px 0' }}>{t('لا توجد دفعات', 'No payments yet')}</div>
            ) : (
              selected.payments?.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>${p.amount.toFixed(2)}</div>
                    {p.note && <div style={{ fontSize: 11, color: C.textMuted }}>{p.note}</div>}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{p.payment_date}</div>
                </div>
              ))
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              {selected.status !== 'paid' && (
                <button onClick={() => { setPayModal(selected); setSelected(null); }} style={btnPrimary}>
                  {t('تسجيل دفعة', 'Add Payment')}
                </button>
              )}
              <button onClick={() => handleDelete(selected.id)} style={{ ...btnGhost, color: C.red, borderColor: C.red }}>
                {t('حذف', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.white, borderRadius: 16, width: '100%', maxWidth: 420, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: C.charcoal }}>{t('تسجيل دفعة', 'Record Payment')}</h3>
              <button onClick={() => setPayModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.textMuted }}>✕</button>
            </div>

            <div style={{ background: C.surface, borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13 }}>
              <span style={{ color: C.textMuted }}>{t('المتبقي: ', 'Remaining: ')}</span>
              <span style={{ fontWeight: 700, color: C.red }}>${payModal.remaining_amount.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 6 }}>{t('المبلغ *', 'Amount *')}</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  max={payModal.remaining_amount} min={0.01} step={0.01}
                  placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 6 }}>{t('تاريخ الدفع', 'Payment Date')}</label>
                <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 6 }}>{t('ملاحظة', 'Note')}</label>
                <input type="text" value={payNote} onChange={e => setPayNote(e.target.value)}
                  placeholder={t('اختياري', 'Optional')} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={handleAddPayment} disabled={saving} style={btnPrimary}>
                {saving ? '...' : t('حفظ', 'Save')}
              </button>
              <button onClick={() => setPayModal(null)} style={btnGhost}>{t('إلغاء', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Debt Modal */}
      {addModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.white, borderRadius: 16, width: '100%', maxWidth: 460, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: C.charcoal }}>{t('إضافة دين جديد', 'Add New Debt')}</h3>
              <button onClick={() => setAddModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.textMuted }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 6 }}>{t('نوع الدين *', 'Debt Type *')}</label>
                <select value={form.debt_type} onChange={e => setForm({ ...form, debt_type: e.target.value })} style={inputStyle}>
                  <option value="purchase">{t('دين شراء (على الشركة)', 'Purchase Debt (we owe)')}</option>
                  <option value="sale">{t('دين بيع (على العميل)', 'Sale Debt (customer owes)')}</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 6 }}>
                  {form.debt_type === 'purchase' ? t('اسم المورد *', 'Supplier Name *') : t('اسم العميل *', 'Customer Name *')}
                </label>
                <input type="text" value={form.party_name} onChange={e => setForm({ ...form, party_name: e.target.value })}
                  placeholder={form.debt_type === 'purchase' ? t('اسم المورد', 'Supplier name') : t('اسم العميل', 'Customer name')}
                  style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 6 }}>{t('المبلغ الإجمالي *', 'Total Amount *')}</label>
                <input type="number" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })}
                  placeholder="0.00" min={0} step={0.01} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 6 }}>{t('تاريخ الاستحقاق', 'Due Date')}</label>
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 6 }}>{t('ملاحظات', 'Notes')}</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder={t('اختياري', 'Optional')} rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <button onClick={handleAddDebt} disabled={saving} style={btnPrimary}>
                {saving ? '...' : t('إضافة', 'Add')}
              </button>
              <button onClick={() => setAddModal(false)} style={btnGhost}>{t('إلغاء', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}