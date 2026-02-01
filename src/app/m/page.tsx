'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
  FileCheck,
  Layers,
  ExternalLink,
  TrendingUp,
  Zap
} from 'lucide-react';
import { getMergedData, getStats } from '@/lib/hqData';
import { HQData } from '@/types/hq';

// Skeleton loaders
function KPISkeleton() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 bg-dark-elevated rounded" />
        <div className="h-3 bg-dark-elevated rounded w-12" />
      </div>
      <div className="h-7 bg-dark-elevated rounded w-10" />
    </div>
  );
}

function AlertSkeleton() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-dark-elevated rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-dark-elevated rounded w-full" />
          <div className="flex gap-2">
            <div className="h-5 bg-dark-elevated rounded w-10" />
            <div className="h-5 bg-dark-elevated rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MobileOverviewPage() {
  const [data, setData] = useState<HQData | null>(null);
  const [stats, setStats] = useState<ReturnType<typeof getStats> | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const hqData = getMergedData();
      setData(hqData);
      setStats(getStats());
      setLastUpdate(new Date(hqData.meta.updatedAt).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }));
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const criticalIssues = data?.issues.filter(i => i.priority === 'P0' && i.status !== 'done') || [];

  const quickLinks = [
    { href: '/m/issues', icon: AlertCircle, label: 'Issues', color: 'text-status-warning', bg: 'bg-status-warning/15' },
    { href: '/m/screenshots', icon: ImageIcon, label: 'Screenshots', color: 'text-status-info', bg: 'bg-status-info/15' },
    { href: '/m/compliance', icon: FileCheck, label: 'Compliance', color: 'text-status-success', bg: 'bg-status-success/15' },
    { href: '/m/more', icon: Layers, label: 'More', color: 'text-accent-light', bg: 'bg-accent/15' },
  ];

  // Calculate progress
  const totalIssues = stats?.total || 0;
  const doneIssues = stats?.done || 0;
  const progressPercent = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0;

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Welcome Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Turing Project</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {loading ? 'Loading...' : `Last sync: ${lastUpdate}`}
          </p>
        </div>
        {!loading && stats && (
          <div className="text-right">
            <div className="flex items-center gap-1 text-accent-light">
              <TrendingUp className="w-4 h-4" />
              <span className="text-lg font-bold">{progressPercent}%</span>
            </div>
            <p className="text-[10px] text-zinc-500">complete</p>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {loading ? (
          <>
            <KPISkeleton />
            <KPISkeleton />
            <KPISkeleton />
            <KPISkeleton />
          </>
        ) : stats && (
          <>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertCircle className="w-4 h-4 text-status-warning" />
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Open</span>
              </div>
              <p className="text-2xl font-bold text-zinc-100">{stats.backlog + stats.todo}</p>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-4 h-4 text-status-info" />
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">In Progress</span>
              </div>
              <p className="text-2xl font-bold text-zinc-100">{stats.inProgress}</p>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-status-success" />
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Done</span>
              </div>
              <p className="text-2xl font-bold text-status-success">{stats.done}</p>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle className="w-4 h-4 text-status-error" />
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Critical</span>
              </div>
              <p className={`text-2xl font-bold ${stats.p0Count > 0 ? 'text-status-error' : 'text-zinc-100'}`}>
                {stats.p0Count}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Critical Alerts */}
      {!loading && criticalIssues.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-status-error" />
            <h2 className="text-sm font-semibold text-zinc-400">Critical Issues</h2>
          </div>
          <div className="space-y-2">
            {criticalIssues.slice(0, 3).map((issue) => (
              <Link
                key={issue.id}
                href={`/m/issues/${issue.id}`}
                className="card p-4 flex items-start gap-3 active:bg-dark-hover active:scale-[0.99] transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-status-error/15 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4.5 h-4.5 text-status-error" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100 line-clamp-2 leading-snug">{issue.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-status-error/15 text-status-error rounded border border-status-error/30">
                      {issue.priority}
                    </span>
                    <span className="text-[11px] text-zinc-500">{issue.area}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          <div className="h-4 bg-dark-elevated rounded w-32 animate-pulse" />
          <AlertSkeleton />
          <AlertSkeleton />
        </div>
      )}

      {/* Quick Access */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-400">Quick Access</h2>
        <div className="grid grid-cols-4 gap-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="card p-3 flex flex-col items-center gap-2 active:bg-dark-hover active:scale-[0.97] transition-all"
            >
              <div className={`w-10 h-10 rounded-xl ${link.bg} flex items-center justify-center`}>
                <link.icon className={`w-5 h-5 ${link.color}`} />
              </div>
              <span className="text-[11px] font-medium text-zinc-400">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {!loading && data && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400">Recent Changes</h2>
          <div className="card divide-y divide-dark-border/30">
            {data.recentChanges.slice(0, 4).map((change, index) => (
              <div key={index} className="px-4 py-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                <p className="text-sm text-zinc-300 leading-snug">{change}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* External Links */}
      {!loading && data && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400">Quick Links</h2>
          <div className="flex flex-wrap gap-2">
            {data.quickLinks.slice(0, 4).map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-xs font-medium bg-dark-card border border-dark-border/50 rounded-lg text-zinc-400 flex items-center gap-1.5 active:bg-dark-hover transition-colors"
              >
                <span>{link.title}</span>
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Version info */}
      {!loading && data && (
        <div className="pt-4 pb-2 text-center">
          <p className="text-[10px] text-zinc-600">
            Project HQ Mobile • v{data.meta.version}
          </p>
        </div>
      )}
    </div>
  );
}
