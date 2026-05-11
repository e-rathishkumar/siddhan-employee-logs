import { useState, useRef, useEffect } from 'react';
import { useTranslation, LOCALE_OPTIONS, Locale } from '../../stores/i18nStore';

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LOCALE_OPTIONS.find((l) => l.code === locale) || LOCALE_OPTIONS[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg hover:bg-gray-100 transition-colors"
        title="Change language"
      >
        <span>{current.flag}</span>
        <span className="hidden sm:inline text-gray-700">{current.name}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {LOCALE_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              onClick={() => {
                setLocale(opt.code);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 ${
                locale === opt.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <span>{opt.flag}</span>
              <span>{opt.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
