import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../brand/Logo';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import { LogOut, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/">
            <Logo variant="full" size="md" />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-slate-600 hover:text-primary font-medium transition-colors">
              Inicio
            </Link>
            <Link to="/dashboard" className="text-slate-600 hover:text-primary font-medium transition-colors">
              Dashboard
            </Link>
            <Link to="/top500" className="text-slate-600 hover:text-primary font-medium transition-colors">
              TOP 500
            </Link>
            <Link to="/market-regime" className="text-slate-600 hover:text-primary font-medium transition-colors">
              Régimen de Mercado
            </Link>
            <Link to="/daily-top10" className="text-slate-600 hover:text-primary font-medium transition-colors">
              TOP 10 Diario
            </Link>
            <Link to="/watchlist" className="text-slate-600 hover:text-primary font-medium transition-colors">
              Watchlist
            </Link>
            <Link to="/pricing" className="text-slate-600 hover:text-primary font-medium transition-colors">
              Precios
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {/* User Info */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                  <User className="w-4 h-4 text-slate-600" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">
                      {user.name}
                    </span>
                    <span className="text-xs text-slate-600 capitalize">
                      {user.plan} Plan
                    </span>
                  </div>
                </div>
                {/* Logout Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                {/* Login/Register Buttons */}
                <Button variant="ghost" as="link" to="/login" size="sm">
                  Iniciar Sesión
                </Button>
                <Button variant="primary" as="link" to="/register" size="sm">
                  Comenzar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
