
import React, { createContext, useContext, useEffect, useState } from 'react';
import { TelegramWebApp } from '../types';

interface TelegramContextType {
  webApp?: TelegramWebApp;
  inTelegram: boolean;
}

const TelegramContext = createContext<TelegramContextType>({
  inTelegram: false,
});

export const useTelegram = () => useContext(TelegramContext);

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [webApp, setWebApp] = useState<TelegramWebApp | undefined>(undefined);
  const [inTelegram, setInTelegram] = useState(false);

  useEffect(() => {
    const app = window.Telegram?.WebApp;

    // The script telegram-web-app.js always creates the window.Telegram.WebApp object.
    // To distinguish between running in Telegram vs a regular browser, we check initData.
    // In a regular browser, initData is an empty string. 
    // In Telegram, it contains the initialization data string.
    if (app && app.initData) {
      console.log('Telegram Web App detected (valid session).');
      setWebApp(app);
      setInTelegram(true);
      
      // Initialize the Mini App
      app.ready();
      app.expand(); // Request to expand to full height
    } else {
      console.log('Telegram initData not found. Assuming fallback/browser mode.');
      // We still provide the app object if needed for debugging UI, but flag is false
      setWebApp(app); 
      setInTelegram(false);
    }
  }, []);

  return (
    <TelegramContext.Provider value={{ webApp, inTelegram }}>
      {children}
    </TelegramContext.Provider>
  );
};
