'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import hqData from '../../data/hq-data.json';
import {
  Search,
  Command,
  ExternalLink,
  Github,
  Smartphone,
  Bug,
  Image,
  Link2,
  X,
} from 'lucide-react';
import type { Issue, Screenshot, Link as LinkType } from '@/types/hq';

type SearchResult = {
  type: 'issue' | 'screenshot' | 'link';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

export function Header() {
  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const issues = hqData.issues as Issue[];
  const screenshots = hqData.screenshots as Screenshot[];
  const links = hqData.links as LinkType[];

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        setSearch('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();

    const issueResults: SearchResult[] = issues
      .filter(i => i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q))
      .slice(0, 3)
      .map(i => ({
        type: 'issue',
        id: i.id,
        title: i.title,
        subtitle: `${i.priority} • ${i.status}`,
        href: `/issues?id=${i.id}`,
      }));

    const screenshotResults: SearchResult[] = screenshots
      .filter(s => s.name.toLowerCase().includes(q) || s.feature.toLowerCase().includes(q))
      .slice(0, 2)
      .map(s => ({
        type: 'screenshot',
        id: s.id,
        title: s.name,
        subtitle: s.feature,
        href: `/screenshots?id=${s.id}`,
      }));

    const linkResults: SearchResult[] = links
      .filter(l => l.title.toLowerCase().includes(q) || l.category.toLowerCase().includes(q))
      .slice(0, 2)
      .map(l => ({
        type: 'link',
        id: l.id,
        title: l.title,
        subtitle: l.category,
        href: l.url,
      }));

    return [...issueResults, ...screenshotResults, ...linkResults];
  }, [search, issues, screenshots, links]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'issue':
        return <Bug className="w-4 h-4 text-status-error" />;
      case 'screenshot':
        return <Image className="w-4 h-4 text-status-info" />;
      case 'link':
        return <Link2 className="w-4 h-4 text-accent" />;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-dark-bg/80 backdrop-blur-xl border-b border-dark-border/50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <div className={`relative transition-all duration-200 ${isFocused ? 'scale-[1.02]' : ''}`}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search issues, screenshots, links..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="w-full h-10 pl-11 pr-20 bg-dark-elevated/50 border border-dark-border/50 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-accent/50 focus:bg-dark-elevated transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="p-1 hover:bg-dark-hover rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              )}
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-dark-bg border border-dark-border rounded text-2xs text-zinc-500 font-mono">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </div>
          </div>

          {/* Search Results Dropdown */}
          {isFocused && searchResults.length > 0 && (
            <div className="dropdown max-h-80 overflow-y-auto">
              {searchResults.map((result, idx) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.href}
                  target={result.type === 'link' ? '_blank' : undefined}
                  className="dropdown-item group"
                  onClick={() => setSearch('')}
                >
                  <div className="flex-shrink-0">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate group-hover:text-accent-light transition-colors">
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div className="text-xs text-zinc-500 truncate">{result.subtitle}</div>
                    )}
                  </div>
                  {result.type === 'link' && (
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* No Results */}
          {isFocused && search && searchResults.length === 0 && (
            <div className="dropdown py-8 text-center">
              <Search className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No results for &quot;{search}&quot;</p>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 ml-6">
          {/* Build Status */}
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-dark-elevated/50 border border-dark-border/50 rounded-xl">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-300">Build #24</span>
            </div>
            <div className="w-px h-4 bg-dark-border" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              <span className="text-xs text-zinc-500">TestFlight</span>
            </div>
          </div>

          {/* GitHub */}
          <a
            href="https://github.com/sefacetinn/turing-project-hq"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-icon"
            title="GitHub Repository"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </header>
  );
}
