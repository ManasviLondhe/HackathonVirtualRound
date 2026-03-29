import { useState, useEffect, useRef } from "react";
import "../../style/employee.css";

// ─────────────────────────────────────────────────────────────────────────────
// API base
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const getInitial   = (name = "") => name.charAt(0).toUpperCase();
const formatAmount = (amt) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amt ?? 0);
const formatDate   = (iso) => (iso ? iso.slice(0, 10) : "—");

// ─────────────────────────────────────────────────────────────────────────────
// Topbar  (logo left · hamburger right — nothing else)
// ─────────────────────────────────────────────────────────────────────────────
function Topbar({ drawerOpen, onHamburgerClick }) {
  return (
    <header className="fp-topbar">
      {/* Logo */}
      <div className="fp-topbar-brand">
        <span className="fp-logo">F</span>
        <span className="fp-brand-name">
          Flow<strong>pay</strong>
        </span>
      </div>

      {/* Hamburger */}
      <button
        className={`fp-hamburger ${drawerOpen ? "is-open" : ""}`}
        onClick={onHamburgerClick}
        aria-label="Toggle navigation"
        aria-expanded={drawerOpen}
      >
        <span className="fp-ham-line" />
        <span className="fp-ham-line" />
        <span className="fp-ham-line" />
      </button>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Right Drawer
// ─────────────────────────────────────────────────────────────────────────────
function RightDrawer({ open, onClose, user, activeTab, onTabChange, onSignOut }) {
  const drawerRef = useRef(null);

  // ESC closes drawer
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && open) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleNavClick = (tab) => {
    onTabChange(tab);
    onClose();
  };

  const NAV_ITEMS = [
    {
      key: "uploads",
      label: "My Uploads",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      key: "upload",
      label: "Upload Receipt",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* ── Overlay ── */}
      <div
        className={`fp-drawer-overlay ${open ? "fp-drawer-overlay--visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel ── */}
      <aside
        ref={drawerRef}
        className={`fp-drawer ${open ? "fp-drawer--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        {/* Header */}
        <div className="fp-drawer-header">
          <div className="fp-drawer-brand">
            <span className="fp-logo sm">F</span>
            <span className="fp-brand-name">Flow<strong>pay</strong></span>
          </div>
          <button className="fp-drawer-close-btn" onClick={onClose} aria-label="Close menu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6"  x2="6"  y2="18" />
              <line x1="6"  y1="6"  x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* User profile */}
        <div className="fp-drawer-profile">
          <div className="fp-avatar">{getInitial(user?.name)}</div>
          <div>
            <p className="fp-drawer-username">{user?.name || "Employee"}</p>
            <span className="fp-role-badge">EMPLOYEE</span>
          </div>
        </div>

        <div className="fp-drawer-divider" />

        {/* Nav items */}
        <nav className="fp-drawer-nav">
          <p className="fp-drawer-nav-heading">Menu</p>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`fp-drawer-nav-item ${activeTab === item.key ? "active" : ""}`}
              onClick={() => handleNavClick(item.key)}
            >
              <span className="fp-drawer-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {activeTab === item.key && <span className="fp-drawer-active-pip" />}
            </button>
          ))}
        </nav>

        <div className="fp-drawer-divider" />

        {/* Sign out */}
        <div className="fp-drawer-footer">
          <button className="fp-drawer-signout" onClick={onSignOut}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trust Score  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function TrustScore({ score }) {
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Poor";
  const pct   = Math.min(100, Math.max(0, score ?? 0));
  return (
    <div className="fp-trust-card">
      <div className="fp-trust-score-box">
        <span className="fp-trust-num">{score ?? "—"}</span>
      </div>
      <div className="fp-trust-info">
        <h3>Trust Score</h3>
        <p>Based on your reimbursement history</p>
      </div>
      <div className="fp-trust-bar-wrap">
        <div className="fp-trust-bar">
          <div className="fp-trust-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="fp-trust-label">{label}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, gold }) {
  return (
    <div className={`fp-stat-card ${gold ? "gold" : ""}`}>
      <div className="fp-stat-icon">{icon}</div>
      <div>
        <p className="fp-stat-label">{label}</p>
        <p className="fp-stat-value">{value}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cls = {
    APPROVED: "fp-badge approved",
    PENDING:  "fp-badge pending",
    REJECTED: "fp-badge rejected",
  };
  return (
    <span className={cls[status?.toUpperCase()] || "fp-badge pending"}>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Expenses Table  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function ExpensesTable({ expenses, loading, error }) {
  if (loading) return <div className="fp-table-msg">Loading expenses…</div>;
  if (error)   return <div className="fp-table-msg fp-err">{error}</div>;
  if (!expenses.length) return <div className="fp-table-msg">No expenses found.</div>;

  return (
    <table className="fp-table">
      <thead>
        <tr>
          <th>DESCRIPTION</th>
          <th>AMOUNT</th>
          <th>DATE</th>
          <th>LOCATION</th>
          <th>STATUS</th>
          <th>APPROVED BY</th>
        </tr>
      </thead>
      <tbody>
        {expenses.map((exp, i) => (
          <tr key={exp.id || exp._id || i}>
            <td>
              <p className="fp-exp-desc">{exp.description}</p>
              <span className={`fp-risk ${(exp.riskLevel || exp.risk_level || "LOW").toUpperCase()}`}>
                {(exp.riskLevel || exp.risk_level || "LOW").toUpperCase()} RISK
              </span>
            </td>
            <td className="fp-exp-amount">{formatAmount(exp.amount)}</td>
            <td>{formatDate(exp.date)}</td>
            <td>{exp.location || exp.vendor || "—"}</td>
            <td><StatusBadge status={exp.status} /></td>
            <td>
              {exp.status?.toUpperCase() === "REJECTED" ? (
                <span className="fp-rejected-reason">
                  {exp.rejectionReason || exp.rejection_reason || "Not approved for reimbursement"}
                </span>
              ) : (
                <span className="fp-approver">{exp.approvedBy || exp.approved_by || "—"}</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload Panel  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function UploadPanel({ onUploadSuccess }) {
  const [file, setFile]             = useState(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount]         = useState("");
  const [date, setDate]             = useState("");
  const [location, setLocation]     = useState("");
  const [uploading, setUploading]   = useState(false);
  const [msg, setMsg]               = useState(null);

  const handleSubmit = async () => {
    if (!file || !description || !amount) {
      setMsg({ type: "error", text: "Please fill all required fields and select a file." });
      return;
    }
    const formData = new FormData();
    formData.append("receipt", file);
    formData.append("description", description);
    formData.append("amount", amount);
    formData.append("date", date);
    formData.append("location", location);

    setUploading(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/expenses/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setMsg({ type: "success", text: "Receipt uploaded successfully!" });
      setFile(null); setDescription(""); setAmount(""); setDate(""); setLocation("");
      onUploadSuccess?.();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fp-upload-panel">
      <div className="fp-page-header">
        <div>
          <h1>Upload Receipt</h1>
          <p>Attach your receipt and fill in the expense details</p>
        </div>
      </div>

      {msg && <div className={`fp-upload-msg ${msg.type}`}>{msg.text}</div>}

      <div className="fp-form">
        <div className="fp-form-group">
          <label>Description *</label>
          <input type="text" placeholder="e.g. Client meeting transportation"
            value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="fp-form-row">
          <div className="fp-form-group">
            <label>Amount (USD) *</label>
            <input type="number" placeholder="0.00"
              value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="fp-form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="fp-form-group">
          <label>Location / Vendor</label>
          <input type="text" placeholder="e.g. Uber, Amazon, Marriott"
            value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="fp-form-group">
          <label>Receipt File *</label>
          <div className="fp-file-drop"
            onClick={() => document.getElementById("fp-file-input").click()}>
            {file
              ? <span>📎 {file.name}</span>
              : <span>Click to browse or drag &amp; drop</span>}
            <input id="fp-file-input" type="file" accept="image/*,application/pdf"
              style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0])} />
          </div>
        </div>
        <button className="fp-cta-btn" onClick={handleSubmit} disabled={uploading}>
          {uploading ? "Uploading…" : "Submit Expense"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmployeeDashboard  — main export
// ─────────────────────────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const [user, setUser]             = useState(null);
  const [expenses, setExpenses]     = useState([]);
  const [stats, setStats]           = useState({ total: 0, pending: 0, approved: 0, totalAmount: 0 });
  const [trustScore, setTrustScore] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState("uploads");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // ── NEW: drawer state ──────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Fetch profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUser(data.user || data);
        setTrustScore(data.trustScore ?? data.trust_score ?? null);
      } catch {
        setUser({ name: "John Employee" });
        setTrustScore(85);
      }
    })();
  }, []);

  // ── Fetch expenses ─────────────────────────────────────────────────────────
  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/expenses/my`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to load expenses");
      const data = await res.json();
      const list = data.expenses || data || [];
      setExpenses(list);
      setStats({
        total:       list.length,
        pending:     list.filter((e) => e.status?.toUpperCase() === "PENDING").length,
        approved:    list.filter((e) => e.status?.toUpperCase() === "APPROVED").length,
        totalAmount: list
          .filter((e) => e.status?.toUpperCase() === "APPROVED")
          .reduce((s, e) => s + Number(e.amount), 0),
      });
    } catch {
      setError("Could not load expenses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const filtered =
    filterStatus === "ALL"
      ? expenses
      : expenses.filter((e) => e.status?.toUpperCase() === filterStatus);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fp-root fp-root--no-sidebar">

      {/* ── Topbar (minimal: logo + hamburger only) ── */}
      <Topbar
        drawerOpen={drawerOpen}
        onHamburgerClick={() => setDrawerOpen(true)}
      />

      {/* ── Right Drawer ── */}
      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={handleSignOut}
      />

      {/* ── Main content (full width, padded below fixed topbar) ── */}
      <main className="fp-main fp-main--full">
  <div className="fp-content emp-container">

          {activeTab === "upload" ? (
            <UploadPanel
              onUploadSuccess={() => { fetchExpenses(); setActiveTab("uploads"); }}
            />
          ) : (
            <>
              {/* Page Header */}
              <div className="fp-page-header">
                <div>
                  <h1>My Expenses</h1>
                  <p>Submit and track your expense claims</p>
                </div>
                <button className="fp-cta-btn" onClick={() => setActiveTab("upload")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Upload Receipt
                </button>
              </div>

              {/* Trust Score */}
              <TrustScore score={trustScore} />

              {/* Stat cards */}
              <div className="fp-stats-grid">
                <StatCard
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                  label="Total Submitted" value={stats.total} />
                <StatCard
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                  label="Pending" value={stats.pending} />
                <StatCard
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
                  label="Approved" value={stats.approved} />
                <StatCard
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                  label="Total Amount" value={formatAmount(stats.totalAmount)} gold />
              </div>

              {/* Expenses table */}
              <div className="fp-table-section">
                <div className="fp-table-header">
                  <h2>Submitted Expenses</h2>
                  <div className="fp-filters">
                    {["ALL", "PENDING", "APPROVED", "REJECTED"].map((f) => (
                      <button key={f}
                        className={`fp-filter-btn ${filterStatus === f ? "active" : ""}`}
                        onClick={() => setFilterStatus(f)}>{f}</button>
                    ))}
                  </div>
                </div>
                <ExpensesTable expenses={filtered} loading={loading} error={error} />
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}