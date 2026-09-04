import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { services, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

async function requireAdmin() {
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

  if (dbUser.role !== "admin") {
    throw new Error("Admin access required");
  }

  return dbUser;
}

/**
 * PATCH /api/services/:id
 *
 * Admin can edit:
 * - name
 * - service code
 * - category
 * - description
 * - fee
 * - active/inactive status
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const id = Number((await params).id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid service ID" },
        { status: 400 }
      );
    }

    const data = await req.json();

    const update: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) {
      const name = String(data.name).trim();

      if (!name) {
        return NextResponse.json(
          { error: "Service name cannot be empty" },
          { status: 400 }
        );
      }

      update.name = name;
    }

    if (data.code !== undefined) {
      update.code =
        data.code === null || String(data.code).trim() === ""
          ? null
          : String(data.code).trim();
    }

    if (data.category !== undefined) {
      update.category =
        data.category === null || String(data.category).trim() === ""
          ? null
          : String(data.category).trim();
    }

    if (data.description !== undefined) {
      update.description =
        data.description === null || String(data.description).trim() === ""
          ? null
          : String(data.description).trim();
    }

    if (data.fee !== undefined) {
      const fee = Number(data.fee);

      if (!Number.isFinite(fee) || fee < 0) {
        return NextResponse.json(
          { error: "Service fee must be a valid non-negative number" },
          { status: 400 }
        );
      }

      update.fee = fee.toFixed(2);
    }

    if (data.isActive !== undefined) {
      update.isActive = Boolean(data.isActive);
    }

    const [item] = await db
      .update(services)
      .set(update)
      .where(eq(services.id, id))
      .returning();

    if (!item) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error: any) {
    const message = error?.message || "Failed to update service";

    let status = 500;

    if (message === "Unauthorized") {
      status = 401;
    } else if (message === "User profile not found") {
      status = 404;
    } else if (message === "Admin access required") {
      status = 403;
    }

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

/**
 * DELETE /api/services/:id
 *
 * We intentionally do NOT physically delete services.
 *
 * Instead, the service is marked inactive.
 *
 * This preserves the service catalogue history and allows
 * existing repair records to continue referencing their
 * original service.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const id = Number((await params).id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid service ID" },
        { status: 400 }
      );
    }

    const [item] = await db
      .update(services)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(services.id, id))
      .returning();

    if (!item) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error: any) {
    const message = error?.message || "Failed to deactivate service";

    let status = 500;

    if (message === "Unauthorized") {
      status = 401;
    } else if (message === "User profile not found") {
      status = 404;
    } else if (message === "Admin access required") {
      status = 403;
    }

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}