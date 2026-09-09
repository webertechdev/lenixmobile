import { NextResponse } from "next/server";
import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import {
  repairs,
  customers,
  technicians,
  repairServices,
  repairParts,
  inventory,
  statusHistory,
  users,
} from "@/drizzle/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EXCEL_CHUNK_SIZE = 30000;

function formatDate(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
}

function formatDateTime(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB");
}

function formatStatus(value: unknown) {
  return value
    ? String(value).toUpperCase().replace(/_/g, " ")
    : "";
}

function addExcelField(
  row: Record<string, unknown>,
  label: string,
  value: unknown,
) {
  const text = String(value ?? "");

  if (text.length <= EXCEL_CHUNK_SIZE) {
    row[label] = text;
    return;
  }

  for (
    let start = 0, part = 1;
    start < text.length;
    start += EXCEL_CHUNK_SIZE, part++
  ) {
    row[part === 1 ? label : `${label} (${part})`] = text.slice(
      start,
      start + EXCEL_CHUNK_SIZE,
    );
  }
}

function parseDateStart(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateEndExclusive(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

export async function GET(request: Request) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized." },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);

    const fromValue = searchParams.get("from");
    const toValue = searchParams.get("to");

    const fromDate = parseDateStart(fromValue);
    const toDateExclusive = parseDateEndExclusive(toValue);

    if (fromValue && !fromDate) {
      return NextResponse.json(
        { error: "Invalid 'from' date. Use YYYY-MM-DD." },
        { status: 400 },
      );
    }

    if (toValue && !toDateExclusive) {
      return NextResponse.json(
        { error: "Invalid 'to' date. Use YYYY-MM-DD." },
        { status: 400 },
      );
    }

    if (
      fromDate &&
      toDateExclusive &&
      fromDate.getTime() >= toDateExclusive.getTime()
    ) {
      return NextResponse.json(
        { error: "'from' date must be on or before 'to' date." },
        { status: 400 },
      );
    }

    const dateConditions = [];

    if (fromDate) {
      dateConditions.push(gte(repairs.dateReceived, fromDate));
    }

    if (toDateExclusive) {
      dateConditions.push(lt(repairs.dateReceived, toDateExclusive));
    }

    type RepairRow = Awaited<
  ReturnType<typeof db.select>
>;

type ServiceRow = Awaited<
  ReturnType<typeof db.select>
>;

type PartRow = Awaited<
  ReturnType<typeof db.select>
>;

type HistoryRow = Awaited<
  ReturnType<typeof db.select>
>;

    const repairRows = await db
      .select({
        repair: repairs,
        customerName: customers.name,
        customerEmail: customers.email,
        customerPhone: customers.phone,
        customerCity: customers.city,
        customerRegion: customers.region,
        technicianName: technicians.name,
        technicianEmail: technicians.email,
        technicianPhone: technicians.phone,
      })
      .from(repairs)
      .leftJoin(customers, eq(repairs.customerId, customers.id))
      .leftJoin(technicians, eq(repairs.technicianId, technicians.id))
      .where(dateConditions.length ? and(...dateConditions) : undefined)
      .orderBy(desc(repairs.dateReceived));

    if (!repairRows.length) {
      const worksheet = XLSX.utils.json_to_sheet([
        {
          Message: "No repairs found for the selected date range.",
          "Export From": fromValue || "All dates",
          "Export To": toValue || "All dates",
        },
      ]);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Repairs");

      const buffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="repairs.xlsx"',
        },
      });
    }

    const repairIds = repairRows.map((row: any) => row.repair.id);

    const [serviceRows, partRows, historyRows] = await Promise.all([
      db
        .select({
          service: repairServices,
        })
        .from(repairServices)
        .where(inArray(repairServices.repairId, repairIds)),

      db
        .select({
          part: repairParts,
          partName: inventory.partName,
          partCode: inventory.partCode,
        })
        .from(repairParts)
        .leftJoin(inventory, eq(repairParts.partId, inventory.id))
        .where(inArray(repairParts.repairId, repairIds)),

      db
        .select({
          history: statusHistory,
          changedByName: users.name,
          changedByEmail: users.email,
        })
        .from(statusHistory)
        .leftJoin(users, eq(statusHistory.changedBy, users.id))
        .where(inArray(statusHistory.repairId, repairIds))
        .orderBy(desc(statusHistory.createdAt)),
    ]);

    const servicesByRepair = new Map<number, typeof serviceRows>();
    const partsByRepair = new Map<number, typeof partRows>();
    const historyByRepair = new Map<number, typeof historyRows>();

    for (const row of serviceRows) {
      const existing = servicesByRepair.get(row.service.repairId) || [];
      existing.push(row);
      servicesByRepair.set(row.service.repairId, existing);
    }

    for (const row of partRows) {
      const existing = partsByRepair.get(row.part.repairId) || [];
      existing.push(row);
      partsByRepair.set(row.part.repairId, existing);
    }

    for (const row of historyRows) {
      const existing = historyByRepair.get(row.history.repairId) || [];
      existing.push(row);
      historyByRepair.set(row.history.repairId, existing);
    }

    const exportRows = repairRows.map((row: any) => {
      const repair = row.repair;

      const services = servicesByRepair.get(repair.id) || [];
      const parts = partsByRepair.get(repair.id) || [];
      const history = historyByRepair.get(repair.id) || [];

      const serviceSubtotal = services.reduce((total: number, item: any) => {
        const quantity = Number(item.service.quantity || 0);
        const unitFee = Number(item.service.unitFee || 0);
        return total + quantity * unitFee;
      }, 0);

      const partsSubtotal = parts.reduce((total: number, item: any) => {
        const quantity = Number(item.part.quantity || 0);
        const unitPrice = Number(
          item.part.unitPrice ?? 0,
        );
        return total + quantity * unitPrice;
      }, 0);

      const grandTotal = serviceSubtotal + partsSubtotal;

      const serviceNames = services
        .map(
          (item: any)=>
            `${item.service.serviceName} × ${item.service.quantity}`,
        )
        .join("; ");

      const serviceQuantities = services
        .map((item: any) => String(item.service.quantity))
        .join("; ");

      const serviceUnitPrices = services
        .map((item: any) => Number(item.service.unitFee || 0).toFixed(2))
        .join("; ");

      const serviceTotals = services
        .map((item: any) =>
          (
            Number(item.service.quantity || 0) *
            Number(item.service.unitFee || 0)
          ).toFixed(2),
        )
        .join("; ");

      const partNames = parts
        .map((item: any) =>
            `${item.partName || "Unknown Part"} × ${item.part.quantity}`,
        )
        .join("; ");

      const partCodes = parts
        .map((item: any) => item.partCode || "N/A")
        .join("; ");

      const partQuantities = parts
        .map((item: any) => String(item.part.quantity))
        .join("; ");

      const partUnitPrices = parts
        .map((item: any) =>
          Number(item.part.unitPrice ?? 0).toFixed(2),
        )
        .join("; ");

      const partTotals = parts
        .map((item: any) =>
          (
            Number(item.part.quantity || 0) *
            Number(item.part.unitPrice ?? 0)
          ).toFixed(2),
        )
        .join("; ");

      const statusHistoryText = history
        .map((item: any) => {
          const changedBy =
            item.changedByName ||
            item.changedByEmail ||
            "Unknown user";

          const previous = formatStatus(item.history.previousStatus);
          const next = formatStatus(item.history.newStatus);

          return `${formatDateTime(item.history.createdAt)}: ${
            previous || "START"
          } → ${next} by ${changedBy}${
            item.history.reason
              ? ` — ${item.history.reason}`
              : ""
          }`;
        })
        .join("; ");

      const photoInformation = [
        `Front: ${repair.photoFront ? repair.photoFront : "Not uploaded"}`,
        `Back: ${repair.photoBack ? repair.photoBack : "Not uploaded"}`,
        `Repair: ${repair.photoRepair ? repair.photoRepair : "Not uploaded"}`,
        `Final QA: ${
          repair.photoFinalQA
            ? repair.photoFinalQA
            : "Not uploaded"
        }`,
      ].join("; ");

      const assignmentInformation = repair.technicianId
        ? `Assigned to: ${row.technicianName || "Unknown"}; Technician ID: ${
            repair.technicianId
          }; Email: ${row.technicianEmail || ""}; Phone: ${
            row.technicianPhone || ""
          }`
        : "Unassigned";

      const exportRow: Record<string, unknown> = {
        "Repair #": repair.repairNumber,
        "Date Received": formatDate(repair.dateReceived),
        "Date Completed": formatDate(repair.dateCompleted),

        Customer: row.customerName || "N/A",
        "Customer Phone": row.customerPhone || "",
        "Customer Email": row.customerEmail || "",
        "Customer City": row.customerCity || "",
        "Customer Region": row.customerRegion || "",

        "Device Model": repair.deviceModel,
        IMEI: repair.imei,
        "Repair Phone Number": repair.phoneNumber,
        City: repair.city || "",
        Region: repair.region || "",

        "Fault Type": repair.faultType || "",
        "Repair Type": formatStatus(repair.repairType),
        "Financial Service": formatStatus(repair.financialService),
        "Warranty Status": formatStatus(repair.warrantyStatus),
        Status: formatStatus(repair.status),

        Technician: row.technicianName || "Unassigned",
        "Technician Email": row.technicianEmail || "",
        "Technician Phone": row.technicianPhone || "",

        "Assignment Information": assignmentInformation,

        Complaint: repair.complaint || "",
        Solution: repair.solution || "",
        Remarks: repair.remarks || "",

        "Repair Cost": repair.cost || "",

        "Service Fees": serviceNames,
        "Service Quantities": serviceQuantities,
        "Service Unit Prices": serviceUnitPrices,
        "Service Totals": serviceTotals,
        "Services Subtotal": serviceSubtotal.toFixed(2),

        "Parts Used": partNames,
        "Part Codes": partCodes,
        "Part Quantities": partQuantities,
        "Part Unit Prices": partUnitPrices,
        "Part Totals": partTotals,
        "Parts Subtotal": partsSubtotal.toFixed(2),

        "Grand Total": grandTotal.toFixed(2),

        "Photo Information/Status": photoInformation,

        "Status History": statusHistoryText,

        "Created Date": formatDateTime(repair.createdAt),
        "Updated Date": formatDateTime(repair.updatedAt),
      };

      const safeRow: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(exportRow)) {
        addExcelField(safeRow, key, value);
      }

      return safeRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Repairs");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    const filename =
      fromValue && toValue
        ? `repairs-${fromValue}-to-${toValue}.xlsx`
        : fromValue
          ? `repairs-from-${fromValue}.xlsx`
          : toValue
            ? `repairs-to-${toValue}.xlsx`
            : "repairs.xlsx";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to export repairs:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to export repairs",
      },
      { status: 500 },
    );
  }
}