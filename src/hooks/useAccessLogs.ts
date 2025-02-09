import { useState, useEffect } from 'react';
import { db } from '@/firebase/server';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';

interface AccessLog {
  id: string;
  action: string;
  timestamp: Timestamp;
  uid: string;
}

export function useAccessLogs(environment: string | null) {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      if (!environment) {
        setLoading(false);
        return;
      }

      try {
        const logsRef = collection(db, environment, 'access-logs', 'data');
        const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100)); // Get last 100 logs
        const querySnapshot = await getDocs(q);
        
        const logsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AccessLog));

        setLogs(logsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching access logs:', err);
        setError('Failed to fetch access logs');
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [environment]);

  return { logs, loading, error };
} 