import { Calendar } from 'lucide-react';

export default function FundDeadlinesPage() {
  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Fund Deadlines</h1>
        </div>
      <p className="text-muted-foreground">
        This is where fund collection deadlines will be managed.
      </p>
    </div>
  );
}
