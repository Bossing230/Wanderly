export default function FilterPanel({ categories, category, setCategory, sort, setSort, country, setCountry }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {categories.map((c) => (
        <button key={c} onClick={() => setCategory(c)} className={`chip capitalize ${category === c ? 'chip-on' : ''}`} aria-pressed={category === c}>{c}</button>
      ))}
      {(setSort || setCountry) && <span className="mx-1 hidden h-6 w-px bg-line sm:block" />}
      {setSort && (
        <select className="input !w-auto" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort results">
          <option value="relevance">Most relevant</option><option value="name">Name A–Z</option>
        </select>
      )}
      {setCountry && <input className="input !w-32" maxLength={2} placeholder="Country (PH)" value={country} onChange={(e) => setCountry(e.target.value.toLowerCase())} aria-label="Country code" />}
    </div>
  );
}
