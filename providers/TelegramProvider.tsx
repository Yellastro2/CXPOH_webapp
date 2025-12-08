
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

// Default theme parameters (Dark Theme as requested)
const DEFAULT_THEME = {
  bg_color: "#17212b",
  secondary_bg_color: "#232e3c",
  header_bg_color: "#17212b",
  text_color: "#f5f5f5",
  hint_color: "#708499",
  link_color: "#6ab3f3",
  button_color: "#5288c1",
  button_text_color: "#ffffff",
  bottom_bar_bg_color: "#ffffff", // Note: This might look odd in dark mode if actual bottom bar is white, but following spec
  section_bg_color: "#17212b",
  section_header_text_color: "#6ab3f3",
  subtitle_text_color: "#708499",
  destructive_text_color: "#ec3942",
  accent_text_color: "#6ab2f2"
};

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [webApp, setWebApp] = useState<TelegramWebApp | undefined>(undefined);
  const [inTelegram, setInTelegram] = useState(false);

  useEffect(() => {
    const app = window.Telegram?.WebApp;
    
    // Apply Theme
    const applyTheme = () => {
      const themeParams = app?.themeParams && Object.keys(app.themeParams).length > 0 
        ? app.themeParams 
        : DEFAULT_THEME;

      const root = document.documentElement;
      
      // Map keys to CSS variables
      const mapping: Record<string, string> = {
        bg_color: '--tg-theme-bg-color',
        text_color: '--tg-theme-text-color',
        hint_color: '--tg-theme-hint-color',
        link_color: '--tg-theme-link-color',
        button_color: '--tg-theme-button-color',
        button_text_color: '--tg-theme-button-text-color',
        secondary_bg_color: '--tg-theme-secondary-bg-color',
        header_bg_color: '--tg-theme-header-bg-color',
        bottom_bar_bg_color: '--tg-theme-bottom-bar-bg-color',
        section_bg_color: '--tg-theme-section-bg-color',
        section_header_text_color: '--tg-theme-section-header-text-color',
        subtitle_text_color: '--tg-theme-subtitle-text-color',
        destructive_text_color: '--tg-theme-destructive-text-color',
        accent_text_color: '--tg-theme-accent-text-color',
      };

      for (const [key, cssVar] of Object.entries(mapping)) {
        // @ts-ignore
        const value = themeParams[key] || DEFAULT_THEME[key as keyof typeof DEFAULT_THEME];
        if (value) {
          root.style.setProperty(cssVar, value);
        }
      }
    };

    applyTheme();

    // Listen for theme changes if in TG
    if (app) {
        app.onEvent?.('themeChanged', applyTheme);
    }

    if (app && app.initData) {
      console.log('Telegram Web App detected.');
      console.log('Original initData:', app.initData);
      setWebApp(app);
      setInTelegram(true);
      
      app.ready();
      app.expand();
      
      if (typeof app.requestFullscreen === 'function') {
        try {
          app.requestFullscreen();
        } catch (e) {
          console.error("Failed to request fullscreen:", e);
        }
      }
    } else {
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
