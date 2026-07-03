import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { apiFetch } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const persist = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await apiFetch("/auth/login", { method: "POST", body: { email, password } });
      persist(data.token, data.user);
      return data.user;
    },
    [persist],
  );

  const register = useCallback(
    async (payload) => {
      const data = await apiFetch("/auth/register", { method: "POST", body: payload });
      persist(data.token, data.user);
      return data.user;
    },
    [persist],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const updateCredits = useCallback(
    (remainingCredits) => {
      setUser((prev) => {
        const next = { ...prev, remainingCredits };
        localStorage.setItem("user", JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ token, user, login, register, logout, updateCredits }),
    [token, user, login, register, logout, updateCredits],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
