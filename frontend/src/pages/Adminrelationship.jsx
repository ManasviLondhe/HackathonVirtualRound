// AdminRelationship.jsx — wired to real FastAPI backend (/admin/relationships)

import { useState, useEffect, useCallback } from "react";
import {
  GitBranch,
  Users,
  UserCheck,
  ChevronDown,
  Save,
  RefreshCw,
} from "lucide-react";
import { getRelationships, syncRelationship } from "../services/Adminapi";

// ── Org Card ─────────────────────────────────────────────────
function OrgCard({ user, roleKey, selected, onClick }) {
  return (
    <div
      className={`org-card ${selected ? "selected-card" : ""}`}
      onClick={onClick}
    >
      <div className={`user-avatar avatar-${roleKey}`}>
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {user.name}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          {user.email}
        </div>
      </div>
    </div>
  );
}

// ── Assignment Panel ─────────────────────────────────────────
function AssignmentPanel({
  title,
  icon: Icon,
  supervisors,
  subordinates,
  relationships,
  relKey,
  onAssign,
  saving,
}) {
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [selectedSubs, setSelectedSubs] = useState([]);

  const handleSupervisorSelect = (sup) => {
    setSelectedSupervisor(sup.id);
    setSelectedSubs(relationships[sup.id] || []);
  };

  const toggleSub = (subId) => {
    setSelectedSubs((prev) =>
      prev.includes(subId)
        ? prev.filter((id) => id !== subId)
        : [...prev, subId],
    );
  };

  const handleSave = () => {
    if (!selectedSupervisor) return;
    onAssign(relKey, selectedSupervisor, selectedSubs);
  };

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div className="section-title">
        <Icon size={18} className="section-icon" />
        {title}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Supervisors */}
        <div>
          <p
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              marginBottom: 10,
            }}
          >
            Select Supervisor
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {supervisors.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                None available
              </p>
            ) : (
              supervisors.map((s) => (
                <OrgCard
                  key={s.id}
                  user={s}
                  roleKey={s._roleKey || "manager"}
                  selected={selectedSupervisor === s.id}
                  onClick={() => handleSupervisorSelect(s)}
                />
              ))
            )}
          </div>
        </div>

        {/* Subordinates */}
        <div>
          <p
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              marginBottom: 10,
            }}
          >
            Assign To
          </p>
          {!selectedSupervisor ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              ← Select a supervisor first
            </p>
          ) : subordinates.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              None available
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {subordinates.map((sub) => {
                const assigned = selectedSubs.includes(sub.id);
                return (
                  <div
                    key={sub.id}
                    className={`org-card ${assigned ? "selected-card" : ""}`}
                    onClick={() => toggleSub(sub.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className={`user-avatar avatar-${sub._roleKey || "employee"}`}
                    >
                      {sub.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {sub.name}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "var(--text-secondary)" }}
                      >
                        {sub.email}
                      </div>
                    </div>
                    {assigned && <span style={{ fontSize: 16 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedSupervisor && (
        <div
          style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}
        >
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={13} /> {saving ? "Saving…" : "Save Assignment"}
          </button>
        </div>
      )}

      {/* Summary Table */}
      {Object.keys(relationships).length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className="divider" style={{ margin: "16px 0" }} />
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginBottom: 10,
            }}
          >
            Current Assignments
          </p>
          <div className="fp-table-wrap">
            <table className="fp-table">
              <thead>
                <tr>
                  <th>Supervisor</th>
                  <th>Assigned Members</th>
                </tr>
              </thead>
              <tbody>
                {supervisors.map((sup) => {
                  const assignedIds = relationships[sup.id] || [];
                  const assignedMembers = subordinates.filter((s) =>
                    assignedIds.includes(s.id),
                  );
                  return (
                    <tr key={sup.id}>
                      <td>
                        <div className="user-cell">
                          <div
                            className={`user-avatar avatar-${sup._roleKey || "manager"}`}
                            style={{ width: 28, height: 28, fontSize: 11 }}
                          >
                            {sup.name.charAt(0)}
                          </div>
                          <span style={{ fontWeight: 500, fontSize: 13 }}>
                            {sup.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div
                          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        >
                          {assignedMembers.length === 0 ? (
                            <span
                              style={{
                                color: "var(--text-muted)",
                                fontSize: 12,
                              }}
                            >
                              None assigned
                            </span>
                          ) : (
                            assignedMembers.map((m) => (
                              <span
                                key={m.id}
                                className={`badge badge-${m._roleKey || "employee"}`}
                                style={{ fontSize: 10 }}
                              >
                                {m.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function AdminRelationship({ users, addToast }) {
  const [relationships, setRelationships] = useState({
    managerEmployee: {},
    financeManager: {},
    directorFinance: {},
    _raw: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const employees = (users.employee || []).map((u) => ({
    ...u,
    _roleKey: "employee",
  }));
  const managers = (users.manager || []).map((u) => ({
    ...u,
    _roleKey: "manager",
  }));
  const finances = (users.finance || []).map((u) => ({
    ...u,
    _roleKey: "finance",
  }));
  const directors = (users.director || []).map((u) => ({
    ...u,
    _roleKey: "director",
  }));

  // ── Fetch relationships from backend ──
  const fetchRelationships = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRelationships();
      setRelationships(data);
    } catch (err) {
      addToast("Could not load relationships", "info");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  // ── Sync a head → members relationship with the backend ──
  const handleAssign = async (relKey, headId, newMemberIds) => {
    setSaving(true);
    try {
      await syncRelationship(headId, newMemberIds, relationships._raw);
      // Optimistically update local state
      setRelationships((prev) => ({
        ...prev,
        [relKey]: { ...prev[relKey], [headId]: newMemberIds },
      }));
      addToast("Relationships saved to database!", "success");
      // Refresh to get updated _raw for future syncs
      fetchRelationships();
    } catch (err) {
      addToast(err.message || "Failed to save relationships", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Relationship Builder</h1>
          <p className="page-subtitle">
            Map reporting relationships and team structure
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={fetchRelationships}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Org Hierarchy Visual */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div className="section-title">
          <GitBranch size={18} className="section-icon" />
          Organization Hierarchy
        </div>
        {[
          {
            levelKey: "director",
            label: "Directors",
            data: directors,
            roleKey: "director",
          },
          {
            levelKey: "finance",
            label: "Finance Heads",
            data: finances,
            roleKey: "finance",
          },
          {
            levelKey: "manager",
            label: "Managers",
            data: managers,
            roleKey: "manager",
          },
          {
            levelKey: "employee",
            label: "Employees",
            data: employees,
            roleKey: "employee",
          },
        ].map(({ levelKey, label, data, roleKey }, idx, arr) => (
          <div key={levelKey}>
            <div className="org-level">
              <p className="org-level-label">{label}</p>
              <div className="org-cards">
                {data.length === 0 ? (
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    No {label.toLowerCase()} configured
                  </p>
                ) : (
                  data.map((u) => (
                    <div
                      key={u.id}
                      className="org-card"
                      style={{ cursor: "default" }}
                    >
                      <div className={`user-avatar avatar-${roleKey}`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {u.name}
                        </div>
                        <span
                          className={`badge badge-${roleKey === "finance" ? "finance" : roleKey}`}
                          style={{ fontSize: 9 }}
                        >
                          {roleKey.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            {idx < arr.length - 1 && (
              <div className="org-connector" style={{ marginBottom: 12 }}>
                <ChevronDown size={20} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Assignment Panels */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <AssignmentPanel
          title="Manager → Employee Assignments"
          icon={Users}
          supervisors={managers}
          subordinates={employees}
          relationships={relationships.managerEmployee}
          relKey="managerEmployee"
          onAssign={handleAssign}
          saving={saving}
        />
        <AssignmentPanel
          title="Finance Head → Manager Assignments"
          icon={UserCheck}
          supervisors={finances}
          subordinates={managers}
          relationships={relationships.financeManager}
          relKey="financeManager"
          onAssign={handleAssign}
          saving={saving}
        />
        <AssignmentPanel
          title="Director → Finance Head Assignments"
          icon={GitBranch}
          supervisors={directors}
          subordinates={finances}
          relationships={relationships.directorFinance}
          relKey="directorFinance"
          onAssign={handleAssign}
          saving={saving}
        />
      </div>
    </div>
  );
}
