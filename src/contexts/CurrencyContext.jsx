import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrencySettings, saveCurrencySettings, formatMoney } from '../data/store';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currencySettings, setCurrencySettings] = useState(getCurrencySettings());

  useEffect(() => {
    setCurrencySettings(getCurrencySettings());
  }, []);

  function updateCurrency(newSettings) {
    saveCurrencySettings(newSettings);
    setCurrencySettings(newSettings);
  }

  function fmt(amount) {
    return formatMoney(amount, currencySettings);
  }

  const isIQD = currencySettings.currency === 'IQD';

  return (
    <CurrencyContext.Provider value={{
      currencySettings,
      updateCurrency,
      fmt,
      isIQD,
      symbol: currencySettings.symbol,
      exchangeRate: currencySettings.exchangeRate,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}