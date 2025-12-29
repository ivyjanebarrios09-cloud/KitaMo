
'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { Loader } from '@/components/loader';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import AuthGuard from '@/components/auth-guard';

const formSchema = z.object({
  role: z.enum(['student', 'chairperson'], {
    required_error: 'You need to select a role.',
  }),
});

const Logo = () => (
  <div className="flex items-center gap-2">
    <img src="/image/logoooo.png" alt="KitaMo! Logo" className="h-7 w-7" />
    <span className="font-bold text-xl text-primary">KitaMo!</span>
  </div>
);

export default function SelectRolePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [formLoading, setFormLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not Authenticated',
            description: 'You must be logged in to select a role.'
        });
        return;
    }
    setFormLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        name: user.displayName,
        email: user.email,
        role: values.role,
        createdAt: serverTimestamp(),
        rooms: [],
        profilePic: user.photoURL || `https://avatar.vercel.sh/${user.email}.png`
      }, { merge: true });

      toast({
        title: 'Role Selected!',
        description: `Welcome! Your role has been set to ${values.role}.`,
      });
      router.push('/dashboard');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Saving Role',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setFormLoading(false);
    }
  }
  
  if (authLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader /></div>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-secondary/20">
        <div className="absolute top-6 left-6">
            <Logo />
        </div>
        <Card className="w-full max-w-sm shadow-xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl">One Last Step</CardTitle>
            <CardDescription>Please select your role to complete your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>What is your role?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="student" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Student
                              <p className="text-xs text-muted-foreground">I am a member of a class or organization.</p>
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="chairperson" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Financial Chairperson
                              <p className="text-xs text-muted-foreground">I will be managing funds for a group.</p>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={formLoading}>
                  {formLoading ? <Loader className="h-4 w-4" /> : 'Continue to Dashboard'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
