import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";

export default function NotFoundPage() {
  return (
    <Layout>
      <section className="auth-utility-shell">
        <div className="auth-utility-card auth-utility-card-narrow notfound-card">
          <div className="notfound-code">404</div>
          <h1>Хуудас олдсонгүй</h1>
          <p>
            Таны хайсан хуудас байхгүй эсвэл шилжсэн байна. Каталог руу буцаж олдвор сонгох эсвэл нүүр хуудас руу буцна уу.
          </p>
          <Link to="/" className="auth-submit" style={{ display: "inline-block", textDecoration: "none" }}>
            Нүүр хуудас руу
          </Link>
        </div>
      </section>
    </Layout>
  );
}
