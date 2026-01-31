import { HQData, Issue, Screenshot, Link, Decision, ActivityLog } from '@/types/hq';
import hqDataJson from '../../data/hq-data.json';

const STORAGE_KEY = 'hq-local-overrides';

// Load base data from JSON
export function loadBaseData(): HQData {
  return hqDataJson as HQData;
}

// Get localStorage overrides (client-side only)
export function getLocalOverrides(): Partial<HQData> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save local overrides
export function saveLocalOverrides(overrides: Partial<HQData>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

// Merge base data with local overrides
export function getMergedData(): HQData {
  const base = loadBaseData();
  const overrides = getLocalOverrides();

  return {
    ...base,
    issues: overrides.issues ?? base.issues,
    screenshots: overrides.screenshots ?? base.screenshots,
    links: overrides.links ?? base.links,
    decisions: overrides.decisions ?? base.decisions,
    activityLog: overrides.activityLog ?? base.activityLog,
  };
}

// Issue operations
export function addIssue(issue: Issue): void {
  const data = getMergedData();
  const issues = [...data.issues, issue];
  saveLocalOverrides({ ...getLocalOverrides(), issues });
}

export function updateIssue(id: string, updates: Partial<Issue>): void {
  const data = getMergedData();
  const issues = data.issues.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i);
  saveLocalOverrides({ ...getLocalOverrides(), issues });
}

export function deleteIssue(id: string): void {
  const data = getMergedData();
  const issues = data.issues.filter(i => i.id !== id);
  saveLocalOverrides({ ...getLocalOverrides(), issues });
}

// Screenshot operations
export function addScreenshot(screenshot: Screenshot): void {
  const data = getMergedData();
  const screenshots = [...data.screenshots, screenshot];
  saveLocalOverrides({ ...getLocalOverrides(), screenshots });
}

// Link operations
export function addLink(link: Link): void {
  const data = getMergedData();
  const links = [...data.links, link];
  saveLocalOverrides({ ...getLocalOverrides(), links });
}

// Activity log
export function addActivity(activity: ActivityLog): void {
  const data = getMergedData();
  const activityLog = [activity, ...data.activityLog].slice(0, 100); // Keep last 100
  saveLocalOverrides({ ...getLocalOverrides(), activityLog });
}

// Export all data as JSON
export function exportData(): string {
  const data = getMergedData();
  return JSON.stringify(data, null, 2);
}

// Import data from JSON
export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as HQData;
    saveLocalOverrides({
      issues: data.issues,
      screenshots: data.screenshots,
      links: data.links,
      decisions: data.decisions,
      activityLog: data.activityLog,
    });
    return true;
  } catch {
    return false;
  }
}

// Clear local overrides
export function clearLocalData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// Statistics
export function getStats() {
  const data = getMergedData();
  const issues = data.issues;

  return {
    total: issues.length,
    backlog: issues.filter(i => i.status === 'backlog').length,
    todo: issues.filter(i => i.status === 'todo').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    done: issues.filter(i => i.status === 'done').length,
    p0Count: issues.filter(i => i.priority === 'P0').length,
    p1Count: issues.filter(i => i.priority === 'P1').length,
  };
}

// Search across all data
export function search(query: string): { type: string; item: Issue | Screenshot | Link }[] {
  if (!query || query.length < 2) return [];

  const data = getMergedData();
  const q = query.toLowerCase();
  const results: { type: string; item: Issue | Screenshot | Link }[] = [];

  // Search issues
  data.issues.forEach(issue => {
    if (issue.title.toLowerCase().includes(q) || issue.description.toLowerCase().includes(q)) {
      results.push({ type: 'issue', item: issue });
    }
  });

  // Search screenshots
  data.screenshots.forEach(ss => {
    if (ss.name.toLowerCase().includes(q) || ss.tags.some(t => t.toLowerCase().includes(q))) {
      results.push({ type: 'screenshot', item: ss });
    }
  });

  // Search links
  data.links.forEach(link => {
    if (link.title.toLowerCase().includes(q) || (link.notes?.toLowerCase().includes(q))) {
      results.push({ type: 'link', item: link });
    }
  });

  return results.slice(0, 20);
}
