'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from './StarRating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';

interface ReviewFormProps {
  productId: string;
  userId: string;
  existingReview?: {
    id: string;
    rating: number;
    title?: string;
    comment?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function ReviewForm({
  productId,
  userId,
  existingReview,
  onSuccess,
  onCancel,
  className
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!existingReview;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Por favor selecciona una calificación');
      return;
    }

    if (!title.trim()) {
      toast.error('Por favor ingresa un título para tu reseña');
      return;
    }

    if (!comment.trim()) {
      toast.error('Por favor escribe un comentario');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing 
        ? `/api/products/${productId}/reviews/${existingReview.id}`
        : `/api/products/${productId}/reviews`;

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          title: title.trim(),
          comment: comment.trim(),
          user_id: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar la reseña');
      }

      toast.success(
        isEditing 
          ? 'Reseña actualizada exitosamente' 
          : '¡Gracias por tu reseña! Tu opinión es muy valiosa para nosotros.'
      );

      // Reset form if not editing
      if (!isEditing) {
        setRating(0);
        setTitle('');
        setComment('');
      }

      onSuccess?.();

    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Error al enviar la reseña. Por favor intenta de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview || !confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/products/${productId}/reviews/${existingReview.id}?user_id=${userId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar la reseña');
      }

      toast.success('Reseña eliminada exitosamente');
      onSuccess?.();

    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Error al eliminar la reseña. Por favor intenta de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">
          {isEditing ? 'Editar Reseña' : 'Escribir Reseña'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Calificación *
            </label>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              interactive
              size="lg"
              className="justify-start"
            />
            {rating === 0 && (
              <p className="text-sm text-red-500">
                Por favor selecciona una calificación
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Título de la reseña *
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resume tu experiencia con este producto"
              maxLength={255}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              {title.length}/255 caracteres
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Comentario *
            </label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comparte tu experiencia detallada con este producto..."
              rows={4}
              maxLength={1000}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              {comment.length}/1000 caracteres
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0 || !title.trim() || !comment.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Actualizando...' : 'Enviando...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {isEditing ? 'Actualizar Reseña' : 'Enviar Reseña'}
                </>
              )}
            </Button>

            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                Eliminar
              </Button>
            )}

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
