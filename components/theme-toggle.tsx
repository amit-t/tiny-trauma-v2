"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "tt-theme-v3";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial: Theme = stored === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = initial;
    // Reading localStorage requires the browser — must happen post-mount to
    // stay hydration-safe. The setState is the synchronization step itself.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initial);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  }

  // Render a neutral placeholder until mounted to avoid hydration mismatch.
  const label = theme ?? "dark";
  const pressed = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-pressed={pressed}
      aria-label="Toggle theme"
      onClick={toggle}
      suppressHydrationWarning
    >
      <span className="dot" aria-hidden />
      <span suppressHydrationWarning>{label}</span>
    </button>
  );
}
