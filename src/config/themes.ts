export type ThemeId = 'light' | 'dark' | 'blue' | 'green' | 'red';

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean white theme with dark text',
    colors: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      cardForeground: '240 10% 3.9%',
      popover: '0 0% 100%',
      popoverForeground: '240 10% 3.9%',
      primary: '221.2 83.2% 53.3%',
      primaryForeground: '210 40% 98%',
      secondary: '210 40% 96.1%',
      secondaryForeground: '222.2 47.4% 11.2%',
      muted: '210 40% 96.1%',
      mutedForeground: '215.4 16.3% 46.9%',
      accent: '210 40% 96.1%',
      accentForeground: '222.2 47.4% 11.2%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '221.2 83.2% 53.3%',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Dark theme with light text',
    colors: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      cardForeground: '210 40% 98%',
      popover: '222.2 84% 4.9%',
      popoverForeground: '210 40% 98%',
      primary: '217.2 91.2% 59.8%',
      primaryForeground: '222.2 47.4% 11.2%',
      secondary: '217.2 32.6% 17.5%',
      secondaryForeground: '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      mutedForeground: '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      accentForeground: '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '224.3 76.3% 94.9%',
    },
  },
  {
    id: 'blue',
    name: 'Blue',
    description: 'Professional blue color palette',
    colors: {
      background: '214 100% 97%',
      foreground: '222.2 47.4% 11.2%',
      card: '214 100% 99%',
      cardForeground: '222.2 47.4% 11.2%',
      popover: '214 100% 99%',
      popoverForeground: '222.2 47.4% 11.2%',
      primary: '217.2 91.2% 32%',
      primaryForeground: '210 40% 98%',
      secondary: '214 95% 93%',
      secondaryForeground: '222.2 47.4% 11.2%',
      muted: '214 90% 96%',
      mutedForeground: '215.4 16.3% 46.9%',
      accent: '199 89% 48%',
      accentForeground: '210 40% 98%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '214 85% 90%',
      input: '214 85% 90%',
      ring: '217.2 91.2% 32%',
    },
  },
  {
    id: 'green',
    name: 'Green',
    description: 'Natural green color palette',
    colors: {
      background: '142 76% 96%',
      foreground: '142 76% 10%',
      card: '142 76% 98%',
      cardForeground: '142 76% 10%',
      popover: '142 76% 98%',
      popoverForeground: '142 76% 10%',
      primary: '142 76% 20%',
      primaryForeground: '142 76% 98%',
      secondary: '142 50% 90%',
      secondaryForeground: '142 76% 10%',
      muted: '142 40% 92%',
      mutedForeground: '142 20% 40%',
      accent: '142 70% 45%',
      accentForeground: '142 76% 98%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '142 30% 85%',
      input: '142 30% 85%',
      ring: '142 76% 20%',
    },
  },
  {
    id: 'red',
    name: 'Red',
    description: 'Bold red color palette',
    colors: {
      background: '0 100% 99%',
      foreground: '0 76% 25%',
      card: '0 0% 100%',
      cardForeground: '0 76% 25%',
      popover: '0 0% 100%',
      popoverForeground: '0 76% 25%',
      primary: '0 72% 41%',
      primaryForeground: '0 0% 100%',
      secondary: '0 100% 95%',
      secondaryForeground: '0 76% 25%',
      muted: '0 100% 97%',
      mutedForeground: '0 65% 32%',
      accent: '0 65% 32%',
      accentForeground: '0 0% 100%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 100%',
      border: '0 96% 80%',
      input: '0 90% 72%',
      ring: '0 72% 41%',
    },
  },
];

export function getTheme(id: ThemeId): Theme {
  return themes.find((t) => t.id === id) || themes[0];
}

