import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Search, Package, AlertTriangle, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { inventory } from '@/drizzle/schema';
import { desc } from 'drizzle-orm';
import { EditInventoryDialog } from '@/features/inventory/components/EditInventoryDialog';
import { AddInventoryDialog } from '@/features/inventory/components/AddInventoryDialog';
import { DeleteButton } from '@/components/ui/delete-button';

export default async function InventoryPage() {
  let items: any[] = [];
  let error: string | null = null;
  
  try {
    if (!db) {
      throw new Error("Database not initialized. Check your DATABASE_URL in Settings.");
    }
    items = await db.select().from(inventory).orderBy(desc(inventory.createdAt)).limit(50);
  } catch (e: any) {
    console.error("Inventory fetch error:", e);
    error = e.message || "Failed to load inventory";
  }

  const lowStockCount = items.filter((item: any) => item.quantity <= item.minimumStock).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Manage spare parts and stock levels</p>
        </div>
        <AddInventoryDialog />
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
          <Database className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {lowStockCount > 0 && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            {lowStockCount} item(s) are below minimum stock level.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle>Stock List ({items.length} items)</CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              placeholder="Search parts..." 
              className="pl-8 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Min. Stock</TableHead>
	                  <TableHead>Price</TableHead>
	                  <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
	                </TableRow>
	              </TableHeader>
              <TableBody>
                {items.length > 0 ? items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.partName}</TableCell>
                    <TableCell>{item.partCode || 'N/A'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.minimumStock}</TableCell>
                    <TableCell>${item.unitPrice}</TableCell>
	                    <TableCell>
	                      {item.quantity <= item.minimumStock ? (
	                        <Badge variant="destructive" className="flex w-fit items-center gap-1">
	                          <AlertTriangle className="h-3 w-3" />
	                          Low Stock
	                        </Badge>
	                      ) : (
	                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
	                          In Stock
	                        </Badge>
	                      )}
	                    </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <EditInventoryDialog item={item} />
                          <DeleteButton endpoint={`/api/inventory/${item.id}`} itemName={item.partName} />
                        </div>
                      </TableCell>
	                  </TableRow>
                )) : !error && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No inventory items found. Add your first spare part to get started.
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
