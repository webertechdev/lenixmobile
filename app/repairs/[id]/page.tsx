export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { repairs, customers, technicians, repairParts, inventory } from '@/drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Printer, ArrowLeft, UserCheck, CheckCircle, Clock, Package, Wrench, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { JobCardPrinter } from '@/features/repairs/components/JobCardPrinter';
import { AssignTechnicianButton } from '@/features/repairs/components/AssignTechnicianButton';
import { RepairActions } from '@/features/repairs/components/RepairActions';
import { StatusUpdateActions } from '@/features/repairs/components/StatusUpdateActions';
import { RepairCharges } from '@/features/repairs/components/RepairCharges';

export default async function RepairDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repairId = parseInt(id);
  
  const result = await db.select({
    repair: repairs,
    customerName: customers.name,
    technicianName: technicians.name
  })
  .from(repairs)
  .leftJoin(customers, eq(repairs.customerId, customers.id))
  .leftJoin(technicians, eq(repairs.technicianId, technicians.id))
  .where(eq(repairs.id, repairId));

  if (!result.length) notFound();

  const repairIds = await db
    .select({ id: repairs.id })
    .from(repairs)
    .orderBy(desc(repairs.createdAt), desc(repairs.id));
  const currentIndex = repairIds.findIndex((repair: { id: number }) => repair.id === repairId);
  const previousRepairId = currentIndex > 0 ? repairIds[currentIndex - 1].id : null;
  const nextRepairId = currentIndex >= 0 && currentIndex < repairIds.length - 1
    ? repairIds[currentIndex + 1].id
    : null;

  const partsUsed = await db.select({
    id: repairParts.id,
    partName: inventory.partName,
    quantity: repairParts.quantity,
    unitPrice: repairParts.unitPrice,
  })
  .from(repairParts)
  .leftJoin(inventory, eq(repairParts.partId, inventory.id))
  .where(eq(repairParts.repairId, repairId));

  // Fetch all active technicians for assignment
  const allTechnicians = await db.select().from(technicians).where(eq(technicians.isActive, true));

  const repairData = {
    ...result[0].repair,
    customerName: result[0].customerName,
    technicianName: result[0].technicianName,
    partsUsed
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/repairs">
            <Button variant="ghost" size="icon"><ArrowLeft /></Button>
          </Link>
          <h1 className="text-3xl font-bold">{repairData.repairNumber}</h1>
          <Badge variant="outline">{repairData.status.toUpperCase()}</Badge>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 mr-2">
            {previousRepairId ? (
              <Link href={`/repairs/${previousRepairId}`}>
                <Button variant="outline" size="sm">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
            )}
            {nextRepairId ? (
              <Link href={`/repairs/${nextRepairId}`}>
                <Button variant="outline" size="sm">
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
          <JobCardPrinter repair={repairData} />
          <RepairActions repairId={repairId} repairNumber={repairData.repairNumber} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Repair Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Device Model</p>
                <p className="font-medium">{repairData.deviceModel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IMEI</p>
                <p className="font-medium">{repairData.imei}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fault Type</p>
                <p className="font-medium">{repairData.faultType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Financial Service</p>
                <Badge variant="secondary">{repairData.financialService.toUpperCase()}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Technician</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{repairData.technicianName || 'Not Assigned'}</p>
                  <AssignTechnicianButton 
                    repairId={repairId} 
                    technicians={allTechnicians}
                    currentTechnicianId={repairData.technicianId}
                  />
                </div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">Complaint</p>
              <p className="mt-1">{repairData.complaint}</p>
            </div>
            {repairData.solution && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground font-semibold text-green-700">Solution</p>
                <p className="mt-1 p-3 bg-green-950/40 rounded-md border border-green-800 text-green-100">{repairData.solution}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parts Used</CardTitle>
          </CardHeader>
          <CardContent>
            {repairData.partsUsed.length > 0 ? (
              <div className="space-y-2">
                {repairData.partsUsed.map((part: any) => (
                  <div key={part.id} className="flex justify-between items-center text-sm p-2 bg-slate-800/50 rounded border">
                    <span>{part.partName} (x{part.quantity})</span>
                    <span className="font-mono">${(parseFloat(part.unitPrice) * part.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t flex justify-between font-bold">
                  <span>Total Parts Cost</span>
                  <span>${repairData.partsUsed.reduce((acc: number, p: any) => acc + (parseFloat(p.unitPrice) * p.quantity), 0).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 italic">No parts added yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{repairData.customerName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{repairData.phoneNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{repairData.city}, {repairData.region}</p>
            </div>
          </CardContent>
        </Card>
        <RepairCharges repairId={repairId} />

        {/* Status Update Card for Team Lead / Admin */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Status Update
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusUpdateActions repairId={repairId} currentStatus={repairData.status} />
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Device Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden">
                {repairData.photoFront ? (
                  <img src={repairData.photoFront} alt="Front Photo" className="w-full h-full object-cover" />
                ) : (
                  <p className="text-xs text-muted-foreground text-center px-2">Front Photo</p>
                )}
              </div>
              <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden">
                {repairData.photoBack ? (
                  <img src={repairData.photoBack} alt="Back Photo" className="w-full h-full object-cover" />
                ) : (
                  <p className="text-xs text-muted-foreground text-center px-2">Back Photo</p>
                )}
              </div>
              <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden">
                {repairData.photoRepair ? (
                  <img src={repairData.photoRepair} alt="Repair Photo" className="w-full h-full object-cover" />
                ) : (
                  <p className="text-xs text-muted-foreground text-center px-2">Internal Photo</p>
                )}
              </div>
              <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden">
                {repairData.photoFinalQA ? (
                  <img src={repairData.photoFinalQA} alt="Final QA Photo" className="w-full h-full object-cover" />
                ) : (
                  <p className="text-xs text-muted-foreground text-center px-2">Final QA Photo</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
