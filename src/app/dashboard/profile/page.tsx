
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/loader';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const { userProfile, loading: profileLoading } = useUserProfile(user?.uid);
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      name: userProfile?.name || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;
    setFormLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { name: values.name });
      toast({
        title: 'Profile Updated',
        description: 'Your name has been successfully updated.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setFormLoading(false);
    }
  };

  if (profileLoading) {
    return <div className="flex justify-center p-8"><Loader /></div>;
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
                <AvatarImage src={userProfile?.profilePic} alt={userProfile?.name} />
                <AvatarFallback>{userProfile?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className='space-y-1'>
                <p className="text-2xl font-semibold">{userProfile?.name}</p>
                <p className="text-muted-foreground">{userProfile?.email}</p>
            </div>
        </div>
      <Card className="shadow-md">
        <CardHeader>
            <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <CardTitle>Personal Information</CardTitle>
            </div>
          <CardDescription>
            Update your display name. Your email and role cannot be changed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Email Address</FormLabel>
                <Input value={userProfile?.email || ''} disabled />
                <FormDescription>
                    You cannot change your email address.
                </FormDescription>
              </div>
               <div className="space-y-2">
                <FormLabel>Role</FormLabel>
                <Input value={userProfile?.role || ''} disabled className="capitalize" />
                 <FormDescription>
                    Your role cannot be changed.
                </FormDescription>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? <Loader className="h-4 w-4" /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
