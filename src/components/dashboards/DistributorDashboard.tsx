import React, { useState, useEffect } from 'react';
import { Package, ArrowRight, Users, TrendingUp } from 'lucide-react';
import { blockchainService, Product } from '../../services/blockchain';
import { User } from '../../services/auth';

interface DistributorDashboardProps {
  user: User;
}

export default function DistributorDashboard({ user }: DistributorDashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [showTransferForm, setShowTransferForm] = useState<number | null>(null);
  const [transferData, setTransferData] = useState({
    newOwner: '',
    eventType: 'DISTRIBUTED',
    location: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [user]);

  const loadProducts = async () => {
    try {
      await blockchainService.initialize();
      
      // Get all products and filter those owned by this distributor
      const allProducts = JSON.parse(localStorage.getItem('blockchain_products') || '{}');
      const distributorProducts = Object.values(allProducts).filter((product: any) => 
        product.currentOwner.toLowerCase() === user.walletAddress?.toLowerCase()
      ) as Product[];
      
      setProducts(distributorProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleTransferOwnership = async (productId: number) => {
    if (!transferData.newOwner || !transferData.location) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const success = await blockchainService.transferOwnership(
        productId,
        transferData.newOwner,
        transferData.eventType,
        transferData.location
      );

      if (success) {
        alert('Ownership transferred successfully');
        setShowTransferForm(null);
        setTransferData({ newOwner: '', eventType: 'DISTRIBUTED', location: '' });
        await loadProducts();
      } else {
        alert('Failed to transfer ownership');
      }
    } catch (error) {
      alert('Transfer failed');
      console.error('Transfer error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Distributor Dashboard</h1>
          <p className="text-gray-600">Manage product distribution and ownership transfers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Products in Inventory</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
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
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ready to Transfer</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.isAuthentic).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Management */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
          </div>

          <div className="p-6">
            {products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No products in inventory</p>
                <p className="text-sm text-gray-400">Products will appear here when transferred to you</p>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div
                    key={product.productId}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{product.productName}</h3>
                        <p className="text-sm text-gray-500">by {product.manufacturerName}</p>
                        <p className="text-sm text-gray-500">Product ID: {product.productId}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            product.isAuthentic
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {product.isAuthentic ? 'Authentic' : 'Flagged'}
                        </span>
                        
                        {product.isAuthentic && (
                          <button
                            onClick={() => setShowTransferForm(
                              showTransferForm === product.productId ? null : product.productId
                            )}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Transfer Ownership
                          </button>
                        )}
                      </div>
                    </div>

                    {showTransferForm === product.productId && (
                      <div className="bg-gray-50 rounded-lg p-4 mt-4">
                        <h4 className="font-medium text-gray-900 mb-4">Transfer Product Ownership</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              New Owner Address
                            </label>
                            <input
                              type="text"
                              value={transferData.newOwner}
                              onChange={(e) => setTransferData({ 
                                ...transferData, 
                                newOwner: e.target.value 
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0x..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Event Type
                            </label>
                            <select
                              value={transferData.eventType}
                              onChange={(e) => setTransferData({ 
                                ...transferData, 
                                eventType: e.target.value 
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="DISTRIBUTED">Distributed</option>
                              <option value="SOLD">Sold</option>
                              <option value="TRANSFERRED">Transferred</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Location
                            </label>
                            <input
                              type="text"
                              value={transferData.location}
                              onChange={(e) => setTransferData({ 
                                ...transferData, 
                                location: e.target.value 
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter location"
                            />
                          </div>
                        </div>

                        <div className="flex space-x-3 mt-4">
                          <button
                            onClick={() => handleTransferOwnership(product.productId)}
                            disabled={isLoading}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {isLoading ? 'Transferring...' : 'Confirm Transfer'}
                          </button>
                          <button
                            onClick={() => setShowTransferForm(null)}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-gray-900 mb-2">Demo Transfer</h4>
              <p className="text-sm text-gray-600 mb-3">Try transferring to a demo retailer address</p>
              <button
                onClick={() => setTransferData({
                  ...transferData,
                  newOwner: '0x5678901234567890123456789012345678901234',
                  location: 'Demo Retail Store'
                })}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Use Demo Address
              </button>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-gray-900 mb-2">Supply Chain Tracking</h4>
              <p className="text-sm text-gray-600 mb-3">View complete supply chain history for any product</p>
              <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                View History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}