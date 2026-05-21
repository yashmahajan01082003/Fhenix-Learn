import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl, createLessonUrl } from '@/utils';
import FhenixLearnLogo from '../brand/FhenixLearnLogo';
import { Button } from '@/components/ui/button';
import { loadCurriculum } from '@/lib/curriculum-loader';
import {
  LayoutDashboard,
  User,
  Trophy,
  BookOpen,
  Shield,
  Code2,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Lock,
  CheckCircle,
  LogOut,
  Terminal
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppShell({ children, user, userProgress }) {
  const location = useLocation();
  const { navigateToLogin, logout, isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});

  const CURRICULUM = loadCurriculum() || [];

  const isActive = (path) => location.pathname === path;

  // Auto-expand module if we are viewing a lesson in it
  React.useEffect(() => {
    // Check path params first (new routing: /learn/module-1/01-lesson-slug)
    const pathMatch = location.pathname.match(/\/learn\/([^/]+)\//);
    if (pathMatch) {
      const moduleId = pathMatch[1];
      const module = CURRICULUM.find(m => m.id === moduleId);
      if (module) {
        setExpandedModules(prev => {
          if (prev[module.slug]) return prev;
          return { ...prev, [module.slug]: true };
        });
      }
      return;
    }
    // Fallback to query params (legacy)
    const params = new URLSearchParams(location.search);
    const moduleSlug = params.get('module');
    if (moduleSlug) {
      setExpandedModules(prev => {
        if (prev[moduleSlug]) return prev;
        return { ...prev, [moduleSlug]: true };
      });
    }
  }, [location.pathname, location.search]);

  const toggleModule = (slug) => {
    setExpandedModules(prev => ({ ...prev, [slug]: !prev[slug] }));
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex h-screen bg-[#011623] text-slate-100 selection:bg-[#0AD9DC]/30 font-sans overflow-hidden">

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 bg-[#011623] border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
        ${isSidebarOpen ? 'translate-x-0 w-72' : `-translate-x-full lg:translate-x-0 ${isCollapsed ? 'w-20' : 'w-72'}`}
      `}>
        {/* Logo Header */}
        <div className={`h-16 flex items-center border-b border-white/5 ${isCollapsed ? 'justify-center px-2' : 'px-6'}`}>
          <Link to={createPageUrl('Home')} onClick={() => setIsSidebarOpen(false)} className="overflow-hidden">
            {isCollapsed ? (
              <span className="text-[#0AD9DC] text-2xl font-bold font-display">*</span>
            ) : (
              <FhenixLearnLogo />
            )}
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="ml-auto lg:hidden text-slate-400">
            <X className="w-5 h-5" />
          </button>
          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-20 bg-[#022031] border border-white/10 rounded-full p-1 text-slate-400 hover:text-white shadow-lg z-50 hover:scale-110 transition-all"
          >
            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </div>

        {/* Scrollable Nav */}
        <div className={`flex-1 overflow-y-auto py-6 space-y-8 custom-scrollbar ${isCollapsed ? 'px-2' : 'px-4'}`}>

          {/* Main Nav */}
          <div className="space-y-1">
            <NavItem
              to={createPageUrl('Home')}
              icon={LayoutDashboard}
              label="Dashboard"
              active={isActive('/home') || isActive('/')}
              onClick={() => setIsSidebarOpen(false)}
              collapsed={isCollapsed}
            />
            <NavItem
              to={createPageUrl('Leaderboard')}
              icon={Trophy}
              label="Leaderboard"
              active={isActive('/leaderboard')}
              onClick={() => setIsSidebarOpen(false)}
              collapsed={isCollapsed}
            />
            <NavItem
              to={createPageUrl('Profile')}
              icon={User}
              label="Profile"
              active={isActive('/profile')}
              onClick={() => setIsSidebarOpen(false)}
              collapsed={isCollapsed}
            />
          </div>

          {/* Curriculum Section */}
          {!isCollapsed && (
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-3">
                Curriculum
              </div>
              <div className="space-y-1">
                {CURRICULUM.map((module, idx) => {
                  const isExpanded = expandedModules[module.slug];
                  const completedCount = userProgress?.completed_lessons?.filter(lid =>
                    module.lessons?.some(l => l.id === lid)
                  ).length || 0;
                  const totalLessons = module.lessons?.length || 0;
                  const isCompleted = completedCount === totalLessons && totalLessons > 0;
                  const isInProgress = completedCount > 0 && !isCompleted;

                  // Check if module is locked
                  const prevModule = CURRICULUM[idx - 1];
                  const isLocked = idx > 0 && !userProgress?.completed_modules?.includes(prevModule?.id);

                  return (
                    <div key={module.id}>
                      <button
                        onClick={() => !isLocked && toggleModule(module.slug)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all group ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'
                          }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0 ${isCompleted ? 'bg-green-500/20 text-green-400' :
                          isInProgress ? 'bg-[#0AD9DC]/20 text-[#0AD9DC]' :
                            isLocked ? 'bg-white/5 text-slate-600' :
                              'bg-white/5 text-slate-500'
                          }`}>
                          {isLocked ? <Lock className="w-3 h-3" /> :
                            isCompleted ? <CheckCircle className="w-3 h-3" /> :
                              idx + 1}
                        </div>
                        <span className="flex-1 text-left text-slate-400 group-hover:text-white truncate text-xs">
                          {module.title?.replace(/^Module \d+:\s*/, '')}
                        </span>
                        {!isLocked && (
                          <ChevronRight className={`w-3 h-3 text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        )}
                      </button>

                      {/* Lesson List */}
                      <AnimatePresence>
                        {isExpanded && !isLocked && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-7 mt-1 space-y-1 border-l border-white/5 pl-3">
                              {module.lessons?.map((lesson) => {
                                const isLessonCompleted = userProgress?.completed_lessons?.includes(lesson.id);
                                const lessonUrl = createLessonUrl(module, lesson);
                                const isLessonActive = location.pathname === lessonUrl;

                                return (
                                  <Link
                                    key={lesson.id}
                                    to={lessonUrl}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`block px-2 py-1.5 rounded text-xs transition-all ${isLessonActive
                                      ? 'bg-[#0AD9DC]/10 text-[#0AD9DC]'
                                      : 'text-slate-500 hover:text-white hover:bg-white/5'
                                      }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      {isLessonCompleted && (
                                        <span className="flex-none flex h-4 w-4 items-center justify-center text-green-400">
                                          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                        </span>
                                      )}
                                      <span className="flex-1 text-left text-slate-400 group-hover:text-white break-words whitespace-normal text-xs">
                                        {lesson.title}
                                      </span>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sandboxes Section */}
          {!isCollapsed && (
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-3">
                Sandboxes
              </div>
              <div className="space-y-1">
                <SandboxItem icon={Code2} label="Encryption Playground" to="/encryption-playground" />
                <SandboxItem icon={Shield} label="Encrypted Branching" to="/branching-simulator" />
                <SandboxItem icon={Terminal} label="Leak Detector" to="/leak-detector" />
              </div>
            </div>
          )}
        </div>

        {/* User Section */}
        <div className={`border-t border-white/5 p-4 space-y-3 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          {!isAuthenticated ? (
            !isCollapsed ? (
              <Button
                onClick={navigateToLogin}
                className="w-full bg-[#0AD9DC] hover:bg-[#0AD9DC]/90 text-[#011623] font-bold"
              >
                Sign In
              </Button>
            ) : (
              <Button
                onClick={navigateToLogin}
                size="icon"
                className="bg-[#0AD9DC] hover:bg-[#0AD9DC]/90 text-[#011623]"
              >
                <User className="w-4 h-4" />
              </Button>
            )
          ) : (
            <div className={isCollapsed ? 'flex flex-col items-center gap-3' : 'space-y-3'}>
              {!isCollapsed && userProgress && (
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-[#0AD9DC]/20 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[#0AD9DC]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {userProgress?.display_name || user?.email?.split('@')[0] || `User ${user?.wallet?.address?.slice(0, 6)}`}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-yellow-500" /> {userProgress?.xp || 0} XP
                    </div>
                  </div>
                </div>
              )}
              {!isCollapsed ? (
                <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              ) : (
                <Button variant="ghost" size="icon" onClick={handleLogout} className="w-full flex justify-center text-slate-400 hover:text-white hover:bg-white/5">
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* Top Bar (Mobile Toggle + Context) */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-white/5 bg-[#011623]/80 backdrop-blur-md z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-md hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs / Page Title */}
            <div className="hidden sm:block">
              {isActive(createPageUrl('Home')) && <span className="text-slate-400">Dashboard</span>}
              {isActive(createPageUrl('Learn')) && <span className="text-slate-400">Curriculum</span>}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isAuthenticated && (
              <Button
                onClick={navigateToLogin}
                className="bg-[#0AD9DC] hover:bg-[#0AD9DC]/90 text-[#011623] font-bold rounded-full px-6 h-8 text-xs"
              >
                Start Learning
              </Button>
            )}
            <a
              href="https://cofhe-docs.fhenix.zone/docs/devdocs/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-400 hover:text-[#0AD9DC] transition-colors flex items-center gap-1"
            >
              <BookOpen className="w-4 h-4" /> <span className="hidden sm:inline">Documentation</span>
            </a>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="min-h-full flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            <footer className="py-8 px-8 border-t border-white/5 text-center text-slate-600 text-xs">
              © 2024 Fhenix Learn. All rights reserved.
            </footer>
          </div>
        </main>

      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, label, active, onClick, collapsed }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl transition-all duration-200 group ${active
        ? 'bg-gradient-to-r from-[#0AD9DC]/10 to-transparent text-[#0AD9DC] border-l-2 border-[#0AD9DC]'
        : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
        }`}
    >
      <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-[#0AD9DC]' : 'text-slate-500 group-hover:text-white transition-colors'}`} />
      {!collapsed && <span className="font-medium text-sm line-clamp-1">{label}</span>}
    </Link>
  );
}

function SandboxItem({ icon: Icon, label, to }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${isActive
        ? 'bg-[#0AD9DC]/10 text-[#0AD9DC]'
        : 'text-slate-500 hover:text-white hover:bg-white/5'
        }`}
    >
      <Icon className="w-4 h-4" />
      <span className="flex-1 text-xs">{label}</span>
    </Link>
  );
}