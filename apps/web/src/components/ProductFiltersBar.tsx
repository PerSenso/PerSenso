"use client";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  genderCategories,
  concentrations,
  sortLabels,
  type SortOption,
} from "@/hooks/use-product-filters";

interface ProductFiltersBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedGenders: string[];
  setSelectedGenders: (g: string[]) => void;
  toggleGender: (cat: string) => void;
  selectedBrand: string;
  setSelectedBrand: (b: string) => void;
  selectedConcentration: string;
  setSelectedConcentration: (c: string) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  brands: string[];
  activeFilterCount: number;
  clearFilters: () => void;
}

const ProductFiltersBar = ({
  searchQuery, setSearchQuery,
  selectedGenders, setSelectedGenders, toggleGender,
  selectedBrand, setSelectedBrand,
  selectedConcentration, setSelectedConcentration,
  sortBy, setSortBy,
  showFilters, setShowFilters,
  brands, activeFilterCount, clearFilters,
}: ProductFiltersBarProps) => {
  return (
    <div className="mb-8 space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ps-text-muted)" }} />
        <input
          type="text"
          placeholder="Buscar por nombre o marca..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm transition-all duration-300 outline-none"
          style={{
            background: "var(--ps-input-bg)",
            border: "1px solid var(--ps-input-border)",
            color: "var(--ps-input-text)",
          }}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedGenders([])}
          className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-full transition-all duration-300"
          style={{
            background: selectedGenders.length === 0 ? "linear-gradient(135deg, var(--ps-gold-dark), var(--ps-gold))" : "var(--ps-surface)",
            color: selectedGenders.length === 0 ? "#0d0d0f" : "var(--ps-text-muted)",
            border: selectedGenders.length === 0 ? "none" : "1px solid var(--ps-border)",
          }}
        >
          Todos
        </button>
        {genderCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => toggleGender(cat)}
            className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-full transition-all duration-300"
            style={{
              background: selectedGenders.includes(cat) ? "linear-gradient(135deg, var(--ps-gold-dark), var(--ps-gold))" : "var(--ps-surface)",
              color: selectedGenders.includes(cat) ? "#0d0d0f" : "var(--ps-text-muted)",
              border: selectedGenders.includes(cat) ? "none" : "1px solid var(--ps-border)",
            }}
          >
            {cat}
          </button>
        ))}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="relative ml-auto px-4 py-2 text-[11px] font-semibold rounded-full transition-all duration-300 flex items-center gap-1.5"
          style={{
            background: showFilters || activeFilterCount > 0 ? "linear-gradient(135deg, var(--ps-gold-dark), var(--ps-gold))" : "var(--ps-surface)",
            color: showFilters || activeFilterCount > 0 ? "#0d0d0f" : "var(--ps-text-muted)",
            border: showFilters || activeFilterCount > 0 ? "none" : "1px solid var(--ps-border)",
          }}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtros
          {activeFilterCount > 0 && (
            <span
              className="ml-0.5 text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold"
              style={{ background: "#0d0d0f", color: "var(--ps-gold)" }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div
          className="p-5 rounded-xl animate-slide-down"
          style={{
            background: "var(--ps-card-bg)",
            border: "1px solid var(--ps-card-border)",
            boxShadow: "var(--ps-card-shadow)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--ps-text-soft)" }}>
              Filtros avanzados
            </h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-[11px] flex items-center gap-1 transition-colors font-medium"
                style={{ color: "var(--ps-text-muted)" }}
              >
                <X className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] mb-1 uppercase tracking-wider font-medium" style={{ color: "var(--ps-text-muted)" }}>Marca</label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-full text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[10px] mb-1 uppercase tracking-wider font-medium" style={{ color: "var(--ps-text-muted)" }}>Concentración</label>
              <Select value={selectedConcentration} onValueChange={setSelectedConcentration}>
                <SelectTrigger className="w-full text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {concentrations.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[10px] mb-1 uppercase tracking-wider font-medium" style={{ color: "var(--ps-text-muted)" }}>Ordenar por</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-full text-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(sortLabels) as [SortOption, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFiltersBar;
