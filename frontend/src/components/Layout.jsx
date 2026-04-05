import { Link } from "react-router-dom";
import { clearStoredAuth, getStoredAuth } from "../auth.js";

export default function Layout({ children }) {
  const auth = typeof window === "undefined" ? null : getStoredAuth();

  return (
    <div className="page-shell">
      <div className="page-ambient page-ambient-one" />
      <div className="page-ambient page-ambient-two" />
      <div className="page-ambient page-ambient-three" />

      <header className="site-header">
        <div className="brand-block">
          <Link to="/" className="brand">
            Монголын 3D өвийн сан
          </Link>
          <p className="brand-subtitle">3D каталог ба дурсгалын сан</p>
        </div>

        <nav>
          <Link to="/">Каталог</Link>
          <Link to="/artifacts/new">Шинэ дурсгал</Link>
          <Link to="/reconstruction-lab">Reconstruction lab</Link>
          {!auth?.user && <Link to="/login">Нэвтрэх</Link>}
          {!auth?.user && <Link to="/register">Бүртгүүлэх</Link>}
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
              Гарах
            </button>
          )}
        </nav>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <p>Монголын 3D өвийн веб платформ.</p>
      </footer>
    </div>
  );
}
