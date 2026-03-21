import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getArtifactBySlug } from "../api/client.js";
import Layout from "../components/Layout.jsx";

export default function ArtifactDetailPage() {
  const { slug } = useParams();
  const [artifact, setArtifact] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let ignore = false;

    setStatus("loading");
    getArtifactBySlug(slug)
      .then((data) => {
        if (!ignore) {
          setArtifact(data);
          setStatus("success");
        }
      })
      .catch(() => {
        if (!ignore) {
          setStatus("error");
        }
      });

    return () => {
      ignore = true;
    };
  }, [slug]);

  return (
    <Layout>
      <div className="detail-page">
        <Link to="/" className="back-link">
          Каталог руу буцах
        </Link>

        {status === "loading" && <p className="feedback">Дэлгэрэнгүй мэдээллийг ачаалж байна...</p>}
        {status === "error" && (
          <p className="feedback error">Энэ өвийн мэдээллийг ачаалж чадсангүй.</p>
        )}

        {status === "success" && artifact && (
          <>
            <section className="detail-hero">
              <div className="detail-copy">
                <span className="eyebrow">{artifact.category}</span>
                <h1>{artifact.name}</h1>
                <p className="artifact-card-title-mn">{artifact.nameMn}</p>
                <p>{artifact.description}</p>
                <div className="detail-meta">
                  <div>
                    <span>Он цагийн үе</span>
                    <strong>{artifact.period}</strong>
                  </div>
                  <div>
                    <span>Аймаг</span>
                    <strong>{artifact.province}</strong>
                  </div>
                  <div>
                    <span>Байршил</span>
                    <strong>{artifact.location}</strong>
                  </div>
                </div>
              </div>

              <img src={artifact.imageUrl} alt={artifact.name} className="detail-image" />
            </section>

            <section className="detail-columns">
              <div className="info-card">
                <h2>3D үзүүлэн</h2>
                <p>
                  Энэ MVP хувилбар нь embed хэлбэрийн 3D model viewer ашиглаж байна.
                  Дараагийн шатанд үүнийг native Three.js viewer болон тайлбар тэмдэглэгээтэй болгоно.
                </p>
                <div className="viewer-frame">
                  <iframe
                    title={`${artifact.name} 3D үзүүлэн`}
                    src={artifact.modelEmbedUrl}
                    allow="autoplay; fullscreen; xr-spatial-tracking"
                  />
                </div>
              </div>

              <div className="info-card">
                <h2>Бүртгэлийн хураангуй</h2>
                <ul className="detail-list">
                  <li>Өргөрөг: {artifact.coordinates.lat}</li>
                  <li>Уртраг: {artifact.coordinates.lng}</li>
                  <li>Төлөв: {artifact.status}</li>
                  <li>Түлхүүр үгс: {artifact.tags.join(", ")}</li>
                </ul>
              </div>
            </section>

            <section className="gallery-section">
              <h2>Зургийн сан</h2>
              <div className="gallery-grid">
                {artifact.gallery.map((image) => (
                  <img key={image} src={image} alt={artifact.name} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}
