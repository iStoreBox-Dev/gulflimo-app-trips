import { useState, useEffect } from 'react';
import { clearAuth, getUser } from '@/lib/auth';
import type { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const logout = async () => {
    await clearAuth();
    setUser(null);
  };

  return { user, loading, logout };
}
