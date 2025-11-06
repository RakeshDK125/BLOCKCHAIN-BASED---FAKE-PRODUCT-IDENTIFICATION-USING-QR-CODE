import Web3 from 'web3';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface Product {
  productId: number;
  productName: string;
  manufacturerName: string;
  manufacturer: string;
  currentOwner: string;
  isAuthentic: boolean;
  timestamp: number;
  qrCode: string;
  price?: number;
  productType?: string;
  description?: string;
}

export interface SupplyChainEvent {
  from: string;
  to: string;
  timestamp: number;
  eventType: string;
  location: string;
}

class BlockchainService {
  private web3: Web3 | null = null;
  private account: string | null = null;



  async initialize(): Promise<boolean> {
    try {
      // In WebContainer, we'll simulate the Web3 connection
      if (typeof window !== 'undefined' && window.ethereum) {
        this.web3 = new Web3(window.ethereum);
        
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const accounts = await this.web3.eth.getAccounts();
          this.account = accounts[0];
          
          return true;
        } catch (walletError: any) {
          if (walletError.code === 4001) {
            console.warn('User rejected wallet connection request');
            return false;
          } else {
            throw walletError;
          }
        }
      } else {
        // Mock initialization for development
        this.web3 = new Web3('http://localhost:8545');
        this.account = '0x1234567890123456789012345678901234567890';
        return true;
      }
    } catch (error) {
      console.error('Failed to initialize blockchain connection:', error);
      return false;
    }
  }

  async registerProduct(
    productName: string, 
    manufacturerName: string, 
    qrCode: string, 
    price?: number, 
    productType?: string, 
    description?: string
  ): Promise<number> {
    try {
      if (!this.account) {
        throw new Error('Blockchain not initialized');
      }

      // Mock implementation for development
      const mockProductId = Math.floor(Math.random() * 10000) + 1;
      
      // Store in local storage for simulation
      const products = JSON.parse(localStorage.getItem('blockchain_products') || '{}');
      products[qrCode] = {
        productId: mockProductId,
        productName,
        manufacturerName,
        manufacturer: this.account,
        currentOwner: this.account,
        isAuthentic: true,
        timestamp: Date.now(),
        qrCode,
        price,
        productType,
        description
      };
      localStorage.setItem('blockchain_products', JSON.stringify(products));

      // Mock supply chain history
      const history = JSON.parse(localStorage.getItem('supply_chain_history') || '{}');
      history[mockProductId] = [{
        from: '0x0000000000000000000000000000000000000000',
        to: this.account,
        timestamp: Date.now(),
        eventType: 'MANUFACTURED',
        location: 'Factory'
      }];
      localStorage.setItem('supply_chain_history', JSON.stringify(history));

      // Trigger a storage event to notify other components
      window.dispatchEvent(new Event('storage'));

      return mockProductId;
    } catch (error) {
      console.error('Failed to register product:', error);
      throw error;
    }
  }

  async verifyProduct(qrCode: string): Promise<Product | null> {
    try {
      // Mock implementation using localStorage
      const products = JSON.parse(localStorage.getItem('blockchain_products') || '{}');
      const product = products[qrCode];
      
      if (!product) {
        return null;
      }

      return product;
    } catch (error) {
      console.error('Failed to verify product:', error);
      return null;
    }
  }

  async transferOwnership(productId: number, newOwner: string, eventType: string, location: string): Promise<boolean> {
    try {
      if (!this.account) {
        throw new Error('Blockchain not initialized');
      }

      // Mock implementation
      const products = JSON.parse(localStorage.getItem('blockchain_products') || '{}');
      const product = Object.values(products).find((p: any) => p.productId === productId) as any;
      
      if (product && product.currentOwner === this.account) {
        product.currentOwner = newOwner;
        localStorage.setItem('blockchain_products', JSON.stringify(products));

        // Update supply chain history
        const history = JSON.parse(localStorage.getItem('supply_chain_history') || '{}');
        if (!history[productId]) {
          history[productId] = [];
        }
        history[productId].push({
          from: this.account,
          to: newOwner,
          timestamp: Date.now(),
          eventType,
          location
        });
        localStorage.setItem('supply_chain_history', JSON.stringify(history));

        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to transfer ownership:', error);
      return false;
    }
  }

  async getSupplyChainHistory(productId: number): Promise<SupplyChainEvent[]> {
    try {
      const history = JSON.parse(localStorage.getItem('supply_chain_history') || '{}');
      return history[productId] || [];
    } catch (error) {
      console.error('Failed to get supply chain history:', error);
      return [];
    }
  }

  async getProductsByManufacturer(manufacturer: string): Promise<Product[]> {
    try {
      const products = JSON.parse(localStorage.getItem('blockchain_products') || '{}');
      return Object.values(products).filter((product: any) => 
        product.manufacturer.toLowerCase() === manufacturer.toLowerCase()
      ) as Product[];4
    } catch (error) {
      console.error('Failed to get products by manufacturer:', error);
      return [];
    }
  }

  async reportCounterfeit(productId: number, reason: string): Promise<boolean> {
    try {
      const products = JSON.parse(localStorage.getItem('blockchain_products') || '{}');
      const product = Object.values(products).find((p: any) => p.productId === productId) as any;
      
      if (product) {
        product.isAuthentic = false;
        localStorage.setItem('blockchain_products', JSON.stringify(products));

        // Log counterfeit report
        const reports = JSON.parse(localStorage.getItem('counterfeit_reports') || '[]');
        reports.push({
          productId,
          reason,
          reporter: this.account,
          timestamp: Date.now()
        });
        localStorage.setItem('counterfeit_reports', JSON.stringify(reports));

        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to report counterfeit:', error);
      return false;
    }
  }

  getAccount(): string | null {
    return this.account;
  }

  async connectWallet(): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        this.account = accounts[0];
        return this.account;
      } else {
        // Mock wallet connection
        this.account = '0x' + Math.random().toString(16).substr(2, 40);
        return this.account;
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return null;
    }
  }
}

export const blockchainService = new BlockchainService();