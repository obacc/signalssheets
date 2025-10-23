import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../brand/Logo';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/">
            <Logo variant="full" size="md" />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-slate-600 hover:text-primary font-medium transition-colors">
              Home
            </Link>
            <Link to="/dashboard" className="text-slate-600 hover:text-primary font-medium transition-colors">
              Dashboard
            </Link>
            <Link to="/top500" className="text-slate-600 hover:text-primary font-medium transition-colors">
              TOP 500
            </Link>
            <Link to="/market-regime" className="text-slate-600 hover:text-primary font-medium transition-colors">
              Market Regime
            </Link>
            <Link to="/daily-top10" className="text-slate-600 hover:text-primary font-medium transition-colors">
              Daily TOP 10
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" as="link" to="/login" size="sm">
              Login
            </Button>
            <Button variant="primary" as="link" to="/register" size="sm">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
