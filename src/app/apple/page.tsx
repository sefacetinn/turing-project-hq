import hqData from '../../../data/hq-data.json';

interface Rejection {
  date: string;
  store: 'Apple' | 'Google';
  reason: string;
  fix: string;
  status: 'Pending' | 'Fixed';
}

export default function ApplePage() {
  const { apple, googlePlay, rejections } = hqData.compliance;
  const typedRejections = rejections as Rejection[];

  const statusIcon = (status: string) => {
    switch (status) {
      case 'done': return '✅';
      case 'in-progress': return '🔄';
      case 'blocked': return '🚫';
      default: return '⬜';
    }
  };

  const decisions = hqData.decisions.filter(d =>
    d.category === 'Apple Compliance' || d.category === 'Privacy'
  );

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Apple & Store Compliance</h1>
        <p className="text-gray-400 mt-1">App Store submission checklist and requirements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Apple App Store */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              🍎 Apple App Store
            </h2>
            <span className="badge badge-warning">{apple.appStoreStatus}</span>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Submission Checklist</h3>
            <div className="space-y-2">
              {apple.checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-dark-hover"
                >
                  <span className="text-lg">{statusIcon(item.status)}</span>
                  <div className="flex-1">
                    <div className="text-sm">{item.item}</div>
                    {item.notes && (
                      <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Privacy Nutrition Labels</h3>
            <div className="space-y-2">
              {apple.privacyNutritionLabels.map((label, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-dark-bg rounded-lg text-sm"
                >
                  <span>{label.category}</span>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{label.collected ? '✓ Collected' : '✗ Not collected'}</span>
                    <span>{label.purpose}</span>
                    <span>{label.linked ? 'Linked' : 'Not linked'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Google Play */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              🤖 Google Play Store
            </h2>
            <span className="badge badge-warning">{googlePlay.playStoreStatus}</span>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Submission Checklist</h3>
            <div className="space-y-2">
              {googlePlay.checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-dark-hover"
                >
                  <span className="text-lg">{statusIcon(item.status)}</span>
                  <div className="flex-1">
                    <div className="text-sm">{item.item}</div>
                    {item.notes && (
                      <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Data Safety Form</h3>
            <div className="bg-dark-bg rounded-lg p-4 text-sm">
              <div className="mb-3">
                <span className="text-gray-400">Data Collected:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {googlePlay.dataSafetyForm.dataCollected.map((d, i) => (
                    <span key={i} className="badge badge-neutral">{d}</span>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <span className="text-gray-400">Data Shared:</span>
                <span className="ml-2">{googlePlay.dataSafetyForm.dataShared.join(', ') || 'None'}</span>
              </div>
              <div>
                <span className="text-gray-400">Security Practices:</span>
                <ul className="mt-1 list-disc list-inside text-gray-300">
                  {googlePlay.dataSafetyForm.securityPractices.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decisions */}
      <div className="card p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Key Decisions</h2>
        <div className="space-y-4">
          {decisions.map((decision) => (
            <div key={decision.id} className="border-l-2 border-accent pl-4 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{decision.title}</span>
                <span className={`badge ${decision.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                  {decision.status}
                </span>
              </div>
              <p className="text-sm text-gray-400">{decision.description}</p>
              <div className="text-xs text-gray-500 mt-1">{decision.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rejections */}
      {typedRejections.length > 0 && (
        <div className="card p-6 mt-6 border-red-500/30">
          <h2 className="text-lg font-semibold mb-4 text-red-400">Rejection History</h2>
          <div className="space-y-3">
            {typedRejections.map((r, idx) => (
              <div key={idx} className="bg-red-500/10 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="badge badge-error">{r.store}</span>
                  <span className="text-sm text-gray-400">{r.date}</span>
                  <span className={`badge ${r.status === 'Fixed' ? 'badge-success' : 'badge-warning'}`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-sm mb-2"><strong>Reason:</strong> {r.reason}</p>
                <p className="text-sm text-gray-400"><strong>Fix:</strong> {r.fix}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {typedRejections.length === 0 && (
        <div className="card p-6 mt-6">
          <h2 className="text-lg font-semibold mb-2">Rejection History</h2>
          <p className="text-gray-500 text-sm">No rejections recorded yet.</p>
        </div>
      )}
    </div>
  );
}
