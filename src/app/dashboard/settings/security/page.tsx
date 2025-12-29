
'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/auth-context';
import { Lock, Settings, LogOut } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader } from '@/components/loader';
  

export default function AccountSecurityPage() {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async () => {
        if (!user?.email) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No email address found for your account.',
            });
            return;
        }

        setLoading(true);
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
            setLoading(false);
        }
    };
  
    return (
        <Card>
            <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>
                    Manage your password, privacy, and log out from your account.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="flex items-center gap-4">
                        <Input type="password" value="••••••••••" readOnly disabled />
                        <Button variant="outline" onClick={handleChangePassword} disabled={loading}>
                            {loading ? <Loader className='h-4 w-4' /> : 'Change Password'}
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Click "Change Password" to receive a password reset link via email.
                    </p>
                </div>

                <Separator />

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Privacy Settings</h3>
                    <Card className='bg-muted/30'>
                        <CardContent className='p-4 flex items-center justify-between'>
                            <div>
                                <h4 className='font-medium'>Public Profile</h4>
                                <p className='text-sm text-muted-foreground'>Allow others to see your profile information.</p>
                            </div>
                            <Switch disabled/>
                        </CardContent>
                    </Card>
                </div>

                <Separator />
                
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Log Out</h3>
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
    );
}
