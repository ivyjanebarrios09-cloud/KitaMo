
'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/loader';
import { Megaphone, Receipt, Building, Users as UsersIcon, Heart, Eye } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useRoomTransactions } from '@/hooks/use-room-transactions';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { markTransactionAsSeen } from '@/lib/firebase-actions';
import { useRoom } from '@/hooks/use-room';
import { useUserProfile } from '@/hooks/use-user-profile';


const TransactionIcon = ({ type }) => {
    let icon;
    let bgColor = 'bg-muted';
    let iconColor = 'text-muted-foreground';

    switch (type) {
      case 'debit': // Expense
        icon = <Building className="h-6 w-6" />;
        bgColor = 'bg-red-100 dark:bg-red-900/30';
        iconColor = 'text-red-600 dark:text-red-400';
        break;
      case 'deadline':
        icon = <UsersIcon className="h-6 w-6" />;
        bgColor = 'bg-blue-100 dark:bg-blue-900/30';
        iconColor = 'text-blue-600 dark:text-blue-400';
        break;
      case 'credit': // Payment
          icon = <Receipt className="h-6 w-6" />;
          bgColor = 'bg-green-100 dark:bg-green-900/30';
          iconColor = 'text-green-600 dark:text-green-400';
          break;
      default:
        icon = <Megaphone className="h-6 w-6" />;
        break;
    }
    return (
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${bgColor}`}>
            <div className={iconColor}>{icon}</div>
        </div>
    )
  };

export default function AnnouncementPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { transactions, loading } = useRoomTransactions(roomId);
  const { user } = useAuth();
  const { userProfile } = useUserProfile(user?.uid);
  const { room } = useRoom(roomId);

  const isChairperson = user?.uid === room?.createdBy;

  const handleSeen = (transactionId: string) => {
    if (!user) return;
    markTransactionAsSeen(roomId, transactionId, user.uid);
  };
  
  const hasSeen = (transaction) => {
    if (!user) return false;
    return transaction.seenBy?.includes(user.uid);
  }

  const getTransactionSubtitle = (transaction) => {
      let subtitle = "New "
      if (transaction.type === 'deadline') {
          subtitle += "Fund Deadline";
      } else if (transaction.type === 'debit') {
          subtitle += "Expense";
      } else {
        subtitle += "Payment"
      }

      if(transaction.createdAt) {
        subtitle += ` - ${format(transaction.createdAt.toDate(), 'MMMM do, yyyy')}`
      }
      return subtitle;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <Megaphone className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Activity Feed</h1>
      </div>

        {loading ? (
        <div className="flex justify-center p-8">
            <Loader />
        </div>
        ) : transactions.length > 0 ? (
        <div className="space-y-6">
            {transactions.map((transaction) => (
            <Card key={transaction.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <TransactionIcon type={transaction.type} />
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{transaction.description}</h3>
                                    <p className="text-sm text-muted-foreground">{getTransactionSubtitle(transaction)}</p>
                                </div>
                                <Badge
                                    variant={
                                    transaction.type === 'debit'
                                        ? 'destructive'
                                        : transaction.type === 'credit' ? 'secondary' : 'outline'
                                    }
                                    className="capitalize"
                                >
                                    {transaction.type}
                                </Badge>
                            </div>

                            <p className="text-2xl font-bold mt-1">₱{transaction.amount.toFixed(2)}</p>
                           
                            {transaction.userName && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {transaction.type === 'credit' ? 'Paid by:' : 'Added by:'} {transaction.userName}
                                </p>
                            )}
                             <div className="flex items-center justify-between mt-4">
                                {isChairperson ? (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Eye className="w-4 h-4 mr-1"/>
                                        <span>{transaction.seenBy?.length || 0} seen</span>
                                    </div>
                                ) : (
                                    <Button 
                                        variant={hasSeen(transaction) ? "secondary" : "default"} 
                                        size="sm" 
                                        onClick={() => handleSeen(transaction.id)} 
                                        disabled={hasSeen(transaction)}
                                        className={hasSeen(transaction) ? "bg-primary/10 text-primary-foreground" : ""}
                                    >
                                        <Heart className={`w-4 h-4 mr-2 ${hasSeen(transaction) ? 'fill-primary' : ''}`}/>
                                        {hasSeen(transaction) ? "Seen" : "Mark as Seen"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            ))}
        </div>
        ) : (
        <div className="text-center text-muted-foreground py-16">
            <p>No activity recorded yet.</p>
        </div>
        )}
    </div>
  );
}
