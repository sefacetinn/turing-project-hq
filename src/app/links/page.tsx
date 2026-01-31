'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Link } from '@/types/hq';
import {
  Link2,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Github,
  Server,
  Palette,
  BookOpen,
  Package,
  Globe,
  Shield,
  FolderOpen,
  X,
  Save,
} from 'lucide-react';

const LINKS_STORAGE_KEY = 'hq_links';

const loadInitialLinks = async (): Promise<Link[]> => {
  const hqData = await import('../../../data/hq-data.json');
  return hqData.links as Link[];
};

export default function LinksPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const loadLinks = async () => {
      const stored = localStorage.getItem(LINKS_STORAGE_KEY);
      if (stored) {
        setLinks(JSON.parse(stored));
      } else {
        const initial = await loadInitialLinks();
        setLinks(initial);
        localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(initial));
      }
    };
    loadLinks();
  }, []);

  useEffect(() => {
    if (links.length > 0) {
      localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(links));
    }
  }, [links]);

  const categories = Array.from(new Set(links.map(l => l.category)));

  const filteredLinks = useMemo(() => {
    return links.filter(link => {
      if (categoryFilter !== 'all' && link.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return link.title.toLowerCase().includes(q) ||
          link.notes?.toLowerCase().includes(q) ||
          link.url.toLowerCase().includes(q);
      }
      return true;
    });
  }, [links, categoryFilter, search]);

  const groupedLinks = useMemo(() => {
    const groups: Record<string, Link[]> = {};
    filteredLinks.forEach(link => {
      if (!groups[link.category]) groups[link.category] = [];
      groups[link.category].push(link);
    });
    return groups;
  }, [filteredLinks]);

  const categoryIcons: Record<string, typeof Link2> = {
    Repository: Github,
    Infrastructure: Server,
    Design: Palette,
    Documentation: BookOpen,
    Distribution: Package,
    Website: Globe,
  };

  const handleAddLink = (newLink: Omit<Link, 'id' | 'lastUpdated'>) => {
    const id = `LINK-${String(links.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString().split('T')[0];

    const link: Link = {
      ...newLink,
      id,
      lastUpdated: now,
    };

    setLinks(prev => [link, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-status-success/10">
            <Link2 className="w-6 h-6 text-status-success" />
          </div>
          <div>
            <h1 className="page-title">Links & Resources</h1>
            <p className="page-description">Central hub for all project resources</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add Link
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px] max-w-md">
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search links..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input w-44"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-zinc-500">
            <Filter className="w-4 h-4" />
            <span>{filteredLinks.length} links</span>
          </div>
        </div>
      </div>

      {/* Links by Category */}
      {Object.entries(groupedLinks).map(([category, categoryLinks]) => {
        const CategoryIcon = categoryIcons[category] || Link2;
        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-zinc-500" />
              <h2 className="text-lg font-semibold text-zinc-200">{category}</h2>
              <span className="badge badge-neutral">{categoryLinks.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card card-hover p-4 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-dark-bg group-hover:bg-accent/10 transition-colors">
                      <CategoryIcon className="w-5 h-5 text-zinc-400 group-hover:text-accent transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-zinc-200 group-hover:text-accent-light transition-colors truncate">
                          {link.title}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                      {link.notes && (
                        <p className="text-sm text-zinc-500 line-clamp-2 mb-2">{link.notes}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-zinc-600">
                        {link.owner && <span>Owner: {link.owner}</span>}
                        <span>Updated: {link.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        );
      })}

      {filteredLinks.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <Link2 className="empty-state-icon" />
            <p className="empty-state-title">No links found</p>
            <p className="empty-state-description">
              Try adjusting your search or filters
            </p>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="card p-4 border-status-warning/20 bg-status-warning/5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-status-warning/10 flex-shrink-0">
            <Shield className="w-4 h-4 text-status-warning" />
          </div>
          <div>
            <div className="font-medium text-status-warning text-sm mb-1">Security Notice</div>
            <p className="text-sm text-zinc-400">
              Never store credentials, API keys, or secrets in this dashboard.
              Use environment variables and secure secret management for sensitive data.
            </p>
          </div>
        </div>
      </div>

      {/* Add Link Modal */}
      {showAddModal && (
        <AddLinkModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddLink}
          existingCategories={categories}
        />
      )}
    </div>
  );
}

// Add Link Modal Component
function AddLinkModal({
  onClose,
  onSave,
  existingCategories,
}: {
  onClose: () => void;
  onSave: (link: Omit<Link, 'id' | 'lastUpdated'>) => void;
  existingCategories: string[];
}) {
  const [formData, setFormData] = useState({
    title: '',
    url: 'https://',
    category: '',
    type: 'external' as 'external' | 'local',
    owner: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.url.trim() || !formData.category.trim()) {
      alert('Title, URL, and Category are required');
      return;
    }

    onSave({
      title: formData.title,
      url: formData.url,
      category: formData.category,
      type: formData.type,
      owner: formData.owner || undefined,
      notes: formData.notes || undefined,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-status-success/10">
              <Link2 className="w-5 h-5 text-status-success" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">Add New Link</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">
                Title <span className="text-status-error">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                placeholder="e.g., GitHub Repository"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">
                URL <span className="text-status-error">*</span>
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="input font-mono text-sm"
                placeholder="https://github.com/..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">
                  Category <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                  placeholder="e.g., Repository"
                  list="categories"
                  required
                />
                <datalist id="categories">
                  {existingCategories.map(c => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'external' | 'local' })}
                  className="input"
                >
                  <option value="external">External</option>
                  <option value="local">Local</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Owner</label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="input"
                placeholder="e.g., Team Name"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input min-h-[80px] resize-y"
                placeholder="Additional notes about this link..."
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
              Save Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
