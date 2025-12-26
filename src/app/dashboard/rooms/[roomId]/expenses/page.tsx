import { Wallet } from 'lucide-react';

export default function ExpensesPage() {
  return (
    <div className="flex flex-col gap-4">
       <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Expenses</h1>
       </div>
      <p className="text-muted-foreground">
        This is where room expenses will be managed.
      </p>
    </div>
  );
}
