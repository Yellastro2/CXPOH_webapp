
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
const DEFAULT_THEME_DARK = {
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

// LIGTH_WEB_THEME
const DEFAULT_THEME_LIGHT = {
    "bg_color": "#ffffff",
    "button_color": "#3390ec",
    "button_text_color": "#ffffff",
    "hint_color": "#707579",
    "link_color": "#00488f",
    "secondary_bg_color": "#f4f4f5",
    "text_color": "#000000",
    "header_bg_color": "#ffffff",
    "accent_text_color": "#3390ec",
    "section_bg_color": "#ffffff",
    "section_header_text_color": "#3390ec",
    "subtitle_text_color": "#707579",
    "destructive_text_color": "#df3f40",
    "bottom_bar_bg_color": "#ffffff" // ← добавь это
}

var DEFAULT_THEME = DEFAULT_THEME_DARK

function isDarkTheme(bgHex?: string): boolean {
  if (!bgHex) return false; // дефолт: считаем светлой
  const r = parseInt(bgHex.substr(1,2),16);
  const g = parseInt(bgHex.substr(3,2),16);
  const b = parseInt(bgHex.substr(5,2),16);
  const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
  return luminance < 0.5;
}


export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [webApp, setWebApp] = useState<TelegramWebApp | undefined>(undefined);
  const [inTelegram, setInTelegram] = useState(false);

  useEffect(() => {
    const app = window.Telegram?.WebApp;
    
    // Apply Theme
    const applyTheme = () => {
      var themeParams = app?.themeParams && Object.keys(app.themeParams).length > 0
        ? app.themeParams
        : DEFAULT_THEME;

      // это для перезаписи темы на нашу предсказуемую белую либо темную
      // потому что тг заебал везде слать разные конфиги цветов.
      if (app?.themeParams && Object.keys(app.themeParams).length > 0) {
          console.log("Telegram themeParams received:", app.themeParams);
          const dark = isDarkTheme(themeParams.bg_color);
          console.log(dark ? "Dark theme" : "Light theme");
          DEFAULT_THEME = dark ? DEFAULT_THEME_DARK : DEFAULT_THEME_LIGHT
        }
      themeParams = DEFAULT_THEME

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
        let value = themeParams[key as keyof typeof DEFAULT_THEME];

        // Telegram иногда шлёт пустое / null / #000000
        if (!value || value === '#000000' || value === '#000' || value === '') {
          value = DEFAULT_THEME[key as keyof typeof DEFAULT_THEME];
        }

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
