import { Link } from "react-router-dom";
import { clearStoredAuth, getStoredAuth } from "../auth.js";

export default function Layout({ children }) {
  const auth = typeof window === "undefined" ? null : getStoredAuth();

  return (
    <div className="page-shell">
      <header className="site-header">
        <Link to="/" className="brand">
          Монголын 3D өвийн сан
        </Link>
        <nav>
          <Link to="/">Каталог</Link>
          <Link to="/artifacts/new">Шинэ дурсгал</Link>
          <Link to="/reconstruction-lab">Фотограмметрийн туршилт</Link>
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
        <p>Монголын түүхэн өвийг хайлттай, интерактив веб системээр түгээх дипломын ажлын MVP.</p>
      </footer>
    </div>
  );
}
