import React from 'react';

export type Theme = {
  isDark: boolean;
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  accent: string;
  accentDim: string;
  accentBorder: string;
  orange: string;
  orangeDim: string;
  orangeBorder: string;
  blue: string;
  blueDim: string;
  blueBorder: string;
  text: string;
  muted: string;
  warning: string;
  warningDim: string;
  warningBorder: string;
  inputBg: string;
  trackBg: string;
};

export const darkTheme: Theme = {
  isDark: true,
  bg: '#0d0f12',
  surface: '#141720',
  surface2: '#1c2030',
  border: '#252a3a',
  accent: '#4fffb0',
  accentDim: 'rgba(79,255,176,0.10)',
  accentBorder: 'rgba(79,255,176,0.28)',
  orange: '#ff6b35',
  orangeDim: 'rgba(255,107,53,0.10)',
  orangeBorder: 'rgba(255,107,53,0.28)',
  blue: '#38bdf8',
  blueDim: 'rgba(56,189,248,0.10)',
  blueBorder: 'rgba(56,189,248,0.28)',
  text: '#e8eaf0',
  muted: '#4e5a78',
  warning: '#fbbf24',
  warningDim: 'rgba(251,191,36,0.08)',
  warningBorder: 'rgba(251,191,36,0.28)',
  inputBg: '#0a0c0f',
  trackBg: '#0a0c0f',
};

export const lightTheme: Theme = {
  isDark: false,
  bg: '#eef0f8',
  surface: '#ffffff',
  surface2: '#f4f6ff',
  border: '#dde2f0',
  accent: '#0b8f5e',
  accentDim: 'rgba(11,143,94,0.08)',
  accentBorder: 'rgba(11,143,94,0.25)',
  orange: '#c94f18',
  orangeDim: 'rgba(201,79,24,0.08)',
  orangeBorder: 'rgba(201,79,24,0.25)',
  blue: '#0369a1',
  blueDim: 'rgba(3,105,161,0.08)',
  blueBorder: 'rgba(3,105,161,0.25)',
  text: '#111827',
  muted: '#9ca3b8',
  warning: '#92400e',
  warningDim: 'rgba(146,64,14,0.07)',
  warningBorder: 'rgba(146,64,14,0.25)',
  inputBg: '#f8f9fd',
  trackBg: '#e2e6f4',
};

const ThemeContext = React.createContext<Theme>(darkTheme);
export const useTheme = () => React.useContext(ThemeContext);
export const ThemeProvider = ThemeContext.Provider;
