import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Auth from './pages/Auth'
import MarketRegime from './pages/MarketRegime'
import Top500 from './pages/Top500'
import Login from './pages/Login'
import Register from './pages/Register'
import Pricing from './pages/Pricing'
import Watchlist from './pages/Watchlist'
import DailyTop10 from './pages/DailyTop10'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/market-regime" element={<MarketRegime />} />
      <Route path="/top500" element={<Top500 />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/watchlist" element={<Watchlist />} />
      <Route path="/daily-top10" element={<DailyTop10 />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
