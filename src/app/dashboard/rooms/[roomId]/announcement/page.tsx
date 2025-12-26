import { Megaphone } from 'lucide-react';

export default function AnnouncementPage() {
  return (
    <div className="flex flex-col gap-4">
       <div className="flex items-center gap-2">
            <Megaphone className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Announcements</h1>
       </div>
      <p className="text-muted-foreground">
        This is where announcements for the room will be displayed.
      </p>
    </div>
  );
}
