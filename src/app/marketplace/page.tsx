'use client';

import hqData from '../../../data/hq-data.json';
import type { MarketplaceCategory } from '@/types/hq';

export default function MarketplacePage() {
  const categories = hqData.marketplaceCategories as MarketplaceCategory[];

  const totalLegacy = categories.reduce((sum, c) => sum + (c.legacyCount || 0), 0);
  const totalNew = categories.reduce((sum, c) => sum + (c.newCount || 0), 0);
  const hasMismatches = categories.some(c => c.missingIds && c.missingIds.length > 0);

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Marketplace Debug</h1>
        <p className="text-gray-400 mt-1">Category data comparison and provider counts</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Categories</div>
          <div className="text-2xl font-bold">{categories.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Total Providers (Legacy)</div>
          <div className="text-2xl font-bold">{totalLegacy}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Total Providers (New)</div>
          <div className="text-2xl font-bold text-accent">{totalNew}</div>
        </div>
      </div>

      {/* Mismatch Alert */}
      {hasMismatches && (
        <div className="card p-4 mb-6 bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <div className="font-medium text-yellow-400">Data Mismatch Detected</div>
              <p className="text-sm text-gray-400">Some categories have missing or extra providers</p>
            </div>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="card overflow-hidden mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-bg border-b border-dark-border">
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Category</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Slug</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Legacy</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">New</th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Issues</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const diff = (cat.newCount || 0) - (cat.legacyCount || 0);
              const hasMissing = cat.missingIds && cat.missingIds.length > 0;
              const hasExtra = cat.extraIds && cat.extraIds.length > 0;

              return (
                <tr key={cat.id} className="border-b border-dark-border hover:bg-dark-hover">
                  <td className="px-4 py-3">
                    <div className="font-medium">{cat.name}</div>
                    {cat.subcategories && (
                      <div className="text-xs text-gray-500 mt-1">
                        {cat.subcategories.length} subcategories
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-sm text-gray-400">{cat.slug}</code>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{cat.legacyCount || 0}</td>
                  <td className="px-4 py-3 text-right font-mono">{cat.newCount || 0}</td>
                  <td className="px-4 py-3 text-center">
                    {diff === 0 ? (
                      <span className="badge badge-success">Match</span>
                    ) : diff > 0 ? (
                      <span className="badge badge-info">+{diff}</span>
                    ) : (
                      <span className="badge badge-warning">{diff}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {hasMissing && (
                      <span className="badge badge-error mr-1">
                        {cat.missingIds!.length} missing
                      </span>
                    )}
                    {hasExtra && (
                      <span className="badge badge-info">
                        {cat.extraIds!.length} extra
                      </span>
                    )}
                    {!hasMissing && !hasExtra && (
                      <span className="text-gray-500 text-sm">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Subcategories Detail */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Subcategories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.filter(c => c.subcategories && c.subcategories.length > 0).map((cat) => (
            <div key={cat.id} className="bg-dark-bg rounded-lg p-4">
              <div className="font-medium mb-3">{cat.name}</div>
              <div className="space-y-2">
                {cat.subcategories!.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between text-sm">
                    <span>{sub.name}</span>
                    <code className="text-xs text-gray-500">{sub.slug}</code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Firestore Adapter Info */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Firestore Integration</h2>
        <div className="bg-dark-bg rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-4">
            This page uses static JSON data. To enable live Firestore data:
          </p>
          <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
            <li>Add Firebase credentials to environment variables</li>
            <li>Create adapter in <code className="text-accent">src/lib/firestore.ts</code></li>
            <li>Replace JSON imports with Firestore queries</li>
            <li>Enable real-time listeners for live updates</li>
          </ol>
          <div className="mt-4 p-3 bg-dark-card rounded-lg">
            <code className="text-xs text-gray-400">
              {`// Example adapter interface
interface MarketplaceAdapter {
  getCategories(): Promise<MarketplaceCategory[]>;
  getProviderCount(categoryId: string): Promise<number>;
  syncData(): Promise<void>;
}`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
