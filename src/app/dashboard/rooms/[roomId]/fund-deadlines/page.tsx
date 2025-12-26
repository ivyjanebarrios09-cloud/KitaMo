'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar as CalendarIcon, Wand2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import React from 'react';

export default function FundDeadlinesPage() {
  const [date, setDate] = React.useState<Date>();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Post a New Fund Deadline</CardTitle>
          <CardDescription>
            Create a deadline and use our AI tool to refine your message for
            students.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline Title</label>
              <Input placeholder="e.g., Spring Formal Tickets" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Amount per Student (₱)
              </label>
              <Input type="number" placeholder="0" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>mm/dd/yyyy</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input placeholder="e.g., Event Contribution" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description / Announcement
            </label>
            <Textarea
              placeholder="Write your announcement here. Example: 'Final reminder: formal tickets must be purchased by Friday!'"
              className="min-h-[100px]"
            />
          </div>
          <Button variant="outline">
            <Wand2 className="mr-2 h-4 w-4" />
            Review with AI
          </Button>
          <div className="space-y-2">
            <label className="text-sm font-medium">AI-Suggested Text</label>
            <Textarea
              placeholder="AI suggestions will appear here..."
              className="min-h-[100px] bg-muted/50"
              readOnly
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button>Post Deadline</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
