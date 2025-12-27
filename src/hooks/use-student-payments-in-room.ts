
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useStudentPaymentsInRoom(roomId: string, studentId: string) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !studentId) {
      setLoading(false);
      return;
    }

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const paymentsRef = collection(db, 'rooms', roomId, 'transactions');
            const q = query(
                paymentsRef, 
                where('userId', '==', studentId),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const data: any[] = [];
            querySnapshot.forEach((doc) => {
                const transaction = { id: doc.id, ...doc.data() };
                if (transaction.type === 'credit') {
                  data.push(transaction);
                }
            });
            setPayments(data);
        } catch (error) {
            console.error(`Error fetching student payments: `, error);
        } finally {
            setLoading(false);
        }
    }

    fetchPayments();

  }, [roomId, studentId]);

  return { payments, loading };
}
