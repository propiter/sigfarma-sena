import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { ProductsHeader } from '@/components/products/ProductsHeader';
import { ProductsList } from '@/components/products/ProductsList';
import { ProductDetails } from '@/components/products/ProductDetails';
import { ProductForm } from '@/components/products/ProductForm';
import { ProductsStats } from '@/components/products/ProductsStats';
import { Package, Plus, Eye, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccessMessage, showErrorMessage, showWarningMessage } from '@/lib/notifications';

interface Product {
  productoId: number;
  codigoBarras: string;
  nombre: string;
  principioActivo: string;
  concentracion: string;
  formaFarmaceutica: string;
  presentacion: string;
  laboratorio: string;
  registroSanitario: string;
  requiereRefrigeracion: boolean;
  esControlado: boolean;
  stockTotal: number;
  stockMinimo: number;
  precioVentaSugerido: number;
  aplicaIva: boolean;
  activo: boolean;
  fechaCreacion: string;
  lotes: Array<{
    loteId: number;
    numeroLote: string;
    fechaVencimiento: string;
    cantidadDisponible: number;
    precioVentaLote: number;
  }>;
}

export function Products() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [stats, setStats] = useState({
    total: 0,
    controlled: 0,
    refrigerated: 0,
    lowStock: 0
  });

  const canManageProducts = user?.rol === 'administrador' || user?.rol === 'inventario';

  useEffect(() => {
    fetchProducts();
    fetchProductStats();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products?limit=100', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductStats = async () => {
    try {
      // Calculate stats from products
      const total = products.length;
      const controlled = products.filter(p => p.esControlado).length;
      const refrigerated = products.filter(p => p.requiereRefrigeracion).length;
      const lowStock = products.filter(p => p.stockTotal <= p.stockMinimo).length;
      
      setStats({ total, controlled, refrigerated, lowStock });
    } catch (error) {
      console.error('Error calculating product stats:', error);
    }
  };

  useEffect(() => {
    fetchProductStats();
  }, [products]);

  const handleCreateProduct = async (productData: any, loteData?: any) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...productData, loteData })
      });

      if (response.ok) {
        await fetchProducts();
        setShowCreateForm(false);
        setActiveTab('list');
        showSuccessMessage('Producto creado exitosamente');
      } else {
        const error = await response.json();
        showErrorMessage(error.message);
      }
    } catch (error: any) {
      showErrorMessage(error.message || 'Error al crear el producto');
    }
  };

  const handleUpdateProduct = async (productData: any) => {
    if (!selectedProduct) return;

    try {
      const response = await fetch(`/api/products/${selectedProduct.productoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        await fetchProducts();
        setShowEditForm(false);
        setActiveTab('details');
        showSuccessMessage('Producto actualizado exitosamente');
      } else {
        const error = await response.json();
        showErrorMessage(error.message);
      }
    } catch (error: any) {
      showErrorMessage(error.message || 'Error al actualizar el producto');
    }
  };

  const handleDarDeBaja = (lote: any) => {
    navigate('/bajas-inventario', { state: { lote } });
  };

  const handleRefresh = () => {
    fetchProducts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="container-responsive py-6 space-y-6">
      {/* Header */}
      <ProductsHeader
        onCreateProduct={() => {
          setShowCreateForm(true);
          setActiveTab('create');
        }}
        onRefresh={handleRefresh}
        canManageProducts={canManageProducts}
      />

      {/* Stats */}
      <ProductsStats stats={stats} />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1">
          <TabsTrigger 
            value="list" 
            className="flex items-center gap-2 py-3 px-4"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Lista</span>
          </TabsTrigger>
          <TabsTrigger 
            value="details" 
            className="flex items-center gap-2 py-3 px-4"
            disabled={!selectedProduct}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Detalles</span>
          </TabsTrigger>
          {showCreateForm && (
            <TabsTrigger 
              value="create" 
              className="flex items-center gap-2 py-3 px-4"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Crear</span>
            </TabsTrigger>
          )}
          {showEditForm && (
            <TabsTrigger 
              value="edit" 
              className="flex items-center gap-2 py-3 px-4"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <ProductsList
            products={products}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectProduct={(product) => {
              setSelectedProduct(product);
              setActiveTab('details');
            }}
            onEditProduct={(product) => {
              setSelectedProduct(product);
              setShowEditForm(true);
              setActiveTab('edit');
            }}
            canManageProducts={canManageProducts}
          />
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedProduct ? (
            <ProductDetails 
              product={selectedProduct}
              onEdit={() => {
                setShowEditForm(true);
                setActiveTab('edit');
              }}
              onDarDeBaja={handleDarDeBaja}
              canManageProducts={canManageProducts}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Selecciona un producto para ver sus detalles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {showCreateForm && (
          <TabsContent value="create" className="space-y-4">
            <ProductForm
              mode="create"
              onSubmit={handleCreateProduct}
              onCancel={() => {
                setShowCreateForm(false);
                setActiveTab('list');
              }}
              showLoteForm={true}
            />
          </TabsContent>
        )}

        {showEditForm && selectedProduct && (
          <TabsContent value="edit" className="space-y-4">
            <ProductForm
              mode="edit"
              product={selectedProduct}
              onSubmit={handleUpdateProduct}
              onCancel={() => {
                setShowEditForm(false);
                setActiveTab('details');
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}