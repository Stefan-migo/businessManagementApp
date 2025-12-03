'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showHalfStars?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  onRatingChange,
  interactive = false,
  size = 'md',
  showHalfStars = false,
  className
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleMouseEnter = (starRating: number) => {
    if (interactive) {
      setHoverRating(starRating);
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
      setIsHovering(false);
    }
  };

  const handleClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const getStarFill = (starNumber: number) => {
    const currentRating = isHovering ? hoverRating : rating;
    
    if (showHalfStars) {
      if (currentRating >= starNumber) {
        return 'fill'; // Full star
      } else if (currentRating >= starNumber - 0.5) {
        return 'half'; // Half star
      } else {
        return 'empty'; // Empty star
      }
    } else {
      return currentRating >= starNumber ? 'fill' : 'empty';
    }
  };

  const renderStar = (starNumber: number) => {
    const fill = getStarFill(starNumber);
    const isInteractive = interactive;
    
    return (
      <button
        key={starNumber}
        type="button"
        className={cn(
          'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#AE000060]',
          isInteractive && 'cursor-pointer hover:scale-110 transform',
          !isInteractive && 'cursor-default'
        )}
        onMouseEnter={() => handleMouseEnter(starNumber)}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleClick(starNumber)}
        disabled={!isInteractive}
        aria-label={`Rate ${starNumber} star${starNumber > 1 ? 's' : ''}`}
      >
        <Star
          className={cn(
            sizeClasses[size],
            'transition-colors duration-150',
            fill === 'fill' && 'text-[#AE000060]',
            fill === 'half' && 'text-[#AE000060]',
            fill === 'empty' && 'text-[#AE000060]',
            isInteractive && 'hover:text-[#AE000060]'
          )}
          fill={fill === 'fill' ? 'currentColor' : 'none'}
        />
        {fill === 'half' && (
          <div className="absolute inset-0 overflow-hidden">
            <Star
              className={cn(sizeClasses[size], 'text-yellow-400')}
              fill="currentColor"
              style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}
            />
          </div>
        )}
      </button>
    );
  };

  return (
    <div 
      className={cn(
        'flex items-center gap-1',
        className
      )}
      role="radiogroup"
      aria-label={`Rating: ${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map(renderStar)}
      {interactive && (
        <span className="ml-2 text-sm text-gray-500">
          {isHovering ? hoverRating : rating}/5
        </span>
      )}
    </div>
  );
}

// Display-only version for showing ratings
export function StarDisplay({
  rating,
  size = 'md',
  showHalfStars = true,
  className
}: Omit<StarRatingProps, 'interactive' | 'onRatingChange'>) {
  return (
    <StarRating
      rating={rating}
      interactive={false}
      size={size}
      showHalfStars={showHalfStars}
      className={className}
    />
  );
}
