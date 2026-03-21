import { useEffect, useState } from "react";
import { getArtifacts } from "../api/client.js";
import ArtifactGrid from "../components/ArtifactGrid.jsx";
import Hero from "../components/Hero.jsx";
import Layout from "../components/Layout.jsx";
import SearchPanel from "../components/SearchPanel.jsx";

const defaultFilters = {
  categories: [],
  provinces: []
};

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [province, setProvince] = useState("");
  const [artifacts, setArtifacts] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let ignore = false;

    setStatus("loading");
    getArtifacts({ q: query, category, province })
      .then((data) => {
        if (ignore) {
          return;
        }

        setArtifacts(data.items);
        setFilters(data.filters);
        setStatus("success");
      })
      .catch(() => {
        if (!ignore) {
          setStatus("error");
        }
      });

    return () => {
      ignore = true;
    };
  }, [query, category, province]);

  return (
    <Layout>
      <Hero />

      <section className="platform-strip" id="platform">
        <div>
          <span className="platform-label">Архитектур</span>
          <strong>React frontend</strong>
        </div>
        <div>
          <span className="platform-label">API</span>
          <strong>Express backend</strong>
        </div>
        <div>
          <span className="platform-label">Deploy хийх зам</span>
          <strong>Vercel эсвэл Netlify + Render эсвэл Railway</strong>
        </div>
      </section>

      <div id="catalog">
        <SearchPanel
          query={query}
          category={category}
          province={province}
          filters={filters}
          onQueryChange={setQuery}
          onCategoryChange={setCategory}
          onProvinceChange={setProvince}
        />
      </div>

      {status === "loading" && <p className="feedback">Өвийн мэдээллийг ачаалж байна...</p>}
      {status === "error" && (
        <p className="feedback error">
          API холбогдохгүй байна. Каталогийг ашиглахаас өмнө backend серверээ асаана уу.
        </p>
      )}
      {status === "success" && <ArtifactGrid artifacts={artifacts} />}
    </Layout>
  );
}
