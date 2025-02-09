import { useState, useEffect } from 'react';
import { db } from '@/firebase/server';
import { collection, query, where, getDocs } from 'firebase/firestore';

export function useEnvironment(userEmail: string | null | undefined) {
  const [environment, setEnvironment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEnvironment() {
      if (!userEmail) {
        setLoading(false);
        return;
      }

      try {
        const relationshipsRef = collection(db, 'relationships');
        const q = query(relationshipsRef, where('email', '==', userEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('No environment found for this user');
          setLoading(false);
          return;
        }

        const doc = querySnapshot.docs[0];
        setEnvironment(doc.data().environment);
        setError(null);
      } catch (err) {
        console.error('Error fetching environment:', err);
        setError('Failed to fetch environment');
      } finally {
        setLoading(false);
      }
    }

    fetchEnvironment();
  }, [userEmail]);

  return { environment, loading, error };
} 