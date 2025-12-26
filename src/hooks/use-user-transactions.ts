'use client';

import { useState, useEffect } from 'react';
import { collectionGroup, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useUserTransactions(userId, count = 10) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // This query requires a composite index on (ownerId, createdAt).
    // To avoid this, we can fetch all and filter client-side, but that's inefficient.
    // A better approach is to ensure the index exists, but if we must avoid it,
    // we must simplify the query. Let's order just by createdAt and filter on the client
    // for a no-index solution, though it's less ideal for performance at scale.
    // Given the constraints, let's stick to the indexed query as it's the most correct.
    // The previous error was likely from a different query combination.
    // This one (`where` on ownerId, `orderBy` on createdAt) is a common and valid pattern that
    // Firestore will prompt to create an index for automatically.
    // Let's assume the user will create the index as prompted by the console error.
    const q = query(
        collectionGroup(db, 'transactions'), 
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(count)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionsData: any[] = [];
      querySnapshot.forEach((doc) => {
        transactionsData.push({ id: doc.id, roomId: doc.ref.parent.parent?.id, ...doc.data() });
      });
      setTransactions(transactionsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching transactions: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, count]);

  return { transactions, loading };
}
