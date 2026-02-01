'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  FolderTree,
  Link as LinkIcon,
  ExternalLink,
  Database,
  Cpu,
  Rocket,
  GitBranch,
  Clock,
  ChevronRight,
  RefreshCw,
  Store,
  Code,
  Server,
  Smartphone
} from 'lucide-react';
import { getMergedData } from '@/lib/hqData';
import { HQData } from '@/types/hq';

export default function MobileMorePage() {
  const [data, setData] = useState<HQData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const hqData = getMergedData();
    setData(hqData);
    setLoading(false);
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  const menuItems = [
    {
      id: 'marketplace',
      title: 'Marketplace',
      description: `${data.marketplaceCategories.length} categories`,
      icon: Store,
      color: 'text-accent-light',
      bgColor: 'bg-accent/15',
    },
    {
      id: 'architecture',
      title: 'Architecture',
      description: 'System overview',
      icon: Cpu,
      color: 'text-status-info',
      bgColor: 'bg-status-info/15',
    },
    {
      id: 'links',
      title: 'Links & Resources',
      description: `${data.links.length} links`,
      icon: LinkIcon,
      color: 'text-status-success',
      bgColor: 'bg-status-success/15',
    },
    {
      id: 'builds',
      title: 'Builds',
      description: `${data.builds.length} builds`,
      icon: Rocket,
      color: 'text-status-warning',
      bgColor: 'bg-status-warning/15',
    },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'marketplace':
        return (
          <div className="space-y-3">
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-1 text-accent-light text-sm mb-4"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back
            </button>
            <h2 className="text-lg font-semibold text-zinc-100">Marketplace Categories</h2>
            <div className="space-y-2">
              {data.marketplaceCategories.map((category) => (
                <div key={category.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{category.name}</p>
                      {category.subcategories && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {category.subcategories.length} subcategories
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-zinc-100">{category.newCount ?? category.legacyCount}</p>
                      <p className="text-xs text-zinc-500">providers</p>
                    </div>
                  </div>
                  {category.missingIds && category.missingIds.length > 0 && (
                    <div className="mt-2 px-2 py-1 bg-status-warning/10 rounded text-xs text-status-warning">
                      {category.missingIds.length} missing
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'architecture':
        return (
          <div className="space-y-4">
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-1 text-accent-light text-sm mb-4"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back
            </button>
            <h2 className="text-lg font-semibold text-zinc-100">Architecture</h2>

            {/* Overview */}
            <div className="card p-4">
              <p className="text-sm text-zinc-300 leading-relaxed">
                {data.architecture.overview}
              </p>
            </div>

            {/* Tech Stack */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Stack</h3>
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-accent">
                  <Smartphone className="w-3 h-3 mr-1" />
                  React Native
                </span>
                <span className="badge badge-accent">
                  <Code className="w-3 h-3 mr-1" />
                  Expo
                </span>
                <span className="badge badge-accent">
                  <Database className="w-3 h-3 mr-1" />
                  Firebase
                </span>
                <span className="badge badge-accent">
                  <Server className="w-3 h-3 mr-1" />
                  Next.js
                </span>
              </div>
            </div>

            {/* Directory Structure */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                Directories
              </h3>
              <div className="card divide-y divide-dark-border/30">
                {data.architecture.directories.map((dir, index) => (
                  <div key={index} className="px-4 py-3">
                    <code className="text-xs text-accent-light font-mono">{dir.path}</code>
                    <p className="text-xs text-zinc-500 mt-1">{dir.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Firebase Collections */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                Firebase Collections
              </h3>
              <div className="card divide-y divide-dark-border/30">
                {data.architecture.firebaseCollections.map((collection, index) => (
                  <div key={index} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-status-warning" />
                      <code className="text-xs text-zinc-100 font-mono">{collection.name}</code>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{collection.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'links':
        const groupedLinks = data.links.reduce((acc, link) => {
          const cat = link.category || 'Other';
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(link);
          return acc;
        }, {} as Record<string, typeof data.links>);

        return (
          <div className="space-y-4">
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-1 text-accent-light text-sm mb-4"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back
            </button>
            <h2 className="text-lg font-semibold text-zinc-100">Links & Resources</h2>

            {Object.entries(groupedLinks).map(([category, links]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  {category}
                </h3>
                <div className="card divide-y divide-dark-border/30">
                  {links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 flex items-center gap-3 active:bg-dark-hover transition-colors"
                    >
                      <LinkIcon className="w-4 h-4 text-zinc-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200">{link.title}</p>
                        {link.notes && (
                          <p className="text-xs text-zinc-500 truncate">{link.notes}</p>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-zinc-600" />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'builds':
        return (
          <div className="space-y-4">
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-1 text-accent-light text-sm mb-4"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back
            </button>
            <h2 className="text-lg font-semibold text-zinc-100">Builds</h2>

            <div className="space-y-3">
              {data.builds.map((build) => (
                <div key={build.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-100">
                          Build #{build.buildNumber}
                        </span>
                        <span className={`badge badge-sm ${
                          build.status === 'available'
                            ? 'badge-success'
                            : build.status === 'submitted'
                            ? 'badge-info'
                            : 'badge-neutral'
                        }`}>
                          {build.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        v{build.version} • {build.channel}
                      </p>
                    </div>
                    <span className={`badge badge-sm ${
                      build.platform === 'iOS' ? 'bg-zinc-800 text-white' : 'bg-green-600/20 text-green-400'
                    }`}>
                      {build.platform}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(build.date).toLocaleDateString('tr-TR')}
                    </div>
                    {build.gitBranch && (
                      <div className="flex items-center gap-1">
                        <GitBranch className="w-3.5 h-3.5" />
                        {build.gitBranch}
                      </div>
                    )}
                  </div>

                  {build.notes && (
                    <p className="text-xs text-zinc-400 mt-2">{build.notes}</p>
                  )}

                  {build.knownIssueIds && build.knownIssueIds.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-dark-border/30">
                      <p className="text-xs text-status-warning">
                        {build.knownIssueIds.length} known issue(s)
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (activeSection) {
    return (
      <div className="px-4 py-5">
        {renderSection()}
      </div>
    );
  }

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Navigation Hub */}
      <div className="space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className="card p-4 w-full flex items-center gap-4 active:bg-dark-hover transition-colors"
          >
            <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-zinc-100">{item.title}</p>
              <p className="text-xs text-zinc-500">{item.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600" />
          </button>
        ))}
      </div>

      {/* Quick Links */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Quick Links
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {data.quickLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-3 flex items-center gap-2 active:bg-dark-hover transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-medium text-zinc-300 truncate">{link.title}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Activity Log */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Recent Activity
        </h2>
        <div className="card divide-y divide-dark-border/30">
          {data.activityLog.slice(0, 5).map((activity) => (
            <div key={activity.id} className="px-4 py-3">
              <p className="text-sm text-zinc-300">{activity.action}</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-zinc-600" />
                <span className="text-xs text-zinc-500">
                  {new Date(activity.timestamp).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Info */}
      <div className="card p-4 bg-dark-elevated/50">
        <div className="text-center">
          <p className="text-xs text-zinc-500">Project HQ Mobile</p>
          <p className="text-xs text-zinc-600 mt-1">v{data.meta.version}</p>
        </div>
      </div>
    </div>
  );
}
