import { useEffect, useState } from "react";
import { getArtifacts } from "../api/client.js";
import ArtifactGrid from "../components/ArtifactGrid.jsx";
import Hero from "../components/Hero.jsx";
import Layout from "../components/Layout.jsx";
import SearchPanel from "../components/SearchPanel.jsx";

const defaultFilters = {
  names: [],
  categories: [],
  periods: [],
  provinces: [],
  locations: [],
  tags: []
};

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [searchBy, setSearchBy] = useState("all");
  const [category, setCategory] = useState("");
  const [province, setProvince] = useState("");
  const [artifacts, setArtifacts] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [status, setStatus] = useState("idle");
  const [filtersStatus, setFiltersStatus] = useState("loading");
  const [appliedSearch, setAppliedSearch] = useState(null);

  useEffect(() => {
    let ignore = false;

    getArtifacts({ includeItems: false })
      .then((data) => {
        if (ignore) {
          return;
        }

        setFilters(data.filters);
        setFiltersStatus("success");
      })
      .catch(() => {
        if (!ignore) {
          setFiltersStatus("error");
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  function handleSearch() {
    const nextSearch = {
      q: query.trim(),
      searchBy,
      category,
      province
    };

    if (!nextSearch.q && !nextSearch.category && !nextSearch.province) {
      setAppliedSearch(null);
      setArtifacts([]);
      setStatus("idle");
      return;
    }

    setAppliedSearch(nextSearch);
    setStatus("loading");

    getArtifacts(nextSearch)
      .then((data) => {
        setArtifacts(data.items);
        setFilters(data.filters);
        setStatus("success");
      })
      .catch(() => {
        setStatus("error");
      });
  }

  function handleReset() {
    setQuery("");
    setSearchBy("all");
    setCategory("");
    setProvince("");
    setAppliedSearch(null);
    setArtifacts([]);
    setStatus("idle");
  }

  function handleSearchByChange(nextValue) {
    setSearchBy(nextValue);
    setQuery("");
  }

  return (
    <Layout>
      <Hero />

      <section className="platform-strip" id="overview">
        <div>
          <span className="platform-strip-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2l8.5 4.9v10.2L12 22l-8.5-4.9V6.9L12 2z" />
              <path d="M3.5 6.9L12 12l8.5-5.1" />
              <path d="M12 12v10" />
            </svg>
          </span>
          <div>
            <span className="platform-label">3D Viewer</span>
            <strong>Three.js + WebGL канваст GLB / GLTF загварыг шууд ачааллаж, эргүүлж үзэх боломж.</strong>
          </div>
        </div>
        <div className="platform-strip-accent">
          <span className="platform-strip-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </span>
          <div>
            <span className="platform-label">Газрын зураг</span>
            <strong>Leaflet дээр олдворын газарзүйн байршлыг маркер ба popup-тайгаар илэрхийлнэ.</strong>
          </div>
        </div>
        <div className="platform-strip-violet">
          <span className="platform-strip-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
              <path d="M8 11h6" />
              <path d="M11 8v6" />
            </svg>
          </span>
          <div>
            <span className="platform-label">Хайлт ба удирдлага</span>
            <strong>Нэр, ангилал, үе, аймаг, тагаар хайх. Судлаачийн эрхээр шинэ дурсгал нэмэх.</strong>
          </div>
        </div>
      </section>

      <div id="catalog">
        <SearchPanel
          query={query}
          searchBy={searchBy}
          category={category}
          province={province}
          filters={filters}
          appliedSearch={appliedSearch}
          onQueryChange={setQuery}
          onSearchByChange={handleSearchByChange}
          onCategoryChange={setCategory}
          onProvinceChange={setProvince}
          onSubmit={handleSearch}
          onReset={handleReset}
        />
      </div>

      {filtersStatus === "error" && (
        <p className="feedback error">Шүүлтийн мэдээллийг ачаалж чадсангүй.</p>
      )}
      {status === "idle" && (
        <section className="empty-state search-empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </div>
          <h2>Хайлт хийж 3D дурсгалуудыг нээгээрэй</h2>
          <p>Нэр, ангилал, аймаг эсвэл тагаар хайлт хийгээд олдворын 3D загвар, зураг, газарзүйн байршлыг харна.</p>
        </section>
      )}
      {status === "loading" && <p className="feedback">Хайлтын үр дүнг ачаалж байна...</p>}
      {status === "error" && (
        <p className="feedback error">
          Хайлтын үр дүнг авч чадсангүй. Backend серверээ шалгана уу.
        </p>
      )}
      {status === "success" && <ArtifactGrid artifacts={artifacts} />}
    </Layout>
  );
}
