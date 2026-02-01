'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { LayoutDashboard, AlertCircle, FileCheck, MoreHorizontal, ChevronLeft } from 'lucide-react';
import { getMergedData } from '@/lib/hqData';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [openIssueCount, setOpenIssueCount] = useState(0);

  useEffect(() => {
    const data = getMergedData();
    const count = data.issues.filter(i => i.status !== 'done').length;
    setOpenIssueCount(count);
  }, []);

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

  const navItems = [
    { href: '/m', icon: LayoutDashboard, label: 'Overview', badge: 0 },
    { href: '/m/issues', icon: AlertCircle, label: 'Issues', badge: openIssueCount },
    { href: '/m/compliance', icon: FileCheck, label: 'Docs', badge: 0 },
    { href: '/m/more', icon: MoreHorizontal, label: 'More', badge: 0 },
  ];

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Top Header - Fixed height with safe area */}
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
              <div className="flex items-center gap-3">
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
            )}
          </div>
        </div>
      </header>

      {/* Main Content with scroll restoration */}
      <main className="flex-1 overflow-y-auto pb-20 scroll-smooth" id="mobile-main">
        {children}
      </main>

      {/* Bottom Navigation - Enhanced with badges */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-card/98 backdrop-blur-lg border-t border-dark-border/60">
        <div className="pb-[env(safe-area-inset-bottom,0px)]">
          <div className="flex items-center justify-around h-14 px-1">
            {navItems.map((item) => {
              const isActive = item.href === '/m'
                ? pathname === '/m'
                : pathname.startsWith(item.href);

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
                    {item.badge > 0 && (
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
