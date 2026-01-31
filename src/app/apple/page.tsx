import hqData from '../../../data/hq-data.json';
import {
  Apple,
  PlayCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  AlertTriangle,
  FileCheck,
  Lock,
} from 'lucide-react';

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
      case 'done':
        return <CheckCircle2 className="w-5 h-5 text-status-success" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-status-warning" />;
      case 'blocked':
        return <XCircle className="w-5 h-5 text-status-error" />;
      default:
        return <div className="w-5 h-5 rounded border-2 border-zinc-600" />;
    }
  };

  const decisions = hqData.decisions.filter(d =>
    d.category === 'Apple Compliance' || d.category === 'Privacy'
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-zinc-500/10">
          <Apple className="w-6 h-6 text-zinc-300" />
        </div>
        <div>
          <h1 className="page-title">App Store Compliance</h1>
          <p className="page-description">Submission checklists and requirements</p>
        </div>
      </div>

      {/* Store Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Apple App Store */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-500/10">
                <Apple className="w-5 h-5 text-zinc-300" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-200">Apple App Store</h2>
            </div>
            <span className="badge badge-warning">{apple.appStoreStatus}</span>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="w-4 h-4 text-zinc-500" />
              <h3 className="text-sm font-medium text-zinc-400">Submission Checklist</h3>
            </div>
            <div className="space-y-2">
              {apple.checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-dark-bg/50 hover:bg-dark-hover/50 transition-colors"
                >
                  {statusIcon(item.status)}
                  <div className="flex-1">
                    <div className="text-sm text-zinc-300">{item.item}</div>
                    {item.notes && (
                      <div className="text-xs text-zinc-500 mt-1">{item.notes}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-zinc-500" />
              <h3 className="text-sm font-medium text-zinc-400">Privacy Nutrition Labels</h3>
            </div>
            <div className="space-y-2">
              {apple.privacyNutritionLabels.map((label, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg text-sm"
                >
                  <span className="text-zinc-300">{label.category}</span>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className={label.collected ? 'text-status-success' : 'text-zinc-600'}>
                      {label.collected ? '✓ Collected' : '✗ Not collected'}
                    </span>
                    <span>{label.purpose}</span>
                    <span className={label.linked ? 'text-status-warning' : 'text-zinc-600'}>
                      {label.linked ? 'Linked' : 'Not linked'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Google Play */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-success/10">
                <PlayCircle className="w-5 h-5 text-status-success" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-200">Google Play Store</h2>
            </div>
            <span className="badge badge-warning">{googlePlay.playStoreStatus}</span>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="w-4 h-4 text-zinc-500" />
              <h3 className="text-sm font-medium text-zinc-400">Submission Checklist</h3>
            </div>
            <div className="space-y-2">
              {googlePlay.checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-dark-bg/50 hover:bg-dark-hover/50 transition-colors"
                >
                  {statusIcon(item.status)}
                  <div className="flex-1">
                    <div className="text-sm text-zinc-300">{item.item}</div>
                    {item.notes && (
                      <div className="text-xs text-zinc-500 mt-1">{item.notes}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-zinc-500" />
              <h3 className="text-sm font-medium text-zinc-400">Data Safety Form</h3>
            </div>
            <div className="bg-dark-bg/50 rounded-lg p-4 text-sm space-y-4">
              <div>
                <span className="text-zinc-500 block mb-2">Data Collected</span>
                <div className="flex flex-wrap gap-2">
                  {googlePlay.dataSafetyForm.dataCollected.map((d, i) => (
                    <span key={i} className="badge badge-neutral">{d}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">Data Shared</span>
                <span className="text-zinc-300">
                  {googlePlay.dataSafetyForm.dataShared.join(', ') || 'None'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-2">Security Practices</span>
                <ul className="space-y-1">
                  {googlePlay.dataSafetyForm.securityPractices.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-zinc-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-status-success flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Decisions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-zinc-200 mb-5">Key Decisions</h2>
        <div className="space-y-4">
          {decisions.map((decision) => (
            <div key={decision.id} className="flex gap-4 p-4 bg-dark-bg/30 rounded-lg">
              <div className="w-1 bg-accent rounded-full flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-medium text-zinc-200">{decision.title}</span>
                  <span className={`badge ${decision.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                    {decision.status}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mb-2">{decision.description}</p>
                <div className="text-xs text-zinc-500">{decision.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rejections */}
      {typedRejections.length > 0 ? (
        <div className="card p-6 border-status-error/20">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-status-error" />
            <h2 className="text-lg font-semibold text-status-error">Rejection History</h2>
          </div>
          <div className="space-y-4">
            {typedRejections.map((r, idx) => (
              <div key={idx} className="p-4 bg-status-error/5 border border-status-error/10 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <span className="badge badge-error">{r.store}</span>
                  <span className="text-sm text-zinc-500">{r.date}</span>
                  <span className={`badge ${r.status === 'Fixed' ? 'badge-success' : 'badge-warning'}`}>
                    {r.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-zinc-500">Reason:</span> <span className="text-zinc-300">{r.reason}</span></p>
                  <p><span className="text-zinc-500">Fix:</span> <span className="text-zinc-400">{r.fix}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-status-success" />
            <h2 className="text-lg font-semibold text-zinc-200">Rejection History</h2>
          </div>
          <p className="text-sm text-zinc-500">No rejections recorded. Great job!</p>
        </div>
      )}
    </div>
  );
}
