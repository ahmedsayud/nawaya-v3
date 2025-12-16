
import React, { useEffect } from 'react';
import { useUser } from './context/UserContext';
import PublicApp from './pages/PublicApp';

const App: React.FC = () => {
  const { activeTheme } = useUser();

  useEffect(() => {
    if (!activeTheme) return;
    const root = document.documentElement;
    const hexToRgb = (hex: string) => {
        if (!hex || !hex.startsWith('#')) return '0, 0, 0';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    };
    root.style.setProperty('--color-bg-from', activeTheme.background.from);
    root.style.setProperty('--color-bg-to', activeTheme.background.to);
    root.style.setProperty('--color-bg-balance', `${activeTheme.background.balance}%`);
    root.style.setProperty('--color-btn-from', activeTheme.button.from);
    root.style.setProperty('--color-btn-to', activeTheme.button.to);
    root.style.setProperty('--color-btn-balance', `${activeTheme.button.balance}%`);
    root.style.setProperty('--color-card-from', activeTheme.card.from);
    root.style.setProperty('--color-card-to', activeTheme.card.to);
    root.style.setProperty('--color-card-balance', `${activeTheme.card.balance}%`);
    root.style.setProperty('--color-text-primary', activeTheme.text.primary);
    root.style.setProperty('--color-text-accent', activeTheme.text.accent);
    root.style.setProperty('--color-text-accent-rgb', hexToRgb(activeTheme.text.accent));
    root.style.setProperty('--color-text-secondary-accent', activeTheme.text.secondary_accent || activeTheme.text.accent);
    root.style.setProperty('--glow-color', activeTheme.glow.color);
    root.style.setProperty('--glow-intensity-factor', (activeTheme.glow.intensity / 50).toString());
  }, [activeTheme]);

  // Render Public View Only
  return <PublicApp />;
}

export default App;
