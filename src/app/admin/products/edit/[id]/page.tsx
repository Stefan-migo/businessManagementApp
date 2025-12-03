"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Package, Save, AlertTriangle, Plus, X } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUpload from '@/components/ui/ImageUpload';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // Skin types and certifications options (same as add form)
  const skinTypes = [
    { value: 'dry', label: 'Seco' },
    { value: 'oily', label: 'Graso' },
    { value: 'combination', label: 'Mixto' },
    { value: 'sensitive', label: 'Sensible' },
    { value: 'normal', label: 'Normal' },
    { value: 'mature', label: 'Maduro' }
  ];

  const certificationOptions = [
    { value: 'organic', label: 'Orgánico' },
    { value: 'cruelty-free', label: 'Libre de Crueldad' },
    { value: 'vegan', label: 'Vegano' },
    { value: 'natural', label: 'Natural' },
    { value: 'eco-friendly', label: 'Ecológico' }
  ];

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    short_description: '',
    description: '',
    price: '',
    compare_at_price: '',
    category_id: '',
    featured_image: '',
    gallery: [] as string[],
    inventory_quantity: '',
    weight: '',
    dimensions: '',
    package_characteristics: '',
    skin_type: [] as string[],
    benefits: [] as string[],
    certifications: [] as string[],
    ingredients: [] as Array<{ name: string, percentage?: number }>,
    usage_instructions: '',
    precautions: '',
    is_featured: false,
    status: 'active'
  });

  // Form protection state
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);

  // Update form data with change detection
  const updateFormData = (updates: any) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };

      // Check if there are changes
      if (initialData) {
        const hasFormChanges = JSON.stringify(newData) !== JSON.stringify(initialData);
        setHasChanges(hasFormChanges);
      }

      return newData;
    });
  };

  // Fetch product data and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch product data including archived products for admin editing
        const productResponse = await fetch(`/api/products/${productId}?include_archived=true`);
        if (!productResponse.ok) {
          throw new Error('Failed to fetch product');
        }
        const productData = await productResponse.json();

        // Fetch categories
        const categoriesResponse = await fetch('/api/categories');
        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories');
        }
        const categoriesData = await categoriesResponse.json();

        // Set form data with product values
        const product = productData.product;
        const initialFormData = {
          name: product.name || '',
          slug: product.slug || '',
          short_description: product.short_description || '',
          description: product.description || '',
          price: product.price?.toString() || '',
          compare_at_price: product.compare_at_price?.toString() || '',
          category_id: product.category_id || '',
          featured_image: product.featured_image || '',
          gallery: product.gallery || [],
          inventory_quantity: product.inventory_quantity?.toString() || '',
          weight: product.weight?.toString() || '',
          dimensions: product.dimensions || '',
          package_characteristics: product.package_characteristics || '',
          skin_type: product.skin_type || [],
          benefits: product.benefits || [],
          certifications: product.certifications || [],
          ingredients: product.ingredients || [],
          usage_instructions: product.usage_instructions || '',
          precautions: product.precautions || '',
          is_featured: product.is_featured || false,
          status: product.status || 'active'
        };

        setFormData(initialFormData);
        setInitialData(initialFormData);

        setCategories(categoriesData.categories || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchData();
    }
  }, [productId]);

  const handleInputChange = (field: string, value: any) => {
    updateFormData({
      [field]: value
    });
  };

  // Ingredient management functions
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

  const handleSubmit = async (e?: React.FormEvent, status?: string) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);

    try {
      const productData = {
        ...formData,
        status: status || formData.status,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        inventory_quantity: parseInt(formData.inventory_quantity),
        weight: formData.weight ? parseFloat(formData.weight) : null,
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        toast.success('Producto actualizado exitosamente');
        router.push('/admin/products');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al actualizar el producto');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar el producto');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Productos
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">Error al cargar producto</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header with changes indicator */}
      <div className="flex justify-between items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-azul-profundo" />
          <h1 className="text-2xl font-bold text-azul-profundo">Editar Producto</h1>
          {hasChanges && (
            <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full border border-amber-200">
              Cambios sin guardar
            </span>
          )}
        </div>
        <Link href="/admin/products">
          <Button className="group btn-enhanced px-6 py-3 lg:px-8 lg:py-4 text-white font-semibold text-sm lg:text-base w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Productos
          </Button>
        </Link>
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
              <Label htmlFor="description">Descripción Completa</Label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => handleInputChange('description', value)}
                placeholder="Descripción detallada del producto..."
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
                <Label htmlFor="price">Precio (ARS) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="15000"
                  required
                  className='border-black/20'
                />
              </div>
              <div>
                <Label htmlFor="compare_at_price">Precio Anterior (ARS)</Label>
                <Input
                  id="compare_at_price"
                  type="number"
                  step="0.01"
                  value={formData.compare_at_price}
                  onChange={(e) => handleInputChange('compare_at_price', e.target.value)}
                  placeholder="18000"
                  className='border-black/20'
                />
              </div>
              <div>
                <Label htmlFor="inventory_quantity">Stock *</Label>
                <Input
                  id="inventory_quantity"
                  type="number"
                  value={formData.inventory_quantity}
                  onChange={(e) => handleInputChange('inventory_quantity', e.target.value)}
                  placeholder="50"
                  required
                  className='border-black/20'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
            <CardTitle>Categoría y Características</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado del producto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="archived">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
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
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
              />
              <Label htmlFor="is_featured">Producto Destacado</Label>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
            <CardTitle>Características del Producto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="skin_type">Tipos de Piel</Label>
                <Select value={formData.skin_type[0] || ''} onValueChange={(value) => handleInputChange('skin_type', [value])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de piel" />
                  </SelectTrigger>
                  <SelectContent>
                    {skinTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="certifications">Certificaciones</Label>
                <Select value={formData.certifications[0] || ''} onValueChange={(value) => handleInputChange('certifications', [value])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar certificación" />
                  </SelectTrigger>
                  <SelectContent>
                    {certificationOptions.map((cert) => (
                      <SelectItem key={cert.value} value={cert.value}>
                        {cert.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="benefits">Beneficios</Label>
              <Input
                id="benefits"
                value={formData.benefits.join(', ')}
                onChange={(e) => handleInputChange('benefits', e.target.value.split(', ').filter(b => b.trim()))}
                placeholder="Exfoliante, Hidratante, Anti-edad"
              />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
            <CardTitle>Ingredientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center gap-2">
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
                    onChange={(e) => updateIngredient(index, 'percentage', e.target.value ? parseFloat(e.target.value) : 0)}
                    className="w-20"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
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
          </CardContent>
        </Card>

        <Card className='bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]'>
          <CardHeader>
            <CardTitle>Instrucciones y Precauciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="usage_instructions">Modo de Uso</Label>
              <RichTextEditor
                value={formData.usage_instructions}
                onChange={(value) => handleInputChange('usage_instructions', value)}
                placeholder="Instrucciones detalladas de uso..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="precautions">Precauciones</Label>
              <RichTextEditor
                value={formData.precautions}
                onChange={(value) => handleInputChange('precautions', value)}
                placeholder="Precauciones y advertencias..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

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
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="250"
                />
              </div>
              <div>
                <Label htmlFor="dimensions">Dimensiones</Label>
                <Input
                  id="dimensions"
                  value={formData.dimensions}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                  placeholder="10cm x 5cm x 5cm"
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

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>

          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => handleSubmit(undefined, 'draft')}
            className="flex items-center gap-2 text-white"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar como Borrador'}
          </Button>

          <Button type="submit" disabled={saving} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
