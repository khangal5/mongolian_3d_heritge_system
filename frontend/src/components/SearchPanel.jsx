const searchOptions = [
  { value: "all", label: "Бүх талбар" },
  { value: "name", label: "Нэр" },
  { value: "category", label: "Ангилал" },
  { value: "period", label: "Үе" },
  { value: "province", label: "Аймаг" },
  { value: "location", label: "Байршил" },
  { value: "description", label: "Тайлбар" },
  { value: "tags", label: "Таг" }
];

const placeholders = {
  all: "Жишээ: буган хөшөө",
  name: "Дурсгалын нэр",
  category: "Ангиллын нэр",
  period: "Жишээ: Түрэг",
  province: "Аймгийн нэр",
  location: "Сум, газар",
  description: "Тайлбарын түлхүүр үг",
  tags: "Жишээ: хадны зураг"
};

const dropdownSearchTypes = new Set(["name", "category", "period", "province", "location", "tags"]);

function getQueryOptions(searchBy, filters) {
  switch (searchBy) {
    case "name":
      return filters.names || [];
    case "category":
      return filters.categories || [];
    case "period":
      return filters.periods || [];
    case "province":
      return filters.provinces || [];
    case "location":
      return filters.locations || [];
    case "tags":
      return filters.tags || [];
    default:
      return [];
  }
}

function buildAppliedFilters(appliedSearch) {
  if (!appliedSearch) {
    return [];
  }

  const selectedSearchOption =
    searchOptions.find((option) => option.value === appliedSearch.searchBy) || searchOptions[0];
  const filters = [];

  if (appliedSearch.q) {
    filters.push(`${selectedSearchOption.label}: ${appliedSearch.q}`);
  }

  if (appliedSearch.category) {
    filters.push(`Ангилал: ${appliedSearch.category}`);
  }

  if (appliedSearch.province) {
    filters.push(`Аймаг: ${appliedSearch.province}`);
  }

  return filters;
}

export default function SearchPanel({
  query,
  searchBy,
  category,
  province,
  sortByDistance,
  geolocationStatus,
  filters,
  appliedSearch,
  onQueryChange,
  onSearchByChange,
  onCategoryChange,
  onProvinceChange,
  onSortByDistanceChange,
  onSubmit,
  onReset
}) {
  const appliedFilters = buildAppliedFilters(appliedSearch);
  const queryOptions = getQueryOptions(searchBy, filters).filter(Boolean);
  const useQueryDropdown = dropdownSearchTypes.has(searchBy) && queryOptions.length > 0;

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="search-shell">
      <div className="search-copy">
        <p className="eyebrow">Хайлт</p>
        <h2>Юугаар хайхаа сонгоод үр дүнгээ гарга.</h2>
        <p>Нэр, үе, байршил эсвэл шүүлтээр хайж болно.</p>
      </div>

      <form className="search-panel" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="searchBy">Хайх төрөл</label>
          <select
            id="searchBy"
            value={searchBy}
            onChange={(event) => onSearchByChange(event.target.value)}
          >
            {searchOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="category">Ангилал</label>
          <select
            id="category"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            <option value="">Бүгд</option>
            {filters.categories.filter(Boolean).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="field field-wide">
          <label htmlFor="query">Хайх утга</label>
          {useQueryDropdown ? (
            <select id="query" value={query} onChange={(event) => onQueryChange(event.target.value)}>
              <option value="">Сонгох</option>
              {queryOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="query"
              type="search"
              value={query}
              placeholder={placeholders[searchBy] || placeholders.all}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          )}
        </div>

        <div className="field">
          <label htmlFor="province">Аймаг</label>
          <select
            id="province"
            value={province}
            onChange={(event) => onProvinceChange(event.target.value)}
          >
            <option value="">Бүгд</option>
            {filters.provinces.filter(Boolean).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="field field-wide search-distance-toggle">
          <label className="distance-checkbox">
            <input
              type="checkbox"
              checked={Boolean(sortByDistance)}
              onChange={(event) => onSortByDistanceChange(event.target.checked)}
            />
            <span>Миний байршлаас ойрноос эрэмбэлэх</span>
          </label>
          {geolocationStatus === "loading" && (
            <span className="distance-hint">Байршлыг тогтоож байна...</span>
          )}
          {geolocationStatus === "error" && (
            <span className="distance-hint distance-hint-error">
              Байршлыг авч чадсангүй. Хөтчийн зөвшөөрлийг шалгана уу.
            </span>
          )}
          {geolocationStatus === "ready" && sortByDistance && (
            <span className="distance-hint">Байршил амжилттай тогтоогдлоо.</span>
          )}
        </div>

        <div className="field field-wide search-actions">
          <button type="submit" className="action-button">
            Хайх
          </button>
          <button type="button" className="secondary-button" onClick={onReset}>
            Цэвэрлэх
          </button>
        </div>

        {appliedFilters.length > 0 && (
          <div className="field-wide search-summary">
            <div className="search-summary-header">
              <strong>Сүүлийн хайлт</strong>
            </div>
            <div className="search-summary-chips">
              {appliedFilters.map((item) => (
                <span key={item} className="tag">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
