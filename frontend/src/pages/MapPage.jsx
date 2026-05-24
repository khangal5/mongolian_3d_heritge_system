import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getArtifacts } from "../api/client.js";
import Layout from "../components/Layout.jsx";
import { MONGOLIA_PROVINCES } from "../constants/provinces.js";
import { ARTIFACT_CATEGORIES } from "../constants/categories.js";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MONGOLIA_CENTER = [46.8625, 103.8467];

export default function MapPage() {
  const [artifacts, setArtifacts] = useState([]);
  const [filters, setFilters] = useState({ categories: [], provinces: [] });
  const [status, setStatus] = useState("loading");
  const [category, setCategory] = useState("");
  const [province, setProvince] = useState("");

  useEffect(() => {
    let ignore = false;
    setStatus("loading");
    getArtifacts({})
      .then((data) => {
        if (ignore) return;
        setArtifacts(data.items);
        setFilters(data.filters);
        setStatus("success");
      })
      .catch(() => {
        if (!ignore) setStatus("error");
      });
    return () => {
      ignore = true;
    };
  }, []);

  const visible = useMemo(() => {
    return artifacts.filter((artifact) => {
      if (category && artifact.category !== category) return false;
      if (province && artifact.province !== province) return false;
      return Number.isFinite(artifact.coordinates?.lat) &&
        Number.isFinite(artifact.coordinates?.lng);
    });
  }, [artifacts, category, province]);

  return (
    <Layout>
      <section className="map-page">
        <header className="map-page-header">
          <div>
            <h1>Газрын зураг дээрх олдворууд</h1>
            <p>Монгол орны түүхэн дурсгалуудыг газарзүйн байршлаар нь хайж олно уу.</p>
          </div>
          <div className="map-page-filters">
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">Бүх ангилал</option>
              {[...ARTIFACT_CATEGORIES, ...filters.categories.filter(
                (value) => value && !ARTIFACT_CATEGORIES.includes(value)
              )].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <select value={province} onChange={(event) => setProvince(event.target.value)}>
              <option value="">Бүх аймаг &amp; хот</option>
              {MONGOLIA_PROVINCES.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <span className="map-page-count">{visible.length} олдвор</span>
          </div>
        </header>

        {status === "loading" && <p className="feedback">Газрын зураг ачаалж байна...</p>}
        {status === "error" && (
          <p className="feedback error">Олдворуудыг авч чадсангүй. Backend серверээ шалгана уу.</p>
        )}

        {status === "success" && (
          <div className="map-page-canvas">
            <MapContainer
              center={MONGOLIA_CENTER}
              zoom={5}
              scrollWheelZoom
              className="map-page-leaflet"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {visible.map((artifact) => (
                <Marker
                  key={artifact.id}
                  position={[artifact.coordinates.lat, artifact.coordinates.lng]}
                  icon={markerIcon}
                >
                  <Popup>
                    <div className="map-popup">
                      {artifact.imageUrl && (
                        <img src={artifact.imageUrl} alt={artifact.name} />
                      )}
                      <strong>{artifact.nameMn || artifact.name}</strong>
                      <div className="map-popup-meta">
                        {artifact.category} · {artifact.period}
                      </div>
                      <div className="map-popup-meta">
                        {artifact.province}, {artifact.location}
                      </div>
                      <Link to={`/artifacts/${artifact.slug}`} className="map-popup-link">
                        Дэлгэрэнгүй харах →
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </section>
    </Layout>
  );
}
