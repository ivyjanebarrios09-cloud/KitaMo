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

    const fetchDeadlinesAndPayments = async () => {
        setLoading(true);
        try {
            // 1. Fetch all deadlines for the room
            const deadlinesRef = collection(db, 'rooms', roomId, 'deadlines');
            const deadlinesQuery = query(deadlinesRef, orderBy('date', 'desc'));
            const deadlinesSnapshot = await getDocs(deadlinesQuery);
            const allDeadlines = deadlinesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 2. Fetch all payments made by the student for this room
            const paymentsRef = collection(db, 'rooms', roomId, 'transactions');
            const paymentsQuery = query(paymentsRef, 
                where('studentId', '==', studentId), 
                where('type', '==', 'payment')
            );
            const paymentsSnapshot = await getDocs(paymentsQuery);
            const studentPayments = paymentsSnapshot.docs.map(doc => doc.data());

            // 3. Map payments to deadlines
            const processedDeadlines = allDeadlines.map(deadline => {
                // Find payments specifically for this deadline
                const paymentsForDeadline = studentPayments.filter(p => p.deadlineId === deadline.id);
                const amountPaid = paymentsForDeadline.reduce((sum, p) => sum + p.amount, 0);
                const isPaid = amountPaid >= deadline.amount;
                
                return {
                    ...deadline,
                    amountPaid: amountPaid,
                    status: isPaid ? 'Paid' : 'Unpaid'
                };
            });

            setDeadlines(processedDeadlines);
        } catch (error) {
            console.error("Error fetching student deadlines and payments: ", error);
        } finally {
            setLoading(false);
        }
    }

    // Since we are combining multiple queries, we can't use a single snapshot listener easily.
    // This fetches the data once. For real-time updates, a more complex setup would be needed.
    fetchDeadlinesAndPayments();

  }, [roomId, studentId]);

  return { deadlines, loading };
}
