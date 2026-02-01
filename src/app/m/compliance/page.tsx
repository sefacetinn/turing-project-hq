'use client';

import { useState, useEffect } from 'react';
import {
  Apple,
  Play,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  FileText,
  MapPin,
  Eye,
  Bell,
  Camera,
  RefreshCw
} from 'lucide-react';
import { getMergedData } from '@/lib/hqData';
import { HQData, ChecklistItem, ChecklistStatus } from '@/types/hq';

const statusConfig: Record<ChecklistStatus, { icon: typeof Circle; color: string; bgColor: string }> = {
  'pending': { icon: Circle, color: 'text-zinc-500', bgColor: 'bg-zinc-500/15' },
  'in-progress': { icon: Clock, color: 'text-status-warning', bgColor: 'bg-status-warning/15' },
  'done': { icon: CheckCircle2, color: 'text-status-success', bgColor: 'bg-status-success/15' },
  'blocked': { icon: AlertTriangle, color: 'text-status-error', bgColor: 'bg-status-error/15' },
};

interface AccordionSectionProps {
  title: string;
  icon: typeof Apple;
  iconColor: string;
  items: ChecklistItem[];
  defaultOpen?: boolean;
}

function AccordionSection({ title, icon: Icon, iconColor, items, defaultOpen = false }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const doneCount = items.filter(i => i.status === 'done').length;
  const progress = Math.round((doneCount / items.length) * 100);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-4 flex items-center gap-3 active:bg-dark-hover transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-zinc-100">{title}</p>
          <p className="text-xs text-zinc-500">{doneCount}/{items.length} completed</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${progress === 100 ? 'text-status-success' : 'text-zinc-400'}`}>
            {progress}%
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-dark-border/30">
          {items.map((item) => {
            const status = statusConfig[item.status];
            const StatusIcon = status.icon;

            return (
              <div
                key={item.id}
                className="px-4 py-3 flex items-start gap-3 border-b border-dark-border/20 last:border-b-0"
              >
                <div className={`w-6 h-6 rounded-full ${status.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${item.status === 'done' ? 'text-zinc-500' : 'text-zinc-300'}`}>
                    {item.item}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-zinc-600 mt-1">{item.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MobileCompliancePage() {
  const [data, setData] = useState<HQData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const { apple, googlePlay } = data.compliance;

  // Calculate overall progress
  const totalItems = apple.checklist.length + googlePlay.checklist.length;
  const doneItems = apple.checklist.filter(i => i.status === 'done').length +
    googlePlay.checklist.filter(i => i.status === 'done').length;
  const overallProgress = Math.round((doneItems / totalItems) * 100);

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Overall Progress */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Overall Progress
          </h2>
          <span className={`text-lg font-bold ${overallProgress === 100 ? 'text-status-success' : 'text-zinc-100'}`}>
            {overallProgress}%
          </span>
        </div>
        <div className="h-2 bg-dark-elevated rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${overallProgress === 100 ? 'bg-status-success' : 'bg-accent'}`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          {doneItems} of {totalItems} items completed
        </p>
      </div>

      {/* Key Compliance Info */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Key Info
        </h2>
        <div className="card divide-y divide-dark-border/30">
          <div className="px-4 py-3 flex items-center gap-3">
            <Shield className="w-4 h-4 text-status-success" />
            <span className="text-sm text-zinc-300 flex-1">Privacy Policy</span>
            <CheckCircle2 className="w-4 h-4 text-status-success" />
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <FileText className="w-4 h-4 text-status-success" />
            <span className="text-sm text-zinc-300 flex-1">Terms of Service</span>
            <CheckCircle2 className="w-4 h-4 text-status-success" />
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <MapPin className="w-4 h-4 text-status-success" />
            <span className="text-sm text-zinc-300 flex-1">Location: While-in-use</span>
            <CheckCircle2 className="w-4 h-4 text-status-success" />
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <Eye className="w-4 h-4 text-status-success" />
            <span className="text-sm text-zinc-300 flex-1">Tracking: None</span>
            <CheckCircle2 className="w-4 h-4 text-status-success" />
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <Bell className="w-4 h-4 text-status-success" />
            <span className="text-sm text-zinc-300 flex-1">Push Notifications</span>
            <CheckCircle2 className="w-4 h-4 text-status-success" />
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <Camera className="w-4 h-4 text-status-success" />
            <span className="text-sm text-zinc-300 flex-1">Camera Permission</span>
            <CheckCircle2 className="w-4 h-4 text-status-success" />
          </div>
        </div>
      </div>

      {/* Store Checklists */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Store Checklists
        </h2>

        <AccordionSection
          title="App Store (Apple)"
          icon={Apple}
          iconColor="bg-zinc-800"
          items={apple.checklist}
          defaultOpen={true}
        />

        <AccordionSection
          title="Google Play"
          icon={Play}
          iconColor="bg-green-600"
          items={googlePlay.checklist}
        />
      </div>

      {/* Privacy Labels */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Data Collected
        </h2>
        <div className="card p-4">
          <div className="flex flex-wrap gap-2">
            {apple.privacyNutritionLabels.map((label, index) => (
              <span
                key={index}
                className={`px-3 py-1.5 text-xs rounded-lg ${
                  label.linked
                    ? 'bg-status-info/15 text-status-info border border-status-info/20'
                    : 'bg-dark-elevated text-zinc-400'
                }`}
              >
                {label.category}
              </span>
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-3">
            * Highlighted items are linked to user identity
          </p>
        </div>
      </div>

      {/* Rejections */}
      {data.compliance.rejections.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Past Rejections
          </h2>
          <div className="card p-4 bg-status-error/5 border-status-error/20">
            <p className="text-sm text-zinc-300">
              {data.compliance.rejections.length} previous rejection(s)
            </p>
          </div>
        </div>
      )}

      {data.compliance.rejections.length === 0 && (
        <div className="card p-4 bg-status-success/5 border-status-success/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-status-success" />
            <p className="text-sm text-zinc-300">No rejections recorded</p>
          </div>
        </div>
      )}
    </div>
  );
}
