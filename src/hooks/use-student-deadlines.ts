
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// This hook combines deadlines with student-specific payment information
export function useStudentDeadlines(roomId: string, studentId: string) {
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Fetch all transactions, then filter/process on client to avoid composite indexes
    const transactionsRef = collection(db, 'rooms', roomId, 'transactions');
    const transactionsQuery = query(transactionsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
        const allTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const allDeadlines = allTransactions
          .filter(t => t.type === 'deadline')
          .sort((a,b) => b.dueDate.toDate() - a.dueDate.toDate());
        
        const studentPayments = allTransactions
          .filter(t => t.type === 'credit' && t.userId === studentId);

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
        console.error("Error fetching transactions for student deadlines: ", error);
        setLoading(false);
    });

    return () => unsubscribe();

  }, [roomId, studentId]);

  return { deadlines, loading };
}
