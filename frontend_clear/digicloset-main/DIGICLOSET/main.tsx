import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import App from './App.tsx';
import LandingPage from './pages/LandingPage.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import Analytics from './pages/Analytics.tsx';
import CompleteTheLookDemo from './CompleteTheLookDemo';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<App />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/widget-demo" element={<CompleteTheLookDemo />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
import createApp from "@shopify/app-bridge";

const app = createApp({
  apiKey: import.meta.env.VITE_SHOPIFY_API_KEY,
  host: new URLSearchParams(window.location.search).get("host"),
});
