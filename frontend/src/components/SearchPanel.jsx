export default function SearchPanel({
  query,
  category,
  province,
  filters,
  onQueryChange,
  onCategoryChange,
  onProvinceChange
}) {
  return (
    <section className="search-panel">
      <div className="field">
        <label htmlFor="search">Хайлт</label>
        <input
          id="search"
          type="search"
          placeholder="Нэр, түлхүүр үг, байршил, үеэр хайх"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="category">Ангилал</label>
        <select
          id="category"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="">Бүх ангилал</option>
          {filters.categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="province">Аймаг</label>
        <select
          id="province"
          value={province}
          onChange={(event) => onProvinceChange(event.target.value)}
        >
          <option value="">Бүх аймаг</option>
          {filters.provinces.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
