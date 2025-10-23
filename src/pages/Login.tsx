import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Logo } from '../components/brand/Logo';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo variant="full" size="lg" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Sign in to your account
            </h1>
            <p className="text-slate-600">
              Or{' '}
              <Link
                to="/register"
                className="font-semibold text-primary hover:text-primary/80"
              >
                create a new account
              </Link>
            </p>
          </div>

          {/* Login Form */}
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter your password"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>

              {/* Demo Accounts */}
              <div className="pt-6 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-3 text-center">
                  Demo Accounts
                </p>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span><strong>Demo Pro:</strong> demo@indicium.com</span>
                    <span className="text-slate-400">demo123</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span><strong>Any Email:</strong> test@example.com</span>
                    <span className="text-slate-400">any password (3+ chars)</span>
                  </div>
                </div>
              </div>
            </form>
          </Card>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <Link
              to="/pricing"
              className="text-sm text-slate-600 hover:text-primary"
            >
              View our pricing plans
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
