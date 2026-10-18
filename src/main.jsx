import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App.jsx';
import ErrorBoundary from './components/Common/ErrorBoundary.jsx';
import './index.css';
import { enableHorizontalScroll } from './utils/horizontalScroll';

enableHorizontalScroll();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <Toaster position="top-center" richColors closeButton duration={3500} />
    </ErrorBoundary>
  </React.StrictMode>,
);
