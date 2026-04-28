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
    return new Date(value).toLocaleString("mn-MN");
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
  const [expandedId, setExpandedId] = useState(null);

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
    if (bootstrappedRef.current) {
      return;
    }
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

  if (!auth?.user) {
    return null;
  }

  return (
    <Layout>
      <section className="hero hero-compact">
        <div className="hero-copy">
          <p className="eyebrow">Админ самбар</p>
          <h1>Судлаачдын бүртгэл</h1>
          <p className="hero-text">
            Бүртгэгдсэн судлаачдын мэдээлэл, үнэмлэхний зураг ба имэйл баталгаажуулалтын
            төлөв.
          </p>
        </div>
      </section>

      {status === "loading" && <p className="feedback">Жагсаалт ачаалж байна...</p>}
      {error && <p className="feedback error">{error}</p>}

      {status === "success" && items.length === 0 && (
        <section className="empty-state">
          <h2>Бүртгэлтэй судлаач алга</h2>
          <p>Хэн ч судлаачаар бүртгүүлээгүй байна.</p>
        </section>
      )}

      {status === "success" && items.length > 0 && (
        <section className="researcher-list">
          {items.map((user) => {
            const proofUrl = buildUploadUrl(user.verificationDocumentUrl);
            const proofIsImage = isImagePath(user.verificationDocumentUrl);
            const isBusy = busyId === user.id;
            const isExpanded = expandedId === user.id;
            const verifications = user.verifications || [];
            const activePending = verifications.find(
              (v) => !v.consumedAt && new Date(v.expiresAt) > new Date()
            );

            return (
              <article key={user.id} className="researcher-card">
                <div className="researcher-card-main">
                  <div className="researcher-photo-shell">
                    {proofIsImage && proofUrl ? (
                      <button
                        type="button"
                        className="researcher-photo-button"
                        onClick={() => setLightbox({ url: proofUrl, name: user.fullName })}
                      >
                        <img
                          src={proofUrl}
                          alt={`${user.fullName} verification`}
                          className="researcher-photo"
                        />
                        <span className="researcher-photo-hint">Томоор үзэх</span>
                      </button>
                    ) : proofUrl ? (
                      <a
                        href={proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="researcher-photo-fallback"
                      >
                        Файл нээх ↗
                      </a>
                    ) : (
                      <div className="researcher-photo-fallback">Файлгүй</div>
                    )}
                  </div>

                  <div className="researcher-info">
                    <header className="researcher-info-header">
                      <h2>{user.fullName}</h2>
                      <VerificationBadge status={user.verificationStatus} />
                    </header>
                    <ul className="researcher-info-grid">
                      <li><span>Имэйл</span><strong>{user.email}</strong></li>
                      <li><span>Байгууллага</span><strong>{user.organization || "—"}</strong></li>
                      <li><span>Хэлтэс</span><strong>{user.departmentName || "—"}</strong></li>
                      <li><span>Албан тушаал</span><strong>{user.positionTitle || "—"}</strong></li>
                      <li><span>Утас</span><strong>{user.phoneNumber || "—"}</strong></li>
                      <li><span>Ажилтны код</span><strong>{user.employeeCode || "—"}</strong></li>
                      <li><span>Бүртгэгдсэн</span><strong>{formatDate(user.createdAt)}</strong></li>
                      <li><span>Үнэмлэхний файл</span><strong>{user.verificationDocumentName || "—"}</strong></li>
                    </ul>
                    {user.researchFocus && (
                      <p className="researcher-focus">
                        <span>Судалгааны чиглэл:</span> {user.researchFocus}
                      </p>
                    )}

                    <div className="researcher-actions">
                      {user.verificationStatus !== "verified" && (
                        <button
                          type="button"
                          className="action-button compact"
                          disabled={isBusy}
                          onClick={() => handleVerify(user.id)}
                        >
                          {isBusy ? "..." : "Гар аргаар баталгаажуулах"}
                        </button>
                      )}
                      {user.verificationStatus === "verified" && (
                        <button
                          type="button"
                          className="ghost-button danger"
                          disabled={isBusy}
                          onClick={() => handleRevoke(user.id)}
                        >
                          Баталгаажуулалт цуцлах
                        </button>
                      )}
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => setExpandedId(isExpanded ? null : user.id)}
                      >
                        {isExpanded ? "Имэйл токенуудыг хаах" : `Имэйл токенуудыг харах (${verifications.length})`}
                      </button>
                    </div>
                  </div>
                </div>

                {activePending && !isExpanded && (
                  <div className="researcher-pending-hint">
                    Идэвхтэй token байгаа: дуусах хугацаа {formatDate(activePending.expiresAt)}
                  </div>
                )}

                {isExpanded && verifications.length > 0 && (
                  <div className="researcher-tokens">
                    <h3>email_verifications</h3>
                    <table className="dashboard-grid">
                      <thead>
                        <tr>
                          <th>Имэйл</th>
                          <th>Үүсгэсэн</th>
                          <th>Дуусах</th>
                          <th>Ашигласан</th>
                          <th>Төлөв</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verifications.map((v) => {
                          const expired = new Date(v.expiresAt) < new Date();
                          const tokenStatus = v.consumedAt
                            ? "Ашигласан"
                            : expired
                              ? "Хугацаа дууссан"
                              : "Идэвхтэй";
                          return (
                            <tr key={v.id}>
                              <td>{v.email}</td>
                              <td className="muted">{formatDate(v.createdAt)}</td>
                              <td className="muted">{formatDate(v.expiresAt)}</td>
                              <td className="muted">{formatDate(v.consumedAt)}</td>
                              <td>{tokenStatus}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {isExpanded && verifications.length === 0 && (
                  <p className="muted" style={{ paddingLeft: 16 }}>Token бичлэг алга.</p>
                )}
              </article>
            );
          })}
        </section>
      )}

      {lightbox && (
        <div
          className="lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
        >
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close"
              onClick={() => setLightbox(null)}
            >
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