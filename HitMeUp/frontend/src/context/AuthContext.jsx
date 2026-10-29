import { useState, useEffect, useCallback } from "react";
import { authApi } from "../services/api";
import AuthContext from "./context";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hydrate & verify user profile on application startup
  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (isMounted && response?.user) {
          setUser(response.user);
          localStorage.setItem("user", JSON.stringify(response.user));
        }
      } catch (err) {
        console.warn("Session expired or invalid token:", err.message);
        if (isMounted) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const response = await authApi.login({ email, password });
      const { token: receivedToken, user: receivedUser } = response;

      localStorage.setItem("token", receivedToken);
      localStorage.setItem("user", JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);

      return receivedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const register = useCallback(async (userData) => {
    setError(null);
    try {
      const response = await authApi.register(userData);
      const { token: receivedToken, user: receivedUser } = response;

      localStorage.setItem("token", receivedToken);
      localStorage.setItem("user", JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);

      return receivedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const response = await authApi.updateProfile(data);
    if (response?.user) {
      setUser(response.user);
      localStorage.setItem("user", JSON.stringify(response.user));
    }
    return response;
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token && !!user,
    isBusiness: user?.role === "business" || user?.role === "seller",
    isSeller: user?.role === "business" || user?.role === "seller",
    isCustomer: user?.role === "customer" || user?.role === "buyer",
    isAdmin: user?.role === "admin",
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { useAuth } from "./useAuth";
export default AuthContext;
