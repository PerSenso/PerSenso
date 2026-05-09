"use client";
import { useState, useMemo } from "react";
import { fuzzyMatch } from "@/lib/fuzzy-search";

export interface FilterableProduct {
  name: string;
  brand: string;
  salePrice: number;
  gender: string;
  concentration: string;
  stock: number;
}

export const genderCategories = ["Hombre", "Mujer", "Unisex"];
export const concentrations = ["Todas", "EDC", "EDT", "EDP", "Parfum"];

export type SortOption = "name-asc" | "name-desc" | "price-asc" | "price-desc";

export const sortLabels: Record<SortOption, string> = {
  "name-asc": "Nombre A-Z",
  "name-desc": "Nombre Z-A",
  "price-asc": "Precio: menor a mayor",
  "price-desc": "Precio: mayor a menor",
};

export function useProductFilters<T extends FilterableProduct>(products: T[]) {
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Todas");
  const [selectedConcentration, setSelectedConcentration] = useState("Todas");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [showFilters, setShowFilters] = useState(false);

  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
    return ["Todas", ...uniqueBrands];
  }, [products]);

  const activeFilterCount = [
    selectedBrand !== "Todas",
    selectedConcentration !== "Todas",
  ].filter(Boolean).length;

  const filtered = useMemo(() => {
    return products
      .filter((p) => selectedGenders.length === 0 || selectedGenders.includes(p.gender))
      .filter((p) => selectedBrand === "Todas" || p.brand === selectedBrand)
      .filter((p) => selectedConcentration === "Todas" || p.concentration === selectedConcentration)
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        return fuzzyMatch(p.name, searchQuery) || fuzzyMatch(p.brand, searchQuery);
      })
      .sort((a, b) => {
        if (a.stock <= 0 && b.stock > 0) return 1;
        if (a.stock > 0 && b.stock <= 0) return -1;
        switch (sortBy) {
          case "name-asc": return a.name.localeCompare(b.name, "es");
          case "name-desc": return b.name.localeCompare(a.name, "es");
          case "price-asc": return a.salePrice - b.salePrice;
          case "price-desc": return b.salePrice - a.salePrice;
          default: return 0;
        }
      });
  }, [products, selectedGenders, selectedBrand, selectedConcentration, searchQuery, sortBy]);

  const clearFilters = () => {
    setSelectedBrand("Todas");
    setSelectedConcentration("Todas");
    setSortBy("name-asc");
  };

  const toggleGender = (cat: string) => {
    setSelectedGenders((prev) => {
      const next = prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat];
      return next.length === genderCategories.length ? [] : next;
    });
  };

  return {
    filtered,
    searchQuery, setSearchQuery,
    selectedGenders, setSelectedGenders, toggleGender,
    selectedBrand, setSelectedBrand,
    selectedConcentration, setSelectedConcentration,
    sortBy, setSortBy,
    showFilters, setShowFilters,
    brands, activeFilterCount, clearFilters,
  };
}
