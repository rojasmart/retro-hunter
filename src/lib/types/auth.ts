export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  isVerified?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export interface ApiAuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  token?: string;
}

export interface Collection {
  id: string;
  userId: string;
  games: CollectionGame[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionGame {
  id: string;
  title: string;
  platform: string;
  condition: string;
  purchasePrice?: number;
  purchaseDate?: Date;
  notes?: string;
  image?: string;
  addedAt: Date;
}
