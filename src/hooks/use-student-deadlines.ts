
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
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
    
    const fetchStudentDeadlines = async () => {
        setLoading(true);
        try {
            const transactionsRef = collection(db, 'rooms', roomId, 'transactions');
            const transactionsQuery = query(transactionsRef, orderBy('createdAt', 'desc'));

            const snapshot = await getDocs(transactionsQuery);

            const allTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const allDeadlines = allTransactions
              .filter(t => t.type === 'deadline')
              .sort((a,b) => b.dueDate.toDate() - a.dueDate.toDate());
            
            const studentPayments = allTransactions
              .filter(t => t.type === 'credit' && t.userId === studentId);

            const processedDeadlines = allDeadlines.map(deadline => {
                const paymentsForDeadline = studentPayments.filter(p => p.deadlineId === deadline.id);
                const amountPaid = paymentsForDeadline.reduce((sum, p) => sum + p.amount, 0);
                
                const isPaid = amountPaid >= deadline.amount - 0.001;
                
                return {
                    ...deadline,
                    amountPaid: amountPaid,
                    status: isPaid ? 'Paid' : 'Unpaid'
                };
            });

            setDeadlines(processedDeadlines);
        } catch (error) {
            console.error("Error fetching transactions for student deadlines: ", error);
        } finally {
            setLoading(false);
        }
    };

    fetchStudentDeadlines();

  }, [roomId, studentId]);

  return { deadlines, loading };
}
