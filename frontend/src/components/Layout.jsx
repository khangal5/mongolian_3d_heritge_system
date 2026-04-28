import { Link, useLocation } from "react-router-dom";
import { clearStoredAuth, getStoredAuth } from "../auth.js";

function BrandLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l8.5 4.9v10.2L12 22l-8.5-4.9V6.9L12 2z" />
      <path d="M3.5 6.9L12 12l8.5-5.1" opacity="0.7" />
      <path d="M12 12v10" opacity="0.5" />
    </svg>
  );
}

const PUBLIC_NAV_ITEMS = [
  {
    to: "/",
    label: "Каталог",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    )
  }
];

const RESEARCHER_NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Миний олдвор",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3h7v9H3z" />
        <path d="M14 3h7v5h-7z" />
        <path d="M14 12h7v9h-7z" />
        <path d="M3 16h7v5H3z" />
      </svg>
    )
  },
  {
    to: "/artifacts/new",
    label: "Шинэ дурсгал",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    )
  },
  {
    to: "/reconstruction-lab",
    label: "Reconstruction lab",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 3h6v4l4 10a2 2 0 0 1-1.8 2.9H6.8A2 2 0 0 1 5 17l4-10V3z" />
        <path d="M9 14h6" />
      </svg>
    )
  }
];

const ADMIN_NAV_ITEMS = [
  {
    to: "/admin/queue",
    label: "Олдвор хянах",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 12l2 2 4-4" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    )
  },
  {
    to: "/admin/researchers",
    label: "Судлаачид",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M17 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }
];

function buildNavItems(role) {
  if (role === "admin") {
    return [...PUBLIC_NAV_ITEMS, ...ADMIN_NAV_ITEMS];
  }
  if (role === "researcher") {
    return [...PUBLIC_NAV_ITEMS, ...RESEARCHER_NAV_ITEMS];
  }
  return PUBLIC_NAV_ITEMS;
}

export default function Layout({ children }) {
  const location = useLocation();
  const auth = typeof window === "undefined" ? null : getStoredAuth();

  const navItems = buildNavItems(auth?.user?.role);
  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <div className="page-shell">
      <div className="page-ambient page-ambient-one" />
      <div className="page-ambient page-ambient-two" />
      <div className="page-ambient page-ambient-three" />

      <header className="site-header">
        <Link to="/" className="brand-block">
          <span className="brand-mark">
            <BrandLogo />
          </span>
          <span className="brand-copy">
            <span className="brand">Монголын 3D өвийн сан</span>
            <span className="brand-subtitle">Heritage · 3D · Interactive</span>
          </span>
        </Link>

        <nav>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={isActive(item.to) ? "is-active" : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}

          {!auth?.user && (
            <Link to="/login">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
              </svg>
              <span>Нэвтрэх</span>
            </Link>
          )}
          {!auth?.user && (
            <Link to="/register" className="nav-button-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M19 8v6" />
                <path d="M22 11h-6" />
              </svg>
              <span>Бүртгүүлэх</span>
            </Link>
          )}
          {auth?.user && <span className="user-chip">{auth.user.fullName}</span>}
          {auth?.user && (
            <button
              type="button"
              className="nav-button"
              onClick={() => {
                clearStoredAuth();
                window.location.href = "/";
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              <span>Гарах</span>
            </button>
          )}
        </nav>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <p>© 2026 Монголын 3D өвийн веб платформ</p>
        <div className="site-footer-links">
          <span>Three.js</span>
          <span>WebGL</span>
          <span>Leaflet</span>
        </div>
      </footer>
    </div>
  );
}
