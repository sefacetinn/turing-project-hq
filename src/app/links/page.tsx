'use client';

import { useState, useMemo } from 'react';
import hqData from '../../../data/hq-data.json';
import type { Link } from '@/types/hq';

export default function LinksPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const links = hqData.links as Link[];
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

  // Group by category
  const groupedLinks = useMemo(() => {
    const groups: Record<string, Link[]> = {};
    filteredLinks.forEach(link => {
      if (!groups[link.category]) groups[link.category] = [];
      groups[link.category].push(link);
    });
    return groups;
  }, [filteredLinks]);

  const categoryIcons: Record<string, string> = {
    Repository: '🐙',
    Infrastructure: '🏗️',
    Design: '🎨',
    Documentation: '📚',
    Distribution: '📦',
    Website: '🌐',
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Links & Resources</h1>
          <p className="text-gray-400 mt-1">Central hub for all project resources</p>
        </div>
        <button className="btn btn-primary">+ Add Link</button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search links..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input w-40"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto text-sm text-gray-400">
            {filteredLinks.length} links
          </div>
        </div>
      </div>

      {/* Links by Category */}
      {Object.entries(groupedLinks).map(([category, categoryLinks]) => (
        <div key={category} className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>{categoryIcons[category] || '🔗'}</span>
            {category}
            <span className="text-sm font-normal text-gray-500">({categoryLinks.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-4 hover:border-accent transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium group-hover:text-accent transition-colors">
                      {link.title}
                    </div>
                    {link.notes && (
                      <p className="text-sm text-gray-400 mt-1">{link.notes}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {link.owner && <span>Owner: {link.owner}</span>}
                      <span>Updated: {link.lastUpdated}</span>
                    </div>
                  </div>
                  <span className="text-gray-500 group-hover:text-accent">↗</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}

      {filteredLinks.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🔗</div>
          <p className="text-gray-400">No links match your search</p>
        </div>
      )}

      {/* Credentials Notice */}
      <div className="card p-4 mt-6 bg-yellow-500/10 border-yellow-500/30">
        <div className="flex items-start gap-3">
          <span className="text-xl">🔐</span>
          <div>
            <div className="font-medium text-yellow-400">Security Notice</div>
            <p className="text-sm text-gray-400 mt-1">
              Never store credentials, API keys, or secrets in this dashboard.
              Use environment variables and secure secret management for sensitive data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
