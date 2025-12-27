
'use client';

import { useState, useEffect } from 'react';
import {
  collectionGroup,
  query,
  where,
  getDocs,
  orderBy,
  limit,
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

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            // Firestore 'in' queries are limited to 30 values.
            // Removed orderBy('createdAt') to avoid needing a composite index.
            // Sorting will be done on the client.
            const q = query(
                collectionGroup(db, 'transactions'),
                where('roomId', 'in', roomIds)
            );

            const querySnapshot = await getDocs(q);
            const transactionsData: any[] = [];
            querySnapshot.forEach((doc) => {
                transactionsData.push({
                id: doc.id,
                ...doc.data(),
                });
            });
            
            // Sort and limit the results on the client side.
            const sortedAndLimited = transactionsData
                .sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate())
                .slice(0, count);

            setTransactions(sortedAndLimited);
        } catch (error) {
            console.error('Error fetching user transactions: ', error);
        } finally {
            setLoading(false);
        }
    };

    fetchTransactions();

    // The dependency array ensures this effect runs when roomIds change.
  }, [JSON.stringify(roomIds), count]);

  return { transactions, loading };
}
