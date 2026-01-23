import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './Components/Toast/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { PersonalizationProvider } from './context/PersonalizationContext';

import ErrorBoundary from './Components/ErrorBoundary';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <ThemeProvider>
          <LanguageProvider>
            <PersonalizationProvider>
              <App />
            </PersonalizationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)
