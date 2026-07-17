import type { User } from "@/types";

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthError {
  message: string;
  code?: string;
}
