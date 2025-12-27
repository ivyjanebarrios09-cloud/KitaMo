
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useRoomTransactions(roomId: string, type: string | null = null) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            let q;
            const transactionsRef = collection(db, 'rooms', roomId, 'transactions');
            
            if (type) {
                q = query(
                    transactionsRef,
                    where('type', '==', type),
                    orderBy('createdAt', 'desc')
                );
            } else {
                q = query(
                    transactionsRef,
                    orderBy('createdAt', 'desc')
                );
            }

            const querySnapshot = await getDocs(q);
            const data: any[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            setTransactions(data);
        } catch (error) {
            console.error(`Error fetching ${type || 'all'} transactions: `, error);
        } finally {
            setLoading(false);
        }
    }

    fetchTransactions();
    
  }, [roomId, type]);

  return { transactions, loading };
}
