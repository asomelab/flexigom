import { Link } from "react-router";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useProducts } from "../hooks/use-products";
import { useProductFilters } from "../hooks/use-product-filters";
import { ProductsFilter } from "../components/products-filter";
import { ProductsHeader } from "../components/products-header";
import { ProductsGrid } from "../components/products-grid";
import { ProductsPagination } from "../components/products-pagination";
import { SEOHead } from "@/components/seo";
import { createPageSEO, createBreadcrumbSchema } from "@/lib/seo";
import { useMemo } from "react";
import { useCategories } from "@/features/home/hooks/use-categories";

export function ProductsPage() {
  const {
    filters,
    tempPriceRange,
    setTempPriceRange,
    handleBrandFilter,
    handleCompositionFilter,
    handleMeasurementFilter,
    handleCategoryFilter,
    handlePriceRangeChange,
    handleSortChange,
    handlePageChange,
    clearFilters,
    hasActiveFilters,
  } = useProductFilters();

  const { data, isLoading, error } = useProducts(filters);
  const { data: categories } = useCategories();

  const products = data?.products || [];
  const pagination = data?.pagination;

  // Find the current category if filtering by category
  const currentCategory = useMemo(() => {
    if (!filters.categories?.length || !categories?.length) return null;
    return categories.find((cat) => cat.slug === filters.categories![0]);
  }, [filters.categories, categories]);

  const seoConfig = useMemo(() => {
    const hasCategories = filters.categories && filters.categories.length > 0;
    const categoryName = hasCategories ? filters.categories![0] : null;
    const searchQuery = filters.search?.trim();

    // Search results page
    if (searchQuery) {
      const title = `Resultados de búsqueda: "${searchQuery}" - Flexigom Tucumán`;
      const description = `${pagination?.total ? `${pagination.total} resultados encontrados` : "Resultados"} para "${searchQuery}" en Flexigom. Especialistas en productos de descanso en Tucumán con más de 20 años de experiencia.`;

      return createPageSEO({
        title,
        description,
        path: `/productos?search=${encodeURIComponent(searchQuery)}`,
        keywords: [
          `${searchQuery} Tucumán`,
          `buscar ${searchQuery}`,
          `${searchQuery} Flexigom`,
        ],
      });
    }

    // Category page
    if (categoryName) {
      const title = `${categoryName} en Tucumán - Flexigom | Especialistas en Descanso`;
      const description = `Descubrí nuestra selección de ${categoryName.toLowerCase()} en Tucumán. ${pagination?.total ? `${pagination.total} productos disponibles.` : ""} Flexigom, especialistas en productos de descanso con más de 20 años de experiencia.`;

      return createPageSEO({
        title,
        description,
        path: `/productos?category=${categoryName.toLowerCase()}`,
        keywords: [
          `${categoryName.toLowerCase()} Tucumán`,
          `comprar ${categoryName.toLowerCase()}`,
          `tienda ${categoryName.toLowerCase()} Tucumán`,
        ],
      });
    }

    // Default products page
    const title = "Productos de Descanso en Tucumán - Flexigom";
    const description = `Explorá nuestra amplia selección de productos de descanso en Tucumán. ${pagination?.total ? `${pagination.total} productos disponibles.` : ""} Colchones y sommiers de la mejor calidad. Más de 20 años de experiencia.`;

    return createPageSEO({
      title,
      description,
      path: "/productos",
      keywords: [
        "productos de descanso Tucumán",
        "catálogo Flexigom",
        "tienda completa colchones",
      ],
    });
  }, [filters.categories, filters.search, pagination?.total]);

  // Generate breadcrumb structured data
  const breadcrumbSchema = useMemo(() => {
    const breadcrumbs = [
      { name: "Inicio", url: "/" },
      { name: "Productos", url: "/productos" },
    ];

    // Add search context to breadcrumbs if searching
    if (filters.search?.trim()) {
      breadcrumbs.push({
        name: `Búsqueda: "${filters.search.trim()}"`,
        url: `/productos?search=${encodeURIComponent(filters.search.trim())}`,
      });
    }
    // Add category to breadcrumbs if filtering by category (and not searching)
    else if (currentCategory) {
      breadcrumbs.push({
        name: currentCategory.name,
        url: `/productos?category=${currentCategory.slug}`,
      });
    }

    return createBreadcrumbSchema(breadcrumbs);
  }, [currentCategory, filters.search]);

  if (error) {
    return (
      <div className="flex justify-center items-center py-16">
        <p className="text-gray-500">Error al cargar los productos</p>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        config={{
          ...seoConfig,
          structuredData: breadcrumbSchema,
        }}
      />
      <div className="px-4 py-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Inicio</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {(currentCategory && !filters.search?.trim()) ||
              filters.search?.trim() ? (
                <BreadcrumbLink asChild>
                  <Link to="/productos">Productos</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>Productos</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {filters.search?.trim() && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    Búsqueda: "{filters.search.trim()}"
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
            {currentCategory && !filters.search?.trim() && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentCategory.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden md:block flex-shrink-0 w-64">
            <ProductsFilter
              selectedBrands={filters.brands || []}
              selectedCompositions={filters.compositions || []}
              selectedMeasurements={filters.measurements || []}
              selectedCategories={filters.categories || []}
              tempPriceRange={tempPriceRange}
              hasActiveFilters={hasActiveFilters() ?? false}
              onBrandChange={handleBrandFilter}
              onCompositionChange={handleCompositionFilter}
              onMeasurementChange={handleMeasurementFilter}
              onCategoryChange={handleCategoryFilter}
              onTempPriceRangeChange={setTempPriceRange}
              onPriceRangeCommit={handlePriceRangeChange}
              onClearFilters={clearFilters}
            />
          </aside>

          {/* Main Content */}
          <main id="productos" className="flex-1 w-full sm:px-6 ">
            <ProductsHeader
              isLoading={isLoading}
              totalProducts={pagination?.total || products.length}
              currentPage={pagination?.page}
              totalPages={pagination?.pageCount}
              sortBy={filters.sortBy}
              onSortChange={handleSortChange}
              hasActiveFilters={hasActiveFilters() ?? false}
              onClearFilters={clearFilters}
              filters={filters}
              tempPriceRange={tempPriceRange}
              onBrandChange={handleBrandFilter}
              onCompositionChange={handleCompositionFilter}
              onMeasurementChange={handleMeasurementFilter}
              onCategoryChange={handleCategoryFilter}
              onTempPriceRangeChange={setTempPriceRange}
              onPriceRangeCommit={handlePriceRangeChange}
            />

            <ProductsGrid
              products={products}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters() ?? false}
              onClearFilters={clearFilters}
            />

            {pagination && (
              <ProductsPagination
                pagination={pagination}
                isLoading={isLoading}
                onPageChange={handlePageChange}
              />
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export const Component = ProductsPage;
