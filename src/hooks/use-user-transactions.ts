'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useUserTransactions(userId, count = 10) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        // 1. Find all rooms owned by the user
        const roomsQuery = query(collection(db, 'rooms'), where('ownerId', '==', userId));
        const roomsSnapshot = await getDocs(roomsQuery);
        const roomIds = roomsSnapshot.docs.map(doc => doc.id);

        if (roomIds.length === 0) {
          setTransactions([]);
          setLoading(false);
          return;
        }

        // 2. Fetch transactions for each room
        const allTransactions: any[] = [];
        for (const roomId of roomIds) {
          const transactionsQuery = query(
            collection(db, 'rooms', roomId, 'transactions'),
            orderBy('createdAt', 'desc'),
            limit(count)
          );
          const transactionsSnapshot = await getDocs(transactionsQuery);
          transactionsSnapshot.forEach((doc) => {
            allTransactions.push({
              id: doc.id,
              roomId: roomId,
              ...doc.data(),
            });
          });
        }
        
        // 3. Sort all transactions by date and take the latest 'count'
        allTransactions.sort((a, b) => {
            const dateA = a.createdAt?.toDate() || 0;
            const dateB = b.createdAt?.toDate() || 0;
            return dateB - dateA;
        });

        setTransactions(allTransactions.slice(0, count));
      } catch (error) {
        console.error('Error fetching transactions: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
    // This is not a real-time listener, but it fetches on component mount/userId change.
    // A real-time version of this would be much more complex and involve many listeners.

  }, [userId, count]);

  return { transactions, loading };
}
