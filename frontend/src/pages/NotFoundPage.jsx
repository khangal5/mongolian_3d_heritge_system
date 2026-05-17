import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";

export default function NotFoundPage() {
  return (
    <Layout>
      <section className="auth-shell">
        <section className="auth-side">
          <p className="eyebrow">404</p>
          <h1>Хуудас олдсонгүй</h1>
          <p className="hero-text">
            Таны хайсан хуудас байхгүй эсвэл шилжсэн байна. Каталог руу буцаж олдвор сонгох эсвэл нүүр хуудас руу буцна уу.
          </p>
          <Link to="/" className="secondary-link">
            Нүүр хуудас руу буцах
          </Link>
        </section>
      </section>
    </Layout>
  );
}
