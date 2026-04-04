import { useState, useEffect, useRef } from 'react';
import { COLORS } from '../data/store';

const DEFAULT_SETTINGS = {
  companyName: 'Jango',
  companyTagline: 'Furniture',
  address: 'Sulaymaniyah, Iraq',
  phone: '',
  email: '',
  website: '',
  currency: '$',
  currencyCode: 'USD',
  taxEnabled: false,
  taxRate: 0,
  receiptHeader: 'Thank you for shopping at Jango!',
  receiptFooter: 'Sulaymaniyah, Iraq',
  receiptMessage: 'Please keep your receipt for returns.',
  lowStockDefault: 5,
};

function getSettings() {
  return JSON.parse(localStorage.getItem('jango_settings') || JSON.stringify(DEFAULT_SETTINGS));
}

function saveSettings(data) {
  localStorage.setItem('jango_settings', JSON.stringify(data));
}

export default function Settings() {
  const [settings, setSettings] = useState(getSettings());
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [clearConfirm, setClearConfirm] = useState(false);
  const fileRef = useRef();

  function handleSave() {
    saveSettings(settings);
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
        if (data.settings) { saveSettings(data.settings); setSettings(data.settings); }
        alert('✅ Data restored successfully! Refresh the page to see all data.');
      } catch {
        alert('❌ Invalid backup file. Please use a valid Jango backup JSON file.');
      }
    };
    reader.readAsText(file);
  }

  function handleClearAll() {
    const keys = [
      'jango_suppliers', 'jango_categories', 'jango_products',
      'jango_customers', 'jango_sales', 'jango_expenses',
      'jango_employees', 'jango_deliveries', 'jango_purchase_orders',
      'jango_returns'
    ];
    keys.forEach(k => localStorage.removeItem(k));
    setClearConfirm(false);
    alert('✅ All data cleared. Refresh the page.');
  }

  const TABS = [
    { id: 'company', label: 'Company Info' },
    { id: 'finance', label: 'Finance & Tax' },
    { id: 'receipt', label: 'Receipt' },
    { id: 'data', label: 'Data & Backup' },
  ];

  return (
    <div style={{ padding: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>
            Settings
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
            Manage your system preferences
          </div>
        </div>
        <button
          onClick={handleSave}
          style={{
            background: saved
              ? `linear-gradient(135deg, ${COLORS.success}, #15803d)`
              : `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
            border: 'none', borderRadius: 8, padding: '10px 24px',
            color: COLORS.white, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', boxShadow: `0 2px 8px ${saved ? COLORS.success : COLORS.red}44`,
            transition: 'all 0.3s'
          }}
        >
          {saved ? '✅ Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 2, marginBottom: 24,
        background: COLORS.offWhite, borderRadius: 10,
        padding: 4, border: `1px solid ${COLORS.border}`
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
              background: activeTab === tab.id ? COLORS.white : 'none',
              color: activeTab === tab.id ? COLORS.charcoal : COLORS.textMuted,
              fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer',
              boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Company Info Tab */}
      {activeTab === 'company' && (
        <div style={{
          background: COLORS.white, borderRadius: 12,
          border: `1px solid ${COLORS.border}`, padding: 28
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.charcoal, marginBottom: 20 }}>
            Company Information
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Company Name', key: 'companyName', placeholder: 'Jango' },
              { label: 'Tagline', key: 'companyTagline', placeholder: 'Furniture' },
              { label: 'Phone', key: 'phone', placeholder: '+964 750 000 0000' },
              { label: 'Email', key: 'email', placeholder: 'info@jango.com' },
              { label: 'Website', key: 'website', placeholder: 'www.jango.com' },
            ].map(field => (
              <div key={field.key}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 6 }}>
                  {field.label}
                </div>
                <input
                  value={settings[field.key]}
                  onChange={e => setSettings({ ...settings, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: `1px solid ${COLORS.border}`, borderRadius: 7,
                    fontSize: 13, color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 6 }}>
                Address
              </div>
              <textarea
                value={settings.address}
                onChange={e => setSettings({ ...settings, address: e.target.value })}
                placeholder="Company address..."
                rows={3}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: `1px solid ${COLORS.border}`, borderRadius: 7,
                  fontSize: 13, color: COLORS.charcoal, outline: 'none',
                  resize: 'vertical', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Finance & Tax Tab */}
      {activeTab === 'finance' && (
        <div style={{
          background: COLORS.white, borderRadius: 12,
          border: `1px solid ${COLORS.border}`, padding: 28
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.charcoal, marginBottom: 20 }}>
            Finance & Tax Settings
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Currency */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 6 }}>
                Currency Symbol
              </div>
              <input
                value={settings.currency}
                onChange={e => setSettings({ ...settings, currency: e.target.value })}
                placeholder="$"
                style={{
                  width: '100%', padding: '9px 12px',
                  border: `1px solid ${COLORS.border}`, borderRadius: 7,
                  fontSize: 13, color: COLORS.charcoal, outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Currency Code */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 6 }}>
                Currency Code
              </div>
              <select
                value={settings.currencyCode}
                onChange={e => setSettings({ ...settings, currencyCode: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: `1px solid ${COLORS.border}`, borderRadius: 7,
                  fontSize: 13, color: COLORS.charcoal, outline: 'none',
                  background: COLORS.white, boxSizing: 'border-box'
                }}
              >
                <option value="USD">USD — US Dollar</option>
                <option value="IQD">IQD — Iraqi Dinar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="TRY">TRY — Turkish Lira</option>
                <option value="SAR">SAR — Saudi Riyal</option>
                <option value="AED">AED — UAE Dirham</option>
              </select>
            </div>

            {/* Low Stock Default */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 6 }}>
                Default Low Stock Alert (units)
              </div>
              <input
                type="number"
                value={settings.lowStockDefault}
                onChange={e => setSettings({ ...settings, lowStockDefault: parseInt(e.target.value) || 5 })}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: `1px solid ${COLORS.border}`, borderRadius: 7,
                  fontSize: 13, color: COLORS.charcoal, outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Tax Toggle */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{
                background: COLORS.offWhite, borderRadius: 10,
                padding: '16px 20px', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>
                    Enable Tax
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    Add tax to all sales automatically
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {settings.taxEnabled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: COLORS.textMuted }}>Tax Rate %</span>
                      <input
                        type="number"
                        value={settings.taxRate}
                        onChange={e => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                        style={{
                          width: 70, padding: '7px 10px',
                          border: `1px solid ${COLORS.border}`, borderRadius: 7,
                          fontSize: 13, outline: 'none'
                        }}
                      />
                    </div>
                  )}
                  <button
                    onClick={() => setSettings({ ...settings, taxEnabled: !settings.taxEnabled })}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none',
                      background: settings.taxEnabled ? COLORS.success : COLORS.border,
                      cursor: 'pointer', position: 'relative', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: COLORS.white,
                      position: 'absolute', top: 3,
                      left: settings.taxEnabled ? 23 : 3,
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Tab */}
      {activeTab === 'receipt' && (
        <div style={{
          background: COLORS.white, borderRadius: 12,
          border: `1px solid ${COLORS.border}`, padding: 28
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.charcoal, marginBottom: 20 }}>
            Receipt Customization
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Settings */}
            <div style={{ display: 'grid', gap: 14 }}>
              {[
                { label: 'Receipt Header Message', key: 'receiptHeader', placeholder: 'Thank you for shopping at Jango!' },
                { label: 'Receipt Footer', key: 'receiptFooter', placeholder: 'Sulaymaniyah, Iraq' },
                { label: 'Thank You Message', key: 'receiptMessage', placeholder: 'Please keep your receipt for returns.' },
              ].map(field => (
                <div key={field.key}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid, marginBottom: 6 }}>
                    {field.label}
                  </div>
                  <input
                    value={settings[field.key]}
                    onChange={e => setSettings({ ...settings, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%', padding: '9px 12px',
                      border: `1px solid ${COLORS.border}`, borderRadius: 7,
                      fontSize: 13, color: COLORS.charcoal, outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Receipt Preview */}
            <div style={{
              background: COLORS.offWhite, borderRadius: 10,
              padding: 20, border: `1px solid ${COLORS.border}`
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Preview
              </div>
              <div style={{
                background: COLORS.white, borderRadius: 8,
                padding: 16, border: `1px solid ${COLORS.border}`
              }}>
                <div style={{
                  textAlign: 'center', paddingBottom: 12,
                  borderBottom: `1px dashed ${COLORS.border}`, marginBottom: 12
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.charcoal, fontFamily: 'Georgia, serif' }}>
                    {settings.companyName}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{settings.companyTagline}</div>
                  <div style={{
                    width: 40, height: 2,
                    background: `linear-gradient(90deg, transparent, ${COLORS.red}, transparent)`,
                    margin: '6px auto'
                  }} />
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{settings.receiptHeader}</div>
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Item 1 x2</span><span>$100.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Item 2 x1</span><span>$50.00</span>
                  </div>
                </div>
                <div style={{
                  borderTop: `1px dashed ${COLORS.border}`,
                  paddingTop: 8, marginBottom: 8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                    <span>TOTAL</span><span>$150.00</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: 10, color: COLORS.textMuted }}>
                  <div>{settings.receiptMessage}</div>
                  <div style={{ marginTop: 4 }}>{settings.receiptFooter}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data & Backup Tab */}
      {activeTab === 'data' && (
        <div style={{ display: 'grid', gap: 16 }}>

          {/* Export */}
          <div style={{
            background: COLORS.white, borderRadius: 12,
            border: `1px solid ${COLORS.border}`, padding: 28
          }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.charcoal, marginBottom: 8 }}>
              Export Data Backup
            </div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>
              Download all your data as a JSON file. Use this to backup your data or transfer to another device.
            </div>
            <button
              onClick={handleExport}
              style={{
                background: `linear-gradient(135deg, ${COLORS.success}, #15803d)`,
                border: 'none', borderRadius: 8, padding: '10px 24px',
                color: COLORS.white, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', boxShadow: `0 2px 8px ${COLORS.success}44`
              }}
            >
              ⬇️ Download Backup
            </button>
          </div>

          {/* Import */}
          <div style={{
            background: COLORS.white, borderRadius: 12,
            border: `1px solid ${COLORS.border}`, padding: 28
          }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.charcoal, marginBottom: 8 }}>
              Restore From Backup
            </div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>
              Upload a Jango backup JSON file to restore all your data. This will overwrite existing data.
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileRef.current.click()}
              style={{
                background: `linear-gradient(135deg, ${COLORS.info}, #1d4ed8)`,
                border: 'none', borderRadius: 8, padding: '10px 24px',
                color: COLORS.white, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', boxShadow: `0 2px 8px ${COLORS.info}44`
              }}
            >
              ⬆️ Restore Backup
            </button>
          </div>

          {/* Data Stats */}
          <div style={{
            background: COLORS.white, borderRadius: 12,
            border: `1px solid ${COLORS.border}`, padding: 28
          }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.charcoal, marginBottom: 16 }}>
              Data Overview
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Suppliers', key: 'jango_suppliers' },
                { label: 'Products', key: 'jango_products' },
                { label: 'Customers', key: 'jango_customers' },
                { label: 'Sales', key: 'jango_sales' },
                { label: 'Expenses', key: 'jango_expenses' },
                { label: 'Employees', key: 'jango_employees' },
                { label: 'Deliveries', key: 'jango_deliveries' },
                { label: 'Returns', key: 'jango_returns' },
              ].map(item => {
                const count = JSON.parse(localStorage.getItem(item.key) || '[]').length;
                return (
                  <div key={item.key} style={{
                    background: COLORS.offWhite, borderRadius: 8,
                    padding: '12px 14px', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>{item.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.charcoal, marginTop: 4 }}>
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger Zone */}
          <div style={{
            background: COLORS.white, borderRadius: 12,
            border: `2px solid ${COLORS.red}33`, padding: 28
          }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.red, marginBottom: 8 }}>
              ⚠️ Danger Zone
            </div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>
              This will permanently delete ALL data including products, sales, customers, and more. This cannot be undone.
            </div>
            <button
              onClick={() => setClearConfirm(true)}
              style={{
                background: `${COLORS.red}15`,
                border: `1px solid ${COLORS.red}44`,
                borderRadius: 8, padding: '10px 24px',
                color: COLORS.red, fontSize: 13, fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🗑️ Clear All Data
            </button>
          </div>
        </div>
      )}

      {/* Clear Confirm Modal */}
      {clearConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: COLORS.white, borderRadius: 14, padding: 32,
            width: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.3)', textAlign: 'center'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.red, marginBottom: 8 }}>
              Delete ALL Data?
            </div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8, lineHeight: 1.6 }}>
              This will permanently delete everything — products, sales, customers, employees, and all records.
            </div>
            <div style={{
              fontSize: 13, fontWeight: 600, color: COLORS.red,
              background: `${COLORS.red}12`, padding: '8px 16px',
              borderRadius: 8, marginBottom: 24
            }}>
              This action CANNOT be undone!
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setClearConfirm(false)} style={{
                padding: '10px 28px', borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.white, color: COLORS.charcoalMid,
                fontSize: 13, cursor: 'pointer', fontWeight: 500
              }}>
                Cancel
              </button>
              <button onClick={handleClearAll} style={{
                padding: '10px 28px', borderRadius: 8, border: 'none',
                background: COLORS.red, color: COLORS.white,
                fontSize: 13, cursor: 'pointer', fontWeight: 700
              }}>
                Yes, Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}