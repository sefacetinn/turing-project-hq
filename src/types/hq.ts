// HQ Data Types

export type IssueStatus = 'backlog' | 'todo' | 'in-progress' | 'done';
export type IssuePriority = 'P0' | 'P1' | 'P2' | 'P3';
export type IssueType = 'Bug' | 'Enhancement' | 'Task';
export type Platform = 'iOS' | 'Android' | 'Web' | 'All';
export type ChecklistStatus = 'pending' | 'in-progress' | 'done' | 'blocked';

export interface Issue {
  id: string;
  title: string;
  type: IssueType;
  severity: 'High' | 'Medium' | 'Low';
  priority: IssuePriority;
  status: IssueStatus;
  area: string;
  screen?: string;
  platform?: Platform;
  description: string;
  rootCause?: string;
  fixApproach?: string;
  files?: string[];
  assignee?: string;
  sprintId?: string;
  buildNumber?: string;
  screenshotIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Screenshot {
  id: string;
  name: string;
  path: string;
  feature: string;
  tags: string[];
  platform?: Platform;
  relatedIssueIds?: string[];
  notes?: string;
  createdAt: string;
}

export interface Link {
  id: string;
  title: string;
  url: string;
  category: string;
  type: 'external' | 'local';
  owner?: string;
  notes?: string;
  lastUpdated: string;
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  relatedIssueIds?: string[];
}

export interface ChecklistItem {
  id: string;
  item: string;
  status: ChecklistStatus;
  notes?: string;
}

export interface AppleCompliance {
  appStoreStatus: string;
  lastReviewDate?: string;
  checklist: ChecklistItem[];
  privacyNutritionLabels: {
    category: string;
    collected: boolean;
    purpose: string;
    linked: boolean;
  }[];
}

export interface GooglePlayCompliance {
  playStoreStatus: string;
  lastReviewDate?: string;
  checklist: ChecklistItem[];
  dataSafetyForm: {
    dataCollected: string[];
    dataShared: string[];
    securityPractices: string[];
  };
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  slug: string;
  legacyCount?: number;
  newCount?: number;
  missingIds?: string[];
  extraIds?: string[];
  subcategories?: { id: string; name: string; slug: string }[];
}

export interface ActivityLog {
  id: string;
  type: 'issue' | 'build' | 'decision' | 'change';
  action: string;
  description: string;
  timestamp: string;
  relatedId?: string;
}

export interface Build {
  id: string;
  buildNumber: string;
  version: string;
  channel: string;
  platform: Platform;
  gitCommit?: string;
  gitBranch?: string;
  date: string;
  expiresAt?: string;
  notes?: string;
  knownIssueIds?: string[];
  status: 'building' | 'submitted' | 'available' | 'rejected';
}

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed';
  issueIds: string[];
}

export interface HQData {
  meta: {
    projectName: string;
    version: string;
    updatedAt: string;
    description: string;
  };
  issues: Issue[];
  screenshots: Screenshot[];
  links: Link[];
  decisions: Decision[];
  activityLog: ActivityLog[];
  builds: Build[];
  sprints: Sprint[];
  marketplaceCategories: MarketplaceCategory[];
  compliance: {
    apple: AppleCompliance;
    googlePlay: GooglePlayCompliance;
    rejections: {
      date: string;
      store: 'Apple' | 'Google';
      reason: string;
      fix: string;
      status: 'Pending' | 'Fixed';
    }[];
  };
  architecture: {
    overview: string;
    directories: { path: string; description: string }[];
    firebaseCollections: { name: string; description: string; indexes: string[] }[];
  };
  quickLinks: { title: string; url: string; icon: string }[];
  recentChanges: string[];
}
