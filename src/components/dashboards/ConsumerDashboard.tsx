import React, { useState } from 'react';
import { Scan, Shield, AlertTriangle, CheckCircle, Upload, History } from 'lucide-react';
import { blockchainService, Product, SupplyChainEvent } from '../../services/blockchain';
import { qrCodeService } from '../../services/qrcode';

export default function ConsumerDashboard() {
  const [scanResult, setScanResult] = useState<Product | null>(null);
  const [supplyChain, setSupplyChain] = useState<SupplyChainEvent[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [manualQRCode, setManualQRCode] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError('');

    try {
      // For demo purposes, we'll handle different file types
      if (file.type.startsWith('image/')) {
        const qrCode = await qrCodeService.scanQRCodeFromFile(file);
        await verifyProduct(qrCode);
      } else {
        // If it's a text file, try to read the QR code directly
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target?.result as string;
          const lines = content.split('\n');
          const qrCode = lines[0].trim(); // Use first line as QR code
          await verifyProduct(qrCode);
        };
        reader.readAsText(file);
      }
    } catch (error) {
      setError('Failed to scan QR code from image');
      console.error('QR scan error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQRCode.trim()) return;

    setIsScanning(true);
    setError('');
    await verifyProduct(manualQRCode.trim());
    setIsScanning(false);
  };

  const verifyProduct = async (qrCode: string) => {
    try {
      await blockchainService.initialize();
      const product = await blockchainService.verifyProduct(qrCode);
      
      if (product) {
        setScanResult(product);
        const history = await blockchainService.getSupplyChainHistory(product.productId);
        setSupplyChain(history);
        setError(''); // Clear any previous errors
      } else {
        // Create a fake product object to show it's counterfeit
        const fakeProduct = {
          productId: 0,
          productName: 'Unknown Product',
          manufacturerName: 'Unknown Manufacturer',
          manufacturer: '0x0000000000000000000000000000000000000000',
          currentOwner: '0x0000000000000000000000000000000000000000',
          isAuthentic: false,
          timestamp: Date.now(),
          qrCode: qrCode
        };
        setScanResult(fakeProduct);
        setSupplyChain([]);
        setError('');
      }
    } catch (error) {
      setError('Failed to verify product');
      console.error('Verification error:', error);
    }
  };

  const reportCounterfeit = async () => {
    if (scanResult) {
      try {
        await blockchainService.reportCounterfeit(scanResult.productId, 'Consumer reported suspicious product');
        alert('Counterfeit report submitted successfully');
        // Refresh the product data
        await verifyProduct(scanResult.qrCode);
      } catch (error) {
        alert('Failed to report counterfeit');
        console.error('Report error:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Consumer Verification</h1>
          <p className="text-gray-600">Scan QR codes to verify product authenticity</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanning Interface */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Verify Product</h2>
              
              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Upload QR Code Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <label htmlFor="qr-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">
                      Click to upload QR code image
                    </span>
                    <input
                      id="qr-upload"
                      type="file"
                      accept="image/*,text/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">PNG, JPG, TXT files up to 10MB</p>
                  <p className="text-xs text-gray-400 mt-1">
                    For demo: Upload files named with "authentic", "counterfeit", or containing QR codes
                  </p>
                </div>
              </div>

              {/* Manual QR Code Entry */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Or Enter QR Code Manually
                </label>
                <form onSubmit={handleManualVerification} className="flex space-x-3">
                  <input
                    type="text"
                    value={manualQRCode}
                    onChange={(e) => setManualQRCode(e.target.value)}
                    placeholder="Enter QR code (e.g., PRD-XXX-XXX)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={isScanning}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50"
                  >
                    {isScanning ? 'Verifying...' : 'Verify'}
                  </button>
                </form>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Demo QR Codes */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Try Demo QR Codes</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setManualQRCode('PRD-DEMO-AUTHENTIC');
                    verifyProduct('PRD-DEMO-AUTHENTIC');
                  }}
                  className="w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  PRD-DEMO-AUTHENTIC (Valid Product)
                </button>
                <button
                  onClick={() => {
                    setManualQRCode('PRD-DEMO-COUNTERFEIT');
                    verifyProduct('PRD-DEMO-COUNTERFEIT');
                  }}
                  className="w-full text-left px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  PRD-DEMO-COUNTERFEIT (Flagged Product)
                </button>
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="space-y-6">
            {scanResult ? (
              <>
                {/* Verification Result */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    {scanResult.isAuthentic ? (
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    ) : (
                      <div className="bg-red-100 p-2 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {scanResult.isAuthentic ? 'Authentic Product' : 'Counterfeit Product Detected'}
                      </h3>
                      <p className={`text-sm ${scanResult.isAuthentic ? 'text-green-600' : 'text-red-600'}`}>
                        {scanResult.isAuthentic 
                          ? 'This product is verified and authentic'
                          : scanResult.productId === 0 
                            ? 'This QR code is invalid or not registered in our system'
                            : 'This product has been flagged as counterfeit'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Product Name</label>
                      <p className={`text-lg font-medium ${scanResult.isAuthentic ? 'text-gray-900' : 'text-red-600'}`}>
                        {scanResult.productName}
                      </p>
                    </div>
                    
                    {scanResult.productType && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Product Type</label>
                      <p className={`${scanResult.isAuthentic ? 'text-gray-900' : 'text-red-600'}`}>
                        {scanResult.productType}
                      </p>
                    </div>
                    )}
                    
                    {scanResult.price && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Price</label>
                      <p className={`font-medium ${scanResult.isAuthentic ? 'text-green-600' : 'text-red-600'}`}>
                        ${scanResult.price}
                      </p>
                    </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Manufacturer</label>
                      <p className={`${scanResult.isAuthentic ? 'text-gray-900' : 'text-red-600'}`}>
                        {scanResult.manufacturerName}
                      </p>
                    </div>
                    
                    {scanResult.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Description</label>
                      <p className={`text-sm ${scanResult.isAuthentic ? 'text-gray-700' : 'text-red-600'}`}>
                        {scanResult.description}
                      </p>
                    </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Product ID</label>
                      <p className={`font-mono ${scanResult.isAuthentic ? 'text-gray-900' : 'text-red-600'}`}>
                        {scanResult.productId === 0 ? 'Not Registered' : scanResult.productId}
                      </p>
                    </div>
                    
                    {scanResult.productId !== 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Manufacturing Date</label>
                      <p className="text-gray-900">{new Date(scanResult.timestamp).toLocaleDateString()}</p>
                    </div>
                    )}
                    
                    {scanResult.productId !== 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Current Owner</label>
                      <p className="text-gray-900 font-mono">
                        {scanResult.currentOwner.substring(0, 6)}...
                        {scanResult.currentOwner.substring(scanResult.currentOwner.length - 4)}
                      </p>
                    </div>
                    )}
                  </div>

                  {scanResult.isAuthentic && (
                    <button
                      onClick={reportCounterfeit}
                      className="mt-6 w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Report as Counterfeit
                    </button>
                  )}
                </div>

                {/* Supply Chain History */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <History className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Supply Chain History</h3>
                  </div>

                  {supplyChain.length > 0 ? (
                    <div className="space-y-4">
                      {supplyChain.map((event, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                            <Shield className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">{event.eventType}</h4>
                              <span className="text-sm text-gray-500">
                                {new Date(event.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{event.location}</p>
                            {event.from !== '0x0000000000000000000000000000000000000000' && (
                              <p className="text-xs text-gray-500 font-mono">
                                From: {event.from.substring(0, 6)}...{event.from.substring(event.from.length - 4)} →
                                To: {event.to.substring(0, 6)}...{event.to.substring(event.to.length - 4)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No supply chain history available</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="text-center py-12">
                  <Scan className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Scan</h3>
                  <p className="text-gray-500">Upload a QR code image or enter the code manually to verify a product</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}