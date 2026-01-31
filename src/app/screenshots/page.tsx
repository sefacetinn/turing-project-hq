'use client';

import { useState, useMemo } from 'react';
import hqData from '../../../data/hq-data.json';
import type { Screenshot } from '@/types/hq';

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

  // Group by feature
  const groupedScreenshots = useMemo(() => {
    const groups: Record<string, Screenshot[]> = {};
    filteredScreenshots.forEach(ss => {
      if (!groups[ss.feature]) groups[ss.feature] = [];
      groups[ss.feature].push(ss);
    });
    return groups;
  }, [filteredScreenshots]);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Screenshots Library</h1>
          <p className="text-gray-400 mt-1">Visual documentation of app screens</p>
        </div>
        <button className="btn btn-primary">+ Add Screenshot</button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Feature</label>
            <select
              value={featureFilter}
              onChange={(e) => setFeatureFilter(e.target.value)}
              className="input w-36"
            >
              <option value="all">All Features</option>
              {features.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Platform</label>
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
          <div className="ml-auto text-sm text-gray-400">
            {filteredScreenshots.length} screenshots
          </div>
        </div>
      </div>

      {/* Import Instructions */}
      <div className="card p-4 mb-6 bg-accent/5 border-accent/20">
        <h3 className="font-medium mb-2">📁 How to Add Screenshots</h3>
        <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
          <li>Place image files in <code className="text-accent">public/screenshots/[feature]/</code></li>
          <li>Update <code className="text-accent">data/hq-data.json</code> with screenshot metadata</li>
          <li>Run <code className="text-accent">npm run build</code> to include in the build</li>
        </ol>
      </div>

      {/* Screenshots Grid */}
      {Object.entries(groupedScreenshots).map(([feature, shots]) => (
        <div key={feature} className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {feature}
            <span className="text-sm font-normal text-gray-500">({shots.length})</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {shots.map((ss) => (
              <div key={ss.id} className="card overflow-hidden group">
                <div className="aspect-[9/16] bg-dark-bg flex items-center justify-center relative">
                  {/* Placeholder - in production this would show actual image */}
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">📱</div>
                    <div className="text-xs text-gray-500">{ss.path}</div>
                  </div>
                  {ss.relatedIssueIds && ss.relatedIssueIds.length > 0 && (
                    <div className="absolute top-2 right-2">
                      <span className="badge badge-error text-xs">
                        {ss.relatedIssueIds.length} issue{ss.relatedIssueIds.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="font-medium text-sm mb-1">{ss.name}</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {ss.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-xs bg-dark-bg px-2 py-0.5 rounded text-gray-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {ss.platform || 'All'} • {ss.createdAt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filteredScreenshots.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">📷</div>
          <p className="text-gray-400">No screenshots match your filters</p>
        </div>
      )}
    </div>
  );
}
