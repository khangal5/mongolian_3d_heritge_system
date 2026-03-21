import { Link } from "react-router-dom";

export default function Layout({ children }) {
  return (
    <div className="page-shell">
      <header className="site-header">
        <Link to="/" className="brand">
          Монголын 3D өвийн сан
        </Link>
        <nav>
          <a href="#catalog">Каталог</a>
          <a href="#platform">Платформын тухай</a>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <p>Монголын түүхэн өвийг хайлттай, интерактив веб системээр түгээх дипломын ажлын MVP.</p>
      </footer>
    </div>
  );
}
