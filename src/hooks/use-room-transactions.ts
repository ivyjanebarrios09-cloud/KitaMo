
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
            const transactionsRef = collection(db, 'rooms', roomId, 'transactions');
            // Fetch all transactions for the room, sorted by date.
            const q = query(
                transactionsRef,
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            let data: any[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });

            // If a type is specified, filter on the client.
            if (type) {
                data = data.filter(t => t.type === type);
            }
            
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
