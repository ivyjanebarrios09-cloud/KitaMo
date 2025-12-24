'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader } from '@/components/loader';
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const tasksData: Task[] = [];
        querySnapshot.forEach((doc) => {
          tasksData.push({ id: doc.id, ...doc.data() } as Task);
        });
        setTasks(tasksData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching tasks: ', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load tasks.',
          description: 'Please try refreshing the page.',
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, toast]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim() === '' || !user) return;

    setIsAdding(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        text: newTask.trim(),
        completed: false,
        createdAt: serverTimestamp(),
        userId: user.uid,
      });
      setNewTask('');
    } catch (error) {
      console.error('Error adding task: ', error);
       toast({
          variant: 'destructive',
          title: 'Failed to add task.',
          description: 'Please try again.',
        });
    } finally {
      setIsAdding(false);
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    const taskDoc = doc(db, 'tasks', id);
    await updateDoc(taskDoc, { completed: !completed });
  };

  const deleteTask = async (id: string) => {
    const taskDoc = doc(db, 'tasks', id);
    await deleteDoc(taskDoc);
  };
  
  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'active':
        return tasks.filter(task => !task.completed);
      case 'completed':
        return tasks.filter(task => task.completed);
      default:
        return tasks;
    }
  }, [tasks, filter]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to your Dashboard</CardTitle>
          <CardDescription>Here are your tasks for today. Stay productive!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addTask} className="flex gap-2 mb-6">
            <Input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What needs to be done?"
              disabled={isAdding}
              className="text-base"
            />
            <Button type="submit" disabled={isAdding || newTask.trim() === ''}>
              {isAdding ? <Loader className="h-4 w-4" /> : <><Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Task</span></>}
            </Button>
          </form>

          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value={filter}>
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader />
                </div>
              ) : (
                <ul className="space-y-3">
                  {filteredTasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center gap-4 p-4 rounded-lg transition-all bg-secondary/30 hover:bg-secondary/70 border"
                    >
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id, task.completed)}
                        aria-label={`Mark ${task.text} as ${task.completed ? 'incomplete' : 'complete'}`}
                        className="h-5 w-5"
                      />
                      <label
                        htmlFor={`task-${task.id}`}
                        className={`flex-1 font-medium cursor-pointer transition-colors ${
                          task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {task.text}
                      </label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => deleteTask(task.id)}
                        aria-label={`Delete task: ${task.text}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                  {tasks.length > 0 && filteredTasks.length === 0 && (
                     <p className="text-center text-muted-foreground py-8">
                      No {filter} tasks.
                    </p>
                  )}
                  {tasks.length === 0 && (
                     <p className="text-center text-muted-foreground py-8">
                      You have no tasks yet. Add one above!
                    </p>
                  )}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
