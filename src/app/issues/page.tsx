'use client';

import { useState, useMemo, useEffect } from 'react';
import { IssueModal } from '@/components/IssueModal';
import { AddIssueModal } from '@/components/AddIssueModal';
import type { Issue, IssueStatus, IssuePriority } from '@/types/hq';
import {
  Bug,
  Plus,
  Filter,
  Search,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

// LocalStorage key for issues
const ISSUES_STORAGE_KEY = 'hq_issues';

// Load initial data
const loadInitialIssues = async (): Promise<Issue[]> => {
  const hqData = await import('../../../data/hq-data.json');
  return hqData.issues as Issue[];
};

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | 'all'>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Load issues on mount
  useEffect(() => {
    const loadIssues = async () => {
      // Try to load from localStorage first
      const stored = localStorage.getItem(ISSUES_STORAGE_KEY);
      if (stored) {
        setIssues(JSON.parse(stored));
      } else {
        // Load from JSON file
        const initialIssues = await loadInitialIssues();
        setIssues(initialIssues);
        localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(initialIssues));
      }
    };
    loadIssues();
  }, []);

  // Save to localStorage when issues change
  useEffect(() => {
    if (issues.length > 0) {
      localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(issues));
    }
  }, [issues]);

  const areas = Array.from(new Set(issues.map(i => i.area)));

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
      if (areaFilter !== 'all' && issue.area !== areaFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return issue.title.toLowerCase().includes(q) ||
          issue.id.toLowerCase().includes(q) ||
          issue.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [issues, statusFilter, priorityFilter, areaFilter, searchQuery]);

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

  const handleAddIssue = (newIssue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'severity'>) => {
    const id = `ISS-${String(issues.length + 1).padStart(4, '0')}`;
    const now = new Date().toISOString().split('T')[0];

    const issue: Issue = {
      ...newIssue,
      id,
      severity: newIssue.priority === 'P0' ? 'High' : newIssue.priority === 'P1' ? 'High' : newIssue.priority === 'P2' ? 'Medium' : 'Low',
      createdAt: now,
      updatedAt: now,
    };

    setIssues(prev => [issue, ...prev]);
  };

  const handleUpdateIssueStatus = (issueId: string, newStatus: IssueStatus) => {
    setIssues(prev => prev.map(issue =>
      issue.id === issueId
        ? { ...issue, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] }
        : issue
    ));
    setSelectedIssue(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-status-error/10">
            <Bug className="w-6 h-6 text-status-error" />
          </div>
          <div>
            <h1 className="page-title">Issues & Revisions</h1>
            <p className="page-description">Track bugs, enhancements, and tasks</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add Issue
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] max-w-sm">
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Status</label>
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

          {/* Priority Filter */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Priority</label>
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

          {/* Area Filter */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Area</label>
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

          {/* Count */}
          <div className="ml-auto flex items-center gap-2 text-sm text-zinc-500">
            <Filter className="w-4 h-4" />
            <span>{filteredIssues.length} of {issues.length}</span>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="w-24">ID</th>
              <th>Title</th>
              <th className="w-24">Type</th>
              <th className="w-24">Priority</th>
              <th className="w-28">Status</th>
              <th className="w-32">Area</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.map((issue) => (
              <tr
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className="clickable"
              >
                <td className="font-mono text-zinc-500">{issue.id}</td>
                <td>
                  <div className="flex items-center gap-2">
                    {issue.priority === 'P0' && (
                      <AlertTriangle className="w-4 h-4 text-status-error flex-shrink-0" />
                    )}
                    <span className="font-medium text-zinc-200">{issue.title}</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${issue.type === 'Bug' ? 'badge-error' : 'badge-info'}`}>
                    {issue.type === 'Bug' ? (
                      <Bug className="w-3 h-3" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    {issue.type}
                  </span>
                </td>
                <td>
                  <span className={`badge ${priorityColors[issue.priority]}`}>
                    {issue.priority}
                  </span>
                </td>
                <td>
                  <span className={`badge ${statusColors[issue.status]}`}>
                    {issue.status}
                  </span>
                </td>
                <td className="text-zinc-500">{issue.area}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredIssues.length === 0 && (
          <div className="empty-state">
            <Bug className="empty-state-icon" />
            <p className="empty-state-title">No issues found</p>
            <p className="empty-state-description">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>

      {selectedIssue && (
        <IssueModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onStatusChange={(status) => handleUpdateIssueStatus(selectedIssue.id, status)}
        />
      )}

      {showAddModal && (
        <AddIssueModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddIssue}
        />
      )}
    </div>
  );
}
