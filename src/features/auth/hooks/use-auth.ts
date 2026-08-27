"use client";

import { useState } from "react";
import { login, logout, resetPassword } from "../api/auth-client";
import type { LoginInput, ResetPasswordInput } from "../schema/auth-schema";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(input: LoginInput) {
    setIsLoading(true);
    setError(null);

    try {
      await login(input);
      window.location.assign("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    window.location.assign("/login");
  }

  async function handleResetPassword(input: ResetPasswordInput) {
    setIsLoading(true);
    setError(null);

    try {
      await resetPassword(input);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    handleLogin,
    handleLogout,
    handleResetPassword,
    isLoading,
    error,
  };
}
