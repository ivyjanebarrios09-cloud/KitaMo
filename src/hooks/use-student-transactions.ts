'use client';

import { useState, useEffect } from 'react';
import {
  collectionGroup,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useStudentTransactions(roomIds, count = 10) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomIds || roomIds.length === 0) {
      setLoading(false);
      setTransactions([]);
      return;
    }

    setLoading(true);
    const fetchTransactions = async () => {
        try {
            const q = query(
                collectionGroup(db, 'transactions'),
                where('roomId', 'in', roomIds),
                orderBy('createdAt', 'desc'),
                limit(count)
              );
        
              const querySnapshot = await getDocs(q);
              const transactionsData: any[] = [];
              querySnapshot.forEach((doc) => {
                transactionsData.push({
                  id: doc.id,
                  roomId: doc.data().roomId,
                  ...doc.data(),
                });
              });
      
              setTransactions(transactionsData);

        } catch (error) {
            console.error('Error fetching student transactions: ', error);
        } finally {
            setLoading(false);
        }
    }

    fetchTransactions();

  }, [JSON.stringify(roomIds), count]);

  return { transactions, loading };
}
