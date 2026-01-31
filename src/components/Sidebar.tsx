'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Overview', icon: '📊' },
  { href: '/issues', label: 'Issues', icon: '🐛' },
  { href: '/apple', label: 'Apple Compliance', icon: '🍎' },
  { href: '/screenshots', label: 'Screenshots', icon: '📸' },
  { href: '/architecture', label: 'Architecture', icon: '🏗️' },
  { href: '/marketplace', label: 'Marketplace Debug', icon: '🛒' },
  { href: '/links', label: 'Links & Resources', icon: '🔗' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-dark-bg border-r border-dark-border fixed h-full">
      <div className="p-4 border-b border-dark-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-sm">
            T
          </div>
          <div>
            <div className="font-semibold text-sm">Turing HQ</div>
            <div className="text-xs text-gray-500">v2.0.0</div>
          </div>
        </Link>
      </div>

      <nav className="p-3">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-dark-hover text-white'
                  : 'text-gray-400 hover:text-white hover:bg-dark-hover'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-border">
        <div className="text-xs text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>
    </aside>
  );
}
