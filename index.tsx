import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// FIX: Corrected import path to be relative.
import { UserProvider } from './context/UserContext';

// Polyfill process for browser environment to prevent 'process is not defined' errors
if (typeof window !== 'undefined' && typeof process === 'undefined') {
  (window as any).process = { env: { API_KEY: '' } };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>
);