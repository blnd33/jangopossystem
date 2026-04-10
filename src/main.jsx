import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider, useLanguage } from './data/LanguageContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { CurrencyProvider } from './contexts/CurrencyContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'

const savedLang = localStorage.getItem('jango_language') || 'en';
document.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = savedLang;

function AppWithKey() {
  const { isRTL } = useLanguage();
  return <App key={isRTL ? 'rtl' : 'ltr'} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <CurrencyProvider>
          <ThemeProvider>
            <AppWithKey />
          </ThemeProvider>
        </CurrencyProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)