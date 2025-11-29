import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import FhenixLearnLogo from '../brand/FhenixLearnLogo';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  User,
  ArrowRight
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AppShell({ children, user }) {
  // Simple active state check (mocked for now or based on window location)
  const isActive = (path) => window.location.pathname === path;

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#011623] text-slate-100 selection:bg-[#0AD9DC]/30 font-sans">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#011623]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Logo */}
          <Link to={createPageUrl('Home')} className="hover:opacity-80 transition-opacity">
            <FhenixLearnLogo />
          </Link>

          {/* Center: Links */}
          <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            <NavLink to={createPageUrl('Learn')} label="Curriculum" active={isActive('/Learn')} />
            <a 
              href="https://cofhe-docs.fhenix.zone/docs/devdocs/overview" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2"
            >
              Docs <ArrowRight className="w-3 h-3 -rotate-45" />
            </a>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            {!user ? (
               <Button 
               onClick={() => base44.auth.redirectToLogin(createPageUrl('Learn'))}
               className="bg-[#0AD9DC] hover:bg-[#0AD9DC]/90 text-[#011623] font-bold rounded-full px-6"
             >
               Start Learning
             </Button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-sm font-medium text-white">{user.email.split('@')[0]}</span>
                  <span className="text-xs text-[#0AD9DC]">Level 1 Explorer</span>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full border border-white/10 hover:bg-white/5">
                   <User className="w-5 h-5 text-slate-300" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-white">
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 bg-[#00101a]">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2024 Fhenix Learn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ to, label, active }) {
  return (
    <Link 
      to={to} 
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
        active 
          ? 'bg-[#0AD9DC] text-[#011623] shadow-[0_0_15px_rgba(10,217,220,0.3)]' 
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </Link>
  );
}