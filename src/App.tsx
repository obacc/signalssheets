import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import MarketRegime from './pages/MarketRegime';
import Top500 from './pages/Top500';
import Login from './pages/Login';
import Register from './pages/Register';
import Pricing from './pages/Pricing';
import Watchlist from './pages/Watchlist';
import DailyTop10 from './pages/DailyTop10';

export default function App() {
  // Initialize default market indices in watchlist on first load
  useEffect(() => {
    console.log('[App] ========== INITIALIZATION START ==========');
    const watchlist = localStorage.getItem('indicium_watchlist');
    console.log('[App] Current watchlist value:', watchlist);

    // Only initialize if watchlist doesn't exist (first-time user)
    if (!watchlist) {
      console.log('[App] Watchlist is null/undefined - initializing with defaults');
      const defaultIndices = ['spy-index', 'qqq-index', 'dia-index', 'iwm-index', 'vti-index'];
      console.log('[App] Default indices to add:', defaultIndices);

      localStorage.setItem('indicium_watchlist', JSON.stringify(defaultIndices));
      console.log('[App] Saved default indices to localStorage');

      // Verify it was saved
      const verify = localStorage.getItem('indicium_watchlist');
      console.log('[App] Verification - watchlist after save:', verify);

      // Dispatch event so Watchlist page can update if already mounted
      window.dispatchEvent(new CustomEvent('watchlistUpdated'));
      console.log('[App] Dispatched watchlistUpdated event');
    } else {
      console.log('[App] Watchlist already exists, skipping initialization');
      const parsed = JSON.parse(watchlist);
      console.log('[App] Current watchlist contains', parsed.length, 'signals:', parsed);
    }
    console.log('[App] ========== INITIALIZATION COMPLETE ==========');
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/top500" element={<Top500 />} />
      <Route path="/daily-top10" element={<DailyTop10 />} />
      <Route path="/market-regime" element={<MarketRegime />} />
      <Route path="/watchlist" element={<Watchlist />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}