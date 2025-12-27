
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { useParams } from 'next/navigation';
import { Loader } from '@/components/loader';
import { useRoomTransactions } from '@/hooks/use-room-transactions';

export default function ExpensesPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { transactions: expenses, loading } = useRoomTransactions(roomId, 'debit');

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <Wallet className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Expenses</h1>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Room Expenses</CardTitle>
          <CardDescription>
            All expenses posted for this room.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    <div className="flex justify-center p-8">
                      <Loader />
                    </div>
                  </TableCell>
                </TableRow>
              ) : expenses.length > 0 ? (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {expense.createdAt
                        ? format(expense.createdAt.toDate(), 'PP')
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell className="text-right font-medium">
                      ₱{expense.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No expenses posted yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
