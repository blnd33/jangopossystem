import { useState } from 'react';
import { COLORS } from '../data/store';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../data/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';

export default function Login({ onLogin }) {
  const { login } = useAuth();
  const { t, isRTL, language, changeLanguage } = useLanguage();
  const { toggleTheme, isDark } = useTheme();
  const C = useThemeColors();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!username.trim()) return setError(t('username') + ' ' + t('required'));
    if (!password.trim()) return setError(t('password') + ' ' + t('required'));
    setLoading(true);
    setError('');
    setTimeout(() => {
      const success = login(username.trim(), password);
      if (!success) {
        setError(t('loginError'));
        setLoading(false);
      } else {
        if (onLogin) onLogin();
      }
    }, 600);
  }

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark
          ? `linear-gradient(135deg, #0f1117 0%, #1a1d21 50%, #0f1117 100%)`
          : `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.charcoalLight} 50%, ${COLORS.charcoal} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
        direction: isRTL ? 'rtl' : 'ltr',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isDark ? 0.03 : 0.05,
          backgroundImage: `repeating-linear-gradient(45deg, ${COLORS.steel} 0px, ${COLORS.steel} 1px, transparent 1px, transparent 40px)`,
        }}
      />

      {/* Red accent line top */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: 4,
          background: `linear-gradient(90deg, transparent, ${C.red}, ${C.red}, transparent)`,
        }}
      />

      {/* Top Controls */}
      <div
        style={{
          position: 'absolute', top: 20,
          right: isRTL ? 'auto' : 20, left: isRTL ? 20 : 'auto',
          display: 'flex', gap: 8, alignItems: 'center',
        }}
      >
        <button onClick={toggleTheme} style={{
          background: isDark ? '#FFD70022' : 'rgba(255,255,255,0.1)',
          border: `1px solid ${isDark ? '#FFD70044' : 'rgba(255,255,255,0.2)'}`,
          borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
          color: isDark ? '#FFD700' : COLORS.steelDark,
          fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {isDark ? 'Light' : 'Dark'}
        </button>

        <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, overflow: 'hidden' }}>
          {[{ code: 'en', label: 'EN' }, { code: 'ar', label: 'AR' }].map((lang) => (
            <button key={lang.code} onClick={() => changeLanguage(lang.code)} style={{
              padding: '6px 14px', border: 'none', cursor: 'pointer',
              background: language === lang.code ? C.red : 'transparent',
              color: language === lang.code ? '#fff' : COLORS.steelDark,
              fontSize: 12, fontWeight: language === lang.code ? 600 : 400,
              transition: 'all 0.15s',
            }}>
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Login Card */}
      <div style={{
        width: 420, background: C.white, borderRadius: 16, overflow: 'hidden',
        boxShadow: isDark ? '0 24px 80px rgba(0,0,0,0.6)' : '0 24px 80px rgba(0,0,0,0.4)',
        position: 'relative', zIndex: 1,
      }}>

        {/* Card Header */}
        <div style={{
          background: isDark
            ? `linear-gradient(135deg, #1e2227, #2a2f36)`
            : `linear-gradient(135deg, ${COLORS.charcoal}, ${COLORS.charcoalLight})`,
          padding: '36px 40px 28px', textAlign: 'center',
        }}>
          {/* Jango Logo */}
          <div style={{ margin: '0 auto 16px' }}>
            <img
              src="/jango-logo.jpeg"
              alt="Jango Logo"
              style={{
                width: 160, height: 'auto',
                borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              }}
            />
          </div>

          <div style={{
            width: 50, height: 3,
            background: `linear-gradient(90deg, transparent, ${C.red}, transparent)`,
            margin: '8px auto',
          }} />

          <div style={{ fontSize: 13, color: COLORS.steelDark, marginTop: 8 }}>
            {t('signInTo')}
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: '32px 40px 36px', background: C.white }}>
          <div style={{
            fontSize: 20, fontWeight: 700, color: C.charcoal,
            marginBottom: 24, textAlign: 'center',
            fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif',
          }}>
            {t('welcomeBack')}
          </div>

          <form onSubmit={handleLogin}>
            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6, textAlign: isRTL ? 'right' : 'left' }}>
                {t('username')}
              </div>
              <input
                type="text" value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder={t('username')} autoComplete="username"
                style={{
                  width: '100%', padding: '12px 16px',
                  border: `1.5px solid ${error ? C.red : C.border}`,
                  borderRadius: 9, fontSize: 14, color: C.charcoal,
                  outline: 'none', boxSizing: 'border-box',
                  background: C.white, textAlign: isRTL ? 'right' : 'left',
                }}
                onFocus={(e) => (e.target.style.borderColor = C.red)}
                onBlur={(e) => (e.target.style.borderColor = error ? C.red : C.border)}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6, textAlign: isRTL ? 'right' : 'left' }}>
                {t('password')}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder={t('password')} autoComplete="current-password"
                  style={{
                    width: '100%', padding: '12px 16px',
                    paddingRight: isRTL ? 16 : 44, paddingLeft: isRTL ? 44 : 16,
                    border: `1.5px solid ${error ? C.red : C.border}`,
                    borderRadius: 9, fontSize: 14, color: C.charcoal,
                    outline: 'none', boxSizing: 'border-box',
                    background: C.white, textAlign: isRTL ? 'right' : 'left',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = C.red)}
                  onBlur={(e) => (e.target.style.borderColor = error ? C.red : C.border)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                  right: isRTL ? 'auto' : 12, left: isRTL ? 12 : 'auto',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, color: C.textMuted, padding: 4,
                }}>
                  {showPassword ? t('hide') || 'Hide' : t('show') || 'Show'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: `${C.red}12`, border: `1px solid ${C.red}44`,
                borderRadius: 8, padding: '10px 14px', fontSize: 13,
                color: C.red, fontWeight: 500, marginBottom: 16,
                textAlign: isRTL ? 'right' : 'left',
              }}>
                {error}
              </div>
            )}

            {/* Login Button */}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px 0', marginTop: 16,
              borderRadius: 9, border: 'none', cursor: loading ? 'wait' : 'pointer',
              background: loading ? C.border : `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
              color: loading ? C.textMuted : '#fff',
              fontSize: 15, fontWeight: 700,
              boxShadow: loading ? 'none' : `0 4px 14px ${C.red}44`,
              transition: 'all 0.2s', letterSpacing: 0.5,
            }}>
              {loading ? '...' : t('loginBtn')}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 40px 20px', textAlign: 'center',
          borderTop: `1px solid ${C.border}`, background: C.white,
        }}>
          <div style={{ fontSize: 11, color: C.textMuted }}>
            {t('version')} · Jango Furniture
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
            Powered & Developed by{' '}
            <a
              href="https://coda-agency.net/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: C.red, fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
            >
              CODA Agency
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}