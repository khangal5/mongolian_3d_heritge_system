import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { clearStoredAuth, getStoredAuth, setStoredAuth } from "../auth.js";
import { getCurrentUser, logout as logoutRequest } from "../api/client.js";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("heritage_theme");
  if (stored === "light" || stored === "dark") return stored;
  return "light";
}

function applyTheme(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

const PUBLIC_NAV_ITEMS = [
  { to: "/", label: "Нүүр", exact: true },
  { to: "/", label: "Олдворууд", anchor: "#catalog" },
  { to: "/map", label: "Газрын зураг" }
];

function avatarInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Layout({ children, sidebar }) {
  const location = useLocation();
  const [auth, setAuth] = useState(() =>
    typeof window === "undefined" ? null : getStoredAuth()
  );
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("heritage_theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    if (!auth?.user) return;

    let cancelled = false;
    getCurrentUser()
      .then((response) => {
        if (cancelled) return;
        const next = { user: response.user };
        setAuth(next);
        setStoredAuth(next);
      })
      .catch((requestError) => {
        if (cancelled) return;
        if (requestError.status === 401) {
          clearStoredAuth();
          setAuth(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // session may already be invalid
    }
    clearStoredAuth();
    window.location.href = "/";
  }

  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <div className="page-shell">
      <div className="page-ambient page-ambient-one" />
      <div className="page-ambient page-ambient-two" />
      <div className="page-ambient page-ambient-three" />

      <header className="site-header">
        <Link to="/" className="brand-block">
          <span className="brand-mark">◆</span>
          <span className="brand-copy">
            <span className="brand">Түүхэн өв</span>
          </span>
        </Link>

        <nav className="site-nav">
          <Link
            to="/"
            className={location.pathname === "/" ? "is-active" : undefined}
          >
            Нүүр
          </Link>
          <Link
            to="/artifacts"
            className={location.pathname === "/artifacts" ? "is-active" : undefined}
          >
            Олдворууд
          </Link>
          <Link
            to="/map"
            className={location.pathname.startsWith("/map") ? "is-active" : undefined}
          >
            Газрын зураг
          </Link>
        </nav>

        <div className="site-nav-right">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Харанхуй горим" : "Цайвар горим"}
            title={theme === "light" ? "Харанхуй горим руу" : "Цайвар горим руу"}
          >
            {theme === "light" ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            )}
          </button>

          {!auth?.user && (
            <>
              <Link to="/login" className="nav-secondary">Нэвтрэх</Link>
              <Link to="/register" className="nav-primary">Бүртгүүлэх</Link>
            </>
          )}
          {auth?.user && (
            <div className="user-menu">
              <Link
                to={auth.user.role === "admin" ? "/admin/queue" : "/dashboard"}
                className="user-avatar"
                title={`${auth.user.fullName} · Самбар руу`}
                aria-label="Хэрэглэгчийн самбар"
              >
                {avatarInitials(auth.user.fullName)}
              </Link>
              <button type="button" className="nav-secondary" onClick={handleLogout}>
                Гарах
              </button>
            </div>
          )}
        </div>
      </header>

      {sidebar ? (
        <div className="page-with-sidebar">
          <aside className="site-sidebar">{sidebar}</aside>
          <main className="page-main with-sidebar">{children}</main>
        </div>
      ) : (
        <main className="page-main">{children}</main>
      )}

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
