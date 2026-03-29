// AdminDashboard.jsx — wired to real FastAPI backend

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Mail,
  X,
  RefreshCw,
} from "lucide-react";
import AdminUserManagement from "./Adminusermanagement";
import AdminRules from "./Adminrules";
import AdminRelationship from "./Adminrelationship";
import {
  getUsers,
  createAndInviteUser,
  saveSMTP,
  computeStats,
  mockUsers,
} from "../services/Adminapi";
import "../style/Admin.css";

// ── Helpers ──────────────────────────────────────────────────
const isOnline = (lastSeen) => {
  if (!lastSeen) return false;
  return new Date(lastSeen) > new Date(Date.now() - 5 * 60 * 1000);
};

// ── Toast ────────────────────────────────────────────────────
function Toast({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => onRemove(t.id)}
        >
          <span>
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, change, delay }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay || 0);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className="stat-card"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
      }}
    >
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        <div className="stat-icon">
          <Icon size={18} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-change">
        <ArrowUpRight size={13} />
        {change} from last month
      </div>
    </div>
  );
}

// ── User Row ─────────────────────────────────────────────────
function UserRow({ u, roleKey, role, showTrust }) {
  const online = isOnline(u.last_seen);
  return (
    <tr>
      <td>
        <div className="user-cell">
          <div className={`user-avatar avatar-${roleKey}`}>
            {u.name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontWeight: 500 }}>{u.name}</span>
        </div>
      </td>
      <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
      <td>
        <div className="status-cell">
          <span
            className={`status-dot ${online ? "status-online" : "status-offline"}`}
          />
          <span
            style={{
              textTransform: "capitalize",
              color: online ? "var(--green-cash)" : "var(--text-muted)",
            }}
          >
            {online ? "online" : "offline"}
          </span>
        </div>
      </td>
      <td>
        <span className={`badge badge-${roleKey}`}>{role}</span>
      </td>
      {showTrust && (
        <td>
          <div className="trust-bar-wrap">
            <div className="trust-bar">
              <div
                className={`trust-fill ${(u.trust_score ?? 0) >= 80 ? "trust-high" : (u.trust_score ?? 0) >= 50 ? "trust-medium" : "trust-low"}`}
                style={{ width: `${u.trust_score ?? 0}%` }}
              />
            </div>
            <span className="trust-value">{u.trust_score ?? "—"}</span>
          </div>
        </td>
      )}
    </tr>
  );
}

// ── Role Table ───────────────────────────────────────────────
function RoleTable({ users, roleKey, label, role }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 10,
        }}
      >
        {label}
      </h3>
      <div className="fp-table-wrap">
        <table className="fp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Role</th>
              {roleKey === "employee" && <th>Trust Score</th>}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={roleKey === "employee" ? 5 : 4}>
                  No {label.toLowerCase()} found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <UserRow
                  key={u.id}
                  u={u}
                  roleKey={roleKey}
                  role={role}
                  showTrust={roleKey === "employee"}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Create & Invite Modal ─────────────────────────────────────
function InviteUserModal({ onClose, onSuccess, addToast }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    smtpEmail: "",
    smtpAppPassword: "",
    companyName: "",
    saveSMTPSettings: false,
  });
  const [loading, setLoading] = useState(false);

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = async () => {
    const { name, email, password, role, smtpEmail, smtpAppPassword } = form;
    if (!name || !email || !password) {
      addToast("Name, email and password are required", "error");
      return;
    }
    setLoading(true);
    try {
      // Optionally save SMTP settings to backend first
      if (smtpEmail && smtpAppPassword) {
        await saveSMTP(smtpEmail, smtpAppPassword);
      }
      await createAndInviteUser({ name, email, password, role });
      addToast(`User created! Invite email sent to ${email}.`, "success");
      onSuccess();
      onClose();
    } catch (err) {
      addToast(err.message || "Failed to create user", "error");
    } finally {
      setLoading(false);
    }
  };

  const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
  };
  const modal = {
    background: "var(--black-card)",
    border: "1px solid var(--black-border)",
    borderRadius: "var(--radius-md)",
    padding: 28,
    width: 460,
    maxWidth: "90vw",
    boxShadow: "var(--shadow-deep)",
    maxHeight: "90vh",
    overflowY: "auto",
  };
  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--black-border)",
    background: "var(--black-bg)",
    color: "var(--text-primary)",
    fontSize: 14,
    boxSizing: "border-box",
    marginTop: 4,
  };
  const labelStyle = {
    fontSize: 13,
    color: "var(--text-secondary)",
    display: "block",
    marginBottom: 12,
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Create & Invite User
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* User Details */}
        <p
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          User Details
        </p>
        <label style={labelStyle}>
          Full Name
          <input style={inputStyle} placeholder="Jane Doe" {...field("name")} />
        </label>
        <label style={labelStyle}>
          Email Address
          <input
            style={inputStyle}
            type="email"
            placeholder="jane@company.com"
            {...field("email")}
          />
        </label>
        <label style={labelStyle}>
          Temporary Password
          <input
            style={inputStyle}
            type="text"
            placeholder="They'll use this to log in"
            {...field("password")}
          />
        </label>
        <label style={labelStyle}>
          Role
          <select style={inputStyle} {...field("role")}>
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
            <option value="FINANCE_HEAD">Finance Head</option>
            <option value="DIRECTOR">Director</option>
          </select>
        </label>

        {/* SMTP — optional override */}
        <p
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            margin: "16px 0 4px",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Email Settings{" "}
          <span
            style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}
          >
            (optional — only needed if not saved yet)
          </span>
        </p>
        <label style={labelStyle}>
          Gmail Address
          <input
            style={inputStyle}
            type="email"
            placeholder="admin@gmail.com"
            {...field("smtpEmail")}
          />
        </label>
        <label style={labelStyle}>
          Gmail App Password
          <input
            style={inputStyle}
            type="password"
            placeholder="xxxx xxxx xxxx xxxx"
            {...field("smtpAppPassword")}
          />
        </label>

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 16,
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              "Sending…"
            ) : (
              <>
                <Mail size={14} /> Send Invite
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main AdminDashboard ──────────────────────────────────────
export default function AdminDashboard() {
  const [users, setUsers] = useState(mockUsers);
  const [loadingUsers, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toasts, setToasts] = useState([]);
  const [showSignOut, setShowSignOut] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3500,
    );
  };
  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Fetch users from backend ──
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const fresh = await getUsers();
      setUsers(fresh);
    } catch (err) {
      addToast("Could not load users — showing cached data", "info");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const stats = computeStats(users);

  const liveStats = [
    {
      label: "Total Users",
      value: loadingUsers ? "…" : Object.values(users).flat().length,
      icon: Users,
      change: "",
    },
    {
      label: "Pending Expenses",
      value: stats.pendingExpenses,
      icon: DollarSign,
      change: "",
    },
    {
      label: "Active Sessions",
      value: loadingUsers ? "…" : stats.activeSessions,
      icon: Activity,
      change: "",
    },
    {
      label: "Approved This Month",
      value: stats.approvedThisMonth,
      icon: TrendingUp,
      change: "",
    },
  ];

  const navItems = [
    { id: "dashboard", icon: "⊞", label: "Dashboard" },
    { id: "users", icon: "👤", label: "User Management" },
    { id: "rules", icon: "🛡", label: "Rules Engine" },
    { id: "relationships", icon: "⟳", label: "Relationships" },
    { id: "active", icon: "◉", label: "Active Users" },
  ];

  const roleTables = [
    { key: "employee", label: "Employees", role: "EMPLOYEE" },
    { key: "manager", label: "Managers", role: "MANAGER" },
    { key: "finance", label: "Finance Heads", role: "FINANCE HEAD" },
    { key: "director", label: "Directors", role: "DIRECTOR" },
  ];

  return (
    <div className="admin-shell">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <div className="logo-box">
            <span className="logo-f">F</span>
          </div>
          <span className="logo-text">Flowpay</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ position: "relative" }}>
          {showSignOut && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: 8,
                right: 8,
                background: "var(--black-card)",
                border: "1px solid var(--black-border)",
                borderRadius: "var(--radius-md)",
                padding: "8px",
                marginBottom: "4px",
                zIndex: 100,
                boxShadow: "var(--shadow-deep)",
              }}
            >
              <button
                className="nav-item"
                style={{ color: "var(--red-risk)", width: "100%" }}
                onClick={() => {
                  setShowSignOut(false);
                  localStorage.clear();
                  window.location.href = "/login";
                }}
              >
                <span>↩</span>
                <span className="sidebar-label">Sign Out</span>
              </button>
            </div>
          )}
          <div
            className="sidebar-user"
            style={{ cursor: "pointer", padding: "14px 16px" }}
            onClick={() => setShowSignOut((prev) => !prev)}
          >
            <div className="sidebar-avatar avatar-admin">A</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Admin User</div>
              <div className="sidebar-user-role">Admin</div>
            </div>
            <span
              style={{
                color: "var(--text-muted)",
                fontSize: 11,
                marginLeft: "auto",
              }}
            >
              {showSignOut ? "▼" : "▲"}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="admin-main">
        <main className="admin-content">
          <div className="page-wrapper">
            {/* ── Dashboard ── */}
            {activeTab === "dashboard" && (
              <div className="fade-in">
                <div className="page-header">
                  <div>
                    <h1 className="page-title">Admin Dashboard</h1>
                    <p className="page-subtitle">Manage your organization</p>
                  </div>
                  <div className="page-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={fetchUsers}
                      disabled={loadingUsers}
                    >
                      <RefreshCw
                        size={14}
                        className={loadingUsers ? "spin" : ""}
                      />
                      {loadingUsers ? "Loading…" : "Refresh"}
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowInviteModal(true)}
                    >
                      <Plus size={14} /> Create & Invite User
                    </button>
                  </div>
                </div>

                <div className="stats-grid">
                  {liveStats.map((s, i) => (
                    <StatCard key={s.label} {...s} delay={i * 80} />
                  ))}
                </div>

                <div className="glass-card" style={{ padding: 24 }}>
                  <div className="section-title">
                    <Users size={18} className="section-icon" />
                    User Management
                    {loadingUsers && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          marginLeft: 8,
                        }}
                      >
                        Loading…
                      </span>
                    )}
                  </div>
                  {roleTables.map(({ key, label, role }) => (
                    <RoleTable
                      key={key}
                      users={users[key] || []}
                      roleKey={key}
                      label={label}
                      role={role}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── User Management ── */}
            {activeTab === "users" && (
              <AdminUserManagement
                users={users}
                setUsers={setUsers}
                addToast={addToast}
                refreshUsers={fetchUsers}
              />
            )}

            {/* ── Rules Engine ── */}
            {activeTab === "rules" && <AdminRules addToast={addToast} />}

            {/* ── Relationships ── */}
            {activeTab === "relationships" && (
              <AdminRelationship users={users} addToast={addToast} />
            )}

            {/* ── Active Users ── */}
            {activeTab === "active" && (
              <div className="fade-in">
                <div className="page-header">
                  <div>
                    <h1 className="page-title">Active Users</h1>
                    <p className="page-subtitle">
                      Members active in the last 5 minutes
                    </p>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={fetchUsers}
                    disabled={loadingUsers}
                  >
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
                <div className="glass-card" style={{ padding: 24 }}>
                  <div className="fp-table-wrap">
                    <table className="fp-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Last Seen</th>
                          <th>Trust Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(users).flatMap(([roleKey, list]) =>
                          list
                            .filter((u) => isOnline(u.last_seen))
                            .map((u) => (
                              <tr key={u.id}>
                                <td>
                                  <div className="user-cell">
                                    <div
                                      className={`user-avatar avatar-${roleKey}`}
                                    >
                                      {u.name.charAt(0)}
                                    </div>
                                    <span style={{ fontWeight: 500 }}>
                                      {u.name}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ color: "var(--text-secondary)" }}>
                                  {u.email}
                                </td>
                                <td>
                                  <span className={`badge badge-${roleKey}`}>
                                    {roleKey.replace("_", " ").toUpperCase()}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    color: "var(--text-muted)",
                                    fontSize: 12,
                                  }}
                                >
                                  {u.last_seen
                                    ? new Date(u.last_seen).toLocaleTimeString()
                                    : "—"}
                                </td>
                                <td>
                                  {u.trust_score !== undefined ? (
                                    <div className="trust-bar-wrap">
                                      <div className="trust-bar">
                                        <div
                                          className="trust-fill trust-high"
                                          style={{ width: `${u.trust_score}%` }}
                                        />
                                      </div>
                                      <span className="trust-value">
                                        {u.trust_score}
                                      </span>
                                    </div>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                              </tr>
                            )),
                        )}
                        {Object.values(users)
                          .flat()
                          .filter((u) => isOnline(u.last_seen)).length ===
                          0 && (
                          <tr className="empty-row">
                            <td colSpan={5}>
                              No users active in the last 5 minutes
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />

      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={fetchUsers}
          addToast={addToast}
        />
      )}
    </div>
  );
}
