
'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useUserTransactions(roomIds: string[], count = 10) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomIds || roomIds.length === 0) {
      setLoading(false);
      setTransactions([]);
      return;
    }

    setLoading(true);

    // Keep track of all transactions from all listeners
    const allTransactionsMap = new Map<string, any>();

    const unsubscribes = roomIds.map(roomId => {
      const transactionsRef = collection(db, 'rooms', roomId, 'transactions');
      const q = query(transactionsRef, orderBy('createdAt', 'desc'));

      return onSnapshot(q, (querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.createdAt) {
                allTransactionsMap.set(doc.id, { id: doc.id, ...data });
            }
        });

        const combinedTransactions = Array.from(allTransactionsMap.values());
        
        // Sort on the client-side
        combinedTransactions.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());

        // Limit the results
        setTransactions(combinedTransactions.slice(0, count));
        setLoading(false);

      }, (error) => {
        console.error(`Error fetching transactions for room ${roomId}: `, error);
        setLoading(false);
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };

  }, [JSON.stringify(roomIds), count]);

  return { transactions, loading };
}
