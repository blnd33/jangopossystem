import { useState, useEffect, useRef } from 'react';
import { COLORS } from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useThemeColors } from '../hooks/useThemeColors';

const DEFAULT_SETTINGS = {
  companyName: 'Jango', companyTagline: 'Furniture',
  address: 'Sulaymaniyah, Iraq', phone: '', email: '', website: '',
  currency: '$', currencyCode: 'USD', taxEnabled: false, taxRate: 0,
  receiptHeader: 'Thank you for shopping at Jango!',
  receiptFooter: 'Sulaymaniyah, Iraq',
  receiptMessage: 'Please keep your receipt for returns.',
  lowStockDefault: 5,
};

function getSettings() {
  return JSON.parse(localStorage.getItem('jango_settings') || JSON.stringify(DEFAULT_SETTINGS));
}
function saveSettingsData(data) {
  localStorage.setItem('jango_settings', JSON.stringify(data));
}

export default function Settings() {
  const { t, isRTL, language } = useLanguage();
  const { currencySettings, updateCurrency } = useCurrency();
  const C = useThemeColors();
  const [settings, setSettings] = useState(getSettings());
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [clearConfirm, setClearConfirm] = useState(false);
  const fileRef = useRef();

  function handleSave() {
    saveSettingsData(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleExport() {
    const allData = {
      settings: getSettings(),
      suppliers: JSON.parse(localStorage.getItem('jango_suppliers') || '[]'),
      categories: JSON.parse(localStorage.getItem('jango_categories') || '[]'),
      products: JSON.parse(localStorage.getItem('jango_products') || '[]'),
      customers: JSON.parse(localStorage.getItem('jango_customers') || '[]'),
      sales: JSON.parse(localStorage.getItem('jango_sales') || '[]'),
      expenses: JSON.parse(localStorage.getItem('jango_expenses') || '[]'),
      employees: JSON.parse(localStorage.getItem('jango_employees') || '[]'),
      deliveries: JSON.parse(localStorage.getItem('jango_deliveries') || '[]'),
      purchase_orders: JSON.parse(localStorage.getItem('jango_purchase_orders') || '[]'),
      returns: JSON.parse(localStorage.getItem('jango_returns') || '[]'),
    };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jango-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.suppliers) localStorage.setItem('jango_suppliers', JSON.stringify(data.suppliers));
        if (data.categories) localStorage.setItem('jango_categories', JSON.stringify(data.categories));
        if (data.products) localStorage.setItem('jango_products', JSON.stringify(data.products));
        if (data.customers) localStorage.setItem('jango_customers', JSON.stringify(data.customers));
        if (data.sales) localStorage.setItem('jango_sales', JSON.stringify(data.sales));
        if (data.expenses) localStorage.setItem('jango_expenses', JSON.stringify(data.expenses));
        if (data.employees) localStorage.setItem('jango_employees', JSON.stringify(data.employees));
        if (data.deliveries) localStorage.setItem('jango_deliveries', JSON.stringify(data.deliveries));
        if (data.purchase_orders) localStorage.setItem('jango_purchase_orders', JSON.stringify(data.purchase_orders));
        if (data.returns) localStorage.setItem('jango_returns', JSON.stringify(data.returns));
        if (data.settings) { saveSettingsData(data.settings); setSettings(data.settings); }
        alert(language === 'ar' ? '✅ تم استعادة البيانات بنجاح!' : '✅ Data restored successfully!');
      } catch {
        alert(language === 'ar' ? '❌ ملف غير صالح' : '❌ Invalid backup file.');
      }
    };
    reader.readAsText(file);
  }

  function handleClearAll() {
    const keys = ['jango_suppliers', 'jango_categories', 'jango_products', 'jango_customers', 'jango_sales', 'jango_expenses', 'jango_employees', 'jango_deliveries', 'jango_purchase_orders', 'jango_returns'];
    keys.forEach(k => localStorage.removeItem(k));
    setClearConfirm(false);
    alert(language === 'ar' ? '✅ تم حذف جميع البيانات' : '✅ All data cleared.');
  }

  const TABS = [
    { id: 'company', label: t('companyInfo') },
    { id: 'finance', label: t('financeSettings') },
    { id: 'receipt', label: t('receiptCustomization') },
    { id: 'data', label: t('dataBackup') },
  ];

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    border: `1px solid ${C.border}`, borderRadius: 7,
    fontSize: 13, color: C.charcoal, outline: 'none',
    boxSizing: 'border-box', background: C.white,
    textAlign: isRTL ? 'right' : 'left'
  };

  return (
    <div style={{ padding: 24, direction: isRTL ? 'rtl' : 'ltr', fontFamily, background: C.offWhite, minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.charcoal, fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
            {t('settings')}
          </div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
            {language === 'ar' ? 'إدارة تفضيلات النظام' : 'Manage your system preferences'}
          </div>
        </div>
        <button onClick={handleSave} style={{
          background: saved ? `linear-gradient(135deg, ${C.success}, #15803d)` : `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
          border: 'none', borderRadius: 8, padding: '10px 24px',
          color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s'
        }}>
          {saved ? t('saved') : t('saveSettings')}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: C.offWhite, borderRadius: 10, padding: 4, border: `1px solid ${C.border}`, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
            background: activeTab === tab.id ? C.white : 'none',
            color: activeTab === tab.id ? C.charcoal : C.textMuted,
            fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
            cursor: 'pointer',
            boxShadow: activeTab === tab.id ? `0 1px 4px ${C.shadow}` : 'none',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── COMPANY TAB ── */}
      {activeTab === 'company' && (
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: 28 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.charcoal, marginBottom: 20 }}>{t('companyInfo')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: t('companyName'), key: 'companyName', placeholder: 'Jango' },
              { label: t('tagline'), key: 'companyTagline', placeholder: 'Furniture' },
              { label: t('phone'), key: 'phone', placeholder: '+964 750 000 0000' },
              { label: t('email'), key: 'email', placeholder: 'info@jango.com' },
              { label: t('website'), key: 'website', placeholder: 'www.jango.com' },
            ].map(field => (
              <div key={field.key}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>{field.label}</div>
                <input value={settings[field.key]} onChange={e => setSettings({ ...settings, [field.key]: e.target.value })} placeholder={field.placeholder} style={inputStyle} />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>{t('address')}</div>
              <textarea value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
        </div>
      )}

      {/* ── FINANCE TAB ── */}
      {activeTab === 'finance' && (
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: 28 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.charcoal, marginBottom: 20 }}>{t('financeSettings')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Low Stock */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>{t('lowStockDefault')}</div>
              <input type="number" value={settings.lowStockDefault} onChange={e => setSettings({ ...settings, lowStockDefault: parseInt(e.target.value) || 5 })} style={inputStyle} />
            </div>

            {/* Currency Section */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.border}`, textAlign: isRTL ? 'right' : 'left' }}>
                {language === 'ar' ? '💰 إعدادات العملة' : '💰 Currency Settings'}
              </div>

              {/* Currency Buttons */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 10, textAlign: isRTL ? 'right' : 'left' }}>
                  {language === 'ar' ? 'اختر العملة' : 'Select Currency'}
                </div>
                <div style={{ display: 'flex', gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  {[
                    { code: 'USD', symbol: '$', label: language === 'ar' ? 'دولار أمريكي' : 'US Dollar', sublabel: 'USD', flag: '🇺🇸' },
                    { code: 'IQD', symbol: 'IQD', label: language === 'ar' ? 'دينار عراقي' : 'Iraqi Dinar', sublabel: 'IQD', flag: '🇮🇶' },
                  ].map(curr => (
                    <button key={curr.code} onClick={() => updateCurrency({ ...currencySettings, currency: curr.code, symbol: curr.symbol })} style={{
                      flex: 1, padding: '18px 20px', borderRadius: 12, cursor: 'pointer',
                      border: `2px solid ${currencySettings.currency === curr.code ? C.red : C.border}`,
                      background: currencySettings.currency === curr.code ? `${C.red}08` : C.white,
                      transition: 'all 0.2s', textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{curr.flag}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: currencySettings.currency === curr.code ? C.red : C.charcoal, marginBottom: 2 }}>{curr.label}</div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>{curr.sublabel}</div>
                      {currencySettings.currency === curr.code && (
                        <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: '#fff', background: C.red, padding: '3px 12px', borderRadius: 20, display: 'inline-block' }}>
                          {language === 'ar' ? '✓ محدد حالياً' : '✓ Active'}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exchange Rate */}
              <div style={{ background: `${C.info}08`, border: `1px solid ${C.info}33`, borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ textAlign: isRTL ? 'right' : 'left', marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.info, marginBottom: 4 }}>
                    📊 {language === 'ar' ? 'سعر الصرف اليوم' : "Today's Exchange Rate"}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>
                    {language === 'ar' ? 'أدخل كم يساوي الدولار بالدينار اليوم' : 'Enter how much 1 USD equals in IQD today'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row', marginBottom: 20 }}>
                  <div style={{ background: C.white, borderRadius: 10, padding: '12px 18px', border: `1px solid ${C.border}`, fontSize: 16, fontWeight: 800, color: C.charcoal, flexShrink: 0 }}>$1 USD</div>
                  <div style={{ fontSize: 20, color: C.textMuted, flexShrink: 0 }}>＝</div>
                  <input
                    type="number"
                    value={currencySettings.exchangeRate}
                    onChange={e => updateCurrency({ ...currencySettings, exchangeRate: parseFloat(e.target.value) || 0 })}
                    placeholder="1480"
                    style={{ flex: 1, padding: '14px 16px', border: `2px solid ${C.info}66`, borderRadius: 10, fontSize: 22, fontWeight: 800, color: C.charcoal, outline: 'none', textAlign: 'center', boxSizing: 'border-box', background: C.white }}
                    onFocus={e => e.target.style.borderColor = C.info}
                    onBlur={e => e.target.style.borderColor = `${C.info}66`}
                  />
                  <div style={{ background: C.white, borderRadius: 10, padding: '12px 18px', border: `1px solid ${C.border}`, fontSize: 16, fontWeight: 800, color: C.charcoal, flexShrink: 0 }}>IQD</div>
                </div>

                {/* Quick conversions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                  {[1, 10, 50, 100].map(usd => (
                    <div key={usd} style={{ background: C.white, borderRadius: 10, padding: '12px 8px', textAlign: 'center', border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.success, marginBottom: 4 }}>${usd}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>↓</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>{(usd * currencySettings.exchangeRate).toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>IQD</div>
                    </div>
                  ))}
                </div>

                {/* Preview */}
                <div style={{ background: C.white, borderRadius: 10, padding: '14px 18px', border: `1px solid ${C.info}33`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.charcoal }}>{language === 'ar' ? '🖥️ كيف ستظهر الأسعار' : '🖥️ How prices appear'}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{language === 'ar' ? 'مثال: منتج بسعر 100 دولار' : 'Example: $100 product'}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.red }}>
                    {currencySettings.currency === 'IQD' ? `${(100 * currencySettings.exchangeRate).toLocaleString()} IQD` : '$100.00'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tax */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ background: C.offWhite, borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>{t('taxEnabled')}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{t('addTaxAuto')}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  {settings.taxEnabled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: C.textMuted }}>{t('taxRate')}</span>
                      <input type="number" value={settings.taxRate} onChange={e => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })} style={{ width: 70, padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: C.white, color: C.charcoal }} />
                    </div>
                  )}
                  <button onClick={() => setSettings({ ...settings, taxEnabled: !settings.taxEnabled })} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: settings.taxEnabled ? C.success : C.border, cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: settings.taxEnabled ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RECEIPT TAB ── */}
      {activeTab === 'receipt' && (
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: 28 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.charcoal, marginBottom: 20 }}>{t('receiptCustomization')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ display: 'grid', gap: 14 }}>
              {[
                { label: t('receiptHeader'), key: 'receiptHeader' },
                { label: t('receiptFooter'), key: 'receiptFooter' },
                { label: t('thankYouMsg'), key: 'receiptMessage' },
              ].map(field => (
                <div key={field.key}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>{field.label}</div>
                  <input value={settings[field.key]} onChange={e => setSettings({ ...settings, [field.key]: e.target.value })} style={inputStyle} />
                </div>
              ))}
            </div>

            {/* Receipt Preview */}
            <div style={{ background: C.offWhite, borderRadius: 10, padding: 20, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>{t('preview')}</div>
              <div style={{ background: C.white, borderRadius: 8, padding: 16, border: `1px solid ${C.border}` }}>
                <div style={{ textAlign: 'center', paddingBottom: 12, borderBottom: `1px dashed ${C.border}`, marginBottom: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.charcoal }}>{language === 'ar' ? 'جانغو' : settings.companyName}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{settings.companyTagline}</div>
                  <div style={{ width: 40, height: 2, background: `linear-gradient(90deg, transparent, ${C.red}, transparent)`, margin: '6px auto' }} />
                  <div style={{ fontSize: 11, color: C.textMuted }}>{settings.receiptHeader}</div>
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{language === 'ar' ? 'منتج ١ x2' : 'Item 1 x2'}</span><span>{currencySettings.currency === 'IQD' ? `${(100 * currencySettings.exchangeRate).toLocaleString()} IQD` : '$100.00'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{language === 'ar' ? 'منتج ٢ x1' : 'Item 2 x1'}</span><span>{currencySettings.currency === 'IQD' ? `${(50 * currencySettings.exchangeRate).toLocaleString()} IQD` : '$50.00'}</span>
                  </div>
                </div>
                <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                    <span>{t('total')}</span><span>{currencySettings.currency === 'IQD' ? `${(150 * currencySettings.exchangeRate).toLocaleString()} IQD` : '$150.00'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: 10, color: C.textMuted }}>
                  <div>{settings.receiptMessage}</div>
                  <div style={{ marginTop: 4 }}>{settings.receiptFooter}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DATA TAB ── */}
      {activeTab === 'data' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Export */}
          <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>{t('exportData')}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
              {language === 'ar' ? 'تحميل جميع البيانات كملف JSON' : 'Download all your data as a JSON file for backup.'}
            </div>
            <button onClick={handleExport} style={{ background: `linear-gradient(135deg, ${C.success}, #15803d)`, border: 'none', borderRadius: 8, padding: '10px 24px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t('downloadBackup')}
            </button>
          </div>

          {/* Import */}
          <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>{t('restoreData')}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
              {language === 'ar' ? 'رفع ملف النسخ الاحتياطي لاستعادة البيانات.' : 'Upload a backup JSON file to restore all data.'}
            </div>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            <button onClick={() => fileRef.current.click()} style={{ background: `linear-gradient(135deg, ${C.info}, #1d4ed8)`, border: 'none', borderRadius: 8, padding: '10px 24px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t('restoreBackup')}
            </button>
          </div>

          {/* Data Overview */}
          <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.charcoal, marginBottom: 16 }}>{t('dataOverview')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: t('suppliers'), key: 'jango_suppliers' },
                { label: t('inventory'), key: 'jango_products' },
                { label: t('customers'), key: 'jango_customers' },
                { label: t('salesReport'), key: 'jango_sales' },
                { label: t('expenses'), key: 'jango_expenses' },
                { label: t('employees'), key: 'jango_employees' },
                { label: t('delivery'), key: 'jango_deliveries' },
                { label: t('returns'), key: 'jango_returns' },
              ].map(item => {
                const count = JSON.parse(localStorage.getItem(item.key) || '[]').length;
                return (
                  <div key={item.key} style={{ background: C.offWhite, borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{item.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.charcoal, marginTop: 4 }}>{count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger Zone */}
          <div style={{ background: C.white, borderRadius: 12, border: `2px solid ${C.red}33`, padding: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.red, marginBottom: 8 }}>⚠️ {t('dangerZone')}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>{t('deleteAll')}</div>
            <button onClick={() => setClearConfirm(true)} style={{ background: `${C.red}15`, border: `1px solid ${C.red}44`, borderRadius: 8, padding: '10px 24px', color: C.red, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              🗑️ {t('clearAll')}
            </button>
          </div>
        </div>
      )}

      {/* Clear Confirm Modal */}
      {clearConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: C.white, borderRadius: 14, padding: 32, width: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.3)', textAlign: 'center', direction: isRTL ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.red, marginBottom: 8 }}>{t('clearAll')}?</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 8, lineHeight: 1.6 }}>{t('deleteAll')}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.red, background: `${C.red}12`, padding: '8px 16px', borderRadius: 8, marginBottom: 24 }}>{t('cannotUndo')}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setClearConfirm(false)} style={{ padding: '10px 28px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.charcoalMid, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>{t('cancel')}</button>
              <button onClick={handleClearAll} style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: C.red, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>{t('deleteEverything')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}