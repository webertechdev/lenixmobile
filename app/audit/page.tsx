import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, User, Activity, Database, FileText, UserPlus, UserX, Wrench } from 'lucide-react';
import { db } from '@/lib/db';
import { auditLog, users } from '@/drizzle/schema';
import { desc, eq } from 'drizzle-orm';

export default async function AuditLogPage() {
  let logs: any[] = [];
  let error: string | null = null;
  
  try {
    if (db) {
      logs = await db.select({
        log: auditLog,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .orderBy(desc(auditLog.createdAt))
      .limit(100);
    } else {
      error = "Database not initialized. Check your DATABASE_URL.";
    }
  } catch (e: any) {
    console.error("Audit log fetch error:", e);
    error = e.message || "Failed to load audit logs";
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT': return <FileText className="h-3 w-3" />;
      case 'UPDATE': return <Wrench className="h-3 w-3" />;
      case 'DELETE': return <UserX className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-green-100 text-green-700';
      case 'UPDATE': return 'bg-blue-100 text-blue-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">Track all system activities and changes</p>
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
          <Database className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            System Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Record ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? logs.map((row) => (
                  <TableRow key={row.log.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(row.log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <span className="font-medium text-sm">{row.userName || 'System'}</span>
                        {row.userEmail && (
                          <span className="text-xs text-muted-foreground ml-1">({row.userEmail})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold ${getActionBadge(row.log.action)}`}>
                        {getActionIcon(row.log.action)}
                        {row.log.action}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.log.tableName}</TableCell>
                    <TableCell>{row.log.recordId}</TableCell>
                  </TableRow>
                )) : !error && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No audit logs found yet. Logs will appear here as you create repairs, add technicians, and make changes.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
