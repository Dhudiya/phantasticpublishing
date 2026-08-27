import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext';
import { initAnalyticsTracker } from './lib/analytics';
import './index.css';

initAnalyticsTracker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteSettingsProvider>
      <App />
    </SiteSettingsProvider>
  </StrictMode>
);
