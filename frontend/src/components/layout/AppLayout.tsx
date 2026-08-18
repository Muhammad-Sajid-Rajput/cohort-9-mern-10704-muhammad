import React, { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Root application shell layout with navigation sidebar and workspace header.
 */
export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const navigation = [
    { name: 'All Notes', href: '/notes', icon: FileText },
    { name: 'Favorites', href: '/favorites', icon: Star },
    { name: 'Folders', href: '/folders', icon: Folder },
    { name: 'Tags', href: '/tags', icon: Tag },
    { name: 'Trash', href: '/trash', icon: Trash2 },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden text-on-surface">
      <aside className="w-64 border-r border-outline-variant bg-surface flex flex-col justify-between p-4 select-none">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight leading-none text-on-surface">NotesHub</h1>
              <span className="text-[10px] font-semibold tracking-wider text-on-surface-variant uppercase">Workspace</span>
            </div>
          </div>

          <Link
            to="/notes/new"
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
        <header className="h-16 border-b border-outline-variant bg-surface px-6 flex items-center justify-between">
          <div className="relative w-72">
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
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
};
