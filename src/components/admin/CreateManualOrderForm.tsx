'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Search, User, Loader2 } from 'lucide-react';

interface CreateManualOrderFormProps {
  onSubmit: (orderData: any) => void;
  onCancel: () => void;
}

export default function CreateManualOrderForm({ onSubmit, onCancel }: CreateManualOrderFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    status: 'pending',
    payment_status: 'paid',
    payment_method: 'transfer',
    subtotal: 0,
    total_amount: 0,
    notes: '',
    shipping: {
      first_name: '',
      last_name: '',
      address_1: '',
      city: '',
      state: '',
      postal_code: '',
      phone: ''
    },
    items: [] as Array<{
      product_id?: string;
      product_name: string;
      quantity: number;
      unit_price: number;
    }>
  });

  const [loading, setLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<any[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [openCustomerSearch, setOpenCustomerSearch] = useState(false);
  const [openProductSearch, setOpenProductSearch] = useState(false);

  // Search customers
  useEffect(() => {
    const searchCustomers = async () => {
      if (customerSearch.length < 2) {
        setCustomerResults([]);
        return;
      }

      setSearchingCustomers(true);
      try {
        const response = await fetch(`/api/admin/customers/search?q=${encodeURIComponent(customerSearch)}`);
        if (response.ok) {
          const data = await response.json();
          setCustomerResults(data.customers || []);
        }
      } catch (error) {
        console.error('Error searching customers:', error);
      } finally {
        setSearchingCustomers(false);
      }
    };

    const debounce = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounce);
  }, [customerSearch]);

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      if (productSearch.length < 2) {
        setProductResults([]);
        return;
      }

      setSearchingProducts(true);
      try {
        const response = await fetch(`/api/admin/products/search?q=${encodeURIComponent(productSearch)}`);
        if (response.ok) {
          const data = await response.json();
          setProductResults(data.products || []);
        }
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        setSearchingProducts(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [productSearch]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.customer-search-container')) {
        setOpenCustomerSearch(false);
      }
      if (!target.closest('.product-search-container')) {
        setOpenProductSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleShippingChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        [field]: value
      }
    }));
  };

  const loadCustomerData = (customer: any) => {
    setFormData(prev => ({
      ...prev,
      email: customer.email,
      shipping: {
        first_name: customer.name?.split(' ')[0] || '',
        last_name: customer.name?.split(' ').slice(1).join(' ') || '',
        address_1: customer.shipping_info?.address_1 || '',
        city: customer.shipping_info?.city || '',
        state: customer.shipping_info?.state || '',
        postal_code: customer.shipping_info?.postal_code || '',
        phone: customer.shipping_info?.phone || customer.phone || ''
      }
    }));
    setCustomerSearch('');
    setOpenCustomerSearch(false);
  };

  const addProductToOrder = (product: any) => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price
      }]
    }));
    setProductSearch('');
    setOpenProductSearch(false);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_name: '', quantity: 1, unit_price: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    setFormData(prev => ({
      ...prev,
      subtotal: itemsTotal,
      total_amount: itemsTotal
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-azul-profundo">Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer Search */}
          <div className="relative customer-search-container">
            <Label>Buscar Cliente Existente</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por email o nombre..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setOpenCustomerSearch(true);
                }}
                className="pl-10"
              />
              {searchingCustomers && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>
            
            {/* Customer Results */}
            {openCustomerSearch && customerResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {customerResults.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => loadCustomerData(customer)}
                    className="w-full p-3 text-left hover:bg-gray-100 border-b last:border-b-0"
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-600">{customer.email}</div>
                    {customer.shipping_info?.city && (
                      <div className="text-xs text-gray-500 mt-1">
                        {customer.shipping_info.city}, {customer.shipping_info.state}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email del Cliente *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-azul-profundo">Detalles del Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="processing">Procesando</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment_status">Estado del Pago</Label>
              <Select value={formData.payment_status} onValueChange={(value) => handleInputChange('payment_status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="failed">Fallido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="payment_method">Método de Pago</Label>
            <Select value={formData.payment_method} onValueChange={(value) => handleInputChange('payment_method', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="check">Cheque</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notas del Pedido</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Notas adicionales sobre el pedido..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Shipping Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-azul-profundo">Información de Envío</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shipping_first_name">Nombre</Label>
              <Input
                id="shipping_first_name"
                value={formData.shipping.first_name}
                onChange={(e) => handleShippingChange('first_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="shipping_last_name">Apellido</Label>
              <Input
                id="shipping_last_name"
                value={formData.shipping.last_name}
                onChange={(e) => handleShippingChange('last_name', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="shipping_address_1">Dirección</Label>
            <Input
              id="shipping_address_1"
              value={formData.shipping.address_1}
              onChange={(e) => handleShippingChange('address_1', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="shipping_city">Ciudad</Label>
              <Input
                id="shipping_city"
                value={formData.shipping.city}
                onChange={(e) => handleShippingChange('city', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="shipping_state">Provincia</Label>
              <Input
                id="shipping_state"
                value={formData.shipping.state}
                onChange={(e) => handleShippingChange('state', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="shipping_postal_code">Código Postal</Label>
              <Input
                id="shipping_postal_code"
                value={formData.shipping.postal_code}
                onChange={(e) => handleShippingChange('postal_code', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="shipping_phone">Teléfono</Label>
            <Input
              id="shipping_phone"
              value={formData.shipping.phone}
              onChange={(e) => handleShippingChange('phone', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-azul-profundo">Productos del Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Search */}
          <div className="relative product-search-container">
            <Label>Buscar Producto</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar productos por nombre..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setOpenProductSearch(true);
                }}
                className="pl-10"
              />
              {searchingProducts && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>
            
            {/* Product Results */}
            {openProductSearch && productResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {productResults.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProductToOrder(product)}
                    className="w-full p-3 text-left hover:bg-gray-100 border-b last:border-b-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">
                          Stock: {product.inventory_quantity} unidades
                        </div>
                      </div>
                      <div className="text-verde-suave font-semibold">
                        ${product.price.toFixed(2)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Products */}
          {formData.items.map((item, index) => (
            <div key={index} className="flex gap-4 items-end p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <Label>Nombre del Producto</Label>
                <Input
                  value={item.product_name}
                  onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                  placeholder="Ej: Crema Hidratante Rosa Mosqueta"
                />
              </div>
              <div className="w-24">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    updateItem(index, 'quantity', parseInt(e.target.value) || 1);
                    setTimeout(calculateTotal, 100);
                  }}
                />
              </div>
              <div className="w-32">
                <Label>Precio Unitario</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => {
                    updateItem(index, 'unit_price', parseFloat(e.target.value) || 0);
                    setTimeout(calculateTotal, 100);
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  removeItem(index);
                  setTimeout(calculateTotal, 100);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Producto Manual
          </Button>

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <div className="text-sm text-gray-600">Subtotal</div>
              <div className="text-2xl font-bold text-verde-suave">${formData.total_amount.toFixed(2)}</div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={calculateTotal}
            >
              Recalcular Total
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Pedido'}
        </Button>
      </div>
    </form>
  );
}
