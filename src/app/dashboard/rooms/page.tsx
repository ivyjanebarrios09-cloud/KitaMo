'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowRight, MoreHorizontal, PlusCircle, Users } from 'lucide-react';
import Link from 'next/link';

const rooms = [
  {
    id: 'socrates-fund-monitoring',
    name: 'Socrates Fund Monitoring',
    description: 'To monitor the funds and expenses',
    students: 1,
    balance: 0.0,
  },
  {
    id: 'rizal-monitoring-funds',
    name: 'Rizal Monitoring Funds',
    description: 'A monitoring room for the funds and expenses of the section Rizal',
    students: 0,
    balance: 0.0,
  },
  {
    id: 'bonifacio-fund-monitoring',
    name: 'Bonifacio Fund Monitoring',
    description: 'No description provided.',
    students: 0,
    balance: 0.0,
  },
];

const RoomCard = ({ room }) => (
  <Card className="shadow-sm hover:shadow-lg transition-shadow flex flex-col">
    <CardHeader>
      <CardTitle className="text-xl">{room.name}</CardTitle>
      <CardDescription className="h-10">{room.description}</CardDescription>
    </CardHeader>
    <CardContent className="flex-grow"></CardContent>
    <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <span>{room.students} Students</span>
        <span>₱{room.balance.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/rooms/${room.id}`}>
            Manage Room <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardFooter>
  </Card>
);


export default function ManageRoomsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Rooms</h1>
          <p className="text-muted-foreground">
            Your financial rooms are listed below.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Room
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room, index) => (
          <RoomCard key={index} room={room} />
        ))}
      </div>
    </div>
  );
}
