'use client';

import { useEffect } from 'react';
import type { Issue } from '@/types/hq';
import {
  X,
  Bug,
  Sparkles,
  Clock,
  MapPin,
  Smartphone,
  Monitor,
  FileCode,
  CheckCircle2,
  Edit3,
} from 'lucide-react';

interface IssueModalProps {
  issue: Issue;
  onClose: () => void;
}

export function IssueModal({ issue, onClose }: IssueModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

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

  const priorityLabels: Record<string, string> = {
    P0: 'Critical',
    P1: 'High',
    P2: 'Medium',
    P3: 'Low',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${issue.type === 'Bug' ? 'bg-status-error/10' : 'bg-status-info/10'}`}>
              {issue.type === 'Bug' ? (
                <Bug className="w-5 h-5 text-status-error" />
              ) : (
                <Sparkles className="w-5 h-5 text-status-info" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-zinc-500">{issue.id}</span>
                <span className={`badge ${issue.type === 'Bug' ? 'badge-error' : 'badge-info'}`}>
                  {issue.type}
                </span>
                <span className={`badge ${priorityColors[issue.priority]}`}>
                  {issue.priority} - {priorityLabels[issue.priority]}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <h2 className="text-xl font-semibold text-zinc-100 mb-6">{issue.title}</h2>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-dark-bg/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500">Status</span>
              </div>
              <span className={`badge ${statusColors[issue.status]}`}>
                {issue.status}
              </span>
            </div>
            <div className="p-3 bg-dark-bg/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500">Area</span>
              </div>
              <span className="text-sm font-medium text-zinc-300">{issue.area}</span>
            </div>
            {issue.screen && (
              <div className="p-3 bg-dark-bg/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1.5">
                  <Monitor className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-xs text-zinc-500">Screen</span>
                </div>
                <span className="text-sm font-medium text-zinc-300">{issue.screen}</span>
              </div>
            )}
            {issue.platform && (
              <div className="p-3 bg-dark-bg/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-xs text-zinc-500">Platform</span>
                </div>
                <span className="text-sm font-medium text-zinc-300">{issue.platform}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {issue.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-zinc-400 mb-3">Description</h3>
              <div className="p-4 bg-dark-bg/50 rounded-lg">
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {issue.description}
                </p>
              </div>
            </div>
          )}

          {/* Root Cause */}
          {issue.rootCause && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-zinc-400 mb-3">Root Cause</h3>
              <div className="p-4 bg-dark-bg/50 rounded-lg">
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {issue.rootCause}
                </p>
              </div>
            </div>
          )}

          {/* Fix Approach */}
          {issue.fixApproach && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-zinc-400 mb-3">Fix Approach</h3>
              <div className="p-4 bg-dark-bg/50 rounded-lg">
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {issue.fixApproach}
                </p>
              </div>
            </div>
          )}

          {/* Files */}
          {issue.files && issue.files.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                Related Files
              </h3>
              <div className="flex flex-wrap gap-2">
                {issue.files.map((file, idx) => (
                  <code
                    key={idx}
                    className="px-3 py-1.5 bg-dark-elevated rounded-lg text-xs font-mono text-accent-light border border-dark-border"
                  >
                    {file}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-ghost">
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
          {issue.status !== 'done' && (
            <button className="btn btn-primary">
              <CheckCircle2 className="w-4 h-4" />
              Mark Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
