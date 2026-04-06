/* ================================
   DATA
   ================================ */
let assessments = [
  { id: 1, name: 'Despina Papastarantolpoulou', date: '2024-03-12', desc: 'Annual appraisal cycle',   active: true  },
  { id: 2, name: 'Anna Dimakopoulou',           date: '2024-03-15', desc: 'Mid-year review',          active: true  },
  { id: 3, name: 'Maritena Mira',               date: '2024-03-20', desc: 'Quarterly assessment',     active: false },
  { id: 4, name: 'Charalambos Simou',           date: '2024-03-22', desc: 'Team lead evaluation',     active: true  },
  { id: 5, name: 'John Smith',                  date: '2024-03-25', desc: 'Performance review',       active: false },
  { id: 6, name: 'Giorgos Pavlou',              date: '2024-03-28', desc: 'Annual appraisal cycle',   active: true  },
  { id: 7, name: 'Elissavet Roma',              date: '2024-03-30', desc: 'Competency check',         active: false },
  { id: 8, name: 'Alexis Tomb',                 date: '2024-04-01', desc: '360 feedback cycle',       active: true  },
];
let nextId    = 9;
let editingId = null;
let deleteId  = null;

/* ================================
   STATE
   ================================ */
let state = {
  search:  '',
  filter:  'all',
  sortKey: 'id',
  sortDir: 'asc',
  page:    1,
  perPage: 6,
};

/* ================================
   DOM REFERENCES
   ================================ */
const tableBody      = document.getElementById('tableBody');
const emptyState     = document.getElementById('emptyState');
const searchInput    = document.getElementById('searchInput');
const searchClear    = document.getElementById('searchClear');
const sortSelect     = document.getElementById('sortSelect');
const paginationInfo = document.getElementById('paginationInfo');
const paginationCtrl = document.getElementById('paginationControls');
const statTotal      = document.getElementById('statTotal');
const statActive     = document.getElementById('statActive');
const statInactive   = document.getElementById('statInactive');

const modalOverlay   = document.getElementById('modalOverlay');
const confirmOverlay = document.getElementById('confirmOverlay');
const modalTitle     = document.getElementById('modalTitle');
const submitLabel    = document.getElementById('submitLabel');
const openModalBtn   = document.getElementById('openModal');
const closeModalBtn  = document.getElementById('closeModal');
const cancelModal    = document.getElementById('cancelModal');
const submitBtn      = document.getElementById('submitAssessment');
const closeConfirm   = document.getElementById('closeConfirm');
const cancelConfirm  = document.getElementById('cancelConfirm');
const confirmDelete  = document.getElementById('confirmDelete');
const confirmNameEl  = document.getElementById('confirmName');
const hamburger      = document.getElementById('hamburger');
const navLinks       = document.getElementById('navLinks');

const fName   = document.getElementById('assessName');
const fDate   = document.getElementById('assessDate');
const fDesc   = document.getElementById('assessDesc');
const fActive = document.getElementById('assessActive');
const nameErr = document.getElementById('nameError');
const dateErr = document.getElementById('dateError');

/* ================================
   HAMBURGER
   ================================ */
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});
document.addEventListener('click', e => {
  if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  }
});

/* ================================
   STATS — always counts ALL assessments
   ================================ */
function updateStats() {
  const total    = assessments.length;
  const active   = assessments.filter(a => a.active === true).length;
  const inactive = assessments.filter(a => a.active !== true).length;

  statTotal.textContent    = total;
  statActive.textContent   = active;
  statInactive.textContent = inactive;
}

/* ================================
   FILTER + SORT
   ================================ */
function getFiltered() {
  let data = [...assessments];

  if (state.search) {
    const q = state.search.toLowerCase();
    data = data.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.desc.toLowerCase().includes(q)
    );
  }

  if (state.filter === 'active')   data = data.filter(a => a.active === true);
  if (state.filter === 'inactive') data = data.filter(a => a.active !== true);

  data.sort((a, b) => {
    let va, vb;
    if (state.sortKey === 'id')   { va = a.id;   vb = b.id;   }
    if (state.sortKey === 'name') { va = a.name; vb = b.name; }
    if (state.sortKey === 'date') { va = a.date; vb = b.date; }
    if (va < vb) return state.sortDir === 'asc' ? -1 : 1;
    if (va > vb) return state.sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  return data;
}

/* ================================
   RENDER
   ================================ */
function render() {
  // Always update stats from full array first
  updateStats();

  const filtered = getFiltered();
  const total    = filtered.length;
  const pages    = Math.max(1, Math.ceil(total / state.perPage));
  if (state.page > pages) state.page = pages;
  const start = (state.page - 1) * state.perPage;
  const slice = filtered.slice(start, start + state.perPage);

  // Empty state
  emptyState.style.display = total === 0 ? 'block' : 'none';

  // Table rows — # shows sequential position, not internal ID
  tableBody.innerHTML = '';
  slice.forEach((a, i) => {
    const rowNum = start + i + 1;
    const tr = document.createElement('tr');
    tr.style.animationDelay = `${i * 0.04}s`;
    tr.innerHTML = `
      <td class="row-num">${rowNum}</td>
      <td class="row-name">${escapeHtml(a.name)}</td>
      <td class="row-date">${formatDate(a.date)}</td>
      <td class="row-desc" title="${escapeHtml(a.desc)}">${escapeHtml(a.desc) || '<span style="color:#bbb">—</span>'}</td>
      <td><span class="badge ${a.active ? 'badge-active' : 'badge-inactive'}">${a.active ? 'Active' : 'Inactive'}</span></td>
      <td class="actions">
        <button class="btn-details"  data-id="${a.id}">Details</button>
        <button class="btn-edit"     data-id="${a.id}">Edit</button>
        <button class="btn-activate" data-id="${a.id}">${a.active ? 'Deactivate' : 'Activate'}</button>
        <button class="btn-delete"   data-id="${a.id}">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Pagination info
  paginationInfo.textContent = total === 0
    ? 'No results'
    : `Showing ${start + 1}–${Math.min(start + state.perPage, total)} of ${total}`;

  // Pagination buttons
  paginationCtrl.innerHTML = '';
  paginationCtrl.appendChild(makePageBtn('‹ Prev', state.page === 1, () => { state.page--; render(); }));
  for (let p = 1; p <= pages; p++) {
    const btn = makePageBtn(p, false, () => { state.page = p; render(); });
    if (p === state.page) btn.classList.add('active');
    paginationCtrl.appendChild(btn);
  }
  paginationCtrl.appendChild(makePageBtn('Next ›', state.page === pages, () => { state.page++; render(); }));

  // Sort arrows
  document.querySelectorAll('.sortable').forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
    if (th.dataset.col === state.sortKey) {
      th.classList.add(state.sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
    }
  });
}

function makePageBtn(label, disabled, onClick) {
  const btn = document.createElement('button');
  btn.className = 'page-btn';
  btn.textContent = label;
  btn.disabled = disabled;
  if (!disabled) btn.addEventListener('click', onClick);
  return btn;
}

/* ================================
   SEARCH
   ================================ */
searchInput.addEventListener('input', () => {
  state.search = searchInput.value;
  state.page   = 1;
  searchClear.classList.toggle('visible', state.search.length > 0);
  render();
});
searchClear.addEventListener('click', () => {
  searchInput.value = '';
  state.search = '';
  state.page   = 1;
  searchClear.classList.remove('visible');
  render();
});

/* ================================
   FILTER BUTTONS
   ================================ */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.filter = btn.dataset.filter;
    state.page   = 1;
    render();
  });
});

/* ================================
   SORT SELECT
   ================================ */
sortSelect.addEventListener('change', () => {
  const [key, dir] = sortSelect.value.split('-');
  state.sortKey = key;
  state.sortDir = dir;
  state.page    = 1;
  render();
});

/* ================================
   COLUMN HEADERS SORT
   ================================ */
document.querySelectorAll('.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.col;
    if (state.sortKey === col) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortKey = col;
      state.sortDir = 'asc';
    }
    state.page = 1;
    render();
  });
});

/* ================================
   TABLE ACTIONS
   ================================ */
tableBody.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id  = parseInt(btn.dataset.id, 10);
  const idx = assessments.findIndex(x => x.id === id);
  if (idx === -1) return;

  if (btn.classList.contains('btn-details')) {
    const a = assessments[idx];
    showToast('ℹ️', `${a.name} — ${a.desc || 'No description'}`, 'info');
  }

  if (btn.classList.contains('btn-edit')) {
    openEdit(assessments[idx]);
  }

  if (btn.classList.contains('btn-activate')) {
    // Explicit boolean toggle — no ambiguity
    assessments[idx].active = assessments[idx].active !== true;
    const label = assessments[idx].active ? 'Active' : 'Inactive';
    showToast('✅', `${assessments[idx].name} marked as ${label}.`, 'success');
    render();
  }

  if (btn.classList.contains('btn-delete')) {
    deleteId = id;
    confirmNameEl.textContent = assessments[idx].name;
    confirmOverlay.classList.add('active');
  }
});

/* ================================
   CREATE MODAL
   ================================ */
openModalBtn.addEventListener('click', () => {
  editingId               = null;
  modalTitle.textContent  = 'Create Assessment';
  submitLabel.textContent = 'Create';
  clearForm();
  modalOverlay.classList.add('active');
  fName.focus();
});

function openEdit(a) {
  editingId               = a.id;
  modalTitle.textContent  = 'Edit Assessment';
  submitLabel.textContent = 'Save Changes';
  fName.value    = a.name;
  fDate.value    = a.date;
  fDesc.value    = a.desc;
  fActive.checked = a.active === true;
  clearErrors();
  modalOverlay.classList.add('active');
  fName.focus();
}

[closeModalBtn, cancelModal].forEach(btn =>
  btn.addEventListener('click', () => { modalOverlay.classList.remove('active'); clearForm(); })
);
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) { modalOverlay.classList.remove('active'); clearForm(); }
});

/* ================================
   SUBMIT (Create / Edit)
   ================================ */
submitBtn.addEventListener('click', () => {
  if (!validateForm()) return;

  const name   = fName.value.trim();
  const date   = fDate.value;
  const desc   = fDesc.value.trim();
  const active = fActive.checked === true;   // explicit boolean

  if (editingId !== null) {
    const idx = assessments.findIndex(x => x.id === editingId);
    if (idx !== -1) {
      assessments[idx].name   = name;
      assessments[idx].date   = date;
      assessments[idx].desc   = desc;
      assessments[idx].active = active;
    }
    showToast('✏️', `"${name}" updated successfully.`, 'success');
  } else {
    assessments.push({ id: nextId++, name, date, desc, active });
    showToast('🎉', `"${name}" created successfully.`, 'success');
  }

  modalOverlay.classList.remove('active');
  clearForm();
  render();
});

/* ================================
   DELETE CONFIRM
   ================================ */
[closeConfirm, cancelConfirm].forEach(btn =>
  btn.addEventListener('click', () => { confirmOverlay.classList.remove('active'); deleteId = null; })
);
confirmOverlay.addEventListener('click', e => {
  if (e.target === confirmOverlay) { confirmOverlay.classList.remove('active'); deleteId = null; }
});

confirmDelete.addEventListener('click', () => {
  const idx = assessments.findIndex(x => x.id === deleteId);
  if (idx !== -1) {
    const name = assessments[idx].name;
    assessments.splice(idx, 1);
    showToast('🗑', `"${name}" deleted.`, 'info');
    render();
  }
  confirmOverlay.classList.remove('active');
  deleteId = null;
});

/* ================================
   ESCAPE KEY
   ================================ */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (modalOverlay.classList.contains('active'))   { modalOverlay.classList.remove('active');   clearForm(); }
  if (confirmOverlay.classList.contains('active')) { confirmOverlay.classList.remove('active'); deleteId = null; }
});

/* ================================
   VALIDATION
   ================================ */
function validateForm() {
  let ok = true;
  clearErrors();
  if (!fName.value.trim()) {
    nameErr.textContent = 'Name is required.';
    fName.classList.add('error');
    ok = false;
  }
  if (!fDate.value) {
    dateErr.textContent = 'Date is required.';
    fDate.classList.add('error');
    ok = false;
  }
  return ok;
}

function clearErrors() {
  nameErr.textContent = '';
  dateErr.textContent = '';
  fName.classList.remove('error');
  fDate.classList.remove('error');
}

/* ================================
   UTILITIES
   ================================ */
function clearForm() {
  fName.value     = '';
  fDate.value     = '';
  fDesc.value     = '';
  fActive.checked = false;
  editingId       = null;
  clearErrors();
}

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ================================
   TOAST
   ================================ */
function showToast(icon, msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${escapeHtml(msg)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 3200);
}

/* ================================
   INIT
   ================================ */
render();
