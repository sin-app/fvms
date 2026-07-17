"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, logout, resetPassword } from "../api/auth-client";
import type { LoginInput, ResetPasswordInput } from "../schema/auth-schema";

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(input: LoginInput) {
    setIsLoading(true);
    setError(null);

    try {
      await login(input);
      router.push("/dashboard");
      router.refresh();
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
    router.push("/login");
    router.refresh();
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
