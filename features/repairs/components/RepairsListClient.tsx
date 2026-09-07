"use client";

import { FormEvent, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TablePagination } from "@/components/common/TablePagination";
import { RepairActions } from "./RepairActions";
import { AssignTechnicianButton } from "./AssignTechnicianButton";

interface RepairsListClientProps {
  repairs: any[];
  technicians: any[];
  searchQuery: string;
  totalItems: number;
  page: number;
  pageSize: number;
}

export function RepairsListClient({ repairs, technicians, searchQuery, totalItems, page, pageSize }: RepairsListClientProps) {
  const [query, setQuery] = useState(searchQuery);
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(currentSearchParams.toString());
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
      waiting_parts: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
      quality_check: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
      completed: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
      returned: "bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    };
    return variants[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <CardTitle>Repairs ({totalItems})</CardTitle>
          </div>
          <form onSubmit={handleSearch} className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search IMEI or Number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </form>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Repair #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>IMEI</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repairs.length > 0 ? (
                  repairs.map((row: any) => (
                    <TableRow key={row.repair.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(row.repair.dateReceived).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{row.repair.repairNumber}</TableCell>
                      <TableCell>{row.customerName || "N/A"}</TableCell>
                      <TableCell>{row.repair.deviceModel}</TableCell>
                      <TableCell className="text-xs font-mono">{row.repair.imei}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {row.technicianName ? (
                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              {row.technicianName}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Unassigned</span>
                          )}
                          <AssignTechnicianButton
                            repairId={row.repair.id}
                            technicians={technicians}
                            currentTechnicianId={row.repair.technicianId}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] px-1 ${getStatusBadge(row.repair.status)}`}>
                          {row.repair.status.toUpperCase().replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Link href={`/repairs/${row.repair.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                          <RepairActions repairId={row.repair.id} repairNumber={row.repair.repairNumber} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <Wrench className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No repairs found. Try adjusting your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={page} pageSize={pageSize} totalItems={totalItems} />
        </CardContent>
      </Card>
    </div>
  );
}
