import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// Auto-register service worker for offline support
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Update PWA tersedia');
  },
  onOfflineReady() {
    console.log('Aplikasi siap bekerja 100% offline');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
