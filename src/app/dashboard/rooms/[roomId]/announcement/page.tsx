
'use client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/loader';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { addAnnouncement } from '@/lib/firebase-actions';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Megaphone, PlusCircle } from 'lucide-react';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
});

export default function AnnouncementPage() {
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();
  const params = useParams();
  const roomId = params.roomId as string;
  const { user } = useAuth();

  const form = useForm<z.infer<typeof announcementSchema>>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof announcementSchema>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to post an announcement.',
      });
      return;
    }
    setFormLoading(true);
    try {
      const userName =
        user.displayName || user.email?.split('@')[0] || 'Anonymous';
      await addAnnouncement(roomId, user.uid, userName, values);
      toast({
        title: 'Announcement Posted!',
        description: 'Your announcement has been shared with the room.',
      });
      form.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to post announcement. Please try again.',
      });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <Megaphone className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Announcements</h1>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Create an Announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Important Update" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your announcement here..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="w-full sm:w-auto" type="submit" disabled={formLoading}>
                {formLoading ? (
                  <Loader className="h-4 w-4" />
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Post Announcement
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <p className="text-center text-muted-foreground mt-4">
        Feature to view announcements is coming soon.
      </p>
    </div>
  );
}
