'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  ChevronRight,
  Inbox
} from 'lucide-react';
import { getMergedData } from '@/lib/hqData';
import { Issue, IssueStatus } from '@/types/hq';

const statusConfig: Record<IssueStatus, { icon: typeof Circle; color: string; bgColor: string; label: string }> = {
  'backlog': { icon: Circle, color: 'text-zinc-500', bgColor: 'bg-zinc-500/15', label: 'Backlog' },
  'todo': { icon: Circle, color: 'text-status-info', bgColor: 'bg-status-info/15', label: 'To Do' },
  'in-progress': { icon: Clock, color: 'text-status-warning', bgColor: 'bg-status-warning/15', label: 'In Progress' },
  'done': { icon: CheckCircle2, color: 'text-status-success', bgColor: 'bg-status-success/15', label: 'Done' },
};

const priorityConfig = {
  'P0': { color: 'text-status-error', bgColor: 'bg-status-error/15', borderColor: 'border-status-error/30', label: 'Critical' },
  'P1': { color: 'text-status-warning', bgColor: 'bg-status-warning/15', borderColor: 'border-status-warning/30', label: 'High' },
  'P2': { color: 'text-status-info', bgColor: 'bg-status-info/15', borderColor: 'border-status-info/30', label: 'Medium' },
  'P3': { color: 'text-zinc-400', bgColor: 'bg-zinc-500/15', borderColor: 'border-zinc-500/30', label: 'Low' },
};

// Relative time formatter
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

// Skeleton loader component
function IssueSkeleton() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-dark-elevated flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-dark-elevated rounded w-3/4" />
          <div className="flex gap-2">
            <div className="h-5 bg-dark-elevated rounded w-12" />
            <div className="h-5 bg-dark-elevated rounded w-16" />
            <div className="h-5 bg-dark-elevated rounded w-20" />
          </div>
          <div className="h-3 bg-dark-elevated rounded w-24" />
        </div>
      </div>
    </div>
  );
}

export default function MobileIssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate realistic loading
    const timer = setTimeout(() => {
      const data = getMergedData();
      // Sort by priority (P0 first) then by status
      const sorted = [...data.issues].sort((a, b) => {
        const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
        const statusOrder = { 'in-progress': 0, 'todo': 1, 'backlog': 2, 'done': 3 };

        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return statusOrder[a.status] - statusOrder[b.status];
      });
      setIssues(sorted);
      setLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  const openCount = issues.filter(i => i.status !== 'done').length;
  const criticalCount = issues.filter(i => i.priority === 'P0' && i.status !== 'done').length;
  const inProgressCount = issues.filter(i => i.status === 'in-progress').length;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Stats Header */}
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
        <div className="flex items-center gap-2 px-3 py-2 bg-dark-card rounded-xl border border-dark-border/50 flex-shrink-0">
          <span className="text-xl font-bold text-zinc-100">{loading ? '-' : issues.length}</span>
          <span className="text-xs text-zinc-500">total</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-dark-card rounded-xl border border-dark-border/50 flex-shrink-0">
          <span className="text-xl font-bold text-status-warning">{loading ? '-' : openCount}</span>
          <span className="text-xs text-zinc-500">open</span>
        </div>
        {!loading && inProgressCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-dark-card rounded-xl border border-dark-border/50 flex-shrink-0">
            <Clock className="w-4 h-4 text-status-info" />
            <span className="text-lg font-bold text-status-info">{inProgressCount}</span>
          </div>
        )}
        {!loading && criticalCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-status-error/10 rounded-xl border border-status-error/30 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-status-error" />
            <span className="text-lg font-bold text-status-error">{criticalCount}</span>
            <span className="text-xs text-status-error/70">critical</span>
          </div>
        )}
      </div>

      {/* Issue List */}
      <div className="space-y-3">
        {loading ? (
          <>
            <IssueSkeleton />
            <IssueSkeleton />
            <IssueSkeleton />
          </>
        ) : issues.length > 0 ? (
          issues.map((issue) => {
            const status = statusConfig[issue.status];
            const priority = priorityConfig[issue.priority];
            const StatusIcon = status.icon;

            return (
              <Link
                key={issue.id}
                href={`/m/issues/${issue.id}`}
                className="card p-4 block active:bg-dark-hover active:scale-[0.99] transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon with priority ring */}
                  <div className={`relative w-10 h-10 rounded-xl ${status.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${status.color}`} />
                    {issue.priority === 'P0' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-status-error rounded-full animate-pulse" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[15px] font-medium text-zinc-100 leading-snug line-clamp-2 flex-1">
                        {issue.title}
                      </p>
                      <ChevronRight className="w-5 h-5 text-zinc-600 flex-shrink-0 mt-0.5" />
                    </div>

                    {/* Badges row */}
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <span className={`px-2 py-0.5 text-[11px] font-bold rounded ${priority.bgColor} ${priority.color} border ${priority.borderColor}`}>
                        {issue.priority}
                      </span>
                      <span className={`px-2 py-0.5 text-[11px] font-medium rounded ${status.bgColor} ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-medium">{issue.area}</span>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-600">
                      {issue.screen && (
                        <span className="truncate max-w-[120px]">{issue.screen}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getRelativeTime(issue.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-status-success/15 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-status-success" />
            </div>
            <p className="text-lg font-medium text-zinc-300 mb-1">All clear!</p>
            <p className="text-sm text-zinc-500">No issues to display.</p>
          </div>
        )}
      </div>
    </div>
  );
}
