import { Link, useLocation } from "react-router-dom";
import Layout from "./Layout.jsx";

const TABS = [
  { to: "/login", label: "Нэвтрэх" },
  { to: "/register", label: "Бүртгүүлэх" }
];

export default function AuthLayout({ title, subtitle, children, side }) {
  const location = useLocation();
  const isActive = (to) => location.pathname.startsWith(to);

  return (
    <Layout>
      <section className="auth-shell-v2">
        <aside className="auth-side-v2">
          <div className="auth-side-brand">
            <span className="auth-side-mark">◆</span>
            <span>Түүхэн өв</span>
          </div>
          <h1>{title}</h1>
          {subtitle && <p className="auth-side-sub">{subtitle}</p>}
          {side && <div className="auth-side-content">{side}</div>}
        </aside>

        <div className="auth-main">
          <nav className="auth-tabs">
            {TABS.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to}
                className={`auth-tab ${isActive(tab.to) ? "is-active" : ""}`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          <div className="auth-content">{children}</div>
        </div>
      </section>
    </Layout>
  );
}
