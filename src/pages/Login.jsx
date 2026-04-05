import { useState } from 'react';
import { COLORS } from '../data/store';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../data/LanguageContext';

export default function Login() {
  const { login } = useAuth();
  const { t, isRTL, language, changeLanguage } = useLanguage();
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
      }
    }, 600);
  }

  const fontFamily = language === 'ar' ? 'Arial, sans-serif' : 'inherit';

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.charcoalLight} 50%, ${COLORS.charcoal} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily, direction: isRTL ? 'rtl' : 'ltr',
      position: 'relative', overflow: 'hidden'
    }}>

      {/* Background pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.05,
        backgroundImage: `repeating-linear-gradient(
          45deg, ${COLORS.steel} 0px, ${COLORS.steel} 1px,
          transparent 1px, transparent 40px
        )`
      }} />

      {/* Red accent line top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 4,
        background: `linear-gradient(90deg, transparent, ${COLORS.red}, ${COLORS.red}, transparent)`
      }} />

      {/* Language switcher */}
      <div style={{
        position: 'absolute', top: 20,
        right: isRTL ? 'auto' : 20,
        left: isRTL ? 20 : 'auto',
        display: 'flex', border: `1px solid ${COLORS.charcoalMid}`,
        borderRadius: 8, overflow: 'hidden'
      }}>
        {[
          { code: 'en', label: '🇬🇧 EN' },
          { code: 'ar', label: '🇮🇶 AR' },
        ].map(lang => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            style={{
              padding: '6px 14px', border: 'none', cursor: 'pointer',
              background: language === lang.code ? COLORS.red : 'transparent',
              color: language === lang.code ? COLORS.white : COLORS.steelDark,
              fontSize: 12, fontWeight: language === lang.code ? 600 : 400,
              transition: 'all 0.15s'
            }}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Login Card */}
      <div style={{
        width: 420, background: COLORS.white,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        position: 'relative', zIndex: 1
      }}>

        {/* Card Header */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.charcoal}, ${COLORS.charcoalLight})`,
          padding: '36px 40px 28px', textAlign: 'center'
        }}>
          {/* Logo */}
          <div style={{
            width: 64, height: 64, borderRadius: 14, margin: '0 auto 16px',
            background: `linear-gradient(135deg, ${COLORS.steel}, ${COLORS.steelDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            border: '2px solid rgba(255,255,255,0.15)'
          }}>
            <span style={{
              fontSize: 28, fontWeight: 900, color: COLORS.charcoal,
              fontFamily: 'Georgia, serif'
            }}>J</span>
          </div>

          <div style={{
            fontSize: 26, fontWeight: 800, color: COLORS.white,
            fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif',
            letterSpacing: 1
          }}>
            {language === 'ar' ? 'جانغو' : 'JANGO'}
          </div>

          <div style={{
            width: 50, height: 3,
            background: `linear-gradient(90deg, transparent, ${COLORS.red}, transparent)`,
            margin: '8px auto'
          }} />

          <div style={{ fontSize: 13, color: COLORS.steelDark, marginTop: 8 }}>
            {t('signInTo')}
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: '32px 40px 36px' }}>
          <div style={{
            fontSize: 20, fontWeight: 700, color: COLORS.charcoal,
            marginBottom: 24, textAlign: 'center',
            fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif'
          }}>
            {t('welcomeBack')} 👋
          </div>

          <form onSubmit={handleLogin}>

            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid,
                marginBottom: 6, textAlign: isRTL ? 'right' : 'left'
              }}>
                {t('username')}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  placeholder={t('username')}
                  autoComplete="username"
                  style={{
                    width: '100%', padding: '12px 16px',
                    paddingLeft: isRTL ? 16 : 44,
                    paddingRight: isRTL ? 44 : 16,
                    border: `1.5px solid ${error ? COLORS.red : COLORS.border}`,
                    borderRadius: 9, fontSize: 14,
                    color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box', transition: 'border 0.15s',
                    textAlign: isRTL ? 'right' : 'left'
                  }}
                  onFocus={e => e.target.style.borderColor = COLORS.red}
                  onBlur={e => e.target.style.borderColor = error ? COLORS.red : COLORS.border}
                />
                <span style={{
                  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                  left: isRTL ? 'auto' : 14, right: isRTL ? 14 : 'auto',
                  fontSize: 16, opacity: 0.4
                }}>👤</span>
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: COLORS.charcoalMid,
                marginBottom: 6, textAlign: isRTL ? 'right' : 'left'
              }}>
                {t('password')}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder={t('password')}
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '12px 16px',
                    paddingLeft: isRTL ? 16 : 44,
                    paddingRight: isRTL ? 44 : 44,
                    border: `1.5px solid ${error ? COLORS.red : COLORS.border}`,
                    borderRadius: 9, fontSize: 14,
                    color: COLORS.charcoal, outline: 'none',
                    boxSizing: 'border-box', transition: 'border 0.15s',
                    textAlign: isRTL ? 'right' : 'left'
                  }}
                  onFocus={e => e.target.style.borderColor = COLORS.red}
                  onBlur={e => e.target.style.borderColor = error ? COLORS.red : COLORS.border}
                />
                <span style={{
                  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                  left: isRTL ? 'auto' : 14, right: isRTL ? 14 : 'auto',
                  fontSize: 16, opacity: 0.4
                }}>🔒</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                    right: isRTL ? 'auto' : 12, left: isRTL ? 12 : 'auto',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 14, opacity: 0.5, padding: 4
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: `${COLORS.red}12`,
                border: `1px solid ${COLORS.red}44`,
                borderRadius: 8, padding: '10px 14px',
                fontSize: 13, color: COLORS.red,
                fontWeight: 500, marginBottom: 16,
                textAlign: isRTL ? 'right' : 'left'
              }}>
                ❌ {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px 0', marginTop: 16,
                borderRadius: 9, border: 'none', cursor: loading ? 'wait' : 'pointer',
                background: loading
                  ? COLORS.border
                  : `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`,
                color: loading ? COLORS.textMuted : COLORS.white,
                fontSize: 15, fontWeight: 700,
                boxShadow: loading ? 'none' : `0 4px 14px ${COLORS.red}44`,
                transition: 'all 0.2s', letterSpacing: 0.5
              }}
            >
              {loading ? '...' : t('loginBtn')}
            </button>
          </form>

          {/* Default credentials hint */}
          <div style={{
            marginTop: 20, padding: '12px 16px',
            background: `${COLORS.info}10`,
            border: `1px solid ${COLORS.info}30`,
            borderRadius: 8, fontSize: 12,
            color: COLORS.textMuted, textAlign: 'center'
          }}>
            {language === 'ar'
              ? '🔑 الدخول الافتراضي: admin / admin123'
              : '🔑 Default: admin / admin123'}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 40px 20px', textAlign: 'center',
          borderTop: `1px solid ${COLORS.offWhite}`
        }}>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>
            {t('version')} · Jango Furniture
          </div>
        </div>
      </div>
    </div>
  );
}