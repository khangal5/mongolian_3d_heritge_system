import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createArtifactRequest,
  getArtifactBySlug,
  updateArtifactRequest,
  uploadArtifactImage,
  uploadArtifactImages,
  uploadArtifactModel
} from "../api/client.js";
import { getStoredAuth } from "../auth.js";
import Layout from "../components/Layout.jsx";
import UserSidebar from "../components/UserSidebar.jsx";
import MapPicker from "../components/MapPicker.jsx";
import { MONGOLIA_PROVINCES } from "../constants/provinces.js";
import { ARTIFACT_CATEGORIES } from "../constants/categories.js";
import { ARTIFACT_PERIODS } from "../constants/periods.js";
import { SUMS_BY_PROVINCE } from "../constants/sums.js";

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

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яөүё\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

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
  const [imageFile, setImageFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [imageFileDragOver, setImageFileDragOver] = useState(false);
  const [galleryDragOver, setGalleryDragOver] = useState(false);
  const [imageDragOver, setImageDragOver] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [loadStatus, setLoadStatus] = useState(isEditMode ? "loading" : "idle");
  const auth = typeof window === "undefined" ? null : getStoredAuth();

  useEffect(() => {
    if (!isEditMode) return;

    let ignore = false;
    setLoadStatus("loading");
    getArtifactBySlug(editSlug)
      .then((data) => {
        if (ignore) return;
        const isAdmin = auth?.user?.role === "admin";
        if (data.status !== "NEW" && !isAdmin) {
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
  }, [editSlug, isEditMode, auth?.user?.role]);

  function handleNameChange(value) {
    setForm((current) => {
      const next = { ...current, name: value };
      if (!isEditMode && (!current.slug || current.slug === slugify(current.name))) {
        next.slug = slugify(value);
      }
      if (!current.nameMn || current.nameMn === current.name) {
        next.nameMn = value;
      }
      return next;
    });
  }

  function handleMapPick(lat, lng) {
    setForm((current) => ({
      ...current,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6)
    }));
  }

  async function resolveModelUrl() {
    if (!modelFile) return form.modelUrl;
    const payload = new FormData();
    payload.set("model", modelFile);
    setUploadStatus("uploading");
    const response = await uploadArtifactModel(payload);
    setUploadStatus("uploaded");
    return response.modelUrl;
  }

  async function resolveImageUrl() {
    if (!imageFile) return form.imageUrl;
    const payload = new FormData();
    payload.set("image", imageFile);
    setUploadStatus("uploading");
    const response = await uploadArtifactImage(payload);
    setUploadStatus("uploaded");
    return response.imageUrl;
  }

  async function resolveGalleryUrls() {
    const urlList = form.gallery
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (galleryFiles.length === 0) return urlList;

    const payload = new FormData();
    for (const file of galleryFiles) payload.append("images", file);
    setUploadStatus("uploading");
    const response = await uploadArtifactImages(payload);
    setUploadStatus("uploaded");
    return [...urlList, ...response.items.map((it) => it.imageUrl)];
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const imageUrl = await resolveImageUrl();
      const gallery = await resolveGalleryUrls();
      const modelUrl = await resolveModelUrl();
      const payload = {
        slug: form.slug || slugify(form.name),
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
        imageUrl,
        modelUrl,
        gallery,
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean)
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
      setImageFile(null);
      setGalleryFiles([]);
      setUploadStatus("idle");
      setTimeout(() => navigate("/dashboard"), 600);
    } catch (requestError) {
      setUploadStatus("error");
      setError(requestError.message);
    }
  }

  const submitting = uploadStatus === "uploading";
  const formDisabled = !auth?.user || submitting || (isEditMode && loadStatus !== "success");

  if (!auth?.user) {
    return (
      <Layout>
        <p className="feedback error" style={{ margin: "40px auto", maxWidth: 720 }}>
          Энэ үйлдлийг хийхийн тулд эхлээд судлаачаар бүртгүүлж, нэвтэрнэ үү.
        </p>
      </Layout>
    );
  }

  return (
    <Layout sidebar={<UserSidebar user={auth.user} />}>
      <header className="dash-header">
        <div>
          <h1 className="dash-title">{isEditMode ? "Олдвор засах" : "Шинэ олдвор үүсгэх"}</h1>
          <p className="dash-sub">Талбарыг бөглөж олдворын мэдээллийг системд бүртгэнэ үү.</p>
        </div>
        <Link to="/dashboard" className="dash-action ghost">Болих</Link>
      </header>

      {isEditMode && loadStatus === "loading" && (
        <p className="feedback">Олдворын мэдээллийг ачааллаж байна...</p>
      )}
      {isEditMode && loadStatus === "error" && (
        <p className="feedback error">{error || "Мэдээллийг ачаалж чадсангүй."}</p>
      )}

      <form className="artifact-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <header className="form-section-header">
            <span className="form-section-number">1</span>
            <div>
              <h2>Үндсэн мэдээлэл</h2>
              <p>Олдворын нэр, ангилал, он цаг, тайлбарыг оруулна.</p>
            </div>
          </header>

          <div className="form-section-body">
            <div className="field af-full">
              <label htmlFor="name">Олдворын нэр *</label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Жишээ: Бугатын хөшөө"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="category">Төрөл *</label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))}
                required
              >
                <option value="">Сонгоно уу</option>
                {ARTIFACT_CATEGORIES.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="period">Он цаг *</label>
              <select
                id="period"
                value={form.period}
                onChange={(e) => setForm((c) => ({ ...c, period: e.target.value }))}
                required
              >
                <option value="">Сонгоно уу</option>
                {ARTIFACT_PERIODS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>

            <div className="field af-full">
              <label htmlFor="shortDescription">Товч тайлбар *</label>
              <input
                id="shortDescription"
                value={form.shortDescription}
                onChange={(e) => setForm((c) => ({ ...c, shortDescription: e.target.value }))}
                placeholder="Карт дээр харагдах нэг өгүүлбэр"
                required
              />
            </div>

            <div className="field af-full">
              <label htmlFor="description">Дэлгэрэнгүй тайлбар *</label>
              <textarea
                id="description"
                rows="5"
                value={form.description}
                onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                placeholder="Олдворын түүх, гарал үүсэл, онцлог шинжүүдийг тайлбарлана уу..."
                required
              />
            </div>

            <div className="field af-full">
              <label htmlFor="tags">Түлхүүр үгс (таг)</label>
              <input
                id="tags"
                value={form.tags}
                onChange={(e) => setForm((c) => ({ ...c, tags: e.target.value }))}
                placeholder="бугын хөшөө, хүрлийн үе, чулуу"
              />
              <p className="field-help">Таалбарийг таслалаар тусгаарлана уу.</p>
            </div>
          </div>
        </section>

        <section className="form-section">
          <header className="form-section-header">
            <span className="form-section-number">2</span>
            <div>
              <h2>Газарзүйн байршил</h2>
              <p>Аймаг, сум сонгоод газрын зурагнаас яг байршлыг товшиж тэмдэглэнэ.</p>
            </div>
          </header>

          <div className="form-section-body">
            <div className="field">
              <label htmlFor="province">Аймаг / хот *</label>
              <select
                id="province"
                value={form.province}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    province: e.target.value,
                    // Reset location when province changes so a stale sum
                    // isn't carried over to a different aimag.
                    location: ""
                  }))
                }
                required
              >
                <option value="">Сонгоно уу</option>
                {MONGOLIA_PROVINCES.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="location">Сум / дүүрэг *</label>
              <select
                id="location"
                value={form.location}
                onChange={(e) => setForm((c) => ({ ...c, location: e.target.value }))}
                required
                disabled={!form.province}
              >
                <option value="">
                  {form.province ? "Сонгоно уу" : "Эхлээд аймгаа сонгоно уу"}
                </option>
                {(SUMS_BY_PROVINCE[form.province] || []).map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
                {form.location &&
                  !(SUMS_BY_PROVINCE[form.province] || []).includes(form.location) && (
                    <option value={form.location}>{form.location}</option>
                  )}
              </select>
            </div>

            <div className="field">
              <label htmlFor="lat">Өргөрөг (Latitude) *</label>
              <input
                id="lat"
                value={form.lat}
                onChange={(e) => setForm((c) => ({ ...c, lat: e.target.value }))}
                placeholder="47.5236"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="lng">Уртраг (Longitude) *</label>
              <input
                id="lng"
                value={form.lng}
                onChange={(e) => setForm((c) => ({ ...c, lng: e.target.value }))}
                placeholder="101.4567"
                required
              />
            </div>

            <div className="field af-full">
              <MapPicker
                latitude={form.lat}
                longitude={form.lng}
                onChange={handleMapPick}
              />
            </div>
          </div>
        </section>

        <section className="form-section">
          <header className="form-section-header">
            <span className="form-section-number">3</span>
            <div>
              <h2>Зураг ба 3D файл</h2>
              <p>Гол зураг заавал. 3D файл нэмэлт — администратор фотограмметрийн дараа байршуулж болно.</p>
            </div>
          </header>

          <div className="form-section-body">
            <div className="field af-full">
              <label>Гол зураг *</label>
              <div
                className={`drop-zone ${imageFileDragOver ? "is-over" : ""} ${imageFile ? "has-file" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setImageFileDragOver(true); }}
                onDragLeave={() => setImageFileDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setImageFileDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith("image/")) {
                    setImageFile(file);
                    setForm((c) => ({ ...c, imageUrl: "" }));
                  }
                }}
              >
                <input
                  id="imageFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setImageFile(file);
                    if (file) setForm((c) => ({ ...c, imageUrl: "" }));
                  }}
                  hidden
                />
                <label htmlFor="imageFile" className="drop-zone-label">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  {imageFile ? (
                    <>
                      <strong>{imageFile.name}</strong>
                      <span>Дахин сонгох бол энд дарна</span>
                    </>
                  ) : (
                    <>
                      <strong>Файлаа чирэх эсвэл сонгох</strong>
                      <span>.jpg, .png, .webp эсвэл .gif · 10MB хүртэл</span>
                    </>
                  )}
                </label>
              </div>
              {imageFile && (
                <div className="image-preview">
                  <img src={URL.createObjectURL(imageFile)} alt="preview" />
                </div>
              )}
            </div>

            <div className="field af-full">
              <label htmlFor="imageUrl">Эсвэл зурагны URL</label>
              <input
                id="imageUrl"
                value={form.imageUrl}
                onChange={(e) => {
                  setForm((c) => ({ ...c, imageUrl: e.target.value }));
                  if (e.target.value) setImageFile(null);
                }}
                placeholder="https://.../main.jpg"
                required={!imageFile}
              />
              {form.imageUrl && !imageFile && (
                <div className="image-preview">
                  <img src={form.imageUrl} alt="preview" />
                </div>
              )}
            </div>

            <div className="field af-full">
              <label>Нэмэлт зургууд</label>
              <div
                className={`drop-zone ${galleryDragOver ? "is-over" : ""} ${galleryFiles.length ? "has-file" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setGalleryDragOver(true); }}
                onDragLeave={() => setGalleryDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setGalleryDragOver(false);
                  const dropped = Array.from(e.dataTransfer.files || [])
                    .filter((f) => f.type.startsWith("image/"));
                  if (dropped.length) {
                    setGalleryFiles((curr) => [...curr, ...dropped]);
                  }
                }}
              >
                <input
                  id="galleryFiles"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={(event) => {
                    const picked = Array.from(event.target.files || []);
                    if (picked.length) {
                      setGalleryFiles((curr) => [...curr, ...picked]);
                    }
                    event.target.value = "";
                  }}
                  hidden
                />
                <label htmlFor="galleryFiles" className="drop-zone-label">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  {galleryFiles.length ? (
                    <>
                      <strong>{galleryFiles.length} файл сонгогдсон</strong>
                      <span>Дахин нэмэх бол энд дарна</span>
                    </>
                  ) : (
                    <>
                      <strong>Файлуудаа чирэх эсвэл сонгох</strong>
                      <span>Олон зураг сонгож болно · .jpg, .png, .webp, .gif</span>
                    </>
                  )}
                </label>
              </div>
              {galleryFiles.length > 0 && (
                <div className="gallery-preview">
                  {galleryFiles.map((file, idx) => (
                    <div key={`${file.name}-${idx}`} className="gallery-preview-item">
                      <img src={URL.createObjectURL(file)} alt={file.name} />
                      <button
                        type="button"
                        className="gallery-preview-remove"
                        onClick={() =>
                          setGalleryFiles((curr) => curr.filter((_, i) => i !== idx))
                        }
                        aria-label="Хасах"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="field af-full">
              <label htmlFor="gallery">Эсвэл нэмэлт зургийн URL</label>
              <input
                id="gallery"
                value={form.gallery}
                onChange={(e) => setForm((c) => ({ ...c, gallery: e.target.value }))}
                placeholder="https://.../img1.jpg, https://.../img2.jpg"
              />
              <p className="field-help">Таслалаар тусгаарлан олон URL оруулж болно. Файл сонгосон бол URL-ууд хамт нэмэгдэнэ.</p>
            </div>

            <div
              className={`drop-zone af-full ${imageDragOver ? "is-over" : ""} ${modelFile ? "has-file" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setImageDragOver(true); }}
              onDragLeave={() => setImageDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setImageDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file && (file.name.endsWith(".glb") || file.name.endsWith(".gltf"))) {
                  setModelFile(file);
                }
              }}
            >
              <input
                id="modelFile"
                type="file"
                accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                onChange={(event) => setModelFile(event.target.files?.[0] || null)}
                hidden
              />
              <label htmlFor="modelFile" className="drop-zone-label">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {modelFile ? (
                  <>
                    <strong>{modelFile.name}</strong>
                    <span>Дахин сонгох бол энд дарна</span>
                  </>
                ) : (
                  <>
                    <strong>3D файл (нэмэлт)</strong>
                    <span>.glb эсвэл .gltf формат · 150MB хүртэл. Хоосон үлдээж болно — фотограмметрийн дараа админ оруулна.</span>
                  </>
                )}
              </label>
            </div>

            <div className="field af-full">
              <label htmlFor="modelUrl">Эсвэл бэлэн URL (нэмэлт)</label>
              <input
                id="modelUrl"
                value={form.modelUrl}
                onChange={(e) => setForm((c) => ({ ...c, modelUrl: e.target.value }))}
                placeholder="https://.../artifact.glb (хоосон үлдээж болно)"
              />
            </div>

            {uploadStatus === "uploading" && (
              <p className="feedback af-full">3D файл байршуулж байна...</p>
            )}
          </div>
        </section>

        <div className="artifact-form-actions">
          <Link to="/dashboard" className="dash-action ghost">Цуцлах</Link>
          <button type="submit" className="dash-action submit" disabled={formDisabled}>
            {submitting
              ? "Файл байршуулж байна..."
              : isEditMode
                ? "Хадгалах"
                : "Бүртгэх"}
          </button>
        </div>

        {message && <p className="feedback">{message}</p>}
        {error && <p className="feedback error">{error}</p>}
      </form>
    </Layout>
  );
}
