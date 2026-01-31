'use client';

import { useState, useMemo } from 'react';
import hqData from '../../../data/hq-data.json';
import type { Screenshot } from '@/types/hq';
import {
  Image,
  Plus,
  Filter,
  Smartphone,
  Monitor,
  AlertCircle,
  FolderOpen,
  Info,
} from 'lucide-react';

export default function ScreenshotsPage() {
  const [featureFilter, setFeatureFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const screenshots = hqData.screenshots as Screenshot[];
  const features = Array.from(new Set(screenshots.map(s => s.feature)));

  const filteredScreenshots = useMemo(() => {
    return screenshots.filter(ss => {
      if (featureFilter !== 'all' && ss.feature !== featureFilter) return false;
      if (platformFilter !== 'all' && ss.platform !== platformFilter) return false;
      return true;
    });
  }, [screenshots, featureFilter, platformFilter]);

  const groupedScreenshots = useMemo(() => {
    const groups: Record<string, Screenshot[]> = {};
    filteredScreenshots.forEach(ss => {
      if (!groups[ss.feature]) groups[ss.feature] = [];
      groups[ss.feature].push(ss);
    });
    return groups;
  }, [filteredScreenshots]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-status-info/10">
            <Image className="w-6 h-6 text-status-info" />
          </div>
          <div>
            <h1 className="page-title">Screenshots Library</h1>
            <p className="page-description">Visual documentation of app screens</p>
          </div>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Add Screenshot
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Feature</label>
            <select
              value={featureFilter}
              onChange={(e) => setFeatureFilter(e.target.value)}
              className="input w-40"
            >
              <option value="all">All Features</option>
              {features.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Platform</label>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="input w-32"
            >
              <option value="all">All</option>
              <option value="iOS">iOS</option>
              <option value="Android">Android</option>
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-zinc-500">
            <Filter className="w-4 h-4" />
            <span>{filteredScreenshots.length} screenshots</span>
          </div>
        </div>
      </div>

      {/* Import Instructions */}
      <div className="card p-4 border-accent/20 bg-accent/5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/10 flex-shrink-0">
            <Info className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-200 mb-2">How to Add Screenshots</h3>
            <ol className="text-sm text-zinc-400 space-y-1 list-decimal list-inside">
              <li>Place image files in <code className="code">public/screenshots/[feature]/</code></li>
              <li>Update <code className="code">data/hq-data.json</code> with screenshot metadata</li>
              <li>Run <code className="code">npm run build</code> to include in the build</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Screenshots Grid */}
      {Object.entries(groupedScreenshots).map(([feature, shots]) => (
        <div key={feature} className="space-y-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-zinc-500" />
            <h2 className="text-lg font-semibold text-zinc-200">{feature}</h2>
            <span className="badge badge-neutral">{shots.length}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {shots.map((ss) => (
              <div key={ss.id} className="card overflow-hidden group card-hover">
                <div className="aspect-[9/16] bg-dark-bg flex items-center justify-center relative">
                  <div className="text-center p-4">
                    <Smartphone className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                    <div className="text-2xs text-zinc-600 font-mono truncate max-w-full px-2">
                      {ss.path}
                    </div>
                  </div>
                  {ss.relatedIssueIds && ss.relatedIssueIds.length > 0 && (
                    <div className="absolute top-2 right-2">
                      <span className="badge badge-error badge-sm flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {ss.relatedIssueIds.length}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="font-medium text-sm text-zinc-200 mb-2 truncate">
                    {ss.name}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {ss.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="tag text-2xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-2xs text-zinc-500">
                    {ss.platform === 'iOS' ? (
                      <Smartphone className="w-3 h-3" />
                    ) : (
                      <Monitor className="w-3 h-3" />
                    )}
                    <span>{ss.platform || 'All'}</span>
                    <span className="text-zinc-600">•</span>
                    <span>{ss.createdAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filteredScreenshots.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <Image className="empty-state-icon" />
            <p className="empty-state-title">No screenshots found</p>
            <p className="empty-state-description">
              Try adjusting your filters or add new screenshots
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
