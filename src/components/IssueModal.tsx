'use client';

import type { Issue } from '@/types/hq';

interface IssueModalProps {
  issue: Issue;
  onClose: () => void;
}

export function IssueModal({ issue, onClose }: IssueModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-dark-card border border-dark-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-gray-400">{issue.id}</span>
            <span className={`badge ${issue.type === 'Bug' ? 'badge-error' : 'badge-info'}`}>
              {issue.type}
            </span>
            <span className={`badge ${issue.priority === 'P0' ? 'badge-error' : issue.priority === 'P1' ? 'badge-warning' : 'badge-neutral'}`}>
              {issue.priority}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            ×
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">{issue.title}</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">Status</div>
              <span className="badge badge-info">{issue.status}</span>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">Area</div>
              <span className="text-sm">{issue.area}</span>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">Screen</div>
              <span className="text-sm">{issue.screen || '-'}</span>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">Platform</div>
              <span className="text-sm">{issue.platform || 'All'}</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-xs text-gray-500 uppercase mb-2">Description</div>
            <p className="text-sm text-gray-300 bg-dark-bg p-3 rounded-lg">
              {issue.description}
            </p>
          </div>

          {issue.rootCause && (
            <div className="mb-6">
              <div className="text-xs text-gray-500 uppercase mb-2">Root Cause</div>
              <p className="text-sm text-gray-300 bg-dark-bg p-3 rounded-lg">
                {issue.rootCause}
              </p>
            </div>
          )}

          {issue.fixApproach && (
            <div className="mb-6">
              <div className="text-xs text-gray-500 uppercase mb-2">Fix Approach</div>
              <p className="text-sm text-gray-300 bg-dark-bg p-3 rounded-lg">
                {issue.fixApproach}
              </p>
            </div>
          )}

          {issue.files && issue.files.length > 0 && (
            <div className="mb-6">
              <div className="text-xs text-gray-500 uppercase mb-2">Related Files</div>
              <div className="space-y-1">
                {issue.files.map((file, idx) => (
                  <code key={idx} className="block text-sm text-accent bg-dark-bg px-3 py-1 rounded">
                    {file}
                  </code>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-dark-border">
            <div className="text-xs text-gray-500">
              Created: {issue.createdAt} • Updated: {issue.updatedAt}
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary">Edit</button>
              <button className="btn btn-primary">Mark Done</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
