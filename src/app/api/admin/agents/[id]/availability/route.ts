import { Role } from "@prisma/client";
import { handleRouteError, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { availabilitySchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole([Role.ADMIN]);
    const { id } = await params;
    const payload = availabilitySchema.parse(await request.json());
    const agent = await prisma.agent.update({
      where: { id },
      data: { availability: payload.availability },
      include: { user: true, currentZone: true }
    });
    return ok({ agent });
  } catch (error) {
    return handleRouteError(error);
  }
}
