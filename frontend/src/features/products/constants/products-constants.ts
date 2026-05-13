import type { ProductFilters } from "@/types";

export const DEFAULT_FILTERS: ProductFilters = {
  brands: [],
  compositions: [],
  measurements: [],
  categories: [],
  sortBy: "name",
  page: 1,
  pageSize: 6,
};

export const PRICE_RANGE = {
  MIN: 0,
  MAX: 3000000,
  STEP: 1000,
} as const;

export const DEFAULT_PRICE_RANGE = [PRICE_RANGE.MIN, PRICE_RANGE.MAX];

export const POPULAR_PRICE_RANGES = [
  { label: "$ 0 - $ 300.000", min: 0, max: 300000 },
  { label: "$ 300.000 - $ 800.000", min: 300000, max: 800000 },
  { label: "$ 800.000 - $ 1.200.000", min: 800000, max: 1200000 },
  { label: "$ 1.200.000 - $ 1.500.000", min: 1200000, max: 1500000 },
] as const;

export const BRANDS = ["Flexigom"] as const;

export const COMPOSITIONS = [
  "Espuma de memoria",
  "Resorte",
  "Híbrido",
  "Látex",
  "Espuma",
  "Vellón",
  "Vellón siliconado",
  "Fibra hueca siliconada",
  "Placa de espuma",
] as const;

export const MEASUREMENTS = [
  { label: "Una plaza (0.80x1.90)", value: "Una plaza (0.80x1.90)" },
  {
    label: "Una plaza y media (0.90x1.90)",
    value: "Una plaza y media (0.90x1.90)",
  },
  {
    label: "Una plaza y media (1.00x1.90)",
    value: "Una plaza y media (1.00x1.90)",
  },
  { label: "Dos plazas (1.30x1.90)", value: "Dos plazas (1.30x1.90)" },
  {
    label: "Dos plazas y media (1.40x1.90)",
    value: "Dos plazas y media (1.40x1.90)",
  },
  {
    label: "Dos plazas y media (1.50x1.90)",
    value: "Dos plazas y media (1.50x1.90)",
  },
  { label: "Queen (1.60x2.00)", value: "Queen (1.60x2.00)" },
  { label: "King (1.80x2.00)", value: "King (1.80x2.00)" },
  { label: "King Size (2.00x2.00)", value: "King Size (2.00x2.00)" },
  { label: "70 x 40", value: "M_70x40" },
  { label: "70 x 50", value: "M_70x50" },
  { label: "90 x 40", value: "M_90x40" },
  { label: "90 x 50", value: "M_90x50" },
  { label: "1.00 x 40", value: "M_1.00x40" },
  { label: "1.00 x 50", value: "M_1.00x50" },
] as const;

export const getMeasurementLabel = (value: string) => {
  const measurement = MEASUREMENTS.find((m) => m.value === value);
  return measurement ? measurement.label : value;
};

export const SORT_OPTIONS = [
  { value: "name", label: "Relevancia" },
  { value: "price_asc", label: "Precio: Menor a mayor" },
  { value: "price_desc", label: "Precio: Mayor a menor" },
  { value: "newest", label: "Más recientes" },
] as const;
