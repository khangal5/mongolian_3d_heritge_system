import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getArtifacts } from "../api/client.js";
import ArtifactGrid from "../components/ArtifactGrid.jsx";
import Layout from "../components/Layout.jsx";
import { MONGOLIA_PROVINCES } from "../constants/provinces.js";
import { ARTIFACT_CATEGORIES } from "../constants/categories.js";

const defaultFilters = {
  names: [],
  categories: [],
  periods: [],
  provinces: [],
  locations: [],
  tags: []
};

const searchOptions = [
  { value: "all", label: "Бүх талбар" },
  { value: "name", label: "Нэр" },
  { value: "period", label: "Үе" },
  { value: "location", label: "Байршил" },
  { value: "description", label: "Тайлбар" },
  { value: "tags", label: "Таг" }
];

const sortOptions = [
  { value: "newest", label: "Шинээр нэмэгдсэн" },
  { value: "oldest", label: "Хуучин нь эхэндээ" },
  { value: "name_asc", label: "Нэрээр (А → Я)" },
  { value: "name_desc", label: "Нэрээр (Я → А)" },
  { value: "distance", label: "Миний байршлаас ойр" }
];

export default function ArtifactsPage() {
  const [params, setParams] = useSearchParams();

  const [query, setQuery] = useState(params.get("q") || "");
  const [searchBy, setSearchBy] = useState(params.get("searchBy") || "all");
  const [category, setCategory] = useState(params.get("category") || "");
  const [province, setProvince] = useState(params.get("province") || "");
  const [sort, setSort] = useState(params.get("sort") || "newest");
  const [userLocation, setUserLocation] = useState(null);
  const [geolocationStatus, setGeolocationStatus] = useState("idle");
  const [artifacts, setArtifacts] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [status, setStatus] = useState("loading");
  const [view, setView] = useState("grid");

  function requestUserLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setGeolocationStatus("error");
        resolve(null);
        return;
      }
      setGeolocationStatus("loading");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(next);
          setGeolocationStatus("ready");
          resolve(next);
        },
        () => {
          setGeolocationStatus("error");
          resolve(null);
        }
      );
    });
  }

  async function handleSortChange(nextSort) {
    setSort(nextSort);
    let loc = userLocation;
    if (nextSort === "distance" && !loc) {
      loc = await requestUserLocation();
      if (!loc) {
        setSort("newest");
        return;
      }
    }
    applyFilters({ sort: nextSort, location: loc });
  }

  function runSearch(searchParams = {}) {
    setStatus("loading");
    getArtifacts(searchParams)
      .then((data) => {
        setArtifacts(data.items);
        setFilters(data.filters);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(() => {
    const initial = {
      q: params.get("q") || "",
      searchBy: params.get("searchBy") || "all",
      category: params.get("category") || "",
      province: params.get("province") || "",
      sort: params.get("sort") || "newest"
    };
    runSearch(initial);
  }, []);

  function applyFilters(next) {
    const nextSort = next.sort !== undefined ? next.sort : sort;
    const loc = next.location !== undefined ? next.location : userLocation;
    const merged = {
      q: next.query !== undefined ? next.query : query,
      searchBy: next.searchBy !== undefined ? next.searchBy : searchBy,
      category: next.category !== undefined ? next.category : category,
      province: next.province !== undefined ? next.province : province,
      sort: nextSort
    };
    if (nextSort === "distance" && loc) {
      merged.userLat = loc.lat;
      merged.userLng = loc.lng;
    }

    const urlParams = {};
    if (merged.q) urlParams.q = merged.q;
    if (merged.searchBy && merged.searchBy !== "all") urlParams.searchBy = merged.searchBy;
    if (merged.category) urlParams.category = merged.category;
    if (merged.province) urlParams.province = merged.province;
    if (nextSort && nextSort !== "newest") urlParams.sort = nextSort;
    setParams(urlParams, { replace: true });

    runSearch(merged);
  }

  function handleSearch(event) {
    if (event) event.preventDefault();
    applyFilters({});
  }

  function handleCategoryChip(value) {
    setCategory(value);
    applyFilters({ category: value });
  }

  function handleReset() {
    setQuery("");
    setSearchBy("all");
    setCategory("");
    setProvince("");
    setSort("newest");
    setUserLocation(null);
    setGeolocationStatus("idle");
    setParams({}, { replace: true });
    runSearch({});
  }

  const extraCategories = filters.categories.filter(
    (value) => value && !ARTIFACT_CATEGORIES.includes(value)
  );
  const categoryChips = ["", ...ARTIFACT_CATEGORIES, ...extraCategories];
  const hasFilters = Boolean(query || category || province || sort !== "newest");

  return (
    <Layout>
      <div className="catalog-page">
        <div className="catalog-layout">
          <aside className="catalog-sidebar">
            <div className="catalog-filter-block">
              <h3>Ангилал</h3>
              <div className="catalog-filter-list">
                {categoryChips.map((value) => (
                  <button
                    key={value || "all"}
                    type="button"
                    className={`catalog-filter-item ${category === value ? "is-active" : ""}`}
                    onClick={() => handleCategoryChip(value)}
                  >
                    {value || "Бүгд"}
                  </button>
                ))}
              </div>
            </div>

            <div className="catalog-filter-block">
              <h3>Аймаг &amp; хот</h3>
              <select
                value={province}
                onChange={(event) => {
                  setProvince(event.target.value);
                  applyFilters({ province: event.target.value });
                }}
                className="catalog-filter-select"
              >
                <option value="">Бүгд</option>
                {MONGOLIA_PROVINCES.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>

            {hasFilters && (
              <button type="button" className="catalog-reset" onClick={handleReset}>
                Бүх шүүлтийг цэвэрлэх
              </button>
            )}
          </aside>

          <section className="catalog-main">
            <header className="catalog-toolbar">
              <div className="catalog-toolbar-row">
                <div className="catalog-toolbar-title">
                  <h1>Олдворууд</h1>
                  <span>{artifacts.length} үр дүн</span>
                </div>

                <div className="catalog-toolbar-actions">
                  <div className="catalog-sort">
                    <label htmlFor="sort">Эрэмбэ:</label>
                    <select
                      id="sort"
                      value={sort}
                      onChange={(event) => handleSortChange(event.target.value)}
                      className="catalog-sort-select"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="view-toggle" role="tablist" aria-label="Харагдах хэлбэр">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={view === "grid"}
                      className={`view-toggle-btn ${view === "grid" ? "is-active" : ""}`}
                      onClick={() => setView("grid")}
                      title="Хүснэгт"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={view === "list"}
                      className={`view-toggle-btn ${view === "list" ? "is-active" : ""}`}
                      onClick={() => setView("list")}
                      title="Жагсаалт"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {sort === "distance" && geolocationStatus === "loading" && (
                <span className="catalog-sort-hint">Байршил тогтоож байна...</span>
              )}
              {sort === "distance" && geolocationStatus === "error" && (
                <span className="catalog-sort-hint is-error">Байршлыг авч чадсангүй</span>
              )}

              <form className="catalog-search" onSubmit={handleSearch}>
            <div className="catalog-search-type">
              <select
                value={searchBy}
                onChange={(event) => setSearchBy(event.target.value)}
                aria-label="Хайх төрөл"
              >
                {searchOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            <span className="catalog-search-divider" aria-hidden="true" />
            <svg className="catalog-search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={query}
              placeholder="Олдвор, газар, тагаар хайх..."
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Хайх утга"
            />
            {hasFilters && (
              <button type="button" className="catalog-clear" onClick={handleReset} title="Цэвэрлэх">
                ✕
              </button>
            )}
            <button type="submit" className="catalog-search-go">Хайх</button>
          </form>
            </header>

            <div className="catalog-results">
              {status === "loading" && <p className="feedback">Ачаалж байна...</p>}
              {status === "error" && (
                <p className="feedback error">Олдворуудыг авч чадсангүй. Backend серверээ шалгана уу.</p>
              )}
              {status === "success" && (
                <ArtifactGrid artifacts={artifacts} view={view} hideHeader />
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
