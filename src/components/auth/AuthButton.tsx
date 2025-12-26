"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "./AuthModal";

export default function AuthButton() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 text-sm text-cyan-300 hover:text-cyan-100 focus:outline-none transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:block font-medium">{user.name}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl py-2 z-50 border border-cyan-400/50 backdrop-blur-sm">
            <a
              href="/"
              className="block px-4 py-2 text-sm text-green-300 hover:bg-gray-700/50 hover:text-green-100 transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              Home
            </a>
            <a
              href="/my-account"
              className="block px-4 py-2 text-sm text-cyan-300 hover:bg-gray-700/50 hover:text-cyan-100 transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              Account
            </a>
            <a
              href="/my-collection"
              className="block px-4 py-2 text-sm text-pink-300 hover:bg-gray-700/50 hover:text-pink-100 transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              Collection
            </a>
            <hr className="my-2 border-gray-600" />
            <button
              onClick={() => {
                logout();
                setIsDropdownOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-purple-300 hover:bg-gray-700/50 hover:text-purple-100 transition-colors"
            >
              Logout
            </button>
          </div>
        )}

        {/* Overlay para fechar dropdown */}
        {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 border border-cyan-400/50 hover:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
        >
          Login
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-sm font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 border border-pink-400/50 hover:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-pink-400/50"
        >
          Register
        </button>
      </div>

      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} defaultMode="login" />
    </>
  );
}
