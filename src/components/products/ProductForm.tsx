import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { 
  Package, 
  Search, 
  Plus, 
  Save, 
  X, 
  Thermometer, 
  Shield, 
  AlertTriangle,
  Barcode,
  Building
} from 'lucide-react';

interface UnidadMedida {
  unidadId: number;
  nombre: string;
  abreviacion: string;
}

interface ProductFormData {
  codigoBarras: string;
  nombre: string;
  principioActivo: string;
  concentracion: string;
  formaFarmaceutica: string;
  presentacion: string;
  unidadMedidaId: number;
  laboratorio: string;
  registroSanitario: string;
  requiereRefrigeracion: boolean;
  esControlado: boolean;
  stockMinimo: number;
  stockMaximo: number;
  precioVentaSugerido: number;
  aplicaIva: boolean;
}

interface LoteData {
  numeroLote: string;
  fechaVencimiento: string;
  cantidadInicial: number;
  precioCompra: number;
  notas: string;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  product?: any;
  onSubmit: (productData: ProductFormData, loteData?: LoteData) => Promise<void>;
  onCancel: () => void;
  showLoteForm?: boolean;
}

export function ProductForm({ mode, product, onSubmit, onCancel, showLoteForm = false }: ProductFormProps) {
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [foundProduct, setFoundProduct] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Product form data
  const [productData, setProductData] = useState<ProductFormData>({
    codigoBarras: product?.codigoBarras || '',
    nombre: product?.nombre || '',
    principioActivo: product?.principioActivo || '',
    concentracion: product?.concentracion || '',
    formaFarmaceutica: product?.formaFarmaceutica || '',
    presentacion: product?.presentacion || '',
    unidadMedidaId: product?.unidadMedidaId || 0,
    laboratorio: product?.laboratorio || '',
    registroSanitario: product?.registroSanitario || '',
    requiereRefrigeracion: product?.requiereRefrigeracion || false,
    esControlado: product?.esControlado || false,
    stockMinimo: product?.stockMinimo || 5,
    stockMaximo: product?.stockMaximo || 1000,
    precioVentaSugerido: product?.precioVentaSugerido || 0,
    aplicaIva: product?.aplicaIva ?? true
  });

  // Lote form data (only for new products)
  const [loteData, setLoteData] = useState<LoteData>({
    numeroLote: '',
    fechaVencimiento: '',
    cantidadInicial: 0,
    precioCompra: 0,
    notas: ''
  });

  useEffect(() => {
    fetchUnidadesMedida();
  }, []);

  const fetchUnidadesMedida = async () => {
    try {
      const response = await fetch('/api/units', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUnidadesMedida(data);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const searchProduct = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(`/api/products/search/${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const products = await response.json();
        if (products.length > 0) {
          const found = products[0];
          setFoundProduct(found);
          
          // Pre-fill form with found product data
          setProductData({
            codigoBarras: found.codigoBarras || '',
            nombre: found.nombre || '',
            principioActivo: found.principioActivo || '',
            concentracion: found.concentracion || '',
            formaFarmaceutica: found.formaFarmaceutica || '',
            presentacion: found.presentacion || '',
            unidadMedidaId: found.unidadMedidaId || 0,
            laboratorio: found.laboratorio || '',
            registroSanitario: found.registroSanitario || '',
            requiereRefrigeracion: found.requiereRefrigeracion || false,
            esControlado: found.esControlado || false,
            stockMinimo: found.stockMinimo || 5,
            stockMaximo: found.stockMaximo || 1000,
            precioVentaSugerido: found.precioVentaSugerido || 0,
            aplicaIva: found.aplicaIva ?? true
          });
        } else {
          setFoundProduct(null);
          alert('Producto no encontrado. Puedes crear uno nuevo con estos datos.');
        }
      }
    } catch (error) {
      console.error('Error searching product:', error);
    }
  };

  const calculateExpirationAlert = (fechaVencimiento: string): string => {
    if (!fechaVencimiento) return 'verde';
    
    const today = new Date();
    const expDate = new Date(fechaVencimiento);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'vencido';
    if (diffDays <= 180) return 'rojo';
    if (diffDays <= 365) return 'amarillo';
    if (diffDays <= 730) return 'naranja';
    return 'verde';
  };

  const getAlertColor = (alert: string) => {
    switch (alert) {
      case 'vencido': return 'bg-red-600 text-white';
      case 'rojo': return 'bg-red-500 text-white';
      case 'amarillo': return 'bg-yellow-500 text-white';
      case 'naranja': return 'bg-orange-500 text-white';
      case 'verde': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productData.nombre.trim() || !productData.presentacion.trim()) {
      alert('El nombre y la presentación son requeridos');
      return;
    }

    if (showLoteForm && (!loteData.numeroLote || !loteData.fechaVencimiento || loteData.cantidadInicial <= 0)) {
      alert('Completa todos los campos del lote');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(productData, showLoteForm ? loteData : undefined);
    } catch (error: any) {
      alert(error.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  const updateProductData = (field: keyof ProductFormData, value: any) => {
    setProductData(prev => ({ ...prev, [field]: value }));
  };

  const updateLoteData = (field: keyof LoteData, value: any) => {
    setLoteData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Search Section (only for create mode) */}
        {mode === 'create' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Buscar Producto Existente
              </CardTitle>
              <CardDescription>
                Busca por nombre o código de barras para prellenar los datos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Buscar por nombre o código de barras..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                </div>
                <Button onClick={searchProduct} disabled={!searchQuery.trim()}>
                  Buscar
                </Button>
              </div>

              {foundProduct && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-900 dark:text-green-100">Producto Encontrado</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {foundProduct.nombre} - {foundProduct.presentacion}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Los campos se han prellenado automáticamente
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {mode === 'create' ? 'Información del Producto' : `Editar: ${product?.nombre}`}
            </CardTitle>
            <CardDescription>
              Datos básicos del medicamento o producto farmacéutico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre del Producto *</Label>
                  <Input
                    id="nombre"
                    value={productData.nombre}
                    onChange={(e) => updateProductData('nombre', e.target.value)}
                    placeholder="Acetaminofén 500mg"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="codigoBarras">Código de Barras</Label>
                  <div className="relative">
                    <Input
                      id="codigoBarras"
                      value={productData.codigoBarras}
                      onChange={(e) => updateProductData('codigoBarras', e.target.value)}
                      placeholder="7702132001234"
                      className="pl-10"
                    />
                    <Barcode className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="principioActivo">Principio Activo</Label>
                  <Input
                    id="principioActivo"
                    value={productData.principioActivo}
                    onChange={(e) => updateProductData('principioActivo', e.target.value)}
                    placeholder="Acetaminofén"
                  />
                </div>
                <div>
                  <Label htmlFor="concentracion">Concentración</Label>
                  <Input
                    id="concentracion"
                    value={productData.concentracion}
                    onChange={(e) => updateProductData('concentracion', e.target.value)}
                    placeholder="500mg"
                  />
                </div>
                <div>
                  <Label htmlFor="formaFarmaceutica">Forma Farmacéutica</Label>
                  <Input
                    id="formaFarmaceutica"
                    value={productData.formaFarmaceutica}
                    onChange={(e) => updateProductData('formaFarmaceutica', e.target.value)}
                    placeholder="Tableta"
                  />
                </div>
                <div>
                  <Label htmlFor="presentacion">Presentación *</Label>
                  <Input
                    id="presentacion"
                    value={productData.presentacion}
                    onChange={(e) => updateProductData('presentacion', e.target.value)}
                    placeholder="Caja x 20 tabletas"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unidadMedida">Unidad de Medida</Label>
                  <select
                    id="unidadMedida"
                    value={productData.unidadMedidaId}
                    onChange={(e) => updateProductData('unidadMedidaId', Number(e.target.value))}
                    className="w-full p-2 border rounded-md bg-background text-foreground"
                  >
                    <option value={0}>Seleccionar unidad</option>
                    {unidadesMedida.map(unidad => (
                      <option key={unidad.unidadId} value={unidad.unidadId}>
                        {unidad.nombre} ({unidad.abreviacion})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="laboratorio">Laboratorio</Label>
                  <div className="relative">
                    <Input
                      id="laboratorio"
                      value={productData.laboratorio}
                      onChange={(e) => updateProductData('laboratorio', e.target.value)}
                      placeholder="Genfar"
                      className="pl-10"
                    />
                    <Building className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Special Properties */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Propiedades Especiales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-blue-500" />
                      <div>
                        <Label>Requiere Refrigeración</Label>
                        <p className="text-sm text-muted-foreground">Producto que necesita cadena de frío</p>
                      </div>
                    </div>
                    <Switch
                      checked={productData.requiereRefrigeracion}
                      onCheckedChange={(checked) => updateProductData('requiereRefrigeracion', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-500" />
                      <div>
                        <Label>Medicamento Controlado</Label>
                        <p className="text-sm text-muted-foreground">Requiere prescripción médica</p>
                      </div>
                    </div>
                    <Switch
                      checked={productData.esControlado}
                      onCheckedChange={(checked) => updateProductData('esControlado', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full"
                >
                  {showAdvanced ? 'Ocultar' : 'Mostrar'} Configuración Avanzada
                </Button>

                {showAdvanced && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="registroSanitario">Registro Sanitario</Label>
                        <Input
                          id="registroSanitario"
                          value={productData.registroSanitario}
                          onChange={(e) => updateProductData('registroSanitario', e.target.value)}
                          placeholder="INVIMA 2023M-0001234"
                        />
                      </div>
                      <div>
                        <Label htmlFor="precioVentaSugerido">Precio de Venta Sugerido</Label>
                        <Input
                          id="precioVentaSugerido"
                          type="number"
                          value={productData.precioVentaSugerido}
                          onChange={(e) => updateProductData('precioVentaSugerido', Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stockMinimo">Stock Mínimo</Label>
                        <Input
                          id="stockMinimo"
                          type="number"
                          value={productData.stockMinimo}
                          onChange={(e) => updateProductData('stockMinimo', Number(e.target.value))}
                          placeholder="5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stockMaximo">Stock Máximo</Label>
                        <Input
                          id="stockMaximo"
                          type="number"
                          value={productData.stockMaximo}
                          onChange={(e) => updateProductData('stockMaximo', Number(e.target.value))}
                          placeholder="1000"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label>Aplica IVA</Label>
                        <p className="text-sm text-muted-foreground">El producto está gravado con IVA</p>
                      </div>
                      <Switch
                        checked={productData.aplicaIva}
                        onCheckedChange={(checked) => updateProductData('aplicaIva', checked)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Lote Information (only for create mode with showLoteForm) */}
              {mode === 'create' && showLoteForm && (
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <h3 className="text-lg font-medium">Información del Lote Inicial</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="numeroLote">Número de Lote *</Label>
                      <Input
                        id="numeroLote"
                        value={loteData.numeroLote}
                        onChange={(e) => updateLoteData('numeroLote', e.target.value)}
                        placeholder="L001234"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fechaVencimiento">Fecha de Vencimiento *</Label>
                      <Input
                        id="fechaVencimiento"
                        type="date"
                        value={loteData.fechaVencimiento}
                        onChange={(e) => updateLoteData('fechaVencimiento', e.target.value)}
                        required
                      />
                      {loteData.fechaVencimiento && (
                        <Badge 
                          className={`text-xs mt-1 ${getAlertColor(calculateExpirationAlert(loteData.fechaVencimiento))}`}
                        >
                          {calculateExpirationAlert(loteData.fechaVencimiento).toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="cantidadInicial">Cantidad Inicial *</Label>
                      <Input
                        id="cantidadInicial"
                        type="number"
                        value={loteData.cantidadInicial}
                        onChange={(e) => updateLoteData('cantidadInicial', Number(e.target.value))}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="precioCompra">Precio de Compra</Label>
                      <Input
                        id="precioCompra"
                        type="number"
                        value={loteData.precioCompra}
                        onChange={(e) => updateLoteData('precioCompra', Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notasLote">Notas del Lote</Label>
                    <Input
                      id="notasLote"
                      value={loteData.notas}
                      onChange={(e) => updateLoteData('notas', e.target.value)}
                      placeholder="Observaciones del lote..."
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
                >
                  {loading ? (
                    'Guardando...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
                    </>
                  )}
                </Button>
                
                <Button type="button" variant="outline" onClick={onCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Summary Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen del Producto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Nombre:</span>
                <br />
                {productData.nombre || 'Sin especificar'}
              </div>
              <div>
                <span className="font-medium">Presentación:</span>
                <br />
                {productData.presentacion || 'Sin especificar'}
              </div>
              <div>
                <span className="font-medium">Laboratorio:</span>
                <br />
                {productData.laboratorio || 'Sin especificar'}
              </div>
              {productData.precioVentaSugerido > 0 && (
                <div>
                  <span className="font-medium">Precio Sugerido:</span>
                  <br />
                  <span className="text-green-600 font-bold">
                    {formatCurrency(productData.precioVentaSugerido)}
                  </span>
                </div>
              )}
            </div>

            {/* Special Properties */}
            <div className="space-y-2">
              {productData.requiereRefrigeracion && (
                <Badge className="bg-blue-100 text-blue-800">
                  <Thermometer className="w-3 h-3 mr-1" />
                  Refrigeración
                </Badge>
              )}
              {productData.esControlado && (
                <Badge className="bg-red-100 text-red-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Controlado
                </Badge>
              )}
              {!productData.aplicaIva && (
                <Badge variant="secondary">
                  Sin IVA
                </Badge>
              )}
            </div>

            {/* Lote Summary */}
            {showLoteForm && loteData.numeroLote && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Lote Inicial</h4>
                <div className="space-y-1 text-sm">
                  <div>Lote: {loteData.numeroLote}</div>
                  <div>Cantidad: {loteData.cantidadInicial}</div>
                  {loteData.fechaVencimiento && (
                    <div>Vence: {new Date(loteData.fechaVencimiento).toLocaleDateString('es-CO')}</div>
                  )}
                </div>
              </div>
            )}

            {/* Warning */}
            {mode === 'create' && !showLoteForm && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-900 dark:text-yellow-100">Nota</span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Este producto se creará sin stock inicial. Deberás crear un acta de recepción para agregar inventario.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}