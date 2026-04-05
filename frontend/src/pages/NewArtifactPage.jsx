import { useState } from "react";
import { createArtifactRequest, uploadArtifactModel } from "../api/client.js";
import { getStoredAuth } from "../auth.js";
import Layout from "../components/Layout.jsx";

const initialForm = {
  slug: "",
  name: "",
  nameMn: "",
  category: "",
  period: "",
  province: "",
  location: "",
  lat: "",
  lng: "",
  shortDescription: "",
  description: "",
  imageUrl: "",
  modelUrl: "",
  gallery: "",
  tags: ""
};

export default function NewArtifactPage() {
  const [form, setForm] = useState(initialForm);
  const [modelFile, setModelFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("idle");
  const auth = typeof window === "undefined" ? null : getStoredAuth();

  async function resolveModelUrl() {
    if (!modelFile) {
      return form.modelUrl;
    }

    const payload = new FormData();
    payload.set("model", modelFile);

    setUploadStatus("uploading");
    const response = await uploadArtifactModel(payload);
    setUploadStatus("uploaded");

    return response.modelUrl;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const modelUrl = await resolveModelUrl();

      await createArtifactRequest({
        slug: form.slug,
        name: form.name,
        nameMn: form.nameMn || form.name,
        category: form.category,
        period: form.period,
        province: form.province,
        location: form.location,
        coordinates: {
          lat: Number(form.lat),
          lng: Number(form.lng)
        },
        shortDescription: form.shortDescription,
        description: form.description,
        imageUrl: form.imageUrl,
        modelUrl,
        gallery: form.gallery
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        tags: form.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      });

      setMessage("Шинэ дурсгал амжилттай бүртгэгдлээ.");
      setForm(initialForm);
      setModelFile(null);
      setUploadStatus("idle");
    } catch (requestError) {
      setUploadStatus("error");
      setError(requestError.message);
    }
  }

  return (
    <Layout>
      <section className="hero hero-compact">
        <div className="hero-copy">
          <p className="eyebrow">Шинэ Дурсгал</p>
          <h1>Судлаач эрхтэй хэрэглэгч шинэ дурсгал нэмнэ.</h1>
          <p className="hero-text">
            Зураг, тайлбар, 3D файлаа оруулаад бүртгэнэ.
          </p>
        </div>
      </section>

      {!auth?.user && (
        <p className="feedback error">
          Энэ үйлдлийг хийхийн тулд эхлээд судлаачаар бүртгүүлж, нэвтэрнэ үү.
        </p>
      )}

      {auth?.user && (
        <section className="info-card">
          <p className="field-help">
            Одоогоор нэвтэрсэн хэрэглэгч: <strong>{auth.user.fullName}</strong> ({auth.user.role})
          </p>
        </section>
      )}

      <form className="info-card upload-form form-wide" onSubmit={handleSubmit}>
        <h2>Шинэ дурсгал нэмэх</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="slug">Slug</label>
            <input id="slug" value={form.slug} onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="name">Нэр</label>
            <input id="name" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="nameMn">Монгол нэр</label>
            <input id="nameMn" value={form.nameMn} onChange={(e) => setForm((c) => ({ ...c, nameMn: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="category">Ангилал</label>
            <input id="category" value={form.category} onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="period">Он цагийн үе</label>
            <input id="period" value={form.period} onChange={(e) => setForm((c) => ({ ...c, period: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="province">Аймаг</label>
            <input id="province" value={form.province} onChange={(e) => setForm((c) => ({ ...c, province: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="location">Байршил</label>
            <input id="location" value={form.location} onChange={(e) => setForm((c) => ({ ...c, location: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="lat">Өргөрөг</label>
            <input id="lat" value={form.lat} onChange={(e) => setForm((c) => ({ ...c, lat: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="lng">Уртраг</label>
            <input id="lng" value={form.lng} onChange={(e) => setForm((c) => ({ ...c, lng: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="imageUrl">Зураг URL</label>
            <input id="imageUrl" value={form.imageUrl} onChange={(e) => setForm((c) => ({ ...c, imageUrl: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="modelFile">3D файл upload</label>
            <input
              id="modelFile"
              type="file"
              accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
              onChange={(event) => setModelFile(event.target.files?.[0] || null)}
            />
            <p className="field-help">`.glb` эсвэл `.gltf` файл сонгоно.</p>
          </div>
          <div className="field">
            <label htmlFor="modelUrl">Эсвэл бэлэн GLB / GLTF URL</label>
            <input
              id="modelUrl"
              value={form.modelUrl}
              onChange={(e) => setForm((c) => ({ ...c, modelUrl: e.target.value }))}
              placeholder="https://.../artifact.glb"
            />
          </div>
          <div className="field">
            <label htmlFor="gallery">Gallery URL-ууд</label>
            <input id="gallery" value={form.gallery} onChange={(e) => setForm((c) => ({ ...c, gallery: e.target.value }))} placeholder="url1, url2" />
          </div>
          <div className="field">
            <label htmlFor="tags">Түлхүүр үгс</label>
            <input id="tags" value={form.tags} onChange={(e) => setForm((c) => ({ ...c, tags: e.target.value }))} placeholder="чулуу, дурсгал, өв" />
          </div>
        </div>

        {modelFile && (
          <div className="selected-files">
            <span>{modelFile.name}</span>
          </div>
        )}

        {uploadStatus === "uploading" && <p className="feedback">3D файл байршуулж байна...</p>}

        <div className="field">
          <label htmlFor="shortDescription">Товч тайлбар</label>
          <textarea id="shortDescription" rows="3" value={form.shortDescription} onChange={(e) => setForm((c) => ({ ...c, shortDescription: e.target.value }))} />
        </div>
        <div className="field">
          <label htmlFor="description">Дэлгэрэнгүй тайлбар</label>
          <textarea id="description" rows="5" value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} />
        </div>

        <button
          type="submit"
          className="action-button"
          disabled={!auth?.user || uploadStatus === "uploading"}
        >
          {uploadStatus === "uploading" ? "Файл байршуулж байна..." : "Шинэ дурсгал бүртгэх"}
        </button>
      </form>

      {message && <p className="feedback">{message}</p>}
      {error && <p className="feedback error">{error}</p>}
    </Layout>
  );
}
