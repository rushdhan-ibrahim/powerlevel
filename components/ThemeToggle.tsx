"use client";

/**
 * Candlelight theme toggle. Persists to localStorage. A tiny inline
 * script in <head> reads the same key BEFORE hydration to set
 * data-theme so the page never flashes from light → dark.
 *
 * The key is "powerlevel-theme"; values are "daylight" (default) or
 * "candlelight". We don't auto-follow prefers-color-scheme by design
 * — couch-you should choose.
 */

import { useEffect, useState } from "react";

export const THEME_KEY = "powerlevel-theme";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<"daylight" | "candlelight">("daylight");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "candlelight") setTheme("candlelight");
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === "candlelight" ? "daylight" : "candlelight";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    document.documentElement.dataset.theme = next === "candlelight" ? "candlelight" : "";
  };

  // Until mounted we can't know the real state; render the shell in
  // a neutral position so the button slot doesn't jump on hydration.
  const on = mounted && theme === "candlelight";

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? "switch to daylight" : "switch to candlelight"}
        className="theme-toggle-compact"
      >
        <span className={`theme-toggle-track ${on ? "is-on" : ""}`}>
          <span className="theme-toggle-thumb" />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      className="theme-toggle"
      title={on ? "switch to daylight" : "switch to candlelight"}
    >
      <svg width={14} height={14} viewBox="0 0 20 20" aria-hidden="true">
        {on ? (
          <>
            <path d="M10 3 C8 6 8 8 10 10 C12 8 12 6 10 3 Z" fill="currentColor" opacity=".9" />
            <rect x="7" y="11" width="6" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
          </>
        ) : (
          <>
            <circle cx="10" cy="10" r="3" fill="currentColor" />
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={10 + Math.cos(a) * 5}
                  y1={10 + Math.sin(a) * 5}
                  x2={10 + Math.cos(a) * 7.5}
                  y2={10 + Math.sin(a) * 7.5}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              );
            })}
          </>
        )}
      </svg>
      <span>{on ? "candle" : "daylight"}</span>
    </button>
  );
}

/**
 * Renders a <script> into the document head that runs BEFORE React
 * hydrates. It reads the persisted theme and sets
 * <html data-theme="candlelight"> so the CSS variables flip before
 * first paint. No FOUC.
 */
export function ThemeBootScript() {
  const code = `
(function(){try{
  var t = localStorage.getItem('${THEME_KEY}');
  if(t === 'candlelight') document.documentElement.setAttribute('data-theme','candlelight');
}catch(e){}})();
  `.trim();
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
