import { useEffect, useState } from "react";
import { getReconstructionJobs, uploadReconstructionJob } from "../api/client.js";
import Layout from "../components/Layout.jsx";

const initialForm = {
  title: "",
  description: "",
  captureNotes: ""
};

export default function ReconstructionLabPage() {
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

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

    return () => {
      window.clearInterval(intervalId);
    };
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

    files.forEach((file) => {
      payload.append("images", file);
    });

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

  return (
    <Layout>
      <section className="hero hero-compact">
        <div className="hero-copy">
          <p className="eyebrow">Фотограмметрийн лаборатори</p>
          <h1>Олон зурагнаас 3D reconstruction pipeline-ийг туршина.</h1>
          <p className="hero-text">
            Энэ модуль нь олон зураг upload хийж, photogrammetry engine-д холбохоос
            өмнөх өгөгдөл цуглуулах, job tracking, туршилтын урсгалыг шалгах
            зориулалттай.
          </p>
        </div>

        <div className="hero-panel">
          <div className="stat-card">
            <span>Туршилтын зорилго</span>
            <strong>Upload, queue, processing, тайлан</strong>
          </div>
          <div className="stat-card">
            <span>Одоогийн engine</span>
            <strong>Placeholder photogrammetry worker</strong>
          </div>
        </div>
      </section>

      <section className="lab-grid">
        <form className="info-card upload-form" onSubmit={handleSubmit}>
          <h2>Зургийн багц илгээх</h2>
          <div className="field">
            <label htmlFor="title">Багцын нэр</label>
            <input
              id="title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Жишээ: Буган хөшөө 01"
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
          <div className="field">
            <label htmlFor="captureNotes">Зураг авалтын тэмдэглэл</label>
            <textarea
              id="captureNotes"
              value={form.captureNotes}
              onChange={(event) =>
                setForm((current) => ({ ...current, captureNotes: event.target.value }))
              }
              rows="4"
              placeholder="Камерын өнцөг, гэрэл, орчны нөхцөл, нийт кадрын тоо"
            />
          </div>
          <div className="field">
            <label htmlFor="images">Зургууд</label>
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
            />
            <p className="field-help">JPG, PNG зурагнуудыг олон ширхгээр сонгож болно.</p>
          </div>

          <div className="selected-files">
            {files.length ? (
              files.map((file) => <span key={`${file.name}-${file.size}`}>{file.name}</span>)
            ) : (
              <span>Одоогоор зураг сонгогдоогүй байна.</span>
            )}
          </div>

          {error && <p className="feedback error">{error}</p>}
          {status === "success" && <p className="feedback">Туршилтын job амжилттай үүслээ.</p>}

          <button type="submit" className="action-button" disabled={status === "submitting"}>
            {status === "submitting" ? "Илгээж байна..." : "Туршилт эхлүүлэх"}
          </button>
        </form>

        <section className="info-card">
          <h2>Pipeline тайлбар</h2>
          <ul className="detail-list">
            <li>Олон зураг backend рүү upload хийгдэнэ.</li>
            <li>Photo set, images, reconstruction job PostgreSQL дээр хадгалагдана.</li>
            <li>Worker нь feature matching, dense reconstruction гэсэн шат дамжина.</li>
            <li>Одоогийн хувилбар бодит mesh үүсгэхгүй, харин чанарын тайлан гаргана.</li>
            <li>Дараа нь COLMAP, Meshroom, OpenMVG/OpenMVS холбоход бэлэн бүтэцтэй.</li>
          </ul>
        </section>
      </section>

      <section className="job-list">
        <h2>Reconstruction job-ууд</h2>
        <div className="job-cards">
          {jobs.map((job) => {
            const findingsEntry = [...job.processingLog]
              .reverse()
              .find((entry) => entry.findings);
            const findings = findingsEntry?.findings;

            return (
              <article className="job-card" key={job.id}>
                <div className="artifact-meta-row">
                  <span>{job.photoSet.title}</span>
                  <span>{job.status}</span>
                </div>
                <h3>{job.stage}</h3>
                <p>{job.resultSummary || "Тайлан хүлээгдэж байна."}</p>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${job.progressPercent}%` }} />
                </div>
                <div className="job-metadata">
                  <span>{job.photoSet.imageCount} зураг</span>
                  <span>Чанар: {job.estimatedQuality}</span>
                </div>

                {findings && (
                  <div className="quality-report">
                    <div className="quality-stats">
                      <div className="quality-stat">
                        <span>OK</span>
                        <strong>{findings.okCount}/{findings.total}</strong>
                      </div>
                      <div className="quality-stat">
                        <span>Дундаж MP</span>
                        <strong>{findings.avgMegapixels}</strong>
                      </div>
                      <div className="quality-stat">
                        <span>Гэрэлт байдал</span>
                        <strong>{findings.avgBrightness}</strong>
                      </div>
                    </div>
                    {(findings.issues.blurry +
                      findings.issues.dark +
                      findings.issues.overexposed +
                      findings.issues.lowRes +
                      findings.issues.unread >
                      0) && (
                      <ul className="quality-issue-summary">
                        {findings.issues.blurry > 0 && (
                          <li>{findings.issues.blurry} blur их</li>
                        )}
                        {findings.issues.dark > 0 && (
                          <li>{findings.issues.dark} харанхуй</li>
                        )}
                        {findings.issues.overexposed > 0 && (
                          <li>{findings.issues.overexposed} цайвар</li>
                        )}
                        {findings.issues.lowRes > 0 && (
                          <li>{findings.issues.lowRes} resolution бага</li>
                        )}
                        {findings.issues.unread > 0 && (
                          <li>{findings.issues.unread} уншигдсангүй</li>
                        )}
                      </ul>
                    )}
                    {findings.perImage?.some((p) => !p.ok) && (
                      <details className="quality-details">
                        <summary>Анхаарах зургуудыг харах</summary>
                        <ul>
                          {findings.perImage
                            .filter((p) => !p.ok)
                            .slice(0, 12)
                            .map((p) => (
                              <li key={p.id}>
                                <strong>{p.name}</strong>:{" "}
                                <span>{(p.issues || []).join("; ")}</span>
                              </li>
                            ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )}

                <div className="log-list">
                  {job.processingLog.slice(-3).map((entry) => (
                    <p key={`${job.id}-${entry.createdAt}-${entry.stage}`}>
                      <strong>{entry.stage}:</strong> {entry.message}
                    </p>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </Layout>
  );
}
