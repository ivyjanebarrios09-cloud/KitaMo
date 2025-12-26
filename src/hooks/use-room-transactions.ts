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
        q = query(
            transactionsRef,
            where('type', '==', type),
            orderBy('date', 'desc')
        );
    } else {
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
