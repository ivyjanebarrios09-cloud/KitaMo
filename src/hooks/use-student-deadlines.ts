
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// This hook combines deadlines with student-specific payment information
export function useStudentDeadlines(roomId, studentId) {
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !studentId) {
      setLoading(false);
      return;
    }

    const deadlinesRef = collection(db, 'rooms', roomId, 'deadlines');
    const deadlinesQuery = query(deadlinesRef, orderBy('date', 'desc'));

    const unsubscribeDeadlines = onSnapshot(deadlinesQuery, (deadlinesSnapshot) => {
        const allDeadlines = deadlinesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const paymentsRef = collection(db, 'rooms', roomId, 'transactions');
        const paymentsQuery = query(paymentsRef, 
            where('studentId', '==', studentId), 
            where('type', '==', 'payment')
        );

        const unsubscribePayments = onSnapshot(paymentsQuery, (paymentsSnapshot) => {
            const studentPayments = paymentsSnapshot.docs.map(doc => doc.data());

            const processedDeadlines = allDeadlines.map(deadline => {
                const paymentsForDeadline = studentPayments.filter(p => p.deadlineId === deadline.id);
                const amountPaid = paymentsForDeadline.reduce((sum, p) => sum + p.amount, 0);
                
                // Consider floating point inaccuracies
                const isPaid = amountPaid >= deadline.amount - 0.001;
                
                return {
                    ...deadline,
                    amountPaid: amountPaid,
                    status: isPaid ? 'Paid' : 'Unpaid'
                };
            });

            setDeadlines(processedDeadlines);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching student payments: ", error);
            setLoading(false);
        });

        return () => unsubscribePayments();
    }, (error) => {
        console.error("Error fetching deadlines: ", error);
        setLoading(false);
    });

    return () => unsubscribeDeadlines();

  }, [roomId, studentId]);

  return { deadlines, loading };
}
