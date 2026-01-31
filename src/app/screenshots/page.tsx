'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import type { Screenshot } from '@/types/hq';
import {
  ImageIcon,
  Plus,
  Filter,
  Smartphone,
  Monitor,
  AlertCircle,
  FolderOpen,
  Info,
  X,
  Save,
  Upload,
} from 'lucide-react';

const SCREENSHOTS_STORAGE_KEY = 'hq_screenshots';

const loadInitialScreenshots = async (): Promise<Screenshot[]> => {
  const hqData = await import('../../../data/hq-data.json');
  return hqData.screenshots as Screenshot[];
};

export default function ScreenshotsPage() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [featureFilter, setFeatureFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);

  useEffect(() => {
    const loadScreenshots = async () => {
      const stored = localStorage.getItem(SCREENSHOTS_STORAGE_KEY);
      if (stored) {
        setScreenshots(JSON.parse(stored));
      } else {
        const initial = await loadInitialScreenshots();
        setScreenshots(initial);
        localStorage.setItem(SCREENSHOTS_STORAGE_KEY, JSON.stringify(initial));
      }
    };
    loadScreenshots();
  }, []);

  useEffect(() => {
    if (screenshots.length > 0) {
      localStorage.setItem(SCREENSHOTS_STORAGE_KEY, JSON.stringify(screenshots));
    }
  }, [screenshots]);

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

  const handleAddScreenshot = (newScreenshot: Omit<Screenshot, 'id' | 'createdAt'>) => {
    const id = `SS-${String(screenshots.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString().split('T')[0];

    const screenshot: Screenshot = {
      ...newScreenshot,
      id,
      createdAt: now,
    };

    setScreenshots(prev => [screenshot, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-status-info/10">
            <ImageIcon className="w-6 h-6 text-status-info" />
          </div>
          <div>
            <h1 className="page-title">Screenshots Library</h1>
            <p className="page-description">Visual documentation of app screens</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
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
              <li>Click &quot;Add Screenshot&quot; button to add metadata</li>
              <li>The path should match your file location (e.g., /screenshots/auth/login.png)</li>
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
              <div
                key={ss.id}
                className="card overflow-hidden group card-hover cursor-pointer"
                onClick={() => setSelectedScreenshot(ss)}
              >
                <div className="aspect-[9/16] bg-dark-bg flex items-center justify-center relative overflow-hidden">
                  {/* Try to load actual image, fallback to placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-4">
                      <Smartphone className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                      <div className="text-2xs text-zinc-600 font-mono truncate max-w-full px-2">
                        {ss.path}
                      </div>
                    </div>
                  </div>
                  {ss.relatedIssueIds && ss.relatedIssueIds.length > 0 && (
                    <div className="absolute top-2 right-2 z-10">
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
            <ImageIcon className="empty-state-icon" />
            <p className="empty-state-title">No screenshots found</p>
            <p className="empty-state-description">
              Try adjusting your filters or add new screenshots
            </p>
          </div>
        </div>
      )}

      {/* Add Screenshot Modal */}
      {showAddModal && (
        <AddScreenshotModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddScreenshot}
          existingFeatures={features}
        />
      )}

      {/* Screenshot Detail Modal */}
      {selectedScreenshot && (
        <ScreenshotDetailModal
          screenshot={selectedScreenshot}
          onClose={() => setSelectedScreenshot(null)}
        />
      )}
    </div>
  );
}

// Add Screenshot Modal Component
function AddScreenshotModal({
  onClose,
  onSave,
  existingFeatures,
}: {
  onClose: () => void;
  onSave: (screenshot: Omit<Screenshot, 'id' | 'createdAt'>) => void;
  existingFeatures: string[];
}) {
  const [formData, setFormData] = useState({
    name: '',
    path: '/screenshots/',
    feature: '',
    platform: 'iOS' as 'iOS' | 'Android',
    tags: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.feature.trim() || !formData.path.trim()) {
      alert('Name, Feature, and Path are required');
      return;
    }

    onSave({
      name: formData.name,
      path: formData.path,
      feature: formData.feature,
      platform: formData.platform,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: formData.notes || undefined,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-status-info/10">
              <Upload className="w-5 h-5 text-status-info" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">Add Screenshot</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">
                Name <span className="text-status-error">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="e.g., Login Screen"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">
                Path <span className="text-status-error">*</span>
              </label>
              <input
                type="text"
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                className="input font-mono text-sm"
                placeholder="/screenshots/auth/login.png"
                required
              />
              <p className="text-2xs text-zinc-600 mt-1">Path to image in public folder</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">
                  Feature <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.feature}
                  onChange={(e) => setFormData({ ...formData, feature: e.target.value })}
                  className="input"
                  placeholder="e.g., Auth"
                  list="features"
                  required
                />
                <datalist id="features">
                  {existingFeatures.map(f => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">Platform</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value as 'iOS' | 'Android' })}
                  className="input"
                >
                  <option value="iOS">iOS</option>
                  <option value="Android">Android</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">
                Tags <span className="text-zinc-600">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="input"
                placeholder="login, form, authentication"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input min-h-[80px] resize-y"
                placeholder="Additional notes about this screenshot..."
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save className="w-4 h-4" />
              Save Screenshot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Screenshot Detail Modal
function ScreenshotDetailModal({
  screenshot,
  onClose,
}: {
  screenshot: Screenshot;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-zinc-500">{screenshot.id}</span>
            <span className="badge badge-info">{screenshot.feature}</span>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          <h2 className="text-xl font-semibold text-zinc-100 mb-4">{screenshot.name}</h2>

          <div className="aspect-[9/16] max-w-xs mx-auto bg-dark-bg rounded-lg flex items-center justify-center mb-6">
            <div className="text-center p-4">
              <Smartphone className="w-16 h-16 text-zinc-700 mx-auto mb-3" />
              <code className="text-xs text-zinc-500 block">{screenshot.path}</code>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-dark-bg/50 rounded-lg">
              <span className="text-xs text-zinc-500 block mb-1">Platform</span>
              <span className="text-sm font-medium text-zinc-300">{screenshot.platform || 'All'}</span>
            </div>
            <div className="p-3 bg-dark-bg/50 rounded-lg">
              <span className="text-xs text-zinc-500 block mb-1">Created</span>
              <span className="text-sm font-medium text-zinc-300">{screenshot.createdAt}</span>
            </div>
          </div>

          {screenshot.tags.length > 0 && (
            <div className="mb-4">
              <span className="text-xs text-zinc-500 block mb-2">Tags</span>
              <div className="flex flex-wrap gap-2">
                {screenshot.tags.map((tag, i) => (
                  <span key={i} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {screenshot.notes && (
            <div>
              <span className="text-xs text-zinc-500 block mb-2">Notes</span>
              <p className="text-sm text-zinc-400">{screenshot.notes}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
