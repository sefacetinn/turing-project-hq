'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  FileCode,
  User,
  Calendar,
  Tag,
  Smartphone,
  FileText,
  Bug,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { getMergedData } from '@/lib/hqData';
import { Issue, IssueStatus, Screenshot } from '@/types/hq';

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

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Skeleton loader
function DetailSkeleton() {
  return (
    <div className="px-4 py-5 space-y-5 animate-pulse">
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="h-5 bg-dark-elevated rounded w-16" />
          <div className="h-5 bg-dark-elevated rounded w-12" />
          <div className="h-5 bg-dark-elevated rounded w-16" />
        </div>
        <div className="h-6 bg-dark-elevated rounded w-full" />
        <div className="h-6 bg-dark-elevated rounded w-3/4" />
      </div>
      <div className="card p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-dark-elevated" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-dark-elevated rounded w-24" />
            <div className="h-3 bg-dark-elevated rounded w-32" />
          </div>
        </div>
      </div>
      <div className="card p-4 space-y-2">
        <div className="h-4 bg-dark-elevated rounded w-full" />
        <div className="h-4 bg-dark-elevated rounded w-full" />
        <div className="h-4 bg-dark-elevated rounded w-2/3" />
      </div>
    </div>
  );
}

interface IssueDetailClientProps {
  issueId: string;
}

export default function IssueDetailClient({ issueId }: IssueDetailClientProps) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [relatedScreenshots, setRelatedScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedType, setCopiedType] = useState<'summary' | 'full' | 'diagnostics' | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const data = getMergedData();
      const found = data.issues.find(i => i.id === issueId);
      setIssue(found || null);

      // Find related screenshots
      if (found?.screenshotIds) {
        const screenshots = data.screenshots.filter(s => found.screenshotIds?.includes(s.id));
        setRelatedScreenshots(screenshots);
      }

      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [issueId]);

  const copyToClipboard = async (text: string, type: 'summary' | 'full' | 'diagnostics') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopySummary = () => {
    if (!issue) return;
    const summary = `${issue.id}: ${issue.title}\nPriority: ${issue.priority} | Status: ${statusConfig[issue.status].label}\nArea: ${issue.area}${issue.screen ? ` | Screen: ${issue.screen}` : ''}`;
    copyToClipboard(summary, 'summary');
  };

  const handleCopyFullReport = () => {
    if (!issue) return;

    const sections = [
      `# ${issue.id}: ${issue.title}`,
      '',
      '## Details',
      `- **Priority:** ${issue.priority} (${priorityConfig[issue.priority].label})`,
      `- **Status:** ${statusConfig[issue.status].label}`,
      `- **Type:** ${issue.type}`,
      `- **Area:** ${issue.area}`,
      issue.screen ? `- **Screen:** ${issue.screen}` : '',
      issue.platform ? `- **Platform:** ${issue.platform}` : '',
      issue.assignee ? `- **Assignee:** ${issue.assignee}` : '',
      `- **Updated:** ${getRelativeTime(issue.updatedAt)}`,
      '',
      '## Description',
      issue.description,
      '',
    ];

    if (issue.rootCause) {
      sections.push('## Root Cause', issue.rootCause, '');
    }

    if (issue.fixApproach) {
      sections.push('## Fix Approach', issue.fixApproach, '');
    }

    if (issue.files && issue.files.length > 0) {
      sections.push('## Related Files', ...issue.files.map(f => `- \`${f}\``), '');
    }

    if (relatedScreenshots.length > 0) {
      sections.push('## Screenshots', ...relatedScreenshots.map(s => `- ${s.name}: ${s.path}`), '');
    }

    sections.push('---', `Generated from Project HQ on ${new Date().toLocaleDateString('tr-TR')}`);

    copyToClipboard(sections.filter(Boolean).join('\n'), 'full');
  };

  const handleCopyDiagnostics = () => {
    if (!issue) return;

    const diagnostics = {
      issueId: issue.id,
      title: issue.title,
      priority: issue.priority,
      status: issue.status,
      type: issue.type,
      area: issue.area,
      screen: issue.screen || null,
      platform: issue.platform || null,
      files: issue.files || [],
      rootCause: issue.rootCause || null,
      fixApproach: issue.fixApproach || null,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    };

    copyToClipboard(JSON.stringify(diagnostics, null, 2), 'diagnostics');
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!issue) {
    return (
      <div className="px-4 py-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-status-error/15 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-status-error" />
          </div>
          <p className="text-lg font-medium text-zinc-300 mb-1">Issue not found</p>
          <p className="text-sm text-zinc-500 mb-4">The issue you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/m/issues" className="btn btn-secondary">
            Back to Issues
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[issue.status];
  const priority = priorityConfig[issue.priority];
  const StatusIcon = status.icon;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs font-mono text-zinc-500 bg-dark-elevated px-2 py-0.5 rounded">{issue.id}</span>
          <span className={`px-2 py-0.5 text-[11px] font-bold rounded ${priority.bgColor} ${priority.color} border ${priority.borderColor}`}>
            {issue.priority} · {priorityConfig[issue.priority].label}
          </span>
        </div>
        <h1 className="text-lg font-semibold text-zinc-100 leading-snug">
          {issue.title}
        </h1>
      </div>

      {/* Status Card */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${status.bgColor} flex items-center justify-center`}>
            <StatusIcon className={`w-6 h-6 ${status.color}`} />
          </div>
          <div className="flex-1">
            <p className={`text-base font-semibold ${status.color}`}>{status.label}</p>
            <p className="text-sm text-zinc-500">{issue.type} in {issue.area}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-600">Updated</p>
            <p className="text-sm text-zinc-400">{getRelativeTime(issue.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="card divide-y divide-dark-border/30">
        {issue.screen && (
          <div className="px-4 py-3 flex items-center gap-3">
            <Smartphone className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <span className="text-xs text-zinc-500 min-w-[70px]">Screen</span>
            <span className="text-sm text-zinc-300 flex-1">{issue.screen}</span>
          </div>
        )}
        {issue.platform && (
          <div className="px-4 py-3 flex items-center gap-3">
            <Tag className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <span className="text-xs text-zinc-500 min-w-[70px]">Platform</span>
            <span className="text-sm text-zinc-300">{issue.platform}</span>
          </div>
        )}
        {issue.assignee && (
          <div className="px-4 py-3 flex items-center gap-3">
            <User className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <span className="text-xs text-zinc-500 min-w-[70px]">Assignee</span>
            <span className="text-sm text-zinc-300">{issue.assignee}</span>
          </div>
        )}
        <div className="px-4 py-3 flex items-center gap-3">
          <Calendar className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <span className="text-xs text-zinc-500 min-w-[70px]">Created</span>
          <span className="text-sm text-zinc-300">
            {new Date(issue.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-400">Description</h2>
        </div>
        <div className="card p-4">
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {issue.description}
          </p>
        </div>
      </div>

      {/* Root Cause */}
      {issue.rootCause && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-status-error" />
            <h2 className="text-sm font-semibold text-zinc-400">Root Cause</h2>
          </div>
          <div className="card p-4 border-l-2 border-status-error/50">
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {issue.rootCause}
            </p>
          </div>
        </div>
      )}

      {/* Fix Approach */}
      {issue.fixApproach && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-success" />
            <h2 className="text-sm font-semibold text-zinc-400">Fix Approach</h2>
          </div>
          <div className="card p-4 border-l-2 border-status-success/50">
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {issue.fixApproach}
            </p>
          </div>
        </div>
      )}

      {/* Related Files */}
      {issue.files && issue.files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-accent-light" />
            <h2 className="text-sm font-semibold text-zinc-400">Related Files</h2>
          </div>
          <div className="card divide-y divide-dark-border/30">
            {issue.files.map((file, index) => (
              <div key={index} className="px-4 py-3 flex items-center gap-3">
                <code className="text-xs text-accent-light font-mono flex-1 break-all">{file}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Screenshots */}
      {relatedScreenshots.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-status-info" />
            <h2 className="text-sm font-semibold text-zinc-400">Screenshots</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {relatedScreenshots.map((screenshot) => (
              <Link
                key={screenshot.id}
                href="/m/screenshots"
                className="flex-shrink-0 w-20 card overflow-hidden active:scale-95 transition-transform"
              >
                <div className="aspect-[9/16] bg-dark-elevated flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-zinc-700" />
                </div>
                <p className="p-2 text-[10px] text-zinc-400 truncate">{screenshot.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={handleCopyFullReport}
          className="w-full btn btn-primary justify-center"
        >
          {copiedType === 'full' ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied Full Report!</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              <span>Copy Full Report</span>
            </>
          )}
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleCopySummary}
            className="flex-1 btn btn-secondary justify-center"
          >
            {copiedType === 'summary' ? (
              <>
                <Check className="w-4 h-4 text-status-success" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Summary</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyDiagnostics}
            className="flex-1 btn btn-secondary justify-center"
          >
            {copiedType === 'diagnostics' ? (
              <>
                <Check className="w-4 h-4 text-status-success" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Bug className="w-4 h-4" />
                <span>Diagnostics</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
