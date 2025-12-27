
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useRoomTransactions(roomId: string, type: string | null = null) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const transactionsRef = collection(db, 'rooms', roomId, 'transactions');
    const q = query(
        transactionsRef,
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        let data: any[] = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });

        if (type) {
            data = data.filter(t => t.type === type);
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
