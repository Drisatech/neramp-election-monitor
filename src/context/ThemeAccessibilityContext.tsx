import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';
export type FontSizeScale = 'normal' | 'large' | 'xlarge';
export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome';

export interface AccessibilitySettings {
  theme: ThemeMode;
  fontSize: FontSizeScale;
  highContrast: boolean;
  colorBlindMode: ColorBlindMode;
  dyslexiaFont: boolean;
  reduceMotion: boolean;
  focusHighlight: boolean;
  underlineLinks: boolean;
  readingGuide: boolean;
  largeCursor: boolean;
  screenReaderAssist: boolean;
}

interface ThemeAccessibilityContextType extends AccessibilitySettings {
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetAccessibility: () => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  activePwdFeaturesCount: number;
}

const STORAGE_KEY = 'neramp_theme_accessibility_v1';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  theme: 'light',
  fontSize: 'normal',
  highContrast: false,
  colorBlindMode: 'none',
  dyslexiaFont: false,
  reduceMotion: false,
  focusHighlight: false,
  underlineLinks: false,
  readingGuide: false,
  largeCursor: false,
  screenReaderAssist: false,
};

const ThemeAccessibilityContext = createContext<ThemeAccessibilityContextType | undefined>(undefined);

export const ThemeAccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_SETTINGS;
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mouseY, setMouseY] = useState<number>(280);

  // Sync settings to localStorage and apply classes/attributes on <html>
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }

    const root = document.documentElement;

    // 1. Dark / Bright Theme
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // 2. Font size scaling
    root.classList.remove('a11y-font-large', 'a11y-font-xlarge');
    if (settings.fontSize === 'large') root.classList.add('a11y-font-large');
    if (settings.fontSize === 'xlarge') root.classList.add('a11y-font-xlarge');

    // 3. Boolean accessibility modifiers
    root.classList.toggle('a11y-high-contrast', settings.highContrast);
    root.classList.toggle('a11y-dyslexia-font', settings.dyslexiaFont);
    root.classList.toggle('a11y-reduce-motion', settings.reduceMotion);
    root.classList.toggle('a11y-focus-highlight', settings.focusHighlight);
    root.classList.toggle('a11y-underline-links', settings.underlineLinks);
    root.classList.toggle('a11y-large-cursor', settings.largeCursor);

    // 4. Colorblind filter attribute
    root.setAttribute('data-colorblind', settings.colorBlindMode);
  }, [settings]);

  // Track pointer position when Reading Guide is active
  useEffect(() => {
    if (!settings.readingGuide) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [settings.readingGuide]);

  // Screen Reader Assist: announce focused interactive elements or clicked headings/cards when enabled
  useEffect(() => {
    if (!settings.screenReaderAssist) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    const speakElement = (el: HTMLElement | null) => {
      if (!el || !('speechSynthesis' in window)) return;
      const ariaLabel = el.getAttribute('aria-label') || el.getAttribute('title');
      const text = (ariaLabel || el.innerText || '').trim().replace(/\s+/g, ' ');
      if (!text || text.length > 350) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target) speakElement(target);
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [settings.screenReaderAssist]);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const setTheme = (theme: ThemeMode) => {
    setSettings((prev) => ({ ...prev, theme }));
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetAccessibility = () => {
    stopSpeaking();
    setSettings((prev) => ({
      ...DEFAULT_SETTINGS,
      theme: prev.theme, // Preserve current theme unless user toggles it
    }));
  };

  const activePwdFeaturesCount = [
    settings.fontSize !== 'normal',
    settings.highContrast,
    settings.colorBlindMode !== 'none',
    settings.dyslexiaFont,
    settings.reduceMotion,
    settings.focusHighlight,
    settings.underlineLinks,
    settings.readingGuide,
    settings.largeCursor,
    settings.screenReaderAssist,
  ].filter(Boolean).length;

  return (
    <ThemeAccessibilityContext.Provider
      value={{
        ...settings,
        toggleTheme,
        setTheme,
        updateSetting,
        resetAccessibility,
        speakText,
        stopSpeaking,
        isSpeaking,
        activePwdFeaturesCount,
      }}
    >
      {/* Hidden SVG Color Vision Deficiency Filters for PWD Colorblind Support */}
      <svg className="sr-only" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          {/* Protanopia (Red-Blind) Compensation Matrix */}
          <filter id="a11y-protanopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.567, 0.433, 0,     0, 0
                      0.558, 0.442, 0,     0, 0
                      0,     0.242, 0.758, 0, 0
                      0,     0,     0,     1, 0"
            />
          </filter>
          {/* Deuteranopia (Green-Blind) Compensation Matrix */}
          <filter id="a11y-deuteranopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.625, 0.375, 0,   0, 0
                      0.7,   0.3,   0,   0, 0
                      0,     0.3,   0.7, 0, 0
                      0,     0,     0,   1, 0"
            />
          </filter>
          {/* Tritanopia (Blue-Blind) Compensation Matrix */}
          <filter id="a11y-tritanopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.95, 0.05,  0,     0, 0
                      0,    0.433, 0.567, 0, 0
                      0,    0.475, 0.525, 0, 0
                      0,    0,     0,     1, 0"
            />
          </filter>
        </defs>
      </svg>

      {/* Horizontal Reading Guide Bar for PWD Visual Tracking */}
      {settings.readingGuide && (
        <div
          aria-hidden="true"
          className="fixed left-0 right-0 pointer-events-none z-50 transition-none"
          style={{
            top: `${Math.max(0, mouseY - 18)}px`,
            height: '36px',
            background: 'rgba(245, 158, 11, 0.16)',
            borderTop: '2px solid #f59e0b',
            borderBottom: '2px solid #f59e0b',
            boxShadow: '0 0 12px rgba(245, 158, 11, 0.25)',
          }}
        />
      )}

      {children}
    </ThemeAccessibilityContext.Provider>
  );
};

export const useThemeAccessibility = () => {
  const context = useContext(ThemeAccessibilityContext);
  if (!context) {
    throw new Error('useThemeAccessibility must be used within a ThemeAccessibilityProvider');
  }
  return context;
};
