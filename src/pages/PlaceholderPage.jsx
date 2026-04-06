import { COLORS } from '../data/store';
import { useLanguage } from '../data/LanguageContext';
import { useThemeColors } from '../hooks/useThemeColors';

export default function PlaceholderPage({ pageId }) {
  const { t, isRTL, language } = useLanguage();
  const C = useThemeColors();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: 16, padding: 40,
      direction: isRTL ? 'rtl' : 'ltr',
      fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'inherit'
    }}>
      <div style={{ fontSize: 64 }}>🚧</div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: C.charcoal,
        fontFamily: language === 'ar' ? 'Arial, sans-serif' : 'Georgia, serif'
      }}>
        {t('phaseComingSoon')}
      </div>
      <div style={{ fontSize: 14, color: C.textMuted, textAlign: 'center', maxWidth: 300 }}>
        {language === 'ar'
          ? `صفحة "${pageId}" قيد التطوير وستكون جاهزة قريباً`
          : `The "${pageId}" page is under development and will be ready soon`}
      </div>
      <div style={{
        marginTop: 8, padding: '8px 20px',
        background: `${C.red}12`, border: `1px solid ${C.red}33`,
        borderRadius: 20, fontSize: 12, color: C.red, fontWeight: 600
      }}>
        {pageId}
      </div>
    </div>
  );
}