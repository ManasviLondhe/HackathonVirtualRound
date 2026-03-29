// ============================================================
// AdminApi.js — Flowpay Admin Service Layer
// Fully wired to FastAPI backend
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const getToken = () => localStorage.getItem('fp_token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

// Normalize backend role keys to frontend keys
// Backend: employee, manager, finance_head, director
// Frontend: employee, manager, finance,     director
export const normalizeUsers = (grouped) => ({
  employee: grouped.employee  || [],
  manager:  grouped.manager   || [],
  finance:  grouped.finance_head || [],
  director: grouped.director  || [],
});

// Map frontend role key back to backend role string
export const roleKeyToBackend = (roleKey) =>
  roleKey === 'finance' ? 'finance_head' : roleKey;

// Map backend role string to frontend role key
export const roleToKey = (role) =>
  role === 'finance_head' ? 'finance' : role;

// ============================================================
// 👤 USER SERVICE
// ============================================================

/**
 * Fetch all users grouped by role from the backend.
 * Returns { employee[], manager[], finance[], director[] }
 */
export const getUsers = async () => {
  const res = await fetch(`${BASE_URL}/admin/current-users`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  const data = await res.json();
  return normalizeUsers(data);
};

/**
 * Create a user and send invite email.
 * Backend handles email sending via saved SMTP settings.
 * @param {Object} userData - { name, email, password, role }
 */
export const createAndInviteUser = async (userData) => {
  const backendRole = roleKeyToBackend(
    userData.role === 'EMPLOYEE'     ? 'employee' :
    userData.role === 'MANAGER'      ? 'manager'  :
    userData.role === 'FINANCE_HEAD' ? 'finance_head' : 'director'
  );

  const res = await fetch(`${BASE_URL}/admin/users`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      name:     userData.name,
      email:    userData.email,
      password: userData.password,
      role:     backendRole,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create user');
  }
  return res.json(); // { id, message }
};

/**
 * Save SMTP credentials so the backend can send invite emails.
 */
export const saveSMTP = async (smtpEmail, smtpAppPassword) => {
  const res = await fetch(`${BASE_URL}/admin/settings/smtp`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      smtp_email:        smtpEmail,
      smtp_app_password: smtpAppPassword,
    }),
  });
  if (!res.ok) throw new Error('Failed to save SMTP settings');
  return res.json();
};

/**
 * Delete a user. Uses the correct endpoint based on role.
 * employees → DELETE /admin/employees/{id}
 * others    → DELETE /admin/approvers/{id}
 */
export const deleteUser = async (userId, roleKey) => {
  const endpoint = roleKey === 'employee'
    ? `${BASE_URL}/admin/employees/${userId}`
    : `${BASE_URL}/admin/approvers/${userId}`;

  const res = await fetch(endpoint, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete user');
  return res.json();
};

// ============================================================
// ⚙️ RULES SERVICE  (risk thresholds)
// ============================================================

/**
 * Fetch risk thresholds from DB.
 * Returns array: [{ id, risk_level, min_amount, max_amount }]
 * We convert to the shape the frontend expects:
 * { low: { limit, autoEscalate, flow }, medium: ..., high: ... }
 */
export const getRules = async () => {
  const res = await fetch(`${BASE_URL}/admin/risk-thresholds`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch risk thresholds');
  const rows = await res.json();

  // Build frontend shape with defaults
  const rules = {
    low:    { limit: 1000,  autoEscalate: false, flow: ['MANAGER'],                              id: null },
    medium: { limit: 5000,  autoEscalate: true,  flow: ['MANAGER', 'DECIDE'],                    id: null },
    high:   { limit: 10000, autoEscalate: true,  flow: ['MANAGER', 'FINANCE HEAD', 'DIRECTOR'],  id: null },
  };

  for (const row of rows) {
    const level = row.risk_level;
    if (rules[level]) {
      rules[level].limit = row.max_amount ?? rules[level].limit;
      rules[level].id    = row.id;
    }
  }
  return rules;
};

/**
 * Save a single risk threshold level.
 */
export const saveRuleLevel = async (level, limit) => {
  const res = await fetch(`${BASE_URL}/admin/risk-thresholds`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      risk_level: level,
      min_amount: 0,
      max_amount: limit,
    }),
  });
  if (!res.ok) throw new Error(`Failed to save ${level} threshold`);
  return res.json();
};

// ============================================================
// 🔗 RELATIONSHIPS SERVICE
// ============================================================

/**
 * Fetch all relationships from backend.
 * Returns raw array: [{ id, head_user_id, member_user_id, head_name, head_role, member_name, member_role }]
 * Converts to frontend grouped shape:
 * { managerEmployee: { managerId: [empId...] }, financeManager: {...}, directorFinance: {...} }
 */
export const getRelationships = async () => {
  const res = await fetch(`${BASE_URL}/admin/relationships`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch relationships');
  const rows = await res.json();

  const grouped = {
    managerEmployee: {},
    financeManager:  {},
    directorFinance: {},
    _raw: rows, // keep raw for delete operations
  };

  for (const row of rows) {
    const hRole = row.head_role;
    const mRole = row.member_role;

    let key = null;
    if (hRole === 'manager'      && mRole === 'employee')     key = 'managerEmployee';
    if (hRole === 'finance_head' && mRole === 'manager')      key = 'financeManager';
    if (hRole === 'director'     && mRole === 'finance_head') key = 'directorFinance';

    if (key) {
      if (!grouped[key][row.head_user_id]) grouped[key][row.head_user_id] = [];
      grouped[key][row.head_user_id].push(row.member_user_id);
    }
  }
  return grouped;
};

/**
 * Assign a head → members relationship.
 * Diffs current vs desired: adds new pairs, removes deleted ones.
 */
export const syncRelationship = async (headId, newMemberIds, currentRaw) => {
  // Find existing relationships for this head
  const existing = currentRaw.filter(r => r.head_user_id === headId);
  const existingMemberIds = existing.map(r => r.member_user_id);

  // Members to add
  const toAdd = newMemberIds.filter(id => !existingMemberIds.includes(id));
  // Members to remove
  const toRemove = existing.filter(r => !newMemberIds.includes(r.member_user_id));

  // Add new pairs
  for (const memberId of toAdd) {
    const res = await fetch(`${BASE_URL}/admin/relationships`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ head_user_id: headId, member_user_id: memberId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to add relationship');
    }
  }

  // Remove old pairs
  for (const row of toRemove) {
    const res = await fetch(`${BASE_URL}/admin/relationships/${row.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to remove relationship');
  }
};

// ============================================================
// 📊 STATS SERVICE
// ============================================================

/**
 * Build stats from users data (no dedicated stats endpoint exists).
 * Pass in the normalized users object.
 */
export const computeStats = (users) => {
  const allUsers = Object.values(users).flat();
  // last_seen within 5 minutes = "online"
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  return {
    totalUsers:       allUsers.length,
    pendingExpenses:  '—',   // no endpoint yet
    activeSessions:   allUsers.filter(u => u.last_seen && u.last_seen > fiveMinsAgo).length,
    approvedThisMonth:'—',   // no endpoint yet
  };
};

// ============================================================
// 🗃️ MOCK DATA — fallback only if backend is unreachable
// ============================================================

export const mockUsers = {
  employee: [
    { id: 1, name: 'John Employee', email: 'john@flowpay.com', last_seen: null, trust_score: 85,  created_at: '2024-01-15' },
    { id: 3, name: 'Riya Sharma',   email: 'riya@flowpay.com', last_seen: null, trust_score: 62,  created_at: '2024-03-05' },
  ],
  manager:  [
    { id: 4, name: 'Sarah Manager', email: 'sarah@flowpay.com', last_seen: new Date().toISOString(), created_at: '2023-11-10' },
    { id: 5, name: 'David Chen',    email: 'david@flowpay.com', last_seen: null, created_at: '2023-12-01' },
  ],
  finance:  [{ id: 6, name: 'Mike Finance',  email: 'mike@flowpay.com', last_seen: new Date().toISOString(), created_at: '2023-09-22' }],
  director: [{ id: 7, name: 'Lisa Director', email: 'lisa@flowpay.com', last_seen: null, created_at: '2023-01-01' }],
};

export const mockRules = {
  low:    { limit: 1000,  autoEscalate: false, flow: ['MANAGER'] },
  medium: { limit: 5000,  autoEscalate: true,  flow: ['MANAGER', 'DECIDE'] },
  high:   { limit: 10000, autoEscalate: true,  flow: ['MANAGER', 'FINANCE HEAD', 'DIRECTOR'] },
};

export const mockRelationships = {
  managerEmployee: { 4: [1, 2], 5: [3] },
  financeManager:  { 6: [4, 5] },
  directorFinance: { 7: [6] },
  _raw: [],
};

// updateRulesMock kept for AdminRules local toggle state
export const updateRulesMock = (rules) => ({ ...rules });
// assignRelationshipMock kept for optimistic local update
export const assignRelationshipMock = (type, fromId, toIds, current) => ({
  ...current,
  [type]: { ...current[type], [fromId]: toIds },
});