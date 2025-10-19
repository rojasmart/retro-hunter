"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { AuthState, AuthContextType, User, LoginCredentials, RegisterCredentials, ApiAuthResponse } from "@/lib/types/auth";

// Estado inicial
const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Tipos de ações
type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" };

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar se há um usuário logado no localStorage
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          dispatch({ type: "SET_LOADING", payload: false });
          return;
        }

        // Verificar se o token ainda é válido
        const response = await fetch("/api/auth/verify", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data: ApiAuthResponse = await response.json();
          if (data.success && data.user) {
            dispatch({ type: "SET_USER", payload: data.user });
          } else {
            localStorage.removeItem("auth_token");
            dispatch({ type: "SET_LOADING", payload: false });
          }
        } else {
          localStorage.removeItem("auth_token");
          dispatch({ type: "SET_LOADING", payload: false });
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        localStorage.removeItem("auth_token");
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    checkAuthStatus();
  }, []);

  // Função de login
  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data: ApiAuthResponse = await response.json();

      if (response.ok && data.success && data.user && data.token) {
        localStorage.setItem("auth_token", data.token);
        dispatch({ type: "SET_USER", payload: data.user });
      } else {
        dispatch({ type: "SET_ERROR", payload: data.message || "Erro no login" });
      }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Erro de conexão" });
    }
  };

  // Função de registro
  const register = async (credentials: RegisterCredentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      if (credentials.password !== credentials.confirmPassword) {
        dispatch({ type: "SET_ERROR", payload: "As senhas não coincidem" });
        return;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: credentials.name,
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data: ApiAuthResponse = await response.json();

      if (response.ok && data.success && data.user && data.token) {
        localStorage.setItem("auth_token", data.token);
        dispatch({ type: "SET_USER", payload: data.user });
      } else {
        dispatch({ type: "SET_ERROR", payload: data.message || "Erro no registro" });
      }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Erro de conexão" });
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      localStorage.removeItem("auth_token");
      dispatch({ type: "LOGOUT" });
    }
  };

  // Função para limpar erro
  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value: AuthContextType = {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
