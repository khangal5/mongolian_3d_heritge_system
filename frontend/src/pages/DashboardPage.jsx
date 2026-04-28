import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  deleteArtifactRequest,
  getCurrentUser,
  getMyArtifacts,
  resendVerificationEmail,
  revertArtifact,
  submitArtifact
} from "../api/client.js";
import { clearStoredAuth, getStoredAuth, updateStoredUser } from "../auth.js";
import Layout from "../components/Layout.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const STATUS_ORDER = ["NEW", "PENDING", "APPROVED", "REJECTED"];

function countByStatus(items) {
  return items.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    { NEW: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 }
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(() =>
    typeof window === "undefined" ? null : getStoredAuth()
  );
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [busySlug, setBusySlug] = useState(null);
  const [resendStatus, setResendStatus] = useState("idle");
  const [resendMessage, setResendMessage] = useState("");

  async function handleResend() {
    setResendStatus("loading");
    setResendMessage("");
    try {
      const response = await resendVerificationEmail();
      setResendStatus("success");
      setResendMessage(response.message || "Шинэ холбоос илгээгдлээ");
    } catch (requestError) {
      setResendStatus("error");
      setResendMessage(requestError.message);
      try {
        const { user } = await getCurrentUser();
        const next = updateStoredUser(user);
        if (next) {
          setAuth(next);
        }
      } catch {
        // ignore
      }
    }
  }

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const data = await getMyArtifacts();
      setItems(data.items);
      setStatus("success");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("error");
    }
  }, []);

  const initialAuth = auth;
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (!initialAuth?.user) {
      navigate("/login", { replace: true });
      return;
    }
    if (initialAuth.user.role !== "researcher" && initialAuth.user.role !== "admin") {
      navigate("/", { replace: true });
      return;
    }
    if (bootstrappedRef.current) {
      return;
    }
    bootstrappedRef.current = true;
    refresh();
    getCurrentUser()
      .then(({ user }) => {
        const next = updateStoredUser(user);
        if (next) {
          setAuth(next);
        }
      })
      .catch(() => {
        clearStoredAuth();
        navigate("/login", { replace: true });
      });
  }, [initialAuth, navigate, refresh]);

  async function handleSubmit(slug) {
    setBusySlug(slug);
    setError("");
    try {
      await submitArtifact(slug);
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusySlug(null);
    }
  }

  async function handleRevertAndEdit(slug) {
    setBusySlug(slug);
    setError("");
    try {
      await revertArtifact(slug);
      navigate(`/artifacts/${slug}/edit`);
    } catch (requestError) {
      setError(requestError.message);
      setBusySlug(null);
    }
  }

  async function handleDelete(slug) {
    const confirmed = window.confirm(
      "Энэ олдворыг устгахдаа итгэлтэй байна уу? Үйлдлийг буцаах боломжгүй."
    );
    if (!confirmed) {
      return;
    }
    setBusySlug(slug);
    setError("");
    try {
      await deleteArtifactRequest(slug);
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusySlug(null);
    }
  }

  if (!auth?.user) {
    return null;
  }

  const counts = countByStatus(items);
  const isUnverified =
    auth.user.role === "researcher" && auth.user.verificationStatus !== "verified";

  return (
    <Layout>
      <section className="hero hero-compact">
        <div className="hero-copy">
          <p className="eyebrow">Судлаачийн самбар</p>
          <h1>Миний олдворууд</h1>
          <p className="hero-text">
            Бүртгэсэн дурсгалаа төлвөөр нь хянаж, шалгуулахаар илгээ.
          </p>
        </div>
      </section>

      {isUnverified && (
        <section className="info-card verification-banner">
          <div>
            <strong>Имэйл хараахан баталгаажаагүй байна.</strong>
            <p className="field-help">
              Албан имэйл рүү илгээсэн холбоосыг дарж имэйлээ баталгаажуулах хүртэл шинэ
              олдвор бүртгэх боломжгүй. Холбоос ирээгүй бол доорх товчоор дахин илгээ.
            </p>
            {resendStatus === "success" && <p className="feedback">{resendMessage}</p>}
            {resendStatus === "error" && <p className="feedback error">{resendMessage}</p>}
          </div>
          <button
            type="button"
            className="action-button compact"
            onClick={handleResend}
            disabled={resendStatus === "loading"}
          >
            {resendStatus === "loading" ? "Илгээж байна..." : "Холбоос дахин илгээх"}
          </button>
        </section>
      )}

      <section className="dashboard-stats">
        {STATUS_ORDER.map((value) => (
          <div key={value} className="dashboard-stat">
            <span className="dashboard-stat-label">
              <StatusBadge status={value} />
            </span>
            <span className="dashboard-stat-value">{counts[value] || 0}</span>
          </div>
        ))}
      </section>

      <div className="dashboard-actions">
        {isUnverified ? (
          <span className="action-button is-disabled" aria-disabled="true">
            + Шинэ олдвор бүртгэх (имэйл баталгаажуулсны дараа)
          </span>
        ) : (
          <Link to="/artifacts/new" className="action-button">
            + Шинэ олдвор бүртгэх
          </Link>
        )}
      </div>

      {status === "loading" && <p className="feedback">Олдворуудыг ачаалж байна...</p>}
      {status === "error" && <p className="feedback error">{error || "Алдаа гарлаа."}</p>}

      {status === "success" && items.length === 0 && (
        <section className="empty-state">
          <h2>Та одоогоор бүртгэсэн олдворгүй байна</h2>
          <p>"+ Шинэ олдвор бүртгэх" товчоор эхний бүртгэлээ үүсгээрэй.</p>
        </section>
      )}

      {status === "success" && items.length > 0 && (
        <section className="info-card dashboard-table">
          <table className="dashboard-grid">
            <thead>
              <tr>
                <th>Олдвор</th>
                <th>Ангилал</th>
                <th>Төлөв</th>
                <th>Тэмдэглэл</th>
                <th>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isBusy = busySlug === item.slug;
                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.nameMn || item.name}</strong>
                      <div className="muted">{item.province} · {item.location}</div>
                    </td>
                    <td>{item.category}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="muted">
                      {item.status === "REJECTED" && item.reviewNote ? (
                        <span>Татгалзсан шалтгаан: {item.reviewNote}</span>
                      ) : item.status === "APPROVED" && item.reviewedAt ? (
                        <span>Баталгаажсан: {new Date(item.reviewedAt).toLocaleDateString("mn-MN")}</span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td>
                      <div className="dashboard-row-actions">
                        <Link to={`/artifacts/${item.slug}`} className="ghost-button">
                          Үзэх
                        </Link>
                        {item.status === "NEW" && (
                          <>
                            <Link
                              to={`/artifacts/${item.slug}/edit`}
                              className="ghost-button"
                            >
                              Засах
                            </Link>
                            <button
                              type="button"
                              className="action-button compact"
                              disabled={isBusy}
                              onClick={() => handleSubmit(item.slug)}
                            >
                              {isBusy ? "Илгээж байна..." : "Илгээх"}
                            </button>
                            <button
                              type="button"
                              className="ghost-button danger"
                              disabled={isBusy}
                              onClick={() => handleDelete(item.slug)}
                            >
                              Устгах
                            </button>
                          </>
                        )}
                        {item.status === "REJECTED" && (
                          <button
                            type="button"
                            className="action-button compact"
                            disabled={isBusy}
                            onClick={() => handleRevertAndEdit(item.slug)}
                          >
                            {isBusy ? "..." : "Засаж дахин илгээх"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </Layout>
  );
}