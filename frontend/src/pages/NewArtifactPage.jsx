import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createArtifactRequest,
  getArtifactBySlug,
  updateArtifactRequest,
  uploadArtifactModel
} from "../api/client.js";
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

function artifactToForm(artifact) {
  return {
    slug: artifact.slug || "",
    name: artifact.name || "",
    nameMn: artifact.nameMn || "",
    category: artifact.category || "",
    period: artifact.period || "",
    province: artifact.province || "",
    location: artifact.location || "",
    lat: artifact.coordinates?.lat ?? "",
    lng: artifact.coordinates?.lng ?? "",
    shortDescription: artifact.shortDescription || "",
    description: artifact.description || "",
    imageUrl: artifact.imageUrl || "",
    modelUrl: artifact.modelUrl || artifact.modelEmbedUrl || "",
    gallery: Array.isArray(artifact.gallery) ? artifact.gallery.join(", ") : "",
    tags: Array.isArray(artifact.tags) ? artifact.tags.join(", ") : ""
  };
}

export default function NewArtifactPage() {
  const navigate = useNavigate();
  const { slug: editSlug } = useParams();
  const isEditMode = Boolean(editSlug);
  const [form, setForm] = useState(initialForm);
  const [modelFile, setModelFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [loadStatus, setLoadStatus] = useState(isEditMode ? "loading" : "idle");
  const auth = typeof window === "undefined" ? null : getStoredAuth();

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    let ignore = false;
    setLoadStatus("loading");
    getArtifactBySlug(editSlug)
      .then((data) => {
        if (ignore) return;
        if (data.status !== "NEW") {
          setError("Зөвхөн NEW төлөвт байгаа өвийг засах боломжтой.");
          setLoadStatus("error");
          return;
        }
        setForm(artifactToForm(data));
        setLoadStatus("success");
      })
      .catch((requestError) => {
        if (ignore) return;
        setError(requestError.message);
        setLoadStatus("error");
      });

    return () => {
      ignore = true;
    };
  }, [editSlug, isEditMode]);

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

      const payload = {
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
      };

      if (isEditMode) {
        await updateArtifactRequest(editSlug, payload);
        setMessage("Өөрчлөлт хадгалагдлаа. Самбар руу шилжиж байна...");
      } else {
        await createArtifactRequest(payload);
        setMessage("Шинэ дурсгал амжилттай бүртгэгдлээ. Самбар руу шилжиж байна...");
        setForm(initialForm);
      }

      setModelFile(null);
      setUploadStatus("idle");
      setTimeout(() => navigate("/dashboard"), 600);
    } catch (requestError) {
      setUploadStatus("error");
      setError(requestError.message);
    }
  }

  const submitting = uploadStatus === "uploading";
  const formDisabled = !auth?.user || submitting || (isEditMode && loadStatus !== "success");

  return (
    <Layout>
      <section className="hero hero-compact">
        <div className="hero-copy">
          <p className="eyebrow">{isEditMode ? "Олдвор засах" : "Шинэ Дурсгал"}</p>
          <h1>
            {isEditMode
              ? "NEW төлөвт байгаа олдвороо засаад дахин илгээнэ үү."
              : "Судлаач эрхтэй хэрэглэгч шинэ дурсгал нэмнэ."}
          </h1>
          <p className="hero-text">
            Зураг, тайлбар, 3D файлаа оруулаад {isEditMode ? "хадгална." : "бүртгэнэ."}
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

      {isEditMode && loadStatus === "loading" && (
        <p className="feedback">Олдворын мэдээллийг ачааллаж байна...</p>
      )}
      {isEditMode && loadStatus === "error" && (
        <p className="feedback error">{error || "Мэдээллийг ачаалж чадсангүй."}</p>
      )}

      <form className="info-card upload-form form-wide" onSubmit={handleSubmit}>
        <h2>{isEditMode ? "Олдворыг засах" : "Шинэ дурсгал нэмэх"}</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="slug">Slug</label>
            <input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value }))}
              disabled={isEditMode}
            />
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
          disabled={formDisabled}
        >
          {submitting
            ? "Файл байршуулж байна..."
            : isEditMode
              ? "Хадгалах"
              : "Шинэ дурсгал бүртгэх"}
        </button>
      </form>

      {message && <p className="feedback">{message}</p>}
      {error && <p className="feedback error">{error}</p>}
    </Layout>
  );
}