'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
  Trash2,
  ZoomIn,
} from 'lucide-react';

const SCREENSHOTS_STORAGE_KEY = 'hq_screenshots';
const SCREENSHOT_IMAGES_KEY = 'hq_screenshot_images';

interface ScreenshotWithImage extends Screenshot {
  imageData?: string; // base64 image data
}

const loadInitialScreenshots = async (): Promise<ScreenshotWithImage[]> => {
  const hqData = await import('../../../data/hq-data.json');
  return hqData.screenshots as ScreenshotWithImage[];
};

export default function ScreenshotsPage() {
  const [screenshots, setScreenshots] = useState<ScreenshotWithImage[]>([]);
  const [imageCache, setImageCache] = useState<Record<string, string>>({});
  const [featureFilter, setFeatureFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotWithImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Load screenshots and images on mount
  useEffect(() => {
    const loadData = async () => {
      // Load screenshots
      const stored = localStorage.getItem(SCREENSHOTS_STORAGE_KEY);
      if (stored) {
        setScreenshots(JSON.parse(stored));
      } else {
        const initial = await loadInitialScreenshots();
        setScreenshots(initial);
        localStorage.setItem(SCREENSHOTS_STORAGE_KEY, JSON.stringify(initial));
      }

      // Load image cache
      const images = localStorage.getItem(SCREENSHOT_IMAGES_KEY);
      if (images) {
        setImageCache(JSON.parse(images));
      }
    };
    loadData();
  }, []);

  // Save screenshots when changed
  useEffect(() => {
    if (screenshots.length > 0) {
      localStorage.setItem(SCREENSHOTS_STORAGE_KEY, JSON.stringify(screenshots));
    }
  }, [screenshots]);

  // Save image cache when changed
  useEffect(() => {
    if (Object.keys(imageCache).length > 0) {
      localStorage.setItem(SCREENSHOT_IMAGES_KEY, JSON.stringify(imageCache));
    }
  }, [imageCache]);

  const features = Array.from(new Set(screenshots.map(s => s.feature)));

  const filteredScreenshots = useMemo(() => {
    return screenshots.filter(ss => {
      if (featureFilter !== 'all' && ss.feature !== featureFilter) return false;
      if (platformFilter !== 'all' && ss.platform !== platformFilter) return false;
      return true;
    });
  }, [screenshots, featureFilter, platformFilter]);

  const groupedScreenshots = useMemo(() => {
    const groups: Record<string, ScreenshotWithImage[]> = {};
    filteredScreenshots.forEach(ss => {
      if (!groups[ss.feature]) groups[ss.feature] = [];
      groups[ss.feature].push(ss);
    });
    return groups;
  }, [filteredScreenshots]);

  const handleAddScreenshot = (newScreenshot: Omit<ScreenshotWithImage, 'id' | 'createdAt'>, imageData?: string) => {
    const id = `SS-${String(screenshots.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString().split('T')[0];

    const screenshot: ScreenshotWithImage = {
      ...newScreenshot,
      id,
      createdAt: now,
    };

    setScreenshots(prev => [screenshot, ...prev]);

    // Save image to cache if provided
    if (imageData) {
      setImageCache(prev => ({ ...prev, [id]: imageData }));
    }
  };

  const handleDeleteScreenshot = (id: string) => {
    if (confirm('Are you sure you want to delete this screenshot?')) {
      setScreenshots(prev => prev.filter(s => s.id !== id));
      setImageCache(prev => {
        const newCache = { ...prev };
        delete newCache[id];
        return newCache;
      });
      setSelectedScreenshot(null);
    }
  };

  // Global drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));

    if (imageFile) {
      // Open modal with the dropped image
      setShowAddModal(true);
      // Store the file temporarily
      (window as any).__droppedImageFile = imageFile;
    }
  }, []);

  return (
    <div
      className="space-y-6 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-dark-bg/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-12 border-2 border-dashed border-accent rounded-2xl bg-accent/5">
            <Upload className="w-16 h-16 text-accent mx-auto mb-4" />
            <p className="text-xl font-semibold text-zinc-100 mb-2">Drop screenshot here</p>
            <p className="text-sm text-zinc-500">Release to add new screenshot</p>
          </div>
        </div>
      )}

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

      {/* Drag & Drop Info */}
      <div className="card p-4 border-accent/20 bg-accent/5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/10 flex-shrink-0">
            <Upload className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-200 mb-1">Drag & Drop</h3>
            <p className="text-sm text-zinc-400">
              Simply drag and drop an image anywhere on this page to add a new screenshot.
            </p>
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
                  {imageCache[ss.id] ? (
                    <img
                      src={imageCache[ss.id]}
                      alt={ss.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-4">
                        <Smartphone className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                        <div className="text-2xs text-zinc-600 font-mono truncate max-w-full px-2">
                          {ss.path}
                        </div>
                      </div>
                    </div>
                  )}
                  {ss.relatedIssueIds && ss.relatedIssueIds.length > 0 && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="badge badge-error badge-sm flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {ss.relatedIssueIds.length}
                      </span>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white" />
                  </div>
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
              Drag and drop an image here to add your first screenshot
            </p>
          </div>
        </div>
      )}

      {/* Add Screenshot Modal */}
      {showAddModal && (
        <AddScreenshotModal
          onClose={() => {
            setShowAddModal(false);
            (window as any).__droppedImageFile = null;
          }}
          onSave={handleAddScreenshot}
          existingFeatures={features}
          droppedFile={(window as any).__droppedImageFile}
        />
      )}

      {/* Screenshot Detail Modal */}
      {selectedScreenshot && (
        <ScreenshotDetailModal
          screenshot={selectedScreenshot}
          imageData={imageCache[selectedScreenshot.id]}
          onClose={() => setSelectedScreenshot(null)}
          onDelete={() => handleDeleteScreenshot(selectedScreenshot.id)}
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
  droppedFile,
}: {
  onClose: () => void;
  onSave: (screenshot: Omit<Screenshot, 'id' | 'createdAt'>, imageData?: string) => void;
  existingFeatures: string[];
  droppedFile?: File;
}) {
  const [formData, setFormData] = useState({
    name: '',
    path: '/screenshots/',
    feature: '',
    platform: 'iOS' as 'iOS' | 'Android',
    tags: '',
    notes: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle dropped file from page
  useEffect(() => {
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }, [droppedFile]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Check file size (max 5MB for localStorage)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);

      // Auto-fill name from filename
      if (!formData.name) {
        const name = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setFormData(prev => ({ ...prev, name: name.charAt(0).toUpperCase() + name.slice(1) }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.feature.trim()) {
      alert('Name and Feature are required');
      return;
    }

    if (!imagePreview) {
      alert('Please upload an image');
      return;
    }

    onSave({
      name: formData.name,
      path: formData.path || `/screenshots/${formData.feature.toLowerCase()}/${formData.name.toLowerCase().replace(/\s+/g, '-')}.png`,
      feature: formData.feature,
      platform: formData.platform,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: formData.notes || undefined,
    }, imagePreview);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
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
            {/* Image Upload Zone */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                isDragging ? 'border-accent bg-accent/10' : 'border-dark-border hover:border-zinc-600'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 p-1 bg-dark-bg/80 rounded-full hover:bg-dark-hover"
                  >
                    <X className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
              ) : (
                <div className="py-8">
                  <Upload className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400 mb-2">
                    Drag and drop an image here, or{' '}
                    <label className="text-accent hover:text-accent-light cursor-pointer">
                      browse
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-xs text-zinc-600">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">
                  Tags <span className="text-zinc-600">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="input"
                  placeholder="login, form, auth"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input min-h-[60px] resize-y"
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!imagePreview}>
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
  imageData,
  onClose,
  onDelete,
}: {
  screenshot: Screenshot;
  imageData?: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-zinc-500">{screenshot.id}</span>
            <span className="badge badge-info">{screenshot.feature}</span>
            <span className="badge badge-neutral">{screenshot.platform || 'All'}</span>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          <h2 className="text-xl font-semibold text-zinc-100 mb-4">{screenshot.name}</h2>

          {/* Image Preview */}
          <div className="bg-dark-bg rounded-xl p-4 mb-6 flex items-center justify-center min-h-[300px]">
            {imageData ? (
              <img
                src={imageData}
                alt={screenshot.name}
                className="max-h-[500px] rounded-lg shadow-lg"
              />
            ) : (
              <div className="text-center p-8">
                <Smartphone className="w-20 h-20 text-zinc-700 mx-auto mb-4" />
                <code className="text-sm text-zinc-500 block">{screenshot.path}</code>
                <p className="text-xs text-zinc-600 mt-2">Image not uploaded</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-dark-bg/50 rounded-lg">
              <span className="text-xs text-zinc-500 block mb-1">Platform</span>
              <span className="text-sm font-medium text-zinc-300">{screenshot.platform || 'All'}</span>
            </div>
            <div className="p-3 bg-dark-bg/50 rounded-lg">
              <span className="text-xs text-zinc-500 block mb-1">Feature</span>
              <span className="text-sm font-medium text-zinc-300">{screenshot.feature}</span>
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
          <button className="btn btn-danger" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <div className="flex-1" />
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
