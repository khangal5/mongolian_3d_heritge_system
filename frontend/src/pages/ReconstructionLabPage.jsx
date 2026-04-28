import { useEffect, useState } from "react";
import { getReconstructionJobs, uploadReconstructionJob } from "../api/client.js";
import { getStoredAuth } from "../auth.js";
import Layout from "../components/Layout.jsx";
import UserSidebar from "../components/UserSidebar.jsx";

const initialForm = {
  title: "",
  description: "",
  captureNotes: ""
};

const STATUS_TONE = {
  queue: "queue",
  processing: "processing",
  completed: "completed",
  failed: "failed"
};

const STATUS_LABEL = {
  queue: "Дараалалд",
  processing: "Боловсруулж буй",
  completed: "Дууссан",
  failed: "Алдаатай"
};

export default function ReconstructionLabPage() {
  const auth = typeof window === "undefined" ? null : getStoredAuth();
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function loadJobs() {
    const data = await getReconstructionJobs();
    setJobs(data.items);
  }

  useEffect(() => {
    loadJobs().catch(() => {
      setError("Туршилтын job-уудыг ачаалж чадсангүй.");
    });
    const intervalId = window.setInterval(() => {
      loadJobs().catch(() => {});
    }, 4000);
    return () => window.clearInterval(intervalId);
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!files.length) {
      setError("Дор хаяж нэг зураг сонгоно уу.");
      return;
    }

    const payload = new FormData();
    payload.set("title", form.title);
    payload.set("description", form.description);
    payload.set("captureNotes", form.captureNotes);
    files.forEach((file) => payload.append("images", file));

    try {
      setStatus("submitting");
      await uploadReconstructionJob(payload);
      setForm(initialForm);
      setFiles([]);
      setStatus("success");
      await loadJobs();
    } catch (submitError) {
      setStatus("error");
      setError(submitError.message);
    }
  }

  function handleFileDrop(event) {
    event.preventDefault();
    setDragOver(false);
    const dropped = Array.from(event.dataTransfer.files || []).filter((f) =>
      /image\/(jpe?g|png)/i.test(f.type)
    );
    if (dropped.length) setFiles((current) => [...current, ...dropped]);
  }

  const counts = {
    queue: jobs.filter((j) => j.status === "queue").length,
    processing: jobs.filter((j) => j.status === "processing").length,
    completed: jobs.filter((j) => j.status === "completed").length
  };

  if (!auth?.user) {
    return (
      <Layout>
        <p className="feedback error" style={{ margin: "40px auto", maxWidth: 720 }}>
          Энэ хуудсыг үзэхийн тулд эхлээд нэвтэрнэ үү.
        </p>
      </Layout>
    );
  }

  return (
    <Layout sidebar={<UserSidebar user={auth.user} />}>
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Reconstruction Lab</h1>
          <p className="dash-sub">Олон зурагнаас 3D загвар үүсгэхэд зориулсан зургийн багц байршуулж, чанарын автомат шалгалт хийнэ.</p>
        </div>
      </header>

      <section className="dash-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="dash-stat tone-amber">
          <span className="dash-stat-label">Дараалалд (QUEUE)</span>
          <span className="dash-stat-value">{counts.queue}</span>
        </div>
        <div className="dash-stat tone-blue">
          <span className="dash-stat-label">Боловсруулагдаж буй</span>
          <span className="dash-stat-value">{counts.processing}</span>
        </div>
        <div className="dash-stat tone-green">
          <span className="dash-stat-label">Дууссан</span>
          <span className="dash-stat-value">{counts.completed}</span>
        </div>
      </section>

      <section className="form-section">
        <header className="form-section-header">
          <span className="form-section-number">1</span>
          <div>
            <h2>Шинэ зургийн багц илгээх</h2>
            <p>Олон өнцгөөс авсан зураг бүхий багцыг оруулна.</p>
          </div>
        </header>

        <div className="form-section-body">
          <div className="field">
            <label htmlFor="title">Багцын нэр</label>
            <input
              id="title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Жишээ: Буган хөшөө · Аршаан-1"
            />
          </div>
          <div className="field">
            <label htmlFor="description">Тайлбар</label>
            <input
              id="description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Зураг авсан объектын товч тайлбар"
            />
          </div>
          <div className="field af-full">
            <label htmlFor="captureNotes">Зураг авалтын тэмдэглэл</label>
            <textarea
              id="captureNotes"
              value={form.captureNotes}
              onChange={(event) =>
                setForm((current) => ({ ...current, captureNotes: event.target.value }))
              }
              rows="3"
              placeholder="Камерын өнцөг 30° интервал. Үд дунд, тэнгэр цэлмэг..."
            />
          </div>

          <div
            className={`drop-zone af-full ${dragOver ? "is-over" : ""} ${files.length ? "has-file" : ""}`}
            onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
          >
            <input
              id="images"
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
              hidden
            />
            <label htmlFor="images" className="drop-zone-label">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {files.length ? (
                <>
                  <strong>{files.length} зураг сонгогдсон</strong>
                  <span>Дахин чирч оруулах эсвэл сонгох товч дарна</span>
                </>
              ) : (
                <>
                  <strong>JPG/PNG зургуудаа чирч оруул эсвэл сонго</strong>
                  <span>Олон зураг сонгож болно · файл тус бүр 15MB хүртэл</span>
                </>
              )}
            </label>
          </div>

          {files.length > 0 && (
            <div className="af-full uploaded-file-row">
              {files.slice(0, 6).map((file) => (
                <span key={`${file.name}-${file.size}`} className="uploaded-file-pill">{file.name}</span>
              ))}
              {files.length > 6 && (
                <span className="uploaded-file-pill">… +{files.length - 6} файл</span>
              )}
            </div>
          )}

          {error && <p className="feedback error af-full">{error}</p>}
          {status === "success" && <p className="feedback af-full">Туршилтын job амжилттай үүслээ.</p>}

          <div className="af-full artifact-form-actions">
            <button
              type="button"
              className="dash-action submit"
              onClick={handleSubmit}
              disabled={status === "submitting"}
            >
              {status === "submitting" ? "Илгээж байна..." : "Илгээж шалгуулах"}
            </button>
          </div>
        </div>
      </section>

      <section className="form-section">
        <header className="form-section-header">
          <span className="form-section-number">2</span>
          <div>
            <h2>Сүүлийн ажилтууд</h2>
            <p>Чанарын автомат шалгалтын явц, тайлан.</p>
          </div>
        </header>

        <div style={{ padding: "0 26px 24px" }}>
          {jobs.length === 0 && <p className="feedback">Одоогоор ажилтуудын мэдээ алга.</p>}

          {jobs.length > 0 && (
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Багц</th>
                  <th>Төлөв</th>
                  <th>Зураг</th>
                  <th>Чанарын тайлан</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const findingsEntry = [...job.processingLog]
                    .reverse()
                    .find((entry) => entry.findings);
                  const findings = findingsEntry?.findings;
                  const tone = STATUS_TONE[job.status] || "queue";
                  return (
                    <tr key={job.id}>
                      <td>
                        <strong>{job.photoSet.title}</strong>
                        <div className="dash-muted">{new Date(job.createdAt || Date.now()).toLocaleString("mn-MN")}</div>
                      </td>
                      <td>
                        <span className={`recon-badge tone-${tone}`}>
                          {STATUS_LABEL[job.status] || job.status}
                        </span>
                        <div className="recon-progress">
                          <div style={{ width: `${job.progressPercent}%` }} />
                        </div>
                      </td>
                      <td>{job.photoSet.imageCount}</td>
                      <td>
                        {findings ? (
                          <>
                            <div className="recon-quality-row">
                              <span><strong>{findings.okCount}/{findings.total}</strong> OK</span>
                              <span>Дундаж <strong>{findings.avgMegapixels}MP</strong></span>
                            </div>
                            {(findings.issues.blurry +
                              findings.issues.dark +
                              findings.issues.overexposed +
                              findings.issues.lowRes +
                              findings.issues.unread > 0) && (
                              <div className="recon-issue-row">
                                {findings.issues.blurry > 0 && <span className="recon-issue">{findings.issues.blurry} blur</span>}
                                {findings.issues.dark > 0 && <span className="recon-issue">{findings.issues.dark} харанхуй</span>}
                                {findings.issues.overexposed > 0 && <span className="recon-issue">{findings.issues.overexposed} цайвар</span>}
                                {findings.issues.lowRes > 0 && <span className="recon-issue">{findings.issues.lowRes} нягтрал бага</span>}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="dash-muted">Хүлээгдэж байна</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </Layout>
  );
}
