import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getArtifacts } from "../api/client.js";
import { getStoredAuth } from "../auth.js";
import ArtifactCard from "../components/ArtifactCard.jsx";
import Layout from "../components/Layout.jsx";

const HIGHLIGHT_CATEGORIES = [
  { label: "Хадны зураг", description: "Нүүдэлчдийн уламжлал, ан, амьдралын дүр зураг", tone: "ochre" },
  { label: "Чулуун хөшөө", description: "Буган чулуу, хүн чулуу, нүүдлийн соёл", tone: "indigo" },
  { label: "Чулуун бичээс", description: "Эртний түрэг, рунийн бичгийн дурсгал", tone: "moss" },
  { label: "Булш бунхан", description: "Хиргисүүр, дөрвөлжин булш, керексүүр", tone: "rose" }
];

export default function HomePage() {
  const [artifacts, setArtifacts] = useState([]);
  const [filters, setFilters] = useState({ categories: [], provinces: [], periods: [] });
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let ignore = false;
    setStatus("loading");
    getArtifacts({})
      .then((data) => {
        if (ignore) return;
        setArtifacts(data.items);
        setFilters(data.filters);
        setStatus("success");
      })
      .catch(() => {
        if (!ignore) setStatus("error");
      });
    return () => {
      ignore = true;
    };
  }, []);

  const featured = artifacts[0];
  const recent = useMemo(() => artifacts.slice(1, 5), [artifacts]);
  const totalCount = artifacts.length;
  const provinceCount = filters.provinces.filter(Boolean).length;
  const categoryCount = filters.categories.filter(Boolean).length;
  const periodCount = filters.periods.filter(Boolean).length;

  const visibleCategories = HIGHLIGHT_CATEGORIES.filter((item) =>
    filters.categories.includes(item.label)
  );
  const categoryList = visibleCategories.length > 0 ? visibleCategories : HIGHLIGHT_CATEGORIES;

  return (
    <Layout>
      <section className="showcase-hero">
        <div className="showcase-hero-copy">
          <span className="showcase-hero-eyebrow">Heritage · 3D · Interactive</span>
          <h1>
            Монгол орны түүхэн дурсгалуудыг<br />
            <em>гурван хэмжээст</em> орчинд судал.
          </h1>
          <p>
            Хадны зураг, чулуун хөшөө, бичээсийн 3D загвар, газарзүйн байршил,
            судлаачдын баталгаажуулсан мэдээллийг нэг дор.
          </p>
          <div className="showcase-hero-cta">
            <Link to="/artifacts" className="showcase-cta-primary">
              Олдвор үзэх
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M13 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/map" className="showcase-cta-secondary">
              Газрын зураг
            </Link>
          </div>
        </div>

        <div className="showcase-hero-visual" aria-hidden="true">
          <div className="showcase-shape showcase-shape-a" />
          <div className="showcase-shape showcase-shape-b" />
          <div className="showcase-shape showcase-shape-c" />
        </div>
      </section>

      <section className="showcase-stats">
        <div className="showcase-stat">
          <span>{totalCount}</span>
          <small>Бүртгэгдсэн олдвор</small>
        </div>
        <div className="showcase-stat">
          <span>{provinceCount}</span>
          <small>Аймаг хамарсан</small>
        </div>
        <div className="showcase-stat">
          <span>{categoryCount}</span>
          <small>Ангилал</small>
        </div>
        <div className="showcase-stat">
          <span>{periodCount}</span>
          <small>Цаг үе</small>
        </div>
      </section>

      {featured && (
        <section className="showcase-featured">
          <div className="showcase-featured-media">
            <img src={featured.imageUrl} alt={featured.name} />
            <span className="showcase-featured-badge">3D Ready</span>
          </div>
          <div className="showcase-featured-body">
            <span className="showcase-hero-eyebrow">Онцлох олдвор</span>
            <h2>{featured.nameMn || featured.name}</h2>
            <p className="showcase-featured-meta">
              {featured.category} · {featured.period} · {featured.province}
            </p>
            <p>{featured.shortDescription}</p>
            <Link to={`/artifacts/${featured.slug}`} className="showcase-cta-primary inline">
              Дэлгэрэнгүй харах
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      <section className="showcase-categories">
        <header className="home-section-head">
          <h2>Ангиллаар хайх</h2>
          <Link to="/artifacts">Бүгдийг үзэх →</Link>
        </header>
        <div className="showcase-category-grid">
          {categoryList.map((item) => (
            <Link
              key={item.label}
              to={`/artifacts?category=${encodeURIComponent(item.label)}`}
              className={`showcase-category tone-${item.tone}`}
            >
              <span className="showcase-category-title">{item.label}</span>
              <span className="showcase-category-desc">{item.description}</span>
              <span className="showcase-category-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="showcase-recent">
        <header className="home-section-head">
          <h2>Шинэ нэмэгдсэн</h2>
          <Link to="/artifacts">Бүгдийг үзэх →</Link>
        </header>

        {status === "loading" && <p className="feedback">Ачаалж байна...</p>}
        {status === "error" && (
          <p className="feedback error">Олдворуудыг авч чадсангүй. Backend серверээ шалгана уу.</p>
        )}
        {status === "success" && recent.length === 0 && (
          <p className="feedback">Хараахан бүртгэгдсэн олдвор алга.</p>
        )}
        {status === "success" && recent.length > 0 && (
          <div className="showcase-recent-grid">
            {recent.map((artifact) => (
              <ArtifactCard key={artifact.id} artifact={artifact} />
            ))}
          </div>
        )}
      </section>

      {!getStoredAuth()?.user && (
        <section className="showcase-cta-band">
          <div>
            <h2>Та судлаач уу?</h2>
            <p>Албан имэйлээрээ бүртгүүлж олдвор бүртгэх, 3D загвар оруулах эрхтэй болоорой.</p>
          </div>
          <Link to="/register" className="showcase-cta-primary inline">
            Судлаачаар бүртгүүлэх →
          </Link>
        </section>
      )}
    </Layout>
  );
}
