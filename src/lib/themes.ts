export type ThemeId =
  | "cosmic"
  | "nebula"
  | "emerald"
  | "sunset"
  | "rose"
  | "midnight";

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  swatch: string[]; // 3 hex colors for preview
  vars: Record<string, string>;
}

// Values map to CSS custom properties in :root
export const THEMES: Theme[] = [
  {
    id: "cosmic",
    name: "Cosmic Blue",
    description: "Default electric blue on deep space",
    swatch: ["#00d4ff", "#7c3aed", "#0a0a1a"],
    vars: {
      "--primary": "oklch(0.78 0.17 220)",
      "--secondary": "oklch(0.55 0.22 295)",
      "--accent": "oklch(0.55 0.22 295)",
      "--ring": "oklch(0.78 0.17 220)",
      "--nebula": "oklch(0.55 0.22 295)",
      "--cosmic": "oklch(0.78 0.17 220)",
    },
  },
  {
    id: "nebula",
    name: "Nebula Purple",
    description: "Rich violet & magenta",
    swatch: ["#a855f7", "#ec4899", "#0a0a1a"],
    vars: {
      "--primary": "oklch(0.7 0.22 300)",
      "--secondary": "oklch(0.65 0.24 340)",
      "--accent": "oklch(0.65 0.24 340)",
      "--ring": "oklch(0.7 0.22 300)",
      "--nebula": "oklch(0.65 0.24 340)",
      "--cosmic": "oklch(0.7 0.22 300)",
    },
  },
  {
    id: "emerald",
    name: "Emerald Matrix",
    description: "Trader green with mint accents",
    swatch: ["#10b981", "#34d399", "#0a1a14"],
    vars: {
      "--primary": "oklch(0.75 0.17 160)",
      "--secondary": "oklch(0.65 0.15 180)",
      "--accent": "oklch(0.65 0.15 180)",
      "--ring": "oklch(0.75 0.17 160)",
      "--nebula": "oklch(0.55 0.15 180)",
      "--cosmic": "oklch(0.75 0.17 160)",
    },
  },
  {
    id: "sunset",
    name: "Sunset Orange",
    description: "Warm amber & coral",
    swatch: ["#fb923c", "#f43f5e", "#1a0f0a"],
    vars: {
      "--primary": "oklch(0.78 0.17 55)",
      "--secondary": "oklch(0.65 0.22 20)",
      "--accent": "oklch(0.65 0.22 20)",
      "--ring": "oklch(0.78 0.17 55)",
      "--nebula": "oklch(0.65 0.22 20)",
      "--cosmic": "oklch(0.78 0.17 55)",
    },
  },
  {
    id: "rose",
    name: "Rose Gold",
    description: "Soft pink luxury",
    swatch: ["#f472b6", "#fb7185", "#1a0a14"],
    vars: {
      "--primary": "oklch(0.75 0.18 350)",
      "--secondary": "oklch(0.68 0.2 20)",
      "--accent": "oklch(0.68 0.2 20)",
      "--ring": "oklch(0.75 0.18 350)",
      "--nebula": "oklch(0.68 0.2 20)",
      "--cosmic": "oklch(0.75 0.18 350)",
    },
  },
  {
    id: "midnight",
    name: "Midnight Mono",
    description: "Minimal grayscale",
    swatch: ["#e5e7eb", "#9ca3af", "#0a0a0a"],
    vars: {
      "--primary": "oklch(0.9 0.01 260)",
      "--secondary": "oklch(0.6 0.02 260)",
      "--accent": "oklch(0.6 0.02 260)",
      "--ring": "oklch(0.9 0.01 260)",
      "--nebula": "oklch(0.4 0.01 260)",
      "--cosmic": "oklch(0.9 0.01 260)",
    },
  },
];

const KEY = "nishira_theme_v1";

export function getStoredThemeId(): ThemeId {
  if (typeof window === "undefined") return "cosmic";
  try {
    const v = localStorage.getItem(KEY) as ThemeId | null;
    if (v && THEMES.some((t) => t.id === v)) return v;
  } catch {}
  return "cosmic";
}

export function applyTheme(id: ThemeId) {
  const theme = THEMES.find((t) => t.id === id) ?? THEMES[0];
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  try { localStorage.setItem(KEY, id); } catch {}
  root.setAttribute("data-theme", id);
}
