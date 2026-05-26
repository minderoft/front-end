import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './styles/index.css';

// Debug marker to verify client script execution
try {
  const rootEl = document.getElementById('root');
  if (rootEl) rootEl.dataset.clientScript = 'loaded';
  console.log('main.jsx executed: client script running');
} catch (e) {
  console.error('Error setting debug marker in main.jsx', e);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);