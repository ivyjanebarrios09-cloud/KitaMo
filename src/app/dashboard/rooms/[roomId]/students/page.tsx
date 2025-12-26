import { Users } from 'lucide-react';

export default function StudentsPage() {
  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Students</h1>
        </div>
        <p className="text-muted-foreground">
            This is where students in the room will be managed.
        </p>
    </div>
  );
}
