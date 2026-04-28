import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  approveArtifact,
  getAdminQueue,
  rejectArtifact
} from "../api/client.js";
import { getStoredAuth } from "../auth.js";
import Layout from "../components/Layout.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const TABS = [
  { value: "PENDING", label: "Хүлээгдэж буй" },
  { value: "APPROVED", label: "Баталгаажсан" },
  { value: "REJECTED", label: "Татгалзсан" },
  { value: "NEW", label: "Шинэ" }
];

export default function AdminQueuePage() {
  const navigate = useNavigate();
  const [auth] = useState(() =>
    typeof window === "undefined" ? null : getStoredAuth()
  );
  const [activeTab, setActiveTab] = useState("PENDING");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [busySlug, setBusySlug] = useState(null);
  const [rejectingSlug, setRejectingSlug] = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  const refresh = useCallback(
    async (tab) => {
      setStatus("loading");
      setError("");
      try {
        const data = await getAdminQueue(tab);
        setItems(data.items);
        setStatus("success");
      } catch (requestError) {
        setError(requestError.message);
        setStatus("error");
      }
    },
    []
  );

  useEffect(() => {
    if (!auth?.user) {
      navigate("/login", { replace: true });
      return;
    }
    if (auth.user.role !== "admin") {
      navigate("/", { replace: true });
      return;
    }
    refresh(activeTab);
  }, [auth, navigate, refresh, activeTab]);

  async function handleApprove(slug) {
    setBusySlug(slug);
    setError("");
    try {
      await approveArtifact(slug);
      await refresh(activeTab);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusySlug(null);
    }
  }

  function startReject(slug) {
    setRejectingSlug(slug);
    setRejectNote("");
  }

  function cancelReject() {
    setRejectingSlug(null);
    setRejectNote("");
  }

  async function confirmReject() {
    if (!rejectNote.trim()) {
      setError("Татгалзах шалтгаан тэмдэглэгээ заавал шаардлагатай");
      return;
    }
    setBusySlug(rejectingSlug);
    setError("");
    try {
      await rejectArtifact(rejectingSlug, rejectNote.trim());
      cancelReject();
      await refresh(activeTab);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusySlug(null);
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
          <h1>Олдворын баталгаажуулалт</h1>
          <p className="hero-text">
            Судлаачдын илгээсэн өвийн мэдээллийг шалгаж, баталгаажуулах эсвэл татгалзах.
          </p>
        </div>
      </section>

      <div className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`admin-tab ${activeTab === tab.value ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {status === "loading" && <p className="feedback">Жагсаалт ачаалж байна...</p>}
      {status === "error" && <p className="feedback error">{error || "Алдаа гарлаа."}</p>}
      {error && status !== "error" && <p className="feedback error">{error}</p>}

      {status === "success" && items.length === 0 && (
        <section className="empty-state">
          <h2>Энэ төлөвт олдвор алга</h2>
          <p>Бусад төлөвүүдийг сонгож харна уу.</p>
        </section>
      )}

      {status === "success" && items.length > 0 && (
        <section className="info-card dashboard-table">
          <table className="dashboard-grid">
            <thead>
              <tr>
                <th>Олдвор</th>
                <th>Ангилал</th>
                <th>Үе</th>
                <th>Төлөв</th>
                <th>Тэмдэглэл</th>
                <th>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isBusy = busySlug === item.slug;
                const isRejecting = rejectingSlug === item.slug;
                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.nameMn || item.name}</strong>
                      <div className="muted">{item.province} · {item.location}</div>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.period}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="muted">
                      {item.reviewNote ? <span>{item.reviewNote}</span> : <span>—</span>}
                    </td>
                    <td>
                      <div className="dashboard-row-actions">
                        <Link to={`/artifacts/${item.slug}`} className="ghost-button">
                          Үзэх
                        </Link>
                        {activeTab === "PENDING" && !isRejecting && (
                          <>
                            <button
                              type="button"
                              className="action-button compact"
                              disabled={isBusy}
                              onClick={() => handleApprove(item.slug)}
                            >
                              {isBusy ? "..." : "Баталгаажуулах"}
                            </button>
                            <button
                              type="button"
                              className="ghost-button danger"
                              disabled={isBusy}
                              onClick={() => startReject(item.slug)}
                            >
                              Татгалзах
                            </button>
                          </>
                        )}
                        {isRejecting && (
                          <div className="reject-form">
                            <textarea
                              rows="2"
                              placeholder="Татгалзах шалтгаан..."
                              value={rejectNote}
                              onChange={(event) => setRejectNote(event.target.value)}
                            />
                            <div className="reject-form-actions">
                              <button
                                type="button"
                                className="action-button compact danger"
                                disabled={isBusy}
                                onClick={confirmReject}
                              >
                                {isBusy ? "..." : "Баталгаажуулах татгалзал"}
                              </button>
                              <button
                                type="button"
                                className="ghost-button"
                                onClick={cancelReject}
                                disabled={isBusy}
                              >
                                Болих
                              </button>
                            </div>
                          </div>
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