// frontend/src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Lottie from "lottie-react";
import { loginUser } from "../services/authApi";
import cashLoader from "../assets/send cash loader.json";

const ROLES = [
  { id: "employee", label: "EMPLOYEE", icon: "👤" },
  { id: "manager", label: "MANAGER", icon: "🏢" },
  { id: "finance", label: "FINANCE HEAD", icon: "💰" },
  { id: "director", label: "DIRECTOR", icon: "🎯" },
];

const ROLE_ROUTES = {
  employee: "/employee/dashboard",
  manager: "/manager/dashboard",
  finance: "/finance/dashboard",
  director: "/director/dashboard",
};

/* ─── Full-screen loader overlay ─── */
function LoaderOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(11, 21, 32, 0.93)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.25rem",
        animation: "fadeIn 0.2s ease-out both",
      }}
    >
      <Lottie
        animationData={cashLoader}
        loop={true}
        autoplay={true}
        style={{ width: "130px", height: "130px" }}
      />
      <p
        style={{
          color: "#C9A962",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: "1rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        Logging you in...
      </p>
      <p
        style={{
          color: "#475569",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.8rem",
          letterSpacing: "0.02em",
        }}
      >
        Please wait a moment
      </p>
    </div>
  );
}

/* ─── Main page ─── */
export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!role) {
      Swal.fire({
        icon: "warning",
        title: "Role Required",
        text: "Please select your role before Logging in.",
        background: "#0f1c2e",
        color: "#e2e8f0",
        confirmButtonColor: "#C9A962",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser({ username, password, role });

      if (data.message) {
        const msg = data.message.toLowerCase();
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: msg.includes("role")
            ? "Invalid role selected for this account."
            : "Invalid username or password. Please try again.",
          background: "#0f1c2e",
          color: "#e2e8f0",
          confirmButtonColor: "#C9A962",
        });
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      await Swal.fire({
        icon: "success",
        title: "Welcome back!",
        text: `Signed in as ${data.user.role}`,
        background: "#0f1c2e",
        color: "#e2e8f0",
        confirmButtonColor: "#C9A962",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate(ROLE_ROUTES[data.user.role] || "/login");
    } catch {
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Unable to reach the server. Please try again.",
        background: "#0f1c2e",
        color: "#e2e8f0",
        confirmButtonColor: "#C9A962",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Loader overlay — shown while API call is in flight */}
      {loading && <LoaderOverlay />}

      {/* Background blobs */}
      <div style={styles.meshTop} />
      <div style={styles.meshBottom} />

      {/* Logo */}
      <div style={styles.logoRow}>
        <div style={styles.logoIcon}>F</div>
        <span style={styles.logoText}>
          Flow<span style={styles.logoPay}>pay</span>
        </span>
      </div>

      {/* Card */}
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Sign in to your account</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Username */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Username</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="#64748b"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={styles.input}
                onFocus={(e) => (e.target.style.borderColor = "#C9A962")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                }
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="#64748b"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </span>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ ...styles.input, paddingRight: "3rem" }}
                onFocus={(e) => (e.target.style.borderColor = "#C9A962")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                }
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={styles.eyeBtn}
              >
                {showPass ? (
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="#64748b"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="#64748b"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Role Selector */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Select Your Role</label>
            <div style={styles.roleGrid}>
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  style={{
                    ...styles.roleCard,
                    ...(role === r.id ? styles.roleCardActive : {}),
                  }}
                >
                  <span style={styles.roleIcon}>{r.icon}</span>
                  <span style={styles.roleLabel}>{r.label}</span>
                  {role === r.id && <span style={styles.roleTick}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <span style={styles.submitInner}>
              Log In
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
          </button>
        </form>

        <p style={styles.signupRow}>
          Don't have an account?{" "}
          <a href="#" style={styles.signupLink}>
            Contact Admin
          </a>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0b1520; }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─── Styles ─── */
const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #0b1520 0%, #0d1e2e 50%, #0a1824 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1rem",
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  meshTop: {
    position: "fixed",
    top: "-200px",
    right: "-200px",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(30,80,120,0.25) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  meshBottom: {
    position: "fixed",
    bottom: "-200px",
    left: "-100px",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(20,60,100,0.2) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.65rem",
    marginBottom: "1.75rem",
    animation: "fadeUp 0.6s ease-out both",
  },
  logoIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #C9A962, #E8D5A3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#0b1520",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "1.25rem",
  },
  logoText: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "1.6rem",
    color: "#f1f5f9",
    letterSpacing: "-0.02em",
  },
  logoPay: { color: "#C9A962" },
  card: {
    background: "rgba(15, 28, 46, 0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "20px",
    padding: "2.5rem 2.25rem",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
    animation: "fadeUp 0.7s ease-out 0.1s both",
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "1.75rem",
    color: "#f1f5f9",
    textAlign: "center",
    marginBottom: "0.35rem",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    color: "#64748b",
    fontSize: "0.925rem",
    textAlign: "center",
    marginBottom: "1.75rem",
  },
  form: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  label: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#94a3b8",
    letterSpacing: "0.01em",
  },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: {
    position: "absolute",
    left: "0.9rem",
    display: "flex",
    alignItems: "center",
    pointerEvents: "none",
    zIndex: 1,
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "0.75rem 0.9rem 0.75rem 2.75rem",
    color: "#e2e8f0",
    fontSize: "0.925rem",
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "'DM Sans', sans-serif",
  },
  eyeBtn: {
    position: "absolute",
    right: "0.9rem",
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "0.2rem",
  },
  roleGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" },
  roleCard: {
    position: "relative",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    color: "#94a3b8",
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    transition: "all 0.2s",
    fontFamily: "'DM Sans', sans-serif",
    textAlign: "left",
  },
  roleCardActive: {
    background: "rgba(201,169,98,0.1)",
    border: "1px solid rgba(201,169,98,0.5)",
    color: "#C9A962",
    boxShadow: "0 0 16px rgba(201,169,98,0.12)",
  },
  roleIcon: { fontSize: "1rem" },
  roleLabel: { flex: 1 },
  roleTick: { fontSize: "0.75rem", color: "#C9A962", fontWeight: 700 },
  submitBtn: {
    width: "100%",
    padding: "0.875rem",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #C9A962, #E8D5A3)",
    border: "none",
    color: "#0b1520",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "1rem",
    letterSpacing: "0.01em",
    transition: "all 0.25s",
    marginTop: "0.25rem",
    boxShadow: "0 4px 20px rgba(201,169,98,0.25)",
  },
  submitInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  signupRow: {
    textAlign: "center",
    marginTop: "1.25rem",
    color: "#64748b",
    fontSize: "0.875rem",
  },
  signupLink: { color: "#C9A962", textDecoration: "none", fontWeight: 600 },
};
