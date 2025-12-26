
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/loader';
import { Megaphone, Receipt, Calendar as CalendarIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useRoomTransactions } from '@/hooks/use-room-transactions';
import { format } from 'date-fns';

const TransactionIcon = ({ type }) => {
  switch (type) {
    case 'expense':
      return <Receipt className="h-5 w-5 text-destructive" />;
    case 'deadline':
      return <CalendarIcon className="h-5 w-5 text-blue-500" />;
    case 'payment':
        return <Receipt className="h-5 w-5 text-green-500" />;
    default:
      return <Megaphone className="h-5 w-5 text-muted-foreground" />;
  }
};

export default function AnnouncementPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { transactions, loading } = useRoomTransactions(roomId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <Megaphone className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Activity Feed</h1>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Room History</CardTitle>
          <CardDescription>
            A log of all expenses, payments, and deadlines for this room.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader />
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-6">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <TransactionIcon type={transaction.type} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{transaction.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.date
                          ? format(transaction.date.toDate(), 'PP')
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <Badge
                            variant={
                            transaction.type === 'expense'
                                ? 'destructive'
                                : transaction.type === 'payment' ? 'secondary' : 'default'
                            }
                            className="capitalize"
                        >
                            {transaction.type}
                        </Badge>
                        <p className="font-medium text-right">
                            ₱{transaction.amount.toFixed(2)}
                        </p>
                    </div>
                     {transaction.studentName && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Paid by: {transaction.studentName}
                        </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-16">
              <p>No activity recorded yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
