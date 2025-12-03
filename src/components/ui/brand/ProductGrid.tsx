"use client";

import { useState, useMemo } from "react";
import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { 
  Search, 
  SlidersHorizontal, 
  Grid3X3, 
  Grid2X2, 
  Filter,
  X,
  ArrowUpDown,
  Star,
  TrendingUp
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  isNatural?: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
  stock: number;
  size?: string;
  tags?: string[];
  lineTheme?: 'alma-terra' | 'ecos' | 'jade-ritual' | 'umbral' | 'utopica' | 'default';
}

interface ProductGridProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'elegant' | 'artisanal' | 'glass';
  lineTheme?: 'alma-terra' | 'ecos' | 'jade-ritual' | 'umbral' | 'utopica' | 'default';
  showFilters?: boolean;
  showSearch?: boolean;
  showSorting?: boolean;
  showGridToggle?: boolean;
  initialGridCols?: 2 | 3 | 4;
  onAddToCart?: (productId: string, quantity: number) => void;
  onToggleFavorite?: (productId: string) => void;
  favoriteProducts?: string[];
  className?: string;
}

const sortOptions = [
  { value: 'featured', label: 'Destacados', icon: Star },
  { value: 'name-asc', label: 'Nombre A-Z', icon: ArrowUpDown },
  { value: 'name-desc', label: 'Nombre Z-A', icon: ArrowUpDown },
  { value: 'price-asc', label: 'Precio: Menor a Mayor', icon: TrendingUp },
  { value: 'price-desc', label: 'Precio: Mayor a Menor', icon: TrendingUp },
  { value: 'rating', label: 'Mejor Valorados', icon: Star },
  { value: 'newest', label: 'Más Nuevos', icon: Star }
];

const gridColsClasses = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
};

export default function ProductGrid({
  products,
  title,
  subtitle,
  variant = 'default',
  lineTheme = 'default',
  showFilters = true,
  showSearch = true,
  showSorting = true,
  showGridToggle = true,
  initialGridCols = 3,
  onAddToCart,
  onToggleFavorite,
  favoriteProducts = [],
  className = ""
}: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState("featured");
  const [gridCols, setGridCols] = useState(initialGridCols);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Get unique categories from products
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return cats.filter(Boolean);
  }, [products]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = `${product.name} ${product.description} ${product.category}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      // Category filter
      if (selectedCategory !== "all" && product.category !== selectedCategory) {
        return false;
      }

      // Price range filter
      if (selectedPriceRange !== "all") {
        const price = product.price;
        switch (selectedPriceRange) {
          case "0-1000":
            if (price > 1000) return false;
            break;
          case "1000-5000":
            if (price < 1000 || price > 5000) return false;
            break;
          case "5000-10000":
            if (price < 5000 || price > 10000) return false;
            break;
          case "10000+":
            if (price < 10000) return false;
            break;
        }
      }

      return true;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "newest":
          return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        default:
          // Featured - prioritize new, on sale, high rating
          const aScore = (a.isNew ? 3 : 0) + (a.isOnSale ? 2 : 0) + a.rating;
          const bScore = (b.isNew ? 3 : 0) + (b.isOnSale ? 2 : 0) + b.rating;
          return bScore - aScore;
      }
    });

    return filtered;
  }, [products, searchQuery, selectedCategory, selectedPriceRange, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedPriceRange("all");
    setSortBy("featured");
  };

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || selectedPriceRange !== "all" || sortBy !== "featured";

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="text-center mb-8">
          {subtitle && (
            <p className="text-text-secondary text-lg mb-2">{subtitle}</p>
          )}
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              {title}
            </h2>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Search */}
        {showSearch && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary h-4 w-4" />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Controls Row */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Filters Toggle */}
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={cn(
                "transition-all duration-300",
                showFiltersPanel && "bg-brand-primary/10 border-brand-primary text-brand-primary"
              )}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <Badge className="ml-2 bg-brand-primary text-white text-xs">
                  •
                </Badge>
              )}
            </Button>
          )}

          {/* Sorting */}
          {showSorting && (
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center">
                      <option.icon className="h-4 w-4 mr-2" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Grid Toggle */}
          {showGridToggle && (
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={gridCols === 2 ? "default" : "ghost"}
                size="sm"
                onClick={() => setGridCols(2)}
                className="h-8 w-8 p-0"
              >
                <Grid2X2 className="h-4 w-4" />
              </Button>
              <Button
                variant={gridCols === 3 ? "default" : "ghost"}
                size="sm"
                onClick={() => setGridCols(3)}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={gridCols === 4 ? "default" : "ghost"}
                size="sm"
                onClick={() => setGridCols(4)}
                className="h-8 w-8 p-0"
              >
                <div className="grid grid-cols-2 gap-0.5 h-4 w-4">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && showFiltersPanel && (
        <div className="bg-white border border-border rounded-lg p-6 mb-8 transition-all duration-300">
          <div className="flex flex-wrap gap-6">
            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Categoría</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Rango de Precio</label>
              <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los precios</SelectItem>
                  <SelectItem value="0-1000">Hasta $1,000</SelectItem>
                  <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                  <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                  <SelectItem value="10000+">Más de $10,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-brand-primary hover:text-brand-primary/80"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Info */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-text-secondary">
          {filteredAndSortedProducts.length} producto{filteredAndSortedProducts.length !== 1 ? 's' : ''} encontrado{filteredAndSortedProducts.length !== 1 ? 's' : ''}
        </p>
        
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Filtros activos:</span>
            <div className="flex gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Búsqueda: "{searchQuery}"
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  {selectedCategory}
                </Badge>
              )}
              {selectedPriceRange !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Precio: {selectedPriceRange}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            No se encontraron productos
          </h3>
          <p className="text-text-secondary mb-6">
            Intenta ajustar tus filtros de búsqueda
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className={cn(
          "grid gap-6 transition-all duration-300",
          gridColsClasses[gridCols]
        )}>
          {filteredAndSortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              price={product.price}
              originalPrice={product.originalPrice}
              category={product.category}
              imageUrl={product.imageUrl}
              rating={product.rating}
              reviewCount={product.reviewCount}
              isNatural={product.isNatural}
              isNew={product.isNew}
              isOnSale={product.isOnSale}
              stock={product.stock}
              size={product.size}
              variant={variant}
              lineTheme={product.lineTheme || lineTheme}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
} 