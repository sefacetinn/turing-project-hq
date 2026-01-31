interface Activity {
  id: string;
  type: string;
  action: string;
  description: string;
  timestamp: string;
}

interface RecentActivityProps {
  activities: Activity[];
  changes: string[];
}

export function RecentActivity({ activities, changes }: RecentActivityProps) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Changes</h3>
        <ul className="space-y-2">
          {changes.slice(0, 5).map((change, idx) => (
            <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
              <span className="text-accent">•</span>
              {change}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Activity Log</h3>
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="text-sm border-l-2 border-dark-border pl-3 py-1">
              <div className="font-medium">{activity.action}</div>
              <div className="text-gray-500 text-xs">
                {new Date(activity.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
