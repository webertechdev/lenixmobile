import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Search, Users, Database, Trash2 } from 'lucide-react';
import { db } from '@/lib/db';
import { EditCustomerDialog } from '@/features/customers/components/EditCustomerDialog';
import { AddCustomerDialog } from '@/features/customers/components/AddCustomerDialog';
import { DeleteButton } from '@/components/ui/delete-button';
import { TablePagination } from '@/components/common/TablePagination';
import { customers } from '@/drizzle/schema';
import { count, desc } from 'drizzle-orm';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  let allCustomers: any[] = [];
  let error: string | null = null;
  let totalItems = 0;
  const params = await searchParams;
  const pageSizeOptions = [5, 50, 100];
  const requestedPageSize = Number(params.pageSize);
  const pageSize = pageSizeOptions.includes(requestedPageSize) ? requestedPageSize : 5;
  const requestedPage = Number(params.page);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  
  try {
    if (!db) {
      throw new Error("Database not initialized. Check your DATABASE_URL in Settings.");
    }
    const totalRows = await db.select({ count: count() }).from(customers);
    totalItems = Number(totalRows[0]?.count || 0);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    allCustomers = await db.select().from(customers)
      .orderBy(desc(customers.createdAt))
      .limit(pageSize)
      .offset((safePage - 1) * pageSize);
  } catch (e: any) {
    console.error("Customers fetch error:", e);
    error = e.message || "Failed to load customers";
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <AddCustomerDialog />
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
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle>All Customers ({totalItems})</CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              placeholder="Search customers..." 
              className="pl-8 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allCustomers.length > 0 ? allCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email || 'N/A'}</TableCell>
                    <TableCell>{customer.city || '-'}, {customer.region || '-'}</TableCell>
	                    <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-1">
                            <EditCustomerDialog customer={customer} />
                            <DeleteButton endpoint={`/api/customers/${customer.id}`} itemName={customer.name} />
                          </div>
	                    </TableCell>
                  </TableRow>
                )) : !error && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No customers found. Customers will appear here when you create your first repair.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={Math.min(page, Math.max(1, Math.ceil(totalItems / pageSize)))} pageSize={pageSize} totalItems={totalItems} />
        </CardContent>
      </Card>
    </div>
  );
}
