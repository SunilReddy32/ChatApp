import { createContext, useContext, useState, useEffect } from 'react';
import { getToken, getUser, logout as apiLogout } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUser());
  const [token, setToken] = useState(() => getToken());

  const signIn = (data) => {
    setToken(data.token);
    setUser({ id: data.userId, username: data.username, displayName: data.displayName, avatarColor: data.avatarColor || '#7c6af7', status: data.status });
  };

  const signOut = () => {
    apiLogout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
