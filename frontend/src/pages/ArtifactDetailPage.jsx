import { Suspense, lazy, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getArtifactBySlug } from "../api/client.js";
import Layout from "../components/Layout.jsx";

const ModelViewer = lazy(() => import("../components/ModelViewer.jsx"));
const ArtifactMap = lazy(() => import("../components/ArtifactMap.jsx"));

function MapFallback() {
  return (
    <div className="artifact-map-empty">
      <strong>Газрын зураг</strong>
      <span>Ачааллаж байна...</span>
    </div>
  );
}

function ViewerFallback() {
  return (
    <div className="model-viewer-shell">
      <div className="model-viewer-canvas" />
      <div className="model-viewer-status model-viewer-status-loading">
        <strong>Three.js WebGL Viewer</strong>
        <span>3D үзүүлэн ачааллаж байна...</span>
      </div>
    </div>
  );
}

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

        {status === "loading" && <p className="feedback">Дэлгэрэнгүй мэдээллийг ачааллаж байна...</p>}
        {status === "error" && (
          <p className="feedback error">Энэ өвийн мэдээллийг ачааллаж чадсангүй.</p>
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

                <div className="detail-chip-row">
                  {artifact.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="detail-image-shell">
                <img src={artifact.imageUrl} alt={artifact.name} className="detail-image" />
                <div className="detail-image-note">
                  <span>Exhibit frame</span>
                  <strong>Immersive visual presentation</strong>
                </div>
              </div>
            </section>

            <section className="detail-columns">
              <div className="info-card viewer-card">
                <div className="viewer-card-header">
                  <div>
                    <p className="eyebrow">3D Viewer</p>
                    <h2>3D үзүүлэн</h2>
                  </div>
                  <div className="viewer-chip-row">
                    <span className="viewer-chip">Orbit</span>
                    <span className="viewer-chip">Zoom</span>
                    <span className="viewer-chip">WebGL</span>
                  </div>
                </div>

                <p>
                  Моделио чөлөөтэй эргүүлж, ойртуулж үзнэ.
                </p>

                <div className="viewer-frame">
                  <div className="viewer-frame-glow" />
                  <Suspense fallback={<ViewerFallback />}>
                    <ModelViewer
                      modelUrl={artifact.modelUrl || artifact.modelEmbedUrl}
                      title={artifact.name}
                    />
                  </Suspense>
                </div>
              </div>

              <div className="detail-side-stack">
                <div className="info-card info-card-compact">
                  <p className="eyebrow">Бүртгэл</p>
                  <h2>Хураангуй</h2>
                  <ul className="detail-list">
                    <li><span>Өргөрөг</span><strong>{artifact.coordinates.lat}</strong></li>
                    <li><span>Уртраг</span><strong>{artifact.coordinates.lng}</strong></li>
                    <li><span>Төлөв</span><strong>{artifact.status}</strong></li>
                    <li><span>Ангилал</span><strong>{artifact.category}</strong></li>
                  </ul>
                </div>

                <div className="info-card info-card-compact">
                  <div className="viewer-card-header">
                    <div>
                      <p className="eyebrow">Газрын зураг</p>
                      <h2>Байршил</h2>
                    </div>
                    <div className="viewer-chip-row">
                      <span className="viewer-chip">OSM</span>
                      <span className="viewer-chip">Leaflet</span>
                    </div>
                  </div>
                  <p>{artifact.province} — {artifact.location}</p>
                  <Suspense fallback={<MapFallback />}>
                    <ArtifactMap
                      latitude={artifact.coordinates.lat}
                      longitude={artifact.coordinates.lng}
                      name={artifact.name}
                      location={artifact.location}
                    />
                  </Suspense>
                </div>
              </div>
            </section>

            <section className="gallery-section">
              <div className="gallery-heading">
                <div>
                  <p className="eyebrow">Зургууд</p>
                  <h2>Зургийн сан</h2>
                </div>
                <strong>{artifact.gallery.length} зураг</strong>
              </div>

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
