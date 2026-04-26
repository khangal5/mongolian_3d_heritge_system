import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  buildUploadUrl,
  getAdminResearchers,
  revokeResearcherVerification,
  verifyResearcherManually
} from "../api/client.js";
import { getStoredAuth } from "../auth.js";
import Layout from "../components/Layout.jsx";
import UserSidebar from "../components/UserSidebar.jsx";

const STATUS_LABELS = {
  submitted: { text: "Хүлээгдэж буй", tone: "pending" },
  verified: { text: "Баталгаажсан", tone: "approved" },
  rejected: { text: "Татгалзсан", tone: "rejected" }
};

function VerificationBadge({ status }) {
  const meta = STATUS_LABELS[status] || { text: status, tone: "neutral" };
  return <span className={`status-badge status-badge-${meta.tone}`}>{meta.text}</span>;
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("mn-MN");
  } catch {
    return value;
  }
}

function isImagePath(path) {
  if (!path) return false;
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(path);
}

export default function AdminResearchersPage() {
  const navigate = useNavigate();
  const [auth] = useState(() =>
    typeof window === "undefined" ? null : getStoredAuth()
  );
  const bootstrappedRef = useRef(false);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [filter, setFilter] = useState("all");

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const data = await getAdminResearchers();
      setItems(data.items);
      setStatus("success");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!auth?.user) {
      navigate("/login", { replace: true });
      return;
    }
    if (auth.user.role !== "admin") {
      navigate("/", { replace: true });
      return;
    }
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    refresh();
  }, [auth, navigate, refresh]);

  async function handleVerify(id) {
    setBusyId(id);
    setError("");
    try {
      await verifyResearcherManually(id);
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevoke(id) {
    if (!window.confirm("Энэ хэрэглэгчийн баталгаажуулалтыг хүчингүй болгох уу?")) {
      return;
    }
    setBusyId(id);
    setError("");
    try {
      await revokeResearcherVerification(id);
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId(null);
    }
  }

  if (!auth?.user) return null;

  const filtered = filter === "all" ? items : items.filter((u) => u.verificationStatus === filter);

  return (
    <Layout sidebar={<UserSidebar user={auth.user} />}>
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Судлаачдын бүртгэл</h1>
          <p className="dash-sub">Бүртгэгдсэн судлаачдын мэдээлэл, баталгаажуулалтын төлөв ба үнэмлэхний баримт.</p>
        </div>
      </header>

      <div className="admin-tab-row">
        <button
          type="button"
          className={`admin-tab-pill ${filter === "all" ? "is-active" : ""}`}
          onClick={() => setFilter("all")}
        >
          Бүгд ({items.length})
        </button>
        <button
          type="button"
          className={`admin-tab-pill ${filter === "submitted" ? "is-active" : ""}`}
          onClick={() => setFilter("submitted")}
        >
          Хүлээгдэж буй ({items.filter((u) => u.verificationStatus === "submitted").length})
        </button>
        <button
          type="button"
          className={`admin-tab-pill ${filter === "verified" ? "is-active" : ""}`}
          onClick={() => setFilter("verified")}
        >
          Баталгаажсан ({items.filter((u) => u.verificationStatus === "verified").length})
        </button>
      </div>

      {status === "loading" && <p className="feedback">Жагсаалт ачаалж байна...</p>}
      {error && <p className="feedback error">{error}</p>}

      {status === "success" && filtered.length === 0 && (
        <section className="empty-state">
          <h2>Жагсаалтад судлаач алга</h2>
          <p>Энэ шүүлтэд тохирох хэрэглэгч одоохондоо байхгүй.</p>
        </section>
      )}

      {status === "success" && filtered.length > 0 && (
        <div className="researcher-grid">
          {filtered.map((user) => {
            const proofUrl = buildUploadUrl(user.verificationDocumentUrl);
            const proofIsImage = isImagePath(user.verificationDocumentUrl);
            const isBusy = busyId === user.id;

            return (
              <article key={user.id} className="researcher-card-v2">
                <div className="researcher-card-header">
                  <div className="researcher-card-photo">
                    {proofIsImage && proofUrl ? (
                      <button
                        type="button"
                        className="researcher-photo-button-v2"
                        onClick={() => setLightbox({ url: proofUrl, name: user.fullName })}
                      >
                        <img src={proofUrl} alt={`${user.fullName} verification`} />
                      </button>
                    ) : proofUrl ? (
                      <a href={proofUrl} target="_blank" rel="noreferrer" className="researcher-photo-fallback-v2">
                        Файл харах ↗
                      </a>
                    ) : (
                      <div className="researcher-photo-fallback-v2">Файлгүй</div>
                    )}
                  </div>
                  <div className="researcher-card-title">
                    <h2>{user.fullName}</h2>
                    <p>{user.email}</p>
                    <VerificationBadge status={user.verificationStatus} />
                  </div>
                </div>

                <dl className="researcher-card-body">
                  <div><dt>Байгууллага</dt><dd>{user.organization || "—"}</dd></div>
                  <div><dt>Хэлтэс</dt><dd>{user.departmentName || "—"}</dd></div>
                  <div><dt>Албан тушаал</dt><dd>{user.positionTitle || "—"}</dd></div>
                  <div><dt>Утас</dt><dd>{user.phoneNumber || "—"}</dd></div>
                  <div><dt>Бүртгэгдсэн</dt><dd>{formatDate(user.createdAt)}</dd></div>
                </dl>

                {user.researchFocus && (
                  <p className="researcher-card-focus">
                    <strong>Судалгааны чиглэл:</strong> {user.researchFocus}
                  </p>
                )}

                <footer className="researcher-card-actions">
                  {user.verificationStatus !== "verified" ? (
                    <button
                      type="button"
                      className="dash-action submit"
                      disabled={isBusy}
                      onClick={() => handleVerify(user.id)}
                    >
                      {isBusy ? "..." : "Гар аргаар баталгаажуулах"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="dash-action ghost danger"
                      disabled={isBusy}
                      onClick={() => handleRevoke(user.id)}
                    >
                      Баталгаажуулалт цуцлах
                    </button>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {lightbox && (
        <div
          className="lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
        >
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="lightbox-close" onClick={() => setLightbox(null)}>
              ✕
            </button>
            <img src={lightbox.url} alt={lightbox.name} />
            <p className="lightbox-caption">{lightbox.name}</p>
          </div>
        </div>
      )}
    </Layout>
  );
}
