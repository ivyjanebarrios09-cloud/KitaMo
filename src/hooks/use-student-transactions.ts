
'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  getDocs,
  collectionGroup,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useStudentTransactions(roomIds: string[], count = 10) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomIds || roomIds.length === 0) {
      setLoading(false);
      setTransactions([]);
      return;
    }

    setLoading(true);
    
    // Firestore 'in' queries on different fields are not supported in collection group queries.
    // We must fetch and merge. For now, we'll just query by roomIds which is supported.
    const fetchTransactions = async () => {
        try {
            const q = query(
                collectionGroup(db, 'transactions'),
                where('roomId', 'in', roomIds),
                orderBy('createdAt', 'desc'),
              );
        
              const querySnapshot = await getDocs(q);
              const transactionsData: any[] = [];
              querySnapshot.forEach((doc) => {
                transactionsData.push({
                  id: doc.id,
                  ...doc.data(),
                });
              });
      
              setTransactions(transactionsData.slice(0, count));

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
