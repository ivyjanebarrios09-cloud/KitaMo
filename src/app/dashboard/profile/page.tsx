
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
  

export default function AccountSecurityPage() {
    const { logout } = useAuth();
  
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        <CardTitle>Account Security</CardTitle>
                    </div>
                    <CardDescription>
                        Manage your password, privacy, and log out from your account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <div className="flex items-center gap-4">
                        <Input type="password" value="••••••••••" readOnly disabled />
                        <Button variant="outline" disabled>Change Password</Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                        Password change functionality is not yet available.
                        </p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className='flex items-center gap-2'>
                            <Settings className='w-5 h-5' />
                            <h3 className="text-lg font-semibold">Privacy Settings</h3>
                        </div>
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
                        <div className='flex items-center gap-2'>
                            <LogOut className='w-5 h-5' />
                            <h3 className="text-lg font-semibold">Switch or Log Out</h3>
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
