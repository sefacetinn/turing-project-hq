import { KPICards } from '@/components/KPICards';
import { QuickLinks } from '@/components/QuickLinks';
import { RecentActivity } from '@/components/RecentActivity';
import hqData from '../../data/hq-data.json';

export default function OverviewPage() {
  const stats = {
    total: hqData.issues.length,
    backlog: hqData.issues.filter(i => i.status === 'backlog').length,
    inProgress: hqData.issues.filter(i => i.status === 'in-progress').length,
    done: hqData.issues.filter(i => i.status === 'done').length,
    p0Count: hqData.issues.filter(i => i.priority === 'P0').length,
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-gray-400 mt-1">{hqData.meta.description}</p>
      </div>

      <KPICards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <QuickLinks links={hqData.quickLinks} />
        <RecentActivity activities={hqData.activityLog} changes={hqData.recentChanges} />
      </div>

      <div className="mt-6 card p-6">
        <h2 className="text-lg font-semibold mb-4">Current Sprint</h2>
        {hqData.sprints.filter(s => s.status === 'active').map(sprint => (
          <div key={sprint.id}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{sprint.name}</span>
              <span className="badge badge-info">{sprint.status}</span>
            </div>
            <p className="text-sm text-gray-400 mb-3">{sprint.goal}</p>
            <div className="text-xs text-gray-500">
              {sprint.startDate} → {sprint.endDate} • {sprint.issueIds.length} issues
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 card p-6">
        <h2 className="text-lg font-semibold mb-4">Latest Builds</h2>
        <div className="space-y-3">
          {hqData.builds.slice(0, 3).map(build => (
            <div key={build.id} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
              <div>
                <span className="font-medium">v{build.version} (#{build.buildNumber})</span>
                <span className="text-sm text-gray-500 ml-3">{build.platform}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{build.date}</span>
                <span className={`badge ${build.status === 'available' ? 'badge-success' : 'badge-warning'}`}>
                  {build.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
