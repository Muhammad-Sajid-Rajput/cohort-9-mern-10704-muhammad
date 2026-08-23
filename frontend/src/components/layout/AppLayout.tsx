import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  Folder,
  Tag,
  Star,
  Trash2,
  Settings,
  LogOut,
  Plus,
  Search,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sidebarRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const wasMobileMenuOpenRef = useRef(false);

  const navigation = [
    { name: 'All Notes', href: '/notes', icon: FileText },
    { name: 'Favorites', href: '/favorites', icon: Star },
    { name: 'Folders', href: '/folders', icon: Folder },
    { name: 'Tags', href: '/tags', icon: Tag },
    { name: 'Trash', href: '/trash', icon: Trash2 },
  ];

  useEffect(() => {
    if (!isMobileMenuOpen) {
      if (wasMobileMenuOpenRef.current) {
        menuTriggerRef.current?.focus();
        wasMobileMenuOpenRef.current = false;
      }
      return;
    }

    wasMobileMenuOpenRef.current = true;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        return;
      }

      if (e.key === 'Tab' && sidebarRef.current && window.innerWidth < 768) {
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
      if (sidebarRef.current && window.innerWidth < 768) {
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
  }, [isMobileMenuOpen]);

  return (
    <div className="flex h-screen bg-background overflow-hidden text-on-surface">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        ref={sidebarRef}
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

        <div className="pt-4 border-t border-outline-variant space-y-1">
          <Link
            to="/settings"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-hover hover:text-on-surface transition-all"
          >
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4 text-on-surface-variant" />
              <span>Settings</span>
            </div>
          </Link>

          <div className="flex items-center justify-between px-3 py-2 mt-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-7 w-7 rounded-full bg-primary-tint text-primary flex items-center justify-center font-bold text-xs">
                U
              </div>
              <span className="text-xs font-semibold text-on-surface truncate">User Account</span>
            </div>
            <button
              type="button"
              aria-label="logout"
              onClick={() => window.dispatchEvent(new CustomEvent('auth:logout'))}
              className="p-2 text-on-surface-variant hover:text-error transition-colors rounded-lg hover:bg-surface-hover"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-background">
        <header className="h-16 border-b border-outline-variant bg-surface px-4 sm:px-6 flex items-center justify-between gap-3">
          <button
            ref={menuTriggerRef}
            type="button"
            aria-label="Open navigation"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-on-surface-variant hover:text-on-surface md:hidden rounded-lg hover:bg-surface-hover"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative flex-1 max-w-xs sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/60" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
};
