import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { services, users } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

async function requireUser() {
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
 * GET /api/services
 *
 * Returns the complete service catalogue.
 *
 * Admin needs all services so inactive services can be managed.
 * Repair screens can filter the response to active services.
 */
export async function GET() {
  try {
    await requireUser();

    const items = await db
      .select()
      .from(services)
      .orderBy(desc(services.name));

    return NextResponse.json(items);
  } catch (error: any) {
    const message = error?.message || "Failed to load services";

    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 }
    );
  }
}

/**
 * POST /api/services
 *
 * Creates a new service in the service catalogue.
 * Only Admin users can create services.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const data = await req.json();

    const name = String(data.name || "").trim();
    const fee = Number(data.fee);

    if (!name) {
      return NextResponse.json(
        { error: "Service name is required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(fee) || fee < 0) {
      return NextResponse.json(
        { error: "A valid non-negative service fee is required" },
        { status: 400 }
      );
    }

    const code =
      data.code !== undefined && data.code !== null
        ? String(data.code).trim() || null
        : null;

    const category =
      data.category !== undefined && data.category !== null
        ? String(data.category).trim() || null
        : null;

    const description =
      data.description !== undefined && data.description !== null
        ? String(data.description).trim() || null
        : null;

    const [item] = await db
      .insert(services)
      .values({
        name,
        code,
        category,
        description,
        fee: fee.toFixed(2),
        isActive: data.isActive !== false,
      })
      .returning();

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    const message = error?.message || "Failed to create service";

    return NextResponse.json(
      { error: message },
      {
        status:
          message === "Unauthorized"
            ? 401
            : message === "User profile not found"
              ? 404
              : 500,
      }
    );
  }
}