import { useAuth } from '../../hooks/useAuth';
import { ChatBot } from '../chat/ChatBot';
import React, { useState, useEffect, useRef, useId } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  FileText,
  Folder,
  Trash2,
  Settings,
  LogOut,
  Plus,
  BookOpen,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const drawerId = useId();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
    } catch {
      return;
    }
  };

  const sidebarRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const wasMobileMenuOpenRef = useRef(false);

  const navigation = [
    { name: 'All Notes', href: '/notes', icon: FileText },
    { name: 'Folders', href: '/folders', icon: Folder },
    { name: 'Trash', href: '/trash', icon: Trash2 },
  ];

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsMobileMenuOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      if (wasMobileMenuOpenRef.current && isMobile) {
        menuTriggerRef.current?.focus();
      }
      wasMobileMenuOpenRef.current = false;
      return;
    }

    wasMobileMenuOpenRef.current = true;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        return;
      }

      if (e.key === 'Tab' && sidebarRef.current && isMobile) {
        const rawElements = Array.from(
          sidebarRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        );

        const focusableElements = rawElements.filter((el) => {
          if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') {
            return false;
          }
          if (el instanceof HTMLInputElement && el.type === 'hidden') {
            return false;
          }
          return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
        });

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const focusTimer = setTimeout(() => {
      if (sidebarRef.current && isMobile) {
        const rawElements = Array.from(
          sidebarRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        );
        const firstFocusable = rawElements.find((el) => {
          if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') return false;
          if (el instanceof HTMLInputElement && el.type === 'hidden') return false;
          return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
        });
        firstFocusable?.focus();
      }
    }, 0);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen, isMobile]);

  const isDrawerInert = isMobile && !isMobileMenuOpen;

  return (
    <div className="flex h-screen bg-background overflow-hidden text-on-surface">
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Close mobile sidebar backdrop"
          tabIndex={-1}
          className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-xs md:hidden cursor-default"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        id={drawerId}
        ref={sidebarRef}
        aria-hidden={isDrawerInert ? 'true' : undefined}
        inert={isDrawerInert ? true : undefined}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 border-r border-outline-variant bg-surface flex flex-col justify-between p-4 select-none transition-transform duration-200 md:static md:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight leading-none text-on-surface">NotesHub</h1>
                <span className="text-[10px] font-semibold tracking-wider text-on-surface-variant uppercase">Workspace</span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 text-on-surface-variant hover:text-on-surface md:hidden rounded-lg hover:bg-surface-hover"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <Link
            to="/notes/new"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full flex items-center justify-center gap-2 rounded-xl h-10 transition-colors shadow-sm font-extrabold text-xs uppercase tracking-wider bg-primary hover:bg-primary-hover text-on-primary"
          >
            <Plus className="h-4 w-4" />
            <span>New Note</span>
          </Link>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-surface-container text-primary font-bold shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-hover hover:text-on-surface'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-on-surface-variant')} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-outline-variant space-y-2">
          <Link
            to="/settings"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3.5 py-2.5 px-4 rounded-xl font-semibold transition-all ${
              location.pathname === '/settings'
                ? 'bg-primary-tint text-primary font-bold border border-primary/20 shadow-xs'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-hover'
            }`}
          >
            <Settings className="h-4.5 w-4.5" />
            <span className="text-[14px]">Settings</span>
          </Link>

          <div className="px-2 py-3 border-t border-outline-variant pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-primary shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="truncate text-[13px] font-bold text-on-surface">
                  {user?.username || 'User'}
                </div>
              </div>
              <button
                type="button"
                aria-label="logout"
                onClick={handleLogout}
                className="p-2 text-on-surface-variant hover:text-red-500 transition-colors rounded-lg hover:bg-surface-hover"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-background">
        <header className="h-14 border-b border-outline-variant bg-surface px-4 flex items-center md:hidden">
          <button
            ref={menuTriggerRef}
            type="button"
            aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={isMobileMenuOpen}
            aria-controls={drawerId}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="p-2 -ml-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-hover"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children ?? <Outlet />}</div>
      </main>

      <ChatBot />
    </div>
  );
};
