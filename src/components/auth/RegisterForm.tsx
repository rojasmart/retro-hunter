"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { RegisterCredentials } from "@/lib/types/auth";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { register, isLoading, error } = useAuth();
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.name || !credentials.email || !credentials.password || !credentials.confirmPassword) {
      return;
    }

    if (credentials.password !== credentials.confirmPassword) {
      return;
    }

    try {
      await register(credentials);
      onSuccess?.();
    } catch (error) {
      // O erro já é tratado pelo contexto
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const passwordsMatch = credentials.password === credentials.confirmPassword;
  const showPasswordError = credentials.confirmPassword && !passwordsMatch;

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={credentials.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={credentials.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={credentials.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
            placeholder="••••••••"
            minLength={6}
          />
          <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar Senha
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={credentials.confirmPassword}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black${
              showPasswordError ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="••••••••"
          />
          {showPasswordError && <p className="text-xs text-red-600 mt-1">As senhas não coincidem</p>}
        </div>

        {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>}

        <button
          type="submit"
          disabled={isLoading || !credentials.name || !credentials.email || !credentials.password || !credentials.confirmPassword || !passwordsMatch}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-black"
        >
          {isLoading ? "Criando conta..." : "Criar conta"}
        </button>

        {onSwitchToLogin && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{" "}
              <button type="button" onClick={onSwitchToLogin} className="font-medium text-blue-600 hover:text-blue-500">
                Faça login aqui
              </button>
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
