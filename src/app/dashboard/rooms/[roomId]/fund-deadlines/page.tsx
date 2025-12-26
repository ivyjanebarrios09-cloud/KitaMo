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
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { addDeadline } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';
import { Loader } from '@/components/loader';

const deadlineSchema = z.object({
  title: z.string().min(1, 'Deadline title is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  dueDate: z.date({ required_error: 'Please select a due date' }),
  category: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
});

export default function FundDeadlinesPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof deadlineSchema>>({
    resolver: zodResolver(deadlineSchema),
    defaultValues: {
      title: '',
      amount: 0,
      category: '',
      description: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof deadlineSchema>) => {
    setFormLoading(true);
    try {
      await addDeadline(roomId, values);
      toast({
        title: 'Deadline Posted!',
        description: `${values.title} has been posted for all students.`,
      });
      form.reset({ title: '', amount: 0, dueDate: undefined, category: '', description: '' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error posting deadline',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Post a New Fund Deadline</CardTitle>
          <CardDescription>
            Create a deadline and notify students in the activity feed.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadline Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Spring Formal Tickets" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount per Student (₱)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Event Contribution" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description / Announcement</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your announcement here. This will be visible to all students."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={formLoading}>
                {formLoading ? <Loader className="h-4 w-4" /> : 'Post Deadline'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
