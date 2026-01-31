/**
 * TURING PROJECT HQ - Full Application
 * Version: 2.0.0
 * Vanilla JS - All features active
 */

// ============================================
// CORE: STATE MANAGEMENT
// ============================================
const App = {
  state: null,
  originalState: null,
  isDirty: false,
  currentTab: 'overview',
  history: [],
  historyIndex: -1,
  pagination: {},
  filters: {},
  searchTerm: ''
};

const STORAGE_KEY = 'turing-project-hq';
const PAGE_SIZE = 25;

// ============================================
// CORE: DOM HELPERS
// ============================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
};

// ============================================
// CORE: UTILITY FUNCTIONS
// ============================================
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function generateId(prefix) {
  const items = {
    'ISS': App.state?.issues || [],
    'SS': App.state?.screenshots || [],
    'BLD': App.state?.builds || [],
    'SPR': App.state?.sprints || [],
    'LNK': App.state?.links || [],
    'CHG': App.state?.changelog || [],
    'TC': App.state?.qa?.testCases || [],
    'REJ': App.state?.compliance?.rejections || []
  };
  const list = items[prefix] || [];
  const maxNum = list.reduce((max, item) => {
    const match = item.id?.match(new RegExp(`${prefix}-(\\d+)`));
    return match ? Math.max(max, parseInt(match[1])) : max;
  }, 0);
  return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('tr-TR');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ============================================
// CORE: DATA ACCESS LAYER
// ============================================
const DB = {
  get(collection, id) {
    const list = this.list(collection);
    return list.find(item => item.id === id);
  },

  list(collection) {
    if (collection.includes('.')) {
      const [parent, child] = collection.split('.');
      return App.state?.[parent]?.[child] || [];
    }
    return App.state?.[collection] || [];
  },

  upsert(collection, item) {
    let list;
    if (collection.includes('.')) {
      const [parent, child] = collection.split('.');
      if (!App.state[parent]) App.state[parent] = {};
      if (!App.state[parent][child]) App.state[parent][child] = [];
      list = App.state[parent][child];
    } else {
      if (!App.state[collection]) App.state[collection] = [];
      list = App.state[collection];
    }

    const idx = list.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item, updatedAt: new Date().toISOString() };
    } else {
      item.createdAt = item.createdAt || new Date().toISOString();
      item.updatedAt = item.createdAt;
      list.push(item);
    }
    markDirty();
    return item;
  },

  remove(collection, id) {
    let list;
    if (collection.includes('.')) {
      const [parent, child] = collection.split('.');
      list = App.state?.[parent]?.[child];
    } else {
      list = App.state?.[collection];
    }
    if (!list) return false;

    const idx = list.findIndex(i => i.id === id);
    if (idx >= 0) {
      list.splice(idx, 1);
      markDirty();
      return true;
    }
    return false;
  },

  query(collection, filters = {}) {
    let list = this.list(collection);
    Object.entries(filters).forEach(([key, val]) => {
      if (val && val !== 'all') {
        list = list.filter(item => item[key] === val);
      }
    });
    return list;
  }
};

// ============================================
// CORE: STATE OPERATIONS
// ============================================
function markDirty() {
  App.isDirty = true;
  updateDirtyIndicator();
}

function updateDirtyIndicator() {
  const indicator = $('#dirty-indicator');
  if (indicator) {
    indicator.style.display = App.isDirty ? 'inline' : 'none';
  }
}

function pushHistory() {
  if (App.historyIndex < App.history.length - 1) {
    App.history = App.history.slice(0, App.historyIndex + 1);
  }
  App.history.push(deepClone(App.state));
  if (App.history.length > 50) App.history.shift();
  App.historyIndex = App.history.length - 1;
}

function undo() {
  if (App.historyIndex > 0) {
    App.historyIndex--;
    App.state = deepClone(App.history[App.historyIndex]);
    markDirty();
    renderCurrentTab();
    showToast('Undo', 'info');
  }
}

function redo() {
  if (App.historyIndex < App.history.length - 1) {
    App.historyIndex++;
    App.state = deepClone(App.history[App.historyIndex]);
    markDirty();
    renderCurrentTab();
    showToast('Redo', 'info');
  }
}

// ============================================
// CORE: DATA LOAD/SAVE
// ============================================
async function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      App.state = JSON.parse(saved);
      console.log('Loaded from localStorage');
    } else {
      const res = await fetch('./data/project-hq.json');
      if (res.ok) {
        App.state = await res.json();
        console.log('Loaded from file');
      } else {
        throw new Error('File not found');
      }
    }
  } catch (e) {
    console.log('Using empty template');
    App.state = getEmptyTemplate();
  }

  // Ensure all collections exist
  ensureCollections();
  App.originalState = deepClone(App.state);
  pushHistory();
  App.isDirty = false;
  renderApp();
  updateLastSaved();
}

function ensureCollections() {
  const defaults = {
    meta: { projectName: 'Turing', version: '1.0.0', updatedAt: new Date().toISOString() },
    overview: { status: '', blockers: [], quickLinks: [], recentChanges: [], environments: [], releaseReadiness: 0 },
    product: { summary: '', targetUsers: [], modules: [], flows: [] },
    roles: { accountModel: '', roles: [], permissionsMatrix: [], visibility: {} },
    architecture: { overview: '', directories: [], frontendBackendBoundary: '', offlineSupport: '', observability: {} },
    tech: { stack: [], sdks: [], envKeys: [] },
    firebase: { projectId: '', collections: [], rulesNotes: '', indexes: [], commonErrors: [], featureFlags: [], debugRecipes: [] },
    payments: { provider: '', environment: '', flow: [], plans: [], riskNotes: [], testCards: [] },
    adminPortal: { framework: '', routes: [], permissions: [], supportOperations: [] },
    qa: { legacyReportPath: '', screenshotFolders: [], testDevices: [], testCases: [], releaseChecklist: [] },
    screenshots: [],
    issues: [],
    sprints: [],
    builds: [],
    compliance: { apple: { checklist: [], privacyNutritionLabels: [] }, googlePlay: { checklist: [], dataSafetyForm: {} }, rejections: [] },
    links: [],
    changelog: []
  };

  Object.entries(defaults).forEach(([key, val]) => {
    if (!App.state[key]) {
      App.state[key] = val;
    } else if (typeof val === 'object' && !Array.isArray(val)) {
      Object.entries(val).forEach(([k2, v2]) => {
        if (App.state[key][k2] === undefined) {
          App.state[key][k2] = v2;
        }
      });
    }
  });
}

function getEmptyTemplate() {
  return {
    meta: { projectName: 'Turing', version: '1.0.0', updatedAt: new Date().toISOString() },
    overview: { status: 'Development', blockers: [], quickLinks: [], recentChanges: [], environments: [], releaseReadiness: 0 },
    product: { summary: '', targetUsers: [], modules: [], flows: [] },
    roles: { accountModel: '', roles: [], permissionsMatrix: [], visibility: {} },
    architecture: { overview: '', directories: [], frontendBackendBoundary: '', observability: {} },
    tech: { stack: [], sdks: [], envKeys: [] },
    firebase: { collections: [], rulesNotes: '', indexes: [], commonErrors: [], featureFlags: [], debugRecipes: [] },
    payments: { provider: 'iyzico', environment: 'sandbox', flow: [], plans: [], riskNotes: [], testCards: [] },
    adminPortal: { framework: '', routes: [], permissions: [], supportOperations: [] },
    qa: { legacyReportPath: '../revizyon_raporu.html', screenshotFolders: [], testDevices: [], testCases: [], releaseChecklist: [] },
    screenshots: [],
    issues: [],
    sprints: [],
    builds: [],
    compliance: { apple: { checklist: [] }, googlePlay: { checklist: [] }, rejections: [] },
    links: [],
    changelog: []
  };
}

function saveData() {
  pushHistory();
  App.state.meta.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(App.state));
  App.isDirty = false;
  updateDirtyIndicator();
  updateLastSaved();
  showToast('Saved', 'success');
}

function updateLastSaved() {
  const date = new Date(App.state.meta.updatedAt);
  const formatted = date.toLocaleString('tr-TR');
  const el = $('#last-saved');
  if (el) el.textContent = `Last: ${formatted}`;
  const el2 = $('#export-last-saved');
  if (el2) el2.textContent = formatted;
}

// ============================================
// CORE: EXPORT/IMPORT
// ============================================
function exportJSON() {
  const str = JSON.stringify(App.state, null, 2);
  downloadFile(str, `project-hq-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  showToast('JSON exported', 'success');
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.meta) throw new Error('Invalid format: missing meta');
      App.state = data;
      ensureCollections();
      saveData();
      renderApp();
      showToast('Imported successfully', 'success');
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    }
  };
  reader.readAsText(file);
}

function exportCSV(type) {
  let data, headers, filename, rowMapper;

  switch (type) {
    case 'issues':
      data = App.state.issues;
      headers = ['ID', 'Title', 'Type', 'Severity', 'Priority', 'Status', 'Area', 'Assignee', 'Sprint', 'Created'];
      rowMapper = i => [i.id, `"${escapeHtml(i.title)}"`, i.type, i.severity, i.priority, i.status, i.area, i.assignee || '', i.sprintId || '', i.createdAt];
      filename = 'issues.csv';
      break;
    case 'builds':
      data = App.state.builds;
      headers = ['ID', 'Build#', 'Version', 'Channel', 'Platform', 'Date', 'Status', 'Commit'];
      rowMapper = b => [b.id, b.buildNumber, b.version, b.channel, b.platform, b.date, b.status, b.gitCommit || ''];
      filename = 'builds.csv';
      break;
    case 'links':
      data = App.state.links;
      headers = ['ID', 'Title', 'URL', 'Category', 'Owner', 'Updated'];
      rowMapper = l => [l.id, `"${escapeHtml(l.title)}"`, l.url, l.category, l.owner || '', l.lastUpdated || ''];
      filename = 'links.csv';
      break;
    case 'checklist':
      data = [...(App.state.compliance?.apple?.checklist || []), ...(App.state.compliance?.googlePlay?.checklist || [])];
      headers = ['ID', 'Item', 'Status', 'Notes'];
      rowMapper = c => [c.id || '', `"${escapeHtml(c.item)}"`, c.status, `"${escapeHtml(c.notes || '')}"`];
      filename = 'checklist.csv';
      break;
    default:
      return;
  }

  if (!data?.length) {
    showToast('No data to export', 'warning');
    return;
  }

  const csv = [headers.join(','), ...data.map(rowMapper).map(r => r.join(','))].join('\n');
  downloadFile(csv, filename, 'text/csv');
  showToast('CSV exported', 'success');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function clearData() {
  if (confirm('Delete all data? This cannot be undone.')) {
    localStorage.removeItem(STORAGE_KEY);
    App.state = getEmptyTemplate();
    App.isDirty = false;
    renderApp();
    showToast('Data cleared', 'warning');
  }
}

// ============================================
// UI: TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info') {
  const container = $('#toast-container');
  if (!container) return;
  const toast = el('div', `toast ${type}`, message);
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// UI: CONFIRM DIALOG
// ============================================
function showConfirm(message, onConfirm) {
  const overlay = el('div', 'confirm-overlay');
  overlay.innerHTML = `
    <div class="confirm-dialog">
      <p>${message}</p>
      <div class="confirm-actions">
        <button class="btn btn-secondary" data-action="cancel">Cancel</button>
        <button class="btn btn-danger" data-action="confirm">Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('[data-action="cancel"]').onclick = () => overlay.remove();
  overlay.querySelector('[data-action="confirm"]').onclick = () => {
    overlay.remove();
    onConfirm();
  };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

// ============================================
// UI: MODAL
// ============================================
let currentModalSave = null;

function openModal(title, content, onSave) {
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = content;
  $('#modal-save').style.display = onSave ? 'inline-flex' : 'none';
  $('#modal-overlay').classList.add('open');
  currentModalSave = onSave;

  // Focus first input
  setTimeout(() => {
    const firstInput = $('#modal-body input:not([readonly]), #modal-body textarea, #modal-body select');
    if (firstInput) firstInput.focus();
  }, 100);
}

function closeModal() {
  $('#modal-overlay').classList.remove('open');
  currentModalSave = null;
}

function saveModal() {
  if (currentModalSave) currentModalSave();
}

// ============================================
// UI: DRAWER (for details)
// ============================================
function openDrawer(title, content) {
  let drawer = $('#detail-drawer');
  if (!drawer) {
    drawer = el('div', 'drawer');
    drawer.id = 'detail-drawer';
    drawer.innerHTML = `
      <div class="drawer-overlay"></div>
      <div class="drawer-panel">
        <div class="drawer-header">
          <span class="drawer-title"></span>
          <button class="drawer-close" onclick="closeDrawer()">&times;</button>
        </div>
        <div class="drawer-body"></div>
      </div>
    `;
    document.body.appendChild(drawer);
    drawer.querySelector('.drawer-overlay').onclick = closeDrawer;
  }
  drawer.querySelector('.drawer-title').textContent = title;
  drawer.querySelector('.drawer-body').innerHTML = content;
  drawer.classList.add('open');
}

function closeDrawer() {
  const drawer = $('#detail-drawer');
  if (drawer) drawer.classList.remove('open');
}

// ============================================
// UI: LIGHTBOX
// ============================================
function openLightbox(src, items = [], currentIndex = 0) {
  let lb = $('#lightbox');
  if (!lb) {
    lb = el('div', 'lightbox');
    lb.id = 'lightbox';
    lb.innerHTML = `
      <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
      <button class="lightbox-prev" onclick="lightboxPrev()">&#10094;</button>
      <img class="lightbox-image" src="" alt="">
      <button class="lightbox-next" onclick="lightboxNext()">&#10095;</button>
      <div class="lightbox-counter"></div>
    `;
    document.body.appendChild(lb);
    lb.onclick = (e) => { if (e.target === lb) closeLightbox(); };
  }

  lb.dataset.items = JSON.stringify(items);
  lb.dataset.index = currentIndex;

  lb.querySelector('.lightbox-image').src = src;
  lb.querySelector('.lightbox-counter').textContent = items.length > 1 ? `${currentIndex + 1} / ${items.length}` : '';
  lb.querySelector('.lightbox-prev').style.display = items.length > 1 ? 'block' : 'none';
  lb.querySelector('.lightbox-next').style.display = items.length > 1 ? 'block' : 'none';
  lb.classList.add('open');
}

function closeLightbox() {
  const lb = $('#lightbox');
  if (lb) lb.classList.remove('open');
}

function lightboxNav(delta) {
  const lb = $('#lightbox');
  if (!lb) return;
  const items = JSON.parse(lb.dataset.items || '[]');
  let idx = parseInt(lb.dataset.index || 0) + delta;
  if (idx < 0) idx = items.length - 1;
  if (idx >= items.length) idx = 0;
  lb.dataset.index = idx;
  lb.querySelector('.lightbox-image').src = items[idx];
  lb.querySelector('.lightbox-counter').textContent = `${idx + 1} / ${items.length}`;
}
function lightboxPrev() { lightboxNav(-1); }
function lightboxNext() { lightboxNav(1); }

// ============================================
// UI: PAGINATION
// ============================================
function paginate(items, page = 1, pageSize = PAGE_SIZE) {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    items: items.slice(start, end),
    page,
    totalPages,
    total,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

function renderPagination(containerId, paginationData, onPageChange) {
  const container = $(`#${containerId}`);
  if (!container) return;

  const { page, totalPages, total } = paginationData;
  if (totalPages <= 1) {
    container.innerHTML = `<span class="pagination-info">${total} items</span>`;
    return;
  }

  container.innerHTML = `
    <span class="pagination-info">${total} items</span>
    <div class="pagination-controls">
      <button class="btn btn-sm btn-secondary" ${!paginationData.hasPrev ? 'disabled' : ''} data-page="${page - 1}">Prev</button>
      <span class="pagination-current">Page ${page} of ${totalPages}</span>
      <button class="btn btn-sm btn-secondary" ${!paginationData.hasNext ? 'disabled' : ''} data-page="${page + 1}">Next</button>
    </div>
  `;

  container.querySelectorAll('button[data-page]').forEach(btn => {
    btn.onclick = () => onPageChange(parseInt(btn.dataset.page));
  });
}

// ============================================
// UI: COPY TO CLIPBOARD
// ============================================
function copyToClipboard(text, successMsg = 'Copied!') {
  navigator.clipboard.writeText(text).then(() => {
    showToast(successMsg, 'success');
  }).catch(() => {
    showToast('Copy failed', 'error');
  });
}

// ============================================
// NAVIGATION
// ============================================
function switchTab(tabId) {
  App.currentTab = tabId;
  window.location.hash = tabId;

  $$('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabId);
  });

  $$('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${tabId}`);
  });

  const titles = {
    overview: 'Overview',
    product: 'Product & App Logic',
    roles: 'Roles & Permissions',
    architecture: 'Architecture',
    tech: 'Tech Stack & Dependencies',
    firebase: 'Firebase & Security',
    payments: 'Payments',
    admin: 'Admin Portal',
    qa: 'QA / Screenshots',
    backlog: 'Backlog & Sprint',
    builds: 'Builds & Releases',
    compliance: 'Store Compliance',
    links: 'Docs & Links',
    changelog: 'Changelog',
    export: 'Export / Import'
  };

  $('#page-title').textContent = titles[tabId] || tabId;
  renderCurrentTab();
}

function renderCurrentTab() {
  const renderers = {
    overview: renderOverview,
    product: renderProduct,
    roles: renderRoles,
    architecture: renderArchitecture,
    tech: renderTech,
    firebase: renderFirebase,
    payments: renderPayments,
    admin: renderAdmin,
    qa: renderQA,
    backlog: renderBacklog,
    builds: renderBuilds,
    compliance: renderCompliance,
    links: renderLinks,
    changelog: renderChangelog,
    export: renderExport
  };

  const renderer = renderers[App.currentTab];
  if (renderer) renderer();
}

// ============================================
// GLOBAL SEARCH
// ============================================
function globalSearch(term) {
  if (!term || term.length < 2) return [];
  term = term.toLowerCase();
  const results = [];

  // Search issues
  App.state.issues?.forEach(i => {
    if (i.title?.toLowerCase().includes(term) || i.description?.toLowerCase().includes(term)) {
      results.push({ type: 'Issue', id: i.id, title: i.title, tab: 'backlog' });
    }
  });

  // Search screenshots
  App.state.screenshots?.forEach(s => {
    if (s.fileName?.toLowerCase().includes(term) || s.notes?.toLowerCase().includes(term) || s.tags?.some(t => t.toLowerCase().includes(term))) {
      results.push({ type: 'Screenshot', id: s.id, title: s.fileName, tab: 'qa' });
    }
  });

  // Search links
  App.state.links?.forEach(l => {
    if (l.title?.toLowerCase().includes(term) || l.url?.toLowerCase().includes(term)) {
      results.push({ type: 'Link', id: l.id, title: l.title, tab: 'links' });
    }
  });

  // Search builds
  App.state.builds?.forEach(b => {
    if (b.notes?.toLowerCase().includes(term) || b.version?.includes(term)) {
      results.push({ type: 'Build', id: b.id, title: `Build #${b.buildNumber}`, tab: 'builds' });
    }
  });

  return results.slice(0, 20);
}

function showSearchResults(results) {
  const dropdown = $('#search-dropdown');
  if (!dropdown) return;

  if (!results.length) {
    dropdown.innerHTML = '<div class="search-empty">No results</div>';
    dropdown.classList.add('open');
    return;
  }

  dropdown.innerHTML = results.map(r => `
    <div class="search-result" data-tab="${r.tab}" data-id="${r.id}">
      <span class="search-result-type">${r.type}</span>
      <span class="search-result-title">${escapeHtml(r.title)}</span>
    </div>
  `).join('');

  dropdown.querySelectorAll('.search-result').forEach(item => {
    item.onclick = () => {
      switchTab(item.dataset.tab);
      dropdown.classList.remove('open');
      $('#global-search').value = '';
      // TODO: highlight/scroll to item
    };
  });

  dropdown.classList.add('open');
}

// ============================================
// RENDER APP
// ============================================
function renderApp() {
  if (!App.state) return;

  // Update badges
  const openIssues = App.state.issues?.filter(i => i.status !== 'Done').length || 0;
  const badge = $('#issues-badge');
  if (badge) {
    badge.textContent = openIssues;
    badge.style.display = openIssues > 0 ? 'block' : 'none';
  }

  // Calculate release readiness
  calculateReleaseReadiness();

  // Render current tab
  renderCurrentTab();
}

function calculateReleaseReadiness() {
  const p0Open = App.state.issues?.filter(i => i.priority === 'P0' && i.status !== 'Done').length || 0;
  const p1Open = App.state.issues?.filter(i => i.priority === 'P1' && i.status !== 'Done').length || 0;

  let readiness = 100;
  readiness -= p0Open * 20; // Each P0 reduces 20%
  readiness -= p1Open * 5;  // Each P1 reduces 5%
  readiness = Math.max(0, Math.min(100, readiness));

  App.state.overview.releaseReadiness = readiness;
}

// ============================================
// RENDER: OVERVIEW TAB
// ============================================
function renderOverview() {
  const o = App.state.overview;
  const container = $('#panel-overview');
  if (!container) return;

  container.innerHTML = `
    <div class="section-grid">
      <!-- Status Card -->
      <div class="card">
        <div class="card-header">
          <h3>Project Status</h3>
        </div>
        <div class="card-body">
          <div class="stat-row">
            <span class="stat-label">Status</span>
            <span class="stat-value status-badge status-${o.status?.toLowerCase() || 'unknown'}">${o.status || 'Not Set'}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Version</span>
            <span class="stat-value">${o.currentVersion || App.state.meta.version || '-'}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Build</span>
            <span class="stat-value">${o.currentBuild || '-'}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Branch</span>
            <span class="stat-value"><code>${o.activeBranch || 'main'}</code></span>
          </div>
        </div>
      </div>

      <!-- Release Readiness -->
      <div class="card">
        <div class="card-header">
          <h3>Release Readiness</h3>
        </div>
        <div class="card-body">
          <div class="readiness-meter">
            <div class="readiness-bar" style="width: ${o.releaseReadiness || 0}%"></div>
          </div>
          <div class="readiness-value">${o.releaseReadiness || 0}%</div>
          <div class="readiness-stats">
            <span>P0: ${App.state.issues?.filter(i => i.priority === 'P0' && i.status !== 'Done').length || 0} open</span>
            <span>P1: ${App.state.issues?.filter(i => i.priority === 'P1' && i.status !== 'Done').length || 0} open</span>
          </div>
        </div>
      </div>

      <!-- Environments -->
      <div class="card">
        <div class="card-header">
          <h3>Environments</h3>
          <button class="btn btn-sm btn-primary" onclick="addEnvironment()">+ Add</button>
        </div>
        <div class="card-body">
          <div class="env-list" id="env-list">
            ${(o.environments || []).map((env, idx) => `
              <div class="env-item" data-idx="${idx}">
                <span class="env-name">${escapeHtml(env.name)}</span>
                <span class="env-status status-${env.status}">${env.status}</span>
                ${env.url ? `<a href="${escapeHtml(env.url)}" target="_blank" class="env-link">Open</a>` : ''}
                <button class="btn-icon" onclick="editEnvironment(${idx})" title="Edit">✏️</button>
                <button class="btn-icon" onclick="deleteEnvironment(${idx})" title="Delete">🗑️</button>
              </div>
            `).join('') || '<div class="empty-state">No environments configured</div>'}
          </div>
        </div>
      </div>
    </div>

    <!-- Blockers -->
    <div class="card">
      <div class="card-header">
        <h3>Blockers</h3>
        <button class="btn btn-sm btn-primary" onclick="addBlocker()">+ Add Blocker</button>
      </div>
      <div class="card-body">
        <div class="blockers-list" id="blockers-list">
          ${(o.blockers || []).filter(b => b.status !== 'Resolved').map((blocker, idx) => `
            <div class="blocker-item priority-${blocker.priority}" data-idx="${idx}">
              <span class="blocker-priority">${blocker.priority}</span>
              <span class="blocker-title">${escapeHtml(blocker.title)}</span>
              <span class="blocker-status">${blocker.status}</span>
              <button class="btn btn-sm btn-secondary" onclick="resolveBlocker(${idx})">Resolve</button>
              <button class="btn-icon" onclick="editBlocker(${idx})">✏️</button>
              <button class="btn-icon" onclick="deleteBlocker(${idx})">🗑️</button>
            </div>
          `).join('') || '<div class="empty-state success">No active blockers 🎉</div>'}
        </div>
      </div>
    </div>

    <!-- Quick Links -->
    <div class="card">
      <div class="card-header">
        <h3>Quick Links</h3>
        <button class="btn btn-sm btn-primary" onclick="addQuickLink()">+ Add Link</button>
      </div>
      <div class="card-body">
        <div class="quick-links-grid" id="quick-links-grid">
          ${(o.quickLinks || []).map((link, idx) => `
            <a href="${escapeHtml(link.url)}" target="_blank" class="quick-link-card" data-idx="${idx}">
              <span class="quick-link-icon">${link.icon || '🔗'}</span>
              <span class="quick-link-title">${escapeHtml(link.title)}</span>
              <button class="btn-icon edit-link" onclick="event.preventDefault(); editQuickLink(${idx})">✏️</button>
            </a>
          `).join('') || '<div class="empty-state">No quick links</div>'}
        </div>
      </div>
    </div>

    <!-- Recent Changes -->
    <div class="card">
      <div class="card-header">
        <h3>Recent Changes</h3>
        <button class="btn btn-sm btn-secondary" onclick="addRecentChange()">+ Add</button>
      </div>
      <div class="card-body">
        <ul class="recent-changes-list">
          ${(o.recentChanges || []).slice(0, 10).map((change, idx) => `
            <li>${escapeHtml(change)} <button class="btn-icon" onclick="deleteRecentChange(${idx})">×</button></li>
          `).join('') || '<li class="empty-state">No recent changes</li>'}
        </ul>
      </div>
    </div>
  `;
}

// Overview CRUD functions
function addEnvironment() {
  openModal('Add Environment', `
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="env-name" placeholder="e.g., Preview, Production">
    </div>
    <div class="form-group">
      <label>URL</label>
      <input type="url" id="env-url" placeholder="https://...">
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="env-status">
        <option value="active">Active</option>
        <option value="pending">Pending</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  `, () => {
    const name = $('#env-name').value.trim();
    if (!name) { showToast('Name required', 'error'); return; }
    if (!App.state.overview.environments) App.state.overview.environments = [];
    App.state.overview.environments.push({
      name,
      url: $('#env-url').value.trim(),
      status: $('#env-status').value
    });
    markDirty();
    renderOverview();
    closeModal();
    showToast('Environment added', 'success');
  });
}

function editEnvironment(idx) {
  const env = App.state.overview.environments[idx];
  if (!env) return;
  openModal('Edit Environment', `
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="env-name" value="${escapeHtml(env.name)}">
    </div>
    <div class="form-group">
      <label>URL</label>
      <input type="url" id="env-url" value="${escapeHtml(env.url || '')}">
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="env-status">
        <option value="active" ${env.status === 'active' ? 'selected' : ''}>Active</option>
        <option value="pending" ${env.status === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="inactive" ${env.status === 'inactive' ? 'selected' : ''}>Inactive</option>
      </select>
    </div>
  `, () => {
    env.name = $('#env-name').value.trim();
    env.url = $('#env-url').value.trim();
    env.status = $('#env-status').value;
    markDirty();
    renderOverview();
    closeModal();
    showToast('Environment updated', 'success');
  });
}

function deleteEnvironment(idx) {
  showConfirm('Delete this environment?', () => {
    App.state.overview.environments.splice(idx, 1);
    markDirty();
    renderOverview();
    showToast('Environment deleted', 'success');
  });
}

function addBlocker() {
  openModal('Add Blocker', `
    <div class="form-group">
      <label>Title</label>
      <input type="text" id="blocker-title" placeholder="What's blocking release?">
    </div>
    <div class="form-group">
      <label>Priority</label>
      <select id="blocker-priority">
        <option value="P0">P0 - Critical</option>
        <option value="P1">P1 - High</option>
        <option value="P2">P2 - Medium</option>
      </select>
    </div>
  `, () => {
    const title = $('#blocker-title').value.trim();
    if (!title) { showToast('Title required', 'error'); return; }
    if (!App.state.overview.blockers) App.state.overview.blockers = [];
    App.state.overview.blockers.push({
      id: generateId('BLK'),
      title,
      priority: $('#blocker-priority').value,
      status: 'Open'
    });
    markDirty();
    renderOverview();
    closeModal();
    showToast('Blocker added', 'success');
  });
}

function editBlocker(idx) {
  const blocker = App.state.overview.blockers[idx];
  if (!blocker) return;
  openModal('Edit Blocker', `
    <div class="form-group">
      <label>Title</label>
      <input type="text" id="blocker-title" value="${escapeHtml(blocker.title)}">
    </div>
    <div class="form-group">
      <label>Priority</label>
      <select id="blocker-priority">
        <option value="P0" ${blocker.priority === 'P0' ? 'selected' : ''}>P0 - Critical</option>
        <option value="P1" ${blocker.priority === 'P1' ? 'selected' : ''}>P1 - High</option>
        <option value="P2" ${blocker.priority === 'P2' ? 'selected' : ''}>P2 - Medium</option>
      </select>
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="blocker-status">
        <option value="Open" ${blocker.status === 'Open' ? 'selected' : ''}>Open</option>
        <option value="Resolved" ${blocker.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
      </select>
    </div>
  `, () => {
    blocker.title = $('#blocker-title').value.trim();
    blocker.priority = $('#blocker-priority').value;
    blocker.status = $('#blocker-status').value;
    markDirty();
    renderOverview();
    closeModal();
    showToast('Blocker updated', 'success');
  });
}

function deleteBlocker(idx) {
  showConfirm('Delete this blocker?', () => {
    App.state.overview.blockers.splice(idx, 1);
    markDirty();
    renderOverview();
    showToast('Blocker deleted', 'success');
  });
}

function resolveBlocker(idx) {
  App.state.overview.blockers[idx].status = 'Resolved';
  markDirty();
  renderOverview();
  showToast('Blocker resolved', 'success');
}

function addQuickLink() {
  openModal('Add Quick Link', `
    <div class="form-group">
      <label>Title</label>
      <input type="text" id="ql-title" placeholder="Link name">
    </div>
    <div class="form-group">
      <label>URL</label>
      <input type="url" id="ql-url" placeholder="https://...">
    </div>
    <div class="form-group">
      <label>Icon (emoji)</label>
      <input type="text" id="ql-icon" placeholder="🔗" maxlength="2">
    </div>
  `, () => {
    const title = $('#ql-title').value.trim();
    const url = $('#ql-url').value.trim();
    if (!title || !url) { showToast('Title and URL required', 'error'); return; }
    if (!App.state.overview.quickLinks) App.state.overview.quickLinks = [];
    App.state.overview.quickLinks.push({
      title, url,
      icon: $('#ql-icon').value.trim() || '🔗'
    });
    markDirty();
    renderOverview();
    closeModal();
    showToast('Quick link added', 'success');
  });
}

function editQuickLink(idx) {
  const link = App.state.overview.quickLinks[idx];
  if (!link) return;
  openModal('Edit Quick Link', `
    <div class="form-group">
      <label>Title</label>
      <input type="text" id="ql-title" value="${escapeHtml(link.title)}">
    </div>
    <div class="form-group">
      <label>URL</label>
      <input type="url" id="ql-url" value="${escapeHtml(link.url)}">
    </div>
    <div class="form-group">
      <label>Icon (emoji)</label>
      <input type="text" id="ql-icon" value="${link.icon || ''}" maxlength="2">
    </div>
    <button class="btn btn-danger btn-sm" style="margin-top: 10px;" onclick="deleteQuickLinkFromModal(${idx})">Delete Link</button>
  `, () => {
    link.title = $('#ql-title').value.trim();
    link.url = $('#ql-url').value.trim();
    link.icon = $('#ql-icon').value.trim() || '🔗';
    markDirty();
    renderOverview();
    closeModal();
    showToast('Quick link updated', 'success');
  });
}

function deleteQuickLinkFromModal(idx) {
  showConfirm('Delete this quick link?', () => {
    App.state.overview.quickLinks.splice(idx, 1);
    markDirty();
    renderOverview();
    closeModal();
    showToast('Quick link deleted', 'success');
  });
}

function addRecentChange() {
  openModal('Add Recent Change', `
    <div class="form-group">
      <label>Change Description</label>
      <input type="text" id="rc-text" placeholder="What changed?">
    </div>
  `, () => {
    const text = $('#rc-text').value.trim();
    if (!text) { showToast('Description required', 'error'); return; }
    if (!App.state.overview.recentChanges) App.state.overview.recentChanges = [];
    App.state.overview.recentChanges.unshift(text);
    markDirty();
    renderOverview();
    closeModal();
    showToast('Change added', 'success');
  });
}

function deleteRecentChange(idx) {
  App.state.overview.recentChanges.splice(idx, 1);
  markDirty();
  renderOverview();
}

// ============================================
// RENDER: PRODUCT TAB
// ============================================
function renderProduct() {
  const p = App.state.product;
  const container = $('#panel-product');
  if (!container) return;

  container.innerHTML = `
    <!-- Summary -->
    <div class="card">
      <div class="card-header">
        <h3>Product Summary</h3>
        <button class="btn btn-sm btn-secondary" onclick="editProductSummary()">Edit</button>
      </div>
      <div class="card-body">
        <p class="summary-text">${escapeHtml(p.summary) || '<em>No summary yet</em>'}</p>
      </div>
    </div>

    <!-- Target Users -->
    <div class="card">
      <div class="card-header">
        <h3>Target Users</h3>
        <button class="btn btn-sm btn-primary" onclick="addTargetUser()">+ Add</button>
      </div>
      <div class="card-body">
        <div class="target-users-list">
          ${(p.targetUsers || []).map((user, idx) => `
            <div class="target-user-item">
              <strong>${escapeHtml(user.role)}</strong>
              <p>${escapeHtml(user.description)}</p>
              <div class="item-actions">
                <button class="btn-icon" onclick="editTargetUser(${idx})">✏️</button>
                <button class="btn-icon" onclick="deleteTargetUser(${idx})">🗑️</button>
              </div>
            </div>
          `).join('') || '<div class="empty-state">No target users defined</div>'}
        </div>
      </div>
    </div>

    <!-- Modules -->
    <div class="card">
      <div class="card-header">
        <h3>Modules</h3>
        <button class="btn btn-sm btn-primary" onclick="addModule()">+ Add Module</button>
      </div>
      <div class="card-body">
        <div class="modules-list">
          ${(p.modules || []).map((mod, idx) => `
            <div class="module-item">
              <div class="module-header">
                <strong>${escapeHtml(mod.name)}</strong>
                <div class="item-actions">
                  <button class="btn-icon" onclick="editModule(${idx})">✏️</button>
                  <button class="btn-icon" onclick="deleteModule(${idx})">🗑️</button>
                </div>
              </div>
              <p>${escapeHtml(mod.description)}</p>
              ${mod.screens?.length ? `<div class="module-screens">Screens: ${mod.screens.map(s => `<code>${escapeHtml(s)}</code>`).join(', ')}</div>` : ''}
            </div>
          `).join('') || '<div class="empty-state">No modules defined</div>'}
        </div>
      </div>
    </div>

    <!-- User Flows -->
    <div class="card">
      <div class="card-header">
        <h3>User Flows</h3>
        <button class="btn btn-sm btn-primary" onclick="addFlow()">+ Add Flow</button>
      </div>
      <div class="card-body">
        <div class="flows-list">
          ${(p.flows || []).map((flow, idx) => `
            <div class="flow-item">
              <div class="flow-header">
                <strong>${escapeHtml(flow.name)}</strong>
                <div class="item-actions">
                  <button class="btn-icon" onclick="editFlow(${idx})">✏️</button>
                  <button class="btn-icon" onclick="deleteFlow(${idx})">🗑️</button>
                </div>
              </div>
              <ol class="flow-steps">
                ${(flow.steps || []).map(step => `<li>${escapeHtml(step)}</li>`).join('')}
              </ol>
            </div>
          `).join('') || '<div class="empty-state">No flows defined</div>'}
        </div>
      </div>
    </div>
  `;
}

// Product CRUD
function editProductSummary() {
  openModal('Edit Product Summary', `
    <div class="form-group">
      <label>Summary</label>
      <textarea id="product-summary" rows="5">${escapeHtml(App.state.product.summary || '')}</textarea>
    </div>
  `, () => {
    App.state.product.summary = $('#product-summary').value.trim();
    markDirty();
    renderProduct();
    closeModal();
    showToast('Summary updated', 'success');
  });
}

function addTargetUser() {
  openModal('Add Target User', `
    <div class="form-group">
      <label>Role</label>
      <input type="text" id="tu-role" placeholder="e.g., Event Organizer">
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="tu-desc" rows="3" placeholder="Who is this user?"></textarea>
    </div>
  `, () => {
    const role = $('#tu-role').value.trim();
    if (!role) { showToast('Role required', 'error'); return; }
    if (!App.state.product.targetUsers) App.state.product.targetUsers = [];
    App.state.product.targetUsers.push({
      role,
      description: $('#tu-desc').value.trim()
    });
    markDirty();
    renderProduct();
    closeModal();
    showToast('Target user added', 'success');
  });
}

function editTargetUser(idx) {
  const user = App.state.product.targetUsers[idx];
  openModal('Edit Target User', `
    <div class="form-group">
      <label>Role</label>
      <input type="text" id="tu-role" value="${escapeHtml(user.role)}">
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="tu-desc" rows="3">${escapeHtml(user.description || '')}</textarea>
    </div>
  `, () => {
    user.role = $('#tu-role').value.trim();
    user.description = $('#tu-desc').value.trim();
    markDirty();
    renderProduct();
    closeModal();
    showToast('Target user updated', 'success');
  });
}

function deleteTargetUser(idx) {
  showConfirm('Delete this target user?', () => {
    App.state.product.targetUsers.splice(idx, 1);
    markDirty();
    renderProduct();
  });
}

function addModule() {
  openModal('Add Module', `
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="mod-name" placeholder="Module name">
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="mod-desc" rows="3"></textarea>
    </div>
    <div class="form-group">
      <label>Screens (comma-separated)</label>
      <input type="text" id="mod-screens" placeholder="HomeScreen, DetailScreen">
    </div>
  `, () => {
    const name = $('#mod-name').value.trim();
    if (!name) { showToast('Name required', 'error'); return; }
    if (!App.state.product.modules) App.state.product.modules = [];
    App.state.product.modules.push({
      name,
      description: $('#mod-desc').value.trim(),
      screens: $('#mod-screens').value.split(',').map(s => s.trim()).filter(Boolean)
    });
    markDirty();
    renderProduct();
    closeModal();
    showToast('Module added', 'success');
  });
}

function editModule(idx) {
  const mod = App.state.product.modules[idx];
  openModal('Edit Module', `
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="mod-name" value="${escapeHtml(mod.name)}">
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="mod-desc" rows="3">${escapeHtml(mod.description || '')}</textarea>
    </div>
    <div class="form-group">
      <label>Screens (comma-separated)</label>
      <input type="text" id="mod-screens" value="${(mod.screens || []).join(', ')}">
    </div>
  `, () => {
    mod.name = $('#mod-name').value.trim();
    mod.description = $('#mod-desc').value.trim();
    mod.screens = $('#mod-screens').value.split(',').map(s => s.trim()).filter(Boolean);
    markDirty();
    renderProduct();
    closeModal();
    showToast('Module updated', 'success');
  });
}

function deleteModule(idx) {
  showConfirm('Delete this module?', () => {
    App.state.product.modules.splice(idx, 1);
    markDirty();
    renderProduct();
  });
}

function addFlow() {
  openModal('Add User Flow', `
    <div class="form-group">
      <label>Flow Name</label>
      <input type="text" id="flow-name" placeholder="e.g., User Registration">
    </div>
    <div class="form-group">
      <label>Steps (one per line)</label>
      <textarea id="flow-steps" rows="6" placeholder="1. User opens app\n2. Clicks Sign Up\n3. ..."></textarea>
    </div>
  `, () => {
    const name = $('#flow-name').value.trim();
    if (!name) { showToast('Name required', 'error'); return; }
    if (!App.state.product.flows) App.state.product.flows = [];
    App.state.product.flows.push({
      name,
      steps: $('#flow-steps').value.split('\n').map(s => s.trim()).filter(Boolean)
    });
    markDirty();
    renderProduct();
    closeModal();
    showToast('Flow added', 'success');
  });
}

function editFlow(idx) {
  const flow = App.state.product.flows[idx];
  openModal('Edit User Flow', `
    <div class="form-group">
      <label>Flow Name</label>
      <input type="text" id="flow-name" value="${escapeHtml(flow.name)}">
    </div>
    <div class="form-group">
      <label>Steps (one per line)</label>
      <textarea id="flow-steps" rows="6">${(flow.steps || []).join('\n')}</textarea>
    </div>
  `, () => {
    flow.name = $('#flow-name').value.trim();
    flow.steps = $('#flow-steps').value.split('\n').map(s => s.trim()).filter(Boolean);
    markDirty();
    renderProduct();
    closeModal();
    showToast('Flow updated', 'success');
  });
}

function deleteFlow(idx) {
  showConfirm('Delete this flow?', () => {
    App.state.product.flows.splice(idx, 1);
    markDirty();
    renderProduct();
  });
}

// ============================================
// RENDER: ROLES TAB
// ============================================
function renderRoles() {
  const r = App.state.roles;
  const container = $('#panel-roles');
  if (!container) return;

  container.innerHTML = `
    <!-- Account Model -->
    <div class="card">
      <div class="card-header">
        <h3>Account Model</h3>
        <button class="btn btn-sm btn-secondary" onclick="editAccountModel()">Edit</button>
      </div>
      <div class="card-body">
        <p>${escapeHtml(r.accountModel) || '<em>Not defined</em>'}</p>
      </div>
    </div>

    <!-- Roles -->
    <div class="card">
      <div class="card-header">
        <h3>Roles</h3>
        <button class="btn btn-sm btn-primary" onclick="addRole()">+ Add Role</button>
      </div>
      <div class="card-body">
        <div class="roles-list">
          ${(r.roles || []).map((role, idx) => `
            <div class="role-item">
              <strong>${escapeHtml(role.name)}</strong>
              <p>${escapeHtml(role.description)}</p>
              <div class="item-actions">
                <button class="btn-icon" onclick="editRole(${idx})">✏️</button>
                <button class="btn-icon" onclick="deleteRole(${idx})">🗑️</button>
              </div>
            </div>
          `).join('') || '<div class="empty-state">No roles defined</div>'}
        </div>
      </div>
    </div>

    <!-- Permissions Matrix -->
    <div class="card">
      <div class="card-header">
        <h3>Permissions Matrix</h3>
        <button class="btn btn-sm btn-primary" onclick="addPermission()">+ Add Permission</button>
      </div>
      <div class="card-body table-responsive">
        ${renderPermissionsMatrix(r)}
      </div>
    </div>

    <!-- Visibility Rules -->
    <div class="card">
      <div class="card-header">
        <h3>Visibility Rules</h3>
        <button class="btn btn-sm btn-secondary" onclick="editVisibility()">Edit</button>
      </div>
      <div class="card-body">
        <dl class="visibility-list">
          ${Object.entries(r.visibility || {}).map(([k, v]) => `
            <dt>${escapeHtml(k)}</dt>
            <dd>${escapeHtml(v)}</dd>
          `).join('') || '<div class="empty-state">No visibility rules</div>'}
        </dl>
      </div>
    </div>
  `;
}

function renderPermissionsMatrix(r) {
  const roles = (r.roles || []).map(ro => ro.name);
  const matrix = r.permissionsMatrix || [];
  if (!roles.length || !matrix.length) return '<div class="empty-state">Add roles and permissions to see matrix</div>';

  return `
    <table class="data-table permissions-table">
      <thead>
        <tr>
          <th>Resource</th>
          ${roles.map(role => `<th>${escapeHtml(role)}</th>`).join('')}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${matrix.map((perm, idx) => `
          <tr>
            <td><strong>${escapeHtml(perm.resource)}</strong></td>
            ${roles.map(role => `
              <td class="perm-cell ${perm[role] ? 'allowed' : 'denied'}" onclick="togglePermission(${idx}, '${role}')">
                ${perm[role] ? '✓' : '✗'}
              </td>
            `).join('')}
            <td>
              <button class="btn-icon" onclick="deletePermission(${idx})">🗑️</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Roles CRUD
function editAccountModel() {
  openModal('Edit Account Model', `
    <div class="form-group">
      <label>Account Model Description</label>
      <textarea id="account-model" rows="4">${escapeHtml(App.state.roles.accountModel || '')}</textarea>
    </div>
  `, () => {
    App.state.roles.accountModel = $('#account-model').value.trim();
    markDirty();
    renderRoles();
    closeModal();
    showToast('Account model updated', 'success');
  });
}

function addRole() {
  openModal('Add Role', `
    <div class="form-group">
      <label>Role Name</label>
      <input type="text" id="role-name" placeholder="e.g., Admin">
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="role-desc" rows="3"></textarea>
    </div>
  `, () => {
    const name = $('#role-name').value.trim();
    if (!name) { showToast('Name required', 'error'); return; }
    if (!App.state.roles.roles) App.state.roles.roles = [];
    App.state.roles.roles.push({ name, description: $('#role-desc').value.trim() });
    markDirty();
    renderRoles();
    closeModal();
    showToast('Role added', 'success');
  });
}

function editRole(idx) {
  const role = App.state.roles.roles[idx];
  openModal('Edit Role', `
    <div class="form-group">
      <label>Role Name</label>
      <input type="text" id="role-name" value="${escapeHtml(role.name)}">
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="role-desc" rows="3">${escapeHtml(role.description || '')}</textarea>
    </div>
  `, () => {
    role.name = $('#role-name').value.trim();
    role.description = $('#role-desc').value.trim();
    markDirty();
    renderRoles();
    closeModal();
    showToast('Role updated', 'success');
  });
}

function deleteRole(idx) {
  showConfirm('Delete this role?', () => {
    App.state.roles.roles.splice(idx, 1);
    markDirty();
    renderRoles();
  });
}

function addPermission() {
  openModal('Add Permission', `
    <div class="form-group">
      <label>Resource</label>
      <input type="text" id="perm-resource" placeholder="e.g., events, users">
    </div>
  `, () => {
    const resource = $('#perm-resource').value.trim();
    if (!resource) { showToast('Resource required', 'error'); return; }
    if (!App.state.roles.permissionsMatrix) App.state.roles.permissionsMatrix = [];
    const perm = { resource };
    (App.state.roles.roles || []).forEach(r => { perm[r.name] = false; });
    App.state.roles.permissionsMatrix.push(perm);
    markDirty();
    renderRoles();
    closeModal();
    showToast('Permission added', 'success');
  });
}

function togglePermission(idx, role) {
  const perm = App.state.roles.permissionsMatrix[idx];
  if (perm) {
    perm[role] = !perm[role];
    markDirty();
    renderRoles();
  }
}

function deletePermission(idx) {
  showConfirm('Delete this permission?', () => {
    App.state.roles.permissionsMatrix.splice(idx, 1);
    markDirty();
    renderRoles();
  });
}

function editVisibility() {
  const vis = App.state.roles.visibility || {};
  const entries = Object.entries(vis);
  openModal('Edit Visibility Rules', `
    <div class="form-group">
      <label>Rules (JSON format)</label>
      <textarea id="vis-json" rows="8">${JSON.stringify(vis, null, 2)}</textarea>
    </div>
    <p class="help-text">Format: { "key": "description", ... }</p>
  `, () => {
    try {
      App.state.roles.visibility = JSON.parse($('#vis-json').value);
      markDirty();
      renderRoles();
      closeModal();
      showToast('Visibility updated', 'success');
    } catch (e) {
      showToast('Invalid JSON', 'error');
    }
  });
}

// ============================================
// RENDER: ARCHITECTURE TAB
// ============================================
function renderArchitecture() {
  const a = App.state.architecture;
  const container = $('#panel-architecture');
  if (!container) return;

  container.innerHTML = `
    <!-- Overview -->
    <div class="card">
      <div class="card-header">
        <h3>Architecture Overview</h3>
        <button class="btn btn-sm btn-secondary" onclick="editArchOverview()">Edit</button>
      </div>
      <div class="card-body">
        <p>${escapeHtml(a.overview) || '<em>Not defined</em>'}</p>
      </div>
    </div>

    <!-- Directory Structure -->
    <div class="card">
      <div class="card-header">
        <h3>Directory Structure</h3>
        <button class="btn btn-sm btn-primary" onclick="addDirectory()">+ Add</button>
      </div>
      <div class="card-body">
        <div class="directory-list">
          ${(a.directories || []).map((dir, idx) => `
            <div class="directory-item">
              <code>${escapeHtml(dir.path)}</code>
              <span>${escapeHtml(dir.description)}</span>
              <div class="item-actions">
                <button class="btn-icon" onclick="editDirectory(${idx})">✏️</button>
                <button class="btn-icon" onclick="deleteDirectory(${idx})">🗑️</button>
              </div>
            </div>
          `).join('') || '<div class="empty-state">No directories documented</div>'}
        </div>
      </div>
    </div>

    <!-- Boundaries -->
    <div class="card">
      <div class="card-header">
        <h3>Frontend/Backend Boundary</h3>
        <button class="btn btn-sm btn-secondary" onclick="editBoundary()">Edit</button>
      </div>
      <div class="card-body">
        <p>${escapeHtml(a.frontendBackendBoundary) || '<em>Not defined</em>'}</p>
      </div>
    </div>

    <!-- Offline Support -->
    <div class="card">
      <div class="card-header">
        <h3>Offline Support</h3>
        <button class="btn btn-sm btn-secondary" onclick="editOfflineSupport()">Edit</button>
      </div>
      <div class="card-body">
        <p>${escapeHtml(a.offlineSupport) || '<em>Not defined</em>'}</p>
      </div>
    </div>

    <!-- Observability -->
    <div class="card">
      <div class="card-header">
        <h3>Observability</h3>
        <button class="btn btn-sm btn-secondary" onclick="editObservability()">Edit</button>
      </div>
      <div class="card-body">
        <dl class="observability-list">
          <dt>Error Tracking</dt><dd>${escapeHtml(a.observability?.errorTracking) || '-'}</dd>
          <dt>Analytics</dt><dd>${escapeHtml(a.observability?.analytics) || '-'}</dd>
          <dt>Crash Reporting</dt><dd>${escapeHtml(a.observability?.crashReporting) || '-'}</dd>
          <dt>Diagnostics</dt><dd>${escapeHtml(a.observability?.diagnostics) || '-'}</dd>
        </dl>
      </div>
    </div>
  `;
}

// Architecture CRUD
function editArchOverview() {
  openModal('Edit Architecture Overview', `
    <div class="form-group">
      <label>Overview</label>
      <textarea id="arch-overview" rows="5">${escapeHtml(App.state.architecture.overview || '')}</textarea>
    </div>
  `, () => {
    App.state.architecture.overview = $('#arch-overview').value.trim();
    markDirty();
    renderArchitecture();
    closeModal();
    showToast('Updated', 'success');
  });
}

function addDirectory() {
  openModal('Add Directory', `
    <div class="form-group">
      <label>Path</label>
      <input type="text" id="dir-path" placeholder="src/components">
    </div>
    <div class="form-group">
      <label>Description</label>
      <input type="text" id="dir-desc" placeholder="What's in this directory?">
    </div>
  `, () => {
    const path = $('#dir-path').value.trim();
    if (!path) { showToast('Path required', 'error'); return; }
    if (!App.state.architecture.directories) App.state.architecture.directories = [];
    App.state.architecture.directories.push({ path, description: $('#dir-desc').value.trim() });
    markDirty();
    renderArchitecture();
    closeModal();
    showToast('Directory added', 'success');
  });
}

function editDirectory(idx) {
  const dir = App.state.architecture.directories[idx];
  openModal('Edit Directory', `
    <div class="form-group">
      <label>Path</label>
      <input type="text" id="dir-path" value="${escapeHtml(dir.path)}">
    </div>
    <div class="form-group">
      <label>Description</label>
      <input type="text" id="dir-desc" value="${escapeHtml(dir.description || '')}">
    </div>
  `, () => {
    dir.path = $('#dir-path').value.trim();
    dir.description = $('#dir-desc').value.trim();
    markDirty();
    renderArchitecture();
    closeModal();
    showToast('Directory updated', 'success');
  });
}

function deleteDirectory(idx) {
  showConfirm('Delete this directory?', () => {
    App.state.architecture.directories.splice(idx, 1);
    markDirty();
    renderArchitecture();
  });
}

function editBoundary() {
  openModal('Edit Frontend/Backend Boundary', `
    <div class="form-group">
      <label>Description</label>
      <textarea id="boundary-text" rows="4">${escapeHtml(App.state.architecture.frontendBackendBoundary || '')}</textarea>
    </div>
  `, () => {
    App.state.architecture.frontendBackendBoundary = $('#boundary-text').value.trim();
    markDirty();
    renderArchitecture();
    closeModal();
    showToast('Updated', 'success');
  });
}

function editOfflineSupport() {
  openModal('Edit Offline Support', `
    <div class="form-group">
      <label>Description</label>
      <textarea id="offline-text" rows="4">${escapeHtml(App.state.architecture.offlineSupport || '')}</textarea>
    </div>
  `, () => {
    App.state.architecture.offlineSupport = $('#offline-text').value.trim();
    markDirty();
    renderArchitecture();
    closeModal();
    showToast('Updated', 'success');
  });
}

function editObservability() {
  const obs = App.state.architecture.observability || {};
  openModal('Edit Observability', `
    <div class="form-group">
      <label>Error Tracking</label>
      <input type="text" id="obs-error" value="${escapeHtml(obs.errorTracking || '')}">
    </div>
    <div class="form-group">
      <label>Analytics</label>
      <input type="text" id="obs-analytics" value="${escapeHtml(obs.analytics || '')}">
    </div>
    <div class="form-group">
      <label>Crash Reporting</label>
      <input type="text" id="obs-crash" value="${escapeHtml(obs.crashReporting || '')}">
    </div>
    <div class="form-group">
      <label>Diagnostics</label>
      <input type="text" id="obs-diag" value="${escapeHtml(obs.diagnostics || '')}">
    </div>
  `, () => {
    App.state.architecture.observability = {
      errorTracking: $('#obs-error').value.trim(),
      analytics: $('#obs-analytics').value.trim(),
      crashReporting: $('#obs-crash').value.trim(),
      diagnostics: $('#obs-diag').value.trim()
    };
    markDirty();
    renderArchitecture();
    closeModal();
    showToast('Updated', 'success');
  });
}

// ============================================
// RENDER: TECH TAB
// ============================================
function renderTech() {
  const t = App.state.tech;
  const container = $('#panel-tech');
  if (!container) return;

  container.innerHTML = `
    <!-- Tech Stack -->
    <div class="card">
      <div class="card-header">
        <h3>Tech Stack</h3>
        <button class="btn btn-sm btn-primary" onclick="addTechItem()">+ Add</button>
      </div>
      <div class="card-body">
        <table class="data-table">
          <thead>
            <tr><th>Technology</th><th>Version</th><th>Notes</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${(t.stack || []).map((item, idx) => `
              <tr>
                <td><strong>${escapeHtml(item.name)}</strong></td>
                <td><code>${escapeHtml(item.version || '-')}</code></td>
                <td>${escapeHtml(item.notes || '-')}</td>
                <td>
                  <button class="btn-icon" onclick="editTechItem(${idx})">✏️</button>
                  <button class="btn-icon" onclick="deleteTechItem(${idx})">🗑️</button>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="4" class="empty-state">No tech stack defined</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- SDKs/Services -->
    <div class="card">
      <div class="card-header">
        <h3>SDKs & Services</h3>
        <button class="btn btn-sm btn-primary" onclick="addSdk()">+ Add</button>
      </div>
      <div class="card-body">
        <table class="data-table">
          <thead>
            <tr><th>Name</th><th>Purpose</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${(t.sdks || []).map((sdk, idx) => `
              <tr>
                <td><strong>${escapeHtml(sdk.name)}</strong></td>
                <td>${escapeHtml(sdk.purpose)}</td>
                <td>
                  <button class="btn-icon" onclick="editSdk(${idx})">✏️</button>
                  <button class="btn-icon" onclick="deleteSdk(${idx})">🗑️</button>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="3" class="empty-state">No SDKs defined</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Environment Keys -->
    <div class="card">
      <div class="card-header">
        <h3>Environment Variables</h3>
        <button class="btn btn-sm btn-primary" onclick="addEnvKey()">+ Add</button>
      </div>
      <div class="card-body">
        <div class="env-keys-list">
          ${(t.envKeys || []).map((key, idx) => `
            <div class="env-key-item">
              <code>${escapeHtml(key)}</code>
              <button class="btn-icon" onclick="deleteEnvKey(${idx})">🗑️</button>
            </div>
          `).join('') || '<div class="empty-state">No env keys documented</div>'}
        </div>
        <p class="help-text">Note: Only key names are stored, never values.</p>
      </div>
    </div>
  `;
}

// Tech CRUD
function addTechItem() {
  openModal('Add Technology', `
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="tech-name" placeholder="e.g., React Native">
    </div>
    <div class="form-group">
      <label>Version</label>
      <input type="text" id="tech-version" placeholder="e.g., 0.74.0">
    </div>
    <div class="form-group">
      <label>Notes</label>
      <input type="text" id="tech-notes" placeholder="Additional info">
    </div>
  `, () => {
    const name = $('#tech-name').value.trim();
    if (!name) { showToast('Name required', 'error'); return; }
    if (!App.state.tech.stack) App.state.tech.stack = [];
    App.state.tech.stack.push({
      name,
      version: $('#tech-version').value.trim(),
      notes: $('#tech-notes').value.trim()
    });
    markDirty();
    renderTech();
    closeModal();
    showToast('Technology added', 'success');
  });
}

function editTechItem(idx) {
  const item = App.state.tech.stack[idx];
  openModal('Edit Technology', `
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="tech-name" value="${escapeHtml(item.name)}">
    </div>
    <div class="form-group">
      <label>Version</label>
      <input type="text" id="tech-version" value="${escapeHtml(item.version || '')}">
    </div>
    <div class="form-group">
      <label>Notes</label>
      <input type="text" id="tech-notes" value="${escapeHtml(item.notes || '')}">
    </div>
  `, () => {
    item.name = $('#tech-name').value.trim();
    item.version = $('#tech-version').value.trim();
    item.notes = $('#tech-notes').value.trim();
    markDirty();
    renderTech();
    closeModal();
    showToast('Technology updated', 'success');
  });
}

function deleteTechItem(idx) {
  showConfirm('Delete this technology?', () => {
    App.state.tech.stack.splice(idx, 1);
    markDirty();
    renderTech();
  });
}

function addSdk() {
  openModal('Add SDK/Service', `
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="sdk-name" placeholder="e.g., Firebase">
    </div>
    <div class="form-group">
      <label>Purpose</label>
      <input type="text" id="sdk-purpose" placeholder="What is it used for?">
    </div>
  `, () => {
    const name = $('#sdk-name').value.trim();
    if (!name) { showToast('Name required', 'error'); return; }
    if (!App.state.tech.sdks) App.state.tech.sdks = [];
    App.state.tech.sdks.push({ name, purpose: $('#sdk-purpose').value.trim() });
    markDirty();
    renderTech();
    closeModal();
    showToast('SDK added', 'success');
  });
}

function editSdk(idx) {
  const sdk = App.state.tech.sdks[idx];
  openModal('Edit SDK/Service', `
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="sdk-name" value="${escapeHtml(sdk.name)}">
    </div>
    <div class="form-group">
      <label>Purpose</label>
      <input type="text" id="sdk-purpose" value="${escapeHtml(sdk.purpose || '')}">
    </div>
  `, () => {
    sdk.name = $('#sdk-name').value.trim();
    sdk.purpose = $('#sdk-purpose').value.trim();
    markDirty();
    renderTech();
    closeModal();
    showToast('SDK updated', 'success');
  });
}

function deleteSdk(idx) {
  showConfirm('Delete this SDK?', () => {
    App.state.tech.sdks.splice(idx, 1);
    markDirty();
    renderTech();
  });
}

function addEnvKey() {
  openModal('Add Environment Variable', `
    <div class="form-group">
      <label>Variable Name</label>
      <input type="text" id="env-key-name" placeholder="e.g., FIREBASE_API_KEY">
    </div>
  `, () => {
    const name = $('#env-key-name').value.trim();
    if (!name) { showToast('Name required', 'error'); return; }
    if (!App.state.tech.envKeys) App.state.tech.envKeys = [];
    App.state.tech.envKeys.push(name);
    markDirty();
    renderTech();
    closeModal();
    showToast('Env key added', 'success');
  });
}

function deleteEnvKey(idx) {
  App.state.tech.envKeys.splice(idx, 1);
  markDirty();
  renderTech();
}

// ============================================
// RENDER: FIREBASE TAB
// ============================================
function renderFirebase() {
  const f = App.state.firebase;
  const container = $('#panel-firebase');
  if (!container) return;

  container.innerHTML = `
    <!-- Project Info -->
    <div class="card">
      <div class="card-header">
        <h3>Project Info</h3>
        <button class="btn btn-sm btn-secondary" onclick="editFirebaseProject()">Edit</button>
      </div>
      <div class="card-body">
        <div class="stat-row">
          <span class="stat-label">Project ID</span>
          <span class="stat-value"><code>${escapeHtml(f.projectId) || '-'}</code></span>
        </div>
      </div>
    </div>

    <!-- Collections -->
    <div class="card">
      <div class="card-header">
        <h3>Collections</h3>
        <button class="btn btn-sm btn-primary" onclick="addCollection()">+ Add</button>
      </div>
      <div class="card-body">
        <div class="collections-list">
          ${(f.collections || []).map((col, idx) => `
            <div class="collection-item">
              <div class="collection-header">
                <code>${escapeHtml(col.name)}</code>
                <div class="item-actions">
                  <button class="btn-icon" onclick="editCollection(${idx})">✏️</button>
                  <button class="btn-icon" onclick="deleteCollection(${idx})">🗑️</button>
                </div>
              </div>
              <p>${escapeHtml(col.description)}</p>
              ${col.indexes?.length ? `<div class="collection-indexes">Indexes: ${col.indexes.map(i => `<code>${escapeHtml(i)}</code>`).join(', ')}</div>` : ''}
            </div>
          `).join('') || '<div class="empty-state">No collections documented</div>'}
        </div>
      </div>
    </div>

    <!-- Security Rules Notes -->
    <div class="card">
      <div class="card-header">
        <h3>Security Rules Notes</h3>
        <button class="btn btn-sm btn-secondary" onclick="editRulesNotes()">Edit</button>
      </div>
      <div class="card-body">
        <pre class="rules-notes">${escapeHtml(f.rulesNotes) || 'No notes'}</pre>
      </div>
    </div>

    <!-- Common Errors -->
    <div class="card">
      <div class="card-header">
        <h3>Common Errors</h3>
        <button class="btn btn-sm btn-primary" onclick="addCommonError()">+ Add</button>
      </div>
      <div class="card-body">
        <div class="errors-list">
          ${(f.commonErrors || []).map((err, idx) => `
            <div class="error-item">
              <div class="error-code"><code>${escapeHtml(err.code)}</code></div>
              <div class="error-cause"><strong>Cause:</strong> ${escapeHtml(err.cause)}</div>
              <div class="error-fix"><strong>Fix:</strong> ${escapeHtml(err.fix)}</div>
              <div class="item-actions">
                <button class="btn-icon" onclick="editCommonError(${idx})">✏️</button>
                <button class="btn-icon" onclick="deleteCommonError(${idx})">🗑️</button>
              </div>
            </div>
          `).join('') || '<div class="empty-state">No errors documented</div>'}
        </div>
      </div>
    </div>

    <!-- Feature Flags -->
    <div class="card">
      <div class="card-header">
        <h3>Feature Flags</h3>
        <button class="btn btn-sm btn-primary" onclick="addFeatureFlag()">+ Add</button>
      </div>
      <div class="card-body">
        <table class="data-table">
          <thead>
            <tr><th>Key</th><th>Description</th><th>Default</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${(f.featureFlags || []).map((flag, idx) => `
              <tr>
                <td><code>${escapeHtml(flag.key)}</code></td>
                <td>${escapeHtml(flag.description)}</td>
                <td><span class="badge ${flag.default ? 'badge-success' : 'badge-secondary'}">${flag.default ? 'ON' : 'OFF'}</span></td>
                <td>
                  <button class="btn-icon" onclick="editFeatureFlag(${idx})">✏️</button>
                  <button class="btn-icon" onclick="deleteFeatureFlag(${idx})">🗑️</button>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="4" class="empty-state">No feature flags</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Debug Recipes -->
    <div class="card">
      <div class="card-header">
        <h3>Debug Recipes</h3>
        <button class="btn btn-sm btn-primary" onclick="addDebugRecipe()">+ Add</button>
      </div>
      <div class="card-body">
        <div class="recipes-list">
          ${(f.debugRecipes || []).map((recipe, idx) => `
            <div class="recipe-item">
              <div class="recipe-header">
                <strong>${escapeHtml(recipe.name)}</strong>
                <div class="item-actions">
                  <button class="btn-icon" onclick="editDebugRecipe(${idx})">✏️</button>
                  <button class="btn-icon" onclick="deleteDebugRecipe(${idx})">🗑️</button>
                </div>
              </div>
              <ol class="recipe-steps">
                ${(recipe.steps || []).map(step => `<li>${escapeHtml(step)}</li>`).join('')}
              </ol>
            </div>
          `).join('') || '<div class="empty-state">No debug recipes</div>'}
        </div>
      </div>
    </div>
  `;
}

// Firebase CRUD
function editFirebaseProject() {
  openModal('Edit Firebase Project', `
    <div class="form-group">
      <label>Project ID</label>
      <input type="text" id="fb-project-id" value="${escapeHtml(App.state.firebase.projectId || '')}">
    </div>
  `, () => {
    App.state.firebase.projectId = $('#fb-project-id').value.trim();
    markDirty();
    renderFirebase();
    closeModal();
    showToast('Updated', 'success');
  });
}

function addCollection() {
  openModal('Add Collection', `
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="col-name" placeholder="e.g., users">
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="col-desc" rows="3"></textarea>
    </div>
    <div class="form-group">
      <label>Indexes (comma-separated)</label>
      <input type="text" id="col-indexes" placeholder="userId, createdAt">
    </div>
  `, () => {
    const name = $('#col-name').value.trim();
    if (!name) { showToast('Name required', 'error'); return; }
    if (!App.state.firebase.collections) App.state.firebase.collections = [];
    App.state.firebase.collections.push({
      name,
      description: $('#col-desc').value.trim(),
      indexes: $('#col-indexes').value.split(',').map(s => s.trim()).filter(Boolean)
    });
    markDirty();
    renderFirebase();
    closeModal();
    showToast('Collection added', 'success');
  });
}

function editCollection(idx) {
  const col = App.state.firebase.collections[idx];
  openModal('Edit Collection', `
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="col-name" value="${escapeHtml(col.name)}">
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="col-desc" rows="3">${escapeHtml(col.description || '')}</textarea>
    </div>
    <div class="form-group">
      <label>Indexes (comma-separated)</label>
      <input type="text" id="col-indexes" value="${(col.indexes || []).join(', ')}">
    </div>
  `, () => {
    col.name = $('#col-name').value.trim();
    col.description = $('#col-desc').value.trim();
    col.indexes = $('#col-indexes').value.split(',').map(s => s.trim()).filter(Boolean);
    markDirty();
    renderFirebase();
    closeModal();
    showToast('Collection updated', 'success');
  });
}

function deleteCollection(idx) {
  showConfirm('Delete this collection?', () => {
    App.state.firebase.collections.splice(idx, 1);
    markDirty();
    renderFirebase();
  });
}

function editRulesNotes() {
  openModal('Edit Security Rules Notes', `
    <div class="form-group">
      <label>Notes</label>
      <textarea id="rules-notes" rows="8">${escapeHtml(App.state.firebase.rulesNotes || '')}</textarea>
    </div>
  `, () => {
    App.state.firebase.rulesNotes = $('#rules-notes').value.trim();
    markDirty();
    renderFirebase();
    closeModal();
    showToast('Updated', 'success');
  });
}

function addCommonError() {
  openModal('Add Common Error', `
    <div class="form-group">
      <label>Error Code</label>
      <input type="text" id="err-code" placeholder="e.g., PERMISSION_DENIED">
    </div>
    <div class="form-group">
      <label>Cause</label>
      <textarea id="err-cause" rows="2"></textarea>
    </div>
    <div class="form-group">
      <label>Fix</label>
      <textarea id="err-fix" rows="2"></textarea>
    </div>
  `, () => {
    const code = $('#err-code').value.trim();
    if (!code) { showToast('Code required', 'error'); return; }
    if (!App.state.firebase.commonErrors) App.state.firebase.commonErrors = [];
    App.state.firebase.commonErrors.push({
      code,
      cause: $('#err-cause').value.trim(),
      fix: $('#err-fix').value.trim()
    });
    markDirty();
    renderFirebase();
    closeModal();
    showToast('Error added', 'success');
  });
}

function editCommonError(idx) {
  const err = App.state.firebase.commonErrors[idx];
  openModal('Edit Common Error', `
    <div class="form-group">
      <label>Error Code</label>
      <input type="text" id="err-code" value="${escapeHtml(err.code)}">
    </div>
    <div class="form-group">
      <label>Cause</label>
      <textarea id="err-cause" rows="2">${escapeHtml(err.cause || '')}</textarea>
    </div>
    <div class="form-group">
      <label>Fix</label>
      <textarea id="err-fix" rows="2">${escapeHtml(err.fix || '')}</textarea>
    </div>
  `, () => {
    err.code = $('#err-code').value.trim();
    err.cause = $('#err-cause').value.trim();
    err.fix = $('#err-fix').value.trim();
    markDirty();
    renderFirebase();
    closeModal();
    showToast('Error updated', 'success');
  });
}

function deleteCommonError(idx) {
  showConfirm('Delete this error?', () => {
    App.state.firebase.commonErrors.splice(idx, 1);
    markDirty();
    renderFirebase();
  });
}

function addFeatureFlag() {
  openModal('Add Feature Flag', `
    <div class="form-group">
      <label>Key</label>
      <input type="text" id="ff-key" placeholder="e.g., enable_new_feature">
    </div>
    <div class="form-group">
      <label>Description</label>
      <input type="text" id="ff-desc" placeholder="What does this flag control?">
    </div>
    <div class="form-group">
      <label>Default Value</label>
      <select id="ff-default">
        <option value="false">OFF</option>
        <option value="true">ON</option>
      </select>
    </div>
  `, () => {
    const key = $('#ff-key').value.trim();
    if (!key) { showToast('Key required', 'error'); return; }
    if (!App.state.firebase.featureFlags) App.state.firebase.featureFlags = [];
    App.state.firebase.featureFlags.push({
      key,
      description: $('#ff-desc').value.trim(),
      default: $('#ff-default').value === 'true'
    });
    markDirty();
    renderFirebase();
    closeModal();
    showToast('Flag added', 'success');
  });
}

function editFeatureFlag(idx) {
  const flag = App.state.firebase.featureFlags[idx];
  openModal('Edit Feature Flag', `
    <div class="form-group">
      <label>Key</label>
      <input type="text" id="ff-key" value="${escapeHtml(flag.key)}">
    </div>
    <div class="form-group">
      <label>Description</label>
      <input type="text" id="ff-desc" value="${escapeHtml(flag.description || '')}">
    </div>
    <div class="form-group">
      <label>Default Value</label>
      <select id="ff-default">
        <option value="false" ${!flag.default ? 'selected' : ''}>OFF</option>
        <option value="true" ${flag.default ? 'selected' : ''}>ON</option>
      </select>
    </div>
  `, () => {
    flag.key = $('#ff-key').value.trim();
    flag.description = $('#ff-desc').value.trim();
    flag.default = $('#ff-default').value === 'true';
    markDirty();
    renderFirebase();
    closeModal();
    showToast('Flag updated', 'success');
  });
}

function deleteFeatureFlag(idx) {
  showConfirm('Delete this flag?', () => {
    App.state.firebase.featureFlags.splice(idx, 1);
    markDirty();
    renderFirebase();
  });
}

function addDebugRecipe() {
  openModal('Add Debug Recipe', `
    <div class="form-group">
      <label>Recipe Name</label>
      <input type="text" id="recipe-name" placeholder="e.g., Check Auth State">
    </div>
    <div class="form-group">
      <label>Steps (one per line)</label>
      <textarea id="recipe-steps" rows="6"></textarea>
    </div>
  `, () => {
    const name = $('#recipe-name').value.trim();
    if (!name) { showToast('Name required', 'error'); return; }
    if (!App.state.firebase.debugRecipes) App.state.firebase.debugRecipes = [];
    App.state.firebase.debugRecipes.push({
      name,
      steps: $('#recipe-steps').value.split('\n').map(s => s.trim()).filter(Boolean)
    });
    markDirty();
    renderFirebase();
    closeModal();
    showToast('Recipe added', 'success');
  });
}

function editDebugRecipe(idx) {
  const recipe = App.state.firebase.debugRecipes[idx];
  openModal('Edit Debug Recipe', `
    <div class="form-group">
      <label>Recipe Name</label>
      <input type="text" id="recipe-name" value="${escapeHtml(recipe.name)}">
    </div>
    <div class="form-group">
      <label>Steps (one per line)</label>
      <textarea id="recipe-steps" rows="6">${(recipe.steps || []).join('\n')}</textarea>
    </div>
  `, () => {
    recipe.name = $('#recipe-name').value.trim();
    recipe.steps = $('#recipe-steps').value.split('\n').map(s => s.trim()).filter(Boolean);
    markDirty();
    renderFirebase();
    closeModal();
    showToast('Recipe updated', 'success');
  });
}

function deleteDebugRecipe(idx) {
  showConfirm('Delete this recipe?', () => {
    App.state.firebase.debugRecipes.splice(idx, 1);
    markDirty();
    renderFirebase();
  });
}

// ============================================
// RENDER: PAYMENTS TAB
// ============================================
function renderPayments() {
  const p = App.state.payments;
  const container = $('#panel-payments');
  if (!container) return;

  container.innerHTML = `
    <!-- Payment Info -->
    <div class="card">
      <div class="card-header">
        <h3>Payment Provider</h3>
        <button class="btn btn-sm btn-secondary" onclick="editPaymentProvider()">Edit</button>
      </div>
      <div class="card-body">
        <div class="stat-row">
          <span class="stat-label">Provider</span>
          <span class="stat-value">${escapeHtml(p.provider) || '-'}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Environment</span>
          <span class="stat-value"><span class="badge ${p.environment === 'production' ? 'badge-danger' : 'badge-warning'}">${p.environment || 'sandbox'}</span></span>
        </div>
      </div>
    </div>

    <!-- Payment Flow -->
    <div class="card">
      <div class="card-header">
        <h3>Payment Flow</h3>
        <button class="btn btn-sm btn-primary" onclick="addPaymentStep()">+ Add Step</button>
      </div>
      <div class="card-body">
        <div class="flow-list">
          ${(p.flow || []).map((step, idx) => `
            <div class="flow-step-item">
              <span class="step-number">${step.step}</span>
              <div class="step-content">
                <strong>${escapeHtml(step.action)}</strong>
                ${step.endpoint ? `<code>${escapeHtml(step.endpoint)}</code>` : ''}
              </div>
              <div class="item-actions">
                <button class="btn-icon" onclick="editPaymentStep(${idx})">✏️</button>
                <button class="btn-icon" onclick="deletePaymentStep(${idx})">🗑️</button>
              </div>
            </div>
          `).join('') || '<div class="empty-state">No payment flow documented</div>'}
        </div>
      </div>
    </div>

    <!-- Plans -->
    <div class="card">
      <div class="card-header">
        <h3>Subscription Plans</h3>
        <button class="btn btn-sm btn-primary" onclick="addPlan()">+ Add Plan</button>
      </div>
      <div class="card-body">
        <div class="plans-grid">
          ${(p.plans || []).map((plan, idx) => `
            <div class="plan-card">
              <div class="plan-header">
                <h4>${escapeHtml(plan.name)}</h4>
                <div class="plan-price">${plan.price} TL</div>
              </div>
              <ul class="plan-features">
                ${(plan.features || []).map(f => `<li>${escapeHtml(f)}</li>`).join('')}
              </ul>
              ${plan.commission ? `<div class="plan-commission">Commission: ${escapeHtml(plan.commission)}</div>` : ''}
              <div class="item-actions">
                <button class="btn btn-sm btn-secondary" onclick="editPlan(${idx})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deletePlan(${idx})">Delete</button>
              </div>
            </div>
          `).join('') || '<div class="empty-state">No plans defined</div>'}
        </div>
      </div>
    </div>

    <!-- Risk Notes -->
    <div class="card">
      <div class="card-header">
        <h3>Risk Notes</h3>
        <button class="btn btn-sm btn-primary" onclick="addRiskNote()">+ Add</button>
      </div>
      <div class="card-body">
        <ul class="risk-notes-list">
          ${(p.riskNotes || []).map((note, idx) => `
            <li>
              ${escapeHtml(note)}
              <button class="btn-icon" onclick="deleteRiskNote(${idx})">×</button>
            </li>
          `).join('') || '<li class="empty-state">No risk notes</li>'}
        </ul>
      </div>
    </div>

    <!-- Test Cards -->
    <div class="card">
      <div class="card-header">
        <h3>Test Cards</h3>
        <button class="btn btn-sm btn-primary" onclick="addTestCard()">+ Add</button>
      </div>
      <div class="card-body">
        <table class="data-table">
          <thead>
            <tr><th>Type</th><th>Number</th><th>Expiry</th><th>CVV</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${(p.testCards || []).map((card, idx) => `
              <tr>
                <td>${escapeHtml(card.type)}</td>
                <td><code>${escapeHtml(card.number)}</code> <button class="btn-icon btn-copy" onclick="copyToClipboard('${card.number}')">📋</button></td>
                <td>${escapeHtml(card.expiry)}</td>
                <td>${escapeHtml(card.cvv)}</td>
                <td>
                  <button class="btn-icon" onclick="editTestCard(${idx})">✏️</button>
                  <button class="btn-icon" onclick="deleteTestCard(${idx})">🗑️</button>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="5" class="empty-state">No test cards</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Payments CRUD
function editPaymentProvider() {
  const p = App.state.payments;
  openModal('Edit Payment Provider', `
    <div class="form-group">
      <label>Provider</label>
      <input type="text" id="pay-provider" value="${escapeHtml(p.provider || '')}">
    </div>
    <div class="form-group">
      <label>Environment</label>
      <select id="pay-env">
        <option value="sandbox" ${p.environment !== 'production' ? 'selected' : ''}>Sandbox</option>
        <option value="production" ${p.environment === 'production' ? 'selected' : ''}>Production</option>
      </select>
    </div>
  `, () => {
    App.state.payments.provider = $('#pay-provider').value.trim();
    App.state.payments.environment = $('#pay-env').value;
    markDirty();
    renderPayments();
    closeModal();
    showToast('Updated', 'success');
  });
}

function addPaymentStep() {
  const nextStep = (App.state.payments.flow?.length || 0) + 1;
  openModal('Add Payment Step', `
    <div class="form-group">
      <label>Step Number</label>
      <input type="number" id="step-num" value="${nextStep}">
    </div>
    <div class="form-group">
      <label>Action</label>
      <input type="text" id="step-action" placeholder="e.g., Initialize payment">
    </div>
    <div class="form-group">
      <label>Endpoint (optional)</label>
      <input type="text" id="step-endpoint" placeholder="/api/payment/init">
    </div>
  `, () => {
    const action = $('#step-action').value.trim();
    if (!action) { showToast('Action required', 'error'); return; }
    if (!App.state.payments.flow) App.state.payments.flow = [];
    App.state.payments.flow.push({
      step: parseInt($('#step-num').value) || nextStep,
      action,
      endpoint: $('#step-endpoint').value.trim()
    });
    App.state.payments.flow.sort((a, b) => a.step - b.step);
    markDirty();
    renderPayments();
    closeModal();
    showToast('Step added', 'success');
  });
}

function editPaymentStep(idx) {
  const step = App.state.payments.flow[idx];
  openModal('Edit Payment Step', `
    <div class="form-group">
      <label>Step Number</label>
      <input type="number" id="step-num" value="${step.step}">
    </div>
    <div class="form-group">
      <label>Action</label>
      <input type="text" id="step-action" value="${escapeHtml(step.action)}">
    </div>
    <div class="form-group">
      <label>Endpoint (optional)</label>
      <input type="text" id="step-endpoint" value="${escapeHtml(step.endpoint || '')}">
    </div>
  `, () => {
    step.step = parseInt($('#step-num').value);
    step.action = $('#step-action').value.trim();
    step.endpoint = $('#step-endpoint').value.trim();
    App.state.payments.flow.sort((a, b) => a.step - b.step);
    markDirty();
    renderPayments();
    closeModal();
    showToast('Step updated', 'success');
  });
}

function deletePaymentStep(idx) {
  showConfirm('Delete this step?', () => {
    App.state.payments.flow.splice(idx, 1);
    markDirty();
    renderPayments();
  });
}

function addPlan() {
  openModal('Add Subscription Plan', `
    <div class="form-group">
      <label>Plan Name</label>
      <input type="text" id="plan-name" placeholder="e.g., Premium">
    </div>
    <div class="form-group">
      <label>Price (TL)</label>
      <input type="number" id="plan-price" placeholder="99">
    </div>
    <div class="form-group">
      <label>Features (one per line)</label>
      <textarea id="plan-features" rows="4"></textarea>
    </div>
    <div class="form-group">
      <label>Commission</label>
      <input type="text" id="plan-commission" placeholder="e.g., 5%">
    </div>
  `, () => {
    const name = $('#plan-name').value.trim();
    if (!name) { showToast('Name required', 'error'); return; }
    if (!App.state.payments.plans) App.state.payments.plans = [];
    App.state.payments.plans.push({
      name,
      price: parseFloat($('#plan-price').value) || 0,
      features: $('#plan-features').value.split('\n').map(s => s.trim()).filter(Boolean),
      commission: $('#plan-commission').value.trim()
    });
    markDirty();
    renderPayments();
    closeModal();
    showToast('Plan added', 'success');
  });
}

function editPlan(idx) {
  const plan = App.state.payments.plans[idx];
  openModal('Edit Subscription Plan', `
    <div class="form-group">
      <label>Plan Name</label>
      <input type="text" id="plan-name" value="${escapeHtml(plan.name)}">
    </div>
    <div class="form-group">
      <label>Price (TL)</label>
      <input type="number" id="plan-price" value="${plan.price || 0}">
    </div>
    <div class="form-group">
      <label>Features (one per line)</label>
      <textarea id="plan-features" rows="4">${(plan.features || []).join('\n')}</textarea>
    </div>
    <div class="form-group">
      <label>Commission</label>
      <input type="text" id="plan-commission" value="${escapeHtml(plan.commission || '')}">
    </div>
  `, () => {
    plan.name = $('#plan-name').value.trim();
    plan.price = parseFloat($('#plan-price').value) || 0;
    plan.features = $('#plan-features').value.split('\n').map(s => s.trim()).filter(Boolean);
    plan.commission = $('#plan-commission').value.trim();
    markDirty();
    renderPayments();
    closeModal();
    showToast('Plan updated', 'success');
  });
}

function deletePlan(idx) {
  showConfirm('Delete this plan?', () => {
    App.state.payments.plans.splice(idx, 1);
    markDirty();
    renderPayments();
  });
}

function addRiskNote() {
  openModal('Add Risk Note', `
    <div class="form-group">
      <label>Note</label>
      <textarea id="risk-note" rows="3"></textarea>
    </div>
  `, () => {
    const note = $('#risk-note').value.trim();
    if (!note) { showToast('Note required', 'error'); return; }
    if (!App.state.payments.riskNotes) App.state.payments.riskNotes = [];
    App.state.payments.riskNotes.push(note);
    markDirty();
    renderPayments();
    closeModal();
    showToast('Risk note added', 'success');
  });
}

function deleteRiskNote(idx) {
  App.state.payments.riskNotes.splice(idx, 1);
  markDirty();
  renderPayments();
}

function addTestCard() {
  openModal('Add Test Card', `
    <div class="form-group">
      <label>Type</label>
      <input type="text" id="card-type" placeholder="e.g., Visa, Mastercard">
    </div>
    <div class="form-group">
      <label>Number</label>
      <input type="text" id="card-number" placeholder="4111111111111111">
    </div>
    <div class="form-group">
      <label>Expiry</label>
      <input type="text" id="card-expiry" placeholder="12/25">
    </div>
    <div class="form-group">
      <label>CVV</label>
      <input type="text" id="card-cvv" placeholder="123">
    </div>
  `, () => {
    const number = $('#card-number').value.trim();
    if (!number) { showToast('Number required', 'error'); return; }
    if (!App.state.payments.testCards) App.state.payments.testCards = [];
    App.state.payments.testCards.push({
      type: $('#card-type').value.trim(),
      number,
      expiry: $('#card-expiry').value.trim(),
      cvv: $('#card-cvv').value.trim()
    });
    markDirty();
    renderPayments();
    closeModal();
    showToast('Test card added', 'success');
  });
}

function editTestCard(idx) {
  const card = App.state.payments.testCards[idx];
  openModal('Edit Test Card', `
    <div class="form-group">
      <label>Type</label>
      <input type="text" id="card-type" value="${escapeHtml(card.type || '')}">
    </div>
    <div class="form-group">
      <label>Number</label>
      <input type="text" id="card-number" value="${escapeHtml(card.number)}">
    </div>
    <div class="form-group">
      <label>Expiry</label>
      <input type="text" id="card-expiry" value="${escapeHtml(card.expiry || '')}">
    </div>
    <div class="form-group">
      <label>CVV</label>
      <input type="text" id="card-cvv" value="${escapeHtml(card.cvv || '')}">
    </div>
  `, () => {
    card.type = $('#card-type').value.trim();
    card.number = $('#card-number').value.trim();
    card.expiry = $('#card-expiry').value.trim();
    card.cvv = $('#card-cvv').value.trim();
    markDirty();
    renderPayments();
    closeModal();
    showToast('Test card updated', 'success');
  });
}

function deleteTestCard(idx) {
  showConfirm('Delete this test card?', () => {
    App.state.payments.testCards.splice(idx, 1);
    markDirty();
    renderPayments();
  });
}

// ============================================
// RENDER: ADMIN TAB
// ============================================
function renderAdmin() {
  const a = App.state.adminPortal;
  const container = $('#panel-admin');
  if (!container) return;

  container.innerHTML = `
    <!-- Framework Info -->
    <div class="card">
      <div class="card-header">
        <h3>Admin Portal Info</h3>
        <button class="btn btn-sm btn-secondary" onclick="editAdminInfo()">Edit</button>
      </div>
      <div class="card-body">
        <div class="stat-row">
          <span class="stat-label">Framework</span>
          <span class="stat-value">${escapeHtml(a.framework) || '-'}</span>
        </div>
      </div>
    </div>

    <!-- Routes -->
    <div class="card">
      <div class="card-header">
        <h3>Routes</h3>
        <button class="btn btn-sm btn-primary" onclick="addAdminRoute()">+ Add Route</button>
      </div>
      <div class="card-body">
        <table class="data-table">
          <thead>
            <tr><th>Path</th><th>Description</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${(a.routes || []).map((route, idx) => `
              <tr>
                <td><code>${escapeHtml(route.path)}</code></td>
                <td>${escapeHtml(route.description)}</td>
                <td>
                  <button class="btn-icon" onclick="editAdminRoute(${idx})">✏️</button>
                  <button class="btn-icon" onclick="deleteAdminRoute(${idx})">🗑️</button>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="3" class="empty-state">No routes documented</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Permissions -->
    <div class="card">
      <div class="card-header">
        <h3>Admin Permissions</h3>
        <button class="btn btn-sm btn-primary" onclick="addAdminPermission()">+ Add</button>
      </div>
      <div class="card-body">
        <div class="permissions-list">
          ${(a.permissions || []).map((perm, idx) => `
            <span class="permission-badge">
              ${escapeHtml(perm)}
              <button class="btn-icon" onclick="deleteAdminPermission(${idx})">×</button>
            </span>
          `).join('') || '<div class="empty-state">No permissions defined</div>'}
        </div>
      </div>
    </div>

    <!-- Support Operations -->
    <div class="card">
      <div class="card-header">
        <h3>Support Operations</h3>
        <button class="btn btn-sm btn-primary" onclick="addSupportOp()">+ Add</button>
      </div>
      <div class="card-body">
        <ul class="support-ops-list">
          ${(a.supportOperations || []).map((op, idx) => `
            <li>
              ${escapeHtml(op)}
              <button class="btn-icon" onclick="deleteSupportOp(${idx})">×</button>
            </li>
          `).join('') || '<li class="empty-state">No support operations</li>'}
        </ul>
      </div>
    </div>
  `;
}

// Admin CRUD
function editAdminInfo() {
  openModal('Edit Admin Portal Info', `
    <div class="form-group">
      <label>Framework</label>
      <input type="text" id="admin-framework" value="${escapeHtml(App.state.adminPortal.framework || '')}">
    </div>
  `, () => {
    App.state.adminPortal.framework = $('#admin-framework').value.trim();
    markDirty();
    renderAdmin();
    closeModal();
    showToast('Updated', 'success');
  });
}

function addAdminRoute() {
  openModal('Add Route', `
    <div class="form-group">
      <label>Path</label>
      <input type="text" id="route-path" placeholder="/admin/users">
    </div>
    <div class="form-group">
      <label>Description</label>
      <input type="text" id="route-desc" placeholder="What does this route do?">
    </div>
  `, () => {
    const path = $('#route-path').value.trim();
    if (!path) { showToast('Path required', 'error'); return; }
    if (!App.state.adminPortal.routes) App.state.adminPortal.routes = [];
    App.state.adminPortal.routes.push({ path, description: $('#route-desc').value.trim() });
    markDirty();
    renderAdmin();
    closeModal();
    showToast('Route added', 'success');
  });
}

function editAdminRoute(idx) {
  const route = App.state.adminPortal.routes[idx];
  openModal('Edit Route', `
    <div class="form-group">
      <label>Path</label>
      <input type="text" id="route-path" value="${escapeHtml(route.path)}">
    </div>
    <div class="form-group">
      <label>Description</label>
      <input type="text" id="route-desc" value="${escapeHtml(route.description || '')}">
    </div>
  `, () => {
    route.path = $('#route-path').value.trim();
    route.description = $('#route-desc').value.trim();
    markDirty();
    renderAdmin();
    closeModal();
    showToast('Route updated', 'success');
  });
}

function deleteAdminRoute(idx) {
  showConfirm('Delete this route?', () => {
    App.state.adminPortal.routes.splice(idx, 1);
    markDirty();
    renderAdmin();
  });
}

function addAdminPermission() {
  openModal('Add Permission', `
    <div class="form-group">
      <label>Permission</label>
      <input type="text" id="admin-perm" placeholder="e.g., manage_users">
    </div>
  `, () => {
    const perm = $('#admin-perm').value.trim();
    if (!perm) { showToast('Permission required', 'error'); return; }
    if (!App.state.adminPortal.permissions) App.state.adminPortal.permissions = [];
    App.state.adminPortal.permissions.push(perm);
    markDirty();
    renderAdmin();
    closeModal();
    showToast('Permission added', 'success');
  });
}

function deleteAdminPermission(idx) {
  App.state.adminPortal.permissions.splice(idx, 1);
  markDirty();
  renderAdmin();
}

function addSupportOp() {
  openModal('Add Support Operation', `
    <div class="form-group">
      <label>Operation</label>
      <input type="text" id="support-op" placeholder="e.g., Reset user password">
    </div>
  `, () => {
    const op = $('#support-op').value.trim();
    if (!op) { showToast('Operation required', 'error'); return; }
    if (!App.state.adminPortal.supportOperations) App.state.adminPortal.supportOperations = [];
    App.state.adminPortal.supportOperations.push(op);
    markDirty();
    renderAdmin();
    closeModal();
    showToast('Operation added', 'success');
  });
}

function deleteSupportOp(idx) {
  App.state.adminPortal.supportOperations.splice(idx, 1);
  markDirty();
  renderAdmin();
}

// ============================================
// RENDER: QA TAB
// ============================================
function renderQA() {
  const qa = App.state.qa;
  const screenshots = App.state.screenshots || [];
  const container = $('#panel-qa');
  if (!container) return;

  // Initialize filters
  if (!App.filters.qa) App.filters.qa = { tag: 'all', status: 'all' };
  if (!App.pagination.qa) App.pagination.qa = 1;

  // Get unique tags
  const allTags = [...new Set(screenshots.flatMap(s => s.tags || []))];

  // Filter screenshots
  let filtered = screenshots;
  if (App.filters.qa.tag !== 'all') {
    filtered = filtered.filter(s => s.tags?.includes(App.filters.qa.tag));
  }
  if (App.filters.qa.status !== 'all') {
    filtered = filtered.filter(s => s.status === App.filters.qa.status);
  }

  const paged = paginate(filtered, App.pagination.qa, 12);

  container.innerHTML = `
    <!-- Legacy Links -->
    <div class="card">
      <div class="card-header">
        <h3>Legacy Reports</h3>
      </div>
      <div class="card-body">
        <div class="legacy-buttons">
          <a href="${escapeHtml(qa.legacyReportPath || '../revizyon_raporu.html')}" target="_blank" class="btn btn-secondary">Open Legacy Report</a>
          <a href="../dev-dashboard.html" target="_blank" class="btn btn-secondary">Open Dev Dashboard</a>
        </div>
      </div>
    </div>

    <!-- Test Devices -->
    <div class="card">
      <div class="card-header">
        <h3>Test Devices</h3>
        <button class="btn btn-sm btn-primary" onclick="addTestDevice()">+ Add</button>
      </div>
      <div class="card-body">
        <table class="data-table">
          <thead>
            <tr><th>Device</th><th>OS</th><th>Resolution</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${(qa.testDevices || []).map((device, idx) => `
              <tr>
                <td>${escapeHtml(device.name)}</td>
                <td>${escapeHtml(device.os)}</td>
                <td>${escapeHtml(device.resolution)}</td>
                <td>
                  <button class="btn-icon" onclick="editTestDevice(${idx})">✏️</button>
                  <button class="btn-icon" onclick="deleteTestDevice(${idx})">🗑️</button>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="4" class="empty-state">No test devices</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Screenshots -->
    <div class="card">
      <div class="card-header">
        <h3>Screenshots</h3>
        <button class="btn btn-sm btn-primary" onclick="addScreenshot()">+ Add Screenshot</button>
      </div>
      <div class="card-body">
        <!-- Filters -->
        <div class="filters-row">
          <select id="qa-tag-filter" onchange="filterQA('tag', this.value)">
            <option value="all">All Tags</option>
            ${allTags.map(tag => `<option value="${escapeHtml(tag)}" ${App.filters.qa.tag === tag ? 'selected' : ''}>${escapeHtml(tag)}</option>`).join('')}
          </select>
          <select id="qa-status-filter" onchange="filterQA('status', this.value)">
            <option value="all">All Status</option>
            <option value="pending" ${App.filters.qa.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="approved" ${App.filters.qa.status === 'approved' ? 'selected' : ''}>Approved</option>
            <option value="rejected" ${App.filters.qa.status === 'rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </div>

        <!-- Screenshots Grid -->
        <div class="screenshots-grid">
          ${paged.items.map((ss, idx) => `
            <div class="screenshot-card" data-id="${ss.id}">
              <div class="screenshot-img" onclick="openScreenshotLightbox('${ss.id}')">
                <img src="${escapeHtml(ss.path)}" alt="${escapeHtml(ss.fileName)}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📷</text></svg>'">
              </div>
              <div class="screenshot-info">
                <div class="screenshot-name">${escapeHtml(ss.fileName)}</div>
                <div class="screenshot-tags">
                  ${(ss.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
                </div>
                <div class="screenshot-status status-${ss.status || 'pending'}">${ss.status || 'pending'}</div>
              </div>
              <div class="screenshot-actions">
                <button class="btn-icon" onclick="viewScreenshot('${ss.id}')" title="Details">👁️</button>
                <button class="btn-icon" onclick="editScreenshot('${ss.id}')" title="Edit">✏️</button>
                <button class="btn-icon" onclick="deleteScreenshot('${ss.id}')" title="Delete">🗑️</button>
              </div>
            </div>
          `).join('') || '<div class="empty-state">No screenshots</div>'}
        </div>

        <div id="qa-pagination"></div>
      </div>
    </div>

    <!-- Test Cases -->
    <div class="card">
      <div class="card-header">
        <h3>Test Cases</h3>
        <button class="btn btn-sm btn-primary" onclick="addTestCase()">+ Add Test Case</button>
      </div>
      <div class="card-body">
        <div class="test-cases-list">
          ${(qa.testCases || []).map((tc, idx) => `
            <div class="test-case-item priority-${tc.priority}">
              <div class="test-case-header">
                <span class="test-case-id">${escapeHtml(tc.id)}</span>
                <span class="test-case-category">${escapeHtml(tc.category)}</span>
                <span class="test-case-priority">${tc.priority}</span>
              </div>
              <div class="test-case-title">${escapeHtml(tc.title)}</div>
              <div class="test-case-steps">
                <strong>Steps:</strong>
                <ol>
                  ${(tc.steps || []).map(step => `<li>${escapeHtml(step)}</li>`).join('')}
                </ol>
              </div>
              <div class="test-case-expected"><strong>Expected:</strong> ${escapeHtml(tc.expected)}</div>
              <div class="item-actions">
                <button class="btn-icon" onclick="editTestCase(${idx})">✏️</button>
                <button class="btn-icon" onclick="deleteTestCase(${idx})">🗑️</button>
              </div>
            </div>
          `).join('') || '<div class="empty-state">No test cases</div>'}
        </div>
      </div>
    </div>

    <!-- Release Checklist -->
    <div class="card">
      <div class="card-header">
        <h3>Release Checklist</h3>
        <button class="btn btn-sm btn-primary" onclick="addChecklistItem()">+ Add Item</button>
      </div>
      <div class="card-body">
        <div class="checklist">
          ${(qa.releaseChecklist || []).map((item, idx) => `
            <label class="checklist-item">
              <input type="checkbox" ${item.status === 'done' ? 'checked' : ''} onchange="toggleChecklistItem(${idx})">
              <span class="${item.status === 'done' ? 'done' : ''}">${escapeHtml(item.item)}</span>
              <button class="btn-icon" onclick="deleteChecklistItem(${idx})">×</button>
            </label>
          `).join('') || '<div class="empty-state">No checklist items</div>'}
        </div>
      </div>
    </div>
  `;

  renderPagination('qa-pagination', paged, (page) => {
    App.pagination.qa = page;
    renderQA();
  });
}

function filterQA(type, value) {
  App.filters.qa[type] = value;
  App.pagination.qa = 1;
  renderQA();
}

// Screenshot functions
function openScreenshotLightbox(id) {
  const screenshots = App.state.screenshots || [];
  const idx = screenshots.findIndex(s => s.id === id);
  if (idx < 0) return;
  const paths = screenshots.map(s => s.path);
  openLightbox(screenshots[idx].path, paths, idx);
}

function addScreenshot() {
  openModal('Add Screenshot', `
    <div class="form-group">
      <label>File Path / URL</label>
      <input type="text" id="ss-path" placeholder="../screenshots/image.png">
    </div>
    <div class="form-group">
      <label>File Name</label>
      <input type="text" id="ss-name" placeholder="homepage.png">
    </div>
    <div class="form-group">
      <label>Tags (comma-separated)</label>
      <input type="text" id="ss-tags" placeholder="homepage, v1.0, ios">
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea id="ss-notes" rows="2"></textarea>
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="ss-status">
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>
  `, () => {
    const path = $('#ss-path').value.trim();
    if (!path) { showToast('Path required', 'error'); return; }
    if (!App.state.screenshots) App.state.screenshots = [];
    App.state.screenshots.push({
      id: generateId('SS'),
      path,
      fileName: $('#ss-name').value.trim() || path.split('/').pop(),
      tags: $('#ss-tags').value.split(',').map(s => s.trim()).filter(Boolean),
      notes: $('#ss-notes').value.trim(),
      status: $('#ss-status').value,
      createdAt: new Date().toISOString()
    });
    markDirty();
    renderQA();
    closeModal();
    showToast('Screenshot added', 'success');
  });
}

function viewScreenshot(id) {
  const ss = App.state.screenshots.find(s => s.id === id);
  if (!ss) return;
  openDrawer(`Screenshot: ${ss.fileName}`, `
    <div class="screenshot-detail">
      <img src="${escapeHtml(ss.path)}" alt="${escapeHtml(ss.fileName)}" class="detail-image">
      <dl>
        <dt>ID</dt><dd>${ss.id}</dd>
        <dt>File Name</dt><dd>${escapeHtml(ss.fileName)}</dd>
        <dt>Path</dt><dd><code>${escapeHtml(ss.path)}</code></dd>
        <dt>Tags</dt><dd>${(ss.tags || []).join(', ') || '-'}</dd>
        <dt>Status</dt><dd><span class="status-${ss.status}">${ss.status}</span></dd>
        <dt>Notes</dt><dd>${escapeHtml(ss.notes) || '-'}</dd>
        <dt>Created</dt><dd>${formatDate(ss.createdAt)}</dd>
      </dl>
    </div>
  `);
}

function editScreenshot(id) {
  const ss = App.state.screenshots.find(s => s.id === id);
  if (!ss) return;
  openModal('Edit Screenshot', `
    <div class="form-group">
      <label>File Path / URL</label>
      <input type="text" id="ss-path" value="${escapeHtml(ss.path)}">
    </div>
    <div class="form-group">
      <label>File Name</label>
      <input type="text" id="ss-name" value="${escapeHtml(ss.fileName)}">
    </div>
    <div class="form-group">
      <label>Tags (comma-separated)</label>
      <input type="text" id="ss-tags" value="${(ss.tags || []).join(', ')}">
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea id="ss-notes" rows="2">${escapeHtml(ss.notes || '')}</textarea>
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="ss-status">
        <option value="pending" ${ss.status === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="approved" ${ss.status === 'approved' ? 'selected' : ''}>Approved</option>
        <option value="rejected" ${ss.status === 'rejected' ? 'selected' : ''}>Rejected</option>
      </select>
    </div>
  `, () => {
    ss.path = $('#ss-path').value.trim();
    ss.fileName = $('#ss-name').value.trim();
    ss.tags = $('#ss-tags').value.split(',').map(s => s.trim()).filter(Boolean);
    ss.notes = $('#ss-notes').value.trim();
    ss.status = $('#ss-status').value;
    markDirty();
    renderQA();
    closeModal();
    showToast('Screenshot updated', 'success');
  });
}

function deleteScreenshot(id) {
  showConfirm('Delete this screenshot?', () => {
    const idx = App.state.screenshots.findIndex(s => s.id === id);
    if (idx >= 0) {
      App.state.screenshots.splice(idx, 1);
      markDirty();
      renderQA();
      showToast('Screenshot deleted', 'success');
    }
  });
}

// Test Device CRUD
function addTestDevice() {
  openModal('Add Test Device', `
    <div class="form-group">
      <label>Device Name</label>
      <input type="text" id="td-name" placeholder="iPhone 15 Pro">
    </div>
    <div class="form-group">
      <label>OS</label>
      <input type="text" id="td-os" placeholder="iOS 17">
    </div>
    <div class="form-group">
      <label>Resolution</label>
      <input type="text" id="td-res" placeholder="1179x2556">
    </div>
  `, () => {
    const name = $('#td-name').value.trim();
    if (!name) { showToast('Name required', 'error'); return; }
    if (!App.state.qa.testDevices) App.state.qa.testDevices = [];
    App.state.qa.testDevices.push({
      name,
      os: $('#td-os').value.trim(),
      resolution: $('#td-res').value.trim()
    });
    markDirty();
    renderQA();
    closeModal();
    showToast('Device added', 'success');
  });
}

function editTestDevice(idx) {
  const device = App.state.qa.testDevices[idx];
  openModal('Edit Test Device', `
    <div class="form-group">
      <label>Device Name</label>
      <input type="text" id="td-name" value="${escapeHtml(device.name)}">
    </div>
    <div class="form-group">
      <label>OS</label>
      <input type="text" id="td-os" value="${escapeHtml(device.os || '')}">
    </div>
    <div class="form-group">
      <label>Resolution</label>
      <input type="text" id="td-res" value="${escapeHtml(device.resolution || '')}">
    </div>
  `, () => {
    device.name = $('#td-name').value.trim();
    device.os = $('#td-os').value.trim();
    device.resolution = $('#td-res').value.trim();
    markDirty();
    renderQA();
    closeModal();
    showToast('Device updated', 'success');
  });
}

function deleteTestDevice(idx) {
  showConfirm('Delete this device?', () => {
    App.state.qa.testDevices.splice(idx, 1);
    markDirty();
    renderQA();
  });
}

// Test Case CRUD
function addTestCase() {
  openModal('Add Test Case', `
    <div class="form-group">
      <label>Category</label>
      <input type="text" id="tc-cat" placeholder="e.g., Authentication">
    </div>
    <div class="form-group">
      <label>Title</label>
      <input type="text" id="tc-title" placeholder="Test case title">
    </div>
    <div class="form-group">
      <label>Steps (one per line)</label>
      <textarea id="tc-steps" rows="4"></textarea>
    </div>
    <div class="form-group">
      <label>Expected Result</label>
      <textarea id="tc-expected" rows="2"></textarea>
    </div>
    <div class="form-group">
      <label>Priority</label>
      <select id="tc-priority">
        <option value="P0">P0 - Critical</option>
        <option value="P1">P1 - High</option>
        <option value="P2">P2 - Medium</option>
      </select>
    </div>
  `, () => {
    const title = $('#tc-title').value.trim();
    if (!title) { showToast('Title required', 'error'); return; }
    if (!App.state.qa.testCases) App.state.qa.testCases = [];
    App.state.qa.testCases.push({
      id: generateId('TC'),
      category: $('#tc-cat').value.trim(),
      title,
      steps: $('#tc-steps').value.split('\n').map(s => s.trim()).filter(Boolean),
      expected: $('#tc-expected').value.trim(),
      priority: $('#tc-priority').value
    });
    markDirty();
    renderQA();
    closeModal();
    showToast('Test case added', 'success');
  });
}

function editTestCase(idx) {
  const tc = App.state.qa.testCases[idx];
  openModal('Edit Test Case', `
    <div class="form-group">
      <label>Category</label>
      <input type="text" id="tc-cat" value="${escapeHtml(tc.category || '')}">
    </div>
    <div class="form-group">
      <label>Title</label>
      <input type="text" id="tc-title" value="${escapeHtml(tc.title)}">
    </div>
    <div class="form-group">
      <label>Steps (one per line)</label>
      <textarea id="tc-steps" rows="4">${(tc.steps || []).join('\n')}</textarea>
    </div>
    <div class="form-group">
      <label>Expected Result</label>
      <textarea id="tc-expected" rows="2">${escapeHtml(tc.expected || '')}</textarea>
    </div>
    <div class="form-group">
      <label>Priority</label>
      <select id="tc-priority">
        <option value="P0" ${tc.priority === 'P0' ? 'selected' : ''}>P0 - Critical</option>
        <option value="P1" ${tc.priority === 'P1' ? 'selected' : ''}>P1 - High</option>
        <option value="P2" ${tc.priority === 'P2' ? 'selected' : ''}>P2 - Medium</option>
      </select>
    </div>
  `, () => {
    tc.category = $('#tc-cat').value.trim();
    tc.title = $('#tc-title').value.trim();
    tc.steps = $('#tc-steps').value.split('\n').map(s => s.trim()).filter(Boolean);
    tc.expected = $('#tc-expected').value.trim();
    tc.priority = $('#tc-priority').value;
    markDirty();
    renderQA();
    closeModal();
    showToast('Test case updated', 'success');
  });
}

function deleteTestCase(idx) {
  showConfirm('Delete this test case?', () => {
    App.state.qa.testCases.splice(idx, 1);
    markDirty();
    renderQA();
  });
}

// Release Checklist
function addChecklistItem() {
  openModal('Add Checklist Item', `
    <div class="form-group">
      <label>Item</label>
      <input type="text" id="cl-item" placeholder="What needs to be done?">
    </div>
  `, () => {
    const item = $('#cl-item').value.trim();
    if (!item) { showToast('Item required', 'error'); return; }
    if (!App.state.qa.releaseChecklist) App.state.qa.releaseChecklist = [];
    App.state.qa.releaseChecklist.push({ item, status: 'pending' });
    markDirty();
    renderQA();
    closeModal();
    showToast('Item added', 'success');
  });
}

function toggleChecklistItem(idx) {
  const item = App.state.qa.releaseChecklist[idx];
  item.status = item.status === 'done' ? 'pending' : 'done';
  markDirty();
  renderQA();
}

function deleteChecklistItem(idx) {
  App.state.qa.releaseChecklist.splice(idx, 1);
  markDirty();
  renderQA();
}

// ============================================
// RENDER: BACKLOG TAB
// ============================================
function renderBacklog() {
  const issues = App.state.issues || [];
  const sprints = App.state.sprints || [];
  const container = $('#panel-backlog');
  if (!container) return;

  // Initialize filters
  if (!App.filters.backlog) App.filters.backlog = { status: 'all', priority: 'all', type: 'all', sprint: 'all' };
  if (!App.pagination.backlog) App.pagination.backlog = 1;

  // Filter issues
  let filtered = issues;
  if (App.filters.backlog.status !== 'all') {
    filtered = filtered.filter(i => i.status === App.filters.backlog.status);
  }
  if (App.filters.backlog.priority !== 'all') {
    filtered = filtered.filter(i => i.priority === App.filters.backlog.priority);
  }
  if (App.filters.backlog.type !== 'all') {
    filtered = filtered.filter(i => i.type === App.filters.backlog.type);
  }
  if (App.filters.backlog.sprint !== 'all') {
    filtered = filtered.filter(i => i.sprintId === App.filters.backlog.sprint);
  }

  // Sort by priority then by ID
  filtered.sort((a, b) => {
    const pOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
    const pDiff = (pOrder[a.priority] || 9) - (pOrder[b.priority] || 9);
    if (pDiff !== 0) return pDiff;
    return (a.id || '').localeCompare(b.id || '');
  });

  const paged = paginate(filtered, App.pagination.backlog, PAGE_SIZE);

  container.innerHTML = `
    <div class="backlog-layout">
      <!-- Sprint Panel -->
      <div class="sprint-panel">
        <div class="card">
          <div class="card-header">
            <h3>Sprints</h3>
            <button class="btn btn-sm btn-primary" onclick="addSprint()">+ Add</button>
          </div>
          <div class="card-body">
            <div class="sprints-list">
              ${sprints.map((sprint, idx) => `
                <div class="sprint-item ${sprint.status === 'Active' ? 'active' : ''}" onclick="filterBacklog('sprint', '${sprint.id}')">
                  <div class="sprint-name">${escapeHtml(sprint.name)}</div>
                  <div class="sprint-status">${sprint.status}</div>
                  <div class="sprint-dates">${formatDate(sprint.startDate)} - ${formatDate(sprint.endDate)}</div>
                  <div class="sprint-issue-count">${issues.filter(i => i.sprintId === sprint.id).length} issues</div>
                  <div class="item-actions">
                    <button class="btn-icon" onclick="event.stopPropagation(); editSprint(${idx})">✏️</button>
                    <button class="btn-icon" onclick="event.stopPropagation(); deleteSprint(${idx})">🗑️</button>
                  </div>
                </div>
              `).join('') || '<div class="empty-state">No sprints</div>'}
            </div>
          </div>
        </div>
      </div>

      <!-- Issues Panel -->
      <div class="issues-panel">
        <div class="card">
          <div class="card-header">
            <h3>Issues</h3>
            <button class="btn btn-sm btn-primary" onclick="addIssue()">+ Add Issue</button>
          </div>
          <div class="card-body">
            <!-- Filters -->
            <div class="filters-row">
              <select onchange="filterBacklog('status', this.value)">
                <option value="all">All Status</option>
                <option value="Backlog" ${App.filters.backlog.status === 'Backlog' ? 'selected' : ''}>Backlog</option>
                <option value="Todo" ${App.filters.backlog.status === 'Todo' ? 'selected' : ''}>Todo</option>
                <option value="In Progress" ${App.filters.backlog.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Done" ${App.filters.backlog.status === 'Done' ? 'selected' : ''}>Done</option>
              </select>
              <select onchange="filterBacklog('priority', this.value)">
                <option value="all">All Priority</option>
                <option value="P0" ${App.filters.backlog.priority === 'P0' ? 'selected' : ''}>P0</option>
                <option value="P1" ${App.filters.backlog.priority === 'P1' ? 'selected' : ''}>P1</option>
                <option value="P2" ${App.filters.backlog.priority === 'P2' ? 'selected' : ''}>P2</option>
                <option value="P3" ${App.filters.backlog.priority === 'P3' ? 'selected' : ''}>P3</option>
              </select>
              <select onchange="filterBacklog('type', this.value)">
                <option value="all">All Types</option>
                <option value="Bug" ${App.filters.backlog.type === 'Bug' ? 'selected' : ''}>Bug</option>
                <option value="Enhancement" ${App.filters.backlog.type === 'Enhancement' ? 'selected' : ''}>Enhancement</option>
                <option value="Task" ${App.filters.backlog.type === 'Task' ? 'selected' : ''}>Task</option>
              </select>
              <button class="btn btn-sm btn-secondary" onclick="resetBacklogFilters()">Reset</button>
            </div>

            <!-- Issues Table -->
            <table class="data-table issues-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${paged.items.map(issue => `
                  <tr class="priority-${issue.priority}" data-id="${issue.id}">
                    <td><code>${issue.id}</code></td>
                    <td class="issue-title" onclick="viewIssue('${issue.id}')">${escapeHtml(issue.title)}</td>
                    <td><span class="type-badge type-${issue.type?.toLowerCase()}">${issue.type}</span></td>
                    <td><span class="priority-badge">${issue.priority}</span></td>
                    <td>
                      <select class="status-select" onchange="updateIssueStatus('${issue.id}', this.value)">
                        <option value="Backlog" ${issue.status === 'Backlog' ? 'selected' : ''}>Backlog</option>
                        <option value="Todo" ${issue.status === 'Todo' ? 'selected' : ''}>Todo</option>
                        <option value="In Progress" ${issue.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Done" ${issue.status === 'Done' ? 'selected' : ''}>Done</option>
                      </select>
                    </td>
                    <td>${escapeHtml(issue.assignee) || '-'}</td>
                    <td>
                      <button class="btn-icon" onclick="editIssue('${issue.id}')" title="Edit">✏️</button>
                      <button class="btn-icon" onclick="deleteIssue('${issue.id}')" title="Delete">🗑️</button>
                    </td>
                  </tr>
                `).join('') || '<tr><td colspan="7" class="empty-state">No issues</td></tr>'}
              </tbody>
            </table>

            <div id="backlog-pagination"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  renderPagination('backlog-pagination', paged, (page) => {
    App.pagination.backlog = page;
    renderBacklog();
  });
}

function filterBacklog(type, value) {
  App.filters.backlog[type] = value;
  App.pagination.backlog = 1;
  renderBacklog();
}

function resetBacklogFilters() {
  App.filters.backlog = { status: 'all', priority: 'all', type: 'all', sprint: 'all' };
  App.pagination.backlog = 1;
  renderBacklog();
}

// Issue CRUD
function addIssue() {
  const sprints = App.state.sprints || [];
  openModal('Add Issue', `
    <div class="form-row">
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="issue-title" placeholder="Issue title">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Type</label>
        <select id="issue-type">
          <option value="Bug">Bug</option>
          <option value="Enhancement">Enhancement</option>
          <option value="Task">Task</option>
        </select>
      </div>
      <div class="form-group">
        <label>Priority</label>
        <select id="issue-priority">
          <option value="P0">P0 - Critical</option>
          <option value="P1">P1 - High</option>
          <option value="P2" selected>P2 - Medium</option>
          <option value="P3">P3 - Low</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Severity</label>
        <select id="issue-severity">
          <option value="High">High</option>
          <option value="Medium" selected>Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="issue-status">
          <option value="Backlog">Backlog</option>
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Area</label>
        <input type="text" id="issue-area" placeholder="e.g., Authentication">
      </div>
      <div class="form-group">
        <label>Screen</label>
        <input type="text" id="issue-screen" placeholder="e.g., LoginScreen">
      </div>
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="issue-desc" rows="3"></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Root Cause</label>
        <textarea id="issue-cause" rows="2"></textarea>
      </div>
      <div class="form-group">
        <label>Fix Approach</label>
        <textarea id="issue-fix" rows="2"></textarea>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Assignee</label>
        <input type="text" id="issue-assignee" placeholder="Name">
      </div>
      <div class="form-group">
        <label>Sprint</label>
        <select id="issue-sprint">
          <option value="">None</option>
          ${sprints.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Related Files (comma-separated)</label>
      <input type="text" id="issue-files" placeholder="src/screens/Login.tsx">
    </div>
  `, () => {
    const title = $('#issue-title').value.trim();
    if (!title) { showToast('Title required', 'error'); return; }
    if (!App.state.issues) App.state.issues = [];
    App.state.issues.push({
      id: generateId('ISS'),
      title,
      type: $('#issue-type').value,
      severity: $('#issue-severity').value,
      priority: $('#issue-priority').value,
      status: $('#issue-status').value,
      area: $('#issue-area').value.trim(),
      screen: $('#issue-screen').value.trim(),
      description: $('#issue-desc').value.trim(),
      rootCause: $('#issue-cause').value.trim(),
      fixApproach: $('#issue-fix').value.trim(),
      assignee: $('#issue-assignee').value.trim(),
      sprintId: $('#issue-sprint').value || null,
      files: $('#issue-files').value.split(',').map(s => s.trim()).filter(Boolean),
      createdAt: new Date().toISOString()
    });
    markDirty();
    renderBacklog();
    renderApp(); // Update badge
    closeModal();
    showToast('Issue created', 'success');
  });
}

function viewIssue(id) {
  const issue = App.state.issues.find(i => i.id === id);
  if (!issue) return;
  const sprint = App.state.sprints?.find(s => s.id === issue.sprintId);
  openDrawer(`Issue: ${issue.id}`, `
    <div class="issue-detail">
      <h2>${escapeHtml(issue.title)}</h2>
      <div class="issue-badges">
        <span class="type-badge type-${issue.type?.toLowerCase()}">${issue.type}</span>
        <span class="priority-badge">${issue.priority}</span>
        <span class="severity-badge">${issue.severity}</span>
        <span class="status-badge status-${issue.status?.toLowerCase().replace(' ', '-')}">${issue.status}</span>
      </div>
      <dl>
        <dt>Area</dt><dd>${escapeHtml(issue.area) || '-'}</dd>
        <dt>Screen</dt><dd>${escapeHtml(issue.screen) || '-'}</dd>
        <dt>Assignee</dt><dd>${escapeHtml(issue.assignee) || '-'}</dd>
        <dt>Sprint</dt><dd>${sprint ? escapeHtml(sprint.name) : '-'}</dd>
        <dt>Description</dt><dd>${escapeHtml(issue.description) || '-'}</dd>
        <dt>Root Cause</dt><dd>${escapeHtml(issue.rootCause) || '-'}</dd>
        <dt>Fix Approach</dt><dd>${escapeHtml(issue.fixApproach) || '-'}</dd>
        <dt>Related Files</dt><dd>${issue.files?.length ? issue.files.map(f => `<code>${escapeHtml(f)}</code>`).join('<br>') : '-'}</dd>
        <dt>Created</dt><dd>${formatDate(issue.createdAt)}</dd>
        <dt>Updated</dt><dd>${issue.updatedAt ? formatDate(issue.updatedAt) : '-'}</dd>
      </dl>
      <div class="drawer-actions">
        <button class="btn btn-primary" onclick="closeDrawer(); editIssue('${issue.id}')">Edit</button>
        <button class="btn btn-danger" onclick="closeDrawer(); deleteIssue('${issue.id}')">Delete</button>
      </div>
    </div>
  `);
}

function editIssue(id) {
  const issue = App.state.issues.find(i => i.id === id);
  if (!issue) return;
  const sprints = App.state.sprints || [];
  openModal('Edit Issue', `
    <div class="form-group">
      <label>ID</label>
      <input type="text" value="${issue.id}" readonly>
    </div>
    <div class="form-group">
      <label>Title</label>
      <input type="text" id="issue-title" value="${escapeHtml(issue.title)}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Type</label>
        <select id="issue-type">
          <option value="Bug" ${issue.type === 'Bug' ? 'selected' : ''}>Bug</option>
          <option value="Enhancement" ${issue.type === 'Enhancement' ? 'selected' : ''}>Enhancement</option>
          <option value="Task" ${issue.type === 'Task' ? 'selected' : ''}>Task</option>
        </select>
      </div>
      <div class="form-group">
        <label>Priority</label>
        <select id="issue-priority">
          <option value="P0" ${issue.priority === 'P0' ? 'selected' : ''}>P0</option>
          <option value="P1" ${issue.priority === 'P1' ? 'selected' : ''}>P1</option>
          <option value="P2" ${issue.priority === 'P2' ? 'selected' : ''}>P2</option>
          <option value="P3" ${issue.priority === 'P3' ? 'selected' : ''}>P3</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Severity</label>
        <select id="issue-severity">
          <option value="High" ${issue.severity === 'High' ? 'selected' : ''}>High</option>
          <option value="Medium" ${issue.severity === 'Medium' ? 'selected' : ''}>Medium</option>
          <option value="Low" ${issue.severity === 'Low' ? 'selected' : ''}>Low</option>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="issue-status">
          <option value="Backlog" ${issue.status === 'Backlog' ? 'selected' : ''}>Backlog</option>
          <option value="Todo" ${issue.status === 'Todo' ? 'selected' : ''}>Todo</option>
          <option value="In Progress" ${issue.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Done" ${issue.status === 'Done' ? 'selected' : ''}>Done</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Area</label>
        <input type="text" id="issue-area" value="${escapeHtml(issue.area || '')}">
      </div>
      <div class="form-group">
        <label>Screen</label>
        <input type="text" id="issue-screen" value="${escapeHtml(issue.screen || '')}">
      </div>
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="issue-desc" rows="3">${escapeHtml(issue.description || '')}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Root Cause</label>
        <textarea id="issue-cause" rows="2">${escapeHtml(issue.rootCause || '')}</textarea>
      </div>
      <div class="form-group">
        <label>Fix Approach</label>
        <textarea id="issue-fix" rows="2">${escapeHtml(issue.fixApproach || '')}</textarea>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Assignee</label>
        <input type="text" id="issue-assignee" value="${escapeHtml(issue.assignee || '')}">
      </div>
      <div class="form-group">
        <label>Sprint</label>
        <select id="issue-sprint">
          <option value="">None</option>
          ${sprints.map(s => `<option value="${s.id}" ${issue.sprintId === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Related Files (comma-separated)</label>
      <input type="text" id="issue-files" value="${(issue.files || []).join(', ')}">
    </div>
  `, () => {
    issue.title = $('#issue-title').value.trim();
    issue.type = $('#issue-type').value;
    issue.severity = $('#issue-severity').value;
    issue.priority = $('#issue-priority').value;
    issue.status = $('#issue-status').value;
    issue.area = $('#issue-area').value.trim();
    issue.screen = $('#issue-screen').value.trim();
    issue.description = $('#issue-desc').value.trim();
    issue.rootCause = $('#issue-cause').value.trim();
    issue.fixApproach = $('#issue-fix').value.trim();
    issue.assignee = $('#issue-assignee').value.trim();
    issue.sprintId = $('#issue-sprint').value || null;
    issue.files = $('#issue-files').value.split(',').map(s => s.trim()).filter(Boolean);
    issue.updatedAt = new Date().toISOString();
    markDirty();
    renderBacklog();
    renderApp();
    closeModal();
    showToast('Issue updated', 'success');
  });
}

function updateIssueStatus(id, status) {
  const issue = App.state.issues.find(i => i.id === id);
  if (issue) {
    issue.status = status;
    issue.updatedAt = new Date().toISOString();
    markDirty();
    renderApp();
  }
}

function deleteIssue(id) {
  showConfirm('Delete this issue?', () => {
    const idx = App.state.issues.findIndex(i => i.id === id);
    if (idx >= 0) {
      App.state.issues.splice(idx, 1);
      markDirty();
      renderBacklog();
      renderApp();
      showToast('Issue deleted', 'success');
    }
  });
}

// Sprint CRUD
function addSprint() {
  const today = new Date().toISOString().split('T')[0];
  const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  openModal('Add Sprint', `
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="sprint-name" placeholder="Sprint 1">
    </div>
    <div class="form-group">
      <label>Goal</label>
      <textarea id="sprint-goal" rows="2"></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Start Date</label>
        <input type="date" id="sprint-start" value="${today}">
      </div>
      <div class="form-group">
        <label>End Date</label>
        <input type="date" id="sprint-end" value="${twoWeeks}">
      </div>
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="sprint-status">
        <option value="Planning">Planning</option>
        <option value="Active">Active</option>
        <option value="Completed">Completed</option>
      </select>
    </div>
  `, () => {
    const name = $('#sprint-name').value.trim();
    if (!name) { showToast('Name required', 'error'); return; }
    if (!App.state.sprints) App.state.sprints = [];
    App.state.sprints.push({
      id: generateId('SPR'),
      name,
      goal: $('#sprint-goal').value.trim(),
      startDate: $('#sprint-start').value,
      endDate: $('#sprint-end').value,
      status: $('#sprint-status').value,
      issueIds: [],
      dod: [],
      risks: []
    });
    markDirty();
    renderBacklog();
    closeModal();
    showToast('Sprint created', 'success');
  });
}

function editSprint(idx) {
  const sprint = App.state.sprints[idx];
  openModal('Edit Sprint', `
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="sprint-name" value="${escapeHtml(sprint.name)}">
    </div>
    <div class="form-group">
      <label>Goal</label>
      <textarea id="sprint-goal" rows="2">${escapeHtml(sprint.goal || '')}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Start Date</label>
        <input type="date" id="sprint-start" value="${sprint.startDate}">
      </div>
      <div class="form-group">
        <label>End Date</label>
        <input type="date" id="sprint-end" value="${sprint.endDate}">
      </div>
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="sprint-status">
        <option value="Planning" ${sprint.status === 'Planning' ? 'selected' : ''}>Planning</option>
        <option value="Active" ${sprint.status === 'Active' ? 'selected' : ''}>Active</option>
        <option value="Completed" ${sprint.status === 'Completed' ? 'selected' : ''}>Completed</option>
      </select>
    </div>
  `, () => {
    sprint.name = $('#sprint-name').value.trim();
    sprint.goal = $('#sprint-goal').value.trim();
    sprint.startDate = $('#sprint-start').value;
    sprint.endDate = $('#sprint-end').value;
    sprint.status = $('#sprint-status').value;
    markDirty();
    renderBacklog();
    closeModal();
    showToast('Sprint updated', 'success');
  });
}

function deleteSprint(idx) {
  showConfirm('Delete this sprint?', () => {
    const sprint = App.state.sprints[idx];
    // Unassign issues from this sprint
    App.state.issues.forEach(issue => {
      if (issue.sprintId === sprint.id) issue.sprintId = null;
    });
    App.state.sprints.splice(idx, 1);
    markDirty();
    renderBacklog();
    showToast('Sprint deleted', 'success');
  });
}

// ============================================
// RENDER: BUILDS TAB
// ============================================
function renderBuilds() {
  const builds = App.state.builds || [];
  const container = $('#panel-builds');
  if (!container) return;

  if (!App.pagination.builds) App.pagination.builds = 1;
  const paged = paginate(builds.slice().reverse(), App.pagination.builds, PAGE_SIZE);

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Builds</h3>
        <div class="header-actions">
          <button class="btn btn-sm btn-secondary" onclick="generateReleaseNotes()">Generate Release Notes</button>
          <button class="btn btn-sm btn-primary" onclick="addBuild()">+ Add Build</button>
        </div>
      </div>
      <div class="card-body">
        <table class="data-table builds-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Build #</th>
              <th>Version</th>
              <th>Platform</th>
              <th>Channel</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${paged.items.map(build => `
              <tr data-id="${build.id}">
                <td><code>${build.id}</code></td>
                <td><strong>${escapeHtml(build.buildNumber)}</strong></td>
                <td>${escapeHtml(build.version)}</td>
                <td><span class="platform-badge">${build.platform}</span></td>
                <td>${escapeHtml(build.channel)}</td>
                <td>${formatDate(build.date)}</td>
                <td><span class="build-status status-${build.status?.toLowerCase()}">${build.status}</span></td>
                <td>
                  <button class="btn-icon" onclick="viewBuild('${build.id}')" title="Details">👁️</button>
                  <button class="btn-icon" onclick="editBuild('${build.id}')" title="Edit">✏️</button>
                  <button class="btn-icon" onclick="deleteBuild('${build.id}')" title="Delete">🗑️</button>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="8" class="empty-state">No builds</td></tr>'}
          </tbody>
        </table>
        <div id="builds-pagination"></div>
      </div>
    </div>
  `;

  renderPagination('builds-pagination', paged, (page) => {
    App.pagination.builds = page;
    renderBuilds();
  });
}

function addBuild() {
  const today = new Date().toISOString().split('T')[0];
  openModal('Add Build', `
    <div class="form-row">
      <div class="form-group">
        <label>Build Number</label>
        <input type="text" id="build-num" placeholder="123">
      </div>
      <div class="form-group">
        <label>Version</label>
        <input type="text" id="build-ver" placeholder="1.0.0">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Platform</label>
        <select id="build-platform">
          <option value="iOS">iOS</option>
          <option value="Android">Android</option>
        </select>
      </div>
      <div class="form-group">
        <label>Channel</label>
        <select id="build-channel">
          <option value="Internal Testing">Internal Testing</option>
          <option value="TestFlight">TestFlight</option>
          <option value="Production">Production</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Date</label>
        <input type="date" id="build-date" value="${today}">
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="build-status">
          <option value="Building">Building</option>
          <option value="Submitted">Submitted</option>
          <option value="Available">Available</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Git Branch</label>
        <input type="text" id="build-branch" placeholder="main">
      </div>
      <div class="form-group">
        <label>Git Commit</label>
        <input type="text" id="build-commit" placeholder="abc1234">
      </div>
    </div>
    <div class="form-group">
      <label>Runtime Version</label>
      <input type="text" id="build-runtime" placeholder="e.g., 1.0.0">
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea id="build-notes" rows="3"></textarea>
    </div>
    <div class="form-group">
      <label>Download URL</label>
      <input type="url" id="build-url" placeholder="https://...">
    </div>
  `, () => {
    const buildNumber = $('#build-num').value.trim();
    if (!buildNumber) { showToast('Build number required', 'error'); return; }
    if (!App.state.builds) App.state.builds = [];
    App.state.builds.push({
      id: generateId('BLD'),
      buildNumber,
      version: $('#build-ver').value.trim(),
      platform: $('#build-platform').value,
      channel: $('#build-channel').value,
      date: $('#build-date').value,
      status: $('#build-status').value,
      gitBranch: $('#build-branch').value.trim(),
      gitCommit: $('#build-commit').value.trim(),
      runtimeVersion: $('#build-runtime').value.trim(),
      notes: $('#build-notes').value.trim(),
      downloadUrl: $('#build-url').value.trim(),
      knownIssueIds: []
    });
    markDirty();
    renderBuilds();
    closeModal();
    showToast('Build added', 'success');
  });
}

function viewBuild(id) {
  const build = App.state.builds.find(b => b.id === id);
  if (!build) return;
  openDrawer(`Build: ${build.buildNumber}`, `
    <dl>
      <dt>ID</dt><dd>${build.id}</dd>
      <dt>Build Number</dt><dd>${build.buildNumber}</dd>
      <dt>Version</dt><dd>${build.version}</dd>
      <dt>Platform</dt><dd>${build.platform}</dd>
      <dt>Channel</dt><dd>${build.channel}</dd>
      <dt>Status</dt><dd><span class="build-status status-${build.status?.toLowerCase()}">${build.status}</span></dd>
      <dt>Date</dt><dd>${formatDate(build.date)}</dd>
      <dt>Git Branch</dt><dd><code>${escapeHtml(build.gitBranch) || '-'}</code></dd>
      <dt>Git Commit</dt><dd><code>${escapeHtml(build.gitCommit) || '-'}</code></dd>
      <dt>Runtime Version</dt><dd>${escapeHtml(build.runtimeVersion) || '-'}</dd>
      <dt>Notes</dt><dd>${escapeHtml(build.notes) || '-'}</dd>
      <dt>Download URL</dt><dd>${build.downloadUrl ? `<a href="${escapeHtml(build.downloadUrl)}" target="_blank">Download</a>` : '-'}</dd>
    </dl>
  `);
}

function editBuild(id) {
  const build = App.state.builds.find(b => b.id === id);
  if (!build) return;
  openModal('Edit Build', `
    <div class="form-row">
      <div class="form-group">
        <label>Build Number</label>
        <input type="text" id="build-num" value="${escapeHtml(build.buildNumber)}">
      </div>
      <div class="form-group">
        <label>Version</label>
        <input type="text" id="build-ver" value="${escapeHtml(build.version || '')}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Platform</label>
        <select id="build-platform">
          <option value="iOS" ${build.platform === 'iOS' ? 'selected' : ''}>iOS</option>
          <option value="Android" ${build.platform === 'Android' ? 'selected' : ''}>Android</option>
        </select>
      </div>
      <div class="form-group">
        <label>Channel</label>
        <select id="build-channel">
          <option value="Internal Testing" ${build.channel === 'Internal Testing' ? 'selected' : ''}>Internal Testing</option>
          <option value="TestFlight" ${build.channel === 'TestFlight' ? 'selected' : ''}>TestFlight</option>
          <option value="Production" ${build.channel === 'Production' ? 'selected' : ''}>Production</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Date</label>
        <input type="date" id="build-date" value="${build.date}">
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="build-status">
          <option value="Building" ${build.status === 'Building' ? 'selected' : ''}>Building</option>
          <option value="Submitted" ${build.status === 'Submitted' ? 'selected' : ''}>Submitted</option>
          <option value="Available" ${build.status === 'Available' ? 'selected' : ''}>Available</option>
          <option value="Rejected" ${build.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Git Branch</label>
        <input type="text" id="build-branch" value="${escapeHtml(build.gitBranch || '')}">
      </div>
      <div class="form-group">
        <label>Git Commit</label>
        <input type="text" id="build-commit" value="${escapeHtml(build.gitCommit || '')}">
      </div>
    </div>
    <div class="form-group">
      <label>Runtime Version</label>
      <input type="text" id="build-runtime" value="${escapeHtml(build.runtimeVersion || '')}">
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea id="build-notes" rows="3">${escapeHtml(build.notes || '')}</textarea>
    </div>
    <div class="form-group">
      <label>Download URL</label>
      <input type="url" id="build-url" value="${escapeHtml(build.downloadUrl || '')}">
    </div>
  `, () => {
    build.buildNumber = $('#build-num').value.trim();
    build.version = $('#build-ver').value.trim();
    build.platform = $('#build-platform').value;
    build.channel = $('#build-channel').value;
    build.date = $('#build-date').value;
    build.status = $('#build-status').value;
    build.gitBranch = $('#build-branch').value.trim();
    build.gitCommit = $('#build-commit').value.trim();
    build.runtimeVersion = $('#build-runtime').value.trim();
    build.notes = $('#build-notes').value.trim();
    build.downloadUrl = $('#build-url').value.trim();
    markDirty();
    renderBuilds();
    closeModal();
    showToast('Build updated', 'success');
  });
}

function deleteBuild(id) {
  showConfirm('Delete this build?', () => {
    const idx = App.state.builds.findIndex(b => b.id === id);
    if (idx >= 0) {
      App.state.builds.splice(idx, 1);
      markDirty();
      renderBuilds();
      showToast('Build deleted', 'success');
    }
  });
}

function generateReleaseNotes() {
  const doneIssues = App.state.issues.filter(i => i.status === 'Done');
  const bugs = doneIssues.filter(i => i.type === 'Bug');
  const enhancements = doneIssues.filter(i => i.type === 'Enhancement');
  const tasks = doneIssues.filter(i => i.type === 'Task');

  const notes = `# Release Notes - ${App.state.meta.version}

## Bug Fixes
${bugs.map(b => `- ${b.title} (${b.id})`).join('\n') || '- None'}

## Enhancements
${enhancements.map(e => `- ${e.title} (${e.id})`).join('\n') || '- None'}

## Other
${tasks.map(t => `- ${t.title} (${t.id})`).join('\n') || '- None'}

Generated: ${new Date().toLocaleString()}`;

  openModal('Release Notes', `<pre class="release-notes-preview">${escapeHtml(notes)}</pre>
    <div class="modal-actions" style="margin-top: 1rem;">
      <button class="btn btn-primary" onclick="copyToClipboard(\`${notes.replace(/`/g, '\\`')}\`, 'Release notes copied!')">Copy to Clipboard</button>
    </div>
  `);
}

// ============================================
// RENDER: COMPLIANCE TAB
// ============================================
function renderCompliance() {
  const c = App.state.compliance;
  const container = $('#panel-compliance');
  if (!container) return;

  container.innerHTML = `
    <div class="compliance-grid">
      <!-- Apple -->
      <div class="card">
        <div class="card-header">
          <h3>🍎 Apple App Store</h3>
          <button class="btn btn-sm btn-primary" onclick="addAppleChecklistItem()">+ Add</button>
        </div>
        <div class="card-body">
          <div class="stat-row">
            <span class="stat-label">Status</span>
            <span class="stat-value">${escapeHtml(c.apple?.appStoreStatus) || 'Not Submitted'}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Last Review</span>
            <span class="stat-value">${c.apple?.lastReviewDate ? formatDate(c.apple.lastReviewDate) : '-'}</span>
          </div>

          <h4>Checklist</h4>
          <div class="compliance-checklist">
            ${(c.apple?.checklist || []).map((item, idx) => `
              <div class="checklist-item status-${item.status}">
                <span class="checklist-status" onclick="cycleChecklistStatus('apple', ${idx})">${getStatusIcon(item.status)}</span>
                <span class="checklist-text">${escapeHtml(item.item)}</span>
                ${item.notes ? `<span class="checklist-notes">${escapeHtml(item.notes)}</span>` : ''}
                <button class="btn-icon" onclick="editAppleChecklistItem(${idx})">✏️</button>
                <button class="btn-icon" onclick="deleteAppleChecklistItem(${idx})">🗑️</button>
              </div>
            `).join('') || '<div class="empty-state">No checklist items</div>'}
          </div>

          <h4>Privacy Labels</h4>
          <button class="btn btn-sm btn-secondary" onclick="editPrivacyLabels()" style="margin-bottom: 0.5rem;">Edit Labels</button>
          <table class="data-table">
            <thead><tr><th>Category</th><th>Collected</th><th>Purpose</th><th>Linked</th></tr></thead>
            <tbody>
              ${(c.apple?.privacyNutritionLabels || []).map(label => `
                <tr>
                  <td>${escapeHtml(label.category)}</td>
                  <td>${label.collected ? '✓' : '✗'}</td>
                  <td>${escapeHtml(label.purpose)}</td>
                  <td>${label.linked ? '✓' : '✗'}</td>
                </tr>
              `).join('') || '<tr><td colspan="4" class="empty-state">No privacy labels</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Google -->
      <div class="card">
        <div class="card-header">
          <h3>🤖 Google Play</h3>
          <button class="btn btn-sm btn-primary" onclick="addGoogleChecklistItem()">+ Add</button>
        </div>
        <div class="card-body">
          <div class="stat-row">
            <span class="stat-label">Status</span>
            <span class="stat-value">${escapeHtml(c.googlePlay?.playStoreStatus) || 'Not Submitted'}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Last Review</span>
            <span class="stat-value">${c.googlePlay?.lastReviewDate ? formatDate(c.googlePlay.lastReviewDate) : '-'}</span>
          </div>

          <h4>Checklist</h4>
          <div class="compliance-checklist">
            ${(c.googlePlay?.checklist || []).map((item, idx) => `
              <div class="checklist-item status-${item.status}">
                <span class="checklist-status" onclick="cycleChecklistStatus('googlePlay', ${idx})">${getStatusIcon(item.status)}</span>
                <span class="checklist-text">${escapeHtml(item.item)}</span>
                ${item.notes ? `<span class="checklist-notes">${escapeHtml(item.notes)}</span>` : ''}
                <button class="btn-icon" onclick="editGoogleChecklistItem(${idx})">✏️</button>
                <button class="btn-icon" onclick="deleteGoogleChecklistItem(${idx})">🗑️</button>
              </div>
            `).join('') || '<div class="empty-state">No checklist items</div>'}
          </div>

          <h4>Data Safety</h4>
          <button class="btn btn-sm btn-secondary" onclick="editDataSafety()">Edit Data Safety</button>
        </div>
      </div>
    </div>

    <!-- Rejections -->
    <div class="card">
      <div class="card-header">
        <h3>Rejection History</h3>
        <button class="btn btn-sm btn-primary" onclick="addRejection()">+ Add</button>
      </div>
      <div class="card-body">
        <table class="data-table">
          <thead>
            <tr><th>Date</th><th>Store</th><th>Reason</th><th>Fix</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${(c.rejections || []).map((rej, idx) => `
              <tr>
                <td>${formatDate(rej.date)}</td>
                <td><span class="store-badge">${rej.store}</span></td>
                <td>${escapeHtml(rej.reason)}</td>
                <td>${escapeHtml(rej.fix)}</td>
                <td><span class="status-badge status-${rej.status?.toLowerCase()}">${rej.status}</span></td>
                <td>
                  <button class="btn-icon" onclick="editRejection(${idx})">✏️</button>
                  <button class="btn-icon" onclick="deleteRejection(${idx})">🗑️</button>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="6" class="empty-state">No rejections 🎉</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function getStatusIcon(status) {
  const icons = { 'done': '✅', 'in-progress': '🔄', 'pending': '⏳', 'blocked': '🚫' };
  return icons[status] || '⏳';
}

function cycleChecklistStatus(store, idx) {
  const statuses = ['pending', 'in-progress', 'done', 'blocked'];
  const checklist = App.state.compliance[store].checklist;
  const item = checklist[idx];
  const currentIdx = statuses.indexOf(item.status);
  item.status = statuses[(currentIdx + 1) % statuses.length];
  markDirty();
  renderCompliance();
}

// Apple checklist
function addAppleChecklistItem() {
  openModal('Add Apple Checklist Item', `
    <div class="form-group">
      <label>Item</label>
      <input type="text" id="cl-item" placeholder="Checklist item">
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="cl-status">
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
        <option value="blocked">Blocked</option>
      </select>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <input type="text" id="cl-notes">
    </div>
  `, () => {
    const item = $('#cl-item').value.trim();
    if (!item) { showToast('Item required', 'error'); return; }
    if (!App.state.compliance.apple) App.state.compliance.apple = { checklist: [] };
    if (!App.state.compliance.apple.checklist) App.state.compliance.apple.checklist = [];
    App.state.compliance.apple.checklist.push({
      id: generateId('ACL'),
      item,
      status: $('#cl-status').value,
      notes: $('#cl-notes').value.trim()
    });
    markDirty();
    renderCompliance();
    closeModal();
    showToast('Item added', 'success');
  });
}

function editAppleChecklistItem(idx) {
  const item = App.state.compliance.apple.checklist[idx];
  openModal('Edit Checklist Item', `
    <div class="form-group">
      <label>Item</label>
      <input type="text" id="cl-item" value="${escapeHtml(item.item)}">
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="cl-status">
        <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="in-progress" ${item.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
        <option value="done" ${item.status === 'done' ? 'selected' : ''}>Done</option>
        <option value="blocked" ${item.status === 'blocked' ? 'selected' : ''}>Blocked</option>
      </select>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <input type="text" id="cl-notes" value="${escapeHtml(item.notes || '')}">
    </div>
  `, () => {
    item.item = $('#cl-item').value.trim();
    item.status = $('#cl-status').value;
    item.notes = $('#cl-notes').value.trim();
    markDirty();
    renderCompliance();
    closeModal();
    showToast('Item updated', 'success');
  });
}

function deleteAppleChecklistItem(idx) {
  showConfirm('Delete this item?', () => {
    App.state.compliance.apple.checklist.splice(idx, 1);
    markDirty();
    renderCompliance();
  });
}

// Google checklist
function addGoogleChecklistItem() {
  openModal('Add Google Play Checklist Item', `
    <div class="form-group">
      <label>Item</label>
      <input type="text" id="cl-item" placeholder="Checklist item">
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="cl-status">
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
        <option value="blocked">Blocked</option>
      </select>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <input type="text" id="cl-notes">
    </div>
  `, () => {
    const item = $('#cl-item').value.trim();
    if (!item) { showToast('Item required', 'error'); return; }
    if (!App.state.compliance.googlePlay) App.state.compliance.googlePlay = { checklist: [] };
    if (!App.state.compliance.googlePlay.checklist) App.state.compliance.googlePlay.checklist = [];
    App.state.compliance.googlePlay.checklist.push({
      id: generateId('GCL'),
      item,
      status: $('#cl-status').value,
      notes: $('#cl-notes').value.trim()
    });
    markDirty();
    renderCompliance();
    closeModal();
    showToast('Item added', 'success');
  });
}

function editGoogleChecklistItem(idx) {
  const item = App.state.compliance.googlePlay.checklist[idx];
  openModal('Edit Checklist Item', `
    <div class="form-group">
      <label>Item</label>
      <input type="text" id="cl-item" value="${escapeHtml(item.item)}">
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="cl-status">
        <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="in-progress" ${item.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
        <option value="done" ${item.status === 'done' ? 'selected' : ''}>Done</option>
        <option value="blocked" ${item.status === 'blocked' ? 'selected' : ''}>Blocked</option>
      </select>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <input type="text" id="cl-notes" value="${escapeHtml(item.notes || '')}">
    </div>
  `, () => {
    item.item = $('#cl-item').value.trim();
    item.status = $('#cl-status').value;
    item.notes = $('#cl-notes').value.trim();
    markDirty();
    renderCompliance();
    closeModal();
    showToast('Item updated', 'success');
  });
}

function deleteGoogleChecklistItem(idx) {
  showConfirm('Delete this item?', () => {
    App.state.compliance.googlePlay.checklist.splice(idx, 1);
    markDirty();
    renderCompliance();
  });
}

// Privacy labels
function editPrivacyLabels() {
  const labels = App.state.compliance.apple?.privacyNutritionLabels || [];
  openModal('Edit Privacy Labels', `
    <div class="form-group">
      <label>Labels (JSON format)</label>
      <textarea id="privacy-json" rows="10">${JSON.stringify(labels, null, 2)}</textarea>
    </div>
    <p class="help-text">Format: [{ "category": "Name", "collected": true, "purpose": "...", "linked": true }]</p>
  `, () => {
    try {
      if (!App.state.compliance.apple) App.state.compliance.apple = {};
      App.state.compliance.apple.privacyNutritionLabels = JSON.parse($('#privacy-json').value);
      markDirty();
      renderCompliance();
      closeModal();
      showToast('Privacy labels updated', 'success');
    } catch (e) {
      showToast('Invalid JSON', 'error');
    }
  });
}

function editDataSafety() {
  const ds = App.state.compliance.googlePlay?.dataSafetyForm || {};
  openModal('Edit Data Safety Form', `
    <div class="form-group">
      <label>Data Collected (one per line)</label>
      <textarea id="ds-collected" rows="3">${(ds.dataCollected || []).join('\n')}</textarea>
    </div>
    <div class="form-group">
      <label>Data Shared (one per line)</label>
      <textarea id="ds-shared" rows="3">${(ds.dataShared || []).join('\n')}</textarea>
    </div>
    <div class="form-group">
      <label>Security Practices (one per line)</label>
      <textarea id="ds-security" rows="3">${(ds.securityPractices || []).join('\n')}</textarea>
    </div>
  `, () => {
    if (!App.state.compliance.googlePlay) App.state.compliance.googlePlay = {};
    App.state.compliance.googlePlay.dataSafetyForm = {
      dataCollected: $('#ds-collected').value.split('\n').map(s => s.trim()).filter(Boolean),
      dataShared: $('#ds-shared').value.split('\n').map(s => s.trim()).filter(Boolean),
      securityPractices: $('#ds-security').value.split('\n').map(s => s.trim()).filter(Boolean)
    };
    markDirty();
    renderCompliance();
    closeModal();
    showToast('Data safety updated', 'success');
  });
}

// Rejections
function addRejection() {
  const today = new Date().toISOString().split('T')[0];
  openModal('Add Rejection', `
    <div class="form-row">
      <div class="form-group">
        <label>Date</label>
        <input type="date" id="rej-date" value="${today}">
      </div>
      <div class="form-group">
        <label>Store</label>
        <select id="rej-store">
          <option value="Apple">Apple</option>
          <option value="Google">Google</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Reason</label>
      <textarea id="rej-reason" rows="2"></textarea>
    </div>
    <div class="form-group">
      <label>Fix Applied</label>
      <textarea id="rej-fix" rows="2"></textarea>
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="rej-status">
        <option value="Pending">Pending</option>
        <option value="Fixed">Fixed</option>
      </select>
    </div>
  `, () => {
    if (!App.state.compliance.rejections) App.state.compliance.rejections = [];
    App.state.compliance.rejections.push({
      id: generateId('REJ'),
      date: $('#rej-date').value,
      store: $('#rej-store').value,
      reason: $('#rej-reason').value.trim(),
      fix: $('#rej-fix').value.trim(),
      status: $('#rej-status').value
    });
    markDirty();
    renderCompliance();
    closeModal();
    showToast('Rejection added', 'success');
  });
}

function editRejection(idx) {
  const rej = App.state.compliance.rejections[idx];
  openModal('Edit Rejection', `
    <div class="form-row">
      <div class="form-group">
        <label>Date</label>
        <input type="date" id="rej-date" value="${rej.date}">
      </div>
      <div class="form-group">
        <label>Store</label>
        <select id="rej-store">
          <option value="Apple" ${rej.store === 'Apple' ? 'selected' : ''}>Apple</option>
          <option value="Google" ${rej.store === 'Google' ? 'selected' : ''}>Google</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Reason</label>
      <textarea id="rej-reason" rows="2">${escapeHtml(rej.reason || '')}</textarea>
    </div>
    <div class="form-group">
      <label>Fix Applied</label>
      <textarea id="rej-fix" rows="2">${escapeHtml(rej.fix || '')}</textarea>
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="rej-status">
        <option value="Pending" ${rej.status === 'Pending' ? 'selected' : ''}>Pending</option>
        <option value="Fixed" ${rej.status === 'Fixed' ? 'selected' : ''}>Fixed</option>
      </select>
    </div>
  `, () => {
    rej.date = $('#rej-date').value;
    rej.store = $('#rej-store').value;
    rej.reason = $('#rej-reason').value.trim();
    rej.fix = $('#rej-fix').value.trim();
    rej.status = $('#rej-status').value;
    markDirty();
    renderCompliance();
    closeModal();
    showToast('Rejection updated', 'success');
  });
}

function deleteRejection(idx) {
  showConfirm('Delete this rejection?', () => {
    App.state.compliance.rejections.splice(idx, 1);
    markDirty();
    renderCompliance();
  });
}

// ============================================
// RENDER: LINKS TAB
// ============================================
function renderLinks() {
  const links = App.state.links || [];
  const container = $('#panel-links');
  if (!container) return;

  if (!App.filters.links) App.filters.links = { category: 'all' };

  const categories = [...new Set(links.map(l => l.category).filter(Boolean))];

  let filtered = links;
  if (App.filters.links.category !== 'all') {
    filtered = filtered.filter(l => l.category === App.filters.links.category);
  }

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Links & Resources</h3>
        <button class="btn btn-sm btn-primary" onclick="addLink()">+ Add Link</button>
      </div>
      <div class="card-body">
        <div class="filters-row">
          <select onchange="App.filters.links.category = this.value; renderLinks();">
            <option value="all">All Categories</option>
            ${categories.map(cat => `<option value="${escapeHtml(cat)}" ${App.filters.links.category === cat ? 'selected' : ''}>${escapeHtml(cat)}</option>`).join('')}
          </select>
          <input type="text" id="links-search" placeholder="Search links..." oninput="searchLinks(this.value)">
        </div>

        <div class="links-grid" id="links-grid">
          ${filtered.map(link => `
            <div class="link-card" data-id="${link.id}">
              <div class="link-category">${escapeHtml(link.category)}</div>
              <a href="${escapeHtml(link.url)}" target="_blank" class="link-title">${escapeHtml(link.title)}</a>
              ${link.notes ? `<p class="link-notes">${escapeHtml(link.notes)}</p>` : ''}
              <div class="link-meta">
                ${link.owner ? `<span>Owner: ${escapeHtml(link.owner)}</span>` : ''}
                ${link.lastUpdated ? `<span>Updated: ${formatDate(link.lastUpdated)}</span>` : ''}
              </div>
              <div class="item-actions">
                <button class="btn-icon" onclick="copyToClipboard('${escapeHtml(link.url)}')" title="Copy URL">📋</button>
                <button class="btn-icon" onclick="editLink('${link.id}')" title="Edit">✏️</button>
                <button class="btn-icon" onclick="deleteLink('${link.id}')" title="Delete">🗑️</button>
              </div>
            </div>
          `).join('') || '<div class="empty-state">No links</div>'}
        </div>
      </div>
    </div>
  `;
}

function searchLinks(term) {
  const links = App.state.links || [];
  const grid = $('#links-grid');
  if (!grid) return;

  if (!term) {
    renderLinks();
    return;
  }

  term = term.toLowerCase();
  const filtered = links.filter(l =>
    l.title?.toLowerCase().includes(term) ||
    l.url?.toLowerCase().includes(term) ||
    l.notes?.toLowerCase().includes(term)
  );

  grid.innerHTML = filtered.map(link => `
    <div class="link-card" data-id="${link.id}">
      <div class="link-category">${escapeHtml(link.category)}</div>
      <a href="${escapeHtml(link.url)}" target="_blank" class="link-title">${escapeHtml(link.title)}</a>
      ${link.notes ? `<p class="link-notes">${escapeHtml(link.notes)}</p>` : ''}
      <div class="item-actions">
        <button class="btn-icon" onclick="copyToClipboard('${escapeHtml(link.url)}')" title="Copy URL">📋</button>
        <button class="btn-icon" onclick="editLink('${link.id}')" title="Edit">✏️</button>
        <button class="btn-icon" onclick="deleteLink('${link.id}')" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('') || '<div class="empty-state">No matches</div>';
}

function addLink() {
  openModal('Add Link', `
    <div class="form-group">
      <label>Title</label>
      <input type="text" id="link-title" placeholder="Link title">
    </div>
    <div class="form-group">
      <label>URL</label>
      <input type="url" id="link-url" placeholder="https://...">
    </div>
    <div class="form-group">
      <label>Category</label>
      <select id="link-category">
        <option value="Repository">Repository</option>
        <option value="Infrastructure">Infrastructure</option>
        <option value="Design">Design</option>
        <option value="Documentation">Documentation</option>
        <option value="Distribution">Distribution</option>
        <option value="Other">Other</option>
      </select>
    </div>
    <div class="form-group">
      <label>Type</label>
      <select id="link-type">
        <option value="external">External</option>
        <option value="local">Local</option>
      </select>
    </div>
    <div class="form-group">
      <label>Owner</label>
      <input type="text" id="link-owner" placeholder="Who manages this?">
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea id="link-notes" rows="2"></textarea>
    </div>
  `, () => {
    const title = $('#link-title').value.trim();
    const url = $('#link-url').value.trim();
    if (!title || !url) { showToast('Title and URL required', 'error'); return; }
    if (!App.state.links) App.state.links = [];
    App.state.links.push({
      id: generateId('LNK'),
      title, url,
      category: $('#link-category').value,
      type: $('#link-type').value,
      owner: $('#link-owner').value.trim(),
      notes: $('#link-notes').value.trim(),
      lastUpdated: new Date().toISOString().split('T')[0]
    });
    markDirty();
    renderLinks();
    closeModal();
    showToast('Link added', 'success');
  });
}

function editLink(id) {
  const link = App.state.links.find(l => l.id === id);
  if (!link) return;
  openModal('Edit Link', `
    <div class="form-group">
      <label>Title</label>
      <input type="text" id="link-title" value="${escapeHtml(link.title)}">
    </div>
    <div class="form-group">
      <label>URL</label>
      <input type="url" id="link-url" value="${escapeHtml(link.url)}">
    </div>
    <div class="form-group">
      <label>Category</label>
      <select id="link-category">
        <option value="Repository" ${link.category === 'Repository' ? 'selected' : ''}>Repository</option>
        <option value="Infrastructure" ${link.category === 'Infrastructure' ? 'selected' : ''}>Infrastructure</option>
        <option value="Design" ${link.category === 'Design' ? 'selected' : ''}>Design</option>
        <option value="Documentation" ${link.category === 'Documentation' ? 'selected' : ''}>Documentation</option>
        <option value="Distribution" ${link.category === 'Distribution' ? 'selected' : ''}>Distribution</option>
        <option value="Other" ${link.category === 'Other' ? 'selected' : ''}>Other</option>
      </select>
    </div>
    <div class="form-group">
      <label>Type</label>
      <select id="link-type">
        <option value="external" ${link.type === 'external' ? 'selected' : ''}>External</option>
        <option value="local" ${link.type === 'local' ? 'selected' : ''}>Local</option>
      </select>
    </div>
    <div class="form-group">
      <label>Owner</label>
      <input type="text" id="link-owner" value="${escapeHtml(link.owner || '')}">
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea id="link-notes" rows="2">${escapeHtml(link.notes || '')}</textarea>
    </div>
  `, () => {
    link.title = $('#link-title').value.trim();
    link.url = $('#link-url').value.trim();
    link.category = $('#link-category').value;
    link.type = $('#link-type').value;
    link.owner = $('#link-owner').value.trim();
    link.notes = $('#link-notes').value.trim();
    link.lastUpdated = new Date().toISOString().split('T')[0];
    markDirty();
    renderLinks();
    closeModal();
    showToast('Link updated', 'success');
  });
}

function deleteLink(id) {
  showConfirm('Delete this link?', () => {
    const idx = App.state.links.findIndex(l => l.id === id);
    if (idx >= 0) {
      App.state.links.splice(idx, 1);
      markDirty();
      renderLinks();
      showToast('Link deleted', 'success');
    }
  });
}

// ============================================
// RENDER: CHANGELOG TAB
// ============================================
function renderChangelog() {
  const changelog = App.state.changelog || [];
  const container = $('#panel-changelog');
  if (!container) return;

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Changelog</h3>
        <button class="btn btn-sm btn-primary" onclick="addChangelogEntry()">+ Add Entry</button>
      </div>
      <div class="card-body">
        <div class="changelog-list">
          ${changelog.slice().reverse().map((entry, idx) => `
            <div class="changelog-entry">
              <div class="changelog-header">
                <span class="changelog-version">${escapeHtml(entry.version)}</span>
                <span class="changelog-date">${formatDate(entry.date)}</span>
                <div class="item-actions">
                  <button class="btn-icon" onclick="editChangelogEntry(${changelog.length - 1 - idx})">✏️</button>
                  <button class="btn-icon" onclick="deleteChangelogEntry(${changelog.length - 1 - idx})">🗑️</button>
                </div>
              </div>
              <h4 class="changelog-title">${escapeHtml(entry.title)}</h4>
              ${entry.description ? `<p class="changelog-description">${escapeHtml(entry.description)}</p>` : ''}
              <ul class="changelog-changes">
                ${(entry.changes || []).map(change => `<li>${escapeHtml(change)}</li>`).join('')}
              </ul>
              ${entry.issueIds?.length ? `<div class="changelog-issues">Related: ${entry.issueIds.map(id => `<code>${id}</code>`).join(', ')}</div>` : ''}
            </div>
          `).join('') || '<div class="empty-state">No changelog entries</div>'}
        </div>
      </div>
    </div>
  `;
}

function addChangelogEntry() {
  const today = new Date().toISOString().split('T')[0];
  openModal('Add Changelog Entry', `
    <div class="form-row">
      <div class="form-group">
        <label>Version</label>
        <input type="text" id="cl-version" placeholder="1.0.0" value="${App.state.meta.version || ''}">
      </div>
      <div class="form-group">
        <label>Date</label>
        <input type="date" id="cl-date" value="${today}">
      </div>
    </div>
    <div class="form-group">
      <label>Title</label>
      <input type="text" id="cl-title" placeholder="Release title">
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="cl-desc" rows="2"></textarea>
    </div>
    <div class="form-group">
      <label>Changes (one per line)</label>
      <textarea id="cl-changes" rows="4"></textarea>
    </div>
    <div class="form-group">
      <label>Related Issue IDs (comma-separated)</label>
      <input type="text" id="cl-issues" placeholder="ISS-0001, ISS-0002">
    </div>
  `, () => {
    const version = $('#cl-version').value.trim();
    const title = $('#cl-title').value.trim();
    if (!version || !title) { showToast('Version and title required', 'error'); return; }
    if (!App.state.changelog) App.state.changelog = [];
    App.state.changelog.push({
      id: generateId('CHG'),
      version,
      date: $('#cl-date').value,
      title,
      description: $('#cl-desc').value.trim(),
      changes: $('#cl-changes').value.split('\n').map(s => s.trim()).filter(Boolean),
      issueIds: $('#cl-issues').value.split(',').map(s => s.trim()).filter(Boolean)
    });
    markDirty();
    renderChangelog();
    closeModal();
    showToast('Entry added', 'success');
  });
}

function editChangelogEntry(idx) {
  const entry = App.state.changelog[idx];
  openModal('Edit Changelog Entry', `
    <div class="form-row">
      <div class="form-group">
        <label>Version</label>
        <input type="text" id="cl-version" value="${escapeHtml(entry.version)}">
      </div>
      <div class="form-group">
        <label>Date</label>
        <input type="date" id="cl-date" value="${entry.date}">
      </div>
    </div>
    <div class="form-group">
      <label>Title</label>
      <input type="text" id="cl-title" value="${escapeHtml(entry.title)}">
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea id="cl-desc" rows="2">${escapeHtml(entry.description || '')}</textarea>
    </div>
    <div class="form-group">
      <label>Changes (one per line)</label>
      <textarea id="cl-changes" rows="4">${(entry.changes || []).join('\n')}</textarea>
    </div>
    <div class="form-group">
      <label>Related Issue IDs (comma-separated)</label>
      <input type="text" id="cl-issues" value="${(entry.issueIds || []).join(', ')}">
    </div>
  `, () => {
    entry.version = $('#cl-version').value.trim();
    entry.date = $('#cl-date').value;
    entry.title = $('#cl-title').value.trim();
    entry.description = $('#cl-desc').value.trim();
    entry.changes = $('#cl-changes').value.split('\n').map(s => s.trim()).filter(Boolean);
    entry.issueIds = $('#cl-issues').value.split(',').map(s => s.trim()).filter(Boolean);
    markDirty();
    renderChangelog();
    closeModal();
    showToast('Entry updated', 'success');
  });
}

function deleteChangelogEntry(idx) {
  showConfirm('Delete this changelog entry?', () => {
    App.state.changelog.splice(idx, 1);
    markDirty();
    renderChangelog();
  });
}

// ============================================
// RENDER: EXPORT TAB
// ============================================
function renderExport() {
  const container = $('#panel-export');
  if (!container) return;

  container.innerHTML = `
    <div class="export-grid">
      <!-- Import -->
      <div class="card">
        <div class="card-header">
          <h3>Import Data</h3>
        </div>
        <div class="card-body">
          <div class="drop-zone" id="import-dropzone">
            <p>Drop JSON file here or click to select</p>
            <input type="file" id="import-file" accept=".json" style="display: none;">
          </div>
        </div>
      </div>

      <!-- Export JSON -->
      <div class="card">
        <div class="card-header">
          <h3>Export JSON</h3>
        </div>
        <div class="card-body">
          <p>Export all data as a single JSON file.</p>
          <p class="help-text">Last saved: <span id="export-last-saved">${new Date(App.state.meta.updatedAt).toLocaleString('tr-TR')}</span></p>
          <button class="btn btn-primary" onclick="exportJSON()">Download JSON</button>
        </div>
      </div>

      <!-- Export CSV -->
      <div class="card">
        <div class="card-header">
          <h3>Export CSV</h3>
        </div>
        <div class="card-body">
          <p>Export specific data as CSV files.</p>
          <div class="export-buttons">
            <button class="btn btn-secondary" onclick="exportCSV('issues')">Issues (${App.state.issues?.length || 0})</button>
            <button class="btn btn-secondary" onclick="exportCSV('builds')">Builds (${App.state.builds?.length || 0})</button>
            <button class="btn btn-secondary" onclick="exportCSV('links')">Links (${App.state.links?.length || 0})</button>
            <button class="btn btn-secondary" onclick="exportCSV('checklist')">Checklists</button>
          </div>
        </div>
      </div>

      <!-- Print -->
      <div class="card">
        <div class="card-header">
          <h3>Print / PDF</h3>
        </div>
        <div class="card-body">
          <p>Print the current tab or save as PDF.</p>
          <button class="btn btn-secondary" onclick="window.print()">Print Current View</button>
        </div>
      </div>

      <!-- Clear Data -->
      <div class="card danger">
        <div class="card-header">
          <h3>⚠️ Danger Zone</h3>
        </div>
        <div class="card-body">
          <p>Clear all local data. This cannot be undone!</p>
          <button class="btn btn-danger" onclick="clearData()">Clear All Data</button>
        </div>
      </div>
    </div>
  `;

  // Setup drop zone
  const dropzone = $('#import-dropzone');
  const fileInput = $('#import-file');

  dropzone.onclick = () => fileInput.click();
  fileInput.onchange = (e) => {
    if (e.target.files[0]) importJSON(e.target.files[0]);
  };

  dropzone.ondragover = (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  };
  dropzone.ondragleave = () => dropzone.classList.remove('dragover');
  dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) importJSON(e.dataTransfer.files[0]);
  };
}

// ============================================
// EVENT LISTENERS
// ============================================
function initEventListeners() {
  // Navigation
  $$('.nav-item').forEach(item => {
    item.onclick = () => switchTab(item.dataset.tab);
  });

  // Save button
  $('#btn-save')?.addEventListener('click', saveData);

  // Modal
  $('#modal-close')?.addEventListener('click', closeModal);
  $('#modal-cancel')?.addEventListener('click', closeModal);
  $('#modal-save')?.addEventListener('click', saveModal);
  $('#modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  // Global search
  const searchInput = $('#global-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      const results = globalSearch(e.target.value);
      showSearchResults(results);
    }, 200));

    searchInput.addEventListener('blur', () => {
      setTimeout(() => $('#search-dropdown')?.classList.remove('open'), 200);
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      saveData();
    }

    // Escape to close modal/drawer/lightbox
    if (e.key === 'Escape') {
      closeModal();
      closeDrawer();
      closeLightbox();
    }

    // Cmd/Ctrl + Z to undo
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }

    // Cmd/Ctrl + Shift + Z to redo
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      redo();
    }

    // Lightbox navigation
    const lb = $('#lightbox');
    if (lb?.classList.contains('open')) {
      if (e.key === 'ArrowLeft') lightboxPrev();
      if (e.key === 'ArrowRight') lightboxNext();
    }
  });

  // Hash change for navigation
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash && hash !== App.currentTab) {
      switchTab(hash);
    }
  });

  // Warn before leaving with unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (App.isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

// ============================================
// INITIALIZATION
// ============================================
async function init() {
  console.log('Initializing Project HQ...');

  initEventListeners();
  await loadData();

  // Check hash for initial tab
  const hash = window.location.hash.slice(1);
  if (hash) {
    switchTab(hash);
  } else {
    switchTab('overview');
  }

  console.log('Project HQ initialized!');
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
