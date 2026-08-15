import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
  firstName: string;
  lastName: string;
  phone?: string;
}

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  addresses: Address[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchAddresses: () => Promise<void>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      setUser(data.data);
      setAddresses(data.data.addresses || []);
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }

    // Listen to global logout events from Axios response interceptor
    const handleGlobalLogout = () => {
      setUser(null);
      setAddresses([]);
    };
    window.addEventListener('auth-logout', handleGlobalLogout);

    return () => {
      window.removeEventListener('auth-logout', handleGlobalLogout);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser(data.data.user);
    // Fetch profile to load addresses
    await fetchProfile();
  };

  const register = async (regData: any) => {
    await api.post('/auth/register', regData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout API failed:', err);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      setAddresses([]);
    }
  };

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/auth/profile');
      setAddresses(data.data.addresses || []);
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    }
  };

  const addAddress = async (addressData: Omit<Address, 'id'>) => {
    try {
      // In this setup, we can write a simple endpoint or extend profile to add addresses.
      // Let's check how addresses are handled. In the schema, Address is a separate table referencing User.
      // We will create a simple endpoint on the backend or add a POST endpoint for address if needed.
      // For now, we can submit it as part of checkout or create a user address.
      // Let's implement this endpoint in the backend when needed.
      await api.post('/auth/profile/addresses', addressData);
      await fetchAddresses();
    } catch (err) {
      console.error('Failed to add address:', err);
      throw err;
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user ? (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        addresses,
        loading,
        login,
        register,
        logout,
        fetchAddresses,
        addAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
