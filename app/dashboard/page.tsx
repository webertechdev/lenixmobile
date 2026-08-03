export const dynamic = 'force-dynamic';

import { getDashboardStats } from '@/features/dashboard/services/dashboard-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Hourglass, 
  TrendingUp, 
  AlertTriangle,
  Database,
  Shield,
  UserCheck,
  Wrench,
  User
} from 'lucide-react';
import { DashboardCharts } from '@/features/dashboard/components/DashboardCharts';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { users, technicians, repairs } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let currentUser: any = null;
  let assignedRepairs: any[] = [];
  let technicianProfile: any = null;

  // Get current user's profile and role
  if (user && db) {
    try {
      const userProfile = await db.select().from(users).where(eq(users.supabaseId, user.id));
      if (userProfile.length > 0) {
        currentUser = userProfile[0];

        // If user is a technician, get their assigned repairs
        if (currentUser.role === 'technician' || currentUser.role === 'team_lead') {
          try {
            const techProfile = await db.select().from(technicians).where(eq(technicians.userId, currentUser.id));
            if (techProfile.length > 0) {
              technicianProfile = techProfile[0];
              
              // Get repairs assigned to this technician
              const assignedReps = await db
                .select()
                .from(repairs)
                .where(eq(repairs.technicianId, technicianProfile.id));
              
              assignedRepairs = assignedReps;
            }
          } catch (err) {
            console.error('Error fetching technician profile:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  }

  const stats = await getDashboardStats();
  
  // Detect if the stats are the default empty state (meaning DB error occurred)
  const isEmptyState = stats.kpis.open === 0 && 
                       stats.kpis.completed === 0 && 
                       stats.charts.cashVsLoan.length === 0 &&
                       stats.charts.repairsByRegion.length === 0 &&
                       stats.charts.repairsByTechnician.length === 0 &&
                       stats.charts.commonFaults.length === 0;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'team_lead': return <UserCheck className="h-4 w-4" />;
      case 'technician': return <Wrench className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'team_lead': return 'Team Lead';
      case 'technician': return 'Technician';
      case 'viewer': return 'Viewer';
      default: return 'User';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
      case 'team_lead': return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
      case 'technician': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300';
    }
  };

  const kpiData = [
    {
      title: "Open Repairs",
      value: stats.kpis.open,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Completed",
      value: stats.kpis.completed,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Waiting Parts",
      value: stats.kpis.waitingParts,
      icon: Hourglass,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      title: "Avg Turnaround",
      value: `${stats.kpis.avgTat} Days`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Real-time repair operations overview</p>
        </div>
        {stats.alerts.lowStock.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full animate-pulse">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">{stats.alerts.lowStock.length} Low Stock Alerts</span>
          </div>
        )}
      </div>

      {/* User Profile Card */}
      {currentUser && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  {getRoleIcon(currentUser.role)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Welcome</p>
                  <p className="text-lg font-semibold">{currentUser.name}</p>
                </div>
              </div>
              <Badge className={`${getRoleBadgeColor(currentUser.role)}`}>
                {getRoleLabel(currentUser.role)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{currentUser.email}</p>
              </div>
              {technicianProfile && (
                <>
                  <div>
                    <p className="text-muted-foreground">Specialization</p>
                    <p className="font-medium">{technicianProfile.specialization || 'Generalist'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{technicianProfile.phone || 'N/A'}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isEmptyState && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
          <Database className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            No repair data found in the database. Create your first repair to see statistics here, or check your database connection in Settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Assigned Repairs for Technicians */}
      {(currentUser?.role === 'technician' || currentUser?.role === 'team_lead') && assignedRepairs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Your Assigned Repairs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignedRepairs.slice(0, 5).map((repair: any) => (
                <div key={repair.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  <div>
                    <p className="font-medium">{repair.repairNumber}</p>
                    <p className="text-sm text-muted-foreground">{repair.deviceModel}</p>
                  </div>
                  <Badge variant="outline" className={
                    repair.status === 'completed' ? 'bg-green-50 text-green-700' :
                    repair.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-blue-50 text-blue-700'
                  }>
                    {repair.status.toUpperCase().replace('_', ' ')}
                  </Badge>
                </div>
              ))}
              {assignedRepairs.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  +{assignedRepairs.length - 5} more repairs
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <div className={`${kpi.bg} p-2 rounded-md`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DashboardCharts charts={stats.charts} />
      
      {stats.alerts.lowStock.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Inventory Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.alerts.lowStock.map((alert: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-2 bg-red-50 rounded text-sm">
                  <span className="font-medium">{alert.partName}</span>
                  <span className="text-red-600">Stock: {alert.quantity} (Min: {alert.minStock})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
