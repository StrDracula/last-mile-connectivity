import { Role } from "@prisma/client";
import { handleRouteError, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { zoneSchema } from "@/lib/validation";
import { z } from "zod";

const updateZoneSchema = zoneSchema.extend({ id: z.string() });

export async function GET() {
  try {
    await requireRole([Role.ADMIN]);
    const zones = await prisma.zone.findMany({
      orderBy: { name: "asc" },
      include: { areas: { orderBy: { areaKey: "asc" } } }
    });
    return ok({ zones });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([Role.ADMIN]);
    const payload = zoneSchema.parse(await request.json());
    const zone = await prisma.zone.create({ data: payload, include: { areas: true } });
    return ok({ zone }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireRole([Role.ADMIN]);
    const payload = updateZoneSchema.parse(await request.json());
    const zone = await prisma.zone.update({
      where: { id: payload.id },
      data: { name: payload.name },
      include: { areas: true }
    });
    return ok({ zone });
  } catch (error) {
    return handleRouteError(error);
  }
}
