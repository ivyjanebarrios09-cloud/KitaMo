
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AppearancePage() {
  const { setTheme, theme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
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
                <Sun/> Light
            </Button>
            <Button
                variant={'outline'}
                className={cn('w-full justify-start gap-2', theme === 'dark' && 'border-primary ring-2 ring-primary')}
                onClick={() => setTheme('dark')}
            >
                <Moon/> Dark
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
