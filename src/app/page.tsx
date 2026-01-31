import hqData from '../../data/hq-data.json';
import { KPICards } from '@/components/KPICards';
import { QuickLinks } from '@/components/QuickLinks';
import { RecentActivity } from '@/components/RecentActivity';
import {
  Rocket,
  Target,
  Calendar,
  CheckCircle2,
  Smartphone,
  Apple,
  PlayCircle,
} from 'lucide-react';

export default function OverviewPage() {
  const sprint = hqData.sprints[0];
  const latestBuilds = hqData.builds;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-accent/10">
            <Rocket className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="page-title">Project Overview</h1>
            <p className="page-description">Welcome back! Here&apos;s your project status.</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Links + Sprint */}
        <div className="lg:col-span-2 space-y-6">
          <QuickLinks />

          {/* Current Sprint */}
          {sprint && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Target className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-300">{sprint.name}</h3>
                    <p className="text-xs text-zinc-500">Current Sprint</p>
                  </div>
                </div>
                <span className="badge badge-accent">{sprint.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="p-3 bg-dark-bg/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-xs text-zinc-500">Start Date</span>
                  </div>
                  <span className="text-sm font-medium text-zinc-300">{sprint.startDate}</span>
                </div>
                <div className="p-3 bg-dark-bg/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-xs text-zinc-500">End Date</span>
                  </div>
                  <span className="text-sm font-medium text-zinc-300">{sprint.endDate}</span>
                </div>
              </div>

              {sprint.goal && (
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Sprint Goal</p>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-dark-bg/30">
                    <CheckCircle2 className="w-4 h-4 text-status-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-zinc-300">{sprint.goal}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Activity + Builds */}
        <div className="space-y-6">
          <RecentActivity />

          {/* Latest Builds */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-300">Latest Builds</h3>
              <Smartphone className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="space-y-3">
              {latestBuilds.map((build) => (
                <div
                  key={build.id}
                  className="p-3 bg-dark-bg/50 rounded-lg hover:bg-dark-hover/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {build.platform === 'iOS' ? (
                        <Apple className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <PlayCircle className="w-4 h-4 text-status-success" />
                      )}
                      <span className="text-sm font-medium text-zinc-300">
                        {build.platform}
                      </span>
                      <span className="text-xs text-zinc-500">v{build.version}</span>
                    </div>
                    <span className={`badge badge-sm ${
                      build.status === 'available' ? 'badge-success' :
                      build.status === 'testing' ? 'badge-warning' :
                      'badge-info'
                    }`}>
                      {build.channel}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>Build #{build.buildNumber}</span>
                    <span>{build.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
