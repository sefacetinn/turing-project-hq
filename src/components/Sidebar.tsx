'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bug,
  Apple,
  Image,
  Boxes,
  ShoppingBag,
  Link2,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/issues', label: 'Issues', icon: Bug },
  { href: '/apple', label: 'App Stores', icon: Apple },
  { href: '/screenshots', label: 'Screenshots', icon: Image },
  { href: '/architecture', label: 'Architecture', icon: Boxes },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/links', label: 'Links', icon: Link2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-dark-card/50 backdrop-blur-xl border-r border-dark-border/50 z-40">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-dark-border/50">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-accent/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-zinc-100 tracking-tight">Project HQ</h1>
              <p className="text-xs text-zinc-500">Turing Dashboard</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                >
                  <Icon className="nav-item-icon" />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-dark-border/50">
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              <span className="text-xs font-medium text-zinc-400">System Online</span>
            </div>
            <p className="text-2xs text-zinc-600">
              Last sync: {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
