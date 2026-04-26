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
import UserSidebar from "../components/UserSidebar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const STATUS_META = [
  { value: "NEW", label: "Шинэ (NEW)", tone: "blue" },
  { value: "PENDING", label: "Хүлээгдэж буй (PENDING)", tone: "amber" },
  { value: "APPROVED", label: "Баталгаажсан (APPROVED)", tone: "green" },
  { value: "REJECTED", label: "Татгалзсан (REJECTED)", tone: "red" }
];

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
  const [filterStatus, setFilterStatus] = useState("ALL");
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

  const filtered = filterStatus === "ALL"
    ? items
    : items.filter((item) => item.status === filterStatus);

  return (
    <Layout sidebar={<UserSidebar user={auth.user} />}>
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Миний олдворууд</h1>
          <p className="dash-sub">Бүртгэсэн дурсгалаа төлвөөр нь хянаж, шалгуулахаар илгээгээрэй.</p>
        </div>
        {isUnverified ? (
          <span className="action-button is-disabled" aria-disabled="true">
            + Шинэ олдвор
          </span>
        ) : (
          <Link to="/artifacts/new" className="dash-new-button">
            + Шинэ олдвор
          </Link>
        )}
      </header>

      {isUnverified && (
        <section className="dash-banner">
          <div>
            <strong>Имэйл хараахан баталгаажаагүй байна.</strong>
            <p>
              Албан имэйл рүү илгээсэн холбоосыг дарж имэйлээ баталгаажуулах хүртэл шинэ
              олдвор бүртгэх боломжгүй.
            </p>
            {resendStatus === "success" && <p className="feedback">{resendMessage}</p>}
            {resendStatus === "error" && <p className="feedback error">{resendMessage}</p>}
          </div>
          <button
            type="button"
            className="dash-banner-button"
            onClick={handleResend}
            disabled={resendStatus === "loading"}
          >
            {resendStatus === "loading" ? "Илгээж байна..." : "Холбоос дахин илгээх"}
          </button>
        </section>
      )}

      <section className="dash-stats">
        <button
          type="button"
          className={`dash-stat ${filterStatus === "ALL" ? "is-active" : ""}`}
          onClick={() => setFilterStatus("ALL")}
        >
          <span className="dash-stat-label">Нийт</span>
          <span className="dash-stat-value">{items.length}</span>
        </button>
        {STATUS_META.map((meta) => (
          <button
            key={meta.value}
            type="button"
            className={`dash-stat tone-${meta.tone} ${filterStatus === meta.value ? "is-active" : ""}`}
            onClick={() => setFilterStatus(meta.value)}
          >
            <span className="dash-stat-label">{meta.label}</span>
            <span className="dash-stat-value">{counts[meta.value] || 0}</span>
          </button>
        ))}
      </section>

      {status === "loading" && <p className="feedback">Олдворуудыг ачаалж байна...</p>}
      {error && <p className="feedback error">{error}</p>}

      {status === "success" && items.length === 0 && (
        <section className="empty-state">
          <h2>Та одоогоор бүртгэсэн олдворгүй байна</h2>
          <p>“+ Шинэ олдвор” товчоор эхний бүртгэлээ үүсгээрэй.</p>
        </section>
      )}

      {status === "success" && items.length > 0 && (
        <section className="dash-table-card">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Олдвор</th>
                <th>Ангилал</th>
                <th>Огноо</th>
                <th>Төлөв</th>
                <th>Тэмдэглэл</th>
                <th>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const isBusy = busySlug === item.slug;
                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.nameMn || item.name}</strong>
                      <div className="dash-muted">{item.province}</div>
                    </td>
                    <td>{item.category}</td>
                    <td className="dash-muted">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("mn-MN")
                        : "—"}
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="dash-muted">
                      {item.status === "REJECTED" && item.reviewNote ? (
                        <span>{item.reviewNote}</span>
                      ) : item.status === "APPROVED" && item.reviewedAt ? (
                        <span>Баталгаажсан: {new Date(item.reviewedAt).toLocaleDateString("mn-MN")}</span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td>
                      <div className="dash-row-actions">
                        <Link to={`/artifacts/${item.slug}`} className="dash-action ghost" title="Үзэх" aria-label="Үзэх">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </Link>
                        {item.status === "NEW" && (
                          <>
                            <Link to={`/artifacts/${item.slug}/edit`} className="dash-action ghost" title="Засах" aria-label="Засах">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </Link>
                            <button
                              type="button"
                              className="dash-action submit"
                              disabled={isBusy}
                              onClick={() => handleSubmit(item.slug)}
                            >
                              {isBusy ? "..." : "Илгээх"}
                            </button>
                            <button
                              type="button"
                              className="dash-action ghost danger"
                              disabled={isBusy}
                              onClick={() => handleDelete(item.slug)}
                              title="Устгах"
                              aria-label="Устгах"
                            >
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                        {item.status === "REJECTED" && (
                          <button
                            type="button"
                            className="dash-action submit"
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
