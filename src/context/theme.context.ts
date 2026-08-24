// src/context/theme.context.ts
// Context object + hook, kept out of ThemeContext.tsx so that file only exports
// components (Vite Fast Refresh requirement).
import { createContext, useContext } from "react";

export interface ThemeContextValue {
  isDark: boolean;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  toggle: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);
