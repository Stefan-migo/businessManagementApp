"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  Quote, 
  Heart, 
  Award,
  ChevronLeft,
  ChevronRight 
} from "lucide-react";

interface TestimonialCardProps {
  id: string;
  name: string;
  location?: string;
  avatar?: string;
  rating: number;
  testimonial: string;
  productOrService?: string;
  category: 'producto' | 'servicio' | 'membresia';
  date: string;
  isVerified?: boolean;
  images?: string[];
  className?: string;
}

export default function TestimonialCard({
  id,
  name,
  location,
  avatar,
  rating,
  testimonial,
  productOrService,
  category,
  date,
  isVerified = false,
  images = [],
  className = "",
}: TestimonialCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < Math.floor(rating)
            ? 'fill-dorado text-dorado'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getCategoryBadge = () => {
    switch (category) {
      case 'producto':
        return (
          <Badge variant="secondary" className="bg-verde-suave/20 text-verde-suave">
            Producto
          </Badge>
        );
      case 'servicio':
        return (
          <Badge variant="secondary" className="bg-turquesa-claro/20 text-turquesa-claro">
            Servicio
          </Badge>
        );
      case 'membresia':
        return (
          <Badge variant="secondary" className="bg-dorado/20 text-azul-profundo">
            Membresía
          </Badge>
        );
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${className}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={name}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-dorado/20 flex items-center justify-center">
                  <span className="text-azul-profundo font-semibold text-lg">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {isVerified && (
                <div className="absolute -top-1 -right-1 bg-verde-suave rounded-full p-1">
                  <Award className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-azul-profundo">{name}</h4>
                {isVerified && (
                  <Badge variant="secondary" className="text-xs bg-verde-suave/20 text-verde-suave">
                    Verificado
                  </Badge>
                )}
              </div>
              {location && (
                <p className="text-sm text-tierra-media">{location}</p>
              )}
            </div>
          </div>

          {/* Category Badge */}
          {getCategoryBadge()}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center">
            {renderStars(rating)}
          </div>
          <span className="text-sm font-medium text-azul-profundo">
            {rating}/5
          </span>
        </div>

        {/* Quote Icon */}
        <div className="mb-4">
          <Quote className="h-8 w-8 text-dorado/30" />
        </div>

        {/* Testimonial Text */}
        <blockquote className="text-tierra-media mb-4 leading-relaxed">
          "{testimonial}"
        </blockquote>

        {/* Product/Service Reference */}
        {productOrService && (
          <div className="mb-4 p-3 bg-verde-suave/10 rounded-lg">
            <p className="text-sm text-azul-profundo">
              <strong>Sobre:</strong> {productOrService}
            </p>
          </div>
        )}

        {/* Testimonial Images */}
        {images.length > 0 && (
          <div className="mb-4">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-verde-suave/10">
              <Image
                src={images[currentImageIndex]}
                alt={`Foto de testimonial ${currentImageIndex + 1}`}
                fill
                className="object-cover"
              />
              
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Image Indicators */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        className={`h-2 w-2 rounded-full transition-colors ${
                          index === currentImageIndex
                            ? 'bg-white'
                            : 'bg-white/50'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-tierra-media">
          <span>{formatDate(date)}</span>
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4 text-coral-suave" />
            <span>Testimonial verificado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 