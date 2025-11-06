import React, { useState, useEffect } from 'react';
import { Plus, Package, QrCode, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { blockchainService, Product } from '../../services/blockchain';
import { qrCodeService } from '../../services/qrcode';
import { User } from '../../services/auth';

interface ManufacturerDashboardProps {
  user: User;
}

export default function ManufacturerDashboard({ user }: ManufacturerDashboardProps) {
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    manufacturerName: user.company || user.name,
    price: '',
    productType: 'Electronics',
    description: ''
  });
  const [generatedQR, setGeneratedQR] = useState<{ code: string; dataURL: string } | null>(null);

  useEffect(() => {
    loadProducts();
    
    // Listen for storage changes to update product list
    const handleStorageChange = () => {
      loadProducts();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  const loadProducts = async () => {
    try {
      await blockchainService.initialize();
      
      // Get all products from localStorage and filter by current user
      const allProducts = JSON.parse(localStorage.getItem('blockchain_products') || '{}');
      const userProducts = Object.values(allProducts).filter((product: any) => {
        // Match by manufacturer name or wallet address
        return product.manufacturerName === (user.company || user.name) ||
               (user.walletAddress && product.manufacturer.toLowerCase() === user.walletAddress.toLowerCase());
      }) as Product[];
      
      setProducts(userProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleRegisterProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Initialize blockchain service
      await blockchainService.initialize();
      
      // Generate QR code
      const qrResult = await qrCodeService.generateProductQRCode(
        formData.productName,
        formData.manufacturerName
      );

      // Register product on blockchain
      await blockchainService.registerProduct(
        formData.productName,
        formData.manufacturerName,
        qrResult.code,
        parseFloat(formData.price) || undefined,
        formData.productType,
        formData.description
      );

      setGeneratedQR(qrResult);
      setFormData({ 
        productName: '', 
        manufacturerName: user.company || user.name,
        price: '',
        productType: 'Electronics',
        description: ''
      });
      await loadProducts();
    } catch (error) {
      console.error('Failed to register product:', error);
      alert('Failed to register product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (generatedQR) {
      const link = document.createElement('a');
      link.download = `qr-${generatedQR.code}.png`;
      link.href = generatedQR.dataURL;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manufacturer Dashboard</h1>
          <p className="text-gray-600">Register and manage your products on the blockchain</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Authentic Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.isAuthentic).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Flagged Products</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => !p.isAuthentic).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Register Product Form */}
          <div className="bg-white rounded-xl shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Register New Product</h2>
                <button
                  onClick={() => setShowRegisterForm(!showRegisterForm)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {showRegisterForm && (
              <div className="p-6">
                <form onSubmit={handleRegisterProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturer Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.manufacturerName}
                      onChange={(e) => setFormData({ ...formData, manufacturerName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter manufacturer name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter price"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Type
                      </label>
                      <select
                        value={formData.productType}
                        onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Electronics">Electronics</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Pharmaceuticals">Pharmaceuticals</option>
                        <option value="Luxury Goods">Luxury Goods</option>
                        <option value="Automotive">Automotive</option>
                        <option value="Food & Beverage">Food & Beverage</option>
                        <option value="Cosmetics">Cosmetics</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter product description (optional)"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Registering...' : 'Register Product'}
                  </button>
                </form>

                {generatedQR && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-3">QR Code Generated!</h3>
                    <div className="flex items-center space-x-4">
                      <img src={generatedQR.dataURL} alt="QR Code" className="w-24 h-24" />
                      <div>
                        <p className="text-sm text-green-700 mb-2">Code: {generatedQR.code}</p>
                        <button
                          onClick={downloadQRCode}
                          className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                        >
                          Download QR Code
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product List */}
          <div className="bg-white rounded-xl shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Registered Products</h2>
            </div>
            <div className="p-6">
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No products registered yet</p>
                  <p className="text-sm text-gray-400">Register your first product to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <div
                      key={product.productId}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{product.productName}</h3>
                          <p className="text-sm text-gray-600">{product.productType}</p>
                          {product.price && (
                            <p className="text-sm font-medium text-green-600">${product.price}</p>
                          )}
                          <p className="text-sm text-gray-500">ID: {product.productId}</p>
                          <p className="text-sm text-gray-500">
                            Created: {new Date(product.timestamp).toLocaleDateString()}
                          </p>
                          {product.description && (
                            <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              product.isAuthentic
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.isAuthentic ? 'Authentic' : 'Flagged'}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}