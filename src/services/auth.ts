export interface User {
  id: number;
  email: string;
  name: string;
  role: 'manufacturer' | 'distributor' | 'consumer' | 'regulator';
  walletAddress?: string;
  company?: string;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

class AuthService {
  private storageKey = 'auth_state';

  constructor() {
    // Initialize with mock users for demo
    this.initializeMockUsers();
  }

  private initializeMockUsers() {
    const existingUsers = localStorage.getItem('users');
    if (!existingUsers) {
      const mockUsers: User[] = [
        {
          id: 1,
          email: 'manufacturer@example.com',
          name: 'John Manufacturer',
          role: 'manufacturer',
          company: 'TechCorp Manufacturing',
          walletAddress: '0x1234567890123456789012345678901234567890',
          createdAt: new Date()
        },
        {
          id: 2,
          email: 'distributor@example.com',
          name: 'Sarah Distributor',
          role: 'distributor',
          company: 'Global Distribution Inc',
          walletAddress: '0x2345678901234567890123456789012345678901',
          createdAt: new Date()
        },
        {
          id: 3,
          email: 'consumer@example.com',
          name: 'Mike Consumer',
          role: 'consumer',
          walletAddress: '0x3456789012345678901234567890123456789012',
          createdAt: new Date()
        },
        {
          id: 4,
          email: 'regulator@example.com',
          name: 'Lisa Regulator',
          role: 'regulator',
          company: 'Product Safety Authority',
          walletAddress: '0x4567890123456789012345678901234567890123',
          createdAt: new Date()
        }
      ];
      localStorage.setItem('users', JSON.stringify(mockUsers));
    }
  }

  async login(email: string, password: string): Promise<AuthState> {
    try {
      // Mock authentication - in production, this would validate against a secure backend
      const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === email);
      
      if (!user || password !== 'password') {
        throw new Error('Invalid credentials');
      }

      const token = this.generateMockToken(user.id);
      const authState: AuthState = {
        user,
        isAuthenticated: true,
        token
      };

      localStorage.setItem(this.storageKey, JSON.stringify(authState));
      return authState;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(userData: {
    email: string;
    name: string;
    password: string;
    role: User['role'];
    company?: string;
  }): Promise<AuthState> {
    try {
      const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Check if user already exists
      if (users.some(u => u.email === userData.email)) {
        throw new Error('User already exists');
      }

      const newUser: User = {
        id: users.length + 1,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        company: userData.company,
        createdAt: new Date()
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      const token = this.generateMockToken(newUser.id);
      const authState: AuthState = {
        user: newUser,
        isAuthenticated: true,
        token
      };

      localStorage.setItem(this.storageKey, JSON.stringify(authState));
      return authState;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
  }

  getCurrentAuthState(): AuthState {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const authState: AuthState = JSON.parse(stored);
        // Validate token (in production, this would involve server validation)
        if (this.validateToken(authState.token)) {
          return authState;
        }
      }
    } catch (error) {
      console.error('Failed to get auth state:', error);
    }

    return {
      user: null,
      isAuthenticated: false,
      token: null
    };
  }

  private generateMockToken(userId: number): string {
    const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
    const payload = btoa(JSON.stringify({ 
      sub: userId, 
      iat: Date.now(), 
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }));
    const signature = btoa('mock_signature');
    return `${header}.${payload}.${signature}`;
  }

  private validateToken(token: string | null): boolean {
    if (!token) return false;
    
    try {
      const [, payload] = token.split('.');
      const decoded = JSON.parse(atob(payload));
      return decoded.exp > Date.now();
    } catch {
      return false;
    }
  }

  async updateWalletAddress(userId: number, walletAddress: string): Promise<void> {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex >= 0) {
      users[userIndex].walletAddress = walletAddress;
      localStorage.setItem('users', JSON.stringify(users));
      
      // Update current auth state
      const authState = this.getCurrentAuthState();
      if (authState.user && authState.user.id === userId) {
        authState.user.walletAddress = walletAddress;
        localStorage.setItem(this.storageKey, JSON.stringify(authState));
      }
    }
  }
}

export const authService = new AuthService();