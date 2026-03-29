// AdminRules.jsx — wired to real FastAPI backend (/admin/risk-thresholds)

import { useState, useEffect } from "react";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Save,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { getRules, saveRuleLevel, updateRulesMock } from "../services/Adminapi";

const RISK_LEVELS = ["low", "medium", "high"];

const RISK_CONFIG = {
  low: {
    icon: CheckCircle,
    label: "Low Risk",
    color: "var(--green-cash)",
    desc: "Expenses under threshold — Manager approval only",
    flowSteps: ["MANAGER"],
    flowDesc: "Manager reviews and approves directly.",
  },
  medium: {
    icon: AlertTriangle,
    label: "Medium Risk",
    color: "var(--amber-warn)",
    desc: "Mid-range expenses — Manager decides to approve or escalate",
    flowSteps: ["MANAGER", "DECIDE"],
    flowDesc: "Manager can approve or forward to Finance Head.",
  },
  high: {
    icon: XCircle,
    label: "High Risk",
    color: "var(--red-risk)",
    desc: "High-value expenses — Full chain approval required",
    flowSteps: ["MANAGER", "FINANCE HEAD", "DIRECTOR"],
    flowDesc: "Auto-escalates through all levels sequentially.",
  },
};

function FlowDiagram({ steps }) {
  return (
    <div className="flow-steps">
      {steps.map((step, i) => (
        <span
          key={step}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <span
            className={`flow-step ${step !== "DECIDE" ? "active" : ""}`}
            style={
              step === "DECIDE"
                ? {
                    color: "var(--amber-warn)",
                    borderColor: "rgba(255,176,32,0.3)",
                  }
                : {}
            }
          >
            {step}
          </span>
          {i < steps.length - 1 && (
            <ArrowRight size={12} style={{ color: "var(--text-muted)" }} />
          )}
        </span>
      ))}
    </div>
  );
}

export default function AdminRules({ addToast }) {
  const [rules, setRules] = useState(null); // null = loading
  const [editValues, setEditValues] = useState({
    low: 1000,
    medium: 5000,
    high: 10000,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Fetch thresholds from backend ──
  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await getRules();
      setRules(data);
      setEditValues({
        low: data.low.limit,
        medium: data.medium.limit,
        high: data.high.limit,
      });
    } catch (err) {
      addToast("Could not load rules — using defaults", "info");
      // Fallback defaults
      setRules({
        low: { limit: 1000, autoEscalate: false, flow: ["MANAGER"] },
        medium: {
          limit: 5000,
          autoEscalate: true,
          flow: ["MANAGER", "DECIDE"],
        },
        high: {
          limit: 10000,
          autoEscalate: true,
          flow: ["MANAGER", "FINANCE HEAD", "DIRECTOR"],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggleAutoEscalate = (level) => {
    const updated = {
      ...rules,
      [level]: { ...rules[level], autoEscalate: !rules[level].autoEscalate },
    };
    setRules(updateRulesMock(updated)); // local toggle only (no backend field for this yet)
    addToast(
      `Auto-escalate for ${level} risk ${!rules[level].autoEscalate ? "enabled" : "disabled"}`,
      "success",
    );
  };

  // ── Save all three thresholds to backend ──
  const handleSaveLimits = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveRuleLevel("low", Number(editValues.low)),
        saveRuleLevel("medium", Number(editValues.medium)),
        saveRuleLevel("high", Number(editValues.high)),
      ]);
      // Update local state to reflect saved values
      setRules((prev) => ({
        low: { ...prev.low, limit: Number(editValues.low) },
        medium: { ...prev.medium, limit: Number(editValues.medium) },
        high: { ...prev.high, limit: Number(editValues.high) },
      }));
      addToast("Risk thresholds saved to database!", "success");
    } catch (err) {
      addToast(err.message || "Failed to save thresholds", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !rules) {
    return (
      <div
        className="fade-in"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 40,
          color: "var(--text-muted)",
        }}
      >
        <RefreshCw size={16} className="spin" /> Loading rules…
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rules Engine</h1>
          <p className="page-subtitle">
            Configure approval workflows by risk category
          </p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-secondary"
            onClick={fetchRules}
            disabled={loading}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSaveLimits}
            disabled={saving}
          >
            <Save size={14} /> {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Visual Overview */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div className="section-title">
          <Shield size={18} className="section-icon" />
          Approval Flow Overview
        </div>
        <div className="rules-grid">
          {RISK_LEVELS.map((level) => {
            const cfg = RISK_CONFIG[level];
            const Icon = cfg.icon;
            return (
              <div key={level} className={`rule-card ${level}`}>
                <div className={`rule-icon ${level}`}>
                  <Icon size={20} />
                </div>
                <div className={`rule-label ${level}`}>{cfg.label}</div>
                <div className="rule-value">
                  ₹{rules[level].limit.toLocaleString()}
                </div>
                <div className="rule-desc">{cfg.desc}</div>
                <FlowDiagram steps={cfg.flowSteps} />
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 10,
                  }}
                >
                  {cfg.flowDesc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rule Configuration */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Rule Configuration
        </h2>
        {RISK_LEVELS.map((level, i) => {
          const cfg = RISK_CONFIG[level];
          const Icon = cfg.icon;
          return (
            <div
              key={level}
              className="glass-card"
              style={{
                padding: 20,
                opacity: 0,
                animation: `fadeIn 0.4s ease ${i * 100}ms forwards`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div className={`rule-icon ${level}`} style={{ margin: 0 }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      {cfg.label} Expenses
                    </div>
                    <div
                      style={{ fontSize: 12, color: "var(--text-secondary)" }}
                    >
                      {cfg.flowDesc}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{ fontSize: 12, color: "var(--text-secondary)" }}
                    >
                      Threshold (₹)
                    </span>
                    <input
                      type="number"
                      className="rule-input"
                      style={{ width: 110 }}
                      value={editValues[level]}
                      onChange={(e) =>
                        setEditValues({
                          ...editValues,
                          [level]: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{ fontSize: 12, color: "var(--text-secondary)" }}
                    >
                      Auto-Escalate
                    </span>
                    <button
                      className={`toggle ${rules[level].autoEscalate ? "on" : ""}`}
                      onClick={() => handleToggleAutoEscalate(level)}
                    >
                      <span className="toggle-knob" />
                    </button>
                  </div>
                  <span className={`badge badge-${level}`}>
                    {level.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanation Panel */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div className="section-title">
          <Shield size={18} className="section-icon" />
          Risk Categories Explained
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 24,
          }}
        >
          {RISK_LEVELS.map((level) => {
            const cfg = RISK_CONFIG[level];
            return (
              <div key={level}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: cfg.color,
                      display: "inline-block",
                    }}
                  />
                  <strong style={{ color: "var(--text-primary)" }}>
                    {cfg.label}
                  </strong>
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {level === "low" &&
                    `Under ₹${rules.low.limit.toLocaleString()}. Direct Manager approval.`}
                  {level === "medium" &&
                    `₹${rules.low.limit.toLocaleString()}–₹${rules.medium.limit.toLocaleString()}. Manager can approve or escalate.`}
                  {level === "high" &&
                    `Over ₹${rules.medium.limit.toLocaleString()}. Full chain: Manager → Finance Head → Director.`}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
