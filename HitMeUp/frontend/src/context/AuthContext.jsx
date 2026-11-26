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

  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem("token");
    return stored && stored !== "undefined" && stored !== "null" ? stored : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hydrate & verify user profile on application startup
  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      const storedToken = localStorage.getItem("token");
      if (!storedToken || storedToken === "undefined" || storedToken === "null") {
        try {
          const response = await authApi.getMe();
          if (isMounted && response?.user) {
            setUser(response.user);
            localStorage.setItem("user", JSON.stringify(response.user));
          }
        } catch (_) {}
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (isMounted && response?.user) {
          setUser(response.user);
          setToken(true);
        }
      } catch (err) {
        console.warn("Session expired or invalid token:", err.message);
        if (isMounted) {
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

      if (receivedToken && receivedToken !== "undefined" && receivedToken !== "null") {
        localStorage.setItem("token", receivedToken);
        setToken(receivedToken);
      }
      if (receivedUser) {
        localStorage.setItem("user", JSON.stringify(receivedUser));
        setUser(receivedUser);
      }

      return receivedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    setError(null);
    try {
      const response = await authApi.googleLogin(credential);
      const { token: receivedToken, user: receivedUser } = response;

      if (receivedToken && receivedToken !== "undefined" && receivedToken !== "null") {
        localStorage.setItem("token", receivedToken);
        setToken(receivedToken);
      }
      if (receivedUser) {
        localStorage.setItem("user", JSON.stringify(receivedUser));
        setUser(receivedUser);
      }

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

      if (receivedToken && receivedToken !== "undefined" && receivedToken !== "null") {
        localStorage.setItem("token", receivedToken);
        setToken(receivedToken);
      }
      if (receivedUser) {
        localStorage.setItem("user", JSON.stringify(receivedUser));
        setUser(receivedUser);
      }

      return receivedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const response = await authApi.updateProfile(data);
    if (response?.user) {
      setUser(response.user);
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
    loginWithGoogle,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { useAuth } from "./useAuth";
export default AuthContext;
