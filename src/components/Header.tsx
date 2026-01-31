'use client';

import { useState, useEffect } from 'react';
import { search } from '@/lib/hqData';
import type { Issue, Screenshot, Link } from '@/types/hq';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ type: string; item: Issue | Screenshot | Link }[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = search(searchQuery);
      setSearchResults(results);
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  }, [searchQuery]);

  const handleResultClick = (result: { type: string; item: Issue | Screenshot | Link }) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    // Navigate based on type
    if (result.type === 'issue') {
      window.location.href = `/issues?id=${(result.item as Issue).id}`;
    } else if (result.type === 'screenshot') {
      window.location.href = `/screenshots?id=${(result.item as Screenshot).id}`;
    } else if (result.type === 'link') {
      window.open((result.item as Link).url, '_blank');
    }
  };

  return (
    <header className="h-14 bg-dark-bg border-b border-dark-border flex items-center justify-between px-6">
      <div className="flex-1 max-w-md relative">
        <input
          type="text"
          placeholder="Search issues, screenshots, links..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length >= 2 && setIsSearchOpen(true)}
          onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
          className="input w-full pl-10"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>

        {isSearchOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-dark-card border border-dark-border rounded-lg shadow-lg overflow-hidden z-50">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => handleResultClick(result)}
                className="w-full px-4 py-3 text-left hover:bg-dark-hover flex items-center gap-3 border-b border-dark-border last:border-b-0"
              >
                <span className="text-xs uppercase text-accent bg-accent/10 px-2 py-0.5 rounded">
                  {result.type}
                </span>
                <span className="text-sm text-gray-200">
                  {'title' in result.item ? result.item.title : 'name' in result.item ? result.item.name : ''}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-500">
          Build #24 • iOS TestFlight
        </span>
        <a
          href="https://github.com/sefacetinn/turing-project-hq"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
