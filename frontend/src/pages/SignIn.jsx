// frontend/src/pages/AdminSignup.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import Lottie from "lottie-react";
import { signupCompany } from "../services/authApi";
import cashLoader from "../assets/send cash loader.json";

/* ─── Loader Overlay (same as LoginPage) ─── */
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
        Creating your company...
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

/* ─── Main Page ─── */
export default function AdminSignup() {
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [currency, setCurrency] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [countries, setCountries] = useState([]); // [{ name, currency, symbol }]
  const [countriesLoading, setCountriesLoading] = useState(true);

  /* Fetch countries + currencies from REST Countries */
  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,currencies")
      .then((r) => r.json())
      .then((data) => {
        const list = data
          .filter((c) => c.currencies && Object.keys(c.currencies).length > 0)
          .map((c) => {
            const code = Object.keys(c.currencies)[0];
            const symbol = c.currencies[code]?.symbol || code;
            return { name: c.name.common, code, symbol };
          })
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountries(list);
      })
      .catch(() => setCountries([]))
      .finally(() => setCountriesLoading(false));
  }, []);

  /* Auto-set currency when location changes */
  const handleLocationChange = (e) => {
    const selected = e.target.value;
    setLocation(selected);
    const match = countries.find((c) => c.name === selected);
    setCurrency(match ? `${match.code} ${match.symbol}` : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !companyName ||
      !location ||
      !currency ||
      !email ||
      !bio ||
      !password ||
      !confirmPassword
    ) {
      Swal.fire({
        icon: "warning",
        title: "All Fields Required",
        text: "Please fill in every field before submitting.",
        background: "#0f1c2e",
        color: "#e2e8f0",
        confirmButtonColor: "#C9A962",
      });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Passwords Don't Match",
        text: "Please make sure both passwords are identical.",
        background: "#0f1c2e",
        color: "#e2e8f0",
        confirmButtonColor: "#C9A962",
      });
      return;
    }

    if (password.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Password Too Short",
        text: "Password must be at least 6 characters.",
        background: "#0f1c2e",
        color: "#e2e8f0",
        confirmButtonColor: "#C9A962",
      });
      return;
    }

    setLoading(true);
    try {
      await signupCompany(
        companyName,
        location,
        currency,
        email,
        bio,
        password,
      );
      await Swal.fire({
        icon: "success",
        title: "Company Created!",
        text: "Your company account is ready. Please sign in.",
        background: "#0f1c2e",
        color: "#e2e8f0",
        confirmButtonColor: "#C9A962",
        timer: 2000,
        showConfirmButton: false,
      });
      navigate("/login");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Signup Failed",
        text: err.message || "Something went wrong. Please try again.",
        background: "#0f1c2e",
        color: "#e2e8f0",
        confirmButtonColor: "#C9A962",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      {loading && <LoaderOverlay />}
      <div style={S.meshTop} />
      <div style={S.meshBottom} />

      {/* Logo */}
      <div style={S.logoRow}>
        <div style={S.logoIcon}>F</div>
        <span style={S.logoText}>
          Flow<span style={S.logoPay}>pay</span>
        </span>
      </div>

      {/* Card */}
      <div style={S.card}>
        <h1 style={S.title}>Create Your Company</h1>
        <p style={S.subtitle}>Set up your Flowpay workspace</p>

        <form onSubmit={handleSubmit} style={S.form}>
          {/* Company Name */}
          <Field label="Company Name">
            <InputWrap icon={<BuildingIcon />}>
              <input
                type="text"
                placeholder="Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                style={S.input}
                onFocus={(e) => (e.target.style.borderColor = "#C9A962")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                }
              />
            </InputWrap>
          </Field>

          {/* Location */}
          <Field label="Location">
            <InputWrap icon={<GlobeIcon />}>
              <select
                value={location}
                onChange={handleLocationChange}
                required
                style={{ ...S.input, ...S.select }}
                onFocus={(e) => (e.target.style.borderColor = "#C9A962")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                }
              >
                <option value="" disabled>
                  {countriesLoading
                    ? "Loading countries..."
                    : "Select your country"}
                </option>
                {countries.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </InputWrap>
          </Field>

          {/* Currency (read-only) */}
          <Field label="Currency (auto-detected)">
            <div style={S.currencyWrap}>
              <span style={S.currencyIcon}>
                <CoinIcon />
              </span>
              <input
                type="text"
                value={currency || "Select a country first"}
                readOnly
                style={{
                  ...S.input,
                  color: currency ? "#C9A962" : "#475569",
                  fontWeight: currency ? 700 : 400,
                  cursor: "not-allowed",
                  background: "rgba(255,255,255,0.02)",
                  borderColor: currency
                    ? "rgba(201,169,98,0.3)"
                    : "rgba(255,255,255,0.05)",
                }}
              />
              {currency && (
                <span style={S.currencyBadge}>{currency.split(" ")[0]}</span>
              )}
            </div>
          </Field>

          {/* Company Email */}
          <Field label="Company Email">
            <InputWrap icon={<MailIcon />}>
              <input
                type="email"
                placeholder="admin@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={S.input}
                onFocus={(e) => (e.target.style.borderColor = "#C9A962")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                }
              />
            </InputWrap>
          </Field>

          {/* Bio */}
          <Field label="Company Bio">
            <textarea
              placeholder="Briefly describe what your company does..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
              rows={3}
              style={S.textarea}
              onFocus={(e) => (e.target.style.borderColor = "#C9A962")}
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.08)")
              }
            />
          </Field>

          {/* Password */}
          <Field label="Password">
            <div style={S.inputRelative}>
              <InputWrap icon={<LockIcon />}>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ ...S.input, paddingRight: "3rem" }}
                  onFocus={(e) => (e.target.style.borderColor = "#C9A962")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                  }
                />
              </InputWrap>
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={S.eyeBtn}
              >
                {showPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </Field>

          {/* Confirm Password */}
          <Field label="Confirm Password">
            <div style={S.inputRelative}>
              <InputWrap icon={<LockIcon />}>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{ ...S.input, paddingRight: "3rem" }}
                  onFocus={(e) => (e.target.style.borderColor = "#C9A962")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                  }
                />
              </InputWrap>
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={S.eyeBtn}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </Field>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...S.submitBtn,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <span style={S.submitInner}>
              Create Company
              <ArrowIcon />
            </span>
          </button>
        </form>

        <p style={S.loginRow}>
          Already have an account?{" "}
          <Link to="/login" style={S.loginLink}>
            Login 
          </Link>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0b1520; }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        select option { background: #0f1c2e; color: #e2e8f0; }
        textarea::placeholder, input::placeholder { color: #334155; }
        textarea { resize: vertical; }
      `}</style>
    </div>
  );
}

/* ─── Small helper components ─── */
function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}

function InputWrap({ icon, children }) {
  return (
    <div
      style={{ position: "relative", display: "flex", alignItems: "center" }}
    >
      <span style={S.inputIcon}>{icon}</span>
      {children}
    </div>
  );
}

/* ─── SVG icons (inline, no deps) ─── */
const iconStyle = {
  width: 16,
  height: 16,
  fill: "none",
  stroke: "#64748b",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" style={iconStyle}>
      <path d="M3 21h18M9 21V5a2 2 0 012-2h2a2 2 0 012 2v16M9 10h6M9 14h6" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" style={iconStyle}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  );
}
function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" style={iconStyle}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v2m0 8v2m-2-7h3a1 1 0 010 2h-2a1 1 0 000 2h3" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" style={iconStyle}>
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" style={iconStyle}>
      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ ...iconStyle, stroke: "#64748b" }}>
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ ...iconStyle, stroke: "#64748b" }}>
      <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{
        width: 18,
        height: 18,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }}
    >
      <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

/* ─── Styles (same tokens as LoginPage) ─── */
const S = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #0b1520 0%, #0d1e2e 50%, #0a1824 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "2.5rem 1rem 3rem",
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
    maxWidth: "520px",
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
  form: { display: "flex", flexDirection: "column", gap: "1.2rem" },
  label: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#94a3b8",
    letterSpacing: "0.01em",
  },
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
    appearance: "none",
  },
  select: {
    cursor: "pointer",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 1rem center",
    paddingRight: "2.5rem",
  },
  currencyWrap: { position: "relative", display: "flex", alignItems: "center" },
  currencyIcon: {
    position: "absolute",
    left: "0.9rem",
    display: "flex",
    alignItems: "center",
    pointerEvents: "none",
    zIndex: 1,
  },
  currencyBadge: {
    position: "absolute",
    right: "0.75rem",
    background: "rgba(201,169,98,0.15)",
    border: "1px solid rgba(201,169,98,0.3)",
    borderRadius: "6px",
    padding: "0.15rem 0.5rem",
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#C9A962",
    letterSpacing: "0.06em",
  },
  textarea: {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
    color: "#e2e8f0",
    fontSize: "0.925rem",
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1.6,
  },
  inputRelative: { position: "relative" },
  eyeBtn: {
    position: "absolute",
    right: "0.9rem",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "0.2rem",
    zIndex: 2,
  },
  submitBtn: {
    width: "100%",
    padding: "0.9rem",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #C9A962, #E8D5A3)",
    border: "none",
    color: "#0b1520",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "1rem",
    letterSpacing: "0.01em",
    transition: "all 0.25s",
    marginTop: "0.5rem",
    boxShadow: "0 4px 20px rgba(201,169,98,0.25)",
  },
  submitInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  loginRow: {
    textAlign: "center",
    marginTop: "1.5rem",
    color: "#64748b",
    fontSize: "0.875rem",
  },
  loginLink: { color: "#C9A962", textDecoration: "none", fontWeight: 600 },
};
