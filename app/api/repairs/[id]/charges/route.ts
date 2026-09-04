import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  repairs,
  repairParts,
  repairServices,
  inventory,
  services,
  users,
} from "@/drizzle/schema";
import { and, eq, sql } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

async function currentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const [dbUser] = await db
    .select({
      id: users.id,
      role: users.role,
    })
    .from(users)
    .where(eq(users.supabaseId, user.id));

  if (!dbUser) {
    throw new Error("User profile not found");
  }

  return dbUser;
}

/**
 * Recalculate the complete repair total.
 *
 * Repair total =
 *   inventory parts total
 *   +
 *   service fees total
 *
 * Both repair_parts.unit_price and repair_services.unit_fee
 * are historical snapshots.
 */
async function recalculateRepairTotal(tx: any, repairId: number) {
  const [partTotal] = await tx
    .select({
      total: sql<string>`
        coalesce(
          sum(
            ${repairParts.quantity} * ${repairParts.unitPrice}
          ),
          0
        )
      `,
    })
    .from(repairParts)
    .where(eq(repairParts.repairId, repairId));

  const [serviceTotal] = await tx
    .select({
      total: sql<string>`
        coalesce(
          sum(
            ${repairServices.quantity} * ${repairServices.unitFee}
          ),
          0
        )
      `,
    })
    .from(repairServices)
    .where(eq(repairServices.repairId, repairId));

  const total =
    Number(partTotal?.total || 0) +
    Number(serviceTotal?.total || 0);

  await tx
    .update(repairs)
    .set({
      cost: total.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(repairs.id, repairId));

  return total;
}

/**
 * GET /api/repairs/:id/charges
 *
 * Returns both:
 * - service fees
 * - inventory parts
 *
 * for one repair.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await currentUser();

    const repairId = Number((await params).id);

    if (!Number.isInteger(repairId) || repairId <= 0) {
      return NextResponse.json(
        { error: "Invalid repair ID" },
        { status: 400 }
      );
    }

    const [repair] = await db
      .select({
        id: repairs.id,
      })
      .from(repairs)
      .where(eq(repairs.id, repairId));

    if (!repair) {
      return NextResponse.json(
        { error: "Repair not found" },
        { status: 404 }
      );
    }

    const parts = await db
      .select({
        id: repairParts.id,
        partId: repairParts.partId,
        partName: inventory.partName,
        partCode: inventory.partCode,
        quantity: repairParts.quantity,
        unitPrice: repairParts.unitPrice,
      })
      .from(repairParts)
      .leftJoin(
        inventory,
        eq(repairParts.partId, inventory.id)
      )
      .where(eq(repairParts.repairId, repairId));

    const serviceRows = await db
      .select({
        id: repairServices.id,
        serviceId: repairServices.serviceId,
        serviceName: repairServices.serviceName,
        quantity: repairServices.quantity,
        unitFee: repairServices.unitFee,
      })
      .from(repairServices)
      .where(eq(repairServices.repairId, repairId));

    return NextResponse.json({
      parts,
      services: serviceRows,
    });
  } catch (error: any) {
    const message =
      error?.message || "Failed to load repair charges";

    let status = 500;

    if (message === "Unauthorized") {
      status = 401;
    } else if (message === "User profile not found") {
      status = 404;
    }

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

/**
 * POST /api/repairs/:id/charges
 *
 * Add either:
 *
 * type = "service"
 * or
 * type = "part"
 *
 * Service:
 * - reads the current catalogue fee
 * - snapshots the service name and fee
 *
 * Part:
 * - reads the current inventory price
 * - checks stock
 * - decreases stock
 * - snapshots the part price
 *
 * Everything happens inside one transaction.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await currentUser();

    const repairId = Number((await params).id);

    if (!Number.isInteger(repairId) || repairId <= 0) {
      return NextResponse.json(
        { error: "Invalid repair ID" },
        { status: 400 }
      );
    }

    const data = await req.json();

    const type = data.type;

    const quantity = Number(data.quantity ?? 1);

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return NextResponse.json(
        {
          error:
            "Quantity must be a positive whole number",
        },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx: any) => {
      const [repair] = await tx
        .select({
          id: repairs.id,
        })
        .from(repairs)
        .where(eq(repairs.id, repairId));

      if (!repair) {
        throw new Error("Repair not found");
      }

      /**
       * ADD SERVICE
       */
      if (type === "service") {
        const serviceId = Number(data.serviceId);

        if (
          !Number.isInteger(serviceId) ||
          serviceId <= 0
        ) {
          throw new Error("Invalid service ID");
        }

        const [service] = await tx
          .select()
          .from(services)
          .where(
            and(
              eq(services.id, serviceId),
              eq(services.isActive, true)
            )
          );

        if (!service) {
          throw new Error(
            "Service not found or inactive"
          );
        }

        // Snapshot the catalogue values here.
        const [row] = await tx
          .insert(repairServices)
          .values({
            repairId,
            serviceId: service.id,
            serviceName: service.name,
            quantity,
            unitFee: service.fee,
          })
          .returning();

        const total =
          await recalculateRepairTotal(
            tx,
            repairId
          );

        return {
          type: "service",
          row,
          total,
        };
      }

      /**
       * ADD INVENTORY PART
       */
      if (type === "part") {
        const partId = Number(data.partId);

        if (
          !Number.isInteger(partId) ||
          partId <= 0
        ) {
          throw new Error("Invalid part ID");
        }

        const [part] = await tx
          .select()
          .from(inventory)
          .where(eq(inventory.id, partId));

        if (!part) {
          throw new Error("Part not found");
        }

        /**
         * Decrease stock only when enough stock exists.
         *
         * The quantity >= requested condition is evaluated
         * by the database, preventing stock from becoming
         * negative during concurrent requests.
         */
        const [updatedStock] = await tx
          .update(inventory)
          .set({
            quantity: sql`
              ${inventory.quantity} - ${quantity}
            `,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(inventory.id, partId),
              sql`
                ${inventory.quantity} >= ${quantity}
              `
            )
          )
          .returning();

        if (!updatedStock) {
          throw new Error(
            `Insufficient stock for ${part.partName}. Available: ${part.quantity}`
          );
        }

        /**
         * Snapshot the inventory price at the time
         * the part is used on the repair.
         */
        const [row] = await tx
          .insert(repairParts)
          .values({
            repairId,
            partId,
            quantity,
            unitPrice: part.unitPrice,
          })
          .returning();

        const total =
          await recalculateRepairTotal(
            tx,
            repairId
          );

        return {
          type: "part",
          row,
          total,
        };
      }

      throw new Error(
        "Type must be service or part"
      );
    });

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error: any) {
    const message =
      error?.message || "Failed to add repair charge";

    let status = 500;

    if (message === "Unauthorized") {
      status = 401;
    } else if (
      message === "User profile not found"
    ) {
      status = 404;
    } else if (
      message === "Repair not found" ||
      message === "Part not found" ||
      message ===
        "Service not found or inactive" ||
      message === "Invalid part ID" ||
      message === "Invalid service ID" ||
      message.startsWith("Insufficient stock")
    ) {
      status = 400;
    }

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

/**
 * DELETE /api/repairs/:id/charges
 *
 * Remove either a service or part from a repair.
 *
 * When a part is removed:
 * - the repair_part record is deleted
 * - the quantity is returned to inventory
 * - the repair total is recalculated
 *
 * When a service is removed:
 * - only the repair service charge is removed
 * - the repair total is recalculated
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await currentUser();

    const repairId = Number((await params).id);

    if (!Number.isInteger(repairId) || repairId <= 0) {
      return NextResponse.json(
        { error: "Invalid repair ID" },
        { status: 400 }
      );
    }

    const data = await req.json();

    const result = await db.transaction(async (tx: any) => {
      /**
       * REMOVE SERVICE
       */
      if (data.type === "service") {
        const serviceChargeId = Number(data.id);

        if (
          !Number.isInteger(serviceChargeId) ||
          serviceChargeId <= 0
        ) {
          throw new Error(
            "Invalid service charge ID"
          );
        }

        const [deleted] = await tx
          .delete(repairServices)
          .where(
            and(
              eq(
                repairServices.id,
                serviceChargeId
              ),
              eq(
                repairServices.repairId,
                repairId
              )
            )
          )
          .returning();

        if (!deleted) {
          throw new Error(
            "Service charge not found"
          );
        }

        const total =
          await recalculateRepairTotal(
            tx,
            repairId
          );

        return {
          deleted,
          total,
        };
      }

      /**
       * REMOVE PART
       */
      if (data.type === "part") {
        const repairPartId = Number(data.id);

        if (
          !Number.isInteger(repairPartId) ||
          repairPartId <= 0
        ) {
          throw new Error(
            "Invalid repair part ID"
          );
        }

        const [deleted] = await tx
          .delete(repairParts)
          .where(
            and(
              eq(
                repairParts.id,
                repairPartId
              ),
              eq(
                repairParts.repairId,
                repairId
              )
            )
          )
          .returning();

        if (!deleted) {
          throw new Error(
            "Repair part not found"
          );
        }

        /**
         * Return the removed quantity to inventory.
         */
        const [restored] = await tx
          .update(inventory)
          .set({
            quantity: sql`
              ${inventory.quantity} + ${deleted.quantity}
            `,
            updatedAt: new Date(),
          })
          .where(
            eq(
              inventory.id,
              deleted.partId
            )
          )
          .returning();

        if (!restored) {
          throw new Error(
            "Inventory part no longer exists"
          );
        }

        const total =
          await recalculateRepairTotal(
            tx,
            repairId
          );

        return {
          deleted,
          restored,
          total,
        };
      }

      throw new Error(
        "Type must be service or part"
      );
    });

    return NextResponse.json(result);
  } catch (error: any) {
    const message =
      error?.message ||
      "Failed to remove repair charge";

    let status = 500;

    if (message === "Unauthorized") {
      status = 401;
    } else if (
      message === "User profile not found"
    ) {
      status = 404;
    } else if (
      message === "Service charge not found" ||
      message === "Repair part not found"
    ) {
      status = 404;
    } else if (
      message === "Invalid service charge ID" ||
      message === "Invalid repair part ID" ||
      message ===
        "Inventory part no longer exists"
    ) {
      status = 400;
    }

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}