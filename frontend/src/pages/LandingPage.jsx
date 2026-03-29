import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../style/LandingPage.css";
import Lottie from "lottie-react";
import moneyBag from "../assets/money-bag.json";
import animationMoney from "../assets/animation money.json";

function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [loaded, setLoaded] = useState(false);
  const [activeTeams, setActiveTeams] = useState(null);

  const featuresRef = useRef(null);
  const visionRef = useRef(null);
  const needRef = useRef(null);
  const aboutRef = useRef(null);

  // Fetch active teams count from backend
  useEffect(() => {
    fetch("/api/stats/active-teams")
      .then((res) => res.json())
      .then((data) => setActiveTeams(data.count))
      .catch(() => setActiveTeams("500+"));
  }, []);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);

    const sectionRefs = [
      { id: "features", ref: featuresRef },
      { id: "vision", ref: visionRef },
      { id: "need", ref: needRef },
      { id: "about", ref: aboutRef },
    ];

    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
      for (const section of sectionRefs) {
        if (section.ref.current) {
          const rect = section.ref.current.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(section.id);
            return;
          }
        }
      }
      if (window.scrollY < 200) setActiveSection("hero");
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="app-root">
      {/* Background */}
      <div className="bg-layer">
        <div className="bg-grid" />
        <div className="bg-radial" />
        <div className="bg-noise" />
      </div>

      {/* Navbar */}
      <nav className={`navbar${scrolled ? " navbar--scrolled" : ""}`}>
        <div className="navbar__inner">
          <div className="logo" onClick={() => scrollTo("hero")}>
            <div className="logo__icon">F</div>
            <span className="logo__name">Flowpay</span>
          </div>

          <div className="nav-links">
            {["Features", "Vision", "Need", "About"].map((link) => (
              <button
                key={link}
                onClick={() => scrollTo(link.toLowerCase())}
                className={`nav-link${activeSection === link.toLowerCase() ? " nav-link--active" : ""}`}
              >
                {link}
              </button>
            ))}
          </div>

          <div className="nav-auth">
            <button className="btn-ghost" onClick={() => navigate("/login")}>
              Login
            </button>
            <button
              className="btn-primary btn-shimmer"
              onClick={() => navigate("/SignIn")}
            >
              SignIn
            </button>
          </div>

          <button className="mobile-menu-btn">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section id="hero" className="hero">
        <div className="container">
          <div className="hero__grid">
            {/* Left */}
            <div
              className={`hero__content${loaded ? " hero__content--loaded" : ""}`}
            >
              <div className="badge">
                <span className="badge__dot" />
                <span className="badge__text">AI-Powered Finance</span>
              </div>

              <h1 className="hero__headline">
                <span className="block">Master Your</span>
                <span className="gradient-text">Company Expenses</span>
                <span className="block">with Intelligence</span>
              </h1>

              <p className="hero__sub">
                “Smarter Reimbursements. Faster Approvals. Zero Fraud
                Guesswork.”
              </p>

              <div className="hero__cta">
                <button
                  className="btn-primary btn-primary--lg btn-shimmer"
                  onClick={() => navigate("/login")}
                >
                  Get Started
                </button>
              </div>
            </div>

            {/* Right — Cards */}
            <div
              className={`hero__cards${loaded ? " hero__cards--loaded" : ""}`}
            >
              <div className="card-stack">
                <div className="card-wrapper card-wrapper--3">
                  <CreditCard
                    name="ALEXANDRA CHEN"
                    number="•••• •••• •••• 8429"
                    expiry="08/28"
                    type="CORPORATE"
                    colorClass="card--dark3"
                  />
                </div>
                <div className="card-wrapper card-wrapper--2">
                  <CreditCard
                    name="JAMES WILSON"
                    number="•••• •••• •••• 3156"
                    expiry="12/27"
                    type="PLATINUM"
                    colorClass="card--dark2"
                  />
                </div>
                <div className="card-wrapper card-wrapper--1">
                  <CreditCard
                    name="SARAH MITCHELL"
                    number="•••• •••• •••• 7892"
                    expiry="06/29"
                    type="TITANIUM"
                    colorClass="card--dark1"
                    logo="TITANIUM"
                  />
                </div>
              </div>

              {/* Float cards */}
              <div className="float-card float-card--balance">
                <div className="float-card__header">
                  <span className="float-card__label">Total Balance</span>
                  <span className="pulse-dot" />
                </div>
                <div className="float-card__value">$24,589</div>
                <MiniChart />
                <div className="float-card__footer">
                  <span className="text-gold">+12.5%</span>
                  <span className="text-muted">vs last month</span>
                </div>
              </div>

              <div className="float-card float-card--approval">
                <div className="float-card__row">
                  <div className="approval-icon">
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                    Approval
                  </span>
                </div>
                <div className="float-card__row float-card__row--between">
                  <span className="float-card__name">Team Dinner</span>
                  <span className="tag-approved">Approved</span>
                </div>
              </div>

              <div className="float-card float-card--receipt">
                <div className="float-card__row">
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="#C9A962"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-muted" style={{ fontSize: "0.65rem" }}>
                    Receipt
                  </span>
                </div>
                <div className="receipt-merchant">Starbucks</div>
                <div className="receipt-grid">
                  <div>
                    <div className="text-muted" style={{ fontSize: "0.6rem" }}>
                      Amount
                    </div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                      $24.50
                    </div>
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: "0.6rem" }}>
                      Date
                    </div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                      Mar 28
                    </div>
                  </div>
                </div>
              </div>

              <div className="float-card float-card--risk">
                <div
                  className="text-muted"
                  style={{ fontSize: "0.65rem", marginBottom: "0.5rem" }}
                >
                  Risk Score
                </div>
                <div className="risk-bar-row">
                  <div className="risk-bar">
                    <div className="risk-bar__fill" />
                  </div>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "#C9A962",
                      fontWeight: 700,
                    }}
                  >
                    Low
                  </span>
                </div>
                <div className="risk-labels">
                  <span style={{ color: "#f87171", fontSize: "0.65rem" }}>
                    H
                  </span>
                  <span style={{ color: "#fbbf24", fontSize: "0.65rem" }}>
                    M
                  </span>
                  <span style={{ color: "#C9A962", fontSize: "0.65rem" }}>
                    L
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            {[
              { value: "$2.4B+", label: "Processed Annually" },
              { value: "98.7%", label: "Accuracy Rate" },
              { value: "15min", label: "Avg Approval Time" },
              {
                value: activeTeams !== null ? activeTeams : "…",
                label: "Active Teams",
              },
            ].map((stat, i) => (
              <div key={i} className="stat-item">
                <div className="stat-item__value gradient-text">
                  {stat.value}
                </div>
                <div className="stat-item__label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" ref={featuresRef} className="section">
        <div className="container">
          <div className="section__grid">
            <div className="section__content">
              <div className="section-badge">
                <span className="section-badge__num">01</span>
                <span className="section-badge__text">Features</span>
              </div>
              <h2 className="section__title">
                Intelligent Expense{" "}
                <span className="gradient-text">Tracking</span>
              </h2>
              <p className="section__desc">
                Our AI automatically categorizes every transaction, detects
                anomalies, and provides real-time insights into your spending
                patterns.
              </p>
              <div className="feature-list">
                {[
                  {
                    icon: "⚡",
                    title: "Smart Auto-Categorization",
                    desc: "AI automatically tags expenses by vendor, category, and project",
                  },
                  {
                    icon: "✅",
                    title: "Intelligent Workflows",
                    desc: "Streamlined approvals with role-based routing and real-time updates",
                  },
                  {
                    icon: "📊",
                    title: "Real-time Analytics",
                    desc: "Live dashboards with custom reports",
                  },
                ].map((f, i) => (
                  <div key={i} className="feature-item glass">
                    <span className="feature-item__icon">{f.icon}</span>
                    <div>
                      <h3 className="feature-item__title">{f.title}</h3>
                      <p className="feature-item__desc">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="section__anim">
              <SpinningCoinsAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section id="vision" ref={visionRef} className="section">
        <div className="container">
          <div className="section__grid section__grid--reversed">
            <div className="section__anim">
              <VisionAnimation />
            </div>
            <div className="section__content">
              <div className="section-badge">
                <span className="section-badge__num">02</span>
                <span className="section-badge__text">Vision</span>
              </div>
              <h2 className="section__title">
                The Future of <span className="gradient-text">Finance</span>
              </h2>
              <p className="section__desc">
                We're building the next generation of financial
                infrastructure—one where every transaction is intelligent,
                transparent, and instant.
              </p>
              <div className="timeline">
                {[
                  {
                    year: "2024",
                    title: "Launch",
                    desc: "AI-powered expense management",
                  },
                  {
                    year: "2025",
                    title: "Scale",
                    desc: "Global payments infrastructure",
                  },
                  {
                    year: "2026",
                    title: "Transform",
                    desc: "Autonomous finance for every business",
                  },
                ].map((item, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-item__year glass">
                      <span className="gradient-text">{item.year}</span>
                    </div>
                    <div>
                      <h3 className="timeline-item__title">{item.title}</h3>
                      <p className="timeline-item__desc">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Need */}
      <section id="need" ref={needRef} className="section">
        <div className="container">
          <div className="section__grid">
            <div className="section__content">
              <div className="section-badge">
                <span className="section-badge__num">03</span>
                <span className="section-badge__text">Why You Need This</span>
              </div>
              <h2 className="section__title">
                Stop Losing Money on{" "}
                <span className="gradient-text">Manual Processes</span>
              </h2>
              <p className="section__desc">
                The average company loses 5% of revenue to inefficient expense
                management. Flowpay recovers it all.
              </p>
              <div className="stat-blocks">
                {[
                  { percentage: "5%", label: "Average Revenue Lost" },
                  { percentage: "40hrs", label: "Saved Per Month" },
                  { percentage: "90%", label: "Faster Approvals" },
                ].map((s, i) => (
                  <div key={i} className="stat-block">
                    <div className="stat-block__num gradient-text">
                      {s.percentage}
                    </div>
                    <span className="stat-block__label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="section__anim">
              <DollarFlowAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" ref={aboutRef} className="section">
        <div className="container">
          <div className="section__grid section__grid--reversed">
            <div className="section__anim">
              <TeamAnimation />
            </div>
            <div className="section__content">
              <div className="section-badge">
                <span className="section-badge__num">04</span>
                <span className="section-badge__text">About Us</span>
              </div>
              <h2 className="section__title">
                Built by Finance <span className="gradient-text">Experts</span>
              </h2>
              <p className="section__desc">
                Our team combines decades of experience from top fintech
                companies. We understand the challenges because we've lived
                them.
              </p>
              <div className="about-stats">
                {[
                  { value: "$2.4B+", label: "Processed" },
                  {
                    value: activeTeams !== null ? activeTeams : "…",
                    label: "Companies",
                  },
                  { value: "99.9%", label: "Uptime" },
                  { value: "24/7", label: "Support" },
                ].map((s, i) => (
                  <div key={i} className="about-stat glass">
                    <div className="about-stat__value gradient-text">
                      {s.value}
                    </div>
                    <div className="about-stat__label">{s.label}</div>
                  </div>
                ))}
              </div>
              <button
                className="btn-primary btn-primary--lg btn-shimmer"
                style={{ marginTop: "2rem" }}
              >
                Meet Our Team
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box glass glow">
            <h2 className="cta-box__title">
              Ready to Transform Your{" "}
              <span className="gradient-text">Finance?</span>
            </h2>
            <p className="cta-box__sub">
              Join {activeTeams !== null ? activeTeams : "500+"} companies
              already saving time and money with Flowpay.
            </p>
            <button
              className="btn-primary btn-primary--lg btn-shimmer"
              onClick={() => navigate("/login")}
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer__inner">
          <div className="logo">
            <div className="logo__icon logo__icon--sm">F</div>
            <span className="logo__name">Flowpay</span>
          </div>
          <div className="footer__links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Contact</a>
          </div>
          <div className="footer__copy">
            © 2026 Flowpay. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Credit Card ─── */
function CreditCard({ name, number, expiry, type, colorClass, logo }) {
  return (
    <div className={`credit-card ${colorClass}`}>
      <div className="credit-card__top">
        <svg
          className="credit-card__logo-icon"
          width="40"
          height="40"
          viewBox="0 0 48 48"
          fill="#C9A962"
        >
          <path
            d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4zm0 36c-8.837 0-16-7.163-16-16S15.163 8 24 8s16 7.163 16 16-7.163 16-16 16z"
            opacity="0.3"
          />
          <path
            d="M24 12c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 22c-5.514 0-10-4.486-10-10s4.486-10 10-10 10 4.486 10 10-4.486 10-10 10z"
            opacity="0.5"
          />
        </svg>
        <span className="credit-card__type">{type}</span>
      </div>
      <div className="credit-card__chip-row">
        <div className="credit-card__chip" />
        {logo && (
          <span className="credit-card__brand gradient-text">{logo}</span>
        )}
      </div>
      <div className="credit-card__number">{number}</div>
      <div className="credit-card__bottom">
        <div>
          <div className="credit-card__meta-label">Card Holder</div>
          <div className="credit-card__meta-value">{name}</div>
        </div>
        <div className="text-right">
          <div className="credit-card__meta-label">Expires</div>
          <div className="credit-card__meta-value">{expiry}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Mini Chart ─── */
function MiniChart() {
  const data = [20, 35, 25, 45, 30, 55, 40, 60, 45, 70, 55, 75];
  const max = Math.max(...data);
  const w = 100,
    h = 30;
  const pts = data.map(
    (v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`,
  );
  const linePath = `M${pts.join(" L")}`;
  const areaPath = `M${pts.join(" L")} L${w},${h} L0,${h} Z`;

  return (
    <svg
      className="mini-chart"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A962" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#C9A962" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#cg)" />
      <path
        d={linePath}
        fill="none"
        stroke="#C9A962"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Spinning Coins ─── */
function SpinningCoinsAnimation() {
  return (
    <div className="anim-coins">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="coin-orbit"
          style={{ "--i": i, animationDelay: `${i * -1}s` }}
        >
          <div className="coin">$</div>
        </div>
      ))}
      <div className="coin-center">
        <div className="coin coin--lg">$</div>
      </div>
      <div className="anim-glow" />
    </div>
  );
}

/* ─── Vision Animation ─── */
function VisionAnimation() {
  return (
    <div style={{ width: "320px", height: "320px" }}>
      <Lottie
        animationData={moneyBag}
        loop={true}
        autoplay={true}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

/* ─── Dollar Flow Animation ─── */
function DollarFlowAnimation() {
  return (
    <div className="anim-dollar">
      {[10, 20, 50, 100].map((value, i) => (
        <div
          key={i}
          className="dollar-bill"
          style={{ top: `${18 + i * 14}%`, animationDelay: `${i * 0.35}s` }}
        >
          ${value}
        </div>
      ))}
      <div className="dollar-center glass">
        <div className="dollar-ai">AI</div>
      </div>
      <div className="dollar-ping" />
    </div>
  );
}

/* ─── Team Animation ─── */
function TeamAnimation() {
  return (
    <div style={{ width: "320px", height: "320px" }}>
      <Lottie
        animationData={animationMoney}
        loop={true}
        autoplay={true}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

export default LandingPage;
