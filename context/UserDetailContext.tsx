import { createContext } from "react";

interface User {
  id: string;
  full_name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

interface UserDetailContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

export const UserDetailContext = createContext<UserDetailContextType | null>(null);
