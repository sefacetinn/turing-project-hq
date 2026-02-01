'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  AlertCircle,
  FileCheck,
  MoreHorizontal,
  ChevronLeft,
  Menu,
  X,
  Image as ImageIcon,
  Layers,
  Settings,
  ExternalLink,
  Rocket,
  Store,
  GitBranch
} from 'lucide-react';
import { getMergedData } from '@/lib/hqData';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [openIssueCount, setOpenIssueCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const data = getMergedData();
    const count = data.issues.filter(i => i.status !== 'done').length;
    setOpenIssueCount(count);
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Check if we're on a detail page
  const pathSegments = pathname.split('/').filter(Boolean);
  const isDetailPage = pathSegments.length > 2;

  // Get page title and back path
  const getPageInfo = () => {
    if (pathname === '/m') return { title: 'Project HQ', backPath: null };
    if (pathname === '/m/issues') return { title: 'Issues', backPath: null };
    if (pathname.startsWith('/m/issues/')) return { title: 'Issue', backPath: '/m/issues' };
    if (pathname === '/m/screenshots') return { title: 'Screenshots', backPath: null };
    if (pathname === '/m/compliance') return { title: 'Compliance', backPath: null };
    if (pathname === '/m/more') return { title: 'More', backPath: null };
    return { title: 'Project HQ', backPath: null };
  };

  const { title, backPath } = getPageInfo();

  // Sidebar navigation items
  const sidebarItems = [
    { href: '/m', icon: LayoutDashboard, label: 'Overview', badge: 0 },
    { href: '/m/issues', icon: AlertCircle, label: 'Issues', badge: openIssueCount },
    { href: '/m/screenshots', icon: ImageIcon, label: 'Screenshots', badge: 0 },
    { href: '/m/compliance', icon: FileCheck, label: 'Compliance', badge: 0 },
    { href: '/m/more', icon: MoreHorizontal, label: 'More', badge: 0 },
  ];

  const sidebarSections = [
    {
      title: 'Main',
      items: [
        { href: '/m', icon: LayoutDashboard, label: 'Overview' },
        { href: '/m/issues', icon: AlertCircle, label: 'Issues', badge: openIssueCount },
        { href: '/m/screenshots', icon: ImageIcon, label: 'Screenshots' },
      ]
    },
    {
      title: 'Documentation',
      items: [
        { href: '/m/compliance', icon: FileCheck, label: 'Compliance' },
        { href: '/m/more', icon: Layers, label: 'Architecture' },
      ]
    },
    {
      title: 'Resources',
      items: [
        { href: '/m/more', icon: Store, label: 'Marketplace' },
        { href: '/m/more', icon: Rocket, label: 'Builds' },
        { href: '/m/more', icon: GitBranch, label: 'Links' },
      ]
    }
  ];

  // Bottom nav items (simplified)
  const bottomNavItems = [
    { href: '/m', icon: LayoutDashboard, label: 'Home' },
    { href: '/m/issues', icon: AlertCircle, label: 'Issues', badge: openIssueCount },
    { href: '/m/compliance', icon: FileCheck, label: 'Docs' },
    { href: '/m/more', icon: MoreHorizontal, label: 'More' },
  ];

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-dark-bg/95 backdrop-blur-md border-b border-dark-border/50">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center h-12 px-4">
            {isDetailPage && backPath ? (
              <>
                <Link
                  href={backPath}
                  className="flex items-center gap-0.5 text-accent-light -ml-2 px-2 py-2 rounded-lg active:bg-dark-hover transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">Back</span>
                </Link>
                <h1 className="flex-1 text-center font-semibold text-zinc-100 pr-16">
                  {title}
                </h1>
              </>
            ) : (
              <>
                {/* Hamburger Menu Button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="w-10 h-10 -ml-2 flex items-center justify-center rounded-lg active:bg-dark-hover transition-colors"
                >
                  <Menu className="w-5 h-5 text-zinc-400" />
                </button>

                <div className="flex items-center gap-3 ml-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-glow">
                    <span className="text-white text-sm font-bold">T</span>
                  </div>
                  <div>
                    <h1 className="font-semibold text-zinc-100 text-[15px] leading-tight">{title}</h1>
                    {pathname === '/m' && (
                      <p className="text-[10px] text-zinc-500 leading-tight">Turing Dashboard</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-dark-card border-r border-dark-border/50 transform transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full pt-[env(safe-area-inset-top,0px)]">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-dark-border/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-glow">
                <span className="text-white text-base font-bold">T</span>
              </div>
              <div>
                <p className="font-semibold text-zinc-100 text-sm">Project HQ</p>
                <p className="text-[10px] text-zinc-500">Turing Mobile</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-dark-hover active:bg-dark-elevated transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {/* Sidebar Content */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
            {sidebarSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-3 mb-2">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const isActive = item.href === '/m'
                      ? pathname === '/m'
                      : pathname.startsWith(item.href) && item.href !== '/m';

                    return (
                      <Link
                        key={itemIndex}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                          isActive
                            ? 'bg-accent/15 text-accent-light'
                            : 'text-zinc-400 hover:bg-dark-hover hover:text-zinc-200 active:bg-dark-elevated'
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2px]' : ''}`} />
                        <span className="text-sm font-medium flex-1">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className={`min-w-[20px] h-5 flex items-center justify-center text-[11px] font-bold rounded-full px-1.5 ${
                            isActive
                              ? 'bg-accent text-white'
                              : 'bg-status-warning text-dark-bg'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-dark-border/50">
            <a
              href="https://hq.turingtr.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-500 hover:bg-dark-hover hover:text-zinc-300 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm">Desktop Version</span>
            </a>
            <div className="mt-3 px-3">
              <p className="text-[10px] text-zinc-600">Project HQ Mobile v2.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 scroll-smooth" id="mobile-main">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-card/98 backdrop-blur-lg border-t border-dark-border/60">
        <div className="pb-[env(safe-area-inset-bottom,0px)]">
          <div className="flex items-center justify-around h-14 px-1">
            {bottomNavItems.map((item) => {
              const isActive = item.href === '/m'
                ? pathname === '/m'
                : pathname.startsWith(item.href) && item.href !== '/m';

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center gap-0.5 px-5 py-1.5 rounded-xl transition-all active:scale-95 ${
                    isActive
                      ? 'text-accent-light'
                      : 'text-zinc-500 active:text-zinc-400'
                  }`}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-accent rounded-full" />
                  )}

                  <div className="relative">
                    <item.icon className={`w-[22px] h-[22px] ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />

                    {/* Badge */}
                    {item.badge && item.badge > 0 && (
                      <span className={`absolute -top-1.5 -right-2 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full px-1 ${
                        isActive
                          ? 'bg-accent text-white'
                          : 'bg-status-warning text-dark-bg'
                      }`}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>

                  <span className={`text-[10px] font-medium ${isActive ? 'text-accent-light' : ''}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
