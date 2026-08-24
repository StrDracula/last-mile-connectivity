import { Role } from "@prisma/client";
import { handleRouteError, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { zoneAreaSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole([Role.ADMIN]);
    const { id } = await params;
    const payload = zoneAreaSchema.parse(await request.json());
    const area = await prisma.zoneArea.upsert({
      where: { areaKey: payload.areaKey },
      update: { zoneId: id },
      create: { zoneId: id, areaKey: payload.areaKey }
    });
    return ok({ area }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
