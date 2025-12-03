"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProtectedForm } from "@/hooks/useFormProtection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import RichTextEditor from "@/components/ui/RichTextEditor";
import ImageUpload from "@/components/ui/ImageUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Plus, Save, ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showPublishAlert, setShowPublishAlert] = useState(false);
  
  // 🚀 Protected form state with auto data-loss prevention
  const {
    formData,
    updateFormData,
    hasChanges,
    markAsSaving,
    markAsSaved,
    resetForm
  } = useProtectedForm({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: '',
    compare_at_price: '',
    category_id: '',
    featured_image: '',
    gallery: [] as string[],
    inventory_quantity: '0',
    is_featured: false,
    status: 'active',
    skin_type: [] as string[],
    benefits: [] as string[],
    certifications: [] as string[],
    usage_instructions: '',
    precautions: '',
    ingredients: [] as Array<{name: string, percentage?: number}>,
    weight: '',
    dimensions: '',
    package_characteristics: '',
  });

  // Available options
  const skinTypes = [
    { value: 'dry', label: 'Seco' },
    { value: 'oily', label: 'Graso' },
    { value: 'combination', label: 'Mixto' },
    { value: 'sensitive', label: 'Sensible' },
    { value: 'normal', label: 'Normal' },
    { value: 'mature', label: 'Maduro' }
  ];
  const benefitOptions = ['Hidratante', 'Anti-edad', 'Regenerador', 'Nutritivo', 'Tonificante', 'Equilibrante', 'Refrescante', 'Exfoliante', 'Antibacteriano', 'Relajante', 'Aromático'];
  const certificationOptions = [
    { value: 'organic', label: 'Orgánico' },
    { value: 'cruelty-free', label: 'Libre de Crueldad' },
    { value: 'vegan', label: 'Vegano' },
    { value: 'natural', label: 'Natural' },
    { value: 'eco-friendly', label: 'Ecológico' }
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleInputChange = (field: string, value: any) => {
    const updates: any = { [field]: value };

    // Auto-generate slug from name
    if (field === 'name' && value) {
      updates.slug = generateSlug(value);
    }

    updateFormData(updates);
  };

  const addToArray = (field: 'skin_type' | 'benefits' | 'certifications', value: string) => {
    if (!formData[field].includes(value)) {
      updateFormData({
        [field]: [...formData[field], value]
      });
    }
  };

  const removeFromArray = (field: 'skin_type' | 'benefits' | 'certifications', value: string) => {
    updateFormData({
      [field]: formData[field].filter(item => item !== value)
    });
  };

  const addIngredient = () => {
    updateFormData({
      ingredients: [...formData.ingredients, { name: '', percentage: undefined }]
    });
  };

  const removeIngredient = (index: number) => {
    updateFormData({
      ingredients: formData.ingredients.filter((_, i) => i !== index)
    });
  };

  const updateIngredient = (index: number, field: 'name' | 'percentage', value: string | number) => {
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: value
    };
    updateFormData({ ingredients: updatedIngredients });
  };


  const handleSubmit = async (e?: React.FormEvent, status: string = 'active') => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    markAsSaving(); // 🚀 Allow navigation during save process

    try {
      const productData = {
        ...formData,
        status: status,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        inventory_quantity: parseInt(formData.inventory_quantity),
        published_at: status === 'active' ? new Date().toISOString() : null
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        toast.success('Producto creado exitosamente');
        markAsSaved(); // 🚀 Mark as saved to allow navigation
        router.push('/admin/products');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al crear el producto');
        markAsSaved(); // Reset saving state on error
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear el producto');
      markAsSaved(); // Reset saving state on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center gap-4 mb-6">
      <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Agregar Producto</h1>
          {hasChanges && (
            <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full border border-amber-200">
              Cambios sin guardar
            </span>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>


      {/* Product Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Crema Hidratante de Rosa Mosqueta"
                  required
                  className='border-black/20'
                />
              </div>
              <div>
                <Label htmlFor="slug">URL (slug)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="Se genera automáticamente"
                  className='border-black/20'
                />
              </div>
            </div>

            <div>
              <Label htmlFor="short_description">Descripción Corta</Label>
              <RichTextEditor
                value={formData.short_description}
                onChange={(value) => handleInputChange('short_description', value)}
                placeholder="Descripción breve para listados"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción Detallada</Label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => handleInputChange('description', value)}
                placeholder="Descripción completa del producto"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
            <CardTitle>Precios e Inventario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Precio *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  required
                  className='border-black/20'
                />
              </div>
              <div>
                <Label htmlFor="compare_at_price">Precio Comparado</Label>
                <Input
                  id="compare_at_price"
                  type="number"
                  step="0.01"
                  value={formData.compare_at_price}
                  onChange={(e) => handleInputChange('compare_at_price', e.target.value)}
                  placeholder="0.00"
                  className='border-black/20'
                />
              </div>
              <div>
                <Label htmlFor="inventory_quantity">Cantidad en Stock</Label>
                <Input
                  id="inventory_quantity"
                  type="number"
                  value={formData.inventory_quantity}
                  onChange={(e) => handleInputChange('inventory_quantity', e.target.value)}
                  placeholder="0"
                  className='border-black/20'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
            <CardTitle>Categoría</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          </CardContent>
        </Card>

        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
            <CardTitle>Imágenes del Producto</CardTitle>
            <p className="text-sm text-gray-600">Sube imágenes para el producto (máximo 5 imágenes)</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="featured_image">Imagen Principal</Label>
              <ImageUpload
                value={formData.featured_image}
                onChange={(url) => handleInputChange('featured_image', url)}
                placeholder="Seleccionar imagen principal del producto"
              />
            </div>
            
            <div>
              <Label htmlFor="gallery">Galería de Imágenes</Label>
              <p className="text-sm text-gray-500 mb-3">
                Puedes subir hasta 4 imágenes adicionales (máximo 5 en total)
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="relative">
                    <ImageUpload
                      value={formData.gallery[index] || ''}
                      onChange={(url) => {
                        const newGallery = [...formData.gallery];
                        newGallery[index] = url;
                        handleInputChange('gallery', newGallery);
                      }}
                      placeholder={`Imagen ${index + 2}`}
                    />
                    {formData.gallery[index] && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        onClick={() => {
                          const newGallery = [...formData.gallery];
                          newGallery[index] = '';
                          handleInputChange('gallery', newGallery);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
            <CardTitle>Atributos del Producto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Skin Types */}
            <div>
              <Label>Tipos de Piel</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skin_type.map((type) => {
                  const skinTypeLabel = skinTypes.find(st => st.value === type)?.label || type;
                  return (
                  <Badge key={type} variant="secondary" className="flex items-center gap-1">
                      {skinTypeLabel}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('skin_type', type)} />
                  </Badge>
                  );
                })}
              </div>
              <Select onValueChange={(value) => addToArray('skin_type', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Agregar tipo de piel" />
                </SelectTrigger>
                <SelectContent>
                  {skinTypes.filter(type => !formData.skin_type.includes(type.value)).map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Benefits */}
            <div>
              <Label>Beneficios</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.benefits.map((benefit) => (
                  <Badge key={benefit} variant="secondary" className="flex items-center gap-1">
                    {benefit}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('benefits', benefit)} />
                  </Badge>
                ))}
              </div>
              <Select onValueChange={(value) => addToArray('benefits', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Agregar beneficio" />
                </SelectTrigger>
                <SelectContent>
                  {benefitOptions.filter(benefit => !formData.benefits.includes(benefit)).map((benefit) => (
                    <SelectItem key={benefit} value={benefit}>
                      {benefit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Certifications */}
            <div>
              <Label>Certificaciones</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.certifications.map((cert) => {
                  const certLabel = certificationOptions.find(co => co.value === cert)?.label || cert;
                  return (
                  <Badge key={cert} variant="secondary" className="flex items-center gap-1">
                      {certLabel}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray('certifications', cert)} />
                  </Badge>
                  );
                })}
              </div>
              <Select onValueChange={(value) => addToArray('certifications', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Agregar certificación" />
                </SelectTrigger>
                <SelectContent>
                  {certificationOptions.filter(cert => !formData.certifications.includes(cert.value)).map((cert) => (
                    <SelectItem key={cert.value} value={cert.value}>
                      {cert.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ingredients */}
            <div>
              <Label>Ingredientes</Label>
              <div className="space-y-3 mt-2">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Nombre del ingrediente"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="%"
                      value={ingredient.percentage || ''}
                      onChange={(e) => updateIngredient(index, 'percentage', parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addIngredient}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Ingrediente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
            <CardTitle>Instrucciones de Uso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="usage_instructions">Instrucciones de Uso</Label>
              <RichTextEditor
                value={formData.usage_instructions}
                onChange={(value) => handleInputChange('usage_instructions', value)}
                placeholder="Cómo usar el producto"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="precautions">Precauciones</Label>
              <RichTextEditor
                value={formData.precautions}
                onChange={(value) => handleInputChange('precautions', value)}
                placeholder="Advertencias y precauciones"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Physical Details */}
        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
            <CardTitle>Detalles Físicos</CardTitle>
            <p className="text-sm text-gray-600">Información sobre peso, dimensiones y características del empaque</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Peso (gramos)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="Ej: 500"
                  className='border-black/20'
                />
              </div>
              <div>
                <Label htmlFor="dimensions">Dimensiones</Label>
                <Input
                  id="dimensions"
                  value={formData.dimensions}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                  placeholder="Ej: 15x10x5 cm"
                  className='border-black/20'
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="package_characteristics">Características del Empaque</Label>
              <RichTextEditor
                value={formData.package_characteristics}
                onChange={(value) => handleInputChange('package_characteristics', value)}
                placeholder="Describe las características específicas del empaque, materiales, diseño, etc."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            disabled={loading}
            onClick={() => handleSubmit(undefined, 'draft')}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar como Borrador'}
          </Button>
          <Button 
            type="button" 
            disabled={loading} 
            onClick={() => setShowPublishAlert(true)}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar Producto'}
          </Button>
        </div>
      </form>

      {/* Publish Alert Dialog */}
      <Dialog open={showPublishAlert} onOpenChange={setShowPublishAlert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Confirmar Publicación
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-3">
                <p>
                  <strong>¿Estás seguro de que deseas publicar este producto?</strong>
                </p>
                <p>
                  Al hacer clic en "Publicar", el producto será publicado inmediatamente y estará visible para los clientes.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 font-medium">
                    ⚠️ Recomendación de Seguridad:
                  </p>
                  <p className="text-amber-700 text-sm mt-1">
                    Te recomendamos guardar primero como "Borrador" para revisar todos los detalles, 
                    especialmente los precios, antes de publicar el producto.
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  ¿Has verificado que todos los precios y detalles son correctos?
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowPublishAlert(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleSubmit(undefined, 'draft')}
              disabled={loading}
              className='text-white'
            >
              Guardar como Borrador
            </Button>
            <Button 
              onClick={() => {
                setShowPublishAlert(false);
                handleSubmit(undefined, 'active');
              }}
              disabled={loading}
            >
              {loading ? 'Publicando...' : 'Sí, Publicar Producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 