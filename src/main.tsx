import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteSettingsProvider>
      <App />
    </SiteSettingsProvider>
  </StrictMode>
);
