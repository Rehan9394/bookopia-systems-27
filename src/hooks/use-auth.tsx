
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Owner } from '@/services/supabase-types';
import { loginUser, loginOwner } from '@/services/api';

type AuthContextType = {
  user: User | null;
  owner: Owner | null;
  isAuthenticated: boolean;
  isOwnerAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  ownerLogin: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  ownerLogout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  owner: null,
  isAuthenticated: false,
  isOwnerAuthenticated: false,
  loading: true,
  error: null,
  login: async () => false,
  ownerLogin: async () => false,
  logout: () => {},
  ownerLogout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for stored user/owner on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('hotelUser');
    const storedOwner = localStorage.getItem('hotelOwner');
    
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('hotelUser');
      }
    }
    
    if (storedOwner) {
      try {
        setOwner(JSON.parse(storedOwner));
      } catch (e) {
        console.error('Failed to parse stored owner', e);
        localStorage.removeItem('hotelOwner');
      }
    }
    
    setLoading(false);
  }, []);

  // Staff user login
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await loginUser(email, password);
      
      if (userData) {
        setUser(userData);
        localStorage.setItem('hotelUser', JSON.stringify(userData));
        setLoading(false);
        return true;
      } else {
        setError('Invalid email or password');
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
      setLoading(false);
      return false;
    }
  };

  // Owner login
  const ownerLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const ownerData = await loginOwner(email, password);
      
      if (ownerData) {
        setOwner(ownerData);
        localStorage.setItem('hotelOwner', JSON.stringify(ownerData));
        setLoading(false);
        return true;
      } else {
        setError('Invalid email or password');
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Owner login error:', err);
      setError('An error occurred during login');
      setLoading(false);
      return false;
    }
  };

  // Staff user logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('hotelUser');
  };

  // Owner logout
  const ownerLogout = () => {
    setOwner(null);
    localStorage.removeItem('hotelOwner');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        owner,
        isAuthenticated: !!user, 
        isOwnerAuthenticated: !!owner,
        loading, 
        error, 
        login,
        ownerLogin, 
        logout,
        ownerLogout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Protected route hook 
export const useRequireAuth = (role?: string[]) => {
  const { isAuthenticated, user, loading } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        setAuthorized(false);
      } else if (role && Array.isArray(role) && user) {
        setAuthorized(role.includes(user.role));
      } else {
        setAuthorized(true);
      }
    }
  }, [isAuthenticated, loading, role, user]);

  return { authorized, loading, isAuthenticated, user };
};

// Protected owner route hook
export const useRequireOwnerAuth = () => {
  const { isOwnerAuthenticated, owner, loading } = useAuth();
  
  return { authorized: isOwnerAuthenticated, loading, owner };
};
