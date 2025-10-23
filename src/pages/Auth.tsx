import React, { useState } from 'react';
import Logo from '../components/brand/Logo';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo variant="full" size="lg" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={'flex-1 py-2 px-4 rounded-lg font-medium transition-colors ' +
              (isLogin
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={'flex-1 py-2 px-4 rounded-lg font-medium transition-colors ' +
              (!isLogin
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth>
            {isLogin ? 'Login' : 'Create Account'}
          </Button>
        </form>

        {/* Forgot Password (only on login) */}
        {isLogin && (
          <div className="mt-4 text-center">
            <a href="#" className="text-sm text-primary hover:underline">
              Forgot password?
            </a>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-8 pt-8 border-t border-slate-200">
          Trinity Method:
          <span className="text-lynch mx-1 font-medium">Lynch</span>•
          <span className="text-oneil mx-1 font-medium">O'Neil</span>•
          <span className="text-graham mx-1 font-medium">Graham</span>
        </p>
      </Card>
    </div>
  );
};

export default Auth;
