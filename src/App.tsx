import { useState, useEffect } from 'react';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Header from './components/layout/Header';
import ManufacturerDashboard from './components/dashboards/ManufacturerDashboard';
import ConsumerDashboard from './components/dashboards/ConsumerDashboard';
import RegulatorDashboard from './components/dashboards/RegulatorDashboard';
import DistributorDashboard from './components/dashboards/DistributorDashboard';
import { authService, User, AuthState } from './services/auth';
import { blockchainService } from './services/blockchain';

type AuthView = 'login' | 'register';

function App() {
  const [authState, setAuthState] = useState<AuthState>({ 
    user: null, 
    isAuthenticated: false, 
    token: null 
  });
  const [authView, setAuthView] = useState<AuthView>('login');
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    // Check for existing auth state on app load
    const currentAuth = authService.getCurrentAuthState();
    if (currentAuth.isAuthenticated) {
      setAuthState(currentAuth);
      initializeBlockchain();
    }

    // Initialize demo data if not exists
    initializeDemoData();
  }, []);

  const initializeBlockchain = async () => {
    try {
      const initialized = await blockchainService.initialize();
      setWalletConnected(initialized);
    } catch (error) {
      console.error('Failed to initialize blockchain:', error);
    }
  };

  const initializeDemoData = () => {
    // Check if demo data already exists
    const existingProducts = localStorage.getItem('blockchain_products');
    if (!existingProducts) {
      // Create demo products for testing
      const demoProducts = {
        'PRD-DEMO-AUTHENTIC': {
          productId: 1001,
          productName: 'Premium Smartphone',
          manufacturerName: 'TechCorp Manufacturing',
          manufacturer: '0x1234567890123456789012345678901234567890',
          currentOwner: '0x2345678901234567890123456789012345678901',
          isAuthentic: true,
          timestamp: Date.now() - 86400000, // 1 day ago
          qrCode: 'PRD-DEMO-AUTHENTIC',
          price: 899.99,
          productType: 'Electronics',
          description: 'Latest flagship smartphone with advanced features'
        },
        'PRD-DEMO-COUNTERFEIT': {
          productId: 1002,
          productName: 'Luxury Watch',
          manufacturerName: 'Swiss Time Ltd',
          manufacturer: '0x3456789012345678901234567890123456789012',
          currentOwner: '0x4567890123456789012345678901234567890123',
          isAuthentic: false,
          timestamp: Date.now() - 172800000, // 2 days ago
          qrCode: 'PRD-DEMO-COUNTERFEIT',
          price: 2499.99,
          productType: 'Luxury Goods',
          description: 'Premium Swiss-made luxury timepiece'
        }
      };

      localStorage.setItem('blockchain_products', JSON.stringify(demoProducts));

      // Demo supply chain history
      const demoHistory = {
        1001: [
          {
            from: '0x0000000000000000000000000000000000000000',
            to: '0x1234567890123456789012345678901234567890',
            timestamp: Date.now() - 172800000,
            eventType: 'MANUFACTURED',
            location: 'TechCorp Factory - Shenzhen'
          },
          {
            from: '0x1234567890123456789012345678901234567890',
            to: '0x2345678901234567890123456789012345678901',
            timestamp: Date.now() - 86400000,
            eventType: 'DISTRIBUTED',
            location: 'Global Distribution Center'
          }
        ],
        1002: [
          {
            from: '0x0000000000000000000000000000000000000000',
            to: '0x3456789012345678901234567890123456789012',
            timestamp: Date.now() - 259200000,
            eventType: 'MANUFACTURED',
            location: 'Swiss Time Factory - Geneva'
          },
          {
            from: '0x3456789012345678901234567890123456789012',
            to: '0x4567890123456789012345678901234567890123',
            timestamp: Date.now() - 172800000,
            eventType: 'DISTRIBUTED',
            location: 'European Distribution Hub'
          }
        ]
      };

      localStorage.setItem('supply_chain_history', JSON.stringify(demoHistory));

      // Demo counterfeit reports
      const demoReports = [
        {
          productId: 1002,
          reason: 'Suspicious QR code duplication detected',
          reporter: '0x9876543210987654321098765432109876543210',
          timestamp: Date.now() - 86400000
        }
      ];

      localStorage.setItem('counterfeit_reports', JSON.stringify(demoReports));
    }
  };

  const handleLogin = (newAuthState: AuthState) => {
    setAuthState(newAuthState);
    initializeBlockchain();
  };

  const handleRegister = (newAuthState: AuthState) => {
    setAuthState(newAuthState);
    initializeBlockchain();
  };

  const handleLogout = () => {
    authService.logout();
    setAuthState({ user: null, isAuthenticated: false, token: null });
    setWalletConnected(false);
  };

  const handleConnectWallet = async () => {
    try {
      const walletAddress = await blockchainService.connectWallet();
      if (walletAddress && authState.user) {
        await authService.updateWalletAddress(authState.user.id, walletAddress);
        const updatedAuth = authService.getCurrentAuthState();
        setAuthState(updatedAuth);
        setWalletConnected(true);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  const renderDashboard = (user: User) => {
    switch (user.role) {
      case 'manufacturer':
        return <ManufacturerDashboard user={user} />;
      case 'consumer':
        return <ConsumerDashboard />;
      case 'distributor':
        return <DistributorDashboard user={user} />;
      case 'regulator':
        return <RegulatorDashboard />;
      default:
        return <ConsumerDashboard />;
    }
  };

  if (!authState.isAuthenticated || !authState.user) {
    return (
      <>
        {authView === 'login' ? (
          <LoginForm 
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthView('register')}
          />
        ) : (
          <RegisterForm 
            onRegister={handleRegister}
            onSwitchToLogin={() => setAuthView('login')}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        user={authState.user}
        onLogout={handleLogout}
        onConnectWallet={handleConnectWallet}
        walletConnected={walletConnected}
      />
      {renderDashboard(authState.user)}
    </div>
  );
}

export default App;