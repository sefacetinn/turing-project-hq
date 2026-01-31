'use client';

import { useState } from 'react';
import {
  X,
  Bug,
  Sparkles,
  Save,
} from 'lucide-react';
import type { IssueStatus, IssuePriority, IssueType, Platform, Issue } from '@/types/hq';

type NewIssue = Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'severity'>;

interface AddIssueModalProps {
  onClose: () => void;
  onSave: (issue: NewIssue) => void;
}

export function AddIssueModal({ onClose, onSave }: AddIssueModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'Bug' as IssueType,
    priority: 'P2' as IssuePriority,
    status: 'backlog' as IssueStatus,
    area: '',
    description: '',
    screen: '',
    platform: 'All' as Platform,
  });

  const [filesInput, setFilesInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.area.trim()) {
      alert('Title and Area are required');
      return;
    }

    const issue: NewIssue = {
      title: formData.title,
      type: formData.type,
      priority: formData.priority,
      status: formData.status,
      area: formData.area,
      description: formData.description,
      screen: formData.screen || undefined,
      platform: formData.platform,
      files: filesInput.split(',').map(f => f.trim()).filter(Boolean),
    };

    onSave(issue);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-status-error/10">
              <Bug className="w-5 h-5 text-status-error" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">Add New Issue</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">
                Title <span className="text-status-error">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                placeholder="Brief description of the issue"
                required
              />
            </div>

            {/* Type & Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as IssueType })}
                  className="input"
                >
                  <option value="Bug">Bug</option>
                  <option value="Enhancement">Enhancement</option>
                  <option value="Task">Task</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as IssuePriority })}
                  className="input"
                >
                  <option value="P0">P0 - Critical</option>
                  <option value="P1">P1 - High</option>
                  <option value="P2">P2 - Medium</option>
                  <option value="P3">P3 - Low</option>
                </select>
              </div>
            </div>

            {/* Status & Area Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as IssueStatus })}
                  className="input"
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">Todo</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">
                  Area <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="input"
                  placeholder="e.g., Authentication, UI"
                  required
                />
              </div>
            </div>

            {/* Screen & Platform Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">Screen</label>
                <input
                  type="text"
                  value={formData.screen}
                  onChange={(e) => setFormData({ ...formData, screen: e.target.value })}
                  className="input"
                  placeholder="e.g., LoginScreen"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">Platform</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value as Platform })}
                  className="input"
                >
                  <option value="All">All</option>
                  <option value="iOS">iOS</option>
                  <option value="Android">Android</option>
                  <option value="Web">Web</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input min-h-[100px] resize-y"
                placeholder="Detailed description of the issue..."
                rows={4}
              />
            </div>

            {/* Related Files */}
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">
                Related Files <span className="text-zinc-600">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={filesInput}
                onChange={(e) => setFilesInput(e.target.value)}
                className="input"
                placeholder="src/components/Login.tsx, src/utils/auth.ts"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save className="w-4 h-4" />
              Save Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
