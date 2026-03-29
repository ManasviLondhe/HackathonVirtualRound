// AdminUserManagement.jsx — wired to real FastAPI backend

import { useState } from "react";
import { Plus, Mail, Trash2, X, Send, RefreshCw } from "lucide-react";
import {
  createAndInviteUser,
  deleteUser,
  saveSMTP,
} from "../services/Adminapi";

// ── Create & Invite Modal ────────────────────────────────────
function CreateInviteModal({ onClose, onSubmit, addToast }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    smtpEmail: "",
    smtpAppPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = async () => {
    const { name, email, password, role, smtpEmail, smtpAppPassword } = form;
    if (!name.trim() || !email.trim() || !password.trim()) {
      addToast("Name, email and password are required", "error");
      return;
    }
    setLoading(true);
    try {
      // Save SMTP if provided
      if (smtpEmail && smtpAppPassword) {
        await saveSMTP(smtpEmail, smtpAppPassword);
      }
      const result = await createAndInviteUser({ name, email, password, role });
      addToast(`User created! Invite sent to ${email}.`, "success");
      onSubmit({ name, email, password, role, id: result.id });
      onClose();
    } catch (err) {
      addToast(err.message || "Failed to create user", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal slide-up"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-title">
            <Mail size={16} /> Create & Invite User
          </span>
          <button className="modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className="modal-body">
          {/* User Details */}
          <p
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            User Details
          </p>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              placeholder="Jane Doe"
              {...field("name")}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="jane@company.com"
              {...field("email")}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Temporary Password</label>
            <input
              className="form-input"
              type="text"
              placeholder="They'll use this to log in"
              {...field("password")}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" {...field("role")}>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="FINANCE_HEAD">Finance Head</option>
              <option value="DIRECTOR">Director</option>
            </select>
          </div>

          {/* SMTP override */}
          <p
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginTop: 8,
              marginBottom: 4,
            }}
          >
            Email Settings{" "}
            <span
              style={{
                fontWeight: 400,
                textTransform: "none",
                letterSpacing: 0,
              }}
            >
              (optional)
            </span>
          </p>
          <div className="form-group">
            <label className="form-label">Gmail Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="admin@gmail.com"
              {...field("smtpEmail")}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Gmail App Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="xxxx xxxx xxxx xxxx"
              {...field("smtpAppPassword")}
            />
          </div>
        </div>

        <div className="modal-footer">
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
              "Creating…"
            ) : (
              <>
                <Send size={14} /> Create & Invite
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Delete Modal ─────────────────────────────────────
function DeleteModal({ user, onClose, onConfirm, loading }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal slide-up"
        style={{ maxWidth: 380 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-title" style={{ color: "var(--red-risk)" }}>
            <Trash2 size={16} /> Delete User
          </span>
          <button className="modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Are you sure you want to delete{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {user?.name}
            </strong>
            ? This cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              "Deleting…"
            ) : (
              <>
                <Trash2 size={14} /> Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Role Config ──────────────────────────────────────────────
const ROLE_CONFIG = [
  {
    key: "employee",
    label: "Employees",
    role: "EMPLOYEE",
    badgeKey: "employee",
  },
  { key: "manager", label: "Managers", role: "MANAGER", badgeKey: "manager" },
  {
    key: "finance",
    label: "Finance Heads",
    role: "FINANCE_HEAD",
    badgeKey: "finance",
  },
  {
    key: "director",
    label: "Directors",
    role: "DIRECTOR",
    badgeKey: "director",
  },
];

const isOnline = (lastSeen) => {
  if (!lastSeen) return false;
  return new Date(lastSeen) > new Date(Date.now() - 5 * 60 * 1000);
};

// ── Main Component ───────────────────────────────────────────
export default function AdminUserManagement({
  users,
  setUsers,
  addToast,
  refreshUsers,
}) {
  const [showCreateInvite, setShowCreateInvite] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState("all");

  // Optimistically add user to local state (status: pending until backend confirms)
  const handleCreateUser = (form) => {
    const roleKey =
      form.role === "EMPLOYEE"
        ? "employee"
        : form.role === "MANAGER"
          ? "manager"
          : form.role === "FINANCE_HEAD"
            ? "finance"
            : "director";

    const newUser = {
      id: form.id || Date.now(),
      name: form.name,
      email: form.email,
      last_seen: null,
      trust_score: form.role === "EMPLOYEE" ? 100 : undefined,
      created_at: new Date().toISOString().split("T")[0],
      _pending: true,
    };

    setUsers((prev) => ({
      ...prev,
      [roleKey]: [...(prev[roleKey] || []), newUser],
    }));

    // Refresh from backend after a short delay to get the real record
    setTimeout(() => refreshUsers(), 1500);
  };

  // Delete user from backend, then remove from local state
  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteUser(deleteTarget.user.id, deleteTarget.roleKey);
      setUsers((prev) => ({
        ...prev,
        [deleteTarget.roleKey]: prev[deleteTarget.roleKey].filter(
          (u) => u.id !== deleteTarget.user.id,
        ),
      }));
      addToast(`User "${deleteTarget.user.name}" deleted.`, "info");
    } catch (err) {
      addToast(err.message || "Failed to delete user", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const visibleRoles =
    activeRoleTab === "all"
      ? ROLE_CONFIG
      : ROLE_CONFIG.filter((r) => r.key === activeRoleTab);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            Create, view, and manage all organization users
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={refreshUsers}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateInvite(true)}
          >
            <Plus size={14} /> Create & Invite User
          </button>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}
      >
        {[
          { key: "all", label: "All Users" },
          ...ROLE_CONFIG.map((r) => ({ key: r.key, label: r.label })),
        ].map((tab) => (
          <button
            key={tab.key}
            className={`topbar-tab ${activeRoleTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveRoleTab(tab.key)}
          >
            {tab.label}
            <span style={{ marginLeft: 6, opacity: 0.7, fontSize: 11 }}>
              (
              {tab.key === "all"
                ? Object.values(users).flat().length
                : (users[tab.key]?.length ?? 0)}
              )
            </span>
          </button>
        ))}
      </div>

      {/* Tables per role */}
      {visibleRoles.map(({ key, label, role, badgeKey }) => (
        <div
          key={key}
          className="glass-card"
          style={{ padding: 24, marginBottom: 20 }}
        >
          <div className="section-title">
            <span className="section-icon">●</span>
            {label}
            <span
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginLeft: 8,
              }}
            >
              {users[key]?.length ?? 0} user
              {(users[key]?.length ?? 0) !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="fp-table-wrap">
            <table className="fp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Role</th>
                  {key === "employee" && <th>Trust Score</th>}
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(users[key]?.length ?? 0) === 0 ? (
                  <tr className="empty-row">
                    <td colSpan={key === "employee" ? 7 : 6}>
                      No {label.toLowerCase()} found
                    </td>
                  </tr>
                ) : (
                  users[key].map((u) => {
                    const online = isOnline(u.last_seen);
                    const pending = u._pending;
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="user-cell">
                            <div className={`user-avatar avatar-${badgeKey}`}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 500 }}>{u.name}</span>
                            {pending && (
                              <span
                                style={{
                                  fontSize: 10,
                                  color: "var(--amber-warn)",
                                  marginLeft: 6,
                                }}
                              >
                                invite sent
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {u.email}
                        </td>
                        <td>
                          <div className="status-cell">
                            <span
                              className={`status-dot ${pending ? "status-offline" : online ? "status-online" : "status-offline"}`}
                            />
                            <span
                              style={{
                                textTransform: "capitalize",
                                color: pending
                                  ? "var(--amber-warn)"
                                  : online
                                    ? "var(--green-cash)"
                                    : "var(--text-muted)",
                              }}
                            >
                              {pending
                                ? "pending"
                                : online
                                  ? "online"
                                  : "offline"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${badgeKey}`}>
                            {role.replace("_", " ")}
                          </span>
                        </td>
                        {key === "employee" && (
                          <td>
                            <div className="trust-bar-wrap">
                              <div className="trust-bar">
                                <div
                                  className={`trust-fill ${(u.trust_score ?? 0) >= 80 ? "trust-high" : (u.trust_score ?? 0) >= 50 ? "trust-medium" : "trust-low"}`}
                                  style={{ width: `${u.trust_score ?? 0}%` }}
                                />
                              </div>
                              <span className="trust-value">
                                {u.trust_score ?? "—"}
                              </span>
                            </div>
                          </td>
                        )}
                        <td
                          style={{ color: "var(--text-muted)", fontSize: 12 }}
                        >
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              setDeleteTarget({ user: u, role, roleKey: key })
                            }
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {showCreateInvite && (
        <CreateInviteModal
          onClose={() => setShowCreateInvite(false)}
          onSubmit={handleCreateUser}
          addToast={addToast}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          user={deleteTarget.user}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteUser}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
