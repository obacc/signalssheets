import React from 'react';
import Logo from '../brand/Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Logo variant="light" size="md" className="mb-4" />
            <p className="text-sm text-slate-400">
              Professional trading signals powered by the Trinity Method
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
              <li><a href="/top500" className="hover:text-white transition-colors">TOP 500 Signals</a></li>
              <li><a href="/market-regime" className="hover:text-white transition-colors">Market Regime</a></li>
              <li><a href="/daily-top10" className="hover:text-white transition-colors">Daily TOP 10</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Methodology</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Disclaimer</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © 2025 Indicium Signals. All rights reserved.
          </p>
          <p className="text-sm">
            Trinity Method:{' '}
            <span className="text-lynch mx-1">Lynch</span>•
            <span className="text-oneil mx-1">O'Neil</span>•
            <span className="text-graham mx-1">Graham</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
