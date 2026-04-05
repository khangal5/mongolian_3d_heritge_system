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
          <span className="platform-label">3D Үзүүлэн</span>
          <strong>GLB / GLTF моделио шууд нээж үзнэ</strong>
        </div>
        <div>
          <span className="platform-label">Каталог</span>
          <strong>Олдворын мэдээллийг цэгцтэй харуулна</strong>
        </div>
        <div>
          <span className="platform-label">Удирдлага</span>
          <strong>Шинэ дурсгал, файл нэмэх боломжтой</strong>
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
          <h2>Хайлт хийсний дараа олдворууд гарна.</h2>
          <p>Хайх төрлөө сонгоод түлхүүр үг эсвэл шүүлт ашиглана уу.</p>
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
