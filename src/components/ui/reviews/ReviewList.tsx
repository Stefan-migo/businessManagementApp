'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewItem } from './ReviewItem';
import { StarDisplay } from './StarRating';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  Filter,
  Star,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ReviewListProps {
  productId: string;
  currentUserId?: string;
  onEditReview?: (review: any) => void;
  onDeleteReview?: (reviewId: string) => void;
  className?: string;
}

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  helpfulness?: Array<{
    id: string;
    is_helpful: boolean;
    user_id: string;
  }>;
}

export function ReviewList({
  productId,
  currentUserId,
  onEditReview,
  onDeleteReview,
  className
}: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [ratingFilter, setRatingFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchReviews = async (pageNum: number = 1, reset: boolean = true) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        sort_by: sortBy,
        ...(ratingFilter && { rating: ratingFilter })
      });

      const response = await fetch(`/api/products/${productId}/reviews?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar reseñas');
      }

      if (reset) {
        setReviews(data.reviews);
      } else {
        setReviews(prev => [...prev, ...data.reviews]);
      }

      setSummary(data.summary);
      setHasMore(data.pagination.hasMore);
      setPage(pageNum);

    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReviews(1, true);
  }, [productId, sortBy, ratingFilter]);

  const handleLoadMore = () => {
    fetchReviews(page + 1, false);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
  };

  const handleRatingFilter = (rating: string | null) => {
    setRatingFilter(rating);
  };

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'newest': return 'Más recientes';
      case 'oldest': return 'Más antiguos';
      case 'highest_rating': return 'Mejor calificados';
      case 'lowest_rating': return 'Peor calificados';
      default: return 'Más recientes';
    }
  };

  const getRatingFilterLabel = (rating: string | null) => {
    if (!rating) return 'Todas las calificaciones';
    return `${rating} estrella${rating !== '1' ? 's' : ''}`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Cargando reseñas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Summary */}
      {summary && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Reseñas de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {summary.averageRating.toFixed(1)}
                </div>
                <StarDisplay rating={summary.averageRating} size="lg" />
                <p className="text-sm text-gray-600 mt-2">
                  Basado en {summary.totalReviews} reseña{summary.totalReviews !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = summary.ratingDistribution[rating as keyof typeof summary.ratingDistribution];
                  const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm w-8">{rating}</span>
                      <Star className="w-4 h-4 text-yellow-400" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            {showFilters && (
              <div className="flex flex-wrap items-center gap-4">
                {/* Sort */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Ordenar: {getSortLabel(sortBy)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleSortChange('newest')}>
                      Más recientes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSortChange('oldest')}>
                      Más antiguos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSortChange('highest_rating')}>
                      Mejor calificados
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSortChange('lowest_rating')}>
                      Peor calificados
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Rating Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {getRatingFilterLabel(ratingFilter)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleRatingFilter(null)}>
                      Todas las calificaciones
                    </DropdownMenuItem>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <DropdownMenuItem 
                        key={rating} 
                        onClick={() => handleRatingFilter(rating.toString())}
                      >
                        {rating} estrella{rating !== 1 ? 's' : ''}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Active Filters */}
                {ratingFilter && (
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => handleRatingFilter(null)}
                  >
                    {getRatingFilterLabel(ratingFilter)} ×
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No hay reseñas disponibles para este producto.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              onEdit={onEditReview}
              onDelete={onDeleteReview}
            />
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  'Cargar más reseñas'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
