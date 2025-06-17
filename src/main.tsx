import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import App from './App.tsx';
// Import fonts first
import './fonts.css';
import './index.css';

const ROUTER_FUTURE_FLAGS = {
  v7_startTransition: true,
  v7_relativeSplatPath: true
};

const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <BrowserRouter future={ROUTER_FUTURE_FLAGS}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);