import { Shield, Wallet, LogOut } from 'lucide-react';
import { User as UserType } from '../../services/auth';

interface HeaderProps {
  user: UserType;
  onLogout: () => void;
  onConnectWallet: () => void;
  walletConnected: boolean;
  walletAddress?: string;
  isConnecting?: boolean;
}

export default function Header({ 
  user, 
  onLogout, 
  onConnectWallet, 
  walletConnected,
  walletAddress,
  isConnecting
}: HeaderProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manufacturer': return 'bg-blue-100 text-blue-800';
      case 'distributor': return 'bg-yellow-100 text-yellow-800';
      case 'consumer': return 'bg-green-100 text-green-800';
      case 'regulator': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FAKE PRODUCT IDENTIFIER</h1>
                <p className="text-xs text-gray-500">Fake Product Identification System using QR code</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onConnectWallet}
              disabled={isConnecting}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                walletConnected 
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>
                {walletConnected
                  ? `Connected: ${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`
                  : isConnecting
                  ? 'Connecting...'
                  : 'Connect Wallet'
                }
              </span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                
                {user.walletAddress && (
                  <div className="text-xs text-gray-500 font-mono">
                    {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)}
                  </div>
                )}
              </div>

              <button
                onClick={onLogout}
                className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
