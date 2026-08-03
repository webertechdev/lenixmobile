export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { repairs, customers, technicians } from '@/drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Database, UserCheck, Users, Wrench } from 'lucide-react';
import Link from 'next/link';
import { CSVImporter } from '@/features/repairs/components/CSVImporter';
import { RepairsListClient } from '@/features/repairs/components/RepairsListClient';
import { RepairActions } from '@/features/repairs/components/RepairActions';
import { AssignTechnicianButton } from '@/features/repairs/components/AssignTechnicianButton';

export default async function RepairsPage() {
  let allRepairs: any[] = [];
  let error: string | null = null;
  let allTechnicians: any[] = [];

  try {
    if (!db) {
      throw new Error("Database not initialized. Check your DATABASE_URL in Settings.");
    }
    allRepairs = await db.select({
      repair: repairs,
      customerName: customers.name,
      technicianName: technicians.name,
    })
    .from(repairs)
    .leftJoin(customers, eq(repairs.customerId, customers.id))
    .leftJoin(technicians, eq(repairs.technicianId, technicians.id))
    .orderBy(desc(repairs.createdAt))
    .limit(50);

    // Fetch all technicians for assignment dropdown
    allTechnicians = await db.select().from(technicians).where(eq(technicians.isActive, true));
  } catch (e: any) {
    console.error("Failed to fetch repairs:", e);
    error = e.message || "Failed to load repairs";
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
      waiting_parts: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
      quality_check: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
      completed: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
      returned: 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300',
      cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    };
    return variants[status] || 'bg-gray-100 text-gray-700';
  };

  // Count repairs by status
  const statusCounts = allRepairs.reduce((acc: any, row: any) => {
    const s = row.repair.status;
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repairs Management</h1>
          <p className="text-muted-foreground">Manage and track all repair jobs</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Link href="/repairs/new">
            <Button className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Repair
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
              <Database className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{statusCounts.open || 0}</p>
              <p className="text-xs text-muted-foreground">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-950">
              <Wrench className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{statusCounts.in_progress || 0}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950">
              <Users className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{statusCounts.waiting_parts || 0}</p>
              <p className="text-xs text-muted-foreground">Waiting Parts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
              <UserCheck className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{statusCounts.completed || 0}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
          <Database className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}. Go to Settings to check your database connection.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <RepairsListClient repairs={allRepairs} technicians={allTechnicians} />
        </div>

        <div className="space-y-6">
          <CSVImporter />

          {/* Team Assignment Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allTechnicians.length > 0 ? allTechnicians.map((tech: any) => (
                  <div key={tech.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{tech.name}</p>
                      <p className="text-xs text-muted-foreground">{tech.specialization || 'Generalist'}</p>
                    </div>
                    <Badge variant="outline" className={
                      tech.role === 'admin' ? 'bg-red-100 text-red-700 border-red-200' :
                      tech.role === 'team_lead' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      'bg-blue-100 text-blue-700 border-blue-200'
                    }>
                      {tech.role === 'admin' ? 'Admin' : tech.role === 'team_lead' ? 'Team Lead' : 'Technician'}
                    </Badge>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No team members yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
