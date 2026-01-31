'use client';

import { useState, useMemo } from 'react';
import hqData from '../../../data/hq-data.json';
import { IssueModal } from '@/components/IssueModal';
import type { Issue, IssueStatus, IssuePriority } from '@/types/hq';

export default function IssuesPage() {
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | 'all'>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const issues = hqData.issues as Issue[];
  const areas = Array.from(new Set(issues.map(i => i.area)));

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
      if (areaFilter !== 'all' && issue.area !== areaFilter) return false;
      return true;
    });
  }, [issues, statusFilter, priorityFilter, areaFilter]);

  const statusColors: Record<string, string> = {
    backlog: 'badge-neutral',
    todo: 'badge-info',
    'in-progress': 'badge-warning',
    done: 'badge-success',
  };

  const priorityColors: Record<string, string> = {
    P0: 'badge-error',
    P1: 'badge-warning',
    P2: 'badge-info',
    P3: 'badge-neutral',
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Issues & Revisions</h1>
          <p className="text-gray-400 mt-1">Track bugs, enhancements, and tasks</p>
        </div>
        <button className="btn btn-primary">
          + Add Issue
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as IssueStatus | 'all')}
              className="input w-32"
            >
              <option value="all">All</option>
              <option value="backlog">Backlog</option>
              <option value="todo">Todo</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as IssuePriority | 'all')}
              className="input w-24"
            >
              <option value="all">All</option>
              <option value="P0">P0</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Area</label>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="input w-36"
            >
              <option value="all">All Areas</option>
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto text-sm text-gray-400">
            {filteredIssues.length} of {issues.length} issues
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-bg border-b border-dark-border">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">ID</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Title</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Type</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Priority</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Area</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.map((issue) => (
              <tr
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className="border-b border-dark-border hover:bg-dark-hover cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-sm font-mono text-gray-400">{issue.id}</td>
                <td className="px-4 py-3 text-sm font-medium">{issue.title}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${issue.type === 'Bug' ? 'badge-error' : 'badge-info'}`}>
                    {issue.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${priorityColors[issue.priority]}`}>
                    {issue.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${statusColors[issue.status]}`}>
                    {issue.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{issue.area}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredIssues.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No issues match your filters
          </div>
        )}
      </div>

      {selectedIssue && (
        <IssueModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
      )}
    </div>
  );
}
