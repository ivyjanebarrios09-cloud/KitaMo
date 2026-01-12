
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { useUserProfile } from '@/hooks/use-user-profile';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader } from '@/components/loader';
import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, SunMoon, Lock, LogOut } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { sendPasswordResetEmail } from 'firebase/auth';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { userProfile, loading } = useUserProfile(user?.uid);
  const { toast } = useToast();
  const [formLoading, setFormLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { setTheme, theme } = useTheme();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        name: userProfile.name,
      });
    }
  }, [userProfile, form]);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
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
  }

  const handleChangePassword = async () => {
    if (!user?.email) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No email address found for your account.',
        });
        return;
    }

    setPasswordLoading(true);
    try {
        await sendPasswordResetEmail(auth, user.email);
        toast({
            title: 'Password Reset Email Sent',
            description: `An email has been sent to ${user.email} with instructions to reset your password.`,
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Failed to send password reset email.',
        });
    } finally {
        setPasswordLoading(false);
    }
};

  if (loading) {
    return (
      <div className="flex justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your photo and personal details here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={userProfile?.profilePic} alt={userProfile?.name} />
              <AvatarFallback>
                  <User className='h-8 w-8'/>
              </AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <h3 className="text-lg font-semibold">{userProfile?.name}</h3>
              <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{userProfile?.role}</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <FormField
                control={form.control}
                name="email"
                render={() => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input readOnly disabled value={userProfile?.email || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="role"
                render={() => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input readOnly disabled value={userProfile?.role || ''} className="capitalize" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={formLoading}>
                  {formLoading ? <Loader className="h-4 w-4" /> : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <SunMoon className="w-5 h-5" />
                    <CardTitle>Appearance</CardTitle>
                </div>
                <CardDescription>
                Customize the look and feel of your interface.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                <h3 className="text-lg font-medium">Theme</h3>
                <p className="text-sm text-muted-foreground">
                    Select the theme for the dashboard.
                </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={'outline'}
                        className={cn('w-full justify-start gap-2', theme === 'light' && 'border-primary ring-2 ring-primary')}
                        onClick={() => setTheme('light')}
                    >
                        <User className="h-4 w-4"/> Light
                    </Button>
                    <Button
                        variant={'outline'}
                        className={cn('w-full justify-start gap-2', theme === 'dark' && 'border-primary ring-2 ring-primary')}
                        onClick={() => setTheme('dark')}
                    >
                        <Moon className="h-4 w-4"/> Dark
                    </Button>
                </div>
            </CardContent>
        </Card>
      
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    <CardTitle>Account Security</CardTitle>
                </div>
                <CardDescription>
                    Manage your password and log out from your account.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="flex items-center gap-4">
                        <Input type="password" value="••••••••••" readOnly disabled />
                        <Button variant="outline" onClick={handleChangePassword} disabled={passwordLoading}>
                            {passwordLoading ? <Loader className='h-4 w-4' /> : 'Change Password'}
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Click "Change Password" to receive a password reset link via email.
                    </p>
                </div>

                <Separator />
                
                <div className="space-y-4">
                    <div className='flex items-center gap-2'>
                        <LogOut className='w-5 h-5' />
                        <h3 className="text-lg font-semibold">Log Out</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Sign out of your current account to log in with a different one or to end your session.
                    </p>
                    <Button variant="destructive" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
