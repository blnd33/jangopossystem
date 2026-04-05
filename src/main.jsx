import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './data/LanguageContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { CurrencyProvider } from './contexts/CurrencyContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'

const savedLang = localStorage.getItem('jango_language') || 'en';
document.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = savedLang;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <CurrencyProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </CurrencyProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)