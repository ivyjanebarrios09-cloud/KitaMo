
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useRoomTransactions(roomId, type = null) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    let q;
    const transactionsRef = collection(db, 'rooms', roomId, 'transactions');
    
    if (type) {
        // Querying and ordering by a single field doesn't require a composite index.
        // We will sort client-side if a different order is needed.
        q = query(
            transactionsRef,
            where('type', '==', type),
            orderBy('type', 'asc') // Order by the same field we filter on.
        );
    } else {
        // Order by creation time
        q = query(
            transactionsRef,
            orderBy('createdAt', 'desc')
        );
    }
    

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      // Sort by date client-side to get the desired order
      if (type) {
          data.sort((a, b) => (b.date?.toDate() || 0) - (a.date?.toDate() || 0));
      }
      setTransactions(data);
      setLoading(false);
    }, (error) => {
        console.error(`Error fetching ${type || 'all'} transactions: `, error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId, type]);

  return { transactions, loading };
}
