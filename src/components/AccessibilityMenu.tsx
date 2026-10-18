import React, { useEffect, useState } from 'react';
import {
  Accessibility,
  Sun,
  Moon,
  Type,
  Eye,
  Volume2,
  VolumeX,
  RotateCcw,
  X,
  Check,
  Sparkles,
  MousePointer,
  Underline,
  Focus,
  AlignJustify,
  Contrast,
} from 'lucide-react';
import {
  useThemeAccessibility,
  FontSizeScale,
  ColorBlindMode,
} from '../context/ThemeAccessibilityContext';

export const AccessibilityMenu: React.FC = () => {
  const {
    theme,
    setTheme,
    fontSize,
    highContrast,
    colorBlindMode,
    dyslexiaFont,
    reduceMotion,
    focusHighlight,
    underlineLinks,
    readingGuide,
    largeCursor,
    screenReaderAssist,
    updateSetting,
    resetAccessibility,
    speakText,
    stopSpeaking,
    isSpeaking,
    activePwdFeaturesCount,
  } = useThemeAccessibility();

  const [isOpen, setIsOpen] = useState(false);

  // Keyboard shortcut Alt + A to toggle PWD Accessibility Panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Listen to custom event from Navbar button
  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener('open-pwd-accessibility', handleOpenEvent);
    return () => window.removeEventListener('open-pwd-accessibility', handleOpenEvent);
  }, []);

  const handleReadPageAloud = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    const mainEl = document.querySelector('main');
    const text = mainEl
      ? mainEl.innerText.replace(/\s+/g, ' ').slice(0, 1200)
      : document.body.innerText.replace(/\s+/g, ' ').slice(0, 1200);
    speakText(`Reading active election monitoring page content. ${text}`);
  };

  return (
    <>
      {/* Floating Quick-Access PWD Accessibility Trigger Button (Bottom Right) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open PWD Accessibility and Display Settings (Shortcut: Alt + A)"
        title="PWD Accessibility & Theme Options (Alt + A)"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white shadow-lg border-2 border-white/90 cursor-pointer transition-transform hover:scale-105 focus:outline-2 focus:outline-amber-400"
      >
        <Accessibility className="w-5 h-5 shrink-0" />
        <span className="text-xs font-bold tracking-wide hidden sm:inline">PWD Accessibility</span>
        {activePwdFeaturesCount > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-black rounded-full bg-amber-400 text-slate-950">
            {activePwdFeaturesCount}
          </span>
        )}
      </button>

      {/* Slide-Over PWD Accessibility & Theme Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwd-accessibility-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-white text-slate-900 h-full overflow-y-auto shadow-2xl border-l border-slate-200 flex flex-col justify-between">
            <div>
              {/* Drawer Header */}
              <div className="p-4 bg-emerald-900 text-white flex items-center justify-between sticky top-0 z-10 border-b border-emerald-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-800 border border-emerald-700">
                    <Accessibility className="w-5 h-5 text-emerald-200" />
                  </div>
                  <div>
                    <h2 id="pwd-accessibility-title" className="text-sm font-black uppercase tracking-wide text-white">
                      PWD Accessibility & Theme Center
                    </h2>
                    <p className="text-[11px] text-emerald-200">
                      Inclusive assistive controls for Persons with Disabilities (Alt + A)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close accessibility menu"
                  className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-5">
                {/* 1. Theme Background Mode (Bright / Dark) */}
                <section aria-labelledby="a11y-theme-heading" className="space-y-2">
                  <h3
                    id="a11y-theme-heading"
                    className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>1. Display Background Theme (Bright / Dark)</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                        theme === 'light'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-600/20'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Bright Mode</span>
                      {theme === 'light' && <Check className="w-3.5 h-3.5 text-emerald-700 ml-auto" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                        theme === 'dark'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-600/20'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Moon className="w-4 h-4 text-indigo-500" />
                      <span>Dark Mode</span>
                      {theme === 'dark' && <Check className="w-3.5 h-3.5 text-emerald-700 ml-auto" />}
                    </button>
                  </div>
                </section>

                {/* 2. Text & Font Scaling for Low Vision */}
                <section aria-labelledby="a11y-fontsize-heading" className="space-y-2 pt-3 border-t border-slate-200">
                  <h3
                    id="a11y-fontsize-heading"
                    className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"
                  >
                    <Type className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2. Text & Interface Size Scaling (Low Vision)</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'normal', label: 'Standard (100%)' },
                        { id: 'large', label: 'Large (112%)' },
                        { id: 'xlarge', label: 'Extra Large (125%)' },
                      ] as { id: FontSizeScale; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateSetting('fontSize', opt.id)}
                        className={`p-2.5 rounded-lg border text-xs font-bold text-center cursor-pointer transition-all ${
                          fontSize === opt.id
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* 3. Voice / Audio Readout Assist (Blind & Low Vision) */}
                <section aria-labelledby="a11y-speech-heading" className="space-y-2.5 pt-3 border-t border-slate-200">
                  <h3
                    id="a11y-speech-heading"
                    className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3. Audio Screen-Reader Assist</span>
                  </h3>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => updateSetting('screenReaderAssist', !screenReaderAssist)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left text-xs cursor-pointer transition-all ${
                        screenReaderAssist
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Volume2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                          <div className="font-bold">Speak Focused Controls Aloud</div>
                          <div className="text-[11px] text-slate-500 font-normal">
                            Automatically reads out buttons, links, and inputs when navigated via keyboard/tab
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          screenReaderAssist ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {screenReaderAssist ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleReadPageAloud}
                      className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                        isSpeaking
                          ? 'bg-rose-700 hover:bg-rose-800 text-white border-rose-800'
                          : 'bg-emerald-800 hover:bg-emerald-900 text-white border-emerald-900'
                      }`}
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-4 h-4" />
                          <span>Stop Reading Page Aloud</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          <span>Read Active Page Summary Aloud</span>
                        </>
                      )}
                    </button>
                  </div>
                </section>

                {/* 4. Visual, Cognitive & Motor PWD Profiles */}
                <section aria-labelledby="a11y-toggles-heading" className="space-y-2.5 pt-3 border-t border-slate-200">
                  <h3
                    id="a11y-toggles-heading"
                    className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>4. Visual, Cognitive & Motor Assistive Modes</span>
                  </h3>

                  <div className="grid grid-cols-1 gap-2">
                    {[
                      {
                        key: 'highContrast' as const,
                        value: highContrast,
                        icon: Contrast,
                        title: 'High Contrast Mode (WCAG AAA)',
                        desc: 'Maximizes text legibility and sharpens table/card borders.',
                      },
                      {
                        key: 'dyslexiaFont' as const,
                        value: dyslexiaFont,
                        icon: Sparkles,
                        title: 'Dyslexia-Friendly Typography',
                        desc: 'Applies humanist open-counter font with wider letter, word, and line spacing.',
                      },
                      {
                        key: 'focusHighlight' as const,
                        value: focusHighlight,
                        icon: Focus,
                        title: 'Keyboard Focus Highlight Rings',
                        desc: 'Adds bold high-visibility amber outlines around focused buttons and links.',
                      },
                      {
                        key: 'readingGuide' as const,
                        value: readingGuide,
                        icon: AlignJustify,
                        title: 'Horizontal Reading Ruler Guide',
                        desc: 'Displays a highlighted horizontal tracking bar to follow wide electoral tables.',
                      },
                      {
                        key: 'underlineLinks' as const,
                        value: underlineLinks,
                        icon: Underline,
                        title: 'Underline All Links & Navigation',
                        desc: 'Clearly distinguishes interactive navigation links across all pages.',
                      },
                      {
                        key: 'largeCursor' as const,
                        value: largeCursor,
                        icon: MousePointer,
                        title: 'Enhanced Target & Cursor Assist',
                        desc: 'Increases interactive target spacing for users with motor impairments.',
                      },
                      {
                        key: 'reduceMotion' as const,
                        value: reduceMotion,
                        icon: Eye,
                        title: 'Reduce Motion & Stop Flashing',
                        desc: 'Disables pulsing indicators and animations for vestibular/photosensitive safety.',
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => updateSetting(item.key, !item.value)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs cursor-pointer transition-all ${
                            item.value
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 pr-2">
                            <Icon className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold">{item.title}</div>
                              <div className="text-[11px] text-slate-500">{item.desc}</div>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                              item.value ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {item.value ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* 5. Color Vision Deficiency (Colorblind) Support */}
                <section aria-labelledby="a11y-colorblind-heading" className="space-y-2 pt-3 border-t border-slate-200">
                  <h3
                    id="a11y-colorblind-heading"
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    5. Color Vision Deficiency (Colorblind Filter)
                  </h3>
                  <select
                    value={colorBlindMode}
                    onChange={(e) => updateSetting('colorBlindMode', e.target.value as ColorBlindMode)}
                    aria-label="Select Color Vision Deficiency Mode"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold rounded-lg p-2.5 cursor-pointer"
                  >
                    <option value="none">Standard Color Vision (Default)</option>
                    <option value="protanopia">Protanopia Safe (Red-Blind Compensation)</option>
                    <option value="deuteranopia">Deuteranopia Safe (Green-Blind Compensation)</option>
                    <option value="tritanopia">Tritanopia Safe (Blue-Yellow Compensation)</option>
                    <option value="monochrome">Monochrome / Grayscale High-Distinction</option>
                  </select>
                </section>
              </div>
            </div>

            {/* Footer Reset Action */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 sticky bottom-0">
              <button
                type="button"
                onClick={resetAccessibility}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset PWD Settings</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
