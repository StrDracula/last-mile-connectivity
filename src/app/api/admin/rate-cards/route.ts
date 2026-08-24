import { Role } from "@prisma/client";
import { handleRouteError, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateCardSchema } from "@/lib/validation";
import { z } from "zod";

const updateRateCardSchema = rateCardSchema.extend({ id: z.string() });

export async function GET() {
  try {
    await requireRole([Role.ADMIN]);
    const rateCards = await prisma.rateCard.findMany({
      orderBy: [{ orderType: "asc" }, { zoneRelation: "asc" }, { effectiveFrom: "desc" }]
    });
    return ok({ rateCards });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([Role.ADMIN]);
    const payload = rateCardSchema.parse(await request.json());
    const rateCard = await prisma.rateCard.create({ data: payload });
    return ok({ rateCard }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireRole([Role.ADMIN]);
    const payload = updateRateCardSchema.parse(await request.json());
    const rateCard = await prisma.rateCard.update({
      where: { id: payload.id },
      data: {
        orderType: payload.orderType,
        zoneRelation: payload.zoneRelation,
        baseRate: payload.baseRate,
        ratePerKg: payload.ratePerKg,
        isActive: payload.isActive,
        effectiveFrom: payload.effectiveFrom
      }
    });
    return ok({ rateCard });
  } catch (error) {
    return handleRouteError(error);
  }
}
