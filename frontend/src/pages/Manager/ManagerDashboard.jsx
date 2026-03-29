/**
 * src/pages/Manager/ManagerDashboard.jsx
 *
 * Import path for CSS  → "../../style/manager.css"
 * Import path for API  → "../../services/api.js"   (swap mock data when ready)
 */
import { getManagerRequests, approveRequest, rejectRequest } from "../../services/api";
import { useEffect, useState, useMemo } from "react";
import "../../style/manager.css";

/* ─────────────────────────────────────────
   Mock data  –  replace with API calls later
   See src/services/api.js for wiring hints
───────────────────────────────────────── */


/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const AVATAR_PALETTE = [
  ["#3b1e8a","#c084fc"], ["#1e4d8a","#60a5fa"], ["#1e6b4a","#4ade80"],
  ["#7a3e10","#fb923c"], ["#6b1e3a","#f472b6"], ["#2a4a2a","#86efac"],
];

function avatarColors(name) {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

function initials(name) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */

/** Small avatar tile */
function Avatar({ name, size = 32, radius = 8 }) {
  const [bg, fg] = avatarColors(name);
  return (
    <div
      className="mgr-emp__avatar"
      style={{ width: size, height: size, borderRadius: radius, background: bg, color: fg, fontSize: size * 0.37 }}
    >
      {initials(name)}
    </div>
  );
}

/** Risk badge */
function RiskBadge({ risk }) {
  return <span className={`mgr-risk mgr-risk--${risk}`}>● {risk.charAt(0).toUpperCase() + risk.slice(1)}</span>;
}

/** Status tag (processed table) */
function StatusTag({ status }) {
  return (
    <span className={`mgr-status mgr-status--${status}`}>
      {status === "approved" ? "✓ Approved" : "✕ Rejected"}
    </span>
  );
}

/** Toast notification */
function Toast({ msg, type }) {
  if (!msg) return null;
  return <div className={`mgr-toast mgr-toast--${type}`}>{msg}</div>;
}

/** Detail / action modal */
function Modal({ req, onClose, onApprove, onReject }) {
  if (!req) return null;
  return (
    <div className="mgr-overlay" onClick={onClose}>
      <div className="mgr-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="mgr-modal__head">
          <div>
            <div className="mgr-modal__id">{req.id}</div>
            <div className="mgr-modal__title">Reimbursement Request</div>
          </div>
          <button className="mgr-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Employee row */}
        <div className="mgr-modal__emp">
          <Avatar name={req.employee} size={38} radius={9} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{req.employee}</div>
            <div style={{ fontSize: 12, color: "var(--txt-secondary)", marginTop: 2 }}>{req.dept}</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <RiskBadge risk={req.risk} />
          </div>
        </div>

        {/* Detail grid */}
        <div className="mgr-modal__grid">
          {[
            ["Amount",   `₹ ${req.amount.toLocaleString("en-IN")}`],
            ["Date",     fmtDate(req.date)],
            ["Category", req.category],
            ["Status",   "Pending Review"],
          ].map(([label, value]) => (
            <div className="mgr-modal__field" key={label}>
              <div className="mgr-modal__field-label">{label}</div>
              <div className="mgr-modal__field-value">{value}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="mgr-modal__desc">
          <div className="mgr-modal__field-label">Description</div>
          <p>{req.description}</p>
        </div>

        {/* Actions */}
        <div className="mgr-modal__actions">
          <button className="mgr-btn-reject"  onClick={() => onReject(req.id)}>Reject</button>
          <button className="mgr-btn-approve" onClick={() => onApprove(req.id)}>Approve Request</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SVG icons (inline — no extra deps)
───────────────────────────────────────── */
const IconClock    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconCheck    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
const IconFile     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IconUsers    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconBell     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IconSignOut  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconReq      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
const IconCheckBig = () => <svg className="mgr-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;

/* ─────────────────────────────────────────
   ManagerDashboard  (main export)
───────────────────────────────────────── */
export default function ManagerDashboard() {
  const [pending, setPending] = useState([]);
const [processed, setProcessed] = useState([]);
  const [sidebar,     setSidebar]     = useState(false);  // hidden by default
  const [modal,       setModal]       = useState(null);
  const [toast,       setToast]       = useState({ msg: "", type: "" });
  
  useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await getManagerRequests();

      // split backend data
      const pendingData = data.filter(r => r.status === "pending");
      const processedData = data.filter(r => r.status !== "pending");

      setPending(pendingData);
      setProcessed(processedData);
    } catch (err) {
      console.error("API error:", err);
    }
  };

  fetchData();
}, []);
  /* ── derived stats ── */
  const approvedToday = useMemo(() => processed.filter(r => r.status === "approved").length, [processed]);
  const teamMembers   = useMemo(() => new Set([...pending, ...processed].map(r => r.employee)).size, [pending, processed]);

  /* ── toast helper ── */
  /* ── toast helper ── */
function showToast(msg, type) {
  setToast({ msg, type });
  setTimeout(() => setToast({ msg: "", type: "" }), 2800);
}

/* ── approve ── */
async function handleApprove(id) {
  const req = pending.find(r => r.id === id);
  if (!req) return;

  await approveRequest(id); // API call

  setPending(p => p.filter(r => r.id !== id));
  setProcessed(p => [{ ...req, status: "approved" }, ...p]);

  setModal(null);
  showToast(`✓ ${req.employee}'s request approved`, "success");
}

/* ── reject ── */
async function handleReject(id) {
  const req = pending.find(r => r.id === id);
  if (!req) return;

  await rejectRequest(id); // API call

  setPending(p => p.filter(r => r.id !== id));
  setProcessed(p => [{ ...req, status: "rejected" }, ...p]);

  setModal(null);
  showToast(`✕ ${req.employee}'s request rejected`, "error");
}
  /* ── approve ── */
 
  /* ─────────── RENDER ─────────── */
  return (
    <div>

      {/* ══ NAVBAR ══════════════════════════════ */}
     <nav className="mgr-navbar">

  {/* LEFT: logo only */}
  <div className="mgr-navbar__logo">
    <div className="mgr-navbar__logo-icon">A</div>
    <span className="mgr-navbar__logo-text">ApproveX</span>
  </div>

  {/* RIGHT: hamburger */}
  <button
    className={`mgr-hamburger ${sidebar ? "mgr-hamburger--open" : ""}`}
    onClick={() => setSidebar(o => !o)}
  >
    <span className="mgr-hamburger__bar" />
    <span className="mgr-hamburger__bar" />
    <span className="mgr-hamburger__bar" />
  </button>

</nav>

      {/* ══ LAYOUT ══════════════════════════════ */}
      <div className="mgr-layout">

        {/* ── SIDEBAR OVERLAY (closes sidebar on outside click) ── */}
        <div
          className={`mgr-sidebar-overlay ${sidebar ? "mgr-sidebar-overlay--visible" : ""}`}
          onClick={() => setSidebar(false)}
          aria-hidden="true"
        />

        {/* ── SIDEBAR (slides in over content) ── */}
       <aside className={`mgr-sidebar ${sidebar ? "mgr-sidebar--open" : ""}`}>

  {/* PROFILE */}
  <div className="mgr-sidebar__user">
    <div className="mgr-sidebar__avatar">S</div>
    <div className="mgr-sidebar__user-info">
      <div className="mgr-sidebar__username">Sarah Manager</div>
      <div className="mgr-sidebar__badge">Manager</div>
    </div>
  </div>

  {/* NAV */}
  <nav className="mgr-sidebar__nav">
    <button className="mgr-sidebar__link mgr-sidebar__link--active">
      <IconReq />
      <span>Team Requests</span>
    </button>
  </nav>

  {/* LOGOUT */}
  <div className="mgr-sidebar__bottom">
    <button className="mgr-sidebar__signout">
      <IconSignOut />
      <span>Sign Out</span>
    </button>
  </div>

</aside>

        {/* ── MAIN (always full width — sidebar floats over it) ── */}
        <main className="mgr-main">

          {/* Page header */}
          <div className="mgr-header">
            <h1 className="mgr-header__title">Team Requests</h1>
            <p className="mgr-header__sub">Review and approve expense requests</p>
          </div>

          {/* Stat cards */}
          <div className="mgr-stats">
            <div className="mgr-stat">
              <div className="mgr-stat__icon"><IconClock /></div>
              <div>
                <div className="mgr-stat__label">Pending Requests</div>
                <div className="mgr-stat__value">{pending.length}</div>
              </div>
            </div>
            <div className="mgr-stat">
              <div className="mgr-stat__icon mgr-stat__icon--green"><IconCheck /></div>
              <div>
                <div className="mgr-stat__label">Approved Today</div>
                <div className="mgr-stat__value">{approvedToday}</div>
              </div>
            </div>
            <div className="mgr-stat">
              <div className="mgr-stat__icon"><IconFile /></div>
              <div>
                <div className="mgr-stat__label">Total Processed</div>
                <div className="mgr-stat__value">{processed.length}</div>
              </div>
            </div>
            <div className="mgr-stat">
              <div className="mgr-stat__icon mgr-stat__icon--blue"><IconUsers /></div>
              <div>
                <div className="mgr-stat__label">Team Members</div>
                <div className="mgr-stat__value">{teamMembers}</div>
              </div>
            </div>
          </div>

          {/* ── Pending Approvals ── */}
          <div className="mgr-section-title">Pending Approvals</div>
          <div className="mgr-table-card">
            {pending.length === 0 ? (
              <div className="mgr-empty">
                <IconCheckBig />
                <p className="mgr-empty__text">All caught up! No pending requests.</p>
              </div>
            ) : (
              <table className="mgr-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Risk</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
  {pending.length === 0 ? (
    <tr>
      <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
        No requests found
      </td>
    </tr>
  ) : (
    pending.map(req => (
      <tr key={req.id}>
        <td>
          <div className="mgr-emp">
            <Avatar name={req.employee} />
            <div>
              <div className="mgr-emp__name">{req.employee}</div>
              <div className="mgr-emp__dept">{req.dept}</div>
            </div>
          </div>
        </td>

        <td className="mgr-amount">
          <span className="mgr-amount__curr">₹</span>
          {req.amount.toLocaleString("en-IN")}
        </td>

        <td style={{ color: "var(--txt-secondary)" }}>
          {fmtDate(req.date)}
        </td>

        <td style={{ maxWidth: 220 }}>
          {req.description}
        </td>

        <td>
          <RiskBadge risk={req.risk} />
        </td>

        <td className="mgr-actions">
          <button className="mgr-btn-view" onClick={() => setModal(req)}>View</button>

          <button className="mgr-btn-approve" onClick={() => handleApprove(req.id)}>
            Approve
          </button>

          <button className="mgr-btn-reject" onClick={() => handleReject(req.id)}>
            Reject
          </button>
        </td>
      </tr>
    ))
  )}
</tbody>
              </table>
            )}
          </div>

          {/* ── Processed Requests ── */}
          {processed.length > 0 && (
            <>
              <div className="mgr-section-title">Processed Requests</div>
              <div className="mgr-table-card">
                <table className="mgr-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Risk</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processed.map(req => (
                      <tr key={req.id}>
                        <td>
                          <div className="mgr-emp">
                            <Avatar name={req.employee} />
                            <div>
                              <div className="mgr-emp__name">{req.employee}</div>
                              <div className="mgr-emp__dept">{req.dept}</div>
                            </div>
                          </div>
                        </td>
                        <td className="mgr-amount">
                          <span className="mgr-amount__curr">₹</span>
                          {req.amount.toLocaleString("en-IN")}
                        </td>
                        <td style={{ color: "var(--txt-secondary)" }}>{fmtDate(req.date)}</td>
                        <td style={{ color: "var(--txt-secondary)", maxWidth: 220 }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {req.description}
                          </span>
                        </td>
                        <td><RiskBadge risk={req.risk} /></td>
                        <td><StatusTag status={req.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </main>
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          req={modal}
          onClose={() => setModal(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Toast */}
      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}