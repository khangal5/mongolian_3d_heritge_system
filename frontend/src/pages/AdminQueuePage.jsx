import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  approveArtifact,
  getAdminQueue,
  rejectArtifact
} from "../api/client.js";
import { getStoredAuth } from "../auth.js";
import Layout from "../components/Layout.jsx";
import UserSidebar from "../components/UserSidebar.jsx";
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
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const refresh = useCallback(
    async (tab) => {
      setStatus("loading");
      setError("");
      try {
        const data = await getAdminQueue(tab);
        setItems(data.items);
        setStatus("success");
        if (data.items.length > 0) {
          setSelectedSlug(data.items[0].slug);
        } else {
          setSelectedSlug(null);
        }
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
    setRejectMode(false);
    setRejectNote("");
  }, [auth, navigate, refresh, activeTab]);

  const selected = useMemo(
    () => items.find((item) => item.slug === selectedSlug) || null,
    [items, selectedSlug]
  );

  async function handleApprove() {
    if (!selected) return;
    setBusySlug(selected.slug);
    setError("");
    try {
      await approveArtifact(selected.slug);
      await refresh(activeTab);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusySlug(null);
    }
  }

  function startReject() {
    setRejectMode(true);
    setRejectNote("");
    setError("");
  }

  function cancelReject() {
    setRejectMode(false);
    setRejectNote("");
  }

  async function confirmReject() {
    if (!selected) return;
    if (!rejectNote.trim()) {
      setError("Татгалзах шалтгаан тэмдэглэгээ заавал шаардлагатай");
      return;
    }
    setBusySlug(selected.slug);
    setError("");
    try {
      await rejectArtifact(selected.slug, rejectNote.trim());
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
    <Layout sidebar={<UserSidebar user={auth.user} />}>
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Олдворын баталгаажуулалт</h1>
          <p className="dash-sub">Илгээгдсэн олдворуудыг шалгаж, нийтлэх эсэх шийдвэрийг гаргана.</p>
        </div>
      </header>

      <div className="admin-tab-row">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`admin-tab-pill ${activeTab === tab.value ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {status === "loading" && <p className="feedback">Жагсаалт ачаалж байна...</p>}

      {status === "success" && items.length === 0 && (
        <section className="empty-state">
          <h2>Энэ төлөвт олдвор алга</h2>
          <p>Бусад төлөвүүдийг сонгож харна уу.</p>
        </section>
      )}

      {status === "success" && items.length > 0 && (
        <div className="admin-split">
          <aside className="admin-list">
            <div className="admin-list-header">
              <span>{items.length} олдвор</span>
            </div>
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`admin-list-item ${selectedSlug === item.slug ? "is-active" : ""}`}
                    onClick={() => {
                      setSelectedSlug(item.slug);
                      setRejectMode(false);
                      setError("");
                    }}
                  >
                    <div className="admin-list-name">{item.nameMn || item.name}</div>
                    <div className="admin-list-meta">
                      <span>{item.province}</span>
                      <StatusBadge status={item.status} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className="admin-detail">
            {selected ? (
              <>
                <div className="admin-detail-header">
                  <div>
                    <h2>{selected.nameMn || selected.name}</h2>
                    <p className="admin-detail-sub">
                      {selected.province} · {selected.location} · {selected.category} · {selected.period}
                    </p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                {selected.imageUrl && (
                  <div className="admin-detail-media">
                    <img src={selected.imageUrl} alt={selected.name} />
                  </div>
                )}

                <div className="admin-detail-grid">
                  <div>
                    <span className="admin-detail-label">Товч тайлбар</span>
                    <p>{selected.shortDescription}</p>
                  </div>
                  <div>
                    <span className="admin-detail-label">Дэлгэрэнгүй</span>
                    <p>{selected.description}</p>
                  </div>
                  {selected.coordinates && (
                    <div>
                      <span className="admin-detail-label">Координат</span>
                      <p>{selected.coordinates.lat?.toFixed?.(5)}, {selected.coordinates.lng?.toFixed?.(5)}</p>
                    </div>
                  )}
                  {selected.reviewNote && (
                    <div>
                      <span className="admin-detail-label">Тэмдэглэл</span>
                      <p>{selected.reviewNote}</p>
                    </div>
                  )}
                </div>

                {error && <p className="feedback error">{error}</p>}

                {activeTab === "PENDING" && (
                  <div className="admin-detail-actions">
                    {!rejectMode ? (
                      <>
                        <Link to={`/artifacts/${selected.slug}`} className="dash-action ghost">
                          Бүтэн дэлгэрэнгүй
                        </Link>
                        <Link to={`/artifacts/${selected.slug}/edit`} className="dash-action ghost">
                          Засах · 3D нэмэх
                        </Link>
                        <button
                          type="button"
                          className="admin-action approve"
                          disabled={busySlug === selected.slug}
                          onClick={handleApprove}
                        >
                          {busySlug === selected.slug ? "..." : "Баталгаажуулах"}
                        </button>
                        <button
                          type="button"
                          className="admin-action reject"
                          disabled={busySlug === selected.slug}
                          onClick={startReject}
                        >
                          Татгалзах
                        </button>
                      </>
                    ) : (
                      <div className="admin-reject-form">
                        <label htmlFor="rejectNote">Татгалзах шалтгаан *</label>
                        <textarea
                          id="rejectNote"
                          rows="3"
                          value={rejectNote}
                          onChange={(event) => setRejectNote(event.target.value)}
                          placeholder="Жишээ: 3D загвар бага нягтралтай байна. Дахин boловсруулна уу."
                        />
                        <div className="admin-reject-form-actions">
                          <button
                            type="button"
                            className="admin-action reject"
                            disabled={busySlug === selected.slug}
                            onClick={confirmReject}
                          >
                            {busySlug === selected.slug ? "..." : "Татгалзалыг илгээх"}
                          </button>
                          <button
                            type="button"
                            className="dash-action ghost"
                            onClick={cancelReject}
                            disabled={busySlug === selected.slug}
                          >
                            Болих
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab !== "PENDING" && (
                  <div className="admin-detail-actions">
                    <Link to={`/artifacts/${selected.slug}`} className="dash-action ghost">
                      Бүтэн дэлгэрэнгүй
                    </Link>
                    <Link to={`/artifacts/${selected.slug}/edit`} className="dash-action ghost">
                      Засах
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <p className="feedback">Жагсаалтаас сонгоно уу.</p>
            )}
          </section>
        </div>
      )}
    </Layout>
  );
}
