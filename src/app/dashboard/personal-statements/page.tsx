
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClipboardList,
  CalendarDays,
  FileText,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import React from 'react';

const StatementCard = ({
  icon: Icon,
  title,
  description,
  children,
  actions,
}) => (
  <Card className="shadow-sm hover:shadow-md transition-shadow">
    <CardHeader>
      <div className="flex items-start gap-4">
        <Icon className="h-6 w-6 text-primary mt-1" />
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {children && <div className="grid gap-4 mb-6">{children}</div>}
      <div className="flex items-center justify-end gap-2">
        {actions.map((action, index) => (
          <Button key={index} variant="outline" disabled>
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
    </CardContent>
  </Card>
);

const actions = [
  { label: 'View', icon: <Eye className="mr-2 h-4 w-4" /> },
  { label: 'PDF', icon: <FileText className="mr-2 h-4 w-4" /> },
  { label: 'Excel', icon: <FileSpreadsheet className="mr-2 h-4 w-4" /> },
];

export default function PersonalStatementsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Personal Statements</h1>
      </div>
      <div>
        <h2 className="text-xl font-semibold">Generate Statements</h2>
        <p className="text-muted-foreground">
          Select a statement type to view, download, or export your personal financial data.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatementCard
          icon={CalendarDays}
          title="Financial Statement for the Whole Year"
          description="A comprehensive report of all your payments and dues for the entire year."
          actions={actions}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Year</label>
            <Select defaultValue="2025">
              <SelectTrigger>
                <SelectValue placeholder="Select a year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </StatementCard>

        <StatementCard
          icon={CalendarDays}
          title="Financial Statement for a Specific Month"
          description="A detailed report of all your financial activities for a single selected month."
          actions={actions}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Month</label>
              <Select defaultValue="december">
                <SelectTrigger>
                  <SelectValue placeholder="Select a month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="january">January</SelectItem>
                  <SelectItem value="february">February</SelectItem>
                  <SelectItem value="march">March</SelectItem>
                  <SelectItem value="april">April</SelectItem>
                  <SelectItem value="may">May</SelectItem>
                  <SelectItem value="june">June</SelectItem>
                  <SelectItem value="july">July</SelectItem>
                  <SelectItem value="august">August</SelectItem>
                  <SelectItem value="september">September</SelectItem>
                  <SelectItem value="october">October</SelectItem>
                  <SelectItem value="november">November</SelectItem>
                  <SelectItem value="december">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Year</label>
              <Select defaultValue="2025">
                <SelectTrigger>
                  <SelectValue placeholder="Select a year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </StatementCard>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Coming Soon!</CardTitle>
            <CardDescription>
                This feature is currently under construction. Please check back later for full statement generation and download functionality.
            </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
