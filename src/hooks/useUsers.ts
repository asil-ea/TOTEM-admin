import { useState, useEffect, useCallback } from 'react';
import { db } from '@/firebase/server';
import { collection, getDocs } from 'firebase/firestore';

interface User {
  uid: string;
  name: string;
  role: string;
  active: boolean;
  secret: string;
}

export function useUsers(environment: string | null) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!environment) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const usersRef = collection(db, environment, 'users', 'data');
      const querySnapshot = await getDocs(usersRef);
      
      const usersData = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as User));

      setUsers(usersData);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [environment]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, mutate: fetchUsers };
} 