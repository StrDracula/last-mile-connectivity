import { Role } from "@prisma/client";
import { handleRouteError, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { codConfigSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireRole([Role.ADMIN]);
    const codConfigs = await prisma.codConfig.findMany({ orderBy: { orderType: "asc" } });
    return ok({ codConfigs });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireRole([Role.ADMIN]);
    const payload = codConfigSchema.parse(await request.json());
    const codConfig = await prisma.codConfig.upsert({
      where: { orderType: payload.orderType },
      update: { surchargeAmount: payload.surchargeAmount },
      create: payload
    });
    return ok({ codConfig });
  } catch (error) {
    return handleRouteError(error);
  }
}
