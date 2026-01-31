'use client';

import hqData from '../../data/hq-data.json';
import {
  GitCommit,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Clock,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  action: string;
  timestamp: string;
  type?: 'commit' | 'fix' | 'update' | 'issue';
}

export function RecentActivity() {
  const recentChanges = hqData.recentChanges || [];
  const activityLog = (hqData.activityLog || []) as ActivityItem[];

  const getIcon = (type?: string, action?: string) => {
    if (type === 'commit' || action?.includes('commit')) {
      return <GitCommit className="w-4 h-4 text-accent" />;
    }
    if (type === 'fix' || action?.toLowerCase().includes('fix')) {
      return <CheckCircle2 className="w-4 h-4 text-status-success" />;
    }
    if (action?.toLowerCase().includes('issue') || action?.toLowerCase().includes('bug')) {
      return <AlertCircle className="w-4 h-4 text-status-error" />;
    }
    return <FileEdit className="w-4 h-4 text-status-info" />;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-300">Recent Activity</h3>
        <Clock className="w-4 h-4 text-zinc-500" />
      </div>

      {/* Recent Changes */}
      {recentChanges && recentChanges.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Changes</p>
          <div className="space-y-2">
            {recentChanges.slice(0, 3).map((change, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-dark-hover/50 transition-colors"
              >
                <div className="mt-0.5">
                  <FileEdit className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <p className="text-sm text-zinc-400 flex-1">{change}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Log */}
      {activityLog.length > 0 && (
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Activity Log</p>
          <div className="space-y-1">
            {activityLog.slice(0, 5).map((item: ActivityItem) => (
              <div
                key={item.id}
                className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-dark-hover/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(item.type, item.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 leading-snug">{item.action}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{formatTime(item.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activityLog.length === 0 && recentChanges.length === 0 && (
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">No recent activity</p>
        </div>
      )}
    </div>
  );
}
