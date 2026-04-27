import { Suspense, lazy, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getArtifactBySlug } from "../api/client.js";
import { getStoredAuth } from "../auth.js";
import Layout from "../components/Layout.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const ModelViewer = lazy(() => import("../components/ModelViewer.jsx"));
const ArtifactMap = lazy(() => import("../components/ArtifactMap.jsx"));

function MapFallback() {
  return (
    <div className="detail-map-empty">
      <span>Газрын зураг ачаалж байна...</span>
    </div>
  );
}

function ViewerFallback() {
  return (
    <div className="detail-viewer-fallback">
      <span>3D үзүүлэн ачааллаж байна...</span>
    </div>
  );
}

export default function ArtifactDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [artifact, setArtifact] = useState(null);
  const [status, setStatus] = useState("loading");
  const auth = typeof window === "undefined" ? null : getStoredAuth();

  function handleBack() {
    if (artifact && artifact.status === "APPROVED") {
      navigate("/artifacts");
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/artifacts");
    }
  }
  const canSeeStatus =
    artifact &&
    auth?.user &&
    (auth.user.role === "admin" || auth.user.id === artifact.createdByUserId);

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
      <div className="detail-v2">
        <div className="detail-breadcrumb">
          <button type="button" className="detail-back-button" onClick={handleBack}>
            ← {artifact && artifact.status === "APPROVED" ? "Каталог руу буцах" : "Буцах"}
          </button>
          {artifact && (
            <span className="detail-breadcrumb-trail">
              3D загвар · {artifact.category}
            </span>
          )}
        </div>

        {status === "loading" && <p className="feedback">Дэлгэрэнгүй мэдээллийг ачааллаж байна...</p>}
        {status === "error" && (
          <p className="feedback error">Энэ өвийн мэдээллийг ачааллаж чадсангүй.</p>
        )}

        {status === "success" && artifact && (
          <>
            <section className="detail-top">
              <div className="detail-viewer-card">
                {(artifact.modelUrl || artifact.modelEmbedUrl) ? (
                  <Suspense fallback={<ViewerFallback />}>
                    <ModelViewer
                      modelUrl={artifact.modelUrl || artifact.modelEmbedUrl}
                      title={artifact.name}
                    />
                  </Suspense>
                ) : (
                  <div className="detail-viewer-empty">
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                    <strong>3D загвар хараахан байршуулаагүй</strong>
                    <p>Судлаачийн оруулсан зургуудаас фотограмметрийн боловсруулалт хийсний дараа администратор 3D загварыг энд байршуулна.</p>
                  </div>
                )}
              </div>

              <div className="detail-meta-card">
                <h1 className="detail-title">{artifact.nameMn || artifact.name}</h1>
                <p className="detail-subtitle">
                  {artifact.category} · {artifact.period}
                  {artifact.coordinates &&
                    ` · МЭӨ I мянган`}
                </p>

                {canSeeStatus && (
                  <div className="detail-status-row">
                    <StatusBadge status={artifact.status} />
                    {artifact.status === "REJECTED" && artifact.reviewNote && (
                      <span className="detail-status-note">
                        {artifact.reviewNote}
                      </span>
                    )}
                  </div>
                )}

                <table className="detail-info-table">
                  <tbody>
                    <tr>
                      <th>Төрөл</th>
                      <td>{artifact.category}</td>
                    </tr>
                    <tr>
                      <th>Он цаг</th>
                      <td>{artifact.period}</td>
                    </tr>
                    <tr>
                      <th>Байршил</th>
                      <td>{artifact.province} аймаг{artifact.location ? `, ${artifact.location}` : ""}</td>
                    </tr>
                    <tr>
                      <th>Координат</th>
                      <td>
                        {artifact.coordinates?.lat?.toFixed?.(4)},{" "}
                        {artifact.coordinates?.lng?.toFixed?.(4)}
                      </td>
                    </tr>
                    {artifact.createdAt && (
                      <tr>
                        <th>Бүртгэсэн</th>
                        <td>{new Date(artifact.createdAt).toLocaleDateString("mn-MN")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="detail-description">
                  <h3>Тайлбар</h3>
                  <p>{artifact.shortDescription}</p>
                  <p>{artifact.description}</p>
                </div>

                {artifact.tags.length > 0 && (
                  <div className="detail-tags">
                    {artifact.tags.map((tag) => (
                      <span key={tag} className="detail-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="detail-map-section">
              <header className="detail-section-header">
                <h2>Газарзүйн байршил</h2>
                <span>{artifact.province} аймаг, {artifact.location}</span>
              </header>
              <Suspense fallback={<MapFallback />}>
                <ArtifactMap
                  latitude={artifact.coordinates.lat}
                  longitude={artifact.coordinates.lng}
                  name={artifact.name}
                  location={artifact.location}
                />
              </Suspense>
            </section>

            {artifact.gallery.length > 0 && (
              <section className="detail-gallery-section">
                <header className="detail-section-header">
                  <h2>Зургийн сан</h2>
                  <span>{artifact.gallery.length} зураг</span>
                </header>
                <div className="detail-gallery-grid">
                  {artifact.gallery.map((image) => (
                    <img key={image} src={image} alt={artifact.name} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
