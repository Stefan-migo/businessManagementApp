'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StarDisplay } from './StarRating';
import { Badge } from '@/components/ui/badge';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MoreVertical, 
  Flag,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReviewItemProps {
  review: {
    id: string;
    rating: number;
    title?: string;
    comment?: string;
    is_verified_purchase: boolean;
    created_at: string;
    updated_at: string;
    user_id?: string;
    user?: {
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
  };
  currentUserId?: string;
  onEdit?: (review: any) => void;
  onDelete?: (reviewId: string) => void;
  className?: string;
}

export function ReviewItem({
  review,
  currentUserId,
  onEdit,
  onDelete,
  className
}: ReviewItemProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [helpfulness, setHelpfulness] = useState(() => {
    const helpful = review.helpfulness?.filter(v => v.is_helpful).length || 0;
    const notHelpful = review.helpfulness?.filter(v => !v.is_helpful).length || 0;
    const userVote = review.helpfulness?.find(v => v.user_id === currentUserId);
    
    return {
      helpful,
      notHelpful,
      userVote: userVote?.is_helpful
    };
  });

  const isOwner = currentUserId && review.user_id && currentUserId === review.user_id;
  const userName = review.user?.user_metadata?.full_name || 
                  review.user?.email?.split('@')[0] || 
                  'Usuario';

  const handleHelpfulnessVote = async (isHelpful: boolean) => {
    if (!currentUserId) {
      toast.error('Debes iniciar sesión para votar');
      return;
    }

    if (isOwner) {
      toast.error('No puedes votar en tu propia reseña');
      return;
    }

    setIsVoting(true);

    try {
      const response = await fetch(`/api/reviews/${review.id}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUserId,
          is_helpful: isHelpful,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al votar');
      }

      setHelpfulness(data.helpfulness);
      toast.success('Voto registrado exitosamente');

    } catch (error) {
      console.error('Error voting on review:', error);
      toast.error('Error al votar. Por favor intenta de nuevo.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleRemoveVote = async () => {
    if (!currentUserId) return;

    setIsVoting(true);

    try {
      const response = await fetch(
        `/api/reviews/${review.id}/helpful?user_id=${currentUserId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al remover voto');
      }

      setHelpfulness(data.helpfulness);
      toast.success('Voto removido exitosamente');

    } catch (error) {
      console.error('Error removing vote:', error);
      toast.error('Error al remover voto. Por favor intenta de nuevo.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleReport = () => {
    toast.info('Función de reporte próximamente disponible');
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              
              {/* User Info */}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{userName}</p>
                  {review.is_verified_purchase && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      Compra verificada
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(review.created_at), { 
                    addSuffix: true, 
                    locale: es 
                  })}
                </p>
              </div>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner ? (
                  <>
                    <DropdownMenuItem onClick={() => onEdit?.(review)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(review.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={handleReport}>
                    <Flag className="h-4 w-4 mr-2" />
                    Reportar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <StarDisplay rating={review.rating} size="sm" />
            <span className="text-sm text-gray-600">
              {review.rating}/5
            </span>
          </div>

          {/* Title */}
          {review.title && (
            <h4 className="font-semibold text-gray-900">
              {review.title}
            </h4>
          )}

          {/* Comment */}
          {review.comment && (
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {review.comment}
            </p>
          )}

          {/* Helpfulness */}
          {!isOwner && (
            <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-600">¿Te resultó útil esta reseña?</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHelpfulnessVote(true)}
                  disabled={isVoting}
                  className={`h-8 px-2 ${
                    helpfulness.userVote === true 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  {helpfulness.helpful}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHelpfulnessVote(false)}
                  disabled={isVoting}
                  className={`h-8 px-2 ${
                    helpfulness.userVote === false 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  {helpfulness.notHelpful}
                </Button>
                {helpfulness.userVote !== undefined && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveVote}
                    disabled={isVoting}
                    className="h-8 px-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Remover voto
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
