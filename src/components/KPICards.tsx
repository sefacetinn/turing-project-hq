'use client';

import hqData from '../../data/hq-data.json';
import {
  Bug,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import type { Issue } from '@/types/hq';

export function KPICards() {
  const issues = hqData.issues as Issue[];

  const stats = {
    total: issues.length,
    open: issues.filter(i => i.status !== 'done').length,
    critical: issues.filter(i => i.priority === 'P0' && i.status !== 'done').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    done: issues.filter(i => i.status === 'done').length,
  };

  const kpis = [
    {
      label: 'Total Issues',
      value: stats.total,
      icon: Bug,
      color: 'text-zinc-100',
      bgColor: 'bg-zinc-500/10',
      iconColor: 'text-zinc-400',
    },
    {
      label: 'Open Issues',
      value: stats.open,
      icon: AlertTriangle,
      color: 'text-status-warning',
      bgColor: 'bg-status-warning/10',
      iconColor: 'text-status-warning',
    },
    {
      label: 'Critical (P0)',
      value: stats.critical,
      icon: AlertTriangle,
      color: stats.critical > 0 ? 'text-status-error' : 'text-status-success',
      bgColor: stats.critical > 0 ? 'bg-status-error/10' : 'bg-status-success/10',
      iconColor: stats.critical > 0 ? 'text-status-error' : 'text-status-success',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      icon: Clock,
      color: 'text-status-info',
      bgColor: 'bg-status-info/10',
      iconColor: 'text-status-info',
    },
    {
      label: 'Completed',
      value: stats.done,
      icon: CheckCircle2,
      color: 'text-status-success',
      bgColor: 'bg-status-success/10',
      iconColor: 'text-status-success',
    },
  ];

  const completionRate = stats.total > 0
    ? Math.round((stats.done / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="stat-card group hover:border-dark-border transition-all duration-300"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
                </div>
              </div>
              <div className={`stat-value ${kpi.color}`}>{kpi.value}</div>
              <div className="stat-label">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-zinc-300">Overall Progress</span>
          </div>
          <span className="text-sm font-semibold text-accent">{completionRate}%</span>
        </div>
        <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
          <span>{stats.done} completed</span>
          <span>{stats.open} remaining</span>
        </div>
      </div>
    </div>
  );
}
